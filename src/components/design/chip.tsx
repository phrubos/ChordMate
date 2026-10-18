import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Chip({ children, title, className }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={cn('font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums', className)}>
      {children}
    </span>
  );
}

/** Renders non-empty chips separated by a middle dot. */
export function ChipList({ items, className }: { items: (ReactNode | null | undefined | false)[]; className?: string }) {
  const visible = items.filter((item) => item !== null && item !== undefined && item !== false && item !== '');
  if (visible.length === 0) return null;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      {visible.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-faint">·</span>}
          <Chip>{item}</Chip>
        </span>
      ))}
    </span>
  );
}
