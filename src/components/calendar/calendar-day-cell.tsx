'use client';

import { memo } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DayState } from '@/lib/calendar-utils';

interface CalendarDayCellProps {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  state: DayState;
  markHues: number[];
  extraCount: number;
  onSelect: (date: string) => void;
}

const PLAN_STRIPES =
  'bg-[repeating-linear-gradient(-45deg,transparent_0_6px,color-mix(in_oklch,var(--primary)_5%,transparent)_6px_7px)]';

export const CalendarDayCell = memo(function CalendarDayCell({
  date,
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  state,
  markHues,
  extraCount,
  onSelect,
}: CalendarDayCellProps) {
  const count = markHues.length + extraCount;
  const label = `${format(parseISO(date), 'MMMM d., EEEE', { locale: hu })}${
    count ? `, ${count} dal, ${state === 'done' ? 'lezajlott próba' : 'tervezett próba'}` : ''
  }`;

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-label={label}
      aria-pressed={isSelected}
      className={cn(
        'pressable relative flex min-h-14 flex-col items-start justify-between border-r border-b border-border p-1.5 text-left transition-colors duration-(--dur-fade) outline-none hover:bg-muted/50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring md:min-h-[84px] md:p-2 [--press-scale:1]',
        !isCurrentMonth && 'text-faint opacity-55',
        state === 'plan' && !isSelected && PLAN_STRIPES,
        isSelected && 'bg-primary/12 shadow-[inset_0_0_0_1px_var(--primary)]'
      )}
    >
      <span
        className={cn(
          'display-soft grid size-7 place-items-center rounded-full font-display text-base md:text-lg',
          isToday && 'bg-primary font-semibold text-primary-foreground shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_50%,transparent)]'
        )}
      >
        {day}
      </span>
      {count > 0 && (
        <span aria-hidden className="flex items-center gap-[3px]">
          {markHues.map((h, i) => (
            <span
              key={i}
              className="size-2 rounded-[1px] md:size-2.5"
              style={
                state === 'done'
                  ? { backgroundColor: `oklch(.66 .13 ${h})`, boxShadow: `0 0 6px oklch(.66 .13 ${h} / .55)` }
                  : { boxShadow: `inset 0 0 0 2px oklch(.7 .13 ${h})` }
              }
            />
          ))}
          {extraCount > 0 && <span className="ml-0.5 font-mono text-xs text-muted-foreground">+{extraCount}</span>}
        </span>
      )}
    </button>
  );
});
