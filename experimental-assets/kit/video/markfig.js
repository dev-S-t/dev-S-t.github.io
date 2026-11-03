// The figure for the films that end in the mark. He lives inside the mark's own loop (radius 44/62 of his height), so
// the last frame can be the mark itself. His body is posed like the rig's (torso, head on the neck, legs by IK), but
// his arms are soft curves, each an arc from the shoulder: a direction, a bend and a length. A big enough stretch
// bends and lengthens them into the mark's arm ring; then settle() eases every line onto the mark's exact centre
// lines, and drawMark() lays the brush strokes over them.
// World units: the loop's centre is (0, 0), one unit is his height, y down. Mark units (0..100) map by (m - 50) / 62.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'), require('./mark.js'));
  else root.MarkFig = factory(root.Rig, root.Ink, root.Mark);
})(this, function (R, I, M) {
  const S = 62, toW = (p) => [(p[0] - 50) / S, (p[1] - 50) / S];
  const LOOP = I.ring(44 / S, 5.4 / S, { seed: 1, spiral: 0.025 });
  // the floor: the inside of the loop
  const floorY = (x) => { let y = Math.sqrt(Math.max(0, 0.666 * 0.666 - x * x)); for (let k = 0; k < 2; k++) { const r = LOOP.inner(Math.atan2(y, x)) ?? 0.666; y = Math.sqrt(Math.max(0, r * r - x * x)); } return y; };
  const FEET_IN = 0.04;                              // feet stand a little into the stroke, as they do in the mark
  const W = { body: 0.064, arm: 0.054, leg: 0.058, head: 0.25, headT: 0.034 };

  // the mark's own centre lines, as targets
  const L = M.lines, SH = 95, HIP = 51;
  const TARGET = {
    spine: L.spine.map(toW),
    legL: L.legs.slice(0, HIP + 1).reverse().map(toW), legR: L.legs.slice(HIP).map(toW),
    armF: L.arms.slice(0, SH + 1).reverse().map(toW), armB: L.arms.slice(SH).map(toW),
    head: { c: toW([M.rings.head[0], M.rings.head[1]]), a: 0, r: M.rings.head[2] / S, t: M.widths.head / 2 / S },
    widths: { body: M.widths.spine / S, arm: M.widths.arms / S, leg: M.widths.legs / S }
  };
  const len = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  const LENGTH = { armF: len(TARGET.armF), armB: len(TARGET.armB), spine: len(TARGET.spine) };
  const ARM_R = M.rings.arms[2] / S;                 // the arm ring's radius
  // where the arms leave the body in the mark, as a share of the spine from the neck
  const SH_AT = (() => { const p = TARGET.armF[0]; let best = 0, bd = 1e9, acc = 0; const sp = TARGET.spine; for (let i = 1; i < sp.length; i++) { acc += Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); const d = Math.hypot(sp[i][0] - p[0], sp[i][1] - p[1]); if (d < bd) { bd = d; best = acc; } } return best / LENGTH.spine; })();

  // a soft arm: an arc from s, heading a (radians, screen: 0 = his front, PI/2 = down), bending k (+ turns
  // clockwise on screen), length l
  function noodle(s, a, k, l, n = 28) { const out = [s.slice()]; let x = s[0], y = s[1], h = a; const ds = l / n; for (let i = 0; i < n; i++) { const hm = h + k * ds / 2; x += Math.cos(hm) * ds; y += Math.sin(hm) * ds; h += k * ds; out.push([x, y]); } return out; }

  // a pose -> world lines. p: ax (where he is, world x), sx (1 faces right), px, py (pelvis from the floor under ax),
  // lean, nod, torso (length), sh (shoulder, share of torso from the neck), fL, fR (feet: world x, and lift),
  // armF, armB ([a, k, l] in his own frame; F is the arm on his front side)
  function lines(p) {
    const sx = p.sx ?? 1, fy = floorY(p.ax), w = (q) => [p.ax + sx * q[0], fy + q[1]];
    const P = [p.px, p.py], up = [Math.sin(p.lean), -Math.cos(p.lean)];
    const N = [P[0] + up[0] * p.torso, P[1] + up[1] * p.torso], ha = p.lean + p.nod;
    const Hc = [N[0] + Math.sin(ha) * W.head, N[1] - Math.cos(ha) * W.head], Sh = [N[0] + (P[0] - N[0]) * p.sh, N[1] + (P[1] - N[1]) * p.sh];
    const foot = (f) => [(f[0] - p.ax) * sx, floorY(f[0]) - fy + FEET_IN - (f[1] || 0)];
    const leg = (f) => { const ft = foot(f); const [k] = R.ik(P[0], P[1], ft[0], ft[1], p.thigh || R.B.thigh, p.shin || R.B.shin); return [P, k, ft]; };
    return {
      spine: [N, P].map(w), legL: leg(p.fL).map(w), legR: leg(p.fR).map(w),
      armF: noodle(Sh, ...p.armF).map(w), armB: noodle(Sh, ...p.armB).map(w),
      head: { c: w(Hc), a: ha, r: W.head, t: W.headT, mirror: sx < 0 },
      widths: { body: W.body, arm: W.arm, leg: W.leg }
    };
  }

  // even spacing along a line, so two lines can be blended point for point
  function resample(pts, n) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = d[d.length - 1] || 1e-9, out = []; let j = 0;
    for (let i = 0; i < n; i++) { const s = tot * i / (n - 1); while (j < d.length - 2 && d[j + 1] < s) j++; const u = (s - d[j]) / ((d[j + 1] - d[j]) || 1e-9); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]); }
    return out;
  }
  const blend = (a, b, u, n = 40) => { const A = resample(a, n), B = resample(b, n); return A.map((p, i) => [p[0] + (B[i][0] - p[0]) * u, p[1] + (B[i][1] - p[1]) * u]); };
  // ease the lines onto the mark
  function settle(ln, u) {
    if (u <= 0) return ln; const lp = (a, b) => a + (b - a) * u, T = TARGET;
    const out = {}; for (const k of ['spine', 'legL', 'legR', 'armF', 'armB']) out[k] = blend(ln[k], T[k], u);
    const da = Math.atan2(Math.sin(T.head.a - ln.head.a), Math.cos(T.head.a - ln.head.a));
    out.head = { c: [lp(ln.head.c[0], T.head.c[0]), lp(ln.head.c[1], T.head.c[1])], a: ln.head.a + da * u, r: lp(ln.head.r, T.head.r), t: lp(ln.head.t, T.head.t), mirror: ln.head.mirror && u < 0.5 };
    out.widths = { body: lp(ln.widths.body, T.widths.body), arm: lp(ln.widths.arm, T.widths.arm), leg: lp(ln.widths.leg, T.widths.leg) };
    return out;
  }

  // draw the lines: strokes with round ends, the head as the open ring with its two round ends
  function draw(ctx, ln, cam, j, color) {
    const m = (q) => j(cam(q[0], q[1])), k = cam.k;
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const poly = (pts, wd) => { ctx.lineWidth = wd * k; ctx.beginPath(); pts.forEach((q, i) => { const s = m(q); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); };
    poly(ln.legL, ln.widths.leg); poly(ln.legR, ln.widths.leg); poly(ln.spine, ln.widths.body);
    poly(ln.armB, ln.widths.arm); poly(ln.armF, ln.widths.arm);
    const h = ln.head, ring = R.headRing(0, 0, h.r, h.t, h.mirror ? -h.a : h.a, 40), f = (q) => [h.c[0] + (h.mirror ? -q[0] : q[0]), h.c[1] + q[1]];
    ctx.beginPath(); ring.outline.forEach((q, i) => { const s = m(f(q)); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
    ring.ends.forEach(([x, y, r]) => { const s = m(f([x, y])); ctx.beginPath(); ctx.arc(s[0], s[1], r * k, 0, 7); ctx.fill(); });
    ctx.restore();
  }

  // the mark's brush strokes as polygons (world units), and its dry-brush streaks
  const POLYS = M.paths.map((d) => d.replace(/Z/g, '').split('M').filter(Boolean).map((sub) => sub.split('L').map((xy) => toW(xy.trim().split(/\s+/).map(Number)))));
  const STREAKS = M.gaps.map((d) => d.slice(1).split('L').map((xy) => toW(xy.trim().split(/\s+/).map(Number))));
  // which: 'loop' (the outer ring only), 'figure' (the rest), or 'all'
  function drawMark(ctx, cam, j, color, bg, which = 'all') {
    const m = (q) => j(cam(q[0], q[1])), idx = which === 'loop' ? [0] : which === 'figure' ? [1, 2, 3, 4] : [0, 1, 2, 3, 4];
    ctx.save(); ctx.fillStyle = color;
    for (const i of idx) for (const poly of POLYS[i]) { ctx.beginPath(); poly.forEach((q, n) => { const s = m(q); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = bg; ctx.lineWidth = 0.34 / S * cam.k; ctx.lineCap = 'round';
    for (const s of STREAKS) { const a = toW([0, 0]); const near0 = Math.hypot(s[0][0], s[0][1]) > 0.6; if ((which === 'loop') !== near0 && which !== 'all') continue; ctx.beginPath(); s.forEach((q, n) => { const p = m(q); if (n) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); }
    ctx.restore();
  }

  return { S, toW, LOOP, floorY, FEET_IN, W, TARGET, LENGTH, ARM_R, SH_AT, noodle, lines, settle, resample, draw, drawMark };
});
