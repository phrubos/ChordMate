'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDown, Check, ChevronUp, Mic, Minus, Plus, SkipBack, SkipForward, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DEFAULT_BPM } from '@/lib/practice';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { BeatDots } from './beat-dots';

const RecordingModal = dynamic(() => import('@/components/tools/recording-modal').then((m) => ({ default: m.RecordingModal })), { ssr: false });

export const SCROLL_SPEEDS = { min: 0.5, max: 3, step: 0.5 };

interface PracticeControlsProps {
  song: Song;
  date: string;
  canPrev: boolean;
  /** On the last song 'Következő' becomes 'Befejezés' (opens the wrap-up). */
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  metronomeOn: boolean;
  onToggleMetronome: () => void;
  scrollOn: boolean;
  scrollSpeed: number;
  onToggleScroll: () => void;
  onScrollSpeed: (speed: number) => void;
  videoOn: boolean;
  onToggleVideo: () => void;
}

function Tool({ on, label, className, children, ...props }: { on?: boolean; label: string; className?: string; children: ReactNode } & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      className={cn(
        'inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-border-strong px-2 text-[13px] font-medium transition-[transform,border-color] duration-(--dur-press) ease-(--ease-out) hover:border-ring active:scale-[.97] disabled:pointer-events-none disabled:opacity-40 md:h-[52px] md:min-w-12 md:gap-2 md:px-4',
        on && 'border-primary bg-primary/10 text-primary-text',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Bottom bar: Előző | Metronóm | Görgetés (+ speed popover) | Videó | Felvétel | Következő. */
export function PracticeControls(p: PracticeControlsProps) {
  const [recOpen, setRecOpen] = useState(false);
  const bpm = p.song.bpm ?? DEFAULT_BPM;
  const step = (d: number) => p.onScrollSpeed(Math.min(SCROLL_SPEEDS.max, Math.max(SCROLL_SPEEDS.min, p.scrollSpeed + d)));

  return (
    <footer className="flex h-[72px] shrink-0 items-center justify-between gap-1.5 border-t border-border px-3 pb-[env(safe-area-inset-bottom)] md:h-[76px] md:px-5">
      <Button variant="outline" size="lg" className="max-md:size-11 max-md:px-0" disabled={!p.canPrev} onClick={p.onPrev} aria-label="Előző dal">
        <SkipBack />
        <span className="hidden md:inline">Előző</span>
      </Button>

      <div className="flex min-w-0 items-center gap-1 md:gap-2">
        <Tool on={p.metronomeOn} label={`Metronóm, ${bpm} BPM (Szóköz)`} onClick={p.onToggleMetronome}>
          <BeatDots bpm={bpm} playing={p.metronomeOn} />
          <span className="flex flex-col items-start leading-none">
            <b className="font-mono text-[15px] tabular-nums">{bpm}</b>
            <small className="hidden text-xs text-muted-foreground md:block">BPM</small>
          </span>
        </Tool>

        <div className="flex items-center">
          <Tool on={p.scrollOn} label={`Auto-görgetés, ${p.scrollSpeed}×`} onClick={p.onToggleScroll} className="rounded-r-none">
            <ArrowDown className="hidden size-4 md:block" />
            <span className="flex flex-col items-start leading-none">
              <b className="font-mono text-[15px] tabular-nums">{p.scrollSpeed}×</b>
              <small className="hidden text-xs text-muted-foreground md:block">Görgetés</small>
            </span>
          </Tool>
          <Popover>
            <PopoverTrigger
              render={
                <Tool label="Görgetési sebesség" className={cn('-ml-px min-w-0 rounded-l-none px-1 md:px-2', p.scrollOn && 'border-primary')}>
                  <ChevronUp className="size-4" />
                </Tool>
              }
            />
            <PopoverContent className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Lassabb" disabled={p.scrollSpeed <= SCROLL_SPEEDS.min} onClick={() => step(-SCROLL_SPEEDS.step)}>
                <Minus />
              </Button>
              <span className="w-12 text-center font-mono text-[15px] font-semibold tabular-nums" aria-live="polite">
                {p.scrollSpeed}×
              </span>
              <Button variant="ghost" size="icon" aria-label="Gyorsabb" disabled={p.scrollSpeed >= SCROLL_SPEEDS.max} onClick={() => step(SCROLL_SPEEDS.step)}>
                <Plus />
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <Tool on={p.videoOn} label="Videó" disabled={!p.song.youtubeUrl} title={p.song.youtubeUrl ? undefined : 'Nincs videó'} onClick={p.onToggleVideo}>
          <Video className="size-4" />
          <span className="hidden md:inline">Videó</span>
        </Tool>

        <Tool label="Felvétel" onClick={() => setRecOpen(true)}>
          <Mic className="size-4 text-destructive" />
          <span className="hidden md:inline">Felvétel</span>
        </Tool>
      </div>

      <Button size="lg" className="max-md:size-11 max-md:px-0" onClick={p.onNext} aria-label={p.isLast ? 'Befejezés' : 'Következő dal'}>
        <span className="hidden md:inline">{p.isLast ? 'Befejezés' : 'Következő'}</span>
        {p.isLast ? <Check /> : <SkipForward />}
      </Button>

      {recOpen && <RecordingModal open={recOpen} onOpenChange={setRecOpen} date={p.date} songId={p.song.id} />}
    </footer>
  );
}
