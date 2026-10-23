'use client';

import { Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/components/player/player-provider';
import { ElapsedTime, SeekBar, TotalTime } from '@/components/player/seek-bar';
import { formatClock, recordingSubtitle, recordingTrack } from '@/lib/player-state';
import { cn } from '@/lib/utils';

export interface HubRecording {
  id: string;
  name: string;
  date: string;
  duration: number | null;
}

/** The song's recordings; they play in the mini player (A22), the playing row gets the seek bar (A21). */
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
            {isCurrent && (
              <div className="mt-1 ml-[52px] flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground animate-in fade-in-0 duration-(--dur-fade)">
                <ElapsedTime className="w-9 shrink-0" />
                <SeekBar label={`Lejátszási pozíció: ${r.name}`} className="h-6 flex-1" />
                <TotalTime className="w-9 shrink-0 text-right" />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
