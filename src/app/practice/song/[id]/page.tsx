import { notFound, redirect } from 'next/navigation';
import { PracticeView } from '@/components/practice/practice-view';
import { auth } from '@/lib/auth';
import { getSongById } from '@/actions/songs';
import { todayIso } from '@/lib/calendar-utils';

interface SongPracticePageProps {
  params: Promise<{ id: string }>;
}

/** Solo practice of one song — the same stage view as a rehearsal, without a setlist. */
export default async function SongPracticePage({ params }: SongPracticePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const song = await getSongById(id);
  if (!song) notFound();

  return <PracticeView date={todayIso()} songs={[song]} label="Gyakorlás" exitHref={`/songs/${id}`} initialIndex={0} syncUrl={false} />;
}
