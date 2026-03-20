'use client';

import { useState, useMemo, useTransition, useEffect, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { DayDetailPanel } from './day-detail-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { assignSongsToDate, copySongsToDate, clearSongsFromDate } from '@/actions/calendar';
import { Plus, Check, ListChecks, Copy, X, Music } from 'lucide-react';
import type { CalendarEntryWithSong, Song } from '@/types';
import { TruncatedText } from '@/components/shared/truncated-text';

interface DashboardViewProps {
  initialYear: number;
  initialMonth: number;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
}

export function DashboardView({ initialYear, initialMonth, entries, allSongs }: DashboardViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Sync state if props change (e.g. user uses browser back/forward)
  useEffect(() => {
    setYear(initialYear);
    setMonth(initialMonth);
  }, [initialYear, initialMonth]);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const [hoverActionDate, setHoverActionDate] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [mobileActionDate, setMobileActionDate] = useState<string | null>(null);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [deleteDateStr, setDeleteDateStr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dayDetailRef = useRef<HTMLDivElement>(null);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setMobileActionDate(date);
    }
  }, []);

  const handleAddSong = useCallback((date: string) => {
    setHoverActionDate(date);
    setAddDialogOpen(true);
    setSongSearch('');
    setSelectedSongIds(new Set());
  }, []);

  const handleCopyDate = useCallback((date: string) => {
    setHoverActionDate(date);
    setCopyDialogOpen(true);
  }, []);

  const handleDeleteDate = useCallback((date: string) => {
    setDeleteDateStr(date);
  }, []);

  const songCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      counts[entry.date] = (counts[entry.date] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  const selectedEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate]
  );

  const handlePrev = useCallback(() => {
    setMonth(prev => {
      if (prev === 1) {
        setYear(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    setMonth(prev => {
      if (prev === 12) {
        setYear(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  const handleToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(format(now, 'yyyy-MM-dd'));
  }, []);

  // Dialog data
  const actionDateEntries = useMemo(
    () => entries.filter((e) => e.date === hoverActionDate),
    [entries, hoverActionDate]
  );
  const availableSongs = useMemo(() => {
    const actionAssignedSongIds = new Set(actionDateEntries.map((e) => e.songId));
    const searchLower = songSearch.toLowerCase();
    return allSongs.filter(
      (s) => !actionAssignedSongIds.has(s.id) && (
        s.title.toLowerCase().includes(searchLower) ||
        s.artist.toLowerCase().includes(searchLower)
      )
    );
  }, [allSongs, actionDateEntries, songSearch]);
  const datesWithSongs = useMemo(
    () => [...new Set(entries.map((e) => e.date))].filter((d) => d !== hoverActionDate).sort(),
    [entries, hoverActionDate]
  );

  function handleSelectAll() {
    if (selectedSongIds.size === availableSongs.length && availableSongs.length > 0) {
      // If all are selected, deselect all
      setSelectedSongIds(new Set());
    } else {
      // Select all currently filtered/available songs
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
    if (!hoverActionDate || selectedSongIds.size === 0) return;
    startTransition(async () => {
      try {
        await assignSongsToDate(Array.from(selectedSongIds), hoverActionDate);
        toast.success(selectedSongIds.size > 1 ? 'Dalok hozzáadva' : 'Dal hozzáadva');
        setSelectedDate(hoverActionDate); // Select the date in the calendar
        setAddDialogOpen(false);
        setSongSearch('');
        setSelectedSongIds(new Set());
      } catch {
        toast.error('Hiba történt');
      }
    });
  }

  function handleCopyFrom(fromDate: string) {
    if (!hoverActionDate) return;
    startTransition(async () => {
      try {
        await copySongsToDate(fromDate, hoverActionDate);
        toast.success('Dalok átmásolva');
        setCopyDialogOpen(false);
      } catch {
        toast.error('Hiba történt');
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] overflow-hidden">
      <div className="flex flex-col gap-4 min-w-0">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
        <CalendarGrid
          year={year}
          month={month}
          selectedDate={selectedDate}
          songCountByDate={songCountByDate}
          onSelectDate={handleSelectDate}
          onAddSong={handleAddSong}
          onCopyDate={handleCopyDate}
          onDeleteDate={handleDeleteDate}
          onSwipePrev={handlePrev}
          onSwipeNext={handleNext}
        />
      </div>
      <div ref={dayDetailRef} className="relative min-w-0 overflow-hidden">
        <div className="lg:absolute lg:inset-0 flex flex-col h-[500px] lg:h-full min-w-0">
          <DayDetailPanel
            selectedDate={selectedDate}
            entries={selectedEntries}
            allSongs={allSongs}
            allEntries={entries}
          />
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dal hozzáadása ({hoverActionDate ? format(parseISO(hoverActionDate), 'MMMM d.', { locale: hu }) : ''})</DialogTitle>
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
                  Nincs elérhető dal
                </p>
              ) : (
                availableSongs.map((song) => {
                  const isSelected = selectedSongIds.has(song.id);
                  return (
                    <button
                      key={song.id}
                      className={`flex items-center justify-between rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/30 ${isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
                      onClick={() => toggleSongSelection(song.id)}
                      disabled={isPending}
                    >
                      <div className="min-w-0 flex-1">
                        <TruncatedText as="p" className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{song.title}</TruncatedText>
                        <TruncatedText as="p" className="text-xs text-muted-foreground">{song.artist}</TruncatedText>
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

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dallista másolása ({hoverActionDate ? format(parseISO(hoverActionDate), 'MMMM d.', { locale: hu }) : ''})</DialogTitle>
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
                const dateEntries = entries.filter((e) => e.date === date);
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

      {/* Mobile action modal when tapping a day */}
      <Dialog open={!!mobileActionDate} onOpenChange={(open) => !open && setMobileActionDate(null)}>
        <DialogContent className="max-w-[320px] rounded-[2rem] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-2xl font-bold capitalize">
              {mobileActionDate ? format(parseISO(mobileActionDate), 'MMMM d.', { locale: hu }) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {mobileActionDate && (songCountByDate[mobileActionDate] ?? 0) > 0 && (
              <Button
                variant="outline"
                className="h-14 justify-start gap-4 rounded-xl px-4 text-base font-medium shadow-sm bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  setMobileActionDate(null);
                  setTimeout(() => {
                    if (dayDetailRef.current) {
                      const top = dayDetailRef.current.getBoundingClientRect().top + window.scrollY - 56 - 8;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }
                  }, 300);
                }}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Music className="size-4" />
                </div>
                Ugrás a dalokra
              </Button>
            )}

            <Button
              variant="outline"
              className="h-14 justify-start gap-4 rounded-xl px-4 text-base font-medium shadow-sm"
              onClick={() => {
                const date = mobileActionDate;
                setMobileActionDate(null);
                if (date) handleAddSong(date);
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Plus className="size-4" />
              </div>
              Dal hozzáadása
            </Button>
            
            <Button
              variant="outline"
              className="h-14 justify-start gap-4 rounded-xl px-4 text-base font-medium shadow-sm text-foreground/80 hover:text-foreground"
              onClick={() => {
                const date = mobileActionDate;
                setMobileActionDate(null);
                if (date) handleCopyDate(date);
              }}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/80 text-foreground/70">
                <Copy className="size-4" />
              </div>
              Másolás másik napról
            </Button>

            {mobileActionDate && (songCountByDate[mobileActionDate] ?? 0) > 0 && (
              <Button
                variant="outline"
                className="h-14 justify-start gap-4 rounded-xl px-4 text-base tracking-wide font-medium shadow-sm border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  const date = mobileActionDate;
                  setMobileActionDate(null);
                  if (date) handleDeleteDate(date);
                }}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                  <X className="size-4" />
                </div>
                Próba törlése
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDateStr} onOpenChange={(open) => !open && setDeleteDateStr(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törlöd a próbát és az összes dalt erről a napról? Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
              onClick={() => {
                if (!deleteDateStr) return;
                startTransition(async () => {
                  try {
                    await clearSongsFromDate(deleteDateStr);
                    toast.success('Próba törölve');
                    setDeleteDateStr(null);
                  } catch {
                    toast.error('Hiba történt a törlés során');
                  }
                });
              }}
            >
              {isPending ? 'Törlés...' : 'Törlés'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
