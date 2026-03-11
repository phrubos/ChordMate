import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { LoginPlayer } from '@/components/auth/remotion/login-player';

export default async function LoginPage() {
  try {
    const session = await auth();
    if (session) redirect('/dashboard');
  } catch {
    // Auth not configured yet — show login page anyway
  }

  return (
    <div className="login-panel relative flex min-h-screen flex-col lg:flex-row overflow-hidden">
      {/* Global Background Light Effect (Top Left) */}
      <div className="hidden lg:block pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-[10%] -top-[10%] size-[600px] rounded-full bg-primary/10 blur-[150px] animate-float opacity-50 [animation-delay:1.5s]" />
      </div>

      {/* Left: Remotion Animation Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative z-10 items-center justify-center">
        <LoginPlayer />
        {/* Subtle brand watermark */}
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 opacity-30">
          <span className="text-xs font-medium tracking-widest text-amber-500/60 uppercase">
            ChordMate
          </span>
        </div>
      </div>

      {/* Vertical accent divider removed for seamless blend */}

      {/* Right: Login Panel */}
      <div className="relative flex flex-1 items-center justify-center min-h-screen lg:min-h-0">
        {/* Background orbs (visible on both mobile and desktop) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-primary/8 blur-[100px] animate-float" />
          <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-accent/5 blur-[80px] animate-float [animation-delay:3s]" />
          <div className="absolute left-1/2 top-1/3 size-48 -translate-x-1/2 rounded-full bg-primary/3 blur-[60px]" />
        </div>

        {/* Removed Mobile: mini guitar icon header */}


        <LoginForm />
      </div>
    </div>
  );
}
