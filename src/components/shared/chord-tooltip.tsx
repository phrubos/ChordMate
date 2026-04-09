'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { chordDiagrams, type ChordDiagram } from '@/lib/chord-diagrams';

function ChordDiagramSVG({ chord }: { chord: ChordDiagram }) {
  const stringX = [20, 34, 48, 62, 76, 90];
  const fretY = [28, 48, 68, 88, 108];
  const fretHeight = 20;

  // Find the min fret to determine position
  const playedFrets = chord.frets.filter((f) => f > 0);
  const minFret = Math.min(...playedFrets);
  const maxFret = Math.max(...playedFrets);
  const needsOffset = maxFret > 4;
  const baseFret = needsOffset ? minFret : 1;

  return (
    <svg width="110" height="140" viewBox="0 0 110 140" className="block">
      {/* Chord name */}
      <text x="55" y="14" textAnchor="middle" className="fill-foreground text-xs font-bold">
        {chord.name}
      </text>

      {/* Nut or fret indicator */}
      {baseFret === 1 ? (
        <line x1="17" y1="24" x2="93" y2="24" stroke="currentColor" strokeWidth="3" className="text-foreground" />
      ) : (
        <text x="10" y="38" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '9px' }}>
          {baseFret}
        </text>
      )}

      {/* Fret lines */}
      {fretY.map((y, i) => (
        <line key={`fret-${i}`} x1="20" y1={y} x2="90" y2={y} stroke="currentColor" strokeWidth="1" className="text-border" />
      ))}

      {/* String lines */}
      {stringX.map((x, i) => (
        <line key={`str-${i}`} x1={x} y1="24" x2={x} y2="108" stroke="currentColor" strokeWidth="1" className="text-border" />
      ))}

      {/* Open/muted markers */}
      {chord.frets.map((fret, i) => {
        if (fret === 0) {
          return (
            <circle key={`open-${i}`} cx={stringX[i]} cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
          );
        }
        if (fret === -1) {
          return (
            <text key={`mute-${i}`} x={stringX[i]} y="21" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }}>
              ×
            </text>
          );
        }
        return null;
      })}

      {/* Finger dots */}
      {chord.frets.map((fret, i) => {
        if (fret <= 0) return null; // open or muted, handled earlier


        // Which relative "row" in the 5-fret diagram are we drawing on?
        // If fret = 1 and baseFret = 1, we want row 0.
        // If fret = 3 and baseFret = 1, we want row 2.
        const rowIndex = fret - baseFret;
        if (rowIndex < 0 || rowIndex >= 5) return null; // Out of bounds of the drawn 5 frets

        // The nut/start line is at y=24. Each fret block is `fretHeight` (20) tall.
        // We want the dot centered in that block.
        const y = 24 + rowIndex * fretHeight + fretHeight / 2;

        // Extract finger if specified
        const finger = chord.fingers && chord.fingers[i] > 0 ? chord.fingers[i] : null;

        return (
          <g key={`dot-${i}`}>
            <circle cx={stringX[i]} cy={y} r="7" className="fill-primary" />
            {finger && (
              <text x={stringX[i]} y={y + 3} textAnchor="middle" className="fill-primary-foreground font-bold" style={{ fontSize: '9px' }}>
                {finger}
              </text>
            )}
          </g>
        );
      })}

      {/* Tuning labels */}
      {['E', 'A', 'D', 'G', 'B', 'e'].map((note, i) => (
        <text key={`tune-${i}`} x={stringX[i]} y="122" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '8px' }}>
          {note}
        </text>
      ))}
    </svg>
  );
}

const TOOLTIP_W = 126; // 110 svg + 16 padding
const TOOLTIP_H = 156; // 140 svg + 16 padding
const GAP = 8;

interface ChordTooltipProps {
  chordName: string;
  children: React.ReactNode;
}

export function ChordTooltip({ chordName, children }: ChordTooltipProps) {
  const chord = chordDiagrams[chordName];
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;

    // Prefer above
    if (rect.top - TOOLTIP_H - GAP > 0) {
      top = rect.top - TOOLTIP_H - GAP;
    }
    // Below if no room above
    else if (rect.bottom + TOOLTIP_H + GAP < vh) {
      top = rect.bottom + GAP;
    }
    // Fallback: pin to top of viewport
    else {
      top = GAP;
    }

    // Center horizontally on the trigger
    left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    // Clamp to viewport edges
    if (left < 4) left = 4;
    if (left + TOOLTIP_W > vw - 4) left = vw - TOOLTIP_W - 4;

    setPos({ top, left });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  if (!chord) return <>{children}</>;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline"
      >
        {children}
      </span>
      {pos && mounted && createPortal(
        <span
          className="fixed z-[200] rounded-xl border border-border/50 bg-card p-2 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <ChordDiagramSVG chord={chord} />
        </span>,
        document.body
      )}
    </>
  );
}
