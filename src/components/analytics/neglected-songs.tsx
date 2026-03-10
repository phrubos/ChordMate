'use client';

import { motion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { AlertTriangle, Calendar, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';

interface NeglectedSong {
  title: string;
  artist: string;
  count: number;
  lastDate: string;
}

interface NeglectedSongsProps {
  songs: NeglectedSong[];
}

export function NeglectedSongs({ songs }: NeglectedSongsProps) {
  if (songs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Elhanyagolt dalok
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
          <Calendar className="size-8 mb-2" />
          <p className="text-sm">Nincs elhanyagolt dal! 🎉</p>
          <p className="text-xs mt-1">Minden dalod friss!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Elhanyagolt dalok
        </h3>
        <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
          {songs.length}
        </span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        {songs.map((song) => {
          const lastPracticed = formatDistanceToNow(new Date(song.lastDate + 'T00:00:00'), {
            addSuffix: true,
            locale: hu,
          });

          return (
            <motion.div
              key={`${song.title}-${song.artist}`}
              variants={staggerItem}
              className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/30 p-3 transition-colors hover:bg-card/60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{song.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{song.artist}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium text-amber-400">{lastPracticed}</p>
                <p className="text-[10px] text-muted-foreground">{song.count}× összesen</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
