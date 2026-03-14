import type { songs, calendarEntries, users, recordings } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type Song = InferSelectModel<typeof songs>;
export type CalendarEntry = InferSelectModel<typeof calendarEntries>;
export type Recording = InferSelectModel<typeof recordings>;

export type RecordingMeta = Omit<Recording, 'audioData'>;

export type SongWithUser = Song & {
  addedBy: Pick<User, 'id' | 'name' | 'image'>;
};

export type CalendarEntryWithSong = CalendarEntry & {
  song: Song;
  addedBy: Pick<User, 'id' | 'name' | 'image'>;
};
