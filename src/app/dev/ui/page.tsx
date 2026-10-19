import { notFound } from 'next/navigation';
import { MobileFrame } from './mobile-frame';
import { TokensSection } from './sections/tokens';
import { AtomsSection } from './sections/atoms';
import { ShellSection } from './sections/shell';
import { PlayerSection } from './sections/player';
import { HeroSection } from './sections/hero';

export const metadata = { title: 'ChordMate — UI showcase (dev)' };

interface DevUiPageProps {
  searchParams: Promise<{ w?: string; embed?: string }>;
}

export default async function DevUiPage({ searchParams }: DevUiPageProps) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { w } = await searchParams;
  if (w) return <MobileFrame width={Number(w) || 390} />;

  return (
    <main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-4 pb-32 lg:px-10">
      <ShellSection />
      <h1 className="display-soft font-display text-4xl font-medium">ChordMate UI showcase</h1>
      <HeroSection />
      <TokensSection />
      <AtomsSection />
      <PlayerSection />
    </main>
  );
}
