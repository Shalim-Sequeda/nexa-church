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

export interface DetectedSectionHeader {
  type: SongSectionType;
  label: string;
  explicitNumber?: number;
}

/**
 * Detecta si una línea es un encabezado de sección.
 * Soporta inglés, español y portugués, dentro y fuera de corchetes [], paréntesis (),
 * con o sin dos puntos :, mayúsculas o minúsculas.
 * Ejemplos: verse, (verse), [verse], verse 1, Verse 1:, pre-chorus, (pre-chorus),
 * chorus, [chorus], bridge, puente, coro, estrofa, números aislados (1, 2, [1]), etc.
 */
export function detectSectionHeader(rawLine: string): DetectedSectionHeader | null {
  const line = rawLine.trim();
  if (!line) return null;

  // Limpiar corchetes, paréntesis, llaves, dos puntos, asteriscos, guiones decorativos y espacios
  const clean = line
    .replace(/^[\s\[\(\{#*=\-–—]+|[\s\]\)\}:#*=\-–—]+$/g, '')
    .trim()
    .toLowerCase();

  if (!clean) return null;

  // Extraer número de sección si existe (ej. "verse 2" -> 2, "estrofa 1" -> 1)
  const numMatch = clean.match(/\d+/);
  const explicitNumber = numMatch ? parseInt(numMatch[0], 10) : undefined;
  const numStr = explicitNumber !== undefined ? `${explicitNumber}` : '';

  // 0. Línea que contiene únicamente un número o indicador de verso (ej: "1", "2", "1.", "2:", "(1)", "[1]", "v1")
  if (/^(?:\d{1,2}|v\s*\d{1,2})[\.:\-]?$/i.test(clean)) {
    return {
      type: 'verse',
      label: numStr ? `Estrofa ${numStr}` : 'Estrofa 1',
      explicitNumber,
    };
  }

  // 1. Pre-Coro / Pre-Chorus / Precoro
  if (/^pre[\s\-_]?(?:coro|chorus)(?:\s*\d+)?$/i.test(clean)) {
    return {
      type: 'pre-chorus',
      label: numStr ? `Pre-Coro ${numStr}` : 'Pre-Coro',
      explicitNumber,
    };
  }

  // 2. Coro / Chorus / Refrain / Estribillo / Refrão / C / C1..C9
  if (/^(?:coro|chorus|refrain|estribillo|refr[aã]o)(?:\s*\d+)?$/i.test(clean) || /^c\s*\d*$/i.test(clean)) {
    return {
      type: 'chorus',
      label: numStr ? `Coro ${numStr}` : 'Coro',
      explicitNumber,
    };
  }

  // 3. Puente / Bridge / Ponte / B / B1..B9
  if (/^(?:puente|bridge|ponte)(?:\s*\d+)?$/i.test(clean) || /^b\s*\d*$/i.test(clean)) {
    return {
      type: 'bridge',
      label: numStr ? `Puente ${numStr}` : 'Puente',
      explicitNumber,
    };
  }

  // 4. Estrofa / Verso / Verse / Stanza / Parte / Part / V1..V9
  if (
    /^(?:estrofa|verso|verse|stanza|parte|part)(?:\s*\d+)?$/i.test(clean) ||
    /^v\s*\d+$/i.test(clean)
  ) {
    return {
      type: 'verse',
      label: numStr ? `Estrofa ${numStr}` : 'Estrofa 1',
      explicitNumber,
    };
  }

  // 5. Intro / Introducción / Introduction
  if (/^(?:intro|introducci[oó]n|introduction)(?:\s*\d+)?$/i.test(clean)) {
    return {
      type: 'intro',
      label: numStr ? `Intro ${numStr}` : 'Intro',
      explicitNumber,
    };
  }

  // 6. Outro / Final / Ending / Coda / Terminación
  if (/^(?:outro|final|ending|coda|terminaci[oó]n)(?:\s*\d+)?$/i.test(clean)) {
    return {
      type: 'outro',
      label: numStr ? `Final ${numStr}` : 'Final',
      explicitNumber,
    };
  }

  // 7. Interlude / Interludio / Instrumental / Solo
  if (/^(?:interlude|interludio|instrumental|solo)(?:\s*\d+)?$/i.test(clean)) {
    return {
      type: 'interlude',
      label: numStr ? `Interludio ${numStr}` : 'Interludio',
      explicitNumber,
    };
  }

  // 8. Tag / Remate / Hook / Vamp
  if (/^(?:tag|remate|hook|vamp)(?:\s*\d+)?$/i.test(clean)) {
    return {
      type: 'tag',
      label: numStr ? `Tag ${numStr}` : 'Tag',
      explicitNumber,
    };
  }

  return null;
}

/**
 * Divide líneas de letra en diapositivas óptimas.
 * Respeta los párrafos separados por líneas vacías y divide párrafos largos
 * en bloques de máximo maxLines líneas (por defecto 4).
 */
export function splitSectionLinesIntoSlides(lines: string[], maxLines: number = 6): string[] {
  const slides: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return;
    if (currentParagraph.length <= maxLines) {
      slides.push(currentParagraph.join('\n'));
    } else {
      for (let i = 0; i < currentParagraph.length; i += maxLines) {
        slides.push(currentParagraph.slice(i, i + maxLines).join('\n'));
      }
    }
    currentParagraph = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
    } else {
      currentParagraph.push(line.trim());
    }
  }
  flushParagraph();

  return slides;
}

/**
 * Parsea el texto sin procesar de una canción y genera la estructura completa de ChurchSong.
 */
export function parseSongText(rawText: string, options: SongParseOptions = {}): ParsedSongResult {
  const maxLines = Math.max(1, options.maxLinesPerSlide || 6);
  const removeChords = options.removeChords !== false;

  let title = options.defaultTitle?.trim() || '';
  let artist = options.defaultArtist?.trim() || '';
  let author = '';
  let originalKey = options.defaultKey || 'G';

  const rawLines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const filteredLines: { text: string; isHeader: boolean; headerInfo: DetectedSectionHeader | null }[] = [];

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

  // Agrupar en secciones con contadores dinámicos inteligentes
  const sections: SongSection[] = [];
  let verseCounter = 0;
  let chorusCounter = 0;
  let bridgeCounter = 0;
  let preChorusCounter = 0;
  let introCounter = 0;
  let outroCounter = 0;
  let interludeCounter = 0;
  let tagCounter = 0;

  let currentType: SongSectionType = 'verse';
  let currentLabel = 'Estrofa 1';
  let currentLines: string[] = [];
  let hasExplicitHeader = false;

  function resolveHeaderLabel(type: SongSectionType, explicitNumber?: number): string {
    if (type === 'verse') {
      if (explicitNumber !== undefined) {
        verseCounter = Math.max(verseCounter, explicitNumber);
        return `Estrofa ${explicitNumber}`;
      }
      verseCounter++;
      return `Estrofa ${verseCounter}`;
    }
    if (type === 'chorus') {
      if (explicitNumber !== undefined) {
        chorusCounter = Math.max(chorusCounter, explicitNumber);
        return `Coro ${explicitNumber}`;
      }
      chorusCounter++;
      return chorusCounter === 1 ? 'Coro' : `Coro ${chorusCounter}`;
    }
    if (type === 'bridge') {
      if (explicitNumber !== undefined) {
        bridgeCounter = Math.max(bridgeCounter, explicitNumber);
        return `Puente ${explicitNumber}`;
      }
      bridgeCounter++;
      return bridgeCounter === 1 ? 'Puente' : `Puente ${bridgeCounter}`;
    }
    if (type === 'pre-chorus') {
      if (explicitNumber !== undefined) {
        preChorusCounter = Math.max(preChorusCounter, explicitNumber);
        return `Pre-Coro ${explicitNumber}`;
      }
      preChorusCounter++;
      return preChorusCounter === 1 ? 'Pre-Coro' : `Pre-Coro ${preChorusCounter}`;
    }
    if (type === 'intro') {
      introCounter++;
      return introCounter === 1 ? 'Intro' : `Intro ${introCounter}`;
    }
    if (type === 'outro') {
      outroCounter++;
      return outroCounter === 1 ? 'Final' : `Final ${outroCounter}`;
    }
    if (type === 'interlude') {
      interludeCounter++;
      return interludeCounter === 1 ? 'Interludio' : `Interludio ${interludeCounter}`;
    }
    if (type === 'tag') {
      tagCounter++;
      return tagCounter === 1 ? 'Tag' : `Tag ${tagCounter}`;
    }
    return 'Sección';
  }

  function flushCurrentSection() {
    if (currentLines.length === 0) return;
    const slides = splitSectionLinesIntoSlides(currentLines, maxLines);
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

  for (let i = 0; i < filteredLines.length; i++) {
    const item = filteredLines[i];

    if (item.isHeader && item.headerInfo) {
      flushCurrentSection();
      hasExplicitHeader = true;
      currentType = item.headerInfo.type;
      currentLabel = resolveHeaderLabel(item.headerInfo.type, item.headerInfo.explicitNumber);
      continue;
    }

    if (!item.text) {
      // Salto de línea vacío
      if (!hasExplicitHeader && currentLines.length > 0) {
        // En texto plano sin etiquetas, el salto de párrafo crea una nueva estrofa independiente
        flushCurrentSection();
        currentType = 'verse';
        currentLabel = resolveHeaderLabel('verse', undefined);
      } else if (hasExplicitHeader) {
        // Dentro de una sección explícita, conservar el salto de párrafo para separar diapositivas
        currentLines.push('');
      }
      continue;
    }

    // Si comienza la primera línea de texto plano sin ningún encabezado
    if (!hasExplicitHeader && currentLines.length === 0 && sections.length === 0 && verseCounter === 0) {
      currentType = 'verse';
      currentLabel = resolveHeaderLabel('verse', undefined);
    }

    currentLines.push(item.text);
  }

  flushCurrentSection();

  // Si no se encontró ninguna sección pero había texto
  if (sections.length === 0 && rawText.trim().length > 0) {
    const fallbackLines = rawLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && (!removeChords || !isChordLine(l)));
    if (fallbackLines.length > 0) {
      sections.push({
        id: `sec-${Date.now()}-1`,
        type: 'verse',
        label: 'Estrofa 1',
        slides: splitSectionLinesIntoSlides(fallbackLines, maxLines),
      });
    }
  }

  // Si el título seguía vacío, tomar la primera línea de la primera estrofa
  if (!title && sections.length > 0 && sections[0].slides.length > 0) {
    const firstLine = sections[0].slides[0].split('\n')[0]?.trim();
    if (firstLine && firstLine.length <= 45) {
      title = firstLine;
    } else {
      title = 'Nueva Canción';
    }
  } else if (!title) {
    title = 'Nueva Canción';
  }

  // Generar arreglo predeterminado automáticamente con la secuencia natural
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
 * Aplica la tipografía predeterminada de la Biblia (Segoe UI Variable / Sistema Elegante) y fondo de alabanza.
 */
export function buildChurchSongFromParsed(
  parsed: ParsedSongResult,
  customTheme?: Partial<ChurchSong['theme']>
): ChurchSong {
  const now = new Date().toISOString();
  return {
    id: `song-${Date.now()}`,
    title: parsed.title,
    artist: parsed.artist || '',
    author: parsed.author || '',
    originalKey: parsed.originalKey || 'G',
    tempo: 75,
    timeSignature: '4/4',
    tags: ['Alabanza'],
    theme: {
      fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 46,
      textColor: '#FFFFFF',
      backgroundColor: '#090A0E',
      backgroundImageUrl: '/backgrounds/worship/worship_ambient_blue.jpg',
      textAlign: 'center',
      ...customTheme,
    },
    sections: parsed.sections,
    arrangements: parsed.arrangements,
    defaultArrangementId: parsed.defaultArrangementId,
    createdAt: now,
    updatedAt: now,
  };
}
