'use client';

import { useMemo, useState, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Check, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { ResponsiveDialog } from './responsive-dialog';

interface SongPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  songs: Song[];
  excludeIds: Set<string>;
  /** May return at once (the caller shows the result optimistically): the dialog then closes immediately. */
  onConfirm: (ids: string[]) => void | Promise<void>;
}

/** Multi-select song picker for a rehearsal day (shared by calendar and day panel). */
export function SongPickerDialog({ open, onOpenChange, date, songs, excludeIds, onConfirm }: SongPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => !excludeIds.has(s.id) && (!q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)));
  }, [songs, excludeIds, query]);

  const allSelected = available.length > 0 && available.every((s) => selected.has(s.id));

  function change(next: boolean) {
    if (!next) {
      setQuery('');
      setSelected(new Set());
    }
    onOpenChange(next);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={change} title={`Dal hozzáadása · ${format(parseISO(date), 'MMM d.', { locale: hu })}`}>
      <div className="flex gap-2">
        <label className="flex h-10 flex-1 items-center gap-2.5 rounded-full border border-border-strong px-3.5 text-faint focus-within:border-ring">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cím vagy előadó…"
            aria-label="Keresés a dalok között"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
          />
        </label>
        {available.length > 0 && (
          <Button variant="outline" onClick={() => setSelected(allSelected ? new Set() : new Set(available.map((s) => s.id)))}>
            {allSelected ? 'Egyik sem' : 'Mind'}
          </Button>
        )}
      </div>

      <ul className="-mx-1 flex max-h-[50vh] flex-col overflow-y-auto">
        {available.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">
            {songs.length === 0 ? 'Még nincsenek dalok. Adj hozzá egyet a Dalok oldalon!' : 'Nincs több hozzáadható dal'}
          </li>
        ) : (
          available.map((song) => {
            const isOn = selected.has(song.id);
            return (
              <li key={song.id}>
                <button
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => toggle(song.id)}
                  className={cn(
                    'pressable flex w-full items-center gap-3 rounded-md px-1 py-2 text-left transition-[transform,background-color] duration-(--dur-fade) [--press-scale:.985] hover:bg-muted/60',
                    isOn && 'bg-primary/10'
                  )}
                >
                  <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className={cn('truncate text-sm font-semibold', isOn && 'text-primary-text')}>{song.title}</span>
                    <span className="truncate text-[13px] text-muted-foreground">{song.artist}</span>
                  </span>
                  <span className={cn('grid size-7 place-items-center rounded-full border', isOn ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong text-faint')}>
                    {isOn ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button variant="outline" className="flex-1" onClick={() => change(false)} disabled={isPending}>
          Mégse
        </Button>
        <Button
          className="flex-1"
          disabled={selected.size === 0}
          isLoading={isPending}
          onClick={() =>
            startTransition(async () => {
              await onConfirm([...selected]);
              change(false);
            })
          }
        >
          Hozzáadás{selected.size ? ` (${selected.size})` : ''}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
