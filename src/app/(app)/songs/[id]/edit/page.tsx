import { notFound } from 'next/navigation';
import { SongForm } from '@/components/songs/song-form';
import { getSongById } from '@/actions/songs';

interface EditSongPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const { id } = await params;
  const song = await getSongById(id);

  if (!song) notFound();

  return (
    <>
      <div>
        <SongForm song={song} />
      </div>
    </>
  );
}
