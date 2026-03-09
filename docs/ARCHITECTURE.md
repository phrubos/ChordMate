# ChordMate — Technical Architecture

## 1. Projekt struktúra

```
chordmate/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (providers, fonts, theme)
│   │   ├── page.tsx                    # Redirect → /dashboard vagy /login
│   │   ├── globals.css                 # Tailwind + custom CSS variables
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Naptárnézet + napi dalok
│   │   │   └── loading.tsx             # Skeleton loader
│   │   ├── songs/
│   │   │   ├── page.tsx                # Dallista (keresés, szűrés)
│   │   │   ├── loading.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Új dal form
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx        # Dal szerkesztés form
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts        # NextAuth API handler
│   ├── components/
│   │   ├── ui/                         # shadcn/ui komponensek
│   │   ├── calendar/
│   │   │   ├── calendar-grid.tsx       # Hónapos naptár grid
│   │   │   ├── calendar-header.tsx     # Hónap navigáció
│   │   │   ├── calendar-day-cell.tsx   # Egy nap cellája
│   │   │   └── day-detail-panel.tsx    # Kiválasztott nap részletei (jobb oldali panel)
│   │   ├── songs/
│   │   │   ├── song-card.tsx           # Dal kártya (lista elemhez)
│   │   │   ├── song-form.tsx           # Dal hozzáadás/szerkesztés form
│   │   │   ├── song-list.tsx           # Dalok listája szűréssel
│   │   │   ├── song-search.tsx         # Kereső input
│   │   │   └── delete-song-dialog.tsx  # Törlés megerősítő dialog
│   │   ├── youtube/
│   │   │   └── youtube-player.tsx      # YouTube beágyazott lejátszó
│   │   ├── auth/
│   │   │   ├── login-form.tsx          # Login gombok
│   │   │   └── user-menu.tsx           # User avatar + logout dropdown
│   │   ├── layout/
│   │   │   ├── navbar.tsx              # Felső navigáció
│   │   │   ├── sidebar.tsx             # (opcionális) Oldalsó menü
│   │   │   └── mobile-nav.tsx          # Mobil navigáció
│   │   └── shared/
│   │       ├── page-header.tsx         # Oldal címsor
│   │       └── empty-state.tsx         # Üres állapot placeholder
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth konfiguráció
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle client inicializálás
│   │   │   ├── schema.ts              # Drizzle schema definíciók
│   │   │   └── migrations/            # Drizzle migrációk
│   │   ├── utils.ts                   # Utility függvények (cn, YouTube URL parse, stb.)
│   │   └── validators.ts             # Zod sémák form validációhoz
│   ├── actions/
│   │   ├── songs.ts                   # Server Actions: CRUD dalokhoz
│   │   └── calendar.ts               # Server Actions: napi dal hozzárendelések
│   └── types/
│       └── index.ts                   # TypeScript type definíciók
├── drizzle.config.ts                  # Drizzle Kit konfiguráció
├── middleware.ts                      # NextAuth route protection
├── tailwind.config.ts
├── next.config.mjs
├── .env.local.example                 # Environment változók template
├── package.json
└── tsconfig.json
```

## 2. Adatbázis kapcsolat

### Vercel Postgres / Neon

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

### Drizzle config

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

## 3. Autentikáció

### NextAuth.js v5 (Auth.js)

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
```

### Middleware

```typescript
// middleware.ts
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

## 4. Server Actions

### Songs CRUD

```typescript
// src/actions/songs.ts
'use server';

import { db } from '@/lib/db';
import { songs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { songSchema } from '@/lib/validators';

export async function createSong(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const data = songSchema.parse({
    title: formData.get('title'),
    artist: formData.get('artist'),
    youtubeUrl: formData.get('youtubeUrl'),
    difficulty: Number(formData.get('difficulty')),
    notes: formData.get('notes'),
  });

  await db.insert(songs).values({
    ...data,
    addedById: session.user.id,
  });

  revalidatePath('/songs');
  revalidatePath('/dashboard');
}

export async function updateSong(id: string, formData: FormData) { /* ... */ }
export async function deleteSong(id: string) { /* ... */ }
```

### Calendar Actions

```typescript
// src/actions/calendar.ts
'use server';

export async function assignSongToDate(songId: string, date: string) { /* ... */ }
export async function removeSongFromDate(songId: string, date: string) { /* ... */ }
export async function getSongsForDate(date: string) { /* ... */ }
export async function getSongsForMonth(year: number, month: number) { /* ... */ }
```

## 5. Validáció (Zod)

```typescript
// src/lib/validators.ts
import { z } from 'zod';

export const songSchema = z.object({
  title: z.string().min(1, 'A cím megadása kötelező').max(200),
  artist: z.string().min(1, 'Az előadó megadása kötelező').max(200),
  youtubeUrl: z
    .string()
    .url('Érvénytelen URL')
    .refine(
      (url) => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url),
      'Érvényes YouTube linket adj meg'
    ),
  difficulty: z.number().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
});
```

## 6. YouTube URL feldolgozás

```typescript
// src/lib/utils.ts
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
```

## 7. Environment változók

```bash
# .env.local.example

# Database (Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=  # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 8. Kulcs dependenciák

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "react-dom": "^18.3",
    "next-auth": "^5.0.0-beta",
    "@auth/drizzle-adapter": "^1.0",
    "drizzle-orm": "^0.33",
    "@vercel/postgres": "^0.10",
    "react-youtube": "^10.1",
    "zod": "^3.23",
    "sonner": "^1.5",
    "lucide-react": "^0.400",
    "date-fns": "^3.6",
    "class-variance-authority": "^0.7",
    "clsx": "^2.1",
    "tailwind-merge": "^2.4",
    "@radix-ui/react-dialog": "^1.1",
    "@radix-ui/react-dropdown-menu": "^2.1",
    "@radix-ui/react-select": "^2.1",
    "@radix-ui/react-tooltip": "^1.1"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "drizzle-kit": "^0.24",
    "tailwindcss": "^3.4",
    "postcss": "^8.4",
    "autoprefixer": "^10.4",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

## 9. Deployment (Vercel)

1. GitHub repo → Vercel projekt csatlakoztatás
2. Vercel Postgres addon hozzáadása (vagy Neon külső DB)
3. Environment változók beállítása Vercel Dashboard-on
4. `vercel build` automatikusan fut push-ra
5. Drizzle migráció futtatása: `npx drizzle-kit push`

## 10. Fejlesztői parancsok

```bash
# Fejlesztés
npm run dev

# DB migráció generálás
npx drizzle-kit generate

# DB migráció futtatás
npx drizzle-kit push

# Drizzle Studio (DB böngésző)
npx drizzle-kit studio

# Build
npm run build
```
