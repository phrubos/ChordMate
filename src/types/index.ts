import type { songs, calendarEntries, users, recordings, bands, bandMembers } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type Song = InferSelectModel<typeof songs>;
export type CalendarEntry = InferSelectModel<typeof calendarEntries>;
export type Recording = InferSelectModel<typeof recordings>;
export type Band = InferSelectModel<typeof bands>;
export type BandMember = InferSelectModel<typeof bandMembers>;

export type RecordingMeta = Omit<Recording, 'audioData'>;

export type BandWithMembers = Band & {
  members: (BandMember & { user: Pick<User, 'id' | 'name' | 'image' | 'email'> })[];
};

export type SongWithUser = Song & {
  addedBy: Pick<User, 'id' | 'name' | 'image'>;
};

export type CalendarEntryWithSong = CalendarEntry & {
  song: Song;
  addedBy: Pick<User, 'id' | 'name' | 'image'>;
};
