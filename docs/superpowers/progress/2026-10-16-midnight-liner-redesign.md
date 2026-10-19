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
