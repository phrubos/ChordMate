'use client';

import { PracticeWrapUp } from '@/components/practice/practice-wrap-up';
import { fixtureEntries } from '../fixtures';

const songs = fixtureEntries.filter((e) => e.date === '2026-10-22').map((e) => e.song);

export function WrapUpSection() {
  return (
    <section id="wrapup" className="-mx-4 flex h-[900px] flex-col overflow-hidden border-y border-border lg:-mx-10">
      <PracticeWrapUp songs={songs} label="okt. 22. próba" exitHref="/dashboard" preview />
    </section>
  );
}
