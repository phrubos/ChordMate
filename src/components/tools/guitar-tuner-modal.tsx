'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

const GUITAR_STRINGS = [
  { note: 'E', octave: 2, freq: 82.41, string: 6 },
  { note: 'A', octave: 2, freq: 110.00, string: 5 },
  { note: 'D', octave: 3, freq: 146.83, string: 4 },
  { note: 'G', octave: 3, freq: 196.00, string: 3 },
  { note: 'B', octave: 3, freq: 246.94, string: 2 },
  { note: 'E', octave: 4, freq: 329.63, string: 1 },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// --- Pitch detection (autocorrelation) ---
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.015) return -1;

  // Trim quiet edges
  const threshold = 0.2;
  let r1 = 0, r2 = buffer.length - 1;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) { r2 = buffer.length - i; break; }
  }

  const buf = new Float32Array(buffer.buffer, r1 * 4, r2 - r1);
  const c = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    let sum = 0;
    for (let j = 0; j < buf.length - i; j++) sum += buf[j] * buf[j + i];
    c[i] = sum;
  }

  let d = 0;
  while (d < c.length - 1 && c[d] > c[d + 1]) d++;

  let maxval = -1, maxpos = -1;
  for (let i = d; i < buf.length; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }

  if (maxpos <= 0) return -1;

  // Parabolic interpolation
  if (maxpos > 0 && maxpos < buf.length - 1) {
    const x1 = c[maxpos - 1], x2 = c[maxpos], x3 = c[maxpos + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    if (a !== 0) {
      const b = (x3 - x1) / 2;
      return sampleRate / (maxpos - b / (2 * a));
    }
  }
  return sampleRate / maxpos;
}

function noteFromFreq(freq: number) {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const cents = Math.round(1200 * Math.log2(freq / (440 * Math.pow(2, (midi - 69) / 12))));
  const noteIdx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { note: NOTE_NAMES[noteIdx], octave, cents, midi };
}

function closestGuitarString(note: string, octave: number) {
  const full = `${note}${octave}`;
  return GUITAR_STRINGS.find(s => `${s.note}${s.octave}` === full) ?? null;
}

// --- LED tuning bar ---
function TuningLEDs({ cents, active }: { cents: number; active: boolean }) {
  const dots = Array.from({ length: 21 }, (_, i) => i - 10); // -10 to +10, each = 5 cents
  const activeDotIdx = active ? Math.round(cents / 5) : null;

  return (
    <div className="flex items-center justify-center gap-1">
      {dots.map((dot) => {
        const isCenter = dot === 0;
        const absDot = Math.abs(dot);
        const dist = activeDotIdx !== null ? Math.abs(dot - activeDotIdx) : 99;
        const isLit = dist <= 1;
        const isDimLit = dist <= 2;

        let color = 'bg-muted-foreground/15';
        if (isLit && active) {
          if (absDot <= 1) color = 'bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400/60%)]';
          else if (absDot <= 3) color = 'bg-lime-400 shadow-[0_0_6px_theme(colors.lime.400/50%)]';
          else if (absDot <= 5) color = 'bg-yellow-400 shadow-[0_0_6px_theme(colors.yellow.400/50%)]';
          else if (absDot <= 7) color = 'bg-orange-400 shadow-[0_0_6px_theme(colors.orange.400/50%)]';
          else color = 'bg-red-400 shadow-[0_0_6px_theme(colors.red.400/50%)]';
        } else if (isDimLit && active) {
          if (absDot <= 1) color = 'bg-emerald-400/40';
          else if (absDot <= 3) color = 'bg-lime-400/30';
          else if (absDot <= 5) color = 'bg-yellow-400/30';
          else if (absDot <= 7) color = 'bg-orange-400/30';
          else color = 'bg-red-400/30';
        }

        return (
          <div
            key={dot}
            className={`rounded-full transition-all duration-100 ${color} ${isCenter ? 'size-3' : 'size-2'}`}
          />
        );
      })}
    </div>
  );
}

// --- Guitar strings visualization ---
function GuitarStringsViz({ activeString }: { activeString: number | null }) {
  const thicknesses = [3, 2.5, 2, 1.5, 1.2, 1];

  return (
    <svg viewBox="0 0 200 60" className="w-full max-w-[200px] mx-auto">
      {GUITAR_STRINGS.map((gs, i) => {
        const x = 20 + i * 32;
        const isActive = activeString === gs.string;
        return (
          <g key={gs.string}>
            {/* Tuning peg */}
            <circle
              cx={x} cy={8} r={5}
              fill={isActive ? 'oklch(0.78 0.155 65)' : 'oklch(0.4 0.01 260)'}
              stroke={isActive ? 'oklch(0.78 0.155 65 / 50%)' : 'oklch(0.5 0.01 260)'}
              strokeWidth={1}
              className="transition-all duration-300"
            />
            {/* String */}
            <line
              x1={x} y1={14} x2={x} y2={50}
              stroke={isActive ? 'oklch(0.78 0.155 65)' : 'oklch(0.55 0.01 260)'}
              strokeWidth={thicknesses[i]}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            {isActive && (
              <line
                x1={x} y1={14} x2={x} y2={50}
                stroke="oklch(0.78 0.155 65 / 30%)"
                strokeWidth={thicknesses[i] + 4}
                strokeLinecap="round"
                className="animate-glow-pulse"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// --- Main component ---
interface GuitarTunerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuitarTunerModal({ open, onOpenChange }: GuitarTunerModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [matchedString, setMatchedString] = useState<number | null>(null);
  const [selectedString, setSelectedString] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsListening(false);
  }, []);

  const detect = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioCtxRef.current) return;
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const freq = autoCorrelate(bufferRef.current, audioCtxRef.current.sampleRate);

    if (freq > 0 && freq > 60 && freq < 1200) {
      const info = noteFromFreq(freq);

      // If a specific string is selected, only accept notes near that string
      if (selectedString !== null) {
        const gs = GUITAR_STRINGS.find(s => s.string === selectedString);
        if (gs) {
          const ratio = freq / gs.freq;
          if (ratio < 0.85 || ratio > 1.18) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }
        }
      }

      setDetectedNote(info.note);
      setDetectedOctave(info.octave);
      setDetectedFreq(Math.round(freq * 10) / 10);
      setCents(Math.max(-50, Math.min(50, info.cents)));

      const matched = closestGuitarString(info.note, info.octave);
      setMatchedString(matched?.string ?? null);
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [selectedString]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      bufferRef.current = new Float32Array(analyser.fftSize);

      setIsListening(true);
      setDetectedNote(null);
      setDetectedOctave(null);
      setDetectedFreq(null);
      setCents(0);
      setMatchedString(null);

      rafRef.current = requestAnimationFrame(detect);
    } catch {
      // Microphone access denied
    }
  }, [detect]);

  // Cleanup on close
  useEffect(() => {
    if (!open) stopListening();
  }, [open, stopListening]);

  // Restart detection if selectedString changes while listening
  useEffect(() => {
    if (isListening && analyserRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(detect);
    }
  }, [selectedString, isListening, detect]);

  const absCents = Math.abs(cents);
  const inTune = detectedNote !== null && absCents <= 5;
  const noteColor = !detectedNote
    ? 'text-muted-foreground/40'
    : inTune
    ? 'text-emerald-400'
    : absCents <= 15
    ? 'text-yellow-400'
    : 'text-orange-400';

  const glowColor = !detectedNote
    ? 'transparent'
    : inTune
    ? 'oklch(0.65 0.18 155 / 15%)'
    : absCents <= 15
    ? 'oklch(0.8 0.18 90 / 10%)'
    : 'oklch(0.7 0.18 45 / 10%)';

  const statusText = !detectedNote
    ? 'Pengesd meg egy húrt'
    : inTune
    ? 'Stimmel!'
    : cents < 0
    ? 'Túl mély ↓'
    : 'Túl magas ↑';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-border/50 gap-0">
        <DialogTitle className="sr-only">Gitár Hangoló</DialogTitle>

        <div className="flex flex-col items-center px-6 pt-6 pb-5 gap-5">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Hangoló</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Standard hangolás (EADGBe)</p>
          </div>

          {/* Note display circle */}
          <div className="relative">
            <motion.div
              className="flex size-32 items-center justify-center rounded-full border-2 transition-colors duration-500"
              style={{
                borderColor: detectedNote ? (inTune ? 'oklch(0.65 0.18 155 / 50%)' : 'oklch(0.78 0.155 65 / 30%)') : 'oklch(0.5 0.01 260 / 30%)',
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
              animate={inTune ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={inTune ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              <div className="text-center">
                <motion.p
                  key={detectedNote ?? 'empty'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-4xl font-black tracking-tight transition-colors duration-300 ${noteColor}`}
                >
                  {detectedNote ?? '—'}
                  {detectedOctave !== null && (
                    <span className="text-lg font-semibold opacity-60">{detectedOctave}</span>
                  )}
                </motion.p>
                {detectedFreq !== null && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{detectedFreq} Hz</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Cents offset text */}
          <div className="text-center">
            {detectedNote && (
              <p className={`text-sm font-medium ${noteColor}`}>
                {cents > 0 ? '+' : ''}{cents} cent
              </p>
            )}
            <p className={`text-xs mt-1 ${inTune ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
              {isListening ? statusText : 'Kattints a mikrofonra a kezdéshez'}
            </p>
          </div>

          {/* LED tuning bar */}
          <div className="w-full">
            <TuningLEDs cents={cents} active={isListening && detectedNote !== null} />
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px] text-muted-foreground/40">♭</span>
              <span className="text-[10px] text-muted-foreground/40">♯</span>
            </div>
          </div>

          {/* Guitar strings visualization */}
          <GuitarStringsViz activeString={matchedString} />

          {/* String selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedString(null)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                selectedString === null
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              Auto
            </button>
            {GUITAR_STRINGS.map((gs) => (
              <button
                key={gs.string}
                onClick={() => setSelectedString(selectedString === gs.string ? null : gs.string)}
                className={`flex flex-col items-center rounded-lg px-2 py-1 text-xs font-medium transition-all min-w-[32px] ${
                  selectedString === gs.string
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : matchedString === gs.string && isListening
                    ? 'bg-primary/5 text-primary/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <span className="font-bold">{gs.note}</span>
                <span className="text-[9px] opacity-50">{gs.string}</span>
              </button>
            ))}
          </div>

          {/* Microphone button */}
          <Button
            size="lg"
            className={`w-full h-12 rounded-xl gap-2 text-sm font-semibold transition-all ${
              isListening
                ? 'bg-destructive/90 hover:bg-destructive text-white'
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <>
                <MicOff className="size-4" />
                Leállítás
              </>
            ) : (
              <>
                <Mic className="size-4" />
                Hallgatás indítása
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
