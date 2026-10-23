'use client';

import { Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/components/player/player-provider';
import { formatClock, recordingSubtitle, recordingTrack } from '@/lib/player-state';
import { cn } from '@/lib/utils';

export interface HubRecording {
  id: string;
  name: string;
  date: string;
  duration: number | null;
}

/** The song's recordings; they play in the mini player (A22), which also carries the seek bar. */
export function HubRecordings({ recordings }: { recordings: HubRecording[] }) {
  const player = usePlayer();

  if (recordings.length === 0) return <p className="text-sm text-muted-foreground">Ehhez a dalhoz még nincs felvétel.</p>;

  const queue = recordings.map((r) => recordingTrack({ ...r, duration: r.duration ?? 0 }, recordingSubtitle(r.date)));

  function toggle(index: number) {
    if (player.current?.id === queue[index].id) player.toggle();
    else player.playTrack(queue[index], queue);
  }

  return (
    <ul className="flex flex-col">
      {recordings.map((r, index) => {
        const isCurrent = player.current?.id === queue[index].id;
        const isPlaying = isCurrent && player.state.isPlaying;
        const isLoading = isPlaying && player.loading;
        return (
          <li key={r.id} className="border-t border-border py-2 first:border-t-0">
            <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3">
              <Button
                variant={isCurrent ? 'default' : 'outline'}
                size="icon"
                aria-label={`${isPlaying ? 'Szünet' : 'Lejátszás'}: ${r.name}`}
                aria-busy={isLoading || undefined}
                onClick={() => toggle(index)}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                ) : isPlaying ? (
                  <Pause className="fill-current" />
                ) : (
                  <Play className="fill-current" />
                )}
              </Button>
              <span className={cn('truncate text-[14px] font-semibold', isCurrent && 'text-primary-text')} title={r.name}>
                {r.name}
              </span>
              <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{r.duration ? formatClock(r.duration) : '—'}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
