import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAnalyticsData } from '@/actions/analytics';
import { getCalendarStats } from '@/actions/calendar';
import { todayIso } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';
import { RehearsalTabs } from '@/components/rehearsals/rehearsal-tabs';
import { PracticeHeatmap } from '@/components/analytics/practice-heatmap';
import { TopSongsRanking } from '@/components/analytics/top-songs-ranking';
import { TrendChart } from '@/components/analytics/trend-chart';
import { NeglectedSongs } from '@/components/analytics/neglected-songs';
import { PracticeHistory } from '@/components/dashboard/practice-history';

export const metadata = { title: 'Próbák · Áttekintés — ChordMate' };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [data, stats] = await Promise.all([getAnalyticsData(), getCalendarStats()]);
  const kpis: { label: string; value: string | number; hint: string }[] = [
    { label: 'Lezajlott próbák', value: data.kpis.pastPracticeDays, hint: 'nap, amikor volt setlist' },
    { label: 'Tervezett próbák', value: data.kpis.futurePracticeDays, hint: 'mától előre' },
    { label: 'Próbált dalok', value: data.kpis.totalSongsEverPracticed, hint: 'különböző dal próbán' },
    { label: 'Legutóbbi próba', value: data.kpis.lastPracticeDateFormatted ?? '—', hint: data.kpis.lastPracticeDaysAgo != null ? `${data.kpis.lastPracticeDaysAgo} napja` : 'még nem volt' },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-8">
        <PageHeader title="Próbák" description="A banda próbái egy év alatt" />
        <RehearsalTabs active="overview" />
      </div>

      <dl className="grid grid-cols-2 border-t border-border-strong md:grid-cols-4">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={cn('flex flex-col gap-1 border-border py-5 pr-4', i % 2 === 1 && 'border-l pl-4', i >= 2 && 'border-t md:border-t-0', i > 0 && 'md:border-l md:pl-6')}
          >
            <dt className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">{k.label}</dt>
            <dd className="display-soft font-display text-[40px] leading-none font-medium tabular-nums md:text-[52px]">{k.value}</dd>
            <dd className="text-[13px] text-muted-foreground">{k.hint}</dd>
          </div>
        ))}
      </dl>

      <PracticeHeatmap data={data.heatmapData} />

      <div className="grid gap-12 lg:grid-cols-2">
        <TrendChart data={data.monthlyTrend} />
        <TopSongsRanking songs={data.topSongs} />
      </div>

      <NeglectedSongs songs={data.neglectedSongs} />
      <PracticeHistory history={stats.practiceHistory} today={todayIso()} />
    </div>
  );
}
