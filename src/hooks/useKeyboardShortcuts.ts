import { useEffect } from 'react';
import { presentationStore } from '../stores/presentationStore';
import { churchStore } from '../stores/churchStore';
import { bibleStore } from '../stores/bibleStore';
import { songStore } from '../stores/songStore';

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

        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          // Navegación contextual con prioridad:
          // A. Si hay canción seleccionada en Cancionero (Holyrics)
          if (songStore.getSnapshot().selectedSongId && songStore.nextSelectedSongSlide()) {
            break;
          }
          // B. Si hay canción en vivo (o en preview), avanzar a su siguiente diapositiva
          if (presentationStore.nextSongSlide()) {
            break;
          }
          // C. Si hay versículo bíblico en vivo (o en preview), avanzar versículo continuo
          if (bibleStore.nextVerseLive()) {
            break;
          }
          // D. Fallback: avanzar a la siguiente escena de la lista de Cues
          churchStore.nextScene();
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          // A. Si hay canción seleccionada en Cancionero (Holyrics)
          if (songStore.getSnapshot().selectedSongId && songStore.previousSelectedSongSlide()) {
            break;
          }
          // B. Si hay canción en vivo (o en preview), retroceder diapositiva
          if (presentationStore.previousSongSlide()) {
            break;
          }
          // C. Si hay versículo bíblico en vivo (o en preview), retroceder versículo
          if (bibleStore.previousVerseLive()) {
            break;
          }
          // D. Fallback: retroceder escena de la lista de Cues
          churchStore.previousScene();
          break;

        case 'Enter': // Present Preview -> Live (TAKE oficial)
          e.preventDefault();
          presentationStore.presentPreview();
          break;

        case 'c':
        case 'C': // Saltar directamente al Coro de la canción activa
          e.preventDefault();
          if (songStore.getSnapshot().selectedSongId && songStore.jumpToSelectedSongChorus()) {
            break;
          }
          if (!presentationStore.jumpToSongChorus()) {
            churchStore.jumpToChorusScene();
          }
          break;

        case 'r':
        case 'R': // Pre-Coro de la canción activa (Holyrics standard)
          if (songStore.getSnapshot().selectedSongId && songStore.jumpToSelectedSongPreChorus()) {
            e.preventDefault();
            break;
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const num = parseInt(e.key, 10);
          if (songStore.getSnapshot().selectedSongId && songStore.jumpToSelectedSongVerse(num)) {
            e.preventDefault();
            break;
          }
          if (presentationStore.jumpToSongVerse(num)) {
            e.preventDefault();
          } else if (churchStore.jumpToVerseScene(num)) {
            e.preventDefault();
          }
          break;
        }

        case 'b':
        case 'B': // Toggle Blackout
          e.preventDefault();
          presentationStore.toggleBlackout();
          break;

        case 'p':
        case 'P': // Puente en cancionero o seleccionar preview
          e.preventDefault();
          if (songStore.getSnapshot().selectedSongId && songStore.jumpToSelectedSongBridge()) {
            break;
          }
          const pScene = presentationStore.getSnapshot().previewScene;
          if (pScene) {
            churchStore.setActiveSceneId(pScene.id);
          }
          break;

        case 'Escape': // Volver del apartado exclusivo de canción al listado
          if (songStore.getSnapshot().selectedSongId) {
            e.preventDefault();
            songStore.setSelectedSongId(null);
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