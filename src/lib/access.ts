/**
 * Who may see or change a row — the same rules the list queries use (getSongs, getCalendarEntries),
 * so a song or entry reachable by id is exactly one the user could also find in the UI.
 */
export interface AccessContext {
  userId: string;
  /** Active band, null when the user has none. */
  bandId: string | null;
  /** Members of the active band (empty without a band). */
  memberIds: string[];
}

interface Owned {
  bandId: string | null;
  addedById: string;
}

/** Songs of the active band, plus band-less songs its members added; without a band, own band-less songs. */
export function canAccessSong(song: Owned, ctx: AccessContext): boolean {
  if (ctx.bandId) return song.bandId === ctx.bandId || (song.bandId === null && ctx.memberIds.includes(song.addedById));
  return song.bandId === null && song.addedById === ctx.userId;
}

/** Entries of the active band; without a band, own band-less entries. */
export function canAccessCalendarEntry(entry: Owned, ctx: AccessContext): boolean {
  if (ctx.bandId) return entry.bandId === ctx.bandId;
  return entry.bandId === null && entry.addedById === ctx.userId;
}
