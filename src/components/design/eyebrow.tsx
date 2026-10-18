import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: ReactNode;
  accent?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Eyebrow({ children, accent, icon, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs font-medium tracking-[0.1em] uppercase [&_svg]:size-3.5',
        accent ? 'text-primary-text' : 'text-muted-foreground',
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
