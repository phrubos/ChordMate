import type { Rehearsal } from '@/types';

export type RehearsalMeta = Pick<Rehearsal, 'startTime' | 'endTime' | 'place' | 'kind' | 'goal'>;

export interface RehearsalDay {
  date: string;
  songCount: number;
  meta: RehearsalMeta | null;
  isPast: boolean;
}

/** A day is a rehearsal when it has a setlist or a details row. Upcoming (today included) ascending, past descending. */
export function listRehearsalDays(
  entries: { date: string }[],
  metas: (RehearsalMeta & { date: string })[],
  today: string
): { upcoming: RehearsalDay[]; past: RehearsalDay[] } {
  const days = new Map<string, RehearsalDay>();
  const day = (date: string) => {
    let d = days.get(date);
    if (!d) days.set(date, (d = { date, songCount: 0, meta: null, isPast: date < today }));
    return d;
  };
  for (const e of entries) day(e.date).songCount++;
  for (const { date, startTime, endTime, place, kind, goal } of metas) day(date).meta = { startTime, endTime, place, kind, goal };

  const all = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { upcoming: all.filter((d) => !d.isPast), past: all.filter((d) => d.isPast).reverse() };
}

export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${start}–${end}` : start;
}

export function kindLabel(kind: Rehearsal['kind']): string {
  return kind === 'gig' ? 'Fellépés' : 'Próba';
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
