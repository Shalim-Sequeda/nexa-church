import { useEffect } from 'react';
import { presentationStore } from '../stores/presentationStore';
import { churchStore } from '../stores/churchStore';

export function useKeyboardShortcuts(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Never trigger shortcuts if typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Map shortcuts
      switch (e.key) {
        case ' ': // Space -> Play/Pause Media
          e.preventDefault();
          presentationStore.togglePlayPauseMedia();
          break;

        case 'ArrowLeft': // Previous scene
          e.preventDefault();
          churchStore.previousScene();
          break;

        case 'ArrowRight': // Next scene
          e.preventDefault();
          churchStore.nextScene();
          break;

        case 'Enter': // Present Preview -> Live
          e.preventDefault();
          presentationStore.presentPreview();
          break;

        case 'b':
        case 'B': // Toggle Blackout
          e.preventDefault();
          presentationStore.toggleBlackout();
          break;

        case 'p':
        case 'P': // Select first or active preview
          e.preventDefault();
          const pScene = presentationStore.getSnapshot().previewScene;
          if (pScene) {
            churchStore.setActiveSceneId(pScene.id);
          }
          break;

        case 'l':
        case 'L': // Select live scene
          e.preventDefault();
          const lScene = presentationStore.getSnapshot().liveScene;
          if (lScene) {
            churchStore.setActiveSceneId(lScene.id);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}