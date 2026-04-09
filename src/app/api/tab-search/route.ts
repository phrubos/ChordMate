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

// Normalize a string for fuzzy matching: strip accents, lowercase, trim
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Extract significant words (len>=2, no stop words) from a string
const STOP_WORDS = new Set(['a', 'az', 'és', 'egy', 'the', 'on', 'in', 'at', 'is', 'of', 'to', 'im', "i'm", 'my', 'me', 'and', 'or', 'for', 'by', 'with', 'from']);
function significantWords(s: string): string[] {
  return normalize(s)
    .replace(/[&]/g, 'and')
    .replace(/[-–''`']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

// Compute how many significant words from the search title appear in the song name
function titleWordOverlap(searchTitle: string, songName: string): number {
  const searchWords = significantWords(searchTitle);
  const songWords = significantWords(songName);
  if (searchWords.length === 0) return 0;
  let matches = 0;
  for (const sw of searchWords) {
    if (songWords.some(w => w.includes(sw) || sw.includes(w))) matches++;
  }
  return matches / searchWords.length; // 0..1 ratio
}

// Compute artist name similarity
function artistOverlap(searchArtist: string, resultArtist: string): number {
  const searchWords = significantWords(searchArtist);
  const resultWords = significantWords(resultArtist);
  if (searchWords.length === 0) return 0;
  let matches = 0;
  for (const sw of searchWords) {
    if (resultWords.some(w => w.includes(sw) || sw.includes(w))) matches++;
  }
  return matches / searchWords.length;
}

// Clean up a string for UG search: replace & with and, strip special chars
function cleanForSearch(s: string): string {
  return s
    .replace(/&/g, 'and')
    .replace(/[''`']/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate search query variations for better UG API coverage
function generateQueryVariations(title: string, artist: string): string[] {
  const queries: string[] = [];
  const seen = new Set<string>();

  function add(q: string) {
    const key = q.toLowerCase().trim();
    if (key.length > 0 && !seen.has(key)) {
      seen.add(key);
      queries.push(q.trim());
    }
  }

  // 1. Original: "title artist"
  add(`${title} ${artist}`);

  // 2. Cleaned version: replace & with "and", strip apostrophes
  const cleanTitle = cleanForSearch(title);
  const cleanArtist = cleanForSearch(artist);
  add(`${cleanTitle} ${cleanArtist}`);

  // 3. Just the title (cleaned)
  add(cleanTitle);

  // 4. Just the artist (for browsing their catalog)
  add(cleanArtist);

  // 5. Strip articles from title
  const strippedTitle = cleanTitle.replace(/^(a\s+|az\s+|the\s+)/i, '').trim();
  if (strippedTitle !== cleanTitle) {
    add(`${strippedTitle} ${cleanArtist}`);
  }

  // 6. Extract just alphanumeric "core" words from the title
  const coreWords = cleanTitle
    .split(/\s+/)
    .filter(w => w.length > 1)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()));
  if (coreWords.length > 0 && coreWords.join(' ') !== cleanTitle) {
    add(`${coreWords.join(' ')} ${cleanArtist}`);
  }

  // 7. For titles with numbers (e.g. "'74-'75"), try with numbers extracted
  const numbers = title.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    add(`${numbers.join(' ')} ${cleanArtist}`);
  }

  return queries;
}

async function searchUG(query: string): Promise<UGTab[]> {
  // Build URL manually to avoid URLSearchParams encoding brackets
  // type[]=300 = Chords, type[]=200 = Tab
  const encodedQuery = encodeURIComponent(query);
  const url = `${UG_API}/tab/search?title=${encodedQuery}&type[]=300&type[]=200&page=1`;

  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`UG API returned ${res.status} for query: "${query}"`);
      return [];
    }

    const data = await res.json();
    return (data?.tabs || []) as UGTab[];
  } catch (err) {
    console.error(`UG search failed for query "${query}":`, err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const artist = req.nextUrl.searchParams.get('artist') ?? '';
  const title = artist
    ? query.replace(new RegExp(`\\s*${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '').trim() || query
    : query;

  try {
    const variations = artist
      ? generateQueryVariations(title, artist)
      : [query, cleanForSearch(query)];

    // Run searches in parallel (max 5 variations for better coverage)
    const searches = variations.slice(0, 5).map(q => searchUG(q));
    const allResults = await Promise.all(searches);

    // Merge & deduplicate by tab id
    const seen = new Set<number>();
    const merged: UGTab[] = [];
    for (const tabs of allResults) {
      for (const tab of tabs) {
        if ((tab.type === 'Chords' || tab.type === 'Tab') && !seen.has(tab.id)) {
          seen.add(tab.id);
          merged.push(tab);
        }
      }
    }

    // Score results: weight title relevance, artist match, and quality
    const cleanedTitle = cleanForSearch(title);
    const scored = merged.map(t => {
      const overlap = Math.max(
        titleWordOverlap(title, t.song_name),
        titleWordOverlap(cleanedTitle, t.song_name),
      );
      const artistSimilarity = artist
        ? artistOverlap(artist, t.artist_name)
        : 0;
      const artistMatch = artistSimilarity >= 0.5;

      // Title relevance: overlap 0..1 mapped to 0..2000
      let score = overlap * 2000;

      // Bonus for exact/near-exact title match (also check cleaned version)
      const nTitle = normalize(title);
      const nCleanTitle = normalize(cleanedTitle);
      const nSong = normalize(t.song_name);
      if (nSong === nTitle || nSong === nCleanTitle) {
        score += 1000;
      } else if (nSong.includes(nTitle) || nTitle.includes(nSong) || nSong.includes(nCleanTitle) || nCleanTitle.includes(nSong)) {
        score += 500;
      }

      // Artist match bonus (scaled by similarity)
      if (artistMatch) score += 300 * artistSimilarity;

      // Quality tiebreaker
      score += t.rating * 5 + Math.min(t.votes, 5000) * 0.01;

      return { tab: t, score, overlap, artistMatch, artistSimilarity };
    });

    // Less strict filtering:
    // Accept results where:
    //   - Title words overlap significantly, OR
    //   - Title substring match exists, OR
    //   - Artist matches strongly (for catalog browsing when title is weird)
    const filtered = scored.filter(({ overlap, tab, artistMatch, artistSimilarity }) => {
      // Title word overlap
      if (overlap > 0) return true;

      // Normalized substring match
      const nTitle = normalize(title);
      const nCleanTitle = normalize(cleanedTitle);
      const nSong = normalize(tab.song_name);
      if (nSong.includes(nTitle) || nTitle.includes(nSong)) return true;
      if (nSong.includes(nCleanTitle) || nCleanTitle.includes(nSong)) return true;

      // For short/unusual titles (e.g. "'74-'75"), be more lenient —
      // accept if artist matches well
      const titleWords = significantWords(title);
      if (titleWords.length <= 2 && artistSimilarity >= 0.5) return true;

      // Strong artist match with at least partial title presence
      if (artistMatch) {
        // Check if any number from the title appears in the song name
        const titleNumbers = title.match(/\d+/g);
        if (titleNumbers && titleNumbers.some(n => nSong.includes(n))) return true;
      }

      return false;
    });

    filtered.sort((a, b) => b.score - a.score);
    const top = filtered.slice(0, 15);

    const results = top.map(({ tab: t }) => ({
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
