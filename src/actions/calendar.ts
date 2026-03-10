'use server';

import { db } from '@/lib/db';
import { calendarEntries } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, and, gte, lte, asc, sql } from 'drizzle-orm';

export async function getCalendarEntries(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  return db.query.calendarEntries.findMany({
    where: and(
      gte(calendarEntries.date, startDate),
      lte(calendarEntries.date, endDate)
    ),
    with: {
      song: true,
      addedBy: true,
    },
    orderBy: [asc(calendarEntries.date), asc(calendarEntries.sortOrder)],
  });
}

export async function assignSongToDate(songId: string, date: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(eq(calendarEntries.date, date));

  const nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  await db
    .insert(calendarEntries)
    .values({
      date,
      songId,
      addedById: session.user.id,
      sortOrder: nextOrder,
    })
    .onConflictDoNothing();

  revalidatePath('/dashboard');
}

export async function assignSongsToDate(songIds: string[], date: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;

  if (songIds.length === 0) return;

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(eq(calendarEntries.date, date));

  let nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  await db
    .insert(calendarEntries)
    .values(
      songIds.map((songId) => ({
        date,
        songId,
        addedById: userId,
        sortOrder: nextOrder++,
      }))
    )
    .onConflictDoNothing();

  revalidatePath('/dashboard');
}

export async function removeSongFromDate(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.delete(calendarEntries).where(eq(calendarEntries.id, entryId));

  revalidatePath('/dashboard');
}

export async function clearSongsFromDate(date: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.delete(calendarEntries).where(eq(calendarEntries.date, date));

  revalidatePath('/dashboard');
}

export async function reorderCalendarEntries(entryIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  for (let i = 0; i < entryIds.length; i++) {
    await db
      .update(calendarEntries)
      .set({ sortOrder: i })
      .where(eq(calendarEntries.id, entryIds[i]));
  }

  revalidatePath('/dashboard');
}

export async function getCalendarStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const allEntries = await db.query.calendarEntries.findMany({
    with: { song: true },
    orderBy: [asc(calendarEntries.date)],
  });

  // Group by date for practice history
  const practiceHistory: { date: string; songCount: number; songs: string[] }[] = [];
  const grouped = new Map<string, { count: number; songs: string[] }>();

  for (const entry of allEntries) {
    const existing = grouped.get(entry.date);
    if (existing) {
      existing.count++;
      existing.songs.push(entry.song.title);
    } else {
      grouped.set(entry.date, { count: 1, songs: [entry.song.title] });
    }
  }

  for (const [date, data] of grouped) {
    practiceHistory.push({ date, songCount: data.count, songs: data.songs });
  }

  return {
    totalPracticeDays: practiceHistory.length,
    practiceHistory: practiceHistory.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export async function copySongsToDate(fromDate: string, toDate: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const sourceEntries = await db.query.calendarEntries.findMany({
    where: eq(calendarEntries.date, fromDate),
    orderBy: [asc(calendarEntries.sortOrder)],
  });

  if (sourceEntries.length === 0) return;

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(eq(calendarEntries.date, toDate));

  let nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  for (const entry of sourceEntries) {
    await db
      .insert(calendarEntries)
      .values({
        date: toDate,
        songId: entry.songId,
        addedById: session.user.id,
        sortOrder: nextOrder++,
      })
      .onConflictDoNothing();
  }

  revalidatePath('/dashboard');
}
