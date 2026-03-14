import { NextRequest, NextResponse } from 'next/server';

interface VideoResult {
  url: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
  views: number;
}

function parseDuration(text: string): number {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function parseViewCount(text: string): number {
  if (!text) return 0;
  const clean = text.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideos(data: any): VideoResult[] {
  const results: VideoResult[] = [];

  try {
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    if (!Array.isArray(contents)) return results;

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const video = item?.videoRenderer;
        if (!video?.videoId) continue;

        const title =
          video.title?.runs?.map((r: { text: string }) => r.text).join('') ||
          video.title?.simpleText ||
          '';
        const channel =
          video.ownerText?.runs?.[0]?.text ||
          video.shortBylineText?.runs?.[0]?.text ||
          '';
        const durationText = video.lengthText?.simpleText || '';
        const viewText =
          video.viewCountText?.simpleText ||
          video.viewCountText?.runs?.map((r: { text: string }) => r.text).join('') ||
          '';
        const thumbnail =
          video.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || '';

        results.push({
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          title,
          thumbnail,
          channel,
          duration: parseDuration(durationText),
          views: parseViewCount(viewText),
        });

        if (results.length >= 10) return results;
      }
    }
  } catch {
    // Parsing failed — return whatever we have
  }

  return results;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `YouTube returned ${res.status}` }, { status: 502 });
    }

    const html = await res.text();

    // Extract ytInitialData JSON from the HTML
    const marker = 'var ytInitialData = ';
    const start = html.indexOf(marker);
    if (start === -1) {
      return NextResponse.json({ error: 'Could not parse YouTube response' }, { status: 502 });
    }

    const jsonStart = start + marker.length;
    // Find the closing semicolon for the JSON assignment
    let depth = 0;
    let jsonEnd = jsonStart;
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') depth--;
      if (depth === 0) {
        jsonEnd = i + 1;
        break;
      }
    }

    const jsonStr = html.slice(jsonStart, jsonEnd);
    const ytData = JSON.parse(jsonStr);
    const results = extractVideos(ytData);

    if (results.length === 0) {
      return NextResponse.json({ results: [], message: 'No results found' });
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'YouTube keresés nem elérhető' }, { status: 502 });
  }
}
