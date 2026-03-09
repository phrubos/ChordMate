# ChordMate — Database Schema (Drizzle ORM)

## Teljes schema fájl

Az alábbi kódot kell implementálni a `src/lib/db/schema.ts` fájlban.

```typescript
import {
  pgTable,
  text,
  timestamp,
  integer,
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

/**
 * SONGS tábla
 * Tartalmazza az összes dalt amit a felhasználók felvettek.
 */
export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  difficulty: integer('difficulty'),          // 1-5, opcionális
  notes: text('notes'),                       // szabadszöveges megjegyzés
  addedById: text('added_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

/**
 * CALENDAR_ENTRIES tábla
 * Összekapcsolja a dalokat a naptári napokkal.
 * Egy naphoz több dal, egy dalhoz több nap tartozhat (many-to-many).
 */
export const calendarEntries = pgTable(
  'calendar_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date', { mode: 'string' }).notNull(),   // 'YYYY-MM-DD' formátum
    songId: uuid('song_id')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    addedById: text('added_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0),          // sorrend a napon belül
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (entry) => ({
    // Egy dal csak egyszer szerepelhet egy adott napon
    uniqueSongDate: uniqueIndex('unique_song_date').on(entry.songId, entry.date),
  })
);

// ============================================================
// Relációk
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  songs: many(songs),
  calendarEntries: many(calendarEntries),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  addedBy: one(users, {
    fields: [songs.addedById],
    references: [users.id],
  }),
  calendarEntries: many(calendarEntries),
}));

export const calendarEntriesRelations = relations(calendarEntries, ({ one }) => ({
  song: one(songs, {
    fields: [calendarEntries.songId],
    references: [songs.id],
  }),
  addedBy: one(users, {
    fields: [calendarEntries.addedById],
    references: [users.id],
  }),
}));
```

## ER diagram

```
┌──────────────┐       ┌──────────────────┐       ┌───────────────────┐
│    users     │       │      songs       │       │ calendar_entries  │
├──────────────┤       ├──────────────────┤       ├───────────────────┤
│ id (PK)      │──┐    │ id (PK, uuid)    │──┐    │ id (PK, uuid)     │
│ name         │  │    │ title            │  │    │ date (date)       │
│ email        │  │    │ artist           │  │    │ song_id (FK)  ────┘
│ email_verified│  │    │ youtube_url      │  │    │ added_by_id (FK)──┐
│ image        │  │    │ difficulty (1-5) │  │    │ sort_order        │
└──────────────┘  │    │ notes            │  │    │ created_at        │
                  │    │ added_by_id (FK)─┘  │    └───────────────────┘
                  │    │ created_at        │  │
                  └────│ updated_at        │  │
                       └──────────────────┘  │
                                              │
              UNIQUE(song_id, date) ──────────┘
```

## Főbb query-k referencia

### Dalok lekérdezése kereséssel
```typescript
const results = await db.query.songs.findMany({
  where: or(
    ilike(songs.title, `%${search}%`),
    ilike(songs.artist, `%${search}%`)
  ),
  with: { addedBy: true },
  orderBy: [desc(songs.createdAt)],
});
```

### Adott hónap naptár bejegyzései
```typescript
const entries = await db.query.calendarEntries.findMany({
  where: and(
    gte(calendarEntries.date, `${year}-${month.toString().padStart(2, '0')}-01`),
    lte(calendarEntries.date, `${year}-${month.toString().padStart(2, '0')}-31`)
  ),
  with: {
    song: true,
    addedBy: true,
  },
  orderBy: [asc(calendarEntries.date), asc(calendarEntries.sortOrder)],
});
```

### Dal hozzárendelése naphoz
```typescript
await db.insert(calendarEntries).values({
  date: '2025-03-15',
  songId: songId,
  addedById: userId,
  sortOrder: nextOrder,
}).onConflictDoNothing();
```
