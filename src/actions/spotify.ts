'use server';

import { db } from '@/lib/db';
import { accounts, songs, bandMembers, bands, spotifyPlaylists } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import { refreshAccessToken, searchTrack, searchTracks, createPlaylist, addTracksToPlaylist } from '@/lib/spotify';
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

// Scopes required for playlist add/remove operations.
// Per Spotify Web API docs, ADD and DELETE both only require playlist-modify-*.
// We grant playlist-read-* in the authorize route too for future flexibility, but
// don't enforce them here so older tokens still work for the core flows.
const REQUIRED_SCOPES = [
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
 * Add a single song to all linked Spotify playlists for the current context.
 *
 * For personal songs (no band): adds to the current user's personal playlist.
 * For band songs: adds to every band member's playlist that's linked for that band,
 * so the song shows up in everyone's Spotify automatically.
 *
 * Failures for individual members are logged but don't block other members.
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

    // Find ALL linked playlists for this context. For a band song, this returns
    // every band member's linked playlist; for a personal song, just the current user's.
    const linkedPlaylists = await db.query.spotifyPlaylists.findMany({
      where: bandId
        ? eq(spotifyPlaylists.bandId, bandId)
        : and(
            eq(spotifyPlaylists.userId, session.user.id),
            isNull(spotifyPlaylists.bandId),
          ),
    });

    if (linkedPlaylists.length === 0) {
      return { added: false, noPlaylist: true };
    }

    // Search the track once using the current user's token. The resulting URI
    // is reused for every band member — Spotify track URIs are stable across users
    // in the same market.
    const currentUserToken = await getValidAccessToken(session.user.id);
    const track = await searchTrack(currentUserToken, title, artist);
    if (!track) {
      // Pick the current user's playlist URL for the toast link, fall back to the first.
      const ownPlaylist = linkedPlaylists.find(p => p.userId === session.user!.id);
      return {
        added: false,
        notFound: true,
        playlistUrl: ownPlaylist?.spotifyPlaylistUrl ?? linkedPlaylists[0].spotifyPlaylistUrl,
      };
    }

    // Add the track to each linked playlist in parallel using each member's own token.
    // Per-member failures are caught so one bad token doesn't block other members.
    const results = await Promise.all(
      linkedPlaylists.map(async (playlist) => {
        try {
          const memberToken = await getValidAccessToken(playlist.userId);
          await addTracksToPlaylist(memberToken, playlist.spotifyPlaylistId, [track.uri]);
          console.log('[Spotify add] Added to', playlist.userId, 'playlist:', title, '–', artist);
          return { userId: playlist.userId, ok: true as const };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[Spotify add] Failed for user', playlist.userId, ':', msg);
          return { userId: playlist.userId, ok: false as const, error: msg };
        }
      })
    );

    const succeeded = results.filter(r => r.ok).length;
    const ownResult = results.find(r => r.userId === session.user!.id);
    const ownPlaylist = linkedPlaylists.find(p => p.userId === session.user!.id);

    // If the current user's own add failed with a scope mismatch, surface that to the UI.
    if (ownResult && !ownResult.ok && ownResult.error === 'SPOTIFY_SCOPE_MISMATCH') {
      return { added: false, needsReauth: true, error: 'Spotify permissions outdated — please reconnect Spotify in Settings' };
    }

    if (succeeded === 0) {
      return { added: false, error: 'Failed to add to any playlist' };
    }

    console.log(`[Spotify add] Added to ${succeeded}/${linkedPlaylists.length} playlists`);
    return {
      added: true,
      playlistUrl: ownPlaylist?.spotifyPlaylistUrl ?? linkedPlaylists[0].spotifyPlaylistUrl,
    };
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
 * Check whether the current user has a linked Spotify playlist for their context.
 * Used by deleteSong to decide whether to show a "manually remove from Spotify" hint.
 */
export async function hasLinkedSpotifyPlaylist(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

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
  return !!linked;
}
