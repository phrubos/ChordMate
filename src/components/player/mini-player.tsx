'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Maximize2, Pause, Play, SkipBack, SkipForward, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { dur, ease, exitDur } from '@/lib/motion';
import { usePlayer } from './player-provider';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
