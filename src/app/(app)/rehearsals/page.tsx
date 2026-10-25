import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { RehearsalList } from '@/components/rehearsals/rehearsal-list';
import { RehearsalTabs } from '@/components/rehearsals/rehearsal-tabs';
import { getRehearsalDays } from '@/actions/rehearsals';
import { getCalendarEntries } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';
import { todayIso } from '@/lib/calendar-utils';

export const metadata = { title: 'Próbák' };

export default async function RehearsalsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { view } = await searchParams;
  const now = new Date();

  if (view === 'calendar') {
    const [entries, songs] = await Promise.all([getCalendarEntries(), getSongs()]);
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Próbák" />
        <RehearsalTabs active="calendar" />
        <DashboardView initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} entries={entries} allSongs={songs} />
      </div>
    );
  }

  const { upcoming, past } = await getRehearsalDays();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Próbák" />
      <RehearsalTabs active="list" />
      <RehearsalList upcoming={upcoming} past={past} today={todayIso(now)} />
    </div>
  );
}
