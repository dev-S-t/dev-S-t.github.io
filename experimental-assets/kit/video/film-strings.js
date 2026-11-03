// FILM 2, Strings. A row of taut strings, floor to sky. He brushes one by accident, finds that it sings, plays his way
// up the row, then runs back down it with his arm out: a glissando that ends on the lowest note. He sits and listens.
// See STORYBOARD.md. Strings are tuned to a pentatonic scale, low on the left, so whatever he plays is in tune.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'));
  else (root.Films = root.Films || {}).strings = factory(root.Rig, root.Ink);
})(this, function (R, I) {
  const W = 1920, H = 1080, FPS = 30, THEME = 'paper', DUR = 24;
  const { smooth, smoother, lerp, clamp } = I;
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lrp(v, b[i], u)) : a + (b - a) * u);
  function keys(t, ks, e = smoother) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], e((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
    return ks[ks.length - 1][1];
  }
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
  const HP = R.B.hip, REST_ARMS = { armL: [-0.32, 0.18], armR: [0.28, 0.22] };
  const rest = (fl, fr, o = {}) => ({ px: 0, py: -HP + 0.008, lean: 0.02, nod: 0, ...REST_ARMS, footL: [fl, 0], footR: [fr, 0], ...o });

  // ---- the strings: x = 0.45 i, from the sky (y = -9) down into the ground (y = 0); pitch rises to the right
  const NS = 21, SP = 0.45, TOP = -9, YP = -0.37;
  const SX = (i) => i * SP;
  const PENTA = [0, 2, 4, 7, 9], NOTE = (i) => 130.81 * Math.pow(2, (12 * Math.floor(i / 5) + PENTA[i % 5]) / 12);

  // ---- his body through the film: x (world), facing (1 right, -1 left), and the legs' pose ------------------------
  const STR = 0.16;
  // A: walk in, six steps, easing to a stop
  const walkA = (t) => (t < 2.65 ? 0.65 * t : 1.7225 + 0.65 * Math.min(t - 2.65, 0.6) - 0.65 * Math.pow(Math.min(t - 2.65, 0.6), 2) / 1.2);
  const X0 = -0.3, XA = X0 + 1.92;                      // 1.62, just past string 3
  // the tune: from 2.07 he trots right; the glissando: from 7.1 he runs left
  const T_TUNE = 9.0, V_TUNE = 0.9, X_TUNE = 2.07;
  const tuneD = (t) => { const tt = Math.max(0, t - T_TUNE); return tt < 0.6 ? V_TUNE * tt * tt / 1.2 : V_TUNE * (tt - 0.3); };
  const T_TUNE_END = 14.75, X_TUNE_END = X_TUNE + tuneD(T_TUNE_END) + 0.18;   // eases to a stop over 0.4
  const T_RUN = 15.75, A_RUN = 4.2, V_RUN = 3.3, X_STOP = -1.0;
  const T_TOP = T_RUN + V_RUN / A_RUN, X_TOP = X_TUNE_END - 0.5 * A_RUN * Math.pow(V_RUN / A_RUN, 2);
  const BRAKE = 1.5, X_BRAKE = X_STOP + V_RUN * V_RUN / (2 * BRAKE * V_RUN / 1.0) ;   // where braking starts
  const T_BRAKE = T_TOP + (X_TOP - X_BRAKE) / V_RUN, T_STILL = T_BRAKE + 2 * (X_BRAKE - X_STOP) / V_RUN;
  function runX(t) {
    if (t < T_RUN) return X_TUNE_END;
    if (t < T_TOP) return X_TUNE_END - 0.5 * A_RUN * (t - T_RUN) ** 2;
    if (t < T_BRAKE) return X_TOP - V_RUN * (t - T_TOP);
    const tt = Math.min(t, T_STILL) - T_BRAKE, Tb = T_STILL - T_BRAKE; return X_BRAKE - V_RUN * tt + 0.5 * (V_RUN / Tb) * tt * tt;
  }

  // ---- the plucks: which string, when the hand takes it, when it lets go, how far it is pulled, which way, which hand
  const PL = [];
  PL.push({ i: 3, tg: 2.56, tr: 2.62, A: 0.028, dir: 1, brush: true });
  PL.push({ i: 3, tg: 4.72, tr: 5.35, A: 0.13, dir: 1, side: 'armR' });
  PL.push({ i: 4, tg: 6.95, tr: 7.25, A: 0.1, dir: -1, side: 'armR' });
  PL.push({ i: 5, tg: 7.97, tr: 8.22, A: 0.1, dir: -1, side: 'armR' });
  // the tune: each string is taken when it is 0.2 ahead and let go when he has carried it 0.09 back
  const tuneX = (t) => X_TUNE + tuneD(t);
  const crossT = (f, target, a, b) => { for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if ((f(m) - target) * (f(a) - target) <= 0) b = m; else a = m; } return (a + b) / 2; };
  for (let i = 6; i <= 15; i++) {
    const tg = crossT(tuneX, SX(i) - 0.2, T_TUNE, T_TUNE_END), tr = crossT(tuneX, SX(i) - 0.11, T_TUNE, T_TUNE_END);
    PL.push({ i, tg, tr, A: 0.075, dir: -1, side: i % 2 ? 'armL' : 'armR', tune: true });
  }
  // the glissando: the hand, held out ahead, drags each string a little and lets it go
  const REACH_RUN = 0.27;
  for (let i = 15; i >= 0; i--) {
    const tg = crossT((t) => runX(t) - REACH_RUN, SX(i), T_RUN, T_STILL), tr = crossT((t) => runX(t) - REACH_RUN, SX(i) - 0.06, T_RUN, T_STILL);
    PL.push({ i, tg, tr, A: 0.06, dir: -1, gliss: true });
  }
  // the neighbours answer a little
  for (const p of PL.slice()) if (!p.brush) for (const n of [p.i - 1, p.i + 1]) if (n >= 0 && n < NS) PL.push({ i: n, tg: p.tr + 0.04, tr: p.tr + 0.05, A: p.A * 0.09, dir: p.dir, echo: true });
  const BY = Array.from({ length: NS }, (_, i) => PL.filter((p) => p.i === i));

  // a string's sideways displacement at height y and time t
  function disp(i, y, t) {
    const xi = (y - TOP) / -TOP, xp = (YP - TOP) / -TOP; let u = 0;
    for (const p of BY[i]) {
      if (t < p.tg) continue;
      if (t < p.tr) { const a = p.dir * p.A * smoother(seg(t, p.tg, p.tr)); u += xi < xp ? a * xi / xp : a * (1 - xi) / (1 - xp); continue; }
      const dt = t - p.tr, fv = 3.4 + 0.16 * i;
      for (let n = 1; n <= 9; n++) { const b = 2 * p.dir * p.A * Math.sin(n * Math.PI * xp) / (n * n * Math.PI * Math.PI * xp * (1 - xp)); u += b * Math.sin(n * Math.PI * xi) * Math.cos(2 * Math.PI * fv * n * dt) * Math.exp(-dt * n / 2.6); }
    }
    return u;
  }
  // how hard a string is still ringing (for the faint blur either side of it)
  function ring(i, t) { let e = 0; for (const p of BY[i]) if (t > p.tr) { const xp = (YP - TOP) / -TOP; e += 2 * p.A * Math.sin(Math.PI * xp) / (Math.PI * Math.PI * xp * (1 - xp)) * Math.exp(-(t - p.tr) / 2.6); } return e; }

  // ---- his performance --------------------------------------------------------------------------------------------
  const step = (t, t0, t1, a, b, h = 0.04) => { const u = seg(t, t0, t1); return [lerp(a, b, smoother(u)), -h * Math.sin(Math.PI * u)]; };
  function body(t) {
    // A walk in
    if (t < 3.3) { const d = walkA(t); return { x: X0 + d, sx: 1, pose: R.mix(R.walk(d, { stride: STR, lean: 0.06, swing: 0.6 }), rest(0.08, -0.08), smooth(3.0, 3.3, t)) }; }
    // B "hm?", turn round to face the string behind him (a hop, feet together in the air)
    if (t < 4.0) {
      const p = rest(0.08, -0.08), tog = bump(t, 3.78, 3.98);
      p.nod = keys(t, [[3.3, 0], [3.5, -0.1], [3.7, -0.04]]); p.lean = keys(t, [[3.3, 0.02], [3.55, -0.05], [3.75, 0.02]]);
      p.py += -0.035 * tog; p.footL = [0.08 * (1 - tog), -0.03 * tog]; p.footR = [-0.08 * (1 - tog), -0.03 * tog];
      return { x: XA, sx: t < 3.88 ? 1 : -1, pose: p };
    }
    // C one step closer (facing left now: his forward is -x)
    if (t < 6.2) {
      // the left foot stays put; the right steps past it (positions measured along the way he faces)
      const dd = 0.1 * smoother(seg(t, 4.0, 4.35)), xb = XA - dd, p = rest(0.08 - dd, 0);
      p.footR = [lerp(-0.08, 0.17, smoother(seg(t, 4.0, 4.35))) - dd, -0.04 * bump(t, 4.0, 4.35)];
      // pulling: weight back; the twang: a start, then a happy bounce
      p.lean = keys(t, [[4.4, 0.06], [4.75, 0.08], [5.3, -0.08], [5.42, -0.16], [5.7, 0.02]]);
      p.nod = keys(t, [[4.4, -0.08], [5.3, -0.1], [5.42, -0.2], [5.7, -0.05], [6.1, 0]]);
      const hop = bump(t, 5.72, 5.92) + bump(t, 5.95, 6.12) * 0.6;
      p.py += -0.04 * hop; p.footL = [p.footL[0], -0.025 * hop]; p.footR = [p.footR[0], p.footR[1] - 0.025 * hop];
      return { x: xb, sx: -1, pose: p };
    }
    // E face right again, step up to string 4, then string 5; a nod: he has got it
    if (t < T_TUNE) {
      const tog = bump(t, 6.2, 6.4), sx = t < 6.3 ? -1 : 1;
      const xb = XA - 0.1 + 0.1 * smoother(seg(t, 6.45, 6.75)) + 0.45 * smoother(seg(t, 7.45, 7.8)); // 1.52, 1.62, then 2.07
      const p = rest(-0.07, 0.07);
      if (t >= 6.4) {
        // feet in the world: the right steps up to the string, then left and right step on to the next
        const fr = t < 7.2 ? step(t, 6.45, 6.75, 1.59, 1.72) : step(t, 7.62, 7.82, 1.72, 2.14), fl = step(t, 7.45, 7.65, 1.45, 2.0);
        p.footL = [fl[0] - xb, fl[1]]; p.footR = [fr[0] - xb, fr[1]];
      } else if (t < 6.3) { p.footL = [-0.02 * (1 - tog), -0.03 * tog]; p.footR = [0.07 * (1 - tog), -0.03 * tog]; }
      else { p.footL = [-0.07 * (1 - tog), -0.03 * tog]; p.footR = [0.07 * (1 - tog), -0.03 * tog]; }
      p.py += -0.035 * tog;
      p.nod = keys(t, [[8.3, 0], [8.45, 0.14], [8.6, -0.04], [8.75, 0.12], [8.95, 0]]);
      return { x: xb, sx, pose: p };
    }
    // F the tune: trot right, plucking as he goes; a hop on the top note; ease to a stop
    if (t < T_RUN) {
      const d = t < T_TUNE_END ? tuneD(t) : tuneD(T_TUNE_END) + 0.18 * (1 - Math.pow(1 - seg(t, T_TUNE_END, T_TUNE_END + 0.4), 2));
      let p = R.run(d + 0.22, { stride: 0.22, lean: 0.1, lift: 0.06 });
      p = R.mix(rest(-0.07, 0.07), p, smooth(T_TUNE, T_TUNE + 0.3, t) * (1 - smooth(T_TUNE_END, T_TUNE_END + 0.4, t)));
      const top = PL.find((q) => q.tune && q.i === 15), hop = bump(t, top.tr - 0.05, top.tr + 0.25);
      p.py += -0.07 * hop; p.footL = [p.footL[0], p.footL[1] - 0.05 * hop]; p.footR = [p.footR[0], p.footR[1] - 0.05 * hop];
      // turn round for the run back
      const tog = bump(t, 15.2, 15.4); const sx = t < 15.3 ? 1 : -1;
      if (t > 15.2) { p.footL = [-0.07 * (1 - tog), -0.03 * tog]; p.footR = [0.07 * (1 - tog), -0.03 * tog]; p.py += -0.035 * tog; }
      if (t > 15.4) { const c = smooth(15.4, 15.7, t); p.py += 0.04 * c; p.lean += 0.3 * c; p.armL = lrp(p.armL, [-0.9, 0.8], c); p.footR = [lerp(0.07, -0.12, c), 0]; }
      return { x: X_TUNE + d, sx, pose: p };
    }
    // G the glissando run, arm out ahead; braking to a stop past the last string
    if (t < 19.0) {
      const x = runX(t), dist = X_TUNE_END - x, v = t < T_TOP ? A_RUN * (t - T_RUN) : t < T_BRAKE ? V_RUN : V_RUN * (1 - seg(t, T_BRAKE, T_STILL));
      let p = R.run(dist, { stride: 0.27, lean: 0.3, lift: 0.1 });
      p = R.mix({ ...rest(0.07, -0.12), py: -HP + 0.048, lean: 0.32, armL: [-0.9, 0.8] }, p, smooth(T_RUN, T_RUN + 0.2, t));
      const brake = smooth(T_BRAKE - 0.1, T_BRAKE + 0.25, t);
      p = R.mix(p, { ...rest(0.1, -0.02), lean: -0.18, nod: -0.1, py: -HP + 0.03, armL: [-1.3, 0.3] }, brake * (1 - smooth(T_STILL + 0.1, T_STILL + 0.6, t)));
      if (t > T_STILL + 0.1) p = R.mix(p, rest(0.07, -0.07), smooth(T_STILL + 0.1, T_STILL + 0.6, t));
      return { x, sx: -1, pose: p, v };
    }
    // H turn to face the strings and listen; I sit down
    const p = rest(0.07, -0.07), tog = bump(t, 19.1, 19.3), sx = t < 19.2 ? -1 : 1;
    if (t < 19.4) { p.py += -0.035 * tog; p.footL = [0.07 * (1 - tog), -0.03 * tog]; p.footR = [-0.07 * (1 - tog), -0.03 * tog]; }
    p.nod = keys(t, [[19.4, 0], [19.8, -0.12], [20.8, -0.1]]) + 0.02 * Math.sin(t * 2.1);
    // sitting: the hips go back and down, the right foot steps forward, the hands find the ground behind him
    const s = smoother(seg(t, 21.0, 22.0));
    if (s > 0) {
      const sit = { px: -0.14, py: -0.03, lean: -0.22, nod: -0.06, footL: [0.04, 0], footR: [0.08, 0], ...REST_ARMS };
      let q = R.mix(p, sit, s); q.footR = [q.footR[0], -0.04 * bump(s, 0, 0.55)];
      const hs = smooth(0.3, 1, s);
      if (hs > 0) { const hl = R.hand(q, 'armL'), hr = R.hand(q, 'armR'); q = R.reach(q, 'armL', lerp(hl[0], -0.31, hs), lerp(hl[1], -0.01, hs)); q = R.reach(q, 'armR', lerp(hr[0], -0.27, hs), lerp(hr[1], -0.01, hs)); }
      q.lean += 0.012 * Math.sin(t * 1.7) * s;
      return { x: X_STOP, sx, pose: q };
    }
    return { x: X_STOP, sx, pose: p };
  }

  // the hands: on a string while plucking it; held out ahead for the glissando
  function hero(t) {
    const b = body(t); let p = b.pose;
    for (const q of PL) {
      if (q.echo || q.brush || !q.side) continue;
      const pre = q.tune ? 0.18 : 0.3, post = q.tune ? 0.22 : 0.4;
      if (t < q.tg - pre || t > q.tr + post) continue;
      const sxw = SX(q.i) + q.dir * q.A * smoother(seg(t, q.tg, q.tr));     // where the string is at the hand
      const target = [(sxw - b.x) * b.sx, YP], restHand = R.hand(p, q.side);
      let w = t < q.tg ? smoother(seg(t, q.tg - pre, q.tg)) : t <= q.tr ? 1 : 1 - smoother(seg(t, q.tr, q.tr + post));
      // after letting go the hand flicks on past the string a little
      if (t > q.tr) { const f = seg(t, q.tr, q.tr + 0.12); target[0] += -0.06 * Math.sin(Math.PI * f) * b.sx * q.dir; target[1] += -0.05 * Math.sin(Math.PI * f); }
      const tgt = [lerp(restHand[0], target[0], w), lerp(restHand[1], target[1], w)];
      p = R.reach(p, q.side, tgt[0], tgt[1]);
    }
    if (t > T_RUN + 0.05 && t < T_STILL + 0.3) {
      const w = smooth(T_RUN + 0.05, T_RUN + 0.35, t) * (1 - smooth(T_BRAKE, T_BRAKE + 0.3, t)), h0 = R.hand(p, 'armR');
      p = R.reach(p, 'armR', lerp(h0[0], REACH_RUN, w), lerp(h0[1], YP, w));
    }
    return { ...b, pose: p };
  }

  // ---- camera -----------------------------------------------------------------------------------------------------
  function camAt(t) {
    const avg = (t0, span) => { let a = 0; for (let k = 0; k < 7; k++) a += body(Math.max(0, t0 - span * k / 6)).x; return a / 7; };
    const hx = avg(t, 0.4);
    const k = keys(t, [[3.4, 240], [4.5, 360], [6.2, 360], [7.0, 330], [9.0, 330], [10.0, 285], [15.2, 285], [16.0, 215], [18.6, 215], [20.2, 150], [24, 140]]);
    const lead = keys(t, [[3.0, 0.15], [4.6, -0.1], [6.2, -0.1], [7.0, 0.15], [9.0, 0.15], [10.0, 0.55], [15.0, 0.55], [16.0, -0.9], [18.0, -0.5]]);
    const cx = lerp(hx + lead, 3.9, smoother(seg(t, 18.6, 20.4)));
    return I.camera(W, H, { cx: lerp(0.6, cx, smooth(0, 3.4, t)), cy: 0, k, sx: 0.5, sy: keys(t, [[3.4, 0.78], [4.6, 0.72], [9.0, 0.72], [10.0, 0.76], [18.6, 0.76], [20.2, 0.84]]) });
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.2);
    I.background(ctx, THEME, W, H);
    const yTop = Math.max(TOP, (0 - H * 0.86) / cam.k), y0 = 0.02;
    // the ground
    ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1.5, 0.008 * cam.k);
    ctx.beginPath(); for (let x = -40; x <= 40; x += 0.5) { const s = j(cam(x, 0)); if (x === -40) ctx.moveTo(s[0], s[1]); else ctx.lineTo(s[0], s[1]); } ctx.stroke(); ctx.globalAlpha = 1;
    // the strings, thicker for the low ones; a faint blur either side of one that is ringing
    for (let i = 0; i < NS; i++) {
      const x = SX(i), sc = cam(x, 0); if (sc[0] < -80 || sc[0] > W + 80) continue;
      const e = ring(i, t);
      if (e > 0.002) {
        ctx.globalAlpha = Math.min(0.16, e * 2.2); ctx.fillStyle = fg; ctx.beginPath();
        for (let k = 0; k <= 40; k++) { const y = lerp(yTop - 0.5, y0, k / 40), s = cam(x + e * Math.sin(Math.PI * (y - TOP) / -TOP), y); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }
        for (let k = 40; k >= 0; k--) { const y = lerp(yTop - 0.5, y0, k / 40), s = cam(x - e * Math.sin(Math.PI * (y - TOP) / -TOP), y); ctx.lineTo(s[0], s[1]); }
        ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = fg; ctx.lineWidth = Math.max(1.1, (0.0135 - 0.0004 * i) * cam.k); ctx.beginPath();
      for (let k = 0; k <= 70; k++) { const y = lerp(yTop - 0.5, y0, Math.pow(k / 70, 0.8)), s = j(cam(x + disp(i, y, t), y)); if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }
      ctx.stroke();
      const peg = j(cam(x, 0)); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(peg[0], peg[1], Math.max(2, 0.022 * cam.k), 0, 7); ctx.fill();
    }
    const h = hero(t);
    I.figure(ctx, h.pose, I.onGround(h.x, 0, h.sx), cam, j, fg);
    I.vignette(ctx, THEME, W, H, 0.22);
    const fade = Math.max(1 - smooth(0, 0.6, t), smooth(23.1, 24.0, t));
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues -------------------------------------------------------------------------------------------------
  function events() {
    const ev = [];
    for (const p of PL) {
      const amp = p.echo ? 0.035 : p.brush ? 0.12 : p.gliss ? 0.24 : p.tune ? 0.27 : 0.36;
      ev.push({ t: p.tr, type: 'pluck', f: NOTE(p.i), amp, pan: clamp((SX(p.i) - 4.5) / 7, -0.8, 0.8), decay: 0.9965 + Math.min(0.0025, 0.0008 * (5 - Math.floor(p.i / 5))), bright: p.gliss ? 0.7 : 0.45, len: 4 });
    }
    // footsteps
    const air = [false, false];
    for (let t = 0; t < DUR; t += 1 / 240) {
      const b = body(t), f = [b.pose.footL[1], b.pose.footR[1]];
      f.forEach((y, i) => { if (y < -0.006) air[i] = true; else if (air[i] && y > -0.0008) { air[i] = false; ev.push({ t, type: 'step', amp: t > T_RUN && t < T_STILL ? 0.5 : 0.32, tone: 1.4, pan: clamp((b.x - 4.5) / 8, -0.7, 0.7) }); } });
    }
    ev.push({ t: 21.6, type: 'step', amp: 0.4, tone: 0.8 }, { t: 21.75, type: 'step', amp: 0.25, tone: 1.2 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'strings', title: 'Strings', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, body, PL };
});
