'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayerProvider, usePlayer, type RecordingLoader } from '@/components/player/player-provider';
import { MiniPlayer } from '@/components/player/mini-player';
import { SectionHeader } from '@/components/design/section-header';
import { RecordingsList } from '@/components/tools/recording-modal';
import type { RecordingMeta } from '@/types';
import { fixtureSongs } from '../fixtures';

/** A few seconds of a soft A-minor arpeggio as a WAV blob — stands in for the server's audio. */
function toneUrl(seconds: number): string {
  const rate = 8000;
  const n = rate * seconds;
  const buf = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o: number, t: string) => [...t].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  buf.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVEfmt ');
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true);
  buf.setUint16(22, 1, true);
  buf.setUint32(24, rate, true);
  buf.setUint32(28, rate * 2, true);
  buf.setUint16(32, 2, true);
  buf.setUint16(34, 16, true);
  str(36, 'data');
  buf.setUint32(40, n * 2, true);
  const notes = [220, 261.63, 329.63, 440];
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const f = notes[Math.floor(t * 2) % notes.length];
    const env = Math.exp(-((t * 2) % 1) * 3);
    buf.setInt16(44 + i * 2, Math.sin(2 * Math.PI * f * t) * env * 6000, true);
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

const devLoader: RecordingLoader = async (id) => toneUrl(id === 'r2' ? 12 : 24);

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
      <PlayerProvider loadRecording={devLoader}>
        <Controls />
        <div className="max-w-sm rounded-xl border border-border bg-card p-4">
          <RecordingsList recordings={fixtureRecordings} onUpdate={() => {}} />
        </div>
        <MiniPlayer />
      </PlayerProvider>
    </section>
  );
}
