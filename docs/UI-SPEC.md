# ChordMate — UI/UX Specifikáció

## 1. Design irányelvek

> **Érvényes arculat: „Midnight Liner”** — a részletes, mérvadó leírás: `docs/superpowers/specs/2026-10-16-midnight-liner-design.md` (tokenek, képernyők, animációk A1–A9). Ahol ez a dokumentum eltér tőle, a spec az érvényes.

### Vizuális stílus (token-összefoglaló)
- **Témák**: sötét az alapértelmezett (`.dark`, meleg fekete, amber kiemelés), világos a „Liner Notes” (`:root`, papírszín). A színek CSS-változók a `src/app/globals.css`-ben; komponensben csak tokenosztály szerepel (`bg-background`, `text-primary-text`, `text-status-ready` stb.), nyers hex vagy Tailwind-palettaszín nem.
- **Fő tokenek**: `background`, `card`, `foreground`, `muted-foreground`, `faint` (csak nem kritikus szöveg), `border`, `border-strong`, `primary` (amber) / `primary-text`, `destructive`, `done`, státusz: `status-learning` / `status-ok` / `status-ready`, `fav`; témafüggetlen: `scrim` (takaró réteg), `on-media` (szöveg borítón/videón).
- **Kivételek**: generált borító- és avatar-hue (`hueFromString`), márkalogók (Google, Spotify).
- **Tipográfia**: display — Fraunces (`font-display`, `display-soft`); szöveg — sans (`font-sans`); számok, címkék — mono (`font-mono`). Minimum 12px.
- **Forma**: hajszálvonalas szekciók `SectionHeader`-rel (vonal + amber aláhúzás), kártyák helyett; borítók 2px sarokkal.
- **Mozgás**: csak `transform`/`opacity`, `prefers-reduced-motion` tisztelete; a listát a spec 6. fejezete adja.
- **Hozzáférhetőség**: ikongomb-célterület ≥ 40×40px (az `icon-xs`/`icon-sm` gomb láthatatlan kiterjesztéssel), minden ikon-only gombnak `aria-label`.

### shadcn/ui komponensek használata
A következő shadcn/ui komponensek szükségesek:
- `Button`, `Input`, `Textarea`, `Select`
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Dialog`, `AlertDialog`
- `DropdownMenu`
- `Badge`
- `Tooltip`
- `Skeleton`
- `Toaster` (sonner)
- `Avatar`
- `Separator`

## 2. Layout struktúra

### Root Layout
```
┌─────────────────────────────────────────┐
│  Navbar (fix, top)                      │
│  ┌─ Logo ──── Nav Links ──── UserMenu ┐ │
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Main Content (változó oldalanként)     │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Navbar elemek
- **Bal**: ChordMate logo (gitár ikon + szöveg)
- **Közép**: Navigációs linkek — "Naptár" | "Dalok"
- **Jobb**: User avatar dropdown (név, email, kijelentkezés)
- Mobilon: Hamburger menü

## 3. Oldalak részletes specifikáció

---

### 3.1 Login oldal (`/login`)

**Layout**: Középre igazított kártya, háttérben finom zenei minta/gradient.

```
┌───────────────────────────────────┐
│                                   │
│        🎸 ChordMate               │
│   "Gyakorolj együtt a haveroddal" │
│                                   │
│   ┌─────────────────────────────┐ │
│   │ 🔵 Bejelentkezés Google-lel │ │
│   └─────────────────────────────┘ │
│   ┌─────────────────────────────┐ │
│   │ ⚫ Bejelentkezés GitHub-bal  │ │
│   └─────────────────────────────┘ │
│                                   │
└───────────────────────────────────┘
```

---

### 3.2 Dashboard / Naptár (`/dashboard`)

**Layout**: Két oszlopos elrendezés (desktop), stackelt (mobil)

```
DESKTOP:
┌──────────────────────────────┬──────────────────────┐
│  Naptár Grid (fő terület)    │  Napi részletek      │
│                              │  (jobb panel)        │
│  ◄ 2025. Március ►           │                      │
│  ┌──┬──┬──┬──┬──┬──┬──┐     │  📅 Március 15.       │
│  │H │K │Sz│Cs│P │Sz│V │     │                      │
│  ├──┼──┼──┼──┼──┼──┼──┤     │  ♪ Hotel California  │
│  │  │  │  │  │  │1 │2 │     │    Eagles            │
│  ├──┼──┼──┼──┼──┼──┼──┤     │    ▶ [YouTube]       │
│  │3 │4 │5 │6 │7 │8 │9 │     │                      │
│  ├──┼──┼──┼──┼──┼──┼──┤     │  ♪ Wish You Were Here│
│  │  │  │  │  │  │● │  │     │    Pink Floyd         │
│  │10│11│12│13│14│15│16│     │    ▶ [YouTube]       │
│  ├──┼──┼──┼──┼──┼──┼──┤     │                      │
│  │17│18│19│20│21│22│23│     │  [+ Dal hozzáadása]  │
│  ├──┼──┼──┼──┼──┼──┼──┤     │                      │
│  │24│25│26│27│28│29│30│     │                      │
│  └──┴──┴──┴──┴──┴──┴──┘     │                      │
│                              │                      │
│  Mai nap: kiemelve           │                      │
│  ● = vannak dalok            │                      │
└──────────────────────────────┴──────────────────────┘

MOBIL:
┌─────────────────────┐
│  ◄ 2025. Március ►  │
│  [Havi naptár grid] │
│                     │
│  ── Március 15. ──  │
│                     │
│  [Dal kártya 1]     │
│  [Dal kártya 2]     │
│  [+ Hozzáadás]      │
└─────────────────────┘
```

**Naptár cella viselkedés**:
- Üres nap: szürke háttér, kattintható
- Mai nap: kiemelt keret (primary szín)
- Vannak dalok: kis pont indikátor (narancs dot) + dalok száma badge
- Kiválasztott nap: kitöltött háttér (primary light)
- Kattintás → jobb oldali panelben megjelennek a dalok

**Napi panel funkciók**:
- Dalok listája a naphoz rendelve (drag & drop sorrend opcionális)
- Minden dalnál: cím, előadó, mini YouTube play gomb, törlés gomb (X)
- "Dal hozzáadása ehhez a naphoz" gomb → megnyílik egy dialog/dropdown ahol a meglévő dalokból lehet választani (combobox/search)
- Ha van YouTube lejátszó aktív, az a panel alján jelenik meg

---

### 3.3 Dalok lista (`/songs`)

```
┌─────────────────────────────────────────────┐
│  Dalok                        [+ Új dal]    │
│                                             │
│  🔍 [Keresés dal vagy előadó alapján...]     │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 🎵 Hotel California         ⭐⭐⭐⭐      ││
│  │    Eagles                               ││
│  │    Hozzáadta: Kiss Péter • 2025.03.01   ││
│  │    ▶ Lejátszás    ✏️ Szerkesztés  🗑️     ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │ 🎵 Wish You Were Here       ⭐⭐⭐        ││
│  │    Pink Floyd                           ││
│  │    Hozzáadta: Nagy Gábor • 2025.03.05   ││
│  │    ▶ Lejátszás    ✏️ Szerkesztés  🗑️     ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ... további dalok ...                      │
└─────────────────────────────────────────────┘
```

**Dal kártya elemek**:
- Dal cím (nagy, félkövér)
- Előadó neve
- Nehézség vizuálisan (1-5 csillag vagy kitöltött pöttyök, szín-kódolt)
- Ki adta hozzá + dátum
- Akciók: Lejátszás (YouTube), Szerkesztés, Törlés
- Hover: enyhe emelkedés + árnyék

---

### 3.4 Új dal / Dal szerkesztése (`/songs/new`, `/songs/[id]/edit`)

```
┌─────────────────────────────────────────┐
│  Új dal hozzáadása                      │
│                                         │
│  Dal címe *                             │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Előadó *                               │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  YouTube link *                         │
│  ┌─────────────────────────────────────┐│
│  │ https://youtube.com/watch?v=...     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [YouTube előnézet ha valid URL]        │
│  ┌─────────────────────────────────────┐│
│  │  ▶  YouTube Player Embed            ││
│  └─────────────────────────────────────┘│
│                                         │
│  Nehézség                               │
│  ⭐ ⭐ ⭐ ⭐ ⭐  (kattintható 1-5)         │
│                                         │
│  Megjegyzés                             │
│  ┌─────────────────────────────────────┐│
│  │ pl. "Capo 2. érintőn"              ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Mégse]              [Mentés]          │
└─────────────────────────────────────────┘
```

**Form viselkedés**:
- Real-time validáció (Zod séma)
- YouTube URL beírás után automatikus előnézet (ha valid)
- Nehézség: interaktív csillag-kattintós selector
- Mentés után redirect → `/songs` + toast értesítés
- Szerkesztésnél: előre kitöltött mezők

---

## 4. YouTube lejátszó komponens

### Viselkedés
- `react-youtube` csomag használata
- Automatikus video ID kinyerés az URL-ből
- Kompakt mód: kis thumbnail + play gomb (dal kártyákban)
- Teljes mód: beágyazott player (dal form előnézet, napi nézet)
- Responsive: 100% szélesség, 16:9 arány

### Megjelenés a napi nézetben
Amikor egy dal "Lejátszás" gombjára kattintanak, a YouTube player megjelenik a napi panel alján (sticky), és a videó elindul. Egy időben egy videó játszható le.

---

## 5. Interakciók & állapotok

### Loading állapotok
- Teljes oldal betöltés: Skeleton loader a fő tartalom helyén
- Naptár betöltés: grid skeleton
- Dal lista: kártya skeleton-ok (3-4 placeholder)
- Gomb kattintás utáni: spinner a gombon, disabled állapot

### Toast értesítések (sonner)
- **Siker**: "Dal sikeresen hozzáadva" (zöld)
- **Siker**: "Dal törölve" (zöld) + Undo lehetőség
- **Siker**: "Dal hozzáadva a naphoz" (zöld)
- **Hiba**: "Hiba történt, próbáld újra" (piros)

### Üres állapotok
- Dallista üres: "Még nincsenek dalok. Adj hozzá az elsőt!" + CTA gomb
- Napi nézet üres: "Ezen a napon még nincs dal. Adj hozzá egyet!" + gomb
- Keresés nincs találat: "Nincs találat erre: «keresés»"

### Törlés megerősítés
- AlertDialog: "Biztosan törlöd ezt a dalt: «dal cím»? Ez a művelet nem vonható vissza."
- Gombok: "Mégse" | "Törlés" (destructive variant)

---

## 6. Reszponzív töréspontok

| Eszköz | Szélesség | Layout |
|--------|----------|--------|
| Mobil | < 768px | Stackelt, naptár felül, dalok alul |
| Tablet | 768-1024px | Keskenyebb két oszlop |
| Desktop | > 1024px | Teljes két oszlopos layout |

---

## 7. Ikonok (Lucide React)

| Funkció | Ikon |
|---------|------|
| Dalok menü | `Music` vagy `ListMusic` |
| Naptár menü | `Calendar` |
| Hozzáadás | `Plus` |
| Szerkesztés | `Pencil` |
| Törlés | `Trash2` |
| Lejátszás | `Play` |
| Keresés | `Search` |
| Bejelentkezés | `LogIn` |
| Kijelentkezés | `LogOut` |
| Nehézség | `Star` |
| YouTube | `Youtube` |
| Felhasználó | `User` |
| Hónap navigáció | `ChevronLeft`, `ChevronRight` |
| Mai nap | `CalendarCheck` |
