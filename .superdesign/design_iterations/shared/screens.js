/* ChordMate mockup — közös képernyő-markup. A témák csak CSS-ben különböznek. */
window.SCREENS = (() => {
  const { SONGS, STATUS, DIFF, TODAY, EVENTS, MEMBERS, NEXT, RECORDINGS, icon, chordSVG, waveSVG, byId, fmt, daysBetween, isoOf, cap, parse } = CM;
  const state = { view: 'grid', status: 'all', selected: '2026-10-13', practiceIdx: 0, playing: true, metro: false, scrolling: false, speed: 1 };

  /* ---------- atomok ---------- */
  const cover = (s, cls = '') =>
    `<div class="cover ${cls} cv-${s.pat}" style="--h:${s.hue}" aria-hidden="true"><span class="cover-type">${s.title}</span><span class="cover-artist">${s.artist}</span></div>`;
  const chips = (s, full) =>
    `<span class="chip mono" title="Hangnem">${s.key}</span><span class="chip mono" title="Tempó">${s.bpm}<small> BPM</small></span>${s.capo ? `<span class="chip mono">Capo ${s.capo}</span>` : ''}${full && s.tuning !== 'Standard' ? `<span class="chip mono">${s.tuning} hangolás</span>` : ''}`;
  const statusChip = (s) => `<span class="status st-${s.status}"><i></i>${STATUS[s.status].label}</span>`;
  const diff = (s) =>
    `<span class="diff" title="Nehézség: ${DIFF[s.diff]} (${s.diff}/5)" aria-label="Nehézség: ${DIFF[s.diff]}, ${s.diff} az 5-ből"><span class="diff-bars">${[1, 2, 3, 4, 5].map((i) => `<b class="${i <= s.diff ? 'on' : ''}"></b>`).join('')}</span><span class="diff-label">${DIFF[s.diff]}</span></span>`;
  const avatar = (m, cls = '') => `<span class="avatar ${cls}" style="--h:${m.h}" title="${m.n}">${m.i}</span>`;
  const btn = (label, ic, cls = '', attrs = '') => `<button class="btn ${cls}" ${attrs}>${ic ? icon(ic) : ''}${label ? `<span>${label}</span>` : ''}</button>`;
  const iconBtn = (ic, label, cls = '', attrs = '') => `<button class="icon-btn ${cls}" aria-label="${label}" title="${label}" ${attrs}>${icon(ic)}</button>`;
  const logo = () => `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect class="logo-bg" width="32" height="32" rx="9"/><path class="logo-mark" d="M10 22.5a3 3 0 1 1-1-2.24V9.6l13-2.6v12.5a3 3 0 1 1-1-2.24V11.2l-11 2.2"/></svg>`;

  /* ---------- keret ---------- */
  const NAV = [
    ['dashboard', 'home', 'Kezdőlap'],
    ['songs', 'songs', 'Dalok'],
    ['tools', 'metronome', 'Eszközök'],
    ['stats', 'stats', 'Statisztika'],
    ['band', 'users', 'Banda'],
  ];

  function miniPlayer() {
    const s = byId('hotel');
    return `<div class="mini" data-playing="${state.playing}">
      <div class="mini-progress" style="--p:34%"><span></span></div>
      ${cover(s, 'cover-xs')}
      <div class="mini-info"><b>${s.title}</b><span>${s.artist} <em class="mini-src">${icon('video')} YouTube</em></span></div>
      <span class="mini-time mono">2:14 <i>/ ${s.dur}</i></span>
      <div class="mini-ctrl">
        ${iconBtn('prev', 'Előző', 'hide-sm')}
        <button class="play-btn" data-act="toggle-play" aria-label="Lejátszás / szünet">${icon(state.playing ? 'pause' : 'play')}</button>
        ${iconBtn('next', 'Következő')}
      </div>
      ${iconBtn('expand', 'Videó megnyitása', 'hide-sm')}
    </div>`;
  }

  function shell(screen, content) {
    const active = screen === 'hub' ? 'songs' : screen;
    const navItems = (cls) =>
      NAV.map(([id, ic, label]) => `<a class="${cls}${active === id ? ' active' : ''}" href="#${['dashboard', 'songs'].includes(id) ? id : active}" ${active === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
    return `<div class="app" data-screen="${screen}">
      <aside class="sidebar">
        <a class="brand" href="#dashboard">${logo()}<span class="brand-name">ChordMate</span></a>
        <button class="band-switch"><span class="band-avatar">H</span><span class="band-meta"><b>Hangolatlanok</b><small>3 tag · 12 dal</small></span>${icon('down')}</button>
        <nav class="side-nav" aria-label="Fő navigáció">${navItems('nav-item')}</nav>
        <div class="side-tools">
          <span class="eyebrow">Gyors eszközök</span>
          <button class="tool-row">${icon('tuner')}<span>Hangoló</span><kbd>T</kbd></button>
          <button class="tool-row">${icon('metronome')}<span>Metronóm</span><kbd>M</kbd></button>
        </div>
        <div class="side-user">${avatar(MEMBERS[0])}<span><b>Kiss Péter</b><small>peter@…</small></span>${iconBtn('more', 'Profil menü')}</div>
      </aside>
      <header class="topbar">
        <a class="m-brand" href="#dashboard">${logo()}<span class="band-meta"><b>Hangolatlanok</b>${icon('down')}</span></a>
        <button class="search-trigger" aria-label="Keresés">${icon('search')}<span>Dal, előadó, nap vagy eszköz…</span><kbd>⌘K</kbd></button>
        <div class="top-actions">
          ${iconBtn('search', 'Keresés', 'show-sm')}
          ${iconBtn('tuner', 'Hangoló', 'hide-sm')}
          ${iconBtn('metronome', 'Metronóm', 'hide-sm')}
          <span class="top-sep hide-sm"></span>
          <a class="btn btn-primary btn-sm hide-sm" href="#practice">${icon('stage')}<span>Próba mód</span></a>
          ${avatar(MEMBERS[0], 'show-sm')}
        </div>
      </header>
      <main class="main">${content}</main>
      <div class="dock">
        ${miniPlayer()}
        <nav class="bottom-nav" aria-label="Fő navigáció">${navItems('bn-item')}</nav>
      </div>
    </div>`;
  }

  /* ---------- Dashboard ---------- */
  function calendar() {
    const first = parse('2026-10-01');
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(1 - offset);
    let cells = '';
    for (let k = 0; k < 42; k++) {
      const d = new Date(start); d.setDate(start.getDate() + k);
      const iso = isoOf(d);
      const ev = EVENTS[iso] || [];
      const out = d.getMonth() !== 9;
      const past = iso < TODAY;
      const cls = ['cal-cell', out && 'out', iso === TODAY && 'today', iso === state.selected && 'selected', ev.length && (past ? 'done' : 'plan')].filter(Boolean).join(' ');
      const label = `${fmt(iso, { month: 'long', day: 'numeric', weekday: 'long' })}${ev.length ? `, ${ev.length} dal, ${past ? 'lezajlott próba' : 'tervezett próba'}` : ''}`;
      cells += `<button class="${cls}" data-date="${iso}" aria-label="${label}" aria-pressed="${iso === state.selected}">
        <span class="cal-d">${d.getDate()}</span>
        ${ev.length ? `<span class="cal-marks">${ev.slice(0, 3).map((id) => `<i style="--h:${byId(id).hue}"></i>`).join('')}${ev.length > 3 ? `<em>+${ev.length - 3}</em>` : ''}</span>` : ''}
      </button>`;
      if (k === 34 && d.getMonth() !== 9) break;
    }
    return `<section class="card calendar" aria-labelledby="cal-h">
      <header class="card-head">
        <h2 id="cal-h" class="card-title">Október <span class="muted">2026</span></h2>
        <div class="seg seg-sm" role="tablist"><button class="on">Hónap</button><button>Hét</button><button>Lista</button></div>
        <div class="cal-nav">${btn('Ma', '', 'btn-ghost btn-sm')}${iconBtn('left', 'Előző hónap')}${iconBtn('right', 'Következő hónap')}</div>
      </header>
      <div class="cal-grid" role="grid">
        ${['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((w) => `<span class="cal-wd">${w}</span>`).join('')}
        ${cells}
      </div>
      <footer class="cal-legend"><span><i class="lg-done"></i>Lezajlott</span><span><i class="lg-plan"></i>Tervezett</span><span><i class="lg-today"></i>Ma</span><span class="muted hide-sm">Dupla katt: dal hozzáadása</span></footer>
    </section>`;
  }

  function weekStrip() {
    let s = '';
    for (let d = 12; d <= 25; d++) {
      const iso = `2026-10-${String(d).padStart(2, '0')}`;
      const ev = EVENTS[iso];
      s += `<button class="ws-day${iso === TODAY ? ' today' : ''}${iso === state.selected ? ' selected' : ''}${ev ? (iso < TODAY ? ' done' : ' plan') : ''}" data-date="${iso}">
        <small>${fmt(iso, { weekday: 'short' }).replace('.', '')}</small><b>${d}</b><i></i></button>`;
    }
    return `<section class="weekstrip" aria-label="Heti nézet"><div class="ws-head"><b>Október</b><span class="muted">42. hét</span><button class="link-btn">Havi nézet ${icon('down')}</button></div><div class="ws-row">${s}</div></section>`;
  }

  function dayPanel() {
    const iso = state.selected;
    const ev = EVENTS[iso] || [];
    const past = iso < TODAY;
    const recs = RECORDINGS[iso] || [];
    const title = cap(fmt(iso, { month: 'long', day: 'numeric' }));
    const sub = cap(fmt(iso, { weekday: 'long' }));
    const badge = ev.length ? `<span class="pill ${past ? 'pill-done' : 'pill-plan'}">${past ? icon('check') + 'Lezajlott' : icon('clock') + 'Tervezett'}</span>` : '';
    return `<section class="card day" aria-live="polite">
      <header class="card-head"><div><span class="eyebrow">${sub}</span><h2 class="card-title">${title}</h2></div>${badge}</header>
      ${ev.length ? `<ol class="setlist setlist-compact">${ev.map((id, n) => { const s = byId(id); return `<li class="sl-row"><span class="sl-n mono">${n + 1}</span>${cover(s, 'cover-sm')}<span class="sl-meta"><b>${s.title}</b><small>${s.artist}</small></span><span class="sl-chips">${chips(s)}</span>${iconBtn('play', 'Lejátszás', 'sl-play')}</li>`; }).join('')}</ol>`
        : `<div class="empty"><div class="empty-art">${icon('calendar')}</div><b>Szabad nap</b><p>Tervezz ide egy próbát, vagy másold át egy korábbi setlistet.</p><div class="row">${btn('Próba tervezése', 'plus', 'btn-primary btn-sm')}${btn('Másolás', 'copy', 'btn-ghost btn-sm')}</div></div>`}
      ${recs.length ? `<div class="recs"><span class="eyebrow">${icon('mic')} Felvételek</span>${recs.map((r) => `<div class="rec">${iconBtn('play', 'Felvétel lejátszása', 'rec-play')}<div class="rec-body"><b>${r.name}</b>${waveSVG(r.seed, 64, 0)}</div><span class="mono muted">${r.dur}</span></div>`).join('')}</div>` : ''}
      ${ev.length ? `<footer class="card-foot">${btn('Dal hozzáadása', 'plus', 'btn-ghost btn-sm')}${btn('Másolás másik napra', 'copy', 'btn-ghost btn-sm')}${iconBtn('more', 'További műveletek')}</footer>` : ''}
    </section>`;
  }

  function dashboard() {
    const days = daysBetween(TODAY, NEXT.date);
    const set = NEXT.setlist.map(byId);
    const total = set.reduce((a, s) => { const [m, sec] = s.dur.split(':').map(Number); return a + m * 60 + sec; }, 0);
    const ready = SONGS.filter((s) => s.status === 'ready').length;
    const ok = SONGS.filter((s) => s.status === 'ok').length;
    const neglected = ['blackbird', 'rosa', 'layla'].map(byId);
    return `
    <div class="page-head">
      <div><span class="eyebrow">Péntek, október 16.</span><h1 class="page-title">Szia, Péter!</h1></div>
      <div class="row hide-sm">${btn('Új dal', 'plus', 'btn-ghost')}${btn('Próba tervezése', 'calendar', 'btn-ghost')}</div>
    </div>

    <section class="hero" aria-labelledby="hero-h">
      <div class="hero-art" aria-hidden="true">${set.slice(0, 4).map((s, i) => cover(s, `hero-cover hc-${i}`)).join('')}</div>
      <div class="hero-main">
        <span class="eyebrow eyebrow-accent"><i class="live-dot"></i>Következő próba · ${days} nap múlva</span>
        <h2 id="hero-h" class="hero-title">${cap(fmt(NEXT.date, { weekday: 'long' }))}, <span class="hero-date">okt. 22.</span></h2>
        <div class="hero-facts">
          <span>${icon('clock')}<b class="mono">${NEXT.time}</b></span>
          <span>${icon('pin')}${NEXT.place}</span>
          <span>${icon('songs')}${set.length} dal · <b class="mono">${Math.round(total / 60)} perc</b></span>
        </div>
        <div class="rsvp">
          <div class="avatars">${MEMBERS.map((m) => avatar(m, `rsvp-${m.rsvp}`)).join('')}</div>
          <span><b>2 jön</b>, Dani még nem biztos</span>
          <div class="rsvp-me seg seg-sm"><button class="on">${icon('check')}Jövök</button><button>Talán</button></div>
        </div>
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg" href="#practice">${icon('stage')}<span>Próba mód indítása</span></a>
          ${btn('Setlist lejátszása', 'play', 'btn-ghost btn-lg')}
        </div>
      </div>
      <ol class="setlist hero-setlist" aria-label="Setlist">
        <li class="sl-head"><span class="eyebrow">Setlist</span><button class="link-btn">Szerkesztés</button></li>
        ${set.map((s, n) => `<li class="sl-row"><span class="sl-n mono">${String(n + 1).padStart(2, '0')}</span>${cover(s, 'cover-sm')}<a class="sl-meta" href="#hub"><b>${s.title}</b><small>${s.artist}</small></a><span class="sl-chips">${chips(s)}</span>${statusChip(s)}<span class="sl-dur mono">${s.dur}</span></li>`).join('')}
      </ol>
    </section>

    ${weekStrip()}

    <div class="dash-grid">
      ${calendar()}
      ${dayPanel()}
      <section class="card suggest">
        <header class="card-head"><div><span class="eyebrow">${icon('sparkle')} Javaslat</span><h2 class="card-title">Rég nem játszottátok</h2></div></header>
        <ul class="sug-list">${neglected.map((s) => `<li>${cover(s, 'cover-sm')}<span class="sl-meta"><b>${s.title}</b><small>${daysBetween(s.last, TODAY)} napja · ${s.artist}</small></span>${btn('Okt. 22.', 'plus', 'btn-chip')}</li>`).join('')}</ul>
      </section>
      <section class="card pulse">
        <header class="card-head"><div><span class="eyebrow">${icon('flame')} Lendület</span><h2 class="card-title">Repertoár állapota</h2></div></header>
        <div class="kpis">
          <div class="kpi"><b class="mono">4</b><span>hét sorozat</span></div>
          <div class="kpi"><b class="mono">5</b><span>próba októberben</span></div>
          <div class="kpi"><b class="mono">${ready}<i>/${SONGS.length}</i></b><span>dal kész</span></div>
        </div>
        <div class="repbar" role="img" aria-label="${ready} kész, ${ok} megy, ${SONGS.length - ready - ok} tanulás alatt">
          <span class="rb-ready" style="flex:${ready}"></span><span class="rb-ok" style="flex:${ok}"></span><span class="rb-learning" style="flex:${SONGS.length - ready - ok}"></span>
        </div>
        <div class="rb-legend"><span><i class="st-ready"></i>Kész ${ready}</span><span><i class="st-ok"></i>Megy ${ok}</span><span><i class="st-learning"></i>Tanuljuk ${SONGS.length - ready - ok}</span></div>
      </section>
    </div>`;
  }

  /* ---------- Dalok ---------- */
  function songCard(s) {
    return `<article class="song-card" data-status="${s.status}">
      <div class="sc-art">${cover(s, 'cover-fill')}<button class="sc-play" aria-label="${s.title} lejátszása">${icon('play')}</button>${s.fav ? `<span class="sc-fav" aria-label="Kedvenc">${icon('heart')}</span>` : ''}</div>
      <div class="sc-body">
        <div class="sc-top"><a class="sc-title" href="#hub">${s.title}</a>${iconBtn('more', 'Műveletek', 'sc-more')}</div>
        <span class="sc-artist">${s.artist}</span>
        <div class="sc-chips">${chips(s)}</div>
        <div class="sc-foot">${statusChip(s)}${diff(s)}</div>
      </div>
    </article>`;
  }
  function songRow(s) {
    return `<div class="song-row" role="row" data-status="${s.status}">
      ${cover(s, 'cover-sm')}
      <a class="sr-title" href="#hub"><b>${s.title}</b><small>${s.artist}</small></a>
      <span class="sr-key mono">${s.key}</span><span class="sr-bpm mono">${s.bpm}</span>
      <span class="sr-diff">${diff(s)}</span><span class="sr-status">${statusChip(s)}</span>
      <span class="sr-last muted">${daysBetween(s.last, TODAY)} napja</span>
      <span class="sr-act">${s.tab ? iconBtn('file', 'Tab') : '<span class="icon-btn ghosted"></span>'}${iconBtn('play', 'Lejátszás')}${iconBtn('more', 'Műveletek')}</span>
    </div>`;
  }
  function songs() {
    const counts = { all: SONGS.length, learning: 0, ok: 0, ready: 0 };
    SONGS.forEach((s) => counts[s.status]++);
    const list = SONGS.filter((s) => state.status === 'all' || s.status === state.status);
    return `
    <div class="page-head">
      <div><span class="eyebrow">Hangolatlanok repertoárja</span><h1 class="page-title">Dalok <span class="count mono">${SONGS.length}</span></h1></div>
      <div class="row">${btn('Spotify', 'spotify', 'btn-ghost hide-sm')}${btn('Új dal', 'plus', 'btn-primary')}</div>
    </div>
    <div class="toolbar">
      <label class="search">${icon('search')}<input placeholder="Keresés cím, előadó, hangnem szerint…" aria-label="Keresés"/></label>
      <div class="seg status-seg" role="tablist" aria-label="Státusz">
        ${[['all', 'Mind'], ['learning', 'Tanuljuk'], ['ok', 'Megy'], ['ready', 'Kész']].map(([k, l]) => `<button role="tab" data-status="${k}" class="${state.status === k ? 'on' : ''}" aria-selected="${state.status === k}">${k !== 'all' ? `<i class="dot st-${k}"></i>` : ''}${l}<em class="mono">${counts[k]}</em></button>`).join('')}
      </div>
      <div class="row tb-right">
        ${btn('Szűrők', 'filter', 'btn-ghost btn-sm')}
        ${btn('Előadó A–Z', 'sort', 'btn-ghost btn-sm hide-sm')}
        <div class="seg seg-icon" role="group" aria-label="Nézet">
          <button data-view="grid" class="${state.view === 'grid' ? 'on' : ''}" aria-label="Rács nézet">${icon('grid')}</button>
          <button data-view="list" class="${state.view === 'list' ? 'on' : ''}" aria-label="Lista nézet">${icon('list')}</button>
        </div>
      </div>
    </div>
    <div class="active-filters"><span class="af-chip">Van tab ${icon('x')}</span><span class="af-chip">Nehézség ≤ 4 ${icon('x')}</span><button class="link-btn">Összes törlése</button></div>
    ${state.view === 'grid'
      ? `<div class="song-grid">${list.map(songCard).join('')}</div>`
      : `<div class="song-table" role="table"><div class="song-row song-row-head" role="row"><span></span><span>Cím</span><span>Hang</span><span>BPM</span><span>Nehézség</span><span>Státusz</span><span>Utoljára</span><span></span></div>${list.map(songRow).join('')}</div>`}`;
  }

  /* ---------- Song Hub ---------- */
  function sheet(s, big) {
    const p = s.prog;
    const bars = (arr) => `<div class="bars">${arr.map((c) => `<span class="bar"><b class="ch">${c}</b></span>`).join('')}</div>`;
    const sec = (name, arr, note) => `<div class="sheet-sec"><span class="sheet-label">${name}${note ? `<em>${note}</em>` : ''}</span>${bars(arr)}</div>`;
    const tab = `<pre class="tab mono">e|-----------------|-----------------|
B|-----3-----3-----|-----2-----2-----|
G|---4---4-----4---|---3---3-----3---|
D|-4-------4-------|-4-------4-------|
A|-2---------------|-----------------|
E|-----------------|-2---------------|</pre>`;
    let html = sec('Intro', p.slice(0, 4), '×2') + sec('Verze 1', p) + sec('Refrén', [...p.slice(4), ...p.slice(0, 4)]);
    if (big) html += sec('Verze 2', p) + `<div class="sheet-sec"><span class="sheet-label">Riff</span>${tab}</div>` + sec('Refrén', [...p.slice(4), ...p.slice(0, 4)], '×2') + sec('Szóló', p, 'szabadon') + sec('Outro', p.slice(0, 4), 'lassítva');
    else html += `<div class="sheet-sec"><span class="sheet-label">Riff</span>${tab}</div>`;
    return `<div class="sheet${big ? ' sheet-big' : ''}">${html}</div>`;
  }

  function hub() {
    const s = byId('hotel');
    const uniq = [...new Set(s.prog)];
    const hist = Object.entries(EVENTS).filter(([, ids]) => ids.includes(s.id)).map(([d]) => d);
    return `
    <nav class="crumbs" aria-label="Morzsamenü"><a href="#songs">${icon('left')}Dalok</a><span>/</span><span>${s.title}</span></nav>
    <section class="hub-hero" style="--h:${s.hue}">
      ${cover(s, 'hub-cover')}
      <div class="hub-info">
        <span class="eyebrow">Dal · hozzáadta Gábor · 2026. márc.</span>
        <h1 class="hub-title">${s.title}</h1>
        <p class="hub-artist">${s.artist}</p>
        <div class="hub-chips">${chips(s, true)}${diff(s)}</div>
        <div class="hub-status"><span class="eyebrow">Hol tartunk?</span>
          <div class="seg status-pick">${['learning', 'ok', 'ready'].map((k) => `<button class="${k === s.status ? 'on' : ''}"><i class="dot st-${k}"></i>${STATUS[k].label}</button>`).join('')}</div>
        </div>
        <div class="hub-cta">
          <a class="btn btn-primary btn-lg" href="#practice">${icon('stage')}<span>Gyakorlás</span></a>
          ${btn('Lejátszás', 'play', 'btn-ghost btn-lg')}
          ${btn('Okt. 22. próbán', 'check', 'btn-ghost btn-lg btn-on')}
          ${iconBtn('heart', 'Kedvenc', 'btn-fav on')}
          ${iconBtn('more', 'További műveletek', 'hide-sm')}
        </div>
      </div>
    </section>
    <div class="hub-tabs seg" role="tablist"><button class="on">Akkordok</button><button>Videó</button><button>Előzmények</button><button>Felvételek</button></div>
    <div class="hub-grid">
      <div class="hub-col">
        <section class="card chords-card">
          <header class="card-head"><h2 class="card-title">Akkordok <span class="muted">${uniq.length}</span></h2><div class="row">${btn('Capo nélkül', '', 'btn-ghost btn-sm')}${iconBtn('copy', 'Másolás')}</div></header>
          <div class="chord-strip">${uniq.map((c) => `<figure class="chord">${chordSVG(c)}<figcaption>${c}</figcaption></figure>`).join('')}</div>
        </section>
        <section class="card sheet-card">
          <header class="card-head"><h2 class="card-title">Kotta & tab</h2><div class="row">${iconBtn('minus', 'Kisebb betű', 'hide-sm')}<span class="mono muted hide-sm">14</span>${iconBtn('plus', 'Nagyobb betű', 'hide-sm')}${btn('Auto-görgetés', 'scroll', 'btn-ghost btn-sm')}</div></header>
          ${sheet(s)}
          <div class="note">${icon('file')}<p><b>Jegyzet (Gábor):</b> a 2. versszak után a szólónál mindketten lassítunk — az ütemváltásnál figyelj a basszusra.</p></div>
        </section>
      </div>
      <div class="hub-col hub-side">
        <section class="card video-card">
          <div class="video" style="--h:${s.hue}"><button class="video-play" aria-label="Videó lejátszása">${icon('play')}</button><span class="video-label">${icon('video')} Eagles — Hotel California (Live 1977)</span></div>
        </section>
        <section class="card">
          <header class="card-head"><h2 class="card-title">Próbákon</h2><span class="muted mono">${s.plays}×</span></header>
          <ol class="timeline">${hist.reverse().map((d) => `<li class="${d < TODAY ? 'done' : 'plan'}"><i></i><b>${cap(fmt(d, { month: 'short', day: 'numeric' }))}</b><span>${d < TODAY ? 'lejátszva' : 'tervezve'}</span></li>`).join('')}</ol>
        </section>
        <section class="card">
          <header class="card-head"><h2 class="card-title">Felvételek</h2>${iconBtn('mic', 'Új felvétel')}</header>
          <div class="recs">${[{ name: 'Okt. 13. — 2. menet', dur: '6:48', seed: 7 }, { name: 'Okt. 9. — próba eleje', dur: '6:21', seed: 4 }].map((r, i) => `<div class="rec">${iconBtn(i ? 'play' : 'pause', 'Lejátszás', 'rec-play')}<div class="rec-body"><b>${r.name}</b>${waveSVG(r.seed, 64, i ? 0 : 0.42)}</div><span class="mono muted">${r.dur}</span></div>`).join('')}</div>
        </section>
      </div>
    </div>`;
  }

  /* ---------- Próba mód ---------- */
  function practice() {
    const set = NEXT.setlist.map(byId);
    const i = state.practiceIdx;
    const s = set[i];
    const nxt = set[i + 1];
    const beatDur = (60 / s.bpm).toFixed(3);
    return `<div class="practice" data-metro="${state.metro}" style="--h:${s.hue};--beat:${beatDur}s">
      <header class="pr-top">
        <a class="icon-btn pr-close" href="#dashboard" aria-label="Kilépés a próba módból">${icon('x')}</a>
        <div class="pr-progress" aria-label="${i + 1}. dal az ${set.length}-ből">${set.map((x, k) => `<span class="${k < i ? 'past' : k === i ? 'cur' : ''}"></span>`).join('')}</div>
        <span class="pr-count mono">${i + 1}<i>/${set.length}</i></span>
        <span class="pr-timer mono hide-sm">${icon('clock')} 00:24:17</span>
      </header>
      <div class="pr-body">
        <aside class="pr-info">
          ${cover(s, 'pr-cover')}
          <span class="eyebrow">Okt. 22. próba</span>
          <h1 class="pr-title">${s.title}</h1>
          <p class="pr-artist">${s.artist}</p>
          <div class="pr-chips">${chips(s, true)}</div>
          <div class="pr-chords">${[...new Set(s.prog)].map((c) => `<figure class="chord chord-sm">${chordSVG(c)}<figcaption>${c}</figcaption></figure>`).join('')}</div>
          ${nxt ? `<div class="pr-next"><span class="eyebrow">Következő</span><button class="pr-next-card" data-act="next">${cover(nxt, 'cover-sm')}<span class="sl-meta"><b>${nxt.title}</b><small>${nxt.artist} · ${nxt.key} · ${nxt.bpm} BPM</small></span>${icon('right')}</button></div>` : ''}
        </aside>
        <section class="pr-sheet" id="pr-sheet" tabindex="0" aria-label="Kotta">${sheet(s, true)}</section>
      </div>
      <footer class="pr-bar">
        <button class="pr-nav" data-act="prev" ${i === 0 ? 'disabled' : ''} aria-label="Előző dal">${icon('prev')}<span class="hide-sm">Előző</span></button>
        <div class="pr-tools">
          <button class="pr-tool metro${state.metro ? ' on' : ''}" data-act="metro" aria-pressed="${state.metro}" aria-label="Metronóm">
            <span class="beats"><i></i><i></i><i></i><i></i></span><b class="mono">${s.bpm}</b><small>BPM</small>
          </button>
          <button class="pr-tool${state.scrolling ? ' on' : ''}" data-act="scroll" aria-pressed="${state.scrolling}" aria-label="Auto-görgetés">${icon('scroll')}<b class="mono">${state.speed}×</b><small>Görgetés</small></button>
          <button class="pr-tool hide-sm" aria-label="Videó">${icon('video')}<small>Videó</small></button>
          <button class="pr-tool rec" aria-label="Felvétel">${icon('mic')}<small>Felvétel</small></button>
        </div>
        <button class="pr-nav pr-nav-next" data-act="next" ${!nxt ? 'disabled' : ''} aria-label="Következő dal"><span class="hide-sm">Következő</span>${icon('next')}</button>
      </footer>
    </div>`;
  }

  const placeholder = (t) => `<div class="empty empty-page"><div class="empty-art">${icon('sparkle')}</div><b>${t}</b><p>Ez a képernyő nem része a mostani mockup-körnek.</p><a class="btn btn-ghost" href="#dashboard">Vissza a kezdőlapra</a></div>`;

  function render(screen) {
    if (screen === 'practice') return practice();
    const map = { dashboard, songs, hub };
    return shell(screen, (map[screen] || (() => placeholder('Hamarosan')))());
  }

  /* ---------- interakciók ---------- */
  let scrollRaf = null;
  function bind(root, rerender) {
    root.onclick = (e) => {
      const t = e.target.closest('[data-act],[data-date],[data-view],[data-status]');
      if (!t) return;
      if (t.dataset.date) { state.selected = t.dataset.date; return rerender(); }
      if (t.dataset.view) { state.view = t.dataset.view; return rerender(); }
      if (t.matches('.status-seg [data-status]')) { state.status = t.dataset.status; return rerender(); }
      const a = t.dataset.act;
      if (a === 'toggle-play') { state.playing = !state.playing; return rerender(); }
      if (a === 'metro') { state.metro = !state.metro; return rerender(); }
      if (a === 'next' || a === 'prev') { state.practiceIdx = Math.max(0, Math.min(NEXT.setlist.length - 1, state.practiceIdx + (a === 'next' ? 1 : -1))); return rerender(); }
      if (a === 'scroll') { state.scrolling = !state.scrolling; rerender(); }
    };
    cancelAnimationFrame(scrollRaf);
    const sh = root.querySelector('#pr-sheet');
    if (sh && state.scrolling) {
      const tick = () => { sh.scrollTop += 0.35 * state.speed; scrollRaf = requestAnimationFrame(tick); };
      scrollRaf = requestAnimationFrame(tick);
    }
  }

  return { render, bind, state };
})();
