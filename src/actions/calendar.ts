'use server';

import { db } from '@/lib/db';
import { calendarEntries, rehearsals } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { calendarScope, getAccessContext, assertSongsAccess, rehearsalScope } from '@/lib/access-server';
import { pickNextRehearsal, todayIso, upcomingRehearsals } from '@/lib/calendar-utils';

export async function getCalendarEntries() {
  const scope = calendarScope(await getAccessContext());

  return db.query.calendarEntries.findMany({
    where: scope,
    with: {
      song: true,
      addedBy: true,
    },
    orderBy: [asc(calendarEntries.date), asc(calendarEntries.sortOrder)],
  });
}

export async function getNextRehearsal() {
  const entries = await getCalendarEntries();
  return pickNextRehearsal(entries, todayIso());
}

/** Distinct rehearsal dates of a song (band scope), newest first. */
export async function getSongHistory(songId: string): Promise<{ date: string }[]> {
  const scope = calendarScope(await getAccessContext());

  return db
    .selectDistinct({ date: calendarEntries.date })
    .from(calendarEntries)
    .where(and(scope, eq(calendarEntries.songId, songId)))
    .orderBy(desc(calendarEntries.date));
}

/** Rehearsal days from today on, with the song's position in each setlist (for "Hozzáadás próbához"). */
export async function getUpcomingRehearsals(songId: string) {
  return upcomingRehearsals(await getCalendarEntries(), todayIso(), songId);
}

export async function assignSongToDate(songId: string, date: string) {
  const ctx = await getAccessContext();
  await assertSongsAccess([songId], ctx);
  const { userId, bandId } = ctx;

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(and(eq(calendarEntries.date, date), calendarScope(ctx)));

  const nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  await db
    .insert(calendarEntries)
    .values({
      date,
      songId,
      bandId,
      addedById: userId,
      sortOrder: nextOrder,
    })
    .onConflictDoNothing();

  revalidatePath('/dashboard');
}

export async function assignSongsToDate(songIds: string[], date: string) {
  const ctx = await getAccessContext();
  const { userId, bandId } = ctx;

  if (songIds.length === 0) return;
  await assertSongsAccess(songIds, ctx);

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(and(eq(calendarEntries.date, date), calendarScope(ctx)));

  let nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  await db
    .insert(calendarEntries)
    .values(
      songIds.map((songId) => ({
        date,
        songId,
        bandId,
        addedById: userId,
        sortOrder: nextOrder++,
      }))
    );

  revalidatePath('/');
}

export async function removeSongFromDate(entryId: string) {
  const scope = calendarScope(await getAccessContext());

  await db.delete(calendarEntries).where(and(eq(calendarEntries.id, entryId), scope));

  revalidatePath('/dashboard');
}

export async function clearSongsFromDate(date: string) {
  const ctx = await getAccessContext();

  // Scoped: without it this wiped that day's setlist for every band. Deleting the rehearsal also drops its details (attendance cascades).
  await db.delete(calendarEntries).where(and(eq(calendarEntries.date, date), calendarScope(ctx)));
  await db.delete(rehearsals).where(and(eq(rehearsals.date, date), rehearsalScope(ctx)));

  revalidatePath('/dashboard');
  revalidatePath('/rehearsals');
}

export async function reorderCalendarEntries(entryIds: string[]) {
  const scope = calendarScope(await getAccessContext());

  for (let i = 0; i < entryIds.length; i++) {
    await db
      .update(calendarEntries)
      .set({ sortOrder: i })
      .where(and(eq(calendarEntries.id, entryIds[i]), scope));
  }

  revalidatePath('/dashboard');
}

export async function getCalendarStats() {
  const scope = calendarScope(await getAccessContext());

  const allEntries = await db.query.calendarEntries.findMany({
    where: scope,
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
  const ctx = await getAccessContext();
  const { userId, bandId } = ctx;
  const scope = calendarScope(ctx);

  const sourceEntries = await db.query.calendarEntries.findMany({
    where: and(eq(calendarEntries.date, fromDate), scope),
    orderBy: [asc(calendarEntries.sortOrder)],
  });

  if (sourceEntries.length === 0) return;

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${calendarEntries.sortOrder}), -1)` })
    .from(calendarEntries)
    .where(and(eq(calendarEntries.date, toDate), scope));

  let nextOrder = (maxOrder[0]?.max ?? -1) + 1;

  for (const entry of sourceEntries) {
    await db
      .insert(calendarEntries)
      .values({
        date: toDate,
        songId: entry.songId,
        bandId,
        addedById: userId,
        sortOrder: nextOrder++,
      });
  }

  revalidatePath('/');
}
