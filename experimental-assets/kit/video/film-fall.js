// FILM 11, Fall. The cliff again, told the way the mark is drawn. The loop is there from the first frame, at the heart
// of the site's tunnel of lines, and its opening goes round like the hand of a clock. He watches it from the edge.
// When it reaches eleven he runs and jumps, and goes in by the one way in. He lands feet first on the inside of its
// curve, and the knock sends it falling down the 30 degree line with him riding it like a board: back foot low, front
// foot up the curve (the legs of the mark). He surfs it: finds his balance, pumps, trails a hand along the wall.
// The fall gathers speed and the lines outside wrap round the loop into the site's meteor (the fall on the 404 page and
// the share cards: a dashed teardrop round the leading edge, short streaks along the line). Then the loop starts to
// shake and rock and throw him about. He reaches up to steady it, elbows bent; reaches further, arms straight, toward
// its walls; and bends them round inside it in its own shape. The rocking stops. Holding the loop's shape from
// inside is what keeps it true; what is left is the mark, falling like the site's meteor.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).fall = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 34, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const rotv = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) { const ks = per[f]; if (t <= ks[0][0]) { out[f] = ks[0][1]; continue; } let v = ks[ks.length - 1][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { v = lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); break; } out[f] = v; } return out; };
  }
  const D = [Math.sin(PI / 6), Math.cos(PI / 6)], N = [-D[1], D[0]];   // down the 30 degree line, and across it
  const RM = MB.MK.loop.r, RO = RM + MB.MK.loop.w / 2;

  // ---- the clock: the loop's opening goes round an hour a tick, from five to eleven ---------------------------------
  const TICKS = [1.6, 2.8, 4.0, 5.2, 6.4, 7.6];
  const hand = (x) => (x <= 0 ? 0 : 1 - Math.exp(-x * 16) * Math.cos(x * 26));
  const clock = (t) => PI + (PI / 6) * TICKS.reduce((s, k) => s + hand(t - k), 0);

  // ---- the jump: off the edge on a curve that meets the 30 degree line at the opening --------------------------------
  const T = { back: [5.25, 6.2], ready: [6.4, 7.45], run: [7.6, 8.15], jump: 8.15 };
  const LAUNCH = [0, -0.36], V0 = [1.75, -1.15], TF = 1.3, G = (V0[0] * Math.tan(PI / 3) - V0[1]) / TF, VA = V0[0] / Math.cos(PI / 3);
  const O = [LAUNCH[0] + V0[0] * TF, LAUNCH[1] + V0[1] * TF + G * TF * TF / 2], C0 = add(O, mul(D, RM));
  const LAND_P = 0.4;                                    // his pelvis from the loop's centre, along the line, when his feet touch
  T.gap = T.jump + TF; T.land = T.gap + (RM + LAND_P) / VA;
  // after the landing the loop falls down the line with him, faster and faster
  const vel = (t) => (t < T.land ? 0 : Math.min(5, 1.75 + 0.5 * (t - T.land) + 0.035 * (t - T.land) ** 2));
  const table = (f) => { const o = [0]; for (let i = 1; i <= DUR * 240 + 2; i++) o.push(o[i - 1] + f(i / 240) / 240); return (t) => { const x = clamp(t, 0, DUR) * 240, i = Math.min(o.length - 2, Math.floor(x)); return lerp(o[i], o[i + 1], x - i); }; };
  const fallen = table(vel), drift = table((t) => Math.min(vel(t), 2.0));   // drift: how far the dashes have moved past him
  const LC = (t) => add(C0, mul(D, fallen(t)));

  // ---- the rocking: a carve while he surfs, then the shaking that his arms put a stop to ---------------------------
  const TA = { wobble: [17.2, 19.8], elbows: [20.2, 21.3], straight: [21.3, 22.4], round: [22.4, 23.5], settle: [24.0, 24.7], mark: [24.7, 25.6], trail: [16.6, 21.2] };
  const rockAmp = (t) => 0.25 * smooth(17.2, 19.8, t) * Math.max(0, 1 - 0.12 * smooth(20.2, 21.3, t) - 0.13 * smooth(21.3, 22.4, t) - 0.75 * smoother(seg(t, 22.5, 23.3)));
  const carve = (t) => 0.2 * Math.sin(2 * PI * (t - 12.3) / 1.5) * Math.pow(bump(t, 12.3, 13.8), 0.6);
  const rock = (t) => (t < T.land ? 0 : carve(t) + 0.05 * Math.sin(2 * PI * (t - 14.62) / 0.5) * Math.exp(-Math.max(0, t - 14.62) * 4) * (t > 14.62 ? 1 : 0) + rockAmp(t) * (Math.sin(2 * PI * 1.25 * (t - 17.2)) + 0.3 * Math.sin(2 * PI * 2.9 * (t - 17.2) + 1)) / 1.3);
  const turn = (t) => (t < T.land ? clock(t) : rock(t));

  // ---- him ---------------------------------------------------------------------------------------------------------
  const MP = MB.MARK_POSE(0, 0), MF = (k) => [MP.feet[k].x, MP.feet[k].y], MH = (k) => [MP.hands[k].x, MP.hands[k].y], MPEL = [MP.root.x, MP.root.y], ML = MB.MARK_LEAN;
  const SHM = MB.MK.armF[0], ARMC = [0, (47.4 - 50) / MB.S], HIP = 0.33, EDGE = -0.2, BACK = -1.05;
  const shoulder = (pel, lean, sh) => { const neck = add(pel, [Math.sin(lean) * MB.B.spine, -Math.cos(lean) * MB.B.spine]); return lp(neck, pel, sh); };
  const polarLerp = (a, b, u, c) => { const ra = dist(a, c), rb = dist(b, c), aa = Math.atan2(a[1] - c[1], a[0] - c[0]); let ab = Math.atan2(b[1] - c[1], b[0] - c[0]); while (ab - aa > PI) ab -= 2 * PI; while (ab - aa < -PI) ab += 2 * PI; const r = lerp(ra, rb, u), g = lerp(aa, ab, u); return [c[0] + r * Math.cos(g), c[1] + r * Math.sin(g)]; };
  const BAL = { F: [0.37, 0.27], B: [-0.34, 0.3] };
  const V_F = add(SHM, mul([Math.sin(0.7), -Math.cos(0.7)], 0.86)), V_B = add(SHM, mul([-Math.sin(0.7), -Math.cos(0.7)], 0.86));
  const S0 = T.land + 1.3;
  // riding: keys for his pelvis, lean and hands, all relative to the loop's centre
  const ride = track([
    [S0, { pel: MPEL, lean: ML, nod: -ML + 0.1, sh: MB.B.shN, hF: BAL.F, hB: BAL.B, lenF: 0.36, lenB: 0.36 }],
    [13.75, { pel: MPEL, lean: ML, nod: -ML + 0.1, hF: BAL.F, hB: BAL.B, lenB: 0.36 }],
    // a hop: down, up with the arms, and down again
    [13.95, { pel: add(MPEL, [0, 0.05]), hF: [0.3, 0.38], hB: [-0.28, 0.4] }], [14.25, { pel: add(MPEL, [0, -0.13]), hF: [0.33, 0.02], hB: [-0.3, 0.04] }], [14.62, { pel: add(MPEL, [0, 0.05]), hF: [0.38, 0.3], hB: [-0.35, 0.32] }],
    [14.9, { pel: MPEL, hF: BAL.F, hB: BAL.B }],
    // crouched, a hand trailed along the wall behind him
    [15.35, { pel: add(MPEL, [0.02, 0.05]), lean: ML + 0.3, nod: -0.2, hF: [0.4, 0.16], hB: [-0.24, 0.585], lenB: 0.4 }],
    [16.0, { pel: add(MPEL, [0.02, 0.05]), lean: ML + 0.3, nod: -0.2, hF: [0.4, 0.16], hB: [-0.24, 0.585], lenB: 0.4 }],
    [16.4, { pel: MPEL, lean: ML, nod: -ML + 0.05, hF: BAL.F, hB: BAL.B, lenB: 0.36 }],
    // yes
    [16.65, { hF: [0.3, -0.04] }], [16.85, { hF: [0.31, 0.02] }], [17.2, { hF: BAL.F }],
    [20.2, { hF: [0.38, 0.2], hB: [-0.35, 0.24], sh: MB.B.shN, lenF: 0.36, lenB: 0.36, nod: -ML + 0.1, lean: ML, pel: MPEL }],
    // up to steady it: hands over his head, the elbows bent
    [21.3, { hF: [0.3, -0.24], hB: [-0.31, -0.22], sh: 0.45, lenF: 0.84, lenB: 0.82, nod: -ML }],
    // further, toward the walls: the arms straight
    [22.4, { hF: V_F, hB: V_B, sh: MB.B.sh, lenF: dist(SHM, V_F), lenB: dist(SHM, V_B) }]
  ]);
  function pose(t) {
    // on the cliff: watching the clock go round; back for a run-up; set; the run; the jump
    if (t < T.jump) {
      const back = smoother(seg(t, ...T.back)), run = seg(t, ...T.run);
      let x = EDGE;
      if (t >= T.back[0]) x = lerp(EDGE, BACK, back);
      if (t >= T.run[0]) x = BACK + (LAUNCH[0] - BACK) * Math.pow(run, 1.6);
      const p = { root: { x, y: -HIP, rot: 0, sx: 1 }, lean: 0.03, bend: 0.4, nod: 0.16, feet: { L: wq([x - 0.07, 0.02]), R: wq([x + 0.08, 0.02]) }, knee: { L: 1, R: 1 }, hands: { F: lc([0.13, 0.05]), B: lc([-0.1, 0.06]) }, elbow: { F: -1, B: 1 } };
      // each tick he looks up a little; from eight on he leans in
      p.nod += -0.07 * TICKS.reduce((s, k) => s + bump(t, k - 0.05, k + 0.45), 0) * (1 - smooth(5.0, 5.3, t));
      p.lean += 0.12 * smooth(3.6, 4.4, t) * (1 - smooth(5.0, 5.4, t));
      // stepping back: two steps, feet alternating
      if (t >= T.back[0] && t < T.run[0]) { const ph = back * 2, sw = Math.sin(PI * (ph % 1)), even = Math.floor(ph) % 2 === 0; p.feet = { L: wq([x - 0.07 - (even ? 0.07 : -0.03) * sw, 0.02 - 0.05 * (even ? sw : 0)]), R: wq([x + 0.08 - (even ? -0.03 : 0.07) * sw, 0.02 - 0.05 * (even ? 0 : sw)]) }; }
      // set: low, leaning in, arms back
      const set = smoother(seg(t, ...T.ready)) * (1 - smooth(T.run[0], T.run[0] + 0.2, t));
      p.root.y += 0.08 * set; p.lean += 0.42 * set; p.nod -= 0.3 * set;
      if (set > 0) p.hands = { F: lc(lp([0.13, 0.05], [-0.2, 0.02], set)), B: lc(lp([-0.1, 0.06], [-0.26, -0.02], set)) };
      // the run: three strides, arms pumping, leaning into it
      if (t >= T.run[0]) {
        const ph = run * 3.5, a = 2 * PI * ph / 2;
        p.lean = 0.3 + 0.1 * run; p.nod = -0.12; p.root.y = -HIP + 0.025 * Math.abs(Math.sin(a));
        p.feet = { L: wq([x + 0.17 * Math.sin(a) + 0.04, 0.02 - 0.08 * Math.max(0, Math.cos(a))]), R: wq([x - 0.17 * Math.sin(a) + 0.04, 0.02 - 0.08 * Math.max(0, -Math.cos(a))]) };
        p.hands = { F: lc([0.2 * Math.sin(a), -0.04]), B: lc([-0.2 * Math.sin(a), -0.02]) }; p.elbow = { F: 1, B: -1 };
      }
      return p;
    }
    // the flight: up and out, knees tucked, then turning feet first down the line, arms in, and in by the opening
    if (t < T.land) {
      const tau = t - T.jump, P = tau < TF ? [LAUNCH[0] + V0[0] * tau, LAUNCH[1] + V0[1] * tau + G * tau * tau / 2] : add(O, mul(D, VA * (tau - TF)));
      const rot = tau < 0.5 ? lerp(0.3, 0.02, smoother(tau / 0.5)) : lerp(0.02, -PI / 6, smoother(seg(tau, 0.7, TF - 0.12)));
      // still running in the air, then legs together and arms in: feet first, like a pencil
      const k2 = smoother(seg(tau, 0.72, 1.12)), k1 = smoother(seg(tau, 0, 0.3));
      // a leap: a wide stride, arms spread
      const run = { L: lp([-0.12, 0.28], [-0.25, 0.19], k1), R: lp([0.12, 0.26], [0.25, 0.17], k1), F: lp([0.2, -0.04], [0.31, -0.2], k1), B: lp([-0.2, -0.02], [-0.3, -0.1], k1) };
      // through the opening he is quick enough to smear
      const sq = 1 + 1.0 * Math.exp(-(((t - T.gap - 0.14) / 0.12) ** 2));
      return { root: { x: P[0], y: P[1], rot, sx: 1, stretch: [Math.atan2(D[1], D[0]), sq], squashHead: true }, lean: lerp(0.15, 0, k2), bend: 0.4, nod: lerp(-0.1, 0.05, k2),
        feet: { L: lc(lp(run.L, [-0.01, 0.335], k2)), R: lc(lp(run.R, [0.02, 0.335], k2)) }, knee: { L: 1, R: 1 },
        hands: { F: lc(lp(run.F, [0.07, 0.04], k2)), B: lc(lp(run.B, [-0.05, 0.05], k2)) }, elbow: { F: 1, B: -1 } };
    }
    // in the loop, relative to its centre: the landing, the slide down its curve into the stance, then riding
    const c = LC(t), at = (q) => wq(add(c, q)), tl = t - T.land;
    if (t < S0) {
      const slide = smoother(seg(tl, 0.3, 1.3)), comp = 0.04 * bump(tl, 0, 0.32);
      const pel = lp(mul(D, LAND_P + comp), MPEL, slide), rot = lerp(-PI / 6, 0, slide), lean = lerp(0, ML, slide);
      const aL = lerp(80, 96.3, slide) * PI / 180, rL = lerp(RM + 0.01, Math.hypot(...MF('L')), slide);
      const turnL = seg(slide, 0.35, 0.5), back = seg(slide, 0.5, 0.65);
      // hands: from his sides, flung out on the landing, then out for balance
      const fromSide = (q) => add(mul(D, LAND_P), rotv(q, -PI / 6)), sh0 = shoulder(mul(D, LAND_P), -PI / 6, 0.3);
      const fling = smoother(seg(tl, 0, 0.22));
      const hF = lp(lp(fromSide([0.07, 0.04]), add(sh0, add(mul(N, -0.32), mul(D, -0.06))), fling), BAL.F, slide);
      const hB = lp(lp(fromSide([-0.05, 0.05]), add(sh0, add(mul(N, 0.3), mul(D, -0.04))), fling), BAL.B, slide);
      return { root: { x: c[0] + pel[0], y: c[1] + pel[1], rot, sx: 1 }, lean, bend: lerp(0.4, 1, slide), nod: lerp(0.08, -ML + 0.1, slide),
        feet: { L: at([rL * Math.cos(aL), rL * Math.sin(aL)]), R: at(MF('R')) }, knee: { L: slide < 0.5 ? 1 : -1, R: 1 }, fore: { L: lerp(turnL, 0.85, back), R: 0 },
        hands: { F: at(hF), B: at(hB) }, elbow: { F: 1, B: -1 }, sh: MB.B.shN };
    }
    const r = ride(t);
    let pel = r.pel, lean = r.lean, nod = r.nod, hF = r.hF, hB = r.hB, lenF = r.lenF, lenB = r.lenB, sh = r.sh, round = 0;
    // finding his balance after the slide
    const bal = smooth(S0, S0 + 0.15, t) * (1 - smooth(11.9, 12.4, t));
    lean += 0.1 * Math.sin(9 * t) * bal; hF = add(hF, [0, 0.08 * Math.sin(9 * t + 1) * bal]); hB = add(hB, [0, -0.08 * Math.sin(9 * t + 1) * bal]);
    // two pumps
    if (t > 12.4 && t < 13.6) { const u = 2 * PI * (t - 12.4) / 0.6; pel = add(pel, [0, 0.05 * (1 - Math.cos(u)) / 2]); hF = add(hF, [0, 0.06 * Math.sin(u)]); hB = add(hB, [0, 0.06 * Math.sin(u)]); }
    const hop = bump(t, 14.05, 14.55); lean += 1.2 * carve(t);
    // thrown about by the shaking
    const fl = smooth(17.4, 18.4, t) * (1 - smooth(19.9, 20.4, t));
    if (fl > 0) { hF = add(hF, mul([0.05 * Math.sin(8.1 * t), 0.11 * Math.sin(6.3 * t + 0.5)], fl)); hB = add(hB, mul([0.05 * Math.sin(7.4 * t + 2), 0.11 * Math.sin(5.7 * t + 1.9)], fl)); lean += 0.12 * Math.sin(4.1 * t) * fl; pel = add(pel, [0, 0.025 * (1 - Math.cos(9 * t)) * fl]); }
    // the arms bend round: the hands slide up over the top, the arms curving to the loop's own shape
    if (t >= TA.round[0]) { const u = smoother(seg(t, ...TA.round)); hF = polarLerp(V_F, MH('F'), u, ARMC); hB = polarLerp(V_B, MH('B'), u, ARMC); lenF = lerp(dist(SHM, V_F), MB.B.armF, u); lenB = lerp(dist(SHM, V_B), MB.B.armB, u); round = 1; sh = MB.B.sh; nod = -ML; lean = ML; pel = MPEL; }
    // an arm can only be as short as the reach
    const S = shoulder(pel, lean, sh); lenF = Math.max(lenF, dist(S, hF)); lenB = Math.max(lenB, dist(S, hB));
    return { root: { x: c[0] + pel[0], y: c[1] + pel[1], rot: 0, sx: 1 }, lean, bend: 1, nod, sh, feet: { L: at(add(MF('L'), [0, -0.13 * hop])), R: at(add(MF('R'), [0, -0.13 * hop])) }, knee: { L: -1, R: 1 }, fore: { L: 0.85, R: 0 },
      hands: { F: at(hF), B: at(hB) }, elbow: { F: 1, B: -1 }, armLen: { F: lenF, B: lenB }, round: { F: round, B: round } };
  }
  const rotLn = (ln, a, c) => { if (!a) return ln; const R = (q) => add(c, rotv(sub(q, c), a)), m = (pts) => pts.map(R); return { ...ln, spine: m(ln.spine), legL: m(ln.legL), legR: m(ln.legR), armF: m(ln.armF), armB: m(ln.armB), head: { ...ln.head, c: R(ln.head.c), a: ln.head.a + a } }; };
  function hero(t) {
    let ln = MB.body(pose(t));
    if (t >= T.land) ln = rotLn(ln, rock(t), LC(t));
    if (t > TA.settle[0]) { const c = LC(t); ln = MB.settle(ln, smoother(seg(t, ...TA.settle)), c[0], c[1]); }
    return ln;
  }

  // ---- the site's meteor, in its own units (the loop's radius is 51 there) ---------------------------------------------
  const SV = 44 * 1.16 / RM;
  const TR = [[57, 150, 2], [63, 192, 1.7], [69.5, 234, 1.4], [76.5, 276, 1.1], [84, 318, 0.85], [92, 360, 0.65]].map(([r, L, wd]) => ({ r: r / SV, L: L / SV, w: wd / SV }));
  const GR = TR.map((q) => q.r);
  // a trail line's value -> its number (0..5 are the six lines; the spacing carries on either side)
  const G2 = (f) => { if (f <= GR[0]) return (f - GR[0]) / 0.083; if (f >= GR[5]) return 5 + (f - GR[5]) / 0.115; let i = 0; while (f > GR[i + 1]) i++; return i + (f - GR[i]) / (GR[i + 1] - GR[i]); };
  // each line runs from the leading point round half a circle, then back in a tail that closes in on the line of the fall
  const TAIL = (() => { const o = []; for (let i = 0; i <= 400; i++) { const s = i / 400, u = 1 - s; o.push([3 * u * u * s * 0.41 + 3 * u * s * s * 0.79 + s * s * s, u * u * u + 3 * u * u * s + 3 * u * s * s * 0.34 + 0.1 * s * s * s]); } return o; })();
  const tailY = (X) => { if (X <= 0) return 1; if (X >= 1) return 0.1 * Math.exp(-(X - 1) * 3); let lo = 0, hi = 400; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAIL[m][0] < X) lo = m; else hi = m; } const a = TAIL[lo], b = TAIL[hi]; return lerp(a[1], b[1], (X - a[0]) / ((b[0] - a[0]) || 1)); };
  const tailL = (r) => Math.max(6 * r - 192 / SV, 1.6 * r);
  const rho = (xp, yp) => { if (xp >= 0) return Math.hypot(xp, yp); const ay = Math.abs(yp); let lo = 0, hi = 6; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (m * tailY(-xp / tailL(m)) < ay) lo = m; else hi = m; } return (lo + hi) / 2; };
  const lenOf = (r) => r * PI / 2 + tailL(r) * 1.06;
  // the 404 page's streaks: [x in its 240 repeat, y across, length, width]
  const STREAKS = [[201.7,207.63,76.62,0.86],[97.8,-99.12,20.62,1.32],[162.3,-259.98,11.18,0.58],[6.4,-328.29,34.23,0.93],[105.6,-182.66,11.13,1.63],[20.4,274.83,10.52,1.68],[106.5,-144.58,45.59,1.66],[4,-109.21,22.76,0.62],[136.9,-81.53,19.6,1.12],[56.3,287.7,53.82,1.21],[237.8,-3.99,83.29,1.52],[205.5,-258.79,18.06,1.29],[211,102.91,14.17,1.53],[202.9,311.72,24.02,1.49],[15.8,-308.86,20.78,1.41],[13.6,86.57,85.66,0.8],[121.4,-115.29,51.26,1.26],[100.6,-238.44,31.67,0.67],[238.2,0.47,20.52,1.06],[63.9,-31.39,10.56,0.9],[228.1,89.49,26.94,1.66],[33.1,-160.54,19.83,0.54],[208,177.27,56.53,1.56],[37.3,254.06,11.62,1.14],[196.8,-63.49,62.51,0.56],[130.3,45.94,18.67,0.71],[102,51.47,15.82,1.65],[94.9,-29.09,49.81,1.34],[14.3,218.72,11.16,1],[125.9,-217.94,52.23,1.44],[148,305.62,10.61,0.52],[180.5,55.95,13.17,1.65],[33.1,-192.29,51.79,1.59],[79.9,170.97,12.85,0.79],[113.2,-146.22,10.06,1.13],[21.5,136.52,11.32,0.86],[118.3,233.79,11.02,0.96],[61.4,-219.83,26.7,1.55],[149.5,193.35,15.34,0.8],[156.9,255,10.06,0.85],[36.6,208.9,16.73,1.57],[187.1,-231.97,20.86,0.64],[83.6,263.39,61.77,1.32],[156.4,134.48,10.3,1.21],[56,275.99,50.49,0.74],[19.3,-252.97,26.88,0.52],[190.4,-170.15,50.12,0.93],[38.1,306.86,45.55,1.31],[59.9,138.13,77.63,0.99],[114.6,-99.38,53.88,1.6],[214.6,-89.76,41.47,1.31],[146.1,-72.49,37.41,1.6],[213.9,-325.49,52.02,1],[175.9,-222.63,13.48,1.4],[37.6,-6.91,30.79,1.16],[154.2,-181.74,25.23,1.57],[155.2,-211.63,20.52,1.44],[183.4,54.37,10.98,1.47],[180.7,-305.81,10.29,1.33],[54.1,286.89,11.95,1.61],[117.8,166.35,34.95,0.97],[98.5,-241.53,85.95,1.05],[63.2,246.95,10.02,0.53],[94.9,-268.81,15.25,0.64],[148.9,155.96,82.59,0.81],[107.1,-308.53,54.04,0.94],[30.9,-160,13.26,0.73],[64.2,-147.92,40.03,1.07],[68.2,202.77,10.43,0.78],[119.5,153.18,15.05,0.72]];

  // ---- the field ---------------------------------------------------------------------------------------------------
  // before he lands: the tunnel, rings round the loop moving outward (a ring a tick); after: the flow past the falling
  // loop, its lines dashed and streaming by; then those lines wrap into the meteor's six
  const STEP = 0.085;
  const ringPhase = (t) => 0.45 * t + TICKS.reduce((s, k) => s + smoother(seg(t, k, k + 0.5)), 0);
  const tunnel = (x, y, o) => { const dx = x - o[0], dy = y - o[1], r = Math.hypot(dx, dy) || 1e-6; return r * (1 + 0.03 * FL.fbm(x * 0.6, y * 0.6, 3)) + 0.05 * FL.fbm(2.2 * dx / r + 9, 2.2 * dy / r + r * 0.3, 5); };
  function lines(ctx, t, cam, j) {
    const c = LC(t), wF = smoother(seg(t, T.land, T.land + 1.0)), wT = smoother(seg(t, ...TA.trail)), dashAmt = smooth(T.land + 0.6, T.land + 2.2, t);
    const swing = 0.35 * rock(t - 0.15) * smooth(16, 18, t), Dm = rotv(D, swing), Nm = rotv(N, swing);
    const wig = 0.5 * rockAmp(t), ph = ringPhase(t), dr = drift(t), R2 = (RO + 0.04) ** 2;
    const cell = 6, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(H / cell) + 1, v = new Float32Array(nx * ny);
    const XP = new Float32Array(nx * ny), YP = new Float32Array(nx * ny);
    for (let jy = 0; jy < ny; jy++) for (let ix = 0; ix < nx; ix++) {
      const p = cam.inv(ix * cell, jy * cell), k = jy * nx + ix, dx = p[0] - c[0], dy = p[1] - c[1];
      const xp = dx * Dm[0] + dy * Dm[1]; let yp = dx * Nm[0] + dy * Nm[1];
      if (xp < 0 && wig > 0) yp += wig * Math.sin(3.1 * xp - 13 * t) * clamp(-xp / 1.2, 0, 1);
      XP[k] = xp; YP[k] = yp;
      let val = 0;
      if (wF < 1) val += (1 - wF) * (tunnel(p[0], p[1], c) / STEP - ph);
      if (wF > 0) { const r2 = Math.max(xp * xp + yp * yp, 1e-6), psi = Math.sqrt(yp * yp + 0.0036) * (1 - R2 / r2); let f = psi; if (wT > 0) f = (1 - wT) * psi + wT * rho(xp, yp); val += wF * G2(f); }
      v[k] = val;
    }
    const buckets = new Map(), baseW = Math.max(1.1, 1.25 * cam.k / 330);
    const put = (a, b, wd, al) => { if (al < 0.03) return; const key = Math.round(wd * 2) + '|' + Math.min(4, Math.round(al * 4)); let pth = buckets.get(key); if (!pth) { pth = new Path2D(); buckets.set(key, pth); } const A = j(a), B = j(b); pth.moveTo(A[0], A[1]); pth.lineTo(B[0], B[1]); };
    for (let jy = 0; jy < ny - 1; jy++) for (let ix = 0; ix < nx - 1; ix++) {
      const k = jy * nx + ix, a = v[k], b = v[k + 1], cc = v[k + nx + 1], d = v[k + nx];
      const lo = Math.ceil(Math.min(a, b, cc, d)), hi = Math.floor(Math.max(a, b, cc, d));
      if (hi < lo) continue;
      const xp = XP[k], yp = YP[k], r2 = xp * xp + yp * yp;
      // nothing inside the loop, and a little room round it
      const m0 = clamp((Math.sqrt(r2) - RO - 0.05) / 0.1, 0, 1); if (m0 <= 0) continue;
      const x = ix * cell, y = jy * cell;
      for (let L = lo; L <= hi; L++) {
        // the trail keeps its six lines, each running out at the end of its tail
        let al = m0, wd = baseW;
        if (wF > 0 && wT > 0) {
          const inTrail = L >= 0 && L <= 5, rr = inTrail ? GR[L] : 0;
          const fade = inTrail ? (xp < 0 ? 1 - smooth(0.82, 1.0, -xp / tailL(rr)) : 1) : 0;
          al *= lerp(1, fade, inTrail ? wT : smooth(0, 0.55, wT));
          if (inTrail) wd = lerp(baseW, TR[L].w * cam.k, wT);
        }
        // dashes: streaming past him while he surfs; the meteor's own, slower, once the trail has formed
        if (wF > 0 && dashAmt > 0) {
          const on1 = (((xp + dr) / 0.75 + L * 0.37) % 1 + 1) % 1 < 0.8 ? 1 : 0;
          let on = on1;
          if (wT > 0 && L >= 0 && L <= 5) { const rr = GR[L], s = xp >= 0 ? rr * Math.abs(Math.atan2(yp, xp)) : rr * PI / 2 - xp * 1.06, u = s / lenOf(rr), dd = 0.095 * ((((t + 0.11 * L) / 1.5) % 1)); const on2 = (((u - dd) % 0.095) + 0.095) % 0.095 < 0.07 ? 1 : 0; on = lerp(on1, on2, smooth(0.35, 0.6, wT)); }
          al *= lerp(1, on, dashAmt);
        }
        if (al < 0.03) continue;
        const pts = [];
        if ((a < L) !== (b < L)) pts.push([x + cell * (L - a) / (b - a), y]);
        if ((b < L) !== (cc < L)) pts.push([x + cell, y + cell * (L - b) / (cc - b)]);
        if ((d < L) !== (cc < L)) pts.push([x + cell * (L - d) / (cc - d), y + cell]);
        if ((a < L) !== (d < L)) pts.push([x, y + cell * (L - a) / (d - a)]);
        if (pts.length >= 2) put(pts[0], pts[1], wd, al * (wF < 1 ? 1 : 1));
        if (pts.length === 4) put(pts[2], pts[3], wd, al);
      }
    }
    const { fg } = I.THEMES[THEME];
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round';
    for (const [key, pth] of buckets) { const [wd, al] = key.split('|').map(Number); ctx.lineWidth = wd / 2; ctx.globalAlpha = al / 4; ctx.stroke(pth); }
    ctx.restore();
  }
  // the 404 page's streaks: short lines along the fall, going by; none over the meteor or its trail
  function streaks(ctx, t, cam, j, amt) {
    if (amt <= 0) return;
    const c = LC(t), off = -240 * ((t / 0.9) % 1), { fg } = I.THEMES[THEME];
    const hidden = (x, y) => x * x + y * y < 68 * 68 || (x < 0 && Math.abs(y) < 100 - 40 * Math.min(1, -x / 420));
    const span = (W / cam.k) * SV;
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = 0.45 * amt;
    for (const [x0, y, len, wd] of STREAKS) {
      ctx.lineWidth = wd / SV * cam.k;
      for (let rep = -4; rep <= 4; rep++) {
        const xs = x0 + off + 240 * rep; if (xs > span || xs + len < -span) continue;
        ctx.beginPath(); let pen = false;
        for (let s = 0; s <= 8; s++) { const x = xs + len * s / 8; if (hidden(x, y)) { pen = false; continue; } const q = add(c, add(mul(D, x / SV), mul(N, y / SV))), P = j(cam(q[0], q[1])); if (pen) ctx.lineTo(P[0], P[1]); else ctx.moveTo(P[0], P[1]); pen = true; }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- camera ------------------------------------------------------------------------------------------------------
  // the site's meteor bobs back and forth along its line
  const bob = (t) => { const u = (t / 2.6) % 2, e = u < 1 ? u : 2 - u; return (-5 + 11 * e * e * (3 - 2 * e)) / SV; };
  function camAt(t) {
    let c = lp([1.25, 0.32], [1.2, 0.3], smoother(seg(t, 2, 7.5))), k = lerp(268, 274, smoother(seg(t, 2, 7.5)));
    const f = smoother(seg(t, T.jump + 0.4, T.land + 0.7));
    if (f > 0) { c = lp(c, LC(t), f); k = lerp(k, 430, f); }
    k = lerp(k, 500, smoother(seg(t, 10.6, 12.0))); k = lerp(k, 300, smoother(seg(t, 17.0, 21))); k = lerp(k, 230, smoother(seg(t, 24.6, 28.5)));
    c = sub(c, mul(D, bob(t) * smooth(25, 27, t)));
    const sh = 0.01 * rockAmp(t) / 0.2 * Math.sin(t * 71);
    return I.camera(W, H, { cx: c[0] + sh, cy: c[1] - sh * 0.6, k });
  }

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const CLIFF = (() => { const r = I.rng(3), top = [], face = []; for (let x = -14; x <= 0; x += 0.12) top.push([x, 0.02 * Math.sin(x * 3.1) + 0.015 * (r() - 0.5) + (x > -0.6 ? 0 : 0.02 * Math.sin(x * 7))]); for (let y = 0; y <= 14; y += 0.18) face.push([-0.04 - 0.25 * Math.sin(y * 0.7) - 0.06 * (r() - 0.5) - y * 0.12, y]); return [...top, ...face, [-14, 14]]; })();
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.0 * (1 - smooth(25, 27, t)));
    I.background(ctx, THEME, W, H);
    lines(ctx, t, cam, j);
    streaks(ctx, t, cam, j, smooth(18.2, 21.5, t));
    if (t < T.land + 2.5) { ctx.fillStyle = fg; ctx.beginPath(); CLIFF.forEach((q, i) => { const s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); }
    // the loop; it shakes as the site's does once it is a meteor, harder while it rocks
    const c = LC(t), shk = (Math.floor(t / 0.11) % 2 ? 1 : -1) * (t > 20 ? 1 : 0) * (1 + 5 * rockAmp(t) / 0.2), sc = add(c, [0.45 / SV * shk, -0.35 / SV * shk]);
    MB.drawMark(ctx, cam, j, fg, bg, 'loop', sc, turn(t));
    // him; then the mark's brush strokes over him
    const mk = smoother(seg(t, ...TA.mark));
    if (mk < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, mk); MB.draw(ctx, hero(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (mk > 0) { ctx.globalAlpha = smooth(0, 0.6, mk); MB.drawMark(ctx, cam, j, fg, bg, 'figure', c, 0); ctx.globalAlpha = 1; }
    I.vignette(ctx, THEME, W, H, 0.18 * (1 - 0.6 * smooth(25, 28, t)));
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(32.6, 34, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 8.6, [73.42, 110, 146.83, 174.61]], [8.2, 17.4, [87.31, 130.81, 174.61, 220]], [17.0, 23.9, [73.42, 110, 138.59, 174.61]], [23.4, DUR + 0.5, [65.41, 130.81, 196, 261.63, 329.63, 392]]] }];
    TICKS.forEach((k, i) => ev.push({ t: k, type: 'tick', amp: 0.18 + 0.03 * i, last: i === TICKS.length - 1 }));
    [5.5, 5.95].forEach((s) => ev.push({ t: s, type: 'step', amp: 0.28 }));
    for (let i = 0; i < 4; i++) ev.push({ t: T.run[0] + 0.05 + i * 0.15, type: 'step', amp: 0.38 + 0.04 * i, tone: 1.1 });
    ev.push({ t: T.jump, type: 'whoosh', dur: 1.3, amp: 0.16 }, { t: T.gap - 0.04, type: 'zip' }, { t: T.land, type: 'land' });
    const wind = (s) => (s < T.jump ? 0 : s < T.land ? 0.3 : Math.min(1, 0.25 + vel(s) / 6) * (1 - 0.3 * smooth(23.0, 24.5, s)));
    ev.push({ t: T.jump, type: 'fallwind', dur: DUR - T.jump, track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => wind(i / 20) * (1 - smooth(32.4, 34, i / 20))) });
    ev.push({ t: 0, type: 'buffet', track: Array.from({ length: Math.ceil(DUR * 20) + 2 }, (_, i) => rockAmp(i / 20) / 0.2) });
    [18.5, 19.3, 20.1].forEach((s) => ev.push({ t: s, type: 'creak' }));
    ev.push({ t: 12.35, type: 'whoosh', dur: 0.7, amp: 0.1, from: 0.4, to: -0.4 }, { t: 13.1, type: 'whoosh', dur: 0.7, amp: 0.1, from: -0.4, to: 0.4 }, { t: 14.0, type: 'swish' }, { t: 14.6, type: 'step', amp: 0.35, tone: 0.8 });
    ev.push({ t: TA.elbows[0], type: 'rise', dur: TA.round[1] - TA.elbows[0] }, { t: TA.round[1] - 0.05, type: 'chime', f: 1046.5, amp: 0.1 }, { t: TA.round[1], type: 'swell', dur: 4 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'fall', title: 'Fall', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, LC, T, TA, camAt, tunnel, ringPhase, clock, TICKS, CLIFF, C0, EDGE, HIP, STEP, TR, tailY, tailL, lenOf, STREAKS, SV, bob, RO, D, N };
});
