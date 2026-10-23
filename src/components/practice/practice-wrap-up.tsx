'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { Eyebrow } from '@/components/design/eyebrow';
import { SegmentedControl } from '@/components/design/segmented-control';
import { STATUS_BG } from '@/components/design/status-badge';
import { setSongStatuses } from '@/actions/songs';
import { statusChanges, summarizeChanges } from '@/lib/practice';
import { SONG_STATUSES, statusLabel, type SongStatus } from '@/lib/song-meta';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

interface PracticeWrapUpProps {
  songs: Song[];
  label: string;
  exitHref: string;
  /** Dev showcase: no server call, no navigation. */
  preview?: boolean;
}

function summaryText(up: number, down: number): string {
  if (!up && !down) return 'Ha semmi sem változott, csak lépj ki — a próba így is az előzményekben marad.';
  return [up && `${up} dal lépett előre`, down && `${down} visszább`].filter(Boolean).join(', ') + '.';
}

/** A19 roll-in: the page arrives once at the end of a rehearsal, so it may take its time (CSS, transform/opacity). */
const ROLL_IN = 'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-400 ease-(--ease-out)';
const rowDelay = (i: number) => ({ animationDelay: `${80 + Math.min(i, 7) * 50}ms` });
/** A changed value swaps in with a small lift. */
const SWAP_IN = 'animate-in fade-in-0 slide-in-from-bottom-1 duration-(--dur-fade) ease-(--ease-out)';

/** End of a practice session: one tap per song to update its status ("Hogy ment?"). */
export function PracticeWrapUp({ songs, label, exitHref, preview }: PracticeWrapUpProps) {
  const router = useRouter();
  const before = Object.fromEntries(songs.map((s) => [s.id, s.status])) as Record<string, SongStatus>;
  const [picks, setPicks] = useState<Record<string, SongStatus>>(before);
  const [pending, startTransition] = useTransition();
  const changes = statusChanges(before, picks);
  const { up, down } = summarizeChanges(before, changes);

  const exit = () => !preview && router.push(exitHref);
  const save = () =>
    startTransition(async () => {
      if (changes.length > 0 && !preview) {
        try {
          await setSongStatuses(changes);
          toast.success(summaryText(up, down).replace(/\.$/, '') + ' — mentve');
        } catch {
          toast.error('Nem sikerült menteni');
          return;
        }
      }
      exit();
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-8 md:gap-8 md:px-8 md:py-12">
          <header className={cn('flex flex-col gap-2', ROLL_IN)}>
            <Eyebrow>{label} · vége</Eyebrow>
            <h1 className="display-soft font-display text-[36px] leading-tight font-medium tracking-[-0.02em] md:text-[52px]">Hogy ment?</h1>
            <p className="text-muted-foreground">Dalonként egy koppintás — ebből frissül a repertoár és a Kezdőlap.</p>
          </header>
          <ul className="flex flex-col gap-2.5">
            {songs.map((s, i) => {
              const cur = picks[s.id];
              const moved = cur !== before[s.id];
              return (
                <li key={s.id} className={cn('flex flex-col gap-3 rounded-lg bg-card p-3.5 sm:flex-row sm:items-center sm:gap-4', ROLL_IN)} style={rowDelay(i)}>
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <CoverArt title={s.title} artist={s.artist} imageUrl={s.imageUrl} size="md" />
                    <span className="flex min-w-0 flex-col">
                      <b className="truncate font-semibold">{s.title}</b>
                      <span key={cur} className={cn('text-[13px]', moved ? cn('font-semibold text-primary-text', SWAP_IN) : 'text-muted-foreground')}>
                        {moved ? `${statusLabel(before[s.id])} → ${statusLabel(cur)}` : `Eddig: ${statusLabel(before[s.id])}`}
                      </span>
                    </span>
                  </div>
                  <SegmentedControl<SongStatus>
                    ariaLabel={`Hogy ment: ${s.title}`}
                    value={cur}
                    onChange={(v) => setPicks((p) => ({ ...p, [s.id]: v }))}
                    options={SONG_STATUSES.map((st) => ({ value: st, label: statusLabel(st), dotClassName: STATUS_BG[st] }))}
                    className="w-full sm:w-fit"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:px-5">
        <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground" aria-live="polite">
          <span key={summaryText(up, down)} className={cn('block', SWAP_IN)}>
            {summaryText(up, down)}
          </span>
        </p>
        {changes.length > 0 && (
          <Button variant="outline" size="lg" onClick={exit} disabled={pending}>
            Elvetés
          </Button>
        )}
        <Button size="lg" onClick={save} disabled={pending}>
          {changes.length > 0 ? 'Mentés és kilépés' : 'Kilépés'}
        </Button>
      </footer>
    </div>
  );
}
