import React, { useState, useEffect, useMemo } from 'react';
import { ChurchSong, SongSection, SongSectionType, SongArrangement } from '../../types/church';
import { songStore, useSongStore } from '../../stores/songStore';
import { openFileDialog, resolveMediaUrl, isMediaVideo } from '../../services/tauri';
import { BACKGROUND_PRESETS } from '../../data/backgroundPresets';
import { parseSongText, buildChurchSongFromParsed } from '../../utils/songParser';
import {
  IconClose,
  IconTrash,
  IconSave,
  IconMusic,
  IconFolder,
} from '../common/NexaIcons';

export const SongEditorModal: React.FC = () => {
  const { isEditorOpen, isCreatingNew, editingSong } = useSongStore();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [author, setAuthor] = useState('');
  const [originalKey, setOriginalKey] = useState('G');
  const [tempo, setTempo] = useState<number>(75);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tagsInput, setTagsInput] = useState('Alabanza');
  const [sections, setSections] = useState<SongSection[]>([]);
  const [arrangements, setArrangements] = useState<SongArrangement[]>([]);
  const [activeArrangementId, setActiveArrangementId] = useState<string>('');

  // Diseño visual: fondo y tipografía idéntica a la Biblia
  const BIBLE_DEFAULT_FONT = "'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#090A0E');
  const [fontFamily, setFontFamily] = useState<string>(BIBLE_DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(46);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');

  // Letra pegada para creación rápida o re-parseo
  const [rawPastedText, setRawPastedText] = useState('');
  const [showQuickParser, setShowQuickParser] = useState(false);

  // Determinar si es modo creación simple o modo edición avanzada
  const isCreating = isCreatingNew || (!editingSong?.title && (!editingSong?.sections || editingSong.sections.length === 0));

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
      setBackgroundImageUrl(editingSong.theme?.backgroundImageUrl || '/backgrounds/worship/worship_ambient_blue.jpg');
      setBackgroundColor(editingSong.theme?.backgroundColor || '#090A0E');
      setFontFamily(editingSong.theme?.fontFamily || BIBLE_DEFAULT_FONT);
      setFontSize(editingSong.theme?.fontSize || 46);
      setTextColor(editingSong.theme?.textColor || '#FFFFFF');
      setTextAlign(editingSong.theme?.textAlign || 'center');
      setShowQuickParser(false);
      setRawPastedText('');
    }
  }, [editingSong, isCreatingNew]);

  // Detección en tiempo real de secciones mientras se escribe o pega en creación
  const realTimeParsed = useMemo(() => {
    if (!rawPastedText.trim()) return null;
    return parseSongText(rawPastedText, {
      defaultTitle: title,
      defaultArtist: artist,
      defaultKey: originalKey,
      maxLinesPerSlide: 6,
    });
  }, [rawPastedText, title, artist, originalKey]);

  if (!isEditorOpen || !editingSong) return null;

  const handlePickBackground = async () => {
    const file = await openFileDialog([
      { name: 'Fondos y Videos (*.mp4, *.mov, *.webm, *.jpg, *.png)', extensions: ['mp4', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp'] },
      { name: 'Videos (*.mp4, *.mov, *.webm)', extensions: ['mp4', 'mov', 'webm', 'mkv'] },
      { name: 'Imágenes (*.jpg, *.png, *.webp)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
    ]);
    if (file) {
      setBackgroundImageUrl(file);
    }
  };

  // Creación rápida de nueva canción (sólo Título, Artista y Letra)
  const handleQuickCreateSave = async () => {
    if (!title.trim() && !rawPastedText.trim()) return;

    const parsed = parseSongText(rawPastedText, {
      defaultTitle: title.trim() || undefined,
      defaultArtist: artist.trim() || undefined,
      defaultKey: 'G',
      maxLinesPerSlide: 6,
    });

    const newSong = buildChurchSongFromParsed(parsed, {
      backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
      fontFamily: BIBLE_DEFAULT_FONT,
      fontSize: 46,
      textColor: '#FFFFFF',
      backgroundColor: '#090A0E',
      textAlign: 'center',
    });

    if (title.trim()) newSong.title = title.trim();
    if (artist.trim()) newSong.artist = artist.trim();

    await songStore.saveSong(newSong);
    songStore.selectSong(newSong, true);
    songStore.closeEditor();
  };

  // Parser inteligente para modo de edición avanzada
  const handleParseRawText = () => {
    if (!rawPastedText.trim()) return;

    const parsed = parseSongText(rawPastedText, {
      defaultTitle: title,
      defaultArtist: artist,
      defaultKey: originalKey,
      maxLinesPerSlide: 6,
    });

    if (parsed.sections.length > 0) {
      setSections(parsed.sections);
      setArrangements(parsed.arrangements);
      setActiveArrangementId(parsed.defaultArrangementId);
      if (!title && parsed.title) setTitle(parsed.title);
      if (!artist && parsed.artist) setArtist(parsed.artist);
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

  const handleSaveAdvanced = async () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

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
    songStore.selectSong(updatedSong, true);
    songStore.closeEditor();
  };

  const activeArr = arrangements.find((a) => a.id === activeArrangementId) || arrangements[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      {/* =========================================================================
          MODAL 1: MODO CREACIÓN RÁPIDA (SÓLO TÍTULO, AUTOR Y LETRA)
         ========================================================================= */}
      {isCreating ? (
        <div className="w-full max-w-2xl bg-[#0E0E12] border border-[#27272A] rounded-[4px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="h-12 px-5 bg-[#141418] border-b border-[#27272A] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <IconMusic className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                NUEVA CANCIÓN EN CANCIONERO
              </h3>
            </div>
            <button
              onClick={() => songStore.closeEditor()}
              className="p-1 text-[#71717A] hover:text-white transition-colors"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          {/* Formulario simple */}
          <div className="p-5 space-y-4 bg-[#0A0A0E]">
            {/* Título y Artista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block mb-1 font-bold">
                  Título de la Canción *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Ven y toma tu lugar"
                  className="w-full bg-[#141418] border border-[#27272A] px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none font-sans rounded-[2px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#A1A1AA] uppercase block mb-1">
                  Artista o Autor (Opcional)
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ej. Marcos Brunet"
                  className="w-full bg-[#141418] border border-[#27272A] px-3 py-2 text-xs text-white focus:border-red-600 focus:outline-none font-sans rounded-[2px]"
                />
              </div>
            </div>

            {/* Letra de la canción */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-[#A1A1AA] uppercase font-bold">
                  Letra de la Canción *
                </label>
                <span className="text-[9px] font-mono text-[#71717A]">
                  Auto-detecta verse, chorus, bridge, coro, estrofa
                </span>
              </div>
              <textarea
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                rows={12}
                placeholder={`Pega aquí la letra copiada de cualquier sitio web, Holyrics o WhatsApp.\n\nEjemplo:\nverse\nTe preparamos un lugar\nPara que vengas a reinar\n\npre-chorus\nSol de justicia, estrella de la mañana\nSolo Tú mereces brillar\n\nchorus\nY ven y toma tu lugar, Señor Jesús`}
                className="w-full bg-[#121216] border border-[#27272A] p-3 text-xs font-mono text-[#F4F4F5] placeholder-[#52525B] focus:border-red-600 focus:outline-none resize-none leading-relaxed rounded-[2px]"
              />
            </div>

            {/* Indicador de detección en tiempo real */}
            {realTimeParsed && realTimeParsed.sections.length > 0 ? (
              <div className="p-3 bg-[#0F141F] border border-cyan-800/50 rounded-[2px] space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Detección inteligente: {realTimeParsed.sections.length} secciones detectadas</span>
                  </span>
                  <span className="text-neutral-300 font-bold bg-[#171E2D] px-2 py-0.5 rounded border border-cyan-700/40">
                    {realTimeParsed.totalSlides} diapositivas listas
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {realTimeParsed.sections.map((sec, idx) => {
                    const isChorus = sec.type === 'chorus';
                    const isBridge = sec.type === 'bridge';
                    const isPre = sec.type === 'pre-chorus';
                    return (
                      <span
                        key={`preview-sec-${sec.id || idx}`}
                        className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${
                          isChorus
                            ? 'bg-purple-950/70 text-purple-200 border-purple-700'
                            : isBridge
                            ? 'bg-blue-950/70 text-blue-200 border-blue-700'
                            : isPre
                            ? 'bg-amber-950/70 text-amber-200 border-amber-700'
                            : 'bg-[#181B26] text-cyan-200 border-cyan-900/60'
                        }`}
                      >
                        {sec.label} ({sec.slides.length} {sec.slides.length === 1 ? 'diapo' : 'diapos'})
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-[#121216] border border-[#222228] rounded-[2px] text-[10px] font-mono text-[#71717A] flex items-center justify-between">
                <span>Pega o escribe la letra para previsualizar en tiempo real las estrofas y diapositivas.</span>
                <span className="text-neutral-500">Auto-secuencia 100% lista</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="h-12 px-5 bg-[#101014] border-t border-[#1C1C22] flex items-center justify-between shrink-0">
            <span className="text-[9.5px] font-mono text-[#71717A]">
              Tipografía, tonos y fondos se pueden ajustar después en el editor
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => songStore.closeEditor()}
                className="px-3 py-1.5 bg-[#18181E] hover:bg-[#222228] text-[#A1A1AA] hover:text-white text-xs font-mono rounded-[2px] border border-[#272732] transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleQuickCreateSave}
                disabled={!title.trim() && !rawPastedText.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-mono font-bold rounded-[2px] border border-red-500 transition-colors shadow-sm"
              >
                GUARDAR CANCIÓN
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            MODAL 2: MODO EDICIÓN AVANZADA (PARA CANCIONES YA CREADAS)
           ========================================================================= */
        <div className="w-full max-w-5xl h-[88vh] bg-[#0E0E12] border border-[#27272A] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="h-12 px-5 bg-[#141418] border-b border-[#27272A] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <IconMusic className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                EDITAR CANCIÓN — {editingSong.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickParser(!showQuickParser)}
                className="px-2.5 py-1 bg-[#1A1A22] hover:bg-[#252530] text-[#D4D4D8] border border-[#2F2F38] text-[10.5px] font-mono font-bold transition-colors flex items-center gap-1.5"
              >
                <span>{showQuickParser ? 'VOLVER A EDITOR' : 'PEGAR NUEVA LETRA'}</span>
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
            /* MODO RE-PARSER RÁPIDO */
            <div className="flex-1 flex flex-col p-6 min-h-0 bg-[#0B0B0E] space-y-4">
              <div>
                <h4 className="text-sm font-mono font-bold text-white mb-1">
                  IMPORTADOR UNIVERSAL DE LETRAS
                </h4>
                <p className="text-xs text-[#A1A1AA]">
                  Pega la letra completa aquí. Soporta encabezados en inglés y español (verse, chorus, bridge, coro, estrofa, etc.) y limpia automáticamente líneas de acordes.
                </p>
              </div>

              <textarea
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                placeholder={`verse\nTe preparamos un lugar\nPara que vengas a reinar\n\nchorus\nY ven y toma tu lugar, Señor Jesús`}
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
                  PROCESAR LETRA
                </button>
              </div>
            </div>
          ) : (
            /* MODO EDITOR AVANZADO COMPLETO */
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

                {/* Fondo y Tipografía de proyección */}
                <div className="space-y-3 pt-3 border-t border-[#1C1C22]">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase block">
                    FONDO Y TIPOGRAFÍA DE PROYECCIÓN
                  </span>

                  <div>
                    <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                      Fondo de la Canción
                    </label>
                    {backgroundImageUrl ? (
                      <div className="relative aspect-video rounded overflow-hidden border border-[#27272A] group">
                        {isMediaVideo(backgroundImageUrl) ? (
                          <video
                            src={resolveMediaUrl(backgroundImageUrl)}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={resolveMediaUrl(backgroundImageUrl)}
                            alt="Fondo seleccionado"
                            className="w-full h-full object-cover"
                          />
                        )}
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
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-1 max-h-44 overflow-y-auto p-0.5 border border-[#1E1E24] rounded-[2px] bg-[#0E0E12]">
                          {BACKGROUND_PRESETS.filter((p) => p.category === 'worship').map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setBackgroundImageUrl(preset.path)}
                              className="relative aspect-video rounded overflow-hidden border border-[#27272A] hover:border-red-500 opacity-80 hover:opacity-100 transition-all"
                              title={preset.name}
                            >
                              <img
                                src={resolveMediaUrl(preset.path)}
                                alt={preset.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handlePickBackground}
                          className="w-full h-8 bg-[#141418] hover:bg-[#1C1C22] border border-dashed border-[#2E2E38] hover:border-[#4B4B58] text-[#A1A1AA] hover:text-white text-[10px] font-mono transition-colors flex items-center justify-center gap-1.5 rounded-[2px]"
                        >
                          <IconFolder className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Elegir Imagen Local (Mi PC)...</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[9px] font-mono text-[#71717A]">Color base:</span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded"
                      />
                      <span className="text-[9.5px] font-mono text-[#D4D4D8]">{backgroundColor}</span>
                    </div>
                  </div>

                  {/* Tipografía */}
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
                        <option value={BIBLE_DEFAULT_FONT}>Predeterminada de la Biblia (Segoe UI Variable / Elegante)</option>
                        <option value="'Georgia', 'Times New Roman', serif">Biblia Clásica / Solemne (Serif / Georgia)</option>
                        <option value="'Montserrat', sans-serif">Montserrat (Moderna y Clara)</option>
                        <option value="'Inter', sans-serif">Inter (Editorial y Neutra)</option>
                        <option value="'Cinzel', serif">Cinzel (Clásica)</option>
                        <option value="'Lora', serif">Lora (Elegante)</option>
                        <option value="'Oswald', sans-serif">Oswald (Condensada Impacto)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                          Tamaño Base
                        </label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                        >
                          <option value="36">36 px (Compacto)</option>
                          <option value="42">42 px (Equilibrado)</option>
                          <option value="46">46 px (Estándar)</option>
                          <option value="52">52 px (Grande)</option>
                          <option value="60">60 px (Extra Grande)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] uppercase block mb-1">
                          Alineación
                        </label>
                        <select
                          value={textAlign}
                          onChange={(e) => setTextAlign(e.target.value as any)}
                          className="w-full bg-[#141418] border border-[#27272A] px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                        >
                          <option value="center">Centrado</option>
                          <option value="left">Izquierda</option>
                          <option value="right">Derecha</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arreglos de Canción */}
                <div className="space-y-2 pt-3 border-t border-[#1C1C22]">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#A1A1AA] uppercase block">
                    SECUENCIA DE CANTO (ARREGLO)
                  </span>

                  <div className="min-h-16 p-2 bg-[#121216] border border-[#27272A] flex flex-wrap gap-1.5 items-center">
                    {activeArr && activeArr.sequence.length > 0 ? (
                      activeArr.sequence.map((secId, idx) => {
                        const sec = sections.find((s) => s.id === secId);
                        if (!sec) return null;
                        const isChorus = sec.type === 'chorus';
                        const isBridge = sec.type === 'bridge';
                        return (
                          <span
                            key={`${secId}-${idx}`}
                            className={`px-2 py-1 text-[10px] font-mono rounded flex items-center gap-1.5 border ${
                              isChorus
                                ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                                : isBridge
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                                : 'bg-[#1E1E26] text-[#E4E4E7] border-[#32323E]'
                            }`}
                          >
                            <span>{sec.label}</span>
                            <button
                              onClick={() => handleRemoveFromArrangement(idx)}
                              className="text-zinc-400 hover:text-white"
                              title="Quitar esta sección del orden"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[11px] font-mono text-[#52525B]">
                        Sin secuencia asignada. Agrega secciones abajo.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono text-[#71717A]">
                      Agregar sección existente a la secuencia:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sections.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => handleAddToArrangement(sec.id)}
                          className="px-2 py-0.5 bg-[#141418] hover:bg-[#1E1E26] text-[#A1A1AA] hover:text-white border border-[#27272A] text-[9.5px] font-mono"
                        >
                          + {sec.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Secciones y Diapositivas */}
              <div className="flex-1 flex flex-col p-4 bg-[#070709] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#1C1C22]">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase">
                      ESTRUCTURA DE SECCIONES Y LETRAS
                    </h4>
                    <p className="text-[10.5px] text-[#71717A]">
                      Edita cada estrofa, coro o diapositiva. Cada diapositiva se muestra en una pantalla individual.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddSection('verse')}
                      className="px-2 py-1 bg-[#141418] hover:bg-[#1C1C22] text-[#D4D4D8] border border-[#27272A] text-[10px] font-mono rounded"
                    >
                      + Estrofa
                    </button>
                    <button
                      onClick={() => handleAddSection('chorus')}
                      className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800 text-[10px] font-mono rounded"
                    >
                      + Coro
                    </button>
                    <button
                      onClick={() => handleAddSection('bridge')}
                      className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800 text-[10px] font-mono rounded"
                    >
                      + Puente
                    </button>
                  </div>
                </div>

                {sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                    <p className="text-xs font-mono mb-2">Esta canción no tiene secciones todavía</p>
                    <button
                      onClick={() => setShowQuickParser(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded"
                    >
                      Pegar Letra Completa
                    </button>
                  </div>
                ) : (
                  sections.map((sec) => {
                    const isChorus = sec.type === 'chorus';
                    const isBridge = sec.type === 'bridge';
                    return (
                      <div
                        key={sec.id}
                        className={`p-3.5 rounded border space-y-3 ${
                          isChorus
                            ? 'bg-[#120F1A] border-purple-900/40'
                            : isBridge
                            ? 'bg-[#0E131C] border-blue-900/40'
                            : 'bg-[#0E0E12] border-[#22222A]'
                        }`}
                      >
                        {/* Header de sección */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sec.label}
                              onChange={(e) => handleUpdateSection(sec.id, { label: e.target.value })}
                              className="bg-transparent border-b border-[#3F3F46] focus:border-red-500 text-xs font-mono font-bold text-white px-1 py-0.5 outline-none"
                            />
                            <select
                              value={sec.type}
                              onChange={(e) => handleUpdateSection(sec.id, { type: e.target.value as any })}
                              className="bg-[#181820] border border-[#2E2E38] text-[9.5px] font-mono text-[#D4D4D8] px-1.5 py-0.5 rounded"
                            >
                              <option value="verse">Estrofa</option>
                              <option value="chorus">Coro</option>
                              <option value="pre-chorus">Pre-Coro</option>
                              <option value="bridge">Puente</option>
                              <option value="intro">Intro</option>
                              <option value="outro">Final</option>
                              <option value="tag">Tag</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAddSlideToSection(sec.id)}
                              className="px-2 py-0.5 bg-[#181820] hover:bg-[#22222C] text-[#D4D4D8] text-[10px] font-mono border border-[#2E2E38] rounded"
                            >
                              + Diapositiva
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id)}
                              className="p-1 text-[#71717A] hover:text-red-400 transition-colors"
                              title="Eliminar sección completa"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Diapositivas dentro de la sección */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {sec.slides.map((slideText, sIdx) => (
                            <div
                              key={`${sec.id}-slide-${sIdx}`}
                              className="bg-[#070709] border border-[#1C1C24] p-2.5 rounded space-y-1.5 flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between text-[9px] font-mono text-[#71717A]">
                                <span>Diapositiva {sIdx + 1}</span>
                                {sec.slides.length > 1 && (
                                  <button
                                    onClick={() => handleDeleteSlide(sec.id, sIdx)}
                                    className="text-zinc-500 hover:text-red-400"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={slideText}
                                onChange={(e) => handleUpdateSlide(sec.id, sIdx, e.target.value)}
                                rows={3}
                                className="w-full bg-[#101014] border border-[#22222A] p-2 text-xs font-mono text-white focus:border-red-600 focus:outline-none resize-none leading-relaxed"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="h-12 px-5 bg-[#141418] border-t border-[#27272A] flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono text-[#71717A]">
              {sections.length} secciones · {sections.reduce((acc, s) => acc + s.slides.length, 0)} diapositivas
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => songStore.closeEditor()}
                className="px-4 py-1.5 bg-[#18181C] text-[#A1A1AA] hover:text-white text-xs font-mono border border-[#27272A] rounded-[2px]"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleSaveAdvanced}
                disabled={!title.trim()}
                className="px-5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-mono font-bold border border-red-500 transition-colors flex items-center gap-1.5 rounded-[2px] shadow-sm"
              >
                <IconSave className="w-3.5 h-3.5" />
                <span>GUARDAR CAMBIOS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
