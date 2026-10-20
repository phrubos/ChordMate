import { describe, expect, test } from 'vitest';
import { buildSongInsights, pickNeglectedSongs } from './neglected';

describe('pickNeglectedSongs', () => {
  const lastPlayed = { a: '2026-10-13', b: '2026-09-05', d: '2026-08-01' };

  test('never-played songs first, then the longest-ago, skipping recent ones', () => {
    expect(pickNeglectedSongs(['a', 'b', 'c', 'd'], lastPlayed, '2026-10-16', 3)).toEqual([
      { songId: 'c', daysSince: null },
      { songId: 'd', daysSince: 76 },
      { songId: 'b', daysSince: 41 },
    ]);
  });

  test('respects limit and minDays', () => {
    expect(pickNeglectedSongs(['a', 'b', 'c'], lastPlayed, '2026-10-16', 1)).toEqual([{ songId: 'c', daysSince: null }]);
    expect(pickNeglectedSongs(['b', 'd'], lastPlayed, '2026-10-16', 10, 60)).toEqual([{ songId: 'd', daysSince: 76 }]);
  });

  test('a future (planned) last date never counts as neglected', () => {
    expect(pickNeglectedSongs(['x'], { x: '2026-10-22' }, '2026-10-16', 3)).toEqual([]);
  });
});

describe('buildSongInsights', () => {
  test('uses past rehearsals only and counts statuses', () => {
    const songs = [
      { id: 'a', status: 'ready' as const },
      { id: 'b', status: 'ok' as const },
      { id: 'c', status: 'learning' as const },
    ];
    const entries = [
      { songId: 'a', date: '2026-10-13' },
      { songId: 'b', date: '2026-08-01' },
      { songId: 'b', date: '2026-10-22' },
    ];
    const r = buildSongInsights(songs, entries, '2026-10-16');
    expect(r.neglected.map((n) => [n.song.id, n.daysSince])).toEqual([['c', null], ['b', 76]]);
    expect(r.statusCounts).toEqual({ all: 3, learning: 1, ok: 1, ready: 1 });
  });
});
