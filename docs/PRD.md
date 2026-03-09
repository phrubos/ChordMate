# ChordMate — Product Requirements Document

## 1. Termék áttekintés

**ChordMate** egy gitárgyakorlás-szervező webalkalmazás két barát számára. A felhasználók közös dallistát kezelnek, naptárnézetben tervezik a gyakorlásaikat, és beágyazott YouTube lejátszóval hallgathatják/játszhatják a dalokat.

## 2. Tech Stack

| Réteg | Technológia |
|-------|------------|
| Framework | **Next.js 14** (App Router, Server Components, Server Actions) |
| Nyelv | **TypeScript** (strict mode) |
| ORM | **Drizzle ORM** |
| Adatbázis | **PostgreSQL** (Vercel Postgres / Neon) |
| Auth | **NextAuth.js v5** (Auth.js) Google + GitHub provider |
| Styling | **Tailwind CSS 3** + **shadcn/ui** komponensek |
| Hosting | **Vercel** |
| YouTube | **react-youtube** (YouTube IFrame API wrapper) |

## 3. Felhasználók

- Két regisztrált felhasználó (Google vagy GitHub login)
- Mindkét felhasználó azonos jogokkal rendelkezik (nincs admin/user megkülönböztetés)
- Mindenki lát és szerkeszt mindent

## 4. Fő funkciók (MVP)

### 4.1 Autentikáció
- Google és GitHub OAuth login NextAuth.js v5-tel
- Session-based auth (JWT strategy)
- Védett route-ok: minden oldal login mögött van, kivéve a login page
- Middleware-rel route protection

### 4.2 Dallista kezelés (CRUD)
- Dalok hozzáadása: cím, előadó, YouTube URL, nehézség (1-5), megjegyzés
- Dalok szerkesztése (inline edit vagy modal)
- Dalok törlése (megerősítéssel)
- Dalok listázása: szűrhető, kereshető
- Minden dal tartalmazza, ki adta hozzá és mikor

### 4.3 Naptárnézet
- Hónapos naptárnézet (havi grid)
- Bármelyik napra kattintva megnyílik a nap részletei
- Dalok hozzárendelése napokhoz (drag & drop VAGY kiválasztás)
- Egy naphoz több dal is rendelhető
- Vizuális jelzés: mely napokhoz vannak dalok rendelve
- Hónapok közötti navigáció (előző/következő)

### 4.4 YouTube lejátszó
- Beágyazott YouTube player a dal részleteknél
- YouTube URL-ből automatikus video ID kinyerés
- Play/pause kontroll
- A lejátszó megjelenik: dal kártyán, napi nézetben

## 5. Oldalak / Route-ok

```
/                   → Redirect /dashboard-ra (ha be van jelentkezve) vagy /login-ra
/login              → Login oldal (Google + GitHub gombok)
/dashboard          → Főoldal: naptárnézet + aktuális nap dalai
/songs              → Teljes dallista (CRUD műveletek)
/songs/new          → Új dal hozzáadása (form)
/songs/[id]/edit    → Dal szerkesztése
/api/auth/[...nextauth] → NextAuth API route-ok
```

## 6. Nem-funkcionális követelmények

- **Reszponzív design**: mobil-first megközelítés
- **Magyar nyelvű UI** (gombok, labelek, üzenetek)
- **Dark/Light mode**: Tailwind dark mode support, rendszer-preferencia alapján
- **Loading states**: Skeleton loaderek a fő tartalmakhoz
- **Error handling**: Toast értesítések (sonner)
- **Optimistic updates**: ahol lehetséges (pl. dal törlés)

## 7. Jövőbeli fejlesztések (NEM MVP)

- Gyakorlási státusz jelölés (tanuljuk / tudjuk / próbáljuk)
- Heti nézet
- Setlist mód (gyakorlás sorrend)
- Metrónóm integráció
- Akkord diagramok
- Statisztikák (hány dalt tanultunk meg, stb.)
- PWA support
- Push értesítések
