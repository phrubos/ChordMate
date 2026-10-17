import { notFound } from 'next/navigation';
import { MobileFrame } from './mobile-frame';

export const metadata = { title: 'ChordMate — UI showcase (dev)' };

interface DevUiPageProps {
  searchParams: Promise<{ w?: string; embed?: string }>;
}

export default async function DevUiPage({ searchParams }: DevUiPageProps) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { w } = await searchParams;
  if (w) return <MobileFrame width={Number(w) || 390} />;

  return (
    <main className="mx-auto max-w-[1320px] px-4 py-10 lg:px-10">
      <h1 className="text-3xl font-semibold">ChordMate UI showcase</h1>
      <section id="atoms" className="mt-10" />
    </main>
  );
}
