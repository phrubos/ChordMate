import { describe, expect, test } from 'vitest';
import { buildQueue, formatClock, initialPlayerState, nextTakeName, playerReducer, recordingTrack, seekKeyTarget, seekTime, toTrack, type PlayerTrack } from './player-state';

const song = (id: string, youtubeUrl: string | null = `https://youtu.be/${id}`) => ({ id, title: id, artist: 'A', imageUrl: null, youtubeUrl });
const track = (id: string) => toTrack(song(id)) as PlayerTrack;
const queue = [track('a'), track('b'), track('c')];

describe('playerReducer', () => {
  test('play with a queue selects the track index and starts playing', () => {
    const s = playerReducer(initialPlayerState, { type: 'play', track: queue[1], queue });
    expect(s.index).toBe(1);
    expect(s.isPlaying).toBe(true);
    expect(s.queue).toHaveLength(3);
  });

  test('play without a queue makes a single-track queue', () => {
    const s = playerReducer(initialPlayerState, { type: 'play', track: queue[0] });
    expect(s.queue).toEqual([queue[0]]);
    expect(s.index).toBe(0);
  });

  test('next on the last track stops playback and keeps the index', () => {
    const playing = playerReducer(initialPlayerState, { type: 'play', track: queue[2], queue });
    const s = playerReducer(playing, { type: 'next' });
    expect(s.index).toBe(2);
    expect(s.isPlaying).toBe(false);
  });

  test('next advances, prev stays at 0', () => {
    const playing = playerReducer(initialPlayerState, { type: 'play', track: queue[0], queue });
    expect(playerReducer(playing, { type: 'next' }).index).toBe(1);
    expect(playerReducer(playing, { type: 'prev' }).index).toBe(0);
  });

  test('ended behaves like next', () => {
    const playing = playerReducer(initialPlayerState, { type: 'play', track: queue[0], queue });
    expect(playerReducer(playing, { type: 'ended' }).index).toBe(1);
  });

  test('toggle, expand and close', () => {
    const playing = playerReducer(initialPlayerState, { type: 'play', track: queue[0], queue });
    expect(playerReducer(playing, { type: 'toggle' }).isPlaying).toBe(false);
    expect(playerReducer(playing, { type: 'expand', value: true }).isExpanded).toBe(true);
    expect(playerReducer(playing, { type: 'close' })).toEqual(initialPlayerState);
  });
});

describe('track helpers', () => {
  test('toTrack returns null without a YouTube URL', () => {
    expect(toTrack(song('x', null))).toBeNull();
  });

  test('buildQueue drops songs without a YouTube URL', () => {
    expect(buildQueue([song('a'), song('b', null), song('c')]).map((t) => t.id)).toEqual(['a', 'c']);
  });
});

describe('recordings and seeking', () => {
  test('recordingTrack: prefixed id, name as title, subtitle as second line', () => {
    const t = recordingTrack({ id: 'r1', name: 'Első kör', date: '2026-10-13', duration: 95 }, 'Saját felvétel · okt. 13.');
    expect(t).toMatchObject({ kind: 'recording', id: 'rec:r1', recordingId: 'r1', title: 'Első kör', artist: 'Saját felvétel · okt. 13.', duration: 95 });
  });

  test('toTrack marks songs as YouTube tracks', () => {
    expect(toTrack(song('a'))?.kind).toBe('youtube');
  });

  test('formatClock: m:ss, h:mm:ss, junk → 0:00', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(17.9)).toBe('0:17');
    expect(formatClock(654)).toBe('10:54');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(NaN)).toBe('0:00');
    expect(formatClock(-3)).toBe('0:00');
  });

  test('seekTime: position on the bar → time, clamped', () => {
    expect(seekTime(150, 100, 200, 600)).toBe(150);
    expect(seekTime(50, 100, 200, 600)).toBe(0);
    expect(seekTime(400, 100, 200, 600)).toBe(600);
    expect(seekTime(150, 100, 0, 600)).toBe(0);
  });

  test('seekKeyTarget: arrows 5s, pages 30s (10% on short tracks), ends, clamped', () => {
    expect(seekKeyTarget('ArrowRight', 10, 600)).toBe(15);
    expect(seekKeyTarget('ArrowLeft', 3, 600)).toBe(0);
    expect(seekKeyTarget('PageUp', 10, 600)).toBe(40);
    expect(seekKeyTarget('PageUp', 10, 120)).toBe(22);
    expect(seekKeyTarget('End', 10, 600)).toBe(600);
    expect(seekKeyTarget('Home', 10, 600)).toBe(0);
    expect(seekKeyTarget('ArrowRight', 598, 600)).toBe(600);
    expect(seekKeyTarget('a', 10, 600)).toBeNull();
  });
});

describe('setPlaying', () => {
  test('sets the flag, keeps the same state object when nothing changes or the queue is empty', () => {
    const playing = playerReducer(initialPlayerState, { type: 'play', track: queue[0], queue });
    expect(playerReducer(playing, { type: 'setPlaying', value: false }).isPlaying).toBe(false);
    expect(playerReducer(playing, { type: 'setPlaying', value: true })).toBe(playing);
    expect(playerReducer(initialPlayerState, { type: 'setPlaying', value: true })).toBe(initialPlayerState);
  });
});

describe('nextTakeName', () => {
  const rec = (name: string, songId: string | null = 's1') => ({ name, songId });
  test('first take of the song', () => {
    expect(nextTakeName('Save Tonight', 's1', [rec('Másik', 's2')])).toBe('Save Tonight – Take 1');
  });
  test('counts on from the highest take', () => {
    expect(nextTakeName('Save Tonight', 's1', [rec('Save Tonight – Take 1'), rec('Save Tonight – Take 2')])).toBe('Save Tonight – Take 3');
  });
  test('a deleted take does not come back', () => {
    expect(nextTakeName('Save Tonight', 's1', [rec('Save Tonight – Take 2')])).toBe('Save Tonight – Take 3');
  });
  test('renamed takes still count', () => {
    expect(nextTakeName('Save Tonight', 's1', [rec('jó volt'), rec('refrén')])).toBe('Save Tonight – Take 3');
  });
});
