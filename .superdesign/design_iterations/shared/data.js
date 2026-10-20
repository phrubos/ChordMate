/* ChordMate mockup — közös minta-adatok, ikonok, akkorddiagramok */
window.CM = (() => {
  const SONGS = [
    { id: 'hotel', title: 'Hotel California', artist: 'Eagles', key: 'Bm', bpm: 74, capo: 7, tuning: 'Standard', diff: 4, status: 'learning', hue: 32, pat: 1, plays: 9, last: '2026-10-13', tab: true, fav: true, dur: '6:30', prog: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em', 'F#'] },
    { id: 'gyongy', title: 'Gyöngyhajú lány', artist: 'Omega', key: 'Am', bpm: 76, capo: 0, tuning: 'Standard', diff: 3, status: 'ok', hue: 255, pat: 3, plays: 7, last: '2026-10-09', tab: true, fav: true, dur: '4:15', prog: ['Am', 'Dm', 'G', 'C', 'F', 'Dm', 'E', 'Am'] },
    { id: 'wing', title: 'Little Wing', artist: 'Jimi Hendrix', key: 'Em', bpm: 70, capo: 0, tuning: 'Eb', diff: 5, status: 'learning', hue: 300, pat: 2, plays: 4, last: '2026-10-06', tab: true, fav: false, dur: '2:25', prog: ['Em', 'G', 'Am', 'Em', 'Bm', 'Am', 'C', 'G'] },
    { id: 'bridge', title: 'Under the Bridge', artist: 'Red Hot Chili Peppers', key: 'E', bpm: 84, capo: 0, tuning: 'Standard', diff: 4, status: 'ok', hue: 200, pat: 4, plays: 6, last: '2026-10-13', tab: true, fav: false, dur: '4:24', prog: ['D', 'F#m', 'E', 'Bm', 'A', 'E', 'D', 'A'] },
    { id: 'wonder', title: 'Wonderwall', artist: 'Oasis', key: 'F#m', bpm: 87, capo: 2, tuning: 'Standard', diff: 2, status: 'ready', hue: 85, pat: 1, plays: 12, last: '2026-10-09', tab: true, fav: false, dur: '4:18', prog: ['Em7', 'G', 'Dsus4', 'A7sus4', 'Em7', 'G', 'Dsus4', 'A7sus4'] },
    { id: 'wish', title: 'Wish You Were Here', artist: 'Pink Floyd', key: 'G', bpm: 61, capo: 0, tuning: 'Standard', diff: 2, status: 'ready', hue: 18, pat: 3, plays: 14, last: '2026-10-02', tab: true, fav: true, dur: '5:34', prog: ['C', 'D', 'Am', 'G', 'D', 'C', 'Am', 'G'] },
    { id: 'mostmulik', title: 'Most múlik pontosan', artist: 'Kispál és a Borz', key: 'D', bpm: 128, capo: 0, tuning: 'Standard', diff: 2, status: 'ready', hue: 140, pat: 2, plays: 10, last: '2026-10-06', tab: true, fav: false, dur: '3:52', prog: ['D', 'A', 'G', 'D', 'Bm', 'G', 'A', 'D'] },
    { id: 'black', title: 'Black', artist: 'Pearl Jam', key: 'E', bpm: 74, capo: 0, tuning: 'Standard', diff: 3, status: 'ok', hue: 230, pat: 4, plays: 5, last: '2026-10-02', tab: false, fav: false, dur: '5:43', prog: ['E', 'A', 'E', 'A', 'E', 'A', 'D', 'A'] },
    { id: 'rosa', title: 'Ha én rózsa volnék', artist: 'Koncz Zsuzsa', key: 'C', bpm: 92, capo: 0, tuning: 'Standard', diff: 1, status: 'ready', hue: 350, pat: 1, plays: 8, last: '2026-09-11', tab: true, fav: false, dur: '3:05', prog: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'] },
    { id: 'nothing', title: 'Nothing Else Matters', artist: 'Metallica', key: 'Em', bpm: 69, capo: 0, tuning: 'Standard', diff: 3, status: 'ok', hue: 180, pat: 3, plays: 6, last: '2026-09-29', tab: true, fav: true, dur: '6:28', prog: ['Em', 'D', 'C', 'G', 'Em', 'D', 'C', 'Em'] },
    { id: 'blackbird', title: 'Blackbird', artist: 'The Beatles', key: 'G', bpm: 94, capo: 0, tuning: 'Standard', diff: 4, status: 'learning', hue: 60, pat: 2, plays: 2, last: '2026-09-05', tab: true, fav: false, dur: '2:18', prog: ['G', 'Am', 'G', 'C', 'A', 'D', 'G', 'C'] },
    { id: 'layla', title: 'Layla (Unplugged)', artist: 'Eric Clapton', key: 'Dm', bpm: 95, capo: 0, tuning: 'Standard', diff: 3, status: 'ok', hue: 12, pat: 4, plays: 3, last: '2026-09-18', tab: false, fav: false, dur: '4:46', prog: ['Dm', 'Bm', 'F', 'G', 'A', 'Dm', 'C', 'Dm'] },
  ];

  const STATUS = {
    learning: { label: 'Tanuljuk' },
    ok: { label: 'Megy' },
    ready: { label: 'Kész' },
  };
  const DIFF = ['', 'Könnyű', 'Laza', 'Közepes', 'Nehéz', 'Kihívás'];

  const TODAY = '2026-10-16';
  const EVENTS = {
    '2026-09-29': ['nothing', 'black', 'wish'],
    '2026-10-02': ['wish', 'black', 'rosa', 'wonder'],
    '2026-10-06': ['wing', 'mostmulik', 'wonder'],
    '2026-10-09': ['gyongy', 'wonder', 'hotel', 'nothing', 'wish'],
    '2026-10-13': ['hotel', 'bridge', 'gyongy'],
    '2026-10-22': ['hotel', 'gyongy', 'wing', 'bridge', 'wonder'],
    '2026-10-27': ['blackbird', 'layla', 'black'],
    '2026-10-30': ['wish', 'mostmulik', 'rosa', 'nothing'],
    '2026-11-03': ['hotel', 'wing'],
  };

  const MEMBERS = [
    { n: 'Péter', i: 'P', h: 32, rsvp: 'yes' },
    { n: 'Gábor', i: 'G', h: 200, rsvp: 'yes' },
    { n: 'Dani', i: 'D', h: 300, rsvp: 'maybe' },
  ];

  const NEXT = {
    date: '2026-10-22',
    time: '18:30',
    place: 'Próbaterem · Fehérvári út',
    setlist: EVENTS['2026-10-22'],
  };

  const RECORDINGS = {
    '2026-10-13': [{ name: 'Hotel California — 2. menet', dur: '6:48', seed: 7 }, { name: 'Under the Bridge — intro', dur: '1:12', seed: 3 }],
    '2026-10-09': [{ name: 'Teljes próba', dur: '42:10', seed: 11 }],
  };

  /* frets: mély E → magas e, -1 = némított; barre: [fret, fromString, toString] */
  const CHORDS = {
    A: { f: [-1, 0, 2, 2, 2, 0] },
    Am: { f: [-1, 0, 2, 2, 1, 0] },
    A7sus4: { f: [-1, 0, 2, 0, 3, 3] },
    Bm: { f: [-1, 2, 4, 4, 3, 2], b: [2, 1, 5] },
    C: { f: [-1, 3, 2, 0, 1, 0] },
    D: { f: [-1, -1, 0, 2, 3, 2] },
    Dm: { f: [-1, -1, 0, 2, 3, 1] },
    Dsus4: { f: [-1, -1, 0, 2, 3, 3] },
    E: { f: [0, 2, 2, 1, 0, 0] },
    Em: { f: [0, 2, 2, 0, 0, 0] },
    Em7: { f: [0, 2, 2, 0, 3, 3] },
    F: { f: [1, 3, 3, 2, 1, 1], b: [1, 0, 5] },
    'F#': { f: [2, 4, 4, 3, 2, 2], b: [2, 0, 5] },
    'F#m': { f: [2, 4, 4, 2, 2, 2], b: [2, 0, 5] },
    G: { f: [3, 2, 0, 0, 3, 3] },
  };

  const ICONS = {
    play: '<polygon points="6 3 20 12 6 21 6 3" class="fill"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1" class="fill"/><rect x="6" y="4" width="4" height="16" rx="1" class="fill"/>',
    next: '<polygon points="5 4 15 12 5 20 5 4" class="fill"/><line x1="19" x2="19" y1="5" y2="19"/>',
    prev: '<polygon points="19 20 9 12 19 4 19 20" class="fill"/><line x1="5" x2="5" y1="19" y2="5"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    songs: '<path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    stats: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    filter: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    metronome: '<path d="M9 3h6l4 18H5z"/><path d="m12 17 5-11"/><path d="M7.5 14h9"/>',
    tuner: '<path d="M8 2v7a4 4 0 0 0 8 0V2"/><path d="M12 13v9"/>',
    expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    sort: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 15c3-1 7-1 10 .5"/><path d="M6.5 12c3.5-1.2 8-1 11.5.8"/><path d="M6 9c4-1.4 9.5-1.1 13 1"/>',
    stage: '<path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M10 20v-6h4v6"/>',
    scroll: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    wave: '<path d="M2 12h2"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 7v10"/><path d="M18 10v4"/><path d="M22 12h0"/>',
    sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  };

  function icon(name, cls = '') {
    return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function chordSVG(name) {
    const c = CHORDS[name];
    if (!c) return '';
    const W = 60, H = 74, x0 = 8, y0 = 16, sw = 44 / 5, fh = 11.5;
    const xs = (i) => x0 + i * sw;
    let s = `<svg class="chord-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name} akkord">`;
    s += `<rect class="ch-nut" x="${x0 - 0.5}" y="${y0 - 3}" width="45" height="3" rx="1"/>`;
    for (let f = 0; f <= 5; f++) s += `<line class="ch-grid" x1="${x0}" x2="${x0 + 44}" y1="${y0 + f * fh}" y2="${y0 + f * fh}"/>`;
    for (let i = 0; i < 6; i++) s += `<line class="ch-grid" x1="${xs(i)}" x2="${xs(i)}" y1="${y0}" y2="${y0 + 5 * fh}"/>`;
    if (c.b) {
      const [bf, a, b] = c.b;
      const y = y0 + (bf - 0.5) * fh;
      s += `<rect class="ch-dot" x="${xs(a) - 3.6}" y="${y - 3.6}" width="${xs(b) - xs(a) + 7.2}" height="7.2" rx="3.6"/>`;
    }
    c.f.forEach((f, i) => {
      if (f === -1) s += `<text class="ch-mark" x="${xs(i)}" y="${y0 - 6}">×</text>`;
      else if (f === 0) s += `<circle class="ch-open" cx="${xs(i)}" cy="${y0 - 8}" r="2.4"/>`;
      else if (!(c.b && f === c.b[0] && i >= c.b[1] && i <= c.b[2])) s += `<circle class="ch-dot" cx="${xs(i)}" cy="${y0 + (f - 0.5) * fh}" r="3.6"/>`;
    });
    return s + '</svg>';
  }

  function rand(seed) {
    let t = seed * 9301 + 49297;
    return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; };
  }

  function waveSVG(seed = 1, n = 72, played = 0.38) {
    const r = rand(seed);
    let s = `<svg class="wave-svg" viewBox="0 0 ${n * 4} 40" preserveAspectRatio="none" aria-hidden="true">`;
    for (let i = 0; i < n; i++) {
      const env = Math.sin((i / n) * Math.PI) * 0.6 + 0.4;
      const h = Math.max(3, (r() * 0.7 + 0.3) * env * 36);
      s += `<rect class="${i / n < played ? 'wv-on' : 'wv'}" x="${i * 4}" y="${20 - h / 2}" width="2.4" height="${h}" rx="1.2"/>`;
    }
    return s + '</svg>';
  }

  const byId = (id) => SONGS.find((s) => s.id === id);
  const parse = (iso) => new Date(iso + 'T12:00:00');
  const fmt = (iso, o) => new Intl.DateTimeFormat('hu-HU', o).format(parse(iso));
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return { SONGS, STATUS, DIFF, TODAY, EVENTS, MEMBERS, NEXT, RECORDINGS, CHORDS, icon, chordSVG, waveSVG, byId, parse, fmt, daysBetween, isoOf, cap };
})();
