import { ChurchSong, SongSection, SongSectionType, SongArrangement } from '../types/church';

export interface SongParseOptions {
  maxLinesPerSlide?: number;
  removeChords?: boolean;
  defaultTitle?: string;
  defaultArtist?: string;
  defaultKey?: string;
}

export interface ParsedSongResult {
  title: string;
  artist: string;
  author: string;
  originalKey: string;
  sections: SongSection[];
  arrangements: SongArrangement[];
  defaultArrangementId: string;
  totalSlides: number;
}

// Expresión regular para detectar acordes musicales en español/inglés
const CHORD_TOKEN_REGEX = /^[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:\/[A-G][b#]?)?(?:[-+])?$/;

/**
 * Determina si una línea de texto está compuesta principalmente de acordes musicales.
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Si contiene palabras en español comunes de alabanza, NO es una línea de acordes
  const commonSpanishWords = /\b(el|la|los|las|de|que|en|un|tu|mi|su|dios|se[nñ]or|jes[uú]s|gloria|santo|amor|rey|te|alabanza|por|con|para|somos|eres|nos|fue|vida|cielo|tierra)\b/i;
  if (commonSpanishWords.test(trimmed)) {
    return false;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    // Quitar paréntesis o barras separadoras
    const cleanToken = token.replace(/^[\[\(\{\|]+|[\]\)\}\|,.]+$/g, '');
    if (CHORD_TOKEN_REGEX.test(cleanToken)) {
      chordCount++;
    }
  }

  // Si más del 65% de las palabras parecen acordes, es una línea de acordes
  return (chordCount / tokens.length) >= 0.65;
}

/**
 * Detecta si una línea es un encabezado de sección (ej: [Coro], Estrofa 1, Puente, Verse, Chorus)
 */
export function detectSectionHeader(line: string): { type: SongSectionType; label: string } | null {
  const clean = line.replace(/^[\[\(\{\s*#*]+|[\]\)\}\s*:]+$/g, '').trim().toLowerCase();
  if (!clean) return null;

  // Coro / Chorus
  if (/^(?:coro|chorus|estribillo)(?:\s*\d+)?$/i.test(clean)) {
    const num = clean.match(/\d+/)?.[0] || '';
    return { type: 'chorus', label: num ? `Coro ${num}` : 'Coro' };
  }

  // Pre-Coro
  if (/^(?:pre-?coro|pre-?chorus)(?:\s*\d+)?$/i.test(clean)) {
    const num = clean.match(/\d+/)?.[0] || '';
    return { type: 'pre-chorus', label: num ? `Pre-Coro ${num}` : 'Pre-Coro' };
  }

  // Puente / Bridge
  if (/^(?:puente|bridge)(?:\s*\d+)?$/i.test(clean)) {
    const num = clean.match(/\d+/)?.[0] || '';
    return { type: 'bridge', label: num ? `Puente ${num}` : 'Puente' };
  }

  // Estrofa / Verso / Verse
  if (/^(?:estrofa|verso|verse|v)(?:\s*\d+)?$/i.test(clean)) {
    const num = clean.match(/\d+/)?.[0] || '1';
    return { type: 'verse', label: `Estrofa ${num}` };
  }

  // Intro
  if (/^(?:intro|introducci[oó]n)$/i.test(clean)) {
    return { type: 'intro', label: 'Intro' };
  }

  // Outro / Final / Coda
  if (/^(?:outro|final|coda|terminacion)$/i.test(clean)) {
    return { type: 'outro', label: 'Final' };
  }

  // Instrumental / Interludio / Solo
  if (/^(?:instrumental|interludio|interlude|solo)$/i.test(clean)) {
    return { type: 'interlude', label: 'Instrumental' };
  }

  // Tag / Remate
  if (/^(?:tag|remate)$/i.test(clean)) {
    return { type: 'tag', label: 'Tag' };
  }

  return null;
}

/**
 * Divide un arreglo de líneas de letra en diapositivas según el límite especificado.
 */
function chunkLinesToSlides(lines: string[], maxLines: number): string[] {
  if (lines.length === 0) return [];
  const slides: string[] = [];
  
  for (let i = 0; i < lines.length; i += maxLines) {
    const chunk = lines.slice(i, i + maxLines);
    slides.push(chunk.join('\n'));
  }
  
  return slides;
}

/**
 * Parsea el texto sin procesar de una canción y genera la estructura completa de ChurchSong.
 */
export function parseSongText(rawText: string, options: SongParseOptions = {}): ParsedSongResult {
  const maxLines = Math.max(1, options.maxLinesPerSlide || 4);
  const removeChords = options.removeChords !== false;

  let title = options.defaultTitle?.trim() || '';
  let artist = options.defaultArtist?.trim() || '';
  let author = '';
  let originalKey = options.defaultKey || 'G';

  const rawLines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const filteredLines: { text: string; isHeader: boolean; headerInfo: { type: SongSectionType; label: string } | null }[] = [];

  let isFirstNonEmpty = true;

  for (let i = 0; i < rawLines.length; i++) {
    const originalLine = rawLines[i];
    const trimmed = originalLine.trim();

    if (!trimmed) {
      filteredLines.push({ text: '', isHeader: false, headerInfo: null });
      continue;
    }

    // Detección de metadatos comunes en las primeras líneas
    if (isFirstNonEmpty) {
      if (/^(?:t[ií]tulo|title)\s*:\s*(.+)$/i.test(trimmed)) {
        title = trimmed.replace(/^(?:t[ií]tulo|title)\s*:\s*/i, '').trim();
        continue;
      }
      if (/^#\s+(.+)$/.test(trimmed)) {
        title = trimmed.replace(/^#\s+/, '').trim();
        continue;
      }
    }

    if (/^(?:artista|artist|int[eé]rprete)\s*:\s*(.+)$/i.test(trimmed)) {
      artist = trimmed.replace(/^(?:artista|artist|int[eé]rprete)\s*:\s*/i, '').trim();
      continue;
    }

    if (/^(?:autor|author|compositor)\s*:\s*(.+)$/i.test(trimmed)) {
      author = trimmed.replace(/^(?:autor|author|compositor)\s*:\s*/i, '').trim();
      continue;
    }

    if (/^(?:tono|key|tonalidad)\s*:\s*([A-G][b#]?m?)$/i.test(trimmed)) {
      originalKey = trimmed.replace(/^(?:tono|key|tonalidad)\s*:\s*/i, '').trim().toUpperCase();
      continue;
    }

    // Filtrar líneas de acordes si la opción está activa
    if (removeChords && isChordLine(trimmed)) {
      continue;
    }

    isFirstNonEmpty = false;

    // Verificar si es un encabezado de sección
    const header = detectSectionHeader(trimmed);
    if (header) {
      filteredLines.push({ text: trimmed, isHeader: true, headerInfo: header });
    } else {
      filteredLines.push({ text: trimmed, isHeader: false, headerInfo: null });
    }
  }

  // Agrupar en secciones
  const sections: SongSection[] = [];
  let currentType: SongSectionType = 'verse';
  let currentLabel = 'Estrofa 1';
  let currentLines: string[] = [];
  let verseCounter = 1;

  function flushCurrentSection() {
    if (currentLines.length === 0) return;
    const slides = chunkLinesToSlides(currentLines, maxLines);
    if (slides.length > 0) {
      const sectionId = `sec-${Date.now()}-${sections.length + 1}`;
      sections.push({
        id: sectionId,
        type: currentType,
        label: currentLabel,
        slides,
      });
    }
    currentLines = [];
  }

  let inExplicitSection = false;

  for (let i = 0; i < filteredLines.length; i++) {
    const item = filteredLines[i];

    if (item.isHeader && item.headerInfo) {
      flushCurrentSection();
      currentType = item.headerInfo.type;
      currentLabel = item.headerInfo.label;
      inExplicitSection = true;
      continue;
    }

    if (!item.text) {
      // Salto de línea vacío
      if (!inExplicitSection && currentLines.length > 0) {
        // En modo texto plano sin etiquetas, el doble salto crea una nueva estrofa
        flushCurrentSection();
        verseCounter++;
        currentType = 'verse';
        currentLabel = `Estrofa ${verseCounter}`;
      }
      continue;
    }

    currentLines.push(item.text);
  }

  flushCurrentSection();

  // Si no se encontró ninguna sección pero había texto
  if (sections.length === 0 && rawText.trim().length > 0) {
    const fallbackLines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0 && (!removeChords || !isChordLine(l)));
    if (fallbackLines.length > 0) {
      sections.push({
        id: `sec-${Date.now()}-1`,
        type: 'verse',
        label: 'Estrofa 1',
        slides: chunkLinesToSlides(fallbackLines, maxLines),
      });
    }
  }

  // Si el título seguía vacío, tomar la primera línea de la primera estrofa
  if (!title && sections.length > 0 && sections[0].slides.length > 0) {
    const firstLine = sections[0].slides[0].split('\n')[0]?.trim();
    if (firstLine && firstLine.length <= 45) {
      title = firstLine;
    } else {
      title = 'Nueva Canción Importada';
    }
  } else if (!title) {
    title = 'Nueva Canción Importada';
  }

  // Generar arreglo predeterminado
  const arrangementId = `arr-${Date.now()}-std`;
  const arrangements: SongArrangement[] = [
    {
      id: arrangementId,
      name: 'Secuencia Completa',
      sequence: sections.map((s) => s.id),
    },
  ];

  let totalSlides = 0;
  sections.forEach((s) => {
    totalSlides += s.slides.length;
  });

  return {
    title,
    artist,
    author,
    originalKey,
    sections,
    arrangements,
    defaultArrangementId: arrangementId,
    totalSlides,
  };
}

/**
 * Convierte un resultado parseado en una instancia completa de ChurchSong lista para guardar.
 */
export function buildChurchSongFromParsed(parsed: ParsedSongResult): ChurchSong {
  const now = new Date().toISOString();
  return {
    id: `song-${Date.now()}`,
    title: parsed.title,
    artist: parsed.artist || 'Desconocido',
    author: parsed.author || '',
    originalKey: parsed.originalKey || 'G',
    tempo: 75,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Importada'],
    theme: {
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 44,
      textColor: '#FFFFFF',
      backgroundColor: '#0B0F19',
      textAlign: 'center',
    },
    sections: parsed.sections,
    arrangements: parsed.arrangements,
    defaultArrangementId: parsed.defaultArrangementId,
    createdAt: now,
    updatedAt: now,
  };
}
