'use client';

import { PlayerProvider } from '@/components/player/player-provider';
import { RehearsalTabs } from '@/components/rehearsals/rehearsal-tabs';
import { RehearsalList } from '@/components/rehearsals/rehearsal-list';
import { RehearsalHeader } from '@/components/rehearsals/rehearsal-header';
import { RehearsalAttendance } from '@/components/rehearsals/rehearsal-attendance';
import { DayDetailPanel } from '@/components/calendar/day-detail-panel';
import { listRehearsalDays } from '@/lib/rehearsals';
import { FIXTURE_TODAY, fixtureAttendance, fixtureEntries, fixtureRehearsals, fixtureSongs } from '../fixtures';

const days = listRehearsalDays(fixtureEntries, fixtureRehearsals, FIXTURE_TODAY);

export function RehearsalsSection() {
  return (
    <section id="rehearsals" className="flex flex-col gap-8">
      <h2 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">Próbák lista</h2>
      <RehearsalTabs active="list" />
      <RehearsalList {...days} today={FIXTURE_TODAY} />
    </section>
  );
}

export function RehearsalPageSection({ editOpen = false }: { editOpen?: boolean }) {
  const date = '2026-10-22';
  const entries = fixtureEntries.filter((e) => e.date === date);
  return (
    <section id="rehearsal" className="flex flex-col gap-10">
      <PlayerProvider>
        <RehearsalHeader date={date} meta={fixtureRehearsals[0]} songCount={entries.length} today={FIXTURE_TODAY} preview initialEditOpen={editOpen} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <DayDetailPanel date={date} today={FIXTURE_TODAY} entries={entries} allSongs={fixtureSongs} allEntries={fixtureEntries} variant="setlist" />
          <RehearsalAttendance date={date} userId="u-peter" attendance={fixtureAttendance} isPast={false} preview />
        </div>
      </PlayerProvider>
    </section>
  );
}
