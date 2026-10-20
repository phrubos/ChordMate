import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CalendarX } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/shared/empty-state';
import { PracticeView } from '@/components/practice/practice-view';
import { auth } from '@/lib/auth';
import { getCalendarEntries } from '@/actions/calendar';
import { pickNextRehearsal, todayIso } from '@/lib/calendar-utils';
import type { CalendarEntryWithSong } from '@/types';

interface PracticePageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ i?: string }>;
}

function PracticeEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <EmptyState icon={CalendarX} illustration="calendar" title={title} description={description}>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          Vissza a kezdőlapra
        </Link>
      </EmptyState>
    </div>
  );
}

export default async function PracticePage({ params, searchParams }: PracticePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [{ date }, { i }] = await Promise.all([params, searchParams]);
  const entries = (await getCalendarEntries()) as CalendarEntryWithSong[];

  // `/practice/next` (masthead) resolves to the upcoming rehearsal.
  if (date === 'next') {
    const next = pickNextRehearsal(entries, todayIso());
    if (!next) return <PracticeEmpty title="Nincs tervezett próba" description="Válassz egy napot a naptárban, és állítsd össze a setlistet." />;
    redirect(`/practice/${next.date}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const dayEntries = entries.filter((e) => e.date === date);
  if (dayEntries.length === 0) return <PracticeEmpty title="Ezen a napon nincs setlist" description="Adj dalokat ehhez a naphoz a kezdőlapi naptárban." />;

  return <PracticeView key={date} date={date} entries={dayEntries} initialIndex={Number(i ?? 1) - 1} />;
}
