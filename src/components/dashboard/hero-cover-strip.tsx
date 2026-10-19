'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CoverArt } from '@/components/design/cover-art';
import { ease } from '@/lib/motion';

const SEEN_KEY = 'cm-hero-revealed';

interface CoverSong {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
}

/**
 * Up to 4 typographic covers across the top of the hero.
 * Spec A8: clip-path reveal, 450ms, 60ms stagger — once per session, never with reduced motion.
 */
export function HeroCoverStrip({ songs }: { songs: CoverSong[] }) {
  const reduce = useReducedMotion();
  const [instant, setInstant] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
    // Reading sessionStorage is only possible after mount; this flips once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstant(seen || !!reduce);
  }, [reduce]);

  const covers = songs.slice(0, 4);
  return (
    <div aria-hidden className="grid h-[120px] grid-cols-4 md:h-[210px]" style={{ gridTemplateColumns: `repeat(${Math.max(covers.length, 1)}, minmax(0, 1fr))` }}>
      {covers.map((song, i) => (
        <motion.div
          key={song.id}
          className="relative h-full"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={instant === null ? undefined : { clipPath: 'inset(0 0 0% 0)' }}
          transition={instant ? { duration: 0 } : { duration: 0.45, ease: ease.out, delay: i * 0.06 }}
        >
          <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType className="rounded-none" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-55% to-card/85" />
        </motion.div>
      ))}
    </div>
  );
}
