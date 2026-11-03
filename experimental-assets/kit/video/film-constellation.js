// FILM 12, Constellation. Loops again, with the loops in their right places. Night: one human keeps the AI loop,
// watching its field. Something changes; he gets up and casts a line out through the opening. The line runs to the
// next loop, a keeper drops in, its field comes alive, and the line runs on, and branches. Pulling back, the loops
// turn out to sit on the lines of the mark itself: the head ring (the AI loop is at its top, attention), down the spine
// to the heart, out along both arms, down the legs to the feet and round the outer loop both ways. Every loop is kept
// by one human; the lines between them draw one human in a loop. Three openings at eleven stay open: no line crosses
// them. At the end every keeper raises his arms into the mark, in a wave from the first.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).constellation = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 34, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI, RAD = PI / 180;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const w = (x, y) => ({ x, y, w: true }), lc = (x, y) => ({ x, y });
  const MK = MB.MK, RM = MK.loop.r, RIN = RM - MK.loop.w / 2, GAPA = -2 * PI / 3, OUT = [Math.cos(GAPA), Math.sin(GAPA)];
  const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
  const arc = (c, r, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * RAD; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
  const nearest = (pts, q) => { let bi = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const at = (pts, s) => { let acc = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + l >= s) return lp(pts[i - 1], pts[i], (s - acc) / (l || 1)); acc += l; } return pts[pts.length - 1]; };
  const cut = (pts, s0, s1) => { const out = [at(pts, s0)]; let acc = 0; for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc > s0 && acc < s1) out.push(pts[i]); } out.push(at(pts, s1)); return out; };

  // ---- the loops on the lines of the mark (the mark's own units: its loop's centre at 0, 0) -----------------------------
  const HC = MK.head, HR = MB.B.headR, SH = MK.armF[0], HIP = MK.legL[0];
  const FL_ = MK.legL[MK.legL.length - 1], FR_ = MK.legR[MK.legR.length - 1];
  const deg = (q) => Math.atan2(q[1], q[0]) / RAD;
  const iS = nearest(MK.spine, SH), iH = nearest(MK.spine, HIP);
  // nodes: [name, position, field]; the hip is only a junction
  const NODES = {}, node = (name, p, f) => { NODES[name] = { name, c: p, f }; };
  const ring = (a) => [HC[0] + HR * Math.cos(a * RAD), HC[1] + HR * Math.sin(a * RAD)], outer = (a) => [RM * Math.cos(a * RAD), RM * Math.sin(a * RAD)];
  const HEAD = [-95, -30, 30, 90, 150, 212];
  HEAD.forEach((a, i) => node('h' + i, ring(a), i === 0 ? 'ai' : ['grid', 'ripple', 'hatch', 'wave', 'cells'][i - 1]));
  node('s1', SH, 'spiral'); node('hip', HIP, null);
  node('fL', FL_, 'contour'); node('fR', FR_, 'grid');
  const AF = [0.32, 0.64, 0.96, 1.28, plen(MK.armF)], AB = [0.34, 0.71, plen(MK.armB)];
  AF.forEach((s, i) => node('aF' + i, at(MK.armF, s), ['ripple', 'wave', 'hatch', 'cells', 'contour'][i]));
  AB.forEach((s, i) => node('aB' + i, at(MK.armB, s), ['grid', 'spiral', 'ripple'][i]));
  const OR = [35, 5, -25, -55, -86], OL = [126, 156, 186, 217];
  OR.forEach((a, i) => node('oR' + i, outer(a), ['wave', 'hatch', 'spiral', 'ripple', 'grid'][i]));
  OL.forEach((a, i) => node('oL' + i, outer(a), ['cells', 'contour', 'wave', 'hatch'][i]));
  // edges, each with the path it runs along, from the first node to the second
  const EDGES = [];
  const edge = (a, b, path) => EDGES.push({ a, b, path, L: plen(path) });
  for (let i = 0; i < HEAD.length - 1; i++) edge('h' + i, 'h' + (i + 1), arc(HC, HR, HEAD[i], HEAD[i + 1]));
  edge('h3', 's1', MK.spine.slice(0, iS + 1));
  edge('s1', 'hip', MK.spine.slice(iS, iH + 1).concat([HIP]));
  edge('hip', 'fL', MK.legL); edge('hip', 'fR', MK.legR);
  const armPath = (pts, ss, i) => cut(pts, i ? ss[i - 1] : 0, ss[i]);
  AF.forEach((s, i) => edge(i ? 'aF' + (i - 1) : 's1', 'aF' + i, armPath(MK.armF, AF, i)));
  AB.forEach((s, i) => edge(i ? 'aB' + (i - 1) : 's1', 'aB' + i, armPath(MK.armB, AB, i)));
  edge('fR', 'fL', arc([0, 0], RM, deg(FR_), deg(FL_)));
  OR.forEach((a, i) => edge(i ? 'oR' + (i - 1) : 'fR', 'oR' + i, arc([0, 0], RM, i ? OR[i - 1] : deg(FR_), a)));
  OL.forEach((a, i) => edge(i ? 'oL' + (i - 1) : 'fL', 'oL' + i, arc([0, 0], RM, i ? OL[i - 1] : deg(FL_), a)));
  // how far along the lines each node is from the AI loop (the line runs on like a fuse)
  const DIST = { h0: 0 };
  for (let changed = true; changed;) { changed = false; for (const e of EDGES) if (DIST[e.a] !== undefined) { const d = DIST[e.a] + e.L; if (DIST[e.b] === undefined || d < DIST[e.b]) { DIST[e.b] = d; changed = true; } } }

  // the small loops: each one a whole mark, this big
  const S = 0.0775, RN = (RM + MK.loop.w / 2) * S, GAPR = RN + 0.012;
  const T = { burst: [3.8, 7.2], up: [4.6, 5.6], cast: [6.9, 7.9], go: 7.75, reveal: [20.5, 23], raise: 24.4, glow: [25.5, 28], wave: 0.13 };
  // the fuse: slow while we are close, quicker as we pull back
  const speed = (t) => (t < T.go ? 0 : 0.11 + 0.27 * smooth(8.5, 15, t));
  const RUN = (() => { const o = [0]; for (let i = 1; i <= DUR * 120; i++) o.push(o[i - 1] + speed(i / 120) / 120); return o; })();
  const ran = (t) => { const x = clamp(t, 0, DUR) * 120, i = Math.min(RUN.length - 2, Math.floor(x)); return lerp(RUN[i], RUN[i + 1], x - i); };
  const reach = {}; for (const n in DIST) { let lo = 0, hi = DUR; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ran(m) < DIST[n]) lo = m; else hi = m; } reach[n] = n === 'h0' ? -1 : hi; }

  // ---- the fields, in a small loop's own units ---------------------------------------------------------------------------
  const FIELDS = {
    ai: (t, burst) => (x, y) => { const dx = x - 0.05, dy = y + 0.02, r = Math.hypot(dx, dy); return r * (1 + 0.06 * FL.fbm(x * 2 + t * 0.2, y * 2, 3) + 0.5 * burst * FL.fbm(x * 3 - t, y * 3, 9)) - 0.25 * t; },
    grid: (t) => [(x, y) => x - 0.06 * t, (x, y) => y + 0.03 * t],
    ripple: (t) => (x, y) => Math.hypot(x + 0.18, y - 0.12) - 0.2 * t,
    hatch: (t) => [(x, y) => (x + y) * 0.7071 + 0.03 * Math.sin(y * 9 + t), (x, y) => (x - y) * 0.7071 + 0.05 * t],
    wave: (t) => (x, y) => y - 0.07 * Math.sin(x * 7 - t * 2.4),
    cells: (t) => (x, y) => 0.09 * (Math.sin(x * 9 + t * 0.6) + Math.sin(y * 9 - t * 0.4)),
    spiral: (t) => (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); return r + 0.06 * a - 0.08 * t; },
    contour: (t) => (x, y) => 0.25 * FL.fbm(x * 1.6 + 3, y * 1.6 + t * 0.05, 11)
  };

  // ---- the keepers -------------------------------------------------------------------------------------------------
  const SEAT = { root: { x: -0.1, y: RIN - 0.05, rot: 0, sx: 1 }, lean: 0.06, bend: 0.5, nod: -0.2, sh: 0.3, feet: { L: w(0.12, RIN - 0.02), R: w(0.17, RIN - 0.03) }, knee: { L: 1, R: 1 }, hands: { F: w(0.1, RIN - 0.17), B: w(0.07, RIN - 0.16) }, elbow: { F: -1, B: -1 } };
  const STAND = (o = {}) => ({ root: { x: 0.0, y: RIN - 0.3, rot: 0, sx: 1 }, lean: 0.02, bend: 0.6, nod: -0.1, sh: 0.3, feet: { L: w(-0.08, RIN + 0.03), R: w(0.09, RIN + 0.03) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.06), B: lc(-0.11, 0.07) }, elbow: { F: -1, B: 1 }, ...o });
  const mix = (a, b, u) => { const L = MB.body(a), R = MB.body(b), bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); return { ...R, spine: bl(L.spine, R.spine), legL: bl(L.legL, R.legL), legR: bl(L.legR, R.legR), armF: bl(L.armF, R.armF), armB: bl(L.armB, R.armB), head: { ...R.head, c: lp(L.head.c, R.head.c, u), a: lerp(L.head.a, R.head.a, u) } }; };
  const WATCH = [
    () => STAND(),
    (t) => STAND({ lean: 0.2, nod: 0.12, hands: { F: lc(0.12, -0.1), B: lc(-0.12, 0.08) } }),
    (t) => ({ ...SEAT, nod: -0.1 + 0.04 * Math.sin(t) }),
    (t) => STAND({ nod: -0.25, lean: -0.04, hands: { F: lc(-0.1, 0.12), B: lc(-0.14, 0.1) } }),
    (t) => ({ ...SEAT, lean: 0.25, nod: 0.25, hands: { F: w(0.2, RIN - 0.16), B: w(0.17, RIN - 0.15) } }),
    (t) => STAND({ lean: 0.12, nod: 0.05 + 0.05 * Math.sin(t * 1.3), hands: { F: lc(0.2, -0.05), B: lc(-0.12, 0.08) } }),
    (t) => ({ ...SEAT, nod: -0.3 }),
    (t) => STAND({ nod: 0.2, lean: 0.3 })
  ];
  const ORDER = Object.keys(NODES).filter((n) => NODES[n].f).sort((a, b) => DIST[a] - DIST[b]);
  // the raise runs out from the first keeper in the order the line reached them
  const raiseAt = {}; ORDER.forEach((n, i) => { raiseAt[n] = T.raise + i * T.wave; });
  function keeper(n, t) {
    let ln;
    if (n === 'h0') {
      const up = smoother(seg(t, ...T.up)), seat = { ...SEAT, nod: -0.22 + 0.15 * bump(t, 3.8, 4.6) };
      const lean = STAND({ lean: 0.22, nod: 0.25 + 0.05 * Math.sin(t * 5) * smooth(5.6, 6, t) * (1 - smooth(6.6, 6.9, t)), hands: { F: lc(0.16, -0.06), B: lc(-0.1, 0.06) } });
      if (t < T.up[1]) ln = up <= 0 ? MB.body(seat) : mix(seat, lean, up);
      else if (t < T.cast[0]) ln = MB.body(lean);
      else {
        const c = seg(t, ...T.cast), back = bump(c, 0, 0.45), throwU = smoother(seg(c, 0.35, 0.75));
        const hF = c < 0.35 ? [lerp(0.16, 0.2, back), lerp(-0.06, 0.18, back)] : lp([0.2, 0.15], [-0.24, -0.4], throwU);
        const p = STAND({ lean: lerp(0.22, -0.05, throwU) + 0.12 * back, nod: lerp(0.25, -0.25, throwU), hands: { F: lc(...hF), B: lc(-0.12, 0.06) }, elbow: { F: 1, B: 1 } });
        const watch = STAND({ nod: -0.2, lean: 0.0 });
        ln = c < 1 ? MB.body(p) : mix(p, watch, smoother(seg(t, T.cast[1], T.cast[1] + 0.8)));
      }
    } else ln = MB.body(WATCH[ORDER.indexOf(n) % WATCH.length](t));
    const ra = raiseAt[n];
    if (t > ra) { const u = smoother(seg(t, ra, ra + 1.0)), m = MB.body(MB.MARK_POSE(0, 0)); const bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); ln = { ...ln, spine: bl(ln.spine, m.spine), legL: bl(ln.legL, m.legL), legR: bl(ln.legR, m.legR), head: { ...ln.head, c: lp(ln.head.c, m.head.c, u), a: lerp(ln.head.a, 0, u) } }; ln = MB.armsTo(ln, u); ln = MB.settle(ln, smoother(seg(t, ra + 0.8, ra + 1.4))); }
    return ln;
  }
  // a new keeper drops in through the opening and lands
  function arriving(t0, t) {
    const u = seg(t, t0, t0 + 0.75); if (u >= 1) return null;
    const from = [OUT[0] * 1.3, OUT[1] * 1.3], to = [-0.0, RIN - 0.33], p = lp(from, to, u * u), rot = lerp(-0.8, 0, smoother(u));
    return MB.body({ root: { x: p[0], y: p[1], rot, sx: 1, stretch: [rot - PI / 2, 1 + 0.25 * bump(u, 0.15, 0.6)] }, lean: 0.3, bend: 0.6, nod: 0.3, feet: { L: lc(0.06, 0.2), R: lc(0.12, 0.18) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.15, -0.5), B: lc(-0.08, -0.48) }, elbow: { F: 1, B: -1 } });
  }

  // ---- camera: close on the AI loop, then out until the whole mark is in view --------------------------------------------
  const KEYS = [[0, 6200, NODES.h0.c], [7.3, 6000, NODES.h0.c], [10.2, 1650, [HC[0] + 0.06, HC[1] - 0.07]], [14.5, 1050, [0.0, 0.12]], [20.5, 640, [0, 0.0]], [DUR, 600, [0, 0.0]]];
  function camAt(t) {
    let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
    const [t0, k0, c0] = KEYS[i], [t1, k1, c1] = KEYS[i + 1], u = smoother(seg(t, t0, t1));
    const k = Math.exp(lerp(Math.log(k0), Math.log(k1), u));
    // the centre moves in step with the zoom, so whatever is in view stays in view
    const v = (1 / k - 1 / k0) / ((1 / k1 - 1 / k0) || 1), c = lp(c0, c1, clamp(v, 0, 1));
    return I.camera(W, H, { cx: c[0] + 0.03 * Math.sin(t * 0.21) / k * 600, cy: c[1] + 0.02 * Math.cos(t * 0.17) / k * 600, k });
  }
  const sub = (cam, c) => { const f = (x, y) => cam(c[0] + S * x, c[1] + S * y); f.k = cam.k * S; f.inv = (X, Y) => { const p = cam.inv(X, Y); return [(p[0] - c[0]) / S, (p[1] - c[1]) / S]; }; return f; };

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(77), o = []; for (let i = 0; i < 260; i++) o.push([r() * W, r() * H, 0.4 + r() * 1.1, 0.1 + r() * 0.35, r() * 6]); return o; })();
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.0);
    I.background(ctx, THEME, W, H);
    ctx.fillStyle = fg; for (const [x, y, r, a, ph] of STARS) { ctx.globalAlpha = a * (0.7 + 0.3 * Math.sin(t + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    // at the end, the mark itself, faint, behind its constellation
    const glow = smooth(T.glow[0], T.glow[1], t);
    if (glow > 0) { ctx.globalAlpha = 0.16 * glow; MB.drawMark(ctx, cam, (q) => q, fg, bg, 'all'); ctx.globalAlpha = 1; }
    // the lines: each runs from rim to rim along the mark, as far as the fuse has got
    const run = ran(t), lw = lerp(1.5, 2.6, smooth(T.reveal[0], T.reveal[1], t));
    ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const e of EDGES) {
      const da = DIST[e.a], gone = run - da; if (gone <= 0) continue;
      const s0 = NODES[e.a].f ? GAPR : 0, s1 = Math.min(gone, e.L - (NODES[e.b].f ? GAPR : 0)); if (s1 <= s0) continue;
      const pts = cut(e.path, s0, s1);
      ctx.globalAlpha = 0.75; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((q, i) => { const s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke();
      // the head of the line, glowing as it runs
      if (gone < e.L) { const p = cam(...at(e.path, gone)), g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 16); g.addColorStop(0, 'rgba(243,241,236,0.95)'); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(p[0] - 16, p[1] - 16, 32, 32); }
      // posts, once a line is whole, both ways
      else { const ta = da + e.L; for (let k = 0; k < 2; k++) { const ph = ((t - (reach[e.b] || 0)) * 0.45 + k * 0.5) % 1; if (t < (reach[e.b] || 0) + 0.6) continue; const s = (k ? ph : 1 - ph) * e.L; if (s < GAPR || s > e.L - GAPR) continue; const p = cam(...at(e.path, s)); ctx.globalAlpha = 0.9 * Math.sin(PI * ph); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.6, 0.006 * cam.k), 0, 7); ctx.fill(); } void ta; }
    }
    ctx.globalAlpha = 1;
    // the first throw: from his hand out through the opening, to where the line sets off
    if (t > T.cast[0] + 0.3 && t < T.go + 0.5) {
      const u = smoother(seg(t, T.cast[0] + 0.3, T.go)), h = NODES.h0.c, o = [h[0] + OUT[0] * RM * S * 1.05, h[1] + OUT[1] * RM * S * 1.05], start = at(EDGES[0].path, GAPR);
      const mid = [o[0] + OUT[0] * 0.03, o[1] + OUT[1] * 0.03], q = u < 0.5 ? lp([h[0] - 0.01, h[1] - 0.02], o, u * 2) : lp(lp(o, mid, (u - 0.5) * 2), lp(mid, start, (u - 0.5) * 2), (u - 0.5) * 2);
      const p = cam(q[0], q[1]), g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 18); g.addColorStop(0, 'rgba(243,241,236,0.95)'); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(p[0] - 18, p[1] - 18, 36, 36);
    }
    // the loops
    for (const n of ORDER) {
      const N = NODES[n], sc = sub(cam, N.c), ctr = cam(N.c[0], N.c[1]), R = RN * cam.k * 1.2;
      if (ctr[0] < -R || ctr[1] < -R || ctr[0] > W + R || ctr[1] > H + R) continue;
      const r0 = reach[n], kept = n === 'h0' ? 1 : smooth(r0, r0 + 0.6, t);
      ctx.globalAlpha = 0.22 + 0.78 * kept; MB.drawMark(ctx, sc, j, fg, bg, 'loop'); ctx.globalAlpha = 1;
      if (kept <= 0) continue;
      const f = FIELDS[N.f], burst = n === 'h0' ? bump(t, ...T.burst) : 0, Fs = f(t, burst), box = [ctr[0] - RIN * sc.k, ctr[1] - RIN * sc.k, ctr[0] + RIN * sc.k, ctr[1] + RIN * sc.k];
      const mask = (x, y) => { const d = Math.hypot(x, y); return clamp((RIN - 0.03 - d) / 0.12, 0, 1) * kept; };
      const step = Math.max(N.f === 'cells' ? 0.03 : 0.06, 6.5 / sc.k), cell = Math.max(2, Math.min(8, sc.k / 60));
      if (sc.k > 25) for (const F of [].concat(Fs)) FL.contours(ctx, F, sc, W, H, { step, cell, mask, box, width: Math.max(0.7, 1.1 * sc.k / 520), color: fg, j });
      const arr = n === 'h0' ? null : arriving(r0, t);
      ctx.globalAlpha = Math.min(1, kept * 1.5);
      if (arr) MB.draw(ctx, arr, sc, j, fg); else if (n === 'h0' || t > r0 + 0.75) MB.draw(ctx, keeper(n, t), sc, j, fg);
      ctx.globalAlpha = 1;
    }
    I.vignette(ctx, THEME, W, H, 0.45);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(33.0, 34, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 8.4, [130.81, 196, 261.63, 311.13]], [7.9, 20.8, [130.81, 196, 261.63, 329.63]], [20.3, 24.6, [146.83, 220, 293.66, 369.99]], [24.1, DUR + 0.5, [130.81, 196, 261.63, 329.63, 392, 493.88]]] }];
    ev.push({ t: T.burst[0], type: 'shimmer', dur: 2.6 }, { t: T.cast[0] + 0.35, type: 'whoosh', dur: 0.5, amp: 0.15 }, { t: T.go, type: 'zip' });
    ORDER.forEach((n, i) => { if (n === 'h0') return; const pan = clamp(NODES[n].c[0] / 0.8, -0.8, 0.8); ev.push({ t: reach[n], type: 'pluck', f: SCALE[i % SCALE.length], amp: 0.2, pan, decay: 0.997, bright: 0.4, len: 3 }, { t: reach[n] + 0.72, type: 'step', amp: 0.12, tone: 1.4, pan }); });
    ev.push({ t: T.reveal[0], type: 'swell', dur: 4 });
    ORDER.forEach((n, i) => ev.push({ t: raiseAt[n] + 0.7, type: 'chime', f: SCALE[i % SCALE.length] * 2, amp: 0.035, pan: clamp(NODES[n].c[0] / 0.8, -0.8, 0.8) }));
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'constellation', title: 'Constellation', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, reach, raiseAt, DIST, NODES, EDGES, GAPR, RN, S, cut };
});
