'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarHeader, type CalendarView } from './calendar-header';
import { CalendarGrid, type DaySong } from './calendar-grid';
import { WeekStrip } from './week-strip';
import { DayDetailPanel } from './day-detail-panel';
import { dayState, todayIso, weekStripDates } from '@/lib/calendar-utils';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { cn } from '@/lib/utils';
import type { CalendarEntryWithSong, Song } from '@/types';

interface DashboardViewProps {
  initialYear: number;
  initialMonth: number;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
}

/** Calendar (month grid ≥ md, week strip on mobile) + day panel. Tapping a day only selects it. */
export function DashboardView({ initialYear, initialMonth, entries, allSongs }: DashboardViewProps) {
  const today = todayIso();
  const [cursor, setCursor] = useState({ year: initialYear, month: initialMonth });
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView | 'auto'>('auto');
  const isDesktop = useIsDesktop();

  const songsByDate = useMemo(() => {
    const map: Record<string, DaySong[]> = {};
    for (const e of entries) (map[e.date] ??= []).push(e.song);
    return map;
  }, [entries]);

  const stripDates = useMemo(() => weekStripDates(selectedDate), [selectedDate]);
  const stateByDate = useMemo(
    () => Object.fromEntries(stripDates.map((d) => [d, dayState(d, today, songsByDate[d]?.length ?? 0)])),
    [stripDates, today, songsByDate]
  );
  const selectedEntries = useMemo(() => entries.filter((e) => e.date === selectedDate), [entries, selectedDate]);

  const shiftMonth = useCallback((delta: number) => {
    setCursor(({ year, month }) => {
      const m = month - 1 + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 };
    });
  }, []);

  const goToday = useCallback(() => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 });
    setSelectedDate(todayIso(now));
  }, []);

  return (
    <div id="calendar" className="grid scroll-mt-24 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <CalendarHeader
          year={cursor.year}
          month={cursor.month}
          view={view === 'auto' ? (isDesktop ? 'month' : 'week') : view}
          onViewChange={setView}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={goToday}
        />
        <div className={cn(view === 'week' ? 'hidden' : view === 'auto' && 'hidden md:block')}>
          <CalendarGrid
            year={cursor.year}
            month={cursor.month}
            today={today}
            selectedDate={selectedDate}
            songsByDate={songsByDate}
            onSelectDate={setSelectedDate}
            onSwipePrev={() => shiftMonth(-1)}
            onSwipeNext={() => shiftMonth(1)}
          />
        </div>
        <div className={cn(view === 'month' ? 'hidden' : view === 'auto' && 'md:hidden')}>
          <WeekStrip dates={stripDates} today={today} selected={selectedDate} stateByDate={stateByDate} onSelect={setSelectedDate} />
        </div>
      </div>
      <DayDetailPanel date={selectedDate} today={today} entries={selectedEntries} allSongs={allSongs} allEntries={entries} />
    </div>
  );
}
