// FILM 6, Showtime. A circus at night. He bows, points at the ring across the ring-floor, climbs into a cannon and is
// fired across the tent. He squeezes in through the ring's opening at eleven, splats on the far wall and lands in a
// heap; the ring rocks on the floor. He gets up and surfs it, feet on its curve, arms going round to keep his
// balance, until it stops with its opening back at eleven. A breath, and the finish: TA-DA, arms up and round. That
// pose is the mark. See STORYBOARD.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'));
  else (root.Films = root.Films || {}).showtime = factory(root.Ink, root.MarkBody);
})(this, function (I, MB) {
  const W = 1920, H = 1080, FPS = 30, DUR = 24, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const w = (x, y) => ({ x, y, w: true }), lc = (x, y) => ({ x, y });

  // ---- the stage: the floor is y = 0; the ring stands on it at x = 0; the cannon is far left ------------------------
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2;                  // the loop's outer radius: it stands on that
  const RIN = MB.MK.loop.r - MB.MK.loop.w / 2;
  const T = { boom: 7.0, gap: 8.55, hit: 8.82, heap: 9.55, up: [10.5, 11.4], surfEnd: 15.3, gather: [15.95, 16.45], tada: [16.45, 17.15], settle: [17.15, 17.8], mark: [20.4, 21.4] };
  // the ring rocks after he hits it, rolling a little on the floor, and comes to rest with its opening at eleven
  const rock = (t) => { if (t < T.hit) return 0; const u = t - T.hit; return 0.3 * Math.exp(-0.42 * u) * Math.sin(2 * PI * u / 1.45) * (1 - smooth(14.8, 16.0, t)); };
  const ringAt = (t) => { const r = rock(t); return { c: [r * RO, -RO], rot: r }; };
  const inRing = (t, q) => { const g = ringAt(t), c = Math.cos(g.rot), s = Math.sin(g.rot); return [g.c[0] + c * q[0] - s * q[1], g.c[1] + s * q[0] + c * q[1]]; };
  // the cannon
  const WHEEL = [-4.42, -0.19], ANG = 63 * PI / 180, BARREL = 0.66, BREECH = [-4.56, -0.25];
  const MUZZLE = [BREECH[0] + Math.cos(ANG) * BARREL, BREECH[1] - Math.sin(ANG) * BARREL];
  // the flight: from the muzzle, through the middle of the opening, heading for the ring's centre (60 degrees down)
  const G = [RO * 0 + MB.MK.loop.r * Math.cos(-2 * PI / 3), -RO + MB.MK.loop.r * Math.sin(-2 * PI / 3)];
  const FL = (() => { const Tf = T.gap - T.boom, vx = (G[0] - MUZZLE[0]) / Tf, vyEnd = vx * Math.tan(PI / 3), g = (vyEnd * Tf - (G[1] - MUZZLE[1])) * 2 / (Tf * Tf) / 1, vy = vyEnd - g * Tf; return { vx, vy, g, Tf }; })();
  const flightAt = (t) => { const u = t - T.boom; return { p: [MUZZLE[0] + FL.vx * u, MUZZLE[1] + FL.vy * u + 0.5 * FL.g * u * u], v: [FL.vx, FL.vy + FL.g * u] }; };
  const VIN = flightAt(T.gap).v, HIT = [0 + RIN * Math.cos(PI / 3), -RO + RIN * Math.sin(PI / 3)];

  // ---- his performance -----------------------------------------------------------------------------------------------
  const STAND_X = -3.3, MP = MB.MARK_POSE(0, 0);
  const stand = (x, o = {}) => ({ root: { x, y: -0.33, rot: 0, sx: 1 }, lean: 0.02, bend: 0.3, nod: 0, feet: { L: w(x - 0.07, 0), R: w(x + 0.08, 0) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.05), B: lc(-0.1, 0.06) }, elbow: { F: -1, B: 1 }, ...o });
  // the surf stance: feet planted on the ring where the mark has them; the body stays upright against the rocking
  function surf(t, arms) {
    const g = ringAt(t), fL = inRing(t, MP.feet.L.x !== undefined ? [MP.feet.L.x, MP.feet.L.y] : [0, 0]), fR = inRing(t, [MP.feet.R.x, MP.feet.R.y]);
    const hip = inRing(t, [MP.root.x, MP.root.y]), pel = lp(hip, [MP.root.x + g.c[0], MP.root.y + g.c[1]], 0.5);
    const lean = MB.MARK_LEAN - 0.75 * g.rot + 0.05 * Math.sin(t * 3.1) * smooth(11, 12, t) * (1 - smooth(14.5, 15.8, t));
    return { root: { x: pel[0], y: pel[1] + 0.02 * Math.abs(g.rot), rot: 0, sx: 1 }, lean, bend: 0.7, nod: -MB.MARK_LEAN + 0.5 * g.rot, feet: { L: w(...fL), R: w(...fR) }, knee: { L: -1, R: 1 }, fore: { L: 0.85, R: 0 }, ...arms };
  }
  // windmilling arms: each hand goes round its shoulder, the two out of step
  const windmill = (t, amt) => {
    const a = t * 9.5, r = 0.33, wob = (k) => [Math.cos(a + k) * r, Math.sin(a + k) * r * 0.9];
    const out = { F: lc(0.3 + wob(0)[0] * amt, -0.15 + wob(0)[1] * amt), B: lc(-0.3 + wob(2.4)[0] * amt, -0.12 + wob(2.4)[1] * amt) };
    return { hands: out, elbow: { F: -1, B: 1 } };
  };
  function pose(t) {
    // bow, point, walk to the cannon
    if (t < 4.55) {
      const p = stand(STAND_X);
      const bow = smooth(1.3, 1.8, t) * (1 - smooth(2.4, 2.9, t));
      p.lean += 0.95 * bow; p.nod = 0.25 * bow; p.root.y += 0.04 * bow;
      p.hands = { F: lc(lerp(0.13, 0.12, bow), lerp(0.05, -0.12, bow)), B: lc(lerp(-0.1, -0.33, bow), lerp(0.06, -0.12, bow)) };
      const point = smooth(3.0, 3.3, t) * (1 - smooth(3.85, 4.1, t));
      if (point > 0) { p.hands.F = lc(lerp(p.hands.F.x, 0.31, point), lerp(p.hands.F.y, -0.36, point)); p.elbow.F = 1; p.nod = -0.12 * point; }
      // three steps to the cannon
      const wk = smooth(4.0, 4.55, t), x = lerp(STAND_X, -4.0, wk), sx = t > 4.0 ? -1 : 1, ph = seg(t, 4.0, 4.55) * 3;
      if (t > 4.0) { p.root.x = x; p.root.sx = sx; p.feet = { L: w(x + 0.07 - 0.06 * Math.sin(PI * ph), -0.04 * Math.max(0, Math.sin(PI * ph))), R: w(x - 0.08 + 0.06 * Math.sin(PI * ph), -0.04 * Math.max(0, -Math.sin(PI * ph))) }; }
      return { p };
    }
    // the jump into the muzzle, head first, squeezing
    if (t < 5.3) {
      // a hop up and over, turning head down, then in along the barrel (the pelvis follows the head down the bore)
      const u = seg(t, 4.55, 5.25), dirIn = [-Math.cos(ANG), Math.sin(ANG)], top = [MUZZLE[0] + 0.15, MUZZLE[1] - 0.95];
      const a = [-4.0, -0.33], pos = u < 0.55 ? lp(a, top, Math.sin(PI / 2 * u / 0.55)) : lp(top, [MUZZLE[0] + dirIn[0] * 0.5, MUZZLE[1] + dirIn[1] * 0.5], Math.pow((u - 0.55) / 0.45, 1.6));
      const rot = lerp(0, Math.atan2(dirIn[0], -dirIn[1]) - 2 * PI, smoother(seg(u, 0.15, 0.7)));
      const p = { root: { x: pos[0] - dirIn[0] * 0.5, y: pos[1] - dirIn[1] * 0.5, rot, sx: 1, stretch: [rot - PI / 2, 1 + 0.45 * smooth(0.6, 0.85, u)] }, lean: 0, bend: 0.3, nod: -0.1, feet: { L: lc(-0.04, 0.3), R: lc(0.05, 0.31) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.05, -0.62), B: lc(-0.04, -0.6) }, elbow: { F: 1, B: -1 } };
      return { p, hidden: smooth(0.8, 0.98, u) };
    }
    if (t < T.boom) return { p: null, waving: bump(t, 5.6, 6.35) };
    // the flight, superman, then the squeeze through the opening, then across and SPLAT
    if (t < T.hit) {
      const f = t < T.gap ? flightAt(t) : { p: [G[0] + VIN[0] * (t - T.gap) * 0.9, G[1] + VIN[1] * (t - T.gap) * 0.9], v: VIN };
      const rot = Math.atan2(f.v[0], -f.v[1]), sq = 1 + 0.75 * bump(t, T.gap - 0.12, T.gap + 0.12);
      const p = { root: { x: f.p[0], y: f.p[1], rot, sx: 1, stretch: [rot - PI / 2, sq] }, lean: 0, bend: 0.4, nod: -0.12, feet: { L: lc(-0.05, 0.31), R: lc(0.05, 0.32) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.06, -0.66), B: lc(-0.04, -0.64) }, elbow: { F: 1, B: -1 } };
      return { p };
    }
    // flattened on the wall, then sliding down it into a heap at the bottom
    if (t < T.up[0]) {
      // stuck to the wall head first, flattened; peels off and slides down; sits in a heap at the bottom
      const flat = 1 - smooth(T.hit + 0.08, T.hit + 0.32, t), slide = smoother(seg(t, T.hit + 0.2, T.heap));
      const wallRot = Math.atan2(Math.cos(PI / 3), -Math.sin(PI / 3)), wallAt = [RIN * Math.cos(PI / 3) - Math.cos(PI / 3) * 0.66, RIN * Math.sin(PI / 3) - Math.sin(PI / 3) * 0.66];
      const seat = [0.06, RIN - 0.03], at = inRing(t, lp(wallAt, seat, slide));
      const rot = lerp(wallRot, 0, slide) + (t > T.hit ? 0 : 0);
      const p = { root: { x: at[0], y: at[1], rot, sx: 1, stretch: [wallRot - PI / 2, lerp(1, 0.6, flat)] }, lean: lerp(0, -0.25, slide), bend: 0.8, nod: lerp(-0.1, 0.35, slide),
        feet: { L: lc(lerp(-0.08, 0.17, slide), lerp(0.3, -0.04, slide)), R: lc(lerp(0.08, 0.24, slide), lerp(0.31, -0.06, slide)) }, knee: { L: 1, R: 1 },
        hands: { F: lc(lerp(0.32, 0.22, slide), lerp(-0.42, 0.02, slide)), B: lc(lerp(-0.32, -0.2, slide), lerp(-0.4, 0.03, slide)) }, elbow: { F: 1, B: -1 } };
      // a dizzy wobble in the heap
      if (t > T.heap) { p.nod += 0.12 * Math.sin((t - T.heap) * 10); }
      return { p };
    }
    // up into the surf stance and balancing; a near fall; still
    if (t < T.gather[1] + 0.001) {
      const heap = pose(T.up[0] - 1e-4).p, s = surf(t, windmill(t, smooth(T.up[0] + 0.4, T.up[1] + 0.2, t) * (1 - smooth(14.6, 15.6, t)) + 0.9 * bump(t, 12.6, 13.4)));
      // the near fall at 12.6-13.4: he tips back, arms going round hard, and comes back
      const nf = bump(t, 12.6, 13.4); s.lean -= 0.32 * nf; s.nod -= 0.2 * nf;
      // calm: arms out low and still; then the gather (arms down and in, knees give)
      const calm = smooth(15.0, 15.6, t), gather = smooth(...T.gather, t);
      if (calm > 0) { s.hands = { F: lc(lerp(s.hands.F.x, 0.3, calm), lerp(s.hands.F.y, -0.05, calm)), B: lc(lerp(s.hands.B.x, -0.3, calm), lerp(s.hands.B.y, -0.02, calm)) }; }
      if (gather > 0) { s.hands = { F: lc(lerp(s.hands.F.x, 0.16, gather), lerp(s.hands.F.y, 0.14, gather)), B: lc(lerp(s.hands.B.x, -0.14, gather), lerp(s.hands.B.y, 0.15, gather)) }; s.root.y += 0.025 * gather; s.lean += 0.05 * gather; }
      const up = smoother(seg(t, ...T.up));
      if (up < 1) return { p: s, from: heap, mix: up };
      return { p: s };
    }
    return { p: surf(t, { hands: { F: lc(0.16, 0.14), B: lc(-0.14, 0.15) }, elbow: { F: -1, B: 1 } }), tada: true };
  }
  // the whole figure as lines: pose -> lines, blends, the TA-DA (arms rise in front of the head into the ring), the settle
  function hero(t) {
    const r = pose(t); if (!r.p) return { waving: r.waving };
    let ln = MB.body(r.p);
    if (r.from) { const a = MB.body(r.from); const bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], r.mix)); ln = { ...ln, spine: bl(a.spine, ln.spine), legL: bl(a.legL, ln.legL), legR: bl(a.legR, ln.legR), armF: bl(a.armF, ln.armF), armB: bl(a.armB, ln.armB), head: { ...ln.head, c: lp(a.head.c, ln.head.c, r.mix), a: lerp(a.head.a, ln.head.a, r.mix) } }; }
    if (r.tada || t > T.tada[0]) {
      const g = ringAt(t), u = smoother(seg(t, ...T.tada));
      ln = MB.armsTo(ln, u, g.c[0], g.c[1]);
      ln = MB.settle(ln, smoother(seg(t, ...T.settle)), g.c[0], g.c[1]);
    }
    return { ln, hidden: r.hidden || 0 };
  }

  // ---- camera ------------------------------------------------------------------------------------------------------
  function camAt(t) {
    const wide = { cx: -2.1, cy: -1.45, k: 255 }, open = { cx: -2.7, cy: -0.75, k: 330 }, ring = { cx: 0, cy: -RO, k: 560 };
    const a = smoother(seg(t, 3.0, 4.6)), b = smoother(seg(t, 8.5, 9.9)), c = smoother(seg(t, 16.2, 21.0));
    const mix = (p, q, u) => ({ cx: lerp(p.cx, q.cx, u), cy: lerp(p.cy, q.cy, u), k: Math.exp(lerp(Math.log(p.k), Math.log(q.k), u)) });
    let v = mix(mix(open, wide, a), ring, b); v = mix(v, { cx: ringAt(t).c[0] * 0.5, cy: -RO, k: 610 }, c);
    // a shake on the boom and the splat
    const sh = 0.03 * bump(t, T.boom, T.boom + 0.35) * Math.sin(t * 90) + 0.02 * bump(t, T.hit, T.hit + 0.3) * Math.sin(t * 80);
    return I.camera(W, H, { cx: v.cx + sh, cy: v.cy + sh * 0.6, k: v.k, sy: 0.52 });
  }

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const CONFETTI = (() => { const r = I.rng(17), o = []; for (let i = 0; i < 90; i++) o.push([r() * 3.2 - 1.6, r() * 1.2, r() * 6, 0.6 + r() * 0.8, r()]); return o; })();
  const SMOKE = (() => { const r = I.rng(4), o = []; for (let i = 0; i < 9; i++) o.push([r(), r(), 0.12 + r() * 0.16]); return o; })();
  function spot(ctx, cam, x, intensity, width = 0.9) {
    if (intensity <= 0) return;
    const top = cam(x - 0.6, -6), base = cam(x, 0), wpx = width * cam.k;
    const g = ctx.createLinearGradient(top[0], top[1], base[0], base[1]); g.addColorStop(0, `rgba(243,241,236,${0.02 * intensity})`); g.addColorStop(1, `rgba(243,241,236,${0.11 * intensity})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(top[0] - 0.05 * cam.k, top[1]); ctx.lineTo(top[0] + 0.05 * cam.k, top[1]); ctx.lineTo(base[0] + wpx, base[1]); ctx.lineTo(base[0] - wpx, base[1]); ctx.closePath(); ctx.fill();
    const e = ctx.createRadialGradient(base[0], base[1], 0, base[0], base[1], wpx * 1.1); e.addColorStop(0, `rgba(243,241,236,${0.16 * intensity})`); e.addColorStop(1, 'rgba(243,241,236,0)');
    ctx.save(); ctx.translate(base[0], base[1]); ctx.scale(1, 0.18); ctx.fillStyle = e; ctx.beginPath(); ctx.arc(0, 0, wpx * 1.1, 0, 7); ctx.fill(); ctx.restore();
  }
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.2 * (1 - smooth(19.5, 21.0, t)));
    I.background(ctx, THEME, W, H);
    // spotlights: one on him, one on the ring; at the finish the ring's spot flares
    const h = hero(t), hx = h.ln ? h.ln.spine[h.ln.spine.length - 1][0] : MUZZLE[0];
    const s1 = smooth(0.4, 1.2, t) * (1 - smooth(6.6, 7.2, t)), s2 = smooth(3.2, 3.7, t), flare = 1 + 1.4 * bump(t, 17.0, 18.6);
    spot(ctx, cam, t < 7 ? (t < 4 ? STAND_X : lerp(STAND_X, -4.1, smooth(4, 4.6, t))) : hx, s1, 0.8);
    spot(ctx, cam, ringAt(t).c[0], s2 * flare, 1.05);
    // the floor
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.45; ctx.lineWidth = Math.max(1.5, 0.012 * cam.k); ctx.beginPath(); const f0 = j(cam(-7, 0)), f1 = j(cam(4, 0)); ctx.moveTo(f0[0], f0[1]); ctx.lineTo(f1[0], f1[1]); ctx.stroke(); ctx.globalAlpha = 1;
    // the cannon: barrel, wheel; it kicks back on the boom
    const kick = 0.12 * bump(t, T.boom, T.boom + 0.45), tremble = t > 6.5 && t < T.boom ? 0.012 * Math.sin(t * 70) : 0;
    const bx = BREECH[0] - kick * Math.cos(ANG) + tremble, by = BREECH[1] + kick * Math.sin(ANG), dir = [Math.cos(ANG), -Math.sin(ANG)], nrm = [-dir[1], dir[0]];
    const pt = (a, b) => j(cam(bx + dir[0] * a + nrm[0] * b, by + dir[1] * a + nrm[1] * b));
    ctx.lineWidth = 0.05 * cam.k; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = fg;
    ctx.beginPath(); [pt(BARREL, 0.15), pt(0, 0.12), pt(-0.05, 0), pt(0, -0.12), pt(BARREL, -0.15)].forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.lineWidth = 0.035 * cam.k; ctx.beginPath(); const m1 = pt(BARREL, 0.17), m2 = pt(BARREL, -0.17); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.stroke();
    const wc = j(cam(WHEEL[0] - kick * 0.4, WHEEL[1])); ctx.lineWidth = 0.035 * cam.k; ctx.beginPath(); ctx.arc(wc[0], wc[1], 0.19 * cam.k, 0, 7); ctx.stroke();
    // the fuse: a spark running up the wick
    const fz = seg(t, 5.4, 6.95);
    if (fz > 0 && fz < 1) { const a = j(cam(bx - 0.28, by + 0.05)), b = pt(0.06, 0.13), q = [lerp(a[0], b[0], fz), lerp(a[1], b[1], fz)]; ctx.lineWidth = 0.012 * cam.k; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.globalAlpha = 1; const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 0.09 * cam.k); g.addColorStop(0, 'rgba(243,241,236,0.95)'); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(q[0] - 60, q[1] - 60, 120, 120); }
    // the hand that waves from the muzzle
    if (h.waving > 0) { const base = pt(BARREL - 0.06, 0), tip = pt(BARREL + 0.22 * h.waving, 0.08 * Math.sin(t * 16)); ctx.lineWidth = MB.B.w.arm * cam.k; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke(); }
    // smoke on the boom: brush rings blooming from the muzzle
    const sm = seg(t, T.boom, T.boom + 1.6);
    if (sm > 0 && sm < 1) for (const [a, b, r] of SMOKE) { const c = pt(BARREL + 0.1 + a * 0.5 * sm, (b - 0.5) * 0.4 * sm), rr = r * (0.4 + 1.6 * sm) * cam.k; ctx.globalAlpha = 0.5 * (1 - sm); ctx.lineWidth = 0.02 * cam.k; ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // the flash
    const fl = bump(t, T.boom - 0.02, T.boom + 0.14); if (fl > 0) { const c = pt(BARREL + 0.1, 0), g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 0.9 * cam.k); g.addColorStop(0, `rgba(243,241,236,${0.85 * fl})`); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // the ring, rocked
    const g = ringAt(t), markT = smoother(seg(t, ...T.mark));
    MB.drawMark(ctx, cam, j, fg, bg, 'loop', [g.c[0], g.c[1]], g.rot);
    // him (hidden while he is in the cannon)
    if (h.ln && h.hidden < 1) { ctx.globalAlpha = (1 - h.hidden) * (1 - smooth(0.3, 0.7, markT)); MB.draw(ctx, h.ln, cam, j, fg); ctx.globalAlpha = 1; }
    if (markT > 0) { ctx.globalAlpha = smooth(0, 0.6, markT); MB.drawMark(ctx, cam, j, fg, bg, 'figure', [g.c[0], g.c[1]], 0); ctx.globalAlpha = 1; }
    // confetti after the TA-DA
    const cf = t - 17.1;
    if (cf > 0) { ctx.fillStyle = fg; for (const [x, y0, ph, sz, k] of CONFETTI) { const y = -2.6 + y0 + cf * (0.35 + 0.25 * k), x1 = x + 0.08 * Math.sin(cf * 2.4 + ph); if (y > -0.02) continue; const p = cam(x1, y), a = cf * 5 + ph; ctx.globalAlpha = Math.min(1, cf * 2) * (1 - smooth(21, 23.5, t)); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.fillRect(-sz * 4, -sz * 1.6 * Math.abs(Math.cos(a * 1.3)), sz * 8, sz * 3.2 * Math.abs(Math.cos(a * 1.3)) + 0.5); ctx.restore(); } ctx.globalAlpha = 1; }
    I.vignette(ctx, THEME, W, H, 0.5);
    const fade = 1 - smooth(0, 0.7, t); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'crowd', dur: DUR }, { t: 0.5, type: 'fanfare', notes: [261.63, 329.63, 392, 523.25] }, { t: 2.5, type: 'applause', dur: 1.2, amp: 0.4 },
      { t: 3.35, type: 'ooh' }, { t: 5.25, type: 'gulp' }, { t: 5.35, type: 'drumroll', dur: 1.65 }, { t: 5.4, type: 'fuse', dur: 1.55 },
      { t: T.boom, type: 'boom' }, { t: T.boom + 0.05, type: 'whistle', dur: T.gap - T.boom }, { t: T.gap - 0.08, type: 'zip' }, { t: T.hit, type: 'splat' },
      { t: T.hit + 0.1, type: 'ooh' }, { t: 9.6, type: 'land', amp: 0.4 }, { t: 12.7, type: 'gasp' }, { t: 13.5, type: 'applause', dur: 0.8, amp: 0.25 },
      { t: 15.95, type: 'drumroll', dur: 1.15 }, { t: 17.12, type: 'cymbal' }, { t: 17.2, type: 'applause', dur: 5.5, amp: 1 }, { t: 17.2, type: 'fanfare', notes: [261.63, 329.63, 392, 523.25, 659.25] }];
    // the ring rocking on the floor: creaks at the turns; windmilling arms: whooshes
    for (let k = 0; k < 6; k++) ev.push({ t: T.hit + 0.36 + k * 0.725, type: 'creak', amp: Math.exp(-0.42 * k * 0.725) });
    for (let t = 11.2; t < 15.0; t += 0.33) ev.push({ t, type: 'swish' });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'showtime', title: 'Showtime', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, pose, ringAt };
});
