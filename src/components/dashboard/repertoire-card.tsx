import { Flame } from 'lucide-react';
import { SectionHeader } from '@/components/design/section-header';
import { STATUS_BG } from '@/components/design/status-badge';
import { SONG_STATUSES, statusLabel, type SongStatus } from '@/lib/song-meta';

export function RepertoireCard({ counts }: { counts: Record<SongStatus | 'all', number> }) {
  const order: SongStatus[] = ['ready', 'ok', 'learning'];
  return (
    <section aria-labelledby="repertoire-title" className="flex flex-col gap-4">
      <SectionHeader eyebrow={<span className="inline-flex items-center gap-1.5"><Flame className="size-3.5" />Lendület</span>} title={<span id="repertoire-title">Repertoár állapota</span>} />
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <b className="font-mono text-[28px] leading-tight font-semibold tabular-nums">
            {counts.ready}
            <span className="text-base text-faint">/{counts.all}</span>
          </b>
          <span className="text-[13px] text-muted-foreground">dal kész</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <b className="font-mono text-[28px] leading-tight font-semibold tabular-nums">{counts.ok}</b>
          <span className="text-[13px] text-muted-foreground">megy már</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <b className="font-mono text-[28px] leading-tight font-semibold tabular-nums">{counts.learning}</b>
          <span className="text-[13px] text-muted-foreground">tanulás alatt</span>
        </div>
      </div>
      {counts.all > 0 && (
        <div
          role="img"
          aria-label={SONG_STATUSES.map((s) => `${statusLabel(s)}: ${counts[s]}`).join(', ')}
          className="flex h-2.5 gap-[3px] overflow-hidden rounded-full"
        >
          {order.map((s) => counts[s] > 0 && <span key={s} className={`rounded-full ${STATUS_BG[s]}`} style={{ flex: counts[s] }} />)}
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
        {order.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${STATUS_BG[s]}`} />
            {statusLabel(s)} {counts[s]}
          </span>
        ))}
      </div>
    </section>
  );
}
