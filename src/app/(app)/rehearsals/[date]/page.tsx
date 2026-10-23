import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getRehearsal } from '@/actions/rehearsals';
import { getCalendarEntries } from '@/actions/calendar';
import { getSongs } from '@/actions/songs';
import { DayDetailPanel } from '@/components/calendar/day-detail-panel';
import { RehearsalHeader } from '@/components/rehearsals/rehearsal-header';
import { RehearsalAttendance } from '@/components/rehearsals/rehearsal-attendance';
import { todayIso } from '@/lib/calendar-utils';
import { isIsoDate } from '@/lib/rehearsals';

export const metadata = { title: 'Próba — ChordMate' };

export default async function RehearsalPage({ params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { date } = await params;
  if (!isIsoDate(date)) notFound();

  const [rehearsal, songs, allEntries] = await Promise.all([getRehearsal(date), getSongs(), getCalendarEntries()]);
  const today = todayIso();

  return (
    <div className="flex flex-col gap-10">
      <RehearsalHeader date={date} meta={rehearsal.meta} songCount={rehearsal.entries.length} today={today} />
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <DayDetailPanel date={date} today={today} entries={rehearsal.entries} allSongs={songs} allEntries={allEntries} variant="setlist" />
        {rehearsal.hasBand && <RehearsalAttendance date={date} userId={session.user.id} attendance={rehearsal.attendance} isPast={date < today} />}
      </div>
    </div>
  );
}
