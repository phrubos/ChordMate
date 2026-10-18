import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Eyebrow } from './eyebrow';

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}

/** Hairline-ruled section heading: eyebrow + Fraunces title + 28×2 amber rule. */
export function SectionHeader({ eyebrow, title, actions, as: Tag = 'h2', className }: SectionHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-3 border-t border-border-strong pt-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Tag className="display-soft font-display text-[26px] leading-tight font-medium tracking-[-0.01em] after:mt-2.5 after:block after:h-0.5 after:w-7 after:bg-primary">
          {title}
        </Tag>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
