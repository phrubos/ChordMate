'use client';

import { PlayerProvider } from '@/components/player/player-provider';
import { NextRehearsalHero } from '@/components/dashboard/next-rehearsal-hero';
import { pickNextRehearsal } from '@/lib/calendar-utils';
import { FIXTURE_TODAY, fixtureEntries, fixtureMembers } from '../fixtures';

export function HeroSection() {
  return (
    <section id="hero" className="flex flex-col gap-8">
      <PlayerProvider>
        <NextRehearsalHero rehearsal={pickNextRehearsal(fixtureEntries, FIXTURE_TODAY)} members={fixtureMembers} today={FIXTURE_TODAY} bandName="Hangolatlanok" />
        <NextRehearsalHero rehearsal={null} members={[]} today={FIXTURE_TODAY} />
      </PlayerProvider>
    </section>
  );
}
