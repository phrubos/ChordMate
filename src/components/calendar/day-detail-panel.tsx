'use client';

import { useState, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, X, Play, Music, Copy, FileText, Square } from 'lucide-react';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import { assignSongToDate, removeSongFromDate, copySongsToDate } from '@/actions/calendar';
import { TabViewerModal } from '@/components/songs/tab-viewer-modal';
import type { CalendarEntryWithSong, Song } from '@/types';

interface DayDetailPanelProps {
  selectedDate: string | null;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
  allEntries: CalendarEntryWithSong[];
}

export function DayDetailPanel({ selectedDate, entries, allSongs, allEntries }: DayDetailPanelProps) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [songSearch, setSongSearch] = useState('');

  if (!selectedDate) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-border/50 bg-card/30 p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/5">
            <Music className="size-5 text-primary/30" />
          </div>
          <p className="text-sm text-muted-foreground">Válassz ki egy napot</p>
        </div>
      </div>
    );
  }

  const dateLabel = format(parseISO(selectedDate), 'MMMM d.', { locale: hu });
  const dayName = format(parseISO(selectedDate), 'EEEE', { locale: hu });
  const assignedSongIds = new Set(entries.map((e) => e.songId));
  const availableSongs = allSongs.filter(
    (s) => !assignedSongIds.has(s.id) && (
      s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearch.toLowerCase())
    )
  );

  const datesWithSongs = [...new Set(allEntries.map((e) => e.date))].filter((d) => d !== selectedDate).sort();

  function handleAssign(songId: string) {
    startTransition(async () => {
      try {
        await assignSongToDate(songId, selectedDate!);
        toast.success('Dal hozzáadva');
        setAddDialogOpen(false);
        setSongSearch('');
      } catch {
        toast.error('Hiba történt');
      }
    });
  }

  function handleRemove(entryId: string) {
    startTransition(async () => {
      try {
        await removeSongFromDate(entryId);
        toast.success('Dal eltávolítva');
      } catch {
        toast.error('Hiba történt');
      }
    });
  }

  function handleCopyFrom(fromDate: string) {
    startTransition(async () => {
      try {
        await copySongsToDate(fromDate, selectedDate!);
        toast.success('Dalok átmásolva');
        setCopyDialogOpen(false);
      } catch {
        toast.error('Hiba történt');
      }
    });
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card/30">
      {/* Header */}
      <div className="border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold capitalize">{dateLabel}</h3>
              {entries.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  Próba
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{dayName}</p>
          </div>
          {entries.length > 0 && (
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-semibold text-primary">{entries.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/5">
              <Music className="size-5 text-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">Még nincs dal ezen a napon</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group/item flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-secondary/30"
              >
                <div className="size-9 shrink-0 overflow-hidden rounded-md bg-secondary/50">
                  {entry.song.imageUrl ? (
                    <ImageLightbox
                      src={entry.song.imageUrl}
                      alt={entry.song.title}
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music className="size-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate leading-tight">{entry.song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{entry.song.artist}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  {entry.song.tabContent && (
                    <TabViewerModal
                      songTitle={entry.song.title}
                      artist={entry.song.artist}
                      tabContent={entry.song.tabContent}
                      tabUrl={entry.song.tabUrl}
                      trigger={
                        <Button variant="ghost" size="sm" className="size-6 p-0 text-muted-foreground hover:text-primary">
                          <FileText className="size-3" />
                        </Button>
                      }
                    />
                  )}
                  {entry.song.youtubeUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0 text-muted-foreground hover:text-primary"
                      onClick={() =>
                        setPlayingUrl(playingUrl === entry.song.youtubeUrl ? null : entry.song.youtubeUrl)
                      }
                    >
                      {playingUrl === entry.song.youtubeUrl ? (
                        <Square className="size-3" />
                      ) : (
                        <Play className="size-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-muted-foreground/50 hover:text-destructive"
                    onClick={() => handleRemove(entry.id)}
                    disabled={isPending}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {playingUrl && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <YouTubePlayer url={playingUrl} autoplay />
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="border-t border-border/30 p-3 flex flex-col gap-1.5">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="sm" className="w-full h-9 justify-start gap-2 text-sm text-muted-foreground hover:text-primary" />
            }
          >
            <Plus className="size-4" />
            Dal hozzáadása
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dal hozzáadása</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Keresés dal vagy előadó alapján..."
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                className="h-10 rounded-lg bg-background/50"
              />
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
                {availableSongs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {allSongs.length === 0
                      ? 'Még nincsenek dalok. Adj hozzá egyet a Dalok oldalon!'
                      : 'Nincs elérhető dal'}
                  </p>
                ) : (
                  availableSongs.map((song) => (
                    <button
                      key={song.id}
                      className="flex items-center justify-between rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/30"
                      onClick={() => handleAssign(song.id)}
                      disabled={isPending}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      </div>
                      <Plus className="size-4 text-muted-foreground/40 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Copy songs from another day */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="sm" className="w-full h-9 justify-start gap-2 text-sm text-muted-foreground hover:text-primary" />
            }
          >
            <Copy className="size-4" />
            Másolás másik napról
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dallista másolása</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Válaszd ki, melyik nap dallistáját szeretnéd átmásolni ide:
            </p>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mt-2">
              {datesWithSongs.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground/60">
                  Nincs más nap dalokkal
                </p>
              ) : (
                datesWithSongs.map((date) => {
                  const dateEntries = allEntries.filter((e) => e.date === date);
                  const label = format(parseISO(date), 'MMMM d., EEEE', { locale: hu });
                  return (
                    <button
                      key={date}
                      className="flex items-center justify-between rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/30"
                      onClick={() => handleCopyFrom(date)}
                      disabled={isPending}
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {dateEntries.map((e) => e.song.title).join(', ')}
                        </p>
                      </div>
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 shrink-0 ml-2">
                        <span className="text-xs font-semibold text-primary">{dateEntries.length}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
