// FILM 5, Firefly. Night inside his ring. A tiny ring of light drifts in through the opening at eleven. He reaches
// for it, claps at it, turns round looking for it; it settles on his head, then circles it, faster and faster. He
// lunges and sweeps both arms up and round after it, from both sides; just as his hands close, it slips out between
// them at eleven and straight out through the opening it came in by. He is left holding the shape of the catch that
// got away: the mark. See STORYBOARD.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'), require('./markfig.js'));
  else (root.Films = root.Films || {}).firefly = factory(root.Rig, root.Ink, root.MarkFig);
})(this, function (R, I, F) {
  const W = 1920, H = 1080, FPS = 30, DUR = 24, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI, D2R = PI / 180;
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lrp(v, b[i], u)) : a + (b - a) * u);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) { const ks = per[f]; if (t <= ks[0][0]) { out[f] = ks[0][1]; continue; } let v = ks[ks.length - 1][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { v = lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); break; } out[f] = v; } return out; };
  }
  // a path through timed points, with velocities from the neighbours (so it flows through each point)
  function path(keys) {
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1].slice(); if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1].slice();
      let i = 0; while (keys[i + 1][0] < t) i++;
      const [t0, p0] = keys[i], [t1, p1] = keys[i + 1], T = t1 - t0, u = (t - t0) / T;
      const vel = (k) => { const a = keys[Math.max(0, k - 1)], b = keys[Math.min(keys.length - 1, k + 1)]; return [(b[1][0] - a[1][0]) / (b[0] - a[0]), (b[1][1] - a[1][1]) / (b[0] - a[0])]; };
      const m0 = vel(i), m1 = vel(i + 1), h = [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2];
      return [0, 1].map((c) => h[0] * p0[c] + h[1] * T * m0[c] + h[2] * p1[c] + h[3] * T * m1[c]);
    };
  }

  // ---- his performance ---------------------------------------------------------------------------------------------
  const DOWN = PI / 2, T = F.TARGET, KR = -1 / F.ARM_R;
  const SP0 = T.spine[0], SP1 = T.spine[T.spine.length - 1];
  const FIN = { lean: Math.atan2(-(SP1[0] - SP0[0]), SP1[1] - SP0[1]), torso: Math.hypot(SP1[0] - SP0[0], SP1[1] - SP0[1]) };
  const FOOT_L = T.legL[T.legL.length - 1][0], FOOT_R = T.legR[T.legR.length - 1][0];
  const HANG = { armF: [DOWN - 0.1, 0.5, 0.29], armB: [DOWN + 0.15, -0.5, 0.29] };
  const pose = track([
    // sitting back on his hands, looking up at the stars
    [0, { ax: 0.0, px: 0, py: 0.0, lean: -0.1, nod: -0.22, torso: 0.259, sh: 0.35, fL: [0.17, 0], fR: [0.21, 0], armF: [DOWN + 0.55, 0.4, 0.29], armB: [DOWN + 0.8, 0.4, 0.29] }],
    [3.2, { nod: -0.22, lean: -0.1 }],
    // something comes in: he sits up and watches it come down to him
    [4.0, { nod: -0.3, lean: 0.02 }],
    [5.2, { nod: 0.05, lean: 0.08 }],
    // a slow reach
    [5.5, { armF: [DOWN + 0.55, 0.4, 0.29] }],
    [6.2, { lean: 0.16, armF: [-0.3, -0.5, 0.29] }],
    // it darts up; he looks up after it and gets up
    [6.55, { nod: -0.32, lean: 0.0, armF: [DOWN - 0.2, 0.4, 0.29] }],
    [7.0, { lean: 0.55, nod: 0.0, armF: [0.35, 0.6, 0.29], armB: [0.6, 0.6, 0.29] }],
    [7.6, { py: -0.218, lean: 0.04, nod: -0.15, ...HANG }],
    // the clap: both hands at it, a little hop
    [7.85, { armF: [DOWN + 0.4, 0.2, 0.29], armB: [DOWN + 0.6, 0.2, 0.29], lean: -0.04 }],
    [8.02, { armF: [-0.25, -0.7, 0.29], armB: [-0.1, -0.7, 0.29], lean: 0.12, nod: -0.05 }],
    // gone: where? arms out, puzzled
    [8.4, { armF: [DOWN - 0.65, 0.3, 0.29], armB: [DOWN + 0.65, -0.3, 0.29], lean: 0.02, nod: 0.05 }],
    [9.6, { nod: -0.1 }],
    // it comes down onto his head: he goes very still and looks up
    [10.2, { nod: -0.05, ...HANG }],
    [10.7, { nod: 0.0, armF: [DOWN - 0.75, 0.2, 0.29], armB: [DOWN + 0.75, -0.2, 0.29], py: -0.205 }],
    [11.6, { nod: -0.28, lean: -0.04 }],
    [12.2, { nod: -0.22, py: -0.218, ...HANG }],
    // it circles his head: he follows it round (see the sway below)
    [15.9, { lean: 0.02, nod: 0 }],
    // he means to have it: knees give, arms drop back
    [16.45, { py: -0.19, lean: 0.1, nod: -0.06, armF: [DOWN + 0.25, 0.2, 0.29], armB: [DOWN + 0.45, -0.2, 0.29] }],
    // the lunge: arms out wide, then up and round after it, from both sides
    [16.9, { py: -0.235, lean: -0.06, nod: -0.16, torso: 0.28, armF: [-0.04, 0, 0.36], armB: [PI + 0.04, 0, 0.36] }],
    [17.12, { armF: [0, KR, 0.42], armB: [PI, -KR, 0.42] }],
    [17.95, { ax: SP1[0], py: SP1[1] - F.floorY(SP1[0]), lean: FIN.lean, nod: -FIN.lean - 0.08, torso: FIN.torso, sh: F.SH_AT, fL: [FOOT_L, 0], fR: [FOOT_R, 0], armF: [0, KR, F.LENGTH.armF], armB: [PI, -KR, F.LENGTH.armB] }],
    [19.2, { nod: -FIN.lean }]
  ]);
  const STEPS = [[6.75, 7.05, 'fL', 0.17, -0.06], [7.05, 7.35, 'fR', 0.21, 0.07], [16.45, 16.9, 'fR', 0.07, FOOT_R], [16.6, 16.95, 'fL', -0.06, FOOT_L]];
  const HOPS = [[7.86, 8.08, 0.05], [8.6, 8.8, 0.035], [9.3, 9.5, 0.035]], TURNS = [8.7, 9.4];
  const T_SETTLE = [19.2, 19.9], T_MARK = [20.2, 21.2];
  function hero(t) {
    const p = pose(t);
    for (const [a, b, f, x0, x1] of STEPS) if (t > a && t < b) p[f] = [lerp(x0, x1, smoother(seg(t, a, b))), 0.05 * bump(t, a, b)];
    for (const [a, b, h] of HOPS) { const k = bump(t, a, b); if (k > 0) { p.py -= h * k; const fy = h * 0.8 * k; p.fL = [p.fL[0], Math.max(p.fL[1], fy)]; p.fR = [p.fR[0], Math.max(p.fR[1], fy)]; } }
    // turning round to look behind him, and back
    p.sx = t > TURNS[0] && t < TURNS[1] ? -1 : 1;
    // watching it go round: his head follows it, and he gets dizzy
    const o = orbitAngle(t), watch = smooth(12.4, 12.9, t) * (1 - smooth(16.0, 16.4, t));
    if (watch > 0) { p.nod += 0.14 * Math.sin(o) * watch; p.lean += (0.05 * Math.cos(o) + 0.03 * Math.sin(2.3 * t)) * watch * smooth(13.5, 15.5, t); }
    // closing on nothing: the hands snap in a little, then he holds
    const snap = bump(t, 17.95, 18.35); p.armF = [p.armF[0], p.armF[1], p.armF[2] + 0.03 * snap]; p.armB = [p.armB[0], p.armB[1], p.armB[2] + 0.03 * snap];
    return F.settle(F.lines(p), smoother(seg(t, ...T_SETTLE)));
  }

  // ---- the firefly -------------------------------------------------------------------------------------------------
  const RC = [0, -0.042], RR = F.ARM_R, ESC = -120 * D2R;
  const head = (t) => { const h = F.lines(pose(t)).head; return h; };
  const drift = path([
    [3.0, [-0.82, -1.08]], [3.65, [-0.38, -0.62]], [4.4, [-0.12, -0.42]], [5.0, [0.22, -0.2]], [5.5, [0.34, 0.08]], [6.25, [0.33, 0.1]],
    [6.5, [0.18, -0.36]], [7.2, [0.26, -0.34]], [7.9, [0.3, -0.16]], [8.05, [0.12, -0.42]], [8.3, [-0.3, -0.3]], [8.75, [-0.34, -0.22]],
    [8.95, [0.3, -0.26]], [9.4, [0.33, -0.22]], [9.6, [0.2, -0.5]], [10.0, [0.05, -0.48]]
  ]);
  // the orbit: from 12.0 it lifts off his head and goes round it (anticlockwise on screen), faster and faster, then
  // round over the top toward eleven, where his hands close
  function orbitAngle(t) {
    if (t < 16.6) { const u = seg(t, 12.0, 16.6); return (-90 - 990 * (0.35 * u + 0.65 * u * u)) * D2R; }
    return (-1080 - 120 * (1 - Math.pow(1 - seg(t, 16.6, 17.75), 3))) * D2R;
  }
  function fly(t) {
    if (t < 3.0) return null;
    let p, s = 1;
    const top = (tt) => { const h = head(tt), r = h.r + h.t + 0.035, a = h.a; return [h.c[0] + Math.sin(a) * r, h.c[1] - Math.cos(a) * r]; };
    if (t < 10.0) p = drift(t);
    else if (t < 10.4) { const u = smoother(seg(t, 10.0, 10.4)); p = lrp(drift(10.0), top(t), u); }
    else if (t < 12.0) p = top(t);
    else if (t < 17.95) {
      const h = head(t), c = lrp(h.c, RC, smooth(15.8, 17.2, t)), r = lerp(h.r + h.t + 0.035, RR, smooth(12.0, 12.6, t)), a = orbitAngle(t);
      p = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
      if (t > 17.75) { const j = Math.sin(t * 90) * 0.006; p = [p[0] + j, p[1] - j]; }   // trapped: buzzing
    } else if (t < 19.4) {
      const r = lerp(RR, 0.92, Math.pow(seg(t, 17.95, 18.35), 0.6)), bob = 0.02 * Math.sin((t - 18.35) * 4) * smooth(18.3, 18.6, t);
      p = [RC[0] + r * Math.cos(ESC), RC[1] + r * Math.sin(ESC) + bob];
    } else { const u = smoother(seg(t, 19.4, 21.4)), a = [RC[0] + 0.92 * Math.cos(ESC), RC[1] + 0.92 * Math.sin(ESC)]; p = lrp(a, [-1.38, -0.8], u); p[1] -= 0.18 * Math.sin(PI * u); s = lerp(1, 0.32, u); }
    // a little flutter
    const fl = 1 - smooth(19.4, 21.4, t); p = [p[0] + 0.012 * Math.sin(t * 7.3) * fl, p[1] + 0.01 * Math.cos(t * 5.9) * fl];
    // blinking: a soft pulse, and the two blinks from outside
    const glow = (0.75 + 0.25 * Math.sin(t * 2.6)) * smooth(3.0, 3.5, t) + 0.6 * (bump(t, 18.6, 18.8) + bump(t, 19.0, 19.2) + bump(t, 22.5, 22.8));
    return { p, s, glow };
  }

  // ---- camera ------------------------------------------------------------------------------------------------------
  const camAt = (t) => I.camera(W, H, { cx: 0.004 * Math.sin(t * 0.4), cy: lerp(0.05, -0.02, smooth(2, 18, t)) + 0.003 * Math.cos(t * 0.33), k: Math.exp(lerp(Math.log(430), Math.log(600), smoother(seg(t, 0.5, 19)))), sy: 0.5 });

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(33), o = []; for (let i = 0; i < 280; i++) o.push([r() * W, r() * H, 0.5 + r() * 1.3, 0.15 + r() * 0.45, r() * 6]); return o; })();
  const TINY = I.ring(0.042, 0.015, { seed: 7, N: 60 });
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.2 * (1 - smooth(19.0, 21.0, t)));
    I.background(ctx, THEME, W, H);
    ctx.fillStyle = fg;
    for (const [x, y, r, a, ph] of STARS) { ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(t * 1.1 + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    F.drawMark(ctx, cam, j, fg, bg, 'loop');
    const f = smoother(seg(t, ...T_MARK));
    if (f < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, f); F.draw(ctx, hero(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (f > 0) { ctx.globalAlpha = smooth(0, 0.6, f); F.drawMark(ctx, cam, j, fg, bg, 'figure'); ctx.globalAlpha = 1; }
    // the firefly: a tiny open ring with a glow round it
    const ff = fly(t);
    if (ff) {
      const c = cam(ff.p[0], ff.p[1]), k = cam.k * ff.s, g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 0.22 * k * (0.8 + 0.4 * ff.glow));
      g.addColorStop(0, `rgba(243,241,236,${0.62 * ff.glow})`); g.addColorStop(0.35, `rgba(243,241,236,${0.22 * ff.glow})`); g.addColorStop(1, 'rgba(243,241,236,0)');
      ctx.fillStyle = g; ctx.fillRect(c[0] - 0.3 * k, c[1] - 0.3 * k, 0.6 * k, 0.6 * k);
      ctx.fillStyle = fg; ctx.beginPath(); TINY.outline.forEach((q, i) => { const s = [c[0] + q[0] * k, c[1] + q[1] * k]; if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
    }
    I.vignette(ctx, THEME, W, H, 0.42);
    const fade = 1 - smooth(0, 0.8, t);
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'crickets', dur: 24 },
      { t: 0, type: 'pad', amp: 0.04, chords: [[0, 12.5, [146.83, 220, 261.63, 349.23]], [11.5, 16.8, [174.61, 261.63, 329.63, 440]], [16.2, 18.9, [196, 293.66, 349.23, 493.88]], [18.3, 24.5, [130.81, 196, 261.63, 329.63, 392]]] }];
    ev.push({ t: 3.3, type: 'twinkle', notes: [2093, 2637, 3136] }, { t: 18.7, type: 'twinkle', notes: [2637] }, { t: 19.1, type: 'twinkle', notes: [3136] }, { t: 22.55, type: 'twinkle', notes: [2349] });
    [6.28, 8.05, 8.72, 9.42, 17.95].forEach((t) => ev.push({ t, type: 'zip' }));
    ev.push({ t: 8.0, type: 'clap' }, { t: 8.7, type: 'swish' }, { t: 9.4, type: 'swish' }, { t: 10.4, type: 'tap' }, { t: 16.85, type: 'whoosh', dur: 1.15, amp: 0.22 }, { t: 20.3, type: 'chime', f: 1046.5, amp: 0.12 });
    // its hum, following it round the picture, quicker as it goes faster
    const trk = []; let prev = null;
    for (let t = 0; t < DUR; t += 0.02) { const f = fly(t); if (!f) { trk.push([0, 0, 0]); prev = null; continue; } const sp = prev ? Math.hypot(f.p[0] - prev[0], f.p[1] - prev[1]) / 0.02 : 0; prev = f.p; trk.push([clamp(f.p[0] / 0.8, -0.9, 0.9), f.s * Math.min(1, f.glow), Math.min(1, sp / 3)]); }
    ev.push({ t: 0, type: 'buzz', track: trk });
    // footsteps from his feet
    const air = [false, false];
    for (let t = 6.5; t < 17.2; t += 1 / 240) { const p = pose(t); let lf = [0, 0]; for (const [a, b, f] of STEPS) if (t > a && t < b) lf[f === 'fL' ? 0 : 1] = 1; for (const [a, b] of HOPS) if (t > a && t < b) lf = [1, 1]; lf.forEach((l, i) => { if (l) air[i] = true; else if (air[i]) { air[i] = false; ev.push({ t, type: 'step', amp: 0.3, tone: 1.1 }); } }); }
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'firefly', title: 'Firefly', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, fly };
});
