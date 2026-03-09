'use client';

import { useState } from 'react';
import { ListMusic, X } from 'lucide-react';
import { SongCard } from './song-card';
import { EmptyState } from '@/components/shared/empty-state';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import type { SongWithUser } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SongListProps {
  songs: SongWithUser[];
  searchQuery?: string;
}

export function SongList({ songs, searchQuery }: SongListProps) {
  const [playingSong, setPlayingSong] = useState<SongWithUser | null>(null);

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
      {playingSong && playingSong.youtubeUrl && (
        <div className="sticky top-16 z-10">
          <div className="rounded-xl border border-border/50 bg-card/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {playingSong.title}
                </p>
                <p className="text-[11px] text-muted-foreground/60">{playingSong.artist}</p>
              </div>
              <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0" onClick={() => setPlayingSong(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg">
              <YouTubePlayer url={playingSong.youtubeUrl} autoplay />
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onPlay={setPlayingSong} />
        ))}
      </div>
    </div>
  );
}
