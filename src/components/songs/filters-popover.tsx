'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { difficultyLabel } from '@/lib/song-meta';
import type { SongFilterState } from '@/lib/song-filters';

interface FiltersPopoverProps {
  filters: SongFilterState;
  onChange: (update: Partial<SongFilterState>) => void;
}

export function FiltersPopover({ filters, onChange }: FiltersPopoverProps) {
  const active = (filters.difficulty ? 1 : 0) + (filters.hasTab ? 1 : 0) + (filters.favOnly ? 1 : 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <SlidersHorizontal />
        Szűrők
        {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-xs text-primary-foreground">{active}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Nehézség</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={String(filters.difficulty ?? 0)} onValueChange={(v) => onChange({ difficulty: Number(v) || undefined })}>
            <DropdownMenuRadioItem value="0">Bármilyen</DropdownMenuRadioItem>
            {[1, 2, 3, 4, 5].map((d) => (
              <DropdownMenuRadioItem key={d} value={String(d)}>
                {difficultyLabel(d)} <span className="ml-auto font-mono text-xs text-faint">{d}/5</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={filters.hasTab} onCheckedChange={(v) => onChange({ hasTab: !!v })}>
          Van tab
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={filters.favOnly} onCheckedChange={(v) => onChange({ favOnly: !!v })}>
          Csak kedvencek
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
