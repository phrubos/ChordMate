'use client';

import { cn } from '@/lib/utils';
import { Plus, Copy, X, Check, Music } from 'lucide-react';

interface CalendarDayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast?: boolean;
  songCount: number;
  onClick: () => void;
  onAddSong?: () => void;
  onCopyDate?: () => void;
  onDeleteDate?: () => void;
}

export function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  isPast,
  songCount,
  onClick,
  onAddSong,
  onCopyDate,
  onDeleteDate,
}: CalendarDayCellProps) {
  const hasSongs = songCount > 0 && isCurrentMonth;
  const isPastWithSongs = hasSongs && isPast;
  const isFutureWithSongs = hasSongs && !isPast;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'relative group outline-none flex h-14 w-full flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 md:h-[4.5rem]',
        isCurrentMonth
          ? 'hover:bg-card/80 cursor-pointer'
          : 'text-muted-foreground/30 cursor-default',
        // State: Today (subtle bottom bar via CSS class)
        isToday && !isSelected && 'today-marker',
        // State: Selected (interaction feedback)
        isSelected && 'bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary',
        // State: Future practice (warm amber right stripe)
        isFutureWithSongs && !isSelected && 'practice-day-upcoming',
        // State: Past practice (emerald green left stripe)
        isPastWithSongs && !isSelected && 'practice-day-completed'
      )}
    >
      {/* Day number */}
      <span className={cn(
        'relative z-10 text-[15px]',
        isToday && 'font-bold',
        isFutureWithSongs && !isSelected && 'text-primary',
        isPastWithSongs && !isSelected && 'text-muted-foreground'
      )}>
        {day}
      </span>

      {/* Upcoming badge: small filled amber dot, top-left */}
      {isFutureWithSongs && (
        <div className={cn(
          'absolute top-1.5 left-1.5 flex items-center justify-center size-4 rounded-full z-10',
          'bg-primary/15 ring-1 ring-primary/25',
          isSelected && 'bg-primary/25 ring-primary/40'
        )}>
          <Music className="size-2 text-primary" />
        </div>
      )}

      {/* Completed badge: emerald check, bottom-right */}
      {isPastWithSongs && (
        <div className={cn(
          'absolute bottom-1 right-1 flex items-center justify-center size-4 rounded-full z-10',
          'bg-emerald-500/20 ring-1 ring-emerald-500/30',
          isSelected && 'bg-emerald-500/30 ring-emerald-400/40'
        )}>
          <Check className="size-2.5 stroke-[3] text-emerald-400" />
        </div>
      )}

      {/* Subtle glow pulse for upcoming events only */}
      {isFutureWithSongs && !isSelected && (
        <div className="absolute inset-0 rounded-lg bg-primary/3 animate-glow-pulse pointer-events-none" />
      )}

      {/* Hover Actions (desktop only) */}
      {isCurrentMonth && (
        <div className="absolute top-1 right-1 gap-1 z-20 transition-opacity hidden md:group-hover:flex">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAddSong?.();
            }}
            title="Dal hozzáadása"
            className="flex size-5 items-center justify-center rounded-md bg-background/80 text-muted-foreground hover:text-primary hover:bg-background shadow-sm ring-1 ring-border/50 cursor-pointer"
          >
            <Plus className="size-3" />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCopyDate?.();
            }}
            title="Másolás másik napról"
            className="flex size-5 items-center justify-center rounded-md bg-background/80 text-muted-foreground hover:text-primary hover:bg-background shadow-sm ring-1 ring-border/50 cursor-pointer"
          >
            <Copy className="size-3" />
          </div>
          {hasSongs && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDate?.();
              }}
              title="Próba törlése"
              className="flex size-5 items-center justify-center rounded-md bg-background/80 text-muted-foreground hover:text-destructive hover:bg-background shadow-sm ring-1 ring-border/50 cursor-pointer"
            >
              <X className="size-3" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
