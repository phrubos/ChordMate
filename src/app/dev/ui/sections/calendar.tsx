'use client';

import { useMemo, useState } from 'react';
import { CalendarGrid, type DaySong } from '@/components/calendar/calendar-grid';
import { CalendarHeader, type CalendarView } from '@/components/calendar/calendar-header';
import { WeekStrip } from '@/components/calendar/week-strip';
import { dayState, weekStripDates } from '@/lib/calendar-utils';
import { FIXTURE_TODAY, fixtureEntries } from '../fixtures';

export function CalendarSection() {
  const [selected, setSelected] = useState('2026-10-13');
  const [view, setView] = useState<CalendarView>('month');
  const [cursor, setCursor] = useState({ year: 2026, month: 10 });
  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const m = month - 1 + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 };
    });
  const songsByDate = useMemo(() => {
    const map: Record<string, DaySong[]> = {};
    for (const e of fixtureEntries) (map[e.date] ??= []).push(e.song);
    return map;
  }, []);
  const dates = weekStripDates(FIXTURE_TODAY);
  const stateByDate = Object.fromEntries(dates.map((d) => [d, dayState(d, FIXTURE_TODAY, songsByDate[d]?.length ?? 0)]));

  return (
    <section id="calendar" className="flex flex-col gap-4">
      <CalendarHeader year={cursor.year} month={cursor.month} view={view} onViewChange={setView} onPrev={() => shift(-1)} onNext={() => shift(1)} onToday={() => setCursor({ year: 2026, month: 10 })} />
      <div className="hidden md:block">
        <CalendarGrid
          year={cursor.year}
          month={cursor.month}
          today={FIXTURE_TODAY}
          selectedDate={selected}
          songsByDate={songsByDate}
          onSelectDate={setSelected}
          onSwipePrev={() => shift(-1)}
          onSwipeNext={() => shift(1)}
        />
      </div>
      <WeekStrip dates={dates} today={FIXTURE_TODAY} selected={selected} stateByDate={stateByDate} onSelect={setSelected} />
    </section>
  );
}
