'use client';

import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DayState } from '@/lib/calendar-utils';

interface WeekStripProps {
  dates: string[];
  today: string;
  selected: string | null;
  stateByDate: Record<string, DayState>;
  onSelect: (date: string) => void;
}

/** Horizontally scrollable 14-day strip (mobile default calendar view). */
export function WeekStrip({ dates, today, selected, stateByDate, onSelect }: WeekStripProps) {
  return (
    <div role="listbox" aria-label="Heti nézet" className="-mx-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
      {dates.map((date) => {
        const d = parseISO(date);
        const state = stateByDate[date] ?? 'empty';
        const isToday = date === today;
        const isSelected = date === selected;
        return (
          <button
            key={date}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-label={`${format(d, 'MMMM d., EEEE', { locale: hu })}${state === 'empty' ? '' : state === 'done' ? ', lezajlott próba' : ', tervezett próba'}`}
            onClick={() => onSelect(date)}
            className={cn(
              'flex min-w-11 flex-[0_0_calc((100%-36px)/7)] snap-start flex-col items-center gap-0.5 rounded-full border border-border bg-card pt-2.5 pb-3 transition-colors duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-1',
              isToday && 'border-primary bg-primary text-primary-foreground',
              isSelected && !isToday && 'border-primary bg-primary/12'
            )}
          >
            <span className={cn('text-xs capitalize', isToday ? 'opacity-80' : 'text-faint')}>{format(d, 'EEEEEE', { locale: hu })}</span>
            <span className="display-soft font-display text-[19px] font-medium">{d.getDate()}</span>
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full',
                state === 'done' && (isToday ? 'bg-primary-foreground' : 'bg-muted-foreground'),
                state === 'plan' && (isToday ? 'shadow-[inset_0_0_0_1.5px_var(--primary-foreground)]' : 'shadow-[inset_0_0_0_1.5px_var(--primary)]')
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
