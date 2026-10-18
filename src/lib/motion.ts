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
