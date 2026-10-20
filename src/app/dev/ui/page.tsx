import { notFound } from 'next/navigation';
import { MobileFrame } from './mobile-frame';
import { TokensSection } from './sections/tokens';
import { AtomsSection } from './sections/atoms';
import { ShellSection } from './sections/shell';
import { PlayerSection } from './sections/player';
import { HeroSection } from './sections/hero';
import { CalendarSection } from './sections/calendar';
import { DaySection } from './sections/day';
import { InsightsSection } from './sections/insights';
import { SongsSection } from './sections/songs';
import { HubSection } from './sections/hub';
import { PracticeSection } from './sections/practice';
import { FormSection } from './sections/form';
import { AnalyticsSection } from './sections/analytics';

export const metadata = { title: 'ChordMate — UI showcase (dev)' };

interface DevUiPageProps {
  searchParams: Promise<{ w?: string; embed?: string; only?: string }>;
}

export default async function DevUiPage({ searchParams }: DevUiPageProps) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { w, only } = await searchParams;
  if (w) return <MobileFrame width={Number(w) || 390} />;
  // `?only=<id>` renders a single section (stable screenshots without hash scrolling).
  const show = (id: string) => !only || only === id;

  return (
    <main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-4 pb-32 lg:px-10">
      <ShellSection />
      <h1 className="display-soft font-display text-4xl font-medium">ChordMate UI showcase</h1>
      {show('hero') && <HeroSection />}
      {show('calendar') && <CalendarSection />}
      {show('day-panels') && <DaySection />}
      {show('insights') && <InsightsSection />}
      {show('songs') && <SongsSection />}
      {show('hub') && <HubSection />}
      {show('practice') && <PracticeSection />}
      {show('form') && <FormSection />}
      {show('analytics') && <AnalyticsSection />}
      {show('tokens') && <TokensSection />}
      {show('atoms') && <AtomsSection />}
      {show('player') && <PlayerSection />}
    </main>
  );
}
