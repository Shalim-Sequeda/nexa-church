import React from 'react';
import { Announcement, TextLayer, ImageLayer } from '../../types/church';
import { resolveMediaUrl, handleMediaImageError } from '../../services/tauri';

interface AnnouncementRendererProps {
  announcement: Announcement;
  /** Escala relativa o tamaño si se necesita ajustar al contenedor (por defecto 1.0) */
  scale?: number;
  className?: string;
}

export const AnnouncementRenderer: React.FC<AnnouncementRendererProps> = ({
  announcement,
  scale = 1.0,
  className = '',
}) => {
  const bg = announcement.background;

  return (
    <div
      className={`w-full h-full relative overflow-hidden flex items-center justify-center select-none [container-type:inline-size] ${className}`}
      style={{
        backgroundColor: bg?.type === 'color' && bg.color ? bg.color : '#050505',
      }}
    >
      {/* 1. Fondo de Anuncio */}
      {bg?.type === 'image' && bg.filePath && (
        <img
          src={resolveMediaUrl(bg.filePath)}
          alt="Fondo de anuncio"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            handleMediaImageError(e, bg.filePath);
          }}
        />
      )}

      {/* 2. Capas de Contenido (Textos e Imágenes/Logos) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {announcement.layers.map((layer) => {
          if (layer.type === 'text') {
            const textLayer = layer as TextLayer;
            const alignClass =
              textLayer.alignment === 'left'
                ? 'text-left items-start'
                : textLayer.alignment === 'right'
                ? 'text-right items-end'
                : 'text-center items-center';

            // Escala relativa exacta usando Container Query Units (cqw)
            // (fontSize base / 19.2) equivale a porcentaje directo respecto a 1080p panorámico
            const responsiveFontSize = `${(textLayer.fontSize / 19.2) * scale}cqw`;

            return (
              <div
                key={textLayer.id}
                className={`absolute flex flex-col justify-center leading-tight transition-transform ${alignClass}`}
                style={{
                  left: `${textLayer.x}%`,
                  top: `${textLayer.y}%`,
                  width: textLayer.width ? `${textLayer.width}%` : 'auto',
                  maxWidth: '96%',
                  transform: 'translate(-50%, -50%)',
                  color: textLayer.color || '#FFFFFF',
                  fontFamily: textLayer.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: responsiveFontSize,
                  fontWeight:
                    textLayer.fontWeight === 'black'
                      ? 900
                      : textLayer.fontWeight === 'bold'
                      ? 700
                      : textLayer.fontWeight === 'medium'
                      ? 500
                      : 400,
                  textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.95)',
                  whiteSpace: 'pre-line',
                }}
              >
                <span>{textLayer.text}</span>
              </div>
            );
          }

          if (layer.type === 'image') {
            const imgLayer = layer as ImageLayer;
            return (
              <div
                key={imgLayer.id}
                className="absolute flex items-center justify-center transition-transform"
                style={{
                  left: `${imgLayer.x}%`,
                  top: `${imgLayer.y}%`,
                  width: `${imgLayer.width}%`,
                  transform: 'translate(-50%, -50%)',
                  opacity: imgLayer.opacity !== undefined ? imgLayer.opacity : 1,
                }}
              >
                <img
                  src={resolveMediaUrl(imgLayer.filePath)}
                  alt={imgLayer.fileName || 'Logo de anuncio'}
                  className="w-full h-auto object-contain max-h-full drop-shadow-md"
                  onError={(e) => {
                    handleMediaImageError(e, imgLayer.filePath);
                  }}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
