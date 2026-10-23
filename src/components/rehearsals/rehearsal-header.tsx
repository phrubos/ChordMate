'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { ChevronLeft, Clock, ListMusic, MapPin, Pencil, Theater } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Eyebrow } from '@/components/design/eyebrow';
import { daysUntil, rehearsalCountdownLabel } from '@/lib/calendar-utils';
import { formatTimeRange, kindLabel } from '@/lib/rehearsals';
import type { Rehearsal } from '@/types';
import { RehearsalMetaDialog } from './rehearsal-meta-dialog';

interface RehearsalHeaderProps {
  date: string;
  meta: Rehearsal | null;
  songCount: number;
  today: string;
  preview?: boolean;
  /** Dev showcase: open the details dialog initially. */
  initialEditOpen?: boolean;
}

export function RehearsalHeader({ date, meta, songCount, today, preview, initialEditOpen = false }: RehearsalHeaderProps) {
  const [editOpen, setEditOpen] = useState(initialEditOpen);
  const parsed = parseISO(date);
  const isPast = date < today;
  const time = formatTimeRange(meta?.startTime ?? null, meta?.endTime ?? null);

  return (
    <header className="flex flex-col gap-5">
      <nav aria-label="Morzsamenü" className="text-sm text-muted-foreground">
        <Link href="/rehearsals" className="inline-flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden />
          Próbák
        </Link>
        <span aria-hidden className="mx-1.5 text-faint">/</span>
        <span aria-current="page">{format(parsed, 'MMM d.', { locale: hu })}</span>
      </nav>

      <div className="flex flex-col gap-2">
        <Eyebrow accent>
          {kindLabel(meta?.kind ?? 'rehearsal')} · {isPast ? 'Lezajlott' : rehearsalCountdownLabel(daysUntil(today, date))}
        </Eyebrow>
        <h1 className="display-soft font-display text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[60px]">
          <span className="capitalize">{format(parsed, 'EEEE', { locale: hu })}</span>,{' '}
          <em className="font-normal whitespace-nowrap text-primary">{format(parsed, 'MMM d.', { locale: hu })}</em>
        </h1>
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
            <b className="font-semibold text-foreground">{songCount}</b> dal
          </span>
        </div>
      </div>

      {(meta?.goal || meta?.notes) && (
        <div className="flex max-w-[64ch] flex-col gap-1.5 rounded-md border border-primary/20 bg-primary/6 px-4 py-3">
          {meta.goal && (
            <p>
              <span className="font-semibold">Cél:</span> {meta.goal}
            </p>
          )}
          {meta.notes && <p className="text-sm whitespace-pre-line text-muted-foreground">{meta.notes}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        {songCount > 0 ? (
          <Link href={`/practice/${date}`} className={buttonVariants({ size: 'lg' })}>
            <Theater />
            Próba mód indítása
          </Link>
        ) : (
          <Button size="lg" disabled title="Nincs setlist">
            <Theater />
            Próba mód indítása
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          Részletek szerkesztése
        </Button>
      </div>

      {editOpen && <RehearsalMetaDialog date={date} meta={meta} open={editOpen} onOpenChange={setEditOpen} preview={preview} />}
    </header>
  );
}
