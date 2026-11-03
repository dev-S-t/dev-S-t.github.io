// FILM 17, Stuck. A gag about the mark: its head is wider than its opening. He is sitting in his loop when a small bird
// lands on top of it and sings. He gets up, goes and stands under the opening at eleven, and looks up at it. He jumps,
// catches the two ends of the loop, and chins himself up to put his head out: it goes halfway and sticks, squeezed, legs
// kicking. The bird hops over and looks at him, head on one side. He plants his feet on the wall and shoves: his head
// comes free with a pop and he lands on his bottom, dazed. Then the bird hops in through the opening without any
// trouble at all, flutters down, and settles on top of his head. He looks up at it. He lets it stay.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'));
  else (root.Films = root.Films || {}).stuck = factory(root.Ink, root.MarkBody);
})(this, function (I, MB) {
  const W = 1920, H = 1080, FPS = 30, DUR = 22, THEME = 'ink', PI = Math.PI;
  const { smooth, smoother, lerp, clamp } = I;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  const key = (ks) => (t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; };
  const table = (f) => { const o = [0]; for (let i = 1; i <= DUR * 240 + 2; i++) o.push(o[i - 1] + f(i / 240) / 240); return (t) => { const x = clamp(t, 0, DUR) * 240, i = Math.min(o.length - 2, Math.floor(x)); return lerp(o[i], o[i + 1], x - i); }; };
  const { bg, fg } = I.THEMES[THEME];
  const RM = MB.MK.loop.r, RO = RM + MB.MK.loop.w / 2, RIN = RM - MB.MK.loop.w / 2, RF = 0.705;
  const floorY = (x) => Math.sqrt(Math.max(0, RF * RF - x * x));
  const DEG = PI / 180, GA = -120 * DEG, U = [Math.cos(GA), Math.sin(GA)], NN = [-U[1], U[0]];   // the opening, and across it
  const ENDS = [-158, -84].map((a) => [RIN * Math.cos(a * DEG), RIN * Math.sin(a * DEG)]);           // where he grips the loop, either side of the opening

  // ---- the story's clock ----------------------------------------------------------------------------------------------
  const T = { land: [1.0, 1.7], chirp: [2.2, 2.75, 3.3], hear: 2.35, up: [3.7, 4.6], walk: [4.8, 6.1], lookUp: [6.2, 6.8], crouch: [6.9, 7.3], jump: [7.3, 7.65],
    chin: [7.75, 8.45], stuck: [8.45, 11.0], brace: [11.0, 11.5], pop: 11.55, sit: 12.2, rub: [12.6, 14.2], hopIn: [14.4, 15.6], perch: 16.4, lookAt: [16.8, 17.6], sigh: [18.0, 18.8] };
  const UNDER = -0.33;                                                    // where he stands below the opening
  // ---- him -------------------------------------------------------------------------------------------------------------
  const walkX = key([[0, 0.05], [T.walk[0], 0.05], [T.walk[1], UNDER]]), walked = table((t) => Math.abs(walkX(t + 0.01) - walkX(t - 0.01)) / 0.02);
  // placing a pose so that its head lands on a point
  function headAt(p, at) { const p0 = { ...p, root: { ...p.root, x: 0, y: 0 } }, h = MB.body(p0).head.c; return { ...p, root: { ...p.root, x: at[0] - h[0], y: at[1] - h[1] } }; }
  const SIT = (x) => ({ root: { x, y: floorY(x) - 0.08, rot: 0, sx: 1 }, lean: -0.12, bend: 0.5, nod: 0.12, sh: MB.B.shN, feet: { L: wq([x + 0.27, floorY(x + 0.27) + 0.01]), R: wq([x + 0.33, floorY(x + 0.33) + 0.01]) }, knee: { L: 1, R: 1 }, hands: { F: lc([-0.12, 0.02]), B: lc([-0.16, 0.03]) }, elbow: { F: 1, B: 1 } });
  function pose(t) {
    // sitting, leaning back on his hands; he hears the bird and looks up
    if (t < T.up[0]) {
      const p = SIT(0.05); p.nod += 0.02 * Math.sin(t * 1.9);
      p.nod -= 0.3 * smooth(T.hear, T.hear + 0.3, t); p.lean += 0.08 * smooth(T.hear, T.hear + 0.3, t);
      return p;
    }
    // up onto his feet, turning to the opening
    if (t < T.walk[0]) {
      const u = smoother(seg(t, ...T.up)), x = 0.05, s = SIT(x);
      const stand = { root: { x, y: floorY(x) - 0.322, rot: 0, sx: -1 }, lean: 0.04, bend: 0.5, nod: -0.1, sh: MB.B.shN, feet: { L: wq([x + 0.07, floorY(x + 0.07)]), R: wq([x - 0.08, floorY(x - 0.08)]) }, knee: { L: 1, R: 1 }, hands: { F: lc([0.13, 0.05]), B: lc([-0.1, 0.06]) }, elbow: { F: -1, B: 1 } };
      if (u < 0.5) { const v = u * 2; return { ...s, root: { ...s.root, y: lerp(s.root.y, floorY(x) - 0.22, v) }, lean: lerp(s.lean, 0.45, v), nod: lerp(s.nod, 0.2, v), feet: { L: wq([x + 0.06, floorY(x + 0.06)]), R: wq([x + 0.12, floorY(x + 0.12)]) }, hands: { F: lc([0.18, 0.1]), B: lc([0.14, 0.12]) } }; }
      const v = (u - 0.5) * 2; return { ...stand, root: { ...stand.root, y: lerp(floorY(x) - 0.22, stand.root.y, v) }, lean: lerp(0.45, 0.04, v), nod: lerp(0.2, -0.1, v) };
    }
    // the walk to below the opening, then he looks up at it
    if (t < T.crouch[0]) {
      const x = walkX(t), mv = smooth(0.02, 0.15, Math.abs(walkX(t + 0.03) - walkX(t - 0.03)) / 0.06), S = 0.13, ph = walked(t) / (2 * S);
      const foot = (q) => { const f = q - Math.floor(q); if (f < 0.5) return [S / 2 - S * (f / 0.5), 0]; const u = (f - 0.5) / 0.5; return [-S / 2 + S * (0.5 - 0.5 * Math.cos(PI * u)), -0.05 * Math.sin(PI * u)]; };
      const fp = (q, rest) => { const w = foot(q), fx = x - w[0] * mv + rest * (1 - mv); return [fx, floorY(fx) + w[1] * mv]; };
      const look = smoother(seg(t, ...T.lookUp)), sw = Math.sin(2 * PI * ph) * mv;
      return { root: { x, y: floorY(x) - 0.322, rot: 0, sx: -1 }, lean: 0.06 - 0.22 * look, bend: 0.5, nod: -0.1 - 0.4 * look, sh: MB.B.shN, feet: { L: wq(fp(ph, 0.07)), R: wq(fp(ph + 0.5, -0.08)) }, knee: { L: 1, R: 1 },
        hands: { F: lc([0.13 + 0.1 * sw, 0.05]), B: lc([-0.1 - 0.1 * sw, 0.06]) }, elbow: { F: -1, B: 1 } };
    }
    // crouch, jump, catch the two ends of the loop
    const hang = (k, kick, head) => {
      const fl = Math.sin(t * 13), fl2 = Math.sin(t * 11 + 1.3);
      const p = { root: { x: 0, y: 0, rot: GA + PI / 2, sx: -1 }, lean: 0, bend: 0.4, nod: -0.05, sh: MB.B.shN, feet: { L: lc([0.05 + kick * 0.08 * fl, 0.33 - kick * 0.06 * Math.max(0, fl)]), R: lc([-0.05 - kick * 0.08 * fl2, 0.33 - kick * 0.06 * Math.max(0, fl2)]) }, knee: { L: 1, R: 1 },
        hands: { F: wq(ENDS[1]), B: wq(ENDS[0]) }, elbow: { F: 1, B: -1 }, armLen: { F: 0.36, B: 0.36 } };
      return headAt(p, head);
    };
    if (t < T.chin[0]) {
      const x = UNDER, base = { root: { x, y: floorY(x) - 0.322, rot: 0, sx: -1 }, lean: -0.16, bend: 0.5, nod: -0.5, sh: MB.B.shN, feet: { L: wq([x + 0.07, floorY(x + 0.07)]), R: wq([x - 0.08, floorY(x - 0.08)]) }, knee: { L: 1, R: 1 }, hands: { F: lc([0.13, 0.05]), B: lc([-0.1, 0.06]) }, elbow: { F: -1, B: 1 } };
      const cr = bump(t, T.crouch[0], T.jump[0] + 0.1), j = smoother(seg(t, ...T.jump));
      if (t < T.jump[0]) return { ...base, root: { ...base.root, y: base.root.y + 0.09 * cr }, lean: base.lean + 0.25 * cr, hands: { F: lc([-0.12, 0.0]), B: lc([-0.16, 0.02]) } };
      // flying up: arms up to the ends
      const hangHead = add(mul(U, RM - 0.42), [0, 0]), lifted = hang(0, 0, hangHead);
      const a = MB.body(base), b = MB.body(lifted);
      return { _lines: mixLines(a, b, j) };
    }
    // the chin-up: his head goes into the opening and sticks there, squeezed
    if (t < T.pop) {
      const chin = smoother(seg(t, ...T.chin)), st = smooth(T.stuck[0], T.stuck[0] + 0.2, t), br = smoother(seg(t, ...T.brace));
      const wig = Math.sin((t - T.stuck[0]) * 10) * st * (1 - br) * 0.06;
      const head = add(mul(U, lerp(RM - 0.42, RM - 0.05, chin) + 0.012 * Math.sin((t - T.stuck[0]) * 21) * st), mul(NN, wig * 0.5));
      const p = hang(st * (1 - br), 0, head);
      p.root.rot += wig;
      // the brace: feet up against the wall below the opening, knees bent
      if (br > 0.4) { const wall = (sgn) => { const ang = GA + sgn * 0.62; return [RF * Math.cos(ang), RF * Math.sin(ang)]; }; p.feet = { L: wq(wall(-1)), R: wq(wall(1)) }; p.knee = { L: 1, R: -1 }; }
      return p;
    }
    // the pop: shot back in, landing on his bottom on the floor; his head ring wobbling
    if (t < T.sit) {
      const u = seg(t, T.pop, T.sit), start = add(mul(U, RM - 0.12), [0, 0]), x = -0.05, landHead = [x - 0.03, floorY(x) - 0.08 - 0.58];
      const arc = lp(start, landHead, u), arcY = arc[1] - 0.45 * Math.sin(PI * u) * (1 - u);
      const s = SIT(x), p = headAt({ ...s, root: { ...s.root, rot: lerp(GA + PI / 2, -0.2, smoother(u)) + 0.6 * Math.sin(PI * u), sx: -1 }, lean: 0.2, nod: 0.3, feet: { L: lc([0.15, 0.25]), R: lc([0.25, 0.22]) }, hands: { F: lc([0.3, -0.35]), B: lc([0.24, -0.4]) } }, [arc[0], arcY]);
      return p;
    }
    // sitting, dazed; rubbing his head; then the bird on it: he looks up at it, and lets it stay
    const x = -0.05, s = SIT(x);
    s.root.sx = -1; s.feet = { L: wq([x - 0.27, floorY(x - 0.27) + 0.01]), R: wq([x - 0.33, floorY(x - 0.33) + 0.01]) }; s.hands = { F: lc([-0.12, 0.02]), B: lc([-0.16, 0.03]) };
    const land = bump(t, T.sit, T.sit + 0.25); s.root.y += 0.03 * land;
    s.nod += 0.08 * Math.sin((t - T.sit) * 9) * Math.exp(-(t - T.sit) * 1.5);
    const rub = bump(t, ...T.rub); if (rub > 0) { s.hands.F = lc(lp([-0.12, 0.02], [0.2 + 0.03 * Math.sin(t * 16), -0.6], Math.min(1, rub * 1.6))); s.elbow = { F: 1, B: 1 }; s.armLen = { F: 0.5, B: 0.36 }; s.nod += 0.1 * rub; }
    const look = bump(t, T.lookAt[0], T.lookAt[1] + 0.8); s.nod -= 0.3 * look; s.lean -= 0.12 * look;
    const sigh = bump(t, ...T.sigh); s.root.y += 0.015 * sigh; s.lean -= 0.06 * smooth(T.sigh[0], T.sigh[1], t);
    return s;
  }
  const mixLines = (a, b, u) => { const bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); return { ...b, spine: bl(a.spine, b.spine), legL: bl(a.legL, b.legL), legR: bl(a.legR, b.legR), armF: bl(a.armF, b.armF), armB: bl(a.armB, b.armB), head: { ...b.head, c: lp(a.head.c, b.head.c, u), a: lerp(a.head.a, b.head.a, u) } }; };
  function hero(t) {
    const p = pose(t);
    let ln = p._lines || MB.body(p);
    // squeezed in the opening: the head narrower across it, longer along it
    if (t >= T.chin[0] && t < T.pop) ln = { ...ln, head: { ...ln.head, st: [GA, 1 + 0.2 * smoother(seg(t, T.chin[0] + 0.3, T.chin[1]))] } };
    // the head ring springs after the pop
    if (t > T.pop && t < T.pop + 1.2) { const k = 1 + 0.12 * Math.sin((t - T.pop) * 30) * Math.exp(-(t - T.pop) * 4); ln = { ...ln, head: { ...ln.head, st: [0, k], c: ln.head.c } }; }
    return ln;
  }

  // ---- the bird ----------------------------------------------------------------------------------------------------------
  // where it is: flies in and lands on top of the loop; hops to the opening and peers at him; hops in; flutters down to his head
  const OUTTOP = (a) => [(RO + 0.07) * Math.cos(a * DEG), (RO + 0.07) * Math.sin(a * DEG)];
  function birdAt(t, heroHead) {
    if (t < T.land[0]) return null;
    if (t < T.land[1]) { const u = smoother(seg(t, ...T.land)); return { p: lp([1.6, -1.3], OUTTOP(-75), u), face: -1, wing: Math.sin(t * 40), tilt: 0, fly: 1 - u }; }
    const hop = (a, b, t0) => { const u = seg(t, t0, t0 + 0.28); return { p: add(lp(OUTTOP(a), OUTTOP(b), u), [0, -0.08 * Math.sin(PI * u)]), u }; };
    if (t < 8.9) return { p: OUTTOP(-75), face: -1, wing: 0, tilt: 0.15 * bump(t, 4.0, 4.8) - 0.15 * bump(t, 6.3, 7.0), beak: [...T.chirp].some((c) => t > c && t < c + 0.18) };
    if (t < 9.6) { const a = hop(-75, -90, 8.9), b = hop(-90, -100, 9.25); return { p: t < 9.25 ? a.p : b.p, face: -1, wing: 0, tilt: 0 }; }
    if (t < T.hopIn[0]) return { p: OUTTOP(-100), face: -1, wing: 0, tilt: 0.45 * bump(t, 9.8, 10.9) - 0.4 * bump(t, 12.6, 13.6), beak: t > 10.2 && t < 10.36 };
    // into the opening and down to his head
    const gapIn = mul(U, RM), above = heroHead ? add(heroHead, [0, -MB.B.headR - 0.05]) : [-0.08, -0.08];
    if (t < T.hopIn[1]) { const u = seg(t, ...T.hopIn); if (u < 0.35) { const v = u / 0.35; return { p: add(lp(OUTTOP(-100), add(gapIn, mul(U, 0.04)), v), [0, -0.1 * Math.sin(PI * v)]), face: -1, wing: 0, tilt: 0 }; } const v = (u - 0.35) / 0.65; return { p: add(lp(add(gapIn, mul(U, 0.04)), add(gapIn, mul(U, -0.12)), v), [0, 0]), face: 1, wing: 0, tilt: 0.3 * bump(v, 0.2, 0.9) }; }
    if (t < T.perch) { const u = smoother(seg(t, T.hopIn[1], T.perch)), from = add(gapIn, mul(U, -0.12)); return { p: add(lp(from, above, u), [0, -0.12 * Math.sin(PI * u)]), face: 1, wing: Math.sin(t * 38) * (1 - u * u), tilt: 0, fly: 1 - u }; }
    return { p: above, face: t > 17.9 ? -1 : 1, wing: 0, tilt: 0.25 * bump(t, 17.0, 17.7), beak: [17.15, 19.6].some((c) => t > c && t < c + 0.2), settle: smooth(18.2, 18.9, t) };
  }
  function drawBird(ctx, cam, b, j) {
    if (!b) return;
    const s = 0.15 * (b.settle ? 1 + 0.08 * b.settle : 1), c = cam(b.p[0], b.p[1]), k = cam.k * s;
    ctx.save(); ctx.translate(...j(c)); ctx.scale(b.face, 1); ctx.rotate(b.tilt || 0); ctx.fillStyle = fg; ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // body (a round drop), head, tail, beak, legs, wing
    ctx.beginPath(); ctx.ellipse(0, 0, 0.62 * k, 0.5 * k * (b.settle ? 1 - 0.12 * b.settle : 1), -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0.5 * k, -0.42 * k, 0.33 * k, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.5 * k, -0.1 * k); ctx.lineTo(-1.05 * k, -0.42 * k); ctx.lineTo(-0.95 * k, -0.05 * k); ctx.closePath(); ctx.fill();
    const open = b.beak ? 0.12 : 0;
    ctx.beginPath(); ctx.moveTo(0.78 * k, -0.48 * k); ctx.lineTo(1.12 * k, (-0.42 - open) * k); ctx.lineTo(0.8 * k, -0.36 * k); ctx.closePath(); ctx.fill();
    if (open) { ctx.beginPath(); ctx.moveTo(0.78 * k, -0.42 * k); ctx.lineTo(1.08 * k, (-0.3 + open) * k); ctx.lineTo(0.78 * k, -0.34 * k); ctx.fill(); }
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0.6 * k, -0.48 * k, 0.07 * k, 0, 7); ctx.fill();
    if (!b.fly || b.fly < 0.3) { ctx.lineWidth = 0.09 * k; ctx.beginPath(); ctx.moveTo(-0.05 * k, 0.45 * k); ctx.lineTo(-0.1 * k, 0.78 * k); ctx.moveTo(0.15 * k, 0.45 * k); ctx.lineTo(0.12 * k, 0.78 * k); ctx.stroke(); }
    const wg = b.wing || 0; ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(-0.08 * k, (-0.08 - 0.35 * Math.max(0, wg)) * k, 0.36 * k, (0.18 + 0.25 * Math.abs(wg)) * k, -0.3 - 0.9 * wg, 0, 7); ctx.fill();
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(-0.08 * k, (-0.08 - 0.35 * Math.max(0, wg)) * k, 0.3 * k, (0.12 + 0.22 * Math.abs(wg)) * k, -0.3 - 0.9 * wg, 0, 7); ctx.fill();
    ctx.restore();
  }
  // song: little lines rising from its beak
  function song(ctx, cam, b, t) {
    if (!b || !b.beak) return; const c = cam(b.p[0] + 0.15 * b.face, b.p[1] - 0.08);
    ctx.save(); ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { const a = -PI / 2 + (i - 1) * 0.5 + (b.face < 0 ? -0.4 : 0.4), r0 = 0.07 * cam.k, r1 = 0.14 * cam.k; ctx.beginPath(); ctx.moveTo(c[0] + r0 * Math.cos(a), c[1] + r0 * Math.sin(a)); ctx.lineTo(c[0] + r1 * Math.cos(a), c[1] + r1 * Math.sin(a)); ctx.stroke(); }
    ctx.restore();
  }

  function headOver(ctx, ln, cam, j) {
    const h = MB.headRing(ln.head.c, ln.head.a, ln.head.mirror);
    if (ln.head.st) { const [sa, sk] = ln.head.st, ca = Math.cos(sa), sn = Math.sin(sa), kq = 1 / Math.sqrt(sk), c0 = ln.head.c;
      const sq = (q) => { const X = q[0] - c0[0], Y = q[1] - c0[1], a = (X * ca + Y * sn) * sk, b = (-X * sn + Y * ca) * kq; return [c0[0] + a * ca - b * sn, c0[1] + a * sn + b * ca]; };
      h.outline = h.outline.map(sq); h.ends = h.ends.map((e) => ({ p: sq(e.p), r: e.r * kq })); }
    const path = () => { ctx.beginPath(); h.outline.forEach((q, i) => { const s2 = j(cam(q[0], q[1])); if (i) ctx.lineTo(s2[0], s2[1]); else ctx.moveTo(s2[0], s2[1]); }); ctx.closePath(); };
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = bg; ctx.lineWidth = 0.022 * cam.k; path(); ctx.stroke(); ctx.fillStyle = fg; path(); ctx.fill();
    for (const e of h.ends) { const s2 = j(cam(e.p[0], e.p[1])); ctx.beginPath(); ctx.arc(s2[0], s2[1], e.r * cam.k, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // ---- the picture ---------------------------------------------------------------------------------------------------------
  function camAt(t) {
    const k = key([[0, 400], [T.walk[1], 410], [T.chin[0], 520], [T.pop, 520], [T.sit + 0.3, 430], [T.perch, 470], [DUR, 500]])(t);
    const c = key([[0, [0, 0.05]], [T.walk[1], [-0.08, 0.0]], [T.chin[0], [-0.25, -0.3]], [T.pop, [-0.25, -0.3]], [T.sit + 0.3, [-0.02, 0.05]], [T.perch, [-0.04, 0.0]], [DUR, [-0.04, 0.02]]])(t);
    const sh = 0.02 * bump(t, T.pop, T.pop + 0.25) * Math.sin(t * 80) + 0.012 * bump(t, T.sit, T.sit + 0.25) * Math.sin(t * 70);
    return I.camera(W, H, { cx: c[0] + sh, cy: c[1], k });
  }
  const STARS = (() => { const r = I.rng(13), o = []; for (let i = 0; i < 120; i++) o.push([r() * W, r() * H, 0.5 + r() * 1.2, 0.12 + r() * 0.3, r() * 6]); return o; })();
  function draw(ctx, t) {
    const cam = camAt(t), j = I.boil(t, 1.0);
    I.background(ctx, THEME, W, H);
    ctx.fillStyle = fg; for (const [x, y, r, a, ph] of STARS) { ctx.globalAlpha = a * (0.7 + 0.3 * Math.sin(t * 0.7 + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    const ln = hero(t);
    // he goes behind the loop's ends where his head is in the opening, so they pinch it
    MB.draw(ctx, ln, cam, j, fg);
    MB.drawMark(ctx, cam, j, fg, bg, 'loop', [0, 0], 0);
    // while it is in the opening, his head over the loop's ends, with a dark edge so they press against it
    if (t >= T.chin[0] + 0.3 && t < T.pop + 0.05) headOver(ctx, ln, cam, j);
    // dizzy: a little ring of dots round his head
    const dz = smooth(T.sit, T.sit + 0.2, t) * (1 - smooth(T.rub[0] + 0.6, T.rub[1], t));
    if (dz > 0) { ctx.save(); ctx.fillStyle = fg; ctx.globalAlpha = dz; const hc = ln.head.c; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2 * PI / 3, p = cam(hc[0] + 0.3 * Math.cos(a), hc[1] - 0.32 + 0.07 * Math.sin(a)); ctx.beginPath(); ctx.arc(p[0], p[1], 0.016 * cam.k, 0, 7); ctx.fill(); } ctx.restore(); }
    const b = birdAt(t, t > T.hopIn[1] - 0.2 ? ln.head.c : null);
    drawBird(ctx, cam, b, j); song(ctx, cam, b, t);
    I.vignette(ctx, THEME, W, H, 0.45);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(DUR - 0.8, DUR, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.028, chords: [[0, 8.4, [130.81, 196, 261.63, 329.63]], [8.0, 12.4, [138.59, 207.65, 277.18]], [12.0, DUR + 0.5, [130.81, 196, 261.63, 329.63, 392]]] }];
    ev.push({ t: T.land[0], type: 'rustle' });
    const tweet = (s) => [0, 0.09].forEach((d, i) => ev.push({ t: s + d, type: 'chirp', f: 3200 + 400 * i }));
    [...T.chirp, 10.2, 17.15, 19.6].forEach(tweet);
    ev.push({ t: T.up[0] + 0.3, type: 'step', amp: 0.2 });
    for (let s = T.walk[0] + 0.25; s < T.walk[1]; s += 0.32) ev.push({ t: s, type: 'step', amp: 0.22 });
    ev.push({ t: T.jump[0], type: 'swish' }, { t: T.jump[1], type: 'tap' }, { t: T.chin[1] - 0.1, type: 'creak' }, { t: T.stuck[0] + 0.9, type: 'creak' });
    for (let s = T.stuck[0] + 0.2; s < T.brace[0]; s += 0.45) ev.push({ t: s, type: 'swish' });
    ev.push({ t: T.brace[0] + 0.2, type: 'breath', dur: 0.4 }, { t: T.pop, type: 'pluck', f: 880, amp: 0.25, decay: 0.98, bright: 0.9 }, { t: T.pop + 0.02, type: 'gulp' }, { t: T.sit, type: 'land' });
    ev.push({ t: T.sit + 0.2, type: 'twinkle', notes: [1318.5, 1174.7, 1046.5] }, { t: T.hopIn[0], type: 'tap' }, { t: T.hopIn[0] + 0.4, type: 'tap' }, { t: T.hopIn[1], type: 'rustle' }, { t: T.perch, type: 'tap' }, { t: T.sigh[0], type: 'exhale' }, { t: 20.2, type: 'chime', f: 1046.5, amp: 0.07 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'stuck', title: 'Stuck', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events };
});
