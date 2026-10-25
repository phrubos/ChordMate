'use client';

import { useEffect, useId, useMemo, useOptimistic, useState, useTransition } from 'react';
import { PendingLink } from '@/components/shared/pending-link';
import dynamic from 'next/dynamic';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { CalendarPlus, Check, Clock, Copy, Disc3, FileText, GripVertical, Mic, MoreHorizontal, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { Eyebrow } from '@/components/design/eyebrow';
import { CoverArt } from '@/components/design/cover-art';
import { usePlayer } from '@/components/player/player-provider';
import { assignSongToDate, assignSongsToDate, clearSongsFromDate, copySongsToDate, removeSongFromDate, reorderCalendarEntries } from '@/actions/calendar';
import { hasRecordingsForDate } from '@/actions/recordings';
import { dur, ease, exitDur } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { CalendarEntryWithSong, Song } from '@/types';
import { SongPickerDialog } from './song-picker-dialog';
import { CopyDayDialog } from './copy-day-dialog';

const TabViewerModal = dynamic(() => import('@/components/songs/tab-viewer-modal').then((m) => ({ default: m.TabViewerModal })), { ssr: false });
const RecordingModal = dynamic(() => import('@/components/tools/recording-modal').then((m) => ({ default: m.RecordingModal })), { ssr: false });

type OptimisticAction =
  | { type: 'remove'; id: string }
  | { type: 'reorder'; ids: string[] }
  | { type: 'add'; songs: Song[]; date: string }
  | { type: 'clear' };

/** Rows shown before the server has saved them: no real id yet, so they can't be removed or dragged. */
const PROVISIONAL = 'provisional:';
const isProvisional = (entry: CalendarEntryWithSong) => entry.id.startsWith(PROVISIONAL);

function applyOptimistic(entries: CalendarEntryWithSong[], action: OptimisticAction): CalendarEntryWithSong[] {
  if (action.type === 'remove') return entries.filter((e) => e.id !== action.id);
  if (action.type === 'clear') return [];
  if (action.type === 'add') {
    const added = action.songs.map((song, i) => ({
      id: `${PROVISIONAL}${song.id}:${i}`,
      date: action.date,
      songId: song.id,
      bandId: null,
      addedById: '',
      sortOrder: null,
      createdAt: new Date(),
      song,
      addedBy: { id: '', name: null, image: null },
    }));
    return [...entries, ...added];
  }
  const byId = new Map(entries.map((e) => [e.id, e]));
  return action.ids.map((id) => byId.get(id)).filter((e): e is CalendarEntryWithSong => !!e);
}

interface SetlistRowProps {
  entry: CalendarEntryWithSong;
  index: number;
  date: string;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onRemove: (entry: CalendarEntryWithSong) => void;
}

function SetlistRow({ entry, index, date, isPlaying, onPlay, onRemove }: SetlistRowProps) {
  const provisional = isProvisional(entry);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id, disabled: provisional });
  const s = entry.song;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-busy={provisional || undefined}
      className={cn(
        'grid grid-cols-[28px_22px_40px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-border py-2 pr-1 transition-opacity duration-(--dur-fade)',
        isDragging && 'relative z-10 rounded-md bg-card shadow-lg',
        provisional && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label={`Sorrend módosítása: ${s.title}`}
        className="grid h-10 w-7 cursor-grab touch-none place-items-center text-faint hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-right font-mono text-xs text-faint">{index + 1}</span>
      <CoverArt title={s.title} artist={s.artist} imageUrl={s.imageUrl} size="sm" />
      <PendingLink href={`/songs/${s.id}`} className="pressable -mx-1.5 flex min-w-0 flex-col rounded-md px-1.5 leading-tight [--press-scale:.985]">
        <span className="truncate text-[14.5px] font-semibold" title={s.title}>{s.title}</span>
        <span className="flex min-w-0 text-[13px] text-muted-foreground">
          <span className="truncate">{s.artist}</span>
          {s.songKey && <span className="shrink-0 font-mono whitespace-pre text-faint"> · {s.songKey}</span>}
        </span>
      </PendingLink>
      <span className="flex items-center">
        {s.tabContent && (
          <TabViewerModal
            songTitle={s.title}
            artist={s.artist}
            tabContent={s.tabContent}
            tabUrl={s.tabUrl}
            date={date}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Tab: ${s.title}`} className="hidden text-muted-foreground sm:inline-flex">
                <FileText />
              </Button>
            }
          />
        )}
        {s.youtubeUrl && (
          <Button variant="ghost" size="icon-sm" aria-label={isPlaying ? 'Szünet' : `Lejátszás: ${s.title}`} onClick={() => onPlay(s)}>
            {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label={`Eltávolítás a próbáról: ${s.title}`} className="text-faint hover:text-destructive" disabled={provisional} onClick={() => onRemove(entry)}>
          <X />
        </Button>
      </span>
    </div>
  );
}

interface DayDetailPanelProps {
  date: string;
  today: string;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
  allEntries: CalendarEntryWithSong[];
  /** 'setlist': embedded in the rehearsal page, which already shows the date. */
  variant?: 'day' | 'setlist';
}

export function DayDetailPanel({ date, today, entries, allSongs, allEntries, variant = 'day' }: DayDetailPanelProps) {
  const [optimistic, applyAction] = useOptimistic(entries, applyOptimistic);
  const [, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [recordings, setRecordings] = useState<{ date: string; has: boolean } | null>(null);
  const player = usePlayer();
  const reduce = useReducedMotion();
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const isPast = date < today;
  const hasRecordings = recordings?.date === date && recordings.has;

  useEffect(() => {
    if (!isPast) return;
    let cancelled = false;
    hasRecordingsForDate(date)
      .then((has) => !cancelled && setRecordings({ date, has }))
      .catch(() => !cancelled && setRecordings({ date, has: false }));
    return () => {
      cancelled = true;
    };
  }, [date, isPast]);

  const sourceDates = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of allEntries) if (e.date !== date) map.set(e.date, [...(map.get(e.date) ?? []), e.song.title]);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([d, titles]) => ({ date: d, titles }));
  }, [allEntries, date]);

  const playingId = player.state.isPlaying ? (player.current?.id ?? null) : null;
  const onPlay = (song: Song) => (playingId === song.id ? player.toggle() : player.play(song, optimistic.map((e) => e.song)));

  function onRemove(entry: CalendarEntryWithSong) {
    startTransition(async () => {
      applyAction({ type: 'remove', id: entry.id });
      try {
        await removeSongFromDate(entry.id);
        toast('Dal eltávolítva', {
          description: entry.song.title,
          action: { label: 'Visszavonás', onClick: () => assignSongToDate(entry.songId, date).catch(() => toast.error('Nem sikerült visszaállítani')) },
        });
      } catch {
        toast.error('Nem sikerült eltávolítani');
      }
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = optimistic.map((e) => e.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    startTransition(async () => {
      applyAction({ type: 'reorder', ids });
      try {
        await reorderCalendarEntries(ids);
      } catch {
        toast.error('Nem sikerült menteni a sorrendet');
      }
    });
  }

  // Added, copied and cleared songs show at once; the server's answer replaces them (or they vanish on error).
  function onAdd(ids: string[]) {
    const byId = new Map(allSongs.map((s) => [s.id, s]));
    const songs = ids.map((id) => byId.get(id)).filter((s): s is Song => !!s);
    startTransition(async () => {
      applyAction({ type: 'add', songs, date });
      try {
        await assignSongsToDate(ids, date);
        toast.success(ids.length > 1 ? `${ids.length} dal hozzáadva` : 'Dal hozzáadva');
      } catch {
        toast.error('Nem sikerült hozzáadni');
      }
    });
  }

  function onCopy(from: string) {
    const songs = allEntries
      .filter((e) => e.date === from)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((e) => e.song);
    startTransition(async () => {
      applyAction({ type: 'add', songs, date });
      try {
        await copySongsToDate(from, date);
        toast.success('Setlist átmásolva');
      } catch {
        toast.error('Nem sikerült másolni');
      }
    });
  }

  function onClear() {
    // AlertDialogAction is a plain button: it does not close the dialog by itself.
    setClearOpen(false);
    startTransition(async () => {
      applyAction({ type: 'clear' });
      try {
        await clearSongsFromDate(date);
        toast.success('Próba törölve');
      } catch {
        toast.error('Nem sikerült törölni');
      }
    });
  }

  const parsed = parseISO(date);
  const hasSongs = optimistic.length > 0;

  return (
    <section id="day" aria-labelledby="day-title" aria-live="polite" className="flex min-w-0 flex-col border-t border-border-strong pt-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        {variant === 'setlist' ? (
          <h2 id="day-title" className="display-soft font-display text-[26px] leading-tight font-medium after:mt-2.5 after:block after:h-0.5 after:w-7 after:bg-primary">
            Setlist
          </h2>
        ) : (
          <div className="flex flex-col gap-1">
            <Eyebrow className="capitalize">{format(parsed, 'EEEE', { locale: hu })}</Eyebrow>
            <h2 id="day-title" className="display-soft font-display text-[26px] leading-tight font-medium capitalize after:mt-2.5 after:block after:h-0.5 after:w-7 after:bg-primary">
              {format(parsed, 'MMMM d.', { locale: hu })}
            </h2>
          </div>
        )}
        <div className="flex flex-col items-end gap-2">
          {hasSongs && variant === 'day' && (
            <span
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold',
                isPast ? 'bg-done/15 text-done' : 'bg-primary/12 text-primary-text'
              )}
            >
              {isPast ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
              {isPast ? 'Lezajlott' : 'Tervezett'}
            </span>
          )}
          {variant === 'day' && (
            <PendingLink href={`/rehearsals/${date}`} className="pressable -mx-1.5 rounded-md px-1.5 text-[13.5px] font-semibold whitespace-nowrap text-primary-text [--press-scale:.985] hover:underline">
              Próba oldala →
            </PendingLink>
          )}
        </div>
      </header>

      <motion.div
        key={date}
        initial={reduce ? { opacity: 0.6 } : { opacity: 0.6, filter: 'blur(2px)' }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: dur.fade, ease: ease.out }}
      >
        {hasSongs ? (
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={optimistic.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div role="list" aria-label="Setlist">
                <AnimatePresence initial={false}>
                  {optimistic.map((entry, i) => (
                    // Clip only while the row grows in or shrinks out: at rest a clipping wrapper would hide
                    // the rows dnd-kit shifts out of their slot while another row is dragged past them.
                    <motion.div
                      key={entry.id}
                      role="listitem"
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: exitDur(0.2), ease: ease.out } }}
                      transition={{ duration: 0.2, ease: ease.out }}
                    >
                      <SetlistRow entry={entry} index={i} date={date} isPlaying={playingId === entry.song.id} onPlay={onPlay} onRemove={onRemove} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 py-7 text-center">
            <span className="mb-1.5 grid size-13 place-items-center rounded-2xl bg-primary/12 text-primary-text">
              <CalendarPlus className="size-5" />
            </span>
            <b className="text-[15px]">Szabad nap</b>
            <p className="mb-2.5 max-w-[34ch] text-sm text-muted-foreground">Tervezz ide egy próbát, vagy másold át egy korábbi setlistet.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPickerOpen(true)}>
                <Plus />
                Próba tervezése
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCopyOpen(true)}>
                <Copy />
                Másolás
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {hasSongs && (
        <footer className="mt-3 flex items-start gap-2 border-t border-border pt-3">
          {/* The buttons wrap among themselves; the ⋯ menu stays at the end of the first line. */}
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus />
              Dal hozzáadása
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCopyOpen(true)}>
              <Copy />
              Másolás
            </Button>
            {(!isPast || hasRecordings) && (
              <Button size="sm" variant="outline" onClick={() => setRecordingOpen(true)}>
                {isPast ? <Disc3 /> : <Mic className="text-destructive" />}
                {isPast ? 'Felvételek' : 'Felvétel'}
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="További műveletek" className="shrink-0" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setClearOpen(true)}>
                <Trash2 />
                Próba törlése
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      )}

      <SongPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        date={date}
        songs={allSongs}
        excludeIds={new Set(optimistic.map((e) => e.songId))}
        onConfirm={onAdd}
      />
      <CopyDayDialog open={copyOpen} onOpenChange={setCopyOpen} targetDate={date} sourceDates={sourceDates} onCopy={onCopy} />
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Törlöd a próbát?</AlertDialogTitle>
            <AlertDialogDescription>
              A {format(parsed, 'MMMM d.', { locale: hu })} napról az összes dal lekerül. A dalok a Dalok listában megmaradnak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-background hover:bg-destructive/90"
              onClick={onClear}
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {recordingOpen && <RecordingModal open={recordingOpen} onOpenChange={setRecordingOpen} date={date} readOnly={isPast} />}
    </section>
  );
}
