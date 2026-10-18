import { describe, expect, test } from 'vitest';
import { songSchema } from './validators';

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
