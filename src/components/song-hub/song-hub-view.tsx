import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { SongWithUser } from '@/types';
import { HubHero } from './hub-hero';
import { HubBody } from './hub-body';
import type { HubRecording } from './hub-recordings';

export function SongHubView({
  song,
  practiceHref,
  chords,
  history,
  recordings,
  today,
}: {
  song: SongWithUser;
  practiceHref: string;
  chords: string[];
  history: string[];
  recordings: HubRecording[];
  today: string;
}) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <nav aria-label="Morzsamenü" className="flex min-w-0 items-center gap-2 text-[13.5px]">
        <Link href="/songs" className="inline-flex items-center gap-1 font-semibold hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Dalok
        </Link>
        <span className="text-faint" aria-hidden>/</span>
        <span className="truncate text-muted-foreground" aria-current="page">{song.title}</span>
      </nav>
      <HubHero song={song} practiceHref={practiceHref} />
      <HubBody song={song} chords={chords} history={history} recordings={recordings} today={today} />
    </div>
  );
}
