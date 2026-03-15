'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square, Play, Pause, Trash2, Pencil, Check, X, Save } from 'lucide-react';
import {
  saveRecording as dbSave,
  getRecordingsByDate,
  getRecordingAudio,
  updateRecordingName,
  deleteRecording,
} from '@/actions/recordings';
import type { RecordingMeta } from '@/types';
import { toast } from 'sonner';
import { TruncatedText } from '@/components/shared/truncated-text';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── SVG Turntable ─────────────────────────────────────────────
function TurntableSVG({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="relative w-full max-w-[260px] mx-auto select-none">
      {/* Ambient glow when recording */}
      {isRecording && (
        <div className="absolute inset-0 -m-4 rounded-3xl bg-red-500/5 blur-xl animate-pulse pointer-events-none" />
      )}
      <svg viewBox="0 0 260 200" className="w-full drop-shadow-2xl">
        <defs>
          <linearGradient id="tt-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b2e" />
            <stop offset="100%" stopColor="#12101c" />
          </linearGradient>
          <linearGradient id="tt-base-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2540" />
            <stop offset="100%" stopColor="#1a1628" />
          </linearGradient>
          <radialGradient id="tt-platter" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#222030" />
            <stop offset="100%" stopColor="#18162a" />
          </radialGradient>
          <radialGradient id="tt-vinyl" cx="50%" cy="48%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="40%" stopColor="#0f0f1a" />
            <stop offset="100%" stopColor="#080810" />
          </radialGradient>
          <radialGradient id="tt-label" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#f5c842" />
            <stop offset="100%" stopColor="#d4960a" />
          </radialGradient>
          <linearGradient id="tt-arm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a0a0b0" />
            <stop offset="50%" stopColor="#d8d8e8" />
            <stop offset="100%" stopColor="#909098" />
          </linearGradient>
          <filter id="tt-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
          <filter id="tt-glow-red">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base / chassis */}
        <rect x="8" y="12" width="244" height="176" rx="14" fill="url(#tt-base-edge)" />
        <rect x="10" y="14" width="240" height="172" rx="12" fill="url(#tt-base)" />

        {/* Subtle wood grain texture lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="20" y1={40 + i * 35} x2="240" y2={38 + i * 35} stroke="#ffffff" strokeWidth="0.3" opacity="0.02" />
        ))}

        {/* Platter */}
        <circle cx="110" cy="100" r="72" fill="url(#tt-platter)" />
        <circle cx="110" cy="100" r="71" fill="none" stroke="#2a2845" strokeWidth="1" />

        {/* Vinyl record */}
        <g style={{ transformOrigin: '110px 100px' }} className={isRecording ? 'animate-[spin_2s_linear_infinite]' : 'transition-transform duration-1000'}>
          <circle cx="110" cy="100" r="66" fill="url(#tt-vinyl)" />

          {/* Groove rings — realistic density */}
          {Array.from({ length: 22 }, (_, i) => 18 + i * 2.2).map((r, i) => (
            <circle
              key={i}
              cx="110"
              cy="100"
              r={r}
              fill="none"
              stroke={i % 3 === 0 ? '#1c1c34' : '#16162a'}
              strokeWidth={i % 5 === 0 ? '0.6' : '0.3'}
              opacity={0.5 + (i % 3) * 0.15}
            />
          ))}

          {/* Vinyl highlight / light reflection */}
          <ellipse cx="88" cy="78" rx="30" ry="14" fill="white" opacity="0.025" transform="rotate(-35 88 78)" />
          <ellipse cx="135" cy="120" rx="20" ry="8" fill="white" opacity="0.015" transform="rotate(30 135 120)" />

          {/* Label */}
          <circle cx="110" cy="100" r="16" fill="url(#tt-label)" />
          <circle cx="110" cy="100" r="15.5" fill="none" stroke="#b8880a" strokeWidth="0.5" opacity="0.5" />
          {/* Label details */}
          <circle cx="110" cy="100" r="3" fill="#2a1f08" />
          <circle cx="110" cy="100" r="1.5" fill="#444" />
          <text x="110" y="94" textAnchor="middle" fontSize="4.5" fill="#2a1f08" fontWeight="bold" opacity="0.7" fontFamily="serif">REC</text>
          <text x="110" y="100" textAnchor="middle" fontSize="3" fill="#2a1f08" opacity="0.5">ChordMate</text>
          {/* Decorative ring on label */}
          <circle cx="110" cy="100" r="11" fill="none" stroke="#c8a020" strokeWidth="0.3" opacity="0.4" />
        </g>

        {/* Platter rim highlight */}
        <circle cx="110" cy="100" r="68" fill="none" stroke="white" strokeWidth="0.3" opacity="0.06" />

        {/* Tonearm pivot base — top-right (back of turntable) */}
        <circle cx="210" cy="40" r="9" fill="#1a1830" stroke="#2a2845" strokeWidth="1" />
        <circle cx="210" cy="40" r="5.5" fill="#25223a" />
        <circle cx="210" cy="40" r="2" fill="url(#tt-arm)" />

        {/* Tonearm — pivots from top-right, arm extends down-left toward record */}
        <g
          style={{
            transformOrigin: '210px 40px',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          transform={isRecording ? 'rotate(0)' : 'rotate(-30)'}
          filter="url(#tt-shadow)"
        >
          {/* Counterweight — behind pivot, opposite direction of arm */}
          <ellipse cx="220" cy="30" rx="4.5" ry="3" fill="#2a2845" stroke="#3a3860" strokeWidth="0.5" />
          {/* Main arm tube — extends down-left toward record */}
          <line x1="210" y1="40" x2="172" y2="88" stroke="url(#tt-arm)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Headshell — angled toward vinyl surface */}
          <line x1="172" y1="88" x2="165" y2="97" stroke="#c0c0d0" strokeWidth="2" strokeLinecap="round" />
          {/* Cartridge */}
          <rect x="162" y="95" width="7" height="4.5" rx="1" fill="#333" transform="rotate(68 165 97)" />
          {/* Stylus tip */}
          <circle cx="164" cy="99" r="1" fill="#e0e0f0" />
        </g>

        {/* Arm rest clip — right side */}
        <rect x="228" y="92" width="4" height="12" rx="2" fill="#2a2845" stroke="#3a3860" strokeWidth="0.5" />

        {/* Speed selector dots (decorative) — bottom right */}
        <circle cx="218" cy="160" r="2" fill="#25223a" stroke="#3a3855" strokeWidth="0.5" />
        <circle cx="228" cy="160" r="2" fill="#f59e0b" stroke="#3a3855" strokeWidth="0.5" />
        <text x="218" y="156" textAnchor="middle" fontSize="3" fill="#555">33</text>
        <text x="228" y="156" textAnchor="middle" fontSize="3" fill="#888">45</text>

        {/* Power button (decorative) — bottom right */}
        <circle cx="236" cy="170" r="4" fill="#1a1830" stroke="#2a2845" strokeWidth="0.8" />
        <circle cx="236" cy="170" r="2" fill={isRecording ? '#22c55e' : '#333'} className="transition-colors duration-500" />

        {/* Recording LED */}
        <circle cx="218" cy="174" r="3" fill={isRecording ? '#ff2040' : '#331015'} className="transition-colors duration-300">
          {isRecording && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          )}
        </circle>
        {isRecording && (
          <circle cx="218" cy="174" r="3" fill="#ff2040" filter="url(#tt-glow-red)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        <text x="208" y="178" textAnchor="middle" fontSize="3.5" fill={isRecording ? '#ff4060' : '#444'} className="transition-colors duration-300">REC</text>
      </svg>
    </div>
  );
}

// ─── SVG 80s Retro Radio (for memory/playback-only mode) ──────
function RetroRadioSVG({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative w-full max-w-[260px] mx-auto select-none">
      {/* Warm ambient glow when playing */}
      {isPlaying && (
        <div className="absolute inset-0 -m-4 rounded-3xl bg-amber-500/5 blur-xl animate-pulse pointer-events-none" />
      )}
      <svg viewBox="0 0 260 200" className="w-full drop-shadow-2xl">
        <defs>
          <linearGradient id="rd-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d2b1a" />
            <stop offset="50%" stopColor="#2a1e10" />
            <stop offset="100%" stopColor="#1a1008" />
          </linearGradient>
          <linearGradient id="rd-body-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d3820" />
            <stop offset="100%" stopColor="#2a1e10" />
          </linearGradient>
          <linearGradient id="rd-speaker-mesh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1208" />
            <stop offset="100%" stopColor="#0f0a04" />
          </linearGradient>
          <radialGradient id="rd-dial-face" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#f5e6c8" />
            <stop offset="100%" stopColor="#c8a878" />
          </radialGradient>
          <linearGradient id="rd-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8d0c0" />
            <stop offset="50%" stopColor="#a89878" />
            <stop offset="100%" stopColor="#786850" />
          </linearGradient>
          <filter id="rd-glow-amber">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="rd-inset">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Body / chassis — warm wood cabinet */}
        <rect x="10" y="10" width="240" height="180" rx="12" fill="url(#rd-body-edge)" />
        <rect x="12" y="12" width="236" height="176" rx="10" fill="url(#rd-body)" />

        {/* Wood grain texture */}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="20" y1={25 + i * 22} x2="240" y2={23 + i * 22} stroke="#ffffff" strokeWidth="0.3" opacity="0.03" />
        ))}

        {/* Top decorative chrome strip */}
        <rect x="30" y="18" width="200" height="3" rx="1.5" fill="url(#rd-chrome)" opacity="0.6" />

        {/* ── Speaker grille — left side ── */}
        <rect x="22" y="32" width="100" height="100" rx="8" fill="url(#rd-speaker-mesh)" filter="url(#rd-inset)" />
        <rect x="24" y="34" width="96" height="96" rx="6" fill="none" stroke="#3a2818" strokeWidth="0.5" />

        {/* Speaker grille horizontal lines */}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1="28" y1={40 + i * 6.5} x2="116" y2={40 + i * 6.5} stroke="#2a1c0e" strokeWidth="0.8" opacity="0.6" />
        ))}

        {/* Speaker cone (visible through grille) */}
        <circle cx="72" cy="82" r="38" fill="none" stroke="#1a1008" strokeWidth="0.5" opacity="0.4" />
        <circle cx="72" cy="82" r="28" fill="none" stroke="#1a1008" strokeWidth="0.4" opacity="0.3" />
        <circle cx="72" cy="82" r="12" fill="none" stroke="#2a1c0e" strokeWidth="0.5" opacity="0.4" />
        <circle cx="72" cy="82" r="5" fill="#1a1008" opacity="0.5" />

        {/* Speaker pulse animation when playing */}
        {isPlaying && (
          <>
            <circle cx="72" cy="82" r="28" fill="none" stroke="#d4960a" strokeWidth="0.5" opacity="0.15">
              <animate attributeName="r" values="28;32;28" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="72" cy="82" r="38" fill="none" stroke="#d4960a" strokeWidth="0.3" opacity="0.08">
              <animate attributeName="r" values="38;42;38" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.02;0.08" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* ── Dial / tuner panel — right side ── */}
        <rect x="132" y="32" width="108" height="60" rx="6" fill="url(#rd-dial-face)" filter="url(#rd-inset)" />
        <rect x="134" y="34" width="104" height="56" rx="4" fill="none" stroke="#a89060" strokeWidth="0.5" opacity="0.5" />

        {/* Frequency markings */}
        <text x="142" y="48" fontSize="4" fill="#5a4a30" fontFamily="serif">AM</text>
        <text x="142" y="58" fontSize="4" fill="#5a4a30" fontFamily="serif">FM</text>
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={155 + i * 9} y1={44} x2={155 + i * 9} y2={50} stroke="#8a7a5a" strokeWidth="0.4" />
            <text x={155 + i * 9} y={42} textAnchor="middle" fontSize="3" fill="#8a7a5a">
              {53 + i * 2}
            </text>
          </g>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={155 + i * 9} y1={54} x2={155 + i * 9} y2={60} stroke="#8a7a5a" strokeWidth="0.4" />
            <text x={155 + i * 9} y={63} textAnchor="middle" fontSize="2.5" fill="#8a7a5a">
              {88 + i * 2}
            </text>
          </g>
        ))}

        {/* Tuner needle — animated when playing */}
        <line
          x1="185" y1="67" x2="185" y2="78"
          stroke="#c44" strokeWidth="0.8" strokeLinecap="round"
        >
          {isPlaying && (
            <animate attributeName="x1" values="170;200;175;195;185" dur="4s" repeatCount="indefinite" />
          )}
          {isPlaying && (
            <animate attributeName="x2" values="170;200;175;195;185" dur="4s" repeatCount="indefinite" />
          )}
        </line>

        {/* Dial glass reflection */}
        <rect x="134" y="34" width="40" height="30" rx="2" fill="white" opacity="0.04" />

        {/* ── Brand text ── */}
        <text x="186" y="82" textAnchor="middle" fontSize="5" fill="#c8a060" fontFamily="serif" fontWeight="bold" opacity="0.7">ChordMate</text>
        <text x="186" y="88" textAnchor="middle" fontSize="3" fill="#a08040" fontFamily="serif" opacity="0.4">STEREO</text>

        {/* ── Knobs row — bottom ── */}
        {/* Volume knob */}
        <circle cx="152" cy="115" r="12" fill="#1a1008" stroke="#3a2818" strokeWidth="1" />
        <circle cx="152" cy="115" r="10" fill="#2a1c10" />
        <circle cx="152" cy="115" r="8" fill="none" stroke="#4a3828" strokeWidth="0.5" />
        <line x1="152" y1="107" x2="152" y2="111" stroke="url(#rd-chrome)" strokeWidth="1.5" strokeLinecap="round">
          {isPlaying && (
            <animateTransform attributeName="transform" type="rotate" values="0 152 115;45 152 115" dur="2s" fill="freeze" />
          )}
        </line>
        <text x="152" y="132" textAnchor="middle" fontSize="3.5" fill="#7a6a4a" fontFamily="serif">VOL</text>

        {/* Tuning knob */}
        <circle cx="218" cy="115" r="12" fill="#1a1008" stroke="#3a2818" strokeWidth="1" />
        <circle cx="218" cy="115" r="10" fill="#2a1c10" />
        <circle cx="218" cy="115" r="8" fill="none" stroke="#4a3828" strokeWidth="0.5" />
        <line x1="218" y1="107" x2="218" y2="111" stroke="url(#rd-chrome)" strokeWidth="1.5" strokeLinecap="round" />
        <text x="218" y="132" textAnchor="middle" fontSize="3.5" fill="#7a6a4a" fontFamily="serif">TUNE</text>

        {/* ── Cassette deck slot — bottom center ── */}
        <rect x="40" y="142" width="80" height="38" rx="4" fill="#0f0a04" stroke="#2a1c10" strokeWidth="0.8" />
        <rect x="44" y="146" width="72" height="30" rx="2" fill="#1a1208" />

        {/* Cassette window */}
        <rect x="52" y="149" width="56" height="18" rx="2" fill="#0a0804" stroke="#2a1c10" strokeWidth="0.4" />

        {/* Tape reels */}
        <circle cx="68" cy="158" r="6" fill="none" stroke="#3a2818" strokeWidth="0.5" />
        <circle cx="68" cy="158" r="3" fill="#2a1c10">
          {isPlaying && (
            <animateTransform attributeName="transform" type="rotate" values="0 68 158;360 68 158" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="92" cy="158" r="6" fill="none" stroke="#3a2818" strokeWidth="0.5" />
        <circle cx="92" cy="158" r="3" fill="#2a1c10">
          {isPlaying && (
            <animateTransform attributeName="transform" type="rotate" values="0 92 158;360 92 158" dur="1.5s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Tape between reels */}
        <line x1="74" y1="158" x2="86" y2="158" stroke="#5a3a18" strokeWidth="0.5" opacity="0.6" />

        {/* ── Power LED ── */}
        <circle cx="135" cy="155" r="2.5" fill={isPlaying ? '#f59e0b' : '#2a1c10'} className="transition-colors duration-500">
          {isPlaying && (
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
        {isPlaying && (
          <circle cx="135" cy="155" r="2.5" fill="#f59e0b" filter="url(#rd-glow-amber)" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <text x="135" y="164" textAnchor="middle" fontSize="2.5" fill={isPlaying ? '#d4960a' : '#3a2818'} className="transition-colors duration-300">POWER</text>

        {/* ── Playback buttons — bottom right ── */}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={140 + i * 20} y="170" width="14" height="8" rx="2" fill="#1a1008" stroke="#3a2818" strokeWidth="0.5" />
        ))}
        <text x="147" y="176" textAnchor="middle" fontSize="3" fill="#7a6a4a">◀◀</text>
        <text x="167" y="176.5" textAnchor="middle" fontSize="4" fill={isPlaying ? '#f59e0b' : '#7a6a4a'} className="transition-colors duration-300">▶</text>
        <text x="187" y="176" textAnchor="middle" fontSize="3" fill="#7a6a4a">▶▶</text>

        {/* Feet — bottom corners */}
        <rect x="20" y="190" width="16" height="4" rx="2" fill="#2a1c10" />
        <rect x="224" y="190" width="16" height="4" rx="2" fill="#2a1c10" />
      </svg>
    </div>
  );
}

// ─── Seekable Progress Bar ─────────────────────────────────────
function SeekableProgress({
  progress,
  duration,
  currentTime,
  onSeek,
}: {
  progress: number;
  duration: number;
  currentTime: number;
  onSeek: (fraction: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  function getFraction(clientX: number) {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(getFraction(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent) {
    const frac = getFraction(e.clientX);
    setHoverX(frac);
    if (isDragging) onSeek(frac);
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  const pct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] text-muted-foreground/60 tabular-nums w-8 text-right shrink-0">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="relative flex-1 h-4 flex items-center cursor-pointer group touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { setHoverX(null); if (isDragging) setIsDragging(false); }}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-secondary/80 rounded-full" />
        {/* Filled track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-primary rounded-full"
          style={{ width: pct }}
        />
        {/* Thumb — always visible */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3.5 rounded-full bg-primary shadow-md ring-2 ring-background pointer-events-none"
          style={{ left: pct }}
        />
        {/* Hover time tooltip */}
        {hoverX !== null && duration > 0 && (
          <div
            className="absolute -top-6 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-[9px] text-popover-foreground shadow-sm pointer-events-none"
            style={{ left: `${hoverX * 100}%` }}
          >
            {formatTime(hoverX * duration)}
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/60 tabular-nums w-8 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}

// ─── Recordings List ───────────────────────────────────────────
function RecordingsList({
  recordings,
  onUpdate,
}: {
  recordings: RecordingMeta[];
  onUpdate: () => void;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const knownDurRef = useRef<number>(0);

  function startTick() {
    function tick() {
      if (!audioRef.current || audioRef.current.paused) return;
      const ct = audioRef.current.currentTime;
      const dur = isFinite(audioRef.current.duration) ? audioRef.current.duration : knownDurRef.current;
      setCurrentTime(ct);
      setProgress(dur > 0 ? Math.min(ct / dur, 1) : 0);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  const stopAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    audioRef.current = null;
    setPlayingId(null);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    setAudioDuration(0);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  async function togglePlay(rec: RecordingMeta) {
    if (playingId === rec.id) {
      if (!audioRef.current) return;
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
        startTick();
      } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    stopAudio();

    try {
      const { audioData, mimeType } = await getRecordingAudio(rec.id);
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      knownDurRef.current = rec.duration;
      setAudioDuration(rec.duration);

      audio.addEventListener('durationchange', () => {
        if (audio.duration && isFinite(audio.duration)) {
          knownDurRef.current = audio.duration;
          setAudioDuration(audio.duration);
        }
      });

      audio.addEventListener('ended', () => stopAudio());

      audio.play();
      setPlayingId(rec.id);
      setIsPaused(false);
      startTick();
    } catch {
      toast.error('Hiba a lejátszásnál');
    }
  }

  function handleSeek(fraction: number) {
    if (!audioRef.current) return;
    const dur = isFinite(audioRef.current.duration)
      ? audioRef.current.duration
      : knownDurRef.current;
    if (dur > 0) {
      audioRef.current.currentTime = fraction * dur;
      setProgress(fraction);
      setCurrentTime(fraction * dur);
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    try {
      await updateRecordingName(id, editName.trim());
      setEditingId(null);
      onUpdate();
    } catch {
      toast.error('Hiba a név módosításakor');
    }
  }

  async function confirmDelete() {
    if (deleteConfirmId == null) return;
    if (playingId === deleteConfirmId) stopAudio();
    try {
      await deleteRecording(deleteConfirmId);
      toast.success('Felvétel törölve');
      onUpdate();
    } catch {
      toast.error('Hiba a törlésnél');
    } finally {
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="w-full flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 px-1">
        Felvételek ({recordings.length})
      </p>
      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
        {recordings.map((rec) => {
          const isPlaying = playingId === rec.id;
          const isEditing = editingId === rec.id;

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-lg px-2 py-2 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Play button */}
                <button
                  onClick={() => { togglePlay(rec); }}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all ${
                    isPlaying
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {isPlaying && !isPaused ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(rec.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRename(rec.id)}>
                        <Check className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => setEditingId(null)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <TruncatedText as="p" className="text-sm font-medium leading-tight">{rec.name}</TruncatedText>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-100 transition-opacity hover-device:opacity-0 hover-device:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground/50 hover:text-foreground"
                      onClick={() => {
                        setEditingId(rec.id);
                        setEditName(rec.name);
                      }}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground/50 hover:text-destructive"
                      onClick={() => setDeleteConfirmId(rec.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Seekable progress bar — shown when playing */}
              {isPlaying && !isEditing && (
                <div className="mt-1.5 ml-11">
                  <SeekableProgress
                    progress={progress}
                    duration={audioDuration}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                  />
                </div>
              )}

              {/* Duration when not playing */}
              {!isPlaying && !isEditing && (
                <p className="text-[10px] text-muted-foreground/50 ml-11 tabular-nums">{formatTime(rec.duration)}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmId != null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertTitle>Felvétel törlése</AlertTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd ezt a felvételt? Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────
type RecState = 'idle' | 'recording' | 'naming';

interface RecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  readOnly?: boolean;
}

export function RecordingModal({ open, onOpenChange, date, readOnly = false }: RecordingModalProps) {
  const [state, setState] = useState<RecState>('idle');
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadRecordings = useCallback(async () => {
    try {
      const recs = await getRecordingsByDate(date);
      setRecordings(recs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      // IndexedDB not available
    }
  }, [date]);

  useEffect(() => {
    if (open) loadRecordings();
  }, [open, loadRecordings]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordedBlob(blob);
        setState('naming');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect data every second
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      setState('recording');
    } catch {
      toast.error('Mikrofon hozzáférés megtagadva');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleSave() {
    if (!recordedBlob || !recordingName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const audioBase64 = await blobToBase64(recordedBlob);
      await dbSave({
        date,
        name: recordingName.trim(),
        audioBase64,
        mimeType: recordedBlob.type,
        duration: elapsed,
      });
      toast.success('Felvétel mentve');
      setRecordedBlob(null);
      setRecordingName('');
      setState('idle');
      setElapsed(0);
      loadRecordings();
    } catch {
      toast.error('Hiba a mentésnél');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    setRecordedBlob(null);
    setRecordingName('');
    setState('idle');
    setElapsed(0);
  }

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setState('idle');
      setElapsed(0);
      setRecordedBlob(null);
      setRecordingName('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-border/50 gap-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Hangfelvétel</DialogTitle>

        <div className="flex flex-col px-5 pt-5 pb-4 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">
              {readOnly ? 'Emlékek' : 'Hangfelvétel'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {readOnly ? 'Korábbi próbafelvételek' : 'Próba rögzítése'}
            </p>
          </div>

          {/* Visual: Radio for readOnly, Turntable for recording */}
          {readOnly ? (
            <RetroRadioSVG isPlaying={recordings.length > 0} />
          ) : (
            <TurntableSVG isRecording={state === 'recording'} />
          )}

          {/* Timer (recording state) — only when not readOnly */}
          {!readOnly && (
            <AnimatePresence mode="wait">
              {state === 'recording' && (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-lg font-bold tabular-nums text-red-400">{formatTime(elapsed)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Controls — only when not readOnly */}
          {!readOnly && (
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl gap-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
                    onClick={startRecording}
                  >
                    <Mic className="size-4" />
                    Felvétel indítása
                  </Button>
                </motion.div>
              )}

              {state === 'recording' && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl gap-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                    onClick={stopRecording}
                  >
                    <Square className="size-4 fill-current" />
                    Leállítás
                  </Button>
                </motion.div>
              )}

              {state === 'naming' && (
                <motion.div
                  key="naming"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-3"
                >
                  <div className="text-center">
                    <p className="text-sm font-medium">Felvétel kész!</p>
                    <p className="text-xs text-muted-foreground">Időtartam: {formatTime(elapsed)}</p>
                  </div>
                  <Input
                    placeholder="Add meg a felvétel nevét..."
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    className="h-10 rounded-lg"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recordingName.trim()) handleSave();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={handleDiscard}>
                      Elvetés
                    </Button>
                    <Button
                      className="flex-1 h-10 rounded-xl gap-2"
                      onClick={handleSave}
                      disabled={!recordingName.trim()}
                      isLoading={isSaving}
                    >
                      <Save className="size-4" />
                      Mentés
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Recordings list */}
          {recordings.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <RecordingsList recordings={recordings} onUpdate={loadRecordings} />
            </div>
          )}

          {/* Empty state for readOnly when no recordings */}
          {readOnly && recordings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Nincsenek felvételek ezen a napon</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
