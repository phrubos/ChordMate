import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 });
  }

  // Generate CSRF state token
  const state = randomBytes(16).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('spotify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const redirectUri = `${process.env.AUTH_URL}/api/spotify/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    show_dialog: 'true', // Always show the Spotify consent dialog
  });

  return NextResponse.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
}
