'use client';

import { useEffect } from 'react';

/** A quick tap lasts ~50–100ms: hold the pressed look at least this long so it registers (spec A1). */
const MIN_PRESS_MS = 120;
/** A finger that travels further is dragging, not pressing (where nothing scrolls, no pointercancel comes). */
const SLOP_PX = 10;

/**
 * Touch/pen press feedback for `.pressable` elements: sets `data-pressed` on pointerdown, with no delay — the
 * browser's own :active waits to tell taps from scrolls, and iOS Safari skips it altogether. A scroll cancels
 * the pointer — or a move past SLOP_PX — which drops the look at once; a lift keeps it until MIN_PRESS_MS.
 */
export function PressFeedback() {
  useEffect(() => {
    let pressed: HTMLElement | null = null;
    let since = 0;
    let timer = 0;
    let start = { x: 0, y: 0 };

    const release = (el: HTMLElement) => delete el.dataset.pressed;
    const drop = (keep: boolean) => {
      const el = pressed;
      if (!el) return;
      pressed = null;
      const left = keep ? MIN_PRESS_MS - (performance.now() - since) : 0;
      if (left > 0) timer = window.setTimeout(() => release(el), left);
      else release(el);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !e.isPrimary || !(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>('.pressable');
      if (!el || el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return;
      window.clearTimeout(timer);
      if (pressed) release(pressed);
      pressed = el;
      since = performance.now();
      start = { x: e.clientX, y: e.clientY };
      el.dataset.pressed = '';
    };
    const onMove = (e: PointerEvent) => {
      if (pressed && e.isPrimary && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP_PX) drop(false);
    };
    const onUp = () => drop(true);
    const onCancel = () => drop(false);

    const opts = { capture: true, passive: true };
    document.addEventListener('pointerdown', onDown, opts);
    document.addEventListener('pointermove', onMove, opts);
    document.addEventListener('pointerup', onUp, opts);
    document.addEventListener('pointercancel', onCancel, opts);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onDown, opts);
      document.removeEventListener('pointermove', onMove, opts);
      document.removeEventListener('pointerup', onUp, opts);
      document.removeEventListener('pointercancel', onCancel, opts);
    };
  }, []);

  return null;
}
