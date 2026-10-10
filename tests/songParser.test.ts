import { describe, it, expect } from 'vitest';
import { parseSongText, isChordLine, detectSectionHeader } from '../src/utils/songParser';

describe('songParser utility', () => {
  it('detects chord lines accurately', () => {
    expect(isChordLine('C    G    Am    F')).toBe(true);
    expect(isChordLine('G/B   Cadd9   Dsus4')).toBe(true);
    expect(isChordLine('Tu fidelidad es grande Señor')).toBe(false);
  });

  it('detects section headers like [Coro], Estrofa 1, Puente', () => {
    expect(detectSectionHeader('[Coro]')).toEqual({ type: 'chorus', label: 'Coro' });
    expect(detectSectionHeader('Estrofa 1:')).toEqual({ type: 'verse', label: 'Estrofa 1' });
    expect(detectSectionHeader('[Puente]')).toEqual({ type: 'bridge', label: 'Puente' });
    expect(detectSectionHeader('No es un coro')).toBeNull();
  });

  it('parses song with explicit section headers and removes chords', () => {
    const rawSong = `
Título: Dios Incomparable
Artista: Generación 12
Tono: E

[Estrofa 1]
E          B
Dios de mi corazón
C#m        A
En ti encontré mi salvación

[Coro]
E
Eres Dios incomparable
B
Eres luz en la oscuridad
A
Grande es tu amor
`;

    const result = parseSongText(rawSong, { removeChords: true, maxLinesPerSlide: 4 });
    expect(result.title).toBe('Dios Incomparable');
    expect(result.artist).toBe('Generación 12');
    expect(result.originalKey).toBe('E');
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].label).toBe('Estrofa 1');
    expect(result.sections[0].type).toBe('verse');
    expect(result.sections[0].slides[0]).toBe('Dios de mi corazón\nEn ti encontré mi salvación');
    expect(result.sections[1].label).toBe('Coro');
    expect(result.sections[1].type).toBe('chorus');
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
});
