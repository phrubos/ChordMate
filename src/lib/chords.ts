import { chordNames } from './chord-diagrams';

export interface ChordPart {
  text: string;
  isChord: boolean;
}

/** Known chord names (longest first, so "Cadd9" wins over "C") as whole whitespace-separated tokens. */
const KNOWN_CHORD = new RegExp(`(?<=^|\\s)(${chordNames.map((c) => c.replace(/[#/]/g, '\\$&')).join('|')})(?=\\s|$)`, 'g');

/** Any chord-shaped token, also ones without a diagram (e.g. "F#m7b5", "Bb/D"). */
const CHORD_TOKEN = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?\d*(?:[#b]\d+)*(?:sus\d*|add\d+)?(?:\/[A-G][#b]?)?$/;

/** Splits one line into text / known-chord parts; joining the texts gives back the line. */
export function splitChordLine(line: string): ChordPart[] {
  const parts: ChordPart[] = [];
  let last = 0;
  for (const m of line.matchAll(KNOWN_CHORD)) {
    if (m.index > last) parts.push({ text: line.slice(last, m.index), isChord: false });
    parts.push({ text: m[1], isChord: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), isChord: false });
  return parts;
}

/** `splitChordLine` over a whole tab, with "\n" parts between the lines. */
export function splitChordText(text: string): ChordPart[] {
  return text.split('\n').flatMap((line, i) => (i === 0 ? splitChordLine(line) : [{ text: '\n', isChord: false }, ...splitChordLine(line)]));
}

/** True when at least 60% of the non-empty tokens are chords. */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.filter((t) => CHORD_TOKEN.test(t)).length / tokens.length >= 0.6;
}

/** Unique chords in first-seen order, taken from chord lines only. */
export function extractChords(tab: string | null | undefined): string[] {
  if (!tab) return [];
  const seen = new Set<string>();
  for (const line of tab.split('\n')) {
    if (!isChordLine(line)) continue;
    for (const t of line.trim().split(/\s+/)) if (CHORD_TOKEN.test(t)) seen.add(t);
  }
  return [...seen];
}
