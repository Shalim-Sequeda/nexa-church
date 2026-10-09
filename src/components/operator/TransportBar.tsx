import React from 'react';
import { presentationStore, usePresentation } from '../../stores/presentationStore';
import { churchStore } from '../../stores/churchStore';
import { formatTime } from '../../utils/formatters';
import {
  IconPrev,
  IconNext,
  IconTake,
  IconBlackout,
  IconPlay,
  IconPause,
  IconVolume,
  IconMute,
  IconCut,
  IconFade,
  IconProjector,
} from '../common/NexaIcons';

interface TransportBarProps {
  onOpenDisplays: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({ onOpenDisplays }) => {
  const presentation = usePresentation();
  const { isBlackout, liveScene, previewScene, mediaPlayback, transition, currentAudioSource } = presentation;
  const isMediaActive = currentAudioSource !== 'none' || liveScene?.type === 'video' || liveScene?.type === 'song';

  const handlePrevious = () => {
    churchStore.previousScene();
  };

  const handlePresent = () => {
    presentationStore.presentPreview();
  };

  const handleNext = () => {
    churchStore.nextScene();
  };

  const handleToggleBlack = () => {
    presentationStore.toggleBlackout();
  };

  const handlePlayPause = () => {
    presentationStore.togglePlayPauseMedia();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    presentationStore.seekMedia(parseFloat(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    presentationStore.setVolume(parseFloat(e.target.value));
  };

  return (
    <footer className="h-[7vh] min-h-[46px] max-h-[64px] bg-[#000000] border-t border-[#1C1C1E] px-3 flex items-center justify-between gap-3 shrink-0 select-none z-40 text-xs font-sans">
      {/* 1. UNIDAD DE PRODUCCIÓN MAESTRA [ PREV ] [ TAKE / LIVE ] [ NEXT ] [ BLACK ] */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* PREV */}
        <button
          onClick={handlePrevious}
          className="h-[34px] flex items-center gap-1.5 px-3 bg-[#0E0E10] hover:bg-[#18181C] text-[#A1A1AA] hover:text-[#F4F4F5] font-mono text-[11px] font-bold border border-[#222226] hover:border-[#33333A] rounded-[2px] transition-all active:translate-y-px"
          title="Escena anterior (Flecha Izquierda)"
        >
          <IconPrev className="w-3.5 h-3.5 text-zinc-400" />
          <span>PREV</span>
        </button>

        {/* TAKE / LIVE — Control Maestro de Emisión: 1.5-2x Peso visual mediante rojo NEXA, tipografía y contraste */}
        <button
          onClick={handlePresent}
          disabled={!previewScene}
          className={`h-[34px] flex items-center gap-2 px-5 font-mono text-xs font-bold tracking-wider rounded-[2px] transition-all border ${
            previewScene
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.35)] active:translate-y-px cursor-pointer'
              : 'bg-[#141416] text-[#71717A] border-[#222226] cursor-not-allowed opacity-60'
          }`}
          title="Enviar Preview a Pantalla Live (Enter)"
        >
          <span>TAKE / LIVE</span>
          <IconTake className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>

        {/* NEXT */}
        <button
          onClick={handleNext}
          className="h-[34px] flex items-center gap-1.5 px-3 bg-[#0E0E10] hover:bg-[#18181C] text-[#A1A1AA] hover:text-[#F4F4F5] font-mono text-[11px] font-bold border border-[#222226] hover:border-[#33333A] rounded-[2px] transition-all active:translate-y-px"
          title="Siguiente escena (Flecha Derecha)"
        >
          <span>NEXT</span>
          <IconNext className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        <div className="h-5 w-px bg-[#1C1C1E] mx-1" />

        {/* BLACKOUT TOGGLE (B) */}
        <button
          onClick={handleToggleBlack}
          className={`h-[34px] flex items-center gap-1.5 px-3 font-mono text-[11px] font-bold rounded-[2px] transition-all border ${
            isBlackout
              ? 'bg-amber-600 text-black border-amber-500 active:translate-y-px shadow-[0_0_10px_rgba(217,119,6,0.4)]'
              : 'bg-[#0E0E10] hover:bg-[#18181C] text-[#A1A1AA] hover:text-[#F4F4F5] border-[#222226] hover:border-[#33333A] active:translate-y-px'
          }`}
          title="Cortar a pantalla negra instantáneamente (B). No detiene el audio de fondo."
        >
          <IconBlackout className={`w-3.5 h-3.5 ${isBlackout ? 'fill-black' : 'text-zinc-400'}`} />
          <span>{isBlackout ? 'DESBLOQUEAR' : 'BLACK (B)'}</span>
        </button>
      </div>

      {/* 2. BLOQUE CENTRAL ADAPTATIVO [ TRANSPORTE / AUDIO ] */}
      <div className={`flex-1 max-w-xl min-w-0 h-[34px] flex items-center gap-2.5 px-3 bg-[#0A0A0C] border border-[#1C1C1E] rounded-[2px] transition-opacity ${
        isMediaActive ? 'opacity-100' : 'opacity-40 pointer-events-none'
      }`}>
        {/* Indicador discreto de canal */}
        {currentAudioSource === 'background' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#141416] border border-[#27272A] text-[8.5px] font-mono text-[#D4D4D8] shrink-0 rounded-[2px]">
            <span className={`w-1.5 h-1.5 rounded-full ${mediaPlayback.isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="uppercase">BGM</span>
          </div>
        )}
        {currentAudioSource === 'video' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#141416] border border-[#27272A] text-[8.5px] font-mono text-[#D4D4D8] shrink-0 rounded-[2px]">
            <span className={`w-1.5 h-1.5 rounded-full ${mediaPlayback.isPlaying ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="uppercase">VIDEO</span>
          </div>
        )}

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!isMediaActive}
          className={`w-6 h-6 flex items-center justify-center transition-all shrink-0 rounded-[2px] ${
            isMediaActive
              ? 'bg-[#141416] hover:bg-[#202024] text-[#F4F4F5] border border-[#27272A] active:scale-95 cursor-pointer'
              : 'bg-[#0E0E10] text-[#71717A] border-[#1C1C1E] cursor-not-allowed'
          }`}
          title={mediaPlayback.isPlaying ? 'Pausar medio (Espacio)' : 'Reproducir medio (Espacio)'}
        >
          {mediaPlayback.isPlaying ? (
            <IconPause className="w-3 h-3 text-white" />
          ) : (
            <IconPlay className="w-3 h-3 translate-x-0.5 text-white" />
          )}
        </button>

        {/* Tiempo actual */}
        <span className="text-[10px] font-mono text-[#D4D4D8] w-9 text-right tabular-nums shrink-0">
          {formatTime(mediaPlayback.currentTime)}
        </span>

        {/* Timeline Scrubber */}
        <input
          type="range"
          min={0}
          max={mediaPlayback.duration || 100}
          value={mediaPlayback.currentTime}
          onChange={handleSeek}
          disabled={!isMediaActive || !mediaPlayback.duration}
          className="flex-1 min-w-[50px] h-1 bg-[#1C1C1E] appearance-none cursor-pointer accent-zinc-300"
        />

        {/* Duración */}
        <span className="text-[10px] font-mono text-[#71717A] w-9 tabular-nums shrink-0">
          {formatTime(mediaPlayback.duration)}
        </span>

        {/* Selector de Velocidad */}
        <div className="hidden sm:flex items-center gap-0.5 pl-2 border-l border-[#1C1C1E] shrink-0">
          {[1, 1.25, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => presentationStore.setPlaybackSpeed(s)}
              className={`px-1 py-0.5 text-[8.5px] font-mono font-bold rounded-[2px] transition-all ${
                (mediaPlayback.speed || 1) === s
                  ? 'bg-[#1C1C20] text-white border border-[#3F3F46]'
                  : 'text-[#71717A] hover:text-[#D4D4D8]'
              }`}
              title={`Velocidad ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Fader de Volumen */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#1C1C1E] shrink-0">
          <button
            onClick={() => presentationStore.setVolume(mediaPlayback.isMuted ? 0.8 : 0)}
            disabled={!isMediaActive}
            className="text-[#71717A] hover:text-[#F4F4F5] transition-colors disabled:opacity-30"
            title={mediaPlayback.isMuted ? 'Desmutear' : 'Mutear'}
          >
            {mediaPlayback.isMuted || mediaPlayback.volume === 0 ? (
              <IconMute className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <IconVolume className="w-3.5 h-3.5 text-[#A1A1AA]" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mediaPlayback.isMuted ? 0 : mediaPlayback.volume}
            onChange={handleVolume}
            disabled={!isMediaActive}
            className="w-12 sm:w-14 h-1 bg-[#1C1C1E] appearance-none cursor-pointer accent-zinc-300"
          />
        </div>
      </div>

      {/* 3. TRANSICIONES Y PROYECTOR [ CUT ] [ FADE ] [ PROJECTOR ] */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Selector de Transición CUT / FADE */}
        <div className="h-[34px] flex items-center gap-0.5 bg-[#0E0E10] px-1 border border-[#222226] text-[10px] font-mono rounded-[2px]">
          {transition === 'cut' ? (
            <IconCut className="w-3 h-3 text-[#71717A] mx-0.5" />
          ) : (
            <IconFade className="w-3 h-3 text-[#71717A] mx-0.5" />
          )}
          <button
            onClick={() => presentationStore.setTransition('cut')}
            className={`px-2 py-1 rounded-[2px] transition-colors ${
              transition === 'cut'
                ? 'bg-[#18181C] text-white font-bold border border-[#33333A]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            CUT
          </button>
          <button
            onClick={() => presentationStore.setTransition('fade')}
            className={`px-2 py-1 rounded-[2px] transition-colors ${
              transition === 'fade'
                ? 'bg-[#18181C] text-white font-bold border border-[#33333A]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            FADE
          </button>
        </div>

        {/* Botón de Salida al Proyector (Misma altura y lenguaje) */}
        <button
          onClick={onOpenDisplays}
          className="h-[34px] flex items-center gap-1.5 px-3 bg-[#0E0E10] hover:bg-[#18181C] text-[#D4D4D8] hover:text-white font-mono text-[11px] font-bold border border-[#222226] hover:border-[#33333A] rounded-[2px] transition-all active:translate-y-px"
          title="Monitores y Proyector"
        >
          <IconProjector className="w-3.5 h-3.5 text-zinc-300" />
          <span>PROYECTOR</span>
        </button>
      </div>
    </footer>
  );
};