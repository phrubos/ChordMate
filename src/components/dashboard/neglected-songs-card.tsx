'use client';

import { useState } from 'react';
import { PendingLink } from '@/components/shared/pending-link';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Check, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/design/section-header';
import { CoverArt } from '@/components/design/cover-art';
import { assignSongToDate } from '@/actions/calendar';
import type { Song } from '@/types';

interface NeglectedSongsCardProps {
  items: { song: Song; daysSince: number | null }[];
  nextRehearsalDate: string | null;
}

export function NeglectedSongsCard({ items, nextRehearsalDate }: NeglectedSongsCardProps) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const label = nextRehearsalDate ? format(parseISO(nextRehearsalDate), 'MMM d.', { locale: hu }) : null;

  const mark = (id: string, on: boolean) =>
    setAdded((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Shown as added at once; taken back if the server says no.
  async function add(song: Song) {
    if (!nextRehearsalDate) return;
    mark(song.id, true);
    try {
      await assignSongToDate(song.id, nextRehearsalDate);
      toast.success(`${song.title} — felkerült a ${label} próbára`);
    } catch {
      mark(song.id, false);
      toast.error('Nem sikerült hozzáadni');
    }
  }

  return (
    <section aria-labelledby="neglected-title" className="flex flex-col gap-4">
      <SectionHeader eyebrow={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" />Javaslat</span>} title={<span id="neglected-title">Rég nem játszottátok</span>} />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Minden dal friss — szép munka!</p>
      ) : (
        <ul className="flex flex-col">
          {items.map(({ song, daysSince }) => (
            <li key={song.id} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-1.5">
              <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="sm" />
              <PendingLink href={`/songs/${song.id}`} className="pressable -mx-1.5 flex min-w-0 flex-col rounded-md px-1.5 leading-tight [--press-scale:.985]">
                <span className="truncate text-[14.5px] font-semibold">{song.title}</span>
                <span className="truncate text-[13px] text-muted-foreground">
                  {daysSince === null ? 'Még nem volt próbán' : `${daysSince} napja`} · {song.artist}
                </span>
              </PendingLink>
              {label &&
                (added.has(song.id) ? (
                  <span className="inline-flex h-8 items-center gap-1 px-2 text-[13px] font-semibold text-done">
                    <Check className="size-3.5" />
                    {label}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-8 border-dashed px-3 text-[13px]"
                    aria-label={`${song.title} hozzáadása a ${label} próbához`}
                    onClick={() => add(song)}
                  >
                    <Plus />
                    {label}
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
