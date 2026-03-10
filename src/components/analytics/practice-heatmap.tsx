'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, startOfDay, getDay } from 'date-fns';
import { hu } from 'date-fns/locale';

interface PracticeHeatmapProps {
  data: Record<string, number>;
}

const CELL_SIZE = 14;
const GAP = 3;
const DAY_LABELS = ['H', '', 'Sz', '', 'P', '', 'V'];

function getIntensity(count: number): { fill: string; opacity: number } {
  if (count === 0) return { fill: 'currentColor', opacity: 0.08 };
  if (count <= 1) return { fill: '#10b981', opacity: 0.35 };
  if (count <= 3) return { fill: '#10b981', opacity: 0.55 };
  if (count <= 5) return { fill: '#10b981', opacity: 0.75 };
  return { fill: '#10b981', opacity: 0.95 };
}

export function PracticeHeatmap({ data }: PracticeHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const weeks = useMemo(() => {
    const today = startOfDay(new Date());
    const cells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];

    // Go back 364 days (52 weeks)
    for (let i = 364; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      // getDay: 0=Sunday, but we want Monday=0
      let dow = getDay(d) - 1;
      if (dow < 0) dow = 6;

      cells.push({
        date: dateStr,
        count: data[dateStr] ?? 0,
        dayOfWeek: dow,
        weekIndex: 0, // will be calculated
      });
    }

    // Calculate week indices
    let weekIdx = 0;
    let lastDow = -1;
    for (const cell of cells) {
      if (cell.dayOfWeek <= lastDow) weekIdx++;
      cell.weekIndex = weekIdx;
      lastDow = cell.dayOfWeek;
    }

    return cells;
  }, [data]);

  const totalWeeks = weeks.length > 0 ? weeks[weeks.length - 1].weekIndex + 1 : 0;
  const totalDays = Object.values(data).filter(v => v > 0).length;
  const totalSessions = Object.values(data).reduce((a, b) => a + b, 0);

  const svgWidth = totalWeeks * (CELL_SIZE + GAP) + 30;
  const svgHeight = 7 * (CELL_SIZE + GAP) + 10;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Gyakorlás hőtérkép
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{totalDays} nap</span>
          <span>·</span>
          <span>{totalSessions} gyakorlás</span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin pb-2">
        <svg
          width={svgWidth}
          height={svgHeight + 20}
          className="block"
        >
          {/* Day labels */}
          {DAY_LABELS.map((label, idx) => (
            label && (
              <text
                key={idx}
                x={0}
                y={idx * (CELL_SIZE + GAP) + CELL_SIZE}
                className="fill-muted-foreground text-[10px]"
              >
                {label}
              </text>
            )
          ))}

          {/* Cells */}
          {weeks.map((cell, i) => {
            const x = cell.weekIndex * (CELL_SIZE + GAP) + 22;
            const y = cell.dayOfWeek * (CELL_SIZE + GAP);
            const intensity = getIntensity(cell.count);

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill={intensity.fill}
                opacity={intensity.opacity}
                className="transition-all cursor-default"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dateFormatted = format(new Date(cell.date + 'T00:00:00'), 'MMM d, yyyy', { locale: hu });
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    text: `${dateFormatted}: ${cell.count} dal`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Kevesebb</span>
        {[0, 1, 3, 5, 7].map((level) => {
          const intensity = getIntensity(level);
          return (
            <div
              key={level}
              className="size-3 rounded-sm"
              style={{ backgroundColor: intensity.fill, opacity: intensity.opacity }}
            />
          );
        })}
        <span>Több</span>
      </div>

      {/* Tooltip via portal to escape backdrop-blur stacking context */}
      {tooltip && typeof document !== 'undefined' && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] rounded-lg bg-popover/95 px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg border border-border/50 backdrop-blur-sm -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}
    </div>
  );
}
