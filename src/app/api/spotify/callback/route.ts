import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { exchangeCodeForTokens } from '@/lib/spotify';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.AUTH_URL}/login`);
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // User denied access
  if (error) {
    return NextResponse.redirect(`${process.env.AUTH_URL}/songs?spotify=denied`);
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('spotify_oauth_state')?.value;
  cookieStore.delete('spotify_oauth_state');

  if (!state || state !== storedState) {
    return NextResponse.redirect(`${process.env.AUTH_URL}/songs?spotify=error&reason=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.AUTH_URL}/songs?spotify=error&reason=no_code`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = `${process.env.AUTH_URL}/api/spotify/callback`;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri, clientId, clientSecret);

    // Get Spotify user ID from the access token
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    const spotifyUserId = profile.id as string;

    // Delete existing Spotify account link for this user (if any)
    await db.delete(accounts).where(
      and(
        eq(accounts.userId, session.user.id),
        eq(accounts.provider, 'spotify'),
      )
    );

    // Store the new Spotify tokens in the accounts table
    await db.insert(accounts).values({
      userId: session.user.id,
      type: 'oauth' as const,
      provider: 'spotify',
      providerAccountId: spotifyUserId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      token_type: tokens.token_type,
      scope: tokens.scope,
    });

    return NextResponse.redirect(`${process.env.AUTH_URL}/songs?spotify=connected`);
  } catch (err) {
    console.error('Spotify OAuth callback error:', err);
    return NextResponse.redirect(`${process.env.AUTH_URL}/songs?spotify=error`);
  }
}
