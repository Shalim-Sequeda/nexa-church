export interface BibleFontSizes {
  content: number;
  reference: number;
  lineHeight: number;
  fontSizeCqw: string;
  referenceSizeCqw: string;
}

/**
 * Calcula dinámicamente los tamaños de fuente e impacto visual para versículos bíblicos.
 * Diseñado específicamente para auditorios, proyecciones en templos y eventos masivos
 * (como "El Sonido del Despertar 2026").
 * 
 * Reglas de Proyección Masiva:
 * 1. En versículos cortos (<= 85 chars, ej. Salmos 23:1: "Jehová es mi pastor; nada me faltará."),
 *    la letra es GIGANTE y CONTUNDENTE (5.85cqw, aprox 112px en 1080p), abarcando el 80-85% del ancho,
 *    legible desde las últimas filas del auditorio.
 * 2. En versículos medianos o largos (Juan 3:16, Romanos 8:28), la escala se adapta suavemente
 *    aprovechando al máximo el formato panorámico 16:9 sin desbordarse ni cortarse.
 * 3. Proporción 1:1 idéntica entre Preview, Live Monitor y Presentation Window (Proyector/Video Beam)
 *    utilizando Container Query Units (cqw).
 */
export function getBibleDynamicFontSizes(
  text: string,
  baseSize: number = 46,
  isMonitor: boolean = false
): BibleFontSizes {
  const len = text ? text.trim().length : 0;

  // Factor de escala relativo al ajuste manual del operador
  const userMultiplier = Math.max(0.7, Math.min(1.5, baseSize / 46));

  let cqwContent: number;
  let cqwRef: number;
  let lineHeight: number;

  if (len <= 85) {
    // Versículo corto (ej. Salmos 23:1, Juan 11:35) -> Letra gigante tipo congreso/estadio
    cqwContent = 5.85 * userMultiplier;
    cqwRef = 2.95 * userMultiplier;
    lineHeight = 1.25;
  } else if (len <= 165) {
    // Versículo estándar (ej. Juan 3:16, Filipenses 4:13)
    cqwContent = 4.65 * userMultiplier;
    cqwRef = 2.45 * userMultiplier;
    lineHeight = 1.28;
  } else if (len <= 250) {
    // Versículo mediano (ej. Romanos 8:28, Jeremías 29:11)
    cqwContent = 3.80 * userMultiplier;
    cqwRef = 2.15 * userMultiplier;
    lineHeight = 1.30;
  } else if (len <= 350) {
    // Versículo largo (ej. Romanos 8:38-39)
    cqwContent = 3.15 * userMultiplier;
    cqwRef = 1.85 * userMultiplier;
    lineHeight = 1.32;
  } else {
    // Versículo extra largo
    cqwContent = 2.70 * userMultiplier;
    cqwRef = 1.70 * userMultiplier;
    lineHeight = 1.34;
  }

  const pxContent = Math.round(cqwContent * 19.2);
  const pxRef = Math.round(cqwRef * 19.2);

  const displayPx = isMonitor ? Math.round(pxContent * 0.4) : pxContent;
  const displayRefPx = isMonitor ? Math.round(pxRef * 0.4) : pxRef;

  return {
    content: displayPx,
    reference: displayRefPx,
    lineHeight,
    fontSizeCqw: `${cqwContent.toFixed(2)}cqw`,
    referenceSizeCqw: `${cqwRef.toFixed(2)}cqw`,
  };
}

export interface SongFontSizes {
  fontSizeCqw: string;
  lineHeight: number;
}

/**
 * Calcula el tamaño dinámico de fuente y espaciado para letras de canciones
 * garantizando la misma presencia escénica, solidez e impacto visual que los versículos bíblicos.
 */
export function getSongDynamicFontSizes(
  text: string,
  baseSize: number = 46,
  _isMonitor: boolean = false
): SongFontSizes {
  const len = text ? text.trim().length : 0;
  const lines = text ? text.split('\n').filter((l) => l.trim().length > 0) : [];
  const lineCount = lines.length || 1;
  const maxLineLen = lines.reduce((max, l) => Math.max(max, l.trim().length), 0);

  const userMultiplier = Math.max(0.7, Math.min(1.5, baseSize / 46));

  let cqwContent: number;
  let lineHeight: number = 1.25;

  if (lineCount <= 1 && len <= 55) {
    // 1 sola línea corta (ej. "¡Eres bueno!", "Santo es el Señor")
    cqwContent = 5.85 * userMultiplier;
    lineHeight = 1.22;
  } else if (lineCount <= 2 && maxLineLen <= 45) {
    // 2 líneas cortas
    cqwContent = 5.10 * userMultiplier;
    lineHeight = 1.24;
  } else if (lineCount <= 3 && maxLineLen <= 50) {
    // 3 líneas
    cqwContent = 4.45 * userMultiplier;
    lineHeight = 1.26;
  } else if (lineCount <= 4 && maxLineLen <= 55) {
    // 4 líneas estándar de estrofa/coro
    cqwContent = 3.95 * userMultiplier;
    lineHeight = 1.28;
  } else {
    // 5+ líneas o estrofas extendidas
    cqwContent = 3.20 * userMultiplier;
    lineHeight = 1.30;
  }

  return {
    fontSizeCqw: `${cqwContent.toFixed(2)}cqw`,
    lineHeight,
  };
}
