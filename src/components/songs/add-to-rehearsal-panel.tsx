'use client';

import { useRef, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Check, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow } from '@/components/design/eyebrow';
import { daysUntil, rehearsalCountdownLabel, type UpcomingRehearsal } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

/** How far ahead the day strip reaches. */
const STRIP_DAYS = 42;

interface AddToRehearsalPanelProps {
  /** null while loading. */
  upcoming: UpcomingRehearsal[] | null;
  today: string;
  pending: boolean;
  onAdd: (date: string) => void;
}

/** Body of "Hozzáadás próbához": the planned rehearsals as date stubs, then a day strip for any other day. */
export function AddToRehearsalPanel({ upcoming, today, pending, onAdd }: AddToRehearsalPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);
  // Which day the running add is for: that control shows the work, the rest just wait.
  const [adding, setAdding] = useState<string | null>(null);
  const add = (date: string) => {
    setAdding(date);
    onAdd(date);
  };
  const busy = (date: string) => pending && adding === date;
  const stripRef = useRef<HTMLDivElement>(null);
  const byDate = new Map((upcoming ?? []).map((r) => [r.date, r]));
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => format(addDays(parseISO(today), i), 'yyyy-MM-dd'));
  const onSelected = selected ? byDate.get(selected) : undefined;
  const alreadyOnSelected = onSelected?.position != null;

  // About a strip's width per step, keeping one day of overlap.
  const scrollStrip = (dir: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollBy({ left: dir * (strip.clientWidth - 48), behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4 md:-mx-5 md:px-5">
      <section className="flex flex-col gap-2.5">
        <Eyebrow>Tervezett próbák</Eyebrow>
        {upcoming === null ? (
          <div className="flex flex-col gap-2" aria-busy aria-label="Próbák betöltése">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-[62px] rounded-xl" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong px-4 py-3.5 text-sm text-muted-foreground">
            Még nincs tervezett próba. Válassz egy napot lent — a próba azzal létre is jön.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <li key={r.date}>
                <RehearsalStub rehearsal={r} today={today} disabled={pending} busy={busy(r.date)} onAdd={() => add(r.date)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2.5 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Másik nap</Eyebrow>
          <span className="flex items-center gap-1">
            <span className="mr-1 text-[13px] text-muted-foreground">{format(parseISO(selected ?? today), 'yyyy. MMMM', { locale: hu })}</span>
            <Button variant="ghost" size="icon-xs" aria-label="Korábbi napok" onClick={() => scrollStrip(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Későbbi napok" onClick={() => scrollStrip(1)}>
              <ChevronRight />
            </Button>
          </span>
        </div>
        <div
          ref={stripRef}
          role="listbox"
          aria-label="Nap kiválasztása"
          className="-mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] md:-mx-5 md:scroll-px-5 md:px-5"
        >
          {days.map((date, i) => {
            const d = parseISO(date);
            const r = byDate.get(date);
            const isSelected = date === selected;
            const showMonth = i === 0 || d.getDate() === 1;
            return (
              <button
                key={date}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${format(d, 'MMMM d., EEEE', { locale: hu })}${r ? (r.position != null ? ', már a setlisten' : ', tervezett próba') : ''}`}
                onClick={() => setSelected(isSelected ? null : date)}
                className={cn(
                  'pressable flex w-12 shrink-0 snap-start flex-col items-center gap-0.5 rounded-full border border-border bg-background/40 pt-2 pb-2.5 transition-[transform,background-color,border-color,color] duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'hover:border-border-strong',
                  isSelected && 'border-primary bg-primary text-primary-foreground hover:border-primary'
                )}
              >
                <span className={cn('font-mono text-[10px] tracking-[0.08em] uppercase', isSelected ? 'opacity-80' : 'text-primary-text', !showMonth && 'invisible')}>
                  {format(d, 'LLL', { locale: hu }).replace('.', '')}
                </span>
                <span className="display-soft font-display text-[19px] leading-none font-medium tabular-nums">{d.getDate()}</span>
                <span className={cn('text-[11px] capitalize', isSelected ? 'opacity-80' : 'text-faint')}>{date === today ? 'ma' : format(d, 'EEEEEE', { locale: hu })}</span>
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 size-1.5 rounded-full',
                    r && r.position != null && (isSelected ? 'bg-primary-foreground' : 'bg-status-ready'),
                    r && r.position == null && (isSelected ? 'shadow-[inset_0_0_0_1.5px_var(--primary-foreground)]' : 'shadow-[inset_0_0_0_1.5px_var(--primary)]')
                  )}
                />
              </button>
            );
          })}
        </div>
        <Button size="lg" variant={selected ? 'default' : 'outline'} className="mt-1 w-full"
          disabled={!selected || alreadyOnSelected || (pending && !busy(selected))}
          isLoading={!!selected && busy(selected)}
          onClick={() => selected && add(selected)}
        >
          {!selected ? (
            'Válassz napot'
          ) : alreadyOnSelected ? (
            <>
              <Check aria-hidden />
              Ezen a napon már a setlisten van
            </>
          ) : (
            <>
              <Plus aria-hidden />
              <span className="inline-block first-letter:uppercase">
                {format(parseISO(selected), 'MMMM d., EEEE', { locale: hu })}
                {onSelected ? '' : ' · új próba'}
              </span>
            </>
          )}
        </Button>
      </section>
    </div>
  );
}

function RehearsalStub({ rehearsal: r, today, disabled, busy, onAdd }: { rehearsal: UpcomingRehearsal; today: string; disabled: boolean; busy: boolean; onAdd: () => void }) {
  const d = parseISO(r.date);
  const already = r.position !== null;
  return (
    <button
      type="button"
      disabled={already || disabled}
      aria-busy={busy || undefined}
      onClick={onAdd}
      className={cn(
        'pressable group flex w-full items-center gap-3.5 rounded-xl border border-border-strong bg-background/40 p-2 pr-3 text-left transition-[transform,background-color,border-color] [--press-scale:.985] duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring',
        already ? 'cursor-default' : 'hover:border-ring hover:bg-muted/60',
        disabled && !already && !busy && 'opacity-60'
      )}
    >
      <span className={cn('flex w-[52px] shrink-0 flex-col items-center rounded-lg py-1.5', already ? 'bg-muted' : 'bg-primary/12')}>
        <span className={cn('font-mono text-[10px] tracking-[0.1em] uppercase', already ? 'text-muted-foreground' : 'text-primary-text')}>
          {format(d, 'LLL', { locale: hu }).replace('.', '')}
        </span>
        <span className="display-soft font-display text-[22px] leading-tight font-medium tabular-nums">{d.getDate()}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold capitalize">{format(d, 'EEEE', { locale: hu })}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {rehearsalCountdownLabel(daysUntil(today, r.date))} · {r.count} dal
        </span>
      </span>
      {already ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-status-ready/12 px-2.5 py-1 text-xs font-semibold text-status-ready">
          <Check className="size-3.5" aria-hidden />
          {r.position}. dal
        </span>
      ) : (
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full border border-border-strong text-primary-text transition-[background-color,border-color,color] duration-(--dur-fade) group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          {/* Like Button's isLoading: the plus gives way to a spinner only past 300ms. */}
          <Plus className={cn('size-4', busy && 'animate-out fade-out-0 fill-mode-both delay-300 duration-(--dur-fade)')} aria-hidden />
          {busy && (
            <span className="absolute inset-0 grid place-items-center animate-in fade-in-0 fill-mode-both delay-300 duration-(--dur-fade)">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            </span>
          )}
        </span>
      )}
    </button>
  );
}
