'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ease } from '@/lib/motion';
import { clampIndex } from '@/lib/practice';
import { cn } from '@/lib/utils';
import type { CalendarEntryWithSong } from '@/types';
import { PracticeTopBar } from './practice-top-bar';
import { PracticeInfo } from './practice-info';
import { PracticeSheet } from './practice-sheet';
import { useWakeLock } from './use-wake-lock';

type Source = 'button' | 'keyboard' | 'initial';

interface PracticeViewProps {
  date: string;
  entries: CalendarEntryWithSong[];
  initialIndex: number;
  /** Keep `?i=` (1-based) in sync with the current song; off in the dev showcase. */
  syncUrl?: boolean;
  className?: string;
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function PracticeView({ date, entries, initialIndex, syncUrl = true, className }: PracticeViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const songs = entries.map((e) => e.song);
  const [nav, setNav] = useState<{ index: number; direction: 1 | -1; source: Source }>({
    index: clampIndex(initialIndex, songs.length),
    direction: 1,
    source: 'initial',
  });
  const sheetRef = useRef<HTMLElement>(null);
  const { index, direction, source } = nav;
  const song = songs[index];

  useWakeLock(true);

  const go = useCallback(
    (delta: 1 | -1, from: Source) => {
      setNav((prev) => {
        const next = clampIndex(prev.index + delta, songs.length);
        return next === prev.index ? prev : { index: next, direction: delta, source: from };
      });
    },
    [songs.length]
  );

  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
    if (syncUrl && source !== 'initial') router.replace(`${pathname}?i=${index + 1}`, { scroll: false });
  }, [index, source, syncUrl, pathname, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === 'ArrowRight') go(1, 'keyboard');
      else if (e.key === 'ArrowLeft') go(-1, 'keyboard');
      else if (e.key === 'Escape') router.push('/dashboard');
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, router]);

  // A3: slide + fade only for pointer-initiated changes; keyboard changes are instant.
  const animate = source === 'button';

  return (
    <div className={cn('flex h-dvh flex-col overflow-hidden', className)}>
      <PracticeTopBar index={index} total={songs.length} animate={animate} />
      <motion.div
        key={index}
        className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[340px_minmax(0,1fr)]"
        initial={animate ? { opacity: 0, x: direction * 24 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: ease.out }}
      >
        <aside className="shrink-0 border-b border-border px-4 py-4 md:overflow-y-auto md:border-r md:border-b-0 md:px-7 md:py-7">
          <PracticeInfo song={song} next={songs[index + 1]} date={date} onNext={() => go(1, 'button')} />
        </aside>
        <PracticeSheet ref={sheetRef} song={song} />
      </motion.div>
      <footer className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-t border-border px-3 pb-[env(safe-area-inset-bottom)] md:h-[76px] md:px-5">
        <Button variant="outline" size="lg" disabled={index === 0} onClick={() => go(-1, 'button')} aria-label="Előző dal">
          <SkipBack />
          <span className="hidden sm:inline">Előző</span>
        </Button>
        <Button size="lg" disabled={index >= songs.length - 1} onClick={() => go(1, 'button')} aria-label="Következő dal">
          <span className="hidden sm:inline">Következő</span>
          <SkipForward />
        </Button>
      </footer>
    </div>
  );
}
