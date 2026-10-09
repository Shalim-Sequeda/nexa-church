import { useSyncExternalStore } from 'react';
import { Scene, DisplayInfo, PresentationSyncMessage, AudioTrackInfo } from '../types/church';
import {
  openPresentationWindow as tauriOpenPresentation,
  closePresentationWindow as tauriClosePresentation,
  getAvailableDisplays as tauriGetDisplays,
  loadChurchConfig,
  saveChurchConfig,
  updateBroadcastState,
} from '../services/tauri';
import { emitChurchMessage, listenChurchMessage } from '../services/events';

let getNextSceneFn: (() => Scene | null) | null = null;
export function registerNextSceneGetter(fn: () => Scene | null) {
  getNextSceneFn = fn;
}

export function syncBroadcast(live?: Scene | null, blackout?: boolean) {
  if (typeof window !== 'undefined' && window.location.search.includes('window=')) {
    return; // Ventanas esclavas secundarias jamás sobreescriben el estado del servidor
  }
  try {
    const next = getNextSceneFn ? getNextSceneFn() : null;
    const currentLive = live !== undefined ? live : state.liveScene;
    const currentBlackout = blackout !== undefined ? blackout : state.isBlackout;
    updateBroadcastState({
      is_blackout: currentBlackout,
      live_scene: currentLive,
      next_scene: next,
      lower_third_enabled: true,
    });
  } catch {}
}

export interface PresentationState {
  previewScene: Scene | null;
  liveScene: Scene | null;
  isBlackout: boolean;
  presentationWindowOpen: boolean;
  availableDisplays: DisplayInfo[];
  selectedDisplayId: number | null;
  transition: 'cut' | 'fade';
  mediaLoadId: number;
  // CANAL DE AUDIO INDEPENDIENTE
  backgroundAudio: AudioTrackInfo | null;
  currentAudioSource: 'none' | 'background' | 'video';
  mediaPlayback: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    speed: number;
    isMuted: boolean;
    activeMediaId: string | null;
  };
}

const initialState: PresentationState = {
  previewScene: null,
  liveScene: null,
  isBlackout: false,
  presentationWindowOpen: false,
  availableDisplays: [],
  selectedDisplayId: null,
  transition: 'cut',
  mediaLoadId: 1,
  backgroundAudio: null,
  currentAudioSource: 'none',
  mediaPlayback: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    speed: 1,
    isMuted: false,
    activeMediaId: null,
  },
};

let state: PresentationState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(updater: Partial<PresentationState> | ((prev: PresentationState) => Partial<PresentationState>)) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  notify();
}

let isInitialized = false;

export const presentationStore = {
  getSnapshot: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: async () => {
    if (typeof window !== 'undefined' && window.location.search.includes('window=')) {
      return; // Solo la ventana principal (main) inicializa listeners y emisión
    }
    if (isInitialized) return;
    isInitialized = true;

    // Load available displays
    const displays = await tauriGetDisplays();
    const config = await loadChurchConfig();

    let chosenDisplay = config.selected_display_id;
    if (chosenDisplay === null || chosenDisplay === undefined || !displays.some((d) => d.id === chosenDisplay)) {
      // Default to secondary display if available, else primary
      const secondary = displays.find((d) => !d.is_primary);
      chosenDisplay = secondary ? secondary.id : (displays[0]?.id ?? 0);
    }

    setState({
      availableDisplays: displays,
      selectedDisplayId: chosenDisplay,
    });

    // Listen for cross-window messages
    listenChurchMessage((msg: PresentationSyncMessage) => {
      if (msg.type === 'REQUEST_STATE') {
        emitChurchMessage({
          type: 'STATE_RESPONSE',
          scene: state.liveScene,
          isBlackout: state.isBlackout,
          mediaLoadId: state.mediaLoadId,
          backgroundAudio: state.backgroundAudio,
        });
      } else if (msg.type === 'MEDIA_STATE_UPDATE') {
        // Ignorar eventos obsoletos de un mediaLoadId anterior
        if (msg.mediaLoadId !== state.mediaLoadId) {
          return;
        }

        // Single source of truth: La ventana de presentación reporta la posición real del medio
        setState((prev) => ({
          mediaPlayback: {
            ...prev.mediaPlayback,
            currentTime: msg.currentTime,
            duration: msg.duration > 0 ? msg.duration : prev.mediaPlayback.duration,
            isPlaying: msg.isPlaying,
            volume: msg.volume,
            speed: msg.speed,
            isMuted: msg.isMuted,
            activeMediaId: msg.activeMediaId || prev.mediaPlayback.activeMediaId,
          },
        }));
      } else if (msg.type === 'MEDIA_ACTION') {
        if (msg.mediaLoadId && msg.mediaLoadId !== state.mediaLoadId) {
          return;
        }
        if (msg.action === 'play') {
          setState((prev) => ({ mediaPlayback: { ...prev.mediaPlayback, isPlaying: true } }));
        } else if (msg.action === 'pause') {
          setState((prev) => ({ mediaPlayback: { ...prev.mediaPlayback, isPlaying: false } }));
        } else if (msg.action === 'seek' && msg.time !== undefined) {
          setState((prev) => ({ mediaPlayback: { ...prev.mediaPlayback, currentTime: msg.time! } }));
        } else if (msg.action === 'speed' && msg.speed !== undefined) {
          setState((prev) => ({ mediaPlayback: { ...prev.mediaPlayback, speed: msg.speed! } }));
        }
      }
    });
  },

  /**
   * Cargar escena en PREVIEW.
   * REGLA CRÍTICA: Modificar PREVIEW JAMÁS modifica LIVE.
   */
  setPreviewScene: (scene: Scene | null) => {
    setState({ previewScene: scene });
  },

  /**
   * PRESENTAR: Ejecuta la transición atómica PREVIEW -> LIVE.
   * Regla de Canales:
   * - Si la nueva escena es VIDEO (MP4):
   *     1. Incrementa mediaLoadId para invalidar eventos anteriores.
   *     2. El audio propio del video toma el control del audio LIVE.
   *     3. El video arranca estrictamente en 00:00.
   * - Si la nueva escena es IMAGEN / BIBLIA / TEXTO / ANUNCIO / TÍTULO / BLACK:
   *     1. Si había un audio de fondo (MP3), CONTINÚA reproduciéndose sin reiniciarse.
   *     2. Si había un video en LIVE, se detiene y se libera.
   * - Si la nueva escena es SONG con audio propio:
   *     1. Toma el control como nuevo audio activo.
   */
  presentPreview: () => {
    const nextScene = state.previewScene;
    if (!nextScene) return;

    const isVideo = nextScene.type === 'video' || (nextScene.type === 'song' && nextScene.content.media?.mediaType === 'video');
    const isSongWithAudio = nextScene.type === 'song' && nextScene.content.media?.mediaType === 'audio';

    let nextAudioSource = state.currentAudioSource;
    let nextBackgroundAudio = state.backgroundAudio;
    let nextMediaId = state.mediaPlayback.activeMediaId;
    let nextIsPlaying = state.mediaPlayback.isPlaying;
    let nextCurrentTime = state.mediaPlayback.currentTime;
    let nextDuration = state.mediaPlayback.duration;

    // Generar nuevo mediaLoadId si el medio cambia
    let newLoadId = state.mediaLoadId;

    if (isVideo) {
      newLoadId = state.mediaLoadId + 1;
      nextAudioSource = 'video';
      nextBackgroundAudio = null; // Detener audio de fondo al entrar video
      nextMediaId = nextScene.content.media?.filePath || nextScene.content.song?.mediaPath || null;
      nextIsPlaying = true;
      nextCurrentTime = 0;
      nextDuration = nextScene.content.media?.duration || 0;
    } else if (isSongWithAudio) {
      newLoadId = state.mediaLoadId + 1;
      nextAudioSource = 'background';
      const path = nextScene.content.song?.mediaPath || nextScene.content.media?.filePath || '';
      nextBackgroundAudio = {
        filePath: path,
        fileName: nextScene.title,
        duration: nextScene.content.media?.duration,
      };
      nextMediaId = path;
      nextIsPlaying = true;
      nextCurrentTime = 0;
      nextDuration = nextScene.content.media?.duration || 0;
    } else {
      // Escena no-media (imagen, biblia, texto, anuncio, etc.)
      if (state.currentAudioSource === 'video') {
        // Detener video anterior
        newLoadId = state.mediaLoadId + 1;
        nextAudioSource = 'none';
        nextMediaId = null;
        nextIsPlaying = false;
        nextCurrentTime = 0;
        nextDuration = 0;
      } else if (state.currentAudioSource === 'background') {
        // Mantener MP3 de fondo sonando sin interrupciones
        nextAudioSource = 'background';
        // Conservar nextBackgroundAudio, nextMediaId, nextIsPlaying, nextCurrentTime, nextDuration
      } else {
        nextAudioSource = 'none';
        nextMediaId = null;
        nextIsPlaying = false;
      }
    }

    setState({
      liveScene: nextScene,
      isBlackout: false,
      mediaLoadId: newLoadId,
      currentAudioSource: nextAudioSource,
      backgroundAudio: nextBackgroundAudio,
      mediaPlayback: {
        ...state.mediaPlayback,
        isPlaying: nextIsPlaying,
        currentTime: nextCurrentTime,
        duration: nextDuration,
        activeMediaId: nextMediaId,
      },
    });

    // Sincronizar inmediatamente con la ventana de presentación
    emitChurchMessage({
      type: 'LIVE_UPDATE',
      scene: nextScene,
      isBlackout: false,
      transition: state.transition,
      timestamp: Date.now(),
      mediaLoadId: newLoadId,
      backgroundAudio: nextBackgroundAudio,
    });

    // Sincronizar con OBS Lower Thirds y Control Remoto
    syncBroadcast(nextScene, false);
  },

  /**
   * Presentar una escena directamente sin pasar por preview (atajo de operador)
   */
  presentSceneDirectly: (scene: Scene) => {
    setState({ previewScene: scene });
    presentationStore.presentPreview();
  },

  nextSongSlide: (): boolean => {
    const live = state.liveScene;
    if (live && live.type === 'song' && live.content?.song) {
      const s = live.content.song;
      if (s.slides && s.activeSlideIndex < s.slides.length - 1) {
        const nextIndex = s.activeSlideIndex + 1;
        const updatedScene: Scene = {
          ...live,
          content: {
            ...live.content,
            song: {
              ...s,
              activeSlideIndex: nextIndex,
            },
          },
        };
        presentationStore.presentSceneDirectly(updatedScene);
        return true;
      }
    }
    return false;
  },

  previousSongSlide: (): boolean => {
    const live = state.liveScene;
    if (live && live.type === 'song' && live.content?.song) {
      const s = live.content.song;
      if (s.slides && s.activeSlideIndex > 0) {
        const prevIndex = s.activeSlideIndex - 1;
        const updatedScene: Scene = {
          ...live,
          content: {
            ...live.content,
            song: {
              ...s,
              activeSlideIndex: prevIndex,
            },
          },
        };
        presentationStore.presentSceneDirectly(updatedScene);
        return true;
      }
    }
    return false;
  },

  /**
   * BOTÓN NEGRO / BLACK:
   * Activa/desactiva blackout total instantáneo en la salida sin cerrar el proyector
   * ni perder el estado LIVE.
   */
  toggleBlackout: () => {
    const newBlackout = !state.isBlackout;
    setState({ isBlackout: newBlackout });

    emitChurchMessage({
      type: 'LIVE_UPDATE',
      scene: state.liveScene,
      isBlackout: newBlackout,
      transition: 'cut',
      timestamp: Date.now(),
      mediaLoadId: state.mediaLoadId,
      backgroundAudio: state.backgroundAudio,
    });

    // Sincronizar con OBS Lower Thirds y Control Remoto
    syncBroadcast(state.liveScene, newBlackout);
  },

  setBlackout: (blackout: boolean) => {
    setState({ isBlackout: blackout });
    emitChurchMessage({
      type: 'LIVE_UPDATE',
      scene: state.liveScene,
      isBlackout: blackout,
      transition: 'cut',
      timestamp: Date.now(),
      mediaLoadId: state.mediaLoadId,
      backgroundAudio: state.backgroundAudio,
    });

    // Sincronizar con OBS Lower Thirds y Control Remoto
    syncBroadcast(state.liveScene, blackout);
  },

  /**
   * GESTIÓN DE SALIDA / SEGUNDA PANTALLA:
   * Garantiza una única ventana de presentación y abre en el monitor seleccionado.
   */
  openPresentation: async (displayId?: number, fullscreen?: boolean) => {
    const targetDisplay = displayId !== undefined ? displayId : (state.selectedDisplayId ?? undefined);
    setState({ presentationWindowOpen: true, selectedDisplayId: targetDisplay ?? null });

    await tauriOpenPresentation(targetDisplay, fullscreen ?? true);

    // Enviar el estado actual para que se pinte en cuanto abra
    setTimeout(() => {
      emitChurchMessage({
        type: 'LIVE_UPDATE',
        scene: state.liveScene,
        isBlackout: state.isBlackout,
        transition: state.transition,
        timestamp: Date.now(),
        mediaLoadId: state.mediaLoadId,
        backgroundAudio: state.backgroundAudio,
      });
    }, 300);

    // Guardar preferencia
    if (targetDisplay !== undefined) {
      saveChurchConfig({
        selected_display_id: targetDisplay,
        last_media_folder: null,
        last_project_path: null,
        default_bible_version: 'RVR1960',
        presentation_fullscreen: fullscreen ?? true,
      });
    }
  },

  closePresentation: async () => {
    setState({ presentationWindowOpen: false });
    await tauriClosePresentation();
  },

  setSelectedDisplay: (displayId: number) => {
    setState({ selectedDisplayId: displayId });
    saveChurchConfig({
      selected_display_id: displayId,
      last_media_folder: null,
      last_project_path: null,
      default_bible_version: 'RVR1960',
      presentation_fullscreen: true,
    });
  },

  refreshDisplays: async () => {
    const displays = await tauriGetDisplays();
    setState({ availableDisplays: displays });
  },

  // Controles multimedia en vivo
  togglePlayPauseMedia: () => {
    const newPlaying = !state.mediaPlayback.isPlaying;
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, isPlaying: newPlaying },
    }));

    emitChurchMessage({
      type: 'MEDIA_ACTION',
      action: newPlaying ? 'play' : 'pause',
      mediaLoadId: state.mediaLoadId,
      target: state.currentAudioSource === 'video' ? 'video' : 'audio',
    });
  },

  seekMedia: (seconds: number) => {
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, currentTime: seconds },
    }));

    emitChurchMessage({
      type: 'MEDIA_ACTION',
      action: 'seek',
      time: seconds,
      mediaLoadId: state.mediaLoadId,
      target: state.currentAudioSource === 'video' ? 'video' : 'audio',
    });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, volume: clamped, isMuted: clamped === 0 },
    }));

    emitChurchMessage({
      type: 'MEDIA_ACTION',
      action: 'volume',
      volume: clamped,
      isMuted: clamped === 0,
      mediaLoadId: state.mediaLoadId,
      target: state.currentAudioSource === 'video' ? 'video' : 'audio',
    });
  },

  setPlaybackSpeed: (speed: number) => {
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, speed },
    }));

    emitChurchMessage({
      type: 'MEDIA_ACTION',
      action: 'speed',
      speed,
      mediaLoadId: state.mediaLoadId,
      target: state.currentAudioSource === 'video' ? 'video' : 'audio',
    });
  },

  stopMedia: () => {
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, isPlaying: false, currentTime: 0 },
      currentAudioSource: 'none',
      backgroundAudio: null,
    }));

    emitChurchMessage({
      type: 'MEDIA_ACTION',
      action: 'stop',
      mediaLoadId: state.mediaLoadId,
      target: 'all',
    });
  },

  disposeAllMedia: () => {
    setState((prev) => ({
      mediaPlayback: { ...prev.mediaPlayback, isPlaying: false, currentTime: 0 },
      currentAudioSource: 'none',
      backgroundAudio: null,
    }));

    emitChurchMessage({
      type: 'DISPOSE_ALL_MEDIA',
    });
  },

  applyMediaStateFromPresentation: (payload: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    speed: number;
    isMuted: boolean;
    ended: boolean;
    activeMediaId?: string;
  }) => {
    setState((prev) => ({
      mediaPlayback: {
        ...prev.mediaPlayback,
        currentTime: payload.currentTime,
        duration: payload.duration > 0 ? payload.duration : prev.mediaPlayback.duration,
        isPlaying: payload.isPlaying,
        volume: payload.volume,
        speed: payload.speed,
        isMuted: payload.isMuted,
        activeMediaId: payload.activeMediaId || prev.mediaPlayback.activeMediaId,
      },
    }));
  },

  updateMediaProgress: (currentTime: number, duration?: number) => {
    const prev = state.mediaPlayback;
    if (Math.abs(prev.currentTime - currentTime) < 0.25 && prev.duration === (duration || prev.duration)) {
      return;
    }
    setState((prev) => ({
      mediaPlayback: {
        ...prev.mediaPlayback,
        currentTime,
        duration: duration && duration > 0 ? duration : prev.mediaPlayback.duration,
      },
    }));
  },

  setTransition: (transition: 'cut' | 'fade') => {
    setState({ transition });
  },

  openPresentationForTesting: () => {
    setState({ presentationWindowOpen: true });
  },

  resetForTesting: () => {
    setState({ ...initialState });
  },
};

export function usePresentation() {
  return useSyncExternalStore(presentationStore.subscribe, presentationStore.getSnapshot);
}