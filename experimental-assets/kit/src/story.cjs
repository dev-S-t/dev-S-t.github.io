// Figure stories: the stick man and the outer circle, each ending in the mark (or starting from it). The circle is
// a different thing in each: a ship, a gap out of reach, a case, a meteor, a bubble, a wheel, a small planet.
// Rules the stories keep: he only ever gets into the circle through its opening, and the mark forms the way arms
// move: hands up, reaching for the top, then bending over his head into the middle circle, the right hand reaching
// over toward the opening and stopping short of it.
// How it works: a story is a list of keys (a pose of the figure, the circle's place, what is visible) at given
// times. Every frame between keys is worked out here and written into the SVG as discrete SMIL values, 12 frames a
// second with a little hand-set wobble (stop motion). The last pose is the mark's own geometry, and the
// brush-drawn mark fades in over it.
const path = require('path');
const L = require('./lib.cjs'), FIG = require('./figure.cjs');
const G = require(path.resolve(__dirname, '../../../tools/logo/logo-gen.cjs'));

const W = 480, H = 320, FPS = 12;
const S = 2.3, M = [240, 150];                         // mark units -> stage px, and where the mark's centre lands
const mk = ([x, y]) => [M[0] + (x - 50) * S, M[1] + (y - 50) * S];
const GROUND = M[1] + 46.9 * S;                        // the circle's outer edge rests on it
const FEET = mk([50, 92])[1];                          // where he stands inside the circle
const SIZE = 145;                                      // his height in px; his head then matches the mark's
const HEAD_R = 0.25 * SIZE, NS = 5, NA = 21, NL = 9;   // head radius, and points per spine / arm / leg
const RING_R = 44 * S, RING_OUT = (44 + 2.9) * S, RING_IN = (44 - 2.9) * S;
const GAP = -120;                                      // the opening's centre, degrees (11 o'clock)

// ---------- the figure as parts that can be blended ----------
function resample(pts, n) {
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = d[d.length - 1] || 1e-6, out = [];
  for (let k = 0; k < n; k++) {
    const t = total * k / (n - 1); let i = 1; while (i < d.length - 1 && d[i] < t) i++;
    const a = pts[i - 1], b = pts[i], u = Math.min(1, Math.max(0, (t - d[i - 1]) / ((d[i] - d[i - 1]) || 1e-6)));
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}
// a pose in the figure's own units (figure.cjs: feet on y = 0, height 1), placed with its feet at (fx, fy)
function rig(p, fx, fy, mirror = false) {
  const sx = mirror ? -1 : 1, Q = ([a, b]) => [fx + a * SIZE * sx, fy + b * SIZE];
  const neck = Q(p.neck), hip = Q(p.hip), dx = neck[0] - hip[0], dy = neck[1] - hip[1], l = Math.hypot(dx, dy);
  const sh = [neck[0] + (hip[0] - neck[0]) * 0.22, neck[1] + (hip[1] - neck[1]) * 0.22];
  const arms = p.arms.map(([e, h]) => resample([sh, Q(e), Q(h)], NA)), legs = p.legs.map(([k, f]) => resample([hip, Q(k), Q(f)], NL));
  if (mirror) { arms.reverse(); legs.reverse(); } // "left" stays the arm on the left of the picture
  return { head: [neck[0] + dx / l * HEAD_R, neck[1] + dy / l * HEAD_R], hs: 1, spine: resample([neck, hip], NS), armL: arms[0], armR: arms[1], legL: legs[0], legR: legs[1] };
}
const P = {
  ...FIG.POSES,
  crouch: { hip: [0, -0.15], neck: [0.035, -0.4], arms: [[[-0.1, -0.25], [-0.17, -0.17]], [[0.11, -0.26], [0.18, -0.17]]], legs: [[[-0.12, -0.08], [-0.1, 0]], [[0.12, -0.09], [0.1, 0]]] },
  duck: { hip: [0, -0.13], neck: [0.06, -0.33], arms: [[[-0.06, -0.42], [0.06, -0.5]], [[0.16, -0.38], [0.1, -0.5]]], legs: [[[-0.13, -0.07], [-0.11, 0]], [[0.12, -0.08], [0.11, 0]]] },
  tuck: { hip: [0, -0.23], neck: [0.02, -0.48], arms: [[[-0.16, -0.48], [-0.3, -0.6]], [[0.16, -0.48], [0.3, -0.6]]], legs: [[[-0.1, -0.15], [-0.05, -0.05]], [[0.09, -0.14], [0.07, -0.04]]] },
  float: { hip: [0, -0.2], neck: [0, -0.46], arms: [[[-0.17, -0.45], [-0.3, -0.58]], [[0.17, -0.45], [0.3, -0.58]]], legs: [[[-0.04, -0.1], [-0.05, 0.02]], [[0.04, -0.1], [0.06, 0.02]]] },
  // pointing up and left at the opening, the arm going round the head, not across it
  reach: { hip: [0.01, -0.21], neck: [-0.02, -0.47], arms: [[[-0.1, -0.33], [-0.12, -0.22]], [[-0.29, -0.5], [-0.43, -0.79]]], legs: [[[-0.04, -0.1], [-0.08, 0]], [[0.06, -0.1], [0.1, 0]]] },
  shrug: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.14, -0.31], [-0.24, -0.38]], [[0.14, -0.31], [0.24, -0.38]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  peak: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.3, -0.66], [0, -1.08]], [[0.3, -0.66], [0, -1.08]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  box: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.33, -0.4], [-0.33, -0.98]], [[0.33, -0.4], [0.33, -0.98]]], legs: [[[-0.07, -0.1], [-0.13, 0]], [[0.07, -0.1], [0.13, 0]]] },
  flat: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.22, -0.4], [-0.44, -0.4]], [[0.22, -0.4], [0.44, -0.4]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  // both hands flat on a wall to his right, leaning in
  press: { hip: [0.02, -0.2], neck: [0.04, -0.455], arms: [[[0.2, -0.37], [0.41, -0.43]], [[0.2, -0.31], [0.42, -0.33]]], legs: [[[-0.03, -0.1], [-0.07, 0]], [[0.06, -0.1], [0.08, 0]]] }
};
// the mark's own body: head ring, the S of the spine, the arch of the legs; the shoulders where the arms ring meets
// the spine. Arms are given in mark units as [shoulder, elbow, hand], so they can be raised like arms
// raised arms come from ordinary shoulders, just under the head; only as they bend into the ring do they settle
// where the mark's arms ring meets the spine
const SH = [50.3, 69.7];
const ARMS = {
  hang: [[SH, [45, 77], [42.5, 85]], [SH, [55.5, 77], [58, 85]]],
  up: [[SH, [32, 63], [26.5, 40]], [SH, [68.5, 63], [73.5, 40]]],
  reachL: [[SH, [30.5, 58], [30.5, 15]], [SH, [69.5, 61], [71.5, 25]]],
  reachR: [[SH, [31, 61], [28.5, 25]], [SH, [70, 58], [69.5, 15]]]
};
const armArc = (a0, a1) => { const out = []; for (let i = 0; i < NA; i++) { const a = (a0 + (a1 - a0) * i / (NA - 1)) * Math.PI / 180; out.push(mk([50 + 28.8 * Math.cos(a), 47.4 + 28.8 * Math.sin(a)])); } return out; };
function markBody(arms) {
  const sp = G.cubic([50, 65.2], [54.4, 70.2], [47.4, 79.8], [51.2, 85.6]), spine = [];
  for (let i = 0; i < NS; i++) spine.push(mk(sp(i / (NS - 1))));
  const arch = G.arch([45.2, 93.6], [68.4, 90.2], 82.2, 4), seg = (t0, t1) => { const o = []; for (let i = 0; i < NL; i++) o.push(mk(arch(t0 + (t1 - t0) * i / (NL - 1)))); return o; };
  // the finished arms: the ring from the shoulders, left up to 10:30, right over the top to 11:30
  const [armL, armR] = arms === 'ring' ? [armArc(90, 225), armArc(90, -105)] : ARMS[arms].map((a) => resample(a.map(mk), NA));
  return { head: mk([50, 49.4]), hs: (15.8 * S) / HEAD_R, spine, armL, armR, legL: seg(0.27, 0), legR: seg(0.27, 1) };
}
const mv = (p, dx, dy) => { const m = (pts) => pts.map(([x, y]) => [x + dx, y + dy]); return { ...p, head: [p.head[0] + dx, p.head[1] + dy], spine: m(p.spine), armL: m(p.armL), armR: m(p.armR), legL: m(p.legL), legR: m(p.legR) }; };
function turn(p, deg, [px, py]) {
  const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180), r = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c], m = (pts) => pts.map(r);
  return { ...p, head: r(p.head), spine: m(p.spine), armL: m(p.armL), armR: m(p.armR), legL: m(p.legL), legR: m(p.legR) };
}
// stand the feet on a curve: each leg bends so its foot meets floor(x)
function onFloor(p, floor) {
  const fit = (leg) => { const f = leg[leg.length - 1], dy = floor(f[0]) - f[1]; return leg.map(([x, y], i) => [x, y + dy * i / (leg.length - 1)]); };
  return { ...p, legL: fit(p.legL), legR: fit(p.legR) };
}
function blend(a, b, u) {
  const mix = (A, B) => A.map((q, i) => [q[0] + (B[i][0] - q[0]) * u, q[1] + (B[i][1] - q[1]) * u]);
  return { head: [a.head[0] + (b.head[0] - a.head[0]) * u, a.head[1] + (b.head[1] - a.head[1]) * u], hs: a.hs + (b.hs - a.hs) * u, spine: mix(a.spine, b.spine), armL: mix(a.armL, b.armL), armR: mix(a.armR, b.armR), legL: mix(a.legL, b.legL), legR: mix(a.legR, b.legR) };
}
const shake = (p, dx) => ({ ...p, head: [p.head[0] + dx, p.head[1]] });
const pose = (name, x, y = GROUND, mirror = false) => rig(P[name], x, y, mirror);

// ---------- drawings ----------
const RING_D = G.outline(G.arc(0, 0, RING_R, G.GAP, G.OPEN, 1, 0.025), { base: 5.4 * S, seed: 1, swell: 0.22 });
// the circle's centreline, from just after the opening round to just before it: the path a pen draws it along
const RING_LINE = (() => { const pts = []; for (let i = 0; i <= 120; i++) { const a = (GAP + 15 + 330 * i / 120) * Math.PI / 180; pts.push([RING_R * Math.cos(a), RING_R * Math.sin(a)]); } return L.pathData([pts]); })();
// his head ring, round-ended: the ring and its two ends are separate shapes, so the ends never cut holes in it
const HEAD_T = 0.034 * SIZE, HEAD_A0 = (GAP + 15) * Math.PI / 180, HEAD_SPAN = 330 * Math.PI / 180;
const HEAD_D = (() => {
  const o = [], i = [];
  for (let k = 0; k <= 48; k++) { const t = k / 48, a = HEAD_A0 + HEAD_SPAN * t, w = HEAD_T * (1.2 - 0.5 * t); o.push([(HEAD_R + w) * Math.cos(a), (HEAD_R + w) * Math.sin(a)]); i.push([(HEAD_R - w) * Math.cos(a), (HEAD_R - w) * Math.sin(a)]); }
  return 'M' + o.concat(i.reverse()).map(([x, y]) => L.n2(x) + ' ' + L.n2(y)).join('L') + 'Z';
})();
const headEnds = (fg) => [[HEAD_A0, 1.2], [HEAD_A0 + HEAD_SPAN, 0.7]].map(([a, k]) => `<circle cx="${L.n2(HEAD_R * Math.cos(a))}" cy="${L.n2(HEAD_R * Math.sin(a))}" r="${L.n2(HEAD_T * k)}" fill="${fg}"/>`).join('');
const MARK = G.build({ texture: true, samples: 180 });

// ---------- timing ----------
const EASE = { lin: (u) => u, io: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2), in: (u) => u * u * u, out: (u) => 1 - Math.pow(1 - u, 3), back: (u) => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2) };
// keys: { t, fig | figRel, ring: {x, y, r, k, o, d}, fo, mo, sq, e }. Left out = carried over from the key before.
// figRel is a pose drawn as if the circle sat at the mark's place at full size: it moves and scales with the circle.
// ring.d is how much of the circle is drawn (0..1, from the opening round); sq squeezes him sideways (through gaps).
// e is the easing of the move INTO that key
function fillKeys(keys) {
  let last = { ring: { x: M[0], y: M[1], r: 0, k: 1, o: 1, d: 1 }, fo: 1, mo: 0, sq: 1, fig: null, figRel: null };
  return keys.slice().sort((a, b) => a.t - b.t).map((k) => {
    const f = { ...last, ...k, ring: { ...last.ring, ...(k.ring || {}) } };
    if (k.fig) f.figRel = null; else if (k.figRel) f.fig = null; else { f.fig = last.fig; f.figRel = last.figRel; }
    last = f; return f;
  });
}
const inRing = (p, ring) => { const sc = (q) => [ring.x + (q[0] - M[0]) * ring.k, ring.y + (q[1] - M[1]) * ring.k], m = (pts) => pts.map(sc); return { head: sc(p.head), hs: p.hs * ring.k, spine: m(p.spine), armL: m(p.armL), armR: m(p.armR), legL: m(p.legL), legR: m(p.legR) }; };
function at(K, t) {
  let i = 1; while (i < K.length - 1 && K[i].t <= t) i++;
  const a = K[i - 1], b = K[i], u = (EASE[b.e || 'io'])(Math.min(1, Math.max(0, (t - a.t) / ((b.t - a.t) || 1))));
  const lr = (p, q) => p + (q - p) * u;
  const ring = {}; for (const k of ['x', 'y', 'r', 'k', 'o', 'd']) ring[k] = lr(a.ring[k], b.ring[k]);
  const A = a.figRel ? inRing(a.figRel, ring) : a.fig, B = b.figRel ? inRing(b.figRel, ring) : b.fig;
  let fig = blend(A, B, u); const sq = lr(a.sq, b.sq);
  if (sq < 0.999) { const cx = fig.spine.reduce((s, q) => s + q[0], 0) / fig.spine.length, m = (pts) => pts.map(([x, y]) => [cx + (x - cx) * sq, y]); fig = { ...fig, head: [cx + (fig.head[0] - cx) * sq, fig.head[1]], spine: m(fig.spine), armL: m(fig.armL), armR: m(fig.armR), legL: m(fig.legL), legR: m(fig.legR) }; }
  return { fig, sq, ring, fo: lr(a.fo, b.fo), mo: lr(a.mo, b.mo) };
}

// ---------- writing the SVG ----------
// def: { id, dur, keys, tracks: [{ attr, at(t), el(fg, first) with </TRACK> }], shift(t) -> [dx, dy] for the mark, ground }
function story(def) {
  const { id, dur, keys, tracks = [], shift = () => [0, 0], ground = true } = def;
  const K = fillKeys(keys), n = Math.round(dur * FPS), rnd = L.rng(id.length * 31 + 7);
  const F = []; for (let f = 0; f < n; f++) F.push(at(K, f / FPS));
  const anim = (attr, vals) => (new Set(vals).size > 1 ? `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(';')}"/>` : '');
  const tr = (type, vals) => (new Set(vals).size > 1 ? `<animateTransform attributeName="transform" type="${type}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(';')}"/>` : '');
  const line = (pts) => L.pathData([L.simplify(pts, 0.35)]);
  const wobble = F.map((s) => { const a = 0.75 * Math.max(0, 1 - s.mo * 2); return L.n1((rnd() - 0.5) * 2 * a) + ' ' + L.n1((rnd() - 0.5) * 2 * a); });
  const base = [M[0] - 50 * S, M[1] - 50 * S];
  return (theme) => {
    const { fg } = L.THEMES[theme], s0 = F[0];
    const part = (w, vals) => { const ws = F.map((s) => L.n2(w * Math.min(1, s.fig.hs))); return `<path d="${vals[0]}" fill="none" stroke="${fg}" stroke-width="${ws[0]}" stroke-linecap="round" stroke-linejoin="round">${anim('d', vals)}${anim('stroke-width', ws)}</path>`; };
    const extras = tracks.map((k) => { const vals = F.map((_, f) => k.at(f / FPS)); return k.el(fg, vals[0]).replace('</TRACK>', anim(k.attr, vals) + '</path>'); }).join('');
    const drawn = F.map((s) => L.n2(1 - s.ring.d));
    const ring = `<g transform="translate(${L.n1(s0.ring.x)} ${L.n1(s0.ring.y)})">${tr('translate', F.map((s) => L.n1(s.ring.x) + ' ' + L.n1(s.ring.y)))}` +
      `<g transform="rotate(${L.n1(s0.ring.r)})">${tr('rotate', F.map((s) => L.n1(s.ring.r)))}` +
      `<g transform="scale(${L.n2(s0.ring.k)})">${tr('scale', F.map((s) => L.n2(Math.max(0.001, s.ring.k))))}` +
      (new Set(drawn).size > 1 ? `<mask id="pen" maskUnits="userSpaceOnUse" x="-150" y="-150" width="300" height="300"><path d="${RING_LINE}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${drawn[0]}" fill="none" stroke="#fff" stroke-width="${L.n1(8 * S)}">${anim('stroke-dashoffset', drawn)}</path></mask>` : '') +
      `<path d="${RING_D}" fill="${fg}" opacity="${L.n2(s0.ring.o)}"${new Set(drawn).size > 1 ? ' mask="url(#pen)"' : ''}>${anim('opacity', F.map((s) => L.n2(s.ring.o)))}</path></g></g></g>`;
    const figure = `<g opacity="${L.n2(s0.fo)}">${anim('opacity', F.map((s) => L.n2(s.fo)))}<g>${tr('translate', wobble)}` +
      `<g transform="translate(${L.n1(s0.fig.head[0])} ${L.n1(s0.fig.head[1])})">${tr('translate', F.map((s) => L.n1(s.fig.head[0]) + ' ' + L.n1(s.fig.head[1])))}` +
      `<g transform="scale(${L.n2(s0.fig.hs * s0.sq)} ${L.n2(s0.fig.hs)})">${tr('scale', F.map((s) => L.n2(s.fig.hs * s.sq) + ' ' + L.n2(s.fig.hs)))}<path d="${HEAD_D}" fill="${fg}"/>${headEnds(fg)}</g></g>` +
      part(9.5, F.map((s) => line(s.fig.spine))) + part(7.6, F.map((s) => line(s.fig.armL) + line(s.fig.armR))) + part(8.4, F.map((s) => line(s.fig.legL) + line(s.fig.legR))) + '</g></g>';
    const sh = F.map((_, f) => { const [dx, dy] = shift(f / FPS); return L.n1(base[0] + dx) + ' ' + L.n1(base[1] + dy); });
    const mark = `<g class="mark" opacity="${L.n2(s0.mo)}">${anim('opacity', F.map((s) => L.n2(s.mo)))}<g transform="translate(${sh[0]})">${tr('translate', sh)}<g transform="scale(${S})">` +
      `<mask id="dry" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${MARK.gaps.join('')}" fill="none" stroke="#000" stroke-width=".34" stroke-linecap="round"/></mask>` +
      `<path fill="${fg}" mask="url(#dry)" d="${MARK.paths.join('')}"/></g></g></g>`;
    const css = '@media (prefers-reduced-motion:reduce){.play{display:none}.mark{opacity:1!important}}';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><title>${L.esc(TITLES[id])}</title><style>${css}</style>` +
      (ground ? `<path d="M0 ${L.n1(GROUND)}H${W}" stroke="${fg}" stroke-width="2" opacity=".3"/>` : '') + `<g class="play">${extras}${ring}${figure}</g>${mark}</svg>\n`;
  };
}

// ---------- building blocks ----------
function walk(x0, x1, t0, t1, fy = GROUND) {
  const out = [], n = Math.max(2, Math.round((t1 - t0) * FPS)), mirror = x1 < x0;
  for (let k = 0; k <= n; k++) out.push({ t: t0 + (t1 - t0) * k / n, fig: rig(FIG.walkFrame(k % 6, 6), x0 + (x1 - x0) * k / n, typeof fy === 'function' ? fy(x0 + (x1 - x0) * k / n) : fy, mirror), e: 'lin' });
  return out;
}
function hop(x, y, t0, t1, lift, air = 'tuck', dx = 0) {
  const out = [], n = Math.max(3, Math.round((t1 - t0) * FPS));
  for (let k = 1; k <= n; k++) { const u = k / n; out.push({ t: t0 + (t1 - t0) * u, fig: pose(k === n ? 'crouch' : air, x + dx * u, y - lift * 4 * u * (1 - u)), e: 'lin' }); }
  return out;
}
function noNo(name, x, y, t) { return [{ t: t + 0.2, fig: shake(pose(name, x, y), -7), e: 'lin' }, { t: t + 0.4, fig: shake(pose(name, x, y), 7), e: 'lin' }, { t: t + 0.6, fig: shake(pose(name, x, y), -5), e: 'lin' }, { t: t + 0.75, fig: pose(name, x, y), e: 'lin' }]; }
// the mark forming, from him standing in the middle: he settles into the mark's stance, puts his hands up, reaches
// for the top with one hand and the other, then bends his arms over his head into the circle; the mark takes over.
// Returns the keys and the time the mark is complete
function raise(t0) {
  return { at: t0 + 3.9, keys: [
    { t: t0 + 0.5, fig: markBody('hang') },
    { t: t0 + 1.1, fig: markBody('up') },
    { t: t0 + 1.5, fig: markBody('reachL') }, { t: t0 + 1.9, fig: markBody('reachR') }, { t: t0 + 2.3, fig: markBody('reachL') },
    { t: t0 + 3.3, fig: markBody('ring') },
    { t: t0 + 3.9, mo: 1, fo: 0, ring: { o: 0 } }
  ] };
}

const TITLES = {
  'story-ship': 'Ship: a ring-shaped ship beams the figure up through its opening, turns it to 11 o\'clock and lands; his arms make the mark; it flies off',
  'story-reach': 'Reach: inside the circle the figure jumps for the gap at 11 o\'clock, cannot reach it, and stretches his arms over his head into the mark',
  'story-mimic': 'Mimic: the figure copies shapes with his arms and is never satisfied; a circle comes down over him through its opening, and he copies it from inside',
  'story-meteor': 'Meteor: the circle comes down like a meteor with the figure curled inside, lands, and he stands up into the mark',
  'story-bubble': 'Bubble: a circle is drawn round the figure from its opening; he pushes at its walls from inside, then makes the mark',
  'story-wheel': 'Wheel: from the mark, the figure lowers his arms and runs, the circle rolls like a wheel, and he comes home to the mark',
  'story-orbit': 'Orbit: the figure walks right round the outside of a small floating circle, finds the opening at 11 o\'clock and drops in, then makes the mark'
};
const holdFade = (t, end) => [{ t, e: 'lin' }, { t: end - 0.6, e: 'lin' }, { t: end, mo: 0, e: 'lin' }];

// SHIP: it hovers with its opening turned down, its beam coming out of the opening. He walks up and looks; it
// drifts over him; the beam lifts him in through the opening, small enough to fit; the ship turns its opening back
// up to 11 o'clock as it comes down and lands; arms up: the mark; it flies off up the 11 o'clock line
function ship() {
  const hx = (t) => (t < 2.6 ? 330 : t < 3.6 ? 330 - 90 * EASE.io((t - 2.6) / 1.0) : 240);
  const hover = (t) => ({ x: hx(t), y: 76 + 4 * Math.sin(t * 2.6), r: 210 + 5 * Math.sin(t * 1.4), k: 0.55, o: 1 });
  const keys = [{ t: 0, fig: pose('stand', -70), ring: hover(0), mo: 0, fo: 1, sq: 1 }];
  walk(-70, 240, 0, 2.2).forEach((k) => keys.push({ ...k, ring: hover(k.t) }));
  for (let t = 2.4; t <= 4.0; t += 0.2) keys.push({ t, fig: pose('watch', 240), ring: hover(t), e: 'lin' });
  const r1 = raise(8.4);
  keys.push(
    { t: 4.3, fig: pose('float', 240, GROUND - 4), ring: { ...hover(4.3), r: 210 }, e: 'io' },
    // up through the opening at the bottom: he shrinks into the ship's scale and squeezes through
    { t: 4.9, figRel: pose('float', M[0], M[1] + 150), ring: { x: 240, y: 76, r: 210, k: 0.55 }, sq: 0.55, e: 'in' },
    { t: 5.5, figRel: pose('float', M[0], FEET - 8), sq: 0.55, e: 'out' },
    { t: 5.8, figRel: pose('float', M[0], FEET - 8), sq: 1, e: 'io' },
    // the ship turns its opening to 11 o'clock and comes down to land at full size
    { t: 7.4, figRel: pose('float', M[0], FEET - 6), ring: { x: M[0], y: M[1], r: 360, k: 1 }, e: 'io' },
    { t: 7.7, fig: pose('crouch', M[0], FEET), e: 'out' },
    { t: 8.1, fig: pose('stand', M[0], FEET) },
    ...r1.keys,
    ...holdFade(r1.at + 1.4, r1.at + 3.0)
  );
  const shift = (t) => { const u = Math.max(0, Math.min(1, (t - (r1.at + 1.4)) / 1.5)), d = 560 * u * u * u; return [d * Math.cos(GAP * Math.PI / 180), d * Math.sin(GAP * Math.PI / 180)]; };
  // the beam leaves through the opening at the ship's underside
  const beam = (t) => { if (t > 5.4) return 'M0 0'; const h = hover(Math.min(t, 4.3)), y0 = h.y + h.k * RING_R; let d = ''; const wide = t > 3.6 ? 2 : 1; for (let i = -wide; i <= wide; i++) d += `M${L.n1(h.x + i * 8)} ${L.n1(y0)}V${L.n1(GROUND - 4)}`; return d; };
  return { id: 'story-ship', dur: r1.at + 3.0, keys, shift, tracks: [{ attr: 'd', at: beam, el: (fg, d0) => `<path d="${d0}" stroke="${fg}" stroke-width="1.6" stroke-dasharray="3 7" stroke-linecap="round" opacity=".6"></TRACK>` }] };
}

// REACH: inside, he looks up at the gap and points; jumps for it, then higher; can't; shrugs and shakes his head;
// then puts his hands up, stretches for the top and bends his arms over his head toward the gap: the mark. Then his
// arms come down again and it starts over
function reach() {
  const x = M[0], y = FEET, r1 = raise(5.3);
  const keys = [
    { t: 0, fig: pose('stand', x, y), mo: 0, fo: 1, sq: 1 },
    { t: 0.8, fig: pose('stand', x, y) },
    { t: 1.3, fig: pose('reach', x, y) },
    { t: 1.7, fig: pose('crouch', x, y) },
    ...hop(x, y, 1.7, 2.4, 30, 'reach', -6),
    { t: 2.7, fig: pose('crouch', x - 6, y) },
    ...hop(x - 6, y, 2.7, 3.6, 50, 'reach', -6),
    { t: 4.0, fig: pose('shrug', x - 12, y) }, ...noNo('shrug', x - 12, y, 4.0),
    { t: 5.1, fig: pose('stand', x, y) },
    ...r1.keys,
    { t: r1.at + 2.0, e: 'lin' },
    { t: r1.at + 2.4, mo: 0, fo: 1, ring: { o: 1 }, fig: markBody('ring') },
    { t: r1.at + 3.2, fig: pose('stand', x, y) },
    { t: r1.at + 3.5, e: 'lin' }
  ];
  return { id: 'story-reach', dur: r1.at + 3.5, keys };
}

// MIMIC: he copies a peak, a box and a line with his arms and shakes his head at each. Then a circle comes down from
// above with its opening turned down: the opening slips over him as he ducks and squeezes. It turns its opening
// round to 11 o'clock, closing under his feet; he copies it from inside, and this one is right
function mimic() {
  const x = 150, r1 = raise(13.4);
  const keys = [
    { t: 0, fig: pose('stand', -70), mo: 0, fo: 1, sq: 1, ring: { x: M[0], y: -150, r: 210, k: 1, o: 1 } },
    ...walk(-70, x, 0, 1.4),
    { t: 1.9, fig: pose('watch', x) },
    { t: 2.5, fig: pose('peak', x) }, { t: 3.1, fig: pose('peak', x) }, ...noNo('peak', x, GROUND, 3.1), { t: 4.1, fig: pose('stand', x) },
    { t: 4.8, fig: pose('box', x) }, { t: 5.4, fig: pose('box', x) }, ...noNo('box', x, GROUND, 5.4), { t: 6.4, fig: pose('stand', x) },
    { t: 7.1, fig: pose('flat', x) }, { t: 7.7, fig: pose('flat', x) }, ...noNo('flat', x, GROUND, 7.7), { t: 8.7, fig: pose('shrug', x) },
    ...walk(x, M[0], 8.9, 9.6),
    { t: 10.0, fig: pose('watch', M[0]), ring: { y: -150 }, e: 'lin' },
    // the circle drops, opening first; the opening passes over him while he ducks small
    { t: 10.45, ring: { y: 30 }, fig: pose('duck', M[0]), sq: 1, e: 'in' },
    { t: 10.75, ring: { y: GROUND - RING_OUT * Math.sin(75 * Math.PI / 180) }, sq: 0.55, e: 'lin' },
    { t: 10.95, ring: { y: GROUND - RING_OUT * Math.sin(75 * Math.PI / 180) - 3 }, e: 'out' },
    { t: 11.3, fig: pose('stand', M[0]), sq: 1 },
    // it turns, the opening going round to 11 o'clock and the circle closing under him: he is lifted onto it
    { t: 12.9, ring: { y: M[1], r: 360 }, fig: pose('stand', M[0], FEET), e: 'io' },
    { t: 13.2, fig: pose('stand', M[0], FEET) },
    ...r1.keys,
    ...holdFade(r1.at + 1.8, r1.at + 2.6),
    { t: r1.at + 2.7, fig: pose('stand', -70), fo: 1, ring: { x: M[0], y: -150, r: 210, o: 1 }, e: 'lin' }
  ];
  const sx = 352, shapes = [
    [`M${sx - 44} ${L.n1(GROUND)}L${sx} ${L.n1(GROUND - 90)}L${sx + 44} ${L.n1(GROUND)}Z`, 1.6, 4.1],
    [`M${sx - 40} ${L.n1(GROUND)}V${L.n1(GROUND - 82)}H${sx + 40}V${L.n1(GROUND)}Z`, 4.1, 6.4],
    [`M${sx - 56} ${L.n1(GROUND - 44)}H${sx + 56}`, 6.4, 8.7]
  ];
  const tracks = shapes.map(([d, a, b]) => ({ attr: 'opacity', at: (t) => L.n2(t < a || t > b + 0.35 ? 0 : t < a + 0.35 ? (t - a) / 0.35 : t > b ? 1 - (t - b) / 0.35 : 1), el: (fg, o0) => `<path d="${d}" fill="none" stroke="${fg}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity="${o0}"></TRACK>` }));
  return { id: 'story-mimic', dur: r1.at + 2.7, keys, tracks };
}

// METEOR: the circle comes down the 11 o'clock line, spinning, him curled up inside, trailing lines; it hits,
// rocks and settles; he gets up, a little dizzy, and makes the mark
function meteor() {
  const dir = [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)], from = [M[0] - dir[0] * 360, M[1] - dir[1] * 360];
  const pos = (u) => [from[0] + (M[0] - from[0]) * u, from[1] + (M[1] - from[1]) * u];
  const keys = [{ t: 0, ring: { x: from[0], y: from[1], r: -260, k: 1, o: 1 }, fig: pose('tuck', from[0], from[1] + 62), mo: 0, fo: 1, sq: 1 }];
  for (let k = 1; k <= 12; k++) { const u = k / 12, [x, y] = pos(u * u); keys.push({ t: 0.1 + 0.9 * u, ring: { x, y, r: -260 * (1 - u * u) }, fig: pose('tuck', x + 2, y + 62), e: 'lin' }); }
  const r1 = raise(4.4);
  keys.push(
    { t: 1.15, ring: { x: M[0] + 4, y: M[1] + 7, r: 7 }, fig: pose('duck', M[0] + 4, FEET + 7), e: 'out' },
    { t: 1.4, ring: { x: M[0] - 2, y: M[1] - 2, r: -5 }, fig: pose('duck', M[0] - 2, FEET - 2), e: 'io' },
    { t: 1.65, ring: { x: M[0], y: M[1], r: 2 }, fig: pose('crouch', M[0], FEET), e: 'io' }, { t: 1.85, ring: { r: 0 }, e: 'io' },
    { t: 2.6, fig: pose('crouch', M[0], FEET) },
    { t: 3.0, fig: shake(pose('crouch', M[0], FEET), -6) }, { t: 3.3, fig: shake(pose('crouch', M[0], FEET), 6) },
    { t: 4.2, fig: pose('stand', M[0], FEET) },
    ...r1.keys,
    ...holdFade(r1.at + 1.8, r1.at + 2.6)
  );
  const trail = (t) => { if (t > 1.12) return 'M0 0'; const u = Math.min(1, Math.max(0, (t - 0.1) / 0.9)), [x, y] = pos(u * u), nx = -dir[1], ny = dir[0]; let d = ''; for (let i = -2; i <= 2; i++) { const ox = x + nx * i * 24 - dir[0] * (RING_OUT + 10), oy = y + ny * i * 24 - dir[1] * (RING_OUT + 10), len = 70 + 45 * (2 - Math.abs(i)); d += `M${L.n1(ox)} ${L.n1(oy)}l${L.n1(-dir[0] * len)} ${L.n1(-dir[1] * len)}`; } return d; };
  return { id: 'story-meteor', dur: r1.at + 2.6, keys, tracks: [{ attr: 'd', at: trail, el: (fg, d0) => `<path d="${d0}" stroke="${fg}" stroke-width="3" stroke-linecap="round"></TRACK>` }] };
}

// BUBBLE: he walks to the middle. A circle is drawn round him like a pen stroke, from the opening, clockwise, back to
// the opening; as it passes under him it lifts him. He walks to one wall and pushes it with both hands, then the
// other, always inside; back in the middle he makes the mark
function bubble() {
  const floor = (x) => M[1] + Math.sqrt(Math.max(0, (FEET - M[1]) ** 2 - (x - M[0]) ** 2)); // the inside of the bottom
  const at = (name, x, mirror) => onFloor(rig(P[name], x, floor(x), mirror), floor);
  const r1 = raise(9.0), lift = 2.0 + 1.8 * ((90 - (GAP + 15)) / 330); // when the pen passes under his feet
  const keys = [
    { t: 0, fig: pose('stand', -70), mo: 0, fo: 1, sq: 1, ring: { x: M[0], y: M[1], r: 0, k: 1, o: 1, d: 0 } },
    ...walk(-70, M[0], 0, 1.8),
    { t: 2.0, fig: pose('stand', M[0]), ring: { d: 0 }, e: 'lin' },
    { t: lift, fig: pose('stand', M[0]), ring: { d: (lift - 2.0) / 1.8 }, e: 'lin' },
    { t: lift + 0.25, fig: at('stand', M[0]), e: 'out' },
    { t: 3.8, ring: { d: 1 }, fig: at('watch', M[0]), e: 'lin' },
    ...walk(M[0], M[0] + 26, 4.1, 4.7, floor).map((k) => ({ ...k, fig: onFloor(k.fig, floor) })),
    { t: 5.0, fig: at('press', M[0] + 26) }, { t: 5.5, fig: at('press', M[0] + 29) }, { t: 5.8, fig: at('press', M[0] + 26) },
    ...walk(M[0] + 26, M[0] - 26, 6.1, 7.2, floor).map((k) => ({ ...k, fig: onFloor(k.fig, floor) })),
    { t: 7.5, fig: at('press', M[0] - 26, true) }, { t: 8.0, fig: at('press', M[0] - 29, true) }, { t: 8.3, fig: at('press', M[0] - 26, true) },
    ...walk(M[0] - 26, M[0], 8.5, 8.9, floor).map((k) => ({ ...k, fig: onFloor(k.fig, floor) })),
    ...r1.keys.map((k) => ({ ...k, t: k.t + 0.1 })),
    ...holdFade(r1.at + 1.9, r1.at + 2.7)
  ];
  return { id: 'story-bubble', dur: r1.at + 2.7, keys };
}

// WHEEL: it starts as the mark. His arms come down; he runs, and the circle rolls under him like a wheel, out to the
// right, back past the middle, home again with its opening back at 11 o'clock; then the mark forms again
function wheel() {
  const roll = (x) => ((x - M[0]) / RING_OUT) * 180 / Math.PI;
  const keys = [{ t: 0, fig: markBody('ring'), mo: 1, fo: 0, sq: 1, ring: { o: 0 } }, { t: 1.4, mo: 1, e: 'lin' }, { t: 1.7, mo: 0, fo: 1, ring: { o: 1 } }, { t: 2.4, fig: pose('stand', M[0], FEET) }];
  const run = (x0, x1, t0, t1) => { const n = Math.round((t1 - t0) * FPS), mirror = x1 < x0; for (let k = 1; k <= n; k++) { const u = k / n, x = x0 + (x1 - x0) * EASE.io(u); keys.push({ t: t0 + (t1 - t0) * u, fig: rig(FIG.walkFrame(k % 6, 6), x, FEET, mirror), ring: { x, r: roll(x) }, e: 'lin' }); } };
  run(M[0], M[0] + 140, 2.4, 4.0); run(M[0] + 140, M[0] - 120, 4.2, 6.6); run(M[0] - 120, M[0], 6.8, 8.0);
  const r1 = raise(8.4);
  keys.push({ t: 8.3, fig: pose('stand', M[0], FEET), ring: { x: M[0], r: 0 } }, ...r1.keys, { t: r1.at + 0.6, e: 'lin' });
  return { id: 'story-wheel', dur: r1.at + 0.6, keys };
}

// ORBIT: a small circle floats in the dark. He stands on top of it like a little planet and walks the whole way round
// its outside, upside down underneath it, up the far side, to the opening at 11 o'clock; he drops in through it and
// lands inside; the view comes closer and he makes the mark
function orbit() {
  const k0 = 0.62, cy = 162;
  // standing on the outside at angle phi: feet on the outer edge, body pointing outward
  const onTop = (frame, phi) => { const f = [M[0] + RING_OUT * Math.cos(phi * Math.PI / 180), M[1] + RING_OUT * Math.sin(phi * Math.PI / 180)]; return turn(rig(frame, f[0], f[1]), phi + 90, f); };
  const keys = [{ t: 0, figRel: onTop(P.stand, -90), mo: 0, fo: 1, sq: 1, ring: { x: M[0], y: cy, r: 0, k: k0, o: 1 } }, { t: 0.7, figRel: onTop(P.stand, -90) }];
  // the walk: clockwise from the top, right round, to just past the opening's far side
  const n = 84; for (let i = 1; i <= n; i++) { const u = i / n, phi = -90 + (210 - (-90) - 2) * u; keys.push({ t: 0.7 + 6.6 * u, figRel: onTop(FIG.walkFrame(i % 6, 6), phi), e: 'lin' }); }
  const end = 208, r1 = raise(10.9);
  keys.push(
    { t: 7.6, figRel: onTop(P.watch, end) },
    // in through the opening (centred at 240 degrees): over its edge, squeezed small, down to the floor inside
    { t: 8.1, figRel: rig(P.tuck, M[0] - 50, M[1] - 120), sq: 0.55, e: 'io' },
    { t: 8.6, figRel: rig(P.tuck, M[0] - 18, M[1] - 30), sq: 0.6, e: 'in' },
    { t: 9.0, figRel: pose('crouch', M[0], FEET), sq: 1, e: 'out' },
    // the view comes closer: the circle to the mark's size and place
    { t: 10.6, figRel: pose('stand', M[0], FEET), ring: { y: M[1], k: 1 }, e: 'io' },
    { t: 10.9, fig: pose('stand', M[0], FEET) },
    ...r1.keys,
    ...holdFade(r1.at + 1.8, r1.at + 2.6),
    { t: r1.at + 2.7, figRel: onTop(P.stand, -90), fo: 1, ring: { y: cy, k: k0, o: 1 }, e: 'lin' }
  );
  return { id: 'story-orbit', dur: r1.at + 2.7, keys, ground: false };
}

const defs = [ship, reach, mimic, meteor, bubble, wheel, orbit].map((fn) => fn());
module.exports = { W, H, TITLES, list: defs.map((d) => [d.id, d.id.replace('story-', '').replace(/^./, (c) => c.toUpperCase()), () => story(d), W, H]) };
