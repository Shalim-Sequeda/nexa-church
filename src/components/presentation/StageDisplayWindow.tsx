import React, { useEffect, useState } from 'react';
import { Scene, PresentationSyncMessage } from '../../types/church';
import { listenChurchMessage, emitChurchMessage } from '../../services/events';
import { useStage, stageStore } from '../../stores/stageStore';
import { churchStore } from '../../stores/churchStore';
import { Tv, Clock, Timer, AlertCircle } from 'lucide-react';

export const StageDisplayWindow: React.FC = () => {
  const [liveScene, setLiveScene] = useState<Scene | null>(null);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const stage = useStage();

  // Reloj de pared en tiempo real con tipografía moderna
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar sincronización de presentación (escena live, blackout y cronómetro)
  useEffect(() => {
    // Inicializar stores en esta ventana secundaria
    churchStore.init();
    stageStore.init();

    // Pedir estado inicial inmediatamente
    emitChurchMessage({ type: 'REQUEST_STATE' });

    const unsubscribe = listenChurchMessage((msg: PresentationSyncMessage) => {
      if (msg.type === 'LIVE_UPDATE') {
        if (msg.scene !== undefined) setLiveScene(msg.scene);
        if (msg.isBlackout !== undefined) setIsBlackout(msg.isBlackout);
      } else if (msg.type === 'STATE_RESPONSE') {
        if (msg.scene !== undefined) setLiveScene(msg.scene);
        if (msg.isBlackout !== undefined) setIsBlackout(msg.isBlackout);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Formato del cronómetro de predicación
  const formatTimer = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const timerSeconds = stage.timer.remainingSeconds;
  const isTimeOver = stage.timer.mode === 'countdown' && timerSeconds <= 0;
  const isTimeWarning = stage.timer.mode === 'countdown' && timerSeconds > 0 && timerSeconds <= 300;

  // Extraer texto de la diapositiva actual
  let currentContentTitle = '';
  let currentContentText = '';
  let nextContentText = '';

  if (liveScene) {
    if (liveScene.type === 'song' && liveScene.content.song) {
      const s = liveScene.content.song;
      currentContentTitle = s.sectionLabel ? `${s.sectionLabel} · ${s.title}` : s.title;
      currentContentText = s.slides[s.activeSlideIndex] || s.slides[0] || s.title;

      // Buscar siguiente slide de la canción
      if (s.activeSlideIndex + 1 < s.slides.length) {
        nextContentText = s.slides[s.activeSlideIndex + 1];
      } else {
        // Próximo cue del proyecto
        const allScenes = churchStore.getSnapshot().currentProject.scenes;
        const currentIdx = allScenes.findIndex((sc) => sc.id === liveScene.id);
        if (currentIdx >= 0 && currentIdx + 1 < allScenes.length) {
          const nextScene = allScenes[currentIdx + 1];
          nextContentText = nextScene.type === 'song' && nextScene.content.song
            ? nextScene.content.song.slides[0]
            : nextScene.title;
        }
      }
    } else if (liveScene.type === 'bible' && liveScene.content.bible) {
      const b = liveScene.content.bible;
      currentContentTitle = `${b.reference} (${b.version})`;
      currentContentText = b.text;

      // Próximo cue
      const allScenes = churchStore.getSnapshot().currentProject.scenes;
      const currentIdx = allScenes.findIndex((sc) => sc.id === liveScene.id);
      if (currentIdx >= 0 && currentIdx + 1 < allScenes.length) {
        const nextScene = allScenes[currentIdx + 1];
        nextContentText = nextScene.type === 'bible' && nextScene.content.bible
          ? `${nextScene.content.bible.reference}: ${nextScene.content.bible.text}`
          : nextScene.type === 'song' && nextScene.content.song
          ? nextScene.content.song.slides[0]
          : nextScene.title;
      }
    } else if (liveScene.type === 'announcement' && liveScene.content.announcement) {
      currentContentTitle = 'ANUNCIO';
      currentContentText = liveScene.content.announcement.title || liveScene.title;
    } else {
      currentContentTitle = liveScene.title;
      currentContentText = liveScene.content.text || liveScene.title;
    }
  }

  return (
    <div className="w-screen h-screen bg-[#030305] text-white flex flex-col justify-between overflow-hidden select-none font-sans p-6 md:p-8">
      {/* 1. BARRA SUPERIOR: RELOJ DE PARED + TALLY ON-AIR + CRONÓMETRO DE PÚLPITO */}
      <header className="flex items-center justify-between bg-[#0A0C12] border border-[#1E2230] px-8 py-5 rounded-2xl shrink-0 shadow-2xl">
        {/* Reloj del templo */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-sans font-bold tracking-[0.2em] text-zinc-400 uppercase">
              HORA LOCAL
            </span>
          </div>
          <span className="text-4xl md:text-5xl font-sans font-black tracking-tight text-white tabular-nums">
            {currentTimeStr || '--:--:--'}
          </span>
        </div>

        {/* Tally State (Píldora Central de Emisión) */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-sans font-extrabold tracking-widest uppercase transition-all ${
              isBlackout
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : liveScene
                ? 'bg-red-950/80 border-red-500/70 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
                : 'bg-zinc-900/90 border-zinc-700/50 text-zinc-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isBlackout ? 'bg-amber-400' : liveScene ? 'bg-red-500' : 'bg-zinc-500'
              }`}
            />
            <span>{isBlackout ? 'SALIDA EN NEGRO' : liveScene ? 'EN VIVO' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Cronómetro del pastor / predicador */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-zinc-400 mb-0.5">
            <Timer className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-sans font-bold tracking-[0.2em] text-zinc-400 uppercase">
              {stage.timer.label.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-4xl md:text-5xl font-sans font-black tracking-tight tabular-nums transition-colors ${
                isTimeOver
                  ? 'text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                  : isTimeWarning
                  ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>
          </div>
        </div>
      </header>

      {/* 2. ZONA CENTRAL: DIAPOSITIVA ACTUAL (LETRA O VERSÍCULO GIGANTE CON MÁXIMO CONTRASTE) */}
      <main className="flex-1 my-4 flex flex-col justify-center items-center text-center p-8 md:p-12 bg-[#07080D] border border-[#161924] rounded-2xl relative overflow-hidden shadow-2xl">
        {/* Badge superior del elemento en emisión */}
        {currentContentTitle && (
          <div className="absolute top-5 left-8 px-4 py-1.5 bg-sky-500/10 border border-sky-500/30 text-xs font-sans font-bold tracking-wider text-sky-300 uppercase rounded-full shadow-inner">
            {currentContentTitle}
          </div>
        )}

        <div className="max-w-6xl w-full mx-auto px-6">
          {isBlackout ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <span className="text-amber-500/80 font-sans text-2xl font-black uppercase tracking-widest">
                SALIDA EN NEGRO ACTIVA
              </span>
              <span className="text-zinc-600 font-sans text-sm">
                La proyección está pausada temporalmente por el operador.
              </span>
            </div>
          ) : currentContentText ? (
            <p className="font-sans font-black text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.18] tracking-tight whitespace-pre-line drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              {currentContentText}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 py-12">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                <Tv className="w-8 h-8 opacity-60" />
              </div>
              <span className="text-zinc-400 font-sans text-2xl font-extrabold uppercase tracking-wider">
                EN ESPERA DE TRANSMISIÓN
              </span>
              <span className="text-zinc-600 font-sans text-sm max-w-md">
                Las letras de canciones, versículos bíblicos y diapositivas proyectadas se reflejarán aquí en tiempo real.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* 3. ZONA INFERIOR: PRÓXIMA DIAPOSITIVA (RETORNO ANTICIPADO PARA MÚSICOS Y PÚLPITO) */}
      <footer className="bg-[#0B0D16] border border-amber-500/35 p-5 rounded-2xl shrink-0 space-y-2 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-sans font-black tracking-[0.18em] text-amber-400 uppercase">
            SIGUIENTE DIAPOSITIVA (NEXT CUE)
          </span>
        </div>
        <div className="pl-4 border-l-2 border-amber-500/60">
          <p className="text-xl md:text-2xl lg:text-3xl font-sans font-bold text-[#FEF3C7] line-clamp-2 leading-snug tracking-tight">
            {nextContentText ? (
              nextContentText
            ) : (
              <span className="text-zinc-500 italic font-medium text-base">
                (Fin de la canción o secuencia)
              </span>
            )}
          </p>
        </div>
      </footer>

      {/* 4. ALERTA PRIVADA A TARIMA (MENSAJE DISCRETO PARA EL PASTOR) */}
      {stage.privateMessage.isVisible && stage.privateMessage.text && (
        <div className="absolute inset-x-8 bottom-32 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-8 py-4 rounded-2xl shadow-[0_12px_45px_rgba(245,158,11,0.55)] flex items-center justify-between border-2 border-amber-200 animate-bounce">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-7 h-7 text-black shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-sans font-extrabold tracking-widest uppercase text-black/75">
                AVISO PRIVADO PARA EL PÚLPITO
              </span>
              <span className="text-lg md:text-2xl font-sans font-black tracking-tight text-black">
                {stage.privateMessage.text}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
