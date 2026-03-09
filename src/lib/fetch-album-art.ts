'use server';

interface ITunesResult {
  artworkUrl100: string;
  artworkUrl60: string;
  artworkUrl30: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesResult[];
}

/**
 * Fetches album artwork from iTunes Search API.
 * Returns the highest resolution URL available (600x600).
 * Falls back to null if nothing found.
 */
export async function fetchAlbumArt(artist: string, title: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=3`,
      { next: { revalidate: 86400 } } // cache for 24h
    );

    if (!res.ok) return null;

    const data: ITunesResponse = await res.json();

    if (data.resultCount === 0 || data.results.length === 0) return null;

    // Get the artwork URL and upscale to 600x600
    const artworkUrl = data.results[0].artworkUrl100;
    if (!artworkUrl) return null;

    return artworkUrl.replace('100x100bb', '600x600bb');
  } catch {
    return null;
  }
}
