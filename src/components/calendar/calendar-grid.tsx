'use client';

import { useMemo, useRef } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { dayState } from '@/lib/calendar-utils';
import { hueFromString } from '@/lib/song-meta';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAY_LABELS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const MAX_MARKS = 3;

export interface DaySong {
  title: string;
  artist: string;
}

interface CalendarGridProps {
  year: number;
  month: number;
  today: string;
  selectedDate: string | null;
  songsByDate: Record<string, DaySong[]>;
  onSelectDate: (date: string) => void;
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
}

/** Hairline month grid. Swipe left/right changes month on touch devices. */
export function CalendarGrid({ year, month, today, selectedDate, songsByDate, onSelectDate, onSwipePrev, onSwipeNext }: CalendarGridProps) {
  const touch = useRef<{ x: number; y: number } | null>(null);

  const days = useMemo(() => {
    const md = new Date(year, month - 1);
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(md), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(md), { weekStartsOn: 1 }),
    }).map((d) => ({ date: format(d, 'yyyy-MM-dd'), day: d.getDate(), inMonth: isSameMonth(d, md) }));
  }, [year, month]);

  return (
    <div
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx > 0) onSwipePrev?.();
        else onSwipeNext?.();
      }}
    >
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="px-2 pb-1.5 font-mono text-xs font-medium tracking-[0.05em] text-faint uppercase">
            {label}
          </span>
        ))}
      </div>
      <div role="grid" className="grid grid-cols-7 border-t border-l border-border">
        {days.map(({ date, day, inMonth }) => {
          const songs = songsByDate[date] ?? [];
          return (
            <CalendarDayCell
              key={date}
              date={date}
              day={day}
              isCurrentMonth={inMonth}
              isToday={date === today}
              isSelected={date === selectedDate}
              state={dayState(date, today, songs.length)}
              markHues={songs.slice(0, MAX_MARKS).map((s) => hueFromString(`${s.artist} — ${s.title}`))}
              extraCount={Math.max(0, songs.length - MAX_MARKS)}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
}
