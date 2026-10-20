'use client';

import { useEffect, type RefObject } from 'react';
import { scrollStepPx } from '@/lib/practice';

/** Scrolls `ref` down at `speed` (0.5–3×) with rAF; stops at the bottom. */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, { enabled, speed }: { enabled: boolean; speed: number }) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let frame = 0;
    let carry = 0; // sub-pixel remainder: scrollTop only takes whole pixels in some browsers
    const tick = () => {
      carry += scrollStepPx(speed);
      const whole = Math.floor(carry);
      if (whole > 0) {
        el.scrollTop += whole;
        carry -= whole;
      }
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref, enabled, speed]);
}
