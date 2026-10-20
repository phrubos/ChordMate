'use client';

import { useMemo, useState } from 'react';
import { SectionHeader } from '@/components/design/section-header';
import { cn } from '@/lib/utils';

interface TrendDataPoint {
  month: string;
  practiceDays: number;
  songCount: number;
}

type Key = 'practiceDays' | 'songCount';

const W = 500;
const H = 120;

/** Points in viewBox units (x 0–W, y 0–H, top = max). */
function pointsOf(data: TrendDataPoint[], key: Key) {
  const max = Math.max(...data.map((d) => d[key]), 1);
  const n = Math.max(data.length - 1, 1);
  return data.map((d, i) => ({ x: (i / n) * W, y: H - (d[key] / max) * (H - 6) }));
}

function curve(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const cx = (p.x + c.x) / 2;
    path += ` C ${cx} ${p.y}, ${cx} ${c.y}, ${c.x} ${c.y}`;
  }
  return path;
}

/** Static line chart (no draw-in, spec §6). Labels, dots and tooltip are HTML so they never scale below 12px. */
export function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const practice = useMemo(() => pointsOf(data, 'practiceDays'), [data]);
  const songs = useMemo(() => pointsOf(data, 'songCount'), [data]);
  const practicePath = curve(practice);
  const area = practice.length ? `${practicePath} L ${W} ${H} L 0 ${H} Z` : '';
  const pct = (x: number) => `${(x / W) * 100}%`;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionHeader
        title="Havi trend"
        actions={
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />Próbanapok</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-muted-foreground" />Dalok</span>
          </span>
        }
      />
      <div className="relative h-[140px]" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} className="stroke-border-strong" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} className="fill-primary/10" />
          <path d={curve(songs)} className="fill-none stroke-muted-foreground" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          <path d={practicePath} className="fill-none stroke-primary" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {hover !== null && (
          <>
            <span className="absolute top-0 bottom-0 w-px bg-border-strong" style={{ left: pct(practice[hover].x) }} />
            <span className="absolute size-2 -translate-1/2 rounded-full bg-muted-foreground" style={{ left: pct(songs[hover].x), top: `${(songs[hover].y / H) * 100}%` }} />
            <span className="absolute size-2.5 -translate-1/2 rounded-full bg-primary" style={{ left: pct(practice[hover].x), top: `${(practice[hover].y / H) * 100}%` }} />
            <span
              role="tooltip"
              className={cn(
                'absolute -top-2 rounded-md bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-foreground/10',
                hover > data.length / 2 ? '-translate-x-[calc(100%+8px)]' : 'translate-x-2'
              )}
              style={{ left: pct(practice[hover].x) }}
            >
              <b className="block font-semibold capitalize">{data[hover].month}</b>
              <span className="text-primary-text">{data[hover].practiceDays} nap</span> · {data[hover].songCount} dal
            </span>
          </>
        )}

        <div className="absolute inset-0 flex">
          {data.map((d, i) => (
            <button
              key={d.month}
              type="button"
              aria-label={`${d.month}: ${d.practiceDays} próbanap, ${d.songCount} dal`}
              className="flex-1 outline-none focus-visible:bg-primary/5"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between font-mono text-xs text-muted-foreground uppercase">
        {data.map((d, i) => (
          <span key={d.month} className={cn('w-0 text-center whitespace-nowrap', i % 2 === 1 && 'max-sm:invisible')} style={{ flex: '0 0 0' }}>
            <span className="inline-block -translate-x-1/2">{d.month}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
