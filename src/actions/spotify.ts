'use server';

import { db } from '@/lib/db';
import { accounts, songs, bandMembers, bands } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import { refreshAccessToken, searchTracks, createPlaylist, addTracksToPlaylist } from '@/lib/spotify';
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

/**
 * Get a valid Spotify access token for the current user.
 * Refreshes the token if it's expired or about to expire.
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

  // 1. Get valid access token
  const accessToken = await getValidAccessToken(session.user.id);

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
  const playlist = await createPlaylist(accessToken, playlistName, description, false);

  // 6. Add all found tracks
  const trackUris = found.map(t => t.uri);
  await addTracksToPlaylist(accessToken, playlist.id, trackUris);

  return {
    playlistUrl: playlist.external_urls.spotify,
    tracksFound: found.length,
    tracksTotal: userSongs.length,
    notFound,
  };
}
