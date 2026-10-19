import React, { useEffect, useState, useDeferredValue, useMemo } from 'react';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconMusic,
  IconEye,
  IconTake,
} from '../common/NexaIcons';
import {
  Upload,
  ArrowLeft,
  Check,
  Image as ImageIcon,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { useSongStore, songStore } from '../../stores/songStore';
import { usePresentation } from '../../stores/presentationStore';
import { ChurchSong } from '../../types/church';
import { BACKGROUND_PRESETS } from '../../data/backgroundPresets';
import { resolveMediaUrl, openFileDialog } from '../../services/tauri';

interface FlatSlideItem {
  globalIndex: number;
  sectionId: string;
  sectionType: string;
  sectionLabel: string;
  stanzaNumber?: number;
  slideIndexInSection: number;
  totalSlidesInSection: number;
  text: string;
}

export const SongLibrary: React.FC = () => {
  const { songs, selectedSongId, searchQuery, isLoading } = useSongStore();
  const presentation = usePresentation();

  const [activeFilterTag, setActiveFilterTag] = useState<string>('TODAS');
  const [showBackgroundDrawer, setShowBackgroundDrawer] = useState<boolean>(false);
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    songStore.init();
  }, []);

  // Cancion actualmente seleccionada para el Apartado Exclusivo
  const selectedSong = useMemo(() => {
    if (!selectedSongId) return null;
    return songs.find((s) => s.id === selectedSongId) || null;
  }, [songs, selectedSongId]);

  // Lista filtrada para el listado general
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      if (activeFilterTag !== 'TODAS') {
        const matchTag = s.tags?.some((t) => t.toLowerCase() === activeFilterTag.toLowerCase());
        if (!matchTag) return false;
      }

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

  // Diapositivas aplanadas y organizadas para el Apartado Exclusivo (Holyrics)
  const flattenedSlides = useMemo<FlatSlideItem[]>(() => {
    if (!selectedSong) return [];
    const arr =
      selectedSong.arrangements.find(
        (a) => a.id === (selectedSong.defaultArrangementId || selectedSong.arrangements[0]?.id)
      ) || selectedSong.arrangements[0];

    const sequence = arr?.sequence || selectedSong.sections.map((s) => s.id);
    const secMap = new Map(selectedSong.sections.map((s) => [s.id, s]));

    const items: FlatSlideItem[] = [];
    let globalIdx = 0;

    for (const secId of sequence) {
      const sec = secMap.get(secId);
      if (sec) {
        const numMatch = sec.label.match(/\d+/);
        const stanzaNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
        const total = sec.slides.length;
        sec.slides.forEach((slideText, sIdx) => {
          items.push({
            globalIndex: globalIdx++,
            sectionId: sec.id,
            sectionType: sec.type,
            sectionLabel: sec.label,
            stanzaNumber,
            slideIndexInSection: sIdx,
            totalSlidesInSection: total,
            text: slideText,
          });
        });
      }
    }
    return items;
  }, [selectedSong]);

  // Fondos de adoración disponibles
  const worshipBackgrounds = useMemo(() => {
    return BACKGROUND_PRESETS.filter((p) => p.category === 'worship');
  }, []);

  // Determinar si la canción seleccionada está activa en Preview y en Live
  const isThisSongLive =
    presentation.liveScene?.type === 'song' &&
    (presentation.liveScene.content?.song?.songId === selectedSong?.id ||
      presentation.liveScene.title.includes(selectedSong?.title || ''));

  const liveActiveIndex = isThisSongLive
    ? presentation.liveScene?.content?.song?.activeSlideIndex ?? -1
    : -1;

  const isThisSongPreview =
    presentation.previewScene?.type === 'song' &&
    (presentation.previewScene.content?.song?.songId === selectedSong?.id ||
      presentation.previewScene.title.includes(selectedSong?.title || ''));

  const previewActiveIndex = isThisSongPreview
    ? presentation.previewScene?.content?.song?.activeSlideIndex ?? -1
    : -1;

  // Acciones
  const handleSelectSong = (song: ChurchSong) => {
    songStore.selectSong(song, true);
    setShowBackgroundDrawer(false);
  };

  const handleBackToList = () => {
    songStore.setSelectedSongId(null);
    setShowBackgroundDrawer(false);
  };

  const handleSlideClick = (globalIdx: number) => {
    if (!selectedSong) return;
    songStore.previewSong(selectedSong, undefined, undefined, globalIdx);
  };

  const handleSlideDoubleClick = (globalIdx: number) => {
    if (!selectedSong) return;
    songStore.presentSongLive(selectedSong, undefined, undefined, globalIdx);
  };

  const handlePresentLive = () => {
    if (!selectedSong) return;
    const targetIdx = previewActiveIndex >= 0 ? previewActiveIndex : 0;
    songStore.presentSongLive(selectedSong, undefined, undefined, targetIdx);
  };

  const handleSendToPreview = () => {
    if (!selectedSong) return;
    songStore.previewSong(selectedSong, undefined, undefined, 0);
  };

  const handleAddToProject = () => {
    if (!selectedSong) return;
    songStore.addSongToProject(selectedSong);
  };

  const handlePickCustomBackground = async () => {
    if (!selectedSong) return;
    const file = await openFileDialog([
      { name: 'Imágenes (*.jpg, *.png, *.webp)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
    ]);
    if (file) {
      songStore.setSongBackground(selectedSong.id, file);
    }
  };

  const currentSongBackground =
    selectedSong?.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0C] border-r border-[#1C1C1E] overflow-hidden select-none">
      {/* =========================================================================
          VISTA 1: LISTADO GENERAL LIMPIO DEL CANCIONERO (SIN CUES BULKY)
         ========================================================================= */}
      {!selectedSong ? (
        <>
          {/* Top Header: CANCIONERO + [+ NUEVA] + [IMPORTAR] */}
          <div className="h-11 px-3 bg-[#101014] border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0 flex items-center gap-2">
              <IconMusic className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold tracking-wider text-neutral-100 uppercase block leading-none">
                Cancionero de Alabanza
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => songStore.openImporter()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 transition-colors shadow-sm shrink-0"
                title="Importar canción desde texto o archivo (Auto-detección de estrofas y coros)"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Importar</span>
              </button>

              <button
                onClick={() => songStore.openEditorForCreate()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500/70 transition-colors shadow-sm shrink-0"
                title="Agregar nueva canción al repertorio"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            </div>
          </div>

          {/* Search Input & Tags */}
          <div className="p-2.5 bg-[#0D0D11] border-b border-white/[0.06] space-y-2 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => songStore.setSearchQuery(e.target.value)}
                placeholder="Buscar por título, artista, letra, tono..."
                className="w-full bg-white/[0.04] border border-white/10 px-2.5 py-1.5 pl-8 text-xs text-white placeholder-neutral-500 focus:border-red-500/70 focus:outline-none font-sans rounded-md transition-colors"
              />
              <IconSearch className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => songStore.setSearchQuery('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-white text-xs px-1"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {availableTags.map((tag) => {
                const isActive = activeFilterTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveFilterTag(tag)}
                    className={`px-2.5 py-0.5 text-[10.5px] font-medium rounded-full border transition-all shrink-0 ${
                      isActive
                        ? 'bg-red-600/20 text-red-200 border-red-500/40 shadow-sm'
                        : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean High-Density Song List (Holyrics List Pattern) */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#151518] min-h-0 bg-[#070709]">
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
                const artistName = song.artist || song.author || '';
                return (
                  <div
                    key={song.id}
                    onClick={() => handleSelectSong(song)}
                    className="group px-3 py-2 hover:bg-[#131318] cursor-pointer transition-colors flex items-center justify-between gap-2.5"
                  >
                    {/* Left: Song Title + Artist (Solo título y artista como requested) */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-sans font-semibold text-[#F4F4F5] truncate group-hover:text-red-400 transition-colors">
                        {song.title}
                      </div>
                      {artistName ? (
                        <div className="text-[10.5px] font-sans text-[#A1A1AA] truncate mt-0.5">
                          {artistName}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-[#52525B] mt-0.5">
                          Sin artista asignado
                        </div>
                      )}
                    </div>

                    {/* Right: Key Badge + Subtle Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {song.originalKey && (
                        <span
                          className="px-1.5 py-0.5 bg-[#171620] border border-purple-900/40 text-purple-300 text-[9.5px] font-mono font-bold rounded-[2px]"
                          title={`Tono: ${song.originalKey}`}
                        >
                          {song.originalKey}
                        </span>
                      )}
                      {song.tempo ? (
                        <span
                          className="px-1.5 py-0.5 bg-[#141418] border border-[#27272A] text-[#71717A] text-[9px] font-mono rounded-[2px] hidden sm:inline-block"
                          title={`Tempo: ${song.tempo} BPM`}
                        >
                          {song.tempo} BPM
                        </span>
                      ) : null}
                      <ChevronRight className="w-3.5 h-3.5 text-[#52525B] group-hover:text-neutral-300 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* =========================================================================
           VISTA 2: APARTADO EXCLUSIVO DE LA CANCIÓN (HOLYRICS STYLE)
           ========================================================================= */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0C]">
          {/* Top Bar: Volver + Título + Acciones Globales */}
          <div className="px-3 py-2.5 bg-[#101014] border-b border-white/[0.08] shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-md transition-colors shrink-0"
                title="Volver a la lista de canciones (Esc)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancionero</span>
              </button>

              {/* Tono & Tempo badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedSong.originalKey && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 border border-purple-500/25 text-purple-300">
                    Tono {selectedSong.originalKey}
                  </span>
                )}
                {selectedSong.tempo ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.05] border border-white/10 text-neutral-300">
                    {selectedSong.tempo} BPM
                  </span>
                ) : null}
              </div>
            </div>

            {/* Song Title and Artist */}
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white tracking-tight truncate leading-snug">
                {selectedSong.title}
              </h3>
              {(selectedSong.artist || selectedSong.author) && (
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  {selectedSong.artist || selectedSong.author}
                </p>
              )}
            </div>

            {/* Quick Action Toolbar */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              {/* Fila 1: Control de Emisión (Preview y En Vivo) */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Botón PREVIEW */}
                <button
                  type="button"
                  onClick={handleSendToPreview}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    isThisSongPreview && !isThisSongLive
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                  title="Cargar esta canción en pantalla Preview"
                >
                  <IconEye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Preview</span>
                </button>

                {/* Botón EN VIVO */}
                <button
                  type="button"
                  onClick={handlePresentLive}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-500 border border-red-500/80 whitespace-nowrap transition-colors"
                  title="Presentar canción seleccionada en vivo (Enter / Take)"
                >
                  <IconTake className="w-3.5 h-3.5 shrink-0" />
                  <span>En Vivo</span>
                </button>
              </div>

              {/* Fila 2: Herramientas (+ Cue, Fondo, Editar) */}
              <div className="flex items-center gap-1.5">
                {/* Botón + CUE */}
                <button
                  type="button"
                  onClick={handleAddToProject}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/[0.03] hover:bg-white/[0.07] text-neutral-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors"
                  title="Agregar a la lista de Cues del servicio"
                >
                  <IconPlus className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>+ Cue</span>
                </button>

                {/* Botón Selector de Fondo */}
                <button
                  type="button"
                  onClick={() => setShowBackgroundDrawer(!showBackgroundDrawer)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium border whitespace-nowrap transition-colors ${
                    showBackgroundDrawer
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                  title="Configurar fondo visual para esta alabanza"
                >
                  <ImageIcon className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Fondo</span>
                </button>

                {/* Botón Editar Canción */}
                <button
                  type="button"
                  onClick={() => songStore.openEditorForEdit(selectedSong)}
                  className="inline-flex items-center justify-center p-1.5 rounded bg-white/[0.03] hover:bg-white/[0.07] text-neutral-400 hover:text-white border border-white/10 transition-colors shrink-0"
                  title="Editar letra, estructura y metadatos de la canción"
                >
                  <IconEdit className="w-3 h-3 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Panel Desplegable: Selector de Fondo de Adoración */}
          {showBackgroundDrawer && (
            <div className="p-3 bg-[#111218] border-b border-white/[0.08] shrink-0 space-y-2.5 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
                <span className="text-neutral-200">
                  Fondo de Adoración para esta canción:
                </span>
                <button
                  onClick={handlePickCustomBackground}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 border border-white/10 transition-colors"
                  title="Seleccionar una imagen personalizada desde tu computadora"
                >
                  <FolderOpen className="w-3 h-3 text-neutral-400" />
                  <span>Desde Mi PC...</span>
                </button>
              </div>

              {/* Grid de fondos de adoración */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {worshipBackgrounds.map((preset) => {
                  const isCurrent = currentSongBackground === preset.path;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => songStore.setSongBackground(selectedSong.id, preset.path)}
                      className={`relative aspect-video rounded-md overflow-hidden border transition-all ${
                        isCurrent
                          ? 'border-red-500 ring-2 ring-red-500/50 shadow-md scale-[1.02] z-10'
                          : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={resolveMediaUrl(preset.path)}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Presentation Slide Matrix (Holyrics Style) */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0 bg-[#070709]">
            {flattenedSlides.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 font-sans">
                Esta canción no contiene diapositivas de texto.
              </div>
            ) : (
              flattenedSlides.map((slide) => {
                const isLive = isThisSongLive && liveActiveIndex === slide.globalIndex;
                const isPreview = isThisSongPreview && previewActiveIndex === slide.globalIndex;

                const isPreChorus =
                  slide.sectionType === 'pre-chorus' ||
                  slide.sectionLabel.toLowerCase().includes('pre-coro') ||
                  slide.sectionLabel.toLowerCase().includes('precoro') ||
                  slide.sectionLabel.toLowerCase().includes('pre-chorus');

                const isChorus =
                  !isPreChorus &&
                  (slide.sectionType === 'chorus' ||
                    slide.sectionLabel.toLowerCase().startsWith('coro') ||
                    slide.sectionLabel.toLowerCase().includes('estribillo') ||
                    slide.sectionLabel.toLowerCase().includes('chorus'));

                const isBridge =
                  slide.sectionType === 'bridge' ||
                  slide.sectionLabel.toLowerCase().includes('puente') ||
                  slide.sectionLabel.toLowerCase().includes('bridge');

                // Si la sección contiene múltiples diapositivas, mostrar el indicador de parte (1/2, 2/2)
                const isMultiSlide = slide.totalSlidesInSection > 1;
                const partLabel = isMultiSlide
                  ? ` (${slide.slideIndexInSection + 1}/${slide.totalSlidesInSection})`
                  : '';
                const displaySectionLabel = `${slide.sectionLabel}${partLabel}`;

                // Tecla de atajo inteligente Holyrics: la primera diapositiva lleva la tecla directa,
                // las siguientes indican que presionando la misma tecla o Flecha Abajo se avanza.
                let keyHint: string | null = null;
                if (isChorus) {
                  keyHint = slide.slideIndexInSection === 0 ? 'C' : 'C ó ↓';
                } else if (isPreChorus) {
                  keyHint = slide.slideIndexInSection === 0 ? 'R' : 'R ó ↓';
                } else if (isBridge) {
                  keyHint = slide.slideIndexInSection === 0 ? 'P' : 'P ó ↓';
                } else if (slide.stanzaNumber) {
                  keyHint = slide.slideIndexInSection === 0 ? `${slide.stanzaNumber}` : `${slide.stanzaNumber} ó ↓`;
                }

                return (
                  <div
                    key={`slide-${slide.sectionId}-${slide.globalIndex}`}
                    onClick={() => handleSlideClick(slide.globalIndex)}
                    onDoubleClick={() => handleSlideDoubleClick(slide.globalIndex)}
                    className={`relative p-3 rounded-lg border transition-all cursor-pointer group select-none ${
                      isLive
                        ? 'bg-red-950/20 border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
                        : isPreview
                        ? 'bg-blue-950/25 border-blue-500/70 shadow-[0_0_14px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/40'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.07] hover:border-white/20'
                    }`}
                  >
                    {/* Header de la Diapositiva: Sección + Tecla + Estado */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                            isChorus
                              ? 'bg-purple-950/50 text-purple-200 border-purple-800/60'
                              : isPreChorus
                              ? 'bg-amber-950/50 text-amber-200 border-amber-800/60'
                              : isBridge
                              ? 'bg-blue-950/50 text-blue-200 border-blue-800/60'
                              : 'bg-white/[0.06] text-neutral-200 border-white/10'
                          }`}
                        >
                          {displaySectionLabel}
                        </span>

                        {keyHint && (
                          <span
                            className="px-1.5 py-0.5 bg-white/[0.05] text-neutral-300 border border-white/10 text-[9.5px] font-mono rounded"
                            title={
                              slide.slideIndexInSection === 0
                                ? `Presiona [${keyHint}] para saltar al inicio de esta sección`
                                : `Presiona [${keyHint}] o Flecha Abajo para avanzar a esta parte`
                            }
                          >
                            Tecla: {keyHint}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isLive && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-wide bg-red-600 text-white rounded shadow-sm animate-pulse">
                            ● EN VIVO
                          </span>
                        )}
                        {isPreview && !isLive && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-wide bg-blue-600 text-white rounded">
                            ● PREVIEW
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          #{slide.globalIndex + 1}
                        </span>
                      </div>
                    </div>

                    {/* Texto de la diapositiva */}
                    <div className="text-xs font-sans text-neutral-200 whitespace-pre-line leading-relaxed group-hover:text-white transition-colors">
                      {slide.text}
                    </div>

                    {/* Botón flotante para Pasar a Live directamente al hacer hover */}
                    <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSlideDoubleClick(slide.globalIndex);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-semibold rounded shadow transition-all active:scale-95"
                        title="Enviar directamente a Live"
                      >
                        Live
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* In-Context Keyboard Shortcuts Bar (Holyrics Cheatsheet) */}
          <div className="px-3 py-2 bg-[#0B0C10] border-t border-white/[0.08] shrink-0 flex items-center justify-between text-xs text-neutral-400 font-sans">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">C</kbd> Coro</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">R</kbd> Pre-Coro</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">1-9</kbd> Estrofas</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">P</kbd> Puente</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">↓ / Espacio</kbd> Siguiente</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/[0.08] text-neutral-200 border border-white/10 rounded font-mono text-[10px]">Enter</kbd> Take (Live)</span>
            </div>
            <button
              onClick={handleBackToList}
              className="text-neutral-400 hover:text-white text-xs ml-2 shrink-0 transition-colors"
              title="Cerrar y volver al cancionero"
            >
              [Esc] Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
