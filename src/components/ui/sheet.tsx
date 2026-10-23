'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { rubberband, sheetShouldClose } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet (mobile). Enters with translateY(100%) → 0, 300ms ease-drawer; exits in 200ms (spec A2).
 * The handle drags it down 1:1 and a flick or a long pull closes it (spec A13).
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

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !popupRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const follow = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    drag.current = { startY: e.clientY, height: popupRef.current.offsetHeight, follow, samples: [{ t: e.timeStamp, y: e.clientY }] };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    d.samples = [...d.samples.filter((s) => e.timeStamp - s.t < 100), { t: e.timeStamp, y: e.clientY }];
    const dy = e.clientY - d.startY;
    if (d.follow) setOffset(dy >= 0 ? dy : rubberband(dy, d.height), '');
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    // Only the last 100ms before release count: a finger that stopped before lifting has no momentum.
    const recent = d.samples.filter((s) => e.timeStamp - s.t < 100);
    const first = recent[0];
    const dt = first ? e.timeStamp - first.t : 0;
    const velocity = dt > 0 ? ((e.clientY - first.y) / dt) * 1000 : 0;
    // The exit keyframe has no `from`, so closing continues from where the finger left the sheet.
    if (sheetShouldClose(e.clientY - d.startY, velocity, d.height)) closeRef.current?.click();
    else setOffset(0, 'var(--dur-sheet) var(--ease-drawer)');
  }

  function onPointerCancel() {
    if (!drag.current) return;
    drag.current = null;
    setOffset(0, 'var(--dur-sheet) var(--ease-drawer)');
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        ref={backdropRef}
        className="fixed inset-0 z-[70] bg-scrim/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-[70] flex max-h-[88dvh] flex-col gap-4 rounded-t-2xl border-t border-border-strong bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] text-card-foreground outline-none',
          'duration-300 ease-(--ease-drawer) data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom data-closed:duration-200 data-closed:ease-(--ease-out) motion-reduce:data-open:slide-in-from-bottom-0 motion-reduce:data-closed:slide-out-to-bottom-0',
          className
        )}
        {...props}
      >
        {/* Full-width, 28px-tall grab zone; keyboard users close with Esc or the sheet's own button. */}
        <div
          aria-hidden
          className="-mx-4 -mt-3 -mb-3 flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
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
