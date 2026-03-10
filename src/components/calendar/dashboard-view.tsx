'use client';

import { useState, useMemo, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { DayDetailPanel } from './day-detail-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { assignSongsToDate, copySongsToDate, clearSongsFromDate } from '@/actions/calendar';
import { Plus, Check, ListChecks } from 'lucide-react';
import type { CalendarEntryWithSong, Song } from '@/types';

interface DashboardViewProps {
  initialYear: number;
  initialMonth: number;
  entries: CalendarEntryWithSong[];
  allSongs: Song[];
}

export function DashboardView({ initialYear, initialMonth, entries, allSongs }: DashboardViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const [hoverActionDate, setHoverActionDate] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleAddSong = (date: string) => {
    setHoverActionDate(date);
    setAddDialogOpen(true);
    setSongSearch('');
    setSelectedSongIds(new Set());
  };

  const handleCopyDate = (date: string) => {
    setHoverActionDate(date);
    setCopyDialogOpen(true);
  };

  const handleDeleteDate = (date: string) => {
    if (confirm('Biztosan törlöd a próbát és az összes dalt erről a napról?')) {
      startTransition(async () => {
        try {
          await clearSongsFromDate(date);
          toast.success('Próba törölve');
          if (selectedDate === date) {
            // Optional: reset selectedDate or keep it, it will just show empty
          }
        } catch {
          toast.error('Hiba történt a törlés során');
        }
      });
    }
  };

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

  function handlePrev() {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  function handleNext() {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(format(now, 'yyyy-MM-dd'));
  }

  // Dialog data
  const actionDateEntries = useMemo(
    () => entries.filter((e) => e.date === hoverActionDate),
    [entries, hoverActionDate]
  );
  const actionAssignedSongIds = new Set(actionDateEntries.map((e) => e.songId));
  const availableSongs = allSongs.filter(
    (s) => !actionAssignedSongIds.has(s.id) && (
      s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearch.toLowerCase())
    )
  );
  const datesWithSongs = [...new Set(entries.map((e) => e.date))].filter((d) => d !== hoverActionDate).sort();

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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
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
          onSelectDate={setSelectedDate}
          onAddSong={handleAddSong}
          onCopyDate={handleCopyDate}
          onDeleteDate={handleDeleteDate}
        />
      </div>
      <DayDetailPanel
        selectedDate={selectedDate}
        entries={selectedEntries}
        allSongs={allSongs}
        allEntries={entries}
      />

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
    </div>
  );
}
