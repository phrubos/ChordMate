import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSongById } from '@/actions/songs';
import { getSongHistory, getUpcomingRehearsals } from '@/actions/calendar';
import { getRecordingsBySong } from '@/actions/recordings';
import { extractChords } from '@/lib/chords';
import { todayIso } from '@/lib/calendar-utils';
import { SongHubView } from '@/components/song-hub/song-hub-view';
import type { SongWithUser } from '@/types';

interface SongHubPageProps {
  params: Promise<{ id: string }>;
}

export default async function SongHubPage({ params }: SongHubPageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const [song, history, upcoming] = await Promise.all([getSongById(id), getSongHistory(id), getUpcomingRehearsals(id)]);
  if (!song) notFound();

  const today = todayIso();
  const dates = history.map((h) => h.date);
  const recordings = await getRecordingsBySong(id, song.title);

  const slot = upcoming.find((r) => r.position !== null);

  return (
    <SongHubView
      song={song as SongWithUser}
      rehearsal={slot ? { date: slot.date, position: slot.position!, count: slot.count } : null}
      chords={extractChords(song.tabContent)}
      history={dates}
      recordings={recordings}
      today={today}
    />
  );
}
