'use client';

import { PendingLink } from '@/components/shared/pending-link';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarPlus, Clock, ListMusic, MapPin, Play, Theater, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Eyebrow } from '@/components/design/eyebrow';
import { ChipList } from '@/components/design/chip';
import { StatusBadge } from '@/components/design/status-badge';
import { CoverArt } from '@/components/design/cover-art';
import { AvatarStack, type StackUser } from '@/components/design/avatar-stack';
import { usePlayer } from '@/components/player/player-provider';
import { daysUntil, rehearsalCountdownLabel } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import type { CalendarEntryWithSong, Rehearsal } from '@/types';
import { formatTimeRange, kindLabel } from '@/lib/rehearsals';
import { HeroCoverStrip } from './hero-cover-strip';

interface NextRehearsalHeroProps {
  rehearsal: { date: string; entries: CalendarEntryWithSong[] } | null;
  members: StackUser[];
  today: string;
  bandName?: string | null;
  /** Details of that day (time, place, kind), when set. */
  meta?: Pick<Rehearsal, 'startTime' | 'endTime' | 'place' | 'kind'> | null;
}

const shell =
  'relative overflow-hidden rounded-md border border-primary/20 bg-[radial-gradient(90%_80%_at_0%_100%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_60%),linear-gradient(180deg,var(--card),var(--background))] shadow-[0_30px_60px_oklch(0_0_0/.35)]';

export function NextRehearsalHero({ rehearsal, members, today, bandName, meta }: NextRehearsalHeroProps) {
  const player = usePlayer();

  if (!rehearsal) {
    return (
      <section id="next" aria-labelledby="hero-title" className={cn(shell, 'flex flex-col items-start gap-4 p-6 md:p-10')}>
        <Eyebrow accent>Következő próba</Eyebrow>
        <h2 id="hero-title" className="display-soft font-display text-[40px] leading-none font-medium tracking-[-0.02em] md:text-[56px]">
          Még nincs tervezett próba
        </h2>
        <p className="max-w-[46ch] text-muted-foreground">Válassz egy napot a naptárban, és állítsd össze a setlistet — itt jelenik majd meg.</p>
        <a href="#calendar" className={buttonVariants({ size: 'lg' })}>
          <CalendarPlus />
          Próba tervezése
        </a>
      </section>
    );
  }

  const { date, entries } = rehearsal;
  const songs = entries.map((e) => e.song);
  const playable = songs.some((s) => s.youtubeUrl);
  const weekday = format(parseISO(date), 'EEEE', { locale: hu });
  const shortDate = format(parseISO(date), 'MMM d.', { locale: hu });
  const time = formatTimeRange(meta?.startTime ?? null, meta?.endTime ?? null);

  return (
    <section
      id="next"
      aria-labelledby="hero-title"
      className={cn(shell, 'grid gap-5 p-5 md:grid-cols-2 md:gap-x-14 md:gap-y-8 md:p-10')}
    >
      <div className="-mx-5 -mt-5 md:col-span-2 md:-mx-10 md:-mt-10">
        <HeroCoverStrip songs={songs} />
      </div>

      <div className="flex min-w-0 flex-col gap-[18px]">
        <Eyebrow accent icon={<span className="size-2 rounded-full bg-current shadow-[0_0_0_4px_color-mix(in_oklch,currentColor_20%,transparent)]" />}>
          Következő {meta?.kind === 'gig' ? kindLabel('gig').toLowerCase() : 'próba'} · {rehearsalCountdownLabel(daysUntil(today, date))}
        </Eyebrow>
        <h2 id="hero-title" className="display-soft font-display text-[40px] leading-[1.02] font-medium tracking-[-0.03em] md:text-[64px]">
          <PendingLink href={`/rehearsals/${date}`} className="hover:underline hover:decoration-2 hover:underline-offset-8">
            <span className="capitalize">{weekday}</span>, <em className="font-normal whitespace-nowrap text-primary">{shortDate}</em>
          </PendingLink>
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] text-muted-foreground">
          {time && (
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" aria-hidden />
              {time}
            </span>
          )}
          {meta?.place && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4" aria-hidden />
              {meta.place}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <ListMusic className="size-4" aria-hidden />
            <b className="font-semibold text-foreground">{songs.length}</b> dal
          </span>
          {bandName && (
            <span className="inline-flex items-center gap-2">
              <Users className="size-4" aria-hidden />
              {bandName}
            </span>
          )}
        </div>
        {members.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <AvatarStack users={members} />
            <span>{members.length} tag a bandában</span>
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2.5 pt-1.5">
          {songs.length > 0 ? (
            <PendingLink href={`/practice/${date}`} className={cn(buttonVariants({ size: 'lg' }), 'flex-1 md:flex-none')}>
              <Theater />
              Próba mód indítása
            </PendingLink>
          ) : (
            <PendingLink href={`/rehearsals/${date}`} className={cn(buttonVariants({ size: 'lg' }), 'flex-1 md:flex-none')}>
              <ListMusic />
              Setlist összeállítása
            </PendingLink>
          )}
          <Button variant="outline" size="lg" disabled={!playable} className="hidden md:inline-flex" onClick={() => player.play(songs.find((s) => s.youtubeUrl) ?? songs[0], songs)}>
            <Play />
            Setlist lejátszása
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-md border border-border bg-background/60 px-2 py-3.5 shadow-[inset_0_2px_10px_oklch(0_0_0/.35)]">
        <div className="flex items-center justify-between px-2 pb-2.5">
          <Eyebrow>Setlist</Eyebrow>
          <PendingLink href={`/rehearsals/${date}`} className="pressable -mx-1.5 rounded-md px-1.5 text-[13.5px] font-semibold text-primary-text [--press-scale:.985] hover:underline">Próba oldala →</PendingLink>
        </div>
        {entries.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Még nincs dal a setlistben.</p>}
        <ol aria-label="Setlist">
          {entries.map((entry, i) => {
            const s = entry.song;
            return (
              <li key={entry.id} className="grid grid-cols-[22px_40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-2 last:border-b-0 md:grid-cols-[26px_40px_minmax(0,1fr)_auto_auto]">
                <span className="text-right font-mono text-[12.5px] text-primary-text">{String(i + 1).padStart(2, '0')}</span>
                <CoverArt title={s.title} artist={s.artist} imageUrl={s.imageUrl} size="sm" />
                <PendingLink href={`/songs/${s.id}`} className="pressable -mx-1.5 flex min-w-0 flex-col rounded-md px-1.5 leading-tight [--press-scale:.985]">
                  <span className="display-soft truncate font-display text-[17px] font-medium" title={s.title}>{s.title}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{s.artist}</span>
                </PendingLink>
                <ChipList className="hidden md:inline-flex" items={[s.songKey, s.bpm ? `${s.bpm} BPM` : null]} />
                <StatusBadge status={s.status} compact className="md:hidden" />
                <StatusBadge status={s.status} className="hidden md:inline-flex" />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
