export type SongStatus = 'learning' | 'ok' | 'ready';

export const SONG_STATUSES: readonly SongStatus[] = ['learning', 'ok', 'ready'];

const STATUS_LABELS: Record<SongStatus, string> = {
  learning: 'Tanuljuk',
  ok: 'Megy',
  ready: 'Kész',
};

const DIFFICULTY_LABELS = ['Könnyű', 'Laza', 'Közepes', 'Nehéz', 'Kihívás'];

export function statusLabel(status: SongStatus): string {
  return STATUS_LABELS[status];
}

export function difficultyLabel(level: number | null | undefined): string | null {
  if (!level || level < 1 || level > 5) return null;
  return DIFFICULTY_LABELS[level - 1];
}

/** Deterministic hue (0–359) from a string — FNV-1a hash. */
export function hueFromString(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 360;
}

export function countByStatus(items: { status: SongStatus }[]): Record<SongStatus | 'all', number> {
  const counts: Record<SongStatus | 'all', number> = { all: items.length, learning: 0, ok: 0, ready: 0 };
  for (const item of items) counts[item.status]++;
  return counts;
}
