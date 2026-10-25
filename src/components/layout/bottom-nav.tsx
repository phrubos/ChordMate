'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-items';
import { ToolsSheet } from './tools-sheet';
import { MetronomeIcon } from './tool-icons';

const itemClass = 'pressable flex flex-col items-center gap-[3px] rounded-xl py-1.5 text-xs font-medium transition-[transform,color] duration-(--dur-fade)';

/** Mobile bottom navigation: 4 destinations + Eszközök sheet. */
export function BottomNav() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [home, songs, ...rest] = NAV_ITEMS;

  const link = (item: (typeof NAV_ITEMS)[number]) => {
    const active = item.match(pathname);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(itemClass, active ? 'font-semibold text-primary-text' : 'text-muted-foreground')}
      >
        <Icon className="size-[22px]" strokeWidth={1.75} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Fő navigáció"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border-strong bg-background px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
      >
        {link(home)}
        {link(songs)}
        <button type="button" onClick={() => setToolsOpen(true)} className={cn(itemClass, toolsOpen ? 'text-primary-text' : 'text-muted-foreground')}>
          <MetronomeIcon className="size-[22px]" />
          Eszközök
        </button>
        {rest.map(link)}
      </nav>
      <ToolsSheet open={toolsOpen} onOpenChange={setToolsOpen} />
    </>
  );
}
