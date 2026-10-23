# ChordMate „Midnight Liner” redesign — specifikáció

**Dátum:** 2026-10-16 · **Státusz:** jóváhagyva (felhasználó: „ezzel megyünk”)
**Vizuális referencia (kötelező):** `.superdesign/design_iterations/hybrid.html` (sötét, alap), `.superdesign/design_iterations/liner.html` (világos téma). A mockup a forrás minden olyan vizuális kérdésben, amit ez a dokumentum nem rögzít.

## 1. Cél

A ChordMate egyedi, letisztult, profi megjelenést kap (Liner Notes szerkesztőségi tipográfia a Late-Night Studio meleg sötét alapján), és a fő kérdés köré szerveződik: **„mit játszunk a következő próbán, és hogyan kezdjük el?”**. Új funkciók: **Próba mód**, **globális mini-player**, **Song Hub** (dal-részletoldal), dal-metaadatok (státusz, BPM, hangnem, capo, hangolás).

## 2. Hatókör

**Benne van:** design tokenek + fontok; app-keret (masthead desktopon, felső sáv + bottom nav mobilon); kezdőlap (Következő próba hero, új naptár, heti szalag mobilon, napi panel, javaslat- és repertoár-kártya); Dalok oldal (rács/lista, státuszszűrő, szűrő popover); Song Hub; Próba mód; mini-player; dal-űrlap új mezői; Analitika, Login, Banda, eszköz-modálok átszínezése; animációk (6. fejezet); takarítás (holt kód, docs).

**Nincs benne (később):** ⌘K command palette, RSVP / ki jön, aktivitás-feed, setlist export, linkből automatikus dal-kitöltés, a dalok hossza (a hero csak dalszámot mutat, percet nem).

## 3. Információs architektúra

| Desktop masthead | Mobil bottom nav | Útvonal |
|---|---|---|
| Kezdőlap | Kezdőlap | `/dashboard` |
| Dalok | Dalok | `/songs`, Song Hub: `/songs/[id]`, szerkesztés: `/songs/[id]/edit` |
| (ikonok: Hangoló, Metronóm) | Eszközök (sheet: Hangoló, Metronóm) | modálok |
| Statisztika | Statisztika | `/analytics` |
| Banda | Banda | `/band` |
| „Próba mód” gomb (jobb oldalt) | — (a heróból indul) | `/practice/[date]` |

- A Próba mód teljes képernyős, **nav nélkül**; kilépés: × gomb → `/dashboard`.
- A mini-player minden app-oldalon látszik (desktopon alul középen lebegő pirula, mobilon a bottom nav felett), a Próba módban nem.
- Mobilon a napra koppintás **csak kiválaszt** (nincs akció-modál); az akciók a napi panel láblécében vannak.
- A dalcímek mindenhol a Song Hubra linkelnek.

## 4. Design tokenek

### 4.1 Színek — sötét (alapértelmezett, `.dark`)

| Token (CSS var) | Érték | Szerep |
|---|---|---|
| `--page` | `oklch(.13 .006 60)` | oldal-háttér a tartalom mögött |
| `--background` | `oklch(.165 .008 60)` | „papír” |
| `--foreground` (`--ink`) | `oklch(.93 .018 82)` | szöveg, erős vonalak |
| `--card`, `--popover` | `oklch(.2 .009 62)` | felület |
| `--secondary`, `--muted`, `--accent` | `oklch(.235 .01 62)` | másodlagos felület / hover |
| `--muted-foreground` | `oklch(.74 .018 75)` | másodlagos szöveg |
| `--faint` | `oklch(.57 .016 70)` | harmadlagos szöveg (min. 12px, csak nem kritikus infó) |
| `--primary` | `oklch(.8 .145 72)` | amber akcent |
| `--primary-foreground` | `oklch(.19 .03 60)` | szöveg amber felületen |
| `--primary-text` | `oklch(.84 .13 76)` | amber szöveg sötét háttéren |
| `--border` | `oklch(.93 .02 82 / .1)` | hajszálvonal |
| `--border-strong`, `--input` | `oklch(.93 .02 82 / .2)` | erős vonal, inputok |
| `--ring` | `= --primary` | fókusz |
| `--destructive` | `oklch(.65 .2 25)` | törlés |
| `--status-learning` | `oklch(.72 .15 35)` | Tanuljuk |
| `--status-ok` | `oklch(.84 .13 92)` | Megy |
| `--status-ready` | `oklch(.76 .12 152)` | Kész |
| `--done` | `oklch(.76 .11 150)` | lezajlott próba |
| `--fav` | `oklch(.72 .16 25)` | kedvenc |

### 4.2 Színek — világos (`:root`, Liner Notes)

`--page oklch(.92 .02 82)`, `--background oklch(.955 .016 85)`, `--foreground oklch(.2 .015 60)`, `--card oklch(.975 .01 85)`, `--muted oklch(.925 .02 84)`, `--muted-foreground oklch(.42 .02 60)`, `--faint oklch(.55 .02 60)`, `--primary oklch(.6 .19 35)`, `--primary-foreground #fff`, `--primary-text oklch(.52 .18 35)`, `--border oklch(.2 .02 60 / .13)`, `--border-strong oklch(.2 .02 60 / .26)`, `--status-learning oklch(.6 .14 62)`, `--status-ok oklch(.48 .12 255)`, `--status-ready oklch(.5 .11 155)`, `--done oklch(.48 .1 155)`, `--fav = --primary`.

**Szabály:** komponensben nincs nyers szín (hex, `emerald-500`, `pink-500` stb.). Kivétel: generált borító- és avatar-színek (`oklch(L C var(--h))`), illetve a márkák hivatalos logószínei (Google, Spotify).

### 4.3 Tipográfia

| Szerep | Font (next/font/google, `latin` + `latin-ext`) | Használat |
|---|---|---|
| Display | **Fraunces** (variable, `opsz`, `SOFT` tengely, normál + dőlt), súly 500, `font-variation-settings: "SOFT" 50, "opsz" 144` | oldalcímek, hero, kártyacímek, dalcímek listákban; dátumok és akkordok dőlt amberrel |
| Szöveg | **Hanken Grotesk** 400–700 | UI szöveg, gombok |
| Mono | **IBM Plex Mono** 400/500/600 | eyebrow címkék (nagybetű, `letter-spacing: .1em`), BPM, hangnem, idők, számok (`tabular-nums`) |

Méretskála (px): hero 64 / mobil 40 · h1 60 / mobil 40 · kártyacím 26 · dalcím (kártya) 21 · törzs 15 · kicsi 13 · **minimum 12** (ennél kisebb szöveg tilos).

### 4.4 Forma és felületek

- Radius: `--radius: 0.25rem` (kártyák 4px), gombok, szegmentált vezérlők és chipek **pirula** (`9999px`), borítók 2px.
- Kártya = **nem doboz**: átlátszó háttér, felül 1px `--border-strong` vonal, a cím alatt 28×2px amber vonal (`SectionHeader`). Kivétel: hero, Song Hub hero és mini-player (felületek).
- Filmszemcse: `body::after` SVG fractal noise, `opacity: .06`, `mix-blend-mode: overlay`, `pointer-events: none` (csak sötét témában).
- Érintési célok ≥ 40×40px (ikongombok), elsődleges gombok 40/48px magasak.
- Fókusz: 2px `--ring` outline, 2px offset, minden interaktív elemen.

### 4.5 Komponens-nyelv (atomok)

`Eyebrow` (mono nagybetűs címke) · `SectionHeader` (eyebrow + Fraunces cím + amber vonal + jobb oldali akciók) · `Chip` (mono, keret nélküli, `·` elválasztó) · `StatusBadge` (pötty + címke a státusz színében) · `DifficultyMeter` (5 növekvő sáv + címke: Könnyű / Laza / Közepes / Nehéz / Kihívás) · `SegmentedControl` (pirula, csúszó aktív jelző) · `CoverArt` (valódi `imageUrl` vagy generált gradiens + dőlt Fraunces cím + mono előadó; a színárnyalat a cím+előadó determinisztikus hash-éből) · `ChordDiagram` (SVG, `lib/chord-diagrams.ts` adataiból, amber pöttyök).

## 5. Képernyők (elfogadási kritériumok)

1. **Kezdőlap:** fejléc (dátum eyebrow + „Szia, {keresztnév}!”); **Következő próba hero**: legfeljebb 4 borítóból álló sáv tipográfiával, „Következő próba · N nap múlva” eyebrow, dátum („Csütörtök, *okt. 22.*”), dalszám, bandatag-avatarok, setlist (sorszám, borító, cím → Song Hub, hangnem/BPM chip, státusz), CTA: „Próba mód indítása” (`/practice/[date]`) és „Setlist lejátszása” (mini-playerbe tölti). Ha nincs jövőbeli próba: üres állapot + „Próba tervezése”. Alatta naptár + napi panel (desktop: 1.55fr / 1fr), majd „Rég nem játszottátok” (3 dal, „+ {következő próba dátuma}” gomb) és „Repertoár állapota” (Kész / Megy / Tanuljuk sáv).
2. **Naptár:** hajszálvonalas rács, a cellák `button` elemek. Lezajlott nap: kitöltött pöttyök (max. 3, a dalok borítószínével, fölötte „+n”); tervezett nap: körvonalas pöttyök + finom ferde csíkozás. Mai nap: amber kör a dátum körül. Kiválasztott nap: amber keret + amber-soft háttér. Hover-akciók nincsenek. Mobilon heti szalag (14 nap) + „Havi nézet” kapcsoló.
3. **Napi panel:** eyebrow nap neve, cím dátum, „Lezajlott / Tervezett” pirula, sorrendezhető setlist (dnd-kit megmarad), felvételek. Lábléc: „Dal hozzáadása”, „Másolás másik napról”, „⋯” (próba törlése). Dal eltávolítása azonnali, „Visszavonás” akcióval a toastban (undo: `assignSongToDate`, a sorrend a lista végére kerül; ez elfogadott).
4. **Dalok:** keresés (debounce 300ms, `router.replace`), státusz-szegmens darabszámokkal, „Szűrők” popover (nehézség, van tab, kedvencek), rendezés, rács/lista kapcsoló (`?view=list`), aktív szűrő-chipek egyenként törölhetően. Kártya: négyzetes borító, lejátszás gomb a borítón (hover-eszközön hoverre jelenik meg, érintőn mindig látszik), kedvenc jelölés, Fraunces cím, chipek, státusz + nehézségmérő, mindig látható „⋯” menü (Szerkesztés, Tab, Kedvenc, Törlés).
5. **Song Hub (`/songs/[id]`):** morzsamenü; hero a borító színéből kevert háttérrel: borító, eyebrow (ki adta hozzá, mikor), Fraunces cím, dőlt előadó, chipek (hangnem, BPM, capo, nem standard hangolás), nehézségmérő, „Hol tartunk?” szegmens (optimista mentés), CTA: Gyakorlás, Lejátszás, Kedvenc, ⋯. Bal oszlop: akkordsor (`ChordDiagram` minden egyedi akkordra a tabból), kotta/tab akkordkiemeléssel, jegyzet. Jobb oszlop: videó (mini-playerbe), „Próbákon” idővonal, felvételek. Mobilon fülek: Akkordok | Videó | Előzmények | Felvételek.
6. **Próba mód (`/practice/[date]`):** felső sáv (×, szegmentált haladásjelző, „i/n”, eltelt idő); bal oszlop (borító, cím, előadó, chipek, akkordok, „Következő” kártya); jobb oldalon nagy kotta automatikus görgetéssel; alsó sáv: Előző / Metronóm (a dal BPM-je, alapérték 80, 4 pöttyös vizuális ütem + hang) / Görgetés (0.5–3×) / Videó / Felvétel / Következő. Billentyűk: ←/→ dalváltás, Szóköz metronóm. Screen Wake Lock, ha a böngésző támogatja. Az aktuális dal sorszáma az URL-ben (`?i=`).
7. **Mini-player:** borító, cím, előadó, „YouTube” forrás, haladás, előző / lejátszás-szünet / következő, kinyitás (videó sheet/dialog), bezárás. A lejátszás route-váltáskor nem áll le.

## 6. Mozgás (animációk)

Alapelv (Emil Kowalski): az animáció csak akkor marad, ha van célja, és illik a gyakoriságához. Minden animáció `transform`/`opacity` (+ legfeljebb 2px blur). Csökkentett mozgásnál (`prefers-reduced-motion`) a mozgás eltűnik, a halvány átúszás marad. A Motion-ön `MotionConfig reducedMotion="user"`.

**Tokenek:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` · `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` · `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` · időtartamok: press 160ms, fade 150ms, popover 180ms, dialog 200ms, sheet 300ms; a kilépés ~65%-a a belépésnek. Jelöletlen `transition-*` osztály is `--ease-out`-ot és 150ms-ot kap (`--default-transition-*` a `@theme`-ben). Töltő gomb: a felirat kiúszik (opacity + `scale(.96)` + 2px blur, 150ms), helyén forgó jel; nincs ugráló pötty.

| # | Hol | Cél | Gyakoriság | Mozgás |
|---|---|---|---|---|
| A1 | Gombok, kattintható kártyák `:active` | Visszajelzés | Naponta tucatszor | `scale(.97)`, `transition: transform 160ms var(--ease-out)` |
| A2 | Mini-player megjelenik/eltűnik; videó sheet | Térbeli folytonosság | Alkalmanként | be: `translateY(100%)`, opacity 0 → 0, 300ms `--ease-drawer`; ki: 200ms `--ease-out`; desktopos videó-dialog: `scale(.96)` + opacity, 200ms, középről |
| A3 | Próba mód dalváltás (gombbal vagy swipe-pal) | Térbeli folytonosság | Alkalmanként | tartalom `translateX(±24px)` + opacity → 0, 220ms `--ease-out`, iránytól függően; **billentyűvel indítva azonnali**; haladásszegmens `scaleX` 0 → 1 (balról), 300ms `--ease-in-out` |
| A4 | Metronóm ütem-pöttyök | Állapotjelzés (funkcionális) | Gyakorlás közben | CSS keyframe, periódus = 4 × 60/BPM s, aktív pötty `scale(1.35)` + szín, az első ütem amber; csökkentett mozgásnál csak színváltás |
| A5 | `SegmentedControl` aktív jelző | Állapotjelzés | Naponta tucatszor | Motion `layoutId`, `{ type: "spring", duration: 0.3, bounce: 0 }`; csökkentett mozgásnál azonnali |
| A6 | Dal eltávolítása a setlistből, visszavonás | Hirtelen változás elkerülése | Alkalmanként | `AnimatePresence` + `layout`: kilépés opacity 0 + magasság összecsukása, 130ms `--ease-out` (a belépés ~65%-a); visszatérés 200ms |
| A7 | Napi panel tartalomcsere napváltáskor | Hirtelen változás elkerülése | Naponta tucatszor | csak átúszás: opacity .6 → 1 + `blur(2px)` → 0, 150ms `--ease-out`, elmozdulás nélkül |
| A8 | Hero borítósáv első megjelenése | Öröm (ritka) | Munkamenetenként egyszer (`sessionStorage`) | `clip-path: inset(0 0 100% 0)` → `inset(0)`, 450ms `--ease-out`, 60ms késleltetés borítónként; csökkentett mozgásnál nincs. Tiszta CSS (`.hero-cover`), így hidratálás előtt / JS nélkül is lefut; a root layout inline scriptje első festés előtt jelöli (`html[data-hero-seen]`), ha már látta |
| A9 | Dropdown, popover, szűrő popover | Térbeli folytonosság | Alkalmanként | `scale(.97)` + opacity, 180ms `--ease-out`, `transform-origin: var(--transform-origin)` (Base UI) |
| A10 | Login lemezjátszó-jelenet (`TurntableScene`) | Öröm (ritka) — a login az app „borítója” | Bejelentkezéskor | ciklusonként ~14 s: valós lemezborító felbukkan (spring 0.8s, bounce .25) → a lemez kicsúszik (1s `--ease-in-out`) → felemelve a tányérra kerül (1.1s, `scale` 1→1.06→1) → a tányér felpörög (33⅓ rpm, négyzetes gyorsulás), a hangkar ráfordul (1.2s) és leereszkedik → 5.5s lejátszás, a kar lassan befelé halad → vissza, lassulás, a lemez és a borító kiúszik. Kizárólag transform/opacity; rejtett fülön szünetel; **kivétel a „nincs folyamatos dekoratív mozgás” szabály alól**, mert csak a login oldalon fut, ahol nincs más feladat. Csökkentett mozgásnál álló lemezjátszó, 7 s-onként csak átúszással cserélődő albummal |
| A11 | Logó-gitár „pengetés” (`LogoMark`) | Öröm / visszajelzés | Login betöltésekor egyszer; máshol a logó hoverjére (csak hover-eszközön) | gitár `rotate` 0 → −10° → 6° → −2.5° → 0, 700ms `--ease-out`; a húr lecsengő `translateX` rezgése 900ms; csökkentett mozgásnál nincs |
| A12 | Próba mód swipe dalváltás (csak érintés) | Közvetlen manipuláció | Alkalmanként | a dal 1:1 követi az ujjat (10px irányzár, függőleges mozdulat a görgetésé), közben halványul (opacity `1 − (|x| / fél szélesség)²`); az első/utolsó dalnál rubber-band (`(x·w·0.55)/(w + 0.55·|x|)`), az utolsón nem visz az összegzésre. Elengedéskor: ≥ 500px/s legyintés irányában vált; különben `offset + v/1000·0.99/0.01` vetítés ≥ 30% szélesség → vált; 300px/s feletti ellenirányú lendület → vissza. Vissza: spring `bounce 0`, 300ms, átvett sebességgel; váltás: a régi dal fél szélességig úszik ki (spring 200ms, átvett sebességgel), az új az A3 szerint ±24px-ről érkezik. Széles kottán a belső vízszintes görgetés nyer, amíg tud. Egérrel nincs (szövegkijelölés). Csökkentett mozgásnál nincs elmozdulás, csak az A3 átúszás |
| A13 | Bottom sheet lehúzása (érintéssel a sheet bárhol, ahol a tartalma nem tud a húzás irányába görgetni; egérrel a 28px-es fogantyú) | Közvetlen manipuláció | Alkalmanként | az első `touchmove` dönt: ha egy belső görgető tud arra görgetni, az övé, különben a sheet-é (nem passzív figyelő, `preventDefault`), így a gesztus nem jut a dokumentumra (címsor, lehúzásos frissítés → ugró képernyő); a görgetők `overscroll-behavior: contain`. A sheet 1:1 követi az ujjat (közvetlen `style.transform`), a scrim arányosan halványul; felfelé rubber-band. Elengedéskor (utolsó 100ms sebessége): ≥ 500px/s lefelé → bezár; ≤ −300px/s → marad; különben `offset + vetítés ≥ 35%` magasság → bezár. Bezárás: a sheet onnan, ahol az ujj elengedte, `transition`-nel csúszik ki (120–260ms `--ease-out`, az időtartam az ujj sebességét veszi át), utána zár be CSS-kilépő nélkül (`data-dragged-out` → `animate-none`) — a `from` nélküli kilépő keyframe-et egyes mobil böngészők korábbi pozícióból indították, és a sheet visszaugrott; vissza: 300ms `--ease-drawer`. Csökkentett mozgásnál nincs követés, a döntés ugyanaz, a bezárás csak elhalványul |
| A14 | Naptár hónapváltás (havi rács) | Térbeli folytonosság | Alkalmanként | érintéssel az A12 lapozása (`SwipePane`): a napok rácsa 1:1 követi az ujjat, ugyanazok a küszöbök, szél nincs; a napnevek sora áll. Az új hónap az irányának megfelelő oldalról érkezik (±24px + opacity, 220ms `--ease-out`) — swipe-ra és a fejléc nyilaira is. Swipe után a felengedés alatti napot nem jelöli ki. Csökkentett mozgásnál csak átúszás |
| A15 | Mini-player elhúzása (csak érintés): le, balra vagy jobbra | Közvetlen manipuláció | Alkalmanként | a × mobilon is ott van a vezérlők mellett (a mozdulat nem lehet az egyetlen bezárási mód). 10px irányzár után a nagyobb tengely nyer, 1:1 követés, közben halványul (a megtett út / a kijutásig hátralévő út); felfelé rubber-band. Döntés az A13 szerint (`shouldDismiss`), oldalra a húzás irányában mérve, a távolság lefelé a képernyő aljáig, oldalra a képernyő szélességéig: ≥ 500px/s legyintés vagy a 35%-on túli vetítés → a pill a kéz sebességével kicsúszik (spring 250ms), majd bezár; különben vissza (300ms, átvett sebességgel). Húzás után a felengedés alatti gomb nem kap kattintást. Egérrel nincs; csökkentett mozgásnál nincs követés, csak az A2 kilépő átúszás |
| A16 | Tooltip, skeleton | Visszafogottság | Gyakori | Tooltip: az első 400ms után nyílik (átsuhanó egérre nem villan), utána a szomszédok azonnal (Base UI csoport). Skeleton: 150ms-ig láthatatlan, majd `--dur-fade` átúszás és lüktetés; csökkentett mozgásnál nincs lüktetés |
| A17 | Hangoló: cent-kijelzés és LED-sor | Olvashatóság | Hangoláskor folyamatosan | a mért cent értéket kritikusan csillapított rugó követi (`springStep`, ~300ms, túllövés nélkül); új hang (más MIDI) azonnal ugrik. Nem mozgás, hanem simítás: csökkentett mozgásnál is marad |
| A18 | Felvétel-modal állapotai (kész → felvétel → elnevezés) | Folytonosság | Próbánként néhányszor | az időzítő a lemez feliratának helyére kerül (fix 36px sor), így kész ↔ felvétel között nem ugrik a modal magassága; az új állapot vezérlői `--dur-fade` átúszással jönnek (elnevezésnél +4px felcsúszás), a régiek azonnal mennek — nincs átfedés, nincs magasság-animáció; a lemez közepe színt vált |
| A19 | Próba utáni összegzés („Hogy ment?”) | Öröm (ritka) | Próbánként egyszer | a fejléc, majd a dalsorok beúsznak: opacity + `translateY(8px)` → 0, 400ms `--ease-out`, a sorok 80ms + 50ms-onként (legfeljebb 8 lépcső); a megváltozott állapot („Tanuljuk → Kész”) és az összegző sor új értéke `--dur-fade` alatt 4px-ről felúszik. Csökkentett mozgásnál csak átúszás |
| A20 | Üres dallista illusztrációja („Még nincsenek dalok”) | Öröm (ritka) — márkarészlet | Új bandánál, megjelenésenként egyszer | a hangjegy az A11 kilengésével egyszer megpendül (`rotate`, 700ms `--ease-out`, 300ms késleltetés, a szára aljától), a két hanghullám kicseng: opacity 0 + `translate(−4px, 2px)` → 0, 500ms, 420/510ms késleltetéssel. Csak a dallista üres állapotán; a keresés „Nincs találat” állapota (gyakori) nem mozog. Csökkentett mozgásnál nincs |
| A21 | Tekerősáv (`SeekBar`): mini-player alja; Próba módban (nincs mini-player) a felvétel-modal játszott sora | Közvetlen manipuláció | Lejátszáskor | kattintás/koppintás bárhol → odaugrik; húzás → 1:1 előnézet, a fogantyú fölött idő-buborék (`bg-foreground`, mono), az eltelt idő primary színben mutatja a célt; elengedéskor teker (YouTube nem bírja képkockánként), a cél 800ms-ig tartva, hogy a fogantyú ne ugorjon vissza. Egérrel hover: halvány előnézeti kitöltés + buborék. Billentyű: ←/→ 5 mp, PageUp/Down 30 mp (rövid sávon 10%), Home/End; `role="slider"`, `aria-valuetext` „0:17 / 10:54”. Vonal 3px, hoverre vagy fókuszra `scaleY(1.67)`, fogantyú `scale(0)` → 1, húzás közben 1.15 — 160ms, csak transform; csökkentett mozgásnál átmenet nélkül. A pozíció külön tárolóból képkockánként frissül (`usePlayerTime`), az app többi része nem renderel újra. A mini-player elhúzása nem indul a sávról (`data-no-dismiss`) |
| A22 | Saját felvételek a mini-playerben | Folytonosság | Alkalmanként | a felvétel-modal listájából és a dal oldalának „Felvételek” részéből indítva a közös lejátszó szól (a modal bezárása után is), a nap felvételei a sor; borító helyett a felvevő lemeze kicsiben (REC-piros közép), a második sor „🎙 Saját felvétel · okt. 13.”; videó-gomb nincs. Betöltés közben forgó jel a lejátszás gombon. Próba módban nincs mini-player: ott a modal saját lejátszót kap, ami vele együtt áll le |
