import React, { useState, useEffect } from 'react';
import { ChurchSong, SongSection, SongSectionType, SongArrangement } from '../../types/church';
import { songStore, useSongStore } from '../../stores/songStore';
import { openFileDialog, resolveMediaUrl } from '../../services/tauri';
import {
  IconClose,
  IconTrash,
  IconSave,
  IconMusic,
  IconFolder,
} from '../common/NexaIcons';

export const SongEditorModal: React.FC = () => {
  const { isEditorOpen, editingSong } = useSongStore();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [author, setAuthor] = useState('');
  const [originalKey, setOriginalKey] = useState('G');
  const [tempo, setTempo] = useState<number>(75);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tagsInput, setTagsInput] = useState('Alabanza, Adoración');
  const [sections, setSections] = useState<SongSection[]>([]);
  const [arrangements, setArrangements] = useState<SongArrangement[]>([]);
  const [activeArrangementId, setActiveArrangementId] = useState<string>('');

  // Diseño visual: fondo y tipografía
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#0B0F19');
  const [fontFamily, setFontFamily] = useState<string>("'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
  const [fontSize, setFontSize] = useState<number>(46);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');

  // Modo importador rápido de texto
  const [showQuickParser, setShowQuickParser] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');

  // Sincronizar estado cuando se abre para crear o editar
  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title || '');
      setArtist(editingSong.artist || '');
      setAuthor(editingSong.author || '');
      setOriginalKey(editingSong.originalKey || 'G');
      setTempo(editingSong.tempo || 75);
      setTimeSignature(editingSong.timeSignature || '4/4');
      setTagsInput(editingSong.tags?.join(', ') || 'Alabanza');
      setSections(editingSong.sections || []);
      setArrangements(editingSong.arrangements || []);
      setActiveArrangementId(editingSong.defaultArrangementId || editingSong.arrangements?.[0]?.id || '');
      setBackgroundImageUrl(editingSong.theme?.backgroundImageUrl || '');
      setBackgroundColor(editingSong.theme?.backgroundColor || '#0B0F19');
      setFontFamily(editingSong.theme?.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
      setFontSize(editingSong.theme?.fontSize || 46);
      setTextColor(editingSong.theme?.textColor || '#FFFFFF');
      setTextAlign(editingSong.theme?.textAlign || 'center');
      setShowQuickParser(false);
      setRawPastedText('');
    }
  }, [editingSong]);

  const handlePickBackground = async () => {
    const file = await openFileDialog([
      { name: 'Imágenes (*.jpg, *.png, *.webp)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
    ]);
    if (file) {
      setBackgroundImageUrl(file);
    }
  };

  if (!isEditorOpen || !editingSong) return null;

  // Parser inteligente de letras con detección de etiquetas de sección
  const handleParseRawText = () => {
    if (!rawPastedText.trim()) return;

    const lines = rawPastedText.split(/\r?\n/);
    const parsedSections: SongSection[] = [];
    let currentLabel = 'Estrofa 1';
    let currentType: SongSectionType = 'verse';
    let currentSlides: string[] = [];
    let currentParagraphLines: string[] = [];

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        currentSlides.push(currentParagraphLines.join('\n').trim());
        currentParagraphLines = [];
      }
    };

    const flushSection = () => {
      flushParagraph();
      if (currentSlides.length > 0) {
        parsedSections.push({
          id: `sec-${Date.now()}-${parsedSections.length + 1}`,
          type: currentType,
          label: currentLabel,
          slides: currentSlides,
        });
        currentSlides = [];
      }
    };

    const sectionRegex = /^\[?(estrofa|verso|coro|puente|intro|final|outro|pre-?coro|tag|parte)\s*(\d*)\]?:?$/i;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        // Línea vacía = separación de diapositiva o estrofa
        flushParagraph();
        continue;
      }

      const match = line.match(sectionRegex);
      if (match) {
        // Nueva cabecera detectada
        flushSection();
        const headerType = match[1].toLowerCase();
        const num = match[2] ? ` ${match[2]}` : '';

        if (headerType.includes('coro') && !headerType.includes('pre')) {
          currentType = 'chorus';
          currentLabel = `Coro${num}`;
        } else if (headerType.includes('puente')) {
          currentType = 'bridge';
          currentLabel = `Puente${num}`;
        } else if (headerType.includes('intro')) {
          currentType = 'intro';
          currentLabel = `Intro${num}`;
        } else if (headerType.includes('outro') || headerType.includes('final')) {
          currentType = 'outro';
          currentLabel = `Final${num}`;
        } else if (headerType.includes('pre')) {
          currentType = 'pre-chorus';
          currentLabel = `Pre-Coro${num}`;
        } else if (headerType.includes('tag')) {
          currentType = 'tag';
          currentLabel = `Tag${num}`;
        } else {
          currentType = 'verse';
          currentLabel = `Estrofa${num || ` ${parsedSections.filter((s) => s.type === 'verse').length + 1}`}`;
        }
      } else {
        currentParagraphLines.push(line);
      }
    }

    flushSection();

    if (parsedSections.length > 0) {
      setSections(parsedSections);
      // Auto-generar secuencia estándar
      const defaultArrId = `arr-${Date.now()}-std`;
      const newArrangement: SongArrangement = {
        id: defaultArrId,
        name: 'Estándar',
        sequence: parsedSections.map((s) => s.id),
      };
      setArrangements([newArrangement]);
      setActiveArrangementId(defaultArrId);
      setShowQuickParser(false);
    }
  };

  const handleAddSection = (type: SongSectionType = 'verse') => {
    const count = sections.filter((s) => s.type === type).length + 1;
    let label = `Estrofa ${count}`;
    if (type === 'chorus') label = `Coro ${count > 1 ? count : ''}`.trim();
    if (type === 'bridge') label = `Puente ${count > 1 ? count : ''}`.trim();
    if (type === 'intro') label = 'Intro';
    if (type === 'outro') label = 'Final';
    if (type === 'pre-chorus') label = 'Pre-Coro';

    const newSec: SongSection = {
      id: `sec-${Date.now()}-${sections.length + 1}`,
      type,
      label,
      slides: [''],
    };

    const updated = [...sections, newSec];
    setSections(updated);

    // Si hay un arreglo activo, agregarle la nueva sección
    if (activeArrangementId) {
      setArrangements(
        arrangements.map((a) =>
          a.id === activeArrangementId ? { ...a, sequence: [...a.sequence, newSec.id] } : a
        )
      );
    }
  };

  const handleUpdateSection = (id: string, updates: Partial<SongSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
    // Quitar de los arreglos
    setArrangements(
      arrangements.map((a) => ({
        ...a,
        sequence: a.sequence.filter((secId) => secId !== id),
      }))
    );
  };

  const handleAddSlideToSection = (sectionId: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, slides: [...s.slides, ''] } : s))
    );
  };

  const handleUpdateSlide = (sectionId: string, slideIndex: number, text: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newSlides = [...s.slides];
        newSlides[slideIndex] = text;
        return { ...s, slides: newSlides };
      })
    );
  };

  const handleDeleteSlide = (sectionId: string, slideIndex: number) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newSlides = s.slides.filter((_, idx) => idx !== slideIndex);
        return { ...s, slides: newSlides.length > 0 ? newSlides : [''] };
      })
    );
  };

  // Arreglos: agregar o quitar secciones del orden
  const handleAddToArrangement = (secId: string) => {
    if (!activeArrangementId) return;
    setArrangements(
      arrangements.map((a) =>
        a.id === activeArrangementId ? { ...a, sequence: [...a.sequence, secId] } : a
      )
    );
  };

  const handleRemoveFromArrangement = (indexInSequence: number) => {
    if (!activeArrangementId) return;
    setArrangements(
      arrangements.map((a) => {
        if (a.id !== activeArrangementId) return a;
        const newSeq = [...a.sequence];
        newSeq.splice(indexInSequence, 1);
        return { ...a, sequence: newSeq };
      })
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Garantizar que exista al menos un arreglo
    let finalArrangements = arrangements;
    if (finalArrangements.length === 0) {
      finalArrangements = [
        {
          id: `arr-${Date.now()}-std`,
          name: 'Estándar',
          sequence: sections.map((s) => s.id),
        },
      ];
    }

    const updatedSong: ChurchSong = {
      ...editingSong,
      title: title.trim(),
      artist: artist.trim(),
      author: author.trim(),
      originalKey,
      tempo: Number(tempo) || 75,
      timeSignature,
      tags,
      sections,
      arrangements: finalArrangements,
      defaultArrangementId: activeArrangementId || finalArrangements[0].id,
      theme: {
        backgroundColor: backgroundColor || '#0B0F19',
        textColor: textColor || '#FFFFFF',
        backgroundImageUrl: backgroundImageUrl.trim() || undefined,
        fontFamily: fontFamily || "'Montserrat', sans-serif",
        fontSize: Number(fontSize) || 44,
        textAlign,
      },
      updatedAt: new Date().toISOString(),
    };

    await songStore.saveSong(updatedSong);
  };

  const activeArr = arrangements.find((a) => a.id === activeArrangementId) || arrangements[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-5xl h-[88vh] bg-[#0E0E12] border border-[#27272A] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-12 px-5 bg-[#141418] border-b border-[#27272A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <IconMusic className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              {editingSong.title ? `EDITAR CANCIÓN — ${editingSong.title}` : 'NUEVA CANCIÓN EN CANCIONERO'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickParser(!showQuickParser)}
              className="px-2.5 py-1 bg-[#1A1A22] hover:bg-[#252530] text-[#D4D4D8] border border-[#2F2F38] text-[10.5px] font-mono font-bold transition-colors flex items-center gap-1.5"
            >
              <span>{showQuickParser ? 'VOLVER A EDITOR' : 'PEGAR LETRA COMPLETA'}</span>
            </button>
            <button
              onClick={() => songStore.closeEditor()}
              className="p-1 text-[#71717A] hover:text-white transition-colors"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {showQuickParser ? (
          /* MODO PARSER RÁPIDO */
          <div className="flex-1 flex flex-col p-6 min-h-0 bg-[#0B0B0E] space-y-4">
            <div>
              <h4 className="text-sm font-mono font-bold text-white mb-1">
                IMPORTADOR INTELIGENTE DE LETRAS
              </h4>
              <p className="text-xs text-[#A1A1AA]">
                Pega la letra completa aquí. Puedes usar etiquetas como <span className="text-amber-400 font-mono">[Estrofa 1]</span>, <span className="text-purple-400 font-mono">[Coro]</span>, <span className="text-blue-400 font-mono">[Puente]</span> o simplemente párrafos separados por líneas en blanco. NEXA estructurará las diapositivas y el orden automáticamente.
              </p>
            </div>

            <textarea
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder={`[Estrofa 1]\nEl esplendor de un Rey, vestido en majestad,\nLa tierra alegre está, la tierra alegre está.\n\n[Coro]\n¡Cuán grande es Dios! Cántale:\n¡Cuán grande es Dios! Y todos lo verán,\n¡Cuán grande, cuán grande es Dios!\n\n[Estrofa 2]\nDía a día Él está, y el tiempo está en Él,\nPrincipio y el fin, principio y el fin.`}
              className="flex-1 w-full bg-[#121216] border border-[#27272A] p-4 text-xs font-mono text-[#F4F4F5] placeholder-[#52525B] focus:border-red-600 focus:outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuickParser(false)}
                className="px-4 py-1.5 bg-[#18181C] text-[#A1A1AA] hover:text-white text-xs font-mono font-bold border border-[#27272A]"
              >
                CANCELAR
              </button>
              <button
                onClick={handleParseRawText}
                disabled={!rawPastedText.trim()}
                className="px-5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-mono font-bold border border-red-500 transition-colors shadow-md"
              >
                PROCESAR Y GENERAR CANCIÓN
              </button>
            </div>
          </div>
        ) : (
          /* MODO EDITOR COMPLETO */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#1C1C22]">
            {/* Columna Izquierda: Metadatos y Arreglo (340px) */}
            <div className="w-full md:w-84 bg-[#0A0A0E] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
              {/* Metadatos */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase block">
                  INFORMACIÓN GENERAL
                </span>

                <div>
                  <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                    Título de la Canción *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Cuán Grande es Dios"
                    className="w-full bg-[#141418] border border-[#27272A] px-2.5 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Artista / Intérprete
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Ej. Chris Tomlin"
                      className="w-full bg-[#141418] border border-[#27272A] px-2.5 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Autor / Compositor
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ej. Ed Cash"
                      className="w-full bg-[#141418] border border-[#27272A] px-2.5 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Tono (Key)
                    </label>
                    <select
                      value={originalKey}
                      onChange={(e) => setOriginalKey(e.target.value)}
                      className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                    >
                      {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm'].map(
                        (k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Tempo (BPM)
                    </label>
                    <input
                      type="number"
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Compás
                    </label>
                    <input
                      type="text"
                      value={timeSignature}
                      onChange={(e) => setTimeSignature(e.target.value)}
                      placeholder="4/4"
                      className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Alabanza, Adoración, Himno"
                    className="w-full bg-[#141418] border border-[#27272A] px-2.5 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* DISEÑO VISUAL: FONDO Y TIPOGRAFÍA */}
              <div className="pt-3 border-t border-[#1C1C22] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase block">
                  FONDO Y TIPOGRAFÍA DE PROYECCIÓN
                </span>

                {/* Fondo de Proyección */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#71717A] uppercase block">
                    Fondo de la Canción
                  </label>
                  
                  {backgroundImageUrl ? (
                    <div className="relative w-full h-18 bg-black border border-[#27272A] rounded-[2px] overflow-hidden group">
                      <img
                        src={resolveMediaUrl(backgroundImageUrl)}
                        alt="Fondo de Canción"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                        <button
                          type="button"
                          onClick={handlePickBackground}
                          className="px-2 py-1 bg-[#1E1E26] text-white text-[9px] font-mono border border-[#33333E] hover:bg-[#2A2A36]"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => setBackgroundImageUrl('')}
                          className="px-2 py-1 bg-red-950/80 text-red-300 text-[9px] font-mono border border-red-800 hover:bg-red-900"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1.5 right-1.5 px-1 py-0.5 bg-black/70 text-[8px] font-mono text-zinc-300 truncate">
                        {backgroundImageUrl.split(/[\\/]/).pop()}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePickBackground}
                      className="w-full h-11 bg-[#141418] hover:bg-[#1C1C22] border border-dashed border-[#2E2E38] hover:border-[#4B4B58] text-[#A1A1AA] hover:text-white text-[10px] font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconFolder className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Elegir Imagen de Fondo (Local)...</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-mono text-[#71717A]">Color base:</span>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded"
                      title="Color de fondo cuando no hay imagen"
                    />
                    <span className="text-[9.5px] font-mono text-[#D4D4D8]">{backgroundColor}</span>
                  </div>
                </div>

                {/* Tipografía de Letra */}
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Fuente Tipográfica
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                    >
                      <option value="'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">NEXA Estándar (Impacto Bíblico — Montserrat/Inter)</option>
                      <option value="'Montserrat', sans-serif">Montserrat (Moderna y Clara)</option>
                      <option value="'Inter', sans-serif">Inter (Broadcast Neutral)</option>
                      <option value="'Merriweather', serif">Merriweather (Serif Elegante)</option>
                      <option value="'Oswald', sans-serif">Oswald (Condensada / Impacto)</option>
                      <option value="'Poppins', sans-serif">Poppins (Geométrica Limpia)</option>
                      <option value="'Roboto', sans-serif">Roboto (Estándar Nítida)</option>
                      <option value="'Cinzel', serif">Cinzel (Solemne / Litúrgica)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                        Tamaño Base
                      </label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                      >
                        <option value={36}>36 px (Compacto)</option>
                        <option value={40}>40 px (Mediano)</option>
                        <option value={46}>46 px (Estándar Proyección)</option>
                        <option value={50}>50 px (Grande)</option>
                        <option value={56}>56 px (Muy grande)</option>
                        <option value={62}>62 px (Gigante)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                        Alineación
                      </label>
                      <select
                        value={textAlign}
                        onChange={(e) => setTextAlign(e.target.value as 'center' | 'left')}
                        className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                      >
                        <option value="center">Centrado</option>
                        <option value="left">Izquierda</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arreglo Musical / Secuencia */}
              <div className="pt-3 border-t border-[#1C1C22] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase block">
                    SECUENCIA DE CANTO (ARREGLO)
                  </span>
                </div>

                <div className="bg-[#121216] border border-[#222228] p-2.5 rounded-[2px] min-h-[90px] flex flex-wrap gap-1.5 items-center">
                  {activeArr && activeArr.sequence.length > 0 ? (
                    activeArr.sequence.map((secId, idx) => {
                      const sec = sections.find((s) => s.id === secId);
                      return (
                        <span
                          key={`${secId}-${idx}`}
                          className="px-2 py-1 bg-[#1E1E26] hover:bg-[#2A2A36] text-white border border-[#33333E] text-[10px] font-mono flex items-center gap-1.5 rounded-[2px]"
                        >
                          <span>{sec?.label || 'Sección'}</span>
                          <button
                            onClick={() => handleRemoveFromArrangement(idx)}
                            className="text-[#71717A] hover:text-red-400 font-bold ml-0.5"
                            title="Quitar de la secuencia"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[10.5px] font-mono text-[#52525B]">
                      Haz clic en una sección abajo para añadirla a la secuencia
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-mono text-[#71717A] w-full block">
                    Agregar sección existente a la secuencia:
                  </span>
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => handleAddToArrangement(sec.id)}
                      className="px-2 py-0.5 bg-[#16161A] hover:bg-[#202028] text-[#D4D4D8] border border-[#27272A] text-[9.5px] font-mono transition-colors"
                    >
                      + {sec.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Secciones y Diapositivas (Editor Dinámico) */}
            <div className="flex-1 bg-[#0B0B0E] p-4 flex flex-col min-h-0 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C1C22]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
                    SECCIONES Y DIAPOSITIVAS ({sections.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAddSection('verse')}
                    className="px-2 py-1 bg-[#16161A] hover:bg-[#202028] text-white border border-[#27272A] text-[10px] font-mono font-medium transition-colors"
                  >
                    + Estrofa
                  </button>
                  <button
                    onClick={() => handleAddSection('chorus')}
                    className="px-2 py-1 bg-[#1E1724] hover:bg-[#2E1F38] text-purple-200 border border-purple-900/60 text-[10px] font-mono font-medium transition-colors"
                  >
                    + Coro
                  </button>
                  <button
                    onClick={() => handleAddSection('bridge')}
                    className="px-2 py-1 bg-[#131E2A] hover:bg-[#1A2E44] text-blue-200 border border-blue-900/60 text-[10px] font-mono font-medium transition-colors"
                  >
                    + Puente
                  </button>
                  <button
                    onClick={() => handleAddSection('custom')}
                    className="px-2 py-1 bg-[#16161A] hover:bg-[#202028] text-[#D4D4D8] border border-[#27272A] text-[10px] font-mono font-medium transition-colors"
                  >
                    + Otra
                  </button>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#222228]">
                  <IconMusic className="w-8 h-8 text-[#52525B] mb-2" />
                  <p className="text-xs font-mono text-[#71717A] mb-3">
                    Aún no hay secciones creadas en esta canción.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQuickParser(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold"
                    >
                      Pegar letra completa
                    </button>
                    <button
                      onClick={() => handleAddSection('verse')}
                      className="px-3 py-1.5 bg-[#18181C] hover:bg-[#24242C] text-white font-mono text-xs font-bold border border-[#27272A]"
                    >
                      Añadir Estrofa 1
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((sec, secIdx) => {
                    const isChorus = sec.type === 'chorus';
                    const isBridge = sec.type === 'bridge';
                    const borderCol = isChorus
                      ? 'border-purple-800/50'
                      : isBridge
                      ? 'border-blue-800/50'
                      : 'border-[#222228]';
                    const bgCol = isChorus ? 'bg-[#15121A]' : isBridge ? 'bg-[#111620]' : 'bg-[#101014]';

                    return (
                      <div
                        key={sec.id}
                        className={`border ${borderCol} ${bgCol} rounded-[2px] p-3 space-y-3`}
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-black/40 text-[#D4D4D8] rounded-[2px]">
                              #{secIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={sec.label}
                              onChange={(e) => handleUpdateSection(sec.id, { label: e.target.value })}
                              className="bg-transparent border-b border-transparent hover:border-[#3F3F46] focus:border-red-600 text-xs font-mono font-bold text-white focus:outline-none px-1"
                            />
                            <select
                              value={sec.type}
                              onChange={(e) =>
                                handleUpdateSection(sec.id, {
                                  type: e.target.value as SongSectionType,
                                })
                              }
                              className="bg-[#18181C] border border-[#27272A] text-[10px] font-mono text-[#D4D4D8] px-1.5 py-0.5 focus:outline-none"
                            >
                              <option value="verse">Estrofa (Verse)</option>
                              <option value="chorus">Coro (Chorus)</option>
                              <option value="bridge">Puente (Bridge)</option>
                              <option value="intro">Intro</option>
                              <option value="outro">Final (Outro)</option>
                              <option value="pre-chorus">Pre-Coro</option>
                              <option value="tag">Tag</option>
                              <option value="custom">Personalizado</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddSlideToSection(sec.id)}
                              className="text-[10px] font-mono text-[#A1A1AA] hover:text-white transition-colors"
                              title="Añadir diapositiva adicional dentro de esta sección"
                            >
                              + Diapositiva
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id)}
                              className="text-[#71717A] hover:text-red-400 p-1 transition-colors"
                              title="Eliminar sección"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Diapositivas de la sección */}
                        <div className="space-y-2">
                          {sec.slides.map((slideText, slideIdx) => (
                            <div key={slideIdx} className="flex gap-2 items-start">
                              <span className="text-[9px] font-mono text-[#52525B] mt-2 shrink-0">
                                D{slideIdx + 1}
                              </span>
                              <textarea
                                value={slideText}
                                onChange={(e) =>
                                  handleUpdateSlide(sec.id, slideIdx, e.target.value)
                                }
                                placeholder="Escribe o pega aquí la letra para esta diapositiva..."
                                rows={2}
                                className="flex-1 bg-[#141418] border border-[#222228] p-2 text-xs font-sans text-white placeholder-[#52525B] focus:border-red-600 focus:outline-none resize-none leading-relaxed"
                              />
                              {sec.slides.length > 1 && (
                                <button
                                  onClick={() => handleDeleteSlide(sec.id, slideIdx)}
                                  className="text-[#71717A] hover:text-red-400 p-1 mt-1"
                                  title="Quitar esta diapositiva"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="h-12 px-5 bg-[#141418] border-t border-[#27272A] flex items-center justify-between shrink-0">
          <div className="text-[10.5px] font-mono text-[#71717A]">
            {sections.length} secciones ·{' '}
            {sections.reduce((acc, s) => acc + s.slides.length, 0)} diapositivas
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => songStore.closeEditor()}
              className="px-4 py-1.5 bg-[#18181C] hover:bg-[#202026] text-[#A1A1AA] hover:text-white text-xs font-mono font-bold border border-[#27272A] transition-colors"
            >
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-mono font-bold border border-red-500 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(220,38,38,0.25)]"
            >
              <IconSave className="w-3.5 h-3.5" />
              <span>GUARDAR CANCIÓN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
