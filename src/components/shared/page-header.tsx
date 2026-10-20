import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/design/eyebrow';

interface PageHeaderProps {
  title: ReactNode;
  /** Shown as the mono eyebrow above the title. */
  description?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {description && <Eyebrow>{description}</Eyebrow>}
        <h1 className="display-soft font-display text-[40px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[60px]">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
