import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
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
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <SongForm song={song} />
      </main>
      <MobileBottomNav />
    </>
  );
}
