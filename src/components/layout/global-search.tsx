'use client';

import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { CoverArt } from '@/components/design/cover-art';
import { StatusBadge } from '@/components/design/status-badge';
import { searchSongs } from '@/actions/songs';
import { cn } from '@/lib/utils';

type Result = Awaited<ReturnType<typeof searchSongs>>[number];

const SearchContext = createContext<{ open: () => void }>({ open: () => {} });

export const useGlobalSearch = () => useContext(SearchContext);

/** Owns the global song search palette (⌘K / Ctrl+K) so any nav surface can open it. */
export function GlobalSearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        {open && <SearchPalette onClose={() => setOpen(false)} />}
      </Dialog>
    </SearchContext.Provider>
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const q = query.trim();

  useEffect(() => {
    if (!q) return;
    let stale = false;
    const t = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchSongs(q);
        if (!stale) {
          setResults(rows);
          setActive(0);
        }
      });
    }, 180);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [q]);

  const shown = q ? results : [];
  // Last row is always "all results on the Songs page".
  const total = shown.length + (q ? 1 : 0);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const pick = (i: number) => {
    if (i < shown.length) go(`/songs/${shown[i].id}`);
    else if (q) go(`/songs?search=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!total) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(active);
    }
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        initialFocus={inputRef}
        aria-label="Dal vagy előadó keresése"
        className="fixed top-[12vh] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-xl bg-background shadow-[0_24px_64px_oklch(0_0_0/.55)] ring-1 ring-border-strong outline-none duration-200 ease-(--ease-out) data-closed:duration-130 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
      >
        <label className="flex h-14 items-center gap-3 border-b border-border-strong px-4 text-faint">
          <Search className="size-5 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Dal vagy előadó keresése…"
            aria-label="Dal vagy előadó keresése"
            role="combobox"
            aria-expanded={total > 0}
            aria-controls="global-search-results"
            aria-activedescendant={total ? `gs-opt-${active}` : undefined}
            autoComplete="off"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-faint"
          />
          <kbd className="hidden rounded border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-faint sm:block">Esc</kbd>
        </label>

        {q ? (
          <ul id="global-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
            {shown.map((s, i) => (
              <li
                key={s.id}
                id={`gs-opt-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(i)}
                className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2', active === i && 'bg-muted')}
              >
                <CoverArt title={s.title} artist={s.artist} imageUrl={s.imageUrl} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-foreground">{s.title}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{s.artist}</span>
                </span>
                <StatusBadge status={s.status} compact />
              </li>
            ))}
            {!pending && shown.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">Nincs találat erre: „{q}”</li>}
            <li
              id={`gs-opt-${shown.length}`}
              role="option"
              aria-selected={active === shown.length}
              onMouseMove={() => setActive(shown.length)}
              onClick={() => pick(shown.length)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold text-primary-text',
                active === shown.length && 'bg-muted'
              )}
            >
              <ArrowRight className="size-4" />
              Összes találat a Dalok oldalon
              <CornerDownLeft className="ml-auto size-3.5 text-faint" aria-hidden />
            </li>
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-muted-foreground">Kezdj el gépelni — cím vagy előadó alapján keresünk a banda repertoárjában.</p>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}
