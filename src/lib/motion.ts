import type { Transition } from 'motion/react';

/** Custom easing curves (spec §6). Never use ease-in for UI. */
export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** Durations in seconds. UI stays under 300ms. */
export const dur = {
  press: 0.16,
  fade: 0.15,
  popover: 0.18,
  dialog: 0.2,
  sheet: 0.3,
} as const;

/** Exit animations run at ~65% of the enter duration. */
export function exitDur(enter: number): number {
  return Math.round(enter * 0.65 * 1000) / 1000;
}

export const springs = {
  /** Sliding indicators (segmented controls, nav). */
  indicator: { type: 'spring', duration: 0.3, bounce: 0 } as Transition,
};

/** Extra px a flick would travel at `velocity` px/s (Apple's deceleration projection, rate 0.99). */
export function projectMomentum(velocity: number, rate = 0.99): number {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/** Past an edge the content follows less and less (iOS rubber-banding). */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Bottom sheet drag-to-dismiss: a clear downward flick, or heading past 35% of its height. */
export function sheetShouldClose(offset: number, velocity: number, height: number): boolean {
  if (velocity >= 500) return true;
  if (velocity <= -300) return false;
  return offset + projectMomentum(velocity) >= height * 0.35;
}
