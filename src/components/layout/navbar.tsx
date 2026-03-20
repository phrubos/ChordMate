'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, ListMusic, BarChart2, LogOut, Menu, X, Guitar, Timer, Wrench, ChevronDown, Users } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import dynamic from 'next/dynamic';

const GuitarTunerModal = dynamic(() => import('@/components/tools/guitar-tuner-modal').then(m => ({ default: m.GuitarTunerModal })), { ssr: false });
const MetronomeModal = dynamic(() => import('@/components/tools/metronome-modal').then(m => ({ default: m.MetronomeModal })), { ssr: false });
import { TruncatedText } from '@/components/shared/truncated-text';
import { BandSwitcher } from '@/components/band/band-switcher';

const desktopNavLinks = [
  { href: '/dashboard', label: 'Naptár', icon: Calendar },
  { href: '/songs', label: 'Dalok', icon: ListMusic },
];

const mobileNavLinks = [
  { href: '/dashboard', label: 'Naptár', icon: Calendar, description: 'Próbák és dallisták' },
  { href: '/songs', label: 'Dalok', icon: ListMusic, description: 'Dalgyűjtemény kezelése' },
  { href: '/analytics', label: 'Analitika', icon: BarChart2, description: 'Statisztikák és áttekintés' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [metronomeOpen, setMetronomeOpen] = useState(false);

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
              <TruncatedText className="max-w-[100px] text-sm text-muted-foreground">{user?.name ?? ''}</TruncatedText>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => router.push('/band')}>
                <Users data-icon="inline-start" />
                Banda profil
              </DropdownMenuItem>
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

    </header>
    {/* Mobile full-screen menu overlay — portaled to body to escape header's backdrop-blur containing block */}
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[100] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurred backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/85 backdrop-blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={closeMobile}
            />

            {/* Top bar area: logo + band + close button */}
            <div className="relative z-10 mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-2 min-w-0">
                <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2.5 shrink-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm">
                    <Image src="/icon.svg" alt="ChordMate" width={32} height={32} className="size-full object-cover" />
                  </div>
                  <span className="shimmer-text text-lg font-bold tracking-tight">ChordMate</span>
                </Link>
                <div className="h-5 w-px bg-border/40 mx-0.5" />
                <BandSwitcher />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 shrink-0"
                onClick={closeMobile}
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Menu content */}
            <div className="relative z-10 flex flex-col justify-between px-6 pt-8" style={{ height: 'calc(100dvh - 3.5rem)' }}>
              {/* Navigation links */}
              <nav className="flex flex-col gap-1.5">
                {mobileNavLinks.map((link, i) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{
                        ...springs.smooth,
                        delay: 0.05 + i * 0.07,
                      }}
                    >
                      <Link href={link.href} onClick={closeMobile}>
                        <div
                          className={cn(
                            'group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200',
                            isActive
                              ? 'bg-primary/10 ring-1 ring-primary/20'
                              : 'active:scale-[0.98]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-11 items-center justify-center rounded-xl transition-colors',
                              isActive
                                ? 'bg-primary/20 text-primary shadow-sm shadow-primary/10'
                                : 'bg-card/60 text-muted-foreground group-active:text-foreground'
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-[17px] font-semibold tracking-tight',
                                isActive ? 'text-primary' : 'text-foreground'
                              )}
                            >
                              {link.label}
                            </p>
                            <p className="text-[13px] text-muted-foreground/60">
                              {link.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Tools section */}
              <div className="flex flex-col gap-1.5 mt-4">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ ...springs.smooth, delay: 0.05 + mobileNavLinks.length * 0.07 }}
                >
                  <div className="px-4 pb-2 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">Eszközök</p>
                  </div>
                </motion.div>
                {[
                  { label: 'Hangoló', icon: Guitar, description: 'Gitár hangoló', action: () => { closeMobile(); setTunerOpen(true); } },
                  { label: 'Metronóm', icon: Timer, description: 'Ütemjelző', action: () => { closeMobile(); setMetronomeOpen(true); } },
                ].map((tool, i) => {
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      key={tool.label}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{
                        ...springs.smooth,
                        delay: 0.05 + (mobileNavLinks.length + 1 + i) * 0.07,
                      }}
                    >
                      <button onClick={tool.action} className="w-full">
                        <div className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200 active:scale-[0.98]">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-card/60 text-muted-foreground group-active:text-foreground transition-colors">
                            <Icon className="size-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[17px] font-semibold tracking-tight text-foreground">{tool.label}</p>
                            <p className="text-[13px] text-muted-foreground/60">{tool.description}</p>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom section: user + theme + logout */}
              <motion.div
                className="flex flex-col gap-3 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ ...springs.smooth, delay: 0.25 }}
              >
                <div className="h-px bg-border/30" />

                {/* Theme toggle row */}
                <div className="flex items-center justify-between rounded-xl bg-card/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Téma</span>
                  <ThemeToggle />
                </div>

                {/* User section */}
                <div className="flex items-center justify-between rounded-xl bg-card/30 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 shrink-0 ring-2 ring-border/50">
                      <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <TruncatedText as="p" className="text-sm font-medium">{user?.name ?? ''}</TruncatedText>
                      <TruncatedText as="p" className="text-xs text-muted-foreground/60">{user?.email ?? ''}</TruncatedText>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href="/band" onClick={closeMobile}>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <Users className="size-4" />
                        <span className="text-xs">Banda</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => { closeMobile(); signOut({ callbackUrl: '/login' }); }}
                    >
                      <LogOut className="size-4" />
                      <span className="text-xs">Kilépés</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    {tunerOpen && <GuitarTunerModal open={tunerOpen} onOpenChange={setTunerOpen} />}
    {metronomeOpen && <MetronomeModal open={metronomeOpen} onOpenChange={setMetronomeOpen} />}
    </>
  );
}
