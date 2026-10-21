'use client';

import { useId } from 'react';
import { motion, type MotionValue } from 'motion/react';

/*
 * Walnut turntable, drawn top-down with one light source (top left).
 * Geometry is in stage pixels (760×580, see TurntableScene).
 */
export const PLINTH = { x: 318, y: 176, w: 420, h: 390 };
export const PLATTER = { cx: 520, cy: 372, r: 146 };
/** Tonearm pivot; the stylus sits ARM.len below it when the arm is at 0°. */
export const ARM = { x: 692, y: 236, len: 230, cue: 19, end: 25 };
/** Arm SVG box, pivot at (BOX.px, BOX.py). */
const BOX = { w: 80, h: 300, px: 40, py: 60 };

const MAT_R = PLATTER.r - 9;
const P = { x: PLATTER.cx - PLINTH.x, y: PLATTER.cy - PLINTH.y };
const PIVOT = { x: ARM.x - PLINTH.x, y: ARM.y - PLINTH.y };

/** Brushed aluminium: anisotropic highlights that stay put while the platter turns. */
const BRUSHED =
  'conic-gradient(from 200deg, var(--alu-lo), var(--alu-hi) 45deg, var(--alu) 85deg, var(--alu-lo) 140deg, var(--alu) 200deg, var(--alu-hi) 225deg, var(--alu) 265deg, var(--alu-lo) 320deg, var(--alu-lo))';
const STROBE = 'repeating-conic-gradient(var(--alu-lo) 0 1.5deg, transparent 1.5deg 5deg)';
const ring = (inner: number, outer: number) =>
  `radial-gradient(circle, transparent 0 ${inner - 0.5}px, black ${inner}px ${outer}px, transparent ${outer + 0.5}px)`;
const MAT =
  'radial-gradient(circle at 35% 30%, color-mix(in oklch, var(--alu-hi) 7%, transparent), transparent 60%), repeating-radial-gradient(circle, var(--rubber) 0 3px, color-mix(in oklch, var(--rubber), var(--vinyl) 60%) 3px 4px)';

const stop = (offset: string, color: string, opacity?: number) => (
  <stop offset={offset} style={{ stopColor: `var(${color})`, stopOpacity: opacity }} />
);

export function Deck({ spin }: { spin: MotionValue<number> }) {
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `${id}-${name}`;

  return (
    <div
      className="absolute rounded-[16px] shadow-[18px_30px_60px_-14px_oklch(0_0_0/.7),4px_6px_10px_oklch(0_0_0/.35)]"
      style={{ left: PLINTH.x, top: PLINTH.y, width: PLINTH.w, height: PLINTH.h }}
    >
      <svg width={PLINTH.w} height={PLINTH.h} className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id={u('wood')} x1="0" y1="0" x2="1" y2="1">
            {stop('0', '--walnut-hi')}
            {stop('.5', '--walnut')}
            {stop('1', '--walnut-lo')}
          </linearGradient>
          <radialGradient id={u('light')} cx=".15" cy=".1" r=".9">
            {stop('0', '--alu-hi', 0.16)}
            {stop('.6', '--alu-hi', 0)}
          </radialGradient>
          <filter id={u('grain')} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005 0.14" numOctaves="3" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.05" />
          </filter>
          <filter id={u('figure')} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.002 0.03" numOctaves="2" seed="3" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2 0 0 0 -1.15" />
          </filter>
          <radialGradient id={u('knob')} cx=".35" cy=".3" r=".75">
            {stop('0', '--alu-hi')}
            {stop('.55', '--alu')}
            {stop('1', '--alu-lo')}
          </radialGradient>
          <linearGradient id={u('key')} x1="0" y1="0" x2="0" y2="1">
            {stop('0', '--alu-hi')}
            {stop('1', '--alu')}
          </linearGradient>
          <clipPath id={u('clip')}>
            <rect width={PLINTH.w} height={PLINTH.h} rx="16" />
          </clipPath>
        </defs>

        {/* Walnut plinth: base tone, grain, figure, light falloff, bevel */}
        <g clipPath={`url(#${u('clip')})`}>
          <rect width={PLINTH.w} height={PLINTH.h} fill={`url(#${u('wood')})`} />
          <rect width={PLINTH.w} height={PLINTH.h} filter={`url(#${u('grain')})`} opacity=".38" />
          <rect width={PLINTH.w} height={PLINTH.h} filter={`url(#${u('figure')})`} opacity=".06" />
          <rect width={PLINTH.w} height={PLINTH.h} fill={`url(#${u('light')})`} />
        </g>
        <rect x=".75" y=".75" width={PLINTH.w - 1.5} height={PLINTH.h - 1.5} rx="15.5" fill="none" strokeWidth="1.5" style={{ stroke: 'color-mix(in oklch, var(--walnut-hi), var(--alu-hi) 22%)' }} opacity=".45" />
        <rect x="3" y="3" width={PLINTH.w - 6} height={PLINTH.h - 6} rx="13" fill="none" strokeWidth="1" style={{ stroke: 'var(--walnut-lo)' }} opacity=".6" />

        {/* Platter well shadow */}
        <circle cx={P.x + 4} cy={P.y + 7} r={PLATTER.r + 2} style={{ fill: 'var(--walnut-lo)' }} opacity=".7" />

        {/* Engraved badge */}
        <text x="26" y="36" className="font-display text-[15px] italic" style={{ fill: 'var(--walnut-lo)' }}>ChordMate</text>
        <text x="26" y="35" className="font-display text-[15px] italic" style={{ fill: 'var(--walnut-hi)' }} opacity=".9">ChordMate</text>

        {/* Tonearm base: gimbal plate, height ring, anti-skate, cue lever, arm rest */}
        <circle cx={PIVOT.x + 3} cy={PIVOT.y + 5} r="33" style={{ fill: 'var(--walnut-lo)' }} opacity=".8" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="32" fill={`url(#${u('knob')})`} />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="24" fill="none" strokeWidth="3" strokeDasharray="1.2 1.6" style={{ stroke: 'var(--alu-lo)' }} />
        <circle cx={PIVOT.x} cy={PIVOT.y} r="18" style={{ fill: 'var(--rubber)' }} />
        <circle cx={PIVOT.x - 30} cy={PIVOT.y + 52} r="9" fill={`url(#${u('knob')})`} />
        <path d={`M${PIVOT.x - 30} ${PIVOT.y + 45}v4`} strokeWidth="1.5" strokeLinecap="round" style={{ stroke: 'var(--alu-lo)' }} />
        <text x={PIVOT.x - 30} y={PIVOT.y + 72} textAnchor="middle" className="font-mono text-[6px] tracking-[0.12em]" style={{ fill: 'var(--walnut-hi)' }}>ANTI-SKATE</text>
        <rect x={PIVOT.x + 20} y={PIVOT.y + 62} width="7" height="24" rx="3" fill={`url(#${u('key')})`} />
        <rect x={PIVOT.x + 21.5} y={PIVOT.y + 56} width="4" height="10" rx="2" style={{ fill: 'var(--rubber)' }} />
        <circle cx={PIVOT.x + 1} cy={PIVOT.y + 175} r="6" fill={`url(#${u('knob')})`} />
        <path d={`M${PIVOT.x - 8} ${PIVOT.y + 175}h3m12 0h3`} strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--rubber)' }} />

        {/* Pitch fader (below the arm's rest position) */}
        <rect x="392" y="294" width="10" height="80" rx="5" style={{ fill: 'var(--walnut-lo)' }} />
        <rect x="395.5" y="298" width="3" height="72" rx="1.5" style={{ fill: 'var(--rubber)' }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M${i === 3 ? 380 : 383} ${302 + i * 11}h6`} strokeWidth="1" style={{ stroke: 'var(--walnut-hi)' }} opacity={i === 3 ? 0.9 : 0.5} />
        ))}
        <rect x="385" y="329" width="24" height="12" rx="2" fill={`url(#${u('key')})`} />
        <path d="M387 335h20" strokeWidth="1" style={{ stroke: 'var(--alu-lo)' }} />
        <text x="397" y="384" textAnchor="middle" className="font-mono text-[6px] tracking-[0.12em]" style={{ fill: 'var(--walnut-hi)' }}>PITCH</text>

        {/* Start / stop and speed keys */}
        <rect x="24" y="339" width="66" height="30" rx="3" style={{ fill: 'var(--walnut-lo)' }} opacity=".8" />
        <rect x="22" y="336" width="66" height="30" rx="3" fill={`url(#${u('key')})`} />
        <text x="55" y="354" textAnchor="middle" className="font-mono text-[6.5px] tracking-[0.14em]" style={{ fill: 'var(--alu-lo)' }}>START·STOP</text>
        {[98, 134].map((x, i) => (
          <g key={x}>
            <rect x={x + 1.5} y="347" width="30" height="18" rx="2.5" style={{ fill: 'var(--walnut-lo)' }} opacity=".8" />
            <rect x={x} y="345" width="30" height="18" rx="2.5" fill={`url(#${u('key')})`} />
            <text x={x + 15} y="357" textAnchor="middle" className="font-mono text-[7.5px]" style={{ fill: 'var(--alu-lo)' }}>{i === 0 ? '33' : '45'}</text>
          </g>
        ))}
        <circle cx="113" cy="337" r="2.2" style={{ fill: 'var(--walnut-lo)' }} />
      </svg>

      {/* Speed lamp above the 33 key; lit while playing */}
      <span
        data-part="led"
        className="absolute size-[4.4px] rounded-full bg-primary opacity-0 shadow-[0_0_6px_1px_var(--primary)]"
        style={{ left: 113 - 2.2, top: 337 - 2.2 }}
      />

      {/* Platter: brushed rim with turning strobe dots, ribbed rubber mat, spindle */}
      <div
        className="absolute rounded-full shadow-[inset_0_0_0_1px_oklch(0_0_0/.35)]"
        style={{ left: P.x - PLATTER.r, top: P.y - PLATTER.r, width: PLATTER.r * 2, height: PLATTER.r * 2, backgroundImage: BRUSHED }}
      >
        <motion.div className="absolute inset-0 rounded-full" style={{ rotate: spin, backgroundImage: STROBE, maskImage: ring(PLATTER.r - 7, PLATTER.r - 2) }} />
        <div
          className="absolute rounded-full shadow-[0_0_0_1px_oklch(0_0_0/.4),inset_0_2px_6px_oklch(0_0_0/.6)]"
          style={{ inset: PLATTER.r - MAT_R, backgroundImage: MAT }}
        />
        <div className="absolute top-1/2 left-1/2 size-[9px] -translate-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--alu-hi),var(--alu-lo))] shadow-[1px_2px_2px_oklch(0_0_0/.6)]" />
      </div>
    </div>
  );
}

/** S-shaped tonearm with counterweight and an amber cartridge. Rotates about its pivot. */
export function Tonearm() {
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `${id}-${name}`;
  const tube = `M${BOX.px} ${BOX.py} C${BOX.px} ${BOX.py + 60} ${BOX.px + 10} ${BOX.py + 92} ${BOX.px + 7} ${BOX.py + 138} C${BOX.px + 5} ${BOX.py + 170} ${BOX.px - 4} ${BOX.py + 180} ${BOX.px - 2} ${BOX.py + 198}`;

  return (
    <div
      data-part="arm"
      className="absolute drop-shadow-[7px_11px_4px_oklch(0_0_0/.5)]"
      style={{ left: ARM.x - BOX.px, top: ARM.y - BOX.py, width: BOX.w, height: BOX.h, transformOrigin: `${BOX.px}px ${BOX.py}px`, zIndex: 30 }}
    >
      <svg width={BOX.w} height={BOX.h} className="overflow-visible">
        <defs>
          <linearGradient id={u('cyl')} x1="0" y1="0" x2="1" y2="0">
            {stop('0', '--alu-lo')}
            {stop('.35', '--alu-hi')}
            {stop('.7', '--alu')}
            {stop('1', '--alu-lo')}
          </linearGradient>
          <radialGradient id={u('cap')} cx=".35" cy=".3" r=".75">
            {stop('0', '--alu-hi')}
            {stop('1', '--alu-lo')}
          </radialGradient>
        </defs>
        {/* Counterweight */}
        <path d={`M${BOX.px} ${BOX.py}V${BOX.py - 26}`} strokeWidth="6" style={{ stroke: 'var(--alu)' }} />
        <rect x={BOX.px - 14} y="2" width="28" height="32" rx="4" fill={`url(#${u('cyl')})`} />
        {[9, 14, 19, 24].map((y) => (
          <path key={y} d={`M${BOX.px - 14} ${y}h28`} strokeWidth=".8" style={{ stroke: 'var(--alu-lo)' }} opacity=".7" />
        ))}
        {/* Tube with a specular line */}
        <path d={tube} fill="none" strokeWidth="5" strokeLinecap="round" style={{ stroke: 'var(--alu)' }} />
        <path d={tube} fill="none" strokeWidth="1.4" strokeLinecap="round" transform="translate(-1.2 0)" style={{ stroke: 'var(--alu-hi)' }} />
        {/* Headshell, finger lift, cartridge, stylus at (px, py + ARM.len) */}
        <rect x={BOX.px - 7} y={BOX.py + 194} width="10" height="8" rx="2" style={{ fill: 'var(--alu-lo)' }} />
        <path
          d={`M${BOX.px - 9} ${BOX.py + 200}h15l2 26q-8 7-16 4z`}
          strokeWidth=".8"
          style={{ fill: 'var(--rubber)', stroke: 'var(--alu)' }}
        />
        <path d={`M${BOX.px + 7} ${BOX.py + 207}l12-4`} strokeWidth="2.4" strokeLinecap="round" style={{ stroke: 'var(--alu)' }} />
        <rect x={BOX.px - 6} y={BOX.py + 210} width="11" height="15" rx="2" className="fill-primary" />
        <circle cx={BOX.px} cy={BOX.py + ARM.len - 1} r="1.4" style={{ fill: 'var(--alu-hi)' }} />
        {/* Gimbal cap */}
        <circle cx={BOX.px} cy={BOX.py} r="12" fill={`url(#${u('cap')})`} />
        <circle cx={BOX.px} cy={BOX.py} r="4.5" style={{ fill: 'var(--alu-lo)' }} />
      </svg>
    </div>
  );
}
