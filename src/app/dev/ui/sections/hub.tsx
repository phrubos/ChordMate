'use client';

import { PlayerProvider } from '@/components/player/player-provider';
import { SongHubView } from '@/components/song-hub/song-hub-view';
import { extractChords } from '@/lib/chords';
import { FIXTURE_TODAY, fixtureEntries, fixtureSongs } from '../fixtures';

const song = fixtureSongs[0];
const history = [...new Set(fixtureEntries.filter((e) => e.songId === song.id).map((e) => e.date))].sort().reverse();

export function HubSection() {
  return (
    <section id="hub">
      <PlayerProvider>
        <SongHubView
          song={{ ...song, notes: 'A 2. versszak után a szólónál mindketten lassítunk — az ütemváltásnál figyelj a basszusra.' }}
          practiceHref="/practice/next"
          chords={extractChords(song.tabContent)}
          history={history}
          recordings={[
            { id: 'r1', name: 'Okt. 13. — Hotel California, 2. menet', date: '2026-10-13', duration: 408 },
            { id: 'r2', name: 'Okt. 9. — Hotel California', date: '2026-10-09', duration: 381 },
          ]}
          today={FIXTURE_TODAY}
        />
      </PlayerProvider>
    </section>
  );
}
