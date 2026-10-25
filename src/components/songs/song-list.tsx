'use client';

import { PendingLink } from '@/components/shared/pending-link';
import { ListMusic } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { usePlayer } from '@/components/player/player-provider';
import type { Song } from '@/types';
import { SongCard } from './song-card';
import { SongRow, SongTableHead } from './song-row';

interface SongListProps {
  songs: Song[];
  view: 'grid' | 'list';
  searchQuery?: string;
  filtered?: boolean;
}

export function SongList({ songs, view, searchQuery, filtered }: SongListProps) {
  const player = usePlayer();
  const onPlay = (song: Song) => player.play(song, songs);

  if (songs.length === 0) {
    if (searchQuery || filtered) {
      return (
        <EmptyState
          icon={ListMusic}
          illustration="search"
          title="Nincs találat"
          description={searchQuery ? `Nincs találat erre: „${searchQuery}”` : 'Egyik dal sem felel meg a szűrőknek.'}
        />
      );
    }
    return (
      <EmptyState icon={ListMusic} illustration="songs" title="Még nincsenek dalok" description="Adj hozzá az első dalt, hogy elkezdhessétek a gyakorlást!">
        <PendingLink href="/songs/new" className={buttonVariants()}>
          Első dal hozzáadása
        </PendingLink>
      </EmptyState>
    );
  }

  if (view === 'list') {
    return (
      <div role="table" aria-label="Dalok" className="border-t border-border-strong">
        <SongTableHead />
        {songs.map((song) => (
          <SongRow key={song.id} song={song} onPlay={onPlay} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-x-7 md:gap-y-10">
      {songs.map((song) => (
        <SongCard key={song.id} song={song} onPlay={onPlay} />
      ))}
    </div>
  );
}
