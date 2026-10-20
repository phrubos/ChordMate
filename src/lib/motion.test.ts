import { describe, expect, test } from 'vitest';
import { ease, exitDur } from './motion';

describe('motion tokens', () => {
  test('exit duration is ~65% of the enter duration', () => {
    expect(exitDur(0.3)).toBe(0.195);
    expect(exitDur(0.2)).toBe(0.13);
  });

  test('ease-out matches the spec curve', () => {
    expect([...ease.out]).toEqual([0.23, 1, 0.32, 1]);
  });
});
