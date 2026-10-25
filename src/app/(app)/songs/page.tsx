import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SongList } from '@/components/songs/song-list';
import { SongFilters } from '@/components/songs/song-filters';
import { NewSongButton } from '@/components/songs/new-song-button';
import { auth } from '@/lib/auth';
import { getSongs } from '@/actions/songs';
import { getUserBand } from '@/actions/bands';
import { parseSongFilters } from '@/lib/song-filters';
import { countByStatus } from '@/lib/song-meta';

export const metadata = { title: 'Dalok' };

interface SongsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [params, band] = await Promise.all([searchParams, getUserBand()]);
  const filters = parseSongFilters(params);
  // Status is filtered here (not in SQL) so the segment counts reflect every other filter.
  const songs = await getSongs({
    search: filters.search,
    difficulty: filters.difficulty,
    hasTab: filters.hasTab,
    favOnly: filters.favOnly,
    sort: filters.sort,
  });
  const visible = filters.status ? songs.filter((s) => s.status === filters.status) : songs;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={band?.name ? `${band.name} repertoárja` : 'Repertoár'}
        title={
          <>
            Dalok <em className="align-middle font-display text-[0.45em] font-normal text-primary-text">{songs.length}</em>
          </>
        }
      >
        <NewSongButton />
      </PageHeader>
      <Suspense>
        <SongFilters counts={countByStatus(songs)} />
      </Suspense>
      <SongList songs={visible} view={filters.view} searchQuery={filters.search} filtered={!!(filters.status || filters.difficulty || filters.hasTab || filters.favOnly)} />
    </div>
  );
}
