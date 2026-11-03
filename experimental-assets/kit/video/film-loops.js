// FILM 9, Loops. What the site is: a place of many loops, each kept by one human who follows a field closely and
// posts what changed. Night. One human keeps the AI loop, watching its field. Something in it changes; he gets up and
// casts a line out through the opening. Pulling back: the dark is full of empty loops, openings all in step at
// eleven, waiting for keepers. The line reaches one; a keeper drops in through its opening and a different field
// comes alive there. That loop casts on to the next, and the next. Loops look different; lines are what they share.
// Posts run along the lines. At the end the first keeper raises his arms into the mark, and the gesture runs along
// the lines from loop to loop: every keeper in sync. See STORYBOARD.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).loops = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 32, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const w = (x, y) => ({ x, y, w: true }), lc = (x, y) => ({ x, y });
  const RIN = MB.MK.loop.r - MB.MK.loop.w / 2, GAPA = -2 * PI / 3, OUT = [Math.cos(GAPA), Math.sin(GAPA)];

  // ---- the loops: where they are, how big, what each one's field looks like, when it is kept --------------------------
  // fields are in the loop's own units (its centre at 0, 0, radius about 0.66 inside)
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
  // [x, y, scale, field, kept-at time, from which loop the line comes]
  const LOOPS = [
    [0, 0, 1, 'ai', -1, -1],
    [3.3, -1.25, 0.78, 'grid', 9.0, 0],
    [-3.15, -1.7, 0.7, 'ripple', 10.6, 0],
    [2.9, 2.2, 0.74, 'hatch', 11.9, 1],
    [-2.7, 2.15, 0.82, 'wave', 13.0, 2],
    [6.2, 0.6, 0.62, 'cells', 14.0, 3],
    [-6.0, 0.1, 0.66, 'spiral', 14.8, 4],
    [0.4, -3.6, 0.6, 'contour', 15.5, 1],
    [0.2, 3.9, 0.68, 'ripple', 16.1, 3],
    [-5.6, -3.2, 0.55, 'grid', -2, -1],
    [6.0, -3.0, 0.58, 'wave', -2, -1],
    [5.7, 3.9, 0.52, 'spiral', -2, -1],
    [-5.9, 3.8, 0.54, 'hatch', -2, -1]
  ].map(([x, y, s, f, at, from], i) => ({ i, c: [x, y], s, f, at, from }));
  const CAST = 0.95;                                              // how long a line takes to reach the next loop
  // cross-links once the web is there: posts run both ways
  const LINKS = [...LOOPS.filter((l) => l.from >= 0).map((l) => [l.from, l.i, l.at - CAST]), [1, 3, 16.6], [2, 4, 17.0], [5, 3, 17.4], [6, 2, 17.7], [7, 0, 18.0], [8, 4, 18.3]];
  const gapPoint = (l) => [l.c[0] + OUT[0] * MB.MK.loop.r * l.s, l.c[1] + OUT[1] * MB.MK.loop.r * l.s];
  // a line leaves one opening heading out (up-left) and comes into the other from its outside, so it hangs in an arc
  function thread(a, b) {
    const p0 = gapPoint(LOOPS[a]), p3 = gapPoint(LOOPS[b]), d = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]), k = 0.35 * d + 0.4;
    const p1 = [p0[0] + OUT[0] * k, p0[1] + OUT[1] * k], p2 = [p3[0] + OUT[0] * k, p3[1] + OUT[1] * k];
    return (u) => { const v = 1 - u; return [0, 1].map((q) => v * v * v * p0[q] + 3 * v * v * u * p1[q] + 3 * v * u * u * p2[q] + u * u * u * p3[q]); };
  }

  // ---- the keepers ---------------------------------------------------------------------------------------------------
  // the AI keeper: sits watching; the field changes; he gets up, leans in; casts the line out through the opening
  const T = { burst: [3.8, 7.2], up: [4.6, 5.6], cast: [6.9, 7.9], raise: [24.0, 25.2], wave: 1.1, mark: [28.0, 29.0] };
  const M0 = MB.MARK_POSE(0, 0), MH = (k) => [M0.hands[k].x, M0.hands[k].y], MF = (k) => [M0.feet[k].x, M0.feet[k].y];
  const SEAT = { root: { x: -0.1, y: RIN - 0.05, rot: 0, sx: 1 }, lean: 0.06, bend: 0.5, nod: -0.2, sh: 0.3, feet: { L: w(0.12, RIN - 0.02), R: w(0.17, RIN - 0.03) }, knee: { L: 1, R: 1 }, hands: { F: w(0.1, RIN - 0.17), B: w(0.07, RIN - 0.16) }, elbow: { F: -1, B: -1 } };
  const STAND = (o = {}) => ({ root: { x: 0.0, y: RIN - 0.3, rot: 0, sx: 1 }, lean: 0.02, bend: 0.6, nod: -0.1, sh: 0.3, feet: { L: w(-0.08, RIN + 0.03), R: w(0.09, RIN + 0.03) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.06), B: lc(-0.11, 0.07) }, elbow: { F: -1, B: 1 }, ...o });
  const mix = (a, b, u) => { const L = MB.body(a), R = MB.body(b), bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); return { ...R, spine: bl(L.spine, R.spine), legL: bl(L.legL, R.legL), legR: bl(L.legR, R.legR), armF: bl(L.armF, R.armF), armB: bl(L.armB, R.armB), head: { ...R.head, c: lp(L.head.c, R.head.c, u), a: lerp(L.head.a, R.head.a, u) } }; };
  // each keeper's way of watching (in its loop's own units)
  const WATCH = [
    () => STAND(),
    (t) => STAND({ lean: 0.2, nod: 0.12, hands: { F: lc(0.12, -0.1), B: lc(-0.12, 0.08) } }),
    (t) => ({ ...SEAT, nod: -0.1 + 0.04 * Math.sin(t) }),
    (t) => STAND({ nod: -0.25, lean: -0.04, hands: { F: lc(-0.1, 0.12), B: lc(-0.14, 0.1) } }),
    (t) => ({ ...SEAT, lean: 0.25, nod: 0.25, hands: { F: w(0.2, RIN - 0.16), B: w(0.17, RIN - 0.15) } }),
    (t) => STAND({ lean: 0.12, nod: 0.05 + 0.05 * Math.sin(t * 1.3), hands: { F: lc(0.2, -0.05), B: lc(-0.12, 0.08) } }),
    (t) => ({ ...SEAT, nod: -0.3 }),
    (t) => STAND({ nod: 0.2, lean: 0.3 }),
    (t) => ({ ...SEAT, lean: 0.1, nod: 0.1 })
  ];
  // when each keeper raises his arms into the mark: the first, then out along the lines
  const raiseAt = (() => { const out = {}; out[0] = T.raise[0]; const q = [0]; while (q.length) { const a = q.shift(); for (const l of LOOPS) if (l.from === a && out[l.i] === undefined) { out[l.i] = out[a] + T.wave * 0.45; q.push(l.i); } } return out; })();
  function keeper(l, t) {
    let ln;
    if (l.i === 0) {
      const up = smoother(seg(t, ...T.up)), seat = { ...SEAT, nod: -0.22 + 0.15 * bump(t, 3.8, 4.6) };
      const lean = STAND({ lean: 0.22, nod: 0.25 + 0.05 * Math.sin(t * 5) * smooth(5.6, 6, t) * (1 - smooth(6.6, 6.9, t)), hands: { F: lc(0.16, -0.06), B: lc(-0.1, 0.06) } });
      if (t < T.up[1]) ln = up <= 0 ? MB.body(seat) : mix(seat, lean, up);
      else if (t < T.cast[0]) ln = MB.body(lean);
      else {
        // the cast: wind back, then the arm swings up and out toward the opening and lets the line go
        const c = seg(t, ...T.cast), back = bump(c, 0, 0.45), throwU = smoother(seg(c, 0.35, 0.75));
        const hF = c < 0.35 ? [lerp(0.16, 0.2, back), lerp(-0.06, 0.18, back)] : lp([0.2, 0.15], [-0.24, -0.4], throwU);
        const p = STAND({ lean: lerp(0.22, -0.05, throwU) + 0.12 * back, nod: lerp(0.25, -0.25, throwU), hands: { F: lc(...hF), B: lc(-0.12, 0.06) }, elbow: { F: 1, B: 1 } });
        const watch = STAND({ nod: -0.2, lean: 0.0 });
        ln = c < 1 ? MB.body(p) : mix(p, watch, smoother(seg(t, T.cast[1], T.cast[1] + 0.8)));
      }
    } else ln = MB.body(WATCH[l.i % WATCH.length](t));
    // the arms up into the mark, in turn
    const ra = raiseAt[l.i];
    if (ra !== undefined && t > ra) { const u = smoother(seg(t, ra, ra + 1.0)), m = MB.body(MB.MARK_POSE(0, 0)); const bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); ln = { ...ln, spine: bl(ln.spine, m.spine), legL: bl(ln.legL, m.legL), legR: bl(ln.legR, m.legR), head: { ...ln.head, c: lp(ln.head.c, m.head.c, u), a: lerp(ln.head.a, 0, u) } }; ln = MB.armsTo(ln, u); ln = MB.settle(ln, smoother(seg(t, ra + 0.8, ra + 1.4))); }
    return ln;
  }
  // a new keeper drops in through the opening and lands
  function arriving(l, t) {
    const u = seg(t, l.at, l.at + 0.75); if (u >= 1) return null;
    const from = [OUT[0] * 1.3, OUT[1] * 1.3], to = [-0.0, RIN - 0.33], p = lp(from, to, u * u), rot = lerp(-0.8, 0, smoother(u));
    return MB.body({ root: { x: p[0], y: p[1], rot, sx: 1, stretch: [rot - PI / 2, 1 + 0.25 * bump(u, 0.15, 0.6)] }, lean: 0.3, bend: 0.6, nod: 0.3, feet: { L: lc(0.06, 0.2), R: lc(0.12, 0.18) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.15, -0.5), B: lc(-0.08, -0.48) }, elbow: { F: 1, B: -1 } });
  }

  // ---- camera ------------------------------------------------------------------------------------------------------
  function camAt(t) {
    const k = Math.exp(lerp(Math.log(520), Math.log(330), smoother(seg(t, 7.2, 9.6))) + lerp(0, Math.log(132 / 330), smoother(seg(t, 9.6, 16.5))) + lerp(0, Math.log(1.3), smoother(seg(t, 23.5, 31.5))));
    const c = lp([0.08, 0.05], [0.0, 0.25], smoother(seg(t, 9.6, 16.5)));
    return I.camera(W, H, { cx: c[0] + 0.05 * Math.sin(t * 0.21), cy: c[1] + 0.04 * Math.cos(t * 0.17), k, sy: 0.5 });
  }
  const sub = (cam, l) => { const f = (x, y) => cam(l.c[0] + l.s * x, l.c[1] + l.s * y); f.k = cam.k * l.s; f.inv = (X, Y) => { const p = cam.inv(X, Y); return [(p[0] - l.c[0]) / l.s, (p[1] - l.c[1]) / l.s]; }; return f; };

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(77), o = []; for (let i = 0; i < 220; i++) o.push([r() * W, r() * H, 0.4 + r() * 1.1, 0.1 + r() * 0.35, r() * 6]); return o; })();
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.0);
    I.background(ctx, THEME, W, H);
    ctx.fillStyle = fg; for (const [x, y, r, a, ph] of STARS) { ctx.globalAlpha = a * (0.7 + 0.3 * Math.sin(t + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    // the lines between loops: cast out, then posts running along them both ways
    ctx.strokeStyle = fg; ctx.lineCap = 'round';
    for (const [a, b, t0] of LINKS) {
      if (t < t0) continue; const u = smoother(seg(t, t0, t0 + CAST)), th = thread(a, b), n = 60, last = Math.ceil(n * u);
      ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(1.2, 0.012 * cam.k); ctx.beginPath(); for (let i = 0; i <= last; i++) { const p = th(Math.min(u, i / n)), s = j(cam(p[0], p[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); } ctx.stroke();
      // the head of a line being cast
      if (u < 1) { const p = cam(...th(u)), g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 14); g.addColorStop(0, 'rgba(243,241,236,0.9)'); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(p[0] - 14, p[1] - 14, 28, 28); }
      else for (let k = 0; k < 2; k++) { const ph = ((t - t0) * 0.32 + k * 0.5 + a * 0.13) % 1, dir = (k + a + b) % 2 ? ph : 1 - ph, p = cam(...th(dir)); ctx.globalAlpha = 0.9 * Math.sin(PI * ph); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(2, 0.02 * cam.k), 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // the loops
    for (const l of LOOPS) {
      const sc = sub(cam, l), ctr = cam(l.c[0], l.c[1]), R = MB.MK.loop.r * l.s * cam.k * 1.15;
      if (ctr[0] < -R || ctr[1] < -R || ctr[0] > W + R || ctr[1] > H + R) continue;
      const kept = l.at < 0 ? (l.at === -1 ? 1 : 0) : smooth(l.at, l.at + 0.6, t);
      ctx.globalAlpha = 0.36 + 0.64 * kept; MB.drawMark(ctx, sc, j, fg, bg, 'loop'); ctx.globalAlpha = 1;
      if (kept <= 0) continue;
      // its field, inside, in its own lines
      const f = FIELDS[l.f], burst = l.i === 0 ? bump(t, ...T.burst) : 0, Fs = f(t, burst), box = [ctr[0] - RIN * sc.k, ctr[1] - RIN * sc.k, ctr[0] + RIN * sc.k, ctr[1] + RIN * sc.k];
      const mask = (x, y) => { const d = Math.hypot(x, y); return clamp((RIN - 0.03 - d) / 0.12, 0, 1) * kept; };
      const step = l.f === 'cells' ? 0.03 : 0.06, cell = Math.max(3, Math.min(8, sc.k / 60));
      for (const F of [].concat(Fs)) FL.contours(ctx, F, sc, W, H, { step, cell, mask, box, width: Math.max(0.8, 1.1 * sc.k / 520), color: fg, j });
      // its keeper
      const arr = l.at > 0 ? arriving(l, t) : null;
      ctx.globalAlpha = Math.min(1, kept * 1.5);
      if (arr) MB.draw(ctx, arr, sc, j, fg); else if (l.at === -1 || t > l.at + 0.75) MB.draw(ctx, keeper(l, t), sc, j, fg);
      ctx.globalAlpha = 1;
    }
    I.vignette(ctx, THEME, W, H, 0.45);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(31.2, 32, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 9, [130.81, 196, 261.63, 311.13]], [8.5, 16.8, [130.81, 196, 261.63, 329.63]], [16.3, 24.2, [146.83, 220, 293.66, 369.99]], [23.7, 32.5, [130.81, 196, 261.63, 329.63, 392, 493.88]]] }];
    ev.push({ t: T.burst[0], type: 'shimmer', dur: 2.6 }, { t: T.cast[0] + 0.35, type: 'whoosh', dur: 0.5, amp: 0.15 });
    for (const [a, b, t0] of LINKS) ev.push({ t: t0 + 0.05, type: 'zip' }, { t: t0 + CAST, type: 'pluck', f: SCALE[b % SCALE.length], amp: 0.22, pan: clamp(LOOPS[b].c[0] / 6, -0.8, 0.8), decay: 0.997, bright: 0.4, len: 3 });
    for (const l of LOOPS) if (l.at > 0) ev.push({ t: l.at + 0.72, type: 'step', amp: 0.25, tone: 1.3 });
    for (const [i, ra] of Object.entries(raiseAt)) ev.push({ t: ra + 0.7, type: 'chime', f: SCALE[+i % SCALE.length] * 2, amp: 0.05, pan: clamp(LOOPS[i].c[0] / 6, -0.8, 0.8) });
    ev.push({ t: 26.0, type: 'swell', dur: 5 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'loops', title: 'Loops', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, raiseAt };
});
