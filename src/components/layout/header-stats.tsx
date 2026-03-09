import { getSongStats } from '@/actions/songs';
import { getCalendarStats } from '@/actions/calendar';
import { StatsWidget } from '@/components/dashboard/stats-widget';

export async function HeaderStats() {
    const [songStats, calendarStats] = await Promise.all([
        getSongStats(),
        getCalendarStats(),
    ]);

    return (
        <StatsWidget
            totalSongs={songStats.totalSongs}
            withTabs={songStats.withTabs}
            favorites={songStats.favorites}
            avgDifficulty={songStats.avgDifficulty}
            totalPracticeDays={calendarStats.totalPracticeDays}
        />
    );
}
