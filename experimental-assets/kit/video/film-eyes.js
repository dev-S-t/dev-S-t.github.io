// FILM 14, Eyes: a brand sting. The lockup as the site shows it, the mark and the lettering, whose o's are eyes. The
// eyes look at you, blink, look about, and find the mark beside them. The figure in the mark notices them looking: his
// head ring turns toward them. They stare at each other; the eyes narrow, dart away, and glance back. He takes his
// front arm out of the ring, point for point, and waves. The eyes go happy (^ ^), his arm goes back into the ring,
// and they look at you again. Crisp, no hand-drawn wobble: it is the brand.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./mark.js'), require('fs'));
  else (root.Films = root.Films || {}).eyes = factory(root.Ink, root.MarkBody, root.Mark, null);
})(this, function (I, MB, MK, fs) {
  const W = 1920, H = 1080, FPS = 30, DUR = 12.8, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const { bg, fg } = I.THEMES[THEME];

  // ---- the lettering: the site's wordmark, one stroke 4.2 wide; strokes 17 and 18 are the o's of "loop" -----------------
  const WD = 'M0 -31L0 0M0 -10L0.03 -10.72L0.13 -11.43L0.28 -12.14L0.5 -12.82L0.77 -13.49L1.11 -14.12L1.49 -14.73L1.93 -15.3L2.42 -15.83L2.95 -16.32L3.52 -16.76L4.12 -17.14L4.76 -17.48L5.43 -17.75L6.11 -17.97L6.82 -18.12L7.53 -18.22L8.25 -18.25L8.97 -18.22L9.68 -18.12L10.39 -17.97L11.07 -17.75L11.74 -17.48L12.38 -17.14L12.98 -16.76L13.55 -16.32L14.08 -15.83L14.57 -15.3L15.01 -14.73L15.39 -14.13L15.73 -13.49L16 -12.82L16.22 -12.14L16.37 -11.43L16.47 -10.72L16.5 -10L16.5 0';
  let WORD = (typeof window !== 'undefined' && window.WORDMARK_D) || null;
  if (!WORD && fs) { const s = fs.readFileSync(require('path').resolve(__dirname, '../../../assets/img/wordmark.svg'), 'utf8'); WORD = s.match(/<path d="([^"]+)"/)[1]; }
  if (!WORD) WORD = WD;
  const SUBS = WORD.split('M').filter(Boolean).map((t) => t.split('L').map((p) => p.trim().split(/\s+/).map(Number)));
  const O_IDX = [17, 18], EYE = [[211.06, -10], [237.16, -10]], PUP = 2.5, REACH = 3.8, DOT = [147.8, -26.6, 2.6];
  const oShape = (i) => SUBS[O_IDX[i]].map(([x, y]) => [x - EYE[i][0], y - EYE[i][1]]);

  // ---- layout: the lockup in its own units (the mark 100 x 100, the lettering from x 122, x-height centred) ----------------
  const WS = 56 / 42.7, WY = 50 - (-10 + 31.6) * WS, LW = 122 + 276.62 * WS, PX = 3.55, X0 = (W - LW * PX) / 2, Y0 = H / 2 - 50 * PX;
  const wordToScreen = (x, y) => [X0 + (122 + (x + 2.1) * WS) * PX, Y0 + (WY + (y + 31.6) * WS) * PX];
  const MARKC = [X0 + 50 * PX, Y0 + 50 * PX], MK_K = 62 * PX;
  const cam = I.camera(W, H, { cx: -(MARKC[0] - W / 2) / MK_K, cy: -(MARKC[1] - H / 2) / MK_K, k: MK_K });

  // ---- the eyes: where the pupils look (quick darts, a little overshoot), blinks, moods ----------------------------------
  const back = (u) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  const LOOK = [[0, [0, 0.25]], [2.6, [0.92, -0.12]], [3.15, [-0.35, -0.68]], [3.7, [-0.95, 0.18]], [6.75, [0, 0.3]], [7.05, [-0.95, 0.18]], [11.3, [0, 0.25]]];
  function look(t) {
    let p = LOOK[0][1];
    for (let i = 1; i < LOOK.length; i++) { const [k, q] = LOOK[i]; if (t < k) break; const u = clamp((t - k) / 0.15, 0, 1); p = lp(p, q, back(u)); }
    return p;
  }
  const BLINKS = [2.05, 11.9];
  const lid = (t) => { let s = 1; for (const b of BLINKS) s = Math.min(s, 1 - 0.93 * bump(t, b, b + 0.2)); return s; };
  // surprised (wide), then narrowed (sizing him up), then happy (^ ^)
  const wide = (t) => 1 + 0.14 * bump(t, 3.72, 4.1);
  const narrow = (t) => 1 - 0.32 * smooth(5.95, 6.2, t) * (1 - smooth(7.05, 7.2, t));
  const HAPPY = [9.6, 10.45];
  const happyA = (t) => smooth(HAPPY[0], HAPPY[0] + 0.12, t) * (1 - smooth(HAPPY[1] - 0.12, HAPPY[1], t));
  const happySquash = (t) => 1 - 0.9 * (bump(t, HAPPY[0] - 0.08, HAPPY[0] + 0.16) + bump(t, HAPPY[1] - 0.16, HAPPY[1] + 0.08));

  // ---- the mark, part by part (0 loop, 1 arms, 2 head, 3 spine, 4 legs), each with its own move ------------------------------
  const POLYS = MK.paths.map((d) => d.replace(/Z/g, '').split('M').filter(Boolean).map((s) => s.split('L').map((xy) => xy.trim().split(/\s+/).map(Number))));
  const GAPS = MK.gaps.map((d) => d.slice(1).split('L').map((xy) => xy.trim().split(/\s+/).map(Number)));
  const HEADC = [MK.rings.head[0], MK.rings.head[1]];
  // the head ring turns toward the lettering, and back
  const headTurn = (t) => 0.32 * smoother(seg(t, 4.55, 4.95)) * (1 - smoother(seg(t, 10.5, 10.9))) + 0.05 * Math.sin((t - 4.95) * 18) * Math.exp(-Math.max(0, t - 4.95) * 6) * (t > 4.95 ? 1 : 0);
  const headShift = (t) => 1.1 * smoother(seg(t, 4.55, 4.95)) * (1 - smoother(seg(t, 10.5, 10.9)));
  const toScr = (p) => [X0 + p[0] * PX, Y0 + p[1] * PX];
  function drawPart(ctx, i, tf) {
    ctx.fillStyle = fg;
    for (const poly of POLYS[i]) { ctx.beginPath(); poly.forEach((q, n) => { const s = toScr(tf ? tf(q) : q); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); }
  }
  // the greeting: his arms stay up in their ring (the arms are the ring) and the ring sways from side to side over his
  // head, swinging from the shoulder, the way you wave both arms above your head; a hop as it starts
  const ARMS = [7.55, 7.7, 9.05];                    // a beat, the sway starts, the sway ends
  const SHM = [50 + MB.MK.armF[0][0] * 62, 50 + MB.MK.armF[0][1] * 62];
  const sway = (t) => 0.2 * Math.sin(2 * PI * (t - ARMS[1] - 0.15) / 0.62) * smooth(ARMS[1] + 0.05, ARMS[1] + 0.3, t) * (1 - smooth(ARMS[2] - 0.35, ARMS[2], t));
  // an excited little hop as the wave starts, and his head tilting in time with it
  const hop = (t) => -4.0 * Math.sin(PI * seg(t, ARMS[1] - 0.05, ARMS[1] + 0.3)) - 1.6 * Math.sin(PI * seg(t, ARMS[2] - 0.2, ARMS[2] + 0.1));
  const tilt = (t) => 0.45 * sway(t - 0.06);
  // the camera: a slow push in, drifting a little toward wherever the eyes are looking
  // the camera: wide on the lockup; then it follows the eyes' gaze along the word to the mark, close; back and forth
  // between them (quick pans, like a two-shot); then out to the lockup again
  const CLOSE = 2.3, MC = [X0 + 50 * PX, Y0 + 50 * PX], EC = wordToScreen(233, -12), WIDE = [W / 2, H / 2];
  const SHOTS = [[0, 1, WIDE], [3.85, 1, WIDE], [4.3, CLOSE, MC], [5.4, CLOSE, MC], [5.75, CLOSE, EC], [7.1, CLOSE, EC], [7.45, CLOSE, MC], [9.15, CLOSE, MC], [9.5, CLOSE, EC], [10.5, CLOSE, EC], [11.2, 1, WIDE]];
  function shot(t) {
    let i = 0; while (i < SHOTS.length - 2 && t > SHOTS[i + 1][0]) i++;
    const [t0, k0, c0] = SHOTS[i], [t1, k1, c1] = SHOTS[i + 1], u = smoother(seg(t, t0, t1));
    // a pan between two close shots goes straight across; a zoom keeps the focus moving in step with the scale
    const k = Math.exp(lerp(Math.log(k0), Math.log(k1), u)), v = k0 === k1 ? u : (1 / k - 1 / k0) / (1 / k1 - 1 / k0);
    return { k, c: lp(c0, c1, clamp(v, 0, 1)) };
  }

  function draw(ctx, t) {
    I.background(ctx, THEME, W, H);
    const sh = shot(t); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sh.k, sh.k); ctx.translate(-sh.c[0], -sh.c[1]);
    // the mark
    const hp0 = hop(t), hT = headTurn(t) + tilt(t), hS = headShift(t), headTf = (q) => { const dx = q[0] - HEADC[0], dy = q[1] - HEADC[1], c = Math.cos(hT), s = Math.sin(hT); return [HEADC[0] + hS + c * dx - s * dy, HEADC[1] + hp0 + s * dx + c * dy]; }, up = (q) => [q[0], q[1] + hp0];
    const sw = sway(t), armTf = (q) => { const dx = q[0] - SHM[0], dy = q[1] - SHM[1], c = Math.cos(sw), si = Math.sin(sw); return [SHM[0] + c * dx - si * dy, SHM[1] + hp0 + si * dx + c * dy]; };
    drawPart(ctx, 0); drawPart(ctx, 3, up); drawPart(ctx, 4, up); drawPart(ctx, 1, armTf); drawPart(ctx, 2, headTf);
    ctx.strokeStyle = bg; ctx.lineWidth = 0.34 * PX; ctx.lineCap = 'round';
    for (const g of GAPS) { ctx.beginPath(); g.forEach((q, n) => { const s = toScr(q); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); }
    // the lettering, all but its two o's
    ctx.save(); ctx.strokeStyle = fg; ctx.lineWidth = 4.2 * WS * PX; ctx.lineJoin = 'round';
    SUBS.forEach((pts, i) => { if (O_IDX.includes(i)) return; ctx.beginPath(); pts.forEach(([x, y], n) => { const s = wordToScreen(x, y); if (n) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); });
    const d = wordToScreen(DOT[0], DOT[1]); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(d[0], d[1], DOT[2] * WS * PX, 0, 7); ctx.fill();
    // the eyes
    const lk = look(t), sy = lid(t) * narrow(t) * happySquash(t), sc = wide(t), hp = happyA(t);
    EYE.forEach((e, i) => {
      const c = wordToScreen(e[0], e[1]), k = WS * PX;
      ctx.save(); ctx.translate(c[0], c[1]);
      if (hp < 0.5) {
        // the o, squashed for blinks, wide when surprised
        ctx.beginPath(); oShape(i).forEach(([x, y], n) => { const X = x * k * sc, Y = y * k * sc * sy; if (n) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.stroke();
        if (sy > 0.35) { ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(lk[0] * REACH * k, lk[1] * REACH * k * sy, PUP * k * Math.min(1, sy * 1.2), 0, 7); ctx.fill(); }
      } else {
        // happy: just the top of the o, raised a little
        const r = 8.9 * k; ctx.beginPath(); ctx.arc(0, 0.25 * r, r, PI * 1.12, PI * 1.88); ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
    ctx.restore();
    const fade = 1 - smooth(0, 0.6, t); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.03, chords: [[0.3, 7.6, [130.81, 196, 261.63, 329.63]], [7.3, DUR + 0.5, [130.81, 196, 261.63, 329.63, 392]]] }];
    BLINKS.forEach((b) => ev.push({ t: b + 0.06, type: 'tap' }));
    [2.6, 3.15, 3.7, 6.75, 7.05, 11.3].forEach((x, i) => ev.push({ t: x, type: 'chirp', f: 2200 + 180 * (i % 3) }));
    ev.push({ t: 3.74, type: 'pluck', f: 880, amp: 0.1 });
    // the pans
    [[3.85, 0.45, 0.5, -0.5], [5.4, 0.35, -0.5, 0.5], [7.1, 0.35, 0.5, -0.5], [9.15, 0.35, -0.5, 0.5], [10.5, 0.7, 0.2, 0]].forEach(([x, d, a, b]) => ev.push({ t: x, type: 'whoosh', dur: d, amp: 0.08, from: a, to: b }));
    ev.push({ t: 4.6, type: 'swish' }, { t: 5.97, type: 'pluck', f: 220, amp: 0.08, decay: 0.993 });
    ev.push({ t: ARMS[1] + 0.28, type: 'step', amp: 0.16, tone: 1.4 }, { t: ARMS[2] + 0.08, type: 'step', amp: 0.12, tone: 1.4 }); [0, 1, 2, 3].forEach((k) => ev.push({ t: ARMS[1] + 0.3 + k * 0.31, type: 'pluck', f: k % 2 ? 659.25 : 523.25, amp: 0.1, pan: k % 2 ? 0.2 : -0.2 }));
    ev.push({ t: HAPPY[0], type: 'hi', notes: [659.25, 880] }, { t: 11.25, type: 'chime', f: 1046.5, amp: 0.07 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'eyes', title: 'Eyes', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events };
});
