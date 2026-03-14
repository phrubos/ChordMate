'use client';

import { useState, useTransition, useEffect } from 'react';
import { format, parseISO, isAfter, isSameDay, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Plus, X, Play, Music, Copy, FileText, Square, GripVertical, Check, ListChecks, Mic, Disc3 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import { assignSongsToDate, assignSongToDate, removeSongFromDate, copySongsToDate, reorderCalendarEntries } from '@/actions/calendar';
import { TabViewerModal } from '@/components/songs/tab-viewer-modal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CalendarEntryWithSong, Song } from '@/types';
import { RecordingModal } from '@/components/tools/recording-modal';
import { hasRecordingsForDate } from '@/actions/recordings';

// --- Sortable song item ---
function SortableSongItem({
  entry,
  playingUrl,
  setPlayingUrl,
  onRemove,
  isPending,
  date,
}: {
  entry: CalendarEntryWithSong;
  playingUrl: string | null;
  setPlayingUrl: (url: string | null) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
  date?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/item min-w-0 flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-secondary/30 ${isDragging ? 'z-10 bg-card shadow-lg ring-1 ring-primary/20' : ''}`}
    >
      <button
        className="shrink-0 cursor-grab touch-none p-2 -ml-2 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>
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
      <div className="flex items-center gap-1 shrink-0 opacity-100 transition-opacity hover-device:opacity-0 hover-device:group-hover/item:opacity-100">
        {entry.song.tabContent && (
          <TabViewerModal
            songTitle={entry.song.title}
            artist={entry.song.artist}
            tabContent={entry.song.tabContent}
            tabUrl={entry.song.tabUrl}
            date={date}
            trigger={
              <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-primary">
                <FileText className="size-4" />
              </Button>
            }
          />
        )}
        {entry.song.youtubeUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-muted-foreground hover:text-primary"
            onClick={() =>
              setPlayingUrl(playingUrl === entry.song.youtubeUrl ? null : entry.song.youtubeUrl)
            }
          >
            {playingUrl === entry.song.youtubeUrl ? (
              <Square className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-muted-foreground/50 hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          disabled={isPending}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// --- Sortable song list wrapper ---
function SortableSongList({
  entries,
  playingUrl,
  setPlayingUrl,
  onRemove,
  onReorder,
  isPending,
  date,
}: {
  entries: CalendarEntryWithSong[];
  playingUrl: string | null;
  setPlayingUrl: (url: string | null) => void;
  onRemove: (id: string) => void;
  onReorder: (reorderedEntries: CalendarEntryWithSong[], ids: string[]) => void;
  isPending: boolean;
  date?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...entries];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onReorder(reordered, reordered.map((e) => e.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5 min-w-0">
          {entries.map((entry) => (
            <SortableSongItem
              key={entry.id}
              entry={entry}
              playingUrl={playingUrl}
              setPlayingUrl={setPlayingUrl}
              onRemove={onRemove}
              isPending={isPending}
              date={date}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// --- Main panel ---
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
  const [songToRemove, setSongToRemove] = useState<string | null>(null);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [localEntries, setLocalEntries] = useState(entries);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [hasRecordings, setHasRecordings] = useState(false);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  // Check if past dates have recordings in server DB
  useEffect(() => {
    if (!selectedDate) { setHasRecordings(false); return; }
    const today = startOfDay(new Date());
    const selected = startOfDay(parseISO(selectedDate));
    const isPastDate = !isSameDay(selected, today) && !isAfter(selected, today);
    if (!isPastDate) { setHasRecordings(false); return; }
    let cancelled = false;

    hasRecordingsForDate(selectedDate).then((has) => {
      if (!cancelled) setHasRecordings(has);
    }).catch(() => {
      if (!cancelled) setHasRecordings(false);
    });
    return () => { cancelled = true; };
  }, [selectedDate]);

  function handleReorder(reorderedEntries: CalendarEntryWithSong[], entryIds: string[]) {
    setLocalEntries(reorderedEntries);
    startTransition(async () => {
      try {
        await reorderCalendarEntries(entryIds);
      } catch {
        toast.error('Hiba a sorrend mentésekor');
        setLocalEntries(entries);
      }
    });
  }

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

  function handleSelectAll() {
    if (selectedSongIds.size === availableSongs.length && availableSongs.length > 0) {
      setSelectedSongIds(new Set());
    } else {
      setSelectedSongIds(new Set(availableSongs.map((s) => s.id)));
    }
  }

  function toggleSongSelection(songId: string) {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }

  function handleAssignSelected() {
    if (!selectedDate || selectedSongIds.size === 0) return;
    startTransition(async () => {
      try {
        await assignSongsToDate(Array.from(selectedSongIds), selectedDate);
        toast.success(selectedSongIds.size > 1 ? 'Dalok hozzáadva' : 'Dal hozzáadva');
        setAddDialogOpen(false);
        setSongSearch('');
        setSelectedSongIds(new Set());
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
        setSongToRemove(null);
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
    <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card/50 shadow-sm relative z-0 overflow-hidden min-w-0">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-w-0">
        {localEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/5">
              <Music className="size-5 text-primary/30" />
            </div>
            <p className="text-sm text-muted-foreground">Még nincs dal ezen a napon</p>
          </div>
        ) : (
          <SortableSongList
            entries={localEntries}
            playingUrl={playingUrl}
            setPlayingUrl={setPlayingUrl}
            onRemove={(id) => setSongToRemove(id)}
            onReorder={handleReorder}
            isPending={isPending}
            date={selectedDate ?? undefined}
          />
        )}

        <Dialog open={!!playingUrl} onOpenChange={(open) => !open && setPlayingUrl(null)}>
          <DialogContent showCloseButton={false} className="sm:max-w-3xl p-0 overflow-visible bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">Videó lejátszása</DialogTitle>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute -top-12 right-0 rounded-full bg-background/80 hover:bg-background shadow-md border-border/50"
                onClick={() => setPlayingUrl(null)}
              >
                <X className="size-4" />
              </Button>
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border/50 shadow-2xl">
                {playingUrl && (
                  <YouTubePlayer url={playingUrl} autoplay />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions footer */}
      <div className="border-t border-border/30 px-3 py-2.5 flex items-center gap-2">
        {/* Left: secondary text actions */}
        <div className="flex flex-col flex-1 min-w-0">
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (open) {
            setSongSearch('');
            setSelectedSongIds(new Set());
          }
        }}>
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
            <div className="flex gap-2 relative">
              <Input
                placeholder="Keresés dal vagy előadó alapján..."
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                className="h-10 rounded-lg bg-background/50 flex-1"
              />
              {availableSongs.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-10 w-10 shrink-0 ${selectedSongIds.size === availableSongs.length ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
                  onClick={handleSelectAll}
                  title={selectedSongIds.size === availableSongs.length ? "Minden kijelölés törlése" : "Mindent kiválaszt"}
                >
                  <ListChecks className="size-4" />
                </Button>
              )}
            </div>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
                {availableSongs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {allSongs.length === 0
                      ? 'Még nincsenek dalok. Adj hozzá egyet a Dalok oldalon!'
                      : 'Nincs elérhető dal'}
                  </p>
                ) : (
                  availableSongs.map((song) => {
                    const isSelected = selectedSongIds.has(song.id);
                    return (
                      <button
                        key={song.id}
                        className={`flex items-center justify-between rounded-lg p-2.5 text-left transition-colors cursor-pointer hover:bg-secondary/30 ${isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                        onClick={() => toggleSongSelection(song.id)}
                        disabled={isPending}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        {isSelected ? (
                          <Check className="size-4 text-primary shrink-0" />
                        ) : (
                          <Plus className="size-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {selectedSongIds.size > 0 && (
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button variant="outline" className="flex-1" onClick={() => setAddDialogOpen(false)} disabled={isPending}>
                    Mégse
                  </Button>
                  <Button className="flex-1" onClick={handleAssignSelected} disabled={isPending}>
                    Hozzáadás ({selectedSongIds.size})
                  </Button>
                </div>
              )}
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

        {/* Vertical separator */}
        {entries.length > 0 && (
          <div className="self-stretch w-px bg-border/30 mx-1 shrink-0" />
        )}

        {/* Right: Rec primary CTA */}
        {entries.length > 0 && (() => {
          const today = startOfDay(new Date());
          const selected = startOfDay(parseISO(selectedDate));
          const isPast = !isSameDay(selected, today) && !isAfter(selected, today);

          // Past date: only show memory button if recordings exist
          if (isPast) {
            if (!hasRecordings) return null;
            return (
              <button
                aria-label="Felvételek megtekintése"
                className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group p-1"
                onClick={() => setRecordingOpen(true)}
              >
                <span className="relative flex size-11">
                  <span className="relative flex size-full items-center justify-center rounded-full bg-amber-900/40 shadow-md shadow-amber-900/10 ring-1 ring-amber-700/20 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
                    <Disc3 className="size-4 text-amber-400/80" />
                  </span>
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-amber-500/50 uppercase leading-none">
                  emlék
                </span>
              </button>
            );
          }

          // Today or future: show active rec button
          return (
            <button
              aria-label="Felvétel indítása"
              className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group p-1"
              onClick={() => setRecordingOpen(true)}
            >
              <span className="relative flex size-11">
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute inset-1 rounded-full bg-red-500/10 animate-pulse" />
                <span className="relative flex size-full items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
                  <Mic className="size-4 text-white" />
                </span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-red-500/70 uppercase leading-none">
                rec
              </span>
            </button>
          );
        })()}
      </div>

      <AlertDialog open={!!songToRemove} onOpenChange={(open) => !open && setSongToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dal eltávolítása</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan eltávolítod ezt a dalt erről a napról? A dal továbbra is elérhető marad a Dalok listájában.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => songToRemove && handleRemove(songToRemove)}
              disabled={isPending}
            >
              Eltávolítás
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDate && (() => {
        const today = startOfDay(new Date());
        const selected = startOfDay(parseISO(selectedDate));
        const isPastDate = !isSameDay(selected, today) && !isAfter(selected, today);
        return (
          <RecordingModal
            open={recordingOpen}
            onOpenChange={setRecordingOpen}
            date={selectedDate}
            readOnly={isPastDate}
          />
        );
      })()}
    </div>
  );
}
