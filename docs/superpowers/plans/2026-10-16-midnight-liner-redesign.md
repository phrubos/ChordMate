# Midnight Liner redesign — megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Animációs munkánál kötelező: `emil-design-eng` (tervezés közben) és `review-animations` (a 20. feladatban).

**Goal:** A ChordMate a jóváhagyott „Midnight Liner” arculatot kapja, és bekerül a Próba mód, a globális mini-player, a Song Hub és a dal-metaadatok.

**Architecture:** Először a tokenek, a fontok, a motion-alapok és az atomok készülnek el; ezek mind a `/dev/ui` fejlesztői oldalon ellenőrizhetők, login nélkül. Utána jön az adatmodell, az app-keret (route group `(app)` közös layouttal és `PlayerProvider`-rel), majd képernyőnként a funkciók. A logika tiszta, tesztelt függvényekbe kerül (`src/lib/*`); a komponensek vékonyak. Minden fázis működő szoftvert ad.

**Tech Stack:** Next.js 16 (App Router; a `params`/`searchParams` Promise), React 19, Tailwind CSS v4 (CSS-first `@theme`), shadcn (base-nova) + Base UI, Motion 12 (`motion/react`), Drizzle + Neon Postgres, NextAuth v5, dnd-kit, react-youtube, sonner, date-fns (hu), Vitest (új).

**Spec:** `docs/superpowers/specs/2026-10-16-midnight-liner-design.md` · vizuális referencia: `.superdesign/design_iterations/hybrid.html` (sötét) és `liner.html` (világos).

## Global Constraints

- UI-szöveg magyarul; azonosítók és commit üzenetek angolul.
- Komponensben nincs nyers szín (hex, Tailwind palettaszín). Csak tokenek (`bg-background`, `text-primary-text`, `text-status-ready` stb.). Kivétel: generált borító- és avatar-hue, valamint márkalogók.
- Minimum betűméret 12px; ikongomb-célterület ≥ 40×40px; minden ikon-only gombnak van `aria-label`-je.
- Animáció csak a spec 6. fejezetében felsoroltakból (A1–A9), a megadott értékekkel; csak `transform`/`opacity` (+ legfeljebb 2px blur); `prefers-reduced-motion` mellett nincs mozgás.
- Új függőség csak legalább 7 napja kiadott, rögzített (nem lebegő) verzióval.
- **DB-migráció futtatása (`drizzle-kit migrate`) az éles Neon adatbázison csak a felhasználó kifejezett jóváhagyásával.** A migrációs fájl generálása nem igényel jóváhagyást.
- Munka a `feat/midnight-liner` ágon (worktree: superpowers:using-git-worktrees). Push és merge csak kérésre.
- Feladatonként kötelező kapu: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` zöld.

## Review Focus

1. **Üres adat:** új banda, 0 dal / 0 próba esetén a kezdőlap, a Dalok, a Song Hub és a Próba mód üres állapotot mutat, nem omlik össze (a hero „Próba tervezése” CTA-t ad). Teszt: `findNextRehearsalDate([], …) === null` (8. feladat), `extractChords(null)` → `[]` (13. feladat), `clampIndex(0, 0) === 0` (14. feladat).
2. **YouTube URL nélküli dal** a setlistben vagy a lejátszási sorban: nem kerül a player sorába, a lejátszás gomb rejtett vagy inaktív. Teszt: a `playerReducer` kiszűri a `youtubeUrl` nélküli trackeket (7. feladat).
3. **Régi dalok új mezők nélkül** (`bpm`/`songKey` NULL): a chipek nem renderelnek üres értéket, a metronóm 80 BPM-ről indul. Teszt: `beatIntervalMs(null)` = 750 (14. feladat); a validátor elfogadja a hiányzó mezőket (5. feladat).
4. **Időzóna és dátumhatár:** a „mai nap” mindig helyi `yyyy-MM-dd` (date-fns `format`), soha nem `toISOString()`; a ma esti próba „tervezett”, nem „lezajlott”. Teszt: `dayState(today, today, 3) === 'plan'` (9. feladat).
5. **Hosszú magyar címek és ékezetek** (pl. „Most múlik pontosan”, „Kispál és a Borz”): sehol nincs vízszintes túlcsordulás 390px-en; csonkolás ellipszissel és `title` attribútummal. Ellenőrzés: `/dev/ui` mobil screenshot hosszú fixture-címmel (4., 12. feladat).

## Fázisok áttekintése

| Fázis | Feladatok | Eredmény |
|---|---|---|
| 0 · Alapok | 1–4 | Teszt-infra, tokenek, fontok, motion, atomok a `/dev/ui`-n |
| 1 · Adatmodell | 5 | Dal státusz/BPM/hangnem/capo/hangolás |
| 2 · Keret | 6–7 | Masthead, mobil nav, mini-player |
| 3 · Kezdőlap | 8–11 | Hero, naptár, napi panel, kártyák |
| 4 · Dalok | 12 | Új Dalok oldal |
| 5 · Song Hub | 13 | `/songs/[id]` |
| 6 · Próba mód | 14–15 | `/practice/[date]` |
| 7 · Többi képernyő | 16–18 | Űrlap, Analitika, Login/Banda/eszközök |
| 8 · Csiszolás | 19–20 | Takarítás, a11y, animációs review, végső ellenőrzés |

---

### Task 1: [Fázis 0] Teszt- és ellenőrző infrastruktúra

**Files:**
- Modify: `package.json` (`"test": "vitest run"`, devDeps: `vitest@3.2.4`, `vite-tsconfig-paths@5.1.4`)
- Create: `vitest.config.ts`, `src/lib/smoke.test.ts`, `src/app/dev/ui/page.tsx`, `src/app/dev/ui/fixtures.ts`, `scripts/ui-shot.sh`, `AGENTS.md`
- Modify: `middleware.ts` (matcher kizárja a `dev` útvonalat)

**Interfaces:**
- Produces: `npm test`; a `/dev/ui` oldal (`notFound()`, ha `process.env.NODE_ENV === 'production'`), szekciók `id` horgonnyal; `fixtures.ts` exportjai: `fixtureSongs: SongWithUser[]` (12 dal, köztük „Most múlik pontosan — Kispál és a Borz”), `fixtureEntries: CalendarEntryWithSong[]` (2026 október), `FIXTURE_TODAY = '2026-10-16'`; `bash scripts/ui-shot.sh <url-path> <desktop|mobile> <out.png>` (Chrome headless; desktop 1440 széles ablak; mobil: 500 széles ablak, mert a headless Chrome-nak ennél nagyobb a minimális ablakszélessége, és a `?w=390` paraméter). `?w=390` esetén a `/dev/ui` egy 390px széles, 2400px magas `<iframe src="/dev/ui?embed=1#{hash}">`-et renderel (kliens wrapper, a hash-t a `location.hash`-ből veszi). Így a Tailwind breakpointok valódi 390px-es viewportot látnak; egy sima `max-width` wrapper erre nem lenne alkalmas.

- [ ] **Step 1:** Telepítés: `npm i -D vitest@3.2.4 vite-tsconfig-paths@5.1.4`. `vitest.config.ts`: `plugins: [tsconfigPaths()]`, `test.include: ['src/**/*.test.ts']`, `environment: 'node'`.
- [ ] **Step 2:** `src/lib/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Run: `npm test` · Expected: `1 passed`.
- [ ] **Step 3:** `/dev/ui` oldal szerverkomponensként, egyelőre egy `<h1>` és egy üres `section#atoms`; a `?w=390` iframe-wrapper és az `?embed=1` mód (ekkor nincs wrapper) a fenti interfész szerint. Middleware matcher: `'/((?!login|dev|api/auth|_next/static|_next/image|favicon.ico).*)'`.
- [ ] **Step 4:** `scripts/ui-shot.sh` (a `.superdesign/design_iterations/shot.sh` mintájára, `http://localhost:3000` alappal). `AGENTS.md`: parancsok (`npm run dev`, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `bash scripts/ui-shot.sh …`), a spec és a terv útvonala, a Global Constraints rövid kivonata, és hogy Python fájlt `py file.py`-jal futtatunk.
- [ ] **Step 5:** Run: `npm run dev` háttérben, majd `bash scripts/ui-shot.sh /dev/ui desktop .superpowers/shots/t1.png` · Expected: a PNG létrejön, a címsor látszik (login redirect nélkül).
- [ ] **Step 6:** Kapu (`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`), majd commit: `chore: add vitest, dev UI showcase and screenshot script`.

### Task 2: [Fázis 0] Design tokenek, fontok, témák

**Files:**
- Modify: `src/app/globals.css` (teljes token-csere), `src/app/layout.tsx` (fontok, `themeColor`), `src/components/shared/theme-toggle.tsx`
- Modify: `src/app/dev/ui/page.tsx` (szekció: `#tokens`, színminták és típusskála)

**Interfaces:**
- Produces: Tailwind utility-k a spec 4.1–4.2 tokeneiből: `bg-page`, `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `text-faint`, `bg-primary`, `text-primary-text`, `border-border`, `border-border-strong`, `text-status-learning|ok|ready`, `bg-status-*`, `text-done`, `text-fav`; font utility-k: `font-display` (Fraunces), `font-sans` (Hanken Grotesk), `font-mono` (IBM Plex Mono); `.grain` (filmszemcse, csak `.dark`-ban); `.display-soft` (`font-variation-settings: "SOFT" 50, "opsz" 144`); CSS változók `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--dur-press: 160ms`, `--dur-fade: 150ms`, `--dur-popover: 180ms`, `--dur-dialog: 200ms`, `--dur-sheet: 300ms`.

- [ ] **Step 1:** `globals.css`: a `:root` (világos, Liner) és a `.dark` (Midnight) blokk pontosan a spec 4.1/4.2 értékeivel; `@theme inline` kiegészítés: `--color-page`, `--color-faint`, `--color-primary-text`, `--color-border-strong`, `--color-status-learning|ok|ready`, `--color-done`, `--color-fav`, `--font-display`; `--radius: 0.25rem`. Törlendő osztályok: `.glass`, `.practice-glow`, `.practice-day-*`, `.today-marker`, `.shimmer-text`, `.login-panel`, `.login-card`, a `glow-pulse`/`float`/`shimmer` keyframe-ek és `--animate-*` tokenek.
- [ ] **Step 2:** `layout.tsx`: `Fraunces({ subsets: ['latin','latin-ext'], axes: ['SOFT','opsz'], style: ['normal','italic'], variable: '--font-display' })`, `Hanken_Grotesk({ subsets: ['latin','latin-ext'], variable: '--font-sans' })`, `IBM_Plex_Mono({ weight: ['400','500','600'], subsets: ['latin','latin-ext'], variable: '--font-mono' })`; a Geist törlése; `body` kap `grain` osztályt; `themeColor` sötét: `#1d1a16` (≈ `--background`), világos: `#f3eee3`; a `NextTopLoader` színe `var(--primary)` legyen (prop: `color="oklch(0.8 0.145 72)"`, árnyék nélkül).
- [ ] **Step 3:** `theme-toggle.tsx`: a viselkedés változatlan (alapértelmezés sötét, `localStorage` kulcs `chordmate-theme`), a stílus tokenekre áll, `aria-label` = „Világos mód” / „Sötét mód”.
- [ ] **Step 4:** `/dev/ui#tokens`: minden színtoken mintája névvel, a típusskála (64/60/26/21/15/13/12px) Fraunces/Hanken/Plex mintával, magyar ékezetes szöveggel („Gyöngyhajú lány — Kispál és a Borz, ő ű”).
- [ ] **Step 5:** Run: `bash scripts/ui-shot.sh /dev/ui desktop .superpowers/shots/t2.png` · Expected: a háttér meleg szénfekete, a Fraunces dőlt latin-ext karakterei (ő, ű) helyesen jelennek meg; összevetés a `hybrid.html` színeivel.
- [ ] **Step 6:** Kapu, majd commit: `feat(design): Midnight Liner tokens, fonts and themes`.

### Task 3: [Fázis 0] Motion-alapok és a felesleges animációk eltávolítása

**Files:**
- Modify: `src/lib/motion.ts` (teljes csere)
- Create: `src/lib/motion.test.ts`, `src/components/providers/motion-provider.tsx`
- Modify: `src/app/layout.tsx` (`MotionProvider`)
- Delete usage: `PageTransition` minden oldalon (`dashboard`, `songs`, `analytics`, `band`, `songs/new`, `songs/[id]/edit` page-ek); a `staggerContainer`/`staggerItem` használat a `song-list.tsx`-ben és a `practice-history.tsx`-ben
- Delete: `src/components/shared/page-transition.tsx`

**Interfaces:**
- Produces (`src/lib/motion.ts`): `ease = { out: [0.23, 1, 0.32, 1], inOut: [0.77, 0, 0.175, 1], drawer: [0.32, 0.72, 0, 1] } as const`; `dur = { press: 0.16, fade: 0.15, popover: 0.18, dialog: 0.2, sheet: 0.3 } as const`; `exitDur(enter: number): number` (= `Math.round(enter * 0.65 * 1000) / 1000`); `springs = { indicator: { type: 'spring', duration: 0.3, bounce: 0 } }`; `MotionProvider` = `<MotionConfig reducedMotion="user">`.

- [ ] **Step 1:** Teszt: `exitDur(0.3) === 0.195`, `exitDur(0.2) === 0.13`; `ease.out` megegyezik a `[0.23, 1, 0.32, 1]` tömbbel. Run: `npm test -- motion` · Expected: FAIL (`exitDur` nincs exportálva).
- [ ] **Step 2:** `motion.ts` megírása a fenti interfész szerint; a régi `pageVariants`, `staggerContainer`, `staggerItem`, `springs.snappy|smooth|gentle` törlése. A régi `springs.snappy` hivatkozásait (`mobile-bottom-nav.tsx`) a 6. feladat cseréli; addig `springs.indicator`.
- [ ] **Step 3:** Run: `npm test -- motion` · Expected: PASS.
- [ ] **Step 4:** A `PageTransition` és a stagger-használatok eltávolítása (sima `div`-ek); `MotionProvider` a `layout.tsx`-be az `AuthSessionProvider` köré.
- [ ] **Step 5:** Kapu, majd commit: `refactor(motion): add motion tokens, drop decorative page and list animations`.

### Task 4: [Fázis 0] UI-primitívek és új atomok

**Files:**
- Modify: `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/select.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/input.tsx`, `src/components/ui/badge.tsx`
- Create: `src/lib/song-meta.ts`, `src/lib/song-meta.test.ts`
- Create: `src/components/design/eyebrow.tsx`, `section-header.tsx`, `chip.tsx`, `status-badge.tsx`, `difficulty-meter.tsx`, `segmented-control.tsx`, `cover-art.tsx`, `chord-diagram.tsx`, `avatar-stack.tsx`
- Modify: `src/app/dev/ui/page.tsx` (`#atoms` szekció minden atommal, hosszú címmel is)

**Interfaces:**
- Produces (`src/lib/song-meta.ts`): `type SongStatus = 'learning' | 'ok' | 'ready'`; `SONG_STATUSES: readonly SongStatus[]` (ebben a sorrendben); `statusLabel(s: SongStatus): string` (Tanuljuk/Megy/Kész); `difficultyLabel(level: number | null | undefined): string | null` (1–5 → Könnyű/Laza/Közepes/Nehéz/Kihívás, egyébként `null`); `hueFromString(seed: string): number` (0–359, determinisztikus, FNV-1a hash mod 360); `countByStatus(items: { status: SongStatus }[]): Record<SongStatus | 'all', number>`.
- Produces (komponensek):
  - `Eyebrow({ children, accent?, icon? })`;
  - `SectionHeader({ eyebrow?, title, actions?, as?: 'h2' | 'h3' })` (amber 28×2px vonal a cím alatt);
  - `Chip({ children, title? })`;
  - `StatusBadge({ status: SongStatus, compact?: boolean })`;
  - `DifficultyMeter({ level: number | null, showLabel?: boolean })` (`aria-label="Nehézség: {címke}, {n} az 5-ből"`);
  - `SegmentedControl<T extends string>({ value: T, onChange(v: T), options: { value: T; label: string; count?: number; dotClassName?: string }[], size?: 'sm' | 'md', ariaLabel: string })` (aktív jelző: `motion.span layoutId` + `springs.indicator`, A5);
  - `CoverArt({ title, artist, imageUrl?, size: 'xs' | 'sm' | 'md' | 'lg' | 'fill', showType?: boolean, className? })` (fallback: `linear-gradient(140deg, oklch(.7 .15 h), oklch(.46 .1 h+40))` + mintázat + `showType` esetén dőlt Fraunces cím és mono előadó);
  - `ChordDiagram({ name: string, size?: 'sm' | 'md' })` (SVG a `chordDiagrams` adataiból, `role="img"`, `aria-label="{name} akkord"`; ismeretlen akkordnál `null`);
  - `AvatarStack({ users: { name: string | null; image: string | null }[], max?: number })`.
- Button: alapméret `h-10`, `sm` = `h-9`, `lg` = `h-12`, ikon = `size-10`, pirula radius; a `transition-all` helyett `transition-[transform,background-color,border-color,color] duration-(--dur-press) ease-(--ease-out)`, valamint `active:scale-[.97]` (A1). A meglévő `variant`/`size` nevek maradnak (visszafelé kompatibilis).
- Dialog/AlertDialog: `duration-200 ease-(--ease-out)`, kilépés 130ms; a háttér `bg-black/60`. Dropdown/Select/Tooltip popup: `origin-(--transform-origin)`, be `scale-[.97]` + opacity, 180ms (A9).

- [ ] **Step 1:** Teszt `song-meta.test.ts`: `statusLabel('ok') === 'Megy'`; `difficultyLabel(5) === 'Kihívás'`; `difficultyLabel(0) === null`; `difficultyLabel(null) === null`; `hueFromString('Eagles — Hotel California')` két hívásban azonos, és `0 <= h < 360`; `countByStatus([{status:'ok'},{status:'ok'},{status:'ready'}])` → `{ all: 3, learning: 0, ok: 2, ready: 1 }`. Run: `npm test -- song-meta` · Expected: FAIL (modul nem létezik).
- [ ] **Step 2:** `song-meta.ts` implementálása. Run: `npm test -- song-meta` · Expected: PASS.
- [ ] **Step 3:** Primitívek módosítása, atomok létrehozása az interfész szerint; az értékek a `hybrid.html` megfelelő osztályaiból (`.chip`, `.status`, `.diff`, `.seg`, `.cover`, `.chord`).
- [ ] **Step 4:** `/dev/ui#atoms`: minden atom minden változata, a 12 fixture-dal `CoverArt`-ja, `SegmentedControl` működő állapottal (kliens wrapper), `ChordDiagram`: Bm, F#, A, E, G, D, Em.
- [ ] **Step 5:** Run: `bash scripts/ui-shot.sh "/dev/ui?w=390#atoms" mobile .superpowers/shots/t4-m.png` és ugyanez desktopon · Expected: nincs vízszintes túlcsordulás 390px-en, a hosszú cím ellipszissel csonkol; összevetés a mockuppal.
- [ ] **Step 6:** Kapu, majd commit: `feat(ui): restyle primitives and add design atoms`.

### Task 5: [Fázis 1] Dal-metaadatok az adatmodellben

**Files:**
- Modify: `src/lib/db/schema.ts` (`songs`: `status`, `bpm`, `songKey`, `capo`, `tuning`)
- Create: `src/lib/db/migrations/0003_*.sql` (generált)
- Modify: `src/lib/validators.ts`, `src/actions/songs.ts`
- Create: `src/lib/validators.test.ts`

**Interfaces:**
- Consumes: `SongStatus`, `SONG_STATUSES` (4. feladat).
- Produces:
  - `songs.status: text('status').$type<SongStatus>().notNull().default('learning')`; `bpm: integer('bpm')`; `songKey: text('song_key')`; `capo: integer('capo')`; `tuning: text('tuning')`;
  - `songSchema` új mezői: `status: z.enum(['learning','ok','ready']).default('learning')`, `bpm: z.coerce.number().int().min(30).max(300).optional()`, `songKey: z.string().regex(/^[A-G](#|b)?m?$/, 'Pl. Am, F#, Bb').optional().or(z.literal(''))`, `capo: z.coerce.number().int().min(0).max(12).optional()`, `tuning: z.string().max(40).optional()`;
  - `setSongStatus(id: string, status: SongStatus): Promise<void>` (auth + `revalidatePath('/songs')`, `'/dashboard'`, `` `/songs/${id}` ``);
  - `getSongs` filter: `status?: SongStatus`;
  - `createSong`/`updateSong` beolvassa az új FormData mezőket (`status`, `bpm`, `songKey`, `capo`, `tuning`); üres string → `null`.

- [ ] **Step 1:** Teszt `validators.test.ts`: elfogadja `{title:'A', artist:'B'}`-t, és `status === 'learning'` lesz; elfogadja `songKey: 'F#m'`, `'Bb'`, `''` értékeket; elutasítja `songKey: 'H'`, `bpm: 10`, `capo: 13` értékeket. Run: `npm test -- validators` · Expected: FAIL.
- [ ] **Step 2:** Séma és validátor bővítése. Run: `npm test -- validators` · Expected: PASS.
- [ ] **Step 3:** Run: `npx drizzle-kit generate` · Expected: új `0003_*.sql` csak `ALTER TABLE "songs" ADD COLUMN …` sorokkal (DROP nincs). Ellenőrizd a fájlt.
- [ ] **Step 4:** **STOP: kérj jóváhagyást** a felhasználótól a `npx drizzle-kit migrate` futtatásához az éles DB-n (a fájl tartalmát mutasd meg). Jóváhagyás után futtasd. Expected: sikeres migráció. Ha nincs jóváhagyás: ruling a ledgerben, és a további feladatok a migrált sémát feltételezik (a build ettől még zöld).
- [ ] **Step 5:** `songs.ts` actions bővítése az interfész szerint.
- [ ] **Step 6:** Kapu, majd commit: `feat(songs): add status, bpm, key, capo and tuning`.

### Task 6: [Fázis 2] App-keret: route group, masthead, mobil nav

**Files:**
- Move (git mv): `src/app/dashboard` → `src/app/(app)/dashboard`; ugyanígy `songs`, `analytics`, `band`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/layout/masthead.tsx`, `mobile-top-bar.tsx`, `bottom-nav.tsx`, `tools-sheet.tsx`, `nav-items.ts`
- Delete: `src/components/layout/navbar.tsx`, `mobile-bottom-nav.tsx`, `header-stats.tsx`; a `<Navbar />` és `<MobileBottomNav />` importok minden page-ből

**Interfaces:**
- Produces:
  - `NAV_ITEMS: { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean }[]`: Kezdőlap `/dashboard`, Dalok `/songs` (a `/songs/*` is), Statisztika `/analytics`, Banda `/band`;
  - `(app)/layout.tsx` szerverkomponens: auth ellenőrzés (nincs session → `redirect('/login')`), majd `<Masthead /> <MobileTopBar /> <main className="mx-auto max-w-[1320px] px-4 lg:px-10 pt-6 lg:pt-11 pb-36">{children}</main> <BottomNav />`; a 7. feladatban `PlayerProvider` + `MiniPlayer` kerül bele.
- Masthead (≥ md): bal oldalon logó + „ChordMate” (Fraunces 26px) + nav linkek (aktív: `box-shadow: inset 0 -2px 0 var(--primary)`), jobb oldalon keresés-trigger (`/songs?focus=search`-re navigál), Hangoló és Metronóm ikongomb, „Próba mód” (`/dashboard#next` horgonyra; a 8. feladat után a következő próba URL-je), `BandSwitcher`, user menü (név, téma-váltó, kijelentkezés elválasztva). Sticky, `bg-background/92`, alsó `border-border-strong`.
- Mobil: `MobileTopBar` (logó + bandanév + ▾ = `BandSwitcher`, keresés ikon, avatar menü); `BottomNav` 5 elem (4 link + „Eszközök”, ami a `ToolsSheet`-et nyitja), ikon + 12px címke, aktív szín `text-primary-text`.

- [ ] **Step 1:** `git mv` műveletek; az URL-ek változatlanok. Run: `npm run build` · Expected: a route-lista ugyanazokat az útvonalakat mutatja.
- [ ] **Step 2:** Komponensek és layout megírása; a page-ekből a nav-importok és a `max-w-7xl` wrapper-ek eltávolítása.
- [ ] **Step 3:** `/dev/ui#shell`: `Masthead` és `BottomNav` statikus példánya fixture-session nélkül (a komponensek propként kapják a user-t: `user: { name: string | null; image: string | null; email: string | null }`).
- [ ] **Step 4:** Képek desktop és mobil `/dev/ui#shell` nézetről · Expected: egyezik a `hybrid.html` mastheadjével és bottom navjével.
- [ ] **Step 5:** Kapu, majd commit: `feat(shell): masthead, mobile nav and shared app layout`.

### Task 7: [Fázis 2] Globális lejátszó és mini-player

**Files:**
- Create: `src/lib/player-state.ts`, `src/lib/player-state.test.ts`
- Create: `src/components/player/player-provider.tsx`, `mini-player.tsx`, `video-sheet.tsx`
- Modify: `src/app/(app)/layout.tsx`, `src/components/songs/song-list.tsx`, `src/components/calendar/day-detail-panel.tsx` (a saját YouTube-dialógusok törlése → `usePlayer().play`)

**Interfaces:**
- Produces (`player-state.ts`):
  - `type PlayerTrack = { id: string; title: string; artist: string; imageUrl: string | null; youtubeUrl: string }`;
  - `type PlayerState = { queue: PlayerTrack[]; index: number; isPlaying: boolean; isExpanded: boolean }`;
  - `initialPlayerState: PlayerState` (`queue: []`, `index: 0`, `false`, `false`);
  - `toTrack(song: { id: string; title: string; artist: string; imageUrl: string | null; youtubeUrl: string | null }): PlayerTrack | null` (`null`, ha nincs URL);
  - `playerReducer(state, action)`, ahol `action` = `{ type: 'play'; track: PlayerTrack; queue?: PlayerTrack[] }` | `{ type: 'toggle' }` | `{ type: 'next' }` | `{ type: 'prev' }` | `{ type: 'close' }` | `{ type: 'expand'; value: boolean }` | `{ type: 'ended' }`.
- Produces (`player-provider.tsx`): `usePlayer(): { state: PlayerState; current: PlayerTrack | null; play(song: SongLike, queue?: SongLike[]): void; toggle(): void; next(): void; prev(): void; close(): void; expand(v: boolean): void }`, ahol `SongLike` = a `toTrack` bemenete. Egy rejtett (1×1 px, `aria-hidden`) `react-youtube` példány a providerben, ami route-váltáskor nem unmountol; az `ended` esemény → `next`.
- MiniPlayer: csak akkor renderel, ha `current` létezik; `AnimatePresence` (A2: be `translateY(100%)` → 0, 300ms `ease.drawer`; ki 200ms). Desktopon `fixed bottom-5`, középen, max. 760px, pirula; mobilon `bottom-[calc(64px+env(safe-area-inset-bottom))]`, 8px oldalmargóval. A `VideoSheet` mobilon alulról nyíló sheet, desktopon dialog; itt látszik a valódi videó (a provider az `isExpanded` alapján a látható konténerbe portálozza a playert).

- [ ] **Step 1:** Teszt `player-state.test.ts`:
  - `play` egy 3 elemű sorral a 2. trackre → `index === 1`, `isPlaying === true`;
  - `play` sor nélkül → a sor `[track]`;
  - `next` az utolsó elemen → `isPlaying === false`, az index nem változik;
  - `prev` 0-n → 0 marad;
  - `close` → `initialPlayerState`;
  - `toTrack({…, youtubeUrl: null}) === null`;
  - `play` olyan sorral, amelyben `null` URL-es dal is van → a provider `toTrack` + `filter` után adja át (teszteld a `buildQueue(songs)` segédfüggvényt: `buildQueue(songs: SongLike[]): PlayerTrack[]`).
  Run: `npm test -- player-state` · Expected: FAIL.
- [ ] **Step 2:** Implementáció. Run: `npm test -- player-state` · Expected: PASS.
- [ ] **Step 3:** Provider, MiniPlayer, VideoSheet; bekötés a layoutba; a régi videó-dialógusok cseréje.
- [ ] **Step 4:** Kézi ellenőrzés `npm run dev` mellett, a felhasználó böngészőjében (`browser_preview`): egy dal lejátszása a Dalok oldalon, átnavigálás a Kezdőlapra → a zene megy tovább, a mini-player látszik. Expected: igen. Ha a felhasználó nem elérhető: `/dev/ui#player` fixture-rel, screenshot.
- [ ] **Step 5:** Kapu, majd commit: `feat(player): persistent mini-player with queue`.

### Task 8: [Fázis 3] Következő próba hero

**Files:**
- Create: `src/lib/calendar-utils.ts`, `src/lib/calendar-utils.test.ts`
- Modify: `src/actions/calendar.ts` (`getNextRehearsal`)
- Create: `src/components/dashboard/next-rehearsal-hero.tsx`, `hero-cover-strip.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`, `src/components/layout/masthead.tsx` („Próba mód” link)

**Interfaces:**
- Produces (`calendar-utils.ts`): `todayIso(now?: Date): string` (`format(now, 'yyyy-MM-dd')`); `findNextRehearsalDate(dates: string[], today: string): string | null` (a legkisebb `>= today` dátum); `daysUntil(from: string, to: string): number`; `rehearsalCountdownLabel(days: number): string` (0 → „Ma”, 1 → „Holnap”, n → „{n} nap múlva”).
- Produces (`calendar.ts`): `getNextRehearsal(): Promise<{ date: string; entries: CalendarEntryWithSong[] } | null>` (a `getCalendarEntries()` eredményét használja; az entries `sortOrder` szerint rendezve).
- Hero props: `{ rehearsal: { date: string; entries: CalendarEntryWithSong[] } | null; members: { name: string | null; image: string | null }[] }`. CTA-k: `href={`/practice/${date}`}` és `usePlayer().play(entries[0].song, entries.map((e) => e.song))` (a `play` a `buildQueue`-val szűri a videó nélküli dalokat; ha egyiknek sincs URL-je, a gomb inaktív). `HeroCoverStrip`: legfeljebb 4 `CoverArt size="fill" showType`; A8 reveal, csak ha `sessionStorage['cm-hero-revealed']` még nincs beállítva, és nincs csökkentett mozgás.

- [ ] **Step 1:** Teszt: `findNextRehearsalDate(['2026-10-13','2026-10-22','2026-10-27'], '2026-10-16') === '2026-10-22'`; `findNextRehearsalDate(['2026-10-16'], '2026-10-16') === '2026-10-16'`; `findNextRehearsalDate([], '2026-10-16') === null`; `daysUntil('2026-10-16','2026-10-22') === 6`; `rehearsalCountdownLabel(0) === 'Ma'`, `(1) === 'Holnap'`, `(6) === '6 nap múlva'`; `todayIso(new Date(2026, 9, 16, 23, 30)) === '2026-10-16'`. Run: `npm test -- calendar-utils` · Expected: FAIL.
- [ ] **Step 2:** Implementáció. Run: `npm test -- calendar-utils` · Expected: PASS.
- [ ] **Step 3:** `getNextRehearsal`, a hero, a borítósáv, a dashboard page bekötése (a bandatagok a `getUserBand()`-ből).
- [ ] **Step 4:** `/dev/ui#hero`: hero fixture-rel és üres állapotban; screenshot desktop/mobil · Expected: egyezik a `hybrid.html` herójával; üres állapotban „Még nincs tervezett próba” + „Próba tervezése”.
- [ ] **Step 5:** Kapu, majd commit: `feat(dashboard): next rehearsal hero`.

### Task 9: [Fázis 3] Naptár és heti szalag

**Files:**
- Modify: `src/lib/calendar-utils.ts` (+ teszt), `src/components/calendar/calendar-day-cell.tsx`, `calendar-grid.tsx`, `calendar-header.tsx`
- Create: `src/components/calendar/week-strip.tsx`

**Interfaces:**
- Produces: `dayState(date: string, today: string, songCount: number): 'done' | 'plan' | 'empty'` (`count > 0 && date < today` → `done`; `count > 0 && date >= today` → `plan`); `weekStripDates(anchor: string, days?: number): string[]` (az anchor hetének hétfőjétől, alapértelmezés 14 nap).
- `CalendarDayCell` props: `{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; state: 'done' | 'plan' | 'empty'; markHues: number[]; extraCount: number; onSelect(date: string): void }`. `button` elem, `aria-pressed`, `aria-label` (dátum + „n dal, lezajlott/tervezett próba”). Az `onAddSong`/`onCopyDate`/`onDeleteDate` hover-akciók megszűnnek.
- `CalendarHeader`: Fraunces „Október *2026*”, `SegmentedControl` (Hónap | Hét; a „Hét” a heti szalagot mutatja desktopon is), „Ma” gomb, előző/következő ikongomb `aria-label`-lel.
- `WeekStrip({ dates: string[]; today: string; selected: string; stateByDate: Record<string, 'done' | 'plan' | 'empty'>; onSelect(date: string): void; onShowMonth(): void })`: mobilon a havi rács helyett jelenik meg.

- [ ] **Step 1:** Teszt: `dayState('2026-10-13','2026-10-16',3) === 'done'`; `dayState('2026-10-16','2026-10-16',3) === 'plan'`; `dayState('2026-10-20','2026-10-16',0) === 'empty'`; `weekStripDates('2026-10-16')[0] === '2026-10-12'`, a hossza 14. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** Komponensek átírása a spec 5.2 szerint (hajszálvonalas rács: `gap-0`, `border-l border-t` a rácson, `border-r border-b` a cellákon; tervezett napon `repeating-linear-gradient(-45deg, transparent 0 6px, color-mix(in oklch, var(--primary) 5%, transparent) 6px 7px)`).
- [ ] **Step 3:** `/dev/ui#calendar` fixture-rel (október 2026, ma = 16.); screenshot desktop/mobil · Expected: egyezik a mockuppal; mobilon heti szalag látszik.
- [ ] **Step 4:** Kapu, majd commit: `feat(calendar): hairline grid, day states and week strip`.

### Task 10: [Fázis 3] Napi panel és közös dialógusok

**Files:**
- Create: `src/components/calendar/song-picker-dialog.tsx`, `copy-day-dialog.tsx`
- Modify: `src/components/calendar/day-detail-panel.tsx`, `dashboard-view.tsx`

**Interfaces:**
- Produces: `SongPickerDialog({ open, onOpenChange, date: string, songs: Song[], excludeIds: Set<string>, onConfirm(ids: string[]): Promise<void> })` (keresés, többes kijelölés, „Mind”, borító + cím + előadó, megerősítés „Hozzáadás (n)”; mobilon alulról nyíló sheet); `CopyDayDialog({ open, onOpenChange, targetDate: string, sourceDates: { date: string; titles: string[] }[], onCopy(from: string): Promise<void> })`.
- A `dashboard-view.tsx` megtartja: év/hónap állapot, kiválasztott nap, `CalendarHeader` + `CalendarGrid`/`WeekStrip` + `DayDetailPanel`. A duplikált dialógusok és a mobilos akció-modál törlődnek; a próba törlése a panel „⋯” menüjébe kerül (AlertDialog marad).
- Eltávolítás: azonnali `removeSongFromDate`, majd `toast('Dal eltávolítva', { action: { label: 'Visszavonás', onClick: () => assignSongToDate(songId, date) } })`; a sor kilépése A6 szerint.
- Napváltáskor a panel tartalma A7 szerint úszik át (`motion.div key={date}`).

- [ ] **Step 1:** Komponensek megírása; a régi kód törlése a `dashboard-view.tsx`-ből (cél: ≤ 200 sor).
- [ ] **Step 2:** `/dev/ui#day`: a panel lezajlott, tervezett és üres napra (fixture, a mutációk no-op callbackek) · Expected: egyezik a mockuppal; üres napon „Szabad nap” + „Próba tervezése” + „Másolás”.
- [ ] **Step 3:** Kézi ellenőrzés a felhasználóval (`browser_preview`): dal hozzáadása, eltávolítás + visszavonás, másolás, átrendezés. Expected: mind működik, toast jelenik meg.
- [ ] **Step 4:** Kapu, majd commit: `feat(dashboard): unified day panel, shared pickers and undoable removal`.

### Task 11: [Fázis 3] Javaslat- és repertoár-kártya

**Files:**
- Create: `src/lib/neglected.ts`, `src/lib/neglected.test.ts`
- Modify: `src/actions/analytics.ts` (a `pickNeglectedSongs` használata), `src/actions/songs.ts` (`getDashboardSongInsights`)
- Create: `src/components/dashboard/neglected-songs-card.tsx`, `repertoire-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx` (a „Próba történet” blokk kikerül innen; a 17. feladat áthelyezi az Analitikára)

**Interfaces:**
- Produces: `pickNeglectedSongs(songIds: string[], lastPlayed: Record<string, string>, today: string, limit: number, minDays?: number): { songId: string; daysSince: number | null }[]` (a soha nem játszott dalok elöl, `daysSince: null`; utána a legrégebben játszottak; csak `daysSince >= minDays`, alapértelmezés 21); `getDashboardSongInsights(): Promise<{ neglected: { song: Song; daysSince: number | null }[]; statusCounts: Record<SongStatus | 'all', number> }>`.
- `NeglectedSongsCard({ items, nextRehearsalDate: string | null })`: a „+ {okt. 22.}” gomb `assignSongToDate`-et hív, toasttal; ha nincs következő próba, a gomb rejtett.
- `RepertoireCard({ counts })`: 3 KPI (mono számok) + szegmentált sáv (`flex: n`), jelmagyarázattal.

- [ ] **Step 1:** Teszt: `pickNeglectedSongs(['a','b','c'], { a: '2026-10-13', b: '2026-09-05' }, '2026-10-16', 3)` → `[{ songId: 'c', daysSince: null }, { songId: 'b', daysSince: 41 }]` (az `a` 3 napos, kiesik); `limit: 1` → csak `c`. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** Action, kártyák, bekötés; az `analytics.ts` a saját 90 napos küszöbével (`minDays: 90`, `limit: 10`) hívja ugyanezt; a visszatérési alak az analitika oldal számára változatlan marad.
- [ ] **Step 3:** `/dev/ui#insights` screenshot · Expected: egyezik a mockup „Rég nem játszottátok” és „Repertoár állapota” kártyáival.
- [ ] **Step 4:** Kapu, majd commit: `feat(dashboard): neglected songs and repertoire cards`.

### Task 12: [Fázis 4] Dalok oldal

**Files:**
- Modify: `src/app/(app)/songs/page.tsx`, `src/components/songs/song-filters.tsx` (→ toolbar), `song-card.tsx`, `song-list.tsx`
- Create: `src/components/songs/song-row.tsx`, `song-actions-menu.tsx`, `filters-popover.tsx`, `src/lib/song-filters.ts`, `src/lib/song-filters.test.ts`
- Delete: `src/components/songs/song-search.tsx`

**Interfaces:**
- Produces: `parseSongFilters(sp: Record<string, string | undefined>): { search?: string; status?: SongStatus; difficulty?: number; hasTab: boolean; favOnly: boolean; sort: 'artist' | 'date'; view: 'grid' | 'list' }`; `serializeSongFilters(f: Partial<ReturnType<typeof parseSongFilters>>, current: URLSearchParams): string` (az alapértékeket elhagyja: `sort=artist`, `view=grid`).
- `SongActionsMenu({ song })`: dropdown (Szerkesztés → `/songs/[id]/edit`, Tab megnyitása → `TabViewerModal`, Kedvenc váltása, elválasztó, Törlés → `DeleteSongDialog`), trigger: ikongomb `aria-label="Műveletek: {cím}"`.
- `SongCard({ song })` és `SongRow({ song })`: a cím linkje `/songs/{id}`; a lejátszás `usePlayer().play(song, visibleSongs)` (a lista kontextusából, propként: `onPlay(song)`).
- A toolbar minden URL-frissítése `router.replace(…, { scroll: false })`; a keresés debounce-a 300ms; `?focus=search` esetén a keresőmező fókuszt kap.

- [ ] **Step 1:** Teszt: `parseSongFilters({})` → `{ hasTab: false, favOnly: false, sort: 'artist', view: 'grid' }`; `parseSongFilters({ status: 'ok', view: 'list', difficulty: '3' })` → `status: 'ok'`, `view: 'list'`, `difficulty: 3`; ismeretlen `status: 'x'` → `undefined`; `serializeSongFilters({ view: 'grid', sort: 'artist' }, new URLSearchParams('view=list'))` → `''`. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** Komponensek megírása a spec 5.4 szerint; a `getSongs` `status` szűrőt kap (5. feladat interfésze).
- [ ] **Step 3:** `/dev/ui#songs` rács- és listanézet fixture-rel; screenshot desktop/mobil · Expected: egyezik a `hybrid.html#songs` nézettel; 390px-en a rács kétoszlopos, a lista nem csordul túl.
- [ ] **Step 4:** Kapu, majd commit: `feat(songs): grid/list views, status filter and actions menu`.

### Task 13: [Fázis 5] Song Hub

**Files:**
- Create: `src/lib/chords.ts`, `src/lib/chords.test.ts`
- Modify: `src/components/songs/tab-viewer-modal.tsx` (a regex és a sorbontás a `lib/chords.ts`-ből)
- Create: `src/app/(app)/songs/[id]/page.tsx`, `src/components/song-hub/hub-hero.tsx`, `chord-strip.tsx`, `tab-sheet.tsx`, `history-timeline.tsx`, `hub-recordings.tsx`, `status-picker.tsx`
- Modify: `src/actions/calendar.ts` (`getSongHistory`)

**Interfaces:**
- Produces (`chords.ts`): `splitChordLine(line: string): { text: string; isChord: boolean }[]` (a meglévő `chordPattern` logikája áthelyezve); `isChordLine(line: string): boolean` (a nem üres tokenek legalább 60%-a akkord); `extractChords(tab: string | null | undefined): string[]` (egyedi akkordok az első előfordulás sorrendjében, csak akkordsorokból).
- Produces (`calendar.ts`): `getSongHistory(songId: string): Promise<{ date: string }[]>` (egyedi dátumok, csökkenő sorrendben, a banda scope-jával).
- Page: `params: Promise<{ id: string }>`; ha a `getSongById` `undefined`-ot ad → `notFound()`. `StatusPicker({ songId, status })` = `SegmentedControl` + `useOptimistic` + `setSongStatus`; hiba esetén visszaáll, és `toast.error('Nem sikerült menteni')`.
- `TabSheet({ tabContent, fontSize })` a `splitChordLine`-nal renderel; az akkordok `ChordTooltip`-pel. Az akkordsor egy `ChordDiagram` minden `extractChords` elemre; ismeretlen akkord kimarad.
- A felvételek: `getRecordingsByDate` a történet legutóbbi legfeljebb 3 dátumára, csak azok, amelyek neve tartalmazza a dal címét (kisbetűs összevetés).

- [ ] **Step 1:** Teszt: `extractChords('Bm   F#   A   E\nOn a dark desert highway\nG  D  Em  F#')` → `['Bm','F#','A','E','G','D','Em']`; `extractChords('Am is the key here')` → `[]`; `extractChords(null)` → `[]`; `isChordLine('C   G   Am   F') === true`; `splitChordLine('Am  C')` két akkord darabot tartalmaz. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** `tab-viewer-modal.tsx` refaktor (a viselkedés változatlan). Run: `npm test` · Expected: PASS.
- [ ] **Step 3:** Hub oldal és komponensek a spec 5.5 szerint; a dalcímek mindenhol `/songs/{id}`-ra linkelnek (setlist, napi panel, kártyák).
- [ ] **Step 4:** `/dev/ui#hub` fixture-rel (Hotel California tabbal); screenshot desktop/mobil · Expected: egyezik a `hybrid.html#hub` nézettel; mobilon fülek.
- [ ] **Step 5:** Kapu, majd commit: `feat(hub): song detail page with chords, history and status`.

### Task 14: [Fázis 6] Próba mód: útvonal, állapot, kotta

**Files:**
- Create: `src/lib/practice.ts`, `src/lib/practice.test.ts`
- Create: `src/app/practice/[date]/page.tsx`, `src/app/practice/layout.tsx`
- Create: `src/components/practice/practice-view.tsx`, `practice-top-bar.tsx`, `practice-info.tsx`, `practice-sheet.tsx`, `use-wake-lock.ts`, `use-auto-scroll.ts`

**Interfaces:**
- Consumes: `TabSheet` (13. feladat), `CoverArt`, `ChordDiagram`, `extractChords`.
- Produces (`practice.ts`): `clampIndex(i: number, length: number): number` (`length === 0` → 0); `beatIntervalMs(bpm: number | null | undefined): number` (NULL → 80 BPM; 30–300 közé szorítva; `60000 / bpm`); `scrollStepPx(speed: number): number` (`0.35 * speed`, a speed 0.5–3 közé szorítva); `formatElapsed(ms: number): string` (`HH:MM:SS`).
- Page: `params: Promise<{ date: string }>`, `searchParams: Promise<{ i?: string }>`; auth (különben `/login`); az entries a dátumra; 0 entry → üres állapot „Ezen a napon nincs setlist” + vissza gomb. A `layout.tsx` nem tartalmaz navot és playert.
- `PracticeView({ date, entries, initialIndex })`: az index URL-szinkronban (`router.replace('?i=n', { scroll: false })`); a dalváltás iránya `direction: 1 | -1`; A3 animáció csak `source !== 'keyboard'` esetén; billentyűk: `ArrowRight`/`ArrowLeft` (dalváltás), `Space` (metronóm, a 15. feladatban), `Escape` (kilépés `/dashboard`-ra).
- `useAutoScroll(ref, { enabled, speed })` rAF-fel; `useWakeLock(active: boolean)` (`navigator.wakeLock` ellenőrzéssel; visibilitychange esetén újrakéri).

- [ ] **Step 1:** Teszt: `clampIndex(7, 5) === 4`; `clampIndex(-1, 5) === 0`; `clampIndex(0, 0) === 0`; `beatIntervalMs(null) === 750`; `beatIntervalMs(120) === 500`; `beatIntervalMs(1000) === 200`; `scrollStepPx(10) === 1.05`; `formatElapsed(1457000) === '00:24:17'`. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** Útvonal, layout és komponensek a spec 5.6 szerint (a felső sáv, a bal oszlop és a kotta; az alsó sáv a 15. feladatban, addig csak Előző/Következő).
- [ ] **Step 3:** `/dev/ui#practice` fixture-rel; screenshot desktop (1440×900) és mobil (390×844) · Expected: egyezik a `hybrid.html#practice` nézettel.
- [ ] **Step 4:** Kapu, majd commit: `feat(practice): full-screen practice mode with sheet and navigation`.

### Task 15: [Fázis 6] Próba mód: metronóm, görgetés, videó, felvétel

**Files:**
- Create: `src/hooks/use-metronome.ts` (az audio ütemező kiemelve a `metronome-modal.tsx`-ből)
- Modify: `src/components/tools/metronome-modal.tsx` (a hookot használja; a viselkedés változatlan)
- Create: `src/components/practice/practice-controls.tsx`, `beat-dots.tsx`

**Interfaces:**
- Produces: `useMetronome({ bpm: number, beatsPerBar?: number }): { isPlaying: boolean; currentBeat: number; start(): void; stop(): void; toggle(): void }` (Web Audio ütemezés a meglévő modal logikájával; az első ütem magasabb hangú).
- `BeatDots({ bpm, playing })`: 4 pötty, CSS keyframe `--beat` változóval (A4), az első amber; csökkentett mozgásnál csak színváltás.
- `PracticeControls`: Előző | Metronóm (BPM + „BPM”) | Görgetés (sebesség 0.5–3, lépésköz 0.5; kattintás = be/ki, a +/− popoverben) | Videó (a `YouTubePlayer` inline panelben jobb oldalt / mobilon sheet; ha nincs URL: inaktív, `title="Nincs videó"`) | Felvétel (`RecordingModal` a `date` paraméterrel) | Következő (amber, kiemelt). Mobilon a címkék rejtve, `aria-label` marad.

- [ ] **Step 1:** Teszt: a hook ütemezési matematikája tiszta függvényben: `nextBeatTime(prevTime: number, bpm: number): number` = `prevTime + 60 / bpm` (másodperc) a `practice.ts`-ben; `nextBeatTime(1, 120) === 1.5`. Run · Expected: FAIL → implementáció → PASS.
- [ ] **Step 2:** Hook kiemelése, a modal átállítása. Kézi ellenőrzés: a Metronóm modal ugyanúgy szól, mint előtte.
- [ ] **Step 3:** Vezérlősáv és integráció; Szóköz = metronóm be/ki.
- [ ] **Step 4:** Kézi ellenőrzés a felhasználóval (`browser_preview`): egy valódi próbanap végigléptetése, metronóm, görgetés, videó, felvétel. Expected: minden működik, a képernyő nem alszik el (wake lock).
- [ ] **Step 5:** Kapu, majd commit: `feat(practice): metronome, auto-scroll, video and recording controls`.

### Task 16: [Fázis 7] Dal-űrlap új mezőkkel

**Files:**
- Modify: `src/components/songs/song-form.tsx`, `src/app/(app)/songs/new/page.tsx`, `src/app/(app)/songs/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `songSchema` (5. feladat), atomok (4. feladat).
- Az űrlap szakaszai `SectionHeader`-rel: „Alapok” (cím, előadó, YouTube + Ajánló), „Zenei adatok” (hangnem: szöveg, max. 8 karakter, placeholder „pl. Am”; BPM: number 30–300; capo: select 0–12; hangolás: select Standard / Eb / Drop D / Egyéni → szövegmező), „Hol tartunk?” (`SegmentedControl` státusz + `DifficultyMeter`-alapú választó 1–5), „Jegyzet”, „Tab / akkordok” (összecsukható, a meglévő ajánlóval). A mezőhibák a mező alatt, `aria-live="polite"`-tal. Mentés után a `/songs/{id}` (Song Hub) oldalra navigál.

- [ ] **Step 1:** Átírás; a meglévő logika (YouTube-ajánló, tab-ajánló, dirty-check) megmarad.
- [ ] **Step 2:** Kézi ellenőrzés: új dal mentése minden új mezővel, majd szerkesztése; az adatok megjelennek a Hubon. Expected: igen.
- [ ] **Step 3:** Kapu, majd commit: `feat(songs): song form with musical metadata`.

### Task 17: [Fázis 7] Analitika átszínezése

**Files:**
- Modify: `src/app/(app)/analytics/page.tsx`, `src/components/analytics/practice-heatmap.tsx`, `trend-chart.tsx`, `top-songs-ranking.tsx`, `neglected-songs.tsx`, `src/components/dashboard/practice-history.tsx`
- Delete: `src/components/dashboard/stats-widget.tsx`

**Interfaces:**
- KPI-k (képlet nélkül): „Lezajlott próbák” (`pastPracticeDays`), „Tervezett próbák” (`futurePracticeDays`), „Gyakorolt dalok” (`totalSongsEverPracticed`), „Legutóbbi próba” (`lastPracticeDateFormatted`). A `: any` típus eltávolítása.
- A hőtérkép tokenszínnel (`--primary`, 5 lépcső: `color-mix(in oklch, var(--primary) {8|30|50|72|95}%, transparent)`), billentyűzettel is elérhető tooltip (a cellák `tabIndex`, `aria-label`). A grafikonok nem animálódnak.
- A „Próba történet” (`PracticeHistory`) az oldal aljára kerül, `SectionHeader`-rel.

- [ ] **Step 1:** Átírás. A `getAnalyticsData` alakja változatlan (a 11. feladat refaktorja után).
- [ ] **Step 2:** Kézi ellenőrzés a felhasználóval (az oldal adat nélkül nem tesztelhető a `/dev/ui`-n). Expected: a KPI-k érthetők, a hőtérkép amber.
- [ ] **Step 3:** Kapu, majd commit: `feat(analytics): Midnight Liner restyle and clearer KPIs`.

### Task 18: [Fázis 7] Login, Banda és eszköz-modálok

**Files:**
- Modify: `src/app/login/page.tsx`, `src/components/auth/login-form.tsx`, `src/components/band/band-profile.tsx`, `band-switcher.tsx`, `onboarding-modal.tsx`, `src/components/tools/guitar-tuner-modal.tsx`, `metronome-modal.tsx`, `recording-modal.tsx`, `src/components/songs/tab-viewer-modal.tsx`, `delete-song-dialog.tsx`, `spotify-playlist-button.tsx`, `src/components/shared/empty-state.tsx`

**Interfaces:**
- Login: két oszlop (≥ lg). Bal oldalon borítókollázs (4 generált `CoverArt` dőlt címekkel) és a Fraunces mondat: „Minden próba egy *új lemezoldal*.” Jobb oldalon logó, „Gyakorolj együtt a bandáddal”, Google-gomb (és GitHub, ha engedélyezett). A nem működő „használati feltételek” link törlődik. A meglévő Remotion lejátszó kikerül a login oldalról (ha másutt nincs használva, a 19. feladat törli a függőséget).
- Az onboarding-modál emojija (🎸) helyett `CoverArt`/logó.
- Minden modál: tokenszínek, `SectionHeader`/`Eyebrow` címkék, a hardcode-olt színek (`emerald`, `pink`, `blue`, `amber` stb.) cseréje szemantikus tokenekre.

- [ ] **Step 1:** Átírás.
- [ ] **Step 2:** Run: `rg -n "(emerald|pink|blue|lime|yellow|amber|orange|green|red)-[0-9]{3}|#[0-9a-fA-F]{6}" src/components src/app` a grep eszközzel · Expected: csak a márkalogók (Google, Spotify SVG) és a generált hue-k maradnak.
- [ ] **Step 3:** `/login` screenshot desktop/mobil (login nélkül elérhető) · Expected: Midnight Liner arculat.
- [ ] **Step 4:** Kapu, majd commit: `feat(ui): restyle login, band and tool modals`.

### Task 19: [Fázis 8] Takarítás, hozzáférhetőség, dokumentáció

**Files:**
- Delete: maradék holt kód (`src/components/shared/page-transition.tsx`, ha még megvan; nem használt komponensek a `rg` szerint; a nem használt `remotion` / `@remotion/player` függőségek, ha a 18. feladat után nincs importjuk)
- Modify: `README.md` (projektleírás, parancsok), `docs/UI-SPEC.md` (hivatkozás a specre + a token-összefoglaló), `docs/PRD.md` (a tech stack frissítése: Next 16, Tailwind 4)

**Interfaces:** —

- [ ] **Step 1:** Holt kód keresése: a fájlneveket a grep eszközzel keresd a `src`-ben; amire nincs import, azt töröld. Run: `npm run build` · Expected: zöld.
- [ ] **Step 2:** A11y átnézés: minden ikon-only gombnak van `aria-label`-je (grep: `size="icon` és `icon-btn` minták); fókuszgyűrű látszik (Tab-bal végigmenni a `/dev/ui`-n); a `--faint` csak nem kritikus szövegen. Az eltéréseket javítsd.
- [ ] **Step 3:** Docs frissítése.
- [ ] **Step 4:** Kapu, majd commit: `chore: remove dead code, a11y fixes and docs refresh`.

### Task 20: [Fázis 8] Animációs review és végső ellenőrzés

**Files:** a review alapján érintett komponensek

**Interfaces:** —

- [ ] **Step 1:** Hívd meg a `review-animations` skillt a branch teljes diffjére (`git diff main...HEAD -- src`), a spec 6. fejezetével mint mércével. Minden „block” vagy „must-fix” találatot javíts; a többi a ledgerbe kerül.
- [ ] **Step 2:** Csökkentett mozgás: Chrome DevTools „Emulate prefers-reduced-motion: reduce” (vagy `--force-prefers-reduced-motion` headless flag) mellett screenshot a hero-ról és a Próba módról · Expected: nincs elmozdulás, a tartalom azonnal látszik.
- [ ] **Step 3:** Teljes kapu: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: mind zöld.
- [ ] **Step 4:** Végső screenshot-sor (`/dev/ui` összes szekciója, `/login`) desktopon és mobilon; egymás mellett a mockuppal.
- [ ] **Step 5:** Commit: `chore: animation review fixes`. Utána superpowers:finishing-a-development-branch (merge/PR csak a felhasználó döntése alapján).
