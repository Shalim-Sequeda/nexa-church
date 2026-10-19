import { useSyncExternalStore } from 'react';
import {
  BIBLE_BOOKS,
  BibleBook,
  SUPPORTED_VERSIONS,
  BibleVersionInfo,
  AUTHENTIC_BIBLE_VERSES,
  getAuthenticVerseText,
  parseBibleReference,
  parseImportedBibleJson,
  parseBibleBiText,
  getVersionButtonLabels,
  getChapterVerseCount,
} from '../data/bibleData';
import { churchStore } from './churchStore';
import { presentationStore } from './presentationStore';
import { Scene } from '../types/church';
import {
  openFileDialog,
  readProjectFile,
  loadInstalledBiblesMetadata,
  loadBibleVerses,
  saveInstalledBible,
  importBibleFile,
  InstalledBibleData,
} from '../services/tauri';

export interface BibleState {
  currentVersion: BibleVersionInfo;
  customVersions: Record<string, { name: string; copyright: string; verses?: Record<string, string> }>;
  selectedBook: BibleBook;
  selectedChapter: number;
  selectedVerse: number;
  searchQuery: string;
  searchError: string | null;
  activeVerseText: string | null;
  backgroundImageUrl: string | null;
  isCustomVersion: boolean;
  isLoaded: boolean;
}

const STORAGE_KEY = 'nexa_custom_bible_versions_disk';
const BG_STORAGE_KEY = 'nexa_bible_background_image';

function loadStoredCustomVersionsLocal(): Record<string, { name: string; copyright: string; verses?: Record<string, string> }> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const map: Record<string, { name: string; copyright: string; verses?: Record<string, string> }> = {};
          parsed.forEach((b: InstalledBibleData) => {
            map[b.id] = { name: b.name, copyright: b.copyright, verses: b.verses };
          });
          return map;
        } else if (typeof parsed === 'object') {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not load custom bible versions from cache', e);
  }
  return {};
}

function loadStoredBibleBgLocal(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(BG_STORAGE_KEY);
    }
  } catch {}
  return null;
}

const defaultVersion = SUPPORTED_VERSIONS[0]; // RVA 1909 (Dominio Público)
const defaultBook = BIBLE_BOOKS.find((b) => b.name === 'Salmos') || BIBLE_BOOKS[0];

const storedCustom = loadStoredCustomVersionsLocal();
const storedBg = loadStoredBibleBgLocal();

const initialState: BibleState = {
  currentVersion: defaultVersion,
  customVersions: storedCustom,
  selectedBook: defaultBook,
  selectedChapter: 23,
  selectedVerse: 1,
  searchQuery: '',
  searchError: null,
  activeVerseText: AUTHENTIC_BIBLE_VERSES['Salmos 23:1'] || 'Jehová es mi pastor; nada me faltará.',
  backgroundImageUrl: storedBg,
  isCustomVersion: false,
  isLoaded: false,
};

let state: BibleState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: Partial<BibleState> | ((prev: BibleState) => Partial<BibleState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  notify();
}

export const bibleStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getAllVersions: () => {
    const versionsMap = new Map<string, {
      id: string;
      name: string;
      shortName: string;
      subLabel: string;
      isCustom: boolean;
    }>();

    // 1. Versiones instaladas en disco / AppData (customVersions)
    Object.entries(state.customVersions).forEach(([id, custom]) => {
      const { label, subLabel } = getVersionButtonLabels(id, custom.name);
      versionsMap.set(id, {
        id,
        name: custom.name,
        shortName: label,
        subLabel,
        isCustom: true,
      });
    });

    // 2. Versiones nativas de dominio público si no estuvieran ya en el map
    SUPPORTED_VERSIONS.forEach((v) => {
      if (!versionsMap.has(v.id)) {
        const { label, subLabel } = getVersionButtonLabels(v.id, v.name);
        versionsMap.set(v.id, {
          id: v.id,
          name: v.name,
          shortName: label,
          subLabel,
          isCustom: false,
        });
      }
    });

    // Ordenamiento jerárquico según el canon de la consola de producción:
    const rank = (id: string) => {
      const norm = id.toUpperCase();
      if (norm === 'RVR1960' || norm === 'RV1960') return 1;
      if (norm === 'RVR1909' || norm === 'RVA1909') return 2;
      if (norm === 'SEVA' || norm.includes('ANTIGUA')) return 3;
      if (norm === 'NTV') return 4;
      if (norm === 'NVI') return 5;
      if (norm === 'TLA') return 6;
      if (norm === 'LBLA') return 7;
      if (norm === 'NBLA') return 8;
      if (norm === 'RVC') return 9;
      if (norm === 'RVA2015' || norm === 'RVA') return 10;
      if (norm === 'DHH94I' || norm === 'BDHH') return 11;
      if (norm === 'DHHS94' || norm === 'DHH') return 12;
      if (norm === 'TLAI') return 13;
      if (norm === 'NVI_CAST' || norm === 'NVI-C' || norm === 'NVICAST') return 14;
      return 100;
    };

    return Array.from(versionsMap.values()).sort((a, b) => {
      const rA = rank(a.id);
      const rB = rank(b.id);
      if (rA !== rB) return rA - rB;
      return a.shortName.localeCompare(b.shortName);
    });
  },

  setVersion: async (versionId: string) => {
    let nextVersion: BibleVersionInfo;
    let isCustom = false;
    let customVerses: Record<string, string> | undefined = undefined;

    const builtin = SUPPORTED_VERSIONS.find((v) => v.id === versionId);
    if (builtin) {
      const { label } = getVersionButtonLabels(builtin.id, builtin.name);
      nextVersion = {
        ...builtin,
        shortName: label,
      };
      isCustom = false;
    } else if (state.customVersions[versionId]) {
      const custom = state.customVersions[versionId];
      const { label } = getVersionButtonLabels(versionId, custom.name);
      nextVersion = {
        id: versionId,
        name: custom.name,
        shortName: label,
        license: custom.copyright,
        isPublicDomain: false,
      };
      isCustom = true;
      customVerses = custom.verses;
    } else {
      return;
    }

    // 2. Mantener el libro seleccionado si existe en esa traducción
    let targetBook = state.selectedBook;
    if (!BIBLE_BOOKS.some((b) => b.id === targetBook.id)) {
      targetBook = BIBLE_BOOKS[0];
    }

    // 3. Mantener capítulo y versículo cuando sean válidos; validar y ajustar si exceden
    const maxChapters = targetBook.chapters;
    const targetChapter = Math.min(Math.max(1, state.selectedChapter), maxChapters);

    const maxVerses = getChapterVerseCount(targetBook.name, targetChapter, customVerses);
    const targetVerse = Math.min(Math.max(1, state.selectedVerse), maxVerses);

    // 5. Actualizar inmediatamente el texto mostrado
    const text = getAuthenticVerseText(targetBook.name, targetChapter, targetVerse, customVerses);

    setState({
      currentVersion: nextVersion,
      isCustomVersion: isCustom,
      selectedBook: targetBook,
      selectedChapter: targetChapter,
      selectedVerse: targetVerse,
      activeVerseText: text,
      searchError: null,
    });

    // 6. Actualizar la etiqueta de versión en la previsualización si contiene una escena bíblica activa
    const preview = presentationStore.getSnapshot().previewScene;
    if (preview && preview.type === 'bible' && preview.content.bible) {
      presentationStore.setPreviewScene({
        ...preview,
        content: {
          ...preview.content,
          bible: {
            ...preview.content.bible,
            version: nextVersion.shortName,
            text: text || preview.content.bible.text,
          },
        },
      });
    }

    // 7. Carga bajo demanda de versículos si es versión personalizada y aún no están en memoria
    if (isCustom && (!customVerses || Object.keys(customVerses).length === 0)) {
      try {
        const loadedVerses = await loadBibleVerses(versionId);
        if (loadedVerses && Object.keys(loadedVerses).length > 0) {
          setState((prev) => {
            const updatedCustomVersions = {
              ...prev.customVersions,
              [versionId]: {
                ...prev.customVersions[versionId],
                verses: loadedVerses,
              },
            };
            const isStillActive = prev.currentVersion.id === versionId;
            const updatedVerseText = isStillActive
              ? getAuthenticVerseText(prev.selectedBook.name, prev.selectedChapter, prev.selectedVerse, loadedVerses)
              : prev.activeVerseText;

            return {
              customVersions: updatedCustomVersions,
              ...(isStillActive ? { activeVerseText: updatedVerseText } : {}),
            };
          });

          // Si sigue activa en preview, refrescar preview con el texto auténtico cargado
          const currentPreview = presentationStore.getSnapshot().previewScene;
          if (
            currentPreview &&
            currentPreview.type === 'bible' &&
            currentPreview.content.bible &&
            state.currentVersion.id === versionId
          ) {
            const updatedVerseText = getAuthenticVerseText(
              state.selectedBook.name,
              state.selectedChapter,
              state.selectedVerse,
              loadedVerses
            );
            if (updatedVerseText) {
              presentationStore.setPreviewScene({
                ...currentPreview,
                content: {
                  ...currentPreview.content,
                  bible: {
                    ...currentPreview.content.bible,
                    text: updatedVerseText,
                  },
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error al cargar versículos bajo demanda para ${versionId}:`, err);
      }
    }
  },

  setBook: (bookId: string) => {
    const book = BIBLE_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    const customVerses = state.isCustomVersion
      ? state.customVersions[state.currentVersion.id]?.verses
      : undefined;

    // Ajustar capítulo si el libro actual tiene menos capítulos que el anterior
    const maxChapters = book.chapters;
    const targetChapter = Math.min(Math.max(1, state.selectedChapter), maxChapters);

    // Ajustar versículo a la capacidad real del nuevo capítulo
    const maxVerses = getChapterVerseCount(book.name, targetChapter, customVerses);
    const targetVerse = Math.min(Math.max(1, state.selectedVerse), maxVerses);

    const text = getAuthenticVerseText(book.name, targetChapter, targetVerse, customVerses);
    setState({
      selectedBook: book,
      selectedChapter: targetChapter,
      selectedVerse: targetVerse,
      activeVerseText: text,
      searchError: null,
    });
  },

  setChapter: (chapter: number) => {
    const maxChapters = state.selectedBook.chapters;
    const clampedChapter = Math.min(Math.max(1, chapter), maxChapters);

    const customVerses = state.isCustomVersion
      ? state.customVersions[state.currentVersion.id]?.verses
      : undefined;

    const maxVerses = getChapterVerseCount(state.selectedBook.name, clampedChapter, customVerses);
    const targetVerse = Math.min(Math.max(1, state.selectedVerse), maxVerses);

    const text = getAuthenticVerseText(state.selectedBook.name, clampedChapter, targetVerse, customVerses);
    setState({
      selectedChapter: clampedChapter,
      selectedVerse: targetVerse,
      activeVerseText: text,
      searchError: null,
    });
  },

  setVerse: (verse: number) => {
    const customVerses = state.isCustomVersion
      ? state.customVersions[state.currentVersion.id]?.verses
      : undefined;

    const maxVerses = getChapterVerseCount(state.selectedBook.name, state.selectedChapter, customVerses);

    if (verse < 1 || verse > maxVerses) {
      setState({
        searchError: `Este capítulo contiene ${maxVerses} versículos.`,
      });
      return;
    }

    const text = getAuthenticVerseText(state.selectedBook.name, state.selectedChapter, verse, customVerses);
    setState({
      selectedVerse: verse,
      activeVerseText: text,
      searchError: null,
    });
  },

  searchReference: (query: string) => {
    if (!query.trim()) {
      setState({ searchQuery: '', searchError: null });
      return;
    }

    const parsed = parseBibleReference(query);
    if (parsed) {
      const customVerses = state.isCustomVersion
        ? state.customVersions[state.currentVersion.id]?.verses
        : undefined;

      const text = getAuthenticVerseText(parsed.book.name, parsed.chapter, parsed.verse, customVerses);
      setState({
        selectedBook: parsed.book,
        selectedChapter: parsed.chapter,
        selectedVerse: parsed.verse,
        activeVerseText: text,
        searchQuery: query,
        searchError: text ? null : `El versículo ${parsed.book.name} ${parsed.chapter}:${parsed.verse} no está en la base local de Dominio Público. Puede importar la versión completa en JSON.`,
      });
      return;
    }

    // Búsqueda por coincidencia de texto dentro del dataset activo
    const cleanQuery = query.toLowerCase().trim();
    const customVerses = state.isCustomVersion ? state.customVersions[state.currentVersion.id]?.verses : undefined;
    const activeVerses = customVerses || AUTHENTIC_BIBLE_VERSES;

    const match = Object.entries(activeVerses).find(([, text]) =>
      text.toLowerCase().includes(cleanQuery)
    );

    if (match) {
      const [ref, text] = match;
      const parsedRef = parseBibleReference(ref);
      if (parsedRef) {
        setState({
          selectedBook: parsedRef.book,
          selectedChapter: parsedRef.chapter,
          selectedVerse: parsedRef.verse,
          activeVerseText: text,
          searchQuery: query,
          searchError: null,
        });
        return;
      }
    }

    setState({
      searchQuery: query,
      searchError: `No se encontró la referencia o texto "${query}". Pruebe con "Salmos 8:2", "Lucas 1:5", "Juan 3:16".`,
    });
  },

  init: async () => {
    try {
      const diskMetas = await loadInstalledBiblesMetadata();
      if (diskMetas && diskMetas.length > 0) {
        const map = { ...state.customVersions };
        diskMetas.forEach((b) => {
          map[b.id] = {
            name: b.name,
            copyright: b.copyright,
            verses: map[b.id]?.verses,
          };
        });
        setState({ customVersions: map, isLoaded: true });

        // Seleccionar automáticamente RVR1960 si está disponible
        const rvrKey = Object.keys(map).find(
          (k) => k === 'RVR1960' || map[k].name.toLowerCase().includes('valera') || map[k].name.includes('1960')
        ) || Object.keys(map)[0];

        if (rvrKey) {
          bibleStore.setVersion(rvrKey);
        }
      } else {
        setState({ isLoaded: true });
      }
    } catch (e) {
      console.warn('Error inicializando biblias desde disco:', e);
      setState({ isLoaded: true });
    }
  },

  /**
   * Importar un archivo .bi o .json de traducción bíblica
   */
  importBibleFile: async () => {
    const filePath = await openFileDialog([
      { name: 'Archivos de Biblia (.bi, .json)', extensions: ['bi', 'json'] },
    ]);
    if (!filePath) return;

    try {
      const result = await importBibleFile(filePath);
      if (result) {
        const updated = {
          ...state.customVersions,
          [result.id]: {
            name: result.name,
            copyright: result.copyright,
            verses: result.verses,
          },
        };
        setState({
          customVersions: updated,
          searchError: null,
        });
        bibleStore.setVersion(result.id);
        return;
      }
    } catch (e: any) {
      console.warn('Fallo importación nativa backend, intentando fallback frontend:', e);
      try {
        const content = await readProjectFile(filePath);
        if (filePath.toLowerCase().endsWith('.bi')) {
          const parsed = parseBibleBiText(content);
          const versionId = 'RVR1960';
          const bibleData: InstalledBibleData = {
            id: versionId,
            name: parsed.versionName,
            copyright: parsed.copyright,
            verses: parsed.verses,
          };
          await saveInstalledBible(bibleData);
          const updated = {
            ...state.customVersions,
            [versionId]: {
              name: parsed.versionName,
              copyright: parsed.copyright,
              verses: parsed.verses,
            },
          };
          setState({ customVersions: updated, searchError: null });
          bibleStore.setVersion(versionId);
        } else {
          await bibleStore.importBibleJsonString(content);
        }
      } catch (err: any) {
        console.error('Error importando archivo de biblia:', err);
        setState({
          searchError: err?.message || 'Error al procesar el archivo de Biblia (.bi o .json).',
        });
      }
    }
  },

  /**
   * Importar un archivo JSON local con traducción bíblica estructurada
   */
  importBibleJsonFile: async () => {
    await bibleStore.importBibleFile();
  },

  /**
   * Importar desde string JSON (usado por importador de archivo o pruebas)
   */
  importBibleJsonString: async (jsonContent: string) => {
    const parsed = parseImportedBibleJson(jsonContent);
    const safeNameId = parsed.id || parsed.versionName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'custom';
    const versionId = parsed.id || `bible-${safeNameId}-${Date.now()}`;

    const bibleData: InstalledBibleData = {
      id: versionId,
      name: parsed.versionName,
      copyright: parsed.copyright,
      verses: parsed.verses,
    };

    // 1. Guardar persistentemente en disco (AppData)
    await saveInstalledBible(bibleData);

    // 2. Actualizar estado
    const updated = {
      ...state.customVersions,
      [versionId]: {
        name: parsed.versionName,
        copyright: parsed.copyright,
        verses: parsed.verses,
      },
    };

    setState({
      customVersions: updated,
      searchError: null,
    });

    // 3. Seleccionar automáticamente la versión importada
    bibleStore.setVersion(versionId);
  },

  setBackgroundImage: (url: string | null) => {
    setState({ backgroundImageUrl: url });
    try {
      if (typeof localStorage !== 'undefined') {
        if (url) {
          localStorage.setItem(BG_STORAGE_KEY, url);
        } else {
          localStorage.removeItem(BG_STORAGE_KEY);
        }
      }
    } catch {}
  },

  selectBackgroundImage: async () => {
    const filePath = await openFileDialog([
      { name: 'Fondos y Videos (*.mp4, *.mov, *.webm, *.jpg, *.png, *.webp)', extensions: ['mp4', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp', 'gif'] },
      { name: 'Videos (*.mp4, *.mov, *.webm)', extensions: ['mp4', 'mov', 'webm', 'mkv'] },
      { name: 'Imágenes (*.jpg, *.png, *.webp, *.gif)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] },
    ]);
    if (filePath) {
      bibleStore.setBackgroundImage(filePath);
    }
  },

  clearBackgroundImage: () => {
    bibleStore.setBackgroundImage(null);
  },

  createBibleScene: (): Scene => {
    const { selectedBook, selectedChapter, selectedVerse, activeVerseText, currentVersion, backgroundImageUrl } = state;
    const reference = `${selectedBook.name} ${selectedChapter}:${selectedVerse}`;
    const displayText = activeVerseText || `${reference} (${currentVersion.shortName})`;

    return {
      id: `sc-bible-${Date.now()}`,
      title: `${reference}`,
      type: 'bible',
      order: 0,
      style: {
        fontSize: 46,
        textColor: '#FFFFFF',
        backgroundColor: backgroundImageUrl ? '#000000' : '#090A0E',
        backgroundImageUrl: backgroundImageUrl || undefined,
        textAlign: 'center',
        textShadow: true,
        fontWeight: 'bold',
        transition: 'fade',
      },
      content: {
        bible: {
          version: currentVersion.shortName,
          book: selectedBook.name,
          chapter: selectedChapter,
          verse: selectedVerse,
          reference,
          text: displayText,
        },
      },
    };
  },

  addToProject: () => {
    const scene = bibleStore.createBibleScene();
    if (scene) {
      churchStore.addScene(scene);
    }
  },

  sendToPreview: () => {
    const scene = bibleStore.createBibleScene();
    if (scene) {
      presentationStore.setPreviewScene(scene);
    }
  },

  presentNow: () => {
    const scene = bibleStore.createBibleScene();
    if (scene) {
      presentationStore.presentSceneDirectly(scene);
    }
  },

  nextVerseLive: (): boolean => {
    const live = presentationStore.getSnapshot().liveScene;
    const isBibleLive = live && live.type === 'bible' && live.content.bible;

    const preview = presentationStore.getSnapshot().previewScene;
    const isBiblePreview = preview && preview.type === 'bible' && preview.content.bible;

    if (!isBibleLive && !isBiblePreview) {
      return false;
    }

    const currentBookName = (isBibleLive ? live.content.bible?.book : preview?.content.bible?.book) || state.selectedBook.name;
    const currentChapter = (isBibleLive ? live.content.bible?.chapter : preview?.content.bible?.chapter) || state.selectedChapter;
    const currentVerse = (isBibleLive ? live.content.bible?.verse : preview?.content.bible?.verse) || state.selectedVerse;

    const book = BIBLE_BOOKS.find((b) => b.name === currentBookName) || state.selectedBook;
    const customVerses = state.isCustomVersion ? state.customVersions[state.currentVersion.id]?.verses : undefined;
    const maxVerses = getChapterVerseCount(book.name, currentChapter, customVerses);

    let nextChapter = currentChapter;
    let nextVerse = currentVerse + 1;

    if (nextVerse > maxVerses) {
      if (currentChapter < book.chapters) {
        nextChapter = currentChapter + 1;
        nextVerse = 1;
      } else {
        nextVerse = maxVerses;
      }
    }

    const text = getAuthenticVerseText(book.name, nextChapter, nextVerse, customVerses);
    setState({
      selectedBook: book,
      selectedChapter: nextChapter,
      selectedVerse: nextVerse,
      activeVerseText: text,
      searchError: null,
    });

    const newScene = bibleStore.createBibleScene();
    if (!newScene) return false;

    if (isBibleLive) {
      presentationStore.presentSceneDirectly(newScene);
      if (isBiblePreview) {
        presentationStore.setPreviewScene(newScene);
      }
    } else if (isBiblePreview) {
      presentationStore.setPreviewScene(newScene);
    }

    return true;
  },

  previousVerseLive: (): boolean => {
    const live = presentationStore.getSnapshot().liveScene;
    const isBibleLive = live && live.type === 'bible' && live.content.bible;

    const preview = presentationStore.getSnapshot().previewScene;
    const isBiblePreview = preview && preview.type === 'bible' && preview.content.bible;

    if (!isBibleLive && !isBiblePreview) {
      return false;
    }

    const currentBookName = (isBibleLive ? live.content.bible?.book : preview?.content.bible?.book) || state.selectedBook.name;
    const currentChapter = (isBibleLive ? live.content.bible?.chapter : preview?.content.bible?.chapter) || state.selectedChapter;
    const currentVerse = (isBibleLive ? live.content.bible?.verse : preview?.content.bible?.verse) || state.selectedVerse;

    const book = BIBLE_BOOKS.find((b) => b.name === currentBookName) || state.selectedBook;
    const customVerses = state.isCustomVersion ? state.customVersions[state.currentVersion.id]?.verses : undefined;

    let prevChapter = currentChapter;
    let prevVerse = currentVerse - 1;

    if (prevVerse < 1) {
      if (currentChapter > 1) {
        prevChapter = currentChapter - 1;
        prevVerse = getChapterVerseCount(book.name, prevChapter, customVerses);
      } else {
        prevVerse = 1;
      }
    }

    const text = getAuthenticVerseText(book.name, prevChapter, prevVerse, customVerses);
    setState({
      selectedBook: book,
      selectedChapter: prevChapter,
      selectedVerse: prevVerse,
      activeVerseText: text,
      searchError: null,
    });

    const newScene = bibleStore.createBibleScene();
    if (!newScene) return false;

    if (isBibleLive) {
      presentationStore.presentSceneDirectly(newScene);
      if (isBiblePreview) {
        presentationStore.setPreviewScene(newScene);
      }
    } else if (isBiblePreview) {
      presentationStore.setPreviewScene(newScene);
    }

    return true;
  },
};

export function useBible() {
  return useSyncExternalStore(bibleStore.subscribe, bibleStore.getSnapshot);
}