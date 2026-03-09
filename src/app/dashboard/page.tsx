import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/layout/navbar';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { PracticeHistory } from '@/components/dashboard/practice-history';
import { HeaderStats } from '@/components/layout/header-stats';
import { getCalendarEntries, getCalendarStats } from '@/actions/calendar';
import { getSongs, getSongStats } from '@/actions/songs';
import { PageTransition } from '@/components/shared/page-transition';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [entries, songs, songStats, calendarStats] = await Promise.all([
    getCalendarEntries(year, month),
    getSongs(),
    getSongStats(),
    getCalendarStats(),
  ]);

  return (
    <>
      <Navbar stats={<HeaderStats />} />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageTransition>
          <div className="flex flex-col gap-6">
            <DashboardView
              initialYear={year}
              initialMonth={month}
              entries={entries}
              allSongs={songs}
            />
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="mb-3 text-base font-semibold">Próba történet</h3>
              <PracticeHistory history={calendarStats.practiceHistory} />
            </div>
          </div>
        </PageTransition>
      </main>
    </>
  );
}
