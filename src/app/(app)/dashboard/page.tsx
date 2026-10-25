import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { auth } from '@/lib/auth';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { NeglectedSongsCard } from '@/components/dashboard/neglected-songs-card';
import { RepertoireCard } from '@/components/dashboard/repertoire-card';
import { NextRehearsalHero } from '@/components/dashboard/next-rehearsal-hero';
import { Eyebrow } from '@/components/design/eyebrow';
import { getCalendarEntries } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';
import { getUserBand } from '@/actions/bands';
import { getRehearsalMetas } from '@/actions/rehearsals';
import { findNextRehearsalDate, todayIso } from '@/lib/calendar-utils';
import { buildSongInsights } from '@/lib/neglected';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const today = todayIso(now);

  const [entries, songs, band, metas] = await Promise.all([getCalendarEntries(), getSongs(), getUserBand(), getRehearsalMetas()]);
  // The next rehearsal is the first upcoming day with a setlist or with details.
  const nextDate = findNextRehearsalDate([...entries.map((e) => e.date), ...metas.map((m) => m.date)], today);
  const next = nextDate ? { date: nextDate, entries: entries.filter((e) => e.date === nextDate) } : null;
  const nextMeta = metas.find((m) => m.date === nextDate) ?? null;
  const insights = buildSongInsights(songs, entries, today);

  const firstName = session.user.name?.split(' ').filter(Boolean).at(-1) ?? '';
  const members = band?.members.map((m) => ({ name: m.user.name, image: m.user.image })) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <Eyebrow className="capitalize">{format(now, 'EEEE, MMMM d.', { locale: hu })}</Eyebrow>
        <h1 className="display-soft font-display text-[40px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[60px]">
          Szia{firstName ? `, ${firstName}` : ''}!
        </h1>
      </header>

      <NextRehearsalHero rehearsal={next} members={members} today={today} bandName={band?.name} meta={nextMeta} />

      <DashboardView initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} entries={entries} allSongs={songs} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <NeglectedSongsCard items={insights.neglected} nextRehearsalDate={next?.date ?? null} />
        <RepertoireCard counts={insights.statusCounts} />
      </div>
    </div>
  );
}
