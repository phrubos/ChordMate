import { describe, expect, test } from 'vitest';
import { countByStatus, difficultyLabel, hueFromString, statusLabel, SONG_STATUSES } from './song-meta';

describe('song meta', () => {
  test('status labels are Hungarian', () => {
    expect(statusLabel('learning')).toBe('Tanuljuk');
    expect(statusLabel('ok')).toBe('Megy');
    expect(statusLabel('ready')).toBe('Kész');
    expect(SONG_STATUSES).toEqual(['learning', 'ok', 'ready']);
  });

  test('difficulty label maps 1..5 and rejects others', () => {
    expect(difficultyLabel(1)).toBe('Könnyű');
    expect(difficultyLabel(5)).toBe('Kihívás');
    expect(difficultyLabel(0)).toBeNull();
    expect(difficultyLabel(null)).toBeNull();
    expect(difficultyLabel(undefined)).toBeNull();
  });

  test('hue is deterministic and within 0..359', () => {
    const h = hueFromString('Eagles — Hotel California');
    expect(hueFromString('Eagles — Hotel California')).toBe(h);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
    expect(hueFromString('Omega — Gyöngyhajú lány')).not.toBe(h);
  });

  test('counts songs by status', () => {
    expect(countByStatus([{ status: 'ok' }, { status: 'ok' }, { status: 'ready' }])).toEqual({
      all: 3,
      learning: 0,
      ok: 2,
      ready: 1,
    });
  });
});
