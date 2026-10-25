import { PendingLink } from '@/components/shared/pending-link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'list', label: 'Lista', href: '/rehearsals' },
  { key: 'calendar', label: 'Naptár', href: '/rehearsals?view=calendar' },
  { key: 'overview', label: 'Áttekintés', href: '/analytics' },
] as const;

export type RehearsalTab = (typeof TABS)[number]['key'];

/** Link tabs of the Próbák section (same look as SegmentedControl, but navigation). */
export function RehearsalTabs({ active }: { active: RehearsalTab }) {
  return (
    <nav aria-label="Próbák nézetei" className="inline-flex w-fit rounded-full border border-border-strong p-[3px]">
      {TABS.map((t) => (
        <PendingLink
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? 'page' : undefined}
          className={cn(
            'pressable inline-flex h-9 items-center rounded-full px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-[transform,background-color,color] duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring',
            t.key === active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </PendingLink>
      ))}
    </nav>
  );
}
