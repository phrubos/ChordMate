import { describe, expect, test } from 'vitest';
import { rehearsalMetaSchema, songSchema } from './validators';

const base = { title: 'A', artist: 'B' };

describe('songSchema musical metadata', () => {
  test('defaults status to learning and keeps new fields optional', () => {
    const parsed = songSchema.parse(base);
    expect(parsed.status).toBe('learning');
    expect(parsed.bpm).toBeUndefined();
    expect(parsed.songKey).toBeUndefined();
  });

  test('accepts valid keys and empty key', () => {
    for (const songKey of ['F#m', 'Bb', 'C', '']) {
      expect(songSchema.safeParse({ ...base, songKey }).success).toBe(true);
    }
  });

  test('rejects invalid key, bpm and capo', () => {
    expect(songSchema.safeParse({ ...base, songKey: 'H' }).success).toBe(false);
    expect(songSchema.safeParse({ ...base, bpm: 10 }).success).toBe(false);
    expect(songSchema.safeParse({ ...base, capo: 13 }).success).toBe(false);
    expect(songSchema.safeParse({ ...base, status: 'done' }).success).toBe(false);
  });

  test('accepts full metadata', () => {
    const parsed = songSchema.parse({ ...base, status: 'ready', bpm: '74', songKey: 'Bm', capo: '7', tuning: 'Eb' });
    expect(parsed).toMatchObject({ status: 'ready', bpm: 74, songKey: 'Bm', capo: 7, tuning: 'Eb' });
  });
});

describe('rehearsalMetaSchema', () => {
  const issue = (input: object) => rehearsalMetaSchema.safeParse(input).error?.issues[0]?.message;

  test('accepts full input and empty times; kind defaults to rehearsal', () => {
    const full = rehearsalMetaSchema.parse({ startTime: '19:00', endTime: '21:30', place: 'Pince', kind: 'gig', goal: '', notes: '' });
    expect(full.kind).toBe('gig');
    const empty = rehearsalMetaSchema.parse({ startTime: '', endTime: '' });
    expect(empty.startTime).toBeUndefined();
    expect(empty.kind).toBe('rehearsal');
  });

  test('rejects bad times, reversed range and long place', () => {
    expect(issue({ startTime: '7:00' })).toBe('Időpont formátuma: ÓÓ:PP');
    expect(issue({ startTime: '21:00', endTime: '19:00' })).toBe('A vége legyen a kezdés után');
    expect(issue({ place: 'x'.repeat(121) })).toBe('Legfeljebb 120 karakter');
  });
});
