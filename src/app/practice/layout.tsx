import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';

export const metadata = { title: 'Próba mód — ChordMate' };

/** Full-screen practice: no masthead, bottom nav or mini-player. */
export default async function PracticeLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <div className="bg-background text-foreground">{children}</div>;
}
