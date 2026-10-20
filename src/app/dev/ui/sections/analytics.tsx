'use client';

import { PracticeHeatmap } from '@/components/analytics/practice-heatmap';
import { TopSongsRanking } from '@/components/analytics/top-songs-ranking';
import { TrendChart } from '@/components/analytics/trend-chart';
import { NeglectedSongs } from '@/components/analytics/neglected-songs';
import { PracticeHistory } from '@/components/dashboard/practice-history';
import { FIXTURE_TODAY, fixtureEntries } from '../fixtures';

const heat: Record<string, number> = {};
for (const e of fixtureEntries) heat[e.date] = (heat[e.date] ?? 0) + 1;
const days = Object.entries(heat).map(([date, n]) => ({
  date,
  songCount: n,
  songs: fixtureEntries.filter((e) => e.date === date).map((e) => e.song.title),
}));
const MONTHS = ['nov', 'dec', 'jan', 'feb', 'már', 'ápr', 'máj', 'jún', 'júl', 'aug', 'szep', 'okt'];

export function AnalyticsSection() {
  return (
    <section id="analytics" className="flex flex-col gap-12">
      <PracticeHeatmap data={heat} />
      <div className="grid gap-12 lg:grid-cols-2">
        <TrendChart data={MONTHS.map((month, i) => ({ month, practiceDays: [2, 3, 1, 4, 3, 5, 2, 0, 1, 3, 4, 6][i], songCount: [5, 8, 3, 9, 7, 11, 6, 0, 2, 8, 10, 14][i] }))} />
        <TopSongsRanking songs={[['Hotel California', 'Eagles', 9], ['Wonderwall', 'Oasis', 7], ['Gyöngyhajú lány', 'Omega', 6], ['Most múlik pontosan', 'Kispál és a Borz', 4], ['Black', 'Pearl Jam', 2]].map(([title, artist, count]) => ({ title: String(title), artist: String(artist), count: Number(count), lastDate: FIXTURE_TODAY }))} />
      </div>
      <NeglectedSongs songs={[{ title: 'Layla (Unplugged)', artist: 'Eric Clapton', count: 3, lastDate: '2026-07-02' }, { title: 'Blackbird', artist: 'The Beatles', count: 1, lastDate: '2026-08-15' }]} />
      <PracticeHistory history={days} today={FIXTURE_TODAY} />
    </section>
  );
}
