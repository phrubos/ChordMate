import { describe, expect, test } from 'vitest';
import { beatIntervalMs, clampIndex, formatElapsed, nextBeatTime, scrollStepPx } from './practice';

describe('practice helpers', () => {
  test('clampIndex', () => {
    expect(clampIndex(7, 5)).toBe(4);
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(NaN, 3)).toBe(0);
  });

  test('beatIntervalMs: null → 80 BPM, clamped to 30–300', () => {
    expect(beatIntervalMs(null)).toBe(750);
    expect(beatIntervalMs(120)).toBe(500);
    expect(beatIntervalMs(1000)).toBe(200);
    expect(beatIntervalMs(10)).toBe(2000);
  });

  test('scrollStepPx: speed clamped to 0.5–3', () => {
    expect(scrollStepPx(10)).toBeCloseTo(1.05);
    expect(scrollStepPx(1)).toBeCloseTo(0.35);
    expect(scrollStepPx(0)).toBeCloseTo(0.175);
  });

  test('formatElapsed', () => {
    expect(formatElapsed(1457000)).toBe('00:24:17');
    expect(formatElapsed(0)).toBe('00:00:00');
  });

  test('nextBeatTime (seconds)', () => {
    expect(nextBeatTime(1, 120)).toBe(1.5);
    expect(nextBeatTime(0, 60)).toBe(1);
  });
});
