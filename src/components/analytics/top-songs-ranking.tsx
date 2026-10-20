import { SectionHeader } from '@/components/design/section-header';

interface TopSong {
  title: string;
  artist: string;
  count: number;
  lastDate: string;
}

export function TopSongsRanking({ songs }: { songs: TopSong[] }) {
  if (songs.length === 0) return null;
  const max = songs[0]?.count ?? 1;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionHeader title="Legtöbbet játszott" />
      <ol className="flex flex-col gap-3">
        {songs.map((song, i) => (
          <li key={`${song.title}-${song.artist}`} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
            <span className="font-mono text-[13px] text-faint tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[14.5px] font-semibold" title={song.title}>{song.title}</span>
              <span className="truncate text-[13px] text-muted-foreground">{song.artist}</span>
            </span>
            <span className="font-mono text-[14px] font-semibold text-primary-text tabular-nums">{song.count}×</span>
            <span className="col-start-2 col-end-4 h-1 overflow-hidden rounded-full bg-border-strong">
              <span className={`block h-full rounded-full ${i < 3 ? 'bg-primary' : 'bg-primary/50'}`} style={{ width: `${Math.round((song.count / max) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
