'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Minus, Plus } from 'lucide-react';

const TIME_SIGNATURES = [
  { label: '2/4', beats: 2, subdivision: 4 },
  { label: '3/4', beats: 3, subdivision: 4 },
  { label: '4/4', beats: 4, subdivision: 4 },
  { label: '6/8', beats: 6, subdivision: 8 },
];

function tempoName(bpm: number): string {
  if (bpm < 40) return 'Grave';
  if (bpm < 55) return 'Largo';
  if (bpm < 65) return 'Larghetto';
  if (bpm < 73) return 'Adagio';
  if (bpm < 78) return 'Andante';
  if (bpm < 86) return 'Andantino';
  if (bpm < 98) return 'Moderato';
  if (bpm < 109) return 'Allegretto';
  if (bpm < 132) return 'Allegro';
  if (bpm < 140) return 'Vivace';
  if (bpm < 178) return 'Presto';
  return 'Prestissimo';
}

// --- Beat visualization ---
function BeatDots({ beats, currentBeat, isPlaying }: { beats: number; currentBeat: number; isPlaying: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: beats }, (_, i) => {
        const isActive = isPlaying && currentBeat === i;
        const isFirst = i === 0;
        const baseSize = isFirst ? 'size-5' : 'size-4';

        return (
          <div key={i} className="relative flex items-center justify-center">
            {isActive && (
              <motion.div
                className={`absolute rounded-full ${isFirst ? 'size-8' : 'size-7'}`}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                key={`pulse-${currentBeat}-${Date.now()}`}
                style={{ background: isFirst ? 'oklch(0.78 0.155 65 / 30%)' : 'oklch(0.78 0.155 65 / 20%)' }}
              />
            )}
            <motion.div
              className={`${baseSize} rounded-full transition-colors duration-100 ${
                isActive
                  ? isFirst
                    ? 'bg-primary shadow-[0_0_12px_theme(colors.primary/60%)]'
                    : 'bg-primary/80 shadow-[0_0_8px_theme(colors.primary/40%)]'
                  : 'bg-muted-foreground/20'
              }`}
              animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.15 }}
            />
          </div>
        );
      })}
    </div>
  );
}

// --- Pendulum visualization ---
function Pendulum({ isPlaying, bpm, currentBeat }: { isPlaying: boolean; bpm: number; currentBeat: number }) {
  const duration = 60 / bpm;
  const direction = currentBeat % 2 === 0 ? 1 : -1;

  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[200px] mx-auto">
      {/* Pivot point */}
      <circle cx="100" cy="10" r="3" fill="oklch(0.5 0.01 260)" />

      {/* Tick marks */}
      <line x1="30" y1="105" x2="30" y2="110" stroke="oklch(0.4 0.01 260)" strokeWidth="1" />
      <line x1="65" y1="105" x2="65" y2="110" stroke="oklch(0.4 0.01 260)" strokeWidth="1" />
      <line x1="100" y1="105" x2="100" y2="112" stroke="oklch(0.5 0.01 260)" strokeWidth="1.5" />
      <line x1="135" y1="105" x2="135" y2="110" stroke="oklch(0.4 0.01 260)" strokeWidth="1" />
      <line x1="170" y1="105" x2="170" y2="110" stroke="oklch(0.4 0.01 260)" strokeWidth="1" />

      {/* Arc guide */}
      <path
        d="M 30 105 A 80 80 0 0 1 170 105"
        fill="none"
        stroke="oklch(0.35 0.01 260)"
        strokeWidth="0.5"
      />

      {/* Pendulum arm + weight */}
      <motion.g
        style={{ transformOrigin: '100px 10px' }}
        animate={
          isPlaying
            ? { rotate: direction * 25 }
            : { rotate: 0 }
        }
        transition={
          isPlaying
            ? { duration: duration / 2, ease: [0.4, 0, 0.6, 1] }
            : { type: 'spring', stiffness: 200, damping: 20 }
        }
      >
        <line
          x1="100" y1="10" x2="100" y2="95"
          stroke="oklch(0.65 0.02 260)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="100" cy="95" r="8"
          fill={isPlaying ? 'oklch(0.78 0.155 65)' : 'oklch(0.5 0.02 260)'}
          className="transition-colors duration-300"
        />
        {isPlaying && (
          <circle
            cx="100" cy="95" r="8"
            fill="none"
            stroke="oklch(0.78 0.155 65 / 30%)"
            strokeWidth="4"
            className="animate-glow-pulse"
          />
        )}
      </motion.g>
    </svg>
  );
}

// --- Main component ---
interface MetronomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MetronomeModal({ open, onOpenChange }: MetronomeModalProps) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSigIdx, setTimeSigIdx] = useState(2); // 4/4 default
  const [currentBeat, setCurrentBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatRef = useRef(0);
  const isPlayingRef = useRef(false);

  const timeSig = TIME_SIGNATURES[timeSigIdx];

  const playClick = useCallback((accent: boolean) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
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

  const scheduleNextBeat = useCallback(() => {
    if (!isPlayingRef.current || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const beatInterval = 60 / bpm;

    // Play current beat
    const isAccent = beatRef.current === 0;
    playClick(isAccent);
    setCurrentBeat(beatRef.current);

    // Advance beat
    beatRef.current = (beatRef.current + 1) % timeSig.beats;
    nextBeatTimeRef.current += beatInterval;

    // Schedule next
    const delay = (nextBeatTimeRef.current - ctx.currentTime) * 1000;
    timerRef.current = setTimeout(scheduleNextBeat, Math.max(0, delay - 25));
  }, [bpm, timeSig.beats, playClick]);

  const start = useCallback(() => {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    if (ctx.state === 'suspended') ctx.resume();

    beatRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);

    scheduleNextBeat();
  }, [scheduleNextBeat]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentBeat(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  // Restart metronome when BPM or time sig changes while playing
  useEffect(() => {
    if (isPlaying) {
      stop();
      // Small delay to allow cleanup
      const t = setTimeout(start, 50);
      return () => clearTimeout(t);
    }
  }, [bpm, timeSigIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stop();
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    }
  }, [open, stop]);

  // Tap tempo
  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes(prev => {
      const recent = [...prev, now].filter(t => now - t < 3000);
      if (recent.length >= 2) {
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const newBpm = Math.round(60000 / avgInterval);
        if (newBpm >= 30 && newBpm <= 300) {
          setBpm(newBpm);
        }
      }
      return recent;
    });
  }, []);

  const adjustBpm = useCallback((delta: number) => {
    setBpm(prev => Math.max(30, Math.min(300, prev + delta)));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-border/50 gap-0">
        <DialogTitle className="sr-only">Metronóm</DialogTitle>

        <div className="flex flex-col items-center px-6 pt-6 pb-5 gap-5">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Metronóm</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{tempoName(bpm)}</p>
          </div>

          {/* BPM display */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border/50"
              onClick={() => adjustBpm(-1)}
              onMouseDown={(e) => {
                if (e.detail > 1) e.preventDefault();
              }}
            >
              <Minus className="size-4" />
            </Button>

            <div className="text-center min-w-[100px]">
              <p className="text-5xl font-black tracking-tighter tabular-nums text-foreground">{bpm}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">BPM</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border/50"
              onClick={() => adjustBpm(1)}
              onMouseDown={(e) => {
                if (e.detail > 1) e.preventDefault();
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* BPM slider */}
          <div className="w-full px-2">
            <input
              type="range"
              min={30}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_8px_theme(colors.primary/40%)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/40">30</span>
              <span className="text-[10px] text-muted-foreground/40">300</span>
            </div>
          </div>

          {/* Pendulum */}
          <Pendulum isPlaying={isPlaying} bpm={bpm} currentBeat={currentBeat} />

          {/* Beat dots */}
          <BeatDots beats={timeSig.beats} currentBeat={currentBeat} isPlaying={isPlaying} />

          {/* Time signature selector */}
          <div className="flex items-center gap-1.5">
            {TIME_SIGNATURES.map((ts, idx) => (
              <button
                key={ts.label}
                onClick={() => setTimeSigIdx(idx)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                  timeSigIdx === idx
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {ts.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full">
            {/* Tap tempo */}
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl text-sm font-semibold border-border/50"
              onClick={handleTap}
            >
              Tap Tempo
            </Button>

            {/* Play / Stop */}
            <Button
              size="lg"
              className={`flex-1 h-12 rounded-xl gap-2 text-sm font-semibold transition-all ${
                isPlaying
                  ? 'bg-destructive/90 hover:bg-destructive text-white'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <>
                  <Pause className="size-4" />
                  Leállítás
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Indítás
                </>
              )}
            </Button>
          </div>

          {/* Quick BPM presets */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {[60, 80, 100, 120, 140, 160].map((preset) => (
              <button
                key={preset}
                onClick={() => setBpm(preset)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                  bpm === preset
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
