'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
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
  onSwipePrev,
  onSwipeNext,
}: CalendarGridProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) {
      setDirection(-1);
      onSwipePrev?.();
    } else {
      setDirection(1);
      onSwipeNext?.();
    }
  }

  const monthKey = `${year}-${month}`;

  const { days, monthDate, today, todayStart } = useMemo(() => {
    const md = new Date(year, month - 1);
    const monthStart = startOfMonth(md);
    const monthEnd = endOfMonth(md);
    const calStart = startOfWeek(monthStart, { locale: hu });
    const calEnd = endOfWeek(monthEnd, { locale: hu });
    const t = new Date();
    return {
      days: eachDayOfInterval({ start: calStart, end: calEnd }),
      monthDate: md,
      today: t,
      todayStart: startOfDay(t),
    };
  }, [year, month]);

  return (
    <div
      className="rounded-xl border border-border/50 bg-card/30 p-3 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={monthKey}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: `${d * 100}%`, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: `${d * -100}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="grid grid-cols-7 gap-0.5"
        >
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
