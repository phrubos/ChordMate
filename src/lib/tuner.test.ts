import { describe, expect, test } from 'vitest';
import { springStep } from './tuner';

describe('tuner spring', () => {
  test('springStep: settles on the target without overshoot', () => {
    let s = { value: -40, velocity: 0 };
    let max = -Infinity;
    for (let i = 0; i < 30; i++) {
      s = springStep(s, 0, 16);
      max = Math.max(max, s.value);
    }
    expect(max).toBeLessThanOrEqual(0);
    expect(Math.abs(s.value)).toBeLessThan(0.5);
  });

  test('springStep: one frame moves only part of the way (smooths jitter)', () => {
    const s = springStep({ value: 0, velocity: 0 }, 20, 16);
    expect(s.value).toBeGreaterThan(0);
    expect(s.value).toBeLessThan(10);
  });

  test('springStep: a long frame gap stays stable', () => {
    const s = springStep({ value: 30, velocity: 500 }, 0, 1000);
    expect(Math.abs(s.value)).toBeLessThan(0.01);
    expect(Number.isFinite(s.velocity)).toBe(true);
  });

  test('springStep: zero time changes nothing', () => {
    expect(springStep({ value: 5, velocity: 2 }, 0, 0)).toEqual({ value: 5, velocity: 2 });
  });
});
