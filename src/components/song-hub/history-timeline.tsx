import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/** "Próbákon": newest first; today and later count as planned. */
export function HistoryTimeline({ dates, today }: { dates: string[]; today: string }) {
  if (dates.length === 0) return <p className="text-sm text-muted-foreground">Még nem volt próbán.</p>;
  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border-strong">
      {dates.map((d) => {
        const done = d < today;
        const label = format(parseISO(d), 'MMM d.', { locale: hu });
        return (
          <li key={d} className="relative grid grid-cols-[11px_minmax(0,1fr)_auto] items-center gap-3.5">
            <i className={cn('size-[11px] rounded-full', done ? 'bg-done' : 'bg-background shadow-[inset_0_0_0_2px_var(--primary)]')} aria-hidden />
            <b className="text-[14.5px] font-semibold first-letter:uppercase">{label}</b>
            <span className="text-[13px] text-muted-foreground">{done ? 'lejátszva' : 'tervezve'}</span>
          </li>
        );
      })}
    </ol>
  );
}
