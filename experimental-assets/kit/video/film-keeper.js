// FILM 8, Keeper. What the mark means, told by the site's own picture: a field of lines that never stops changing
// (the home page's tunnel), and one human at the edge, watching it. A clock ticks; the field quickens. On the
// eleventh tick he dives in. Falling down the 30 degree line, the rings stretch into streamlines and part round him,
// and the pressure draws his loop: from the front, round both sides, meeting at the back, so its opening is the
// wake at eleven o'clock. The loop takes the heat; he lands on its leading curve and rides it (the legs); the wind
// sweeps his arms back and bends them into the loop's own shape (in sync with the field he keeps); his head watches
// ahead. The fall slows and the field curls into calm rings round him. Kept. What is left is the mark.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).keeper = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 30, THEME = 'paper';
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const w = (x, y) => ({ x, y, w: true }), lc = (x, y) => ({ x, y });
  const D = [Math.sin(PI / 6), Math.cos(PI / 6)];                // down the 30 degree line
  const RL = MB.MK.loop.r + MB.MK.loop.w / 2;                    // the loop's outer edge: the field stops there
  const CT = [3.1, 1.75];                                         // the tunnel's centre, out over the drop

  // ---- the cliff -----------------------------------------------------------------------------------------------------
  const CLIFF = (() => { const r = I.rng(3), top = [], face = []; for (let x = -14; x <= 0; x += 0.12) top.push([x, 0.02 * Math.sin(x * 3.1) + 0.015 * (r() - 0.5) + (x > -0.6 ? 0 : 0.02 * Math.sin(x * 7))]); for (let y = 0; y <= 14; y += 0.18) face.push([-0.04 - 0.25 * Math.sin(y * 0.7) - 0.06 * (r() - 0.5) - y * 0.12, y]); return [...top, ...face, [-14, 14]]; })();

  // ---- his path ------------------------------------------------------------------------------------------------------
  const T = { tick: 1.0, lean: [8.0, 9.2], back: [9.2, 10.0], crouch: [10.0, 10.55], run: [10.55, 11.0], jump: 11.0, loop: [12.35, 13.7], land: [13.4, 14.2],
    sweep: [14.6, 15.7], reach: [15.7, 16.8], round: [16.8, 17.8], slow: [18.6, 23.0], calm: [19.0, 23.5], settle: [23.0, 23.8], mark: [25.0, 26.0] };
  const EDGE = -0.22, BACK = -0.95, HIP = 0.33;
  // after the jump: an arc off the edge, then straight down the line, quick, then slowing to a stop
  const speed = (t) => (t < 12 ? lerp(3.3, 4.2, seg(t, 11.45, 12)) : t < 18.6 ? 4.6 * (1 - 0.0 * t) - 0.4 * (1 - smooth(12, 13.5, t)) : 4.6 * Math.pow(1 - seg(t, 18.6, 23.0), 2));
  const PATH = (() => { const out = [], dt = 1 / 240; let p = null; for (let t = T.jump; t <= DUR + 0.01; t += dt) { const tau = t - T.jump; if (tau < 0.45) p = [EDGE + 0.05 + 2.0 * tau, -HIP - 2.2 * tau + 4.9 * tau * tau]; else p = [p[0] + D[0] * speed(t) * dt, p[1] + D[1] * speed(t) * dt]; out.push(p); } return out; })();
  const along = (t) => { if (t <= T.jump) return [EDGE + 0.05, -HIP]; const f = (t - T.jump) * 240, i = Math.min(PATH.length - 2, Math.floor(f)); return lp(PATH[i], PATH[i + 1], f - i); };
  // the loop's centre: his body's centre while he dives, then the loop he rides
  const loopC = (t) => along(t);
  // the flow's strength (1 while falling at full speed) and the loop's radius as the pressure builds it
  const U = (t) => clamp(speed(Math.max(t, T.jump + 0.46)) / 4.6, 0, 1) * smooth(T.jump + 0.2, T.jump + 1.1, t);
  const RAD = (t) => RL * smoother(seg(t, T.loop[0] - 0.4, T.loop[1]));

  const stand = (x, o = {}) => ({ root: { x, y: -HIP, rot: 0, sx: 1 }, lean: 0.02, bend: 0.4, nod: 0.06, feet: { L: w(x - 0.07, 0.02), R: w(x + 0.08, 0.02) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.05), B: lc(-0.1, 0.06) }, elbow: { F: -1, B: 1 }, ...o });
  const M0 = MB.MARK_POSE(0, 0), MH = (k) => [M0.hands[k].x, M0.hands[k].y], MF = (k) => [M0.feet[k].x, M0.feet[k].y], MHIP = [M0.root.x, M0.root.y];
  function pose(t) {
    // on the cliff: watching; leaning over the edge; backing up; a crouch; the run; the jump
    if (t < T.jump) {
      let x = EDGE;
      const back = smoother(seg(t, ...T.back)), run = seg(t, ...T.run);
      if (t >= T.back[0] && t < T.run[0]) x = lerp(EDGE, BACK, back);
      if (t >= T.run[0]) x = lerp(BACK, EDGE + 0.05, run * run * (3 - 2 * run));
      const p = stand(x);
      p.nod = 0.06 + 0.04 * Math.sin(t * 0.9) * (1 - smooth(7, 8, t));
      const lean = bump(t, T.lean[0], T.lean[1] + 0.2);
      p.lean += 0.38 * lean; p.nod += 0.35 * lean; p.hands = { F: lc(lerp(0.13, -0.22, lean), lerp(0.05, -0.05, lean)), B: lc(lerp(-0.1, -0.3, lean), lerp(0.06, -0.08, lean)) };
      // steps: back, then the run (feet alternate)
      const ph = t < T.run[0] ? back * 2 : 2 + run * 3, sw = Math.sin(PI * (ph % 1)), even = Math.floor(ph) % 2 === 0;
      if (t >= T.back[0] && t < T.jump) { p.feet = { L: w(x - 0.07 + (even ? 0.08 : -0.04) * sw * (t < T.run[0] ? -1 : 1), -0.05 * (even ? sw : 0)), R: w(x + 0.08 + (even ? -0.04 : 0.08) * sw * (t < T.run[0] ? -1 : 1), -0.05 * (even ? 0 : sw)) }; }
      const crouch = bump(t, T.crouch[0], T.run[0] + 0.15);
      p.root.y += 0.07 * crouch; p.lean += 0.35 * crouch + 0.25 * smooth(T.run[0], T.jump, t); p.nod -= 0.2 * crouch;
      if (crouch > 0) p.hands = { F: lc(-0.18, 0.02), B: lc(-0.26, 0.0) };
      if (t >= T.run[0]) p.hands = { F: lc(0.22 * Math.sin(run * 9), -0.05), B: lc(-0.22 * Math.sin(run * 9), -0.03) };
      return p;
    }
    // the dive: off the edge, turning head first down the line, arms ahead
    const c = loopC(t), diveRot = Math.atan2(D[0], -D[1]);
    if (t < T.land[0]) {
      const u = smoother(seg(t, T.jump, T.jump + 0.7)), rot = lerp(0.5, diveRot, u);
      return { root: { x: c[0], y: c[1], rot, sx: 1 }, lean: 0, bend: 0.5, nod: -0.15, feet: { L: lc(-0.07, 0.3), R: lc(0.06, 0.31) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.07, -0.62), B: lc(-0.05, -0.6) }, elbow: { F: 1, B: -1 }, tumble: true };
    }
    // the turn feet-first onto the loop's leading curve, then riding it in the stance of the mark
    const land = smoother(seg(t, ...T.land)), hip = [c[0] + MHIP[0], c[1] + MHIP[1]];
    const wob = 0.06 * Math.sin(t * 7.3) * (1 - smooth(16.5, 18.5, t)) * smooth(T.land[1], T.land[1] + 0.4, t);
    const p = { root: { x: lerp(c[0], hip[0], land), y: lerp(c[1], hip[1], land), rot: lerp(diveRot - 2 * PI, 0, land), sx: 1 }, lean: lerp(0, MB.MARK_LEAN, land) + wob, bend: 1, nod: -MB.MARK_LEAN * land - 0.6 * wob,
      feet: { L: w(c[0] + MF('L')[0], c[1] + MF('L')[1]), R: w(c[0] + MF('R')[0], c[1] + MF('R')[1]) }, knee: { L: -1, R: 1 }, fore: { L: 0.85 * land, R: 0 }, elbow: { F: 1, B: -1 }, armLen: { F: 0.36, B: 0.36 } };
    if (land < 1) { p.feet = { L: lc(lerp(-0.07, 0.0, land), lerp(0.3, 0.12, land)), R: lc(lerp(0.06, 0.2, land), lerp(0.31, 0.08, land)) }; if (land > 0.85) p.feet = { L: w(c[0] + MF('L')[0], c[1] + MF('L')[1]), R: w(c[0] + MF('R')[0], c[1] + MF('R')[1]) }; }
    // the arms: out for balance, then the wind takes them back over his head (elbows bent), further back toward
    // eleven (the elbows open), and bends them into the loop's own shape
    const sweep = smoother(seg(t, ...T.sweep)), reach = smoother(seg(t, ...T.reach)), round = smoother(seg(t, ...T.round));
    const at = (q) => [c[0] + q[0], c[1] + q[1]];
    let hF = at([0.33, 0.05]), hB = at([-0.34, 0.08]), lF = 0.36, lB = 0.36;
    if (t < T.sweep[0]) { const fl = Math.sin(t * 11); hF = at([0.33, 0.05 - 0.12 * fl]); hB = at([-0.34, 0.08 + 0.12 * fl]); }
    hF = lp(hF, at([0.14, -0.38]), sweep); hB = lp(hB, at([-0.24, -0.33]), sweep); lF = lerp(0.36, 0.78, sweep); lB = lerp(0.36, 0.66, sweep);
    hF = lp(hF, at(MH('F')), reach); hB = lp(hB, at(MH('B')), reach); lF = lerp(lF, MB.B.armF, reach); lB = lerp(lB, MB.B.armB, reach);
    // the arm reaches where it can: long enough to bend at the elbow
    const sh = [p.root.x, p.root.y - MB.B.spine * (1 - MB.B.sh)], dd = (h) => Math.hypot(h[0] - sh[0], h[1] - sh[1]);
    p.hands = { F: w(...hF), B: w(...hB) }; p.armLen = { F: Math.max(lF, dd(hF) * 1.06), B: Math.max(lB, dd(hB) * 1.06) }; p.round = { F: round, B: round };
    p.sh = lerp(0.3, MB.B.sh, sweep);
    return p;
  }
  function hero(t) {
    const p = pose(t), c = loopC(t);
    let ln = MB.body(p);
    if (t > T.settle[0]) ln = MB.settle(ln, smoother(seg(t, ...T.settle)), c[0], c[1]);
    return ln;
  }

  // ---- the field -----------------------------------------------------------------------------------------------------
  const STEP = 0.085, RING = 0.034;                  // line spacing; the calm rings at the end sit closer
  // the tunnel: rings round its centre, wavering, moving outward; faster as the clock runs
  const tunnelPhase = (t) => 0.5 * t + 1.6 * Math.max(0, t - 6) * seg(t, 6, 11) + 0.9 * Math.max(0, t - 9) * seg(t, 9, 11);
  function F(t) {
    const c = loopC(t), u = U(t), R = RAD(t), wF = smoother(seg(t, T.jump + 0.15, T.jump + 1.5)), calm = seg(t, ...T.calm), reachR = RL + 9 * calm * calm;
    const n = [-D[1], D[0]];                                      // across the line of the fall
    return (x, y) => {
      let f = 0;
      if (wF < 1) { const dx = x - CT[0], dy = y - CT[1], r = Math.hypot(dx, dy); f += (1 - wF) * (r * (1 + 0.035 * FL.fbm(x * 0.6, y * 0.6, 3)) + 0.06 * FL.fbm(2.2 * dx / (r + 1e-6) + 9, 2.2 * dy / (r + 1e-6) + r * 0.3, 5)); }
      if (wF > 0) {
        const dx = x - c[0], dy = y - c[1], r2 = Math.max(dx * dx + dy * dy, 1e-6), yy = dx * n[0] + dy * n[1];
        const flow = yy * (1 - R * R / r2), rings = Math.sqrt(r2), wC = calm >= 1 ? 1 : calm <= 0 ? 0 : smoother(clamp((reachR - rings) / 1.4, 0, 1));
        f += wF * ((1 - wC) * flow + wC * (rings - RL) * STEP / RING);
      }
      return f;
    };
  }
  const phaseAt = (t) => { const wF = smoother(seg(t, T.jump + 0.15, T.jump + 1.5)), wC = smoother(seg(t, ...T.calm)); return (1 - wF) * tunnelPhase(t) / STEP * STEP + wF * wC * (0.25 * (t - T.calm[0])); };

  // ---- camera ------------------------------------------------------------------------------------------------------
  function camAt(t) {
    const avg = (span) => { let a = [0, 0]; for (let k = 0; k < 9; k++) { const q = loopC(Math.max(T.jump, t - span * k / 8)); a[0] += q[0] / 9; a[1] += q[1] / 9; } return a; };
    const wide = { c: [1.45, 0.45], k: 215 }, edge = { c: [0.55, -0.32], k: 345 }, a = smoother(seg(t, 3.6, 7.4));
    let c = lp(wide.c, edge.c, a), k = Math.exp(lerp(Math.log(wide.k), Math.log(edge.k), a));
    const f = smoother(seg(t, T.jump - 0.1, T.jump + 1.1));
    if (f > 0) { const q0 = loopC(t), q = [q0[0] - D[0] * 0.12 * U(t), q0[1] - D[1] * 0.12 * U(t)]; c = lp(c, q, f); k = Math.exp(lerp(Math.log(k), Math.log(lerp(330, 400, smooth(12.5, 14.5, t))), f)); }
    const end = smoother(seg(t, 19, 25)); k = Math.exp(lerp(Math.log(k), Math.log(560), end));
    const shake = 0.012 * bump(t, T.loop[0], T.land[1]) * Math.sin(t * 77);
    return I.camera(W, H, { cx: c[0] + shake, cy: c[1] - 0.02 * end, k, sy: 0.5 });
  }

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const STREAKS = (() => { const r = I.rng(41), o = []; for (let i = 0; i < 120; i++) o.push([r() * 2 - 1, r(), r()]); return o; })();
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.0 * (1 - smooth(24.0, 25.6, t)));
    I.background(ctx, THEME, W, H);
    const c = loopC(t), R = RAD(t);
    // the field: contours of F; nothing inside the loop, and a little room round him before it forms
    const mask = (x, y) => { const d = Math.hypot(x - c[0], y - c[1]); if (R > 0.02) return d < R + 0.02 ? 0 : clamp((d - R) / 0.12, 0, 1); if (t > T.jump) return clamp((d - 0.25) / 0.25, 0, 1); return 1; };
    FL.contours(ctx, F(t), cam, W, H, { step: STEP, phase: phaseAt(t) / STEP, cell: 7, mask, width: Math.max(1.1, 1.25 * cam.k / 330), color: fg, j });
    // speed: streaks running past him up the line, bending round the loop
    const sp = U(t);
    if (sp > 0.03) {
      const n = [-D[1], D[0]], span = 2 * W / cam.k;
      ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = 1.5;
      for (const [a, b, k] of STREAKS) {
        const along = (((b + t * 2.6 * (0.6 + 0.4 * k)) % 1) - 0.5) * span, across = a * W / cam.k * 0.7;
        const q = (s) => { let x = -D[0] * s + n[0] * across, y = -D[1] * s + n[1] * across; const r2 = x * x + y * y; if (R > 0.02 && r2 < (R * 1.6) ** 2) { const f = 1 + R * R / Math.max(r2, R * R) * 0.9; const yy = x * n[0] + y * n[1]; x += n[0] * yy * (f - 1); y += n[1] * yy * (f - 1); } return [c[0] + x, c[1] + y]; };
        const p0 = q(along), p1 = q(along + 0.12 + 0.25 * sp), A = cam(p0[0], p0[1]), B2 = cam(p1[0], p1[1]);
        if (Math.hypot(p0[0] - c[0], p0[1] - c[1]) < R + 0.05) continue;
        ctx.globalAlpha = 0.5 * sp; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the cliff
    if (t < T.jump + 3) { ctx.fillStyle = fg; ctx.beginPath(); CLIFF.forEach((q, i) => { const s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); }
    // the heat at the loop's leading edge while it forms and takes the brunt
    const heat = smooth(T.loop[0] - 0.3, T.loop[0] + 0.4, t) * (1 - smooth(15.5, 18.6, t)) * sp;
    if (heat > 0.01) { const lead = cam(c[0] + D[0] * RL, c[1] + D[1] * RL), g = ctx.createRadialGradient(lead[0], lead[1], 0, lead[0], lead[1], 0.55 * cam.k); g.addColorStop(0, `rgba(13,13,12,${0.16 * heat})`); g.addColorStop(1, 'rgba(13,13,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // the loop: drawn by the pressure, from the leading point round both sides to the back
    if (R > 0.01) {
      const open = smoother(seg(t, T.loop[0], T.loop[1])), lead = Math.atan2(D[1], D[0]), sc = cam(c[0], c[1]);
      ctx.save(); ctx.beginPath(); ctx.moveTo(sc[0], sc[1]); ctx.arc(sc[0], sc[1], 2 * RL * cam.k, lead - PI * open - 0.02, lead + PI * open + 0.02); ctx.closePath(); ctx.clip();
      MB.drawMark(ctx, cam, j, fg, bg, 'loop', c, 0); ctx.restore();
    }
    // him; at the end the mark's brush strokes over him
    const mk = smoother(seg(t, ...T.mark));
    if (mk < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, mk); MB.draw(ctx, hero(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (mk > 0) { ctx.globalAlpha = smooth(0, 0.6, mk); MB.drawMark(ctx, cam, j, fg, bg, 'figure', c, 0); ctx.globalAlpha = 1; }
    I.vignette(ctx, THEME, W, H, 0.2);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(29.2, 30, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.035, chords: [[0, 11.4, [73.42, 110, 146.83, 174.61]], [11, 19.5, [65.41, 98, 130.81, 155.56]], [19, 30.5, [65.41, 130.81, 196, 261.63, 329.63, 392]]] }];
    for (let k = 1; k <= 11; k++) ev.push({ t: T.tick + (k - 1) * (T.jump - T.tick) / 10, type: 'tick', amp: 0.18 + 0.05 * k, last: k === 11 });
    ev.push({ t: T.run[0], type: 'step', amp: 0.4, tone: 1.1 }, { t: T.run[0] + 0.15, type: 'step', amp: 0.45, tone: 1.1 }, { t: T.run[0] + 0.3, type: 'step', amp: 0.5, tone: 1.1 });
    ev.push({ t: T.jump, type: 'fallwind', dur: T.slow[1] - T.jump + 1, track: Array.from({ length: Math.ceil(DUR * 20) }, (_, i) => U(i / 20)) });
    ev.push({ t: T.loop[0], type: 'fwoom' }, { t: T.land[1] - 0.25, type: 'land', amp: 0.5 }, { t: T.sweep[0], type: 'whoosh', dur: 2.6, amp: 0.18 }, { t: T.calm[0], type: 'swell', dur: 4.5 }, { t: T.mark[0] + 0.3, type: 'chime', f: 1046.5, amp: 0.1 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'keeper', title: 'Keeper', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, loopC };
});
