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
        const sp = result?.spotify;
        if (sp?.removed) {
          toast.success('Dal törölve', {
            description: 'A Spotify playlistből is eltávolítva ✓',
          });
        } else if (sp?.notFound) {
          toast.success('Dal törölve', {
            description: '⚠️ A dal nem található a Spotify-on, a playlistből nem lett törölve',
          });
        } else if (sp?.needsReauth) {
          toast.success('Dal törölve', {
            description: '⚠️ Spotify jogosultságok frissítése szükséges — csatlakoztasd újra a Spotify-t a Beállításokban',
          });
        } else if (sp?.notOwner) {
          toast.success('Dal törölve', {
            description: '⚠️ A Spotify playlist egy másik fiókhoz tartozik — hozz létre egy újat',
          });
        } else if (sp?.error) {
          toast.success('Dal törölve', {
            description: '⚠️ Nem sikerült a Spotify playlistből törölni',
          });
        } else {
          toast.success('Dal törölve');
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
