'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Heart, Play } from 'lucide-react';
import { CoverArt } from '@/components/design/cover-art';
import { ChipList } from '@/components/design/chip';
import { StatusBadge } from '@/components/design/status-badge';
import { DifficultyMeter } from '@/components/design/difficulty-meter';
import type { Song } from '@/types';
import { SongActionsMenu } from './song-actions-menu';

interface SongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
}

/** Liner-style album card: typographic cover, play on cover, always-visible actions menu. */
export const SongCard = memo(function SongCard({ song, onPlay }: SongCardProps) {
  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[2px] shadow-[0_2px_0_oklch(0_0_0/.2)] transition-[transform,box-shadow] duration-250 ease-(--ease-out) hover-device:group-hover:-translate-y-[3px] hover-device:group-hover:rotate-[-0.4deg] hover-device:group-hover:shadow-[0_18px_36px_oklch(0_0_0/.55),0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent)] motion-reduce:transform-none">
        <Link href={`/songs/${song.id}`} tabIndex={-1} aria-hidden className="absolute inset-0">
          <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType />
        </Link>
        {song.isFavorite && (
          <span className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm" title="Kedvenc">
            <Heart className="size-3.5 fill-current" aria-label="Kedvenc" />
          </span>
        )}
        {onPlay && song.youtubeUrl && (
          <button
            type="button"
            onClick={() => onPlay(song)}
            aria-label={`Lejátszás: ${song.title}`}
            className="absolute right-2.5 bottom-2.5 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_oklch(0_0_0/.5)] transition-[opacity,transform] duration-200 ease-(--ease-out) active:scale-[.97] hover-device:translate-y-1.5 hover-device:opacity-0 hover-device:group-hover:translate-y-0 hover-device:group-hover:opacity-100 hover-device:focus-visible:translate-y-0 hover-device:focus-visible:opacity-100"
          >
            <Play className="ml-0.5 size-4 fill-current" />
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/songs/${song.id}`} className="display-soft min-w-0 font-display text-[17px] leading-tight font-medium tracking-[-0.01em] hover:underline md:text-[21px]">
            {song.title}
          </Link>
          <SongActionsMenu song={song} className="-mt-1 -mr-2 shrink-0" />
        </div>
        <span className="truncate text-[13.5px] text-muted-foreground">{song.artist}</span>
        <ChipList className="mt-1.5" items={[song.songKey, song.bpm ? `${song.bpm} BPM` : null, song.capo ? `Capo ${song.capo}` : null]} />
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
          <StatusBadge status={song.status} />
          <DifficultyMeter level={song.difficulty} showLabel={false} />
        </div>
      </div>
    </article>
  );
});
