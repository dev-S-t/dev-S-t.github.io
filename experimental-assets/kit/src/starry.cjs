// STARRY NIGHT: the painting's night, in the site's lines and the mark's brush, ink and paper at once (one version).
// The sky is ink, its strokes paper, laid along one wind that flows round the swirls, the stars and the moon like water
// round stones. Strokes are not all alike: the open sky is very fine, small strokes close together; round each star they
// grow bolder the nearer they are to it, in rings, and thin out as they go; the great swirl and its partner are spirals
// of middling strokes; a pale wave of bolder strokes runs through the middle of the sky. The moon is a crescent in an
// orb of fine ink rings. Below: paper mountains in ink strokes, a dark village with paper houses and a church spire,
// a black cypress of several flames, and a small figure in light, hand at his brow, watching.
const L = require('./lib.cjs'), FIG = require('./figure.cjs');
const W = 1600, H = 900, CELL = 3, PI = Math.PI;
const { PAPER, INK } = L;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the scene ------------------------------------------------------------------------------------------------------
const mountain = (x) => H * (0.715 + 0.07 * smooth(1600, 300, x)) - 26 * Math.max(0, Math.sin(x / 140 + 0.6)) * smooth(700, 1100, x) - 10 * Math.sin(x / 47 + 1) - 6 * Math.sin(x / 19);
const village = (x) => H * 0.845 + 7 * Math.sin(x / 70 + 0.5) + 4 * Math.sin(x / 23);
const MOON = { c: [1440, 165], r: 44, orb: 70 };
const SWIRLS = [[860, 345, 1, 128], [1095, 470, -1, 70], [330, 330, 1, 62]];
const STARS = [[175, 62, 0.95], [395, 46, 0.7], [575, 72, 0.85], [705, 52, 0.55], [1005, 82, 1.0], [400, 185, 0.8], [1170, 235, 0.75], [585, 520, 0.6], [105, 445, 0.65], [1300, 400, 0.55], [1245, 80, 0.5]];
// a star's halo: rings of strokes, boldest next to the core, thinning outward
function halo(s) {
  const core = 5 + 6 * s, n = Math.round(3 + 2.5 * s), rings = []; let r = core + 2.5;
  for (let k = 0; k < n; k++) { const w = (1.8 + 5.2 * s) * Math.pow(1 - k / n, 0.9) + 1.2; r += w / 2; rings.push([r, w]); r += w / 2 + 2 + 0.3 * w; }
  return { core, rings, R: r + 2 };
}
const HALOS = STARS.map(([, , s]) => halo(s));
const MOONHALO = (() => { const rings = []; let r = MOON.orb + 4; for (let k = 0; k < 6; k++) { const w = 7 * Math.pow(1 - k / 6, 0.9) + 1.3; r += w / 2; rings.push([r, w]); r += w / 2 + 2.4 + 0.35 * w; } return { rings, R: r + 2 }; })();
// the wave of pale strokes through the middle of the sky
const bandY = (x) => H * 0.43 + 62 * Math.sin(x / 250 - 0.5) + 18 * Math.sin(x / 90);
// the cypress: three flames
const FLAMES = [[205, H + 30, H * 0.06, 92], [282, H + 30, H * 0.27, 58], [128, H + 30, H * 0.42, 50]];
const flameAt = ([x0, base, top, w0], y) => { const t = (base - y) / (base - top); if (t < 0 || t > 1) return null; return { cx: x0 + 20 * Math.sin(t * 3.3 + x0) * t, w: w0 * Math.pow(1 - t, 0.6) * (1 + 0.16 * Math.sin(t * 21 + x0) + 0.07 * Math.sin(t * 47)) }; };
const inCypress = (x, y, pad = 0) => FLAMES.some((f) => { const a = flameAt(f, y); return a && Math.abs(x - a.cx) < a.w + pad; });
const FIG_AT = [1505, H - 48], FIGS = 104;
const nearFigure = (x, y) => Math.hypot((x - FIG_AT[0]) / 48, (y - (FIG_AT[1] - FIGS * 0.5)) / 74) < 1;

// ---- the wind ---------------------------------------------------------------------------------------------------------
const ROUND = [...SWIRLS.map(([cx, cy, d, R]) => [cx, cy, R + 5, d]), ...STARS.map(([cx, cy], k) => [cx, cy, HALOS[k].R + 2, 0]), [MOON.c[0], MOON.c[1], MOONHALO.R + 2, 0]];
function sky(x, y) {
  let v = y / H + 0.006 * L.sn(x / 260, y / 260);
  for (const [cx, cy, R, d] of ROUND) { const dx = x - cx, dy = y - cy, r2 = Math.max(dx * dx + dy * dy, R * R * 0.3); v -= dy / H * R * R / r2; if (d) v += d * 0.55 * R / H * 0.5 * Math.log(r2 / (R * R)); }
  return v;
}
const inRound = (x, y, pad = 0) => ROUND.some(([cx, cy, R]) => Math.hypot(x - cx, y - cy) < R - 2 + pad);
// how bold the sky's strokes are here: bold round the stars and the moon, falling away; middling in the wave and at the
// swirls' rims; fine everywhere else
function boldness(x, y) {
  let b = 0.42 * Math.exp(-(((y - bandY(x)) / 46) ** 2));
  STARS.forEach(([cx, cy, s], k) => { const d = Math.hypot(x - cx, y - cy) - HALOS[k].R; if (d > -2) b = Math.max(b, (0.35 + 0.6 * s) * Math.exp(-d / (26 + 26 * s))); });
  { const d = Math.hypot(x - MOON.c[0], y - MOON.c[1]) - MOONHALO.R; b = Math.max(b, Math.exp(-d / 70)); }
  SWIRLS.forEach(([cx, cy, , R]) => { const d = Math.hypot(x - cx, y - cy) - R; b = Math.max(b, 0.5 * Math.exp(-Math.max(0, d) / 32)); });
  return Math.min(1, b);
}

// ---- contours: marching squares, joined into lines (each line knows its level) ----------------------------------------
function contours(F, step, keep) {
  const nx = Math.ceil(W / CELL) + 1, ny = Math.ceil(H / CELL) + 1, v = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = F(i * CELL, j * CELL) / step;
  const lvl = new Map(), edgeP = (L0, a, b, pa, pb) => { const u = (L0 - a) / (b - a); return [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u]; };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const x = i * CELL, y = j * CELL; if (!keep(x + CELL / 2, y + CELL / 2)) continue;
    const a = v[j * nx + i], b = v[j * nx + i + 1], c = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i];
    const lo = Math.ceil(Math.min(a, b, c, d)), hi = Math.floor(Math.max(a, b, c, d));
    for (let L0 = lo; L0 <= hi; L0++) {
      const tl = [x, y], tr = [x + CELL, y], br = [x + CELL, y + CELL], bl = [x, y + CELL], hits = [];
      if ((a < L0) !== (b < L0)) hits.push(['h' + i + ',' + j, edgeP(L0, a, b, tl, tr)]);
      if ((b < L0) !== (c < L0)) hits.push(['v' + (i + 1) + ',' + j, edgeP(L0, b, c, tr, br)]);
      if ((d < L0) !== (c < L0)) hits.push(['h' + i + ',' + (j + 1), edgeP(L0, d, c, bl, br)]);
      if ((a < L0) !== (d < L0)) hits.push(['v' + i + ',' + j, edgeP(L0, a, d, tl, bl)]);
      if (hits.length < 2) continue;
      let pairs = [[hits[0], hits[1]]];
      if (hits.length === 4) { const m = (a + b + c + d) / 4; pairs = (m < L0) === (a < L0) ? [[hits[0], hits[3]], [hits[1], hits[2]]] : [[hits[0], hits[1]], [hits[2], hits[3]]]; }
      let E = lvl.get(L0); if (!E) { E = new Map(); lvl.set(L0, E); }
      for (const [[ka, pa], [kb, pb]] of pairs) {
        if (!E.has(ka)) E.set(ka, { p: pa, nb: [] }); if (!E.has(kb)) E.set(kb, { p: pb, nb: [] });
        E.get(ka).nb.push(kb); E.get(kb).nb.push(ka);
      }
    }
  }
  const lines = [];
  for (const [L0, E] of lvl) {
    const seen = new Set();
    const walk = (k0) => { const out = [E.get(k0).p]; seen.add(k0); let prev = null, cur = k0; for (;;) { const nxt = E.get(cur).nb.find((n) => n !== prev && !seen.has(n)); if (!nxt) { if (out.length > 2 && E.get(cur).nb.includes(k0)) out.push(E.get(k0).p); break; } seen.add(nxt); out.push(E.get(nxt).p); prev = cur; cur = nxt; } out.L = L0; return out; };
    for (const [k, e] of E) if (!seen.has(k) && e.nb.length === 1) lines.push(walk(k));
    for (const k of E.keys()) if (!seen.has(k)) lines.push(walk(k));
  }
  return lines.filter((l) => l.length > 2);
}

// ---- strokes ------------------------------------------------------------------------------------------------------------
function along(line) {
  const acc = [0]; for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  let hint = 1;
  const at = (s) => { let i = Math.max(1, Math.min(hint, acc.length - 1)); while (i > 1 && acc[i - 1] > s) i--; while (i < acc.length - 1 && acc[i] < s) i++; hint = i; const u = (s - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1), a = line[i - 1], b = line[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] }; };
  return { len: acc[acc.length - 1], at };
}
// a bold stroke is a filled shape (the mark's brush: blunt start, full early, lifting to a point); a fine one is a short
// round-capped line, kept in buckets by width
const PROFILE = [[0, 0.7], [0.18, 1], [0.45, 0.88], [0.72, 0.55], [0.9, 0.22], [1, 0]];
const BUCKETS = [1.3, 1.7, 2.2, 2.8, 3.4];
function makeSink() { return { bold: [], fine: BUCKETS.map(() => []) }; }
function put(sink, A, s0, len, wd, jit) {
  if (wd > 3.6) {
    const left = [], right = [];
    for (const [u, k] of PROFILE) { const { p, t } = A.at(s0 + len * u), n = [-t[1], t[0]], w = wd * k / 2 + jit * (u > 0 && u < 1 ? 1 : 0); left.push([p[0] + n[0] * w, p[1] + n[1] * w]); right.push([p[0] - n[0] * w, p[1] - n[1] * w]); }
    const s = A.at(s0); sink.bold.push([[s.p[0] - s.t[0] * wd * 0.3, s.p[1] - s.t[1] * wd * 0.3], ...left, ...right.slice(0, -1).reverse()]);
  } else {
    let b = 0; for (let i = 1; i < BUCKETS.length; i++) if (Math.abs(BUCKETS[i] - wd) < Math.abs(BUCKETS[b] - wd)) b = i;
    const pts = len > 9 ? [A.at(s0).p, A.at(s0 + len / 2).p, A.at(s0 + len).p] : [A.at(s0).p, A.at(s0 + len).p];
    sink.fine[b].push(pts);
  }
}
// strokes end to end along a line; o(x, y) says how long, how wide and how far apart they are there (or null: none)
function lay(sink, line, rnd, o) {
  const A = along(line); let s = rnd() * 14;
  while (s < A.len - 6) {
    const p = A.at(Math.min(A.len, s + 4)).p, st = o(p[0], p[1]);
    if (!st) { s += 6; continue; }
    const len = Math.min(st.len * (0.55 + 0.9 * rnd()), A.len - s);
    if (len > 5) put(sink, A, s, len, st.w * (0.85 + 0.3 * rnd()), (rnd() - 0.5) * 0.5);
    s += len + st.gap * (0.45 + 1.2 * rnd());
  }
}
const circle = (c, r, n0) => { const n = Math.max(36, Math.ceil(r * 1.6), n0 || 0); return Array.from({ length: n + 1 }, (_, i) => [c[0] + r * Math.cos(2 * PI * i / n), c[1] + r * Math.sin(2 * PI * i / n)]); };
const fineD = (lines) => L.pathData(lines, 0);
const boldD = (polys) => polys.map((p) => L.pathData([p], 0) + 'z').join('');

// ---- building it ------------------------------------------------------------------------------------------------------
function starry() {
  const rnd = L.rng(31);
  // the sky: fine lines everywhere; where the strokes grow bold, only every second, third or fourth line carries them
  const STEP = 0.0062, base = STEP * H;
  const vel = (x, y) => [sky(x, y + 1) - sky(x, y - 1), -(sky(x + 1, y) - sky(x - 1, y))];
  const gap = (x, y) => STEP / Math.max(1e-6, Math.hypot(sky(x + 1, y) - sky(x - 1, y), sky(x, y + 1) - sky(x, y - 1)) / 2);
  const skyLines = contours(sky, STEP, (x, y) => y < mountain(x) + 2 && !inRound(x, y, -3)).map((l) => { const m = Math.floor(l.length / 2), a = l[m], b = l[Math.min(l.length - 1, m + 1)], f = vel(a[0], a[1]); const r = (b[0] - a[0]) * f[0] + (b[1] - a[1]) * f[1] < 0 ? l.slice().reverse() : l; r.L = l.L; return r; });
  const skyOpen = (x, y) => y < mountain(x) - 5 && !inRound(x, y, 1) && !inCypress(x, y, 7);
  const skyS = [makeSink(), makeSink(), makeSink()];
  for (const l of skyLines) {
    const ph = ((l.L % 12) + 12) % 12, sink = skyS[Math.floor(rnd() * 3)];
    lay(sink, l, rnd, (x, y) => {
      if (!skyOpen(x, y)) return null;
      const b = boldness(x, y), m = b < 0.16 ? 1 : b < 0.38 ? 2 : b < 0.62 ? 3 : 4;
      if (ph % m) return null;
      const g = Math.min(base * 1.6, gap(x, y)) * m;
      return m === 1 ? { len: 10 + 8 * b + 4 * L.sn(x / 70, y / 70), gap: 4, w: 1.2 + 2.4 * b + 0.35 * L.sn(x / 40 + 9, y / 40) } : { len: 14 + 30 * b, gap: 3 + 3 * b, w: Math.min(0.8 * g, 2 + 8 * b) };
    });
  }
  // the swirls: spirals, fine in the eye, bolder toward the rim
  const swirlS = SWIRLS.map(([cx, cy, d, R], k) => {
    const sink = makeSink(), spacing = 8.5, turns = (R - 6) / spacing, n = Math.ceil(turns * 120), pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, th = -d * 2 * PI * turns * u + k * 1.9, r = 4 + (R - 4) * u; pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]); }
    lay(sink, pts.reverse(), rnd, (x, y) => { const r = Math.hypot(x - cx, y - cy) / R; return { len: 10 + 22 * r, gap: 2.5 + 2 * r, w: 1.3 + 5.4 * r * r }; });
    return sink;
  });
  // the stars: a core, and rings of strokes, boldest at the core and thinning outward
  const starS = STARS.map(([cx, cy, s], k) => { const sink = makeSink(); for (const [r, w] of HALOS[k].rings) lay(sink, circle([cx, cy], r, Math.ceil(r * 0.9)), rnd, () => ({ len: 7 + 2.4 * w, gap: 2 + 0.4 * w, w })); return sink; });
  // the moon: an orb of fine ink rings with the crescent in it, and paper rings round it, thinning outward
  const moonS = makeSink(); for (const [r, w] of MOONHALO.rings) lay(moonS, circle(MOON.c, r, Math.ceil(r * 0.9)), rnd, () => ({ len: 9 + 2.6 * w, gap: 2.2 + 0.4 * w, w }));
  const cr = MOON.r, cIn = [MOON.c[0] + 0.42 * cr, MOON.c[1] - 0.18 * cr], ri = cr * 0.86;
  const inCrescent = (x, y) => Math.hypot(x - MOON.c[0], y - MOON.c[1]) < cr + 3 && Math.hypot(x - cIn[0], y - cIn[1]) > ri - 3;
  const orbS = makeSink(); for (let r = cr + 8; r < MOON.orb - 3; r += 7.5) lay(orbS, circle(MOON.c, r), rnd, () => ({ len: 12, gap: 5, w: 1.3 + 1.2 * ((r - cr) / (MOON.orb - cr)) }));
  const P = (a, c = MOON.c, r = cr) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)], a0 = -1.95, a1 = 0.6;
  // the crescent: the moon's disc less a shadow disc set up and to the left, so it opens leftward
  const sc = [MOON.c[0] - 0.58 * cr, MOON.c[1] - 0.2 * cr], sr = cr * 0.84, outer = [], inner = [];
  for (let k = 0; k <= 360; k++) { const a = -PI + 2 * PI * k / 360, p = P(a); if (Math.hypot(p[0] - sc[0], p[1] - sc[1]) > sr) outer.push(p); }
  for (let k = 360; k >= 0; k--) { const a = -PI + 2 * PI * k / 360, p = [sc[0] + sr * Math.cos(a), sc[1] + sr * Math.sin(a)]; if (Math.hypot(p[0] - MOON.c[0], p[1] - MOON.c[1]) < cr) inner.push(p); }
  const rot = (arr) => { let j = 1; while (j < arr.length && Math.hypot(arr[j][0] - arr[j - 1][0], arr[j][1] - arr[j - 1][1]) < cr * 0.2) j++; return j < arr.length ? [...arr.slice(j), ...arr.slice(0, j)] : arr; };
  const moonD = L.pathData([[...rot(outer), ...rot(inner)]], 1) + 'z';
  // the mountains: paper, ink strokes along their ridges, finer further back
  const mtnS = makeSink(), mF = (x, y) => (y - mountain(x)) / H + 0.003 * L.sn(x / 120, y / 60);
  for (const l of contours(mF, 0.0068, (x, y) => y > mountain(x) - 2 && y < village(x) + 2)) lay(mtnS, l, rnd, (x, y) => (y > mountain(x) + 4 && y < village(x) - 3 && !inCypress(x, y, 7) ? { len: 16 + 14 * smooth(mountain(x), village(x), y), gap: 4, w: 1.4 + 2.6 * smooth(mountain(x), village(x), y) } : null));
  // the village: dark ground with fine paper strokes; paper houses with ink windows; a church whose spire reaches the sky
  const r2 = L.rng(5), houses = [];
  for (let x = 470; x < 1390;) { const w = 24 + r2() * 26, h = 15 + r2() * 15, roof = 8 + r2() * 8; if (Math.abs(x + w / 2 - 935) > 38) houses.push({ x, y: village(x + w / 2) + 10 + r2() * 26, w, h, roof, win: r2() < 0.75 }); x += w + 4 + r2() * 26; }
  const church = { x: 915, y: village(935) + 18, w: 40, h: 46, spire: H * 0.5 };
  const inHouse = (x, y) => houses.some((q) => x > q.x - 3 && x < q.x + q.w + 3 && y > q.y - q.h - q.roof - 3 && y < q.y + 3) || (x > church.x - 3 && x < church.x + church.w + 3 && y > church.y - church.h - 6 && y < church.y + 3);
  const vilS = makeSink(), vF = (x, y) => (y - village(x)) / H + 0.004 * L.sn(x / 80, y / 40);
  for (const l of contours(vF, 0.0085, (x, y) => y > village(x) - 2)) lay(vilS, l, rnd, (x, y) => (y > village(x) + 4 && !inCypress(x, y, 7) && !inHouse(x, y) && !nearFigure(x, y) ? { len: 14 + 10 * rnd(), gap: 6 + 6 * rnd(), w: 1.3 + 1.2 * smooth(village(x), H, y) } : null));
  // the cypress: black flames, paper strokes rising in them, bolder low down
  const cypS = makeSink(), cF = (x, y) => x + 20 * Math.sin(y / 27 + x / 46) + 8 * Math.sin(y / 11 + x / 20);
  for (const l of contours(cF, 13, (x, y) => inCypress(x, y, 0))) { const l2 = l[0][1] < l[l.length - 1][1] ? l.slice().reverse() : l; lay(cypS, l2, rnd, (x, y) => (inCypress(x, y, -3) ? { len: 10 + 14 * smooth(0, H, y), gap: 7 + 6 * rnd(), w: 1.3 + 2.4 * smooth(H * 0.1, H, y) } : null)); }
  const flameOutline = (f) => { const pts = [], [, base, top] = f; for (let i = 0; i <= 80; i++) { const y = base + (top - base) * i / 80, a = flameAt(f, y); if (a) pts.push([a.cx - a.w, y]); } for (let i = 80; i >= 0; i--) { const y = base + (top - base) * i / 80, a = flameAt(f, y); if (a) pts.push([a.cx + a.w, y]); } return L.simplify(pts, 0.3); };
  const flames = FLAMES.map(flameOutline);

  const sinkSvg = (sink, fill, cls = '', style = '') => `<g class="${cls}" style="${style}">` + (sink.bold.length ? `<path d="${boldD(sink.bold)}" fill="${fill}"/>` : '') +
    sink.fine.map((ls, i) => (ls.length ? `<path d="${fineD(ls)}" fill="none" stroke="${fill}" stroke-width="${BUCKETS[i]}" stroke-linecap="round"/>` : '')).join('') + '</g>';
  const spin = (c, dir, s) => `transform-origin:${c[0]}px ${c[1]}px;animation:${dir > 0 ? 'ccw' : 'cw'} ${s}s linear infinite`;
  const css = `.sh{animation:sh 4.6s ease-in-out infinite}@keyframes sh{0%,100%{opacity:1}50%{opacity:.82}}` +
    `@keyframes cw{to{transform:rotate(360deg)}}@keyframes ccw{to{transform:rotate(-360deg)}}` +
    `.br{transform-box:fill-box;transform-origin:center;animation:br 5s ease-in-out infinite}@keyframes br{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}` +
    `.cy{transform-origin:205px ${H}px;animation:cy 9s ease-in-out infinite alternate}@keyframes cy{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}`;
  return () => {
    const house = (q) => `<path d="M${L.n1(q.x)} ${L.n1(q.y)}v${L.n1(-q.h)}l${L.n1(q.w / 2)} ${L.n1(-q.roof)}l${L.n1(q.w / 2)} ${L.n1(q.roof)}v${L.n1(q.h)}z"/>` + (q.win ? `<rect x="${L.n1(q.x + q.w * 0.3)}" y="${L.n1(q.y - q.h * 0.62)}" width="4.5" height="5.5" fill="${INK}" stroke="none"/>` + (q.w > 36 ? `<rect x="${L.n1(q.x + q.w * 0.62)}" y="${L.n1(q.y - q.h * 0.62)}" width="4.5" height="5.5" fill="${INK}" stroke="none"/>` : '') : '');
    const c = church;
    const churchD = `<path d="M${c.x} ${L.n1(c.y)}v${-c.h}h${c.w}v${c.h}z"/><path d="M${c.x + 8} ${L.n1(c.y - c.h)}L${c.x + 20} ${L.n1(c.spire)}L${c.x + 32} ${L.n1(c.y - c.h)}z"/><rect x="${c.x + 16}" y="${L.n1(c.y - c.h * 0.65)}" width="8" height="12" fill="${INK}" stroke="none"/>`;
    const body = `<rect width="${W}" height="${H}" fill="${INK}"/>` +
      skyS.map((s, i) => sinkSvg(s, PAPER, 'sh', `animation-delay:${(-1.5 * i).toFixed(1)}s`)).join('') +
      SWIRLS.map(([cx, cy, d], k) => sinkSvg(swirlS[k], PAPER, '', spin([cx, cy], d, 80 + 30 * k))).join('') +
      STARS.map(([cx, cy], k) => `<g class="br" style="animation-delay:${(-k * 1.31 % 5).toFixed(2)}s">${sinkSvg(starS[k], PAPER)}<circle cx="${cx}" cy="${cy}" r="${L.n1(HALOS[k].core)}" fill="${PAPER}"/></g>`).join('') +
      `<g class="br">${sinkSvg(moonS, PAPER)}</g><circle cx="${MOON.c[0]}" cy="${MOON.c[1]}" r="${MOON.orb}" fill="${PAPER}"/>${sinkSvg(orbS, INK, '', spin(MOON.c, 1, 150))}<circle cx="${MOON.c[0]}" cy="${MOON.c[1]}" r="${cr}" fill="${INK}"/><path d="${moonD}" fill="${PAPER}"/>` +
      `<path d="${L.pathData([[[-5, H + 5], ...Array.from({ length: 330 }, (_, i) => [i * 5 - 5, mountain(i * 5 - 5)]), [W + 5, H + 5]]], 0)}z" fill="${PAPER}"/>${sinkSvg(mtnS, INK)}` +
      `<g fill="${PAPER}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">${churchD}</g>` +
      `<path d="${L.pathData([[[-5, H + 5], ...Array.from({ length: 330 }, (_, i) => [i * 5 - 5, village(i * 5 - 5)]), [W + 5, H + 5]]], 0)}z" fill="${INK}"/>${sinkSvg(vilS, PAPER)}` +
      `<g fill="${PAPER}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">${houses.map(house).join('')}</g>` +
      `<g class="cy">${flames.map((f) => `<path d="${L.pathData([f], 0)}z" fill="${INK}" stroke="${PAPER}" stroke-width="5"/>`).join('')}${flames.map((f) => `<path d="${L.pathData([f], 0)}z" fill="${INK}"/>`).join('')}${sinkSvg(cypS, PAPER)}</g>` +
      FIG.draw('watch', { x: FIG_AT[0], y: FIG_AT[1], size: FIGS, fg: PAPER, mirror: true });
    return L.svg({ w: W, h: H, css, title: 'Starry Night: the night sky in brush strokes, fine far from the stars and bold round them, a great swirl, a crescent moon; mountains, a village and a church, a black cypress, and a figure watching', body, extra: ' preserveAspectRatio="xMidYMid slice"' });
  };
}

module.exports = { starry };
