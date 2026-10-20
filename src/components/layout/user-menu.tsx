'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { initialsOf } from '@/components/design/avatar-stack';
import { hueFromString } from '@/lib/song-meta';
import type { ShellUser } from './nav-items';

/** `triggerId` is fixed so the SSR and client ids always match (two instances: masthead + mobile bar). */
export function UserMenu({ user, triggerId }: { user: ShellUser; triggerId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={triggerId}
        aria-label="Profil menü"
        className="inline-grid size-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-8">
          {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
          <AvatarFallback className="text-[13px] font-bold text-white" style={{ backgroundColor: `oklch(.58 .12 ${hueFromString(user.name ?? '')})` }}>
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut />
          Kijelentkezés
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
