'use client';

import Link from 'next/link';
import { PendingLink } from '@/components/shared/pending-link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search, Theater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BandSwitcher } from '@/components/band/band-switcher';
import { cn } from '@/lib/utils';
import { LogoMark } from './logo';
import { NAV_ITEMS, type ShellUser } from './nav-items';
import { UserMenu } from './user-menu';
import { useTools } from './tools-launcher';
import { useGlobalSearch } from './global-search';
import { MetronomeIcon, GuitarIcon } from './tool-icons';

interface MastheadProps {
  user: ShellUser;
  practiceHref?: string;
}

/** Desktop masthead (≥ md): brand + nav left, search / tools / practice / band / user right. */
export function Masthead({ user, practiceHref = '/practice/next' }: MastheadProps) {
  const pathname = usePathname();
  const tools = useTools();
  const search = useGlobalSearch();

  return (
    <header className="sticky top-0 z-40 hidden h-[68px] items-center gap-9 border-b border-border-strong bg-background/92 px-10 backdrop-blur-md md:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="display-soft font-display text-[26px] font-semibold tracking-[-0.02em]">ChordMate</span>
      </Link>

      <nav aria-label="Fő navigáció" className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <PendingLink
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'pressable rounded-md px-2.5 py-1.5 text-[15px] transition-[transform,color] duration-(--dur-fade)',
                active ? 'text-foreground shadow-[inset_0_-2px_0_var(--primary)]' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </PendingLink>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={search.open}
          aria-keyshortcuts="Control+K Meta+K"
          className="mr-2 hidden h-10 w-[260px] items-center gap-2.5 rounded-full border border-border-strong px-3.5 text-sm text-faint transition-colors hover:border-foreground/40 lg:flex"
        >
          <Search className="size-4 shrink-0" />
          <span className="truncate">Dal vagy előadó keresése…</span>
          <kbd className="ml-auto shrink-0 font-mono text-[11px] whitespace-nowrap">Ctrl K</kbd>
        </button>
        <Button variant="ghost" size="icon" aria-label="Keresés" title="Keresés (Ctrl K)" className="lg:hidden" onClick={search.open}>
          <Search />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger id="tools-menu-desktop" render={<Button variant="ghost" size="sm" />}>
            <GuitarIcon />
            Eszközök
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => tools.open('tuner')}>
              <GuitarIcon />
              Hangoló
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => tools.open('metronome')}>
              <MetronomeIcon />
              Metronóm
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span aria-hidden className="mx-1.5 h-6 w-px bg-border-strong" />
        <PendingLink href={practiceHref} className={buttonVariants({ size: 'sm' })}>
          <Theater />
          Próba mód
        </PendingLink>
        <BandSwitcher />
        <UserMenu user={user} triggerId="user-menu-desktop" />
      </div>
    </header>
  );
}
