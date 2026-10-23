'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { ease } from '@/lib/motion';
import { formatElapsed } from '@/lib/practice';
import { cn } from '@/lib/utils';

function Elapsed() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden items-center gap-1.5 font-mono text-[13px] text-muted-foreground tabular-nums sm:inline-flex" aria-label="Eltelt idő">
      <Clock className="size-3.5" aria-hidden />
      {formatElapsed(now - start)}
    </span>
  );
}

/** × exit, segmented progress (A3: current segment grows from the left), i/n, elapsed time. */
export function PracticeTopBar({ index, total, animate, exitHref }: { index: number; total: number; animate: boolean; exitHref: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-3 md:h-[68px] md:gap-5 md:px-5">
      <Link href={exitHref} aria-label="Kilépés a próba módból" className="grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground">
        <X className="size-5" />
      </Link>
      <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Haladás a setlistben" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-border-strong">
            {k < index && <span className="absolute inset-0 bg-primary/60" />}
            {k === index && (
              <motion.span
                key={index}
                className="absolute inset-0 origin-left bg-primary"
                initial={animate ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: ease.inOut }}
              />
            )}
          </span>
        ))}
      </div>
      <span className={cn('font-mono text-[15px] font-semibold tabular-nums')}>
        {index + 1}
        <span className="text-faint">/{total}</span>
      </span>
      <Elapsed />
    </header>
  );
}
