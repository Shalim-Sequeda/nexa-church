import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { DisplayInfo, ChurchSong } from '../types/church';

import type React from 'react';

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

interface MediaFilePayload {
  mime_type: string;
  base64_data: string;
}

// In-memory cache for Object URLs: filePath.toLowerCase() -> blobUrl
const blobUrlCache = new Map<string, string>();
const pendingLoads = new Map<string, Promise<string>>();

/**
 * Carga un archivo multimedia local mediante el comando nativo de Rust `read_media_file`,
 * lo convierte a un Blob en memoria y genera una URL de objeto segura `blob:`.
 * Cuenta con caché en memoria para evitar lecturas duplicadas y sobreconsumo de RAM.
 */
export async function loadMediaBlobUrl(filePath: string): Promise<string> {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmed = filePath.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Videos y audios siempre deben reproducirse mediante streaming nativo (convertFileSrc), nunca Base64 en memoria
  const isVideoOrAudio = /\.(mp4|mov|m4v|webm|mkv|avi|wmv|mpg|mpeg|ts|qt|mp3|wav|ogg|flac|m4a|aac)$/i.test(trimmed);
  if (isVideoOrAudio) {
    return resolveMediaUrl(trimmed);
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = blobUrlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = pendingLoads.get(cacheKey);
  if (pending) {
    return pending;
  }

  if (!isTauriEnvironment()) {
    return resolveMediaUrl(trimmed);
  }

  const loadPromise = (async () => {
    try {
      let bytes: Uint8Array | null = null;
      let mimeType = 'image/jpeg';

      try {
        const raw = await invoke<number[] | Uint8Array>('read_file_binary', {
          filePath: trimmed,
        });
        bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
        const ext = trimmed.split('.').pop()?.toLowerCase();
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'svg') mimeType = 'image/svg+xml';
        else if (ext === 'pdf') mimeType = 'application/pdf';
      } catch {
        const payload = await invoke<MediaFilePayload>('read_media_file', {
          filePath: trimmed,
        });

        if (payload && payload.base64_data) {
          const binaryString = atob(payload.base64_data);
          const len = binaryString.length;
          bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          mimeType = payload.mime_type || mimeType;
        }
      }

      if (!bytes || bytes.length === 0) {
        return resolveMediaUrl(trimmed);
      }

      const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(cacheKey, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn(`[NEXA Native] Fallback para ${trimmed}:`, err);
      return resolveMediaUrl(trimmed);
    } finally {
      pendingLoads.delete(cacheKey);
    }
  })();

  pendingLoads.set(cacheKey, loadPromise);
  return loadPromise;
}

/**
 * Limpia y revoca todas las URLs de objeto blob activas para liberar memoria.
 */
export function clearMediaBlobCache(): void {
  for (const url of blobUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignorar errores en revocación
    }
  }
  blobUrlCache.clear();
}

/**
 * Resuelve una ruta del sistema de archivos local a una URL válida para WebView/Tauri.
 * Soporta de manera transparente:
 * - Caché de blob URLs en memoria si ya fue leído
 * - Rutas completas de Windows (C:\... o C:/...)
 * - Protocolo de assets de Tauri (convertFileSrc)
 * - URLs web/blob/data existentes
 */
export function resolveMediaUrl(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmed = filePath.trim();
  if (!trimmed) return '';

  // 1. Si ya es una URL web, blob, data URL o recurso relativo a la app (/backgrounds/...), no requiere transformación
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('asset://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // 2. Si ya está en la caché de blobs en memoria, retornar la blob URL de inmediato
  const cached = blobUrlCache.get(trimmed.toLowerCase());
  if (cached) {
    return cached;
  }

  const normalized = trimmed.replace(/\\/g, '/');

  // 3. Si estamos en el entorno Tauri nativo, invocar convertFileSrc
  if (isTauriEnvironment()) {
    try {
      return convertFileSrc(normalized);
    } catch {
      try {
        return convertFileSrc(trimmed);
      } catch {
        return `http://asset.localhost/${encodeURIComponent(trimmed)}`;
      }
    }
  }

  // 4. Entorno de prueba o navegador web estándar
  return normalized;
}

/**
 * Controlador de error para elementos <img> locales.
 * Si la carga mediante el protocolo de assets falla en WebView2,
 * acude automáticamente a la capa nativa Rust para leer el archivo binario
 * y reemplazar la fuente por un Object URL válido.
 */
export async function handleMediaImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  filePath?: string
): Promise<void> {
  const img = e.currentTarget;
  if (!filePath || img.dataset.fallbackApplied === 'true') {
    img.style.display = 'none';
    return;
  }
  img.dataset.fallbackApplied = 'true';
  try {
    const blobUrl = await loadMediaBlobUrl(filePath);
    if (blobUrl && blobUrl !== img.src) {
      img.src = blobUrl;
      img.style.display = '';
      return;
    }
  } catch (err) {
    console.error('[NEXA Image Error] No se pudo recuperar imagen mediante fallback nativo:', err);
  }
  img.style.display = 'none';
}

/**
 * Hook de React para resolver y cargar transparentemente recursos multimedia locales
 * con soporte para URLs de streaming nativas sin sobrecargar la memoria al inicio.
 */
export function useMediaSrc(filePath?: string): string {
  return filePath ? resolveMediaUrl(filePath) : '';
}

/**
 * Alias retrocompatible con el código existente
 */
export const getAssetUrl = resolveMediaUrl;


export async function getAvailableDisplays(): Promise<DisplayInfo[]> {
  if (!isTauriEnvironment()) {
    return [
      { id: 0, name: 'Pantalla Principal (1920x1080)', is_primary: true, x: 0, y: 0, width: 1920, height: 1080, scale_factor: 1 },
      { id: 1, name: 'Proyector Secundario (1920x1080)', is_primary: false, x: 1920, y: 0, width: 1920, height: 1080, scale_factor: 1 },
    ];
  }
  try {
    return await invoke<DisplayInfo[]>('get_available_displays');
  } catch (err) {
    console.error('Error al obtener pantallas:', err);
    return [];
  }
}

export async function openPresentationWindow(displayId?: number, fullscreen?: boolean): Promise<void> {
  if (!isTauriEnvironment()) {
    console.log('[Web Mock] Abrir ventana de presentación en pantalla', displayId, 'fullscreen:', fullscreen);
    window.open('?window=presentation', 'NEXA_Presentation', 'width=1280,height=720');
    return;
  }
  try {
    await invoke('open_presentation_window', { displayId, fullscreen });
  } catch (err) {
    console.error('Error al abrir ventana de presentación:', err);
  }
}

export async function closePresentationWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    await invoke('close_presentation_window');
  } catch (err) {
    console.error('Error al cerrar ventana de presentación:', err);
  }
}

export async function openStageWindow(displayId?: number, fullscreen?: boolean): Promise<void> {
  if (!isTauriEnvironment()) {
    console.log('[Web Mock] Abrir ventana de stage display en pantalla', displayId);
    window.open('?window=stage', 'NEXA_StageDisplay', 'width=1280,height=720');
    return;
  }
  try {
    await invoke('open_stage_window', { displayId, fullscreen });
  } catch (err) {
    console.error('Error al abrir ventana de escenario (Rust invoke):', err);
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      let win = await WebviewWindow.getByLabel('stage');
      if (!win) {
        win = new WebviewWindow('stage', {
          url: 'index.html?window=stage',
          title: 'NEXA Church — Stage Display (Retorno de Escenario)',
          width: 1280,
          height: 720,
        });
      }
      await win.show();
      await win.setFocus();
    } catch (e2) {
      console.warn('Fallback WebviewWindow stage:', e2);
    }
  }
}

export async function closeStageWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    await invoke('close_stage_window');
  } catch (err) {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const win = await WebviewWindow.getByLabel('stage');
      if (win) await win.hide();
    } catch {}
  }
}

export async function togglePresentationFullscreen(): Promise<boolean> {
  if (!isTauriEnvironment()) return false;
  try {
    return await invoke<boolean>('toggle_presentation_fullscreen');
  } catch (err) {
    console.error('Error al alternar pantalla completa:', err);
    return false;
  }
}

export interface ChurchMediaFile {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  media_type: 'audio' | 'video' | 'image' | 'pdf';
  duration?: number;
}

export async function scanChurchMedia(folderPath: string): Promise<ChurchMediaFile[]> {
  if (!isTauriEnvironment()) return [];
  try {
    return await invoke<ChurchMediaFile[]>('scan_church_media', { folderPath });
  } catch (err) {
    console.error('Error al escanear medios:', err);
    return [];
  }
}

export async function openFolderDialog(): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Seleccionar Carpeta Multimedia para el Culto',
    });
    return typeof selected === 'string' ? selected : null;
  } catch (err) {
    console.error('Error al seleccionar carpeta:', err);
    return null;
  }
}

export async function openFileDialog(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    const selected = await open({
      directory: false,
      multiple: false,
      filters,
      title: 'Seleccionar Archivo Multimedia o Proyecto',
    });
    return typeof selected === 'string' ? selected : null;
  } catch (err) {
    console.error('Error al seleccionar archivo:', err);
    return null;
  }
}

export async function saveFileDialog(defaultName?: string): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    const selected = await save({
      defaultPath: defaultName || 'culto_domingo.nexachurch',
      filters: [{ name: 'Proyecto NEXA Church (*.nexachurch, *.json)', extensions: ['nexachurch', 'json'] }],
    });
    return typeof selected === 'string' ? selected : null;
  } catch (err) {
    console.error('Error al guardar archivo:', err);
    return null;
  }
}

export async function readProjectFile(filePath: string): Promise<string> {
  if (!isTauriEnvironment()) {
    const saved = localStorage.getItem(`church_project_${filePath}`);
    return saved || '';
  }
  return await invoke<string>('read_project_file', { filePath });
}

export async function writeProjectFile(filePath: string, content: string): Promise<void> {
  if (!isTauriEnvironment()) {
    localStorage.setItem(`church_project_${filePath}`, content);
    return;
  }
  await invoke('write_project_file', { filePath, content });
}

export interface ChurchConfigData {
  selected_display_id: number | null;
  last_media_folder: string | null;
  last_project_path: string | null;
  default_bible_version: string | null;
  presentation_fullscreen: boolean | null;
}

export async function loadChurchConfig(): Promise<ChurchConfigData> {
  if (!isTauriEnvironment()) {
    return {
      selected_display_id: 1,
      last_media_folder: null,
      last_project_path: null,
      default_bible_version: 'RVR1960',
      presentation_fullscreen: true,
    };
  }
  try {
    return await invoke<ChurchConfigData>('load_church_config');
  } catch {
    return {
      selected_display_id: null,
      last_media_folder: null,
      last_project_path: null,
      default_bible_version: 'RVR1960',
      presentation_fullscreen: true,
    };
  }
}

export async function saveChurchConfig(config: ChurchConfigData): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    await invoke('save_church_config', { config });
  } catch (err) {
    console.error('Error al guardar configuración:', err);
  }
}

export interface InstalledBibleData {
  id: string;
  name: string;
  copyright: string;
  verses: Record<string, string>;
}

// Memoria fallback para tests y entornos headless sin localStorage
const inMemoryDiskStore: Record<string, string> = {};

function getFallbackItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {}
  }
  return inMemoryDiskStore[key] || null;
}

function setFallbackItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {}
  }
  inMemoryDiskStore[key] = value;
}

export async function loadInstalledBibles(): Promise<InstalledBibleData[]> {
  if (!isTauriEnvironment()) {
    try {
      const raw = getFallbackItem('nexa_custom_bible_versions_disk');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }
  try {
    return await invoke<InstalledBibleData[]>('load_installed_bibles');
  } catch (err) {
    console.error('Error cargando biblias instaladas:', err);
    return [];
  }
}

export interface InstalledBibleMeta {
  id: string;
  name: string;
  copyright: string;
}

export async function loadInstalledBiblesMetadata(): Promise<InstalledBibleMeta[]> {
  if (!isTauriEnvironment()) {
    try {
      const raw = getFallbackItem('nexa_custom_bible_versions_disk');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((b: any) => ({ id: b.id, name: b.name, copyright: b.copyright }));
        }
      }
    } catch {}
    return [];
  }
  try {
    return await invoke<InstalledBibleMeta[]>('load_installed_bibles_metadata');
  } catch (err) {
    console.error('Error cargando metadatos de biblias:', err);
    return [];
  }
}

export async function loadBibleVerses(bibleId: string): Promise<Record<string, string>> {
  if (!isTauriEnvironment()) {
    try {
      const raw = getFallbackItem('nexa_custom_bible_versions_disk');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find((b: any) => b.id === bibleId);
          if (match && match.verses) return match.verses;
        }
      }
    } catch {}
    return {};
  }
  try {
    return await invoke<Record<string, string>>('load_bible_verses', { bibleId });
  } catch (err) {
    console.error(`Error cargando versículos de ${bibleId}:`, err);
    return {};
  }
}

export async function saveInstalledBible(bible: InstalledBibleData): Promise<void> {
  if (!isTauriEnvironment()) {
    try {
      const existingRaw = getFallbackItem('nexa_custom_bible_versions_disk');
      const existing: InstalledBibleData[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = existing.filter((b) => b.id !== bible.id);
      filtered.push(bible);
      setFallbackItem('nexa_custom_bible_versions_disk', JSON.stringify(filtered));
    } catch {}
    return;
  }
  try {
    await invoke('save_installed_bible', { bible });
  } catch (err) {
    console.error('Error guardando biblia instalada:', err);
  }
}

export async function importBibleFile(filePath: string): Promise<InstalledBibleData> {
  if (!isTauriEnvironment()) {
    throw new Error('La importación nativa requiere el entorno Tauri');
  }
  try {
    return await invoke<InstalledBibleData>('import_bible_file', { filePath });
  } catch (err: any) {
    console.error('Error en import_bible_file:', err);
    throw new Error(typeof err === 'string' ? err : err?.message || 'Error al importar archivo de Biblia');
  }
}

export async function checkFileAccessible(filePath: string): Promise<boolean> {
  if (!isTauriEnvironment()) return true;
  try {
    return await invoke<boolean>('check_file_accessible', { filePath });
  } catch {
    return false;
  }
}

export interface SavedAnnouncementData {
  id: string;
  name: string;
  background?: any;
  layers: any[];
  created_at?: string;
  updated_at?: string;
}

export async function loadSavedAnnouncements(): Promise<SavedAnnouncementData[]> {
  if (!isTauriEnvironment()) {
    try {
      const raw = getFallbackItem('nexa_saved_announcements_disk');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }
  try {
    return await invoke<SavedAnnouncementData[]>('load_saved_announcements');
  } catch (err) {
    console.error('Error cargando anuncios guardados:', err);
    return [];
  }
}

export async function saveAnnouncement(announcement: SavedAnnouncementData): Promise<void> {
  if (!isTauriEnvironment()) {
    try {
      const existingRaw = getFallbackItem('nexa_saved_announcements_disk');
      const list: SavedAnnouncementData[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = list.filter((a) => a.id !== announcement.id);
      filtered.push(announcement);
      setFallbackItem('nexa_saved_announcements_disk', JSON.stringify(filtered));
    } catch {}
    return;
  }
  try {
    await invoke('save_announcement', { announcement });
  } catch (err) {
    console.error('Error guardando anuncio:', err);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isTauriEnvironment()) {
    try {
      const existingRaw = getFallbackItem('nexa_saved_announcements_disk');
      const list: SavedAnnouncementData[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = list.filter((a) => a.id !== id);
      setFallbackItem('nexa_saved_announcements_disk', JSON.stringify(filtered));
    } catch {}
    return;
  }
  try {
    await invoke('delete_announcement', { id });
  } catch (err) {
    console.error('Error eliminando anuncio:', err);
  }
}

/**
 * Carga todas las canciones guardadas en el directorio de canciones en AppData.
 */
export async function loadSavedSongs(): Promise<ChurchSong[]> {
  if (!isTauriEnvironment()) {
    try {
      const raw = getFallbackItem('nexa_saved_songs_disk');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  try {
    return await invoke<ChurchSong[]>('load_saved_songs');
  } catch (err) {
    console.error('Error cargando canciones:', err);
    return [];
  }
}

/**
 * Guarda una canción en disco como archivo JSON en el directorio de canciones.
 */
export async function saveSong(song: ChurchSong): Promise<void> {
  if (!isTauriEnvironment()) {
    try {
      const existingRaw = getFallbackItem('nexa_saved_songs_disk');
      const list: ChurchSong[] = existingRaw ? JSON.parse(existingRaw) : [];
      const index = list.findIndex((s) => s.id === song.id);
      if (index >= 0) {
        list[index] = song;
      } else {
        list.push(song);
      }
      setFallbackItem('nexa_saved_songs_disk', JSON.stringify(list));
    } catch {}
    return;
  }
  try {
    await invoke('save_song', { song });
  } catch (err) {
    console.error('Error guardando canción:', err);
  }
}

/**
 * Elimina una canción del disco.
 */
export async function deleteSong(id: string): Promise<void> {
  if (!isTauriEnvironment()) {
    try {
      const existingRaw = getFallbackItem('nexa_saved_songs_disk');
      const list: ChurchSong[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = list.filter((s) => s.id !== id);
      setFallbackItem('nexa_saved_songs_disk', JSON.stringify(filtered));
    } catch {}
    return;
  }
  try {
    await invoke('delete_song', { id });
  } catch (err) {
    console.error('Error eliminando canción:', err);
  }
}

/**
 * Guarda una página renderizada de un documento PDF como imagen local en disco.
 */
export async function savePdfPageImage(
  subfolder: string,
  pageNumber: number,
  base64Data: string
): Promise<string> {
  if (!isTauriEnvironment()) {
    return base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  }
  return await invoke<string>('save_pdf_page_image', {
    subfolder,
    pageNumber,
    base64Data,
  });
}

/**
 * Lee un archivo multimedia o documento local y retorna sus bytes binarios (Uint8Array).
 */
export async function readMediaBinary(filePath: string): Promise<Uint8Array> {
  const trimmed = filePath.trim();
  if (!isTauriEnvironment()) {
    const content = await readProjectFile(trimmed);
    const enc = new TextEncoder();
    return enc.encode(content);
  }

  // 1. Intento directo de alta velocidad con bytes binarios (sin overhead ni límites de Base64)
  try {
    const raw = await invoke<number[] | Uint8Array>('read_file_binary', {
      filePath: trimmed,
    });
    if (raw instanceof Uint8Array) return raw;
    return new Uint8Array(raw);
  } catch {
    // 2. Fallback a read_media_file
    const payload = await invoke<MediaFilePayload>('read_media_file', {
      filePath: trimmed,
    });

    if (!payload || !payload.base64_data) {
      throw new Error(`Archivo no encontrado o vacío: ${trimmed}`);
    }

    const binaryString = atob(payload.base64_data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Cierra completamente la aplicación de manera segura y limpia.
 */
export async function exitApp(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      await invoke('exit_app');
      return;
    } catch (e) {
      console.warn('Falló invoke exit_app, intentando destroy:', e);
    }
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().destroy();
      return;
    } catch (e) {
      console.error('Error destruyendo ventana:', e);
    }
  } else {
    window.close();
  }
}

export interface BroadcastServerInfo {
  is_running: boolean;
  port: number;
  local_ip: string;
  url_lower_third: string;
  url_remote: string;
}

export async function getBroadcastServerInfo(): Promise<BroadcastServerInfo> {
  if (!isTauriEnvironment()) {
    return {
      is_running: true,
      port: 5210,
      local_ip: '192.168.1.100',
      url_lower_third: 'http://localhost:5210/lower-third',
      url_remote: 'http://192.168.1.100:5210/remote',
    };
  }
  try {
    return await invoke<BroadcastServerInfo>('get_broadcast_server_info');
  } catch (err) {
    console.error('Error obteniendo información de broadcast:', err);
    return {
      is_running: false,
      port: 5210,
      local_ip: '127.0.0.1',
      url_lower_third: 'http://localhost:5210/lower-third',
      url_remote: 'http://127.0.0.1:5210/remote',
    };
  }
}

export async function updateBroadcastState(payload: {
  is_blackout: boolean;
  live_scene: any | null;
  next_scene: any | null;
  lower_third_enabled: boolean;
}): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    await invoke('update_broadcast_state', { payload });
  } catch (err) {
    console.error('Error actualizando estado de transmisión:', err);
  }
}