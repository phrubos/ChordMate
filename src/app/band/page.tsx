import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { auth } from '@/lib/auth';
import { getUserBand } from '@/actions/bands';
import { PageTransition } from '@/components/shared/page-transition';
import { BandProfile } from '@/components/band/band-profile';

export default async function BandPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const band = await getUserBand();
  if (!band) redirect('/dashboard');

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <PageTransition>
          <BandProfile band={band} currentUserId={session.user.id!} />
        </PageTransition>
      </main>
    </>
  );
}
