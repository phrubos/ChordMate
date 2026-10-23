'use client';

import { MiniPlayer } from '@/components/player/mini-player';
import { PlayerProvider } from '@/components/player/player-provider';
import { DayDetailPanel } from '@/components/calendar/day-detail-panel';
import { FIXTURE_TODAY, fixtureEntries, fixtureSongs } from '../fixtures';

const forDate = (date: string) => fixtureEntries.filter((e) => e.date === date);

export function DaySection() {
  return (
    <section id="day-panels" className="grid gap-10 lg:grid-cols-3">
      <PlayerProvider>
        {['2026-10-13', '2026-10-22', '2026-10-20'].map((date) => (
          <DayDetailPanel key={date} date={date} today={FIXTURE_TODAY} entries={forDate(date)} allSongs={fixtureSongs} allEntries={fixtureEntries} />
        ))}
        <MiniPlayer />
      </PlayerProvider>
    </section>
  );
}
