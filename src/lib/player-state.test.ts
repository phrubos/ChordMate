import { describe, expect, test } from 'vitest';
import { buildQueue, initialPlayerState, playerReducer, toTrack, type PlayerTrack } from './player-state';

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
