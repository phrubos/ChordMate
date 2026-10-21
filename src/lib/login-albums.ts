export interface LoginAlbum {
  id: string;
  artist: string;
  album: string;
  year: number;
  /** Original cover art (Apple Music CDN, 600×600). */
  cover: string;
}

const art = (path: string) => `https://is1-ssl.mzstatic.com/image/thumb/${path}/600x600bb.jpg`;

/** Real albums with their original covers, verified against the iTunes catalogue. */
export const LOGIN_ALBUMS: LoginAlbum[] = [
  { id: 'kispal-fold', artist: 'Kispál és a Borz', album: 'Föld kaland ilyesmi', year: 1992, cover: art('Music/v4/c0/5d/9c/c05d9ce6-d8e3-720b-93b3-4a706694881c/cover.jpg') },
  { id: 'kispal-agy', artist: 'Kispál és a Borz', album: 'Ágy, asztal, tévé', year: 1993, cover: art('Music6/v4/f4/7f/db/f47fdb24-bb65-d83a-ddf8-0f12cfd28890/cover.jpg') },
  { id: 'omega-10000', artist: 'Omega', album: '10 000 lépés', year: 1969, cover: art('Music125/v4/7d/a9/a5/7da9a5c5-06e2-98a6-2785-6528d60db086/mzi.odaxxecp.jpg') },
  { id: 'quimby-kilegzes', artist: 'Quimby', album: 'Kilégzés', year: 2005, cover: art('Music114/v4/cb/98/8b/cb988b4c-f488-eaf1-f548-e707a39cc3c3/mzi.bnnagqsm.jpg') },
  { id: 'lgt-loksi', artist: 'Locomotiv GT', album: 'Loksi', year: 1980, cover: art('Music/d5/74/41/mzi.xzuqaere.jpg') },
  { id: 'floyd-wywh', artist: 'Pink Floyd', album: 'Wish You Were Here', year: 1975, cover: art('Music211/v4/aa/e0/ab/aae0ab6a-d906-a189-81bf-70b56aa43f7a/886445635843.jpg') },
  { id: 'eagles-hc', artist: 'Eagles', album: 'Hotel California', year: 1976, cover: art('Music115/v4/88/16/2c/88162c3d-46db-8321-61f3-3a47404cfe76/075596050920.jpg') },
  { id: 'zep-iv', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', year: 1971, cover: art('Music115/v4/5c/15/9b/5c159b27-95ca-b9a7-84e3-28e795fffd39/dj.kvkrpptq.jpg') },
  { id: 'beatles-abbey', artist: 'The Beatles', album: 'Abbey Road', year: 1969, cover: art('Music112/v4/df/db/61/dfdb615d-47f8-06e9-9533-b96daccc029f/18UMGIM31076.rgb.jpg') },
  { id: 'fleetwood-rumours', artist: 'Fleetwood Mac', album: 'Rumours', year: 1977, cover: art('Music124/v4/4d/13/ba/4d13bac3-d3d5-7581-2c74-034219eadf2b/081227970949.jpg') },
  { id: 'dire-bia', artist: 'Dire Straits', album: 'Brothers in Arms', year: 1985, cover: art('Music115/v4/e8/bd/54/e8bd54fd-6595-4ebf-aa4c-58139ed316e6/dj.bngafruf.jpg') },
  { id: 'acdc-bib', artist: 'AC/DC', album: 'Back in Black', year: 1980, cover: art('Music115/v4/1e/14/58/1e145814-281a-58e0-3ab1-145f5d1af421/886443673441.jpg') },
  { id: 'radiohead-okc', artist: 'Radiohead', album: 'OK Computer', year: 1997, cover: art('Music116/v4/07/60/ba/0760ba0f-148c-b18f-d0ff-169ee96f3af5/634904078164.png') },
  { id: 'queen-anato', artist: 'Queen', album: 'A Night at the Opera', year: 1975, cover: art('Music211/v4/dd/86/92/dd86925d-484d-8ee7-3985-ef3264214269/602527644264.jpg') },
  { id: 'hendrix-ayx', artist: 'The Jimi Hendrix Experience', album: 'Are You Experienced', year: 1967, cover: art('Music124/v4/14/52/f2/1452f20c-eedb-5988-177d-33e7d7fe6697/dj.gzmeisav.jpg') },
  { id: 'young-harvest', artist: 'Neil Young', album: 'Harvest', year: 1972, cover: art('Music115/v4/e0/4b/c4/e04bc4e6-9d3a-0bab-c953-f139c72fd337/093624924722.jpg') },
  { id: 'dylan-h61', artist: 'Bob Dylan', album: 'Highway 61 Revisited', year: 1965, cover: art('Music115/v4/f8/ff/c0/f8ffc056-55b4-2033-657d-32492d1eea25/827969239926.jpg') },
  { id: 'stones-sticky', artist: 'The Rolling Stones', album: 'Sticky Fingers', year: 1971, cover: art('Music112/v4/7f/e0/b4/7fe0b4da-36cd-a1d0-0f19-ef3fec18e3cd/08UMGIM15742.rgb.jpg') },
];

/** Fisher–Yates shuffle; `random` is injectable for tests. */
export function shuffleAlbums<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
