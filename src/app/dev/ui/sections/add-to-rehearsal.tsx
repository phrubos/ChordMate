'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/calendar/responsive-dialog';
import { AddToRehearsalPanel } from '@/components/songs/add-to-rehearsal-panel';
import { upcomingRehearsals } from '@/lib/calendar-utils';
import { FIXTURE_TODAY, fixtureEntries, fixtureSongs } from '../fixtures';

const song = fixtureSongs[0];
const upcoming = upcomingRehearsals(fixtureEntries, FIXTURE_TODAY, song.id);

/** "Hozzáadás próbához": loaded, empty and loading bodies, plus the real dialog / sheet (adding closes it, like the real one). */
export function AddToRehearsalSection({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const add = (date: string) => {
    setOpen(false);
    console.log('[dev] add', song.title, date);
  };
  return (
    <section id="add-to-rehearsal" className="flex flex-col gap-6">
      <Button className="self-start" onClick={() => setOpen(true)}>
        Hozzáadás próbához megnyitása
      </Button>
      <div className="grid gap-6 lg:grid-cols-3">
        {[upcoming, [], null].map((rows, i) => (
          <div key={i} className="flex min-w-0 flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:p-5">
            <AddToRehearsalPanel upcoming={rows} today={FIXTURE_TODAY} onAdd={add} />
          </div>
        ))}
      </div>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Hozzáadás próbához" description={song.title}>
        <AddToRehearsalPanel upcoming={upcoming} today={FIXTURE_TODAY} onAdd={add} />
      </ResponsiveDialog>
    </section>
  );
}
