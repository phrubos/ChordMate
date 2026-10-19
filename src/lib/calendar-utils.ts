import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';

/** Local calendar date as yyyy-MM-dd (never toISOString — that is UTC). */
export function todayIso(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function findNextRehearsalDate(dates: string[], today: string): string | null {
  let next: string | null = null;
  for (const d of dates) if (d >= today && (next === null || d < next)) next = d;
  return next;
}

export function daysUntil(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from));
}

export function rehearsalCountdownLabel(days: number): string {
  if (days <= 0) return 'Ma';
  if (days === 1) return 'Holnap';
  return `${days} nap múlva`;
}

/** Groups the entries of the next rehearsal (on or after today), keeping their order. */
export function pickNextRehearsal<T extends { date: string }>(entries: T[], today: string): { date: string; entries: T[] } | null {
  const date = findNextRehearsalDate(entries.map((e) => e.date), today);
  return date ? { date, entries: entries.filter((e) => e.date === date) } : null;
}

export type DayState = 'done' | 'plan' | 'empty';

/** Rehearsal state of a day: past with songs = done; today or future with songs = plan. */
export function dayState(date: string, today: string, songCount: number): DayState {
  if (songCount <= 0) return 'empty';
  return date < today ? 'done' : 'plan';
}

/** Consecutive dates starting on the Monday of the anchor's week. */
export function weekStripDates(anchor: string, days = 14): string[] {
  const start = startOfWeek(parseISO(anchor), { weekStartsOn: 1 });
  return Array.from({ length: days }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}
