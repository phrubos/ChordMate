'use client';

import { useEffect, useRef, useState } from 'react';
import { formatClock, seekKeyTarget, seekTime } from '@/lib/player-state';
import { cn } from '@/lib/utils';
import { usePlayer, usePlayerTime } from './player-provider';

/** A seek lands a moment later on YouTube; hold the target this long so the thumb doesn't snap back. */
const SEEK_HOLD_MS = 800;

interface SeekBarProps {
  /** Accessible name, e.g. "Lejátszási pozíció". */
  label: string;
  /** Sizes the hit area (keep it ≥ 20px tall for fingers); the line sits in its middle. */
  className?: string;
}

/**
 * A21: the player's position bar, and a control. Click or tap anywhere to jump; drag to scrub with a time
 * bubble over the thumb; arrow keys ±5s, Page ±30s, Home/End. A drag only seeks on release (YouTube can't
 * keep up with every frame). The drag preview is shared through the player store, so every bar and time
 * label shows the target while scrubbing.
 */
export function SeekBar({ label, className }: SeekBarProps) {
  const { seek, current: track } = usePlayer();
  const { current, duration, scrub, setScrub } = usePlayerTime();
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const ready = duration > 0;

  useEffect(() => {
    if (held === null) return;
    const t = window.setTimeout(() => setHeld(null), SEEK_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [held]);

  // A new track starts at 0: forget the old target.
  const trackId = track?.id;
  const [heldFor, setHeldFor] = useState(trackId);
  if (heldFor !== trackId) {
    setHeldFor(trackId);
    setHeld(null);
  }

  const shown = scrub ?? (held !== null && Math.abs(current - held) > 0.75 ? held : current);
  const fraction = ready ? Math.min(Math.max(shown / duration, 0), 1) : 0;
  const bubble = scrub ?? hover;

  function timeAt(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    return r ? seekTime(clientX, r.left, r.width, duration) : 0;
  }

  function commit(t: number) {
    seek(t);
    setHeld(t);
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={ready ? 0 : -1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${formatClock(shown)} / ${formatClock(duration)}`}
      aria-disabled={!ready || undefined}
      // The mini player's swipe-to-dismiss leaves gestures that start here alone.
      data-no-dismiss=""
      data-active={scrub !== null || undefined}
      className={cn(
        'group/seek relative flex touch-none items-center outline-none select-none',
        ready ? 'cursor-pointer' : 'pointer-events-none',
        className
      )}
      onPointerDown={(e) => {
        if (!ready || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        setHover(null);
        setScrub(timeAt(e.clientX));
      }}
      onPointerMove={(e) => {
        if (dragging.current) setScrub(timeAt(e.clientX));
        else if (e.pointerType === 'mouse') setHover(timeAt(e.clientX));
      }}
      onPointerUp={(e) => {
        if (!dragging.current) return;
        dragging.current = false;
        commit(timeAt(e.clientX));
        setScrub(null);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setScrub(null);
      }}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
      onKeyDown={(e) => {
        const t = seekKeyTarget(e.key, shown, duration);
        if (t === null) return;
        e.preventDefault();
        commit(t);
      }}
    >
      {/* The line thickens under the pointer (scaleY: transform only). */}
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-foreground/15 transition-transform duration-(--dur-press) motion-reduce:transition-none group-hover/seek:scale-y-[1.67] group-focus-visible/seek:scale-y-[1.67] group-data-active/seek:scale-y-[1.67]">
        {hover !== null && (
          <div className="absolute inset-0 origin-left bg-foreground/20" style={{ transform: `scaleX(${hover / duration})` }} />
        )}
        <div className="absolute inset-0 origin-left bg-primary" style={{ transform: `scaleX(${fraction})` }} />
      </div>
      {/* Full-width rails moved by translateX(%) carry the thumb and the bubble without layout work. */}
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${fraction * 100}%)` }}>
        <span className="absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary shadow-[0_0_0_2px_var(--card)] transition-transform duration-(--dur-press) motion-reduce:transition-none group-hover/seek:scale-100 group-focus-visible/seek:scale-100 group-data-active/seek:scale-[1.15]" />
      </span>
      {bubble !== null && ready && (
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-full" style={{ transform: `translateX(${(bubble / duration) * 100}%)` }}>
          <span className="absolute bottom-0.5 left-0 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[11px] font-medium text-background tabular-nums shadow-md animate-in fade-in-0 zoom-in-95 duration-(--dur-fade)">
            {formatClock(bubble)}
          </span>
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full group-focus-visible/seek:ring-2 group-focus-visible/seek:ring-ring" />
    </div>
  );
}

/** Elapsed time that follows a drag preview (shown in the primary colour while scrubbing). */
export function ElapsedTime({ className }: { className?: string }) {
  const { current, scrub } = usePlayerTime();
  return <span className={cn('tabular-nums', scrub !== null && 'text-primary-text', className)}>{formatClock(scrub ?? current)}</span>;
}

export function TotalTime({ className }: { className?: string }) {
  const { duration } = usePlayerTime();
  return <span className={cn('tabular-nums', className)}>{formatClock(duration)}</span>;
}
