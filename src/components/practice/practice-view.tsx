'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useStoredNumber } from '@/hooks/use-stored-number';
import { TabSizeControl } from '@/components/song-hub/tab-size-control';
import { useMetronome } from '@/hooks/use-metronome';
import { ease } from '@/lib/motion';
import { clampIndex, DEFAULT_BPM } from '@/lib/practice';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { PracticeTopBar } from './practice-top-bar';
import { PracticeInfo } from './practice-info';
import { PracticeSheet } from './practice-sheet';
import { PracticeControls } from './practice-controls';
import { PracticeWrapUp } from './practice-wrap-up';
import { useAutoScroll } from './use-auto-scroll';
import { useWakeLock } from './use-wake-lock';

type Source = 'button' | 'keyboard' | 'initial';

interface PracticeViewProps {
  /** Rehearsal day, or today for a solo session — recordings are filed under it. */
  date: string;
  songs: Song[];
  /** Eyebrow above the title, e.g. "okt. 29. próba" or "Gyakorlás". */
  label: string;
  /** Where × and Esc lead. */
  exitHref?: string;
  initialIndex: number;
  /** Keep `?i=` (1-based) in sync with the current song; off in the dev showcase. */
  syncUrl?: boolean;
  /** Dev showcase: the wrap-up neither saves nor navigates. */
  preview?: boolean;
  className?: string;
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function PracticeView({ date, songs, label, exitHref = '/dashboard', initialIndex, syncUrl = true, preview, className }: PracticeViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [nav, setNav] = useState<{ index: number; direction: 1 | -1; source: Source }>({
    index: clampIndex(initialIndex, songs.length),
    direction: 1,
    source: 'initial',
  });
  const sheetRef = useRef<HTMLElement>(null);
  const { index, direction, source } = nav;
  const song = songs[index];

  const [scroll, setScroll] = useState({ on: false, speed: 1 });
  const [videoOn, setVideoOn] = useState(false);
  const [finished, setFinished] = useState(false);
  const isDesktop = useIsDesktop();
  const [storedSize, setTabSize] = useStoredNumber(isDesktop ? 'chordmate:practice-tab-size' : 'chordmate:practice-tab-size-mobile');
  const tabSize = storedSize ?? (isDesktop ? 18 : 15);
  const metronome = useMetronome({ bpm: song?.bpm ?? DEFAULT_BPM });
  const toggleMetronome = metronome.toggle;
  const isLast = index === songs.length - 1;

  useWakeLock(true);
  useAutoScroll(sheetRef, { enabled: scroll.on, speed: scroll.speed });

  const go = useCallback(
    (delta: 1 | -1, from: Source) => {
      setNav((prev) => {
        const next = clampIndex(prev.index + delta, songs.length);
        return next === prev.index ? prev : { index: next, direction: delta, source: from };
      });
      setScroll((sc) => (sc.on ? { ...sc, on: false } : sc));
    },
    [songs.length]
  );

  // Past the last song: stop everything and ask "Hogy ment?".
  const finish = useCallback(() => {
    if (metronome.isPlaying) toggleMetronome();
    setScroll((sc) => ({ ...sc, on: false }));
    setVideoOn(false);
    setFinished(true);
  }, [metronome.isPlaying, toggleMetronome]);
  const next = useCallback((from: Source) => (isLast ? finish() : go(1, from)), [isLast, finish, go]);

  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
    if (syncUrl && source !== 'initial') router.replace(`${pathname}?i=${index + 1}`, { scroll: false });
  }, [index, source, syncUrl, pathname, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (finished) {
        if (e.key === 'Escape' && !preview) router.push(exitHref);
        return;
      }
      // A focused button handles Space itself.
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.closest('button, a, [role="button"]')) return;
      if (e.key === 'ArrowRight') next('keyboard');
      else if (e.key === 'ArrowLeft') go(-1, 'keyboard');
      else if (e.key === ' ') toggleMetronome();
      else if (e.key === 'Escape') router.push(exitHref);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, next, router, toggleMetronome, exitHref, finished, preview]);

  // A3: slide + fade only for pointer-initiated changes; keyboard changes are instant.
  const animate = source === 'button';

  if (finished) {
    return (
      <div className={cn('flex h-dvh flex-col overflow-hidden', className)}>
        <PracticeTopBar index={songs.length - 1} total={songs.length} animate={false} exitHref={exitHref} />
        <PracticeWrapUp songs={songs} label={label} exitHref={exitHref} preview={preview} />
      </div>
    );
  }

  return (
    <div className={cn('flex h-dvh flex-col overflow-hidden', className)}>
      <PracticeTopBar index={index} total={songs.length} animate={animate} exitHref={exitHref}>
        {song.tabContent && <TabSizeControl size={tabSize} onChange={setTabSize} />}
      </PracticeTopBar>
      <motion.div
        key={index}
        className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[340px_minmax(0,1fr)]"
        initial={animate ? { opacity: 0, x: direction * 24 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: ease.out }}
      >
        <aside className="hidden md:block md:overflow-y-auto md:border-r md:border-border md:px-7 md:py-7">
          <PracticeInfo song={song} next={songs[index + 1]} label={label} onNext={() => go(1, 'button')} />
        </aside>
        <PracticeSheet
          ref={sheetRef}
          song={song}
          fontSize={tabSize}
          header={!isDesktop && <PracticeInfo song={song} next={songs[index + 1]} label={label} onNext={() => go(1, 'button')} />}
        />
      </motion.div>
      {videoOn && song.youtubeUrl && isDesktop && (
        <div className="fixed right-5 bottom-[92px] z-40 w-[380px] overflow-hidden rounded-[6px] bg-card shadow-[0_24px_48px_oklch(0_0_0/.5)] ring-1 ring-border-strong">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="truncate text-[13px] font-medium text-muted-foreground">{song.title} — videó</span>
            <Button variant="ghost" size="icon-sm" aria-label="Videó bezárása" onClick={() => setVideoOn(false)}>
              <X />
            </Button>
          </div>
          <YouTubePlayer key={song.id} url={song.youtubeUrl} />
        </div>
      )}
      <Sheet open={videoOn && !!song.youtubeUrl && !isDesktop} onOpenChange={setVideoOn}>
        <SheetContent>
          <SheetTitle>{song.title}</SheetTitle>
          {song.youtubeUrl && <YouTubePlayer key={song.id} url={song.youtubeUrl} />}
        </SheetContent>
      </Sheet>
      <PracticeControls
        song={song}
        date={date}
        canPrev={index > 0}
        isLast={isLast}
        onPrev={() => go(-1, 'button')}
        onNext={() => next('button')}
        metronomeOn={metronome.isPlaying}
        onToggleMetronome={toggleMetronome}
        scrollOn={scroll.on}
        scrollSpeed={scroll.speed}
        onToggleScroll={() => setScroll((sc) => ({ ...sc, on: !sc.on }))}
        onScrollSpeed={(speed) => setScroll({ on: true, speed })}
        videoOn={videoOn && !!song.youtubeUrl}
        onToggleVideo={() => setVideoOn((v) => !v)}
      />
    </div>
  );
}
