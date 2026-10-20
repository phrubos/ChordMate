import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import { SectionHeader } from '@/components/design/section-header';

interface NeglectedSong {
  title: string;
  artist: string;
  count: number;
  lastDate: string;
}

export function NeglectedSongs({ songs }: { songs: NeglectedSong[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionHeader title="Rég nem játszott" actions={songs.length > 0 && <span className="font-mono text-[13px] text-muted-foreground">{songs.length}</span>} />
      {songs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Minden dal friss — szép munka!</p>
      ) : (
        <ul className="grid gap-x-8 md:grid-cols-2">
          {songs.map((song) => (
            <li key={`${song.title}-${song.artist}`} className="flex items-center gap-3 border-t border-border py-2.5">
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[14.5px] font-semibold" title={song.title}>{song.title}</span>
                <span className="truncate text-[13px] text-muted-foreground">{song.artist}</span>
              </span>
              <span className="shrink-0 text-right leading-tight">
                <span className="block text-[13px] font-medium text-status-learning">
                  {formatDistanceToNow(new Date(`${song.lastDate}T00:00:00`), { addSuffix: true, locale: hu })}
                </span>
                <span className="block font-mono text-xs text-muted-foreground">{song.count}× összesen</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
