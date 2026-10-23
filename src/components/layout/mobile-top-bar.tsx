'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BandSwitcher } from '@/components/band/band-switcher';
import { LogoMark } from './logo';
import { UserMenu } from './user-menu';
import { useGlobalSearch } from './global-search';
import type { ShellUser } from './nav-items';

export function MobileTopBar({ user }: { user: ShellUser }) {
  const search = useGlobalSearch();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border-strong bg-background/92 pr-2 pl-4 backdrop-blur-md md:hidden">
      <Link href="/dashboard" aria-label="ChordMate kezdőlap">
        <LogoMark className="size-7" />
      </Link>
      <BandSwitcher />
      <div className="ml-auto flex items-center">
        <Button variant="ghost" size="icon" aria-label="Keresés" onClick={search.open}>
          <Search />
        </Button>
        <UserMenu user={user} triggerId="user-menu-mobile" />
      </div>
    </header>
  );
}
