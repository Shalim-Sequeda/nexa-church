import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  Play,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  Grid,
} from 'lucide-react';
import { useBible, bibleStore } from '../../stores/bibleStore';
import { BIBLE_BOOKS, getChapterVerseCount, parseBibleReference } from '../../data/bibleData';
import { resolveMediaUrl } from '../../services/tauri';
import { BACKGROUND_PRESETS, BACKGROUND_CATEGORIES } from '../../data/backgroundPresets';

export const BibleBrowser: React.FC = () => {
  const bible = useBible();

  // Versiones instaladas dinámicamente
  const allVersions = useMemo(() => bibleStore.getAllVersions(), [bible.customVersions, bible.currentVersion]);

  // Versículos de la versión activa para calcular conteo de versículos
  const customVerses = bible.isCustomVersion
    ? bible.customVersions[bible.currentVersion.id]?.verses
    : undefined;

  const verseCount = getChapterVerseCount(
    bible.selectedBook.name,
    bible.selectedChapter,
    customVerses
  );

  // --- ESTADO Y CONTROL DEL CAMPO LIBRO ---
  const [bookQuery, setBookQuery] = useState(bible.selectedBook.name);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [bookHighlightedIndex, setBookHighlightedIndex] = useState(0);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar texto de libro si cambia externamente
  useEffect(() => {
    setBookQuery(bible.selectedBook.name);
  }, [bible.selectedBook.name]);

  // Cerrar dropdown de libro al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bookContainerRef.current && !bookContainerRef.current.contains(e.target as Node)) {
        setIsBookDropdownOpen(false);
        setBookQuery(bible.selectedBook.name);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bible.selectedBook.name]);

  // Filtrado tolerante de libros (sin acentos, minúsculas, por nombre o abreviaturas)
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const filteredBooks = useMemo(() => {
    const query = normalize(bookQuery);
    if (!query) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((b) => {
      const normName = normalize(b.name);
      if (normName.includes(query)) return true;
      return b.abbreviations.some((abbr) => normalize(abbr).includes(query));
    });
  }, [bookQuery]);

  const handleSelectBook = (bookId: string) => {
    bibleStore.setBook(bookId);
    const selected = BIBLE_BOOKS.find((b) => b.id === bookId);
    if (selected) {
      setBookQuery(selected.name);
    }
    setIsBookDropdownOpen(false);
  };

  const handleBookKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsBookDropdownOpen(true);
      setBookHighlightedIndex((prev) => Math.min(prev + 1, filteredBooks.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsBookDropdownOpen(true);
      setBookHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = parseBibleReference(bookQuery);
      if (parsed) {
        bibleStore.searchReference(bookQuery);
        setIsBookDropdownOpen(false);
        return;
      }

      if (filteredBooks.length > 0 && bookHighlightedIndex < filteredBooks.length) {
        handleSelectBook(filteredBooks[bookHighlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      setIsBookDropdownOpen(false);
      setBookQuery(bible.selectedBook.name);
    }
  };

  // --- ESTADO Y CONTROL MANUAL DE CAPÍTULO Y VERSÍCULO ---
  const [chapterRaw, setChapterRaw] = useState(String(bible.selectedChapter));
  const [verseRaw, setVerseRaw] = useState(String(bible.selectedVerse));

  // --- ESTADO DE MODAL DE FONDOS PREDETERMINADOS ---
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setChapterRaw(String(bible.selectedChapter));
  }, [bible.selectedChapter]);

  useEffect(() => {
    setVerseRaw(String(bible.selectedVerse));
  }, [bible.selectedVerse]);

  const maxChapters = bible.selectedBook.chapters;

  const handleChapterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setChapterRaw(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= maxChapters) {
      bibleStore.setChapter(parsed);
    }
  };

  const handleChapterBlur = () => {
    const parsed = parseInt(chapterRaw, 10);
    if (isNaN(parsed) || parsed < 1) {
      bibleStore.setChapter(1);
      setChapterRaw('1');
    } else if (parsed > maxChapters) {
      bibleStore.setChapter(maxChapters);
      setChapterRaw(String(maxChapters));
    } else {
      bibleStore.setChapter(parsed);
    }
  };

  const handleVerseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setVerseRaw(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= verseCount) {
      bibleStore.setVerse(parsed);
    }
  };

  const handleVerseBlur = () => {
    const parsed = parseInt(verseRaw, 10);
    if (isNaN(parsed) || parsed < 1) {
      bibleStore.setVerse(1);
      setVerseRaw('1');
    } else if (parsed > verseCount) {
      bibleStore.setVerse(verseCount);
      setVerseRaw(String(verseCount));
    } else {
      bibleStore.setVerse(parsed);
    }
  };

  const isChapterInvalid = Boolean(
    chapterRaw && (parseInt(chapterRaw, 10) > maxChapters || parseInt(chapterRaw, 10) < 1)
  );

  const isVerseInvalid = Boolean(
    verseRaw && (parseInt(verseRaw, 10) > verseCount || parseInt(verseRaw, 10) < 1)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08090C] overflow-hidden select-none">
      {/* 1. Header Principal (Fijo) */}
      <div className="px-3 py-2 bg-[#0F1014] border-b border-[#1E2029] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-mono font-bold text-[#F4F4F5] uppercase tracking-wider">
            MOTOR BÍBLICO
          </h2>
        </div>
        <button
          onClick={() => bibleStore.importBibleFile()}
          className="flex items-center gap-1.5 px-2 py-1 bg-[#14161C] hover:bg-[#1E2028] text-[10px] font-mono text-[#A0A4B4] hover:text-[#F4F4F5] border border-[#242732] rounded transition-colors"
          title="Importar traducción bíblica personalizada desde archivo .bi o JSON"
        >
          <Upload className="w-3 h-3 text-[#A0A4B4]" />
          <span>Importar Biblia (.bi / .json)</span>
        </button>
      </div>

      {/* 2. SECCIÓN: VERSIÓN (Espacio determinado con su propio scroll interno) */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#1A1C24] shrink-0 space-y-1.5 bg-[#090A0E]">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold text-[#8E92A2] uppercase tracking-wider">
            VERSIÓN
          </span>
          <div className="w-6 h-[2px] bg-red-600 rounded-full mt-0.5 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
        </div>

        {/* Cuadrícula de Versiones con scroll propio independiente */}
        <div className="grid grid-cols-4 gap-1.5 max-h-[118px] overflow-y-auto pr-0.5 custom-scrollbar">
          {allVersions.map((v) => {
            const isActive = bible.currentVersion.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => bibleStore.setVersion(v.id)}
                className={`h-10 px-1 flex flex-col items-center justify-center rounded border transition-all text-center overflow-hidden ${
                  isActive
                    ? 'bg-[#1A0E13] border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] text-white'
                    : 'bg-[#101116] border-[#1E2028] text-[#8E92A2] hover:bg-[#161820] hover:border-[#2F3240] hover:text-[#EDEDED]'
                }`}
                title={`${v.name} (${v.id})`}
              >
                <span className="text-[10.5px] font-mono font-bold tracking-tight truncate w-full px-0.5">
                  {v.shortName}
                </span>
                <span
                  className={`text-[8.5px] font-mono tracking-wider truncate w-full px-0.5 ${
                    isActive ? 'text-red-400 font-semibold' : 'text-[#626676]'
                  }`}
                >
                  {v.subLabel}
                </span>
              </button>
            );
          })}

          {/* Botón dinámico: Agregar versión */}
          <button
            onClick={() => bibleStore.importBibleFile()}
            className="h-10 px-1 flex flex-col items-center justify-center rounded border border-dashed border-[#262834] hover:border-red-500/60 bg-transparent hover:bg-[#16171E] text-[#828696] hover:text-[#EDEDED] transition-all text-center"
            title="Importar y añadir nueva versión bíblica (.bi / .json)"
          >
            <div className="flex items-center gap-1">
              <Plus className="w-3 h-3 text-[#828696]" />
              <span className="text-[9.5px] font-mono font-medium leading-tight">
                Agregar versión
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN: DESDE REFERENCIA HACIA ABAJO (Desplazamiento independiente para interactuar y acceder a los botones) */}
      <div className="flex-1 min-h-0 flex flex-col p-3 pt-2 gap-2.5 overflow-y-auto custom-scrollbar">
        {/* REFERENCIA */}
        <div className="shrink-0 space-y-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-[#8E92A2] uppercase tracking-wider">
              REFERENCIA
            </span>
            <div className="w-6 h-[2px] bg-red-600 rounded-full mt-0.5 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
          </div>

          {/* Campo LIBRO con búsqueda y autocompletado */}
          <div className="space-y-1" ref={bookContainerRef}>
            <label className="text-[9px] font-mono font-semibold text-[#6E7282] uppercase tracking-wider block">
              LIBRO
            </label>
            <div className="relative">
              <div
                className={`flex items-center bg-[#0F1014] border ${
                  isBookDropdownOpen ? 'border-red-500/80' : 'border-[#20222B]'
                } rounded h-8 transition-colors`}
              >
                <Search className="w-3.5 h-3.5 text-[#636778] ml-2.5 shrink-0" />
                <input
                  ref={bookInputRef}
                  type="text"
                  value={bookQuery}
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    setIsBookDropdownOpen(true);
                    setBookHighlightedIndex(0);
                  }}
                  onFocus={() => {
                    setIsBookDropdownOpen(true);
                  }}
                  onKeyDown={handleBookKeyDown}
                  placeholder="Buscar libro (ej. Salmos, Mateo, Juan)..."
                  className="w-full bg-transparent px-2.5 text-xs text-[#F2F3F5] placeholder-[#555866] focus:outline-none font-sans"
                />

                {bookQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookQuery('');
                      setIsBookDropdownOpen(true);
                      bookInputRef.current?.focus();
                    }}
                    className="p-1 text-[#636778] hover:text-white transition-colors"
                    title="Limpiar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsBookDropdownOpen(!isBookDropdownOpen)}
                  className="p-1.5 mr-1 text-[#636778] hover:text-white transition-colors"
                  title="Abrir catálogo de libros"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBookDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Lista Desplegable de Coincidencias */}
              {isBookDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0F1014] border border-[#20222B] shadow-2xl max-h-48 overflow-y-auto z-40 rounded custom-scrollbar">
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map((b, idx) => {
                      const isSelected = b.id === bible.selectedBook.id;
                      const isHighlighted = idx === bookHighlightedIndex;
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleSelectBook(b.id)}
                          onMouseEnter={() => setBookHighlightedIndex(idx)}
                          className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-red-950/70 border-l-2 border-red-500 text-white font-semibold'
                              : isHighlighted
                              ? 'bg-[#181920] text-white'
                              : 'text-[#A0A4B4] hover:bg-[#181920] hover:text-white'
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] font-mono text-[#6A6E7E]">
                            ({b.chapters} caps.)
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-2.5 text-center text-xs text-[#6A6E7E] font-sans">
                      No se encontraron libros coincidentes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fila: CAPÍTULO y VERSÍCULO */}
          <div className="grid grid-cols-2 gap-2">
            {/* Campo CAPÍTULO */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-semibold text-[#6E7282] uppercase tracking-wider block">
                  CAPÍTULO
                </label>
                <span className="text-[9px] font-mono text-[#555866]">
                  1-{maxChapters}
                </span>
              </div>
              <div
                className={`relative flex items-center bg-[#0F1014] border ${
                  isChapterInvalid ? 'border-red-500' : 'border-[#20222B] focus-within:border-red-500/60'
                } rounded overflow-hidden h-8`}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={chapterRaw}
                  onChange={handleChapterInputChange}
                  onBlur={handleChapterBlur}
                  className="w-full bg-transparent px-2.5 text-xs text-[#F2F3F5] focus:outline-none font-mono font-semibold"
                />
                <div className="flex flex-col border-l border-[#20222B] shrink-0 h-full w-5 bg-[#14151B]">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const next = Math.min(bible.selectedChapter + 1, maxChapters);
                      bibleStore.setChapter(next);
                    }}
                    disabled={bible.selectedChapter >= maxChapters}
                    className="flex-1 flex items-center justify-center text-[#828696] hover:text-white hover:bg-[#1E202A] disabled:opacity-25 border-b border-[#20222B]"
                    title="Capítulo siguiente"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const next = Math.max(bible.selectedChapter - 1, 1);
                      bibleStore.setChapter(next);
                    }}
                    disabled={bible.selectedChapter <= 1}
                    className="flex-1 flex items-center justify-center text-[#828696] hover:text-white hover:bg-[#1E202A] disabled:opacity-25"
                    title="Capítulo anterior"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Campo VERSÍCULO */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-semibold text-[#6E7282] uppercase tracking-wider block">
                  VERSÍCULO
                </label>
                <span className="text-[9px] font-mono text-[#555866]">
                  1-{verseCount}
                </span>
              </div>
              <div
                className={`relative flex items-center bg-[#0F1014] border ${
                  isVerseInvalid ? 'border-red-500' : 'border-[#20222B] focus-within:border-red-500/60'
                } rounded overflow-hidden h-8`}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={verseRaw}
                  onChange={handleVerseInputChange}
                  onBlur={handleVerseBlur}
                  className="w-full bg-transparent px-2.5 text-xs text-[#F2F3F5] focus:outline-none font-mono font-semibold"
                />
                <div className="flex flex-col border-l border-[#20222B] shrink-0 h-full w-5 bg-[#14151B]">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const next = Math.min(bible.selectedVerse + 1, verseCount);
                      bibleStore.setVerse(next);
                    }}
                    disabled={bible.selectedVerse >= verseCount}
                    className="flex-1 flex items-center justify-center text-[#828696] hover:text-white hover:bg-[#1E202A] disabled:opacity-25 border-b border-[#20222B]"
                    title="Versículo siguiente"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const next = Math.max(bible.selectedVerse - 1, 1);
                      bibleStore.setVerse(next);
                    }}
                    disabled={bible.selectedVerse <= 1}
                    className="flex-1 flex items-center justify-center text-[#828696] hover:text-white hover:bg-[#1E202A] disabled:opacity-25"
                    title="Versículo anterior"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Validación y advertencia discreta si aplica */}
          {(bible.searchError || isVerseInvalid || isChapterInvalid) && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/25 px-2.5 py-1 border border-amber-800/40 rounded font-mono">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {isVerseInvalid
                  ? `Este capítulo contiene ${verseCount} versículos.`
                  : isChapterInvalid
                  ? `El libro ${bible.selectedBook.name} contiene ${maxChapters} capítulos.`
                  : bible.searchError}
              </span>
            </div>
          )}
        </div>

        {/* 4. Selector de Fondo de Imagen */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0F1014] border border-[#1E2029] text-[10px] font-mono rounded shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {bible.backgroundImageUrl ? (
              <div className="w-6 h-4 rounded overflow-hidden border border-white/20 shrink-0">
                <img
                  src={resolveMediaUrl(bible.backgroundImageUrl)}
                  alt="Fondo activo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-[#8E92A2] shrink-0" />
            )}
            <span className="text-[#6E7282] uppercase tracking-wider shrink-0">FONDO:</span>
            {bible.backgroundImageUrl ? (
              <span className="text-cyan-300 font-sans font-medium truncate max-w-[130px]" title={bible.backgroundImageUrl}>
                {BACKGROUND_PRESETS.find(p => p.path === bible.backgroundImageUrl)?.name || bible.backgroundImageUrl.split(/[\\/]/).pop()}
              </span>
            ) : (
              <span className="text-[#555866]">Predeterminado (Negro)</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {bible.backgroundImageUrl && (
              <button
                onClick={() => bibleStore.clearBackgroundImage()}
                className="p-1 text-[#6E7282] hover:text-red-400 transition-colors"
                title="Quitar fondo de imagen"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#1C1E28] hover:bg-[#252837] text-cyan-400 border border-cyan-800/40 rounded transition-all font-semibold"
              title="Abrir galería de 50 fondos predeterminados"
            >
              <Grid className="w-3 h-3" />
              <span>Galería (50)</span>
            </button>
            <button
              onClick={() => bibleStore.selectBackgroundImage()}
              className="px-2 py-0.5 bg-[#161820] hover:bg-[#20222C] text-[#EDEDED] border border-[#272936] rounded transition-all"
              title="Cargar imagen propia desde la PC"
            >
              <span>{bible.backgroundImageUrl ? 'Mi PC' : 'Subir'}</span>
            </button>
          </div>
        </div>

        {/* Modal de Fondos Predeterminados (50 imágenes organizadas) */}
        {isPresetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#12131A] border border-[#272936] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2029] bg-[#161822]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Galería de Fondos Predeterminados</h3>
                  <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                    {BACKGROUND_PRESETS.length} Fondos
                  </span>
                </div>
                <button
                  onClick={() => setIsPresetModalOpen(false)}
                  className="p-1 text-[#8E92A2] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Categorías */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F1016] border-b border-[#1E2029] overflow-x-auto no-scrollbar">
                {BACKGROUND_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-[#8E92A2] hover:text-white hover:bg-[#1A1D27]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid de imágenes */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#0A0B0F]">
                {BACKGROUND_PRESETS.filter(
                  (p) => selectedCategory === 'all' || p.category === selectedCategory
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      bibleStore.setBackgroundImage(preset.path);
                      setIsPresetModalOpen(false);
                    }}
                    className={`group relative rounded-lg overflow-hidden border transition-all text-left aspect-video ${
                      bible.backgroundImageUrl === preset.path
                        ? 'border-cyan-400 ring-2 ring-cyan-500/40'
                        : 'border-[#1E2029] hover:border-cyan-500/50 hover:scale-[1.02]'
                    }`}
                  >
                    <img
                      src={preset.path}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-90 group-hover:opacity-100">
                      <span className="text-[11px] font-medium text-white truncate drop-shadow-md">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1E2029] bg-[#12131A] text-xs">
                <span className="text-[11px] text-[#6E7282]">
                  Haz clic en cualquier imagen para aplicarla instantáneamente al versículo.
                </span>
                <button
                  onClick={() => setIsPresetModalOpen(false)}
                  className="px-3 py-1 bg-[#1E2029] hover:bg-[#282B37] text-white rounded text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tarjeta del Versículo Activo y Botones de Acción (shrink-0 para garantizar visibilidad total y scroll natural) */}
        <div
          className="shrink-0 border border-[#1E2029] rounded p-3.5 flex flex-col gap-3 relative overflow-hidden transition-all shadow-lg"
          style={{
            backgroundColor: bible.backgroundImageUrl ? '#000000' : '#0D0E12',
            backgroundImage: bible.backgroundImageUrl ? `url(${resolveMediaUrl(bible.backgroundImageUrl)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay oscuro para legibilidad si hay fondo */}
          {bible.backgroundImageUrl && (
            <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
          )}

          <div className="relative z-10">
            {/* Encabezado: Referencia + Badge de Versión */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#20222B]/80">
              <span className="text-sm font-serif font-bold text-[#F4F4F5] drop-shadow tracking-wide">
                {bible.selectedBook.name} {bible.selectedChapter}:{bible.selectedVerse}
              </span>
              <span className="text-[11px] font-mono font-bold text-[#D4D4D8] bg-black/60 px-2 py-0.5 rounded border border-white/10 tracking-wider">
                {bible.currentVersion.shortName}
              </span>
            </div>

            {/* Texto del Versículo */}
            <p className="font-serif text-[13px] text-[#FFFFFF] leading-relaxed italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {bible.activeVerseText ? (
                `“${bible.activeVerseText}”`
              ) : (
                <span className="text-[#71717A] font-sans not-italic text-xs">
                  Versículo no precargado en la versión actual. Puede usar el botón de Importar Biblia para cargar el texto completo.
                </span>
              )}
            </p>
          </div>

          {/* Botones de Operación: A Cues, A Preview, PRESENTAR DIRECTO A LIVE */}
          <div className="pt-2.5 border-t border-[#20222B]/80 flex flex-col gap-1.5 relative z-10">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => bibleStore.addToProject()}
                disabled={!bible.activeVerseText}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#14151B]/90 hover:bg-[#1C1E26] disabled:opacity-30 text-[#F4F4F5] border border-[#272936] rounded text-xs font-mono font-medium transition-colors"
                title="Agregar este versículo a la lista de Cues"
              >
                <Plus className="w-3 h-3 text-[#A0A4B4]" />
                <span>A Cues</span>
              </button>
              <button
                onClick={() => bibleStore.sendToPreview()}
                disabled={!bible.activeVerseText}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#14151B]/90 hover:bg-[#1C1E26] disabled:opacity-30 text-[#F4F4F5] border border-[#272936] rounded text-xs font-mono font-semibold transition-colors"
                title="Cargar inmediatamente en PREVIEW"
              >
                <Eye className="w-3 h-3 text-[#A0A4B4]" />
                <span>A Preview</span>
              </button>
            </div>

            <button
              onClick={() => bibleStore.presentNow()}
              disabled={!bible.activeVerseText}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-30 text-white text-xs font-mono font-bold tracking-wider rounded transition-all active:translate-y-px shadow-[0_0_16px_rgba(220,38,38,0.35)]"
              title="Presentar de inmediato al proyector (Salida Live)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>PRESENTAR DIRECTO A LIVE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};