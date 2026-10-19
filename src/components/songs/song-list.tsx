'use client';

import { ListMusic, X } from 'lucide-react';
import { SongCard } from './song-card';
import { EmptyState } from '@/components/shared/empty-state';

import type { SongWithUser } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/components/player/player-provider';

interface SongListProps {
  songs: SongWithUser[];
  searchQuery?: string;
}

export function SongList({ songs, searchQuery }: SongListProps) {
  const player = usePlayer();

  if (songs.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          icon={ListMusic}
          illustration="search"
          title="Nincs találat"
          description={`Nincs találat erre: "${searchQuery}"`}
        />
      );
    }
    return (
      <EmptyState
        icon={ListMusic}
        illustration="songs"
        title="Még nincsenek dalok"
        description="Adj hozzá az első dalt, hogy elkezdhessétek a gyakorlást!"
      >
        <Link href="/songs/new">
          <Button>Első dal hozzáadása</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {songs.map((song) => (
          <div key={song.id} className="min-w-0 h-full">
            <SongCard song={song} onPlay={(song) => player.play(song, songs)} />
          </div>
        ))}
      </div>
    </div>
  );
}
