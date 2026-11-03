// FILM 13b, Arrival v2. The same story as Arrival, with room to breathe where it was rushed (see STORYBOARD.md):
// - the telescope: once it is out, a small dotted circle sways up and down as the telescope does, searching; it
//   settles and locks on the planet's dot; the close-up opens out of it, joined to it by two dashed lines, and stays
//   long enough to read: that planet, and on it a loop in its rings
// - the planet is far off, so it does not move when he dodges; it only grows, smoothly and faster and faster as he
//   nears it, while he gets smaller in the picture
// - a stage of its own for the atmosphere: it feels faster (everything shakes, the streaks and the trail speed up),
//   then the trail's lines catch fire and flames lick round the front of the loop, and only then does the loop burn
// - on the ground he looks about properly (up at the sky he came from, left, right), hears the clock tick, and walks
//   to the edge with a real walk: a slow start, a glance, then knees, bounce and arms, slowing at the edge
// It starts on Fall's last frame and ends on its first, as the first Arrival does.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'), require('./film-fall.js'));
  else (root.Films = root.Films || {}).arrival2 = factory(root.Ink, root.MarkBody, root.Field, root.Films.fall);
})(this, function (I, MB, FL, F) {
  const W = 1920, H = 1080, FPS = 30, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI, RAD = PI / 180;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const rotv = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  const key = (ks) => (t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; };
  // a smooth curve through points that never overshoots them (no pauses at the points, no jerks)
  function mono(pts) {
    const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m.push(d[0]); for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
    for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
    return (x) => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (x > xs[i + 1]) i++; const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]; };
  }
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) out[f] = key(per[f])(t); return out; };
  }
  const { D, N } = F, RM = MB.MK.loop.r, RO = F.RO;
  const MP = MB.MARK_POSE(0, 0), MF = (k) => [MP.feet[k].x, MP.feet[k].y], MPEL = [MP.root.x, MP.root.y], ML = MB.MARK_LEAN;
  const BAL = { F: [0.37, 0.27], B: [-0.34, 0.3] };

  // ---- time ---------------------------------------------------------------------------------------------------------------
  const TF0 = 32.5, tF = (t) => t + TF0;                      // our first frame is Fall at 32.5 s
  const T = { brush: [1.3, 2.1], arms: [2.1, 3.7], duck: [7.55, 8.25], swerve: [10.9, 11.7],
    out: [14.55, 15.0], search: [15.4, 18.4], lock: 18.5, view: [18.6, 19.3], close: [23.3, 23.9], away: [24.3, 24.7], point: [24.85, 25.9],
    speed: [33, 35.5], fire: [35, 37], burn: [37, 41], gone: 41.0 };
  const HAND = 41.4, LANDX = -5.0, Q0 = [LANDX, -1.4];        // the loop is gone: from here, Fall's own world
  const FALLV = 1.2, FALLG = 3.5, DROP = -0.07 - (Q0[1] + MPEL[1]), HIT = HAND + (-FALLV + Math.sqrt(FALLV * FALLV + 4 * FALLG * DROP)) / (2 * FALLG);
  const S = HIT + 2.47;                                       // he is on his feet
  const WALK = [S + 6.6, S + 13.6], CUT = WALK[1] + 3.0, DUR = CUT + 1.0, tau = (t) => t - CUT;
  // the loop at the edge ticks round an hour every 1.2 s the whole time he is on the ground, and comes to five as Fall begins
  const ATICKS = Array.from({ length: 19 }, (_, m) => 0.4 - 1.2 * m);
  const hand = (x) => (x <= 0 ? 0 : 1 - Math.exp(-x * 16) * Math.cos(x * 26));
  const clockA = (u) => PI + (PI / 6) * ATICKS.reduce((s, k) => s + hand(u - k) - 1, 0);
  const phaseA = (u) => 0.45 * u + ATICKS.reduce((s, k) => s + smoother(seg(u, k, k + 0.5)) - 1, 0);
  const table = (f, t0 = 0) => { const o = [0]; for (let i = 1; i <= DUR * 120 + 2; i++) o.push(o[i - 1] + f(i / 120) / 120); return (t) => { const x = clamp(t, 0, DUR) * 120, i = Math.min(o.length - 2, Math.floor(x)); return t0 + lerp(o[i], o[i + 1], x - i); }; };

  // ---- the flight ------------------------------------------------------------------------------------------------------------
  const vel = (t) => (t < 33 ? 4 : t < 37 ? lerp(4, 6, smooth(33, 35, t)) : lerp(6, 1.4, smoother(seg(t, 37, HAND))));
  const boost = (t) => smooth(...T.speed, t) * (1 - smooth(40.0, 41.0, t));      // the feel of speed in the air
  const shake = (t) => smooth(33, 35.5, t) * (1 - smooth(40.8, 41.3, t));
  const fireA = (t) => smooth(...T.fire, t) * (1 - smooth(39.8, 41.0, t));
  const along = table(vel);
  const lat = key([[0, 0], [4.4, 0], [5.15, 1.5], [6.6, 1.5], [7.35, 0.35], [10.5, 0.35], [11.0, -1.05], [12.5, -1.05], [13.5, -0.5], [25.9, -0.5], [27.6, 0.15], [28.9, 0.15], [29.35, 0.45], [30.3, 0.15], [HAND, 0.15]]);
  const latV = (t) => (lat(t + 0.03) - lat(t - 0.03)) / 0.06;
  const camLat = (t) => { let s = 0; for (let i = 0; i < 8; i++) s += lat(t - 0.7 * i / 7); return s / 8; };
  const dive = (t) => (PI / 6) * smoother(seg(t, 33.5, 38));
  const burnt = (t) => 165 * Math.pow(seg(t, ...T.burn), 1.25);
  const LIFT = T.burn[0] + (T.burn[1] - T.burn[0]) * Math.pow(129 / 165, 1 / 1.25);   // the fire reaches his back foot
  const jolt = (t) => mul([Math.sin(t * 61) + 0.5 * Math.sin(t * 97), Math.cos(t * 53) + 0.5 * Math.sin(t * 83)], 0.016 * shake(t));

  // ---- rocks and planets -------------------------------------------------------------------------------------------------
  const blob = (seed, n = 15) => { const r = I.rng(seed); return Array.from({ length: n }, (_, i) => 1 + 0.32 * (r() - 0.5) + 0.12 * Math.sin(i * 2.1 + seed)); };
  const ROCKS = [[5.7, 0.05, 0.62, 1, 0.6], [7.9, -0.62, 0.13, 2, 2.0], [8.3, 2.3, 0.22, 3, -1.2], [8.65, 3.0, 0.16, 4, 1.5], [11.5, 0.35, 0.48, 5, -0.8], [12.2, 1.45, 0.3, 6, 1.1], [29.6, -0.75, 0.22, 7, 1.7],
    [3.2, 2.6, 0.12, 8, 1.3], [4.1, -2.4, 0.1, 9, -2], [9.6, -2.6, 0.14, 10, 1], [13.1, 2.7, 0.11, 11, -1.4], [26.6, -2.8, 0.09, 12, 2.2], [28.2, 2.9, 0.12, 13, 1.2], [31.0, 2.5, 0.1, 14, -1.6], [32.2, -2.2, 0.12, 15, 1.4]]
    .map(([tp, n, r, seed, spin]) => ({ tp, n, r, seed, spin, shape: blob(seed), craters: (() => { const q = I.rng(seed + 40); return [0, 1, 2].map(() => [(q() - 0.5) * 0.9, (q() - 0.5) * 0.9, 0.12 + 0.12 * q()]); })() }));
  const FAR = [{ tp: 10.4, n: -8.0, R: 0.85, par: 0.35, kind: 'ringed', tilt: -0.35 }, { tp: 27.5, n: 6.5, R: 0.55, par: 0.45, kind: 'moon', tilt: 0.2 }];
  // the planet he goes to, far off: fixed in the picture (no parallax), growing faster and faster as he nears it
  // (in the picture's terms before the camera goes in close: a whole circle in the frame when he reaches its air)
  const rhoP = mono([[12.4, Math.log(5)], [18, Math.log(9)], [25.8, Math.log(20)], [29, Math.log(60)], [31.5, Math.log(140)], [33.2, Math.log(240)], [35, Math.log(500)], [37, Math.log(1500)], [39, Math.log(6000)], [HAND, Math.log(50000)]]);
  const gapP = mono([[12.4, 560], [25.8, 520], [29, 420], [33.2, 320], [40.25, 320], [HAND, 350]]);
  const dirP = mono([[12.4, 50 * RAD], [25.9, 50 * RAD], [28.0, 60 * RAD], [HAND, 60 * RAD]]);
  // where he is in the picture: to the upper left while the planet comes up (room for it), then centred when the camera goes in
  const meteorX = mono([[0, 960], [25.9, 960], [31.0, 760], [33.2, 760], [34.6, 960], [HAND, 960]]);
  const meteorY = mono([[0, 540], [11.6, 540], [13.4, 430], [25.9, 430], [31.0, 330], [33.2, 330], [34.6, 450], [40.25, 450], [HAND, 470]]);
  // in the air the camera goes in close on him (the land drops out of the picture) and comes back out just before he falls
  const kS = mono([[0, 230], [3.6, 300], [14.0, 300], [14.7, 410], [24.2, 410], [25.5, 300], [27, 300], [31, 250], [33.2, 250], [34.6, 540], [40.25, 540], [41.2, 300], [HAND, 300]]);
  const kBase = mono([[0, 230], [3.6, 300], [14.0, 300], [14.7, 410], [24.2, 410], [25.5, 300], [27, 300], [31, 250], [33.2, 250], [HAND, 250]]);
  const zoomF = (t) => kS(t) / kBase(t);
  // while the camera is in close, the land is kept below the picture
  const lowLand = (t) => 800 * smoother(seg(t, 34.4, 35.2)) * (1 - smoother(seg(t, 39.6, 40.3)));

  function spaceCam(t) {
    const k = kS(t), b = F.bob(tF(t)) * (1 - smooth(1.0, 3.0, t)), M = mul(N, lat(t)), dl = lat(t) - camLat(t), S0 = [meteorX(t), meteorY(t)];
    const Ms = [S0[0] + k * (D[0] * b + N[0] * dl), S0[1] + k * (D[1] * b + N[1] * dl)], sh = mul(jolt(t + 0.37), 0.4);
    return { cam: I.camera(W, H, { cx: M[0] - (Ms[0] - W / 2) / k + sh[0], cy: M[1] - (Ms[1] - H / 2) / k + sh[1], k }), M, S0, k };
  }

  // ---- him in space ----------------------------------------------------------------------------------------------------------
  function spacePose(t, scope) {
    const lv = latV(t), steer = clamp(lv / 2, -1, 1);
    let pel = MPEL, lean = ML - 0.16 * lv, nod = -ML + 0.1, hF = add(BAL.F, [0, 0.09 * steer]), hB = add(BAL.B, [0, -0.09 * steer]), lenF = 0.36, lenB = 0.36, fL = MF('L');
    const dk = bump(t, ...T.duck); pel = add(pel, [0, 0.07 * dk]); lean += 0.25 * dk; nod -= 0.25 * dk; hF = add(hF, [0, 0.12 * dk]);
    const sw = bump(t, ...T.swerve); lean -= 0.22 * sw; nod += 0.15 * sw;
    nod += -0.18 * bump(t, 9.4, 11.0);
    // at the telescope: leaning in to it, and a little bounce at what he sees
    const look = smooth(T.view[0], T.view[1], t) * (1 - smooth(T.close[0], T.close[1], t)); lean += 0.08 * look; pel = add(pel, [0, 0.02 * look - 0.03 * Math.abs(Math.sin((t - 21.4) * 11)) * bump(t, 21.4, 22.0)]);
    const pt = bump(t, ...T.point);
    if (pt > 0) { const u = [Math.cos(dirP(t)), Math.sin(dirP(t))], sh = add(pel, [0, -0.2]); hF = lp(hF, add(sh, mul(u, 0.34)), Math.min(1, pt * 1.6)); nod += 0.12 * pt; }
    // the air: braced against the shaking, low, arms out and down
    const br = smooth(33, 34.5, t) * (1 - smooth(37.2, 38, t)), sk = shake(t);
    pel = add(pel, [0, 0.045 * br]); lean += 0.12 * br + 0.07 * sk * Math.sin(t * 43); nod += -0.1 * br + 0.05 * sk * Math.sin(t * 37);
    hF = add(hF, [0, 0.08 * br + 0.04 * sk * Math.sin(t * 29)]); hB = add(hB, [0, 0.08 * br - 0.04 * sk * Math.sin(t * 31)]);
    // burning: looking back at the opening; up on his front foot as the fire reaches the back one; then nothing under him
    const bn = smooth(37.2, 38.0, t), lift = smooth(LIFT - 0.25, LIFT + 0.1, t), down = smooth(T.gone - 0.05, T.gone + 0.2, t);
    pel = add(pel, [0.02 * lift, 0.05 * bn - 0.06 * lift]); lean += -0.12 * bn + 0.18 * lift; nod += 0.3 * bn * (1 - lift) - 0.35 * down;
    if (lift > 0) { fL = lp(fL, [MF('L')[0] + 0.12, MF('L')[1] - 0.2], lift); const wm = Math.sin(t * 13) * lift; hF = add(BAL.F, [0, -0.12 * wm]); hB = add(BAL.B, [0, 0.12 * wm]); }
    if (scope) { hF = scope.hF; hB = scope.hB; lenF = Math.max(0.36, scope.lenF); lenB = Math.max(0.36, scope.lenB); }
    return { root: { x: pel[0], y: pel[1], rot: 0, sx: 1 }, lean, bend: 1, nod, sh: MB.B.shN, feet: { L: wq(fL), R: wq(MF('R')) }, knee: { L: -1, R: 1 }, fore: { L: 0.85 * (1 - lift), R: 0 },
      hands: { F: wq(hF), B: wq(hB) }, elbow: { F: 1, B: -1 }, armLen: { F: lenF, B: lenB } };
  }
  // the telescope: pulled out, then swaying up and down as he searches, then still, locked on
  const pull = (t, a) => { const x = t - a; return x <= 0 ? 0 : 1 - Math.exp(-x * 10) * Math.cos(x * 28); };
  const sway = (t) => (0.15 * Math.sin(2 * PI * (t - 15.4) / 1.55 + 0.5) + 0.05 * Math.sin(2 * PI * (t - 15.4) / 0.7)) * smooth(15.4, 15.8, t) * (1 - smooth(17.4, 18.45, t)) + 0.012 * Math.sin((t - 18.45) * 30) * Math.exp(-Math.max(0, t - 18.45) * 8) * (t > 18.45 ? 1 : 0);
  function telescope(t, headC, aimAt) {
    if (t < T.out[0] || t > T.away[1]) return null;
    // aimed from the eyepiece at the planet (worked out twice: the eyepiece sits on the side of his head that faces it)
    let th = dirP(t); for (let k = 0; k < 2; k++) { const e = add(headC, mul([Math.cos(th), Math.sin(th)], MB.B.headR + 0.045)); if (aimAt) th = aimAt(e); }
    const th0 = th; th += sway(t); const u = [Math.cos(th), Math.sin(th)], n = [-u[1], u[0]];
    const E = add(headC, mul([Math.cos(th0), Math.sin(th0)], MB.B.headR + 0.045));
    const out = smooth(...T.out, t), back = smooth(...T.away, t);
    const e1 = Math.max(0, pull(t, 15.05) - smooth(24.15, 24.25, t)), e2 = Math.max(0, pull(t, 15.3) - smooth(24.05, 24.15, t));
    const L1 = 0.17, L2 = L1 + 0.15 * e1, L3 = L2 + 0.14 * e2;
    const behind = [MPEL[0] - 0.22, MPEL[1] - 0.12], at = lp(lp(behind, E, out), behind, back);
    return { base: at, eye: E, u, n, th, th0, L: [L1, L2, L3], hF: add(at, add(mul(u, L3 * 0.78), mul(n, 0.03))), hB: add(at, add(mul(u, 0.05), mul(n, -0.04))), lenF: 0.36, lenB: 0.36 };
  }
  function spaceHero(t, aimAt) {
    const s0 = MB.body(spacePose(t, null)), sc = telescope(t, s0.head.c, aimAt);
    const ln0 = MB.body(spacePose(t, sc ? { ...sc, lenF: dist(add(MPEL, [0, -0.2]), sc.hF) * 1.08, lenB: dist(add(MPEL, [0, -0.2]), sc.hB) * 1.08 } : null));
    let ln = ln0; const u = smoother(seg(t, ...T.arms));
    if (u < 1) { ln = MB.armsTo(ln, 1 - u); ln = MB.settle(ln, 1 - u); }
    return { ln, sc };
  }

  // ---- him on the ground ------------------------------------------------------------------------------------------------
  const CLIFF = F.CLIFF, TOP = CLIFF.filter((q) => q[1] < 0.2 && q[0] <= 0.001).sort((a, b) => a[0] - b[0]);
  const groundY = (x) => { if (x <= TOP[0][0]) return TOP[0][1]; for (let i = 1; i < TOP.length; i++) if (x <= TOP[i][0]) return lerp(TOP[i - 1][1], TOP[i][1], (x - TOP[i - 1][0]) / (TOP[i][0] - TOP[i - 1][0])); return TOP[TOP.length - 1][1]; };
  const LIEX = LANDX + 0.18, HIP = F.HIP, STRIDE = 0.30, SPAN = F.EDGE - LIEX;
  const STAND = { y: -HIP, rot: 0, lean: 0.05, nod: 0.12, bend: 0.4, fL: [LIEX - 0.07, 0.02], fR: [LIEX + 0.08, 0.02], hF: [0.13, 0.05], hB: [-0.1, 0.06] };
  const G = track([
    [HIT, { x: LIEX, y: -0.07, rot: 1.13, lean: 0, nod: 0.05, bend: 0.5, fL: [LIEX - 0.33, -0.01], fR: [LIEX - 0.27, -0.06], hF: [0.32, 0.2], hB: [0.1, 0.24] }],
    [HIT + 1.07, { x: LIEX, y: -0.07, rot: 1.13, nod: -0.15 }],
    [HIT + 1.67, { x: LIEX - 0.04, y: -0.2, rot: 0.72, nod: 0.05, fL: [LIEX - 0.2, 0.0], fR: [LIEX - 0.12, 0.0], hF: [0.34, 0.21], hB: [0.3, 0.22] }],
    [S, { x: LIEX, ...STAND }],
    [S + 1.95, { lean: 0.05, nod: 0.12 }],
    // up at the sky he fell out of
    [S + 2.6, { lean: -0.12, nod: -0.42 }], [S + 3.2, { lean: -0.12, nod: -0.4 }],
    // left: nothing
    [S + 3.65, { lean: 0.14, nod: 0.06 }], [S + 4.4, { lean: 0.16, nod: 0.08 }],
    // right; a tick from somewhere over there: he listens
    [S + 4.85, { lean: 0.1, nod: 0.08, hF: [0.13, 0.05] }],
    [S + 5.25, { lean: 0.03, nod: -0.06, hF: [0.25, -0.38] }], [S + 5.9, { lean: 0.03, nod: -0.04, hF: [0.25, -0.38] }],
    [S + 6.3, { lean: 0.12, nod: 0.14, hF: [0.13, 0.05] }],
    [WALK[0], { x: LIEX, lean: 0.1, nod: 0.12, fL: [LIEX - 0.07, 0.02], fR: [LIEX + 0.08, 0.02] }],
    [WALK[1], { x: F.EDGE, lean: 0.03, nod: 0.16, fL: [F.EDGE - 0.07, 0.02], fR: [F.EDGE + 0.08, 0.02] }],
    // the edge: a start, then he leans in to look, hand to his chin
    [WALK[1] + 0.25, { y: -HIP - 0.04, lean: -0.08, nod: -0.05 }], [WALK[1] + 0.5, { y: -HIP, lean: 0.03 }],
    [WALK[1] + 1.0, { lean: 0.22, nod: 0.3, hF: [0.17, -0.32] }], [WALK[1] + 2.5, { lean: 0.2, nod: 0.26, hF: [0.17, -0.32] }],
    [CUT - 0.2, { lean: 0.03, nod: 0.16, hF: [0.13, 0.05], hB: [-0.1, 0.06] }]
  ]);
  const facing = (t) => (t > S + 3.45 && t < S + 4.6 ? -1 : 1);
  // the walk: a couple of careful steps, a glance, then a steady walk, slowing to the edge
  const walkX = mono([[WALK[0], 0], [WALK[0] + 1.25, 0.42], [WALK[0] + 1.85, 0.5], [WALK[1] - 1.35, SPAN - 0.5], [WALK[1], SPAN]]);
  function groundPose(t) {
    if (t < HIT) {
      const dt = t - HAND, y = Q0[1] + MPEL[1] + FALLV * dt + FALLG * dt * dt, x = LANDX + MPEL[0] + 0.3 * dt, sp = smoother(dt / (HIT - HAND)), fl = Math.sin(dt * 22);
      return { root: { x, y, rot: 1.13 * sp, sx: 1 }, lean: ML * (1 - sp), bend: 0.8, nod: -0.3 + 0.2 * sp, feet: { L: lc([-0.12, 0.26 - 0.06 * fl]), R: lc([0.14, 0.24 + 0.06 * fl]) }, knee: { L: 1, R: 1 },
        hands: { F: lc([0.3, -0.22 + 0.12 * fl]), B: lc([-0.28, -0.2 - 0.12 * fl]) }, elbow: { F: 1, B: -1 } };
    }
    const g = G(t), sx = facing(t); let { x, y, rot, lean, nod } = g, fL = g.fL, fR = g.fR, hF = g.hF, hB = g.hB;
    y += 0.03 * bump(t, HIT, HIT + 0.25);
    const pat = bump(t, S + 0.15, S + 1.35); if (pat > 0) { const ph = (t - S - 0.15) * 9; hF = lp(hF, [0.06 + 0.04 * Math.sin(ph), -0.1 + 0.18 * (0.5 + 0.5 * Math.sin(ph * 0.5))], pat); hB = lp(hB, [0.0 + 0.04 * Math.cos(ph), 0.0 + 0.1 * (0.5 + 0.5 * Math.cos(ph * 0.6))], pat); lean += 0.1 * pat; }
    nod += 0.14 * Math.sin((t - S - 1.35) * 26) * bump(t, S + 1.35, S + 1.9);
    // weight shifting while he looks about
    if (t > S + 2 && t < WALK[0]) { const ws = 0.012 * Math.sin((t - S) * 2.1); x += ws; }
    // the walk
    if (t >= WALK[0] - 0.05 && t <= WALK[1] + 0.3) {
      x = LIEX + walkX(t);
      const s = x - LIEX, u = s / STRIDE, X = (q) => LIEX + STRIDE * q, ease = smooth(WALK[0], WALK[0] + 0.25, t) * (1 - smooth(WALK[1] - 0.2, WALK[1] + 0.25, t));
      // how much he is walking: feet lift, arms swing and he bobs only as much as he is moving
      const act = clamp((walkX(t + 0.03) - walkX(t - 0.03)) / 0.06 / 0.45, 0, 1);
      const foot = (off) => { const v = u - off, m = Math.floor(v / 2), f = v - 2 * m; if (f < 1) return [X(2 * m + off) + 0.13, 0]; const w = f - 1; return [lerp(X(2 * m + off), X(2 * m + 2 + off), smoother(w)) + 0.13, -0.075 * act * Math.sin(PI * Math.pow(w, 1.3))]; };
      const a = foot(0), b = foot(1);
      fL = lp(fL, [a[0], groundY(a[0]) + 0.02 + a[1]], ease); fR = lp(fR, [b[0], groundY(b[0]) + 0.02 + b[1]], ease);
      const fr = u - Math.floor(u), bob = 0.018 * act * Math.cos(2 * PI * (fr - 0.33));
      y = lerp(y, -0.33 + 0.025 * act + bob, ease);
      const sw = Math.sin(PI * u) * ease * act; hF = add(hF, [0.11 * sw, -0.025 * Math.abs(sw)]); hB = add(hB, [-0.11 * sw, -0.025 * Math.abs(sw)]);
      lean += 0.06 * ease * act; nod += 0.025 * Math.sin(2 * PI * u) * ease * act;
      // the glance on the way
      nod += -0.12 * bump(t, WALK[0] + 1.2, WALK[0] + 2.0); lean += 0.06 * bump(t, WALK[0] + 1.2, WALK[0] + 2.0);
    }
    nod += 0.05 * ATICKS.reduce((s, k) => s + bump(tau(t), k, k + 0.4), 0) * smooth(WALK[1] + 0.2, WALK[1] + 0.8, t);
    const P = [x, y], h = (o) => wq(add(P, [sx * o[0], o[1]]));
    return { root: { x, y, rot, sx }, lean, bend: g.bend, nod, feet: { L: wq(fL), R: wq(fR) }, knee: { L: 1, R: 1 }, hands: { F: h(hF), B: h(hB) }, elbow: { F: -1, B: 1 } };
  }
  function groundHero(t) {
    let ln = MB.body(groundPose(t));
    const u = smoother(seg(tau(t), -0.7, 0.1));
    if (u > 0) { const f = F.hero(Math.max(0, tau(t))), bl = (a, b) => MB.resample(a, 40).map((q, i) => lp(q, MB.resample(b, 40)[i], u)); ln = { ...f, spine: bl(ln.spine, f.spine), legL: bl(ln.legL, f.legL), legR: bl(ln.legR, f.legR), armF: bl(ln.armF, f.armF), armB: bl(ln.armB, f.armB), head: { ...f.head, c: lp(ln.head.c, f.head.c, u), a: lerp(ln.head.a, f.head.a, u) } }; }
    return ln;
  }

  // ---- drawing --------------------------------------------------------------------------------------------------------------
  const { bg, fg } = I.THEMES[THEME];
  const polyPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); };
  const dashPhase = table((t) => (1 + 2 * boost(t)) / 1.5, TF0 / 1.5);
  const tailPt = (tr, q, side) => { const o = 1 - q; return [-(3 * o * o * q * 0.41 + 3 * o * q * q * 0.79 + q * q * q) * tr.L, side * (o * o * o + 3 * o * o * q + 3 * o * q * q * 0.34 + 0.1 * q * q * q) * tr.r]; };
  // the trail, as the site draws it, bent along his path; in the air it streams faster and catches fire
  function trail(ctx, t, cam, M, j, amt) {
    if (amt <= 0) return;
    const v = Math.max(vel(t), 0.5), r = dive(t), env = (p) => add(M, rotv(sub(p, M), r)), f = fireA(t), dp = dashPhase(t);
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = amt;
    F.TR.forEach((tr, i) => {
      for (const side of [1, -1]) {
        const pts = [];
        for (let a = 0; a <= 18; a++) { const g = side * (PI / 2) * a / 18; pts.push([tr.r * Math.cos(g), tr.r * Math.sin(g)]); }
        for (let s = 1; s <= 40; s++) pts.push(tailPt(tr, s / 40, side));
        const scr = pts.map(([xp, yp]) => {
          const bend = xp < 0 ? lat(t + xp / v) - lat(t) : 0, back = Math.max(0, -xp) / tr.L;
          const flame = f * (0.02 + 0.07 * back) * Math.sin(9 * xp - 17 * t + 1.7 * i + side) * (0.75 + 0.25 * Math.sin(23 * t + i * 2 + side));
          return j(cam(...env(add(M, add(mul(D, xp), mul(N, yp + bend + side * flame))))));
        });
        let L = 0; for (let k = 1; k < scr.length; k++) L += dist(scr[k], scr[k - 1]);
        ctx.lineWidth = tr.w * cam.k * (1 + f * (0.5 + 0.3 * Math.sin(t * 19 + i))); ctx.setLineDash([(0.07 + 0.05 * f) * L, (0.025 + 0.012 * f) * L]); ctx.lineDashOffset = -0.095 * L * ((dp + 0.11 * i / 1.5) % 1);
        polyPath(ctx, scr); ctx.stroke();
      }
    });
    ctx.restore();
  }
  // flames licking round the front of the loop and streaming back with the flow; sparks along the trail
  function leadFire(ctx, t, cam, M, j) {
    const f = fireA(t); if (f <= 0) return;
    const r = dive(t), Dr = rotv(D, r), Nr = rotv(N, r), W2 = (p) => add(M, rotv(p, r));
    // one flame: a tongue from a base along a direction, flickering, filled
    const tongue = (base, dir, len, wid) => { const nn = [-dir[1], dir[0]], tip = add(base, mul(dir, len)), mid = add(base, mul(dir, len * 0.45));
      const A = j(cam(...add(base, mul(nn, wid)))), B = j(cam(...add(base, mul(nn, -wid)))), C1 = j(cam(...add(mid, mul(nn, wid * 1.1)))), C2 = j(cam(...add(mid, mul(nn, -wid * 1.1)))), Tt = j(cam(...tip));
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(C1[0], C1[1], Tt[0], Tt[1]); ctx.quadraticCurveTo(C2[0], C2[1], B[0], B[1]); ctx.closePath(); ctx.fill(); };
    ctx.save(); ctx.fillStyle = fg;
    // round the front of the loop, streaming back with the flow
    for (let k = -6; k <= 6; k++) {
      const ph = (k === 0 ? 0.08 : k * 0.27), sgn = k < 0 ? -1 : 1, rr = RO + 0.035;
      const base = add(M, add(mul(Dr, Math.cos(ph) * rr), mul(Nr, Math.sin(ph) * rr)));
      const tang = add(mul(Dr, -Math.sin(Math.abs(ph))), mul(Nr, sgn * Math.cos(ph))), out = add(mul(Dr, Math.cos(ph)), mul(Nr, Math.sin(ph)));
      const dir = (() => { const d = add(tang, mul(out, 0.35 + 0.15 * Math.sin(t * 11 + k))); const l = Math.hypot(...d); return [d[0] / l, d[1] / l]; })();
      const fl = 0.5 + 0.5 * Math.sin(t * 19 + k * 2.3) * Math.sin(t * 7.3 + k);
      tongue(base, dir, f * (0.16 + 0.2 * fl) * (1 + 0.7 * Math.abs(k) / 6), f * 0.034);
    }
    // licks of flame along the trail lines
    F.TR.forEach((tr, i) => { if (i > 3) return; for (const side of [1, -1]) for (const q0 of [0.12, 0.3, 0.5]) {
      const q = q0 + 0.04 * Math.sin(t * 3 + i + side), p = tailPt(tr, q, side), p2 = tailPt(tr, q + 0.02, side), d = sub(p2, p), l = Math.hypot(...d) || 1, dir = rotv([d[0] / l, d[1] / l], 0);
      const fl = 0.5 + 0.5 * Math.sin(t * 17 + i * 3 + q0 * 20 + side);
      tongue(W2(add(mul(D, p[0]), mul(N, p[1]))), rotv(add(mul(D, dir[0]), mul(N, dir[1])), r), f * (0.1 + 0.16 * fl) * (1 - q0), f * 0.022);
    } });
    // sparks carried back along the trail
    for (let e = 0; e < 40; e++) {
      const tr = F.TR[e % 6], side = e % 2 ? 1 : -1, age = (t * (0.9 + 0.2 * (e % 5) / 5) + e / 40) % 1, p = tailPt(tr, 0.05 + 0.7 * age, side), P = cam(...W2(add(mul(D, p[0]), mul(N, p[1]))));
      ctx.globalAlpha = f * (1 - age); ctx.beginPath(); ctx.arc(P[0], P[1], Math.max(1.5, 0.013 * cam.k * (1 - 0.7 * age)), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  const sPhase = table((t) => vel(t) / 4 * (1 + boost(t)) * 240 / 0.9, 240 * TF0 / 0.9);
  function streaks(ctx, t, cam, M, j, amt) {
    if (amt <= 0) return;
    const off = -(sPhase(t) % 240), r = dive(t), SV = F.SV, ll = lat(t) * SV, stretch = 1 + 1.2 * boost(t);
    const hidden = (x, y) => x * x + y * y < 68 * 68 || (x < 0 && Math.abs(y) < 100 - 40 * Math.min(1, -x / 420));
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = 0.45 * amt;
    for (const [x0, y0, len0, wd] of F.STREAKS) {
      const y = ((y0 - ll + 330) % 660 + 660) % 660 - 330, len = len0 * stretch; ctx.lineWidth = wd / SV * cam.k;
      for (let rep = -4; rep <= 4; rep++) {
        const xs = x0 + off + 240 * rep; if (xs > 420 || xs + len < -420) continue;
        ctx.beginPath(); let pen = false;
        for (let s = 0; s <= 8; s++) { const x = xs + len * s / 8; if (hidden(x, y)) { pen = false; continue; } const q = add(M, rotv(add(mul(D, x / SV), mul(N, y / SV)), r)), P = j(cam(q[0], q[1])); if (pen) ctx.lineTo(P[0], P[1]); else ctx.moveTo(P[0], P[1]); pen = true; }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function rocks(ctx, t, cam, M, j) {
    const r = dive(t), at = along(t);
    for (const rk of ROCKS) {
      const p0 = add(mul(D, along(rk.tp) - at), mul(N, rk.n)), p = add(M, rotv(sub(p0, mul(N, lat(t))), r));
      if (dist(p, M) > 7) continue;
      const a0 = rk.spin * t, pts = rk.shape.map((m, i) => { const a = a0 + 2 * PI * i / rk.shape.length; return j(cam(p[0] + rk.r * m * Math.cos(a), p[1] + rk.r * m * Math.sin(a))); });
      const back = rotv(D, r); ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.2, 0.012 * cam.k); ctx.globalAlpha = 0.5;
      for (const o of [-0.5, 0.15, 0.6]) { const s = add(p, mul(rotv(N, r), o * rk.r)), A = cam(...add(s, mul(back, rk.r * 1.1))), B = cam(...add(s, mul(back, rk.r * (1.1 + 1.2 + 0.6 * Math.abs(o))))); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = fg; polyPath(ctx, pts); ctx.closePath(); ctx.fill();
      if (rk.r > 0.12) { ctx.strokeStyle = bg; ctx.lineWidth = Math.max(1, 0.012 * cam.k); for (const [cx, cy, cr] of rk.craters) { const c = rotv([cx * rk.r, cy * rk.r], a0), s = cam(p[0] + c[0], p[1] + c[1]); ctx.beginPath(); ctx.arc(s[0], s[1], cr * rk.r * cam.k, 0, 7); ctx.stroke(); } }
    }
  }
  function farPlanets(ctx, t, cam, M, j) {
    const r = dive(t), at = along(t);
    for (const pl of FAR) {
      const rel = add(mul(D, (along(pl.tp) - at) * pl.par), mul(N, (pl.n - lat(t)) * pl.par)), p = add(M, rotv(rel, r));
      if (dist(p, M) > 9) continue;
      const c = cam(p[0], p[1]), R = pl.R * cam.k, lw = Math.max(1.4, 0.014 * cam.k);
      ctx.save(); ctx.strokeStyle = fg; ctx.lineWidth = lw;
      const ring = (half) => { ctx.beginPath(); ctx.ellipse(c[0], c[1], R * 2.0, R * 0.42, pl.tilt, half ? PI : 0, half ? 2 * PI : PI); ctx.stroke(); };
      if (pl.kind === 'ringed') ring(true);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, 7); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.clip();
      if (pl.kind === 'ringed') for (let b = -3; b <= 3; b++) { ctx.beginPath(); for (let s = -1.1; s <= 1.1; s += 0.05) { const q = rotv([s * R, b * R * 0.26 + 0.04 * R * Math.sin(s * 5 + b)], pl.tilt); const P = j([c[0] + q[0], c[1] + q[1]]); if (s === -1.1) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]); } ctx.stroke(); }
      else for (const [x, y, cr] of [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.15, -0.45, 0.1], [-0.2, 0.45, 0.12]]) { ctx.beginPath(); ctx.arc(c[0] + x * R, c[1] + y * R, cr * R, 0, 7); ctx.stroke(); }
      ctx.restore();
      if (pl.kind === 'ringed') ring(false);
      ctx.restore();
    }
  }
  const planetAt = (t, S0) => { const z = zoomF(t), rho = Math.exp(rhoP(t)) * z, th = dirP(t) + dive(t), gp = (gapP(t) + lowLand(t)) * z; return { c: [S0[0] + (gp + rho) * Math.cos(th), S0[1] + (gp + rho) * Math.sin(th)], rho }; };
  function planet(ctx, t, cam, S0, j) {
    if (t < 12.4) return;
    const { c, rho } = planetAt(t, S0), a = smooth(12.4, 13.2, t);
    ctx.save(); ctx.globalAlpha = a;
    const air = smooth(28.5, 31, t);
    if (air > 0) { ctx.strokeStyle = fg; ctx.lineWidth = 1.1; const step = F.STEP * cam.k, n = Math.round(26 + 22 * smooth(33.2, 34.6, t) * (1 - smooth(40.25, 41.25, t))); for (let i = 1; i <= n; i++) { ctx.globalAlpha = a * air * Math.pow(1 - i / (n + 1), 0.7); ctx.beginPath(); ctx.arc(c[0], c[1], rho + i * step, 0, 7); ctx.stroke(); } ctx.globalAlpha = a; }
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(c[0], c[1], rho, 0, 7); ctx.fill();
    const bandA = 1 - smooth(700, 2600, rho);
    if (bandA > 0 && rho > 9) { ctx.save(); ctx.clip(); ctx.strokeStyle = bg; ctx.lineWidth = Math.max(1, rho * 0.012); ctx.globalAlpha = a * bandA; for (let b = -3; b <= 3; b++) { ctx.beginPath(); for (let s = -1.05; s <= 1.06; s += 0.03) { const q = rotv([s * rho, b * rho * 0.27 + 0.05 * rho * Math.sin(s * 6 + b * 1.7 + t * 0.2)], -0.3); const P = [c[0] + q[0], c[1] + q[1]]; if (s === -1.05) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]); } ctx.stroke(); } ctx.restore(); }
    ctx.restore();
  }
  // the telescope's aim: a small dotted circle that sways as it does, then locks on the dot; the close-up opens out of it
  const VIEW = { c: [1565, 300], r: 235 };
  function scopeAim(ctx, t, cam, M, S0, sc, j) {
    if (!sc) return;
    const vis = smooth(15.35, 15.65, t) * (1 - smooth(T.close[1], T.close[1] + 0.3, t)); if (vis <= 0) return;
    const { c: pc } = planetAt(t, S0), E = cam(...add(M, sc.eye)), Dd = dist(pc, E), R = add(E, [Dd * Math.cos(sc.th), Dd * Math.sin(sc.th)]);
    const lock = smooth(T.lock - 0.05, T.lock + 0.1, t), rr = 24 * (1 + 0.35 * bump(t, T.lock - 0.05, T.lock + 0.3));
    ctx.save(); ctx.globalAlpha = vis; ctx.fillStyle = fg; ctx.strokeStyle = fg;
    for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * PI + t * 0.6; ctx.beginPath(); ctx.arc(R[0] + rr * Math.cos(a), R[1] + rr * Math.sin(a), 2.6, 0, 7); ctx.fill(); }
    // locked: four little marks round it
    if (lock > 0) { ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.globalAlpha = vis * lock; for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; ctx.beginPath(); ctx.moveTo(R[0] + (rr + 6) * Math.cos(a), R[1] + (rr + 6) * Math.sin(a)); ctx.lineTo(R[0] + (rr + 15) * Math.cos(a), R[1] + (rr + 15) * Math.sin(a)); ctx.stroke(); } }
    ctx.restore();
    // the close-up: out of the circle, up to its place, joined to the circle by two dashed lines
    const open = smoother(seg(t, ...T.view)) * (1 - smoother(seg(t, ...T.close)));
    if (open <= 0) return;
    const C = lp(R, VIEW.c, open), Rv = lerp(rr, VIEW.r, open), d = dist(C, R);
    if (d > Rv - rr + 2) {
      const ph = Math.atan2(C[1] - R[1], C[0] - R[0]), be = Math.asin(clamp((Rv - rr) / d, -1, 1));
      ctx.save(); ctx.strokeStyle = fg; ctx.lineWidth = 2.2; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 30; ctx.globalAlpha = Math.min(1, open * 2);
      for (const sg of [1, -1]) { const nA = ph + sg * (PI / 2 + be), p1 = [R[0] + rr * Math.cos(nA), R[1] + rr * Math.sin(nA)], p2 = [C[0] + Rv * Math.cos(nA), C[1] + Rv * Math.sin(nA)]; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
      ctx.restore();
    }
    scopeView(ctx, t, C, Rv, Math.min(1, open * 1.6));
  }
  // what the telescope shows: that planet up close, and on it a loop in its rings, its opening ticking round
  function scopeView(ctx, t, C, R, a) {
    const pop = R / VIEW.r;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(C[0], C[1], R, 0, 7); ctx.fill();
    ctx.save(); ctx.clip();
    const pc = [C[0] - 40 * pop, C[1] + 420 * pop], pr = 380 * pop;
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(pc[0], pc[1], pr, 0, 7); ctx.fill();
    ctx.strokeStyle = bg; ctx.lineWidth = 3 * pop; for (let b = 1; b <= 3; b++) { ctx.beginPath(); ctx.arc(pc[0], pc[1], pr - b * 55 * pop, PI * 1.05, PI * 1.95); ctx.stroke(); }
    const KS = 105 * pop, lc2 = [C[0] + 10 * pop, C[1] - 72 * pop], cam2 = I.camera(W, H, { cx: -(lc2[0] - W / 2) / KS, cy: -(lc2[1] - H / 2) / KS, k: KS });
    ctx.strokeStyle = fg; ctx.lineWidth = 2 * pop; for (let b = 1; b <= 4; b++) { ctx.globalAlpha = a * (1 - b / 5); ctx.beginPath(); ctx.arc(lc2[0], lc2[1], (RO + 0.12 * b) * KS, 0, 7); ctx.stroke(); }
    const tick = (t - T.view[0]) / 1.2, turn = (PI / 6) * (Math.floor(tick) + hand((tick - Math.floor(tick)) * 1.2));
    ctx.globalAlpha = a; MB.drawMark(ctx, cam2, (q) => q, fg, bg, 'loop', [0, 0], turn);
    ctx.restore();
    ctx.strokeStyle = fg; ctx.lineWidth = Math.max(3, 14 * pop); ctx.beginPath(); ctx.arc(C[0], C[1], R, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // fire at the two burning ends of the loop
  function fire(ctx, t, cam, M, j) {
    const b = burnt(t); if (b <= 0 || t > HAND) return;
    const back = rotv(mul(D, -1), dive(t)), side = [-back[1], back[0]], s = smooth(T.burn[0], T.burn[0] + 0.4, t) * (1 - smooth(T.gone - 0.05, T.gone + 0.15, t));
    for (const [k, ang] of [[0, -105 + b], [1, 225 - b]]) {
      const p = add(M, [RM * Math.cos(ang * RAD), RM * Math.sin(ang * RAD)]);
      ctx.save(); ctx.fillStyle = fg; ctx.strokeStyle = fg; ctx.lineCap = 'round';
      for (let q = 0; q < 3; q++) { const fl = 0.11 + 0.07 * (0.5 + 0.5 * Math.sin(t * 23 + q * 2.1 + k * 4)), wv = 0.035 * Math.sin(t * 17 + q * 3), base = add(p, mul(side, (q - 1) * 0.025)), tip = add(add(base, mul(back, fl * s)), mul(side, wv)); const A = j(cam(...add(base, mul(side, 0.022)))), B = j(cam(...add(base, mul(side, -0.022)))), Tt = j(cam(...tip)); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(Tt[0] * 0.5 + A[0] * 0.5, Tt[1] * 0.5 + A[1] * 0.5, Tt[0], Tt[1]); ctx.quadraticCurveTo(Tt[0] * 0.5 + B[0] * 0.5, Tt[1] * 0.5 + B[1] * 0.5, B[0], B[1]); ctx.closePath(); ctx.fill(); }
      for (let e = 0; e < 9; e++) { const age = ((t * 1.6 + e / 9 + k * 0.37) % 1), h = Math.sin(e * 12.9898 + k * 78.233) * 43758.5453 % 1, q = add(add(p, mul(back, age * 0.75)), mul(side, (h - 0.5) * 0.4 * age)), P = cam(q[0], q[1]); ctx.globalAlpha = s * (1 - age); ctx.beginPath(); ctx.arc(P[0], P[1], Math.max(1.5, 0.012 * cam.k * (1 - age)), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 0.3 * s; ctx.lineWidth = Math.max(1.2, 0.01 * cam.k);
      for (let m = 0; m < 2; m++) { ctx.beginPath(); for (let u = 0; u <= 20; u++) { const f = u / 20, q = add(add(p, mul(back, f * 1.3)), mul(side, 0.06 * Math.sin(f * 9 - t * 6 + m * 2) * f + (m - 0.5) * 0.08 * f)), P = j(cam(q[0], q[1])); if (u) ctx.lineTo(P[0], P[1]); else ctx.moveTo(P[0], P[1]); } ctx.stroke(); }
      ctx.restore();
    }
  }
  function loopNow(ctx, t, cam, M, j) {
    if (t >= T.gone) return;
    const b = burnt(t), shk = (Math.floor(tF(t) / 0.11) % 2 ? 1 : -1) * (1 - smooth(32.0, 33.0, t)), at = add(M, [0.45 / F.SV * shk, -0.35 / F.SV * shk]), turn = -0.06 * latV(t);
    if (b <= 0) { MB.drawMark(ctx, cam, j, fg, bg, 'loop', at, turn); return; }
    if (b >= 164.5) return;
    const sc = cam(at[0], at[1]), a0 = (-105 + b) * RAD + turn, a1 = (225 - b) * RAD + turn;
    ctx.save(); ctx.beginPath(); ctx.moveTo(sc[0], sc[1]); ctx.arc(sc[0], sc[1], 1.3 * RO * cam.k, a0, a1); ctx.closePath(); ctx.clip();
    MB.drawMark(ctx, cam, j, fg, bg, 'loop', at, turn); ctx.restore();
  }
  function drawScope(ctx, sc, cam, j) {
    if (!sc) return;
    const wd = [0.095, 0.08, 0.066]; ctx.save(); ctx.lineCap = 'butt';
    for (let i = 0; i < 3; i++) { const a = add(sc.base, mul(sc.u, i ? sc.L[i - 1] - 0.012 : -0.02)), b = add(sc.base, mul(sc.u, sc.L[i])); if (dist(a, b) < 0.005) continue; const A = j(cam(a[0], a[1])), B = j(cam(b[0], b[1])); ctx.strokeStyle = fg; ctx.lineWidth = wd[i] * cam.k; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
    ctx.strokeStyle = bg; ctx.lineWidth = Math.max(1.2, 0.008 * cam.k);
    for (let i = 0; i < 2; i++) { const q = add(sc.base, mul(sc.u, sc.L[i] - 0.012)), h = mul(sc.n, wd[i] * 0.5), A = cam(...add(q, h)), B = cam(...sub(q, h)); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
    ctx.restore();
  }
  function dust(ctx, t, cam, j) {
    const d = seg(t, HIT, HIT + 0.9); if (d > 0 && d < 1) { ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, 0.012 * cam.k); ctx.globalAlpha = 1 - d; for (let i = 0; i < 7; i++) { const dir = (i < 3.5 ? -1 : 1), x0 = LIEX + 0.1 + (i - 3) * 0.12, r = 0.05 + 0.25 * d * (0.6 + 0.1 * i % 3); const c = cam(x0 + dir * 0.3 * d, -0.04 - 0.18 * d * Math.sin(1 + i)); ctx.beginPath(); ctx.arc(c[0], c[1], r * cam.k * 0.5, PI * 1.1, PI * 1.9); ctx.stroke(); } ctx.restore(); }
    const pd = bump(t, S + 0.15, S + 1.75); if (pd > 0) { ctx.save(); ctx.fillStyle = fg; for (let i = 0; i < 12; i++) { const age = ((t - S) * 1.4 + i / 12) % 1, h = (Math.sin(i * 91.7) * 43758.5) % 1, c = cam(LIEX + 0.05 + (h - 0.5) * 0.3 + 0.25 * age * Math.sign(h - 0.5), -0.25 - 0.3 * age + 0.15 * h); ctx.globalAlpha = pd * (1 - age) * 0.8; ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(1.5, 0.008 * cam.k), 0, 7); ctx.fill(); } ctx.restore(); }
  }

  // ---- the ground: camera and field --------------------------------------------------------------------------------------
  const GC = key([[HAND, [LANDX, Q0[1] + (540 - meteorY(HAND)) / 300]], [HIT + 0.3, [LANDX + 0.3, -0.62]], [WALK[0], [LANDX + 0.4, -0.62]], [WALK[1] + 0.4, [1.25, 0.32]], [DUR, [1.25, 0.32]]]);
  const GK = key([[HAND, 300], [WALK[0], 300], [WALK[1] + 0.4, 268], [DUR, 268]]);
  function groundField(ctx, t, cam, j) {
    const u = tau(t), w = smoother(seg(t, HIT + 1.5, S + 7)), C0 = F.C0, ph = phaseA(u);
    const Fv = (x, y) => (1 - w) * (-y / F.STEP) + w * (F.tunnel(x, y, C0) / F.STEP - ph);
    const mask = (x, y) => { const air = clamp(1 - Math.max(0, -y) / 2.2, 0, 1); return ((1 - w) * air + w) * clamp((Math.hypot(x - C0[0], y - C0[1]) - RO - 0.05) / 0.1, 0, 1); };
    FL.contours(ctx, Fv, cam, W, H, { step: 1, phase: 0, cell: 6, mask, width: lerp(1.1, 1.0, w), color: fg, j });
  }

  // ---- the picture ---------------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(19), o = []; for (let i = 0; i < 90; i++) o.push([r() * W * 1.4 - W * 0.2, r() * H * 1.4 - H * 0.2, 0.8 + r() * 1.4, 0.15 + r() * 0.3]); return o; })();
  function draw(ctx, t) {
    if (tau(t) >= 0.8) return F.draw(ctx, tau(t));
    I.background(ctx, THEME, W, H);
    if (t < HAND) {
      const { cam, M: M0, S0 } = spaceCam(t), j = I.boil(t, smooth(1.2, 3.0, t)), at = along(t), M = add(M0, jolt(t));
      ctx.fillStyle = fg; for (const [x, y, r, a] of STARS) { const q = add([x, y], mul(rotv(D, dive(t)), -at * 4)); ctx.globalAlpha = a * smooth(2, 5, t); ctx.beginPath(); ctx.arc(((q[0] % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2, ((q[1] % (H * 1.4)) + H * 1.4) % (H * 1.4) - H * 0.2, r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      farPlanets(ctx, t, cam, M0, j);
      planet(ctx, t, cam, S0, j);
      streaks(ctx, t, cam, M0, j, 1 - smooth(37.5, 40, t));
      trail(ctx, t, cam, M, j, 1 - smooth(39.8, 41.0, t));
      rocks(ctx, t, cam, M0, j);
      leadFire(ctx, t, cam, M, j);
      loopNow(ctx, t, cam, M, j);
      fire(ctx, t, cam, M, j);
      const pc = planetAt(t, S0).c, aimAt = (e) => { const q = cam(...add(M, e)); return Math.atan2(pc[1] - q[1], pc[0] - q[0]); };
      const bm = 1 - smoother(seg(t, ...T.brush)), { ln, sc } = spaceHero(t, t > 12.4 ? aimAt : null), rel = (q) => add(M, q);
      const place = (l) => { const m = (pts) => pts.map(rel); return { ...l, spine: m(l.spine), legL: m(l.legL), legR: m(l.legR), armF: m(l.armF), armB: m(l.armB), head: { ...l.head, c: rel(l.head.c) } }; };
      if (bm < 1) { ctx.globalAlpha = smooth(0, 0.6, 1 - bm); MB.draw(ctx, place(ln), cam, j, fg); ctx.globalAlpha = 1; }
      if (bm > 0) { ctx.globalAlpha = smooth(0.3, 1, bm); MB.drawMark(ctx, cam, (q) => q, fg, bg, 'figure', M, 0); ctx.globalAlpha = 1; }
      if (sc) drawScope(ctx, { ...sc, base: rel(sc.base) }, cam, j);
      scopeAim(ctx, t, cam, M, S0, sc, j);
      I.vignette(ctx, THEME, W, H, lerp(0.072, 0.18, smooth(0.5, 3, t)));
    } else {
      const cam = I.camera(W, H, { cx: GC(t)[0], cy: GC(t)[1], k: GK(t) }), j = I.boil(tau(t), 1.0);
      groundField(ctx, t, cam, j);
      ctx.fillStyle = fg; ctx.beginPath(); CLIFF.forEach((q, i) => { const s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
      MB.drawMark(ctx, cam, j, fg, bg, 'loop', F.C0, clockA(tau(t)));
      dust(ctx, t, cam, j);
      MB.draw(ctx, groundHero(t), cam, j, fg);
      I.vignette(ctx, THEME, W, H, 0.18);
    }
  }

  // ---- sound --------------------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 13.2, [65.41, 130.81, 196, 261.63, 329.63, 392]], [12.6, 26.2, [87.31, 130.81, 174.61, 220, 261.63]], [25.7, 33.4, [98, 146.83, 196, 246.94]], [32.9, HAND + 0.2, [73.42, 110, 138.59, 174.61]], [HIT + 0.6, S + 6.4, [110, 164.81, 220, 261.63]], [S + 5.9, DUR + 0.5, [73.42, 110, 146.83, 174.61]]] }];
    const L = Math.ceil(DUR * 20) + 2, trk = (f) => Array.from({ length: L }, (_, i) => f(i / 20));
    ev.push({ t: 0, type: 'fallwind', dur: HAND + 0.2, track: trk((s) => (s < HAND ? lerp(0.69, 1, smooth(33, 35, s)) * (1 - smooth(40.9, 41.3, s)) : 0)) });
    for (const rk of ROCKS) if (rk.r > 0.12) { const side = Math.sign(rk.n - lat(rk.tp)) || 1; ev.push({ t: rk.tp - 0.3, type: 'whoosh', dur: 0.6, amp: 0.08 + 0.2 * rk.r, from: 0.5 * side, to: -0.5 * side }); }
    ev.push({ t: T.duck[0] + 0.25, type: 'swish' }, { t: 10.2, type: 'whoosh', dur: 2.5, amp: 0.06, from: 0.6, to: -0.6 });
    // the telescope: out (click, click); the search (soft blips as the circle sways); locked; the view; away
    ev.push({ t: 14.6, type: 'zip' }, { t: 15.05, type: 'tap' }, { t: 15.3, type: 'tap' });
    [15.9, 16.7, 17.5].forEach((s) => ev.push({ t: s, type: 'chirp', f: 2600 }));
    ev.push({ t: T.lock, type: 'tick', amp: 0.2 }, { t: T.view[0] + 0.1, type: 'whoosh', dur: 0.6, amp: 0.08, from: -0.2, to: 0.6 }, { t: T.view[1], type: 'hi', notes: [587.33, 783.99] }, { t: 21.45, type: 'pluck', f: 523.25, amp: 0.12 }, { t: 21.75, type: 'pluck', f: 659.25, amp: 0.1 });
    ev.push({ t: T.close[0], type: 'whoosh', dur: 0.5, amp: 0.06, from: 0.6, to: -0.2 }, { t: 24.08, type: 'tap' }, { t: 24.2, type: 'tap' }, { t: 24.45, type: 'swish' }, { t: T.point[0] + 0.3, type: 'pluck', f: 392, amp: 0.16 });
    // the approach, then the air: faster, shaking, fire, the loop burning
    ev.push({ t: 27.5, type: 'rise', dur: 5.5 }, { t: 0, type: 'buffet', track: trk((s) => 0.9 * shake(s)) }, { t: T.fire[0] + 0.3, type: 'fwoom' });
    ev.push({ t: 0, type: 'crackle', track: trk((s) => 0.6 * fireA(s) + 0.6 * smooth(T.burn[0], T.burn[0] + 0.5, s) * (1 - smooth(T.gone - 0.1, T.gone + 0.2, s))) });
    ev.push({ t: T.gone + 0.05, type: 'whistle', dur: HIT - T.gone }, { t: HIT, type: 'land' }, { t: HIT + 0.05, type: 'rustle' }, { t: HIT + 1.0, type: 'exhale' }, { t: S - 0.1, type: 'breath', dur: 0.6 });
    [S + 0.35, S + 0.7, S + 1.05].forEach((s) => ev.push({ t: s, type: 'tap' }));
    ev.push({ t: S + 2.5, type: 'breath', dur: 0.9 });
    for (let u = 1; u <= Math.ceil(SPAN / STRIDE); u++) { let lo = WALK[0], hi = WALK[1] + 0.3; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (walkX(m) / STRIDE < u) lo = m; else hi = m; } if (hi < WALK[1] + 0.25) ev.push({ t: hi, type: 'step', amp: 0.2, tone: 1, pan: -0.1 }); }
    // the clock over the edge: faint and far off at first, the one he hears a little louder, then close
    for (const k of ATICKS) { const s = CUT + k; if (s < HIT || s > DUR) continue; const near = clamp((G(s).x - LANDX) / 4.8, 0, 1), heard = Math.abs(s - (S + 5.0)) < 0.7 ? 0.06 : 0; ev.push({ t: s, type: 'tick', amp: 0.035 + 0.14 * Math.pow(walkX(s) / SPAN, 1.5) + heard + 0 * near }); }
    ev.push({ t: WALK[1] + 0.2, type: 'pluck', f: 523.25, amp: 0.12 }, { t: WALK[1] + 0.9, type: 'pluck', f: 440, amp: 0.1 });
    return ev.filter((e) => e.t >= 0 && e.t < DUR).sort((a, b) => a.t - b.t);
  }

  return { id: 'arrival2', title: 'Arrival v2', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, CUT, HAND, HIT, S, WALK };
});
