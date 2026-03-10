'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  format,
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAY_LABELS = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];

interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: string | null;
  songCountByDate: Record<string, number>;
  onSelectDate: (dateStr: string) => void;
  onAddSong?: (dateStr: string) => void;
  onCopyDate?: (dateStr: string) => void;
  onDeleteDate?: (dateStr: string) => void;
}

export function CalendarGrid({
  year,
  month,
  selectedDate,
  songCountByDate,
  onSelectDate,
  onAddSong,
  onCopyDate,
  onDeleteDate,
}: CalendarGridProps) {
  const monthDate = new Date(year, month - 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calStart = startOfWeek(monthStart, { locale: hu });
  const calEnd = endOfWeek(monthEnd, { locale: hu });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();
  const todayStart = startOfDay(today);

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-3">
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return (
            <CalendarDayCell
              key={dateStr}
              day={day.getDate()}
              isCurrentMonth={isSameMonth(day, monthDate)}
              isToday={isSameDay(day, today)}
              isSelected={selectedDate === dateStr}
              isPast={isBefore(day, todayStart)}
              songCount={songCountByDate[dateStr] ?? 0}
              onClick={() => onSelectDate(dateStr)}
              onAddSong={onAddSong ? () => onAddSong(dateStr) : undefined}
              onCopyDate={onCopyDate ? () => onCopyDate(dateStr) : undefined}
              onDeleteDate={onDeleteDate ? () => onDeleteDate(dateStr) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
