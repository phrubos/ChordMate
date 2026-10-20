'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { nextBeatTime } from '@/lib/practice';

interface UseMetronomeOptions {
  bpm: number;
  beatsPerBar?: number;
  onPlayingChange?: (playing: boolean) => void;
  onStop?: () => void;
}

/** Web Audio metronome: setTimeout look-ahead on the audio clock; beat 1 clicks higher. */
export function useMetronome({ bpm, beatsPerBar = 4, onPlayingChange, onStop }: UseMetronomeOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatRef = useRef(0);
  const playingRef = useRef(false);
  const cfgRef = useRef({ bpm, beatsPerBar, onPlayingChange, onStop });
  useEffect(() => {
    cfgRef.current = { bpm, beatsPerBar, onPlayingChange, onStop };
  });

  const click = useCallback((accent: boolean) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1000 : 800;
    osc.type = 'sine';
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  }, []);

  const start = useCallback(() => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();
    beatRef.current = 0;
    nextTimeRef.current = ctx.currentTime;
    playingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);
    cfgRef.current.onPlayingChange?.(true);

    const tick = () => {
      if (!playingRef.current || ctxRef.current !== ctx) return;
      click(beatRef.current === 0);
      setCurrentBeat(beatRef.current);
      beatRef.current = (beatRef.current + 1) % cfgRef.current.beatsPerBar;
      nextTimeRef.current = nextBeatTime(nextTimeRef.current, cfgRef.current.bpm);
      const delay = (nextTimeRef.current - ctx.currentTime) * 1000;
      timerRef.current = setTimeout(tick, Math.max(0, delay - 25));
    };
    tick();
  }, [click]);

  const stop = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentBeat(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    cfgRef.current.onPlayingChange?.(false);
    cfgRef.current.onStop?.();
  }, []);

  const toggle = useCallback(() => (playingRef.current ? stop() : start()), [start, stop]);

  /** Stops and releases the AudioContext. */
  const dispose = useCallback(() => {
    if (playingRef.current) stop();
    ctxRef.current?.close();
    ctxRef.current = null;
  }, [stop]);

  // Restart from beat 1 when tempo or meter changes while playing.
  useEffect(() => {
    if (!playingRef.current) return;
    const t = setTimeout(() => {
      stop();
      start();
    }, 50);
    return () => clearTimeout(t);
  }, [bpm, beatsPerBar, start, stop]);

  useEffect(
    () => () => {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      ctxRef.current?.close();
    },
    []
  );

  return { isPlaying, currentBeat, start, stop, toggle, dispose };
}
