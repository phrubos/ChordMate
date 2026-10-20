'use client';

import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  dotClassName?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  ariaLabel: string;
  className?: string;
}

/** Pill segmented control with a sliding active indicator (spec A5). */
export function SegmentedControl<T extends string>({ value, onChange, options, size = 'md', ariaLabel, className }: SegmentedControlProps<T>) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex w-fit rounded-full border border-border-strong p-[3px]', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-[13.5px]',
              active ? 'text-background' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span layoutId={layoutId} transition={springs.indicator} className="absolute inset-0 rounded-full bg-foreground" />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {option.dotClassName && <span aria-hidden className={cn('size-2 rounded-full', option.dotClassName)} />}
              {option.label}
              {option.count !== undefined && (
                <span className={cn('font-mono text-xs tabular-nums', active ? 'text-background/70' : 'text-faint')}>{option.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
