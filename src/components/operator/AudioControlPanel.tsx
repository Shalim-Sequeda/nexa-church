import React from 'react';
import {
  IconAudio,
  IconVolume,
  IconMute,
  IconPlay,
  IconPause,
  IconMedia,
  IconSliders,
  IconBlackout,
} from '../common/NexaIcons';
import { presentationStore, usePresentation } from '../../stores/presentationStore';
import { formatTime } from '../../utils/formatters';

export const AudioControlPanel: React.FC = () => {
  const presentation = usePresentation();
  const { backgroundAudio, currentAudioSource, mediaPlayback, liveScene } = presentation;
  const isVideoLive = liveScene?.type === 'video';

  const handlePlayPause = () => {
    presentationStore.togglePlayPauseMedia();
  };

  const handleStopAll = () => {
    presentationStore.disposeAllMedia();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    presentationStore.setVolume(val);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    presentationStore.seekMedia(val);
  };

  const handleToggleMute = () => {
    const newVol = mediaPlayback.volume > 0 ? 0 : 0.8;
    presentationStore.setVolume(newVol);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-[#F4F4F5] select-none overflow-hidden">
      {/* Header */}
      <div className="h-10 px-3.5 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <IconAudio className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
            CONSOLA DE AUDIO
          </span>
        </div>

        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#18181A] border border-[#27272A] text-[#A1A1AA]">
          CANAL INDEPENDIENTE
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Master Output Control */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
              <IconSliders className="w-3 h-3 text-zinc-400" />
              SALIDA PRINCIPAL / MASTER
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {Math.round(mediaPlayback.volume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded-[2px] border transition-colors ${
                mediaPlayback.volume === 0
                  ? 'bg-red-950/80 border-red-800 text-red-400'
                  : 'bg-[#18181A] border-[#27272A] text-[#A1A1AA] hover:text-white'
              }`}
              title={mediaPlayback.volume === 0 ? 'Desmutear' : 'Mutear'}
            >
              {mediaPlayback.volume === 0 ? (
                <IconMute className="w-4 h-4 text-red-400" />
              ) : (
                <IconVolume className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={mediaPlayback.volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-[#27272A] rounded-none appearance-none cursor-pointer accent-red-600"
            />
          </div>
        </div>

        {/* Channel 1: Background Music (BGM) */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <IconAudio className="w-3 h-3" />
              CANAL 1 · MÚSICA DE FONDO (BGM)
            </span>
            <span
              className={`text-[8.5px] font-mono uppercase px-1.5 py-0.5 border ${
                backgroundAudio && mediaPlayback.isPlaying && currentAudioSource === 'background'
                  ? 'bg-[#1E1E24] border-zinc-500 text-white'
                  : 'bg-[#18181A] border-[#27272A] text-[#71717A]'
              }`}
            >
              {backgroundAudio && mediaPlayback.isPlaying && currentAudioSource === 'background'
                ? 'EN EMISIÓN'
                : 'STANDBY'}
            </span>
          </div>

          {backgroundAudio ? (
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-white truncate">
                {backgroundAudio.fileName}
              </div>

              {/* Timeline scrubber */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={mediaPlayback.duration || 100}
                  step="0.1"
                  value={mediaPlayback.currentTime}
                  onChange={handleSeek}
                  className="w-full accent-zinc-300 h-1 bg-[#27272A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#71717A]">
                  <span>{formatTime(mediaPlayback.currentTime)}</span>
                  <span>{formatTime(mediaPlayback.duration)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handlePlayPause}
                  className="flex-1 py-1.5 bg-[#18181A] hover:bg-[#222226] border border-[#27272A] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {mediaPlayback.isPlaying ? <IconPause className="w-3.5 h-3.5" /> : <IconPlay className="w-3.5 h-3.5" />}
                  <span>{mediaPlayback.isPlaying ? 'PAUSAR' : 'REPRODUCIR'}</span>
                </button>

                <button
                  onClick={handleStopAll}
                  className="px-3 py-1.5 bg-[#18181A] hover:bg-red-950/60 border border-[#27272A] hover:border-red-900 text-xs font-mono text-[#A1A1AA] hover:text-red-400 transition-colors"
                  title="Detener pista"
                >
                  <IconBlackout className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-[#71717A] font-mono border border-dashed border-[#222226]">
              Sin pista de música cargada. Puedes seleccionar una canción en Multimedia para reproducirla de fondo.
            </div>
          )}
        </div>

        {/* Channel 2: Video Stream Audio */}
        <div className="bg-[#121214] border border-[#222226] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <IconMedia className="w-3 h-3 text-zinc-400" />
              CANAL 2 · AUDIO DE VIDEO
            </span>
            <span
              className={`text-[8.5px] font-mono uppercase px-1.5 py-0.5 border ${
                isVideoLive
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-[#18181A] border-[#27272A] text-[#71717A]'
              }`}
            >
              {isVideoLive ? 'VINCULADO A PROGRAM' : 'INACTIVO'}
            </span>
          </div>

          <p className="text-xs text-[#A1A1AA]">
            {isVideoLive
              ? `Reproduciendo audio nativo del video: ${liveScene.content.media?.fileName || liveScene.title}`
              : 'El audio de video se activa automáticamente cuando se proyecta un archivo MP4/Video en Live.'}
          </p>
        </div>

        {/* Quick emergency stop */}
        <button
          onClick={handleStopAll}
          className="w-full py-2 bg-[#18181A] hover:bg-red-950/80 text-xs font-mono font-bold text-[#A1A1AA] hover:text-red-400 border border-[#27272A] hover:border-red-900 transition-colors flex items-center justify-center gap-2"
        >
          <IconBlackout className="w-3.5 h-3.5" />
          <span>FADE OUT & DETENER TODO EL AUDIO</span>
        </button>
      </div>
    </div>
  );
};
