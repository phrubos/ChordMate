'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, FileText, Heart, CalendarDays, BarChart2, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatsWidgetProps {
  totalSongs: number;
  withTabs: number;
  favorites: number;
  avgDifficulty: number;
  totalPracticeDays: number;
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatsWidget({ totalSongs, withTabs, favorites, avgDifficulty, totalPracticeDays }: StatsWidgetProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabPct = totalSongs > 0 ? Math.round((withTabs / totalSongs) * 100) : 0;
  const favPct = totalSongs > 0 ? Math.round((favorites / totalSongs) * 100) : 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        onClick={() => setOpen(true)}
        title="Statisztika"
      >
        <BarChart2 className="size-[18px]" />
      </Button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 overflow-hidden rounded-[24px] border border-white/10 bg-card/60 backdrop-blur-2xl p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle gradient glow in background */}
            <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/20 blur-[50px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-blue-500/10 blur-[50px] pointer-events-none" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors mix-blend-screen"
            >
              <X className="size-4" />
            </button>

            <div className="relative z-10 mb-8 mt-2">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                Statisztika
              </h2>
              <p className="text-sm font-medium text-muted-foreground/80 mt-1">A zenekar összesítője</p>
            </div>

            {/* Big number row */}
            <div className="relative z-10 grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Összes dal', value: totalSongs, icon: Music, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
                { label: 'Próbanapok', value: totalPracticeDays, icon: CalendarDays, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
                { label: 'Kedvencek', value: favorites, icon: Heart, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
              ].map(({ label, value, icon: Icon, color, border, bg }) => (
                <div key={label} className={`flex flex-col items-center gap-2 rounded-2xl border ${border} bg-white/5 p-4 backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]`}>
                  <div className={`flex size-8 items-center justify-center rounded-xl ${bg} ${color} shadow-inner`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tabular-nums tracking-tight">{value}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mt-1">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar charts */}
            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1">
                <TrendingUp className="size-3.5" />
                Arányok
              </div>

              <div className="space-y-4">
                <StatBar label="TAB-bal rendelkező" value={withTabs} max={totalSongs} color="bg-blue-500" />
                <StatBar label="Kedvenc dalok" value={favorites} max={totalSongs} color="bg-rose-500" />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 mt-2 backdrop-blur-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 shrink-0">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TAB lefedettség</p>
                  <p className="text-lg font-black tracking-tight">{tabPct}%</p>
                </div>
                <div className="w-[1px] h-8 bg-border/50 mx-2" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kedvenc arány</p>
                  <p className="text-lg font-black tracking-tight">{favPct}%</p>
                </div>
              </div>

              {avgDifficulty > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-md mt-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Átlagos nehézség</span>
                  <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`size-2.5 rounded-full shadow-inner ${i < Math.round(avgDifficulty) ? 'bg-primary' : 'bg-primary/20'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-sm font-black tabular-nums">{avgDifficulty.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
