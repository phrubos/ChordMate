'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls, type PanInfo } from 'motion/react';
import { dur, ease, rubberband } from '@/lib/motion';
import { swipeDelta } from '@/lib/practice';
import { cn } from '@/lib/utils';

/** A wide tab that can still scroll toward the finger keeps the gesture (inner scroll first, like iOS). */
function innerScrollWins(target: EventTarget | null, root: HTMLElement, dx: number) {
  for (let el = target instanceof Element ? target : null; el && el !== root; el = el.parentElement) {
    if (!(el instanceof HTMLElement) || el.scrollWidth <= el.clientWidth + 1) continue;
    const overflow = getComputedStyle(el).overflowX;
    if (overflow !== 'auto' && overflow !== 'scroll') continue;
    if (dx < 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 0) return true;
  }
  return false;
}

interface SongSwipeProps {
  canPrev: boolean;
  canNext: boolean;
  /** +1 next, −1 previous — called once the old song has slid away. */
  onSwipe: (delta: 1 | -1) => void;
  /** A3 enter: start this many px to the side, or `false` for an instant change. */
  enterFrom: number | false;
  className?: string;
  children: ReactNode;
}

/**
 * A12: touch swipe between songs. The song follows the finger 1:1 (rubber-band at the first/last song),
 * the release momentum decides, and the old song carries the finger's velocity out. Mouse drags are ignored
 * (text selection); reduced motion keeps only the fade.
 */
export function SongSwipe({ canPrev, canNext, onSwipe, enterFrom, className, children }: SongSwipeProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ lock: 'pending' | 'x' | 'off'; width: number }>({ lock: 'off', width: 1 });
  const leaving = useRef(false);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const alive = useRef(true);
  const x = useMotionValue(0);
  // Fully faded once it has slid half a screen away; barely dimmed while still deciding.
  const opacity = useTransform(x, (v) => 1 - Math.min(Math.abs(v) / (gesture.current.width * 0.5), 1) ** 2);

  useEffect(() => {
    alive.current = true; // StrictMode re-runs effects after a cleanup
    return () => {
      alive.current = false;
      controls.current?.stop();
    };
  }, []);

  function onPanStart(e: PointerEvent) {
    // Grabbing a song that is springing back takes it over from where it is; one that is leaving is committed.
    if (!leaving.current) controls.current?.stop();
    gesture.current = { lock: e.pointerType === 'mouse' || leaving.current ? 'off' : 'pending', width: ref.current?.offsetWidth || 1 };
  }

  function onPan(e: PointerEvent, info: PanInfo) {
    const g = gesture.current;
    const { x: dx, y: dy } = info.offset;
    if (g.lock === 'pending') {
      if (Math.hypot(dx, dy) < 10) return;
      g.lock = Math.abs(dx) > Math.abs(dy) && ref.current && !innerScrollWins(e.target, ref.current, dx) ? 'x' : 'off';
    }
    if (g.lock !== 'x' || reduce) return;
    x.set((dx > 0 ? canPrev : canNext) ? dx : rubberband(dx, g.width));
  }

  function onPanEnd(_e: PointerEvent, info: PanInfo) {
    const g = gesture.current;
    if (g.lock !== 'x') return;
    g.lock = 'off';
    const velocity = info.velocity.x;
    let delta = swipeDelta(info.offset.x, velocity, g.width);
    if ((delta === 1 && !canNext) || (delta === -1 && !canPrev)) delta = 0;
    if (delta === 0) {
      controls.current = animate(x, 0, { type: 'spring', bounce: 0, duration: dur.sheet, velocity });
      return;
    }
    if (reduce) return onSwipe(delta);
    leaving.current = true;
    controls.current = animate(x, -delta * g.width * 0.5, { type: 'spring', bounce: 0, duration: 0.2, velocity });
    controls.current.finished.then(() => alive.current && onSwipe(delta));
  }

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={enterFrom === false ? false : { opacity: 0, x: enterFrom }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: ease.out }}
    >
      <motion.div
        ref={ref}
        // touch-action stops at scroll containers, so the scrolling children (sheet, side column) need it too.
        className={cn('flex min-h-0 flex-1 flex-col *:touch-pan-y *:touch-pinch-zoom', className)}
        style={{ x, opacity, touchAction: 'pan-y pinch-zoom' }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
