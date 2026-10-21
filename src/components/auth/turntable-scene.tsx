'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, stagger, useAnimate, useMotionValue, useReducedMotion } from 'motion/react';
import type { LoginAlbum } from '@/lib/login-albums';
import { ARM, Deck, PLATTER, Tonearm } from './turntable-deck';

/*
 * A10 — login turntable (spec §6). Fixed 760×580 stage, scaled to fit its box.
 * One cycle: sleeve pops up → record slides out → carried onto the platter →
 * tonearm cues, record spins while the caption shows → arm returns, next album.
 */
const W = 760;
const H = 580;
const SLEEVE = { x: 24, y: 32, size: 276 };
const RECORD = 264;
const LABEL_R = 46;

const RECORD_X = SLEEVE.x + (SLEEVE.size - RECORD) / 2;
const RECORD_Y = SLEEVE.y + (SLEEVE.size - RECORD) / 2;
/** Fully clear of the sleeve. */
const SLIDE_X = SLEEVE.size + 8;
/** Record centre → platter centre. */
const DX = PLATTER.cx - (RECORD_X + RECORD / 2);
const DY = PLATTER.cy - (RECORD_Y + RECORD / 2);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
/** 33⅓ rpm. Spin-up/down use quadratic easing so the speed joins the loop without a jump. */
const TURN_S = 1.8;
const PLAY_S = 5.5;
const HOLD_REDUCED_MS = 7000;

const SLEEVE_SEL = '[data-part="sleeve"]';
const RECORD_SEL = '[data-part="record"]';
const ARM_SEL = '[data-part="arm"]';
const CAPTION_SEL = '[data-part="caption"] > *';
const LED_SEL = '[data-part="led"]';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const nextPaint = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const whenVisible = () =>
  new Promise<void>((resolve) => {
    if (document.visibilityState === 'visible') return resolve();
    const on = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', on);
      resolve();
    };
    document.addEventListener('visibilitychange', on);
  });

async function preload(src: string) {
  try {
    const img = new window.Image();
    img.src = src;
    await Promise.race([img.decode(), sleep(6000).then(() => Promise.reject(new Error('timeout')))]);
    return true;
  } catch {
    return false;
  }
}

const RECORD_SURFACE = [
  // track gaps and the smooth lead-in / run-out bands
  `radial-gradient(circle, transparent 0 ${LABEL_R + 4}px, var(--vinyl) ${LABEL_R + 4}px ${LABEL_R + 12}px, transparent ${LABEL_R + 12}px 74px, var(--vinyl) 74px 76px, transparent 76px 95px, var(--vinyl) 95px 97px, transparent 97px 113px, var(--vinyl) 113px 115px, transparent 115px 127px, var(--vinyl) 127px)`,
  'repeating-radial-gradient(circle, var(--vinyl) 0, var(--groove) 1.5px, var(--vinyl) 3px)',
].join(', ');

/** Light from the top left: two opposite specular lobes that stay put while the record turns. */
const SHEEN =
  'conic-gradient(from 0deg, transparent 0deg 110deg, color-mix(in oklch, var(--alu-hi) 16%, transparent) 135deg, transparent 165deg 290deg, color-mix(in oklch, var(--alu-hi) 30%, transparent) 315deg, transparent 345deg)';

export function TurntableScene({ albums, className }: { albums: LoginAlbum[]; className?: string }) {
  const [current, setCurrent] = useState(albums[0]);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const boxRef = useRef<HTMLDivElement>(null);
  const spin = useMotionValue(0);
  const reduce = useReducedMotion();

  // Scale the fixed stage to the box width; the stage stays hidden until measured.
  useEffect(() => {
    const box = boxRef.current;
    const stage = scope.current;
    if (!box || !stage) return;
    const ro = new ResizeObserver(([entry]) => {
      stage.style.setProperty('--k', String(entry.contentRect.width / W));
      stage.style.visibility = 'visible';
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [scope]);

  useEffect(() => {
    let alive = true;
    let turning: { stop: () => void } | null = null;
    // Every await goes through `live`, so a cancelled run stops at the next step.
    const ABORT = Symbol('abort');
    const live = async <T,>(p: PromiseLike<T> | T): Promise<T> => {
      const v = await p;
      if (!alive) throw ABORT;
      return v;
    };

    async function show(album: LoginAlbum) {
      if (!(await live(preload(album.cover)))) {
        await live(sleep(800));
        return false;
      }
      setCurrent(album);
      await live(nextPaint());
      return true;
    }

    async function cycleReduced(album: LoginAlbum) {
      if (!(await show(album))) return;
      await live(Promise.all([
        animate(SLEEVE_SEL, { opacity: 1 }, { duration: 0.4 }),
        animate(RECORD_SEL, { opacity: 1 }, { duration: 0.4 }),
        animate(CAPTION_SEL, { opacity: 1 }, { duration: 0.4 }),
      ]));
      await live(sleep(HOLD_REDUCED_MS));
      await live(Promise.all([
        animate(SLEEVE_SEL, { opacity: 0 }, { duration: 0.3 }),
        animate(RECORD_SEL, { opacity: 0 }, { duration: 0.3 }),
        animate(CAPTION_SEL, { opacity: 0 }, { duration: 0.3 }),
      ]));
    }

    async function cycle(album: LoginAlbum) {
      // Reset: record tucked inside an invisible sleeve, arm on its rest.
      animate(RECORD_SEL, { x: 0, y: 0, scale: 1, opacity: 1 }, { duration: 0 });
      animate(SLEEVE_SEL, { opacity: 0, y: 28, scale: 0.94, rotate: -7 }, { duration: 0 });
      animate(ARM_SEL, { rotate: 0, scale: 1 }, { duration: 0 });
      animate(CAPTION_SEL, { opacity: 0, y: 10 }, { duration: 0 });
      spin.set(0);
      if (!(await show(album))) return;

      // 1. The sleeve pops up.
      await live(animate(SLEEVE_SEL, { opacity: 1, y: 0, scale: 1, rotate: -2 }, { type: 'spring', duration: 0.8, bounce: 0.25 }));
      await live(sleep(350));
      // 2. The record slides out of it.
      await live(animate(RECORD_SEL, { x: SLIDE_X }, { duration: 1, ease: EASE_IN_OUT }));
      // 3. Lifted (slight scale-up) and laid onto the platter; the sleeve leans back.
      animate(SLEEVE_SEL, { rotate: -4, scale: 0.97 }, { duration: 0.9, ease: EASE_OUT });
      await live(animate(RECORD_SEL, { x: DX, y: DY, scale: [1, 1.06, 1] }, { duration: 1.1, ease: EASE_IN_OUT }));
      // 4. Start: the platter spins up, the caption appears, the arm cues and drops.
      animate(LED_SEL, { opacity: 1 }, { duration: 0.2 });
      animate(CAPTION_SEL, { opacity: 1, y: 0 }, { duration: 0.5, ease: EASE_OUT, delay: stagger(0.08) });
      const spinUp = animate(spin, 180, { duration: TURN_S, ease: (t) => t * t });
      await live(animate(ARM_SEL, { rotate: ARM.cue, scale: 1.04 }, { duration: 1.2, ease: EASE_IN_OUT }));
      await live(animate(ARM_SEL, { scale: 1 }, { duration: 0.3, ease: EASE_OUT }));
      await live(spinUp);
      turning = animate(spin, [180, 540], { duration: TURN_S, ease: 'linear', repeat: Infinity });
      // 5. Play: the stylus tracks slowly inwards.
      await live(animate(ARM_SEL, { rotate: ARM.end }, { duration: PLAY_S, ease: 'linear' }));
      // 6. Stop: arm lifts and returns, platter spins down.
      await live(animate(ARM_SEL, { scale: 1.04 }, { duration: 0.25, ease: EASE_OUT }));
      animate(CAPTION_SEL, { opacity: 0, y: -6 }, { duration: 0.3, ease: EASE_OUT });
      animate(LED_SEL, { opacity: 0 }, { duration: 0.3 });
      await live(animate(ARM_SEL, { rotate: 0, scale: 1 }, { duration: 1, ease: EASE_IN_OUT }));
      turning.stop();
      turning = null;
      await live(animate(spin, spin.get() + 100, { duration: 1.1, ease: (t) => 1 - (1 - t) * (1 - t) }));
      // 7. Record and sleeve leave.
      await live(Promise.all([
        animate(RECORD_SEL, { y: DY - 30, scale: 1.04, opacity: 0 }, { duration: 0.55, ease: EASE_OUT }),
        animate(SLEEVE_SEL, { opacity: 0, y: -14, scale: 0.96 }, { duration: 0.5, ease: EASE_OUT, delay: 0.1 }),
      ]));
      await live(sleep(250));
    }

    async function run() {
      if (reduce) {
        // Static deck: record on the platter, arm on the record; only crossfades.
        animate(RECORD_SEL, { x: DX, y: DY, opacity: 0 }, { duration: 0 });
        animate(ARM_SEL, { rotate: (ARM.cue + ARM.end) / 2 }, { duration: 0 });
        animate(CAPTION_SEL, { opacity: 0, y: 0 }, { duration: 0 });
        animate(LED_SEL, { opacity: 1 }, { duration: 0 });
      }
      for (let i = 0; alive; i++) {
        await live(whenVisible());
        const album = albums[i % albums.length];
        await (reduce ? cycleReduced(album) : cycle(album));
      }
    }

    run().catch((e) => {
      if (e !== ABORT) throw e;
    });
    return () => {
      alive = false;
      turning?.stop();
    };
  }, [albums, animate, reduce, spin]);

  return (
    <div ref={boxRef} aria-hidden className={className} style={{ aspectRatio: `${W} / ${H}` }}>
      <div
        ref={scope}
        className="invisible relative origin-top-left [transform:scale(var(--k,1))]"
        style={{ width: W, height: H }}
      >
        <Deck spin={spin} />

        {/* Record: grooves + label spin, sheen stays still */}
        <div
          data-part="record"
          className="absolute rounded-full opacity-0 shadow-[6px_12px_18px_-4px_oklch(0_0_0/.65),inset_0_0_0_1px_color-mix(in_oklch,var(--alu-hi)_14%,transparent)]"
          style={{ left: RECORD_X, top: RECORD_Y, width: RECORD, height: RECORD, zIndex: 10, backgroundColor: 'var(--vinyl)' }}
        >
          <motion.div className="absolute inset-0 rounded-full" style={{ rotate: spin, backgroundImage: RECORD_SURFACE }}>
            <div className="absolute overflow-hidden rounded-full shadow-[0_0_0_1px_oklch(0_0_0/.5)]" style={{ inset: RECORD / 2 - LABEL_R }}>
              <Image src={current.cover} alt="" fill unoptimized sizes={`${LABEL_R * 2}px`} className="object-cover" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_oklch(0_0_0/.45)]" />
            </div>
            <div className="absolute top-1/2 left-1/2 size-[9px] -translate-1/2 rounded-full bg-vinyl" />
          </motion.div>
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ backgroundImage: SHEEN, maskImage: `radial-gradient(circle, transparent ${LABEL_R + 2}px, black ${LABEL_R + 3}px)` }}
          />
        </div>

        {/* Sleeve */}
        <div
          data-part="sleeve"
          className="absolute overflow-hidden rounded-[3px] opacity-0 shadow-[14px_24px_40px_-10px_oklch(0_0_0/.65),3px_5px_8px_oklch(0_0_0/.3)]"
          style={{ left: SLEEVE.x, top: SLEEVE.y, width: SLEEVE.size, height: SLEEVE.size, zIndex: 20 }}
        >
          <Image src={current.cover} alt="" fill unoptimized sizes={`${SLEEVE.size}px`} className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,color-mix(in_oklch,var(--alu-hi)_16%,transparent),transparent_38%)]" />
        </div>

        <Tonearm />

        {/* Caption */}
        <div data-part="caption" className="absolute flex flex-col gap-2" style={{ left: SLEEVE.x, top: SLEEVE.y + SLEEVE.size + 34, width: SLEEVE.size + 10 }}>
          <span className="font-mono text-[12px] tracking-[0.16em] text-primary-text uppercase opacity-0">Most szól · {current.year}</span>
          <span className="display-soft line-clamp-2 font-display text-[34px] leading-[1.02] font-normal tracking-[-0.02em] text-balance italic opacity-0">
            {current.album}
          </span>
          <span className="text-[16px] text-muted-foreground opacity-0">{current.artist}</span>
        </div>
      </div>
    </div>
  );
}
