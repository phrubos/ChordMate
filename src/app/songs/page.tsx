import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SongList } from '@/components/songs/song-list';
import { SongFilters } from '@/components/songs/song-filters';
import { NewSongButton } from '@/components/songs/new-song-button';
import { SpotifyPlaylistButton } from '@/components/songs/spotify-playlist-button';
import { Navbar } from '@/components/layout/navbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { auth } from '@/lib/auth';
import { getSongs } from '@/actions/songs';
import { getUserBand } from '@/actions/bands';
import { PageTransition } from '@/components/shared/page-transition';
import { Suspense } from 'react';


interface SongsPageProps {
  searchParams: Promise<{ search?: string; difficulty?: string; hasTab?: string; fav?: string; sort?: string }>;
}

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [{ search, difficulty, hasTab, fav, sort }, band] = await Promise.all([
    searchParams,
    getUserBand(),
  ]);
  const songs = await getSongs({
    search,
    difficulty: difficulty ? Number(difficulty) : undefined,
    hasTab: hasTab === '1',
    favOnly: fav === '1',
    sort: sort === 'date' ? 'date' : 'artist',
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageTransition>
          <PageHeader title="Dalok" description="A közös dallistátok">
            <Suspense>
              <SpotifyPlaylistButton bandName={band?.name} />
            </Suspense>
            <NewSongButton />
          </PageHeader>

          <div className="mt-6 flex flex-col gap-4">
            <Suspense>
              <SongFilters />
            </Suspense>
            <SongList songs={songs} searchQuery={search} />
          </div>
        </PageTransition>
      </main>
      <MobileBottomNav />
    </>
  );
}
