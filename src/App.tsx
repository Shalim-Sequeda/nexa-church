import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriEnvironment } from './services/tauri';
import { ControlRoom } from './components/operator/ControlRoom';
import { PresentationWindow } from './components/presentation/PresentationWindow';
import { StageDisplayWindow } from './components/presentation/StageDisplayWindow';
import { AppSplashScreen } from './components/common/AppSplashScreen';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { churchStore } from './stores/churchStore';
import { presentationStore } from './stores/presentationStore';
import { bibleStore } from './stores/bibleStore';
import { announcementStore } from './stores/announcementStore';
import { songStore } from './stores/songStore';
import { stageStore } from './stores/stageStore';

function getInitialWindowLabel(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const win = params.get('window');
    if (win) return win;
    if (window.location.hash.includes('presentation')) return 'presentation';
    if (window.location.hash.includes('stage')) return 'stage';
  }
  return 'main';
}

export const App: React.FC = () => {
  const [windowLabel, setWindowLabel] = useState<string>(getInitialWindowLabel);

  // Estado de carga inicial y pantalla de bienvenida (Fase 2)
  const [splashProgress, setSplashProgress] = useState<number>(15);
  const [splashStatus, setSplashStatus] = useState<string>('Iniciando consola y motor de emisión...');
  const [isAppLoaded, setIsAppLoaded] = useState<boolean>(false);
  const [splashFinished, setSplashFinished] = useState<boolean>(false);

  useEffect(() => {
    // Fallback Tauri window label detection if still 'main'
    if (isTauriEnvironment() && windowLabel === 'main') {
      try {
        const currentWin = getCurrentWindow();
        if (currentWin.label && currentWin.label !== 'main') {
          setWindowLabel(currentWin.label);
        }
      } catch (err) {
        console.error('Error detectando ventana:', err);
      }
    }
  }, [windowLabel]);

  // Main operator window initialization with sequential async preload
  useEffect(() => {
    if (windowLabel === 'main') {
      let isMounted = true;

      const warmupSequence = async () => {
        try {
          if (!isMounted) return;
          setSplashStatus('Inicializando motor de emisión y entorno...');
          setSplashProgress(20);
          churchStore.init();
          presentationStore.init();
          await new Promise((r) => setTimeout(r, 60));

          if (!isMounted) return;
          setSplashStatus('Cargando Sagradas Escrituras (12 versiones bíblicas)...');
          setSplashProgress(48);
          await bibleStore.init();
          await new Promise((r) => setTimeout(r, 60));

          if (!isMounted) return;
          setSplashStatus('Cargando cancionero y repertorio de alabanzas...');
          setSplashProgress(75);
          await songStore.init();
          await new Promise((r) => setTimeout(r, 60));

          if (!isMounted) return;
          setSplashStatus('Sincronizando biblioteca de anuncios y módulos...');
          setSplashProgress(92);
          await announcementStore.init();
          stageStore.init();
          await new Promise((r) => setTimeout(r, 60));

          if (!isMounted) return;
          setSplashStatus('Listo para el servicio.');
          setSplashProgress(100);
          setIsAppLoaded(true);
        } catch (err) {
          console.warn('[NEXA Startup] Error en carga inicial de datos:', err);
          if (isMounted) {
            setIsAppLoaded(true);
          }
        }
      };

      warmupSequence();

      if (isTauriEnvironment()) {
        try {
          const win = getCurrentWindow();
          win.setFocus().catch(() => {});
          window.focus();

          const unlistenPromise = win.onCloseRequested((event) => {
            event.preventDefault();
            churchStore.setShowExitPrompt(true);
          });

          // Escuchar comandos enviados desde el Control Remoto Web móvil
          let unlistenAction: (() => void) | null = null;
          import('@tauri-apps/api/event').then(({ listen }) => {
            listen<string>('remote_action', (event) => {
              if (windowLabel !== 'main') return;
              const act = event.payload;
              if (act === 'next') {
                churchStore.nextScene();
              } else if (act === 'prev') {
                churchStore.previousScene();
              } else if (act === 'take') {
                presentationStore.presentPreview();
              } else if (act === 'blackout') {
                presentationStore.toggleBlackout();
              }
            }).then((u) => {
              unlistenAction = u;
            });
          });

          return () => {
            isMounted = false;
            unlistenPromise.then((unlisten) => unlisten());
            if (unlistenAction) unlistenAction();
          };
        } catch (err) {
          console.warn('Error configurando ventana en Tauri:', err);
        }
      }

      return () => {
        isMounted = false;
      };
    }
  }, [windowLabel]);

  // Operator keyboard shortcuts (only in main console)
  useKeyboardShortcuts(windowLabel === 'main');

  // If this window is the dedicated Presentation Output for the congregation/projector
  if (windowLabel === 'presentation') {
    return <PresentationWindow />;
  }

  // If this window is the dedicated Stage Display for musicians and preacher
  if (windowLabel === 'stage') {
    return <StageDisplayWindow />;
  }

  // Otherwise, render the Operator Control Room with professional splash screen
  return (
    <>
      {!splashFinished && (
        <AppSplashScreen
          progress={splashProgress}
          statusText={splashStatus}
          isComplete={isAppLoaded}
          onFinish={() => setSplashFinished(true)}
        />
      )}
      <div className={`w-full h-full flex flex-col ${splashFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ControlRoom />
      </div>
    </>
  );
};