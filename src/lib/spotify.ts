// Spotify Web API client utilities
// Handles token refresh, track search, playlist creation, and track addition.
// Note: removing tracks from a playlist is not supported — Spotify's DELETE
// endpoints reliably 403 from this app/Vercel environment, so users must
// manually remove songs from their Spotify playlist when deleting from ChordMate.

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// ── Token Management ─────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token refresh failed: ${err}`);
  }

  return res.json();
}

// ── Track Search ─────────────────────────────────────────────────

interface SpotifyTrack {
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { name: string };
}

/**
 * Search for a track on Spotify by title and artist.
 * Returns the best matching track URI, or null if not found.
 */
export async function searchTrack(
  accessToken: string,
  title: string,
  artist: string,
): Promise<SpotifyTrack | null> {
  // Clean up search terms — remove special characters that confuse the Spotify search
  const cleanTitle = title.replace(/[''`"]/g, '').replace(/[-–—]/g, ' ').trim();
  const cleanArtist = artist.replace(/[''`"]/g, '').replace(/&/g, 'and').trim();

  const query = `track:${cleanTitle} artist:${cleanArtist}`;
  const url = `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=5`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const tracks = data?.tracks?.items as SpotifyTrack[] | undefined;

  if (!tracks || tracks.length === 0) {
    // Fallback: try a simpler search without structured query
    const fallbackQuery = `${cleanTitle} ${cleanArtist}`;
    const fallbackUrl = `${SPOTIFY_API}/search?q=${encodeURIComponent(fallbackQuery)}&type=track&limit=3`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!fallbackRes.ok) return null;
    const fallbackData = await fallbackRes.json();
    const fallbackTracks = fallbackData?.tracks?.items as SpotifyTrack[] | undefined;
    return fallbackTracks?.[0] ?? null;
  }

  return tracks[0];
}

// ── Playlist Management ──────────────────────────────────────────

interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

/**
 * Create a new Spotify playlist for the authenticated user.
 */
export async function createPlaylist(
  accessToken: string,
  name: string,
  description: string = '',
  isPublic: boolean = false,
): Promise<SpotifyPlaylist> {
  const res = await fetch(`${SPOTIFY_API}/me/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify playlist creation failed: ${err}`);
  }

  return res.json();
}

/**
 * Add tracks to a Spotify playlist. Handles batching (max 100 per request).
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  // Spotify allows max 100 tracks per request
  const batchSize = 100;
  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);
    const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: batch }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to add tracks to playlist: ${err}`);
    }
  }
}

/**
 * Search multiple tracks in parallel with concurrency control.
 */
export async function searchTracks(
  accessToken: string,
  songs: { title: string; artist: string }[],
): Promise<{ found: SpotifyTrack[]; notFound: { title: string; artist: string }[] }> {
  const found: SpotifyTrack[] = [];
  const notFound: { title: string; artist: string }[] = [];

  // Process in batches of 5 to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(song => searchTrack(accessToken, song.title, song.artist))
    );
    results.forEach((track, idx) => {
      if (track) {
        found.push(track);
      } else {
        notFound.push(batch[idx]);
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < songs.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { found, notFound };
}
