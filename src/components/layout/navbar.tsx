'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Guitar, Calendar, ListMusic, LogOut, Menu, X } from 'lucide-react';
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

const navLinks = [
  { href: '/dashboard', label: 'Naptár', icon: Calendar },
  { href: '/songs', label: 'Dalok', icon: ListMusic },
];

interface NavbarProps {
  stats?: React.ReactNode;
}

export function Navbar({ stats }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  const user = session.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Guitar className="size-4 text-primary" />
          </div>
          <span className="shimmer-text text-lg font-bold tracking-tight">ChordMate</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
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
        </nav>

        {/* Theme toggle + User menu (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {stats}
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
              <span className="max-w-[100px] truncate text-sm text-muted-foreground">{user?.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut data-icon="inline-start" />
                Kijelentkezés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          {stats}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 rounded-lg text-muted-foreground',
                      isActive && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7 ring-1 ring-border">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{user?.name}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
