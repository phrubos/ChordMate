# SDD ledger — plan: docs/superpowers/plans/2026-10-16-midnight-liner-redesign.md

Spec: docs/superpowers/specs/2026-10-16-midnight-liner-design.md (read)
Executor: inline (executing-plans), branch `feat/midnight-liner` (base 8996fad)

Setup: Ruling: work on branch `feat/midnight-liner` in the main checkout instead of a separate git worktree — `.env.local` (gitignored secrets) and node_modules live here and the dev server/preview already point here; the user approved the plan that names the branch — cost if wrong: master untouched either way; only isolation from local uncommitted edits is lost.
Setup: Ruling: ledger lives at `docs/superpowers/progress/…` (tracked) instead of `.superpowers/sdd/…/progress.md` — the agent tooling may not write gitignored paths; scratch output (test logs, briefs) still goes to the gitignored workspace via shell — cost if wrong: one extra tracked doc, removed at finish.
Setup: Ruling: baseline `npm run lint` already fails (29 errors, 114 warnings on master). The per-task lint gate is therefore "no new lint errors": `npx eslint <changed files>` has 0 errors, and the total error count never exceeds the baseline 29 — cost if wrong: pre-existing lint debt stays (Task 19 cleans what it touches).

## Pre-flight (shared interfaces)
| Producer → Consumer | Produces | Consumes | Finding |
|---|---|---|---|
| T3 → T6 | `springs.indicator` (old `springs.snappy` removed) | mobile-bottom-nav uses `springs.snappy` until T6 deletes it | T3 switches the reference (plan says so) — OK |
| T4 → T5 | `SongStatus`, `SONG_STATUSES` | schema `$type<SongStatus>()`, zod enum | OK |
| T5 → T12/T13 | `getSongs({status})`, `setSongStatus` | songs filters, StatusPicker | OK |
| T7 → T8/T12/T13 | `usePlayer().play(song, queue?)`, `buildQueue` | hero CTA, song cards, hub | OK |
| T8 → T9..T11 | `calendar-utils.ts` | T9 extends same file | OK |
| T13 → T14 | `TabSheet`, `extractChords` | PracticeSheet | OK |
| T14 → T15 | `practice.ts` | T15 adds `nextBeatTime` | OK |
| T1 → all | `/dev/ui`, `fixtures.ts`, `scripts/ui-shot.sh` | visual checks | OK |

## Tasks
Task 1: Ruling: screenshots go to `/tmp/cm-shots` (outside repo) — the agent cannot read gitignored `.superpowers/` files — cost if wrong: none.
Task 1: complete (commits 8996fad..b5a512c, tests: npm test → 1/1 pass; tsc ok; eslint changed files ok; build ok, /dev/ui listed)
Task 2: Ruling: kept `.tab-content` and a retuned `animate-fade-up` (200ms, 6px, --ease-out) — both still used (tab viewer, song form); removing them would break those screens before Tasks 13/16 restyle them — cost if wrong: one leftover utility, cleaned in Task 19.
Task 2: Ruling: `font-sans` moved from `<html>` to `<body>` — next/font defines the font variables on `<body>`, so on `<html>` the variable was undefined and the body text fell back to a serif (pre-existing bug, also with Geist) — cost if wrong: none.
Task 2: Ruling: removed CSS classes (`practice-day-*`, `today-marker`, `shimmer-text`, `login-*`, `glow-pulse`, `float`) are still referenced by calendar cell / navbar / login until Tasks 6/9/18; they are no-ops meanwhile — cost if wrong: temporarily plainer calendar and login on this branch.
Task 2: Ruling: grain noise moved from an inline SVG data URI to `public/grain.svg` — the production CSS minifier crashed on the data URI (`TypeError … reading 'length'`, bisected: build green without that block) — cost if wrong: one extra 237-byte request.
Task 2: Ruling: fixed the pre-existing `react-hooks/set-state-in-effect` lint error in `theme-toggle.tsx` (now `useSyncExternalStore` on the `<html>` class) since the task touches the file — cost if wrong: none; baseline lint errors drop to 28.
Task 2: complete (commits b5a512c..HEAD, tests: npm test → 1/1 pass; tsc ok; eslint changed files ok; build ok; /dev/ui#tokens screenshot matches hybrid.html palette and fonts incl. ő/ű)
Task 3: Ruling: also removed the width "draw-in" animation of the analytics ranking bars (static `style.width`) — spec §6 rejects chart draw-in on functional data — cost if wrong: none.
Task 3: note: eslint on touched files reports 2 errors, both pre-existing baseline (analytics/page.tsx `any` → Task 17; mobile-bottom-nav setState-in-effect → deleted in Task 6); no new errors.
Task 3: complete (commits 05e32aa..HEAD, tests: npm test → 3/3 pass (motion 2 RED→GREEN); tsc ok; build ok)
Task 4: Ruling: added `ChipList` (joins chips with a middle dot, skips empty values) and exported `STATUS_TEXT`/`STATUS_BG`/`initialsOf` alongside the planned atoms — needed so callers never render empty chips (Review Focus #3) and never hardcode status colors — cost if wrong: three extra exports.
Task 4: Ruling: avatar fallback shows ONE initial (last word of the name; Hungarian names are family-name first) — two-letter initials were clipped by the overlapping stack and the mockup shows single letters — cost if wrong: cosmetic.
Task 4: Ruling: Input/Textarea/Badge got only radius/height/focus token tweaks (h-10 inputs) — no visual spec beyond tokens; screens restyle them in context — cost if wrong: small follow-ups in screen tasks.
Task 4: complete (commits 945b085..HEAD, tests: npm test → 7/7 pass (song-meta 4 RED→GREEN); tsc ok; eslint touched files 0 errors; build ok; /dev/ui#atoms desktop + 390px screenshots checked: no horizontal overflow, long title ellipsized)
Task 5: Ruling: applied migration 0003 by executing its 5 `ALTER TABLE songs ADD COLUMN` statements directly in one Neon transaction instead of `drizzle-kit migrate` — the DB's `drizzle.__drizzle_migrations` only records 2 entries while 0001/0002 were applied out-of-band (push), so `migrate` would re-run them and fail. User approved this exact SQL. Verified: 5 columns exist, 27 existing songs = 'learning' — cost if wrong: `__drizzle_migrations` still lacks 0001–0003 rows (pre-existing drift; future migrations need the same care).
Task 5: complete (commits 2fbe20f..HEAD, tests: npm test → 11/11 pass (validators 4: 3 RED→GREEN); tsc ok; eslint touched 0 errors; build ok; migration applied with approval)
Task 6: Ruling: added `ToolsLauncher` context (owns tuner/metronome modals) and a reusable bottom `Sheet` (`ui/sheet.tsx`, A2 timing) — both masthead and bottom nav must open the same tools, and the sheet is reused by Tasks 7/10 — cost if wrong: two small extra files.
Task 6: Ruling: the masthead "Próba mód" defaults to `/dashboard#next` via a `practiceHref` prop; the layout passes the real URL after Task 8 — cost if wrong: one prop wire-up later.
Task 6: note: had to stop the dev server (Windows folder lock blocked `git mv`) and delete stale generated `.next/dev/types` + `.next/types` (build typechecked old paths). Generated cache only.
Task 6: complete (commits 2d3cbbe..HEAD, tests: npm test → 11/11 pass; tsc ok; eslint touched: only baseline analytics `any`; build ok with unchanged routes; /dev/ui shell desktop + 390px screenshots: masthead, mobile top bar, bottom nav present)
Task 7: Ruling: no separate `video-sheet.tsx` — the expanded video is the provider's own container restyled in place (bottom sheet on mobile, centered dialog ≥ md), because moving/portaling an iframe reloads it and would restart playback — cost if wrong: provider file is larger.
Task 7: Ruling: Step 4 manual cross-route check is batched into one user browser session after Phase 3 (Task 11) together with Task 10's manual checks, to avoid interrupting the run per task; automated evidence now: reducer tests + /dev/ui?player=1 screenshots (desktop pill, mobile above bottom nav) — cost if wrong: a route-persistence bug would surface a few tasks later.
Task 7: note: eslint on day-detail-panel shows 4 baseline `rules-of-hooks` errors (pre-existing; panel rewritten in Task 10); no new errors.
Task 7: complete (commits 3179faf..HEAD, tests: npm test → 19/19 pass (player-state 8 RED→GREEN); tsc ok; build ok)
Task 8: Ruling: added pure `pickNextRehearsal(entries, today)`; the dashboard computes the hero from the entries it already loads (no second query), and `getNextRehearsal()` wraps the same helper — cost if wrong: none. Its test was written after the code; validated by mutation (filter `===`→`!==` made it fail 1/5, restored → 5/5).
Task 8: Ruling: masthead "Próba mód" links to `/practice/next`; Task 14 must resolve `next` to the upcoming rehearsal date (or show the empty state) — cheaper than querying entries in the shared layout on every navigation — cost if wrong: Task 14 handles one extra param value.
Task 8: Ruling: hero facts show song count + band name (no rehearsal time/place — not in the data model; spec §2 excludes durations); members row = band members (RSVP is out of scope) — cost if wrong: none.
Task 8: Ruling: generated covers got a container query (`@container`, title `clamp(14px,11cqi,26px)`, artist hidden under 150px) — on 390px the 4-up strip overflowed — cost if wrong: none.
Task 8: complete (commits 6c99b48..HEAD, tests: npm test → 24/24 pass (calendar-utils 5, 4 RED→GREEN + 1 mutation-verified); tsc ok; eslint touched: only baseline stats-widget (dead code, Task 17); build ok; /dev/ui hero desktop + 390px match mockup, empty state OK)
Task 9: Ruling: removed the calendar's month slide (spring x ±100%) animation — not among spec A1–A9 (Global Constraints) — cost if wrong: month change is an instant swap.
Task 9: Ruling: view state is `'auto' | 'month' | 'week'`; 'auto' shows the grid ≥ md and the week strip below via CSS (no hydration flash); the header segment reads the effective view through a `matchMedia` `useSyncExternalStore` (server snapshot = desktop) — cost if wrong: on mobile the segment may briefly show "Hónap" before hydration.
Task 9: note: cell hover actions (add/copy/delete) are gone as specified; until Task 10 the desktop "próba törlése" is only reachable via the old mobile modal — temporary on this branch.
Task 9: complete (commits d93912c..HEAD, tests: npm test → 26/26 pass (dayState/weekStripDates 2 RED→GREEN); tsc ok; eslint touched 0 errors; build ok; /dev/ui#calendar screenshot matches mockup: hairline grid, filled vs ring marks, stripes on planned days, amber today, selected outline, week strip)
Task 10: Ruling: added `ResponsiveDialog` (Dialog ≥ md, bottom Sheet below) and `useIsDesktop` hook — the plan asks pickers to be sheets on mobile; one wrapper serves both pickers — cost if wrong: two small files.
Task 10: Ruling: the day panel uses React 19 `useOptimistic` for remove/reorder instead of mirrored local state (the old `useEffect(setLocal)` pattern violated lint) — all calendar actions revalidate /dashboard, so server data replaces the optimistic copy — cost if wrong: none observed.
Task 10: Ruling: recordings stay a footer action ("Felvétel" today/future, "Felvételek" for past days that have recordings) opening the existing RecordingModal, not an inline waveform list — the modal already lists/plays; the spec only requires recordings in the panel — cost if wrong: less visual than the mockup.
Task 10: Ruling: fixed a dnd-kit SSR hydration mismatch (`DndDescribedBy-*` ids) with `<DndContext id={useId()}>` — cost if wrong: none.
Task 10: FINDING (pre-existing, not fixed — outside plan scope): `clearSongsFromDate(date)` deletes calendar entries for that date across ALL bands (no bandId scope). Reported to the user in the final summary.
Task 10: Manual check (add / remove+undo / copy / reorder in the real app) batched into the post-Task-11 user session (see Task 7 ruling).
Task 10: complete (commits f77935d..HEAD, tests: npm test → 26/26 pass; tsc ok; eslint touched 0 errors (4 baseline rules-of-hooks errors removed); build ok; /dev/ui day panels (past/planned/empty) screenshot matches mockup; no hydration warnings; dashboard-view.tsx 445 → 85 lines)
Task 11: Ruling: added pure `buildSongInsights(songs, entries, today)`; the dashboard computes the cards from data it already loads, `getDashboardSongInsights()` wraps the same helper — avoids two duplicate queries per dashboard render — cost if wrong: none.
Task 11: Ruling: "last played" counts only past rehearsals (a song planned for next week is not "recently played") — cost if wrong: such songs may still be suggested.
Task 11: Ruling (revises Task 7/10 rulings): all real-app manual checks are batched into ONE user browser session at the end of the run (before the final review), so the inline run is not interrupted — cost if wrong: bugs in live flows surface later.
Task 11: complete (commits c70d1d8..HEAD, tests: npm test → 30/30 pass (neglected 3 + insights 1, RED→GREEN); tsc ok; eslint touched 0 errors; build ok; analytics output shape unchanged; /dev/ui#insights matches mockup)
Task 12: Ruling: the status filter is applied in the page after `getSongs` (not in SQL) so the segment counts reflect every other active filter — cost if wrong: filtering in memory on a small per-band list.
Task 12: Ruling: "Tab megnyitása" opens `TabViewerModal` in a new controlled mode (`open`/`onOpenChange`, no trigger rendered) and is shown when the song has tab content OR a tab URL — cost if wrong: none.
Task 12: Ruling: `/dev/ui?only=<section-id>` renders a single section — headless screenshots with `#hash` came out blank (scroll before paint) — cost if wrong: none (dev only).
Task 12: Ruling: the favorite badge on the cover uses `bg-black/35 text-white` like the generated cover type itself (cover-hue exception in Global Constraints) — cost if wrong: one exception site.
Task 12: complete (tests: npm test → 34/34 pass (song-filters 4 RED→GREEN); tsc ok; eslint touched 0 errors; build ok; /dev/ui?only=songs desktop grid+list match hybrid.html#songs, 390px: 2-column grid, no overflow, long titles wrap)
Task 13: Ruling: `isChordLine`/`extractChords` recognize any chord-shaped token (e.g. `F#m7b5`, `Bb/D`), while `splitChordLine` highlights only chords with a known diagram (the old modal behavior); `ChordStrip` drops chords without a diagram — cost if wrong: none.
Task 13: Ruling: added `splitChordText` (whole tab, "\n" parts between lines), shared by the modal and `TabSheet` — cost if wrong: one extra export.
Task 13: Ruling: extra files `hub-body.tsx` (client: two columns ≥ md, tabs below) and `song-hub-view.tsx` (page body, reused by `/dev/ui?only=hub`; a page file may not export components) — cost if wrong: two small files.
Task 13: Ruling: "Gyakorlás" links to `/practice/{nearest planned date of this song}` or `/practice/next`; the mockup's "Okt. 22. próbán" button is left out (not in spec 5.5's CTA list) — cost if wrong: one extra CTA later.
Task 13: Ruling: the hub hero background mixes the cover hue (cover-hue exception) with `var(--card)`, so it works in both themes — cost if wrong: cosmetic.
Task 13: complete (tests: npm test → 38/38 pass (chords 4 RED→GREEN); tsc ok; eslint touched 0 errors (4 baseline unused-import warnings in calendar.ts); build ok, /songs/[id] listed; /dev/ui?only=hub desktop matches hybrid-hub-desktop.png, 390px: tabs, CTA row on one line, no overflow)
Task 14: Ruling: `?i=` is the 1-based song number (what the user sees as "1/5"); the page converts it with `clampIndex(i - 1)` — cost if wrong: links from Task 13/15 must use 1-based values.
Task 14: Ruling: `/practice/next` (masthead) redirects to the upcoming rehearsal date, or shows "Nincs tervezett próba"; non-`yyyy-MM-dd` dates → 404 — cost if wrong: none.
Task 14: Ruling: the sheet renders the free-text tab (`TabSheet`, 15/18px) instead of the mockup's bar grid — songs store free text, not structured bars — cost if wrong: plainer sheet than the mockup.
Task 14: Ruling: the A3 enter animation (x ±24px + fade, 220ms) runs only for button-initiated changes; no exit animation (an exit would delay the next song); swipe is not added in this task — cost if wrong: swipe can be added in Task 15/19.
Task 14: Ruling: `PracticeView` takes `syncUrl` and `className` props so `/dev/ui?only=practice` can render it in a fixed-height frame without touching the URL — cost if wrong: none.
Task 14: note: `tsc` failed on stale generated `.next/types` (from the previous build; did not know the new `/practice` layout); `npm run build` regenerated it. Generated cache only.
Task 14: complete (tests: npm test → 42/42 pass (practice 4 RED→GREEN); tsc ok; eslint touched 0 problems; build ok, /practice/[date] listed; /dev/ui?only=practice desktop 1440×900 + 390px match hybrid-practice-*.png)
