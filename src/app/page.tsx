import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  try {
    const session = await auth();
    if (session) redirect('/dashboard');
  } catch {
    // Auth not configured yet
  }
  redirect('/login');
}
