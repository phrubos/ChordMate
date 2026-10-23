'use client';

import { useMemo, useState } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { dayState } from '@/lib/calendar-utils';
import { hueFromString } from '@/lib/song-meta';
import { SwipePane } from '@/components/design/swipe-pane';
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

/** Hairline month grid. Swipe left/right changes month on touch devices; a new month slides in from its side (A14). */
export function CalendarGrid({ year, month, today, selectedDate, songsByDate, onSelectDate, onSwipePrev, onSwipeNext }: CalendarGridProps) {
  // Which way the month moved, whether by swipe or the header arrows — the new grid enters from that side.
  const key = year * 12 + month;
  const [shown, setShown] = useState<{ key: number; dir: -1 | 0 | 1 }>({ key, dir: 0 });
  if (shown.key !== key) setShown({ key, dir: key > shown.key ? 1 : -1 });

  const days = useMemo(() => {
    const md = new Date(year, month - 1);
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(md), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(md), { weekStartsOn: 1 }),
    }).map((d) => ({ date: format(d, 'yyyy-MM-dd'), day: d.getDate(), inMonth: isSameMonth(d, md) }));
  }, [year, month]);

  return (
    <div>
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="px-2 pb-1.5 font-mono text-xs font-medium tracking-[0.05em] text-faint uppercase">
            {label}
          </span>
        ))}
      </div>
      <SwipePane
        key={key}
        canPrev={!!onSwipePrev}
        canNext={!!onSwipeNext}
        onSwipe={(delta) => (delta > 0 ? onSwipeNext?.() : onSwipePrev?.())}
        enterFrom={shown.dir ? shown.dir * 24 : false}
      >
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
      </SwipePane>
    </div>
  );
}
