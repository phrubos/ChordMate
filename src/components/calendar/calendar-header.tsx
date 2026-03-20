'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader = memo(function CalendarHeader({ year, month, onPrev, onNext, onToday }: CalendarHeaderProps) {
  const date = new Date(year, month - 1);
  const monthName = format(date, 'MMMM', { locale: hu });
  const yearStr = format(date, 'yyyy');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-bold capitalize tracking-tight">{monthName}</h2>
        <span className="text-sm text-muted-foreground/60">{yearStr}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-primary" onClick={onToday}>
          <CalendarCheck className="size-3.5" />
          Ma
        </Button>
        <div className="flex items-center rounded-lg bg-secondary/30">
          <Button variant="ghost" size="sm" className="size-8 p-0 rounded-r-none" onClick={onPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="size-8 p-0 rounded-l-none" onClick={onNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
