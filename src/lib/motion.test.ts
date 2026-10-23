import { describe, expect, test } from 'vitest';
import { ease, exitDur, projectMomentum, rubberband, shouldDismiss, swipeDelta } from './motion';

describe('motion tokens', () => {
  test('exit duration is ~65% of the enter duration', () => {
    expect(exitDur(0.3)).toBe(0.195);
    expect(exitDur(0.2)).toBe(0.13);
  });

  test('ease-out matches the spec curve', () => {
    expect([...ease.out]).toEqual([0.23, 1, 0.32, 1]);
  });
});

describe('gesture physics', () => {
  test('projectMomentum: px/s → extra px travelled (decay 0.99)', () => {
    expect(projectMomentum(1000)).toBeCloseTo(99);
    expect(projectMomentum(-500)).toBeCloseTo(-49.5);
    expect(projectMomentum(0)).toBe(0);
  });

  test('rubberband: follows less the further it goes, keeps the sign', () => {
    expect(rubberband(0, 400)).toBe(0);
    expect(rubberband(100, 400)).toBeLessThan(55);
    expect(rubberband(400, 400)).toBeLessThan(rubberband(800, 400));
    expect(rubberband(-100, 400)).toBe(-rubberband(100, 400));
  });

  test('shouldDismiss: flick down closes, flick up keeps, else 35% of the distance', () => {
    expect(shouldDismiss(20, 600, 500)).toBe(true);
    expect(shouldDismiss(300, -400, 500)).toBe(false);
    expect(shouldDismiss(190, 0, 500)).toBe(true);
    expect(shouldDismiss(120, 0, 500)).toBe(false);
    expect(shouldDismiss(150, 400, 500)).toBe(true);
  });
});

describe('paging swipe', () => {
  test('swipeDelta: finger left → next, right → previous', () => {
    expect(swipeDelta(-150, 0, 400)).toBe(1);
    expect(swipeDelta(150, 0, 400)).toBe(-1);
  });

  test('swipeDelta: short drag without momentum snaps back', () => {
    expect(swipeDelta(-60, 0, 400)).toBe(0);
    expect(swipeDelta(-60, -100, 400)).toBe(0);
  });

  test('swipeDelta: a quick flick counts even when short', () => {
    expect(swipeDelta(-40, -900, 400)).toBe(1);
    expect(swipeDelta(20, 520, 400)).toBe(-1);
    expect(swipeDelta(-20, -450, 400)).toBe(0);
  });

  test('swipeDelta: a fast reversal cancels a long drag', () => {
    expect(swipeDelta(-200, 600, 400)).toBe(0);
  });
});
