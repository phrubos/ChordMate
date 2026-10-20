# ChordMate

Gitárgyakorlás-szervező bandáknak: közös dallista, próbanaptár setlistekkel, kották és akkordok, Próba mód (metronóm, auto-görgetés, videó, felvétel), globális mini-player és statisztika. A felület nyelve magyar, az arculat a „Midnight Liner” (sötét alapértelmezés, világos „Liner Notes” téma).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn (base-nova) + Base UI · Motion 12 · Drizzle ORM + Neon Postgres · NextAuth v5 (Google, opcionálisan GitHub) · react-youtube · Vitest

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | Fejlesztői szerver: http://localhost:3000 |
| `npm test` | Vitest egységtesztek (`src/**/*.test.ts`, tiszta függvények) |
| `npx tsc --noEmit` | Típusellenőrzés |
| `npm run lint` | ESLint |
| `npm run build` | Éles build |

Fejlesztői UI-katalógus login nélkül: `/dev/ui` (csak fejlesztői módban, fixture-adatokkal). Egy szekció: `/dev/ui?only=<id>` (pl. `songs`, `hub`, `practice`, `analytics`), mobil keretben: `/dev/ui?w=390&only=<id>`.
Képernyőkép futó dev szerver mellett: `bash scripts/ui-shot.sh "/dev/ui?only=hub" desktop out.png`.

## Környezeti változók

`.env.local`: `DATABASE_URL` (Neon), `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; opcionálisan `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` és `NEXT_PUBLIC_GITHUB_ENABLED=1`, valamint a Spotify-integrációhoz `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.

## Dokumentáció

- Arculat és elfogadási kritériumok: `docs/superpowers/specs/2026-10-16-midnight-liner-design.md`
- Megvalósítási terv és napló: `docs/superpowers/plans/…`, `docs/superpowers/progress/…`
- Termékleírás: `docs/PRD.md`, UI-leírás: `docs/UI-SPEC.md`
