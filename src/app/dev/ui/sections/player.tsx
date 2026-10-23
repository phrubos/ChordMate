'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayerProvider, usePlayer } from '@/components/player/player-provider';
import { MiniPlayer } from '@/components/player/mini-player';
import { SectionHeader } from '@/components/design/section-header';
import { RecordingsList } from '@/components/tools/recording-modal';
import type { RecordingMeta } from '@/types';
import { fixtureSongs } from '../fixtures';
import { devRecordingLoader } from '../dev-audio';

const fixtureRecordings: RecordingMeta[] = [
  { id: 'r1', name: 'Hotel California — első kör', date: '2026-10-13', duration: 24, mimeType: 'audio/wav', songId: null, bandId: null, addedById: 'u1', createdAt: new Date(2026, 9, 13) },
  { id: 'r2', name: 'Szóló, lassítva', date: '2026-10-13', duration: 12, mimeType: 'audio/wav', songId: null, bandId: null, addedById: 'u1', createdAt: new Date(2026, 9, 13) },
];

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
      {/* Fixture videos are fake ids; this one is real (19s, embeddable) for trying YouTube seeking. */}
      <Button variant="outline" onClick={() => player.play({ id: 'zoo', title: 'Me at the zoo', artist: 'jawed', imageUrl: null, youtubeUrl: 'https://youtu.be/jNQXAC9IVRw' })}>
        Valódi YouTube-videó
      </Button>
      <span className="self-center text-sm text-muted-foreground">Sor: {player.state.queue.length} track</span>
    </div>
  );
}

export function PlayerSection() {
  return (
    <section id="player" className="flex flex-col gap-4">
      <SectionHeader eyebrow="Globális" title="Mini-player" />
      <PlayerProvider loadRecording={devRecordingLoader}>
        <Controls />
        <div className="max-w-sm rounded-xl border border-border bg-card p-4">
          <RecordingsList recordings={fixtureRecordings} onUpdate={() => {}} />
        </div>
        <MiniPlayer />
      </PlayerProvider>
    </section>
  );
}
