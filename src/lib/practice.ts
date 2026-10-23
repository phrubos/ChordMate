import { SONG_STATUSES, type SongStatus } from './song-meta';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Valid song index for a setlist of `length` (0 for an empty list). */
export function clampIndex(i: number, length: number): number {
  if (length <= 0 || !Number.isFinite(i)) return 0;
  return clamp(Math.trunc(i), 0, length - 1);
}

export const DEFAULT_BPM = 80;

/** Milliseconds per beat; missing BPM → 80, clamped to 30–300. */
export function beatIntervalMs(bpm: number | null | undefined): number {
  return 60000 / clamp(bpm || DEFAULT_BPM, 30, 300);
}

/** Auto-scroll pixels per frame; speed clamped to 0.5–3×. */
export function scrollStepPx(speed: number): number {
  return 0.35 * clamp(speed, 0.5, 3);
}

/** HH:MM:SS */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Audio-clock time (seconds) of the beat after `prevTime`. */
export function nextBeatTime(prevTime: number, bpm: number): number {
  return prevTime + 60 / bpm;
}

export interface StatusChange {
  id: string;
  status: SongStatus;
}

/** Wrap-up picks that differ from the status the songs had before the session. */
export function statusChanges(before: Record<string, SongStatus>, picks: Record<string, SongStatus>): StatusChange[] {
  return Object.entries(picks)
    .filter(([id, status]) => before[id] !== undefined && before[id] !== status)
    .map(([id, status]) => ({ id, status }));
}

/** How many songs moved forward (learning → ok → ready) and back. */
export function summarizeChanges(before: Record<string, SongStatus>, changes: StatusChange[]): { up: number; down: number } {
  const rank = (s: SongStatus) => SONG_STATUSES.indexOf(s);
  let up = 0;
  let down = 0;
  for (const c of changes) {
    if (rank(c.status) > rank(before[c.id])) up++;
    else down++;
  }
  return { up, down };
}
