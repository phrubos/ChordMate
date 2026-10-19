import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { auth } from '@/lib/auth';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { PracticeHistory } from '@/components/dashboard/practice-history';
import { NextRehearsalHero } from '@/components/dashboard/next-rehearsal-hero';
import { Eyebrow } from '@/components/design/eyebrow';
import { getCalendarEntries, getCalendarStats } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';
import { getUserBand } from '@/actions/bands';
import { pickNextRehearsal, todayIso } from '@/lib/calendar-utils';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const today = todayIso(now);

  const [entries, songs, calendarStats, band] = await Promise.all([
    getCalendarEntries(),
    getSongs(),
    getCalendarStats(),
    getUserBand(),
  ]);

  const firstName = session.user.name?.split(' ').filter(Boolean).at(-1) ?? '';
  const members = band?.members.map((m) => ({ name: m.user.name, image: m.user.image })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Eyebrow className="capitalize">{format(now, 'EEEE, MMMM d.', { locale: hu })}</Eyebrow>
        <h1 className="display-soft font-display text-[40px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[60px]">
          Szia{firstName ? `, ${firstName}` : ''}!
        </h1>
      </header>

      <NextRehearsalHero rehearsal={pickNextRehearsal(entries, today)} members={members} today={today} bandName={band?.name} />

      <DashboardView initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} entries={entries} allSongs={songs} />
      <div className="rounded-xl border border-border/50 bg-card/30 p-4">
        <h3 className="mb-3 text-base font-semibold">Próba történet</h3>
        <PracticeHistory history={calendarStats.practiceHistory} />
      </div>
    </div>
  );
}
