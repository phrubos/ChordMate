'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, ListMusic, BarChart2, LogOut, Wrench, Guitar, Timer } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';
import dynamic from 'next/dynamic';

const GuitarTunerModal = dynamic(
  () => import('@/components/tools/guitar-tuner-modal').then(m => ({ default: m.GuitarTunerModal })),
  { ssr: false }
);
const MetronomeModal = dynamic(
  () => import('@/components/tools/metronome-modal').then(m => ({ default: m.MetronomeModal })),
  { ssr: false }
);

const NAV_HEIGHT = 'calc(3.5rem + env(safe-area-inset-bottom, 0px))';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [metronomeOpen, setMetronomeOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popups on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsOpen && toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [toolsOpen, profileOpen]);

  // Close popups on route change
  useEffect(() => {
    setToolsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const closeAll = useCallback(() => {
    setToolsOpen(false);
    setProfileOpen(false);
  }, []);

  if (!session) return null;

  const user = session.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?';

  const navItems = [
    { href: '/dashboard', label: 'Naptár', icon: Calendar },
    { href: '/songs', label: 'Dalok', icon: ListMusic },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed nav */}
      <div className="md:hidden" style={{ height: NAV_HEIGHT }} />

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Solid background */}
        <div className="absolute inset-0 bg-background border-t border-border/40" />

        <div className="relative flex h-14 items-center justify-around px-2 max-w-lg mx-auto">
          {/* Calendar & Songs links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
                onClick={closeAll}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'size-[22px] transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full bg-primary"
                      transition={springs.snappy}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium leading-tight transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground/70'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Tools button with popup */}
          <div ref={toolsRef} className="relative flex flex-1 flex-col items-center justify-center">
            <button
              className="flex flex-col items-center justify-center gap-0.5 py-1 w-full"
              onClick={() => { setProfileOpen(false); setToolsOpen(!toolsOpen); }}
            >
              <Wrench
                className={cn(
                  'size-[22px] transition-colors duration-200',
                  toolsOpen ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight transition-colors duration-200',
                  toolsOpen ? 'text-primary' : 'text-muted-foreground/70'
                )}
              >
                Eszközök
              </span>
            </button>

            {/* Tools popup */}
            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-2xl shadow-xl shadow-black/20 overflow-hidden"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors active:bg-primary/10"
                    onClick={() => { closeAll(); setTunerOpen(true); }}
                  >
                    <Guitar className="size-[18px] text-primary" />
                    <span className="font-medium">Hangoló</span>
                  </button>
                  <div className="h-px bg-border/30 mx-3" />
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors active:bg-primary/10"
                    onClick={() => { closeAll(); setMetronomeOpen(true); }}
                  >
                    <Timer className="size-[18px] text-primary" />
                    <span className="font-medium">Metronóm</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analytics (icon only) */}
          <Link
            href="/analytics"
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
            onClick={closeAll}
          >
            <div className="relative">
              <BarChart2
                className={cn(
                  'size-[22px] transition-colors duration-200',
                  pathname.startsWith('/analytics') ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {pathname.startsWith('/analytics') && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full bg-primary"
                  transition={springs.snappy}
                />
              )}
            </div>
          </Link>

          {/* Profile avatar with popup */}
          <div ref={profileRef} className="relative flex flex-1 flex-col items-center justify-center">
            <button
              className="flex flex-col items-center justify-center gap-0.5 py-1 w-full"
              onClick={() => { setToolsOpen(false); setProfileOpen(!profileOpen); }}
            >
              <Avatar
                className={cn(
                  'size-7 ring-2 transition-all duration-200',
                  profileOpen ? 'ring-primary/60 scale-105' : 'ring-border/50'
                )}
              >
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Profile popup */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="absolute bottom-full mb-3 right-0 w-52 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-2xl shadow-xl shadow-black/20 overflow-hidden"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                    <Avatar className="size-9 ring-1 ring-border/50 shrink-0">
                      <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name ?? ''}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">{user?.email ?? ''}</p>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive transition-colors active:bg-destructive/10"
                    onClick={() => { closeAll(); signOut({ callbackUrl: '/login' }); }}
                  >
                    <LogOut className="size-[18px]" />
                    <span className="font-medium">Kijelentkezés</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Tool modals */}
      {tunerOpen && <GuitarTunerModal open={tunerOpen} onOpenChange={setTunerOpen} />}
      {metronomeOpen && <MetronomeModal open={metronomeOpen} onOpenChange={setMetronomeOpen} />}

      {/* Overlay to close popups when clicking outside */}
      {typeof document !== 'undefined' && (toolsOpen || profileOpen) && createPortal(
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={closeAll}
        />,
        document.body
      )}
    </>
  );
}
