import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { Masthead } from '@/components/layout/masthead';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ToolsLauncher } from '@/components/layout/tools-launcher';
import { GlobalSearch } from '@/components/layout/global-search';
import { PlayerProvider } from '@/components/player/player-provider';
import { MiniPlayer } from '@/components/player/mini-player';
import { KeyboardShortcuts } from '@/components/shared/keyboard-shortcuts';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = { name: session.user.name ?? null, image: session.user.image ?? null, email: session.user.email ?? null };

  return (
    <ToolsLauncher>
      <GlobalSearch>
        <PlayerProvider>
          <Masthead user={user} />
          <MobileTopBar user={user} />
          <main className="mx-auto w-full max-w-[1320px] max-md:overflow-x-clip px-4 pt-6 pb-36 lg:px-10 lg:pt-11">{children}</main>
          <MiniPlayer />
          <BottomNav />
          <KeyboardShortcuts />
        </PlayerProvider>
      </GlobalSearch>
    </ToolsLauncher>
  );
}
