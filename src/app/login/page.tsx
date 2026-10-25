import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { TurntableScene } from '@/components/auth/turntable-scene';
import { LOGIN_ALBUMS, shuffleAlbums } from '@/lib/login-albums';

export const metadata = { title: 'Bejelentkezés' };

export default async function LoginPage() {
  try {
    const session = await auth();
    if (session) redirect('/dashboard');
  } catch (e) {
    // redirect() throws on purpose; only swallow "auth not configured" errors.
    if (e && typeof e === 'object' && 'digest' in e) throw e;
  }

  // Shuffled per request, so server and client agree on the order.
  const albums = shuffleAlbums(LOGIN_ALBUMS);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-10 lg:border-r lg:border-border lg:px-14 lg:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_62%_58%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_70%)]" />
        <TurntableScene albums={albums} className="relative w-full max-w-[380px] lg:max-w-[760px]" />
        <p className="display-soft relative mt-10 hidden w-full max-w-[760px] font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em] lg:block">
          Minden próba egy <em className="font-normal text-primary-text">új lemezoldal</em>.
        </p>
      </section>
      <section className="flex items-start justify-center px-6 pt-6 pb-16 lg:items-center lg:py-16">
        <LoginForm />
      </section>
    </main>
  );
}
