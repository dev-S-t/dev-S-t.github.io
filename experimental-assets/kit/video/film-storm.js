// FILM 7, Storm. A sunny afternoon; he lounges in his ring, whistling. A small cloud stops right over the opening
// at eleven, and since the ring keeps the rain out everywhere else, it all comes in there, onto his head. Water
// pools in the bottom: he lifts a foot out and steps it up the curve. He covers his head, but his arms are too short
// for it; he strains, they stretch up over the top, the elbows straighten, then they bend round into an umbrella.
// The rain stops the moment it is perfect. One last drop comes down through all three openings, into his head.
// That pose is the mark. See STORYBOARD.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'));
  else (root.Films = root.Films || {}).storm = factory(root.Ink, root.MarkBody);
})(this, function (I, MB) {
  const W = 1920, H = 1080, FPS = 30, DUR = 24;
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lrp(v, b[i], u)) : a + (b - a) * u);
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) { const ks = per[f]; if (t <= ks[0][0]) { out[f] = ks[0][1]; continue; } let v = ks[ks.length - 1][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { v = lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); break; } out[f] = v; } return out; };
  }
  // the ring stands on the ground; its centre is the world's origin
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2, RIN = MB.MK.loop.r - MB.MK.loop.w / 2, GROUND = RO;
  const floorY = (x) => Math.sqrt(Math.max(0, RIN * RIN - x * x)) + 0.035;     // feet stand a little into the stroke
  const M = MB.MARK_POSE(0, 0), MF = (k) => [M.feet[k].x, M.feet[k].y], MH = (k) => [M.hands[k].x, M.hands[k].y];
  const HIP = [M.root.x, M.root.y], SHM = MB.MK.armF[0];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // ---- his performance ---------------------------------------------------------------------------------------------
  const T = { drop1: 5.45, sit: [5.9, 6.6], palm: 6.75, stand: [7.6, 8.3], turn: 8.42, cover: [8.6, 9.2], shake: [10.1, 10.75], step: [10.8, 11.45], flash: 11.75,
    strain: [12.2, 13.7], reach: [13.7, 14.9], round: [14.9, 15.9], stop: [16.4, 17.2], last: 19.0, settle: [19.6, 20.2], mark: [21.0, 22.0] };
  const STAND = { root: [0.0, floorY(0) - 0.31], feet: { L: [-0.08, floorY(-0.08)], R: [0.08, floorY(0.08)] } };
  const pose = track([
    // lounging back in the curve, hands behind his head, one foot up on the other knee
    [0, { root: [-0.12, 0.62], lean: -0.95, bend: 0.5, nod: 0.45, sh: 0.3, fL: [-0.38, floorY(-0.38)], hF: [0.36, 0.36], hB: [0.34, 0.4], lenF: 0.36, lenB: 0.36, rF: 0, rB: 0, foreL: 0 }],
    [T.drop1 + 0.15, { nod: 0.45, lean: -0.95 }],
    // the drop: he looks up
    [T.drop1 + 0.45, { nod: 0.15, lean: -0.88 }],
    // sits up and holds out a hand: is it raining?
    [T.sit[1], { lean: -0.02, nod: -0.3, hF: [-0.05, 0.06], hB: [-0.02, 0.52], fL: [-0.3, floorY(-0.3)] }],
    [T.palm + 0.4, { nod: -0.25 }],
    // up onto his feet
    [T.stand[0], { lean: 0.0, hF: [-0.3, 0.42], hB: [-0.24, 0.45] }],
    [T.stand[0] + 0.35, { lean: 0.5, nod: 0.05, root: [-0.1, 0.6], fL: [-0.08, floorY(-0.08)], hF: [-0.34, 0.38], hB: [-0.28, 0.42] }],
    [T.stand[1], { lean: 0.02, nod: -0.12, root: STAND.root, hF: [-0.18, 0.42], hB: [0.15, 0.43] }],
    [T.turn + 0.1, { hF: [0.18, 0.42], hB: [-0.15, 0.43] }],
    // hands up to his head: as far as they go, which is the sides of it
    [T.cover[1], { hF: [0.27, -0.06], hB: [-0.25, -0.04], nod: 0.05, lean: 0.05 }],
    // stepping a foot up out of the water: the stance of the mark
    [T.step[1], { root: [HIP[0], HIP[1] + 0.012], lean: MB.MARK_LEAN + 0.04, bend: 0.85, fL: MF('L'), foreL: 0.85 }],
    // the strain: the hands creep up the sides of his head to the top, the arms stretching to get there, elbows out
    [T.strain[0], { sh: 0.3 }],
    [T.strain[1], { hF: [0.16, -0.38], hB: [-0.2, -0.36], lenF: 0.72, lenB: 0.66, sh: 0.45, nod: 0.08, bend: 1 }],
    // reaching more, over the top toward the opening the rain comes in by: two straight parts with an elbow
    [T.reach[1], { hF: MH('F'), hB: MH('B'), lenF: MB.B.armF, lenB: MB.B.armB, sh: MB.B.sh, nod: -MB.MARK_LEAN, lean: MB.MARK_LEAN, root: HIP, rF: 0, rB: 0 }],
    // the elbows' angle goes: the straight parts bend round into one curve, an umbrella
    [T.round[1], { rF: 1, rB: 1 }]
  ]);
  function body(t) {
    const p = pose(t);
    // the right foot: crossed over the other knee (bobbing), then down, a shake out of the water, a step up the curve
    let fR;
    const kneeL = (() => { const P = p.root, f = p.fL, d = Math.hypot(f[0] - P[0], f[1] - P[1]), th = MB.B.thigh, sh = MB.B.shin; const a = Math.acos(Math.min(1, (th * th + d * d - sh * sh) / (2 * th * d))), ang = Math.atan2(f[1] - P[1], f[0] - P[0]) + a; return [P[0] + Math.cos(ang) * th, P[1] + Math.sin(ang) * th]; })();
    const crossed = [kneeL[0] - 0.06, kneeL[1] - 0.05 + 0.025 * Math.sin(t * 7.5) * (1 - smooth(T.drop1, T.drop1 + 0.1, t))];
    if (t < T.sit[0]) fR = crossed;
    else if (t < T.stand[0] + 0.35) fR = lrp(crossed, [-0.34, floorY(-0.34)], smoother(seg(t, T.sit[0], T.sit[1])));
    else if (t < T.turn) fR = lrp([-0.34, floorY(-0.34)], [-0.08, floorY(-0.08)], smoother(seg(t, T.stand[0] + 0.35, T.stand[1])));
    else if (t < T.shake[0]) { const u = bump(t, T.turn - 0.1, T.turn + 0.1); fR = [lerp(-0.08, STAND.feet.R[0], smoother(seg(t, T.turn - 0.1, T.turn + 0.1))), STAND.feet.R[1] - 0.04 * u]; }
    else if (t < T.step[0]) { const u = bump(t, ...T.shake); fR = [STAND.feet.R[0] + 0.02 * Math.sin(t * 40) * u, STAND.feet.R[1] - 0.09 * u]; }
    else { const u = smoother(seg(t, ...T.step)), a = STAND.feet.R, b = MF('R'); fR = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 0.12 * Math.sin(PI * u)]; }
    const flinch = (k) => 0.05 * bump(t, k, k + 0.25);
    const nod = p.nod - flinch(T.drop1) - flinch(T.palm) - 0.04 * Math.max(0, Math.sin(t * 9)) * smooth(T.cover[1], T.cover[1] + 0.3, t) * (1 - smooth(T.strain[0], T.strain[0] + 0.4, t));
    const elbowF = t < T.stand[0] ? -1 : t < T.cover[0] ? -1 : 1, elbowB = t < T.stand[0] ? -1 : t < T.cover[0] ? 1 : -1;
    const kneeLside = t < T.step[0] + 0.25 ? 1 : -1, sx = t < T.turn ? -1 : 1, hop = bump(t, T.turn - 0.1, T.turn + 0.1);
    const strain = smooth(T.strain[0], T.strain[0] + 0.3, t), shW = [p.root[0], p.root[1] - MB.B.spine * (1 - p.sh)];
    const lenF = Math.max(p.lenF, dist(shW, p.hF) * (1 + 0.08 * strain)), lenB = Math.max(p.lenB, dist(shW, p.hB) * (1 + 0.08 * strain)), q = {
      root: { x: p.root[0], y: p.root[1] - 0.04 * hop, rot: 0, sx }, lean: p.lean, bend: p.bend, nod, sh: p.sh,
      feet: { L: { x: p.fL[0], y: p.fL[1], w: true }, R: { x: fR[0], y: fR[1], w: true } }, knee: { L: kneeLside, R: 1 }, fore: { L: p.foreL, R: 0 },
      hands: { F: { x: p.hF[0], y: p.hF[1], w: true }, B: { x: p.hB[0], y: p.hB[1], w: true } }, elbow: { F: elbowF, B: elbowB }, armLen: { F: lenF, B: lenB }, round: { F: p.rF, B: p.rB } };
    return MB.settle(MB.body(q), smoother(seg(t, ...T.settle)));
  }

  // ---- weather -----------------------------------------------------------------------------------------------------
  const D = [Math.sin(PI / 6), Math.cos(PI / 6)], NRM = [-D[1], D[0]];          // rain falls along the eleven o'clock ray
  const G0 = [MB.MK.loop.r * Math.cos(-2 * PI / 3), MB.MK.loop.r * Math.sin(-2 * PI / 3)];
  const cloudAt = (t) => { const home = [G0[0] - D[0] * 1.45, G0[1] - D[1] * 1.45]; const inn = smoother(seg(t, 2.6, 5.2)), out = smoother(seg(t, 17.4, 21.5)); return [lerp(-3.6, home[0], inn) + 3.2 * out, home[1] - 0.35 * out]; };
  const dark = (t) => 0.15 + 0.5 * smooth(6.8, 8.0, t) + 0.25 * smooth(11.2, 12.0, t) - 0.75 * smooth(16.6, 18.5, t);
  const rate = (t) => (t < 7.4 ? 0 : t < 8.6 ? lerp(0, 34, seg(t, 7.4, 8.6)) : t < 11.6 ? 34 : t < 16.4 ? 70 : lerp(70, 0, seg(t, 16.4, 17.2)));
  // every drop, set out in advance: when it leaves the cloud, and where across it
  const aimed = (tl, target, r, k) => { const L = 1.9, start = [target[0] - D[0] * L, target[1] - D[1] * L]; return { t0: tl - (L - r) / 3.6, start, aim: k, r }; };
  const DROPS = (() => { const r = I.rng(23), o = [aimed(T.drop1, [0.27, 0.21], 0.29, 'one'), aimed(T.palm, [-0.05, 0.06], 0.02, 'palm')]; let t = 7.4; while (t < 17.2) { const n = rate(t); if (n > 0) o.push({ t0: t, x: (r() * 2 - 1) * 0.75, k: r() }); t += 1 / Math.max(n, 1) * (0.6 + 0.8 * r()); } o.push(aimed(T.last, [0, -0.0097], 0.16, 'last')); return o; })();
  const SPEED = 3.6;
  // the shield over his head: nothing, then his head, then his arms over it
  const shieldR = (t) => (t < T.strain[0] ? 0.3 : lerp(0.3, 0.42, smooth(T.strain[0], T.strain[1], t)) + 0.08 * smooth(T.reach[0], T.round[1], t));
  function dropPath(d, t) {
    const c = cloudAt(d.t0), start = d.start || [c[0] + NRM[0] * d.x + D[0] * 0.15, c[1] + NRM[1] * d.x + D[1] * 0.15], s = (t - d.t0) * SPEED;
    // where it stops: on the ring's outside, or in through the opening onto his head (or umbrella), the water, the floor
    const hitCircle = (cx, cy, r, from = 0, far = false) => { const ox = start[0] - cx, oy = start[1] - cy, b = ox * D[0] + oy * D[1], c2 = ox * ox + oy * oy - r * r, disc = b * b - c2; if (disc < 0) return null; const s1 = -b - Math.sqrt(disc), s2 = -b + Math.sqrt(disc); if (far) return s2 > from ? s2 : null; return [s1, s2].filter((v) => v > from).sort((a, b2) => a - b2)[0] ?? null; };
    let stop = (GROUND - start[1]) / D[1], where = 'ground';
    const so = hitCircle(0, 0, RO);
    if (so != null && so < stop) {
      const p = [start[0] + D[0] * so, start[1] + D[1] * so], a = Math.atan2(p[1], p[0]) * 180 / PI;
      if (a > -136 && a < -104) {
        if (!d.head) d.head = d.aim ? [d.start[0] + D[0] * 1.9, d.start[1] + D[1] * 1.9] : body(d.t0 + 0.45).head.c;
        const sh = hitCircle(d.head[0], d.head[1], d.r ?? shieldR(d.t0 + 0.45), so), fl = hitCircle(0, 0, RIN, so, true);
        stop = fl ?? stop; where = 'floor';
        if (sh != null && sh < stop && (d.aim || Math.abs(d.x) < 0.2)) { stop = sh; where = d.aim === 'last' ? 'inside' : 'head'; }
      } else { stop = so; where = 'ring'; }
    }
    return { start, s, stop, where, p: (v) => [start[0] + D[0] * v, start[1] + D[1] * v] };
  }
  const waterY = (t) => RIN - 0.058 * smooth(8.6, 11.6, t) * (1 - smooth(17.6, 19.4, t));

  // ---- camera ------------------------------------------------------------------------------------------------------
  const camAt = (t) => { const a = smoother(seg(t, 17.2, 21.0)), b = smoother(seg(t, 8.6, 12.0)); return I.camera(W, H, { cx: lerp(lerp(-0.5, -0.3, b), 0, a), cy: lerp(lerp(-0.66, -0.5, b), 0.04, a), k: Math.exp(lerp(Math.log(lerp(360, 420, b)), Math.log(590), a)), sy: 0.5 }); };

  // ---- drawing -----------------------------------------------------------------------------------------------------
  function scene(ctx, t, theme) {
    const { bg, fg } = I.THEMES[theme], cam = camAt(t), j = I.boil(t, 1.2 * (1 - smooth(20.0, 22.0, t)));
    I.background(ctx, theme, W, H);
    const ink = (a) => (theme === 'paper' ? `rgba(13,13,12,${a})` : `rgba(243,241,236,${a})`);
    // the sky greys over as the cloud darkens; the sun comes back at the end
    const dk = Math.max(0, dark(t)); ctx.fillStyle = ink(0.07 * dk); ctx.fillRect(0, 0, W, H);
    const sun = smooth(17.5, 20.5, t) + (1 - smooth(1, 4, t)) * 0.6, sp = cam(1.6, -1.6), sg = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 2.4 * cam.k);
    sg.addColorStop(0, theme === 'paper' ? `rgba(255,255,250,${0.5 * sun})` : `rgba(243,241,236,${0.15 * sun})`); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    // the ground
    ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, 0.02 * cam.k); ctx.beginPath(); const g0 = j(cam(-6, GROUND)), g1 = j(cam(6, GROUND)); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.stroke();
    // the puddle in the bottom of the ring
    const wy = waterY(t);
    if (wy < RIN - 0.002) {
      const xw = Math.sqrt(Math.max(0, RIN * RIN - wy * wy)), pts = []; for (let k = 0; k <= 30; k++) { const a = Math.acos(xw / RIN) + (PI - 2 * Math.acos(xw / RIN)) * k / 30; pts.push([RIN * Math.cos(a), RIN * Math.sin(a)]); }
      ctx.fillStyle = ink(0.16); ctx.beginPath(); pts.forEach((q, k) => { const s = cam(q[0], q[1]); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = fg; ctx.lineWidth = Math.max(1.2, 0.008 * cam.k); ctx.beginPath(); for (let k = 0; k <= 24; k++) { const x = -xw + 2 * xw * k / 24, y = wy + 0.004 * Math.sin(x * 40 + t * 9), s = j(cam(x, y)); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); } ctx.stroke();
    }
    // his ring
    MB.drawMark(ctx, cam, j, fg, bg, 'loop');
    // him, and in the end the mark's brush strokes
    const mk = smoother(seg(t, ...T.mark));
    if (mk < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, mk); MB.draw(ctx, body(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (mk > 0) { ctx.globalAlpha = smooth(0, 0.6, mk); MB.drawMark(ctx, cam, j, fg, bg, 'figure'); ctx.globalAlpha = 1; }
    // the rain: streaks along the ray, splashes where they stop, rings in the puddle
    ctx.strokeStyle = fg; ctx.lineCap = 'round';
    for (const d of DROPS) {
      if (t < d.t0 || t > d.t0 + 2.2) continue;
      const pa = dropPath(d, t), big = !!d.aim;
      if (pa.s < pa.stop) { const a = pa.p(Math.max(0, pa.s - (big ? 0.07 : 0.11))), b = pa.p(pa.s), A = j(cam(a[0], a[1])), B2 = j(cam(b[0], b[1])); ctx.globalAlpha = big ? 1 : 0.55; ctx.lineWidth = (big ? 0.016 : 0.008) * cam.k; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke(); }
      else {
        const age = (pa.s - pa.stop) / SPEED; if (age > 0.3) continue;
        const at = pa.p(pa.stop), c = cam(at[0], at[1]), u = age / 0.3; ctx.globalAlpha = (1 - u) * (big ? 1 : 0.7); ctx.lineWidth = (big ? 0.01 : 0.006) * cam.k;
        if (pa.where === 'floor' && wy < RIN - 0.01) { ctx.beginPath(); ctx.ellipse(c[0], cam(0, wy)[1], (0.02 + 0.08 * u) * cam.k, (0.006 + 0.02 * u) * cam.k, 0, 0, 7); ctx.stroke(); }
        else { for (let k = -1; k <= 1; k++) { const ang = -PI / 2 + k * 0.7 - 0.5, r1 = (0.01 + 0.05 * u) * cam.k, r2 = r1 + 0.02 * cam.k; ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(ang) * r1, c[1] + Math.sin(ang) * r1); ctx.lineTo(c[0] + Math.cos(ang) * r2, c[1] + Math.sin(ang) * r2); ctx.stroke(); } }
      }
    }
    ctx.globalAlpha = 1;
    // the cloud: a lumpy brush outline, filled grey as it darkens
    const cc = cloudAt(t), lumps = [[-0.42, 0.06, 0.2], [-0.18, -0.08, 0.27], [0.12, -0.12, 0.3], [0.4, 0.0, 0.22], [0.0, 0.08, 0.24]];
    ctx.save(); ctx.beginPath(); for (const [x, y, r] of lumps) { const s = cam(cc[0] + x, cc[1] + y), rr = r * cam.k * (1 + 0.04 * Math.sin(t * 2 + x * 9)); ctx.moveTo(s[0] + rr, s[1]); ctx.arc(s[0], s[1], rr, 0, 7); }
    ctx.fillStyle = theme === 'paper' ? `rgb(${Math.round(243 - 120 * Math.max(0, dk))},${Math.round(241 - 120 * Math.max(0, dk))},${Math.round(236 - 118 * Math.max(0, dk))})` : bg; ctx.fill();
    ctx.lineWidth = 0.022 * cam.k; ctx.strokeStyle = fg; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); for (const [x, y, r] of lumps) { const s = cam(cc[0] + x, cc[1] + y), rr = r * cam.k * (1 + 0.04 * Math.sin(t * 2 + x * 9)) - 0.011 * cam.k; ctx.moveTo(s[0] + rr, s[1]); ctx.arc(s[0], s[1], rr, 0, 7); } ctx.fillStyle = theme === 'paper' ? `rgb(${Math.round(243 - 120 * Math.max(0, dk))},${Math.round(241 - 120 * Math.max(0, dk))},${Math.round(236 - 118 * Math.max(0, dk))})` : bg; ctx.fill(); ctx.restore();
    // birds at the start and the end
    const bd = (1 - smooth(4, 6, t)) + smooth(19.5, 21, t);
    if (bd > 0.02) { ctx.globalAlpha = Math.min(1, bd); ctx.lineWidth = 0.012 * cam.k; for (let k = 0; k < 3; k++) { const x = 0.9 + k * 0.28 + 0.15 * Math.sin(t * 0.5 + k), y = -1.15 - k * 0.12 + 0.05 * Math.sin(t * 1.3 + k * 2), s = cam(x, y), f = Math.sin(t * 9 + k * 2) * 0.03 * cam.k; ctx.beginPath(); ctx.moveTo(s[0] - 0.05 * cam.k, s[1] - f); ctx.quadraticCurveTo(s[0] - 0.02 * cam.k, s[1] - 0.02 * cam.k, s[0], s[1]); ctx.quadraticCurveTo(s[0] + 0.02 * cam.k, s[1] - 0.02 * cam.k, s[0] + 0.05 * cam.k, s[1] - f); ctx.stroke(); } ctx.globalAlpha = 1; }
    I.vignette(ctx, theme, W, H, theme === 'paper' ? 0.2 : 0.45);
  }
  // lightning: two frames of the picture inverted, with a crack of thunder
  const flashAt = (t) => (Math.abs(t - T.flash) < 0.05 || Math.abs(t - T.flash - 0.16) < 0.04);
  function draw(ctx, t) {
    scene(ctx, t, flashAt(t) ? 'ink' : 'paper');
    const fade = 1 - smooth(0, 0.6, t); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = '#F3F1EC'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0.3, type: 'tune', notes: [[0, 784], [0.25, 880], [0.5, 784], [0.75, 659], [1.25, 587], [1.5, 659], [2.0, 523], [2.6, 587], [2.85, 659], [3.1, 784], [3.35, 880], [3.85, 784], [4.35, 659], [4.6, 587]], until: T.drop1 },
      { t: 0.5, type: 'chirp', f: 3100 }, { t: 1.6, type: 'chirp', f: 2700 }, { t: 3.0, type: 'chirp', f: 3300 },
      { t: 6.9, type: 'thunder', amp: 0.4 }, { t: 7.4, type: 'rain', track: Array.from({ length: Math.ceil(DUR * 20) }, (_, i) => rate(i / 20) / 70) },
      { t: T.flash, type: 'crack' }, { t: T.flash + 0.25, type: 'thunder', amp: 1 }, { t: 15.0, type: 'thunder', amp: 0.35 }, { t: T.shake[0], type: 'flick' },
      { t: T.strain[0], type: 'rise', dur: T.round[1] - T.strain[0] }, { t: 19.4, type: 'chirp', f: 3000 }, { t: 20.2, type: 'chirp', f: 2800 }, { t: 21.2, type: 'chime', f: 1046.5, amp: 0.1 }];
    // every drop that lands somewhere he can hear it: plinks on his head, pats on the ring
    for (const d of DROPS) { const pa = dropPath(d, d.t0 + 5), tl = d.t0 + pa.stop / SPEED; if (d.aim) ev.push({ t: tl, type: 'plink', big: d.aim === 'last' }); else if (pa.where === 'head' && Math.random() < 0.5) ev.push({ t: tl, type: 'plink' }); }
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'storm', title: 'Storm', W, H, fps: FPS, dur: DUR, theme: 'paper', draw, events, body, dropPath, DROPS };
});
