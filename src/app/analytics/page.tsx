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
                label: 'Gyakorolt napok',
                value: data.kpis.totalPracticeDays,
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
                label: 'Aktuális streak',
                value: `${data.kpis.currentStreak} nap`,
                icon: Flame,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
              },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-2 rounded-2xl border ${border} bg-card/50 p-4 backdrop-blur-md shadow-sm`}
              >
                <div className={`flex size-9 items-center justify-center rounded-xl ${bg} ${color} shadow-inner`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black tabular-nums tracking-tight">
                    {value}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mt-0.5">
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
            <TrendChart data={data.weeklyTrend} />
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
