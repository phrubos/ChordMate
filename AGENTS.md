# ChordMate — agent notes

Gitárgyakorlás-szervező (Next.js 16 App Router, React 19, Tailwind v4, shadcn base-nova + Base UI, Motion 12, Drizzle + Neon, NextAuth v5). UI nyelve magyar.

## Parancsok
- Fejlesztői szerver: `npm run dev` (http://localhost:3000)
- Tesztek: `npm test` (Vitest, `src/**/*.test.ts`, tiszta függvények)
- Típusellenőrzés: `npx tsc --noEmit`
- Lint: `npm run lint` — hiba és figyelmeztetés nélkül fut; így is maradjon (`npx eslint <fájlok>`)
- Build: `npm run build`
- Képernyőkép (futó dev szerver mellett): `bash scripts/ui-shot.sh "/dev/ui#atoms" desktop out.png`, mobil: `bash scripts/ui-shot.sh "/dev/ui?w=390#atoms" mobile out.png`
- Egy szekció önmagában (stabil képernyőképhez): `/dev/ui?only=<id>` (pl. `songs`, `hub`, `practice`, `form`, `analytics`), mobilon `/dev/ui?w=390&only=<id>`
- A `/dev/ui` oldal login nélkül elérhető (csak fejlesztői módban), fixture-adatokkal: `src/app/dev/ui/fixtures.ts`
- Python fájlt így futtatunk: `py file.py`

## Redesign (Midnight Liner)
- Spec: `docs/superpowers/specs/2026-10-16-midnight-liner-design.md`
- Terv: `docs/superpowers/plans/2026-10-16-midnight-liner-redesign.md`
- Napló: `docs/superpowers/progress/2026-10-16-midnight-liner-redesign.md`
- Mockup: `.superdesign/design_iterations/hybrid.html` (sötét), `liner.html` (világos)

## Szótár (UI-feliratok)
- **Próba** = esemény (egy nap a naptárban, a banda közösen). **Setlist** = a próba dalsora, sorrenddel.
- **Próba mód** = a színpadi nézet (`/practice/[date]`). **Gyakorlás** = egyéni, próbán kívüli Próba mód (`/practice/song/[id]`).
- A „gyakorlás” szót ne használd a banda próbáira (statisztika, napló): ott „próba”.

## Szabályok
- Komponensben nincs nyers szín (hex / Tailwind palettaszín), csak tokenek.
- Animáció csak a spec 6. fejezete szerint (A1–A9), csak transform/opacity, reduced-motion tisztelete.
- DB-migrációt (`drizzle-kit migrate`) az éles adatbázison csak a felhasználó jóváhagyásával futtatunk.
