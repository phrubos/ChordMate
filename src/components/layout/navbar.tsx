'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, ListMusic, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { springs } from '@/lib/motion';

const navLinks = [
  { href: '/dashboard', label: 'Naptár', icon: Calendar, description: 'Próbák és dallisták' },
  { href: '/songs', label: 'Dalok', icon: ListMusic, description: 'Dalgyűjtemény kezelése' },
  { href: '/analytics', label: 'Analitika', icon: BarChart2, description: 'Statisztikák és áttekintés' },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on route change
  const closeMobile = useCallback(() => setMobileOpen(false), []);

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
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm">
            <Image src="/icon.svg" alt="ChordMate" width={32} height={32} className="size-full object-cover" />
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

        {/* Mobile hamburger trigger */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="relative size-9 p-0 z-[60]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="size-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="size-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Mobile full-screen menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurred backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
            />

            {/* Menu content */}
            <div className="relative flex h-full flex-col justify-between px-8 pt-24 pb-12">
              {/* Navigation links */}
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -32 }}
                      transition={{
                        ...springs.smooth,
                        delay: 0.05 + i * 0.07,
                      }}
                    >
                      <Link href={link.href} onClick={closeMobile}>
                        <div
                          className={cn(
                            'group flex items-center gap-5 rounded-2xl px-5 py-4 transition-all duration-200',
                            isActive
                              ? 'bg-primary/10 ring-1 ring-primary/20'
                              : 'hover:bg-card/60 active:scale-[0.98]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-12 items-center justify-center rounded-xl transition-colors',
                              isActive
                                ? 'bg-primary/20 text-primary shadow-sm shadow-primary/10'
                                : 'bg-card/80 text-muted-foreground group-hover:text-foreground'
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-lg font-semibold tracking-tight',
                                isActive ? 'text-primary' : 'text-foreground'
                              )}
                            >
                              {link.label}
                            </p>
                            <p className="text-sm text-muted-foreground/70">
                              {link.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Bottom section: user + theme + logout */}
              <motion.div
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ ...springs.smooth, delay: 0.25 }}
              >
                <div className="h-px bg-border/50" />

                {/* Theme toggle row */}
                <div className="flex items-center justify-between rounded-xl bg-card/40 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Téma</span>
                  <ThemeToggle />
                </div>

                {/* User section */}
                <div className="flex items-center justify-between rounded-xl bg-card/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 ring-2 ring-border/50">
                      <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground/60">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-destructive"
                    onClick={() => { closeMobile(); signOut({ callbackUrl: '/login' }); }}
                  >
                    <LogOut className="size-4" />
                    <span className="text-xs">Kilépés</span>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
