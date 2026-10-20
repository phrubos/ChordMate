import { NeglectedSongsCard } from '@/components/dashboard/neglected-songs-card';
import { RepertoireCard } from '@/components/dashboard/repertoire-card';
import { buildSongInsights } from '@/lib/neglected';
import { FIXTURE_TODAY, fixtureEntries, fixtureSongs } from '../fixtures';

export function InsightsSection() {
  const insights = buildSongInsights(fixtureSongs, fixtureEntries, FIXTURE_TODAY);
  return (
    <section id="insights" className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <NeglectedSongsCard items={insights.neglected} nextRehearsalDate="2026-10-22" />
      <RepertoireCard counts={insights.statusCounts} />
    </section>
  );
}
