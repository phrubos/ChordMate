'use server';

import { db } from '@/lib/db';
import { songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, or, and, ilike, desc, asc, isNotNull, inArray } from 'drizzle-orm';
import { songSchema, type SongFormValues } from '@/lib/validators';
import { fetchAlbumArt } from '@/lib/fetch-album-art';
import { getUserBandId } from './bands';
import { assertSongsAccess, getAccessContext, songScope } from '@/lib/access-server';
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
  const ctx = await getAccessContext();

  // Support legacy string search param
  const f: SongFilters = typeof filters === 'string' ? { search: filters } : (filters ?? {});

  // Scope: the active band's songs plus band-less songs its members added (lib/access.ts)
  const conditions = [songScope(ctx)];

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
  if (!SONG_STATUSES.includes(status)) throw new Error('Invalid status');
  await assertSongsAccess([id], await getAccessContext());

  await db.update(songs).set({ status, updatedAt: new Date() }).where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
  revalidatePath(`/songs/${id}`);
}

/** Practice wrap-up: saves several status changes at once, only for songs in the user's band scope. */
export async function setSongStatuses(changes: { id: string; status: SongStatus }[]) {
  if (changes.some((c) => !SONG_STATUSES.includes(c.status))) throw new Error('Invalid status');
  const ctx = await getAccessContext();
  const ids = changes.map((c) => c.id);
  const visible = ids.length
    ? new Set((await db.select({ id: songs.id }).from(songs).where(and(inArray(songs.id, ids), songScope(ctx)))).map((r) => r.id))
    : new Set<string>();
  const allowed = changes.filter((c) => visible.has(c.id));
  if (allowed.length === 0) return;

  const now = new Date();
  await Promise.all(allowed.map((c) => db.update(songs).set({ status: c.status, updatedAt: now }).where(eq(songs.id, c.id))));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
  for (const c of allowed) revalidatePath(`/songs/${c.id}`);
}

/** Dashboard cards: 3 songs worth bringing back + repertoire status counts. */
export async function getDashboardSongInsights() {
  const [allSongs, entries] = await Promise.all([getSongs(), getCalendarEntries()]);
  return buildSongInsights(allSongs, entries, todayIso());
}

/** A song the user can access, or undefined (pages turn that into a 404). */
export async function getSongById(id: string) {
  const ctx = await getAccessContext();

  return db.query.songs.findFirst({
    where: and(eq(songs.id, id), songScope(ctx)),
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
  await assertSongsAccess([id], await getAccessContext());

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
  const ctx = await getAccessContext();
  await assertSongsAccess([id], ctx);

  await db.delete(songs).where(and(eq(songs.id, id), songScope(ctx)));

  revalidatePath('/songs');
  revalidatePath('/dashboard');

  // Spotify auto-remove is not supported (Spotify's DELETE endpoints 403 from this
  // app/Vercel environment). If the user has a linked playlist, hint that they need
  // to remove the song manually from Spotify.
  const spotifyManualRemoval = await hasLinkedSpotifyPlaylist();

  return { spotifyManualRemoval };
}

export async function toggleFavorite(id: string) {
  const ctx = await getAccessContext();

  const song = await db.query.songs.findFirst({ where: and(eq(songs.id, id), songScope(ctx)) });
  if (!song) throw new Error('Song not found');

  await db
    .update(songs)
    .set({ isFavorite: !song.isFavorite, updatedAt: new Date() })
    .where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
}

export async function getSongStats() {
  const allSongs = await db.select().from(songs).where(songScope(await getAccessContext()));
  const totalSongs = allSongs.length;
  const withTabs = allSongs.filter((s) => s.tabContent).length;
  const favorites = allSongs.filter((s) => s.isFavorite).length;
  const withDifficulty = allSongs.filter((s) => s.difficulty);
  const avgDifficulty =
    withDifficulty.reduce((sum: number, s) => sum + (s.difficulty ?? 0), 0) /
      (withDifficulty.length || 1);

  return { totalSongs, withTabs, favorites, avgDifficulty: Math.round(avgDifficulty * 10) / 10 };
}
