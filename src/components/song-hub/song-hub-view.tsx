import { PendingLink } from '@/components/shared/pending-link';
import { ChevronLeft } from 'lucide-react';
import type { SongWithUser } from '@/types';
import { HubHero } from './hub-hero';
import { HubBody } from './hub-body';
import type { HubRecording } from './hub-recordings';
import type { HubRehearsal } from './hub-hero';

export function SongHubView({
  song,
  rehearsal,
  chords,
  history,
  recordings,
  today,
}: {
  song: SongWithUser;
  rehearsal: HubRehearsal | null;
  chords: string[];
  history: string[];
  recordings: HubRecording[];
  today: string;
}) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <nav aria-label="Morzsamenü" className="flex min-w-0 items-center gap-2 text-[13.5px]">
        <PendingLink href="/songs" className="pressable -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 font-semibold [--press-scale:.985] hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Dalok
        </PendingLink>
        <span className="text-faint" aria-hidden>/</span>
        <span className="truncate text-muted-foreground" aria-current="page">{song.title}</span>
      </nav>
      <HubHero song={song} rehearsal={rehearsal} />
      <HubBody song={song} chords={chords} history={history} recordings={recordings} today={today} />
    </div>
  );
}
