import type { CalendarEntryWithSong, Rehearsal, SongWithUser } from '@/types';
import type { SongStatus } from '@/lib/song-meta';

export const FIXTURE_TODAY = '2026-10-16';

const peter = { id: 'u-peter', name: 'Kiss Péter', image: null };
const gabor = { id: 'u-gabor', name: 'Nagy Gábor', image: null };

const HOTEL_TAB = `[Intro]
Bm         F#        A         E
G          D         Em        F#

[Verse]
Bm                    F#
On a dark desert highway
A                     E
G                     D
Em                    F#

[Solo]
e|--14-15-17--15-14--------------------17b19r17-15-14--------------15-17-19-17-15----|
B|-----------------17-15-14--15-17-------------------17-15-15--17-----------------17-|`;

type Seed = [id: string, title: string, artist: string, difficulty: number, fav: boolean, tab: boolean, status: SongStatus, key: string, bpm: number, capo: number, tuning: string | null];

const SEEDS: Seed[] = [
  ['hotel', 'Hotel California', 'Eagles', 4, true, true, 'learning', 'Bm', 74, 7, null],
  ['gyongy', 'Gyöngyhajú lány', 'Omega', 3, true, true, 'ok', 'Am', 76, 0, null],
  ['wing', 'Little Wing', 'Jimi Hendrix', 5, false, true, 'learning', 'Em', 70, 0, 'Eb'],
  ['bridge', 'Under the Bridge', 'Red Hot Chili Peppers', 4, false, true, 'ok', 'E', 84, 0, null],
  ['wonder', 'Wonderwall', 'Oasis', 2, false, true, 'ready', 'F#m', 87, 2, null],
  ['wish', 'Wish You Were Here', 'Pink Floyd', 2, true, true, 'ready', 'G', 61, 0, null],
  ['mostmulik', 'Most múlik pontosan', 'Kispál és a Borz', 2, false, true, 'ready', 'D', 128, 0, null],
  ['black', 'Black', 'Pearl Jam', 3, false, false, 'ok', 'E', 74, 0, null],
  ['rosa', 'Ha én rózsa volnék', 'Koncz Zsuzsa', 1, false, true, 'ready', 'C', 92, 0, null],
  ['nothing', 'Nothing Else Matters', 'Metallica', 3, true, true, 'ok', 'Em', 69, 0, null],
  ['blackbird', 'Blackbird', 'The Beatles', 4, false, true, 'learning', 'G', 94, 0, null],
  ['layla', 'Layla (Unplugged)', 'Eric Clapton', 3, false, false, 'ok', 'Dm', 95, 0, null],
];

export const fixtureSongs: SongWithUser[] = SEEDS.map(([id, title, artist, difficulty, fav, tab, status, songKey, bpm, capo, tuning], i) => ({
  id,
  title,
  artist,
  youtubeUrl: id === 'black' ? null : `https://www.youtube.com/watch?v=${id.padEnd(11, '0').slice(0, 11)}`,
  difficulty,
  notes: id === 'hotel' ? 'A 2. versszak után a szólónál lassítunk.' : null,
  tabContent: tab ? HOTEL_TAB : null,
  tabUrl: null,
  imageUrl: null,
  isFavorite: fav,
  status,
  bpm,
  songKey,
  capo,
  tuning,
  bandId: 'band-1',
  addedById: i % 2 ? gabor.id : peter.id,
  createdAt: new Date(2026, 2, 1 + i),
  updatedAt: new Date(2026, 2, 1 + i),
  addedBy: i % 2 ? gabor : peter,
}));

const EVENTS: Record<string, string[]> = {
  '2026-09-29': ['nothing', 'black', 'wish'],
  '2026-10-02': ['wish', 'black', 'rosa', 'wonder'],
  '2026-10-06': ['wing', 'mostmulik', 'wonder'],
  '2026-10-09': ['gyongy', 'wonder', 'hotel', 'nothing', 'wish'],
  '2026-10-13': ['hotel', 'bridge', 'gyongy'],
  '2026-10-22': ['hotel', 'gyongy', 'wing', 'bridge', 'wonder'],
  '2026-10-27': ['blackbird', 'layla', 'black'],
  '2026-10-30': ['wish', 'mostmulik', 'rosa', 'nothing'],
  '2026-11-03': ['hotel', 'wing'],
};

export const fixtureEntries: CalendarEntryWithSong[] = Object.entries(EVENTS).flatMap(([date, ids]) =>
  ids.map((songId, sortOrder) => {
    const song = fixtureSongs.find((s) => s.id === songId)!;
    return {
      id: `${date}-${songId}`,
      date,
      songId,
      bandId: 'band-1',
      addedById: peter.id,
      sortOrder,
      createdAt: new Date(date),
      song,
      addedBy: peter,
    };
  })
);

export const fixtureMembers = [
  { name: 'Kiss Péter', image: null },
  { name: 'Nagy Gábor', image: null },
  { name: 'Szabó Dani', image: null },
];

const rehearsalBase = { bandId: 'band-1', createdById: peter.id, createdAt: new Date('2026-10-10'), updatedAt: new Date('2026-10-10'), notes: null };

export const fixtureRehearsals: Rehearsal[] = [
  { ...rehearsalBase, id: 'r-1022', date: '2026-10-22', kind: 'rehearsal', startTime: '19:00', endTime: '21:30', place: 'Pince próbaterem', goal: 'A Hotel California szólója tisztán', notes: 'Hozz tartalék húrt!' },
  { ...rehearsalBase, id: 'r-1107', date: '2026-11-07', kind: 'gig', startTime: '20:00', endTime: null, place: 'Grand Café, Szeged', goal: null },
];

export const fixtureAttendance = [
  { userId: peter.id, name: 'Kiss Péter', image: null, answer: 'yes' as const },
  { userId: 'u-gabor', name: 'Nagy Gábor', image: null, answer: 'maybe' as const },
  { userId: 'u-dani', name: 'Szabó Dani', image: null, answer: null },
];
