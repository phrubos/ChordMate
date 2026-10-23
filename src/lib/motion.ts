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
/** sessionStorage key: the A8 hero reveal already played this session. */
export const HERO_SEEN_KEY = 'cm-hero-revealed';

export function projectMomentum(velocity: number, rate = 0.99): number {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/** Past an edge the content follows less and less (iOS rubber-banding). */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Horizontal paging swipe (songs, months): +1 next, −1 previous, 0 snap back.
 * Decided on where the gesture is heading (offset + momentum), not where it was released;
 * a clear flick always counts, a fast flick back the other way cancels.
 */
export function swipeDelta(offset: number, velocity: number, width: number): -1 | 0 | 1 {
  if (Math.abs(velocity) > 300 && Math.sign(velocity) !== Math.sign(offset)) return 0;
  if (Math.abs(velocity) >= 500) return velocity < 0 ? 1 : -1; // a clear flick, however short
  const projected = offset + projectMomentum(velocity);
  if (Math.abs(projected) < width * 0.3) return 0;
  return projected < 0 ? 1 : -1;
}

/** Drag-to-dismiss (sheet, mini player): a clear downward flick, or heading past 35% of `distance`. */
export function shouldDismiss(offset: number, velocity: number, distance: number): boolean {
  if (velocity >= 500) return true;
  if (velocity <= -300) return false;
  return offset + projectMomentum(velocity) >= distance * 0.35;
}
