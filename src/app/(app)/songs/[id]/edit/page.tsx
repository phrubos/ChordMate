import { notFound } from 'next/navigation';
import { SongForm } from '@/components/songs/song-form';
import { getSongById } from '@/actions/songs';

interface EditSongPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditSongPageProps) {
  const song = await getSongById((await params).id).catch(() => null);
  return { title: song ? `${song.title} szerkesztése` : 'Dal szerkesztése' };
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) notFound();
  return <SongForm song={song} />;
}
