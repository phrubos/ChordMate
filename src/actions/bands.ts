'use server';

import { db } from '@/lib/db';
import { bands, bandMembers } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const ACTIVE_BAND_COOKIE = 'active-band-id';

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// ─── Get/set active band cookie ──────────────────────────────
async function getActiveBandCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTIVE_BAND_COOKIE)?.value ?? null;
}

async function setActiveBandCookie(bandId: string) {
  const jar = await cookies();
  jar.set(ACTIVE_BAND_COOKIE, bandId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

// ─── Get active band ID (reads cookie, validates membership) ─
export async function getUserBandId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const allMemberships = await db.query.bandMembers.findMany({
    where: eq(bandMembers.userId, session.user.id),
    columns: { bandId: true },
  });
  if (allMemberships.length === 0) return null;

  const bandIds = allMemberships.map(m => m.bandId);
  const cookieVal = await getActiveBandCookie();

  // If cookie points to a valid membership, use it
  if (cookieVal && bandIds.includes(cookieVal)) return cookieVal;

  // No valid cookie — return first band as default
  // Cookie will be set when user explicitly switches or on next mutation
  return bandIds[0];
}

// ─── Get active band with full member details ────────────────
export async function getUserBand() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const activeBandId = await getUserBandId();
  if (!activeBandId) return null;

  const band = await db.query.bands.findFirst({
    where: eq(bands.id, activeBandId),
    with: {
      members: {
        with: {
          user: {
            columns: { id: true, name: true, image: true, email: true },
          },
        },
      },
    },
  });

  return band ?? null;
}

// ─── Get ALL bands the user belongs to (for switcher) ────────
export async function getUserBands() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await db.query.bandMembers.findMany({
    where: eq(bandMembers.userId, session.user.id),
    with: {
      band: {
        columns: { id: true, name: true, logoData: true },
      },
    },
  });

  return memberships.map(m => ({
    id: m.band.id,
    name: m.band.name,
    logoData: m.band.logoData,
    role: m.role,
  }));
}

// ─── Switch active band ─────────────────────────────────────
export async function setActiveBand(bandId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify membership
  const membership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.userId, session.user.id), eq(bandMembers.bandId, bandId)),
  });
  if (!membership) throw new Error('Nem vagy tagja ennek a bandának');

  await setActiveBandCookie(bandId);
  revalidatePath('/');
}

// ─── Check if user needs onboarding ─────────────────────────
export async function needsOnboarding(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

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

  // Auto-switch to new band
  await setActiveBandCookie(band.id);

  revalidatePath('/');
  return { id: band.id, name: band.name };
}

// ─── Join a band with invite code ───────────────────────────
export async function joinBand(code: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Add meg a meghívó kódot');

  const band = await db.query.bands.findFirst({
    where: eq(bands.inviteCode, trimmed),
  });
  if (!band) throw new Error('Érvénytelen meghívó kód');

  // Check if already a member of this band
  const existing = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.userId, session.user.id), eq(bandMembers.bandId, band.id)),
  });
  if (existing) throw new Error('Már tagja vagy ennek a bandának');

  await db.insert(bandMembers).values({
    bandId: band.id,
    userId: session.user.id,
    role: 'member',
  });

  // Auto-switch to joined band
  await setActiveBandCookie(band.id);

  revalidatePath('/');
  return { id: band.id, name: band.name };
}

// ─── Start solo (create a personal "solo band") ─────────────
export async function startSolo() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

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

  // Auto-switch to solo band
  await setActiveBandCookie(band.id);

  revalidatePath('/');
  return { id: band.id, name: band.name };
}

// ─── Leave the active band ──────────────────────────────────
export async function leaveBand() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const activeBandId = await getUserBandId();
  if (!activeBandId) throw new Error('Nincs aktív bandád');

  const membership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, session.user.id)),
    with: { band: { with: { members: true } } },
  });
  if (!membership) throw new Error('Nem vagy tagja bandának');

  if (membership.band.members.length === 1) {
    await db.delete(bands).where(eq(bands.id, activeBandId));
  } else {
    await db.delete(bandMembers).where(
      and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, session.user.id))
    );
    if (membership.role === 'admin') {
      const nextMember = membership.band.members.find(m => m.userId !== session.user!.id);
      if (nextMember) {
        await db.update(bandMembers)
          .set({ role: 'admin' })
          .where(and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, nextMember.userId)));
      }
    }
  }

  // Switch to another band if any remain
  const remaining = await db.query.bandMembers.findFirst({
    where: eq(bandMembers.userId, session.user.id),
    columns: { bandId: true },
  });
  if (remaining) {
    await setActiveBandCookie(remaining.bandId);
  }

  revalidatePath('/');
}

// ─── Remove a member (admin only, from active band) ─────────
export async function removeBandMember(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const activeBandId = await getUserBandId();
  if (!activeBandId) throw new Error('Nincs aktív bandád');

  const myMembership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, session.user.id)),
  });
  if (!myMembership || myMembership.role !== 'admin') throw new Error('Nincs jogosultságod');
  if (targetUserId === session.user.id) throw new Error('Nem távolíthatod el magad');

  await db.delete(bandMembers).where(
    and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, targetUserId))
  );

  revalidatePath('/');
}

// ─── Regenerate invite code (admin only, active band) ────────
export async function regenerateInviteCode() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const activeBandId = await getUserBandId();
  if (!activeBandId) throw new Error('Nincs aktív bandád');

  const membership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, session.user.id)),
  });
  if (!membership || membership.role !== 'admin') throw new Error('Nincs jogosultságod');

  const newCode = generateInviteCode();
  await db.update(bands)
    .set({ inviteCode: newCode })
    .where(eq(bands.id, activeBandId));

  revalidatePath('/');
  return newCode;
}

// ─── Update band name (admin only, active band) ─────────────
export async function updateBandName(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error('A banda neve legalább 2 karakter legyen');

  const activeBandId = await getUserBandId();
  if (!activeBandId) throw new Error('Nincs aktív bandád');

  const membership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.bandId, activeBandId), eq(bandMembers.userId, session.user.id)),
  });
  if (!membership || membership.role !== 'admin') throw new Error('Nincs jogosultságod');

  await db.update(bands)
    .set({ name: trimmed })
    .where(eq(bands.id, activeBandId));

  revalidatePath('/');
}

// ─── Update band images (admin only) ────────────────────────
export async function updateBandImages(
  bandId: string,
  logoData?: string,
  backgroundData?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const membership = await db.query.bandMembers.findFirst({
    where: and(eq(bandMembers.bandId, bandId), eq(bandMembers.userId, session.user.id)),
  });
  if (!membership || membership.role !== 'admin') {
    throw new Error('Nincs jogosultságod');
  }

  const updates: Partial<{ logoData: string; backgroundData: string }> = {};
  if (logoData !== undefined) updates.logoData = logoData;
  if (backgroundData !== undefined) updates.backgroundData = backgroundData;

  if (Object.keys(updates).length > 0) {
    await db.update(bands)
      .set(updates)
      .where(eq(bands.id, bandId));
      
    revalidatePath('/');
    revalidatePath('/band');
  }
}
