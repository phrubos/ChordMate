import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAnalyticsData } from '@/actions/analytics';
import { Navbar } from '@/components/layout/navbar';
import { PageTransition } from '@/components/shared/page-transition';
import { PageHeader } from '@/components/shared/page-header';
import { PracticeHeatmap } from '@/components/analytics/practice-heatmap';
import { TopSongsRanking } from '@/components/analytics/top-songs-ranking';
import { TrendChart } from '@/components/analytics/trend-chart';
import { NeglectedSongs } from '@/components/analytics/neglected-songs';
import {
  CalendarDays,
  Music,
  ListMusic,
  Flame,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getAnalyticsData();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageTransition>
          <PageHeader
            title="Analitika"
            description="A gyakorlásaid összesítője"
          />

          {/* KPI Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: 'Próba napok',
                value: (
                  <span className="flex items-center gap-1.5 text-xs whitespace-nowrap mt-1">
                    <span className="flex items-center gap-0.5 text-emerald-500 font-medium tracking-tight">
                      <CheckCircle2 className="size-3.5" />
                      {data.kpis.pastPracticeDays} volt
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-medium tracking-tight">
                      <Circle fill="currentColor" className="size-3" />
                      {data.kpis.futurePracticeDays} lesz
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span className="font-black text-foreground text-base tabular-nums">
                      {data.kpis.totalPracticeDays}
                    </span>
                  </span>
                ),
                isCustomValue: true,
                icon: CalendarDays,
                color: 'text-primary',
                bg: 'bg-primary/10',
                border: 'border-primary/20',
              },
              {
                label: 'Összes dal',
                value: data.kpis.totalSongsEverPracticed,
                icon: Music,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
              {
                label: 'Összesen',
                value: data.kpis.totalPracticeSessions,
                icon: ListMusic,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
              },
              {
                label: 'Legutóbbi próba',
                value: data.kpis.lastPracticeDateFormatted ?? '-',
                icon: Flame,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
              },
            ].map(({ label, value, subText, icon: Icon, color, bg, border, isCustomValue }: any) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 rounded-2xl border ${border} bg-card/50 p-4 backdrop-blur-md shadow-sm justify-center`}
              >
                <div className={`flex size-9 items-center justify-center rounded-xl ${bg} ${color} shadow-inner`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col items-center w-full min-w-0">
                  <span className={isCustomValue ? "" : "text-2xl font-black tabular-nums tracking-tight leading-none"}>
                    {value}
                  </span>
                  {subText && (
                    <div className="mt-1.5">
                      {subText}
                    </div>
                  )}
                  <span className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center ${subText || isCustomValue ? 'mt-1.5' : 'mt-1'}`}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="mt-8">
            <PracticeHeatmap data={data.heatmapData} />
          </div>

          {/* Trend + Top Songs */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TrendChart data={data.monthlyTrend} />
            <TopSongsRanking songs={data.topSongs} />
          </div>

          {/* Neglected Songs */}
          <div className="mt-6">
            <NeglectedSongs songs={data.neglectedSongs} />
          </div>
        </PageTransition>
      </main>
    </>
  );
}
