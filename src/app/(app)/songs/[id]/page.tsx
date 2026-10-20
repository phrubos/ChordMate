import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSongById } from '@/actions/songs';
import { getSongHistory } from '@/actions/calendar';
import { getRecordingsByDate } from '@/actions/recordings';
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
  const [song, history] = await Promise.all([getSongById(id), getSongHistory(id)]);
  if (!song) notFound();

  const today = todayIso();
  const dates = history.map((h) => h.date);
  const title = song.title.toLowerCase();
  // Recordings carry no song id: take the 3 most recent rehearsal days and match the song title in the name.
  const recent = dates.filter((d) => d <= today).slice(0, 3);
  const recordings = (await Promise.all(recent.map(getRecordingsByDate)))
    .flat()
    .filter((r) => r.name.toLowerCase().includes(title))
    .map((r) => ({ id: r.id, name: r.name, date: r.date, duration: r.duration }));

  const nextPlanned = dates.filter((d) => d >= today).at(-1);

  return (
    <SongHubView
      song={song as SongWithUser}
      practiceHref={`/practice/${nextPlanned ?? 'next'}`}
      chords={extractChords(song.tabContent)}
      history={dates}
      recordings={recordings}
      today={today}
    />
  );
}
