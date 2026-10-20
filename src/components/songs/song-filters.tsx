'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, LayoutGrid, List, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/design/segmented-control';
import { STATUS_BG } from '@/components/design/status-badge';
import { difficultyLabel, statusLabel, type SongStatus } from '@/lib/song-meta';
import { parseSongFilters, serializeSongFilters, type SongFilterState } from '@/lib/song-filters';
import { cn } from '@/lib/utils';
import { FiltersPopover } from './filters-popover';
import { useIsDesktop } from '@/hooks/use-is-desktop';

type StatusTab = SongStatus | 'all';

/** Songs toolbar: search (debounced, URL replace), status segments with counts, filters, sort, view. */
export function SongFilters({ counts }: { counts: Record<StatusTab, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseSongFilters(Object.fromEntries(searchParams.entries()));
  const [query, setQuery] = useState(filters.search ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useIsDesktop();

  const update = (u: Partial<SongFilterState>) => {
    const qs = serializeSongFilters(u, new URLSearchParams(searchParams.toString()));
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (searchParams.get('focus') === 'search') inputRef.current?.focus();
  }, [searchParams]);

  useEffect(() => {
    if (query === (filters.search ?? '')) return;
    const t = setTimeout(() => update({ search: query.trim() || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only on query changes
  }, [query]);

  const chips: { label: string; clear: Partial<SongFilterState> }[] = [
    ...(filters.difficulty ? [{ label: `Nehézség: ${difficultyLabel(filters.difficulty)}`, clear: { difficulty: undefined } }] : []),
    ...(filters.hasTab ? [{ label: 'Van tab', clear: { hasTab: false } }] : []),
    ...(filters.favOnly ? [{ label: 'Kedvencek', clear: { favOnly: false } }] : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-10 min-w-0 flex-[1_1_100%] items-center gap-2.5 rounded-full border border-border-strong px-3.5 text-faint focus-within:border-ring md:max-w-[340px] md:flex-[1_1_260px]">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés cím vagy előadó szerint…"
            aria-label="Keresés a dalok között"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
          />
          {query && (
            <button type="button" aria-label="Keresés törlése" onClick={() => setQuery('')} className="text-faint hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </label>

        <SegmentedControl<StatusTab>
          ariaLabel="Státusz"
          size={isDesktop ? 'md' : 'sm'}
          className="order-3 w-full md:order-none md:w-fit"
          value={filters.status ?? 'all'}
          onChange={(v) => update({ status: v === 'all' ? undefined : v })}
          options={(['all', 'learning', 'ok', 'ready'] as StatusTab[]).map((s) => ({
            value: s,
            label: s === 'all' ? 'Mind' : statusLabel(s),
            count: counts[s],
            dotClassName: s === 'all' ? undefined : STATUS_BG[s],
          }))}
        />

        <div className="ml-auto flex items-center gap-2">
          <FiltersPopover filters={filters} onChange={update} />
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => update({ sort: filters.sort === 'artist' ? 'date' : 'artist' })}>
            <ArrowUpDown />
            {filters.sort === 'date' ? 'Legújabb elöl' : 'Előadó A–Z'}
          </Button>
          <div role="group" aria-label="Nézet" className="inline-flex rounded-full border border-border-strong p-[3px]">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={filters.view === v}
                aria-label={v === 'grid' ? 'Rács nézet' : 'Lista nézet'}
                onClick={() => update({ view: v })}
                className={cn(
                  'grid size-8 place-items-center rounded-full transition-colors duration-(--dur-fade)',
                  filters.view === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v === 'grid' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => update(c.clear)}
              aria-label={`Szűrő törlése: ${c.label}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-full pr-1.5 pl-2.5 text-[13px] font-semibold text-primary-text shadow-[inset_0_0_0_1px_var(--primary)]"
            >
              {c.label}
              <X className="size-3.5" />
            </button>
          ))}
          <button type="button" onClick={() => update({ difficulty: undefined, hasTab: false, favOnly: false })} className="text-[13.5px] font-semibold text-primary-text hover:underline">
            Összes törlése
          </button>
        </div>
      )}
    </div>
  );
}
