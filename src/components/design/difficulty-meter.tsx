import { cn } from '@/lib/utils';
import { difficultyLabel } from '@/lib/song-meta';

const HEIGHTS = ['h-[5px]', 'h-[7px]', 'h-[9px]', 'h-[11.5px]', 'h-[14px]'];

export function DifficultyMeter({ level, showLabel = true, className }: { level: number | null; showLabel?: boolean; className?: string }) {
  const label = difficultyLabel(level);
  if (!label || !level) return null;
  return (
    <span
      role="img"
      aria-label={`Nehézség: ${label}, ${level} az 5-ből`}
      title={`Nehézség: ${label} (${level}/5)`}
      className={cn('inline-flex items-center gap-2 text-[13px] whitespace-nowrap text-muted-foreground', className)}
    >
      <span aria-hidden className="inline-flex h-3.5 items-end gap-0.5">
        {HEIGHTS.map((h, i) => (
          <span key={h} className={cn('w-1 rounded-[1px]', h, i < level ? 'bg-primary' : 'bg-border-strong')} />
        ))}
      </span>
      {showLabel && <span aria-hidden>{label}</span>}
    </span>
  );
}
