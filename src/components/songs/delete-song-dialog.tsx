'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteSong } from '@/actions/songs';
import type { Song } from '@/types';

interface DeleteSongDialogProps {
  song: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSongDialog({ song, open, onOpenChange }: DeleteSongDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteSong(song.id);
        toast.success('Dal törölve');
        if (result?.spotify) {
          const sp = result.spotify;
          if (sp.removed) {
            toast.success('A Spotify playlistből is eltávolítva');
          } else if (sp.noPlaylist) {
            // No linked playlist — nothing to remove from, skip silently
          } else if (sp.notFound) {
            toast('A dal nem található a Spotify-on, a playlistből nem lett törölve', {
              icon: '⚠️',
            });
          } else if (sp.error) {
            toast.error('Nem sikerült a Spotify playlistből törölni');
          }
        }
        onOpenChange(false);
      } catch {
        toast.error('Hiba történt a törlés során');
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
          <AlertDialogDescription>
            Biztosan törlöd ezt a dalt: &laquo;{song.title}&raquo;? Ez a művelet nem vonható vissza.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Mégse</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-white hover:bg-destructive/90">
            {isPending ? 'Törlés...' : 'Törlés'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
