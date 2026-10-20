import { describe, expect, test } from 'vitest';
import { extractChords, isChordLine, splitChordLine } from './chords';

describe('extractChords', () => {
  test('unique chords in first-seen order, chord lines only', () => {
    expect(extractChords('Bm   F#   A   E\nOn a dark desert highway\nG  D  Em  F#')).toEqual(['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em']);
  });

  test('ignores chord names inside lyrics and empty input', () => {
    expect(extractChords('Am is the key here')).toEqual([]);
    expect(extractChords(null)).toEqual([]);
    expect(extractChords(undefined)).toEqual([]);
    expect(extractChords('')).toEqual([]);
  });
});

describe('isChordLine', () => {
  test('mostly chords → true; lyrics or blank → false', () => {
    expect(isChordLine('C   G   Am   F')).toBe(true);
    expect(isChordLine('Cadd9  G/B  Am7')).toBe(true);
    expect(isChordLine('On a dark desert highway')).toBe(false);
    expect(isChordLine('   ')).toBe(false);
  });
});

describe('splitChordLine', () => {
  test('marks chord tokens and keeps the spacing', () => {
    const parts = splitChordLine('Am  C');
    expect(parts.filter((p) => p.isChord).map((p) => p.text)).toEqual(['Am', 'C']);
    expect(parts.map((p) => p.text).join('')).toBe('Am  C');
  });
});
