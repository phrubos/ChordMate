# Próba mint önálló entitás — design

Forrás: UX-audit (canvas: https://claude.ai/artifact/A9chmoaWRZzabWZ2CAw6oy) — L4, H2, Z3, É3-hez kapcsolódó felvétel-hiba; mockup: „5 · Próba oldal” artboard.

## Probléma
A próba ma csak `calendar_entries` sorok halmaza (dátum + dal). Nincs időpont, helyszín, cél, jegyzet, jelenlét. A felvételek csak dátumhoz kötődnek; a dal oldal a felvétel **nevében** keresi a dal címét, és csak az utolsó 3 próbanapon. A próbának nincs saját oldala és menüpontja; a Statisztika főmenüpont, holott ritka feladat.

## Döntések
1. **Azonosítás változatlan: (banda, dátum).** Egy bandának egy napon egy próbája van — ez ma is így működik (setlist = adott nap bejegyzései). URL: `/rehearsals/[date]` (yyyy-MM-dd), párban a meglévő `/practice/[date]`-tel.
2. **Additív migráció, adatmigráció nélkül.**
   - Új `rehearsals` tábla a próba **adataira** (opcionális sor): `band_id`, `date`, `start_time`, `end_time` (`HH:MM` szöveg), `place`, `goal`, `notes`, `kind` (`rehearsal` | `gig`, alapértelmezés `rehearsal`), `created_by_id`, `created_at`, `updated_at`. Egyedi: (`band_id`, `date`).
   - Új `rehearsal_attendance`: (`rehearsal_id`, `user_id`) PK, `answer` (`yes` | `maybe` | `no`), `updated_at`.
   - `recordings.song_id` (nullable, FK `songs`, `ON DELETE SET NULL`).
   - A `calendar_entries` (setlist) érintetlen. Egy nap „próba”, ha van setlist-sora **vagy** `rehearsals` sora.
3. **Hozzáférés**: ugyanaz a szabály, mint a `calendar_entries`-nél (`lib/access.ts`): aktív banda sorai; banda nélkül a saját, banda nélküli sorok.
4. **Navigáció**: Kezdőlap · Dalok · **Próbák** · Banda. A Próbák oldalnak három füle van (link-fülek): **Lista** (`/rehearsals`), **Naptár** (`/rehearsals?view=calendar`, a meglévő naptár + nap-panel), **Áttekintés** (`/analytics`, a mai Statisztika, változatlan tartalommal). A „Próbák” menüpont aktív a `/rehearsals` és `/analytics` alatt.
5. **Próba oldal** (`/rehearsals/[date]`): fejléc (típus, dátum, idősáv, hely, cél), „Próba mód indítása”, „Ott leszel?” (Jövök / Talán / Nem), résztvevők listája, setlist-szerkesztés a meglévő `DayDetailPanel`-lel, „Részletek szerkesztése” párbeszédablak (idő, hely, típus, cél, jegyzet).
6. **Felvétel ↔ dal**: Próba módban rögzített felvétel `song_id`-t kap. A dal oldal felvételei: `song_id = dal` **vagy** (régi sor: `song_id IS NULL` és a név tartalmazza a címet) — dátumkorlát nélkül, legfeljebb 10, legújabb elöl.
7. **Kezdőlap**: a „Következő próba” kártya mutatja az idősávot és a helyet, ha vannak, és a próba oldalára visz. (A teljes Kezdőlap-átdolgozás — D1 — külön terv.)

## Nem része
Értesítések (H2 második fele), tagonkénti státusz (H4), blob tárolás (T1), Kezdőlap-átdolgozás (D1) — külön tervek.

## Szövegek (pontosan)
- Menüpont: „Próbák”. Fülek: „Lista”, „Naptár”, „Áttekintés”.
- Típus: „Próba”, „Fellépés”.
- Jelenlét-gombok: „Jövök”, „Talán”, „Nem”; válaszok a listában: „Jön”, „Talán”, „Nem jön”, „Nem jelzett”.
- Üres lista: „Még nincs próba. Tervezz egyet!”
- Validációs hibák: „Időpont formátuma: ÓÓ:PP”, „A vége legyen a kezdés után”, „Legfeljebb {n} karakter”.
