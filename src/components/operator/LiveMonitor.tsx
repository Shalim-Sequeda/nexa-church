import React from 'react';
import { IconLive, IconBlackout } from '../common/NexaIcons';
import { usePresentation, presentationStore } from '../../stores/presentationStore';
import { resolveMediaUrl, handleMediaImageError } from '../../services/tauri';
import { AnnouncementRenderer } from './AnnouncementRenderer';
import { getBibleDynamicFontSizes, getSongDynamicFontSizes } from '../../utils/bibleTypography';

export const LiveMonitor: React.FC = () => {
  const presentation = usePresentation();
  const scene = presentation.liveScene;
  const isBlackout = presentation.isBlackout;

  const handleToggleBlack = () => {
    presentationStore.toggleBlackout();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C] border border-[#1C1C1E] overflow-hidden">
      {/* Studio Header Bar */}
      <div className="h-10 px-3 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconLive className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase leading-none">
              PROGRAM (LIVE)
            </span>
            <span className="text-[10px] font-mono text-[#A1A1AA] truncate mt-0.5">
              {scene ? `▾ ${scene.title}` : '▾ Salida inactiva'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-[#52525B]">
            1920 × 1080 16:9
          </span>

          {/* Studio Blackout Cut Button */}
          <button
            onClick={handleToggleBlack}
            className={`px-2.5 py-1 text-xs font-mono font-bold border transition-colors flex items-center gap-1 ${
              isBlackout
                ? 'bg-amber-600 text-black border-amber-500'
                : 'bg-[#141416] hover:bg-[#1E1E22] text-[#A1A1AA] hover:text-white border-[#27272A]'
            }`}
            title="Cortar a negro o reactivar proyección (B)"
          >
            <IconBlackout className={`w-3 h-3 ${isBlackout ? 'fill-black' : ''}`} />
            <span>BLACK (B)</span>
          </button>
        </div>
      </div>

      {/* Broadcast 16:9 Canvas Area */}
      <div className="flex-1 min-h-0 relative bg-[#000000] flex items-center justify-center p-3 overflow-hidden">
        <div
          className={`w-full aspect-video max-h-full relative flex items-center justify-center text-center select-none overflow-hidden [container-type:inline-size] ${
            !scene
              ? 'border border-[#1C1C1F] bg-[#050507]'
              : isBlackout
              ? 'border-2 border-amber-600/80 shadow-[0_0_15px_rgba(217,119,6,0.3)]'
              : 'border-2 border-red-600/90 shadow-[0_0_18px_rgba(225,29,72,0.35)]'
          }`}
          style={{
            backgroundColor: scene?.style?.backgroundColor || (scene ? '#000000' : '#050507'),
            backgroundImage: scene?.style?.backgroundImageUrl ? `url(${resolveMediaUrl(scene.style.backgroundImageUrl)})` : undefined,
            backgroundSize: 'cover',
          }}
        >
          {/* Aspect Ratio Safe Area Marker */}
          <div className="absolute inset-2 border border-white/5 pointer-events-none z-20" />

          {scene ? (
            <>
              {/* Red Live On-Air Pill Indicator inside canvas frame */}
              {!isBlackout && (
                <div className="absolute top-2.5 right-2.5 z-30 px-2 py-0.5 bg-red-600 text-white font-mono font-bold text-[9px] tracking-wider rounded-[2px] shadow-[0_0_10px_rgba(225,29,72,0.8)]">
                  + LIVE
                </div>
              )}

              {/* Blackout Overlay */}
              {isBlackout && (
                <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 bg-[#181818] border border-[#27272A] flex items-center justify-center text-[#D97706] mb-1.5">
                    <IconBlackout className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#D97706] tracking-widest uppercase">
                    SALIDA EN NEGRO ACTIVA
                  </span>
                  <span className="text-[10px] text-[#71717A] mt-0.5 font-mono">
                    Proyector en negro (#000000). Presione [B] para restaurar.
                  </span>
                </div>
              )}

              {/* 1. Versículo Bíblico */}
              {scene.type === 'bible' && scene.content.bible && (() => {
                const text = scene.content.bible.text;
                const fontSizes = getBibleDynamicFontSizes(text, scene.style.fontSize || 46, true);
                return (
                  <div className="w-[96%] max-w-full mx-auto px-2 py-1.5 flex flex-col items-center justify-center text-center relative z-10">
                    <p
                      className="font-sans font-black text-white tracking-tight"
                      style={{
                        fontFamily: scene.style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontSize: fontSizes.fontSizeCqw,
                        lineHeight: fontSizes.lineHeight,
                        textShadow: '0 2px 8px rgba(0,0,0,0.98), 0 1px 3px rgba(0,0,0,0.95)',
                        textAlign: scene.style.textAlign || 'center',
                      }}
                    >
                      {text}
                    </p>
                    <div 
                      className="flex items-center justify-center gap-1.5 mt-2 font-sans font-bold text-[#F4F4F5] tracking-wide drop-shadow-md flex-wrap"
                      style={{ 
                        fontFamily: scene.style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontSize: fontSizes.referenceSizeCqw,
                      }}
                    >
                      <span>{scene.content.bible.reference}</span>
                      <span className="text-[#D4D4D8] italic font-normal">
                        ({scene.content.bible.version})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Canción con Letra — Idéntica contundencia tipográfica que los versículos */}
              {scene.type === 'song' && scene.content.song && (() => {
                const text = scene.content.song.slides[scene.content.song.activeSlideIndex] || scene.content.song.title;
                const fontSizes = getSongDynamicFontSizes(text, scene.style.fontSize || 46, true);
                return (
                  <div className="w-[96%] max-w-full mx-auto px-2 py-1.5 flex flex-col items-center justify-center text-center relative z-10">
                    <p
                      className="font-sans font-black text-white tracking-tight whitespace-pre-line"
                      style={{
                        fontFamily: scene.style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontSize: fontSizes.fontSizeCqw,
                        lineHeight: fontSizes.lineHeight,
                        textShadow: '0 2px 8px rgba(0,0,0,0.98), 0 1px 3px rgba(0,0,0,0.95)',
                        textAlign: scene.style.textAlign || 'center',
                      }}
                    >
                      {text}
                    </p>
                  </div>
                );
              })()}

              {/* 3. Video */}
              {(scene.type === 'video' || (scene.type === 'song' && scene.content.media?.mediaType === 'video')) && scene.content.media && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-tally-live animate-ping" />
                    <span className="text-[10px] font-mono font-black text-tally-live uppercase tracking-widest">
                      EMISIÓN DE VIDEO EN CURSO
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white truncate max-w-xs">
                    {scene.content.media.fileName}
                  </span>
                </div>
              )}

              {/* 4. Imagen */}
              {scene.type === 'image' && scene.content.media && (
                <img
                  src={resolveMediaUrl(scene.content.media.filePath)}
                  alt={scene.content.media.fileName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    handleMediaImageError(e, scene.content.media?.filePath);
                  }}
                />
              )}

              {/* 5. Texto */}
              {scene.type === 'text' && scene.content.text && (
                <div className="p-4 max-w-lg">
                  <p
                    className="font-sans leading-relaxed whitespace-pre-line line-clamp-4 text-white/95"
                    style={{
                      fontSize: `${(scene.style.fontSize || 46) * 0.42}px`,
                    }}
                  >
                    {scene.content.text}
                  </p>
                </div>
              )}

              {/* 6. Anuncio Enriquecido o Tradicional */}
              {scene.type === 'announcement' && scene.content.announcement && (
                scene.content.announcement.announcement ? (
                  <AnnouncementRenderer
                    announcement={scene.content.announcement.announcement}
                    scale={1.0}
                  />
                ) : (
                  <div className="p-4 max-w-md text-center">
                    {scene.content.announcement.tag && (
                      <span className="px-2 py-0.5 bg-[#181818] border border-[#27272A] text-[#E4E4E7] text-[9px] font-mono font-bold tracking-wider mb-1.5 inline-block">
                        {scene.content.announcement.tag}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-white mb-1">
                      {scene.content.announcement.title}
                    </h3>
                    <p className="text-xs text-[#D4D4D8] font-semibold mb-0.5">
                      {scene.content.announcement.date} {scene.content.announcement.time}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA] line-clamp-2">
                      {scene.content.announcement.details}
                    </p>
                  </div>
                )
              )}

              {/* 7. Título */}
              {scene.type === 'title' && scene.content.title && (
                <div className="p-4 max-w-lg">
                  {scene.content.title.series && (
                    <span className="text-[9px] font-mono font-bold text-[#A1A1AA] uppercase tracking-widest block mb-1">
                      {scene.content.title.series}
                    </span>
                  )}
                  <h2 className="text-lg font-black text-white mb-1">
                    {scene.content.title.title}
                  </h2>
                  {scene.content.title.subtitle && (
                    <p className="text-xs italic text-txt-secondary">
                      {scene.content.title.subtitle}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 z-10 select-none">
              <div className="w-8 h-8 rounded-full border border-[#222226] bg-[#0A0A0C] flex items-center justify-center mb-2">
                <IconLive className="w-4 h-4 text-[#52525B]" />
              </div>
              <div className="text-[11px] font-mono font-bold text-[#71717A] tracking-wider uppercase">
                SALIDA LIVE EN ESPERA
              </div>
              <div className="text-[9.5px] font-mono text-[#52525B] mt-1">
                Presione [TAKE] para emitir el contenido de Preview
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};