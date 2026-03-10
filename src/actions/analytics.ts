'use server';

import { db } from '@/lib/db';
import { calendarEntries, songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { asc, sql, desc, eq } from 'drizzle-orm';
import { format, subDays, startOfDay } from 'date-fns';

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
  // 3. Weekly trend: last 12 weeks
  // --------------------------------------------------
  const weeklyTrend: { week: string; practiceDays: number; songCount: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const weekStart = subDays(today, i * 7 + 6);
    const weekEnd = subDays(today, i * 7);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    const weekEntries = allEntries.filter(
      (e) => e.date >= weekStartStr && e.date <= weekEndStr
    );

    const uniqueDays = new Set(weekEntries.map((e) => e.date));

    weeklyTrend.push({
      week: format(weekStart, 'MM.dd'),
      practiceDays: uniqueDays.size,
      songCount: weekEntries.length,
    });
  }

  // --------------------------------------------------
  // 4. Neglected songs (30+ days since last practice)
  // --------------------------------------------------
  const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const neglectedSongs = [...songPracticeCounts.values()]
    .filter((s) => s.lastDate < thirtyDaysAgo)
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate))
    .slice(0, 10);

  // --------------------------------------------------
  // 5. Summary KPIs
  // --------------------------------------------------
  const totalPracticeDays = new Set(allEntries.map((e) => e.date)).size;
  const totalSongsEverPracticed = songPracticeCounts.size;
  const totalPracticeSessions = allEntries.length;

  // Current streak
  let streak = 0;
  let checkDate = todayStr;
  const allDatesSet = new Set(allEntries.map((e) => e.date));
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (allDatesSet.has(d)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    heatmapData,
    topSongs,
    weeklyTrend,
    neglectedSongs,
    kpis: {
      totalPracticeDays,
      totalSongsEverPracticed,
      totalPracticeSessions,
      currentStreak: streak,
    },
  };
}
