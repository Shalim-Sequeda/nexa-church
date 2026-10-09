import { useSyncExternalStore } from 'react';
import { ChurchMediaFile, openFolderDialog, openFileDialog, scanChurchMedia } from '../services/tauri';
import { Scene } from '../types/church';
import { churchStore } from './churchStore';
import { presentationStore } from './presentationStore';

export interface MediaLibraryState {
  currentFolder: string | null;
  items: ChurchMediaFile[];
  filterType: 'all' | 'video' | 'audio' | 'image' | 'gif' | 'pdf';
  searchQuery: string;
  isScanning: boolean;
}


const initialState: MediaLibraryState = {
  currentFolder: null,
  items: [],
  filterType: 'all',
  searchQuery: '',
  isScanning: false,
};

let state: MediaLibraryState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: Partial<MediaLibraryState> | ((prev: MediaLibraryState) => Partial<MediaLibraryState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  notify();
}

export const mediaStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  selectFolder: async () => {
    const folder = await openFolderDialog();
    if (!folder) return;

    setState({ isScanning: true, currentFolder: folder });
    try {
      const scanned = await scanChurchMedia(folder);
      setState({
        items: scanned,
        isScanning: false,
      });
    } catch (e) {
      console.error('Error escaneando medios:', e);
      setState({ isScanning: false });
    }
  },

  /**
   * Permite seleccionar e importar un archivo multimedia individual (GIF, video, imagen, audio, PDF)
   * desde cualquier carpeta o unidad USB directamente al Rack Multimedia.
   */
  addSingleMediaFile: async () => {
    const filePath = await openFileDialog([
      { name: 'Multimedia (Videos, GIFs en bucle, Imágenes, Audio)', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'wmv', 'mpg', 'mpeg', 'ts', 'gif', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'mp3', 'wav', 'pdf'] },
      { name: 'Videos (*.mp4, *.mov, *.webm, *.mkv, *.m4v, *.avi)', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'wmv', 'mpg', 'mpeg', 'ts'] },
      { name: 'GIFs y Animaciones en bucle (*.gif)', extensions: ['gif'] },
      { name: 'Imágenes (*.png, *.jpg, *.gif, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] },
      { name: 'Audio (*.mp3, *.wav, *.m4a)', extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'] },
    ]);
    if (!filePath) return null;

    const fileName = filePath.split(/[\\/]/).pop() || 'Archivo Multimedia';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isVideo = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'wmv', 'mpg', 'mpeg', 'ts', 'qt'].includes(ext);
    const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext);
    const isPdf = ext === 'pdf';
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext);

    const mediaType: 'video' | 'audio' | 'image' | 'pdf' = isVideo ? 'video' : isAudio ? 'audio' : isPdf ? 'pdf' : isImage ? 'image' : 'video';

    const newFile: ChurchMediaFile = {
      id: filePath.replace(/\\/g, '/').toLowerCase(),
      name: fileName,
      path: filePath,
      extension: ext,
      size: 0,
      media_type: mediaType,
    };

    setState((prev) => {
      const exists = prev.items.some((i) => i.id === newFile.id);
      if (exists) return prev;
      return {
        ...prev,
        items: [newFile, ...prev.items],
      };
    });

    return newFile;
  },

  setFilterType: (filter: 'all' | 'video' | 'audio' | 'image' | 'gif' | 'pdf') => {
    setState({ filterType: filter });
  },

  setSearchQuery: (query: string) => {
    setState({ searchQuery: query });
  },

  createMediaScene: (file: ChurchMediaFile): Scene => {
    const ext = file.extension.toLowerCase();
    const isGif = ext === 'gif';
    const isVideo = file.media_type === 'video' || ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'wmv', 'mpg', 'mpeg', 'ts', 'qt'].includes(ext);
    const isImage = file.media_type === 'image' || isGif;
    // Los GIFs son siempre gráficos visuales en bucle continuo, nunca canciones
    const isSong = !isGif && (file.name.toLowerCase().includes('cancion') || file.name.toLowerCase().includes('fidelidad') || file.name.toLowerCase().includes('adoracion') || file.media_type === 'audio');

    let sceneType: 'video' | 'image' | 'song' = isVideo ? 'video' : isImage ? 'image' : 'song';
    if (isSong && isVideo) {
      sceneType = 'song';
    }

    return {
      id: `sc-media-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: sceneType,
      order: 0,
      style: {
        backgroundColor: '#000000',
        aspectRatio: '16:9',
        transition: 'cut',
      },
      content: {
        media: {
          filePath: file.path,
          fileName: file.name,
          mediaType: file.media_type === 'pdf' ? 'image' : (isGif ? 'image' : file.media_type),
          duration: file.duration,
          loop: isGif || isVideo, // GIF o video de fondo se reproducen en bucle sin fin
        },
        song: sceneType === 'song' ? {
          title: file.name.replace(/\.[^/.]+$/, ''),
          slides: [file.name.replace(/\.[^/.]+$/, '')],
          activeSlideIndex: 0,
          mediaPath: file.path,
        } : undefined,
      },
    };
  },

  addMediaToProject: (file: ChurchMediaFile) => {
    const scene = mediaStore.createMediaScene(file);
    churchStore.addScene(scene);
  },

  sendMediaToPreview: (file: ChurchMediaFile) => {
    const scene = mediaStore.createMediaScene(file);
    presentationStore.setPreviewScene(scene);
  },

  presentMediaDirectly: (file: ChurchMediaFile) => {
    const scene = mediaStore.createMediaScene(file);
    presentationStore.presentSceneDirectly(scene);
  },
};

export function useMediaLibrary() {
  return useSyncExternalStore(mediaStore.subscribe, mediaStore.getSnapshot);
}