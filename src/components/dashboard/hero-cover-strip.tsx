'use client';

import { useEffect, useRef } from 'react';
import { CoverArt } from '@/components/design/cover-art';
import { HERO_SEEN_KEY } from '@/lib/motion';

interface CoverSong {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
}

/**
 * Up to 4 typographic covers across the top of the hero.
 * Spec A8: clip-path reveal, 450ms, 60ms stagger — once per session, never with reduced motion.
 * Pure CSS (`.hero-cover` in globals.css), so the covers paint before hydration; the root layout marks
 * `<html data-hero-seen>` before first paint on later loads, and the end of the reveal marks it for this session.
 */
export function HeroCoverStrip({ songs }: { songs: CoverSong[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function markSeen() {
      document.documentElement.dataset.heroSeen = '';
      try {
        sessionStorage.setItem(HERO_SEEN_KEY, '1');
      } catch {}
    }
    // The reveal may already be over by hydration; otherwise wait for it (marking earlier would cut it short).
    const running = ref.current?.lastElementChild?.getAnimations() ?? [];
    Promise.all(running.map((a) => a.finished)).then(markSeen, () => {});
  }, []);

  const covers = songs.slice(0, 4);
  return (
    <div ref={ref} aria-hidden className="grid h-[120px] grid-cols-4 md:h-[210px]" style={{ gridTemplateColumns: `repeat(${Math.max(covers.length, 1)}, minmax(0, 1fr))` }}>
      {covers.map((song, i) => (
        <div
          key={song.id}
          className="hero-cover relative h-full"
          style={{ '--i': i } as React.CSSProperties}
        >
          <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType className="rounded-none" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% to-card/85" />
        </div>
      ))}
    </div>
  );
}
