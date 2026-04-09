'use server';

import { db } from '@/lib/db';
import { songs, bandMembers } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, or, and, ilike, desc, asc, isNotNull, isNull, inArray } from 'drizzle-orm';
import { songSchema } from '@/lib/validators';
import { fetchAlbumArt } from '@/lib/fetch-album-art';
import { getUserBandId } from './bands';
import { addSongToSpotifyPlaylist, removeSongFromSpotifyPlaylist } from './spotify';

interface SongFilters {
  search?: string;
  difficulty?: number;
  hasTab?: boolean;
  favOnly?: boolean;
  sort?: 'artist' | 'date';
}

export async function getSongs(filters?: string | SongFilters) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const bandId = await getUserBandId();

  // Support legacy string search param
  const f: SongFilters = typeof filters === 'string' ? { search: filters } : (filters ?? {});

  const conditions = [];
  // Scope to band
  if (bandId) {
    // Get all member IDs so we can also show songs they added without a band context
    const members = await db.query.bandMembers.findMany({
      where: eq(bandMembers.bandId, bandId),
      columns: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);
    conditions.push(
      or(
        eq(songs.bandId, bandId),
        and(isNull(songs.bandId), inArray(songs.addedById, memberIds))
      )!
    );
  } else {
    conditions.push(isNull(songs.bandId));
    conditions.push(eq(songs.addedById, session.user.id));
  }

  if (f.search) {
    conditions.push(
      or(
        ilike(songs.title, `%${f.search}%`),
        ilike(songs.artist, `%${f.search}%`)
      )!
    );
  }
  if (f.difficulty) {
    conditions.push(eq(songs.difficulty, f.difficulty));
  }
  if (f.hasTab) {
    conditions.push(isNotNull(songs.tabContent));
  }
  if (f.favOnly) {
    conditions.push(eq(songs.isFavorite, true));
  }

  const sortOrder = f.sort === 'date'
    ? [desc(songs.isFavorite), desc(songs.createdAt)]
    : [desc(songs.isFavorite), asc(songs.artist), asc(songs.title)];

  return db.query.songs.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { addedBy: true },
    orderBy: sortOrder,
  });
}

export async function getSongById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return db.query.songs.findFirst({
    where: eq(songs.id, id),
    with: { addedBy: true },
  });
}

export async function createSong(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const raw = {
    title: formData.get('title'),
    artist: formData.get('artist'),
    youtubeUrl: formData.get('youtubeUrl') || undefined,
    difficulty: formData.get('difficulty') ? Number(formData.get('difficulty')) : undefined,
    notes: formData.get('notes') || undefined,
    tabContent: formData.get('tabContent') || undefined,
    tabUrl: formData.get('tabUrl') || undefined,
  };

  const data = songSchema.parse(raw);

  // Auto-fetch album artwork
  const imageUrl = await fetchAlbumArt(data.artist, data.title);

  const bandId = await getUserBandId();

  await db.insert(songs).values({
    ...data,
    youtubeUrl: data.youtubeUrl || null,
    tabContent: data.tabContent || null,
    tabUrl: data.tabUrl || null,
    imageUrl,
    bandId,
    addedById: session.user.id,
  });

  revalidatePath('/songs');
  revalidatePath('/dashboard');

  // Try to auto-add to Spotify playlist (best-effort, don't fail song creation)
  let spotifyResult: {
    added: boolean;
    noPlaylist?: boolean;
    notFound?: boolean;
    needsReauth?: boolean;
    playlistUrl?: string;
    error?: string;
  } | null = null;

  try {
    spotifyResult = await addSongToSpotifyPlaylist(data.title, data.artist);
  } catch {
    // Spotify auto-add is best-effort
  }

  return { imageFound: !!imageUrl, spotify: spotifyResult };
}

export async function updateSong(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const rawTabContent = (formData.get('tabContent') as string | null)?.trim();
  const rawTabUrl = (formData.get('tabUrl') as string | null)?.trim();

  const data = songSchema.parse({
    title: formData.get('title'),
    artist: formData.get('artist'),
    youtubeUrl: formData.get('youtubeUrl') || undefined,
    difficulty: formData.get('difficulty') ? Number(formData.get('difficulty')) : undefined,
    notes: formData.get('notes') || undefined,
    tabContent: rawTabContent || undefined,
    tabUrl: rawTabUrl || undefined,
  });

  // Re-fetch album artwork if title or artist changed
  const existing = await db.query.songs.findFirst({ where: eq(songs.id, id) });
  let imageUrl = existing?.imageUrl ?? null;
  if (existing && (existing.title !== data.title || existing.artist !== data.artist)) {
    imageUrl = await fetchAlbumArt(data.artist, data.title);
  }
  // If no image yet, try fetching
  if (!imageUrl) {
    imageUrl = await fetchAlbumArt(data.artist, data.title);
  }

  await db
    .update(songs)
    .set({
      ...data,
      youtubeUrl: data.youtubeUrl || null,
      tabContent: rawTabContent ? data.tabContent! : null,
      tabUrl: rawTabUrl ? data.tabUrl! : null,
      imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
  return { imageFound: !!imageUrl };
}

export async function deleteSong(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Get song info before deleting so we can remove from Spotify
  const song = await db.query.songs.findFirst({ where: eq(songs.id, id) });

  await db.delete(songs).where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');

  // Try to remove from Spotify playlist (best-effort)
  let spotifyResult: {
    removed: boolean;
    noPlaylist?: boolean;
    notFound?: boolean;
    needsReauth?: boolean;
    error?: string;
  } | null = null;

  if (song) {
    try {
      spotifyResult = await removeSongFromSpotifyPlaylist(song.title, song.artist);
      console.log('[deleteSong] Spotify result:', JSON.stringify(spotifyResult));
    } catch (err) {
      console.error('[deleteSong] Spotify removal threw:', err);
    }
  }

  return { spotifyRemoved: spotifyResult?.removed ?? false, spotify: spotifyResult };
}

export async function toggleFavorite(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const song = await db.query.songs.findFirst({ where: eq(songs.id, id) });
  if (!song) throw new Error('Song not found');

  await db
    .update(songs)
    .set({ isFavorite: !song.isFavorite, updatedAt: new Date() })
    .where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
}

export async function getSongStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

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
  const allSongs = await db.select().from(songs).where(condition);
  const totalSongs = allSongs.length;
  const withTabs = allSongs.filter((s) => s.tabContent).length;
  const favorites = allSongs.filter((s) => s.isFavorite).length;
  const withDifficulty = allSongs.filter((s) => s.difficulty);
  const avgDifficulty =
    withDifficulty.reduce((sum: number, s) => sum + (s.difficulty ?? 0), 0) /
      (withDifficulty.length || 1);

  return { totalSongs, withTabs, favorites, avgDifficulty: Math.round(avgDifficulty * 10) / 10 };
}
