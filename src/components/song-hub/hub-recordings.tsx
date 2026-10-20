'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getRecordingAudio } from '@/actions/recordings';

export interface HubRecording {
  id: string;
  name: string;
  date: string;
  duration: number | null;
}

function formatDuration(sec: number | null) {
  if (!sec) return '—';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Compact recording list with one shared audio element. */
export function HubRecordings({ recordings }: { recordings: HubRecording[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPlayingId(null);
  }

  useEffect(() => stop, []);

  async function toggle(rec: HubRecording) {
    if (playingId === rec.id) return stop();
    stop();
    setLoadingId(rec.id);
    try {
      const { audioData, mimeType } = await getRecordingAudio(rec.id);
      const bytes = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      const audio = new Audio(url);
      audio.addEventListener('ended', stop);
      urlRef.current = url;
      audioRef.current = audio;
      await audio.play();
      setPlayingId(rec.id);
    } catch {
      toast.error('Hiba a lejátszásnál');
    } finally {
      setLoadingId(null);
    }
  }

  if (recordings.length === 0) return <p className="text-sm text-muted-foreground">Ehhez a dalhoz még nincs felvétel.</p>;

  return (
    <ul className="flex flex-col">
      {recordings.map((r) => (
        <li key={r.id} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2 first:border-t-0">
          <Button variant="outline" size="icon" aria-label={`${playingId === r.id ? 'Szünet' : 'Lejátszás'}: ${r.name}`} onClick={() => toggle(r)}>
            {loadingId === r.id ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : playingId === r.id ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </Button>
          <span className="truncate text-[14px] font-semibold" title={r.name}>{r.name}</span>
          <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{formatDuration(r.duration)}</span>
        </li>
      ))}
    </ul>
  );
}
