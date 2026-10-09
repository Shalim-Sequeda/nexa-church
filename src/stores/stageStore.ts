import { useSyncExternalStore } from 'react';
import { emitChurchMessage, listenChurchMessage } from '../services/events';
import { openStageWindow, closeStageWindow } from '../services/tauri';

export interface StageTimerState {
  enabled: boolean;
  mode: 'countdown' | 'countup';
  initialMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  label: string;
}

export interface StageState {
  stageWindowOpen: boolean;
  clockEnabled: boolean;
  timer: StageTimerState;
  privateMessage: {
    text: string;
    isVisible: boolean;
  };
}

const STORAGE_KEY = 'nexa_stage_state_v15';

function loadStoredStageState(): StageState {
  const defaultState: StageState = {
    stageWindowOpen: false,
    clockEnabled: true,
    timer: {
      enabled: true,
      mode: 'countdown',
      initialMinutes: 35,
      remainingSeconds: 35 * 60,
      isRunning: false,
      label: 'Tiempo de Predicación',
    },
    privateMessage: {
      text: '',
      isVisible: false,
    },
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultState,
          ...parsed,
          stageWindowOpen: false, // Iniciar siempre cerrado por seguridad
          timer: {
            ...defaultState.timer,
            ...(parsed.timer || {}),
            isRunning: false, // No autoiniciar cronómetro al abrir
          },
        };
      }
    }
  } catch {}
  return defaultState;
}

let state: StageState = loadStoredStageState();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

function broadcastSync() {
  emitChurchMessage({
    type: 'STAGE_SYNC_MESSAGE',
    payload: state,
  });
}

function setState(patch: Partial<StageState> | ((prev: StageState) => StageState)) {
  if (typeof patch === 'function') {
    state = patch(state);
  } else {
    state = { ...state, ...patch };
  }
  notify();
  broadcastSync();
}

// Timer ticker interval
let timerInterval: any = null;

function startTimerTick() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!state.timer.isRunning) return;

    if (state.timer.mode === 'countdown') {
      const nextRemaining = Math.max(-3600, state.timer.remainingSeconds - 1);
      setState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          remainingSeconds: nextRemaining,
        },
      }));
    } else {
      const nextRemaining = state.timer.remainingSeconds + 1;
      setState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          remainingSeconds: nextRemaining,
        },
      }));
    }
  }, 1000);
}

function stopTimerTick() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export const stageStore = {
  getSnapshot: (): StageState => state,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init: () => {
    // Escuchar eventos de sincronización de escenario entre ventanas
    listenChurchMessage((msg) => {
      if (msg.type === 'STAGE_SYNC_MESSAGE' && msg.payload) {
        state = { ...state, ...msg.payload };
        listeners.forEach((listener) => listener());
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          }
        } catch {}
      } else if (msg.type === 'REQUEST_STATE') {
        broadcastSync();
      }
    });

    // Sincronización entre WebViews locales vía evento storage
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            state = { ...state, ...parsed };
            listeners.forEach((listener) => listener());
          } catch {}
        }
      });
    }
  },

  openStage: async (displayId?: number, fullscreen?: boolean) => {
    try {
      await openStageWindow(displayId, fullscreen);
      setState({ stageWindowOpen: true });
      setTimeout(broadcastSync, 300);
      setTimeout(broadcastSync, 800);
    } catch (e) {
      console.warn('Error abriendo ventana de escenario:', e);
    }
  },

  closeStage: async () => {
    try {
      await closeStageWindow();
      setState({ stageWindowOpen: false });
    } catch (e) {
      console.warn('Error cerrando ventana de escenario:', e);
    }
  },

  toggleStage: async () => {
    if (state.stageWindowOpen) {
      await stageStore.closeStage();
    } else {
      await stageStore.openStage();
    }
  },

  // Cronómetro del predicador / culto
  startTimer: () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: true,
      },
    }));
    startTimerTick();
  },

  pauseTimer: () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
      },
    }));
    stopTimerTick();
  },

  resetTimer: () => {
    stopTimerTick();
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        remainingSeconds: prev.timer.initialMinutes * 60,
      },
    }));
  },

  setTimerMinutes: (minutes: number) => {
    stopTimerTick();
    const clamped = Math.max(1, Math.min(180, minutes));
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        initialMinutes: clamped,
        remainingSeconds: clamped * 60,
        isRunning: false,
      },
    }));
  },

  adjustTimerSeconds: (secondsDelta: number) => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        remainingSeconds: Math.max(0, prev.timer.remainingSeconds + secondsDelta),
      },
    }));
  },

  setTimerMode: (mode: 'countdown' | 'countup') => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode,
        remainingSeconds: mode === 'countup' ? 0 : prev.timer.initialMinutes * 60,
        isRunning: false,
      },
    }));
  },

  setTimerLabel: (label: string) => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        label,
      },
    }));
  },

  // Alertas y Mensajes Privados a Tarima
  setPrivateMessage: (text: string) => {
    setState((prev) => ({
      ...prev,
      privateMessage: {
        ...prev.privateMessage,
        text,
      },
    }));
  },

  showPrivateMessage: (text?: string) => {
    setState((prev) => ({
      ...prev,
      privateMessage: {
        text: text !== undefined ? text : prev.privateMessage.text,
        isVisible: true,
      },
    }));
  },

  hidePrivateMessage: () => {
    setState((prev) => ({
      ...prev,
      privateMessage: {
        ...prev.privateMessage,
        isVisible: false,
      },
    }));
  },

  resetForTesting: () => {
    stopTimerTick();
    state = loadStoredStageState();
    notify();
  },
};

export function useStage() {
  return useSyncExternalStore(stageStore.subscribe, stageStore.getSnapshot);
}
