'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TrendDataPoint {
  week: string;
  practiceDays: number;
  songCount: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

const CHART_WIDTH = 500;
const CHART_HEIGHT = 140;
const PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

function buildPath(data: TrendDataPoint[], key: 'practiceDays' | 'songCount'): string {
  const w = CHART_WIDTH - PADDING.left - PADDING.right;
  const h = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const max = Math.max(...data.map((d) => d[key]), 1);

  const points = data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * w;
    const y = PADDING.top + h - (d[key] / max) * h;
    return { x, y };
  });

  if (points.length === 0) return '';

  // Smooth curve with catmull-rom
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return path;
}

function buildArea(data: TrendDataPoint[], key: 'practiceDays' | 'songCount'): string {
  const w = CHART_WIDTH - PADDING.left - PADDING.right;
  const h = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const max = Math.max(...data.map((d) => d[key]), 1);
  const baseY = PADDING.top + h;

  const points = data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * w;
    const y = PADDING.top + h - (d[key] / max) * h;
    return { x, y };
  });

  if (points.length === 0) return '';

  let path = `M ${points[0].x} ${baseY} L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  path += ` L ${points[points.length - 1].x} ${baseY} Z`;

  return path;
}

export function TrendChart({ data }: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const practicePath = useMemo(() => buildPath(data, 'practiceDays'), [data]);
  const songPath = useMemo(() => buildPath(data, 'songCount'), [data]);
  const practiceArea = useMemo(() => buildArea(data, 'practiceDays'), [data]);
  const songArea = useMemo(() => buildArea(data, 'songCount'), [data]);

  const w = CHART_WIDTH - PADDING.left - PADDING.right;
  const h = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxPractice = Math.max(...data.map((d) => d.practiceDays), 1);
  const maxSongs = Math.max(...data.map((d) => d.songCount), 1);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Heti trend
        </h3>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Gyakorolt napok</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Dalok száma</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full min-w-[400px]"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={PADDING.top + h * (1 - pct)}
              y2={PADDING.top + h * (1 - pct)}
              className="stroke-border/30"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
          ))}

          {/* Areas */}
          <path d={songArea} className="fill-emerald-500/10" />
          <path d={practiceArea} className="fill-primary/10" />

          {/* Lines */}
          <path d={songPath} className="fill-none stroke-emerald-500/70" strokeWidth={2} strokeLinecap="round" />
          <path d={practicePath} className="fill-none stroke-primary" strokeWidth={2.5} strokeLinecap="round" />

          {/* Data points */}
          {data.map((d, i) => {
            const x = PADDING.left + (i / (data.length - 1)) * w;
            const yPractice = PADDING.top + h - (d.practiceDays / maxPractice) * h;
            const ySong = PADDING.top + h - (d.songCount / maxSongs) * h;

            return (
              <g key={i}>
                <circle cx={x} cy={yPractice} r={hoveredIdx === i ? 4 : 2.5} className="fill-primary" />
                <circle cx={x} cy={ySong} r={hoveredIdx === i ? 3.5 : 2} className="fill-emerald-500" />
                {/* Hover zone */}
                <rect
                  x={x - 15}
                  y={PADDING.top}
                  width={30}
                  height={h}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-default"
                />
              </g>
            );
          })}

          {/* X labels (every 2) */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            const x = PADDING.left + (i / (data.length - 1)) * w;
            return (
              <text
                key={i}
                x={x}
                y={CHART_HEIGHT - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {d.week}
              </text>
            );
          })}

          {/* Hover tooltip */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={PADDING.left + (hoveredIdx / (data.length - 1)) * w}
                x2={PADDING.left + (hoveredIdx / (data.length - 1)) * w}
                y1={PADDING.top}
                y2={PADDING.top + h}
                className="stroke-border/50"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <rect
                x={PADDING.left + (hoveredIdx / (data.length - 1)) * w - 45}
                y={PADDING.top - 5}
                width={90}
                height={30}
                rx={6}
                className="fill-card/90 stroke-border/50"
                strokeWidth={0.5}
              />
              <text
                x={PADDING.left + (hoveredIdx / (data.length - 1)) * w}
                y={PADDING.top + 7}
                textAnchor="middle"
                className="fill-primary text-[9px] font-bold"
              >
                {data[hoveredIdx].practiceDays} nap
              </text>
              <text
                x={PADDING.left + (hoveredIdx / (data.length - 1)) * w}
                y={PADDING.top + 19}
                textAnchor="middle"
                className="fill-emerald-500 text-[9px] font-bold"
              >
                {data[hoveredIdx].songCount} dal
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
