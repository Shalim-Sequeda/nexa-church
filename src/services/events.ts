import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';
import { PresentationSyncMessage } from '../types/church';
import { isTauriEnvironment } from './tauri';

const CHURCH_SYNC_EVENT = 'church://sync';
const BROADCAST_CHANNEL_NAME = 'nexa-church-sync';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel no disponible:', e);
}

export async function emitChurchMessage(message: PresentationSyncMessage): Promise<void> {
  // 1. BroadcastChannel fallback/local web sync
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch {}
  }

  // 2. Tauri cross-window event bus
  if (isTauriEnvironment()) {
    try {
      await emit(CHURCH_SYNC_EVENT, message);
    } catch (e) {
      console.error('Error emitiendo evento de iglesia:', e);
    }
  }
}

export function listenChurchMessage(handler: (message: PresentationSyncMessage) => void): () => void {
  const unsubscribers: (() => void)[] = [];

  // 1. Listen BroadcastChannel
  if (broadcastChannel) {
    const bcListener = (ev: MessageEvent) => {
      if (ev.data && typeof ev.data === 'object' && 'type' in ev.data) {
        handler(ev.data as PresentationSyncMessage);
      }
    };
    broadcastChannel.addEventListener('message', bcListener);
    unsubscribers.push(() => broadcastChannel?.removeEventListener('message', bcListener));
  }

  // 2. Listen Tauri event bus
  if (isTauriEnvironment()) {
    let unlistenTauri: UnlistenFn | null = null;
    listen<PresentationSyncMessage>(CHURCH_SYNC_EVENT, (event) => {
      handler(event.payload);
    }).then((unlisten) => {
      unlistenTauri = unlisten;
    }).catch(console.error);

    unsubscribers.push(() => {
      if (unlistenTauri) unlistenTauri();
    });
  }

  return () => {
    unsubscribers.forEach((fn) => fn());
  };
}