'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Search, Star, FileText, Heart, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SongFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const difficulty = searchParams.get('difficulty');
  const hasTab = searchParams.get('hasTab') === '1';
  const favOnly = searchParams.get('fav') === '1';
  const sortBy = searchParams.get('sort') ?? 'artist';

  const hasFilters = !!difficulty || hasTab || favOnly;
  const activeCount = (difficulty ? 1 : 0) + (hasTab ? 1 : 0) + (favOnly ? 1 : 0);

  const [filtersOpen, setFiltersOpen] = useState(hasFilters);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/songs?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ search: query || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, updateParams]);

  const filterChips = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Difficulty filter */}
      {[1, 2, 3, 4, 5].map((d) => (
        <Button
          key={d}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 gap-1 rounded-full border px-2.5 text-xs transition-all',
            difficulty === String(d)
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border/50 text-muted-foreground hover:border-border'
          )}
          onClick={() => updateParams({ difficulty: difficulty === String(d) ? null : String(d) })}
        >
          <Star className="size-3 fill-current" />
          {d}
        </Button>
      ))}

      <div className="h-4 w-px bg-border/50" />

      {/* Has tab filter */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 gap-1 rounded-full border px-2.5 text-xs transition-all',
          hasTab
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border/50 text-muted-foreground hover:border-border'
        )}
        onClick={() => updateParams({ hasTab: hasTab ? null : '1' })}
      >
        <FileText className="size-3" />
        Van tab
      </Button>

      {/* Favorites only */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 gap-1 rounded-full border px-2.5 text-xs transition-all',
          favOnly
            ? 'border-pink-500/30 bg-pink-500/10 text-pink-500'
            : 'border-border/50 text-muted-foreground hover:border-border'
        )}
        onClick={() => updateParams({ fav: favOnly ? null : '1' })}
      >
        <Heart className="size-3" />
        Kedvencek
      </Button>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground"
          onClick={() => updateParams({ difficulty: null, hasTab: null, fav: null })}
        >
          <X className="size-3" />
          Törlés
        </Button>
      )}

      <div className="h-4 w-px bg-border/50" />

      {/* Sort toggle */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 gap-1 rounded-full border px-2.5 text-xs transition-all',
          'border-border/50 text-muted-foreground hover:border-border'
        )}
        onClick={() => updateParams({ sort: sortBy === 'artist' ? 'date' : null })}
      >
        <ArrowUpDown className="size-3" />
        {sortBy === 'date' ? 'Dátum szerint' : 'Előadó szerint'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search + mobile filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 size-4" />
          <Input
            placeholder="Keresés dal vagy előadó alapján..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-lg bg-card/50 border-border/50 pl-9 text-sm placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Filter toggle — only visible on mobile */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'sm:hidden h-10 gap-1.5 rounded-lg border px-3 text-xs shrink-0 transition-all',
            hasFilters
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border/50 text-muted-foreground'
          )}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <SlidersHorizontal className="size-3.5" />
          Szűrők
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter chips — always visible on desktop, collapsible on mobile */}
      <div className={cn('sm:block', filtersOpen ? 'block' : 'hidden')}>
        {filterChips}
      </div>
    </div>
  );
}
