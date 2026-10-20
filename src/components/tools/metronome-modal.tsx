'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMetronome } from '@/hooks/use-metronome';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/design/eyebrow';
import { cn } from '@/lib/utils';
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

// --- Beat visualization (spec A4: active dot scale(1.35) + color, beat 1 amber; reduced motion → color only) ---
function BeatDots({ beats, currentBeat, isPlaying }: { beats: number; currentBeat: number; isPlaying: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      {Array.from({ length: beats }, (_, i) => {
        const active = isPlaying && currentBeat === i;
        return (
          <span
            key={i}
            className={cn(
              'rounded-full transition-[transform,background-color] duration-100 ease-(--ease-out) motion-reduce:transition-colors',
              i === 0 ? 'size-4' : 'size-3',
              active ? 'scale-[1.35] motion-reduce:scale-100' : 'scale-100',
              active ? (i === 0 ? 'bg-primary' : 'bg-foreground') : 'bg-border-strong'
            )}
          />
        );
      })}
    </div>
  );
}

// --- Main component ---
interface MetronomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keepAliveOnClose?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onStop?: () => void;
}

export function MetronomeModal({ open, onOpenChange, keepAliveOnClose = false, onPlayingChange, onStop }: MetronomeModalProps) {
  const [bpm, setBpm] = useState(120);
  const [timeSigIdx, setTimeSigIdx] = useState(2); // 4/4 default
  const [, setTapTimes] = useState<number[]>([]);

  const timeSig = TIME_SIGNATURES[timeSigIdx];
  const { isPlaying, currentBeat, toggle: togglePlay, dispose } = useMetronome({ bpm, beatsPerBar: timeSig.beats, onPlayingChange, onStop });

  // Cleanup on close — only when not keeping alive
  useEffect(() => {
    if (!open && !keepAliveOnClose) dispose();
  }, [open, dispose, keepAliveOnClose]);

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
          <div className="flex flex-col items-center gap-1 text-center">
            <Eyebrow>{tempoName(bpm)}</Eyebrow>
            <h2 className="display-soft font-display text-[26px] leading-tight font-medium">Metronóm</h2>
          </div>

          {/* BPM display */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              aria-label="Lassabb (−1 BPM)"
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
              aria-label="Gyorsabb (+1 BPM)"
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
                  ? 'bg-destructive/90 hover:bg-destructive text-background'
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
