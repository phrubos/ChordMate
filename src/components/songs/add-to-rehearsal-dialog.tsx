'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/calendar/responsive-dialog';
import { assignSongToDate, getUpcomingRehearsals } from '@/actions/calendar';
import { todayIso, type UpcomingRehearsal } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

const dayLabel = (date: string) => format(parseISO(date), 'EEEE, MMMM d.', { locale: hu });

/** Puts a song on an upcoming rehearsal's setlist — or on a new day — from wherever the song is shown. */
export function AddToRehearsalDialog({ song, open, onOpenChange }: { song: Pick<Song, 'id' | 'title'>; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<UpcomingRehearsal[] | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [pending, startTransition] = useTransition();
  const today = todayIso();

  useEffect(() => {
    if (!open) return;
    let stale = false;
    getUpcomingRehearsals(song.id)
      .then((rows) => !stale && setUpcoming(rows))
      .catch(() => !stale && setUpcoming([]));
    return () => {
      stale = true;
    };
  }, [open, song.id]);

  const onDate = upcoming?.find((r) => r.date === customDate);

  const add = (date: string) =>
    startTransition(async () => {
      try {
        await assignSongToDate(song.id, date);
        toast.success(`${song.title} → ${format(parseISO(date), 'MMM d.', { locale: hu })} próba`);
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error('Nem sikerült hozzáadni');
      }
    });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Hozzáadás próbához">
      <div className="flex flex-col gap-5">
        {upcoming === null ? (
          <p className="text-sm text-muted-foreground">Próbák betöltése…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs tervezett próba. Válassz napot lent — azzal létre is jön.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {upcoming.map((r) => {
              const already = r.position !== null;
              return (
                <li key={r.date}>
                  <button
                    type="button"
                    disabled={already || pending}
                    onClick={() => add(r.date)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-lg border border-border-strong px-3.5 py-2.5 text-left transition-colors duration-(--dur-fade)',
                      already ? 'cursor-default opacity-70' : 'hover:border-ring hover:bg-muted'
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold capitalize">{dayLabel(r.date)}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {r.date === today ? 'Ma · ' : ''}
                        {r.count} dal a setlisten
                      </span>
                    </span>
                    {already ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-status-ready">
                        <Check className="size-3.5" aria-hidden />
                        Már rajta · {r.position}. dal
                      </span>
                    ) : (
                      <Plus className="size-4 text-primary-text" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <label htmlFor="add-to-rehearsal-date" className="text-[13px] font-semibold text-muted-foreground">
            Másik nap
          </label>
          <div className="flex gap-2">
            <input
              id="add-to-rehearsal-date"
              type="date"
              min={today}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <Button disabled={!customDate || customDate < today || onDate?.position != null || pending} onClick={() => add(customDate)}>
              Hozzáadás
            </Button>
          </div>
          {onDate?.position != null && <p className="text-[13px] text-muted-foreground">Ezen a napon már a setlisten van.</p>}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
