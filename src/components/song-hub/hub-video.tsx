'use client';

import { useEffect, useRef } from 'react';
import { Headphones, Pause, Play, Video } from 'lucide-react';
import { SectionHeader } from '@/components/design/section-header';
import { SegmentedControl } from '@/components/design/segmented-control';
import { usePlayer, type PlayerMode } from '@/components/player/player-provider';
import { hueFromString } from '@/lib/song-meta';
import type { Song } from '@/types';

/**
 * Video slot of the Song Hub. In "Videó" mode the app's single YouTube player is docked over this
 * box (tutorials must be watchable); in "Csak hang" mode it keeps playing in the mini player only.
 */
export function HubVideo({ song }: { song: Song }) {
  const player = usePlayer();
  const slotRef = useRef<HTMLDivElement>(null);
  const { dock } = player;
  const isCurrent = player.current?.id === song.id;
  const showsVideo = isCurrent && player.mode === 'video';

  useEffect(() => {
    dock(slotRef.current, song.id);
    return () => dock(null, song.id);
  }, [dock, song.id]);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Videó"
        actions={
          <SegmentedControl<PlayerMode>
            ariaLabel="Lejátszás módja"
            size="sm"
            value={player.mode}
            onChange={player.setMode}
            options={[
              { value: 'video', label: 'Videó' },
              { value: 'audio', label: 'Csak hang' },
            ]}
          />
        }
      />
      <div
        ref={slotRef}
        className="relative aspect-video overflow-hidden rounded-[6px]"
        style={{
          ['--h' as string]: hueFromString(`${song.artist} — ${song.title}`),
          background: 'radial-gradient(60% 70% at 30% 30%, oklch(.5 .12 var(--h) / .55), transparent 70%), oklch(.2 .03 var(--h))',
        }}
      >
        {!showsVideo && (
          <button
            type="button"
            onClick={() => (isCurrent ? player.toggle() : player.play(song))}
            aria-label={isCurrent && player.state.isPlaying ? `Szünet: ${song.title}` : `Lejátszás: ${song.title}`}
            className="pressable group absolute inset-0 grid cursor-pointer place-items-center outline-none [--press-scale:1]"
          >
            {/* Hover on the box: faint wash, the disc lifts a touch inside a soft halo. On the disc itself it
                turns amber — clickable everywhere, but the target is obvious. */}
            <span aria-hidden className="absolute inset-0 bg-foreground/0 transition-colors duration-(--dur-fade) group-hover:bg-foreground/[0.04]" />
            <span className="relative grid place-items-center transition-transform duration-(--dur-press) ease-(--ease-out) group-hover:scale-[1.04] group-active:scale-[.97] group-data-pressed:scale-[.97] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
              <span aria-hidden className="absolute inset-0 scale-[1.3] rounded-full bg-foreground/12 opacity-0 transition-opacity duration-(--dur-fade) group-hover:opacity-100" />
              <span className="relative grid size-16 place-items-center rounded-full bg-foreground text-background shadow-[0_8px_24px_oklch(0_0_0/.35)] transition-[transform,background-color,color] duration-(--dur-press) ease-(--ease-out) hover:scale-[1.04] hover:bg-primary hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background motion-reduce:transition-colors motion-reduce:hover:scale-100">
                {isCurrent && player.state.isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
              </span>
            </span>
            <span className="absolute bottom-3.5 left-4 inline-flex items-center gap-2 text-[13px] font-medium text-foreground/80 transition-colors duration-(--dur-fade) group-hover:text-foreground">
              {player.mode === 'video' ? <Video className="size-4" aria-hidden /> : <Headphones className="size-4" aria-hidden />}
              {player.mode === 'video' ? 'YouTube · itt jelenik meg' : isCurrent ? 'Csak hang · a mini-playerben szól' : 'Csak hang · a mini-playerben fog szólni'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
