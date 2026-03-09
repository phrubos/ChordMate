import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { SongList } from '@/components/songs/song-list';
import { SongSearch } from '@/components/songs/song-search';
import { Navbar } from '@/components/layout/navbar';
import { auth } from '@/lib/auth';
import { getSongs } from '@/actions/songs';
import { Suspense } from 'react';

interface SongsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { search } = await searchParams;
  const songs = await getSongs(search);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
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
            <SongSearch />
          </Suspense>
          <SongList songs={songs} searchQuery={search} />
        </div>
      </main>
    </>
  );
}
