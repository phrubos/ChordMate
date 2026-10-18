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
