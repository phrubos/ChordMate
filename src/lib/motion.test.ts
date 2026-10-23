import { describe, expect, test } from 'vitest';
import { ease, exitDur, projectMomentum, rubberband, sheetShouldClose } from './motion';

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

  test('sheetShouldClose: flick down closes, flick up keeps, else 35% of the height', () => {
    expect(sheetShouldClose(20, 600, 500)).toBe(true);
    expect(sheetShouldClose(300, -400, 500)).toBe(false);
    expect(sheetShouldClose(190, 0, 500)).toBe(true);
    expect(sheetShouldClose(120, 0, 500)).toBe(false);
    expect(sheetShouldClose(150, 400, 500)).toBe(true);
  });
});
