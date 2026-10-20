import type { CSSProperties } from 'react';
import { beatIntervalMs } from '@/lib/practice';

/** A4: four beat dots driven by a CSS keyframe (`--beat` = one beat); beat 1 is amber. */
export function BeatDots({ bpm, playing }: { bpm: number | null | undefined; playing: boolean }) {
  return (
    <span
      // Remount on start / tempo change so the keyframe restarts on beat 1.
      key={`${playing}-${bpm}`}
      aria-hidden
      data-playing={playing}
      className="beat-dots inline-flex items-center gap-1 md:gap-1.5"
      style={{ '--beat': `${beatIntervalMs(bpm)}ms` } as CSSProperties}
    >
      {[0, 1, 2, 3].map((i) => (
        <i
          key={i}
          className="beat-dot size-1.5 rounded-full"
          style={{ '--i': i, '--dot-on': i === 0 ? 'var(--primary)' : 'var(--foreground)' } as CSSProperties}
        />
      ))}
    </span>
  );
}
