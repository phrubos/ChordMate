'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, startOfDay, getDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { SectionHeader } from '@/components/design/section-header';

interface PracticeHeatmapProps {
  data: Record<string, number>;
}

const CELL = 13;
const GAP = 3;
const LEFT = 22;
const DAY_LABELS = ['H', '', 'Sze', '', 'P', '', 'V'];
/** 5 amber steps over transparent: 0, 1, 2–3, 4–5, 6+ songs. */
const STEPS = [8, 30, 50, 72, 95];
const stepOf = (count: number) => (count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4);
const fillOf = (step: number) => `color-mix(in oklch, var(--primary) ${STEPS[step]}%, transparent)`;

export function PracticeHeatmap({ data }: PracticeHeatmapProps) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Narrow screens: start at the most recent weeks.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const cells = useMemo(() => {
    const today = startOfDay(new Date());
    const out: { date: string; count: number; dow: number; week: number }[] = [];
    let week = 0;
    let lastDow = -1;
    for (let i = 364; i >= 0; i--) {
      const d = subDays(today, i);
      const dow = (getDay(d) + 6) % 7; // Monday = 0
      if (dow <= lastDow) week++;
      lastDow = dow;
      const date = format(d, 'yyyy-MM-dd');
      out.push({ date, count: data[date] ?? 0, dow, week });
    }
    return out;
  }, [data]);

  const weeks = cells.length ? cells[cells.length - 1].week + 1 : 0;
  const activeDays = Object.values(data).filter((v) => v > 0).length;
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const label = (c: { date: string; count: number }) =>
    `${format(new Date(`${c.date}T00:00:00`), 'yyyy. MMM d.', { locale: hu })}: ${c.count ? `${c.count} dal` : 'nem volt próba'}`;

  function show(el: Element, text: string) {
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top - 8, text });
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionHeader
        title="Gyakorlás hőtérkép"
        actions={<span className="font-mono text-[13px] text-muted-foreground">{activeDays} nap · {total} dal</span>}
      />
      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <svg width={weeks * (CELL + GAP) + LEFT} height={7 * (CELL + GAP)} className="block" role="grid" aria-label="Gyakorlás az elmúlt egy évben">
          {DAY_LABELS.map(
            (d, i) =>
              d && (
                <text key={i} x={0} y={i * (CELL + GAP) + CELL - 2} className="fill-muted-foreground font-mono text-[10px]">
                  {d}
                </text>
              )
          )}
          {cells.map((c) => (
            <rect
              key={c.date}
              x={LEFT + c.week * (CELL + GAP)}
              y={c.dow * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={fillOf(stepOf(c.count))}
              tabIndex={0}
              role="gridcell"
              aria-label={label(c)}
              className="outline-none focus-visible:stroke-ring focus-visible:stroke-2"
              onMouseEnter={(e) => show(e.currentTarget, label(c))}
              onMouseLeave={() => setTip(null)}
              onFocus={(e) => show(e.currentTarget, label(c))}
              onBlur={() => setTip(null)}
            />
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground" aria-hidden>
        <span>Kevesebb</span>
        {STEPS.map((_, i) => (
          <span key={i} className="size-3 rounded-[2px]" style={{ background: fillOf(i) }} />
        ))}
        <span>Több</span>
      </div>
      {tip &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-foreground/10"
            style={{ left: tip.x, top: tip.y }}
          >
            {tip.text}
          </div>,
          document.body
        )}
    </section>
  );
}
