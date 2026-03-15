'use client';

import { motion } from 'motion/react';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarCheck, Music } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { TruncatedText } from '@/components/shared/truncated-text';

interface PracticeDay {
  date: string;
  songCount: number;
  songs: string[];
}

interface PracticeHistoryProps {
  history: PracticeDay[];
}

export function PracticeHistory({ history }: PracticeHistoryProps) {
  const today = startOfDay(new Date());
  const past = history.filter((h) => !isAfter(parseISO(h.date), today));
  const upcoming = history.filter((h) => isAfter(parseISO(h.date), today));

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/5">
          <CalendarCheck className="size-5 text-primary/30" />
        </div>
        <p className="text-sm text-muted-foreground">Még nincs próbanap</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Következő próbák
          </h4>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5"
          >
            {upcoming.reverse().map((day) => (
              <motion.div key={day.date} variants={staggerItem}>
                <DayRow day={day} variant="upcoming" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Korábbi próbák
          </h4>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5"
          >
            {past.slice(0, 10).map((day) => (
              <motion.div key={day.date} variants={staggerItem}>
                <DayRow day={day} variant="past" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DayRow({ day, variant }: { day: PracticeDay; variant: 'upcoming' | 'past' }) {
  const label = format(parseISO(day.date), 'MMM d., EEEE', { locale: hu });

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
      variant === 'upcoming' ? 'bg-primary/5 border border-primary/10' : 'hover:bg-secondary/20'
    }`}>
      <div className={`flex size-8 items-center justify-center rounded-lg ${
        variant === 'upcoming' ? 'bg-primary/15 text-primary' : 'bg-secondary/50 text-muted-foreground'
      }`}>
        <Music className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium capitalize">{label}</p>
        <TruncatedText as="p" className="text-xs text-muted-foreground">
          {day.songs.join(', ')}
        </TruncatedText>
      </div>
      <span className="shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {day.songCount} dal
      </span>
    </div>
  );
}
