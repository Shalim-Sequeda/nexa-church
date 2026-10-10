import React from 'react';
import { FolderOpen, Film, Music, Image as ImageIcon, FileText, Plus, Eye, Play, Search, Repeat } from 'lucide-react';
import { useMediaLibrary, mediaStore } from '../../stores/mediaStore';
import { churchStore } from '../../stores/churchStore';
import { formatBytes, formatTime } from '../../utils/formatters';
import { resolveMediaUrl, handleMediaImageError } from '../../services/tauri';

export const MediaLibrary: React.FC = () => {
  const media = useMediaLibrary();

  const filteredItems = media.items.filter((item) => {
    const isGif = item.extension.toLowerCase() === 'gif';
    if (media.filterType === 'video' && item.media_type !== 'video') return false;
    if (media.filterType === 'audio' && item.media_type !== 'audio') return false;
    if (media.filterType === 'image' && item.media_type !== 'image' && !isGif) return false;
    if (media.filterType === 'gif' && !isGif) return false;
    if (media.filterType === 'pdf' && item.media_type !== 'pdf') return false;
    if (media.searchQuery.trim()) {
      const q = media.searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.extension.toLowerCase().includes(q);
    }
    return true;
  });

  const renderIcon = (type: string, ext?: string) => {
    if (ext?.toLowerCase() === 'gif') {
      return <Repeat className="w-3.5 h-3.5 text-emerald-400/90 animate-spin-slow" />;
    }
    switch (type) {
      case 'video': return <Film className="w-3.5 h-3.5 text-amber-400/80" />;
      case 'audio': return <Music className="w-3.5 h-3.5 text-[#D4D4D8]" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-purple-400/80" />;
      case 'pdf': return <FileText className="w-3.5 h-3.5 text-rose-400/80" />;
      default: return <Film className="w-3.5 h-3.5 text-[#71717A]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-9 px-3 bg-[#121212] border-b border-[#1C1C1C] flex items-center justify-between shrink-0">
        <div className="min-w-0 pr-2">
          <span className="text-[9px] font-mono font-bold tracking-wider text-[#71717A] uppercase block leading-none">
            RACK MULTIMEDIA
          </span>
          <h2 className="text-xs font-semibold text-[#F4F4F5] truncate max-w-[150px] mt-0.5">
            {media.currentFolder ? media.currentFolder.split(/[\\/]/).pop() : 'Archivos Locales'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => mediaStore.addSingleMediaFile()}
            className="flex items-center gap-1 px-2 py-1 rounded-none bg-[#181818] hover:bg-[#27272A] text-[#F4F4F5] text-[10px] font-mono uppercase tracking-wider border border-[#27272A] transition-all"
            title="Importar archivo individual (GIF animado en bucle, Video, Imagen o Audio)"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Archivo</span>
          </button>

          <button
            onClick={() => mediaStore.selectFolder()}
            className="flex items-center gap-1 px-2 py-1 rounded-none bg-[#181818] hover:bg-[#27272A] text-[#F4F4F5] text-[10px] font-mono uppercase tracking-wider border border-[#27272A] transition-all"
            title="Seleccionar carpeta local con videos, GIFs, canciones e imágenes"
          >
            <FolderOpen className="w-3 h-3 text-[#A1A1AA]" />
            <span>Carpeta</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-2 py-1.5 bg-[#080808] border-b border-[#1C1C1C] flex items-center gap-1 shrink-0 text-xs overflow-x-auto">
        <button
          onClick={() => mediaStore.setFilterType('all')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'all'
              ? 'bg-[#1C1C1C] text-[#F4F4F5] border border-[#3F3F46] font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          Todos ({media.items.length})
        </button>
        <button
          onClick={() => mediaStore.setFilterType('video')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'video'
              ? 'bg-[#1C1C1C] text-[#F4F4F5] border border-[#3F3F46] font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => mediaStore.setFilterType('gif')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'gif'
              ? 'bg-[#1C1C1C] text-emerald-400 border border-emerald-500/50 font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          GIFs (Loops)
        </button>
        <button
          onClick={() => mediaStore.setFilterType('audio')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'audio'
              ? 'bg-[#1C1C1C] text-[#F4F4F5] border border-[#3F3F46] font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => mediaStore.setFilterType('image')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'image'
              ? 'bg-[#1C1C1C] text-[#F4F4F5] border border-[#3F3F46] font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          Imágenes
        </button>
        <button
          onClick={() => mediaStore.setFilterType('pdf')}
          className={`px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
            media.filterType === 'pdf'
              ? 'bg-[#1C1C1C] text-[#F4F4F5] border border-[#3F3F46] font-bold'
              : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121212]'
          }`}
        >
          PDF
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#1C1C1C] shrink-0 bg-[#0A0A0A]">
        <div className="relative">
          <Search className="w-3 h-3 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en archivos..."
            value={media.searchQuery}
            onChange={(e) => mediaStore.setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-xs bg-[#121212] border border-[#1C1C1C] rounded-none text-[#F4F4F5] placeholder-[#52525B] focus:outline-none focus:border-[#3F3F46]"
          />
        </div>
      </div>

      {/* Media Items List */}
      <div className="flex-1 overflow-y-auto p-1 divide-y divide-[#181818]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-[#71717A] text-xs font-mono">
            No se encontraron archivos en esta categoría
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="group px-2 py-1.5 bg-transparent hover:bg-[#121212] rounded-none transition-all flex items-center justify-between gap-2 select-none"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-12 h-8 rounded bg-[#181818] border border-[#27272A] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {item.media_type === 'image' || item.extension.toLowerCase() === 'gif' ? (
                    <img
                      src={resolveMediaUrl(item.path)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        handleMediaImageError(e, item.path);
                      }}
                    />
                  ) : (
                    renderIcon(item.media_type, item.extension)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-medium text-[#F4F4F5] truncate">
                      {item.name}
                    </span>
                    {item.extension.toLowerCase() === 'gif' && (
                      <span className="px-1 py-0.2 rounded-none bg-emerald-500/15 border border-emerald-500/40 text-[8px] font-mono font-bold text-emerald-400 shrink-0">
                        LOOP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#71717A]">
                    <span className="uppercase">{item.extension}</span>
                    <span>·</span>
                    <span>{formatBytes(item.size)}</span>
                    {item.duration && (
                      <>
                        <span>·</span>
                        <span>{formatTime(item.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.media_type === 'pdf' ? (
                  <button
                    onClick={() => churchStore.importPdfToScenes(item.path)}
                    className="px-2 py-0.5 bg-[#1C1C1C] hover:bg-[#27272A] text-[#F4F4F5] text-[10px] font-mono border border-[#3F3F46] flex items-center gap-1"
                    title="Convertir todas las páginas de este PDF a Cues individuales en el proyecto"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>A Cues</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => mediaStore.addMediaToProject(item)}
                      className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1C] rounded-none"
                      title="Agregar a lista de producción"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => mediaStore.sendMediaToPreview(item)}
                      className="p-1 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C1C] rounded-none"
                      title="Cargar en PREVIEW"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => mediaStore.presentMediaDirectly(item)}
                      className="p-1 bg-[#181818] hover:bg-[#E11D48] text-[#D4D4D8] hover:text-white rounded-none border border-[#27272A] hover:border-[#E11D48] transition-colors ml-0.5"
                      title="Presentar de inmediato al proyector (Live)"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};