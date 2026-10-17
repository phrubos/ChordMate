import type { CalendarEntryWithSong, SongWithUser } from '@/types';

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
Em                    F#`;

type Seed = [id: string, title: string, artist: string, difficulty: number, fav: boolean, tab: boolean];

const SEEDS: Seed[] = [
  ['hotel', 'Hotel California', 'Eagles', 4, true, true],
  ['gyongy', 'Gyöngyhajú lány', 'Omega', 3, true, true],
  ['wing', 'Little Wing', 'Jimi Hendrix', 5, false, true],
  ['bridge', 'Under the Bridge', 'Red Hot Chili Peppers', 4, false, true],
  ['wonder', 'Wonderwall', 'Oasis', 2, false, true],
  ['wish', 'Wish You Were Here', 'Pink Floyd', 2, true, true],
  ['mostmulik', 'Most múlik pontosan', 'Kispál és a Borz', 2, false, true],
  ['black', 'Black', 'Pearl Jam', 3, false, false],
  ['rosa', 'Ha én rózsa volnék', 'Koncz Zsuzsa', 1, false, true],
  ['nothing', 'Nothing Else Matters', 'Metallica', 3, true, true],
  ['blackbird', 'Blackbird', 'The Beatles', 4, false, true],
  ['layla', 'Layla (Unplugged)', 'Eric Clapton', 3, false, false],
];

export const fixtureSongs: SongWithUser[] = SEEDS.map(([id, title, artist, difficulty, fav, tab], i) => ({
  id,
  title,
  artist,
  youtubeUrl: id === 'black' ? null : `https://www.youtube.com/watch?v=${id}`,
  difficulty,
  notes: id === 'hotel' ? 'A 2. versszak után a szólónál lassítunk.' : null,
  tabContent: tab ? HOTEL_TAB : null,
  tabUrl: null,
  imageUrl: null,
  isFavorite: fav,
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
