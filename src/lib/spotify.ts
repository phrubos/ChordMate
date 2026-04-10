// Spotify Web API client utilities
// Handles token refresh, track search, playlist creation, and track addition

import { request as httpsRequest } from 'node:https';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * Send a DELETE request with a JSON body using Node's native https module.
 * Workaround for serverless/undici environments where fetch DELETE+body doesn't transmit reliably.
 */
function nodeDeleteJson(
  hostname: string,
  path: string,
  accessToken: string,
  body: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname,
        path,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Accept': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body: data });
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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
 * Get a Spotify playlist's metadata (including owner info).
 */
export async function getPlaylist(
  accessToken: string,
  playlistId: string,
): Promise<{ id: string; name: string; owner: { id: string; display_name?: string }; snapshot_id: string } | null> {
  const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}?fields=id,name,owner(id,display_name),snapshot_id`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.error('[Spotify getPlaylist] Failed:', res.status, await res.text());
    return null;
  }
  return res.json();
}

/**
 * Get the current Spotify user's profile.
 */
export async function getMe(
  accessToken: string,
): Promise<{ id: string; display_name?: string } | null> {
  const res = await fetch(`${SPOTIFY_API}/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetch all track URIs in a playlist (paginated).
 */
async function getAllPlaylistTrackUris(
  accessToken: string,
  playlistId: string,
): Promise<string[]> {
  const uris: string[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = `${SPOTIFY_API}/playlists/${playlistId}/items?fields=items(track(uri)),total&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch playlist tracks (${res.status}): ${err}`);
    }
    const data = await res.json();
    const items = (data?.items ?? []) as { track: { uri: string } | null }[];
    for (const item of items) {
      if (item.track?.uri) uris.push(item.track.uri);
    }
    if (items.length < limit) break;
    offset += limit;
  }
  return uris;
}

/**
 * Replace a playlist's contents with the given URI list (max 100 per call).
 */
async function replacePlaylistTracks(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  // PUT replaces the playlist contents. Max 100 URIs per call. Empty array clears the playlist.
  const firstBatch = trackUris.slice(0, 100);
  const url = `${SPOTIFY_API}/playlists/${playlistId}/items`;
  console.log('[Spotify replacePlaylistTracks] PUT', url, 'count:', firstBatch.length);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: firstBatch }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to replace playlist tracks (${res.status}): ${err}`);
  }

  // If more than 100 URIs, append the rest with POST.
  if (trackUris.length > 100) {
    await addTracksToPlaylist(accessToken, playlistId, trackUris.slice(100));
  }
}

/**
 * Remove tracks from a Spotify playlist.
 *
 * Workaround: Spotify's DELETE /playlists/{id}/tracks endpoint returns 403 from
 * Vercel for unclear reasons (POST add works fine on the same playlist with the
 * same token). Instead, we fetch the full playlist, filter out the URIs to remove,
 * and PUT the new list back via "Reorder or Replace Items".
 */
export async function removeTracksFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  if (trackUris.length === 0) return;

  console.log('[Spotify removeTracks] using PUT-replace workaround for', trackUris.length, 'uri(s)');

  // 1. Fetch all current track URIs in the playlist.
  const currentUris = await getAllPlaylistTrackUris(accessToken, playlistId);
  console.log('[Spotify removeTracks] playlist has', currentUris.length, 'tracks');

  // 2. Build a multiset-aware filtered list: remove only as many copies of each
  // URI as were requested, so duplicates of other tracks are preserved.
  const removalCounts = new Map<string, number>();
  for (const uri of trackUris) {
    removalCounts.set(uri, (removalCounts.get(uri) ?? 0) + 1);
  }
  const newUris: string[] = [];
  for (const uri of currentUris) {
    const remaining = removalCounts.get(uri) ?? 0;
    if (remaining > 0) {
      removalCounts.set(uri, remaining - 1);
      continue;
    }
    newUris.push(uri);
  }

  if (newUris.length === currentUris.length) {
    console.log('[Spotify removeTracks] no matching URIs in playlist — nothing to do');
    return;
  }

  console.log('[Spotify removeTracks] replacing playlist:', currentUris.length, '->', newUris.length, 'tracks');

  // 3. Replace the playlist contents with the filtered list.
  await replacePlaylistTracks(accessToken, playlistId, newUris);
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
