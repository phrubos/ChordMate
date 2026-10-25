'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { toast } from 'sonner';
import { ResponsiveDialog } from '@/components/calendar/responsive-dialog';
import { assignSongToDate, getUpcomingRehearsals } from '@/actions/calendar';
import { todayIso, type UpcomingRehearsal } from '@/lib/calendar-utils';
import type { Song } from '@/types';
import { AddToRehearsalPanel } from './add-to-rehearsal-panel';

/** Puts a song on an upcoming rehearsal's setlist — or on a new day — from wherever the song is shown. */
export function AddToRehearsalDialog({ song, open, onOpenChange }: { song: Pick<Song, 'id' | 'title'>; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<UpcomingRehearsal[] | null>(null);

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

  // Closes and confirms at once; if the server says no, the same toast turns into an error with a retry.
  const add = (date: string) => {
    const id = `add-${song.id}-${date}`;
    onOpenChange(false);
    toast.success(`${song.title} → ${format(parseISO(date), 'MMM d.', { locale: hu })} próba`, { id });
    assignSongToDate(song.id, date)
      .then(() => router.refresh())
      .catch(() => toast.error('Nem sikerült hozzáadni', { id, description: song.title, action: { label: 'Újra', onClick: () => add(date) } }));
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Hozzáadás próbához" description={song.title}>
      <AddToRehearsalPanel upcoming={upcoming} today={todayIso()} onAdd={add} />
    </ResponsiveDialog>
  );
}
