import { describe, expect, test } from 'vitest';
import { durationLabel, formatTimeRange, isIsoDate, listRehearsalDays, minutesBetween, shiftTime } from './rehearsals';

const meta = { startTime: '19:00', endTime: null, place: 'Pince', kind: 'rehearsal' as const, goal: null };

describe('listRehearsalDays', () => {
  test('merges setlist days and metadata-only days', () => {
    const { upcoming, past } = listRehearsalDays(
      [{ date: '2026-10-29' }, { date: '2026-10-29' }, { date: '2026-10-16' }],
      [{ date: '2026-11-05', ...meta }],
      '2026-10-23'
    );
    expect(upcoming.map((d) => d.date)).toEqual(['2026-10-29', '2026-11-05']);
    expect(upcoming.map((d) => d.songCount)).toEqual([2, 0]);
    expect(upcoming[1].meta?.startTime).toBe('19:00');
    expect(upcoming[0].meta).toBeNull();
    expect(past).toEqual([{ date: '2026-10-16', songCount: 1, meta: null, isPast: true }]);
  });

  test('today counts as upcoming; past is newest first', () => {
    const { upcoming, past } = listRehearsalDays([{ date: '2026-10-23' }, { date: '2026-10-01' }, { date: '2026-10-10' }], [], '2026-10-23');
    expect(upcoming[0].isPast).toBe(false);
    expect(past.map((d) => d.date)).toEqual(['2026-10-10', '2026-10-01']);
  });
});

test('formatTimeRange', () => {
  expect(formatTimeRange('19:00', '21:30')).toBe('19:00–21:30');
  expect(formatTimeRange('19:00', null)).toBe('19:00');
  expect(formatTimeRange(null, null)).toBeNull();
});

test('shiftTime steps within the day and clamps to 00:00–23:45', () => {
  expect(shiftTime('19:00', 15)).toBe('19:15');
  expect(shiftTime('19:50', 15)).toBe('20:05');
  expect(shiftTime('09:00', -60)).toBe('08:00');
  expect(shiftTime('23:30', 60)).toBe('23:45');
  expect(shiftTime('00:10', -15)).toBe('00:00');
});

test('minutesBetween', () => {
  expect(minutesBetween('19:00', '21:30')).toBe(150);
  expect(minutesBetween('19:00', '18:00')).toBe(-60);
});

test('durationLabel', () => {
  expect(durationLabel(45)).toBe('45 perc');
  expect(durationLabel(120)).toBe('2 óra');
  expect(durationLabel(90)).toBe('1,5 óra');
  expect(durationLabel(135)).toBe('2 óra 15 perc');
});

test('isIsoDate rejects malformed and impossible dates', () => {
  expect(isIsoDate('2026-10-29')).toBe(true);
  expect(isIsoDate('2026-13-40')).toBe(false);
  expect(isIsoDate('2026-02-30')).toBe(false);
  expect(isIsoDate('abc')).toBe(false);
});
