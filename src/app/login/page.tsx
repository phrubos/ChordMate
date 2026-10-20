import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { CoverArt } from '@/components/design/cover-art';

export const metadata = { title: 'Bejelentkezés — ChordMate' };

const COVERS = [
  { title: 'Most múlik pontosan', artist: 'Kispál és a Borz', tilt: '-rotate-3' },
  { title: 'Wish You Were Here', artist: 'Pink Floyd', tilt: 'rotate-2 translate-y-6' },
  { title: 'Gyöngyhajú lány', artist: 'Omega', tilt: 'rotate-1 -translate-y-2' },
  { title: 'Hotel California', artist: 'Eagles', tilt: '-rotate-2 translate-y-4' },
];

export default async function LoginPage() {
  try {
    const session = await auth();
    if (session) redirect('/dashboard');
  } catch (e) {
    // redirect() throws on purpose; only swallow "auth not configured" errors.
    if (e && typeof e === 'object' && 'digest' in e) throw e;
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section aria-hidden className="relative hidden flex-col justify-center gap-14 overflow-hidden border-r border-border px-16 lg:flex">
        <div className="grid w-full max-w-[520px] grid-cols-2 gap-6">
          {COVERS.map((c) => (
            <div key={c.title} className={`aspect-square shadow-[0_24px_48px_oklch(0_0_0/.45)] ${c.tilt}`}>
              <CoverArt title={c.title} artist={c.artist} size="fill" showType />
            </div>
          ))}
        </div>
        <p className="display-soft max-w-[520px] font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em]">
          Minden próba egy <em className="font-normal text-primary-text">új lemezoldal</em>.
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <LoginForm />
      </section>
    </main>
  );
}
