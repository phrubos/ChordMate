'use server';

import { db } from '@/lib/db';
import { calendarEntries, songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { asc, sql, desc, eq } from 'drizzle-orm';
import { format, subDays, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';

export async function getAnalyticsData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // All entries with song info
  const allEntries = await db.query.calendarEntries.findMany({
    with: { song: true },
    orderBy: [asc(calendarEntries.date)],
  });

  // --------------------------------------------------
  // 1. Heatmap data: last 365 days → date → songCount
  // --------------------------------------------------
  const today = startOfDay(new Date());
  const yearAgo = subDays(today, 364);
  const heatmapData: Record<string, number> = {};

  for (const entry of allEntries) {
    const entryDate = new Date(entry.date);
    if (entryDate >= yearAgo && entryDate <= today) {
      heatmapData[entry.date] = (heatmapData[entry.date] ?? 0) + 1;
    }
  }

  // --------------------------------------------------
  // 2. Top 10 most practiced songs
  // --------------------------------------------------
  const songPracticeCounts = new Map<string, { title: string; artist: string; count: number; lastDate: string }>();

  for (const entry of allEntries) {
    const existing = songPracticeCounts.get(entry.songId);
    if (existing) {
      existing.count++;
      if (entry.date > existing.lastDate) existing.lastDate = entry.date;
    } else {
      songPracticeCounts.set(entry.songId, {
        title: entry.song.title,
        artist: entry.song.artist,
        count: 1,
        lastDate: entry.date,
      });
    }
  }

  const topSongs = [...songPracticeCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --------------------------------------------------
  // 3. Monthly trend: last 12 months
  // --------------------------------------------------
  const monthlyTrend: { month: string; practiceDays: number; songCount: number }[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const monthStartStr = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
    const monthEndStr = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');

    const monthEntries = allEntries.filter(
      (e) => e.date >= monthStartStr && e.date <= monthEndStr
    );

    const uniqueDays = new Set(monthEntries.map((e) => e.date));

    monthlyTrend.push({
      month: format(d, 'MMM', { locale: hu }).replace('.', ''),
      practiceDays: uniqueDays.size,
      songCount: monthEntries.length,
    });
  }

  // --------------------------------------------------
  // 4. Neglected songs (90+ days since last practice)
  // --------------------------------------------------
  const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const neglectedSongs = [...songPracticeCounts.values()]
    .filter((s) => s.lastDate < ninetyDaysAgo)
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate))
    .slice(0, 10);

  // --------------------------------------------------
  // 5. Summary KPIs
  // --------------------------------------------------
  const uniqueDates = [...new Set(allEntries.map((e) => e.date))];
  const pastDates = uniqueDates.filter((d) => d <= todayStr).sort().reverse();
  const futureDates = uniqueDates.filter((d) => d > todayStr);

  const totalPracticeDays = uniqueDates.length;
  const pastPracticeDays = pastDates.length;
  const futurePracticeDays = futureDates.length;
  
  const totalSongsEverPracticed = songPracticeCounts.size;
  const totalPracticeSessions = allEntries.length;

  // Last practice (days ago & formatted date)
  let lastPracticeDaysAgo: number | null = null;
  let lastPracticeDateFormatted: string | null = null;

  if (pastDates.length > 0) {
    const lastDate = new Date(pastDates[0] + 'T00:00:00');
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    lastPracticeDaysAgo = diffDays;
    lastPracticeDateFormatted = format(lastDate, 'MMM d.', { locale: hu });
  }

  return {
    heatmapData,
    topSongs,
    monthlyTrend,
    neglectedSongs,
    kpis: {
      totalPracticeDays,
      pastPracticeDays,
      futurePracticeDays,
      totalSongsEverPracticed,
      totalPracticeSessions,
      lastPracticeDaysAgo,
      lastPracticeDateFormatted,
    },
  };
}

