'use server';

import { db } from '@/lib/db';
import { songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, or, ilike, desc } from 'drizzle-orm';
import { songSchema } from '@/lib/validators';
import { fetchAlbumArt } from '@/lib/fetch-album-art';

export async function getSongs(search?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (search) {
    return db.query.songs.findMany({
      where: or(
        ilike(songs.title, `%${search}%`),
        ilike(songs.artist, `%${search}%`)
      ),
      with: { addedBy: true },
      orderBy: [desc(songs.createdAt)],
    });
  }

  return db.query.songs.findMany({
    with: { addedBy: true },
    orderBy: [desc(songs.createdAt)],
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

  await db.insert(songs).values({
    ...data,
    youtubeUrl: data.youtubeUrl || null,
    tabContent: data.tabContent || null,
    tabUrl: data.tabUrl || null,
    imageUrl,
    addedById: session.user.id,
  });

  revalidatePath('/songs');
  revalidatePath('/dashboard');
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
}

export async function deleteSong(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.delete(songs).where(eq(songs.id, id));

  revalidatePath('/songs');
  revalidatePath('/dashboard');
}
