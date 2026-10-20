import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { SectionHeader } from '@/components/design/section-header';
import { cn } from '@/lib/utils';

interface PracticeDay {
  date: string;
  songCount: number;
  songs: string[];
}

/** "Próba történet": upcoming rehearsals first, then the last 10. Today counts as upcoming. */
export function PracticeHistory({ history, today }: { history: PracticeDay[]; today: string }) {
  const upcoming = history.filter((h) => h.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = history.filter((h) => h.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Próba történet" />
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Még nincs próbanap.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {upcoming.length > 0 && <DayList title="Következő próbák" days={upcoming} planned />}
          {past.length > 0 && <DayList title="Korábbi próbák" days={past} />}
        </div>
      )}
    </section>
  );
}

function DayList({ title, days, planned }: { title: string; days: PracticeDay[]; planned?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h3 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">{title}</h3>
      <ul>
        {days.map((d) => (
          <li key={d.date} className="grid grid-cols-[11px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2.5 first:border-t-0">
            <i className={cn('size-[11px] rounded-full', planned ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'bg-done')} aria-hidden />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[14.5px] font-semibold first-letter:uppercase">{format(parseISO(d.date), 'MMM d., EEEE', { locale: hu })}</span>
              <span className="truncate text-[13px] text-muted-foreground" title={d.songs.join(', ')}>{d.songs.join(', ')}</span>
            </span>
            <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{d.songCount} dal</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
