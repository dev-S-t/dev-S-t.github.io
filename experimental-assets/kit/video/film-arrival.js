// FILM 13, Arrival: where the meteor of the 404 page ("Trajectory missed") lands. It starts on the last frame of Fall
// and ends on its first, so the two run round for ever. The mark is falling like the site's meteor. The brush gives
// way to the figure and his arms come down out of the ring, point for point. Rocks come at him down the line he falls
// along (eleven to five); he steers round them with his body and arms, and the trail bends where he has been. Far
// off at five o'clock there is a small planet. He takes out a telescope (it pulls out, click, click), sees a loop
// on it, and points: there. He steers for it and it comes up from five o'clock, bigger and bigger. In its air the
// loop starts to burn at the opening, from both ends, round toward his feet; he ends up on one foot on the last bit,
// and then that is gone too, clean. He drops onto the planet, big enough now to be flat, gets up, dusts himself off,
// looks about for something, and walks right until the ground ends at an edge. Beyond it is the tunnel of lines, and
// at its heart a loop with its opening going round like the hand of a clock. He studies it. Fall begins again.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'), require('./film-fall.js'));
  else (root.Films = root.Films || {}).arrival = factory(root.Ink, root.MarkBody, root.Field, root.Films.fall);
})(this, function (I, MB, FL, F) {
  const W = 1920, H = 1080, FPS = 30, DUR = 46.6, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI, RAD = PI / 180;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const rotv = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  const key = (ks) => (t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; };
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) out[f] = key(per[f])(t); return out; };
  }
  const table = (f, t0 = 0) => { const o = [0]; for (let i = 1; i <= DUR * 120 + 2; i++) o.push(o[i - 1] + f(i / 120) / 120); return (t) => { const x = clamp(t, 0, DUR) * 120, i = Math.min(o.length - 2, Math.floor(x)); return t0 + lerp(o[i], o[i + 1], x - i); }; };
  const { D, N } = F, RM = MB.MK.loop.r, RO = F.RO;
  const MP = MB.MARK_POSE(0, 0), MF = (k) => [MP.feet[k].x, MP.feet[k].y], MPEL = [MP.root.x, MP.root.y], ML = MB.MARK_LEAN;
  const BAL = { F: [0.37, 0.27], B: [-0.34, 0.3] };

  // ---- time: our first frame is Fall at 32.5 s; our last is Fall at 1.0 s ------------------------------------------------
  const TF0 = 32.5, tF = (t) => t + TF0, CUT = DUR - 1.0, tau = (t) => t - CUT;
  const HAND = 30.6;                                      // the loop is gone: from here on, the ground (Fall's own world)
  const LANDX = -5.0, HIT = HAND + 0.48;
  // the new loop's opening comes round from eleven to five as he arrives, an hour a tick, and Fall carries on from five
  const ATICKS = [-5.6, -4.4, -3.2, -2.0, -0.8, 0.4];
  const hand = (x) => (x <= 0 ? 0 : 1 - Math.exp(-x * 16) * Math.cos(x * 26));
  const clockA = (u) => PI + (PI / 6) * ATICKS.reduce((s, k) => s + hand(u - k) - 1, 0);
  const phaseA = (u) => 0.45 * u + ATICKS.reduce((s, k) => s + smoother(seg(u, k, k + 0.5)) - 1, 0);

  // ---- the flight: speed, the dodges (sideways, along N), the turn into the dive ---------------------------------------
  const vel = (t) => (t < 24 ? 4 : lerp(4, 1.4, smoother(seg(t, 24, HAND))));
  const along = table(vel);
  const lat = key([[0, 0], [4.4, 0], [5.15, 1.5], [6.6, 1.5], [7.35, 0.35], [10.5, 0.35], [11.0, -1.05], [12.5, -1.05], [13.5, -0.5], [18.8, -0.5], [20.4, 0.15], [30.6, 0.15]]);
  const latV = (t) => (lat(t + 0.03) - lat(t - 0.03)) / 0.06;
  const camLat = (t) => { let s = 0; for (let i = 0; i < 8; i++) s += lat(t - 0.7 * i / 7); return s / 8; };
  const dive = (t) => (PI / 6) * smoother(seg(t, 24.5, 28.5));        // the view turns until the fall is straight down
  const T = { brush: [1.3, 2.1], arms: [2.1, 3.7], duck: [7.55, 8.25], swerve: [10.9, 11.7], scope: [14.2, 17.7], view: [15.6, 17.0], point: [17.75, 18.7], burn: [26.6, 30.3], lift: 29.35 };
  const burnt = (t) => 165 * Math.pow(seg(t, ...T.burn), 1.25);      // degrees burnt back from each side of the opening

  // ---- rocks (near: they pass close) and planets (far: they drift by) ------------------------------------------------------
  const blob = (seed, n = 15) => { const r = I.rng(seed); return Array.from({ length: n }, (_, i) => 1 + 0.32 * (r() - 0.5) + 0.12 * Math.sin(i * 2.1 + seed)); };
  const ROCKS = [[5.7, 0.05, 0.62, 1, 0.6], [7.9, -0.62, 0.13, 2, 2.0], [8.3, 2.3, 0.22, 3, -1.2], [8.65, 3.0, 0.16, 4, 1.5], [11.5, 0.35, 0.48, 5, -0.8], [12.2, 1.45, 0.3, 6, 1.1], [21.2, -0.95, 0.2, 7, 1.7], [3.2, 2.6, 0.12, 8, 1.3], [4.1, -2.4, 0.1, 9, -2], [9.6, -2.6, 0.14, 10, 1], [13.1, 2.7, 0.11, 11, -1.4], [15.4, -2.8, 0.09, 12, 2.2], [17.0, 2.9, 0.12, 13, 1.2], [19.6, 2.5, 0.1, 14, -1.6], [22.8, -2.2, 0.12, 15, 1.4]]
    .map(([tp, n, r, seed, spin]) => ({ tp, n, r, seed, spin, shape: blob(seed), craters: (() => { const q = I.rng(seed + 40); return [0, 1, 2].map(() => [(q() - 0.5) * 0.9, (q() - 0.5) * 0.9, 0.12 + 0.12 * q()]); })() }));
  const FAR = [{ tp: 10.4, n: -8.0, R: 0.85, par: 0.35, kind: 'ringed', tilt: -0.35 }, { tp: 16.6, n: 6.5, R: 0.55, par: 0.45, kind: 'moon', tilt: 0.2 }];
  // the planet he goes to, in screen terms: its size, how far its near edge is, which way it lies
  const rhoP = key([[12.4, Math.log(5)], [13.6, Math.log(14)], [19, Math.log(26)], [22, Math.log(64)], [24, Math.log(190)], [25.6, Math.log(560)], [27, Math.log(1800)], [28.5, Math.log(7000)], [HAND, Math.log(60000)]]);
  const gapP = key([[12.4, 560], [19, 540], [22, 520], [25, 560], [27, 600], [HAND, 600]]);
  const dirP = key([[12.4, 50 * RAD], [18.8, 50 * RAD], [20.6, 60 * RAD]]);
  const meteorY = key([[0, 540], [11.6, 540], [13.4, 430], [28, 400]]);

  // ---- the camera in space: the meteor on screen (the site's place, its bob, a lag behind the dodges) ---------------------
  function spaceCam(t) {
    const k = key([[0, 230], [3.6, 300], [14.0, 300], [14.7, 410], [17.5, 410], [18.4, 300]])(t), b = F.bob(tF(t)) * (1 - smooth(1.0, 3.0, t)), M = mul(N, lat(t)), dl = lat(t) - camLat(t);
    const Ms = [W / 2 + k * (D[0] * b + N[0] * dl), meteorY(t) + k * (D[1] * b + N[1] * dl)];
    return { cam: I.camera(W, H, { cx: M[0] - (Ms[0] - W / 2) / k, cy: M[1] - (Ms[1] - H / 2) / k, k }), M, Ms, k };
  }

  // ---- him in space, relative to the meteor's centre -------------------------------------------------------------------
  const SHM = MB.MK.armF[0];
  function spacePose(t, scope) {
    const lv = latV(t), steer = clamp(lv / 2, -1, 1);
    let pel = MPEL, lean = ML - 0.16 * lv, nod = -ML + 0.1, hF = add(BAL.F, [0, 0.09 * steer]), hB = add(BAL.B, [0, -0.09 * steer]), lenF = 0.36, lenB = 0.36, fL = MF('L');
    // the close one over the top: he ducks away from it
    const dk = bump(t, ...T.duck); pel = add(pel, [0, 0.07 * dk]); lean += 0.25 * dk; nod -= 0.25 * dk; hF = add(hF, [0, 0.12 * dk]);
    // the big swerve: he leans right back
    const sw = bump(t, ...T.swerve); lean -= 0.22 * sw; nod += 0.15 * sw;
    // looking at the ringed planet going by
    nod += -0.18 * bump(t, 9.4, 11.0);
    // pointing: there
    const pt = bump(t, ...T.point);
    if (pt > 0) { const u = [Math.cos(dirP(t)), Math.sin(dirP(t))], sh = add(pel, [0, -0.2]); hF = lp(hF, add(sh, mul(u, 0.34)), Math.min(1, pt * 1.6)); nod += 0.12 * pt; }
    // burning: crouched, looking back at the opening; then up on his front foot as the fire reaches the back one
    const bn = smooth(26.8, 27.6, t), lift = smooth(T.lift - 0.25, T.lift + 0.1, t), down = smooth(30.25, 30.5, t);
    pel = add(pel, [0.02 * lift, 0.05 * bn - 0.06 * lift]); lean += -0.12 * bn + 0.18 * lift; nod += 0.3 * bn * (1 - lift) - 0.35 * down;
    if (lift > 0) { fL = lp(fL, [MF('L')[0] + 0.12, MF('L')[1] - 0.2], lift); const wm = Math.sin(t * 13) * lift; hF = add(BAL.F, [0, -0.12 * wm]); hB = add(BAL.B, [0, 0.12 * wm]); }
    // the telescope: the hands hold it (worked out from where his head is)
    if (scope) { hF = scope.hF; hB = scope.hB; lenF = Math.max(0.36, scope.lenF); lenB = Math.max(0.36, scope.lenB); }
    return { root: { x: pel[0], y: pel[1], rot: 0, sx: 1 }, lean, bend: 1, nod, sh: MB.B.shN, feet: { L: wq(fL), R: wq(MF('R')) }, knee: { L: -1, R: 1 }, fore: { L: 0.85 * (1 - lift), R: 0 },
      hands: { F: wq(hF), B: wq(hB) }, elbow: { F: 1, B: -1 }, armLen: { F: lenF, B: lenB } };
  }
  // the telescope: three sections that pull out, held to the side of his head that faces the planet
  const pull = (t, a) => { const x = t - a; return x <= 0 ? 0 : 1 - Math.exp(-x * 10) * Math.cos(x * 28); };
  function telescope(t, headC) {
    if (t < 14.55 || t > 17.65) return null;
    const u = [Math.cos(dirP(t)), Math.sin(dirP(t))], n = [-u[1], u[0]];
    const E = add(headC, mul(u, MB.B.headR + 0.045));
    const out = smooth(14.55, 15.0, t), back = smooth(17.25, 17.65, t);
    const e1 = Math.max(0, pull(t, 15.05) - smooth(17.1, 17.2, t)), e2 = Math.max(0, pull(t, 15.3) - smooth(17.0, 17.1, t));
    const L1 = 0.17, L2 = L1 + 0.15 * e1, L3 = L2 + 0.14 * e2;
    // brought round from behind his back, and put back there
    const behind = [MPEL[0] - 0.22, MPEL[1] - 0.12], from = lp(behind, E, out), at = lp(from, behind, back);
    const jig = 0.006 * Math.sin(t * 7) * bump(t, 15.4, 17.0), base = add(at, mul(n, jig));
    return { base, u, n, L: [L1, L2, L3], hF: add(base, add(mul(u, L3 * 0.78), mul(n, 0.03))), hB: add(base, add(mul(u, 0.05), mul(n, -0.04))), lenF: 0.36, lenB: 0.36 };
  }
  function spaceHero(t) {
    // the brush mark, then him in exactly its pose, then his arms come down from the ring point for point
    const s0 = MB.body(spacePose(t, null)), head = s0.head.c, sc = telescope(t, head);
    let p = spacePose(t, sc ? { ...sc, lenF: dist(add(MPEL, [0, -0.2]), sc.hF) * 1.08, lenB: dist(add(MPEL, [0, -0.2]), sc.hB) * 1.08 } : null);
    let ln = MB.body(p);
    const u = smoother(seg(t, ...T.arms));
    if (u < 1) { ln = MB.armsTo(ln, 1 - u); ln = MB.settle(ln, 1 - u); }
    return { ln, sc };
  }

  // ---- him on the ground (Fall's world) ----------------------------------------------------------------------------------
  const CLIFF = F.CLIFF, TOP = CLIFF.filter((q) => q[1] < 0.2 && q[0] <= 0.001).sort((a, b) => a[0] - b[0]);
  const groundY = (x) => { if (x <= TOP[0][0]) return TOP[0][1]; for (let i = 1; i < TOP.length; i++) if (x <= TOP[i][0]) return lerp(TOP[i - 1][1], TOP[i][1], (x - TOP[i - 1][0]) / (TOP[i][0] - TOP[i - 1][0])); return TOP[TOP.length - 1][1]; };
  const LIEX = LANDX + 0.18, WALK = [37.4, 42.6], STRIDE = 0.36, HIP = F.HIP;
  // hands are offsets from the pelvis (mirrored when he faces left); feet are on the ground
  const G = track([
    [HIT, { x: LIEX, y: -0.07, rot: 1.13, lean: 0, nod: 0.05, bend: 0.5, fL: [LIEX - 0.33, -0.01], fR: [LIEX - 0.27, -0.06], hF: [0.32, 0.2], hB: [0.1, 0.24] }],
    [32.15, { x: LIEX, y: -0.07, rot: 1.13, nod: -0.15 }],
    // up on his hands, knees under him
    [32.75, { x: LIEX - 0.04, y: -0.2, rot: 0.72, nod: 0.05, fL: [LIEX - 0.2, 0.0], fR: [LIEX - 0.12, 0.0], hF: [0.34, 0.21], hB: [0.3, 0.22] }],
    // and up
    [33.55, { x: LIEX, y: -HIP, rot: 0, lean: 0.05, nod: 0.12, bend: 0.4, fL: [LIEX - 0.07, 0.02], fR: [LIEX + 0.08, 0.02], hF: [0.13, 0.05], hB: [-0.1, 0.06] }],
    [35.5, { lean: 0.05, nod: 0.12 }],
    // looking about
    [35.9, { lean: 0.12, nod: 0.02 }], [36.6, { lean: 0.12, nod: 0.02 }], [37.0, { lean: 0.05, nod: 0.1, hF: [0.25, -0.38] }], [37.3, { hF: [0.13, 0.05] }],
    [WALK[0], { x: LIEX, lean: 0.1, nod: 0.12, fL: [LIEX - 0.07, 0.02], fR: [LIEX + 0.08, 0.02] }],
    [WALK[1], { x: F.EDGE, lean: 0.03, nod: 0.16, fL: [F.EDGE - 0.07, 0.02], fR: [F.EDGE + 0.08, 0.02] }],
    // the edge: a start, then he leans in to look, hand to his chin
    [42.85, { y: -HIP - 0.04, lean: -0.08, nod: -0.05 }], [43.1, { y: -HIP, lean: 0.03 }],
    [43.6, { lean: 0.22, nod: 0.3, hF: [0.17, -0.32] }], [45.1, { lean: 0.2, nod: 0.26, hF: [0.17, -0.32] }],
    [CUT - 0.2, { lean: 0.03, nod: 0.16, hF: [0.13, 0.05], hB: [-0.1, 0.06] }]
  ]);
  const facing = (t) => (t > 35.7 && t < 36.45 ? -1 : 1);
  function groundPose(t) {
    // falling off the last of the loop: straight down onto the planet, turning over
    if (t < HIT) {
      const dt = t - HAND, y = -2.0 + MPEL[1] + 1.2 * dt + 3.5 * dt * dt, x = LANDX + MPEL[0] + 0.3 * dt, sp = smoother(dt / (HIT - HAND)), fl = Math.sin(dt * 22);
      return { root: { x, y, rot: 1.13 * sp, sx: 1 }, lean: ML * (1 - sp), bend: 0.8, nod: -0.3 + 0.2 * sp, feet: { L: lc([-0.12, 0.26 - 0.06 * fl]), R: lc([0.14, 0.24 + 0.06 * fl]) }, knee: { L: 1, R: 1 },
        hands: { F: lc([0.3, -0.22 + 0.12 * fl]), B: lc([-0.28, -0.2 - 0.12 * fl]) }, elbow: { F: 1, B: -1 } };
    }
    const g = G(t), sx = facing(t); let { x, y, rot, lean, nod } = g, fL = g.fL, fR = g.fR, hF = g.hF, hB = g.hB;
    // the landing: a squash
    y += 0.03 * bump(t, HIT, HIT + 0.25);
    // dusting himself off: quick pats down his front and his legs
    const pat = bump(t, 33.7, 34.9); if (pat > 0) { const ph = (t - 33.7) * 9; hF = lp(hF, [0.06 + 0.04 * Math.sin(ph), -0.1 + 0.18 * (0.5 + 0.5 * Math.sin(ph * 0.5))], pat); hB = lp(hB, [0.0 + 0.04 * Math.cos(ph), 0.0 + 0.1 * (0.5 + 0.5 * Math.cos(ph * 0.6))], pat); lean += 0.1 * pat; }
    // a shake of the head
    nod += 0.14 * Math.sin((t - 34.9) * 26) * bump(t, 34.9, 35.45);
    // scratching his head
    if (t > 36.9 && t < 37.35) hF = add(hF, [0.015 * Math.sin(t * 40), 0]);
    // the walk: feet planted, a step at a time; arms swinging
    if (t >= WALK[0] && t <= WALK[1] + 0.3) {
      const s = x - LIEX, u = s / STRIDE, X = (q) => LIEX + STRIDE * q, ease = smooth(WALK[0], WALK[0] + 0.3, t) * (1 - smooth(WALK[1] - 0.15, WALK[1] + 0.25, t));
      const foot = (off) => { const v = u - off, m = Math.floor(v / 2), f = v - 2 * m; if (f < 1) return [X(2 * m + off) + 0.12, 0]; const w = f - 1; return [lerp(X(2 * m + off), X(2 * m + 2 + off), smoother(w)) + 0.12, -0.07 * Math.sin(PI * w)]; };
      const a = foot(0), b = foot(1);
      fL = lp(fL, [a[0], groundY(a[0]) + 0.02 + a[1]], ease); fR = lp(fR, [b[0], groundY(b[0]) + 0.02 + b[1]], ease);
      y += -0.015 * Math.abs(Math.sin(PI * u)) * ease; const sw = Math.sin(PI * u) * ease; hF = add(hF, [0.1 * sw, 0]); hB = add(hB, [-0.1 * sw, 0]);
    }
    // the clock's ticks: his head follows each one
    nod += 0.05 * ATICKS.reduce((s, k) => s + bump(tau(t), k, k + 0.4), 0) * smooth(42.8, 43.4, t);
    const P = [x, y], h = (o) => wq(add(P, [sx * o[0], o[1]]));
    return { root: { x, y, rot, sx }, lean, bend: g.bend, nod, feet: { L: wq(fL), R: wq(fR) }, knee: { L: 1, R: 1 }, hands: { F: h(hF), B: h(hB) }, elbow: { F: -1, B: 1 } };
  }
  function groundHero(t) {
    let ln = MB.body(groundPose(t));
    // the last second: into Fall's own first pose
    const u = smoother(seg(tau(t), -0.7, 0.1));
    if (u > 0) { const f = F.hero(Math.max(0, tau(t))), bl = (a, b) => MB.resample(a, 40).map((q, i) => lp(q, MB.resample(b, 40)[i], u)); ln = { ...f, spine: bl(ln.spine, f.spine), legL: bl(ln.legL, f.legL), legR: bl(ln.legR, f.legR), armF: bl(ln.armF, f.armF), armB: bl(ln.armB, f.armB), head: { ...f.head, c: lp(ln.head.c, f.head.c, u), a: lerp(ln.head.a, f.head.a, u) } }; }
    return ln;
  }

  // ---- drawing helpers ---------------------------------------------------------------------------------------------------
  const { bg, fg } = I.THEMES[THEME];
  const polyPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); };
  // the meteor's trail, as the site draws it, bent along the way he has come
  function trail(ctx, t, cam, M, j, amt) {
    if (amt <= 0) return;
    const tf = tF(t), v = Math.max(vel(t), 0.5), r = dive(t), env = (p) => add(M, rotv(sub(p, M), r));
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = amt;
    F.TR.forEach((tr, i) => {
      for (const side of [1, -1]) {
        const pts = [];
        for (let a = 0; a <= 18; a++) { const g = side * (PI / 2) * a / 18; pts.push([tr.r * Math.cos(g), tr.r * Math.sin(g)]); }
        for (let s = 1; s <= 36; s++) { const q = s / 36, o = 1 - q, X = 3 * o * o * q * 0.41 + 3 * o * q * q * 0.79 + q * q * q, Y = o * o * o + 3 * o * o * q + 3 * o * q * q * 0.34 + 0.1 * q * q * q; pts.push([-X * tr.L, side * Y * tr.r]); }
        const scr = pts.map(([xp, yp]) => { const bend = xp < 0 ? lat(t + xp / v) - lat(t) : 0; return j(cam(...env(add(M, add(mul(D, xp), mul(N, yp + bend)))))); });
        let L = 0; for (let k = 1; k < scr.length; k++) L += dist(scr[k], scr[k - 1]);
        ctx.lineWidth = tr.w * cam.k; ctx.setLineDash([0.07 * L, 0.025 * L]); ctx.lineDashOffset = -0.095 * L * (((tf + 0.11 * i) / 1.5) % 1);
        polyPath(ctx, scr); ctx.stroke();
      }
    });
    ctx.restore();
  }
  // the site's streaks: short lines along the fall going by, none over the meteor or its trail
  const sPhase = table((t) => vel(t) / 4 * 240 / 0.9, 240 * TF0 / 0.9);
  function streaks(ctx, t, cam, M, j, amt) {
    if (amt <= 0) return;
    const off = -(sPhase(t) % 240), r = dive(t), SV = F.SV, ll = lat(t) * SV;
    const hidden = (x, y) => x * x + y * y < 68 * 68 || (x < 0 && Math.abs(y) < 100 - 40 * Math.min(1, -x / 420));
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = 0.45 * amt;
    for (const [x0, y0, len, wd] of F.STREAKS) {
      const y = ((y0 - ll + 330) % 660 + 660) % 660 - 330; ctx.lineWidth = wd / SV * cam.k;
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
      // speed lines behind it (it goes up the line, so they trail toward five o'clock)
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
  // the planet he goes to: ink, with paper bands, and air round it
  function planet(ctx, t, cam, Ms, j) {
    if (t < 12.4) return null;
    const rho = Math.exp(rhoP(t)), th = dirP(t) + dive(t), gp = gapP(t), c = [Ms[0] + (gp + rho) * Math.cos(th), Ms[1] + (gp + rho) * Math.sin(th)], a = smooth(12.4, 13.2, t);
    ctx.save(); ctx.globalAlpha = a;
    // its air: rings that will be the lines over the ground
    const air = smooth(21, 24.5, t);
    if (air > 0) { ctx.strokeStyle = fg; ctx.lineWidth = 1.1; const step = F.STEP * cam.k; for (let i = 1; i <= 14; i++) { ctx.globalAlpha = a * air * (1 - i / 15); ctx.beginPath(); ctx.arc(c[0], c[1], rho + i * step, 0, 7); ctx.stroke(); } ctx.globalAlpha = a; }
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(c[0], c[1], rho, 0, 7); ctx.fill();
    const bandA = 1 - smooth(700, 2600, rho);
    if (bandA > 0 && rho > 9) { ctx.save(); ctx.clip(); ctx.strokeStyle = bg; ctx.lineWidth = Math.max(1, rho * 0.012); ctx.globalAlpha = a * bandA; for (let b = -3; b <= 3; b++) { ctx.beginPath(); for (let s = -1.05; s <= 1.06; s += 0.03) { const q = rotv([s * rho, b * rho * 0.27 + 0.05 * rho * Math.sin(s * 6 + b * 1.7 + t * 0.2)], -0.3); const P = [c[0] + q[0], c[1] + q[1]]; if (s === -1.05) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]); } ctx.stroke(); } ctx.restore(); }
    ctx.restore();
    return { c, rho };
  }
  // what the telescope shows: the planet up close, and on it a loop in its rings
  function scopeView(ctx, t, j) {
    const a = smooth(T.view[0], T.view[0] + 0.25, t) * (1 - smooth(T.view[1] - 0.2, T.view[1], t)); if (a <= 0) return;
    const pop = 0.6 + 0.4 * a + 0.06 * Math.sin(PI * a), C = [1480, 300], R = 235 * pop;
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.5);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(C[0], C[1], R, 0, 7); ctx.fill();
    ctx.save(); ctx.clip();
    const pc = [C[0] - 40 * pop, C[1] + 420 * pop], pr = 380 * pop;
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(pc[0], pc[1], pr, 0, 7); ctx.fill();
    ctx.strokeStyle = bg; ctx.lineWidth = 3 * pop; for (let b = 1; b <= 3; b++) { ctx.beginPath(); ctx.arc(pc[0], pc[1], pr - b * 55 * pop, PI * 1.05, PI * 1.95); ctx.stroke(); }
    // a loop, open at eleven, in rings of its own: the reason to go
    const KS = 105 * pop, lc2 = [C[0] + 10 * pop, C[1] - 72 * pop], cam2 = I.camera(W, H, { cx: -(lc2[0] - W / 2) / KS, cy: -(lc2[1] - H / 2) / KS, k: KS });
    ctx.strokeStyle = fg; ctx.lineWidth = 2 * pop; for (let b = 1; b <= 4; b++) { ctx.globalAlpha = Math.min(1, a * 1.5) * (1 - b / 5); ctx.beginPath(); ctx.arc(lc2[0], lc2[1], (RO + 0.12 * b) * KS, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = Math.min(1, a * 1.5); MB.drawMark(ctx, cam2, (q) => q, fg, bg, 'loop', [0, 0], 0.5 * Math.sin(t * 1.3));
    ctx.restore();
    ctx.strokeStyle = fg; ctx.lineWidth = 14 * pop; ctx.beginPath(); ctx.arc(C[0], C[1], R, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // fire at the two burning ends: tongues, sparks and smoke streaming back up the line
  function fire(ctx, t, cam, M, j) {
    const b = burnt(t); if (b <= 0 || t > HAND) return;
    const back = rotv(mul(D, -1), dive(t)), side = [-back[1], back[0]], s = smooth(26.6, 27.0, t) * (1 - smooth(30.25, 30.45, t));
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
  // the loop, burnt back from the opening; it shakes as the site's does
  function loopNow(ctx, t, cam, M, j) {
    if (t >= HAND) return;
    const b = burnt(t), shk = (Math.floor(tF(t) / 0.11) % 2 ? 1 : -1) * (1 - smooth(26.0, 26.6, t)), at = add(M, [0.45 / F.SV * shk, -0.35 / F.SV * shk]), turn = -0.06 * latV(t);
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
    // the ring where each section meets the next, and the glass at the end
    ctx.strokeStyle = bg; ctx.lineWidth = Math.max(1.2, 0.008 * cam.k);
    for (let i = 0; i < 2; i++) { const q = add(sc.base, mul(sc.u, sc.L[i] - 0.012)), h = mul(sc.n, wd[i] * 0.5), A = cam(...add(q, h)), B = cam(...sub(q, h)); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
    ctx.restore();
  }
  // dust where he lands, and off him as he pats it away
  function dust(ctx, t, cam, j) {
    const d = seg(t, HIT, HIT + 0.9); if (d > 0 && d < 1) { ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, 0.012 * cam.k); ctx.globalAlpha = 1 - d; for (let i = 0; i < 7; i++) { const dir = (i < 3.5 ? -1 : 1), x0 = LIEX + 0.1 + (i - 3) * 0.12, r = 0.05 + 0.25 * d * (0.6 + 0.1 * i % 3); const c = cam(x0 + dir * 0.3 * d, -0.04 - 0.18 * d * Math.sin(1 + i)); ctx.beginPath(); ctx.arc(c[0], c[1], r * cam.k * 0.5, PI * 1.1, PI * 1.9); ctx.stroke(); } ctx.restore(); }
    const pd = bump(t, 33.7, 35.3); if (pd > 0) { ctx.save(); ctx.fillStyle = fg; for (let i = 0; i < 12; i++) { const age = ((t - 33.7) * 1.4 + i / 12) % 1, h = (Math.sin(i * 91.7) * 43758.5) % 1, c = cam(LIEX + 0.05 + (h - 0.5) * 0.3 + 0.25 * age * Math.sign(h - 0.5), -0.25 - 0.3 * age + 0.15 * h); ctx.globalAlpha = pd * (1 - age) * 0.8; ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(1.5, 0.008 * cam.k), 0, 7); ctx.fill(); } ctx.restore(); }
  }

  // ---- the ground: camera, field -------------------------------------------------------------------------------------------
  const GC = key([[HAND, [LANDX, -2.0 + 140 / 300]], [HIT + 0.3, [LANDX + 0.3, -0.62]], [WALK[0], [LANDX + 0.4, -0.62]], [WALK[1] + 0.4, [1.25, 0.32]], [DUR, [1.25, 0.32]]]);
  const GK = key([[HAND, 300], [WALK[0], 300], [WALK[1] + 0.4, 268], [DUR, 268]]);
  function groundField(ctx, t, cam, j) {
    const u = tau(t), w = smoother(seg(t, 32.6, 39.5)), C0 = F.C0, ph = phaseA(u);
    const Fv = (x, y) => (1 - w) * (-y / F.STEP) + w * (F.tunnel(x, y, C0) / F.STEP - ph);
    const mask = (x, y) => { const air = clamp(1 - Math.max(0, -y) / 1.25, 0, 1); return ((1 - w) * air + w) * clamp((Math.hypot(x - C0[0], y - C0[1]) - RO - 0.05) / 0.1, 0, 1); };
    FL.contours(ctx, Fv, cam, W, H, { step: 1, phase: 0, cell: 6, mask, width: lerp(1.1, 1.0, w), color: fg, j });
  }

  // ---- the picture -----------------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(19), o = []; for (let i = 0; i < 90; i++) o.push([r() * W * 1.4 - W * 0.2, r() * H * 1.4 - H * 0.2, 0.8 + r() * 1.4, 0.15 + r() * 0.3]); return o; })();
  function draw(ctx, t) {
    if (tau(t) >= 0.8) return F.draw(ctx, tau(t));
    I.background(ctx, THEME, W, H);
    if (t < HAND) {
      const { cam, M, Ms } = spaceCam(t), j = I.boil(t, smooth(1.2, 3.0, t)), at = along(t);
      // far stars, barely moving
      ctx.fillStyle = fg; for (const [x, y, r, a] of STARS) { const q = add([x, y], mul(rotv(D, dive(t)), -at * 4)); ctx.globalAlpha = a * smooth(2, 5, t); ctx.beginPath(); ctx.arc(((q[0] % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2, ((q[1] % (H * 1.4)) + H * 1.4) % (H * 1.4) - H * 0.2, r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      farPlanets(ctx, t, cam, M, j);
      planet(ctx, t, cam, Ms, j);
      streaks(ctx, t, cam, M, j, 1 - smooth(26.5, 29.0, t));
      trail(ctx, t, cam, M, j, 1 - smooth(28.4, 30.2, t));
      rocks(ctx, t, cam, M, j);
      loopNow(ctx, t, cam, M, j);
      fire(ctx, t, cam, M, j);
      // him: the brush mark first, then the figure
      const bm = 1 - smoother(seg(t, ...T.brush)), { ln, sc } = spaceHero(t), rel = (q) => add(M, q);
      const place = (l) => { const m = (pts) => pts.map(rel); return { ...l, spine: m(l.spine), legL: m(l.legL), legR: m(l.legR), armF: m(l.armF), armB: m(l.armB), head: { ...l.head, c: rel(l.head.c) } }; };
      if (bm < 1) { ctx.globalAlpha = smooth(0, 0.6, 1 - bm); MB.draw(ctx, place(ln), cam, j, fg); ctx.globalAlpha = 1; }
      if (bm > 0) { ctx.globalAlpha = smooth(0.3, 1, bm); MB.drawMark(ctx, cam, (q) => q, fg, bg, 'figure', M, 0); ctx.globalAlpha = 1; }
      if (sc) drawScope(ctx, { ...sc, base: rel(sc.base) }, cam, j);
      scopeView(ctx, t, j);
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

  // ---- sound cues --------------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 13.2, [65.41, 130.81, 196, 261.63, 329.63, 392]], [12.6, 19.6, [87.31, 130.81, 174.61, 220, 261.63]], [19.1, 26.6, [98, 146.83, 196, 246.94]], [26.1, 30.8, [73.42, 110, 138.59, 174.61]], [31.6, 40.2, [110, 164.81, 220, 261.63]], [39.7, DUR + 0.5, [73.42, 110, 146.83, 174.61]]] }];
    const wind = (s) => (s < HAND ? (s < 24 ? 0.69 : lerp(0.69, 1, smooth(24, 28, s))) * (1 - smooth(30.2, 30.6, s)) : 0);
    ev.push({ t: 0, type: 'fallwind', dur: HAND + 0.2, track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => wind(i / 20)) });
    for (const rk of ROCKS) if (rk.r > 0.12) { const side = Math.sign(rk.n - lat(rk.tp)) || 1; ev.push({ t: rk.tp - 0.3, type: 'whoosh', dur: 0.6, amp: 0.08 + 0.2 * rk.r, from: 0.5 * side, to: -0.5 * side }); }
    ev.push({ t: T.duck[0] + 0.25, type: 'swish' }, { t: 10.2, type: 'whoosh', dur: 2.5, amp: 0.06, from: 0.6, to: -0.6 });
    ev.push({ t: 14.6, type: 'zip' }, { t: 15.05, type: 'tap' }, { t: 15.3, type: 'tap' }, { t: T.view[0] + 0.15, type: 'hi', notes: [587.33, 783.99] }, { t: 17.12, type: 'tap' }, { t: 17.45, type: 'swish' }, { t: T.point[0] + 0.3, type: 'pluck', f: 392, amp: 0.16 });
    ev.push({ t: 20.5, type: 'rise', dur: 5.5 }, { t: 24, type: 'buffet', track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => { const s = i / 20; return 0.5 * smooth(24.5, 27, s) * (1 - smooth(29.8, 30.4, s)); }) });
    ev.push({ t: 0, type: 'crackle', track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => { const s = i / 20; return smooth(26.5, 27.2, s) * (1 - smooth(30.1, 30.5, s)); }) });
    ev.push({ t: HAND - 0.05, type: 'whistle', dur: HIT - HAND + 0.05 }, { t: HIT, type: 'land' }, { t: HIT + 0.05, type: 'rustle' }, { t: 32.3, type: 'exhale' }, { t: 33.5, type: 'breath', dur: 0.6 });
    [33.9, 34.25, 34.6].forEach((s) => ev.push({ t: s, type: 'tap' }));
    // footsteps: each time a foot comes down on the walk
    for (let u = 1; u <= Math.ceil((F.EDGE - LIEX) / STRIDE); u++) { let lo = WALK[0], hi = WALK[1] + 0.3; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if ((G(m).x - LIEX) / STRIDE < u) lo = m; else hi = m; } if (hi < WALK[1] + 0.25) ev.push({ t: hi, type: 'step', amp: 0.22, tone: 1, pan: -0.1 }); }
    ATICKS.forEach((k, i) => ev.push({ t: CUT + k, type: 'tick', amp: 0.14 + 0.02 * i }));
    ev.push({ t: 42.8, type: 'pluck', f: 523.25, amp: 0.12 }, { t: 43.5, type: 'pluck', f: 440, amp: 0.1 });
    return ev.filter((e) => e.t < DUR).sort((a, b) => a.t - b.t);
  }

  return { id: 'arrival', title: 'Arrival', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, CUT, HAND };
});
