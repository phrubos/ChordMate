import { PendingLink } from '@/components/shared/pending-link';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarPlus, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { Eyebrow } from '@/components/design/eyebrow';
import { ChipList } from '@/components/design/chip';
import { daysUntil, rehearsalCountdownLabel } from '@/lib/calendar-utils';
import { formatTimeRange, type RehearsalDay } from '@/lib/rehearsals';
import { cn } from '@/lib/utils';

interface RehearsalListProps {
  upcoming: RehearsalDay[];
  past: RehearsalDay[];
  today: string;
}

export function RehearsalList({ upcoming, past, today }: RehearsalListProps) {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border-t border-border-strong pt-8">
        <p className="text-lg">Még nincs próba. Tervezz egyet!</p>
        <PendingLink href="/rehearsals?view=calendar" className={buttonVariants()}>
          <CalendarPlus />
          Próba tervezése
        </PendingLink>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-12">
      <Section title="Következő próbák" days={upcoming} today={today} empty="Nincs tervezett próba." />
      {past.length > 0 && <Section title="Korábbi próbák" days={past} today={today} />}
    </div>
  );
}

function Section({ title, days, today, empty }: { title: string; days: RehearsalDay[]; today: string; empty?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>{title}</Eyebrow>
      {days.length === 0 ? (
        <p className="border-t border-border-strong pt-4 text-muted-foreground">
          {empty}{' '}
          <PendingLink href="/rehearsals?view=calendar" className="font-semibold text-primary-text hover:underline">
            Próba tervezése
          </PendingLink>
        </p>
      ) : (
        <ul className="border-t border-border-strong">
          {days.map((d) => (
            <li key={d.date}>
              <RehearsalRow day={d} today={today} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RehearsalRow({ day, today }: { day: RehearsalDay; today: string }) {
  const parsed = parseISO(day.date);
  const time = formatTimeRange(day.meta?.startTime ?? null, day.meta?.endTime ?? null);
  return (
    <PendingLink
      href={`/rehearsals/${day.date}`}
      className="pressable group grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-3.5 transition-[transform,background-color] duration-(--dur-fade) [--press-scale:.985] hover:bg-muted/40 md:grid-cols-[64px_minmax(0,1fr)_auto] md:px-2"
    >
      <span className={cn('flex flex-col items-center leading-none', day.isPast && 'text-muted-foreground')}>
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase">{format(parsed, 'MMM', { locale: hu })}</span>
        <span className="display-soft font-display text-[30px] font-medium tabular-nums">{format(parsed, 'd')}</span>
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium capitalize">{format(parsed, 'EEEE', { locale: hu })}</span>
          {day.meta?.kind === 'gig' && (
            <span className="inline-flex h-6 items-center rounded-full bg-primary/12 px-2 text-xs font-semibold text-primary-text">Fellépés</span>
          )}
          {!day.isPast && <span className="text-[13px] text-primary-text">{rehearsalCountdownLabel(daysUntil(today, day.date))}</span>}
        </span>
        <ChipList items={[time, day.meta?.place, `${day.songCount} dal`]} />
        {day.meta?.goal && <span className="truncate text-[13.5px] text-muted-foreground">{day.meta.goal}</span>}
      </span>
      <ChevronRight className="size-4 text-faint transition-transform duration-(--dur-fade) group-hover:translate-x-0.5" aria-hidden />
    </PendingLink>
  );
}
