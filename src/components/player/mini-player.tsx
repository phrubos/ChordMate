'use client';

import { useRef, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react';
import { Maximize2, Pause, Play, SkipBack, SkipForward, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { dur, ease, exitDur, rubberband, shouldDismiss } from '@/lib/motion';
import { usePlayer } from './player-provider';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * A15: swipe the player away — down, left or right. It follows the finger 1:1 (rubber-band upwards) and fades;
 * a flick or a drag past 35% of the way out closes it with the finger's velocity. Touch only; a drag never also
 * presses the button under the finger. The × does the same for everyone else.
 */
function DismissDrag({ onDismiss, children }: { onDismiss: () => void; children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ lock: 'pending' | 'x' | 'y' | 'off'; down: number; side: number }>({ lock: 'off', down: 1, side: 1 });
  const swallowClick = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useTransform(() => {
    const g = gesture.current;
    return 1 - Math.min(Math.max(y.get() / g.down, Math.abs(x.get()) / g.side, 0), 1);
  });

  function onPanStart(e: PointerEvent) {
    const r = ref.current?.getBoundingClientRect();
    // How far each way the pill has to travel to be gone: to the screen bottom, or past the side edge.
    gesture.current = {
      lock: e.pointerType === 'mouse' ? 'off' : 'pending',
      down: Math.max(window.innerHeight - (r?.top ?? 0), 1),
      side: Math.max(window.innerWidth, 1),
    };
  }

  function onPan(_e: PointerEvent, info: PanInfo) {
    const g = gesture.current;
    const { x: dx, y: dy } = info.offset;
    if (g.lock === 'pending') {
      if (Math.hypot(dx, dy) < 10) return;
      g.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      swallowClick.current = true;
    }
    if (reduce) return;
    if (g.lock === 'x') x.set(dx);
    else if (g.lock === 'y') y.set(dy >= 0 ? dy : rubberband(dy, g.down));
  }

  function onPanEnd(_e: PointerEvent, info: PanInfo) {
    const g = gesture.current;
    const lock = g.lock;
    if (lock !== 'x' && lock !== 'y') return;
    g.lock = 'off';
    const value = lock === 'x' ? x : y;
    const offset = info.offset[lock];
    const velocity = info.velocity[lock];
    // Sideways either way counts: measure along the direction the finger went.
    const sign = lock === 'x' ? Math.sign(offset) || 1 : 1;
    const distance = lock === 'x' ? g.side : g.down;
    if (!shouldDismiss(offset * sign, velocity * sign, distance)) {
      animate(value, 0, { type: 'spring', bounce: 0, duration: dur.sheet, velocity });
    } else if (reduce) onDismiss();
    else animate(value, distance * sign, { type: 'spring', bounce: 0, duration: 0.25, velocity }).finished.then(onDismiss);
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y, opacity, touchAction: 'none' }}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
      onPointerDownCapture={() => (swallowClick.current = false)}
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </motion.div>
  );
}

/** Docked mini player: floating pill on desktop, above the bottom nav on mobile (spec A2). */
export function MiniPlayer() {
  const { current, state, progress, toggle, next, prev, close, expand } = usePlayer();
  const reduce = useReducedMotion();
  const pct = progress.duration ? (progress.current / progress.duration) * 100 : 0;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="mini-player"
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(100%)' }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }}
          exit={{
            opacity: 0,
            ...(reduce ? {} : { transform: 'translateY(100%)' }),
            transition: { duration: exitDur(dur.sheet), ease: ease.out },
          }}
          transition={{ duration: dur.sheet, ease: ease.drawer }}
          className="fixed inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 md:inset-x-0 md:bottom-5 md:mx-auto md:max-w-[760px]"
        >
          <DismissDrag onDismiss={close}>
            <div
              role="region"
              aria-label="Lejátszó"
              className="relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-full border border-border-strong bg-card/90 py-2 pr-2 pl-2 shadow-[0_16px_40px_oklch(0_0_0/.5)] backdrop-blur-xl md:grid-cols-[40px_minmax(0,1fr)_auto_auto_auto] md:gap-3.5"
            >
              <CoverArt title={current.title} artist={current.artist} imageUrl={current.imageUrl} size="sm" className="rounded-full" />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">{current.title}</span>
                <span className="truncate text-[13px] text-muted-foreground">
                  {current.artist}
                  <span className="ml-1.5 hidden items-center gap-1 text-faint sm:inline-flex">
                    <Video className="size-3" aria-hidden />
                    YouTube
                  </span>
                </span>
              </div>
              <span className="hidden font-mono text-[12.5px] text-muted-foreground tabular-nums md:inline">
                {formatTime(progress.current)} <span className="text-faint">/ {formatTime(progress.duration)}</span>
              </span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" aria-label="Előző" onClick={prev} className="hidden md:inline-flex">
                  <SkipBack />
                </Button>
                <Button size="icon" aria-label={state.isPlaying ? 'Szünet' : 'Lejátszás'} onClick={toggle}>
                  {state.isPlaying ? <Pause className="fill-current" /> : <Play className="ml-0.5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="Következő" onClick={next}>
                  <SkipForward />
                </Button>
                {/* Phones: the × lives with the controls (the video opens from the cover). */}
                <Button variant="ghost" size="icon" aria-label="Lejátszó bezárása" onClick={close} className="text-muted-foreground md:hidden">
                  <X />
                </Button>
              </div>
              <div className="hidden items-center md:flex">
                <Button variant="ghost" size="icon" aria-label="Videó megnyitása" onClick={() => expand(true)}>
                  <Maximize2 />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Lejátszó bezárása" onClick={close}>
                  <X />
                </Button>
              </div>
              <button type="button" className="absolute inset-y-0 left-0 w-14 md:hidden" aria-label="Videó megnyitása" onClick={() => expand(true)} />
              <span aria-hidden className="absolute inset-x-14 bottom-1 h-0.5 rounded-full bg-border">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </span>
            </div>
          </DismissDrag>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
