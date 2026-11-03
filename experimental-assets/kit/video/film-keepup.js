// FILM 15, Keep Up. A field of lines streams past from right to left, and its flow turns his loop like a water wheel
// (the top goes with the flow, the floor comes round under him). To keep his place he walks. The field quickens: he
// jogs, runs, sprints, legs a blur, the lines all streaks, the wheel whirring. His foot catches. He goes down on his
// face, the floor drags him up the side, and he curls into a ball, tumbling over and over in one place like a sock in a
// drum. Then he plants his back foot, steps his front foot up the curve, and comes up standing on the slope: the
// surfer's stance of the mark, out of a stumble. He wobbles, finds it, and rides the wheel instead of running it. Calm,
// he watches the field go by. Then he leans back, hands behind his head. You can't outrun it; you can ride it.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).keepup = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 29, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  const key = (ks) => (t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; };
  const table = (f) => { const o = [0]; for (let i = 1; i <= DUR * 240 + 2; i++) o.push(o[i - 1] + f(i / 240) / 240); return (t) => { const x = clamp(t, 0, DUR) * 240, i = Math.min(o.length - 2, Math.floor(x)); return lerp(o[i], o[i + 1], x - i); }; };
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2, RIN = MB.MK.loop.r - MB.MK.loop.w / 2, RF = 0.705;   // feet stand into the stroke, as the mark's do
  const onFloor = (a, r = RF) => [r * Math.sin(a), r * Math.cos(a)];                               // a: radians from the bottom, + to the right
  const DEG = PI / 180;

  // ---- the story's clock ----------------------------------------------------------------------------------------------
  const T = { walk: 1.0, quick: 5.2, run: 7.6, sprint: 9.8, trip: 13.6, down: 13.95, curl: 14.75, ball: [15.0, 17.0], plant: 17.25, step: [17.55, 18.15], up: 18.6, balanced: 21.2, watch: [21.8, 24.6], lounge: [24.9, 25.9] };
  // floor speed at the bottom (world units a second): the field's pace
  const vel = key([[0, 0.12], [T.walk, 0.42], [T.quick, 0.5], [T.run, 1.35], [T.sprint, 2.6], [T.trip, 2.75], [T.up, 2.4], [DUR, 2.2]]);
  const floor = table(vel);                       // how far the floor has gone
  const turn = (t) => -floor(t) / RF;             // the wheel turns anticlockwise (its floor moves right)
  // the field's own speed (it drives the wheel; a little ahead of it)
  const flowV = key([[0, 0.2], [T.walk, 0.55], [T.quick, 0.75], [T.run, 1.8], [T.sprint, 3.4], [T.trip, 3.6], [DUR, 3.1]]);
  const flow = table(flowV);
  const streak = (t) => smooth(T.run, T.sprint + 0.5, t);                         // the lines turning to streaks

  // ---- running: a gait driven by the floor, so feet never slide ---------------------------------------------------------
  // he faces left (sx -1); worked out facing forward (x forward, y down), then mirrored onto the curve of the floor
  const run = (v) => smooth(0.55, 1.6, v), dash = (v) => smooth(1.6, 2.6, v);
  const gaitS = (v) => lerp(0.17, 0.3, run(v)), gaitD = (v) => lerp(0.5, 0.36, run(v));
  const phase = table((t) => vel(t) / (2 * gaitS(vel(t))));
  const SHL = 0.18;                                            // upper arm and forearm
  function runPose(t) {
    const v = vel(t), r = run(v), d = dash(v), S = gaitS(v), D = gaitD(v), st = 2 * S * D, ph = phase(t), lift = lerp(0.045, 0.12, r);
    const foot = (q) => { const fq = q - Math.floor(q); if (fq < D) return { x: st / 2 - st * (fq / D), y: 0, down: true }; const u = (fq - D) / (1 - D); return { x: -st / 2 + st * (0.5 - 0.5 * Math.cos(PI * u)), y: -lift * Math.sin(PI * u), down: false }; };
    const L = foot(ph), R = foot(ph + 0.5);
    const air = Math.max(0, Math.sin(4 * PI * ph - 0.5)) * r, c = Math.cos(2 * PI * ph);
    const hip = lerp(0.322, 0.305, r) + lerp(0.006, 0.0, r) * Math.cos(4 * PI * ph) + 0.022 * air;
    const px = lerp(0.012, 0.04, r), lean = lerp(0.06, 0.26, r) + 0.14 * d + 0.015 * Math.cos(4 * PI * ph), nod = 0.035 * Math.sin(4 * PI * ph - 0.9) - 0.16 * d;
    // arms from the shoulder: swing forward and back, elbows bending more as he runs
    const sw = lerp(0.42, 0.95, r) * (1 + 0.15 * d), sh = [Math.sin(lean) * MB.B.spine * (1 - MB.B.shN), -Math.cos(lean) * MB.B.spine * (1 - MB.B.shN)];
    const arm = (k) => { const a = k * sw * c * lerp(1, 0.8, r) + 0.25 * r, b = lerp(0.22 + 0.3 * Math.max(0, k * c), 1.35, r); return [sh[0] + SHL * Math.sin(a) + SHL * Math.sin(a + b), sh[1] + SHL * Math.cos(a) + SHL * Math.cos(a + b)]; };
    const onW = (fp) => onFloor(-fp.x / RF, RF + fp.y);
    return { root: { x: -px, y: RF - hip, rot: 0, sx: -1 }, lean, bend: 0.6, nod, sh: MB.B.shN,
      feet: { L: wq(onW(L)), R: wq(onW(R)) }, knee: { L: 1, R: 1 }, hands: { F: lc(arm(-1)), B: lc(arm(1)) }, elbow: { F: 1, B: 1 }, armLen: { F: 2 * SHL, B: 2 * SHL }, _feet: [L, R] };
  }

  // place a pose so that its middle (worked out with the root at 0, 0 and no turn) lands at 'at', turned by 'rot'
  const bodyCentre = (ln) => { const pts = [...ln.spine, ...ln.legL, ...ln.legR, ln.head.c, ln.head.c]; return [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length]; };
  function placed(p, at, rot) {
    const ln = MB.body({ ...p, root: { ...p.root, x: 0, y: 0, rot: 0 } }), c = bodyCentre(ln);
    const rc = [c[0] * Math.cos(rot) - c[1] * Math.sin(rot), c[0] * Math.sin(rot) + c[1] * Math.cos(rot)];
    return { ...p, root: { ...p.root, x: at[0] - rc[0], y: at[1] - rc[1], rot } };
  }

  // ---- the fall: tripped, face down and dragged up the side, a ball tumbling, then up into the stance -------------------
  const GAM = 16 * DEG;                                       // how far up the right-hand slope he rides
  const MP = MB.MARK_POSE(0, 0), ML = MB.MARK_LEAN;
  const rotp = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const along = (p, g) => rotp(p, -g);                        // carried along the floor, to the right, by angle g
  const STANCE = { pel: along([MP.root.x, MP.root.y], GAM), fL: along([MP.feet.L.x, MP.feet.L.y], GAM), fR: along([MP.feet.R.x, MP.feet.R.y], GAM) };
  const ballAng = key([[T.curl, 50 * DEG], [T.ball[0] + 0.5, 44 * DEG], [T.ball[1], 30 * DEG], [T.plant, 24 * DEG]]);
  // all the points of a drawn body (the head ring as its outer edge)
  const outline = (ln) => { const pts = [...ln.spine, ...ln.legL, ...ln.legR, ...ln.armF, ...ln.armB], r = MB.B.headR + MB.B.headT * 1.2; for (let k = 0; k < 16; k++) pts.push([ln.head.c[0] + r * Math.cos(k * PI / 8), ln.head.c[1] + r * Math.sin(k * PI / 8)]); return pts; };
  // turned by rot, centred on the floor at angle a, and pushed out until its farthest point just touches the floor
  function onTheFloor(p, a, rot, lift = 0) {
    const p0 = { ...p, root: { ...p.root, x: 0, y: 0, rot } }, pts = outline(MB.body(p0)), n = [Math.sin(a), Math.cos(a)], tg = [Math.cos(a), -Math.sin(a)];
    const ct = pts.reduce((acc, q) => acc + q[0] * tg[0] + q[1] * tg[1], 0) / pts.length, cn = pts.reduce((acc, q) => acc + q[0] * n[0] + q[1] * n[1], 0) / pts.length, lim = RF - 0.012 - lift;
    const at = (m) => [(m - cn) * n[0] - ct * tg[0], (m - cn) * n[1] - ct * tg[1]];
    let lo = 0, hi = RF; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2, o = at(m); if (Math.max(...pts.map((q) => Math.hypot(o[0] + q[0], o[1] + q[1]))) < lim) lo = m; else hi = m; }
    const o = at(lo); return { ...p, root: { ...p.root, x: o[0], y: o[1], rot } };
  }
  // face down on the floor, head downhill, feet up the slope (knees bent along the curve)
  const DRAG = [-0.82, 0.36];                                  // the head's floor angle while he is dragged up the side
  function facedown(t, aH) {
    const fl = Math.sin(t * 24), fl2 = Math.sin(t * 19 + 1), pel = onFloor(aH + 0.6 / RF, RF - 0.07), head = onFloor(aH, RF - 0.3);
    const p = { root: { x: 0, y: 0, rot: 0, sx: -1 }, lean: 0.1, bend: 0.5, nod: 0.25, sh: MB.B.shN, knee: { L: -1, R: -1 }, elbow: { F: 1, B: -1 },
      feet: { L: wq(onFloor(aH + 0.98 / RF, RF - 0.05 - 0.07 * Math.max(0, fl))), R: wq(onFloor(aH + 0.9 / RF, RF - 0.05 - 0.07 * Math.max(0, fl2))) },
      hands: { F: lc([0.2 + 0.08 * fl2, -0.4]), B: lc([0.1 - 0.08 * fl, -0.43]) } };
    const hl = MB.body({ ...p, feet: { L: lc([0, 0.3]), R: lc([0, 0.3]) } }).head.c, rot = Math.atan2(head[1] - pel[1], head[0] - pel[0]) - Math.atan2(hl[1], hl[0]);
    return { ...p, root: { ...p.root, x: pel[0], y: pel[1], rot } };
  }
  const ROT_FD = facedown(T.curl, DRAG[1]).root.rot;
  // the tumble: from lying face down to upright, in whole turns, fastest at first
  const spinRate = (t) => (t < T.curl ? 0 : lerp(10, 4.5, seg(t, T.curl, T.plant)) * (1 - smooth(T.plant - 0.4, T.plant, t)));
  const spinT = table(spinRate), TURNS = (() => { const nat = spinT(T.plant) - spinT(T.curl); let best = ROT_FD; while (best < nat - PI) best += 2 * PI; return best; })();
  const tumbleRot = (t) => ROT_FD - (spinT(t) - spinT(T.curl)) / ((spinT(T.plant) - spinT(T.curl)) || 1) * TURNS;
  const TUCK = (sx, u) => ({ root: { x: 0, y: 0, rot: 0, sx }, lean: lerp(0.3, 0.85, u), bend: 0.6, nod: lerp(0.2, 0.5, u), sh: MB.B.shN, knee: { L: 1, R: 1 }, elbow: { F: 1, B: 1 },
    feet: { L: lc(lp([0.05, 0.3], [0.13, -0.03], u)), R: lc(lp([-0.05, 0.3], [0.16, 0.0], u)) }, hands: { F: lc(lp([0.2, -0.3], [0.21, 0.0], u)), B: lc(lp([0.1, -0.3], [0.17, 0.03], u)) } });
  function fallPose(t) {
    // (the trip itself is drawn by tripLines)
    if (t < T.down) return null;
    // dragged up the side by the floor, face down, arms and legs flailing
    if (t < T.curl) return facedown(t, lerp(DRAG[0], DRAG[1], smoother(seg(t, T.down, T.curl))));
    // tumbling over and over in one place as the floor runs under him, curled up; he comes out of it upright
    if (t < T.plant) {
      const u = smoother(seg(t, T.curl, T.curl + 0.3)), sx = t < T.curl + 0.12 ? -1 : 1;
      return onTheFloor(TUCK(sx, u), ballAng(t), tumbleRot(t));
    }
    return null;
  }
  // up: the back foot down on the slope, then the front foot steps up the curve, and he rises into the stance
  const settleA = key([[T.plant, 24 * DEG], [T.up, GAM]]);
  function standPose(t) {
    const unroll = smoother(seg(t, T.plant, T.step[0] + 0.1)), st = smoother(seg(t, ...T.step)), rise = smoother(seg(t, T.step[0], T.up));
    const a = settleA(t), d = a - GAM;                       // drifting down to where he rides
    const R = (p) => along(p, d);
    // from the ball: crouched low over the planted back foot
    const crouchPel = R(along([-0.02, 0.43], GAM)), pel = lp(crouchPel, R(STANCE.pel), rise);
    const fL = R(STANCE.fL), fR = lp(R(along([0.1, 0.62], GAM)), R(STANCE.fR), st), lift = 0.1 * Math.sin(PI * st);
    const frontFoot = add(fR, mul([-Math.sin(GAM - 0.3), -Math.cos(GAM - 0.3)], lift));
    // balance: arms out wide, wobbling, damping down
    const wob = Math.sin((t - T.up) * 7.5) * Math.exp(-Math.max(0, t - T.up) * 0.55) * smooth(T.up - 0.3, T.up + 0.2, t);
    const lean = lerp(0.28, ML, rise) + 0.14 * wob, nod = lerp(0.3, -ML + 0.1, rise) - 0.1 * wob;
    let hF = [0.36, -0.16 - 0.1 * wob], hB = [-0.34, -0.12 + 0.1 * wob];
    hF = lp([0.2, 0.0], hF, smooth(T.plant, T.step[1], t)); hB = lp([0.17, 0.03], hB, smooth(T.plant, T.step[1], t));
    return { root: { x: pel[0], y: pel[1], rot: 0, sx: 1 }, lean, bend: 1, nod, sh: MB.B.shN, feet: { L: wq(fL), R: wq(frontFoot) }, knee: { L: -1, R: 1 }, fore: { L: 0.85 * rise, R: 0 },
      hands: { F: lc(hF), B: lc(hB) }, elbow: { F: 1, B: -1 }, _wob: wob, _unroll: unroll };
  }
  // riding: calm; a look down at his feet; then out at the field, following it; then hands behind his head, leaning back
  let ELB = [1, -1];
  function ridePose(t) {
    const p = standPose(Math.min(t, T.balanced + 0.01)), ease = smooth(T.balanced - 0.5, T.balanced + 0.3, t);
    const look = key([[T.balanced, 0], [T.watch[0], 0.18], [T.watch[0] + 0.7, -0.12], [T.watch[0] + 1.6, -0.1], [T.watch[1], 0.05]]);
    p.nod += look(t) + 0.04 * Math.sin(t * 2.1) * ease;
    // the head follows lines going by: little turns as they pass
    p.nod += 0.035 * Math.sin((t - T.watch[0]) * 6.2) * bump(t, T.watch[0] + 0.8, T.watch[1]);
    const lg = smoother(seg(t, ...T.lounge));
    // hands on his hips, elbows out
    const sh = [0, -MB.B.spine * (1 - MB.B.shN)];
    p.hands = { F: lc(lp([p.hands.F.x, p.hands.F.y], [0.07, -0.03], lg)), B: lc(lp([p.hands.B.x, p.hands.B.y], [-0.04, -0.01], lg)) };
    p.elbow = { F: ELB[0], B: ELB[1] };
    
    p.lean = lerp(p.lean, ML - 0.16, lg); p.nod = lerp(p.nod, -ML + 0.2, lg) + 0.03 * Math.sin(t * 1.7) * lg;
    void sh;
    return p;
  }
  function tripLines(t) {
    const u = seg(t, T.trip, T.down), p0 = runPose(T.trip), foot = [p0.feet.L.x, p0.feet.L.y], rot = -1.35 * u * u;
    const pv = (q) => { const d = [q[0] - foot[0], q[1] - foot[1]]; return [foot[0] + d[0] * Math.cos(rot) - d[1] * Math.sin(rot), foot[1] + d[0] * Math.sin(rot) + d[1] * Math.cos(rot)]; };
    const pel = pv([p0.root.x, p0.root.y]), arms = smoother(seg(u, 0, 0.6));
    const p = { ...p0, root: { ...p0.root, x: pel[0], y: pel[1], rot }, lean: lerp(p0.lean, 0.15, u), nod: lerp(p0.nod, -0.35, u), elbow: { F: -1, B: -1 },
      hands: { F: lc(lp([p0.hands.F.x, p0.hands.F.y], [0.42, -0.3], arms)), B: lc(lp([p0.hands.B.x, p0.hands.B.y], [0.38, -0.24], arms)) },
      feet: { L: p0.feet.L, R: wq(lp([p0.feet.R.x, p0.feet.R.y], onFloor(0.32, RF - 0.12), u)) } };
    return mixLines(MB.body(p), MB.body(facedown(T.down, DRAG[0])), smoother(seg(u, 0.5, 1)));
  }
  const mixLines = (a, b, u) => { const bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); return { ...b, spine: bl(a.spine, b.spine), legL: bl(a.legL, b.legL), legR: bl(a.legR, b.legR), armF: bl(a.armF, b.armF), armB: bl(a.armB, b.armB), head: { ...b.head, c: lp(a.head.c, b.head.c, u), a: lerp(a.head.a, b.head.a, u) } }; };
  function pose(t) {
    if (t < T.trip) return runPose(t);
    const f = fallPose(t); if (f) return f;
    if (t < T.balanced) return standPose(t);
    return ridePose(t);
  }

  // ---- the field: lines of flow, streaming left, turning to streaks as it quickens ------------------------------------------
  function field(ctx, t, cam, j) {
    const X = flow(t), sp = streak(t), { fg } = I.THEMES[THEME];
    const amp = lerp(0.07, 0.02, sp), sc = lerp(1.1, 0.45, sp);
    const F = (x, y) => y + amp * FL.fbm((x + X) * sc, y * 1.6, 7) + 0.03 * Math.sin((x + X) * 2.2 + y * 3);
    const mask = (x, y) => { const r = Math.hypot(x, y); return clamp((r - RO - 0.05) / 0.12, 0, 1); };
    FL.contours(ctx, F, cam, W, H, { step: 0.07, cell: 6, mask, width: 1.2, color: fg, j });
    // streaks and posts riding the lines, overtaking him
    if (sp > 0.02) {
      ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round';
      const r = I.rng(5);
      for (let i = 0; i < 70; i++) {
        const y = -1.6 + 3.2 * r(), len = (0.15 + 0.5 * r()) * (0.5 + sp), speed = 0.8 + 0.6 * r(), x0 = 3.4 - ((r() * 6.8 + X * speed) % 6.8);
        if (Math.hypot(x0, y) < RO + 0.1 || Math.hypot(x0 + len, y) < RO + 0.1) continue;
        const a = cam(x0, y), b = cam(x0 + len, y);
        ctx.globalAlpha = 0.55 * sp; ctx.lineWidth = 1.5 + r() * 1.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.restore();
    }
  }
  // his legs as a blur at full sprint: a few faint arcs where the feet sweep
  function blur(ctx, t, cam, j) {
    const b = smooth(T.sprint, T.sprint + 0.8, t) * (1 - smooth(T.trip - 0.2, T.trip, t)); if (b <= 0) return;
    ctx.save(); ctx.strokeStyle = I.THEMES[THEME].fg; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, 0.012 * cam.k);
    for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.35 * b; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const a = -0.42 + 0.84 * i / 20, p = onFloor(a / 1.0 * 0.32, RF - 0.03 - 0.045 * k - 0.05 * Math.sin(PI * i / 20)), s = j(cam(p[0] - 0.04, p[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); } ctx.stroke(); }
    ctx.restore();
  }
  // sweat: drops flung back off him while he sprints
  function sweat(ctx, t, cam, ln) {
    const b = smooth(T.sprint + 0.6, T.sprint + 1.2, t) * (1 - smooth(T.trip, T.trip + 0.1, t)); if (b <= 0) return;
    ctx.save(); ctx.fillStyle = I.THEMES[THEME].fg;
    for (let i = 0; i < 4; i++) { const age = ((t * 1.3 + i * 0.25) % 1), h = ln.head.c, p = [h[0] + 0.2 + 0.5 * age, h[1] - 0.12 - 0.25 * age + 0.6 * age * age], s = cam(p[0], p[1]);
      ctx.globalAlpha = b * (1 - age); ctx.beginPath(); ctx.ellipse(s[0], s[1], 0.012 * cam.k, 0.02 * cam.k, -0.6, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  // ---- camera ----------------------------------------------------------------------------------------------------------------
  function camAt(t) {
    const k = key([[0, 360], [T.quick, 360], [T.sprint, 400], [T.trip, 410], [T.up, 380], [T.watch[0], 380], [DUR, 430]])(t);
    const c = key([[0, [0, 0.05]], [T.sprint, [-0.05, 0.12]], [T.trip, [-0.02, 0.1]], [T.up, [0.08, 0.06]], [DUR, [0.12, 0.04]]])(t);
    const sh = 0.006 * smooth(T.sprint, T.sprint + 1, t) * (1 - smooth(T.trip, T.trip + 0.3, t)) * Math.sin(t * 61) + 0.02 * bump(t, T.down - 0.05, T.down + 0.25) * Math.sin(t * 90);
    return I.camera(W, H, { cx: c[0] + sh, cy: c[1] + sh * 0.6, k });
  }

  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.0);
    I.background(ctx, THEME, W, H);
    field(ctx, t, cam, j);
    MB.drawMark(ctx, cam, j, fg, bg, 'loop', [0, 0], turn(t));
    blur(ctx, t, cam, j);
    let ln = t >= T.trip && t < T.down ? tripLines(t) : MB.body(pose(t));
    if (t >= T.plant && t < T.plant + 0.4) ln = mixLines(MB.body(fallPose(T.plant - 0.001)), ln, smoother(seg(t, T.plant, T.plant + 0.4)));
    MB.draw(ctx, ln, cam, j, fg);
    sweat(ctx, t, cam, ln);
    I.vignette(ctx, THEME, W, H, 0.18);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(DUR - 0.8, DUR, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound -------------------------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.03, chords: [[0, 9.8, [110, 164.81, 220, 261.63]], [9.4, 14.2, [116.54, 174.61, 233.08, 293.66]], [15.0, 21.5, [98, 146.83, 196, 246.94]], [21.0, DUR + 0.5, [130.81, 196, 261.63, 329.63, 392]]] }];
    // footsteps: each time a foot lands
    let last = [true, true];
    for (let s = 0.5; s < T.trip; s += 1 / 120) { const p = runPose(s)._feet; p.forEach((f, k) => { if (f.down && !last[k]) ev.push({ t: s, type: 'step', amp: lerp(0.18, 0.32, smooth(0.4, 2.6, vel(s))), tone: lerp(1, 1.3, smooth(0.4, 2.6, vel(s))), pan: k ? 0.1 : -0.1 }); last[k] = f.down; }); }
    ev.push({ t: 0, type: 'rumble', speeds: Array.from({ length: Math.ceil(DUR * 50) + 2 }, (_, i) => 1.5 * vel(i / 50)) });
    ev.push({ t: 0, type: 'fallwind', dur: DUR, track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => 0.15 + 0.6 * streak(i / 20)) });
    ev.push({ t: T.trip, type: 'swish' }, { t: T.down, type: 'land' }, { t: T.down + 0.05, type: 'rustle' });
    for (let s = T.curl; s < T.plant; s += 0.34) ev.push({ t: s, type: 'whoosh', dur: 0.3, amp: 0.07, from: -0.3, to: 0.3 });
    ev.push({ t: T.plant, type: 'step', amp: 0.3, tone: 0.9 }, { t: T.step[1] - 0.05, type: 'step', amp: 0.3, tone: 1.1 }, { t: T.up + 0.6, type: 'exhale' });
    ev.push({ t: T.balanced, type: 'pluck', f: 392, amp: 0.12 }, { t: T.watch[0] + 0.8, type: 'pluck', f: 523.25, amp: 0.1 }, { t: T.lounge[1], type: 'chime', f: 1046.5, amp: 0.08 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'keepup', title: 'Keep Up', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, setElb: (e) => { ELB = e; } };
});
