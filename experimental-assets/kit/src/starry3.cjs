// STARRY NIGHT III: Starry Night II's whirlpools (single spirals, rolling into an eye) with the stream running through
// them. The wind is one ribbon of lines from the left. At the great whirlpool it parts: the upper half arches over the
// top and rolls into the spiral; the lower half runs down its left side and passes underneath, heading right. At the
// second whirlpool that branch parts again: its lower lines roll into the spiral from below, the upper ones go up its
// left side, over the top, and out to the right. The stream has no hard edge where it meets the sky: its strokes thin,
// thin out and fade there, and the sky's strokes beside it are a little bolder, falling away. Ink and paper at once.
const L = require('./lib.cjs'), FIG = require('./figure.cjs'), { streamlines } = require('./flow.cjs');
const W = 1600, H = 900, CELL = 3, PI = Math.PI, DEG = PI / 180;
const { PAPER, INK } = L;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const leftOf = (t) => [t[1], -t[0]];                      // the left of travel, in screen coordinates

// ---- the scene ------------------------------------------------------------------------------------------------------
const mountain = (x) => H * 0.845 - 46 * Math.max(0, Math.sin(x / 170 + 0.2)) * smooth(500, 900, x) - 14 * Math.sin(x / 61 + 1) - 6 * Math.sin(x / 23) + 22 * smooth(600, 0, x);
const MOON = { c: [1440, 142], r: 60 };
const STARS = [[92, 112, 0.9], [330, 78, 0.75], [470, 52, 0.6], [905, 92, 0.8], [1045, 58, 1.0], [1255, 240, 0.7], [610, 650, 0.6], [380, 620, 0.55], [52, 252, 0.6], [1545, 610, 0.55], [1280, 62, 0.45]];
// a star's halo: rings of strokes, boldest next to the core, thinning outward
function halo(s) {
  const core = 6 + 7 * s, n = Math.round(3 + 2.5 * s), rings = []; let r = core + 2.5;
  for (let k = 0; k < n; k++) { const w = (1.8 + 5.2 * s) * Math.pow(1 - k / n, 0.9) + 1.2; r += w / 2; rings.push([r, w]); r += w / 2 + 2 + 0.3 * w; }
  return { core, rings, R: r + 2 };
}
const HALOS = STARS.map(([, , s]) => halo(s));
const MOONHALO = (() => { const rings = []; let r = MOON.r + 10; for (let k = 0; k < 6; k++) { const w = 7.5 * Math.pow(1 - k / 6, 0.9) + 1.3; r += w / 2; rings.push([r, w]); r += w / 2 + 2.4 + 0.35 * w; } return { rings, R: r + 2 }; })();
const FLAMES = [[200, H + 30, H * 0.04, 90], [278, H + 30, H * 0.26, 56], [126, H + 30, H * 0.42, 48]];
const flameAt = ([x0, base, top, w0], y) => { const t = (base - y) / (base - top); if (t < 0 || t > 1) return null; return { cx: x0 + 20 * Math.sin(t * 3.3 + x0) * t, w: w0 * Math.pow(1 - t, 0.6) * (1 + 0.16 * Math.sin(t * 21 + x0) + 0.07 * Math.sin(t * 47)) }; };
const inCypress = (x, y, pad = 0) => FLAMES.some((f) => { const a = flameAt(f, y); return a && Math.abs(x - a.cx) < a.w + pad; });
const FIGX = (() => { let bx = 1100, by = 1e9; for (let x = 1050; x <= 1420; x += 2) { const y = mountain(x); if (y < by) { by = y; bx = x; } } return bx; })(), FIGS = 100;
const nearFigure = (x, y) => Math.hypot((x - FIGX) / 46, (y - (mountain(FIGX) - FIGS * 0.5)) / 72) < 1;

// ---- the stream: one ribbon of lines, parting round the whirlpools --------------------------------------------------
const D = 7, NL = 24;
// each whirlpool: centre; the radius of its spiral's outer turn where the stream meets it; its turn (+1 clockwise on screen);
// how many lines roll into it; the angle they meet it at; and, for the lines that go round it instead, the angles that run
// from and to, the other way round
const VA = { c: [700, 330], R: 140, s: 1, k: 10, a0: 220 * DEG, h0: 120 * DEG, h1: 86 * DEG };
const VB = { c: [1120, 495], R: 88, s: -1, k: 7, a0: 105 * DEG, h0: 225 * DEG, h1: 295 * DEG };
const VORT = [VA, VB];
const START = { p: [-90, 500], t: norm([1, -0.28]) }, SPLIT = { p: [290, 414], t: norm([1, -0.15]) }, END = { p: [1720, 440], t: norm([1, 0.04]) };
const ang = (a) => [Math.cos(a), Math.sin(a)], perp = (a) => [-Math.sin(a), Math.cos(a)];
// the spiral's outermost line, at each angle round it
const outerR = (V, th) => { const w = V.k * D, dd = (((th - V.a0) * V.s) % (2 * PI) + 2 * PI) % (2 * PI); return V.R + (V.k - 1) * D - w * dd / (2 * PI); };
function buildStream() {
  const lines = Array.from({ length: NL }, () => []), offs = (m) => Array.from({ length: m }, (_, p) => (p - (m - 1) / 2) * D);
  // a bundle of lines along a cubic from P0 to P3 (tangents T0, T3), each at its offset to the left of travel; any
  // difference from the exact points it must start and end at is eased away over the first and last quarter
  const bundle = (P0, T0, P3, T3, m, startPts, endPts) => {
    const Lc = 0.42 * Math.hypot(P3[0] - P0[0], P3[1] - P0[1]), P1 = add(P0, mul(T0, Lc)), P2 = sub(P3, mul(T3, Lc)), o = offs(m);
    const Bz = (u) => { const v = 1 - u; return [0, 1].map((i) => v * v * v * P0[i] + 3 * v * v * u * P1[i] + 3 * v * u * u * P2[i] + u * u * u * P3[i]); };
    const dB = (u) => { const v = 1 - u; return norm([0, 1].map((i) => 3 * v * v * (P1[i] - P0[i]) + 6 * v * u * (P2[i] - P1[i]) + 3 * u * u * (P3[i] - P2[i]))); };
    const at0 = o.map((oo) => add(P0, mul(leftOf(dB(0)), oo))), at1 = o.map((oo) => add(P3, mul(leftOf(dB(1)), oo)));
    const e0 = o.map((_, p) => (startPts ? sub(startPts[p], at0[p]) : [0, 0])), e1 = o.map((_, p) => (endPts ? sub(endPts[p], at1[p]) : [0, 0]));
    const n = Math.ceil(Lc * 2.6 / 3), out = o.map(() => []);
    for (let i = 1; i <= n; i++) { const u = i / n, B = Bz(u), N = leftOf(dB(u)), a = 1 - smooth(0, 0.25, u), b = smooth(0.75, 1, u); o.forEach((oo, p) => out[p].push(add(add(B, mul(N, oo)), add(mul(e0[p], a), mul(e1[p], b))))); }
    return out;
  };
  const centre = (pts) => mul(pts.reduce((q, p) => add(q, p), [0, 0]), 1 / pts.length);
  const heading = (l) => norm(sub(l[l.length - 1], l[l.length - 2]));
  // the lines that roll into a spiral: they meet it at a0 and circle in, closing in by their own width each turn
  const roll = (V, group, from) => {
    const m = group.length, Rc = V.R + (m - 1) * D / 2, u0 = ang(V.a0), Tc = mul(perp(V.a0), V.s), Pc = add(V.c, mul(u0, Rc));
    const endPts = offs(m).map((oo) => add(Pc, mul(leftOf(Tc), oo)));
    const seg = bundle(from.p, from.t, Pc, Tc, m, from.at, endPts); group.forEach((li, p) => lines[li].push(...seg[p]));
    const w = V.k * D;
    group.forEach((li, p) => { const rho0 = Math.hypot(endPts[p][0] - V.c[0], endPts[p][1] - V.c[1]), dEnd = (rho0 - 4) * 2 * PI / w;
      for (let d = 3 / rho0; d < dEnd; d += 3 / Math.max(6, rho0 - w * d / (2 * PI))) { const r = rho0 - w * d / (2 * PI), a = V.a0 + V.s * d; lines[li].push(add(V.c, mul(ang(a), r))); } });
  };
  // the lines that go round a spiral the other way, just outside its outer turn, from h0 to h1
  const round = (V, group, from) => {
    const m = group.length, dir = -V.s, gap = 9, th = (t) => V.h0 + dir * t, span = Math.abs(V.h1 - V.h0);
    // which of them is nearest the spiral: the side of the stream that faces it as it comes round
    const rad = (p, t) => { const a = th(t), T = mul(perp(a), dir), inward = leftOf(T)[0] * -Math.cos(a) + leftOf(T)[1] * -Math.sin(a) > 0; const i = inward ? (m - 1 - p) : p; return outerR(V, a) + gap + i * D; };
    const pt = (p, t) => add(V.c, mul(ang(th(t)), rad(p, t)));
    const startPts = group.map((_, p) => pt(p, 0)), cen0 = centre(startPts), T0 = norm(sub(centre(group.map((_, p) => pt(p, 0.01))), cen0));
    const seg = bundle(from.p, from.t, cen0, T0, m, from.at, startPts); group.forEach((li, p) => lines[li].push(...seg[p]));
    group.forEach((li, p) => { for (let t = 0.012; t < span; t += 3 / rad(p, t)) lines[li].push(pt(p, t)); lines[li].push(pt(p, span)); });
    const rel = group.map((li) => lines[li][lines[li].length - 1]), relC = centre(rel), T1 = norm(sub(relC, centre(group.map((_, p) => pt(p, span - 0.01)))));
    return { p: relC, t: T1, at: rel };
  };
  // in from the left, all together, as far as the parting
  const all = Array.from({ length: NL }, (_, i) => i), first = bundle(START.p, START.t, SPLIT.p, SPLIT.t, NL, null, null);
  all.forEach((li, p) => lines[li].push(...first[p]));
  const fromSplit = (group) => { const at = group.map((li) => lines[li][lines[li].length - 1]); return { p: centre(at), t: SPLIT.t, at }; };
  // the great whirlpool: the upper lines roll in, the lower ones go down its left side and underneath
  const upper = all.slice(NL - VA.k), lower = all.slice(0, NL - VA.k);
  roll(VA, upper, fromSplit(upper));
  const after = round(VA, lower, fromSplit(lower));
  // the second: the branch's lower lines roll in from below, the upper ones go up its left side, over, and out
  const bRoll = lower.slice(0, VB.k), bOver = lower.slice(VB.k);
  const sub2 = (grp) => { const at = grp.map((li) => lines[li][lines[li].length - 1]); return { p: centre(at), t: after.t, at }; };
  roll(VB, bRoll, sub2(bRoll));
  const out = round(VB, bOver, sub2(bOver));
  const m = bOver.length, endPts = offs(m).map((oo) => add(END.p, mul(leftOf(END.t), oo)));
  const seg = bundle(out.p, out.t, END.p, END.t, m, out.at, endPts); bOver.forEach((li, p) => lines[li].push(...seg[p]));
  return lines;
}

// ---- contours (for the mountains and the cypress) ---------------------------------------------------------------------
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
      if (hits.length === 4) { const mm = (a + b + c + d) / 4; pairs = (mm < L0) === (a < L0) ? [[hits[0], hits[3]], [hits[1], hits[2]]] : [[hits[0], hits[1]], [hits[2], hits[3]]]; }
      let E = lvl.get(L0); if (!E) { E = new Map(); lvl.set(L0, E); }
      for (const [[ka, pa], [kb, pb]] of pairs) { if (!E.has(ka)) E.set(ka, { p: pa, nb: [] }); if (!E.has(kb)) E.set(kb, { p: pb, nb: [] }); E.get(ka).nb.push(kb); E.get(kb).nb.push(ka); }
    }
  }
  const lines = [];
  for (const E of lvl.values()) {
    const seen = new Set();
    const walk = (k0) => { const out = [E.get(k0).p]; seen.add(k0); let prev = null, cur = k0; for (;;) { const nxt = E.get(cur).nb.find((n) => n !== prev && !seen.has(n)); if (!nxt) break; seen.add(nxt); out.push(E.get(nxt).p); prev = cur; cur = nxt; } return out; };
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
const PROFILE = [[0, 0.7], [0.18, 1], [0.45, 0.88], [0.72, 0.55], [0.9, 0.22], [1, 0]];
const BUCKETS = [1.15, 1.5, 2, 2.6, 3.2];
const makeSink = () => ({ bold: [], fine: BUCKETS.map(() => []) });
function put(sink, A, s0, len, wd, jit) {
  if (wd > 3.4) {
    const left = [], right = [];
    for (const [u, k] of PROFILE) { const { p, t } = A.at(s0 + len * u), n = [-t[1], t[0]], w = wd * k / 2 + jit * (u > 0 && u < 1 ? 1 : 0); left.push([p[0] + n[0] * w, p[1] + n[1] * w]); right.push([p[0] - n[0] * w, p[1] - n[1] * w]); }
    const s = A.at(s0); sink.bold.push([[s.p[0] - s.t[0] * wd * 0.3, s.p[1] - s.t[1] * wd * 0.3], ...left, ...right.slice(0, -1).reverse()]);
  } else {
    let b = 0; for (let i = 1; i < BUCKETS.length; i++) if (Math.abs(BUCKETS[i] - wd) < Math.abs(BUCKETS[b] - wd)) b = i;
    sink.fine[b].push(len > 9 ? [A.at(s0).p, A.at(s0 + len / 2).p, A.at(s0 + len).p] : [A.at(s0).p, A.at(s0 + len).p]);
  }
}
function lay(sink, line, rnd, o) {
  const A = along(line); let s = rnd() * 12;
  while (s < A.len - 5) {
    const p = A.at(Math.min(A.len, s + 4)).p, st = o(p[0], p[1]);
    if (!st) { s += 4; continue; }
    if (st.skip) { s += st.skip; continue; }
    const len = Math.min(st.len * (0.6 + 0.8 * rnd()), A.len - s);
    if (len > 4.5) put(st.sink || sink, A, s, len, st.w * (0.88 + 0.24 * rnd()), (rnd() - 0.5) * 0.5);
    s += len + st.gap * (0.5 + rnd());
  }
}
const circle = (c, r) => { const n = Math.max(36, Math.ceil(r * 1.6)); return Array.from({ length: n + 1 }, (_, i) => [c[0] + r * Math.cos(2 * PI * i / n), c[1] + r * Math.sin(2 * PI * i / n)]); };
const fineD = (lines) => L.pathData(lines, 0);
const boldD = (polys) => polys.map((p) => L.pathData([p], 0) + 'z').join('');

// ---- building it ------------------------------------------------------------------------------------------------------
function starry3() {
  const rnd = L.rng(53), stream = buildStream();
  // where the stream is: the distance to its nearest line and that line's heading, on a 4 px grid
  const G = 4, gw = Math.ceil(W / G) + 1, gh = Math.ceil(H / G) + 1, gd = new Float32Array(gw * gh).fill(1e9), gx = new Float32Array(gw * gh), gy = new Float32Array(gw * gh), RAD = 60;
  for (const l of stream) for (let i = 1; i < l.length; i++) {
    const [x, y] = l[i], t = norm(sub(l[i], l[i - 1])), i0 = Math.max(0, Math.floor((x - RAD) / G)), i1 = Math.min(gw - 1, Math.ceil((x + RAD) / G)), j0 = Math.max(0, Math.floor((y - RAD) / G)), j1 = Math.min(gh - 1, Math.ceil((y + RAD) / G));
    for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) { const d = Math.hypot(ii * G - x, j * G - y), k = j * gw + ii; if (d < gd[k]) { gd[k] = d; gx[k] = t[0]; gy[k] = t[1]; } }
  }
  const inS = new Uint8Array(gw * gh); for (let k = 0; k < gw * gh; k++) inS[k] = gd[k] < 5.5 ? 1 : 0;
  const edgeD = new Float32Array(gw * gh).fill(1e9); { const q = []; for (let k = 0; k < gw * gh; k++) if (!inS[k]) { edgeD[k] = 0; q.push(k); } for (let qi = 0; qi < q.length; qi++) { const k = q[qi], x = k % gw, y = (k / gw) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; const kk = yy * gw + xx; if (edgeD[kk] > edgeD[k] + G) { edgeD[kk] = edgeD[k] + G; q.push(kk); } } } }
  const inward = (x, y) => edgeD[Math.max(0, Math.min(gh - 1, Math.round(y / G))) * gw + Math.max(0, Math.min(gw - 1, Math.round(x / G)))];
  const look = (x, y) => { const ii = Math.max(0, Math.min(gw - 1, Math.round(x / G))), j = Math.max(0, Math.min(gh - 1, Math.round(y / G))), k = j * gw + ii; return { d: gd[k], t: [gx[k], gy[k]] }; };
  // the wind everywhere else: a slow drift with a long wave in it, round the stars, the moon and the whirlpools like water
  // round stones; near the stream, the stream's own heading
  const stones = [...STARS.map(([x, y], k) => [x, y, HALOS[k].R + 3, 0]), [MOON.c[0], MOON.c[1], MOONHALO.R + 4, 0], ...VORT.map((V) => [V.c[0], V.c[1], V.R + (V.k - 1) * D + 4, 0])];
  const wind = (x, y) => {
    let vx = 1, vy = 0.16 * Math.sin(x / 260 + 1.2) + 0.14 * L.sn(x / 300, y / 300); [vx, vy] = norm([vx, vy]);
    for (const [cx, cy, R, dir] of stones) {
      const dx = x - cx, dy = y - cy, r2 = Math.max(dx * dx + dy * dy, R * R * 0.8); if (r2 > (R * 5) ** 2) continue;
      const c = vx, s = vy, xp = dx * c + dy * s, yp = -dx * s + dy * c, r4 = r2 * r2, pu = -R * R * (xp * xp - yp * yp) / r4, pv = -2 * R * R * xp * yp / r4;
      vx += pu * c - pv * s; vy += pu * s + pv * c;
      if (dir) { const r = Math.sqrt(r2); vx += dir * (-dy / r) * 0.9 * R / r; vy += dir * (dx / r) * 0.9 * R / r; }
    }
    const g = look(x, y);
    if (g.d < RAD) { const wR = Math.exp(-((g.d / 30) ** 2)); [vx, vy] = norm([vx, vy]); vx = wR * g.t[0] + (1 - wR) * vx; vy = wR * g.t[1] + (1 - wR) * vy; }
    return [vx, vy];
  };
  const angle = (x, y) => { const v = wind(x, y); return Math.atan2(v[1], v[0]); };
  // how bold the open sky's strokes are: round each star bold, falling away; brighter along the stream's edges; fine elsewhere
  const boldness = (x, y) => {
    let b = 0.15 * Math.exp(-Math.max(0, look(x, y).d - 4) / 22);
    STARS.forEach(([cx, cy, s], k) => { const d = Math.hypot(x - cx, y - cy) - HALOS[k].R; b = Math.max(b, (0.35 + 0.6 * s) * Math.exp(-Math.max(0, d) / (24 + 24 * s))); });
    { const d = Math.hypot(x - MOON.c[0], y - MOON.c[1]) - MOONHALO.R; b = Math.max(b, 0.95 * Math.exp(-Math.max(0, d) / 62)); }
    return Math.min(1, b);
  };
  const open = (x, y) => x > -8 && x < W + 8 && y > -8 && y < mountain(x) - 6 && !inCypress(x, y, 7) && !nearFigure(x, y);

  // the stream's strokes: bands of bold and middling across it; finer into each whirlpool's eye
  // its strokes in patches of different strength (a few levels of opacity, chosen by a slow noise), so it is not one even mass
  const OPAC = [0.42, 0.56, 0.7, 0.84, 1], streamS = OPAC.map(() => makeSink());
  const patch = (x, y) => { const n = 0.65 * L.sn(x / 120 + 3.1, y / 120 - 1.7) + 0.35 * L.sn(x / 46 - 5, y / 46 + 8.3); return Math.max(0, Math.min(OPAC.length - 1, Math.round((n * 0.5 + 0.5) * 1.25 * (OPAC.length - 1) + 0.6))); };
  stream.forEach((l, li) => {
    const band = 0.5 + 0.5 * Math.sin(li * 0.95 + 0.4);
    lay(streamS[4], l, rnd, (x, y) => {
      if (!open(x, y)) return null;
      const edge = smooth(1, 11, inward(x, y));
      if (rnd() > 0.6 + 0.4 * edge) return { skip: 9 + 12 * rnd() };
      const eye = Math.min(1, ...VORT.map((V) => Math.pow(Math.min(1, Math.hypot(x - V.c[0], y - V.c[1]) / 70), 0.7)));
      return { len: (18 + 16 * band) * (0.5 + 0.5 * eye), gap: 2.8 + 2.4 * rnd(), w: Math.max(1.1, (3.2 + 3.6 * band) * eye * (0.5 + 0.5 * edge)), sink: streamS[Math.max(0, Math.min(4, patch(x, y) + 1) - Math.round((1 - edge) * 2))] };
    });
  });
  // the open sky: fine lines close together, bold ones further apart where the strokes grow bold
  const stops = [...STARS.map(([x, y], k) => [x, y, HALOS[k].R]), [MOON.c[0], MOON.c[1], MOONHALO.R]];
  const orient = (l) => { const mm = Math.floor(l.length / 2), a = l[Math.max(0, mm - 1)], b = l[Math.min(l.length - 1, mm + 1)], v = wind(a[0], a[1]); return (b[0] - a[0]) * v[0] + (b[1] - a[1]) * v[1] < 0 ? l.slice().reverse() : l; };
  const skyH = H * 0.9;
  const fineLines = streamlines({ w: W, h: skyH, angle, dsep: 6, dtest: 3, step: 1.5, margin: 10, stops, minLen: 10, seed: [40, 600] }).map(orient);
  const boldLines = streamlines({ w: W, h: skyH, angle, dsep: 13, dtest: 6.5, step: 2, margin: 10, stops, minLen: 26, seed: [40, 600] }).map(orient);
  const skyOpen = (x, y) => open(x, y) && look(x, y).d > 4.5;
  const skyS = [makeSink(), makeSink(), makeSink()];
  for (const l of fineLines) lay(skyS[Math.floor(rnd() * 3)], l, rnd, (x, y) => { if (!skyOpen(x, y)) return null; const b = boldness(x, y); if (b > 0.36 || (b > 0.28 && rnd() < (b - 0.28) / 0.08)) return null; return { len: 8 + 9 * b + 3 * L.sn(x / 70, y / 70), gap: 5.5, w: 1.05 + 2.4 * b + 0.2 * L.sn(x / 40 + 9, y / 40) }; });
  for (const l of boldLines) lay(skyS[Math.floor(rnd() * 3)], l, rnd, (x, y) => { if (!skyOpen(x, y)) return null; const b = boldness(x, y); if (b < 0.28 || (b < 0.36 && rnd() > (b - 0.28) / 0.08)) return null; return { len: 14 + 28 * b, gap: 3 + 3 * b, w: Math.min(10, 2.2 + 8.5 * b) }; });
  // the stars: a core and rings of strokes, boldest at the core and thinning outward
  const starS = STARS.map(([cx, cy], k) => { const sink = makeSink(); for (const [r, w] of HALOS[k].rings) lay(sink, circle([cx, cy], r), rnd, () => ({ len: 7 + 2.4 * w, gap: 2 + 0.4 * w, w })); return sink; });
  // the moon: a crescent, the rest of its disc in fine rings (the dark side lit a little), and rings of glow round it
  const moonS = makeSink(); for (const [r, w] of MOONHALO.rings) lay(moonS, circle(MOON.c, r), rnd, () => ({ len: 10 + 2.6 * w, gap: 2.2 + 0.4 * w, w }));
  const cr = MOON.r, sc = [MOON.c[0] + 0.5 * cr, MOON.c[1] - 0.32 * cr], sr = cr * 0.84;
  const inShadow = (x, y) => Math.hypot(x - sc[0], y - sc[1]) < sr - 3 && Math.hypot(x - MOON.c[0], y - MOON.c[1]) < cr - 3;
  const darkS = makeSink(); for (let r = 6; r < cr; r += 6.5) lay(darkS, circle(MOON.c, r), rnd, (x, y) => (inShadow(x, y) ? { len: 9, gap: 4, w: 1.2 } : null));
  const outer = [], inner = [], P = (a, c, r) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  for (let k = 0; k <= 360; k++) { const a = -PI + 2 * PI * k / 360, p = P(a, MOON.c, cr); if (Math.hypot(p[0] - sc[0], p[1] - sc[1]) > sr) outer.push(p); }
  for (let k = 360; k >= 0; k--) { const a = -PI + 2 * PI * k / 360, p = P(a, sc, sr); if (Math.hypot(p[0] - MOON.c[0], p[1] - MOON.c[1]) < cr) inner.push(p); }
  const rotA = (arr) => { let j = 1; while (j < arr.length && Math.hypot(arr[j][0] - arr[j - 1][0], arr[j][1] - arr[j - 1][1]) < cr * 0.2) j++; return j < arr.length ? [...arr.slice(j), ...arr.slice(0, j)] : arr; };
  const moonD = L.pathData([[...rotA(outer), ...rotA(inner)]], 1) + 'z';
  // the mountains: paper, ink strokes along their ridges
  const mtnS = makeSink(), mF = (x, y) => (y - mountain(x)) / H + 0.003 * L.sn(x / 120, y / 60);
  for (const l of contours(mF, 0.0075, (x, y) => y > mountain(x) - 2)) lay(mtnS, l, rnd, (x, y) => (y > mountain(x) + 4 && !inCypress(x, y, 7) && !nearFigure(x, y) ? { len: 14 + 16 * smooth(mountain(x), H, y), gap: 4.5, w: 1.3 + 2.6 * smooth(mountain(x), H, y) } : null));
  // the cypress: black flames, paper strokes rising in them
  const cypS = makeSink(), cF = (x, y) => x + 20 * Math.sin(y / 27 + x / 46) + 8 * Math.sin(y / 11 + x / 20);
  for (const l of contours(cF, 13, (x, y) => inCypress(x, y, 0))) { const l2 = l[0][1] < l[l.length - 1][1] ? l.slice().reverse() : l; lay(cypS, l2, rnd, (x, y) => (inCypress(x, y, -3) ? { len: 10 + 14 * smooth(0, H, y), gap: 7 + 6 * rnd(), w: 1.3 + 2.4 * smooth(H * 0.1, H, y) } : null)); }
  const flames = FLAMES.map((f) => { const pts = [], [, base, top] = f; for (let i = 0; i <= 80; i++) { const y = base + (top - base) * i / 80, a = flameAt(f, y); if (a) pts.push([a.cx - a.w, y]); } for (let i = 80; i >= 0; i--) { const y = base + (top - base) * i / 80, a = flameAt(f, y); if (a) pts.push([a.cx + a.w, y]); } return L.simplify(pts, 0.3); });

  const sinkSvg = (sink, fill, cls = '', style = '') => `<g class="${cls}" style="${style}">` + (sink.bold.length ? `<path d="${boldD(sink.bold)}" fill="${fill}"/>` : '') +
    sink.fine.map((ls, i) => (ls.length ? `<path d="${fineD(ls)}" fill="none" stroke="${fill}" stroke-width="${BUCKETS[i]}" stroke-linecap="round"/>` : '')).join('') + '</g>';
  const css = `.sh{animation:sh 4.6s ease-in-out infinite}@keyframes sh{0%,100%{opacity:1}50%{opacity:.84}}` +
    `.br{transform-box:fill-box;transform-origin:center;animation:br 5s ease-in-out infinite}@keyframes br{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}` +
    `.gl{animation:gl 6s ease-in-out infinite}@keyframes gl{0%,100%{opacity:1}50%{opacity:.75}}` +
    `.cy{transform-origin:200px ${H}px;animation:cy 9s ease-in-out infinite alternate}@keyframes cy{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}`;
  return () => {
    const ridge = [[-5, H + 5], ...Array.from({ length: 330 }, (_, i) => [i * 5 - 5, mountain(i * 5 - 5)]), [W + 5, H + 5]];
    const body = `<rect width="${W}" height="${H}" fill="${INK}"/>` +
      skyS.map((s, i) => sinkSvg(s, PAPER, 'sh', `animation-delay:${(-1.5 * i).toFixed(1)}s`)).join('') +
      streamS.map((s, i) => `<g opacity="${OPAC[i]}">${sinkSvg(s, PAPER, 'sh', `animation-delay:${(-0.8 - 1.1 * i).toFixed(1)}s`)}</g>`).join('') +
      STARS.map(([cx, cy], k) => `<g class="br" style="animation-delay:${(-k * 1.31 % 5).toFixed(2)}s">${sinkSvg(starS[k], PAPER)}<circle cx="${cx}" cy="${cy}" r="${L.n1(HALOS[k].core)}" fill="${PAPER}"/></g>`).join('') +
      `<g class="gl">${sinkSvg(moonS, PAPER)}</g><circle cx="${MOON.c[0]}" cy="${MOON.c[1]}" r="${cr + 4}" fill="${INK}"/>${sinkSvg(darkS, PAPER)}<path d="${moonD}" fill="${PAPER}"/>` +
      `<path d="${L.pathData([ridge], 0)}z" fill="${PAPER}"/>${sinkSvg(mtnS, INK)}` +
      `<g class="cy">${flames.map((f) => `<path d="${L.pathData([f], 0)}z" fill="${INK}" stroke="${PAPER}" stroke-width="5"/>`).join('')}${flames.map((f) => `<path d="${L.pathData([f], 0)}z" fill="${INK}"/>`).join('')}${sinkSvg(cypS, PAPER)}</g>` +
      FIG.draw('watch', { x: FIGX, y: mountain(FIGX) + 2, size: FIGS, fg: PAPER, mirror: true });
    return L.svg({ w: W, h: H, css, title: 'Starry Night III: one stream of wind parting round two whirlpools, half of it rolling into each and the rest flowing on; stars as lights it flows round; a big crescent moon; a figure on the mountains watching', body, extra: ' preserveAspectRatio="xMidYMid slice"' });
  };
}

module.exports = { starry3 };
