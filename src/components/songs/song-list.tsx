'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { ListMusic, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SongCard } from './song-card';
import { EmptyState } from '@/components/shared/empty-state';

const YouTubePlayer = dynamic(() => import('@/components/youtube/youtube-player').then(m => ({ default: m.YouTubePlayer })), { ssr: false });
import type { SongWithUser } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { staggerContainer, staggerItem } from '@/lib/motion';

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
      <Dialog open={!!playingSong} onOpenChange={(open) => !open && setPlayingSong(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-3xl p-0 overflow-visible bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Videó lejátszása: {playingSong?.title}</DialogTitle>
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-12 right-0 rounded-full bg-background/80 hover:bg-background shadow-md border-border/50"
              onClick={() => setPlayingSong(null)}
            >
              <X className="size-4" />
            </Button>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border/50 shadow-2xl">
              {playingSong && playingSong.youtubeUrl && (
                <YouTubePlayer url={playingSong.youtubeUrl} autoplay />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {songs.map((song) => (
          <motion.div key={song.id} variants={staggerItem} className="min-w-0 h-full">
            <SongCard song={song} onPlay={setPlayingSong} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
