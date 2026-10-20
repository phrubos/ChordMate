'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayerProvider, usePlayer } from '@/components/player/player-provider';
import { MiniPlayer } from '@/components/player/mini-player';
import { SectionHeader } from '@/components/design/section-header';
import { fixtureSongs } from '../fixtures';

function Controls() {
  const player = usePlayer();
  const { play } = player;
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('player')) play(fixtureSongs[0], fixtureSongs);
  }, [play]);
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => player.play(fixtureSongs[0], fixtureSongs)}>Hotel California lejátszása (sorral)</Button>
      <Button variant="outline" onClick={() => player.play(fixtureSongs[7])}>Videó nélküli dal (Black)</Button>
      <span className="self-center text-sm text-muted-foreground">Sor: {player.state.queue.length} track</span>
    </div>
  );
}

export function PlayerSection() {
  return (
    <section id="player" className="flex flex-col gap-4">
      <SectionHeader eyebrow="Globális" title="Mini-player" />
      <PlayerProvider>
        <Controls />
        <MiniPlayer />
      </PlayerProvider>
    </section>
  );
}
