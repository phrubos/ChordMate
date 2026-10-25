'use client';

import { useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { ResponsiveDialog } from './responsive-dialog';

interface CopyDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: string;
  sourceDates: { date: string; titles: string[] }[];
  onCopy: (from: string) => Promise<void>;
}

export function CopyDayDialog({ open, onOpenChange, targetDate, sourceDates, onCopy }: CopyDayDialogProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={`Setlist másolása · ${format(parseISO(targetDate), 'MMM d.', { locale: hu })}`}>
      <p className="text-sm text-muted-foreground">Melyik nap setlistjét másoljuk ide?</p>
      <ul className="-mx-1 flex max-h-[50vh] flex-col overflow-y-auto">
        {sourceDates.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">Nincs másik nap dalokkal</li>
        ) : (
          sourceDates.map(({ date, titles }) => (
            <li key={date}>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await onCopy(date);
                    onOpenChange(false);
                  })
                }
                className="pressable flex w-full items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left transition-[transform,background-color] duration-(--dur-fade) [--press-scale:.985] hover:bg-muted/60 disabled:opacity-50"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold capitalize">{format(parseISO(date), 'MMMM d., EEEE', { locale: hu })}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{titles.join(', ')}</span>
                </span>
                <span className="font-mono text-xs text-primary-text tabular-nums">{titles.length} dal</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </ResponsiveDialog>
  );
}
