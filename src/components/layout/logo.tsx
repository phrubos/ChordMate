import { cn } from '@/lib/utils';

/** Shared guitar silhouette, drawn upright on a 24 grid (headstock at top). */
export const GUITAR_BODY = 'M8.9 15.2C7.5 14 7.9 9.5 12 9.5s4.5 4.5 3.1 5.7c2.6 1.2 2.4 7.8-3.1 7.8s-5.7-6.6-3.1-7.8z';

/**
 * Brand mark: amber tile with an acoustic guitar. `strum` plays the A11 strum
 * once on mount, or on hover of the mark / its parent link (hover devices only).
 */
export function LogoMark({ className, strum = 'hover' }: { className?: string; strum?: 'hover' | 'mount' }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden data-strum={strum} className={cn('logo-mark size-[30px] shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <g className="logo-guitar">
        <g transform="translate(16.2 15.8) rotate(45) scale(1.24) translate(-12 -11.8)">
          <path d="M12 10V3.4" strokeWidth="2" strokeLinecap="round" className="stroke-primary-foreground" />
          <path d="M10.6.6h2.8l-.3 3.2h-2.2z" strokeWidth=".8" strokeLinejoin="round" className="fill-primary-foreground stroke-primary-foreground" />
          <path d={GUITAR_BODY} className="fill-primary-foreground" />
          <circle cx="12" cy="14.2" r="1.55" className="fill-primary" />
          <path d="M10.6 19.4h2.8" strokeWidth="1.1" strokeLinecap="round" className="stroke-primary" />
          <path d="M12 2.6v16.8" strokeWidth=".55" className="logo-string stroke-primary" />
        </g>
      </g>
    </svg>
  );
}
