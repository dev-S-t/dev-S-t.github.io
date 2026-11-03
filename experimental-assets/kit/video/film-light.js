// FILM 4, First Light. Night: he sleeps curled up inside his ring. At dawn a beam comes in through the opening at
// eleven and creeps across the floor to his face. He wakes, sits up, rubs his head, yawns, gets up, feels the warmth
// and does the big morning stretch: a step forward and both arms up and round, as far as they will go, toward the
// light. Held there, every opening lines up with the beam; the light gets all the way in and day spreads out from
// him. What is left is the mark. See STORYBOARD.md.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'), require('./markfig.js'));
  else (root.Films = root.Films || {}).light = factory(root.Rig, root.Ink, root.MarkFig);
})(this, function (R, I, F) {
  const W = 1920, H = 1080, FPS = 30, DUR = 24;
  const { smooth, smoother, lerp, clamp } = I, PI = Math.PI;
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lrp(v, b[i], u)) : a + (b - a) * u);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  // keyframed pose: [[t, {fields}], ...]; each field eased between the keys that set it
  function track(keys) {
    const fields = [...new Set(keys.flatMap(([, o]) => Object.keys(o)))], per = {};
    for (const f of fields) per[f] = keys.filter(([, o]) => f in o).map(([t, o]) => [t, o[f]]);
    return (t) => { const out = {}; for (const f of fields) { const ks = per[f]; if (t <= ks[0][0]) { out[f] = ks[0][1]; continue; } let v = ks[ks.length - 1][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { v = lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); break; } out[f] = v; } return out; };
  }

  // ---- his performance ---------------------------------------------------------------------------------------------
  const DOWN = PI / 2, T = F.TARGET, FIN = { lean: Math.atan2(-(T.spine[T.spine.length - 1][0] - T.spine[0][0]), T.spine[T.spine.length - 1][1] - T.spine[0][1]) };
  FIN.torso = Math.hypot(T.spine[T.spine.length - 1][0] - T.spine[0][0], T.spine[T.spine.length - 1][1] - T.spine[0][1]);
  const HIP = T.spine[T.spine.length - 1], FOOT_L = T.legL[T.legL.length - 1][0], FOOT_R = T.legR[T.legR.length - 1][0];
  const KR = -1 / F.ARM_R;                         // the bend of the mark's arm ring
  const pose = track([
    // asleep, lying back in the curve of the floor, head on the slope, knees up, hands on his belly
    [0, { ax: 0.0, px: 0, py: 0.0, lean: -PI / 2 + 0.55, nod: 0.36, torso: 0.259, sh: 0.35, fL: [0.18, 0], fR: [0.22, 0], armF: [0.25, 1.9, 0.29], armB: [0.75, 1.2, 0.29] }],
    [7.0, { lean: -PI / 2 + 0.55, nod: 0.36, fL: [0.18, 0] }],
    // stirs: a knee shifts, the head rolls
    [7.5, { lean: -PI / 2 + 0.62, nod: 0.5, fL: [0.15, 0] }],
    // sits up, straight into the light; it is in his face and he turns his head down from it
    [8.8, { lean: -0.02, nod: 0.08, armF: [DOWN + 0.5, 0.4, 0.29], armB: [DOWN + 0.75, 0.4, 0.29] }],
    [9.2, { nod: 0.3, lean: 0.06 }],
    [9.6, { nod: 0.3 }],
    // lifts his face back into it, and yawns
    [10.2, { nod: -0.42, lean: -0.15, armF: [0.55, 1.3, 0.29], armB: [DOWN + 0.95, 0.3, 0.3] }],
    [10.6, { nod: -0.38, lean: -0.13 }],
    // gets up: weight forward, feet in under him, push, stand
    [11.15, { lean: 0.6, nod: 0.12, fL: [-0.06, 0], armF: [0.35, 0.6, 0.29], armB: [0.6, 0.6, 0.29] }],
    [12.2, { py: -0.21, lean: 0.06, nod: 0, fR: [0.07, 0], armF: [DOWN - 0.1, 0.5, 0.29], armB: [DOWN + 0.15, -0.5, 0.29] }],
    [12.6, { lean: 0.02, py: -0.218 }],
    // the warmth on his head: he turns his face up to it, arms open a little
    [13.6, { nod: 0, lean: 0.02 }],
    [14.5, { nod: -0.32, lean: -0.05, armF: [DOWN - 0.35, 0.4, 0.29], armB: [DOWN + 0.4, -0.4, 0.29] }],
    // breathes in: knees give, arms drop back
    [15.2, { py: -0.19, lean: 0.1, nod: -0.1, armF: [DOWN + 0.25, 0.2, 0.29], armB: [DOWN + 0.45, -0.2, 0.29] }],
    // the stretch: a step forward up the floor; arms out wide; then up and round, along the ring, longer and longer
    [16.05, { py: -0.235, lean: -0.06, nod: -0.16, torso: 0.28, armF: [-0.04, 0, 0.36], armB: [PI + 0.04, 0, 0.36] }],
    [16.35, { armF: [0, KR, 0.42], armB: [PI, -KR, 0.42] }],
    [17.7, { ax: HIP[0], py: HIP[1] - F.floorY(HIP[0]), lean: FIN.lean, nod: -FIN.lean, torso: FIN.torso, sh: F.SH_AT, fL: [FOOT_L, 0], fR: [FOOT_R, 0], armF: [0, KR, F.LENGTH.armF], armB: [PI, -KR, F.LENGTH.armB] }]
  ]);
  const T_STEP_R = [15.35, 15.85], T_STEP_L = [-1, -1], T_PULL = [10.75, 11.1], T_PULL_R = [11.1, 11.45];
  const T_TREMBLE = [17.7, 18.35], T_SETTLE = [18.3, 19.0], T_BLOOM = [19.5, 21.0], T_MARK = [20.5, 21.5];
  function hero(t) {
    const p = pose(t);
    // feet that step lift on the way
    if (t > T_PULL[0] && t < T_PULL[1]) p.fL = [lerp(0.15, -0.06, smoother(seg(t, ...T_PULL))), 0.05 * bump(t, ...T_PULL)];
    if (t > T_PULL_R[0] && t < T_PULL_R[1]) p.fR = [lerp(0.22, 0.07, smoother(seg(t, ...T_PULL_R))), 0.05 * bump(t, ...T_PULL_R)];
    if (t > T_STEP_R[0] && t < T_STEP_R[1]) p.fR = [lerp(0.07, FOOT_R, smoother(seg(t, ...T_STEP_R))), 0.07 * bump(t, ...T_STEP_R)];
    if (t > T_STEP_L[0] && t < T_STEP_L[1]) p.fL = [lerp(0.03, FOOT_L, smoother(seg(t, ...T_STEP_L))), 0.03 * bump(t, ...T_STEP_L)];
    // breathing while he sleeps
    const asleep = 1 - smooth(6.8, 7.4, t), br = Math.sin(2 * PI * t / 3.6);
    p.lean += 0.03 * br * asleep; p.nod += 0.02 * br * asleep;
    // sleepy sway once he is up, and a shake
    const sway = smooth(12.5, 12.8, t) * (1 - smooth(13.4, 13.7, t)); p.lean += 0.05 * Math.sin(5.2 * t) * sway;
    const shake = bump(t, 13.15, 13.45); p.px += 0.012 * Math.sin(60 * t) * shake; p.armF = [p.armF[0] + 0.25 * Math.sin(55 * t) * shake, p.armF[1], p.armF[2]]; p.armB = [p.armB[0] - 0.25 * Math.sin(55 * t) * shake, p.armB[1], p.armB[2]];
    // the tremble at the top of the stretch
    const tr = bump(t, ...T_TREMBLE) * (1 - seg(t, ...T_TREMBLE) * 0.5);
    if (tr > 0) { const q = Math.sin(68 * t), r = Math.sin(53 * t + 1); p.armF = [p.armF[0] + 0.012 * q * tr, p.armF[1] + 0.03 * r * tr, p.armF[2]]; p.armB = [p.armB[0] - 0.012 * r * tr, p.armB[1] - 0.03 * q * tr, p.armB[2]]; p.py -= 0.006 * tr; }
    return F.settle(F.lines(p), smoother(seg(t, ...T_SETTLE)));
  }

  // ---- light: the beam swings in through the opening, pivoting on it as the sun comes up -----------------------------
  const G0 = [0.71 * Math.cos(-2 * PI / 3), 0.71 * Math.sin(-2 * PI / 3)], HALF = 0.16;
  const beamAngle = (t) => lerp(22, 60, smoother(seg(t, 4.2, 7.0))) * PI / 180;
  const beamAlpha = (t) => 0.16 * smooth(3.6, 5.4, t) + 0.22 * smooth(18.9, 19.6, t);
  const dawn = (t) => smooth(2.6, 9.0, t) * 0.7 + 0.3 * smooth(9, 16, t);
  function floorHit(a) { const d = [Math.cos(a), Math.sin(a)], b = G0[0] * d[0] + G0[1] * d[1], c = G0[0] ** 2 + G0[1] ** 2 - 0.666 ** 2; return [G0[0] + d[0] * (-b + Math.sqrt(b * b - c)), G0[1] + d[1] * (-b + Math.sqrt(b * b - c))]; }

  // ---- camera ------------------------------------------------------------------------------------------------------
  const camAt = (t) => I.camera(W, H, { cx: 0.004 * Math.sin(t * 0.4), cy: lerp(0.06, 0, smooth(9, 18, t)) + 0.003 * Math.cos(t * 0.33), k: Math.exp(lerp(Math.log(400), Math.log(620), smoother(seg(t, 0.5, 20.5)))), sy: 0.5 });

  // ---- drawing -----------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(21), o = []; for (let i = 0; i < 260; i++) o.push([r() * W, r() * H, 0.5 + r() * 1.3, 0.15 + r() * 0.45, r() * 6]); return o; })();
  const MOTES = (() => { const r = I.rng(5), o = []; for (let i = 0; i < 46; i++) o.push([r(), r() * 2 - 1, r() * 6, 0.6 + r() * 1.2]); return o; })();
  function scene(ctx, t, theme, figAlpha, markAlpha, boilAmp) {
    const day = theme === 'paper', { bg, fg } = I.THEMES[theme], cam = camAt(t), j = I.boil(t, boilAmp);
    I.background(ctx, theme, W, H);
    if (!day) {
      // the sky lightening behind the opening, the stars going out
      const dw = dawn(t), sky = cam(-1.5, -1.7), g = ctx.createRadialGradient(sky[0], sky[1], 0, sky[0], sky[1], 2.6 * cam.k);
      g.addColorStop(0, `rgba(243,241,236,${0.3 * dw})`); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = fg;
      for (const [x, y, r, a, ph] of STARS) { ctx.globalAlpha = a * (1 - 0.9 * dw) * (0.75 + 0.25 * Math.sin(t * 1.1 + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // his ring: the mark's own loop
    F.drawMark(ctx, cam, j, fg, bg, 'loop');
    // him, and in the end the mark's brush strokes over him
    if (figAlpha > 0) { ctx.globalAlpha = figAlpha; F.draw(ctx, hero(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (markAlpha > 0) { ctx.globalAlpha = markAlpha; F.drawMark(ctx, cam, j, fg, bg, 'figure'); ctx.globalAlpha = 1; }
    if (!day) {
      // the beam: a band through the opening, brightest where it comes in; motes drifting in it; a spot on the floor
      const al = beamAlpha(t);
      if (al > 0.001) {
        const a = beamAngle(t), d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], Hh = floorHit(a), far = [G0[0] - d[0] * 1.6, G0[1] - d[1] * 1.6];
        const q = (p, s) => cam(p[0] + n[0] * HALF * s, p[1] + n[1] * HALF * s), A = cam(...far), B = cam(...Hh);
        const g = ctx.createLinearGradient(A[0], A[1], B[0], B[1]);
        g.addColorStop(0, 'rgba(243,241,236,0)'); g.addColorStop(0.5, `rgba(243,241,236,${al})`); g.addColorStop(1, `rgba(243,241,236,${al * 0.55})`);
        ctx.fillStyle = g; ctx.beginPath(); [q(far, -1), q(Hh, -1), q(Hh, 1), q(far, 1)].forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
        const spot = cam(...Hh), sg = ctx.createRadialGradient(spot[0], spot[1], 0, spot[0], spot[1], 0.32 * cam.k);
        sg.addColorStop(0, `rgba(243,241,236,${al * 1.2})`); sg.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = sg; ctx.fillRect(spot[0] - 0.4 * cam.k, spot[1] - 0.4 * cam.k, 0.8 * cam.k, 0.8 * cam.k);
        const L = Math.hypot(Hh[0] - G0[0], Hh[1] - G0[1]);
        ctx.fillStyle = fg;
        for (const [u0, v0, ph, r] of MOTES) {
          const u = (u0 + t * 0.012) % 1, v = v0 * 0.85 + 0.1 * Math.sin(t * 0.6 + ph), p = cam(G0[0] + d[0] * u * L + n[0] * HALF * v, G0[1] + d[1] * u * L + n[1] * HALF * v);
          ctx.globalAlpha = Math.min(1, al * 3.5) * (1 - Math.abs(v)) * (0.5 + 0.5 * Math.sin(t * 2 + ph)); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    I.vignette(ctx, theme, W, H, day ? 0.16 : 0.42);
  }

  let off = null;
  function draw(ctx, t) {
    const f = smoother(seg(t, ...T_MARK)), figAlpha = 1 - smooth(0.3, 0.7, f), markAlpha = smooth(0, 0.6, f), boilAmp = 1.2 * (1 - smooth(18.6, 21.0, t));
    const cam = camAt(t), head = hero(t).head.c, c = cam(head[0], head[1]);
    const r = smoother(seg(t, ...T_BLOOM)) * Math.hypot(W, H) * 1.15;
    if (r <= 0) scene(ctx, t, 'ink', figAlpha, markAlpha, boilAmp);
    else if (r >= Math.hypot(W, H) * 1.1) scene(ctx, t, 'paper', figAlpha, markAlpha, boilAmp);
    else {
      scene(ctx, t, 'ink', figAlpha, markAlpha, boilAmp);
      if (!off) { off = document.createElement('canvas'); off.width = W; off.height = H; }
      const o = off.getContext('2d'); o.globalCompositeOperation = 'source-over'; scene(o, t, 'paper', figAlpha, markAlpha, boilAmp);
      const g = o.createRadialGradient(c[0], c[1], Math.max(0, r - 160), c[0], c[1], r + 1);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      o.globalCompositeOperation = 'destination-in'; o.fillStyle = g; o.fillRect(0, 0, W, H); o.globalCompositeOperation = 'source-over';
      ctx.drawImage(off, 0, 0);
    }
    // a glow at his head as the light gets in
    const glow = bump(t, 18.9, 20.4);
    if (glow > 0) { const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 0.5 * cam.k); g.addColorStop(0, `rgba(243,241,236,${0.55 * glow})`); g.addColorStop(1, 'rgba(243,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const fade = 1 - smooth(0, 0.8, t);
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = '#0D0D0C'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues --------------------------------------------------------------------------------------------------
  function events() {
    const ev = [{ t: 0, type: 'crickets', dur: 12 }, { t: 0, type: 'pad', chords: [[0, 9.5, [110, 164.81, 220, 246.94]], [8.5, 15.5, [130.81, 196, 261.63, 293.66]], [15, 19.8, [146.83, 220, 293.66, 329.63]], [19.3, 24.5, [130.81, 196, 261.63, 329.63, 392]]], amp: 0.045 }];
    for (let t = 0.9; t < 6.9; t += 3.6) ev.push({ t, type: 'breath', dur: 1.7 }, { t: t + 1.8, type: 'breath', dur: 1.6, out: true });
    ev.push({ t: 4.0, type: 'shimmer', dur: 4.5 });
    [6.6, 7.0, 8.4, 11.8, 12.1, 14.0].forEach((t, i) => ev.push({ t, type: 'chirp', f: [2900, 3300, 2600, 3100, 2800, 3500][i] }));
    ev.push({ t: 7.05, type: 'rustle' }, { t: 7.8, type: 'rustle' }, { t: 9.0, type: 'gulp' }, { t: 9.75, type: 'yawn' }, { t: 10.9, type: 'rustle' });
    // footsteps from the feet coming down
    const air = [false, false];
    for (let t = 10.8; t < 18; t += 1 / 240) { const p = pose(t); const lifts = [t > T_PULL[0] && t < T_PULL[1] ? 1 : 0, (t > T_STEP_R[0] && t < T_STEP_R[1]) || (t > T_PULL_R[0] && t < T_PULL_R[1]) ? 1 : 0]; lifts.forEach((l, i) => { if (l) air[i] = true; else if (air[i]) { air[i] = false; ev.push({ t, type: 'step', amp: 0.35, tone: 1.1 }); } }); }
    ev.push({ t: 15.3, type: 'rise', dur: 3.05 }, { t: 18.35, type: 'exhale' }, { t: 19.4, type: 'swell', dur: 3.2 }, { t: 20.9, type: 'chime', f: 1046.5, amp: 0.13 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'light', title: 'First Light', W, H, fps: FPS, dur: DUR, theme: 'ink', draw, events, hero, pose };
});
