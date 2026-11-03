// FILM 10, Open. The reader's side of the idea. The picture is full of noise: lines boiling everywhere, everything at
// once. In the middle of it is one loop, and inside it the lines run calm and clear: a field someone is keeping. He
// notices you (his head ring becomes an eye, as the o's of the lettering are, and looks at you) and beckons. The way
// in is the opening at eleven; the camera goes through it and the noise falls away. Inside you watch the field with
// him. Pulling back out, the loop is one clear, kept place in the noise, and he holds it: the mark. "Every loop stays
// open to readers"; "you are being kept in the loop by someone who is paying attention".
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).open = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 28, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const w = (x, y) => ({ x, y, w: true }), lc = (x, y) => ({ x, y });
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2, RIN = MB.MK.loop.r - MB.MK.loop.w / 2, GAPA = -2 * PI / 3;
  const GAP = [MB.MK.loop.r * Math.cos(GAPA), MB.MK.loop.r * Math.sin(GAPA)];
  const T = { notice: [8.6, 9.4], eye: [9.0, 12.4], beckon: [10.2, 12.0], enter: [12.4, 15.6], inside: [15.6, 21.5], back: [21.5, 24.5], mark: [22.6, 24.0], brush: [25.0, 26.0] };

  // ---- the keeper: standing in his loop watching his field, turning to the reader, beckoning, back to the field ------
  const STAND = (o = {}) => ({ root: { x: -0.04, y: RIN - 0.3, rot: 0, sx: 1 }, lean: 0.06, bend: 0.6, nod: 0.05, sh: 0.3, feet: { L: w(-0.12, RIN + 0.03), R: w(0.05, RIN + 0.03) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.06), B: lc(-0.11, 0.07) }, elbow: { F: -1, B: 1 }, ...o });
  function hero(t) {
    let p = STAND({ nod: 0.12 + 0.03 * Math.sin(t * 0.8), lean: 0.12 });
    const n = smoother(seg(t, ...T.notice)) * (1 - smoother(seg(t, T.inside[0] + 1.0, T.inside[0] + 2.2)));
    p.nod = lerp(p.nod, -0.1, n); p.lean = lerp(p.lean, 0.0, n);
    // the beckon: the front hand up, the fingers (forearm) curling in, twice
    const b = smooth(T.beckon[0], T.beckon[0] + 0.35, t) * (1 - smooth(T.beckon[1] - 0.3, T.beckon[1], t));
    if (b > 0) { const curl = 0.5 + 0.5 * Math.sin((t - T.beckon[0]) * 9 - PI / 2); p.hands = { F: lc(lerp(0.13, lerp(0.3, 0.2, curl), b), lerp(0.06, lerp(-0.2, -0.08, curl), b)), B: p.hands.B }; p.elbow = { F: 1, B: 1 }; }
    // inside: he turns back to his field and points at what changed
    const pt = bump(t, 17.2, 20.6);
    if (pt > 0) { p.hands = { F: lc(lerp(0.13, 0.32, pt), lerp(0.06, -0.12, pt)), B: p.hands.B }; p.elbow = { F: 1, B: 1 }; p.lean += 0.08 * pt; }
    let ln = MB.body(p);
    // and he holds it: arms up into the ring
    const u = smoother(seg(t, ...T.mark));
    if (u > 0) { const m = MB.body(MB.MARK_POSE(0, 0)), bl = (x, y) => MB.resample(x, 40).map((q, i) => lp(q, MB.resample(y, 40)[i], u)); ln = { ...ln, spine: bl(ln.spine, m.spine), legL: bl(ln.legL, m.legL), legR: bl(ln.legR, m.legR), head: { ...ln.head, c: lp(ln.head.c, m.head.c, u), a: lerp(ln.head.a, 0, u) } }; ln = MB.armsTo(ln, u); ln = MB.settle(ln, smoother(seg(t, T.mark[1] - 0.3, T.mark[1] + 0.4))); }
    return ln;
  }
  // where his eye looks: at the field, at you, back at the field
  const eyeOpen = (t) => smooth(T.eye[0], T.eye[0] + 0.25, t) * (1 - smooth(T.eye[1] - 0.3, T.eye[1], t)) + 0.0;
  const blink = (t) => 1 - bump(t, 10.9, 11.05);

  // ---- the fields: noise everywhere, calm inside the loop -------------------------------------------------------------
  const noiseF = (t) => (x, y) => FL.fbm(x * 1.25 + t * 0.55, y * 1.25 - t * 0.35, 21) + 0.35 * FL.noise(x * 3.1 - t * 1.4, y * 3.1 + t * 0.9, 33);
  const calmF = (t) => (x, y) => (x * 0.5 + y * 0.866) + 0.05 * Math.sin(x * 4 - t * 0.9) - 0.06 * t;
  // the change he watches: a new line arriving in his field
  const changeF = (t) => (x, y) => Math.hypot(x - 0.3, y + 0.15) - 0.4 * (t - 17.0);

  // ---- camera: through the noise to the loop, into the opening, inside, and back out -----------------------------------
  function camAt(t) {
    const keys = [[0, [1.6, -1.1], 230], [5.5, [0.9, -0.5], 300], [9.0, [0.15, -0.08], 470], [12.4, [0.1, -0.12], 520], [13.6, [GAP[0] * 1.02, GAP[1] * 1.02], 1500], [15.6, [0.02, 0.05], 640], [21.5, [0.02, 0.04], 660], [24.5, [0.0, 0.02], 330], [28, [0.0, 0.02], 300]];
    let i = 1; while (i < keys.length - 1 && keys[i][0] < t) i++;
    const [t0, c0, k0] = keys[i - 1], [t1, c1, k1] = keys[i], u = smoother(seg(t, t0, t1));
    return I.camera(W, H, { cx: lerp(c0[0], c1[0], u) + 0.02 * Math.sin(t * 0.37), cy: lerp(c0[1], c1[1], u) + 0.015 * Math.cos(t * 0.29), k: Math.exp(lerp(Math.log(k0), Math.log(k1), u)), sy: 0.5 });
  }
  const inside = (t) => smoother(seg(t, 13.9, 15.2)) * (1 - smoother(seg(t, ...T.back)));

  // ---- drawing -----------------------------------------------------------------------------------------------------
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.1 * (1 - smooth(24.5, 26, t)));
    I.background(ctx, THEME, W, H);
    // the noise: everywhere outside the loop; it hushes while you are inside and settles a little at the end
    const quiet = inside(t), hush = 1 - 0.85 * quiet - 0.35 * smooth(24, 27, t);
    const outMask = (x, y) => clamp((Math.hypot(x, y) - RO - 0.02) / 0.15, 0, 1) * hush;
    if (hush > 0.02) FL.contours(ctx, noiseF(t), cam, W, H, { step: 0.07, cell: 7, mask: outMask, width: Math.max(1, 1.2 * cam.k / 400), color: fg, j });
    // the calm field inside, and the new line he points at
    const inMask = (x, y) => clamp((RIN - 0.04 - Math.hypot(x, y)) / 0.1, 0, 1);
    const ctr = cam(0, 0), box = [ctr[0] - RIN * cam.k, ctr[1] - RIN * cam.k, ctr[0] + RIN * cam.k, ctr[1] + RIN * cam.k];
    FL.contours(ctx, calmF(t), cam, W, H, { step: 0.075, cell: Math.max(4, Math.min(9, cam.k / 70)), mask: inMask, box, width: Math.max(1, 1.5 * cam.k / 520), color: fg, j });
    const ch = bump(t, 17.0, 21.0);
    if (ch > 0.01) FL.contours(ctx, changeF(t), cam, W, H, { step: 0.3, cell: Math.max(4, Math.min(9, cam.k / 70)), mask: (x, y) => inMask(x, y) * ch, box, width: Math.max(1.5, 2.6 * cam.k / 520), color: fg, j });
    // the loop
    MB.drawMark(ctx, cam, j, fg, bg, 'loop');
    // him; his eye when he looks at you
    const bm = smoother(seg(t, ...T.brush));
    if (bm < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, bm); const ln = hero(t); MB.draw(ctx, ln, cam, j, fg);
      const e = eyeOpen(t);
      if (e > 0.01) { const c = cam(ln.head.c[0], ln.head.c[1]), r = 0.095 * cam.k * e, look = lp([0.08, -0.02], [0.0, 0.02], smooth(T.eye[0], T.eye[0] + 0.5, t)); ctx.save(); ctx.translate(c[0] + look[0] * cam.k, c[1] + look[1] * cam.k); ctx.scale(1, Math.max(0.08, blink(t))); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.globalAlpha = 1; }
    if (bm > 0) { ctx.globalAlpha = smooth(0, 0.6, bm); MB.drawMark(ctx, cam, j, fg, bg, 'figure'); ctx.globalAlpha = 1; }
    I.vignette(ctx, THEME, W, H, 0.45);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(27.2, 28, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'chatter', dur: DUR, track: Array.from({ length: Math.ceil(DUR * 20) }, (_, i) => { const t = i / 20; return (1 - 0.9 * inside(t)) * (1 - 0.35 * smooth(24, 27, t)) * smooth(0, 1, t); }) },
      { t: 4.5, type: 'pad', amp: 0.035, chords: [[4.5, 15.5, [146.83, 220, 293.66]], [14.6, 22.5, [130.81, 196, 261.63, 329.63]], [22, 28.5, [130.81, 196, 261.63, 329.63, 392, 493.88]]] },
      { t: T.notice[0] + 0.1, type: 'hi', notes: [587.33, 783.99] }, { t: 10.95, type: 'tap' }, { t: T.beckon[0] + 0.3, type: 'pluck', f: 392, amp: 0.15 }, { t: T.beckon[0] + 1.0, type: 'pluck', f: 392, amp: 0.13 },
      { t: 13.2, type: 'whoosh', dur: 1.8, amp: 0.25 }, { t: 17.0, type: 'chime', f: 783.99, amp: 0.06 }, { t: 18.0, type: 'chime', f: 987.77, amp: 0.05 }, { t: 23.6, type: 'chime', f: 1046.5, amp: 0.1 }, { t: 22.6, type: 'swell', dur: 4 }];
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'open', title: 'Open', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero };
});
