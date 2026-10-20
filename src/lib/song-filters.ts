import { SONG_STATUSES, type SongStatus } from './song-meta';

export interface SongFilterState {
  search?: string;
  status?: SongStatus;
  difficulty?: number;
  hasTab: boolean;
  favOnly: boolean;
  sort: 'artist' | 'date';
  view: 'grid' | 'list';
}

export function parseSongFilters(sp: Record<string, string | undefined>): SongFilterState {
  const f: SongFilterState = {
    hasTab: sp.hasTab === '1',
    favOnly: sp.fav === '1',
    sort: sp.sort === 'date' ? 'date' : 'artist',
    view: sp.view === 'list' ? 'list' : 'grid',
  };
  if (sp.search) f.search = sp.search;
  if (sp.status && (SONG_STATUSES as readonly string[]).includes(sp.status)) f.status = sp.status as SongStatus;
  const d = Number(sp.difficulty);
  if (Number.isInteger(d) && d >= 1 && d <= 5) f.difficulty = d;
  return f;
}

type ParamValue = (f: Partial<SongFilterState>) => string | null;

/** URL param per filter field; null = remove (defaults are never written). */
const PARAMS: Record<keyof SongFilterState, [string, ParamValue]> = {
  search: ['search', (f) => f.search || null],
  status: ['status', (f) => f.status ?? null],
  difficulty: ['difficulty', (f) => (f.difficulty ? String(f.difficulty) : null)],
  hasTab: ['hasTab', (f) => (f.hasTab ? '1' : null)],
  favOnly: ['fav', (f) => (f.favOnly ? '1' : null)],
  sort: ['sort', (f) => (f.sort === 'date' ? 'date' : null)],
  view: ['view', (f) => (f.view === 'list' ? 'list' : null)],
};

export function serializeSongFilters(update: Partial<SongFilterState>, current: URLSearchParams): string {
  const next = new URLSearchParams(current);
  for (const key of Object.keys(update) as (keyof SongFilterState)[]) {
    const [param, value] = PARAMS[key];
    const v = value(update);
    if (v === null) next.delete(param);
    else next.set(param, v);
  }
  return next.toString();
}
