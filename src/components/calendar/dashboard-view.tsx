'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { DayDetailPanel } from './day-detail-panel';
import type { CalendarEntryWithSong, Song } from '@/types';

interface DashboardViewProps {
  initialYear: number;
  initialMonth: number;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
}

export function DashboardView({ initialYear, initialMonth, entries, allSongs }: DashboardViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const songCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      counts[entry.date] = (counts[entry.date] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  const selectedEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate]
  );

  function handlePrev() {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  function handleNext() {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(format(now, 'yyyy-MM-dd'));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
        <CalendarGrid
          year={year}
          month={month}
          selectedDate={selectedDate}
          songCountByDate={songCountByDate}
          onSelectDate={setSelectedDate}
        />
      </div>
      <DayDetailPanel
        selectedDate={selectedDate}
        entries={selectedEntries}
        allSongs={allSongs}
        allEntries={entries}
      />
    </div>
  );
}
