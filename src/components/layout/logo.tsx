import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-[30px] shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M10 22.5a3 3 0 1 1-1-2.24V9.6l13-2.6v12.5a3 3 0 1 1-1-2.24V11.2l-11 2.2"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
    </svg>
  );
}
