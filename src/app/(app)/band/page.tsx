import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserBand, getUserBands } from '@/actions/bands';
import { BandProfile } from '@/components/band/band-profile';

export default async function BandPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [band, allBands] = await Promise.all([getUserBand(), getUserBands()]);
  if (!band) redirect('/dashboard');

  return (
    <>
      <div>
        <div>
          <BandProfile band={band} currentUserId={session.user.id!} bandCount={allBands.length} />
        </div>
      </div>
    </>
  );
}
