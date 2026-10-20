'use client';

import { PracticeView } from '@/components/practice/practice-view';
import { fixtureEntries } from '../fixtures';

const DATE = '2026-10-22';
const entries = fixtureEntries.filter((e) => e.date === DATE);

export function PracticeSection() {
  return (
    <section id="practice" className="-mx-4 overflow-hidden border-y border-border lg:-mx-10">
      <PracticeView date={DATE} entries={entries} initialIndex={0} syncUrl={false} className="h-[844px] md:h-[900px]" />
    </section>
  );
}
