'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Theater } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { BandSwitcher } from '@/components/band/band-switcher';
import { cn } from '@/lib/utils';
import { LogoMark } from './logo';
import { NAV_ITEMS, type ShellUser } from './nav-items';
import { UserMenu } from './user-menu';
import { useTools } from './tools-launcher';
import { MetronomeIcon, GuitarIcon } from './tool-icons';

interface MastheadProps {
  user: ShellUser;
  practiceHref?: string;
}

/** Desktop masthead (≥ md): brand + nav left, search / tools / practice / band / user right. */
export function Masthead({ user, practiceHref = '/practice/next' }: MastheadProps) {
  const pathname = usePathname();
  const tools = useTools();

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
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'px-2.5 py-1.5 text-[15px] transition-colors duration-(--dur-fade)',
                active ? 'text-foreground shadow-[inset_0_-2px_0_var(--primary)]' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          href="/songs?focus=search"
          className="mr-2 hidden h-10 w-[260px] items-center gap-2.5 rounded-full border border-border-strong px-3.5 text-sm text-faint transition-colors hover:border-foreground/40 lg:flex"
        >
          <Search className="size-4" />
          Dal vagy előadó keresése…
        </Link>
        <Button variant="ghost" size="icon" aria-label="Hangoló" title="Hangoló" onClick={() => tools.open('tuner')}>
          <GuitarIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Metronóm" title="Metronóm" onClick={() => tools.open('metronome')}>
          <MetronomeIcon />
        </Button>
        <span aria-hidden className="mx-1.5 h-6 w-px bg-border-strong" />
        <Link href={practiceHref} className={buttonVariants({ size: 'sm' })}>
          <Theater />
          Próba mód
        </Link>
        <BandSwitcher />
        <UserMenu user={user} triggerId="user-menu-desktop" />
      </div>
    </header>
  );
}
