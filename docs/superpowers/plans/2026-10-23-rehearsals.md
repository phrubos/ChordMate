# Próba entitás Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A próba önálló entitás lesz (idő, hely, cél, jegyzet, típus, jelenlét) saját oldallal és „Próbák” menüponttal; a felvételek dalhoz kötődnek.

**Architecture:** Additív Drizzle-migráció: `rehearsals` (opcionális adat-sor bandánként és naponként), `rehearsal_attendance`, `recordings.song_id`. A próba azonosítója továbbra is (banda, dátum), a setlist a meglévő `calendar_entries`. Tiszta logika `src/lib/rehearsals.ts`-ben (tesztelt), szerver-akciók `src/actions/rehearsals.ts`-ben, hozzáférés a meglévő `lib/access.ts` / `lib/access-server.ts` mintájára.

**Tech Stack:** Next.js 16 App Router, React 19, Drizzle + Neon (Postgres), zod 4, Vitest, Tailwind v4 tokenek, Base UI (shadcn base-nova).

**Spec:** `docs/superpowers/specs/2026-10-23-rehearsals-design.md`

## Global Constraints

- DB-migrációt (`drizzle-kit migrate`) az éles adatbázison **csak a felhasználó jóváhagyásával** futtatunk (AGENTS.md). A `generate` lépés szabad.
- Migráció csak additív: új táblák és nullable oszlop; meglévő oszlop/tábla nem változik, nincs adatmásolás.
- Komponensben nincs nyers szín, csak tokenek; animáció csak a spec A1–A9 szerint (AGENTS.md).
- UI-szótár (AGENTS.md): Próba = esemény, Setlist = dalsor, Próba mód = színpadi nézet, Gyakorlás = egyéni.
- Minden új szerver-akció az `getAccessContext()`-tel kezd, és csak a hozzáférhető sorokat éri el (`lib/access-server.ts`). Új segéd nem kerülhet `'use server'` fájlba, ha nem akció.
- Időformátum: `HH:MM` 24 órás szöveg (`^([01]\d|2[0-3]):[0-5]\d$`). Mezőhosszak: `place` ≤ 120, `goal` ≤ 280, `notes` ≤ 2000.
- Szövegek pontosan a spec „Szövegek” része szerint.
- Lint: új hiba nem kerülhet be (`npx eslint <fájlok>`); `npx tsc --noEmit`, `npm test`, `npm run build` zöld minden task végén.

## Review Focus

- **Banda nélküli felhasználó** (`bandId = null`): Próbák lista és próba oldal működjön a saját soraival; a jelenlét-blokk ne jelenjen meg (nincs kinek jelezni). → Task 2 teszt + Task 6 feltétel.
- **Csak adat, setlist nélkül**: egy napnak lehet `rehearsals` sora dal nélkül (pl. időpont már megvan) — a listában „0 dal”-lal jelenjen meg, a Próba mód gomb ilyenkor ne legyen aktív. → Task 2 teszt + Task 6.
- **Setlist adat-sor nélkül** (minden mai próba): a próba oldal üres részletekkel, „Részletek szerkesztése” első mentése hozza létre a sort. → Task 3 (upsert) + Task 2 teszt.
- **Érvénytelen dátum az URL-ben** (`/rehearsals/2026-13-40`, `/rehearsals/abc`): 404, ne szerverhiba. → Task 6 lépés.
- **Próba törlése**: a nap-panel „Törlöd a próbát?” után az adat-sor és a jelenlét is törlődjön, különben „szellem-próba” marad a listában. → Task 3 teszt-eset a `clearSongsFromDate` bővítésére.

---

### Task 1: Séma és migráció (generálás, futtatás nélkül)

**Files:**
- Modify: `src/lib/db/schema.ts` (új táblák + relációk, `recordings.songId`)
- Modify: `src/types/index.ts`
- Create: `src/lib/db/migrations/0004_<generált>.sql` (+ `meta/`)

**Interfaces:**
- Produces: `rehearsals`, `rehearsalAttendance` táblák; `recordings.songId`; típusok `Rehearsal = InferSelectModel<typeof rehearsals>`, `RehearsalKind = 'rehearsal' | 'gig'`, `AttendanceAnswer = 'yes' | 'maybe' | 'no'`.

- [ ] **Step 1: Séma.** `rehearsals`: `id uuid pk defaultRandom`, `bandId uuid → bands.id onDelete cascade (nullable)`, `date date(mode:'string') notNull`, `startTime text`, `endTime text`, `place text`, `goal text`, `notes text`, `kind text.$type<RehearsalKind>() notNull default 'rehearsal'`, `createdById text notNull → users.id cascade`, `createdAt/updatedAt timestamp defaultNow notNull`; `uniqueIndex('rehearsals_band_date_idx').on(bandId, date)`. `rehearsalAttendance` (`rehearsal_attendance`): `rehearsalId uuid notNull → rehearsals.id cascade`, `userId text notNull → users.id cascade`, `answer text.$type<AttendanceAnswer>() notNull`, `updatedAt`; PK (`rehearsalId`, `userId`). `recordings.songId uuid → songs.id onDelete 'set null'` (nullable). Relációk: `rehearsals` ↔ `attendance` ↔ `users`, `recordings.song`.
- [ ] **Step 2: Generálás.** Run: `npx drizzle-kit generate --name rehearsals`. Expected: új `0004_rehearsals.sql`, benne csak `CREATE TABLE "rehearsals"`, `CREATE TABLE "rehearsal_attendance"`, `ALTER TABLE "recordings" ADD COLUMN "song_id"`, FK-k és az egyedi index — **semmi `DROP` vagy `ALTER COLUMN`**. Ha más is van benne, állj meg és jelezd.
- [ ] **Step 3: Típusok** a `src/types/index.ts`-ben (fenti Produces). Run: `npx tsc --noEmit` → hibátlan.
- [ ] **Step 4: Commit** (`feat(db): rehearsals, attendance, recordings.song_id (migration generated, not applied)`).
- [ ] **Step 5: MEGÁLLÁS — jóváhagyás.** Mutasd meg a felhasználónak a generált SQL-t, és kérj engedélyt a `npx drizzle-kit migrate` futtatására. Javasolt: előbb egy Neon branch-en. Amíg nincs jóváhagyás, a további taskok kódja elkészülhet és tesztelhető (a tiszta függvények DB nélkül futnak), de élő app-ellenőrzés csak migráció után.

### Task 2: Tiszta logika — próbanapok, idősáv, validáció, hozzáférés

**Files:**
- Create: `src/lib/rehearsals.ts`, `src/lib/rehearsals.test.ts`
- Modify: `src/lib/validators.ts`, `src/lib/validators.test.ts`
- Modify: `src/lib/access.ts`, `src/lib/access.test.ts`

**Interfaces:**
- Produces:
  - `interface RehearsalDay { date: string; songCount: number; meta: Pick<Rehearsal,'startTime'|'endTime'|'place'|'kind'|'goal'> | null; isPast: boolean }`
  - `listRehearsalDays(entries: { date: string }[], metas: (Pick<Rehearsal,'date'|'startTime'|'endTime'|'place'|'kind'|'goal'>)[], today: string): { upcoming: RehearsalDay[]; past: RehearsalDay[] }` — upcoming: `date >= today`, növekvő; past: csökkenő.
  - `formatTimeRange(start: string | null, end: string | null): string | null`
  - `rehearsalMetaSchema` (zod) + `type RehearsalMetaInput`
  - `canAccessRehearsal(row: { bandId: string | null; createdById: string }, ctx: AccessContext): boolean`

- [ ] **Step 1: Failing tesztek** `src/lib/rehearsals.test.ts`:
  - `merges setlist days and metadata-only days` — entries `['2026-10-29','2026-10-29','2026-10-16']`, metas `[{date:'2026-11-05', startTime:'19:00', …}]`, today `'2026-10-23'` → `upcoming` dátumai `['2026-10-29','2026-11-05']`, songCount `[2, 0]`, a 11-05 `meta.startTime === '19:00'`; `past` = `['2026-10-16']`, `isPast: true`.
  - `today counts as upcoming` — entry `'2026-10-23'`, today ugyanaz → `upcoming[0].isPast === false`.
  - `formatTimeRange`: `('19:00','21:30') → '19:00–21:30'` (nagykötőjel `–`), `('19:00', null) → '19:00'`, `(null, null) → null`.
  `validators.test.ts`: `rehearsalMetaSchema`
  - elfogad `{ startTime:'19:00', endTime:'21:30', place:'Pince', kind:'gig', goal:'', notes:'' }`, üres időt is (`''` → undefined).
  - elutasít `startTime:'7:00'` („Időpont formátuma: ÓÓ:PP”), `startTime:'21:00', endTime:'19:00'` („A vége legyen a kezdés után”), `place` 121 karakter („Legfeljebb 120 karakter”).
  - `kind` alapértelmezése `'rehearsal'`.
  `access.test.ts`: `canAccessRehearsal` — ugyanazok az esetek, mint `canAccessCalendarEntry` (aktív banda sora igen, más bandáé nem; banda nélkül a saját banda-nélküli sor igen, másé nem), `createdById`-val.
- [ ] **Step 2:** Run `npx vitest run src/lib/rehearsals.test.ts src/lib/validators.test.ts src/lib/access.test.ts` → FAIL (hiányzó exportok).
- [ ] **Step 3: Implementálás** a fenti szignatúrákkal. A `rehearsalMetaSchema` üres sztringet `undefined`-dá alakít (`.or(z.literal(''))` minta a `songSchema`-ból), a vége>kezdés ellenőrzés `superRefine` a `endTime` mezőn, csak ha mindkettő megvan.
- [ ] **Step 4:** Run ugyanaz → PASS.
- [ ] **Step 5: Commit** (`feat(rehearsals): pure helpers, validation and access rule`).

### Task 3: Szerver-akciók

**Files:**
- Create: `src/actions/rehearsals.ts`
- Modify: `src/lib/access-server.ts` (`rehearsalScope(ctx): SQL`)
- Modify: `src/actions/calendar.ts` (`clearSongsFromDate` törli a próba adat-sorát is)

**Interfaces:**
- Consumes: Task 2 (`listRehearsalDays`, `rehearsalMetaSchema`, `canAccessRehearsal`), `getAccessContext`, `calendarScope`, `getCalendarEntries`, `getRecordingsByDate`.
- Produces:
  - `getRehearsalDays(): Promise<{ upcoming: RehearsalDay[]; past: RehearsalDay[] }>`
  - `getRehearsal(date: string): Promise<{ date: string; meta: Rehearsal | null; entries: CalendarEntryWithSong[]; attendance: { userId: string; name: string | null; image: string | null; answer: AttendanceAnswer | null }[]; myAnswer: AttendanceAnswer | null; hasBand: boolean }>` — `attendance` a banda minden tagja (válasz nélkül `null`), banda nélkül üres.
  - `saveRehearsalMeta(date: string, input: RehearsalMetaInput): Promise<void>` — validál, upsert (bandával `onConflictDoUpdate` a (`band_id`,`date`) indexen; banda nélkül find-then-update a `rehearsalScope`-pal), `updatedAt` frissül.
  - `setAttendance(date: string, answer: AttendanceAnswer): Promise<void>` — banda nélkül `throw new Error('No band')`; ha nincs adat-sor, létrehozza (`createdById` = user), majd upsert a (`rehearsalId`,`userId`) PK-n.

- [ ] **Step 1: `rehearsalScope`** a `access-server.ts`-ben, a `calendarScope` mintájára (`bandId` vagy `isNull(bandId) AND createdById = user`).
- [ ] **Step 2: Akciók** a fenti szignatúrákkal, mindegyik `getAccessContext()`-tel kezd. Dátum-validáció: `/^\d{4}-\d{2}-\d{2}$/` és érvényes naptári nap (`isValid(parseISO(date))`), különben `throw new Error('Invalid date')`. `revalidatePath('/rehearsals')`, `revalidatePath(`/rehearsals/${date}`)`, `revalidatePath('/dashboard')`.
- [ ] **Step 3: `clearSongsFromDate`** ugyanabban a hívásban törli a `rehearsals` sort is (`and(eq(rehearsals.date, date), rehearsalScope(ctx))`; a jelenlét kaszkádol).
- [ ] **Step 4: Ellenőrzés.** Run `npx tsc --noEmit && npm test` → zöld. (DB-s viselkedés élőben csak a migráció után ellenőrizhető — Task 8.)
- [ ] **Step 5: Commit** (`feat(rehearsals): server actions (days, detail, metadata upsert, attendance)`).

### Task 4: Felvétel ↔ dal

**Files:**
- Modify: `src/actions/recordings.ts` (`saveRecording` + `songId?: string`; új `getRecordingsBySong`)
- Modify: `src/components/tools/recording-modal.tsx` (prop `songId?: string`, átadja mentéskor)
- Modify: `src/components/practice/practice-controls.tsx` (átadja `p.song.id`-t)
- Modify: `src/app/(app)/songs/[id]/page.tsx` (a 3-napos név-egyeztetés helyett `getRecordingsBySong`)

**Interfaces:**
- Produces: `getRecordingsBySong(songId: string, title: string): Promise<{ id: string; name: string; date: string; duration: number }[]>` — scope a meglévő recordings-szűréssel; feltétel: `song_id = songId` **vagy** (`song_id IS NULL` és `name ILIKE %title%`); `ORDER BY created_at DESC LIMIT 10`; az `audio_data` oszlopot **nem** kéri le.

- [ ] **Step 1:** `saveRecording`: ha van `songId`, `assertSongsAccess([songId], ctx)` előtte; beírja a `songId`-t.
- [ ] **Step 2:** `getRecordingsBySong` a fenti feltétellel; `ilike` mintában a `%` és `_` karaktereket escape-eld a címben.
- [ ] **Step 3:** Modal + practice-controls bekötés; a nap-panelből nyitott modal `songId` nélkül marad.
- [ ] **Step 4:** Dal oldal: `recordings = await getRecordingsBySong(id, song.title)`; a régi `recent`/`getRecordingsByDate`-es blokk törlődik.
- [ ] **Step 5:** Run `npx tsc --noEmit && npm test && npx eslint <érintett fájlok>` → zöld, új lint-hiba nincs.
- [ ] **Step 6: Commit** (`feat(recordings): link recordings to songs; song page lists them by id`).

### Task 5: Navigáció és Próbák lista

**Files:**
- Modify: `src/components/layout/nav-items.ts` (Statisztika → Próbák)
- Create: `src/components/rehearsals/rehearsal-tabs.tsx` (Lista / Naptár / Áttekintés link-fülek)
- Create: `src/components/rehearsals/rehearsal-list.tsx`
- Create: `src/app/(app)/rehearsals/page.tsx`
- Modify: `src/app/(app)/analytics/page.tsx` (fejléc alatt `RehearsalTabs active="overview"`)
- Modify: `src/app/dev/ui/fixtures.ts`, `src/app/dev/ui/page.tsx` + új `src/app/dev/ui/sections/rehearsals.tsx` (`?only=rehearsals`)

**Interfaces:**
- Consumes: `getRehearsalDays`, `formatTimeRange`, `getCalendarEntries`, `getSongs`, `DashboardView`.
- Produces: `RehearsalTabs({ active }: { active: 'list' | 'calendar' | 'overview' })`; `RehearsalList({ upcoming, past, today }: { upcoming: RehearsalDay[]; past: RehearsalDay[]; today: string })`.

- [ ] **Step 1: Nav.** `NAV_ITEMS[2] = { href: '/rehearsals', label: 'Próbák', icon: CalendarDays, match: (p) => p.startsWith('/rehearsals') || p.startsWith('/analytics') }`. A mobil alsó sáv a `NAV_ITEMS`-ből épül — ellenőrizd képernyőképpel, hogy elfér.
- [ ] **Step 2: `RehearsalTabs`** — `Link`-ekből álló pill-sor a `SegmentedControl` vizuális mintájával (nem radiogroup, hanem `nav` + `aria-current="page"`).
- [ ] **Step 3: `RehearsalList`** — két szakasz („Következő próbák”, „Korábbi próbák”); soronként: dátum (`EEEE, MMMM d.`), `formatTimeRange`, hely, „Fellépés” chip ha `kind === 'gig'`, „{n} dal”; a sor link a `/rehearsals/[date]`-re. Üresen: „Még nincs próba. Tervezz egyet!” + „Próba tervezése” gomb, ami a Naptár fülre visz.
- [ ] **Step 4: Oldal** `/rehearsals`: `searchParams.view === 'calendar'` → `PageHeader` + tabs + `DashboardView` (ugyanazok a propok, mint a Kezdőlapon); különben lista. Fejléc: `title="Próbák"`.
- [ ] **Step 5: Dev showcase** fixture-ből (`listRehearsalDays(fixtureEntries, [egy meta-sor], FIXTURE_TODAY)`), `?only=rehearsals`. Képernyőkép asztali + mobil (`bash scripts/ui-shot.sh "/dev/ui?only=rehearsals" desktop …`, `…?w=390&only=rehearsals" mobile …`) — nézd meg őket.
- [ ] **Step 6:** `npx tsc --noEmit && npm test && npx eslint <fájlok>` → zöld. **Commit** (`feat(rehearsals): Próbák menu, list and calendar tabs`).

### Task 6: Próba oldal

**Files:**
- Create: `src/app/(app)/rehearsals/[date]/page.tsx`
- Create: `src/components/rehearsals/rehearsal-header.tsx`, `rehearsal-attendance.tsx`, `rehearsal-meta-dialog.tsx`
- Modify: `src/components/calendar/day-detail-panel.tsx` (link „Próba oldala →” a `/rehearsals/[date]`-re)
- Modify: dev showcase (`?only=rehearsal`)

**Interfaces:**
- Consumes: `getRehearsal`, `saveRehearsalMeta`, `setAttendance`, `rehearsalMetaSchema`, `formatTimeRange`, `DayDetailPanel`, `ResponsiveDialog`.
- Produces: `RehearsalHeader({ date, meta, songCount, today })`, `RehearsalAttendance({ date, attendance, myAnswer })`, `RehearsalMetaDialog({ date, meta, open, onOpenChange })`.

- [ ] **Step 1: Oldal.** Érvénytelen dátum (regex vagy `!isValid(parseISO(date))`) → `notFound()`. Betölti `getRehearsal(date)`, `getSongs()`, `getCalendarEntries()` párhuzamosan. Elrendezés a canvas „5 · Próba oldal” szerint: bal oldalt (széles) a `DayDetailPanel` (setlist), jobb oldalt a jelenlét; felül a fejléc. Morzsamenü: „‹ Próbák / {MMM d.}”.
- [ ] **Step 2: `RehearsalHeader`** — eyebrow: típus („Próba”/„Fellépés”) + visszaszámlálás (`rehearsalCountdownLabel`) vagy „Lezajlott”; cím `EEEE, MMM d.`; idősáv + hely; cél kiemelt dobozban, ha van. Gombok: „Próba mód indítása” (`/practice/[date]`, letiltva és `title="Nincs setlist"`, ha `songCount === 0`), „Részletek szerkesztése”.
- [ ] **Step 3: `RehearsalMetaDialog`** — mezők: típus (SegmentedControl: Próba/Fellépés), kezdés, vége (`<input type="time">`), hely, cél, jegyzet (textarea); kliens-oldali `rehearsalMetaSchema.safeParse` a hibák mezők alatti megjelenítéséhez; mentés `saveRehearsalMeta`, `toast.success('Próba mentve')`, `router.refresh()`.
- [ ] **Step 4: `RehearsalAttendance`** — csak ha `hasBand`. „Ott leszel?” három gomb (`aria-pressed`), optimista frissítés `useOptimistic`-kal, hibánál `toast.error('Nem sikerült menteni')`; alatta a tagok listája avatarral és a spec szerinti válasz-szövegekkel; fejléc „Ki jön? {igenek}/{tagok}”.
- [ ] **Step 5: Nap-panel link** „Próba oldala →” a panel fejlécében.
- [ ] **Step 6: Dev showcase** + képernyőkép asztali/mobil, a meta-dialógus nyitott állapotáról is (a showcase-ben `open` proppal). Nézd meg őket.
- [ ] **Step 7:** `npx tsc --noEmit && npm test && npx eslint <fájlok>` → zöld. **Commit** (`feat(rehearsals): rehearsal page with details, attendance and setlist`).

### Task 7: Kezdőlap „Következő próba” kártya

**Files:**
- Modify: `src/components/dashboard/next-rehearsal-hero.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `getRehearsalDays` (vagy `getRehearsal(next.date)`), `formatTimeRange`.
- Produces: `NextRehearsalHero` új opcionális propja `meta: Pick<Rehearsal,'startTime'|'endTime'|'place'|'kind'> | null`.

- [ ] **Step 1:** A kártya a dátum alatt mutatja `formatTimeRange` + hely sort, „Fellépés” chipet `kind === 'gig'` esetén; a cím link a `/rehearsals/[date]`-re. Ha a következő „próba” csak adat-sor (setlist nélkül), a kártya azt mutassa, „Setlist összeállítása” gombbal a próba oldalra.
- [ ] **Step 2:** Dev showcase `?only=hero` frissítése egy meta-val; képernyőkép.
- [ ] **Step 3:** `npx tsc --noEmit && npm test && npx eslint <fájlok>` → zöld. **Commit** (`feat(dashboard): next rehearsal shows time, place and links to the rehearsal page`).

### Task 8: Migráció futtatása és élő ellenőrzés (jóváhagyás után)

- [ ] **Step 1:** Csak a felhasználó kifejezett engedélyével: `npx drizzle-kit migrate` (javasolt: előbb Neon branch, `DATABASE_URL` arra mutatva). Expected: `0004_rehearsals` alkalmazva, hiba nélkül.
- [ ] **Step 2:** `npm run build` → zöld, `ƒ Proxy (Middleware)` a kimenetben.
- [ ] **Step 3:** Élő ellenőrzés bejelentkezve (dev szerver újraindítva): Próbák lista; próba oldal; részletek mentése (és hibás idő → hibaüzenet); jelenlét-váltás; Próba módban felvétel → megjelenik a dal oldalán; nap-panelen próba törlése → eltűnik a listából; banda nélküli fiókkal a jelenlét-blokk nem látszik.
- [ ] **Step 4:** Canvas-audit frissítése: L4, Z3 „Javítva”, H2 részben (jelenlét kész, értesítés nem).
