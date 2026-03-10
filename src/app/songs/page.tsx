import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { SongList } from '@/components/songs/song-list';
import { SongFilters } from '@/components/songs/song-filters';
import { Navbar } from '@/components/layout/navbar';
import { auth } from '@/lib/auth';
import { getSongs } from '@/actions/songs';
import { PageTransition } from '@/components/shared/page-transition';
import { Suspense } from 'react';


interface SongsPageProps {
  searchParams: Promise<{ search?: string; difficulty?: string; hasTab?: string; fav?: string }>;
}

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { search, difficulty, hasTab, fav } = await searchParams;
  const songs = await getSongs({
    search,
    difficulty: difficulty ? Number(difficulty) : undefined,
    hasTab: hasTab === '1',
    favOnly: fav === '1',
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageTransition>
          <PageHeader title="Dalok" description="A közös dallistátok">
            <Link href="/songs/new">
              <Button className="gap-2">
                <Plus className="size-4" />
                Új dal
              </Button>
            </Link>
          </PageHeader>

          <div className="mt-6 flex flex-col gap-4">
            <Suspense>
              <SongFilters />
            </Suspense>
            <SongList songs={songs} searchQuery={search} />
          </div>
        </PageTransition>
      </main>
    </>
  );
}
