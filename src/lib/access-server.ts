// Server-side access helpers. Deliberately NOT a 'use server' module: its exports must not become callable actions.
import { and, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bandMembers, calendarEntries, songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { getUserBandId } from '@/actions/bands';
import { canAccessSong, type AccessContext } from './access';

/** Signed-in user, active band and its members; throws when signed out. */
export async function getAccessContext(): Promise<AccessContext> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const bandId = await getUserBandId();
  const memberIds = bandId
    ? (await db.query.bandMembers.findMany({ where: eq(bandMembers.bandId, bandId), columns: { userId: true } })).map((m) => m.userId)
    : [];
  return { userId: session.user.id, bandId, memberIds };
}

/** SQL twin of canAccessSong. */
export function songScope(ctx: AccessContext): SQL {
  if (ctx.bandId) {
    const ownBand = eq(songs.bandId, ctx.bandId);
    return ctx.memberIds.length > 0 ? or(ownBand, and(isNull(songs.bandId), inArray(songs.addedById, ctx.memberIds)))! : ownBand;
  }
  return and(isNull(songs.bandId), eq(songs.addedById, ctx.userId))!;
}

/** SQL twin of canAccessCalendarEntry. */
export function calendarScope(ctx: AccessContext): SQL {
  return ctx.bandId ? eq(calendarEntries.bandId, ctx.bandId) : and(isNull(calendarEntries.bandId), eq(calendarEntries.addedById, ctx.userId))!;
}

/** Throws unless every id is a song the user can access (unknown ids count as inaccessible). */
export async function assertSongsAccess(ids: string[], ctx: AccessContext): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return;
  const rows = await db.query.songs.findMany({ where: inArray(songs.id, unique), columns: { id: true, bandId: true, addedById: true } });
  if (rows.length !== unique.length || !rows.every((s) => canAccessSong(s, ctx))) throw new Error('Song not found');
}
