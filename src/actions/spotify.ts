'use server';

import { db } from '@/lib/db';
import { accounts, songs, bandMembers, bands, spotifyPlaylists } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import { refreshAccessToken, searchTrack, searchTracks, createPlaylist, addTracksToPlaylist, removeTracksFromPlaylist } from '@/lib/spotify';
import { getUserBandId } from './bands';

/**
 * Check if the current user has a linked Spotify account.
 */
export async function getSpotifyConnectionStatus(): Promise<{
  connected: boolean;
  spotifyUserId?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, session.user.id),
      eq(accounts.provider, 'spotify'),
    ),
  });

  return {
    connected: !!account,
    spotifyUserId: account?.providerAccountId ?? undefined,
  };
}

/**
 * Disconnect (unlink) the user's Spotify account.
 */
export async function disconnectSpotify(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.delete(accounts).where(
    and(
      eq(accounts.userId, session.user.id),
      eq(accounts.provider, 'spotify'),
    )
  );
}

// Scopes required for full functionality (must match authorize route)
const REQUIRED_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
];

/**
 * Get a valid Spotify access token for the current user.
 * Refreshes the token if it's expired or about to expire.
 * Throws SPOTIFY_SCOPE_MISMATCH if stored token has outdated scopes.
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, 'spotify'),
    ),
  });

  if (!account?.access_token || !account.refresh_token) {
    throw new Error('NO_SPOTIFY_CONNECTION');
  }

  // Check if stored scopes include all required scopes
  if (account.scope) {
    const storedScopes = account.scope.split(' ');
    const missing = REQUIRED_SCOPES.filter(s => !storedScopes.includes(s));
    if (missing.length > 0) {
      console.warn('[Spotify] Token missing scopes:', missing.join(', '), '— user needs to re-authorize');
      throw new Error('SPOTIFY_SCOPE_MISMATCH');
    }
  }

  // Check if token is expired (with 60s buffer)
  const isExpired = account.expires_at
    ? account.expires_at < Math.floor(Date.now() / 1000) + 60
    : true;

  if (!isExpired) {
    return account.access_token;
  }

  // Refresh the token
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const tokens = await refreshAccessToken(account.refresh_token, clientId, clientSecret);

  // Update the tokens in the database
  await db.update(accounts)
    .set({
      access_token: tokens.access_token,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      // Spotify may return a new refresh token
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    })
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.provider, 'spotify'),
      )
    );

  return tokens.access_token;
}

/**
 * Create a Spotify playlist from the user's songs.
 */
export async function createSpotifyPlaylist(
  playlistName: string,
): Promise<{
  playlistUrl: string;
  tracksFound: number;
  tracksTotal: number;
  notFound: { title: string; artist: string }[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // 1. Get valid access token (scope mismatch = user needs to re-authorize)
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === 'SPOTIFY_SCOPE_MISMATCH') {
      throw new Error('SPOTIFY_SCOPE_MISMATCH');
    }
    throw err;
  }

  // 2. Get the user's songs from the database
  const bandId = await getUserBandId();
  let condition;
  if (bandId) {
    const members = await db.query.bandMembers.findMany({
      where: eq(bandMembers.bandId, bandId),
      columns: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);
    condition = or(
      eq(songs.bandId, bandId),
      and(isNull(songs.bandId), inArray(songs.addedById, memberIds))
    );
  } else {
    condition = and(isNull(songs.bandId), eq(songs.addedById, session.user.id));
  }

  const userSongs = await db.select({
    title: songs.title,
    artist: songs.artist,
  }).from(songs).where(condition);

  if (userSongs.length === 0) {
    throw new Error('NO_SONGS');
  }

  // 3. Search for each song on Spotify
  const { found, notFound } = await searchTracks(accessToken, userSongs);

  if (found.length === 0) {
    throw new Error('NO_TRACKS_FOUND');
  }

  // 4. Get band name for the description
  let bandName = '';
  if (bandId) {
    const band = await db.query.bands.findFirst({
      where: eq(bands.id, bandId),
      columns: { name: true },
    });
    bandName = band?.name ?? '';
  }

  const description = bandName
    ? `${bandName} – ChordMate playlist (${found.length} dal)`
    : `ChordMate playlist (${found.length} dal)`;

  // 5. Create the playlist
  let playlist;
  try {
    playlist = await createPlaylist(accessToken, playlistName, description, false);
  } catch (err) {
    console.error('Spotify createPlaylist error:', err);
    throw new Error('PLAYLIST_CREATE_FAILED');
  }

  // 6. Add all found tracks
  try {
    const trackUris = found.map(t => t.uri);
    await addTracksToPlaylist(accessToken, playlist.id, trackUris);
  } catch (err) {
    console.error('Spotify addTracksToPlaylist error:', err);
    // Playlist was created but tracks couldn't be added — still return the URL
    return {
      playlistUrl: playlist.external_urls.spotify,
      tracksFound: 0,
      tracksTotal: userSongs.length,
      notFound: userSongs,
    };
  }

  // Save the playlist reference for auto-add
  const existingLink = await db.query.spotifyPlaylists.findFirst({
    where: bandId
      ? and(
          eq(spotifyPlaylists.userId, session.user.id),
          eq(spotifyPlaylists.bandId, bandId),
        )
      : and(
          eq(spotifyPlaylists.userId, session.user.id),
          isNull(spotifyPlaylists.bandId),
        ),
  });

  if (existingLink) {
    await db.update(spotifyPlaylists)
      .set({
        spotifyPlaylistId: playlist.id,
        spotifyPlaylistUrl: playlist.external_urls.spotify,
        name: playlistName,
      })
      .where(eq(spotifyPlaylists.id, existingLink.id));
  } else {
    await db.insert(spotifyPlaylists).values({
      userId: session.user.id,
      bandId: bandId ?? null,
      spotifyPlaylistId: playlist.id,
      spotifyPlaylistUrl: playlist.external_urls.spotify,
      name: playlistName,
    });
  }

  return {
    playlistUrl: playlist.external_urls.spotify,
    tracksFound: found.length,
    tracksTotal: userSongs.length,
    notFound,
  };
}

/**
 * Get the linked Spotify playlist for the current user/band context.
 */
export async function getLinkedSpotifyPlaylist(): Promise<{
  exists: boolean;
  spotifyConnected: boolean;
  playlist?: {
    id: string;
    spotifyPlaylistId: string;
    spotifyPlaylistUrl: string;
    name: string;
  };
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Check Spotify connection
  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, session.user.id),
      eq(accounts.provider, 'spotify'),
    ),
  });

  if (!account) {
    return { exists: false, spotifyConnected: false };
  }

  const bandId = await getUserBandId();

  const linked = await db.query.spotifyPlaylists.findFirst({
    where: bandId
      ? and(
          eq(spotifyPlaylists.userId, session.user.id),
          eq(spotifyPlaylists.bandId, bandId),
        )
      : and(
          eq(spotifyPlaylists.userId, session.user.id),
          isNull(spotifyPlaylists.bandId),
        ),
  });

  if (!linked) {
    return { exists: false, spotifyConnected: true };
  }

  return {
    exists: true,
    spotifyConnected: true,
    playlist: {
      id: linked.id,
      spotifyPlaylistId: linked.spotifyPlaylistId,
      spotifyPlaylistUrl: linked.spotifyPlaylistUrl,
      name: linked.name,
    },
  };
}

/**
 * Add a single song to the linked Spotify playlist.
 * Returns the result of the operation.
 */
export async function addSongToSpotifyPlaylist(
  title: string,
  artist: string,
): Promise<{
  added: boolean;
  noPlaylist?: boolean;
  notFound?: boolean;
  needsReauth?: boolean;
  playlistUrl?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[Spotify add] No session/user');
      return { added: false, error: 'Unauthorized' };
    }

    const bandId = await getUserBandId();

    // Find linked playlist
    const linked = await db.query.spotifyPlaylists.findFirst({
      where: bandId
        ? and(
            eq(spotifyPlaylists.userId, session.user.id),
            eq(spotifyPlaylists.bandId, bandId),
          )
        : and(
            eq(spotifyPlaylists.userId, session.user.id),
            isNull(spotifyPlaylists.bandId),
          ),
    });

    if (!linked) {
      return { added: false, noPlaylist: true };
    }

    const accessToken = await getValidAccessToken(session.user.id);

    // Search for the track on Spotify
    const track = await searchTrack(accessToken, title, artist);
    if (!track) {
      return { added: false, notFound: true, playlistUrl: linked.spotifyPlaylistUrl };
    }

    // Add track to playlist
    await addTracksToPlaylist(accessToken, linked.spotifyPlaylistId, [track.uri]);

    console.log('[Spotify add] Successfully added:', title, '–', artist);
    return { added: true, playlistUrl: linked.spotifyPlaylistUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Spotify add] Error:', message, err);
    if (message === 'SPOTIFY_SCOPE_MISMATCH') {
      return { added: false, needsReauth: true, error: 'Spotify permissions outdated — please reconnect Spotify in Settings' };
    }
    return { added: false, error: message };
  }
}

/**
 * Remove a single song from the linked Spotify playlist.
 */
export async function removeSongFromSpotifyPlaylist(
  title: string,
  artist: string,
): Promise<{
  removed: boolean;
  noPlaylist?: boolean;
  notFound?: boolean;
  needsReauth?: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[Spotify remove] No session/user');
      return { removed: false, error: 'Unauthorized' };
    }

    const bandId = await getUserBandId();

    const linked = await db.query.spotifyPlaylists.findFirst({
      where: bandId
        ? and(
            eq(spotifyPlaylists.userId, session.user.id),
            eq(spotifyPlaylists.bandId, bandId),
          )
        : and(
            eq(spotifyPlaylists.userId, session.user.id),
            isNull(spotifyPlaylists.bandId),
          ),
    });

    if (!linked) {
      console.log('[Spotify remove] No linked playlist found for user:', session.user.id, 'bandId:', bandId);
      return { removed: false, noPlaylist: true };
    }

    const accessToken = await getValidAccessToken(session.user.id);

    const track = await searchTrack(accessToken, title, artist);
    if (!track) {
      console.log('[Spotify remove] Track not found on Spotify:', title, '–', artist);
      return { removed: false, notFound: true };
    }

    await removeTracksFromPlaylist(accessToken, linked.spotifyPlaylistId, [track.uri]);

    console.log('[Spotify remove] Successfully removed:', title, '–', artist);
    return { removed: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Spotify remove] Error:', message, err);
    if (message === 'SPOTIFY_SCOPE_MISMATCH') {
      return { removed: false, needsReauth: true, error: 'Spotify permissions outdated — please reconnect Spotify in Settings' };
    }
    return { removed: false, error: message };
  }
}
