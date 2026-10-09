import React from 'react';
import { Video } from 'lucide-react';
import { IconEye, IconTake } from '../common/NexaIcons';
import { usePresentation, presentationStore } from '../../stores/presentationStore';
import { resolveMediaUrl, handleMediaImageError } from '../../services/tauri';
import { AnnouncementRenderer } from './AnnouncementRenderer';
import { getBibleDynamicFontSizes, getSongDynamicFontSizes } from '../../utils/bibleTypography';

export const PreviewMonitor: React.FC = () => {
  const presentation = usePresentation();
  const scene = presentation.previewScene;

  const handlePresent = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    presentationStore.presentPreview();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C] border border-[#1C1C1E] overflow-hidden">
      {/* Studio Header Bar */}
      <div className="h-10 px-3 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconEye className="w-4 h-4 text-zinc-300 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase leading-none">
              PREVIEW
            </span>
            <span className="text-[10px] font-mono text-[#A1A1AA] truncate mt-0.5">
              {scene ? `▾ ${scene.title}` : '▾ Ninguna escena'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-[#52525B]">
            1920 × 1080 16:9
          </span>
          <button
            onClick={handlePresent}
            disabled={!scene}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-mono font-bold tracking-wider rounded-[2px] transition-colors border select-none ${
              scene
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.35)] active:translate-y-px cursor-pointer'
                : 'bg-[#181818] text-[#71717A] border-[#27272A] cursor-not-allowed opacity-60'
            }`}
            title="Presentar escena en Live (Enter)"
          >
            <span>TAKE</span>
            <IconTake className="w-3 h-3 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Broadcast 16:9 Canvas Area */}
      <div className="flex-1 min-h-0 relative bg-[#000000] flex items-center justify-center p-3 overflow-hidden">
        <div
          className={`w-full aspect-video max-h-full relative flex items-center justify-center text-center select-none overflow-hidden [container-type:inline-size] ${
            scene ? 'rounded-sm border border-white/10' : 'border border-[#1C1C1F] bg-[#050507]'
          }`}
          style={{
            backgroundColor: scene?.style?.backgroundColor || (scene ? '#090A0E' : '#050507'),
            backgroundImage: scene?.style?.backgroundImageUrl ? `url(${resolveMediaUrl(scene.style.backgroundImageUrl)})` : undefined,
            backgroundSize: 'cover',
          }}
        >
          {/* Aspect Ratio Safe Area Marker (discreet studio crosshairs) */}
          <div className="absolute inset-2 border border-white/5 pointer-events-none z-20" />

          {scene ? (
            <>

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
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
                <div className="w-8 h-8 bg-[#181818] border border-[#27272A] flex items-center justify-center text-[#E4E4E7] mb-1.5">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white truncate max-w-xs">
                  {scene.content.media.fileName}
                </span>
                <span className="text-[10px] text-txt-muted mt-0.5">
                  Listo para iniciar desde 00:00
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

            {/* 8. Negro */}
            {scene.type === 'black' && (
              <span className="text-[10px] font-mono text-txt-muted uppercase tracking-wider">
                [ Salida en Negro ]
              </span>
            )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 z-10 select-none">
              <div className="w-8 h-8 rounded-full border border-[#222226] bg-[#0A0A0C] flex items-center justify-center mb-2">
                <IconEye className="w-4 h-4 text-[#52525B]" />
              </div>
              <div className="text-[11px] font-mono font-bold text-[#71717A] tracking-wider uppercase">
                MONITOR PREVIEW EN ESPERA
              </div>
              <div className="text-[9.5px] font-mono text-[#52525B] mt-1">
                Seleccione una escena o versículo para previsualizar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};