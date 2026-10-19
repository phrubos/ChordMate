import { daysUntil } from './calendar-utils';
import { countByStatus, type SongStatus } from './song-meta';

export interface NeglectedPick {
  songId: string;
  daysSince: number | null;
}

/**
 * Songs worth bringing back: never played first, then the longest since last played.
 * Only songs at least `minDays` past their last (non-future) rehearsal qualify.
 */
export function pickNeglectedSongs(
  songIds: string[],
  lastPlayed: Record<string, string>,
  today: string,
  limit: number,
  minDays = 21
): NeglectedPick[] {
  const never: NeglectedPick[] = [];
  const old: NeglectedPick[] = [];
  for (const songId of songIds) {
    const last = lastPlayed[songId];
    if (!last) never.push({ songId, daysSince: null });
    else {
      const daysSince = daysUntil(last, today);
      if (daysSince >= minDays) old.push({ songId, daysSince });
    }
  }
  old.sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0));
  return [...never, ...old].slice(0, limit);
}

/** Dashboard insights from already-loaded songs and calendar entries (past rehearsals only). */
export function buildSongInsights<S extends { id: string; status: SongStatus }>(
  songs: S[],
  entries: { songId: string; date: string }[],
  today: string,
  limit = 3
): { neglected: { song: S; daysSince: number | null }[]; statusCounts: Record<SongStatus | 'all', number> } {
  const lastPlayed: Record<string, string> = {};
  for (const e of entries) if (e.date < today && (!lastPlayed[e.songId] || e.date > lastPlayed[e.songId])) lastPlayed[e.songId] = e.date;
  const byId = new Map(songs.map((s) => [s.id, s]));
  const neglected = pickNeglectedSongs(songs.map((s) => s.id), lastPlayed, today, limit).map(({ songId, daysSince }) => ({
    song: byId.get(songId)!,
    daysSince,
  }));
  return { neglected, statusCounts: countByStatus(songs) };
}
