'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FileText, Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toggleFavorite } from '@/actions/songs';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { DeleteSongDialog } from './delete-song-dialog';

const TabViewerModal = dynamic(() => import('./tab-viewer-modal').then((m) => ({ default: m.TabViewerModal })), { ssr: false });

export function SongActionsMenu({ song, className }: { song: Song; className?: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tabOpen, setTabOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Műveletek: ${song.title}`} className={cn('text-muted-foreground', className)} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={() => router.push(`/songs/${song.id}/edit`)}>
            <Pencil />
            Szerkesztés
          </DropdownMenuItem>
          {(song.tabContent || song.tabUrl) && (
            <DropdownMenuItem onClick={() => setTabOpen(true)}>
              <FileText />
              Tab megnyitása
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                try {
                  await toggleFavorite(song.id);
                } catch {
                  toast.error('Nem sikerült menteni');
                }
              })
            }
          >
            <Heart className={cn(song.isFavorite && 'fill-current text-fav')} />
            {song.isFavorite ? 'Kedvenc törlése' : 'Kedvencnek jelölés'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Törlés
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteSongDialog song={song} open={deleteOpen} onOpenChange={setDeleteOpen} />
      {tabOpen && (
        <TabViewerModal songTitle={song.title} artist={song.artist} tabContent={song.tabContent} tabUrl={song.tabUrl} open onOpenChange={setTabOpen} />
      )}
    </>
  );
}
