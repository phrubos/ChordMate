import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { PracticeHistory } from '@/components/dashboard/practice-history';
import { getCalendarEntries, getCalendarStats } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [entries, songs, calendarStats] = await Promise.all([
    getCalendarEntries(),
    getSongs(),
    getCalendarStats(),
  ]);

  return (
    <>
      <div>
        <div>
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
        </div>
      </div>
    </>
  );
}
