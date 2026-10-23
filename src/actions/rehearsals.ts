'use server';

import { db } from '@/lib/db';
import { bandMembers, calendarEntries, rehearsalAttendance, rehearsals } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { and, asc, eq } from 'drizzle-orm';
import { calendarScope, getAccessContext, rehearsalScope } from '@/lib/access-server';
import type { AccessContext } from '@/lib/access';
import { isIsoDate, listRehearsalDays } from '@/lib/rehearsals';
import { todayIso } from '@/lib/calendar-utils';
import { rehearsalMetaSchema, type RehearsalMetaInput } from '@/lib/validators';
import type { AttendanceAnswer } from '@/types';

function assertDate(date: string) {
  if (!isIsoDate(date)) throw new Error('Invalid date');
}

function revalidate(date: string) {
  revalidatePath('/rehearsals');
  revalidatePath(`/rehearsals/${date}`);
  revalidatePath('/dashboard');
}

async function findRehearsal(date: string, ctx: AccessContext) {
  return db.query.rehearsals.findFirst({ where: and(eq(rehearsals.date, date), rehearsalScope(ctx)) });
}

/** Details row for the day, created empty when missing. */
async function ensureRehearsal(date: string, ctx: AccessContext) {
  const existing = await findRehearsal(date, ctx);
  if (existing) return existing;
  const [row] = await db
    .insert(rehearsals)
    .values({ date, bandId: ctx.bandId, createdById: ctx.userId })
    .onConflictDoNothing()
    .returning();
  return row ?? (await findRehearsal(date, ctx))!;
}

export async function getRehearsalDays() {
  const ctx = await getAccessContext();
  const [entries, metas] = await Promise.all([
    db.select({ date: calendarEntries.date }).from(calendarEntries).where(calendarScope(ctx)),
    db.query.rehearsals.findMany({ where: rehearsalScope(ctx) }),
  ]);
  return listRehearsalDays(entries, metas, todayIso());
}

export async function getRehearsalMetas() {
  const ctx = await getAccessContext();
  return db.query.rehearsals.findMany({ where: rehearsalScope(ctx), orderBy: [asc(rehearsals.date)] });
}

export async function getRehearsal(date: string) {
  assertDate(date);
  const ctx = await getAccessContext();
  const [meta, entries, members] = await Promise.all([
    findRehearsal(date, ctx),
    db.query.calendarEntries.findMany({
      where: and(eq(calendarEntries.date, date), calendarScope(ctx)),
      with: { song: true, addedBy: true },
      orderBy: [asc(calendarEntries.sortOrder)],
    }),
    ctx.bandId
      ? db.query.bandMembers.findMany({ where: eq(bandMembers.bandId, ctx.bandId), with: { user: true } })
      : Promise.resolve([]),
  ]);
  const answerRows = meta ? await db.query.rehearsalAttendance.findMany({ where: eq(rehearsalAttendance.rehearsalId, meta.id) }) : [];

  const answers = new Map(answerRows.map((a) => [a.userId, a.answer]));
  const attendance = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    image: m.user.image,
    answer: answers.get(m.userId) ?? null,
  }));

  return {
    date,
    meta: meta ?? null,
    entries,
    attendance,
    myAnswer: answers.get(ctx.userId) ?? null,
    hasBand: ctx.bandId !== null,
  };
}

export async function saveRehearsalMeta(date: string, input: RehearsalMetaInput) {
  assertDate(date);
  const ctx = await getAccessContext();
  const v = rehearsalMetaSchema.parse(input);
  const row = await ensureRehearsal(date, ctx);
  await db
    .update(rehearsals)
    .set({
      kind: v.kind,
      startTime: v.startTime ?? null,
      endTime: v.endTime ?? null,
      place: v.place || null,
      goal: v.goal || null,
      notes: v.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(rehearsals.id, row.id));
  revalidate(date);
}

export async function setAttendance(date: string, answer: AttendanceAnswer) {
  assertDate(date);
  if (!['yes', 'maybe', 'no'].includes(answer)) throw new Error('Invalid answer');
  const ctx = await getAccessContext();
  if (!ctx.bandId) throw new Error('No band');
  const row = await ensureRehearsal(date, ctx);
  await db
    .insert(rehearsalAttendance)
    .values({ rehearsalId: row.id, userId: ctx.userId, answer })
    .onConflictDoUpdate({
      target: [rehearsalAttendance.rehearsalId, rehearsalAttendance.userId],
      set: { answer, updatedAt: new Date() },
    });
  revalidate(date);
}
