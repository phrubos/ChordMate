import { PendingLink } from '@/components/shared/pending-link';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { notFound, redirect } from 'next/navigation';
import { CalendarX } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/shared/empty-state';
import { PracticeView } from '@/components/practice/practice-view';
import { auth } from '@/lib/auth';
import { getCalendarEntries } from '@/actions/calendar';
import { getRehearsalMetas } from '@/actions/rehearsals';
import { findNextRehearsalDate, todayIso } from '@/lib/calendar-utils';
import type { CalendarEntryWithSong } from '@/types';

interface PracticePageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ i?: string }>;
}

function PracticeEmpty({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <EmptyState icon={CalendarX} illustration="calendar" title={title} description={description}>
        <div className="flex flex-wrap justify-center gap-2">
          <PendingLink href={href} className={buttonVariants()}>
            {cta}
          </PendingLink>
          <PendingLink href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            Vissza a kezdőlapra
          </PendingLink>
        </div>
      </EmptyState>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function EmptySetlist({ date }: { date: string }) {
  return (
    <PracticeEmpty
      title="Ezen a próbán még nincs setlist"
      description={`${capitalize(format(parseISO(date), 'MMMM d., EEEE', { locale: hu }))} — adj dalokat a próbához, és indulhat a Próba mód.`}
      href={`/rehearsals/${date}`}
      cta="Setlist összeállítása"
    />
  );
}

export default async function PracticePage({ params, searchParams }: PracticePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [{ date }, { i }] = await Promise.all([params, searchParams]);
  const [entries, metas] = await Promise.all([getCalendarEntries() as Promise<CalendarEntryWithSong[]>, getRehearsalMetas()]);

  // `/practice/next` (masthead) resolves to the upcoming rehearsal — the same one the Kezdőlap shows.
  if (date === 'next') {
    const next = findNextRehearsalDate([...entries.map((e) => e.date), ...metas.map((m) => m.date)], todayIso());
    if (!next)
      return (
        <PracticeEmpty
          title="Nincs tervezett próba"
          description="Tervezz egy próbát a Próbák oldalon, és állítsd össze a setlistet."
          href="/rehearsals"
          cta="Próba tervezése"
        />
      );
    if (entries.some((e) => e.date === next)) redirect(`/practice/${next}`);
    return <EmptySetlist date={next} />;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const dayEntries = entries.filter((e) => e.date === date);
  if (dayEntries.length === 0) return <EmptySetlist date={date} />;

  return (
    <PracticeView
      key={date}
      date={date}
      songs={dayEntries.map((e) => e.song)}
      label={`${format(parseISO(date), 'MMM d.', { locale: hu })} próba`}
      initialIndex={Number(i ?? 1) - 1}
    />
  );
}
