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

// Strip UG's [tab][/tab] [ch][/ch] BBCode-style markers to plain text
function cleanTabContent(raw: string): string {
  return raw
    .replace(/\[tab\]/gi, '')
    .replace(/\[\/tab\]/gi, '')
    .replace(/\[ch\]/gi, '')
    .replace(/\[\/ch\]/gi, '');
}

export async function GET(req: NextRequest) {
  const tabId = req.nextUrl.searchParams.get('id');
  if (!tabId) {
    return NextResponse.json({ error: 'Missing tab id' }, { status: 400 });
  }

  try {
    const url = `${UG_API}/tab/info?tab_id=${encodeURIComponent(tabId)}&tab_access_type=public`;

    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `UG API returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data?.content;

    if (!content) {
      return NextResponse.json({ error: 'No tab content found' }, { status: 404 });
    }

    return NextResponse.json({
      content: cleanTabContent(content),
      songName: data.song_name || '',
      artist: data.artist_name || '',
      tonality: data.tonality_name || '',
      capo: data.capo || 0,
      tuning: data.tuning || '',
      difficulty: data.difficulty || '',
    });
  } catch (err) {
    console.error('Tab fetch error:', err);
    return NextResponse.json({ error: 'Tab letöltés nem elérhető' }, { status: 502 });
  }
}
