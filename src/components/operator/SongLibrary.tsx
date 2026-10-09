import React, { useEffect, useState, useDeferredValue, useMemo } from 'react';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDuplicate,
  IconMusic,
  IconEye,
  IconTake,
} from '../common/NexaIcons';
import { useSongStore, songStore } from '../../stores/songStore';
import { ChurchSong } from '../../types/church';

export const SongLibrary: React.FC = () => {
  const { songs, searchQuery, isLoading } = useSongStore();
  const [activeFilterTag, setActiveFilterTag] = useState<string>('TODAS');
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    songStore.init();
  }, []);

  // Filtrado reactivo optimizado
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      // Filtro por etiqueta
      if (activeFilterTag !== 'TODAS') {
        const matchTag = s.tags?.some((t) => t.toLowerCase() === activeFilterTag.toLowerCase());
        if (!matchTag) return false;
      }

      // Filtro por búsqueda
      if (deferredSearch.trim()) {
        const q = deferredSearch.toLowerCase();
        const inTitle = s.title.toLowerCase().includes(q);
        const inArtist = s.artist?.toLowerCase().includes(q) ?? false;
        const inAuthor = s.author?.toLowerCase().includes(q) ?? false;
        const inKey = s.originalKey?.toLowerCase() === q;
        const inLyrics = s.sections.some((sec) =>
          sec.slides.some((slide) => slide.toLowerCase().includes(q))
        );
        return inTitle || inArtist || inAuthor || inKey || inLyrics;
      }

      return true;
    });
  }, [songs, activeFilterTag, deferredSearch]);

  const availableTags = ['TODAS', 'ALABANZA', 'ADORACIÓN', 'HIMNO'];

  const handleAddToProject = (song: ChurchSong, e: React.MouseEvent) => {
    e.stopPropagation();
    songStore.addSongToProject(song);
  };

  const handlePreview = (song: ChurchSong, e: React.MouseEvent) => {
    e.stopPropagation();
    songStore.previewSong(song);
  };

  const handleLive = (song: ChurchSong, e: React.MouseEvent) => {
    e.stopPropagation();
    songStore.presentSongLive(song);
  };

  const handleEdit = (song: ChurchSong, e: React.MouseEvent) => {
    e.stopPropagation();
    songStore.openEditorForEdit(song);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    songStore.duplicateSong(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta canción del cancionero?')) {
      songStore.deleteSong(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0C] border-r border-[#1C1C1E] overflow-hidden select-none">
      {/* Top Header: CANCIONERO + [+ NUEVA] */}
      <div className="h-11 px-3 bg-[#101012] border-b border-[#1C1C1E] flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex items-center gap-1.5">
          <IconMusic className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase block leading-none">
            CANCIONERO DE ALABANZA
          </span>
        </div>

        <button
          onClick={() => songStore.openEditorForCreate()}
          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold border border-red-500 rounded-[2px] transition-all flex items-center gap-1 shadow-sm shrink-0"
          title="Agregar nueva canción al repertorio"
        >
          <IconPlus className="w-3 h-3" />
          <span>NUEVA</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 bg-[#0D0D10] border-b border-[#1C1C1E] space-y-2 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => songStore.setSearchQuery(e.target.value)}
            placeholder="Buscar por título, letra, artista, tono..."
            className="w-full bg-[#141418] border border-[#27272A] px-2.5 py-1.5 pl-8 text-xs text-white placeholder-[#71717A] focus:border-red-600 focus:outline-none font-sans"
          />
          <IconSearch className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => songStore.setSearchQuery('')}
              className="absolute right-2 top-2 text-[#71717A] hover:text-white text-xs px-1"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {availableTags.map((tag) => {
            const isActive = activeFilterTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveFilterTag(tag)}
                className={`px-2 py-0.5 text-[9px] font-mono font-medium rounded-[2px] border transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[#222228] text-white border-red-600'
                    : 'bg-[#101014] text-[#A1A1AA] border-[#222228] hover:text-white hover:bg-[#16161C]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 bg-[#070709]">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-xs font-mono text-[#71717A]">
            Cargando cancionero...
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <IconMusic className="w-8 h-8 text-[#3F3F46] mb-2" />
            <p className="text-xs font-mono text-[#71717A] mb-1">
              No se encontraron canciones
            </p>
            <p className="text-[10px] text-[#52525B]">
              {searchQuery ? 'Prueba con otra palabra clave o autor' : 'Agrega tu primera canción'}
            </p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            return (
              <div
                key={song.id}
                className="bg-[#0E0E12] hover:bg-[#131318] border border-[#1C1C22] hover:border-[#2D2D36] p-2.5 rounded-[2px] transition-all space-y-2 group"
              >
                {/* Header: Title + Key/Tempo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-sans font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {song.title}
                    </h4>
                    {(song.artist || song.author) && (
                      <p className="text-[10.5px] font-sans text-[#A1A1AA] truncate mt-0.5">
                        {song.artist || song.author}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {song.originalKey && (
                      <span className="px-1.5 py-0.5 bg-[#1B1924] border border-purple-900/40 text-purple-300 text-[9.5px] font-mono font-bold rounded-[2px]" title={`Tono: ${song.originalKey}`}>
                        {song.originalKey}
                      </span>
                    )}
                    {song.tempo ? (
                      <span className="px-1.5 py-0.5 bg-[#141418] border border-[#27272A] text-[#A1A1AA] text-[9px] font-mono rounded-[2px]" title={`Tempo: ${song.tempo} BPM`}>
                        {song.tempo} BPM
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Section badges preview */}
                <div className="flex flex-wrap gap-1 items-center">
                  {song.sections.map((sec) => {
                    const isChorus = sec.type === 'chorus';
                    const isBridge = sec.type === 'bridge';
                    const pillClass = isChorus
                      ? 'bg-purple-950/40 text-purple-300 border-purple-900/50 hover:bg-purple-900/60'
                      : isBridge
                      ? 'bg-blue-950/40 text-blue-300 border-blue-900/50 hover:bg-blue-900/60'
                      : 'bg-[#16161C] text-[#A1A1AA] border-[#222228] hover:bg-[#202028] hover:text-white';

                    return (
                      <button
                        key={sec.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          songStore.previewSong(song, undefined, sec.id);
                        }}
                        className={`px-1.5 py-0.5 text-[8.5px] font-mono border rounded-[2px] transition-colors ${pillClass}`}
                        title={`Vista previa directa de: ${sec.label}`}
                      >
                        {sec.label}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#18181E]">
                  <div className="flex items-center gap-1">
                    {/* + CUE */}
                    <button
                      onClick={(e) => handleAddToProject(song, e)}
                      className="px-2 py-1 bg-[#1A1A22] hover:bg-[#262634] text-white text-[10px] font-mono font-bold border border-[#2E2E3C] rounded-[2px] transition-colors flex items-center gap-1"
                      title="Agregar esta canción como Cues a la lista de producción activa"
                    >
                      <IconPlus className="w-2.5 h-2.5" />
                      <span>+ CUE</span>
                    </button>

                    {/* PREVIEW */}
                    <button
                      onClick={(e) => handlePreview(song, e)}
                      className="px-2 py-1 bg-[#121216] hover:bg-[#1A1A20] text-[#D4D4D8] hover:text-white text-[10px] font-mono border border-[#222228] rounded-[2px] transition-colors flex items-center gap-1"
                      title="Inspeccionar en monitor Preview"
                    >
                      <IconEye className="w-2.5 h-2.5" />
                      <span>PREVIEW</span>
                    </button>

                    {/* LIVE */}
                    <button
                      onClick={(e) => handleLive(song, e)}
                      className="px-2 py-1 bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white text-[10px] font-mono font-bold border border-red-900/60 rounded-[2px] transition-colors flex items-center gap-1"
                      title="Enviar directamente a pantalla Live"
                    >
                      <IconTake className="w-2.5 h-2.5" />
                      <span>LIVE</span>
                    </button>
                  </div>

                  {/* Secondary CRUD actions */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleEdit(song, e)}
                      className="p-1 text-[#71717A] hover:text-white hover:bg-[#1A1A20] transition-colors rounded-[2px]"
                      title="Editar canción, secciones o arreglos"
                    >
                      <IconEdit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(song.id, e)}
                      className="p-1 text-[#71717A] hover:text-white hover:bg-[#1A1A20] transition-colors rounded-[2px]"
                      title="Duplicar canción"
                    >
                      <IconDuplicate className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(song.id, e)}
                      className="p-1 text-[#71717A] hover:text-red-400 hover:bg-[#1A1A20] transition-colors rounded-[2px]"
                      title="Eliminar del cancionero"
                    >
                      <IconTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
