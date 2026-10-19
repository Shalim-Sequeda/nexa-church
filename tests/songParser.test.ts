import { describe, it, expect } from 'vitest';
import { parseSongText, isChordLine, detectSectionHeader } from '../src/utils/songParser';

describe('songParser utility', () => {
  it('detects chord lines accurately', () => {
    expect(isChordLine('C    G    Am    F')).toBe(true);
    expect(isChordLine('G/B   Cadd9   Dsus4')).toBe(true);
    expect(isChordLine('Tu fidelidad es grande Señor')).toBe(false);
  });

  it('detects section headers in English and Spanish, inside and outside brackets/parentheses', () => {
    // Coros
    expect(detectSectionHeader('chorus')).toMatchObject({ type: 'chorus', label: 'Coro' });
    expect(detectSectionHeader('(chorus)')).toMatchObject({ type: 'chorus', label: 'Coro' });
    expect(detectSectionHeader('[chorus]:')).toMatchObject({ type: 'chorus', label: 'Coro' });
    expect(detectSectionHeader('Chorus 1')).toMatchObject({ type: 'chorus', label: 'Coro 1', explicitNumber: 1 });
    expect(detectSectionHeader('[Coro]')).toMatchObject({ type: 'chorus', label: 'Coro' });

    // Pre-Coros
    expect(detectSectionHeader('pre-chorus')).toMatchObject({ type: 'pre-chorus', label: 'Pre-Coro' });
    expect(detectSectionHeader('(pre-chorus)')).toMatchObject({ type: 'pre-chorus', label: 'Pre-Coro' });
    expect(detectSectionHeader('pre chorus')).toMatchObject({ type: 'pre-chorus', label: 'Pre-Coro' });
    expect(detectSectionHeader('[Pre-Coro]')).toMatchObject({ type: 'pre-chorus', label: 'Pre-Coro' });

    // Estrofas / Verses
    expect(detectSectionHeader('verse')).toMatchObject({ type: 'verse', label: 'Estrofa 1' });
    expect(detectSectionHeader('(verse)')).toMatchObject({ type: 'verse', label: 'Estrofa 1' });
    expect(detectSectionHeader('verse 1')).toMatchObject({ type: 'verse', label: 'Estrofa 1', explicitNumber: 1 });
    expect(detectSectionHeader('Verse 2:')).toMatchObject({ type: 'verse', label: 'Estrofa 2', explicitNumber: 2 });
    expect(detectSectionHeader('Estrofa 1:')).toMatchObject({ type: 'verse', label: 'Estrofa 1', explicitNumber: 1 });

    // Puentes / Bridges
    expect(detectSectionHeader('bridge')).toMatchObject({ type: 'bridge', label: 'Puente' });
    expect(detectSectionHeader('(bridge)')).toMatchObject({ type: 'bridge', label: 'Puente' });
    expect(detectSectionHeader('[Puente]')).toMatchObject({ type: 'bridge', label: 'Puente' });

    expect(detectSectionHeader('No es un coro de alabanza')).toBeNull();
  });

  it('parses user screenshot song with English headers without including header words in slides', () => {
    const rawBrunet = `verse
Te preparamos un lugar
Te preparamos un lugar
Para que vengas a reinar
Te preparamos un lugar
Para que puedas disfrutar (Ven Señor Jesús)
Te preparamos un lugar
Para que vengas a reinar
Te preparamos un lugar
Para que puedas disfrutar
pre-chorus
Se apagan las luces que están sobre el hombre
Y solo Tú mereces brillar
Y no hay nadie, más importante que Jesús
chorus
Y ven y toma tu lugar (Ven, ven)
Ven y toma tu lugar, Señor Jesús
Ven y toma tu lugar (Amado mio)
Ven y toma tu lugar, Señor Jesús
Ven y toma tu lugar (Ven, ven, ven)`;

    const result = parseSongText(rawBrunet, {
      defaultTitle: 'Ven y toma tu lugar',
      defaultArtist: 'Marcos Brunet',
      maxLinesPerSlide: 4,
    });

    expect(result.title).toBe('Ven y toma tu lugar');
    expect(result.artist).toBe('Marcos Brunet');
    expect(result.sections.length).toBe(3);

    // 1. Estrofa 1
    expect(result.sections[0].type).toBe('verse');
    expect(result.sections[0].label).toBe('Estrofa 1');
    // Las diapositivas NO deben contener la palabra "verse"
    expect(result.sections[0].slides[0]).not.toContain('verse');
    expect(result.sections[0].slides[0].split('\n').length).toBeLessThanOrEqual(4);

    // 2. Pre-Coro
    expect(result.sections[1].type).toBe('pre-chorus');
    expect(result.sections[1].label).toBe('Pre-Coro');
    expect(result.sections[1].slides[0]).not.toContain('pre-chorus');
    expect(result.sections[1].slides[0]).toContain('Se apagan las luces');

    // 3. Coro
    expect(result.sections[2].type).toBe('chorus');
    expect(result.sections[2].label).toBe('Coro');
    expect(result.sections[2].slides[0]).not.toContain('chorus');
    expect(result.sections[2].slides[0]).toContain('Y ven y toma tu lugar');

    // Secuencia automática generada en orden
    expect(result.arrangements[0].sequence).toEqual([
      result.sections[0].id,
      result.sections[1].id,
      result.sections[2].id,
    ]);
  });

  it('parses plain text separated by double newlines without tags', () => {
    const plainText = `
Línea uno de alabanza
Línea dos de alabanza

Línea tres del coro
Línea cuatro del coro
`;

    const result = parseSongText(plainText, { maxLinesPerSlide: 4 });
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].label).toBe('Estrofa 1');
    expect(result.sections[1].label).toBe('Estrofa 2');
  });

  it('guarantees multiple unnumbered verses never both get labeled Estrofa 1', () => {
    const rawSong = `[Verse]
Línea 1 de la primera estrofa
Línea 2 de la primera estrofa

[Chorus]
Santo, Santo, Santo es el Señor

[Verse]
Línea 1 de la segunda estrofa
Línea 2 de la segunda estrofa

[Verse]
Línea 1 de la tercera estrofa
Línea 2 de la tercera estrofa`;

    const result = parseSongText(rawSong);
    expect(result.sections.length).toBe(4);
    expect(result.sections[0].label).toBe('Estrofa 1');
    expect(result.sections[1].label).toBe('Coro');
    expect(result.sections[2].label).toBe('Estrofa 2');
    expect(result.sections[3].label).toBe('Estrofa 3');
  });

  it('correctly handles isolated numbered lines as verses (1., 2.)', () => {
    const rawSong = `1.
Sublime gracia del Señor
Que un pecador salvó

2.
En los peligros o aflicción
Que yo he tenido aquí`;

    const result = parseSongText(rawSong);
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].label).toBe('Estrofa 1');
    expect(result.sections[1].label).toBe('Estrofa 2');
  });
});

