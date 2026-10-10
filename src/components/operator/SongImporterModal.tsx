import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Music,
  Check,
  Layers,
  Plus,
  BookOpen,
} from 'lucide-react';
import { useSongStore, songStore } from '../../stores/songStore';
import { parseSongText, buildChurchSongFromParsed, SongParseOptions } from '../../utils/songParser';
import { SongSectionType } from '../../types/church';

const SAMPLE_SONG = `Título: Tu Fidelidad
Artista: Marcos Witt
Tono: D

[Estrofa 1]
D            F#m
Tu fidelidad es grande,
G                A
Tu fidelidad incomparable es;
D             F#m
Nadie como Tú, bendito Dios,
G        A      D
Grande es Tu fidelidad.

[Coro]
D         F#m
Grande es Tu fidelidad,
G         A
Grande es Tu fidelidad;
D         F#m
Cada mañana renuevas Tu amor,
G        A      D
Grande es Tu fidelidad.

[Puente]
G               A
Por siempre cantaré de Tu amor,
F#m             Bm
Por siempre proclamaré Tu bondad;
G        A      D
Grande es Tu fidelidad.`;

export const SongImporterModal: React.FC = () => {
  const { isImporterOpen } = useSongStore();

  const [rawText, setRawText] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customArtist, setCustomArtist] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>('G');
  const [removeChords, setRemoveChords] = useState<boolean>(true);
  const [maxLinesPerSlide, setMaxLinesPerSlide] = useState<number>(4);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Parseo en tiempo real a medida que el usuario escribe o cambia opciones
  const parseOptions: SongParseOptions = useMemo(
    () => ({
      maxLinesPerSlide,
      removeChords,
      defaultTitle: customTitle,
      defaultArtist: customArtist,
      defaultKey: customKey,
    }),
    [maxLinesPerSlide, removeChords, customTitle, customArtist, customKey]
  );

  const parsedResult = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseSongText(rawText, parseOptions);
  }, [rawText, parseOptions]);

  if (!isImporterOpen) return null;

  const handleClose = () => {
    setSaveSuccess(false);
    songStore.closeImporter();
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_SONG);
    setCustomTitle('Tu Fidelidad');
    setCustomArtist('Marcos Witt');
    setCustomKey('D');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        // Si el archivo tiene un nombre, sugerir como título
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        if (!customTitle) {
          setCustomTitle(nameWithoutExt);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveToLibrary = async (andAddToProject: boolean = false) => {
    if (!parsedResult) return;

    const newSong = buildChurchSongFromParsed({
      ...parsedResult,
      title: customTitle.trim() || parsedResult.title,
      artist: customArtist.trim() || parsedResult.artist,
      originalKey: customKey || parsedResult.originalKey,
    });

    await songStore.saveSong(newSong);

    if (andAddToProject) {
      songStore.addSongToProject(newSong);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 900);
  };

  // Color de etiqueta según tipo de sección
  const getSectionBadgeColor = (type: SongSectionType) => {
    switch (type) {
      case 'chorus':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'bridge':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'pre-chorus':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'intro':
      case 'outro':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'interlude':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-6xl h-[90vh] bg-[#0C0D12] border border-[#222432] rounded-xl flex flex-col shadow-2xl overflow-hidden text-neutral-200">
        
        {/* MODAL HEADER */}
        <div className="h-14 px-6 bg-[#12131A] border-b border-[#222432] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
                  IMPORTADOR INTELIGENTE DE CANCIONES
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-600/30 text-red-300 font-mono font-semibold border border-red-500/40">
                  AUTO-PARSER
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Pega letras de Holyrics, sitios web o archivos de texto para organizarlas automáticamente en diapositivas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-[#1A1C26] hover:bg-[#252838] text-neutral-300 hover:text-white rounded text-xs font-mono border border-[#2E3144] transition-colors flex items-center gap-1.5"
              title="Cargar una canción de ejemplo con acordes y coros"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Ejemplo</span>
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar importador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (TWO COLUMNS) */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: ENTRADA Y CONTROLES */}
          <div className="w-full md:w-1/2 flex flex-col border-r border-[#222432] bg-[#0A0B0E] p-4 overflow-y-auto space-y-3.5">
            
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Título de la canción
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={parsedResult?.title || "Ej. Cuán grande es Dios"}
                  className="w-full px-3 py-1.5 bg-[#14151D] border border-[#262838] focus:border-red-500 rounded text-xs text-white placeholder-neutral-500 outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Tono (Key)
                </label>
                <select
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#14151D] border border-[#262838] focus:border-red-500 rounded text-xs text-white outline-none font-mono"
                >
                  {['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm'].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Artista / Intérprete (Opcional)
                </label>
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder={parsedResult?.artist || "Ej. En Espíritu y en Verdad"}
                  className="w-full px-3 py-1.5 bg-[#14151D] border border-[#262838] focus:border-red-500 rounded text-xs text-white placeholder-neutral-500 outline-none font-sans"
                />
              </div>
            </div>

            {/* Parsing Options */}
            <div className="p-3 bg-[#12131B] border border-[#202230] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeChords}
                  onChange={(e) => setRemoveChords(e.target.checked)}
                  className="rounded border-[#2E3144] bg-[#181A24] text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-neutral-300 text-[11px] font-medium">
                  Eliminar acordes musicales (C, G, Am...)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">Líneas por diapositiva:</span>
                <select
                  value={maxLinesPerSlide}
                  onChange={(e) => setMaxLinesPerSlide(Number(e.target.value))}
                  className="px-2 py-0.5 bg-[#181A24] border border-[#2E3144] rounded text-xs text-white font-mono outline-none"
                >
                  <option value={2}>2 líneas</option>
                  <option value={3}>3 líneas</option>
                  <option value={4}>4 líneas (Recomendado)</option>
                  <option value={6}>6 líneas</option>
                </select>
              </div>
            </div>

            {/* Raw Text Input Area */}
            <div className="flex-1 min-h-[220px] flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span>Pega la letra completa aquí:</span>
                </label>
                <label className="cursor-pointer px-2 py-0.5 bg-[#181A24] hover:bg-[#222533] text-[10px] font-mono text-neutral-300 rounded border border-[#2E3144] flex items-center gap-1 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Cargar archivo .TXT</span>
                  <input
                    type="file"
                    accept=".txt,.chordpro,.pro"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Pega aquí la letra de la canción...&#10;&#10;Ejemplo con etiquetas:&#10;[Estrofa 1]&#10;Dios de mi corazón...&#10;&#10;[Coro]&#10;Eres Dios incomparable...&#10;&#10;O simplemente pega los párrafos separados por un espacio y el sistema los dividirá automáticamente."
                className="flex-1 w-full p-3 bg-[#12131B] border border-[#222432] focus:border-red-500 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 outline-none font-mono resize-none leading-relaxed"
              />
            </div>

          </div>

          {/* RIGHT COLUMN: PREVISUALIZACIÓN DE DIAPOSITIVAS EN TIEMPO REAL */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#0D0E14] overflow-hidden">
            
            {/* Preview Summary Bar */}
            <div className="h-10 px-4 bg-[#14151E] border-b border-[#222432] flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 text-neutral-300">
                <Layers className="w-3.5 h-3.5 text-red-500" />
                <span>PREVISUALIZACIÓN EN VIVO</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span>
                  <strong className="text-white">{parsedResult?.sections.length || 0}</strong> Secciones
                </span>
                <span>•</span>
                <span>
                  <strong className="text-white">{parsedResult?.totalSlides || 0}</strong> Diapositivas
                </span>
              </div>
            </div>

            {/* Preview Slide List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {!parsedResult || parsedResult.sections.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500 space-y-2">
                  <Music className="w-10 h-10 opacity-30 stroke-1" />
                  <p className="text-xs font-mono">Esperando texto para previsualizar...</p>
                  <p className="text-[11px] text-neutral-600 max-w-xs font-sans">
                    Pega una letra a la izquierda o haz clic en "Ver Ejemplo" arriba para ver la división automática en vivo.
                  </p>
                </div>
              ) : (
                parsedResult.sections.map((section, sIdx) => (
                  <div
                    key={section.id || sIdx}
                    className="bg-[#11121A] border border-[#222432] rounded-lg p-3 space-y-2.5 shadow-sm"
                  >
                    {/* Section Header Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${getSectionBadgeColor(
                          section.type
                        )}`}
                      >
                        {section.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {section.slides.length} {section.slides.length === 1 ? 'diapositiva' : 'diapositivas'}
                      </span>
                    </div>

                    {/* Slides inside Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.slides.map((slideText, slIdx) => (
                        <div
                          key={slIdx}
                          className="bg-[#08090D] border border-[#1E202B] rounded p-2.5 flex flex-col justify-between min-h-[72px] hover:border-neutral-600 transition-colors"
                        >
                          <p className="text-[11px] font-sans text-neutral-200 whitespace-pre-line leading-relaxed text-center">
                            {slideText}
                          </p>
                          <span className="text-[9px] font-mono text-neutral-600 text-right mt-1.5 block">
                            #{slIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="h-14 px-6 bg-[#12131A] border-t border-[#222432] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-neutral-400 font-sans">
            {saveSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                ¡Canción importada y guardada exitosamente en el Cancionero!
              </span>
            ) : (
              <span>Las diapositivas se guardarán con formato panorámico 16:9 de alta definición.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-[#181A24] hover:bg-[#222533] text-neutral-300 hover:text-white rounded text-xs font-mono border border-[#2E3144] transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={() => handleSaveToLibrary(false)}
              disabled={!parsedResult || parsedResult.sections.length === 0 || saveSuccess}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded text-xs font-mono font-bold transition-all shadow-md shadow-red-950/40 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar en Cancionero</span>
            </button>

            <button
              onClick={() => handleSaveToLibrary(true)}
              disabled={!parsedResult || parsedResult.sections.length === 0 || saveSuccess}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-mono font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
              title="Guarda la canción y la agrega de inmediato a la lista del culto dominical activo"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar y Agregar al Culto</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
