'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, ListMusic, BarChart2, LogOut, Guitar, Timer, Wrench, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import dynamic from 'next/dynamic';

const GuitarTunerModal = dynamic(() => import('@/components/tools/guitar-tuner-modal').then(m => ({ default: m.GuitarTunerModal })), { ssr: false });
const MetronomeModal = dynamic(() => import('@/components/tools/metronome-modal').then(m => ({ default: m.MetronomeModal })), { ssr: false });
import { TruncatedText } from '@/components/shared/truncated-text';
import { BandSwitcher } from '@/components/band/band-switcher';

const desktopNavLinks = [
  { href: '/dashboard', label: 'Naptár', icon: Calendar },
  { href: '/songs', label: 'Dalok', icon: ListMusic },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [tunerOpen, setTunerOpen] = useState(false);
  const [metronomeOpen, setMetronomeOpen] = useState(false);

  if (!session) return null;

  const user = session.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo + Band switcher */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm">
              <Image src="/icon.svg" alt="ChordMate" width={32} height={32} className="size-full object-cover" />
            </div>
            <span className="shimmer-text text-lg font-bold tracking-tight hidden sm:inline">ChordMate</span>
          </Link>
          <div className="h-5 w-px bg-border/40 mx-0.5" />
          <BandSwitcher />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {desktopNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-2 rounded-lg px-3 text-muted-foreground transition-all',
                    isActive && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
          {/* Eszközök dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg px-3 text-muted-foreground transition-all"
                />
              }
            >
              <Wrench className="size-4" />
              Eszközök
              <ChevronDown className="size-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => setTunerOpen(true)}>
                <Guitar data-icon="inline-start" />
                Hangoló
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMetronomeOpen(true)}>
                <Timer data-icon="inline-start" />
                Metronóm
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Theme toggle + Analytics + User menu (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/analytics">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors',
                pathname.startsWith('/analytics') && 'text-primary bg-primary/10'
              )}
              title="Analitika"
            >
              <BarChart2 className="size-[18px]" />
            </Button>
          </Link>
          <ThemeToggle />
        </div>
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="gap-2 rounded-lg px-2" />}
            >
              <Avatar className="size-7 ring-1 ring-border">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <TruncatedText className="max-w-[100px] text-sm text-muted-foreground">{user?.name ?? ''}</TruncatedText>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut data-icon="inline-start" />
                Kijelentkezés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
    {tunerOpen && <GuitarTunerModal open={tunerOpen} onOpenChange={setTunerOpen} />}
    {metronomeOpen && <MetronomeModal open={metronomeOpen} onOpenChange={setMetronomeOpen} />}
    </>
  );
}
