'use client';

import { cn } from '@/lib/utils';
import { Plus, Copy, X } from 'lucide-react';

interface CalendarDayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
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
  songCount,
  onClick,
  onAddSong,
  onCopyDate,
  onDeleteDate,
}: CalendarDayCellProps) {
  const hasSongs = songCount > 0 && isCurrentMonth;

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

      {/* "Próba" indicator for practice days */}
      {hasSongs && isCurrentMonth && (
        <div className={cn(
          'absolute bottom-1.5 size-1.5 rounded-full',
          isSelected ? 'bg-primary' : 'bg-primary/70'
        )} />
      )}

      {/* Glow effect for practice days */}
      {hasSongs && isCurrentMonth && (
        <div className="absolute inset-0 rounded-lg bg-primary/5 animate-glow-pulse pointer-events-none" />
      )}
      {/* Hover Actions */}
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
