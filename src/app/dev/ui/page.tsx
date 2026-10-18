import { notFound } from 'next/navigation';
import { MobileFrame } from './mobile-frame';
import { TokensSection } from './sections/tokens';

export const metadata = { title: 'ChordMate — UI showcase (dev)' };

interface DevUiPageProps {
  searchParams: Promise<{ w?: string; embed?: string }>;
}

export default async function DevUiPage({ searchParams }: DevUiPageProps) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { w } = await searchParams;
  if (w) return <MobileFrame width={Number(w) || 390} />;

  return (
    <main className="mx-auto flex max-w-[1320px] flex-col gap-16 px-4 py-10 lg:px-10">
      <h1 className="display-soft font-display text-4xl font-medium">ChordMate UI showcase</h1>
      <TokensSection />
      <section id="atoms" />
    </main>
  );
}
