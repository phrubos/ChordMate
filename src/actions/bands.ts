'use server';

import { db } from '@/lib/db';
import { bands, bandMembers } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase(); // 8-char code like "A3F1B2C4"
}

// ─── Get user's current band (with members) ─────────────────
export async function getUserBand() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
    with: {
      band: {
        with: {
          members: {
            with: {
              user: {
                columns: { id: true, name: true, image: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) return null;
  return membership.band;
}

// ─── Get user's bandId (lightweight helper) ──────────────────
export async function getUserBandId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
    columns: { bandId: true },
  });

  return membership?.bandId ?? null;
}

// ─── Check if user needs onboarding ─────────────────────────
export async function needsOnboarding(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  // Check if user has any band membership
  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
    columns: { bandId: true },
  });

  return !membership;
}

// ─── Create a new band ──────────────────────────────────────
export async function createBand(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error('A banda neve legalább 2 karakter legyen');

  // Check if user is already in a band
  const existing = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
  });
  if (existing) throw new Error('Már tagja vagy egy bandának');

  const inviteCode = generateInviteCode();

  const [band] = await db.insert(bands).values({
    name: trimmed,
    inviteCode,
    createdById: session.user.id,
  }).returning();

  await db.insert(bandMembers).values({
    bandId: band.id,
    userId: session.user.id,
    role: 'admin',
  });

  revalidatePath('/');
  return band;
}

// ─── Join a band with invite code ───────────────────────────
export async function joinBand(code: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Add meg a meghívó kódot');

  // Check if user is already in a band
  const existing = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
  });
  if (existing) throw new Error('Már tagja vagy egy bandának');

  const band = await db.query.bands.findFirst({
    where: eq(bands.inviteCode, trimmed),
  });
  if (!band) throw new Error('Érvénytelen meghívó kód');

  await db.insert(bandMembers).values({
    bandId: band.id,
    userId: session.user.id,
    role: 'member',
  });

  revalidatePath('/');
  return band;
}

// ─── Start solo (create a personal "solo band") ─────────────
export async function startSolo() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Check if user is already in a band
  const existing = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
  });
  if (existing) throw new Error('Már tagja vagy egy bandának');

  const userName = session.user.name ?? 'Solo';
  const inviteCode = generateInviteCode();

  const [band] = await db.insert(bands).values({
    name: `${userName} – Solo`,
    inviteCode,
    createdById: session.user.id,
  }).returning();

  await db.insert(bandMembers).values({
    bandId: band.id,
    userId: session.user.id,
    role: 'admin',
  });

  revalidatePath('/');
  return band;
}

// ─── Leave a band ───────────────────────────────────────────
export async function leaveBand() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
    with: { band: { with: { members: true } } },
  });
  if (!membership) throw new Error('Nem vagy tagja bandának');

  // If admin and last member, delete the band
  if (membership.band.members.length === 1) {
    await db.delete(bands).where(eq(bands.id, membership.bandId));
  } else {
    await db.delete(bandMembers).where(
      and(eq(bandMembers.bandId, membership.bandId), eq(bandMembers.userId, session.user.id))
    );
    // If leaving admin, promote next member
    if (membership.role === 'admin') {
      const nextMember = membership.band.members.find(m => m.userId !== session.user!.id);
      if (nextMember) {
        await db.update(bandMembers)
          .set({ role: 'admin' })
          .where(and(eq(bandMembers.bandId, membership.bandId), eq(bandMembers.userId, nextMember.userId)));
      }
    }
  }

  revalidatePath('/');
}

// ─── Remove a member (admin only) ───────────────────────────
export async function removeBandMember(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const myMembership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.userId, session.user.id)),
  });
  if (!myMembership || myMembership.role !== 'admin') throw new Error('Nincs jogosultságod');

  if (targetUserId === session.user.id) throw new Error('Nem távolíthatod el magad');

  await db.delete(bandMembers).where(
    and(eq(bandMembers.bandId, myMembership.bandId), eq(bandMembers.userId, targetUserId))
  );

  revalidatePath('/');
}

// ─── Regenerate invite code (admin only) ─────────────────────
export async function regenerateInviteCode() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
  });
  if (!membership || membership.role !== 'admin') throw new Error('Nincs jogosultságod');

  const newCode = generateInviteCode();
  await db.update(bands)
    .set({ inviteCode: newCode })
    .where(eq(bands.id, membership.bandId));

  revalidatePath('/');
  return newCode;
}

// ─── Update band name (admin only) ──────────────────────────
export async function updateBandName(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error('A banda neve legalább 2 karakter legyen');

  const membership = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
  });
  if (!membership || membership.role !== 'admin') throw new Error('Nincs jogosultságod');

  await db.update(bands)
    .set({ name: trimmed })
    .where(eq(bands.id, membership.bandId));

  revalidatePath('/');
}
