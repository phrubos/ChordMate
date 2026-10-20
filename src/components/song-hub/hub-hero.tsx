'use client';

import { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Heart, Play, Theater } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { ChipList } from '@/components/design/chip';
import { DifficultyMeter } from '@/components/design/difficulty-meter';
import { Eyebrow } from '@/components/design/eyebrow';
import { usePlayer } from '@/components/player/player-provider';
import { SongActionsMenu } from '@/components/songs/song-actions-menu';
import { toggleFavorite } from '@/actions/songs';
import { hueFromString } from '@/lib/song-meta';
import { cn } from '@/lib/utils';
import type { SongWithUser } from '@/types';
import { StatusPicker } from './status-picker';

/** Hungarian names are family-name first: the given name is the last word. */
const givenName = (name: string | null | undefined) => name?.trim().split(/\s+/).at(-1) ?? null;

export function HubHero({ song, practiceHref }: { song: SongWithUser; practiceHref: string }) {
  const player = usePlayer();
  const [fav, setFav] = useOptimistic(song.isFavorite);
  const [, startTransition] = useTransition();
  const hue = hueFromString(`${song.artist} — ${song.title}`);
  const adder = givenName(song.addedBy?.name);

  function toggleFav() {
    startTransition(async () => {
      setFav(!fav);
      try {
        await toggleFavorite(song.id);
      } catch {
        toast.error('Nem sikerült menteni');
      }
    });
  }

  return (
    <section
      className="grid grid-cols-[108px_minmax(0,1fr)] gap-x-4 gap-y-3.5 rounded-[6px] p-[18px] md:grid-cols-[280px_minmax(0,1fr)] md:gap-x-11 md:gap-y-6 md:p-10"
      style={{
        ['--h' as string]: hue,
        background: 'radial-gradient(90% 120% at 0% 100%, oklch(.55 .12 var(--h) / .32), transparent 60%), linear-gradient(180deg, color-mix(in oklch, oklch(.5 .05 var(--h)) 12%, var(--card)), var(--card))',
      }}
    >
      <div className="size-[108px] md:row-span-2 md:self-center shadow-[0_30px_60px_oklch(0_0_0/.45)] md:size-[280px]">
        <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 md:gap-3 md:self-end">
        <Eyebrow>
          {['Dal', adder && `hozzáadta ${adder}`, format(song.createdAt, 'yyyy. MMM', { locale: hu })].filter(Boolean).join(' · ')}
        </Eyebrow>
        <h1 className="display-soft font-display text-[32px] leading-[1.02] font-medium tracking-[-0.02em] break-words md:text-[80px]">{song.title}</h1>
        <p className="font-display text-lg text-muted-foreground italic md:text-2xl">{song.artist}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ChipList
            items={[
              song.songKey,
              song.bpm ? `${song.bpm} BPM` : null,
              song.capo ? `Capo ${song.capo}` : null,
              song.tuning && !/standard/i.test(song.tuning) ? `Hangolás: ${song.tuning}` : null,
            ]}
          />
          <DifficultyMeter level={song.difficulty} />
        </div>
      </div>

      <div className="col-span-2 flex flex-col gap-4 md:col-span-1 md:self-start">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>Hol tartunk?</Eyebrow>
          <StatusPicker songId={song.id} status={song.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link href={practiceHref} className={cn(buttonVariants({ size: 'lg' }), 'max-md:h-10 max-md:px-4')}>
            <Theater />
            Gyakorlás
          </Link>
          {song.youtubeUrl && (
            <Button variant="outline" size="lg" className="max-md:h-10 max-md:px-4" onClick={() => player.play(song)}>
              <Play className="fill-current" />
              Lejátszás
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label={fav ? 'Kedvenc törlése' : 'Kedvencnek jelölés'} aria-pressed={fav} onClick={toggleFav}>
            <Heart className={cn(fav && 'fill-current text-fav')} />
          </Button>
          <SongActionsMenu song={song} />
        </div>
      </div>
    </section>
  );
}
