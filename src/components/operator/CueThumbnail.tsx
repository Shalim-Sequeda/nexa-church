import React from 'react';
import { Scene } from '../../types/church';
import { useMediaSrc, handleMediaImageError, isMediaVideo } from '../../services/tauri';
import { BookOpen, Film, Megaphone, Music, FileText, Presentation } from 'lucide-react';

interface CueThumbnailProps {
  scene: Scene;
  className?: string;
}

export const CueThumbnail: React.FC<CueThumbnailProps> = React.memo(({ scene, className = 'w-14 h-8' }) => {
  const mediaPath = scene.content.media?.filePath || scene.style.backgroundImageUrl;
  const mediaSrc = useMediaSrc(mediaPath);
  const isVideo = isMediaVideo(mediaPath);

  // 1. Escena de Imagen o con Imagen de Fondo
  if (scene.type === 'image' && mediaSrc) {
    return (
      <div className={`${className} bg-black rounded-[2px] overflow-hidden shrink-0 border border-[#27272A] relative flex items-center justify-center`}>
        <img
          src={mediaSrc}
          alt={scene.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => handleMediaImageError(e, mediaPath)}
        />
      </div>
    );
  }

  // 2. Escena de Video (Renderizado ultraligero sin sobrecargar decodificadores de hardware al inicio)
  if (scene.type === 'video') {
    return (
      <div className={`${className} bg-[#0D0D10] rounded-[2px] overflow-hidden shrink-0 border border-[#27272A] relative flex flex-col items-center justify-center p-1 text-center`}>
        {mediaSrc && (
          <video
            src={mediaSrc}
            className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
            muted
            preload="metadata"
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Film className="w-3.5 h-3.5 text-amber-400 mb-0.5 shrink-0" />
          <span className="text-[6.5px] font-mono font-bold text-[#E4E4E7] truncate max-w-full leading-none">
            {scene.content.media?.fileName || scene.title}
          </span>
        </div>
      </div>
    );
  }

  // 3. Escena de Anuncio
  if (scene.type === 'announcement') {
    const ann = scene.content.announcement?.announcement;
    const bgColor = ann?.background?.type === 'color' ? ann.background.color : '#141416';
    return (
      <div
        className={`${className} rounded-[2px] overflow-hidden shrink-0 border border-[#27272A] relative flex flex-col items-center justify-center p-0.5 text-center`}
        style={{ backgroundColor: bgColor || '#121214' }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/30 p-0.5">
          <Megaphone className="w-2.5 h-2.5 text-amber-400 mb-0.5 shrink-0" />
          <span className="text-[6px] font-mono font-bold text-white truncate max-w-full leading-none">
            {ann?.name || scene.title}
          </span>
        </div>
      </div>
    );
  }

  // 4. Escena Bíblica
  if (scene.type === 'bible') {
    return (
      <div className={`${className} bg-[#0A0D14] rounded-[2px] overflow-hidden shrink-0 border border-blue-950/60 relative flex flex-col items-center justify-center p-1 text-center`}>
        {mediaSrc ? (
          isVideo ? (
            <video src={mediaSrc} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" muted preload="metadata" />
          ) : (
            <img src={mediaSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )
        ) : null}
        <div className="relative z-10 flex flex-col items-center">
          <BookOpen className="w-2.5 h-2.5 text-blue-400 mb-0.5 shrink-0" />
          <span className="text-[6.5px] font-mono font-bold text-[#E4E4E7] truncate max-w-full leading-none">
            {scene.content.bible?.reference || 'BIBLIA'}
          </span>
        </div>
      </div>
    );
  }

  // 5. Escena de Canción
  if (scene.type === 'song') {
    return (
      <div className={`${className} bg-[#100D14] rounded-[2px] overflow-hidden shrink-0 border border-purple-950/60 relative flex flex-col items-center justify-center p-1 text-center`}>
        {mediaSrc ? (
          isVideo ? (
            <video src={mediaSrc} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" muted preload="metadata" />
          ) : (
            <img src={mediaSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )
        ) : null}
        <div className="relative z-10 flex flex-col items-center">
          <Music className="w-2.5 h-2.5 text-purple-400 mb-0.5 shrink-0" />
          <span className="text-[6.5px] font-mono font-bold text-[#E4E4E7] truncate max-w-full leading-none">
            {scene.title}
          </span>
        </div>
      </div>
    );
  }

  // 6. Título o Texto Libre
  return (
    <div className={`${className} bg-[#121214] rounded-[2px] overflow-hidden shrink-0 border border-[#27272A] relative flex flex-col items-center justify-center p-1 text-center`}>
      {mediaSrc ? (
        isVideo ? (
          <video src={mediaSrc} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" muted preload="metadata" />
        ) : (
          <img src={mediaSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )
      ) : null}
      <div className="relative z-10 flex flex-col items-center">
        {scene.type === 'title' ? (
          <Presentation className="w-2.5 h-2.5 text-emerald-400 mb-0.5 shrink-0" />
        ) : (
          <FileText className="w-2.5 h-2.5 text-zinc-400 mb-0.5 shrink-0" />
        )}
        <span className="text-[6px] font-mono text-[#D4D4D8] truncate max-w-full leading-none">
          {scene.title}
        </span>
      </div>
    </div>
  );
});
