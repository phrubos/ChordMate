'use client';

import { Suspense } from 'react';
import { PlayerProvider } from '@/components/player/player-provider';
import { SongFilters } from '@/components/songs/song-filters';
import { SongList } from '@/components/songs/song-list';
import { countByStatus } from '@/lib/song-meta';
import { fixtureSongs } from '../fixtures';

export function SongsSection() {
  return (
    <section id="songs" className="flex flex-col gap-10">
      <PlayerProvider>
        <Suspense>
          <SongFilters counts={countByStatus(fixtureSongs)} />
        </Suspense>
        <SongList songs={fixtureSongs.slice(0, 8)} view="grid" />
        <SongList songs={fixtureSongs.slice(0, 6)} view="list" />
      </PlayerProvider>
    </section>
  );
}
