import { formatDate } from './utils';

interface TrackBase {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
}

export interface VideoTrack extends TrackBase {
  kind: 'youtube';
  youtubeUrl: string;
}

/** One of the band's own recordings; its audio is fetched when it starts. */
export interface RecordingTrack extends TrackBase {
  kind: 'recording';
  recordingId: string;
  /** Seconds, as saved — the decoded file may not report a duration (webm). */
  duration: number;
}

export type PlayerTrack = VideoTrack | RecordingTrack;

export interface RecordingLike {
  id: string;
  name: string;
  date: string;
  duration: number;
}

export interface SongLike {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
  youtubeUrl: string | null;
}

export interface PlayerState {
  queue: PlayerTrack[];
  index: number;
  isPlaying: boolean;
  isExpanded: boolean;
}

export type PlayerAction =
  | { type: 'play'; track: PlayerTrack; queue?: PlayerTrack[] }
  | { type: 'toggle' }
  | { type: 'setPlaying'; value: boolean }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'close' }
  | { type: 'expand'; value: boolean }
  | { type: 'ended' };

export const initialPlayerState: PlayerState = { queue: [], index: 0, isPlaying: false, isExpanded: false };

export function toTrack(song: SongLike): VideoTrack | null {
  if (!song.youtubeUrl) return null;
  return { kind: 'youtube', id: song.id, title: song.title, artist: song.artist, imageUrl: song.imageUrl, youtubeUrl: song.youtubeUrl };
}

/** `subtitle` is the second line in the player, e.g. "Saját felvétel · okt. 13.". */
export function recordingTrack(rec: RecordingLike, subtitle: string): RecordingTrack {
  // Prefixed: a recording and a song must never share a queue id.
  return { kind: 'recording', id: `rec:${rec.id}`, recordingId: rec.id, title: rec.name, artist: subtitle, imageUrl: null, duration: rec.duration };
}

/** Second line for a recording in the player and lists: "Saját felvétel · okt. 13." */
export function recordingSubtitle(date: string): string {
  return 'Saját felvétel · ' + formatDate(date, 'MMM d.');
}

/**
 * Default name for a new take of a song: "Save Tonight – Take 3". Counts on from the highest take already named so
 * (and never below the number of the song's recordings), so a deleted or renamed take doesn't bring a number back.
 */
export function nextTakeName(songTitle: string, songId: string, recordings: { songId: string | null; name: string }[]): string {
  const own = recordings.filter((r) => r.songId === songId);
  const prefix = `${songTitle} – Take `;
  const highest = own.reduce((max, r) => {
    const n = r.name.startsWith(prefix) ? Number(r.name.slice(prefix.length)) : NaN;
    return Number.isInteger(n) ? Math.max(max, n) : max;
  }, 0);
  return prefix + (Math.max(highest, own.length) + 1);
}

/** m:ss, or h:mm:ss from an hour. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Seek bar: pointer x → time, clamped to the track. */
export function seekTime(clientX: number, left: number, width: number, duration: number): number {
  if (width <= 0 || duration <= 0) return 0;
  return Math.min(Math.max((clientX - left) / width, 0), 1) * duration;
}

/** Seek bar keys: arrows ±5s, PageUp/PageDown ±30s (10% on short tracks), Home/End. Null for other keys. */
export function seekKeyTarget(key: string, current: number, duration: number): number | null {
  const big = Math.min(30, Math.max(duration * 0.1, 5));
  const to = (t: number) => Math.min(Math.max(t, 0), duration);
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return to(current + 5);
    case 'ArrowLeft':
    case 'ArrowDown':
      return to(current - 5);
    case 'PageUp':
      return to(current + big);
    case 'PageDown':
      return to(current - big);
    case 'Home':
      return 0;
    case 'End':
      return duration;
    default:
      return null;
  }
}

export function buildQueue(songs: SongLike[]): PlayerTrack[] {
  return songs.map(toTrack).filter((t): t is VideoTrack => t !== null);
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'play': {
      const queue = action.queue?.length ? action.queue : [action.track];
      const index = Math.max(0, queue.findIndex((t) => t.id === action.track.id));
      return { ...state, queue, index, isPlaying: true };
    }
    case 'toggle':
      return state.queue.length ? { ...state, isPlaying: !state.isPlaying } : state;
    case 'setPlaying':
      return state.queue.length && state.isPlaying !== action.value ? { ...state, isPlaying: action.value } : state;
    case 'next':
    case 'ended':
      return state.index < state.queue.length - 1 ? { ...state, index: state.index + 1, isPlaying: true } : { ...state, isPlaying: false };
    case 'prev':
      return { ...state, index: Math.max(0, state.index - 1), isPlaying: state.queue.length > 0 };
    case 'close':
      return initialPlayerState;
    case 'expand':
      return { ...state, isExpanded: action.value };
  }
}
