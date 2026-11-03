// The mark's own figure, alive. Proportions come from the mark: a big open-ring head, a softly curved spine, short
// legs that bend and step, and long arms (a spider monkey's: each as long as its half of the mark's arm ring), with
// real elbows. Nothing ever changes length. The mark is simply one pose of this body: hands where the mark's hands
// are, elbows rounded off (each arm's two straight parts bend into one arc of the same length), feet where its feet
// are. Lines are drawn soft (curved spine, bowed legs), as the mark's are.
// A pose is built in his own frame (pelvis at 0,0, up is -y, facing +x) and placed in the world by root: x, y, rot,
// sx (facing), and an optional stretch along a direction (for squeezing through a gap). Feet and hands can be given
// in the world ({ x, y, w: true }) so they stay put while the body moves.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./mark.js'));
  else root.MarkBody = factory(root.Ink, root.Mark);
})(this, function (I, M) {
  const S = 62, toW = (p) => [(p[0] - 50) / S, (p[1] - 50) / S], PI = Math.PI;
  const L = M.lines, SHI = 95, HIPI = 51;
  const len = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  // the mark, in world units (the loop's centre at 0, 0; one unit is about his height)
  const MK = {
    spine: L.spine.map(toW), legL: L.legs.slice(0, HIPI + 1).reverse().map(toW), legR: L.legs.slice(HIPI).map(toW),
    armF: L.arms.slice(0, SHI + 1).reverse().map(toW), armB: L.arms.slice(SHI).map(toW),
    head: toW([M.rings.head[0], M.rings.head[1]]), loop: { r: M.rings.loop[2] / S, w: M.widths.loop / S }
  };
  const B = {
    headR: M.rings.head[2] / S, headT: M.widths.head / 2 / S,
    spine: Math.hypot(MK.spine[MK.spine.length - 1][0] - MK.spine[0][0], MK.spine[MK.spine.length - 1][1] - MK.spine[0][1]),
    armF: len(MK.armF), armB: len(MK.armB), thigh: 0.155, shin: 0.185,
    w: { body: M.widths.spine / S, arm: M.widths.arms / S, leg: M.widths.legs / S }
  };
  B.armN = 0.36; B.shN = 0.3;          // ordinary arms, and where they leave the spine
  // where the mark's arms leave the spine, as a share of the spine from the neck
  B.sh = (() => { const p = MK.armF[0], sp = MK.spine; let best = 0, bd = 1e9, acc = 0; for (let i = 1; i < sp.length; i++) { acc += Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); const d = Math.hypot(sp[i][0] - p[0], sp[i][1] - p[1]); if (d < bd) { bd = d; best = acc; } } return best / len(sp); })();
  // the mark's spine as a shape: its two control points in the chord's own terms (along, across), so any spine can
  // carry the same soft S, more or less of it
  const SPINE_SHAPE = (() => { const a = toW([50, 65.2]), c1 = toW([54.4, 70.2]), c2 = toW([47.4, 79.8]), b = toW([51.2, 85.6]); const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), u = [d[0] / l, d[1] / l], n = [-u[1], u[0]]; const tc = (p) => [((p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1]) / l, ((p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1]) / l]; return [tc(c1), tc(c2)]; })();
  const MARK_LEAN = Math.atan2(-(MK.spine[MK.spine.length - 1][0] - MK.spine[0][0]), MK.spine[MK.spine.length - 1][1] - MK.spine[0][1]);

  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const lerp = (a, b, u) => a + (b - a) * u, lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  function resample(pts, n) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = d[d.length - 1] || 1e-9, out = []; let j = 0;
    for (let i = 0; i < n; i++) { const s = tot * i / (n - 1); while (j < d.length - 2 && d[j + 1] < s) j++; const u = (s - d[j]) / ((d[j + 1] - d[j]) || 1e-9); out.push(lp(pts[j], pts[j + 1], u)); }
    return out;
  }
  const bez = (a, b, c, d, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [0, 1].map((k) => s * s * s * a[k] + 3 * s * s * t * b[k] + 3 * s * t * t * c[k] + t * t * t * d[k]); });

  // two bones from a to a target, the joint on one side (side +1 bends clockwise on screen); returns [joint, end]
  function twoBone(a, tgt, l1, l2, side) {
    let d = sub(tgt, a), dist = Math.hypot(...d); const m = (l1 + l2) * 0.9999;
    if (dist > m) { d = mul(d, m / dist); dist = m; } dist = Math.max(dist, 1e-6);
    const cosA = Math.min(1, Math.max(-1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))), ang = Math.atan2(d[1], d[0]) + side * Math.acos(cosA);
    const j = add(a, [Math.cos(ang) * l1, Math.sin(ang) * l1]); return [j, add(a, d)];
  }
  // the arc of length l from a to b, bulging to one side (side +1: the side a clockwise turn of a->b points to)
  function arcBetween(a, b, l, side, n = 40) {
    const c = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (c >= l * 0.9999) return resample([a, b], n);
    // central angle th with c / l = sin(th / 2) / (th / 2)
    let th = 2.0; for (let k = 0; k < 40; k++) { const h = th / 2, f = Math.sin(h) / h - c / l, df = (h * Math.cos(h) - Math.sin(h)) / (h * h) / 2; th = Math.min(2 * PI - 1e-4, Math.max(1e-4, th - f / df)); }
    const R = l / th, mid = lp(a, b, 0.5), u = [(b[0] - a[0]) / c, (b[1] - a[1]) / c], perp = [-u[1] * side, u[0] * side];
    // the centre lies away from the bulge
    const h = Math.sqrt(Math.max(0, R * R - c * c / 4)), cen = add(mid, mul(perp, th > PI ? h : -h));
    const a0 = Math.atan2(a[1] - cen[1], a[0] - cen[0]), dir = -side;   // which way round from a to b
    const out = []; for (let i = 0; i < n; i++) { const t = a0 + dir * th * i / (n - 1); out.push([cen[0] + R * Math.cos(t), cen[1] + R * Math.sin(t)]); }
    return out;
  }

  // ---- a pose -> world lines -------------------------------------------------------------------------------------------
  // p: root {x, y, rot, sx, stretch: [angle, k]}, lean, bend (0..1 of the mark's S), nod, sh,
  // feet {L, R} and hands {F, B} as {x, y, w} (w: world), knee {L, R} (+1 forward), fore {L, R} (0..1: the knee turned
  // toward us, the leg looking shorter), elbow {F, B} (+1 / -1), round {F, B} (0..1), curl (0..1: tucked into a ball)
  function body(p) {
    const r = p.root, sx = r.sx ?? 1, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0);
    const [sa, sk] = r.stretch || [0, 1], ca = Math.cos(sa), sn = Math.sin(sa), kq = 1 / Math.sqrt(sk);
    // local -> world: mirror, rotate, then stretch along sa about the pelvis
    const toWorld = (q) => { let x = q[0] * sx, y = q[1]; let X = c * x - s * y, Y = s * x + c * y; const a = X * ca + Y * sn, b = -X * sn + Y * ca; X = a * sk * ca - b * kq * sn; Y = a * sk * sn + b * kq * ca; return [r.x + X, r.y + Y]; };
    const toLocal = (q) => { let X = q[0] - r.x, Y = q[1] - r.y; const a = (X * ca + Y * sn) / sk, b = (-X * sn + Y * ca) / kq; X = a * ca - b * sn; Y = a * sn + b * ca; const x = c * X + s * Y, y = -s * X + c * Y; return [x * sx, y]; };
    const loc = (q) => (q.w ? toLocal([q.x, q.y]) : [q.x, q.y]);
    const P = [0, 0], lean = p.lean, chord = [Math.sin(lean) * B.spine, -Math.cos(lean) * B.spine], N = add(P, chord);
    // spine: from the neck down to the pelvis, with some of the mark's S
    const d = sub(P, N), n = [-d[1] / B.spine, d[0] / B.spine], u = mul(d, 1 / B.spine), cp = (t) => add(N, add(mul(u, t[0] * B.spine), mul(n, t[1] * B.spine * (p.bend ?? 1))));
    const spine = bez(N, cp(SPINE_SHAPE[0]), cp(SPINE_SHAPE[1]), P, 24);
    const ha = lean + (p.nod || 0), H = add(N, [Math.sin(ha) * B.headR, -Math.cos(ha) * B.headR]);
    const shAt = (f) => resample(spine, 61)[Math.round(f * 60)];
    const Sh = shAt(p.sh ?? B.shN);
    // legs: two bones, knee forward (or back), then drawn soft through the knee
    const leg = (k) => {
      const f = loc(p.feet[k]), side = (p.knee && p.knee[k]) ?? 1, [kn0, ft] = twoBone(P, f, B.thigh, B.shin, -side);
      const fo = (p.fore && p.fore[k]) || 0, t = Math.max(0, Math.min(1, ((kn0[0] - P[0]) * (ft[0] - P[0]) + (kn0[1] - P[1]) * (ft[1] - P[1])) / (Math.hypot(...sub(ft, P)) ** 2 || 1)));
      const kn = lp(kn0, lp(P, ft, t), fo), ctrl = sub(mul(kn, 2), mul(add(P, ft), 0.5));
      return Array.from({ length: 17 }, (_, i) => { const tt = i / 16, s1 = 1 - tt; return [s1 * s1 * P[0] + 2 * s1 * tt * ctrl[0] + tt * tt * ft[0], s1 * s1 * P[1] + 2 * s1 * tt * ctrl[1] + tt * tt * ft[1]]; });
    };
    // arms: two straight bones with an elbow; rounded off, the same length bends into one arc
    const arm = (k) => {
      const l = (p.armLen && p.armLen[k]) ?? B.armN, side = (p.elbow && p.elbow[k]) ?? (k === 'F' ? 1 : -1), h = loc(p.hands[k]);
      const [el, hd] = twoBone(Sh, h, l / 2, l / 2, side), poly = resample([Sh, el, hd], 40), rd = (p.round && p.round[k]) || 0;
      if (rd <= 0) return poly;
      const arc = arcBetween(Sh, hd, l, side, 40);
      return poly.map((q, i) => lp(q, arc[i], rd));
    };
    let out = { spine: spine.map(toWorld), legL: leg('L').map(toWorld), legR: leg('R').map(toWorld), armF: arm('F').map(toWorld), armB: arm('B').map(toWorld),
      head: { c: toWorld(H), a: (r.rot || 0) + ha * sx, mirror: sx < 0, sq: sk, st: r.squashHead && r.stretch ? r.stretch : null }, curl: p.curl || 0 };
    return out;
  }

  // ease every line onto the mark (u 0..1), placed with the loop's centre at (cx, cy)
  function settle(ln, u, cx = 0, cy = 0) {
    if (u <= 0) return ln;
    const mv = (pts) => pts.map((q) => [q[0] + cx, q[1] + cy]), bl = (a, b) => { const A = resample(a, 40), Bb = resample(mv(b), 40); return A.map((q, i) => lp(q, Bb[i], u)); };
    const da = Math.atan2(Math.sin(0 - ln.head.a), Math.cos(0 - ln.head.a));
    return { spine: bl(ln.spine, MK.spine), legL: bl(ln.legL, MK.legL), legR: bl(ln.legR, MK.legR), armF: bl(ln.armF, MK.armF), armB: bl(ln.armB, MK.armB),
      head: { c: lp(ln.head.c, [MK.head[0] + cx, MK.head[1] + cy], u), a: ln.head.a + da * u, mirror: ln.head.mirror && u < 0.5, sq: lerp(ln.head.sq, 1, u) }, curl: ln.curl };
  }

  function armsTo(ln, u, cx = 0, cy = 0) {
    if (u <= 0) return ln; const mv = (pts) => pts.map((q) => [q[0] + cx, q[1] + cy]), bl = (a, b) => { const A = resample(a, 40), Bb = resample(mv(b), 40); return A.map((q, i) => lp(q, Bb[i], u)); };
    return { ...ln, armF: bl(ln.armF, MK.armF), armB: bl(ln.armB, MK.armB) };
  }
  // the head: the mark's open ring, its two round ends separate shapes
  function headRing(c, a, mirror, sq = 1, n = 44) {
    const a0 = -105 * PI / 180, span = 330 * PI / 180, o = [], i = [];
    for (let k = 0; k <= n; k++) { const t = k / n, ang = a0 + span * t, w = B.headT * (1.2 - 0.5 * t); o.push([(B.headR + w) * Math.cos(ang), (B.headR + w) * Math.sin(ang)]); i.push([(B.headR - w) * Math.cos(ang), (B.headR - w) * Math.sin(ang)]); }
    const place = (q) => { let v = [mirror ? -q[0] : q[0], q[1]]; v = rot(v, a); return [c[0] + v[0], c[1] + v[1]]; };
    const ends = [[a0, 1.2], [a0 + span, 0.7]].map(([ang, k]) => ({ p: place([B.headR * Math.cos(ang), B.headR * Math.sin(ang)]), r: B.headT * k }));
    return { outline: o.concat(i.reverse()).map(place), ends };
  }
  function draw(ctx, ln, cam, j, color) {
    const m = (q) => j(cam(q[0], q[1])), k = cam.k;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const poly = (pts, wd) => { ctx.lineWidth = wd * k; ctx.beginPath(); pts.forEach((q, i) => { const s = m(q); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); };
    poly(ln.armB, B.w.arm); poly(ln.legL, B.w.leg); poly(ln.legR, B.w.leg); poly(ln.spine, B.w.body); poly(ln.armF, B.w.arm);
    const h = headRing(ln.head.c, ln.head.a, ln.head.mirror);
    // squashHead: the head ring stretched with the body (along the stretch, thinner across it), about its centre
    if (ln.head.st) { const [sa, sk] = ln.head.st, ca = Math.cos(sa), sn = Math.sin(sa), kq = 1 / Math.sqrt(sk), c0 = ln.head.c;
      const sq = (q) => { const X = q[0] - c0[0], Y = q[1] - c0[1], a = (X * ca + Y * sn) * sk, b = (-X * sn + Y * ca) * kq; return [c0[0] + a * ca - b * sn, c0[1] + a * sn + b * ca]; };
      h.outline = h.outline.map(sq); h.ends = h.ends.map((e) => ({ p: sq(e.p), r: e.r * kq })); }
    ctx.beginPath(); h.outline.forEach((q, i) => { const s = m(q); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
    h.ends.forEach((e) => { const s = m(e.p); ctx.beginPath(); ctx.arc(s[0], s[1], e.r * k, 0, 7); ctx.fill(); });
    ctx.restore();
  }

  // the mark's brush strokes (world units), and its dry-brush streaks; which: 'loop', 'figure' or 'all'
  const POLYS = M.paths.map((d) => d.replace(/Z/g, '').split('M').filter(Boolean).map((sub2) => sub2.split('L').map((xy) => toW(xy.trim().split(/\s+/).map(Number)))));
  const STREAKS = M.gaps.map((d) => d.slice(1).split('L').map((xy) => toW(xy.trim().split(/\s+/).map(Number))));
  function drawMark(ctx, cam, j, color, bg, which = 'all', at = [0, 0], turn = 0) {
    const cs = Math.cos(turn), sn = Math.sin(turn), m = (q) => j(cam(at[0] + cs * q[0] - sn * q[1], at[1] + sn * q[0] + cs * q[1])), idx = which === 'loop' ? [0] : which === 'figure' ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    ctx.save(); ctx.fillStyle = color;
    for (const i of idx) for (const poly of POLYS[i]) { ctx.beginPath(); poly.forEach((q, n) => { const s = m(q); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = bg; ctx.lineWidth = 0.34 / S * cam.k; ctx.lineCap = 'round';
    for (const st of STREAKS) { const outer = Math.hypot(st[0][0], st[0][1]) > 0.6; if (which !== 'all' && (which === 'loop') !== outer) continue; ctx.beginPath(); st.forEach((q, n) => { const s = m(q); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); }
    ctx.restore();
  }

  // the mark itself as a pose: hands, feet and pelvis where the mark has them (relative to the loop's centre)
  const MARK_POSE = (cx = 0, cy = 0) => {
    const hip = MK.legL[0], at = (q) => ({ x: q[0] + cx, y: q[1] + cy, w: true });
    return { root: { x: MK.spine[MK.spine.length - 1][0] + cx, y: MK.spine[MK.spine.length - 1][1] + cy, rot: 0, sx: 1 }, lean: MARK_LEAN, bend: 1, nod: -MARK_LEAN, sh: B.sh,
      feet: { L: at(MK.legL[MK.legL.length - 1]), R: at(MK.legR[MK.legR.length - 1]) }, knee: { L: -1, R: 1 }, fore: { L: 0.85, R: 0 },
      hands: { F: at(MK.armF[MK.armF.length - 1]), B: at(MK.armB[MK.armB.length - 1]) }, elbow: { F: 1, B: -1 }, round: { F: 1, B: 1 }, armLen: { F: B.armF, B: B.armB } };
  };

  return { S, toW, B, MK, MARK_LEAN, MARK_POSE, body, settle, armsTo, draw, drawMark, resample, arcBetween, twoBone, headRing };
});
