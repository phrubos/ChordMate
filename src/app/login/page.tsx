import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  try {
    const session = await auth();
    if (session) redirect('/dashboard');
  } catch {
    // Auth not configured yet — show login page anyway
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/15 blur-[100px] animate-float" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-accent/10 blur-[100px] animate-float [animation-delay:3s]" />
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />
      </div>
      <LoginForm />
    </div>
  );
}
