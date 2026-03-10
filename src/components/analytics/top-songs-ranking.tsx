'use client';

import { motion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { Medal, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopSong {
  title: string;
  artist: string;
  count: number;
  lastDate: string;
}

interface TopSongsRankingProps {
  songs: TopSong[];
}

const medalColors = [
  'text-amber-400',  // 🥇
  'text-gray-300',   // 🥈
  'text-amber-700',  // 🥉
];

export function TopSongsRanking({ songs }: TopSongsRankingProps) {
  if (songs.length === 0) return null;

  const maxCount = songs[0]?.count ?? 1;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md min-w-0">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Legtöbbet gyakorolt dalok
      </h3>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        {songs.map((song, idx) => {
          const pct = Math.round((song.count / maxCount) * 100);
          const isTop3 = idx < 3;

          return (
            <motion.div
              key={`${song.title}-${song.artist}`}
              variants={staggerItem}
              className="flex items-center gap-3"
            >
              {/* Rank badge */}
              <div className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black',
                isTop3 ? 'bg-primary/10' : 'bg-secondary/40',
                isTop3 && medalColors[idx]
              )}>
                {isTop3 ? (
                  <Medal className="size-3.5" />
                ) : (
                  <span className="text-muted-foreground">{idx + 1}</span>
                )}
              </div>

              {/* Song info + progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <span className={cn(
                      'text-sm font-semibold truncate block',
                      isTop3 && 'text-foreground'
                    )}>
                      {song.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      {song.artist}
                    </span>
                  </div>
                  <span className="text-sm font-black tabular-nums text-primary shrink-0">
                    {song.count}×
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-secondary/30 overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      isTop3 ? 'bg-primary' : 'bg-primary/50'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.08, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
