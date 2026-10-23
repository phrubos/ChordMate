import { CalendarDays, Home, ListMusic, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Kezdőlap', icon: Home, match: (p) => p.startsWith('/dashboard') },
  { href: '/songs', label: 'Dalok', icon: ListMusic, match: (p) => p.startsWith('/songs') },
  { href: '/rehearsals', label: 'Próbák', icon: CalendarDays, match: (p) => p.startsWith('/rehearsals') || p.startsWith('/analytics') },
  { href: '/band', label: 'Banda', icon: Users, match: (p) => p.startsWith('/band') },
];

export interface ShellUser {
  name: string | null;
  image: string | null;
  email: string | null;
}
