import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const UG_API = 'https://api.ultimate-guitar.com/api/v1';
const UG_USER_AGENT = 'UGT_ANDROID/4.11.1 (Pixel; 8.1.0)';

function generateDeviceId(): string {
  return randomBytes(16).toString('hex').slice(0, 16);
}

function generateApiKey(deviceId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = now.getUTCHours();
  const formattedDate = `${year}-${month}-${day}:${hour}`;
  const payload = `${deviceId}${formattedDate}createLog()`;
  return createHash('md5').update(payload).digest('hex');
}

function getHeaders() {
  const deviceId = generateDeviceId();
  const apiKey = generateApiKey(deviceId);
  return {
    'Accept-Charset': 'utf-8',
    'Accept': 'application/json',
    'User-Agent': UG_USER_AGENT,
    'X-UG-CLIENT-ID': deviceId,
    'X-UG-API-KEY': apiKey,
  };
}

interface UGTab {
  id: number;
  song_name: string;
  artist_name: string;
  type: string;
  version: number;
  votes: number;
  rating: number;
  tonality_name?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    // Search for Chords (300) and Tabs (200)
    const params = new URLSearchParams({
      title: query,
      'type[]': '300',
      page: '1',
    });
    // Add second type[] param
    const url = `${UG_API}/tab/search?${params.toString()}&type[]=200`;

    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('UG API error:', res.status, text);
      return NextResponse.json({ error: `UG API returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const tabs: UGTab[] = data?.tabs || [];

    // Sort by rating (descending), take top 10
    const sorted = tabs
      .filter((t: UGTab) => t.type === 'Chords' || t.type === 'Tab')
      .sort((a: UGTab, b: UGTab) => b.rating - a.rating || b.votes - a.votes)
      .slice(0, 10);

    const results = sorted.map((t: UGTab) => ({
      id: t.id,
      songName: t.song_name,
      artist: t.artist_name,
      type: t.type,
      version: t.version,
      votes: t.votes,
      rating: t.rating,
      tonality: t.tonality_name || '',
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Tab search error:', err);
    return NextResponse.json({ error: 'Tab keresés nem elérhető' }, { status: 502 });
  }
}
