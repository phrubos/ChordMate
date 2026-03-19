'use server';

import { db } from '@/lib/db';
import { recordings } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { getUserBandId } from './bands';

// ─── List recordings by date (metadata only, no audio blob) ───
export async function getRecordingsByDate(date: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const bandId = await getUserBandId();
  const scope = bandId
    ? and(eq(recordings.date, date), eq(recordings.bandId, bandId))
    : and(eq(recordings.date, date), isNull(recordings.bandId), eq(recordings.addedById, session.user.id));

  const rows = await db
    .select({
      id: recordings.id,
      date: recordings.date,
      name: recordings.name,
      mimeType: recordings.mimeType,
      duration: recordings.duration,
      bandId: recordings.bandId,
      addedById: recordings.addedById,
      createdAt: recordings.createdAt,
    })
    .from(recordings)
    .where(scope)
    .orderBy(desc(recordings.createdAt));

  return rows;
}

// ─── Check if a date has any recordings (lightweight) ─────────
export async function hasRecordingsForDate(date: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const bandId = await getUserBandId();
  const scope = bandId
    ? and(eq(recordings.date, date), eq(recordings.bandId, bandId))
    : and(eq(recordings.date, date), isNull(recordings.bandId), eq(recordings.addedById, session.user.id));

  const rows = await db
    .select({ id: recordings.id })
    .from(recordings)
    .where(scope)
    .limit(1);

  return rows.length > 0;
}

// ─── Get audio data for playback ──────────────────────────────
export async function getRecordingAudio(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const row = await db
    .select({
      audioData: recordings.audioData,
      mimeType: recordings.mimeType,
    })
    .from(recordings)
    .where(and(eq(recordings.id, id), eq(recordings.addedById, session.user.id)))
    .limit(1);

  if (!row[0]) throw new Error('Recording not found');
  return row[0];
}

// ─── Save a new recording ─────────────────────────────────────
export async function saveRecording(data: {
  date: string;
  name: string;
  audioBase64: string;
  mimeType: string;
  duration: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const bandId = await getUserBandId();

  const [inserted] = await db
    .insert(recordings)
    .values({
      date: data.date,
      name: data.name,
      audioData: data.audioBase64,
      mimeType: data.mimeType,
      duration: data.duration,
      bandId,
      addedById: session.user.id,
    })
    .returning({ id: recordings.id });

  revalidatePath('/dashboard');
  return inserted;
}

// ─── Update recording name ────────────────────────────────────
export async function updateRecordingName(id: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(recordings)
    .set({ name })
    .where(and(eq(recordings.id, id), eq(recordings.addedById, session.user.id)));

  revalidatePath('/dashboard');
}

// ─── Delete a recording ───────────────────────────────────────
export async function deleteRecording(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .delete(recordings)
    .where(and(eq(recordings.id, id), eq(recordings.addedById, session.user.id)));

  revalidatePath('/dashboard');
}

// ─── Get next cover number for auto-naming ────────────────────
export async function getNextCoverNumber(date: string, songTitle: string, artist: string): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const bandId = await getUserBandId();
  const scope = bandId
    ? and(eq(recordings.date, date), eq(recordings.bandId, bandId))
    : and(eq(recordings.date, date), isNull(recordings.bandId), eq(recordings.addedById, session.user.id));

  const recs = await db
    .select({ name: recordings.name })
    .from(recordings)
    .where(scope);

  const prefix = `${songTitle} – ${artist} – cover_`;
  let max = 0;
  for (const rec of recs) {
    if (rec.name.startsWith(prefix)) {
      const num = parseInt(rec.name.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max + 1;
}
