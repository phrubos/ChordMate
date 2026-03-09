import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/layout/navbar';
import { DashboardView } from '@/components/calendar/dashboard-view';
import { getCalendarEntries } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [entries, songs] = await Promise.all([
    getCalendarEntries(year, month),
    getSongs(),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <DashboardView
          initialYear={year}
          initialMonth={month}
          entries={entries}
          allSongs={songs}
        />
      </main>
    </>
  );
}
