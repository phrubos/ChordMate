'use client';

import { cn } from '@/lib/utils';

interface CalendarDayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  songCount: number;
  onClick: () => void;
}

export function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  songCount,
  onClick,
}: CalendarDayCellProps) {
  const hasSongs = songCount > 0 && isCurrentMonth;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex h-14 w-full flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 md:h-[4.5rem]',
        isCurrentMonth
          ? 'hover:bg-card/80 cursor-pointer'
          : 'text-muted-foreground/30 cursor-default',
        isToday && !isSelected && 'ring-1 ring-primary/50',
        isSelected && 'bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary',
        hasSongs && !isSelected && 'practice-day-glow bg-primary/5'
      )}
    >
      <span className={cn(
        'relative z-10 text-[15px]',
        isToday && 'font-bold',
        hasSongs && !isSelected && 'text-primary'
      )}>
        {day}
      </span>

      {/* "Próba" label for practice days */}
      {hasSongs && isCurrentMonth && (
        <span className={cn(
          'absolute bottom-1 text-[9px] font-semibold uppercase tracking-wide',
          isSelected ? 'text-primary' : 'text-primary/70'
        )}>
          Próba
        </span>
      )}

      {/* Glow effect for practice days */}
      {hasSongs && isCurrentMonth && (
        <div className="absolute inset-0 rounded-lg bg-primary/5 animate-glow-pulse pointer-events-none" />
      )}
    </button>
  );
}
