# ChordMate — Implementációs útmutató (Windsurf)

Ez a dokumentum a Windsurf AI számára készült lépésenkénti útmutató a ChordMate projekt felépítéséhez.

## Implementációs sorrend

A project felépítésének ajánlott sorrendje, minden lépés az előzőre épít:

---

### 1. LÉPÉS: Projekt inicializálás

```bash
npx create-next-app@latest chordmate --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd chordmate
```

Szükséges csomagok telepítése:
```bash
# Drizzle ORM + Vercel Postgres
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit

# Auth
npm install next-auth@beta @auth/drizzle-adapter

# UI
npx shadcn@latest init
npx shadcn@latest add button input textarea card dialog alert-dialog dropdown-menu select badge tooltip skeleton separator avatar

# Egyéb
npm install react-youtube zod sonner date-fns lucide-react
```

Fájlok létrehozása:
- `.env.local` az `.env.local.example` alapján (ld. ARCHITECTURE.md)
- `drizzle.config.ts` (ld. ARCHITECTURE.md)

---

### 2. LÉPÉS: Adatbázis schema & migráció

Fájl: `src/lib/db/schema.ts` — teljes schema a DATABASE.md-ből.

Fájl: `src/lib/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

Futtatás:
```bash
npx drizzle-kit push
```

---

### 3. LÉPÉS: NextAuth konfiguráció

Fájl: `src/lib/auth.ts` — ld. ARCHITECTURE.md auth szekció.

Fájl: `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

Fájl: `middleware.ts` — ld. ARCHITECTURE.md middleware szekció.

Session provider wrapper:
```typescript
// src/components/providers/session-provider.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Root layout-ba beilleszteni a provider-t.

---

### 4. LÉPÉS: Utility függvények

Fájl: `src/lib/utils.ts`:
- `cn()` (clsx + tailwind-merge, shadcn generálja)
- `extractYoutubeId()` (ld. ARCHITECTURE.md)
- `formatDate()` helper date-fns-szel

Fájl: `src/lib/validators.ts` — Zod sémák (ld. ARCHITECTURE.md)

---

### 5. LÉPÉS: Layout & Navigáció

Fájl: `src/app/layout.tsx`:
- Globális font (Geist vagy hasonló)
- `AuthSessionProvider` wrapper
- `Toaster` komponens (sonner)
- Dark mode support (`class` strategy a tailwind configban)

Fájl: `src/components/layout/navbar.tsx`:
- Logo (bal)
- Nav linkek: "Naptár" (`/dashboard`), "Dalok" (`/songs`)
- User menu dropdown (jobb): avatar, név, kijelentkezés
- Mobil hamburger menü

Fájl: `src/app/page.tsx`:
- Redirect: ha session → `/dashboard`, ha nincs → `/login`

---

### 6. LÉPÉS: Login oldal

Fájl: `src/app/login/page.tsx`
Fájl: `src/components/auth/login-form.tsx`

- Középre igazított kártya
- ChordMate logo + subtitle
- Google login gomb
- GitHub login gomb
- `signIn()` hívás NextAuth-tal

---

### 7. LÉPÉS: Server Actions — Songs CRUD

Fájl: `src/actions/songs.ts`

Implementálandó akciók:
- `getSongs(search?: string)` — dalok lekérdezése (opcionális keresés)
- `getSongById(id: string)` — egy dal lekérdezése
- `createSong(formData: FormData)` — új dal létrehozása
- `updateSong(id: string, formData: FormData)` — dal frissítése
- `deleteSong(id: string)` — dal törlése

Minden akció:
1. Ellenőrzi a session-t (`auth()`)
2. Validálja az inputot (Zod)
3. DB művelet (Drizzle)
4. `revalidatePath()` hívás
5. Hiba esetén megfelelő error return

---

### 8. LÉPÉS: Dalok oldal

Fájl: `src/app/songs/page.tsx` — Server component, dalok betöltése
Fájl: `src/components/songs/song-list.tsx` — Dal kártyák listája
Fájl: `src/components/songs/song-card.tsx` — Egyedi dal kártya
Fájl: `src/components/songs/song-search.tsx` — Kereső (client component, debounced, URL search params)
Fájl: `src/components/songs/delete-song-dialog.tsx` — Törlés megerősítő

Fájl: `src/app/songs/new/page.tsx` — Új dal form oldal
Fájl: `src/app/songs/[id]/edit/page.tsx` — Szerkesztés form oldal
Fájl: `src/components/songs/song-form.tsx` — Újrahasználható form (create + edit)

---

### 9. LÉPÉS: YouTube lejátszó

Fájl: `src/components/youtube/youtube-player.tsx`

Props:
- `url: string` — YouTube URL
- `compact?: boolean` — kompakt mód (kis thumbnail)
- `autoplay?: boolean`

Működés:
- `extractYoutubeId()` hívása
- Ha valid → `react-youtube` `<YouTube />` komponens renderelése
- Responsive wrapper (`aspect-video`)
- Ha invalid URL → error message

---

### 10. LÉPÉS: Server Actions — Calendar

Fájl: `src/actions/calendar.ts`

Implementálandó akciók:
- `getCalendarEntries(year: number, month: number)` — havi bejegyzések dalokkal együtt
- `assignSongToDate(songId: string, date: string)` — dal hozzárendelése naphoz
- `removeSongFromDate(entryId: string)` — dal eltávolítása napról
- `reorderSongsOnDate(date: string, orderedIds: string[])` — sorrend módosítás (opcionális)

---

### 11. LÉPÉS: Dashboard / Naptár

Fájl: `src/app/dashboard/page.tsx` — Server component, havi adatok betöltése

Fájl: `src/components/calendar/calendar-header.tsx`:
- Hónap/év megjelenítés
- Előző/következő hónap gombok
- "Ma" gomb

Fájl: `src/components/calendar/calendar-grid.tsx`:
- 7 oszlopos grid (H, K, Sz, Cs, P, Sz, V)
- `date-fns` a napok kiszámításához
- Hónap napjainak renderelése
- URL search params-ban tároljuk a kiválasztott year/month/day-t

Fájl: `src/components/calendar/calendar-day-cell.tsx`:
- Nap száma
- Pont indikátor ha vannak dalok
- Dalok számát mutató badge
- Kattintás → kiválasztás (URL param update)
- Mai nap kiemelés

Fájl: `src/components/calendar/day-detail-panel.tsx`:
- Kiválasztott nap dátuma
- Hozzárendelt dalok listája (kártyák)
- Minden dalnál: cím, előadó, play gomb, eltávolítás gomb
- YouTube player (ha egy dal lejátszás alatt)
- "Dal hozzáadása" gomb → Dialog combobox-szal (keresés a meglévő dalok között)

---

### 12. LÉPÉS: Loading & Error állapotok

- `src/app/dashboard/loading.tsx` — naptár skeleton
- `src/app/songs/loading.tsx` — dal lista skeleton
- `src/components/shared/empty-state.tsx` — újrahasználható üres állapot
- Toast értesítések minden CRUD művelet után (sonner)

---

### 13. LÉPÉS: Finomhangolás & polish

- Dark/light mode toggle (opcionális)
- Hover animációk a kártyákon
- Naptár cellák smooth transition-jei
- Mobil reszponzivitás tesztelése
- Accessibility: fokusz állapotok, aria labelek
- Meta adatok: title, description minden oldalon

---

## Fontos megjegyzések Windsurf-nek

1. **App Router**: Mindig az App Router szintaxist használd (nem Pages Router)
2. **Server vs Client**: Alapértelmezetten Server Component. Csak akkor `'use client'` ha interaktivitás kell (useState, useEffect, onClick, stb.)
3. **Server Actions**: Az `'use server'` fájlok tetején. FormData-t fogadnak, `revalidatePath()`-t hívnak.
4. **Magyar UI**: Minden felhasználónak látható szöveg magyarul legyen.
5. **TypeScript strict**: Nincs `any`, minden típusozva.
6. **shadcn/ui**: A komponenseket `npx shadcn@latest add <name>` paranccsal kell telepíteni, NEM kézzel létrehozni.
7. **Import alias**: `@/` → `src/`
8. **Drizzle**: Relational queries használata (`db.query.songs.findMany({ with: {...} })`)
9. **Error handling**: Minden server action try-catch-ben, user-friendly hibaüzenetekkel.
