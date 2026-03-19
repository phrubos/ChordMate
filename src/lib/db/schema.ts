import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uuid,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ============================================================
// NextAuth.js szükséges táblák (Auth.js / DrizzleAdapter)
// ============================================================

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  })
);

// ============================================================
// ChordMate alkalmazás táblák
// ============================================================

export const bands = pgTable('bands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  logoData: text('logo_data'),
  backgroundData: text('background_data'),
  createdById: text('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const bandMembers = pgTable(
  'band_members',
  {
    bandId: uuid('band_id')
      .notNull()
      .references(() => bands.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').$type<'admin' | 'member'>().notNull().default('member'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (bm) => ({
    pk: primaryKey({ columns: [bm.bandId, bm.userId] }),
  })
);

export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  youtubeUrl: text('youtube_url'),
  difficulty: integer('difficulty'),
  notes: text('notes'),
  tabContent: text('tab_content'),
  tabUrl: text('tab_url'),
  imageUrl: text('image_url'),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  bandId: uuid('band_id').references(() => bands.id, { onDelete: 'cascade' }),
  addedById: text('added_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const calendarEntries = pgTable(
  'calendar_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date', { mode: 'string' }).notNull(),
    songId: uuid('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    bandId: uuid('band_id').references(() => bands.id, { onDelete: 'cascade' }),
    addedById: text('added_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  }
);

export const recordings = pgTable('recordings', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date', { mode: 'string' }).notNull(),
  name: text('name').notNull(),
  audioData: text('audio_data').notNull(),
  mimeType: text('mime_type').notNull(),
  duration: integer('duration').notNull(),
  bandId: uuid('band_id').references(() => bands.id, { onDelete: 'cascade' }),
  addedById: text('added_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================
// Relációk
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  songs: many(songs),
  calendarEntries: many(calendarEntries),
  recordings: many(recordings),
  bandMemberships: many(bandMembers),
}));

export const bandsRelations = relations(bands, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [bands.createdById],
    references: [users.id],
  }),
  members: many(bandMembers),
  songs: many(songs),
  calendarEntries: many(calendarEntries),
  recordings: many(recordings),
}));

export const bandMembersRelations = relations(bandMembers, ({ one }) => ({
  band: one(bands, {
    fields: [bandMembers.bandId],
    references: [bands.id],
  }),
  user: one(users, {
    fields: [bandMembers.userId],
    references: [users.id],
  }),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  addedBy: one(users, {
    fields: [songs.addedById],
    references: [users.id],
  }),
  band: one(bands, {
    fields: [songs.bandId],
    references: [bands.id],
  }),
  calendarEntries: many(calendarEntries),
}));

export const calendarEntriesRelations = relations(calendarEntries, ({ one }) => ({
  song: one(songs, {
    fields: [calendarEntries.songId],
    references: [songs.id],
  }),
  band: one(bands, {
    fields: [calendarEntries.bandId],
    references: [bands.id],
  }),
  addedBy: one(users, {
    fields: [calendarEntries.addedById],
    references: [users.id],
  }),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  addedBy: one(users, {
    fields: [recordings.addedById],
    references: [users.id],
  }),
  band: one(bands, {
    fields: [recordings.bandId],
    references: [bands.id],
  }),
}));
