import { describe, expect, test } from 'vitest';
import { dayState, daysUntil, findNextRehearsalDate, pickNextRehearsal, rehearsalCountdownLabel, todayIso, weekStripDates } from './calendar-utils';

describe('next rehearsal', () => {
  test('picks the earliest date on or after today', () => {
    expect(findNextRehearsalDate(['2026-10-13', '2026-10-27', '2026-10-22'], '2026-10-16')).toBe('2026-10-22');
    expect(findNextRehearsalDate(['2026-10-16'], '2026-10-16')).toBe('2026-10-16');
  });

  test('returns null when there is no upcoming rehearsal', () => {
    expect(findNextRehearsalDate([], '2026-10-16')).toBeNull();
    expect(findNextRehearsalDate(['2026-10-01'], '2026-10-16')).toBeNull();
  });

  test('counts days and labels the countdown in Hungarian', () => {
    expect(daysUntil('2026-10-16', '2026-10-22')).toBe(6);
    expect(daysUntil('2026-03-28', '2026-03-30')).toBe(2);
    expect(rehearsalCountdownLabel(0)).toBe('Ma');
    expect(rehearsalCountdownLabel(1)).toBe('Holnap');
    expect(rehearsalCountdownLabel(6)).toBe('6 nap múlva');
  });

  test('todayIso uses the local date, not UTC', () => {
    expect(todayIso(new Date(2026, 9, 16, 23, 30))).toBe('2026-10-16');
    expect(todayIso(new Date(2026, 9, 17, 0, 15))).toBe('2026-10-17');
  });
});

describe('pickNextRehearsal', () => {
  test('returns the entries of the next date in their original order', () => {
    const entries = [
      { date: '2026-10-13', id: 'old' },
      { date: '2026-10-22', id: 'b' },
      { date: '2026-10-22', id: 'a' },
      { date: '2026-10-27', id: 'later' },
    ];
    expect(pickNextRehearsal(entries, '2026-10-16')).toEqual({ date: '2026-10-22', entries: [entries[1], entries[2]] });
    expect(pickNextRehearsal(entries, '2026-11-01')).toBeNull();
  });
});

describe('day state and week strip', () => {
  test('past days with songs are done, today and future are planned', () => {
    expect(dayState('2026-10-13', '2026-10-16', 3)).toBe('done');
    expect(dayState('2026-10-16', '2026-10-16', 3)).toBe('plan');
    expect(dayState('2026-10-22', '2026-10-16', 5)).toBe('plan');
    expect(dayState('2026-10-20', '2026-10-16', 0)).toBe('empty');
  });

  test('week strip starts on the Monday of the anchor week', () => {
    const dates = weekStripDates('2026-10-16');
    expect(dates[0]).toBe('2026-10-12');
    expect(dates).toHaveLength(14);
    expect(dates[13]).toBe('2026-10-25');
    expect(weekStripDates('2026-10-12', 7)).toHaveLength(7);
    expect(weekStripDates('2026-10-18')[0]).toBe('2026-10-12');
  });
});
