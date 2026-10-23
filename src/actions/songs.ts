'use server';

import { db } from '@/lib/db';
import { songs, bandMembers } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, or, and, ilike, desc, asc, isNotNull, isNull, inArray } from 'drizzle-orm';
import { songSchema, type SongFormValues } from '@/lib/validators';
import { fetchAlbumArt } from '@/lib/fetch-album-art';
import { getUserBandId } from './bands';
import { SONG_STATUSES, type SongStatus } from '@/lib/song-meta';
import { buildSongInsights } from '@/lib/neglected';
import { todayIso } from '@/lib/calendar-utils';
import { getCalendarEntries } from './calendar';
import { addSongToSpotifyPlaylist, hasLinkedSpotifyPlaylist } from './spotify';

interface SongFilters {
  search?: string;
  difficulty?: number;
  hasTab?: boolean;
  favOnly?: boolean;
  sort?: 'artist' | 'date';
  status?: SongStatus;
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
  if (f.status) {
    conditions.push(eq(songs.status, f.status));
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

/** Lean title/artist lookup for the global search palette — no tab content, capped result count. */
export async function searchSongs(query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];
  const rows = await getSongs({ search: q });
  return rows.slice(0, limit).map(({ id, title, artist, imageUrl, status }) => ({ id, title, artist, imageUrl, status }));
}

/** Reads the musical metadata fields from a song form; empty strings become undefined. */
function musicFields(formData: FormData) {
  const get = (key: string) => {
    const v = (formData.get(key) as string | null)?.trim();
    return v ? v : undefined;
  };
  return { status: get('status'), bpm: get('bpm'), songKey: get('songKey'), capo: get('capo'), tuning: get('tuning') };
}

function musicValues(data: SongFormValues) {
  return {
    status: data.status,
    bpm: data.bpm ?? null,
    songKey: data.songKey || null,
    capo: data.capo ?? null,
    tuning: data.tuning || null,
  };
}

export async function setSongStatus(id: string, status: SongStatus) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!SONG_STATUSES.includes(status)) throw new Error('Invalid status');

  await db.update(songs).set({ status, updatedAt: new Date() }).where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
  revalidatePath(`/songs/${id}`);
}

/** Dashboard cards: 3 songs worth bringing back + repertoire status counts. */
export async function getDashboardSongInsights() {
  const [allSongs, entries] = await Promise.all([getSongs(), getCalendarEntries()]);
  return buildSongInsights(allSongs, entries, todayIso());
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
    ...musicFields(formData),
  };

  const data = songSchema.parse(raw);

  // Auto-fetch album artwork
  const imageUrl = await fetchAlbumArt(data.artist, data.title);

  const bandId = await getUserBandId();

  const [created] = await db
    .insert(songs)
    .values({
      ...data,
      youtubeUrl: data.youtubeUrl || null,
      tabContent: data.tabContent || null,
      tabUrl: data.tabUrl || null,
      ...musicValues(data),
      imageUrl,
      bandId,
      addedById: session.user.id,
    })
    .returning({ id: songs.id });

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

  return { id: created.id, imageFound: !!imageUrl, spotify: spotifyResult };
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
    ...musicFields(formData),
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
      ...musicValues(data),
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

  await db.delete(songs).where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');

  // Spotify auto-remove is not supported (Spotify's DELETE endpoints 403 from this
  // app/Vercel environment). If the user has a linked playlist, hint that they need
  // to remove the song manually from Spotify.
  const spotifyManualRemoval = await hasLinkedSpotifyPlaylist();

  return { spotifyManualRemoval };
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
