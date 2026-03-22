import { Navbar } from '@/components/layout/navbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { SongForm } from '@/components/songs/song-form';

export default function NewSongPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <SongForm />
      </main>
      <MobileBottomNav />
    </>
  );
}
