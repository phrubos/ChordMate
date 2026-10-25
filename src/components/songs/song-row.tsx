'use client';

import { PendingLink } from '@/components/shared/pending-link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoverArt } from '@/components/design/cover-art';
import { StatusBadge } from '@/components/design/status-badge';
import { DifficultyMeter } from '@/components/design/difficulty-meter';
import type { Song } from '@/types';
import { SongActionsMenu } from './song-actions-menu';

const COLS = 'grid-cols-[40px_minmax(0,1fr)_auto_auto] md:grid-cols-[40px_minmax(0,2.2fr)_56px_64px_150px_110px_88px]';

export function SongTableHead() {
  return (
    <div role="row" className={`hidden items-center gap-4 px-4 py-3 font-mono text-xs font-medium tracking-[0.05em] text-faint uppercase md:grid ${COLS}`}>
      <span />
      <span role="columnheader">Cím</span>
      <span role="columnheader">Hang</span>
      <span role="columnheader">BPM</span>
      <span role="columnheader">Nehézség</span>
      <span role="columnheader">Státusz</span>
      <span />
    </div>
  );
}

export function SongRow({ song, onPlay }: { song: Song; onPlay?: (song: Song) => void }) {
  return (
    <div role="row" className={`grid items-center gap-3 border-t border-border px-3 py-2.5 transition-colors duration-(--dur-fade) hover:bg-muted/40 md:gap-4 md:px-4 ${COLS}`}>
      <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="sm" />
      <PendingLink href={`/songs/${song.id}`} className="pressable -mx-1.5 flex min-w-0 flex-col rounded-md px-1.5 leading-tight [--press-scale:.985]">
        <span className="display-soft truncate font-display text-[17px] font-medium" title={song.title}>{song.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">{song.artist}</span>
      </PendingLink>
      <span className="hidden font-mono text-sm md:inline">{song.songKey ?? '—'}</span>
      <span className="hidden font-mono text-sm tabular-nums md:inline">{song.bpm ?? '—'}</span>
      <span className="hidden md:inline">
        <DifficultyMeter level={song.difficulty} />
      </span>
      <span className="hidden md:inline">
        <StatusBadge status={song.status} />
      </span>
      <span className="md:hidden">
        <StatusBadge status={song.status} compact />
      </span>
      <span className="flex items-center justify-end">
        {onPlay && song.youtubeUrl && (
          <Button variant="ghost" size="icon-sm" aria-label={`Lejátszás: ${song.title}`} className="hidden md:inline-flex" onClick={() => onPlay(song)}>
            <Play className="fill-current" />
          </Button>
        )}
        <SongActionsMenu song={song} />
      </span>
    </div>
  );
}
