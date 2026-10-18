import { cn } from '@/lib/utils';
import { statusLabel, type SongStatus } from '@/lib/song-meta';

export const STATUS_TEXT: Record<SongStatus, string> = {
  learning: 'text-status-learning',
  ok: 'text-status-ok',
  ready: 'text-status-ready',
};

export const STATUS_BG: Record<SongStatus, string> = {
  learning: 'bg-status-learning',
  ok: 'bg-status-ok',
  ready: 'bg-status-ready',
};

export function StatusBadge({ status, compact, className }: { status: SongStatus; compact?: boolean; className?: string }) {
  const label = statusLabel(status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap', STATUS_TEXT[status], className)}>
      <span aria-hidden className={cn('size-2 rounded-full', STATUS_BG[status])} />
      {compact ? <span className="sr-only">{label}</span> : label}
    </span>
  );
}
