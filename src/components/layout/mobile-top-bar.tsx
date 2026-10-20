'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { BandSwitcher } from '@/components/band/band-switcher';
import { LogoMark } from './logo';
import { UserMenu } from './user-menu';
import type { ShellUser } from './nav-items';

export function MobileTopBar({ user }: { user: ShellUser }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border-strong bg-background/92 pr-2 pl-4 backdrop-blur-md md:hidden">
      <Link href="/dashboard" aria-label="ChordMate kezdőlap">
        <LogoMark className="size-7" />
      </Link>
      <BandSwitcher />
      <div className="ml-auto flex items-center">
        <Link href="/songs?focus=search" aria-label="Keresés" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <Search />
        </Link>
        <UserMenu user={user} triggerId="user-menu-mobile" />
      </div>
    </header>
  );
}
