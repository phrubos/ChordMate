'use client';

import { memo } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/design/segmented-control';

export type CalendarView = 'month' | 'week';

interface CalendarHeaderProps {
  year: number;
  month: number;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader = memo(function CalendarHeader({ year, month, view, onViewChange, onPrev, onNext, onToday }: CalendarHeaderProps) {
  const monthName = format(new Date(year, month - 1), 'LLLL', { locale: hu });

  return (
    <header className="flex flex-wrap items-center gap-3 border-t border-border-strong pt-4">
      <h2 id="cal-title" className="display-soft font-display text-[26px] leading-tight font-medium tracking-[-0.01em] capitalize">
        {monthName} <em className="font-normal text-muted-foreground not-italic md:italic">{year}</em>
      </h2>
      <SegmentedControl
        ariaLabel="Naptár nézet"
        size="sm"
        className="ml-auto"
        value={view}
        onChange={onViewChange}
        options={[
          { value: 'month', label: 'Hónap' },
          { value: 'week', label: 'Hét' },
        ]}
      />
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={onToday}>
          Ma
        </Button>
        <Button variant="ghost" size="icon" aria-label="Előző hónap" onClick={onPrev}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Következő hónap" onClick={onNext}>
          <ChevronRight />
        </Button>
      </div>
    </header>
  );
});
