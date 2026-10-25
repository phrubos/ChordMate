'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eyebrow } from '@/components/design/eyebrow';
import { initialsOf } from '@/components/design/avatar-stack';
import { setAttendance } from '@/actions/rehearsals';
import { hueFromString } from '@/lib/song-meta';
import { cn } from '@/lib/utils';
import type { AttendanceAnswer } from '@/types';

export interface AttendanceRow {
  userId: string;
  name: string | null;
  image: string | null;
  answer: AttendanceAnswer | null;
}

interface RehearsalAttendanceProps {
  date: string;
  userId: string;
  attendance: AttendanceRow[];
  isPast: boolean;
  preview?: boolean;
}

const BUTTONS: { value: AttendanceAnswer; label: string }[] = [
  { value: 'yes', label: 'Jövök' },
  { value: 'maybe', label: 'Talán' },
  { value: 'no', label: 'Nem' },
];

const ANSWER_LABEL: Record<AttendanceAnswer, string> = { yes: 'Jön', maybe: 'Talán', no: 'Nem jön' };
/** After the rehearsal the RSVPs stand in for who was there. */
const PAST_LABEL: Record<AttendanceAnswer, string> = { yes: 'Ott volt', maybe: 'Talán', no: 'Nem volt ott' };
const ANSWER_CLASS: Record<AttendanceAnswer, string> = { yes: 'text-done', maybe: 'text-primary-text', no: 'text-destructive' };

export function RehearsalAttendance({ date, userId, attendance, isPast, preview }: RehearsalAttendanceProps) {
  const [rows, setOptimistic] = useOptimistic(attendance, (state, answer: AttendanceAnswer) =>
    state.map((r) => (r.userId === userId ? { ...r, answer } : r))
  );
  const [, startTransition] = useTransition();
  const mine = rows.find((r) => r.userId === userId)?.answer ?? null;
  const coming = rows.filter((r) => r.answer === 'yes').length;
  const anyAnswer = rows.some((r) => r.answer);

  function answer(value: AttendanceAnswer) {
    startTransition(async () => {
      setOptimistic(value);
      if (preview) return;
      try {
        await setAttendance(date, value);
      } catch {
        toast.error('Nem sikerült menteni');
      }
    });
  }

  return (
    <section aria-labelledby="att-title" className="flex flex-col gap-4 border-t border-border-strong pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="att-title" className="display-soft font-display text-[26px] leading-tight font-medium">
          {isPast ? 'Ki volt ott?' : 'Ki jön?'}
        </h2>
        {(!isPast || anyAnswer) && (
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {coming}/{rows.length}
          </span>
        )}
      </div>

      {!isPast && (
        <div className="flex flex-col gap-2">
          <Eyebrow>Ott leszel?</Eyebrow>
          <div role="group" aria-label="Ott leszel?" className="grid grid-cols-3 gap-2">
            {BUTTONS.map((b) => (
              <button
                key={b.value}
                type="button"
                aria-pressed={mine === b.value}
                onClick={() => answer(b.value)}
                className={cn(
                  'pressable h-10 rounded-full border text-sm font-semibold transition-[transform,background-color,border-color,color] duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mine === b.value ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-muted-foreground hover:text-foreground'
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPast && !anyAnswer ? (
        <p className="text-sm text-muted-foreground">Erre a próbára senki nem jelezte előre, hogy ott lesz-e.</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li key={r.userId} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
              <Avatar className="size-8">
                {r.image && <AvatarImage src={r.image} alt="" />}
                <AvatarFallback className="text-[13px] font-bold text-white" style={{ backgroundColor: `oklch(.58 .12 ${hueFromString(r.name ?? '')})` }}>
                  {initialsOf(r.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate">
                {r.name ?? 'Névtelen'}
                {r.userId === userId && <span className="text-muted-foreground"> (te)</span>}
              </span>
              <span className={cn('text-[13.5px] font-semibold', r.answer ? ANSWER_CLASS[r.answer] : 'text-faint')}>
                {r.answer ? (isPast ? PAST_LABEL : ANSWER_LABEL)[r.answer] : 'Nem jelzett'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
