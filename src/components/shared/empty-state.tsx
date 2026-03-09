import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  illustration?: 'songs' | 'search' | 'calendar';
  children?: React.ReactNode;
}

function SongsIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-2">
      <rect x="20" y="20" width="80" height="60" rx="8" className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" />
      <circle cx="60" cy="45" r="14" className="fill-primary/10 stroke-primary/30" strokeWidth="1.5" />
      <path d="M56 45 L66 45 M61 40 L61 50" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
      <rect x="35" y="65" width="50" height="4" rx="2" className="fill-primary/10" />
      <path d="M30 15 L30 35 M30 15 L45 10 L45 30" className="stroke-primary/20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="35" r="4" className="fill-primary/15" />
      <circle cx="42" cy="30" r="4" className="fill-primary/15" />
      <path d="M85 10 Q95 20 90 30" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M90 8 Q102 18 96 30" className="stroke-primary/10" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-2">
      <circle cx="52" cy="44" r="22" className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" />
      <circle cx="52" cy="44" r="14" className="fill-primary/5 stroke-primary/15" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="68" y1="60" x2="85" y2="77" className="stroke-primary/30" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 44 L56 44" className="stroke-primary/30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="85" cy="77" r="4" className="fill-primary/10" />
      <path d="M25 80 L95 80" className="stroke-primary/10" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-2">
      <rect x="20" y="20" width="80" height="65" rx="8" className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" />
      <line x1="20" y1="38" x2="100" y2="38" className="stroke-primary/15" strokeWidth="1" />
      <rect x="28" y="25" width="8" height="12" rx="2" className="fill-primary/10" />
      <rect x="84" y="25" width="8" height="12" rx="2" className="fill-primary/10" />
      {[0, 1, 2, 3, 4].map((col) =>
        [0, 1, 2].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={28 + col * 14}
            y={44 + row * 12}
            width="10"
            height="8"
            rx="2"
            className={col === 2 && row === 1 ? 'fill-primary/20' : 'fill-primary/5'}
          />
        ))
      )}
      <circle cx="63" cy="60" r="3" className="fill-primary/30" />
    </svg>
  );
}

const illustrations = {
  songs: SongsIllustration,
  search: SearchIllustration,
  calendar: CalendarIllustration,
};

export function EmptyState({ icon: Icon, title, description, illustration, children }: EmptyStateProps) {
  const Illustration = illustration ? illustrations[illustration] : null;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Illustration ? (
        <Illustration />
      ) : (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10">
          <Icon className="size-6 text-primary/30" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
