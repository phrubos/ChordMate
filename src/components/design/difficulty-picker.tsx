'use client';

import { cn } from '@/lib/utils';
import { difficultyLabel } from '@/lib/song-meta';

const HEIGHTS = ['h-[8px]', 'h-[12px]', 'h-[16px]', 'h-[20px]', 'h-[24px]'];

/** 1–5 difficulty as a radio group drawn like DifficultyMeter. */
export function DifficultyPicker({ value, onChange }: { value: number; onChange: (level: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Nehézség" className="inline-flex items-end gap-1">
        {HEIGHTS.map((h, i) => {
          const level = i + 1;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={value === level}
              aria-label={`${difficultyLabel(level)} (${level}/5)`}
              onClick={() => onChange(level)}
              className="group grid h-10 w-7 place-items-end justify-center pb-2 outline-none"
            >
              <span
                className={cn(
                  'w-2 rounded-[2px] transition-colors duration-(--dur-fade) group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  h,
                  level <= value ? 'bg-primary' : 'bg-border-strong group-hover:bg-muted-foreground'
                )}
              />
            </button>
          );
        })}
      </div>
      <span className="text-[13.5px] text-muted-foreground" aria-live="polite">
        {difficultyLabel(value)} · {value}/5
      </span>
    </div>
  );
}
