export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
  youtubeUrl: string;
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
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'close' }
  | { type: 'expand'; value: boolean }
  | { type: 'ended' };

export const initialPlayerState: PlayerState = { queue: [], index: 0, isPlaying: false, isExpanded: false };

export function toTrack(song: SongLike): PlayerTrack | null {
  if (!song.youtubeUrl) return null;
  return { id: song.id, title: song.title, artist: song.artist, imageUrl: song.imageUrl, youtubeUrl: song.youtubeUrl };
}

export function buildQueue(songs: SongLike[]): PlayerTrack[] {
  return songs.map(toTrack).filter((t): t is PlayerTrack => t !== null);
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
