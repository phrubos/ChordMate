'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { rubberband, shouldDismiss } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet (mobile). Enters with translateY(100%) → 0, 300ms ease-drawer; exits in 200ms (spec A2).
 * It drags down 1:1 — by the handle, or on touch anywhere its content can't scroll — and a flick or a long pull
 * closes it (spec A13).
 */
function Sheet(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

interface SheetDrag {
  startY: number;
  height: number;
  follow: boolean;
  /** Last ~100ms of pointer positions, for the release velocity. */
  samples: { t: number; y: number }[];
}

/** Can something between `target` and the sheet scroll the content for a finger moving by `dy`? */
function innerScrollWins(target: EventTarget | null, sheet: HTMLElement, dy: number): boolean {
  for (let el = target instanceof Element ? target : null; el && el !== sheet; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
    if (dy < 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
  }
  return false;
}

function SheetContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  const popupRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const drag = React.useRef<SheetDrag | null>(null);

  // Direct style writes: a drag updates every frame, so no React state and no CSS variables.
  function setOffset(y: number, transition: string) {
    const popup = popupRef.current;
    const backdrop = backdropRef.current;
    if (!popup) return;
    popup.style.transition = transition && `transform ${transition}`;
    popup.style.transform = y ? `translateY(${y}px)` : '';
    if (backdrop) {
      backdrop.style.transition = transition && `opacity ${transition}`;
      backdrop.style.opacity = y > 0 ? String(1 - Math.min(y / popup.offsetHeight, 1)) : '';
    }
  }

  function begin(y: number, t: number) {
    if (!popupRef.current) return;
    const follow = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    drag.current = { startY: y, height: popupRef.current.offsetHeight, follow, samples: [{ t, y }] };
  }

  function moveTo(y: number, t: number) {
    const d = drag.current;
    if (!d) return;
    d.samples = [...d.samples.filter((s) => t - s.t < 100), { t, y }];
    const dy = y - d.startY;
    if (d.follow) setOffset(dy >= 0 ? dy : rubberband(dy, d.height), '');
  }

  function release(y: number, t: number) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    // Only the last 100ms before release count: a finger that stopped before lifting has no momentum.
    const recent = d.samples.filter((s) => t - s.t < 100);
    const first = recent[0];
    const dt = first ? t - first.t : 0;
    const velocity = dt > 0 ? ((y - first.y) / dt) * 1000 : 0;
    if (!shouldDismiss(y - d.startY, velocity, d.height)) setOffset(0, 'var(--dur-sheet) var(--ease-drawer)');
    else if (!d.follow) closeRef.current?.click();
    else slideOut(Math.max(0, y - d.startY), velocity);
  }

  /**
   * Finish a drag-dismiss from where the finger let go, then close without the CSS exit. The exit keyframe has
   * no `from`, and some mobile browsers start it from an earlier position — the sheet jumped back up first.
   */
  function slideOut(offset: number, velocity: number) {
    const popup = popupRef.current;
    if (!popup) return;
    const remaining = Math.max(popup.offsetHeight - offset, 1);
    // --ease-out starts at ~4.3× its average speed: pick the duration that hands over the finger's velocity.
    const ms = Math.round(Math.min(260, Math.max(120, velocity > 0 ? ((4.3 * remaining) / velocity) * 1000 : 200)));
    popup.dataset.draggedOut = '';
    if (backdropRef.current) backdropRef.current.dataset.draggedOut = '';
    setOffset(popup.offsetHeight, `${ms}ms var(--ease-out)`);
    if (backdropRef.current) backdropRef.current.style.opacity = '0';
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      popup.removeEventListener('transitionend', onEnd);
      closeRef.current?.click();
    };
    // Children's transitions bubble here too; only the sheet's own transform counts.
    const onEnd = (e: TransitionEvent) => e.target === popup && e.propertyName === 'transform' && close();
    popup.addEventListener('transitionend', onEnd);
    window.setTimeout(close, ms + 80);
  }

  function cancel() {
    if (!drag.current) return;
    drag.current = null;
    setOffset(0, 'var(--dur-sheet) var(--ease-drawer)');
  }

  const dragRef = React.useRef({ begin, moveTo, release, cancel });
  React.useEffect(() => {
    dragRef.current = { begin, moveTo, release, cancel };
  });

  // Touch: the whole sheet is the handle unless its content can scroll that way. Without this, pulling the
  // sheet by its content chained to the page (address bar, pull-to-refresh) and the screen jumped.
  // Native non-passive listeners, because only a cancelable touchmove can keep the gesture from the page.
  const touchCleanup = React.useRef<(() => void) | null>(null);
  const attachTouch = React.useCallback((el: HTMLDivElement | null) => {
    popupRef.current = el;
    touchCleanup.current?.();
    touchCleanup.current = null;
    if (!el) return;
    let touch: { x: number; y: number; target: EventTarget | null; mode: 'pending' | 'native' | 'drag' } | null = null;
    const onStart = (e: TouchEvent) => {
      touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, target: e.target, mode: 'pending' } : null;
      if (!touch) dragRef.current.cancel();
    };
    const onMove = (e: TouchEvent) => {
      if (!touch || touch.mode === 'native') return;
      const p = e.touches[0];
      const dx = p.clientX - touch.x;
      const dy = p.clientY - touch.y;
      if (touch.mode === 'pending') {
        // The first move decides — a later one may no longer be cancelable.
        if (!dy || Math.abs(dx) > Math.abs(dy) || innerScrollWins(touch.target, el, dy)) {
          touch.mode = 'native';
          return;
        }
        touch.mode = 'drag';
        dragRef.current.begin(touch.y, e.timeStamp);
      }
      if (e.cancelable) e.preventDefault();
      dragRef.current.moveTo(p.clientY, e.timeStamp);
    };
    const onEnd = (e: TouchEvent) => {
      if (touch?.mode === 'drag') {
        // No click on whatever is under the lifted finger.
        if (e.cancelable) e.preventDefault();
        dragRef.current.release(e.changedTouches[0].clientY, e.timeStamp);
      }
      touch = null;
    };
    const onCancel = () => {
      touch = null;
      dragRef.current.cancel();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('touchcancel', onCancel);
    touchCleanup.current = () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, []);

  // Mouse and pen: the grab zone only (elsewhere a drag selects text).
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    begin(e.clientY, e.timeStamp);
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        ref={backdropRef}
        className="fixed inset-0 z-[70] bg-scrim/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-dragged-out:animate-none!"
      />
      <DialogPrimitive.Popup
        ref={attachTouch}
        data-slot="sheet-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-[70] flex max-h-[88dvh] flex-col gap-4 overscroll-contain **:overscroll-contain rounded-t-2xl border-t border-border-strong bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-card-foreground outline-none',
          'duration-300 ease-(--ease-drawer) data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom data-closed:duration-200 data-closed:ease-(--ease-out) motion-reduce:data-open:slide-in-from-bottom-0 motion-reduce:data-closed:slide-out-to-bottom-0 data-dragged-out:animate-none!',
          className
        )}
        {...props}
      >
        {/* Full-width, 28px-tall grab zone (mouse/pen); keyboard users close with Esc or the sheet's own button. */}
        <div
          aria-hidden
          className="-mx-4 -mt-3 -mb-3 flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={(e) => e.pointerType !== 'touch' && moveTo(e.clientY, e.timeStamp)}
          onPointerUp={(e) => e.pointerType !== 'touch' && release(e.clientY, e.timeStamp)}
          onPointerCancel={(e) => e.pointerType !== 'touch' && cancel()}
        >
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </div>
        <DialogPrimitive.Close ref={closeRef} hidden tabIndex={-1} />
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn('display-soft font-display text-xl font-medium', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
