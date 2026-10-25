import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserBand } from '@/actions/bands';
import { BandProfile } from '@/components/band/band-profile';
import { SpotifyPlaylistButton } from '@/components/songs/spotify-playlist-button';

export const metadata = { title: 'Banda' };

export default async function BandPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const band = await getUserBand();
  if (!band) redirect('/dashboard');

  return (
    <>
      <div>
        <div>
          <BandProfile
            band={band}
            currentUserId={session.user.id!}
            integrations={<SpotifyIntegration bandName={band.name} />}
          />
        </div>
      </div>
    </>
  );
}

function SpotifyIntegration({ bandName }: { bandName: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-strong p-4">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">Spotify playlist</span>
        <span className="text-[13px] text-muted-foreground">A repertoár dalaiból playlist, új dalok automatikusan bekerülnek.</span>
      </div>
      <Suspense>
        <SpotifyPlaylistButton bandName={bandName} />
      </Suspense>
    </div>
  );
}
