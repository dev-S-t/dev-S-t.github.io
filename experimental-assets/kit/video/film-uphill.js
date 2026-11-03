// FILM 3, Uphill. Inside his ring he tries to run it up a hill, stalls, rolls back and lands on his seat; walks it
// back, takes a run at the hill, makes the crest, and on the way down the ring outruns him and takes him round
// with it, once, all the way. Dizzy, he finds his feet and walks on. See STORYBOARD.md.
// The ring rolls honestly: its turn is the distance it covers over its radius plus the turn of the ground under it;
// his feet step at the speed the ring's floor moves under him.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'));
  else (root.Films = root.Films || {}).uphill = factory(root.Rig, root.Ink);
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
  const herm = (t, t0, t1, c0, c1, v0, v1) => { const T = t1 - t0, u = (t - t0) / T, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * c0 + (u3 - 2 * u2 + u) * T * v0 + (-2 * u3 + 3 * u2) * c1 + (u3 - u2) * T * v1; };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const HP = R.B.hip, REST_ARMS = { armL: [-0.32, 0.18], armR: [0.28, 0.22] };
  const rest = (fl, fr, o = {}) => ({ px: 0, py: -HP + 0.008, lean: 0.02, nod: 0, ...REST_ARMS, footL: [fl, 0], footR: [fr, 0], ...o });

  // ---- the ground: flat, a shallow dip, a hill with its crest at x = 12.2, flat again --------------------------------
  function g(x) {
    let h = 0;
    if (x > 2.2 && x < 6.2) h -= 0.35 * (1 - Math.cos(2 * Math.PI * (x - 2.2) / 4)) / 2;
    if (x > 6.2 && x <= 12.2) h += 1.8 * (1 - Math.cos(Math.PI * (x - 6.2) / 6)) / 2;
    if (x > 12.2 && x < 17.2) h += 1.8 * (1 + Math.cos(Math.PI * (x - 12.2) / 5)) / 2;
    return h;
  }
  const gp = (x) => (g(x + 1e-4) - g(x - 1e-4)) / 2e-4;
  // the ring: brush of even width (it turns, so no fixed light direction)
  const RM = 0.85, BASE = 0.09, RO = RM + BASE / 2, RI = RM - BASE / 2;
  const RING = I.ring(RM, BASE, { seed: 4, nib: 0, swell: 0.12 });
  // rolling: tables over the contact point c of the distance along the ground and the ring's turn
  const C0 = -12, DC = 0.005, TAB = (() => { const s = [0], th = []; for (let c = C0; c <= 45; c += DC) th.push(Math.atan2(-gp(c), 1)); for (let i = 1; i < th.length; i++) { const c = C0 + i * DC; s.push(s[i - 1] + Math.hypot(DC, g(c) - g(c - DC))); } return { s, th }; })();
  const look = (arr, c) => { const f = (c - C0) / DC, i = clamp(Math.floor(f), 0, arr.length - 2); return lerp(arr[i], arr[i + 1], f - i); };
  const PHI0 = 5.41;   // chosen so the opening only comes under his feet while he is moving
  const spin = (c) => PHI0 + look(TAB.s, c) / RO + look(TAB.th, c) - TAB.th[Math.round((0 - C0) / DC)];
  const centre = (c) => { const d = gp(c), n = Math.hypot(1, d); return [c - RO * d / n, -g(c) - RO / n]; };

  // ---- where the ring is (its contact point) through the film -----------------------------------------------------
  const T = { jog: 2.6, stall: 5.0, back: 5.35, rest: 9.2, up: 9.55, turn1: 10.05, walk: 10.15, walkEnd: 11.6, turn2: 11.75, go: 12.1, crest: 15.4, over: 15.9, loop: 16.9, flat: 18.2, slow: 20.8 };
  const AD = 1.9, VF = 0.8;
  function cOf(t) {
    if (t < T.jog) return 1.6 - 1.2 * (T.jog - t);
    if (t < T.stall) return herm(t, T.jog, T.stall, 1.6, 7.4, 1.2, 0);
    if (t < T.back) return 7.4 - 0.04 * smoother(seg(t, T.stall, T.back));
    if (t < T.rest) return keys(t, [[T.back, 7.36], [7.2, 3.55], [8.1, 4.55], [8.7, 4.08], [T.rest, 4.2]]);
    if (t < T.walk) return 4.2;
    if (t < T.walkEnd) return herm(t, T.walk, T.walkEnd, 4.2, 2.6, 0, 0);
    if (t < T.go) return 2.6;
    if (t < T.crest) return herm(t, T.go, T.crest, 2.6, 12.2, 0, 0.12);
    if (t < T.over) return 12.2 + keys(t, [[T.crest, 0], [15.6, 0.04], [15.75, -0.015], [T.over, 0.05]]);
    if (t < T.flat) return 12.25 + 0.5 * AD * (t - T.over) ** 2;
    const v0 = AD * (T.flat - T.over), c0 = 12.25 + 0.5 * AD * (T.flat - T.over) ** 2, a = (v0 - VF) / (T.slow - T.flat);
    if (t < T.slow) { const tt = t - T.flat; return c0 + v0 * tt - 0.5 * a * tt * tt; }
    return c0 + (v0 + VF) / 2 * (T.slow - T.flat) + VF * (t - T.slow);
  }
  const vOf = (t) => (cOf(t + 0.01) - cOf(t - 0.01)) / 0.02;
  const aOf = (t) => (cOf(t + 0.03) - 2 * cOf(t) + cOf(t - 0.03)) / 0.0009;
  // the loop: from T.loop he is carried round with the ring until it has turned once
  const LOOP_END = (() => { const p0 = spin(cOf(T.loop)); let t = T.loop; while (spin(cOf(t)) - p0 < 2 * Math.PI && t < 22) t += 0.002; return t; })();

  // ---- his performance --------------------------------------------------------------------------------------------
  // gait distance: the ring's floor runs under him at (inner / outer radius) of the distance the ring rolls
  const floorD = (t) => look(TAB.s, cOf(t)) * RI / RO;
  function hero(t) {
    const c = cOf(t), v = vOf(t), phi = spin(c);
    let p, face = 1, beta = Math.PI / 2, tuck = 0;
    if (t < T.stall) {
      // jog, then run harder up the slope, leaning in, a little way up the front of the ring
      const climb = smooth(5.5, 7.4, c);
      p = R.run(floorD(t), { stride: lerp(0.2, 0.25, smooth(T.jog, 4, t)), lean: lerp(0.12, 0.38, smooth(T.jog, 4.4, t)), lift: 0.07 });
      beta -= 0.32 * climb;
    } else if (t < T.back + 0.3) {
      // the stall: legs still churning, the floor slipping; the ring starts back and his feet are taken forward
      const slip = (t - T.stall) * 2.2;
      p = R.run(floorD(T.stall) + slip, { stride: 0.25, lean: 0.45, lift: 0.07 });
      const a = 0.9 * Math.exp(-((t - T.stall) / 0.2));
      p.armL = [p.armL[0] + 1.2 * Math.sin(16 * t) * (1 - a), 0.5]; p.armR = [p.armR[0] + 1.2 * Math.sin(16 * t + 2) * (1 - a), 0.5];
      beta -= 0.32 * (1 - smooth(T.back, T.back + 0.3, t));
    } else if (t < 9.45) {
      // he goes down on his seat at the bottom and rocks with the ring, arms out
      const fall = smooth(T.back + 0.3, T.back + 0.65, t), acc = clamp(aOf(t) / 6, -1, 1);
      const run = R.run(floorD(T.back + 0.3) - (t - T.back - 0.3) * 1.5, { stride: 0.25, lean: 0.2, lift: 0.05 });
      const sit = { px: -0.1, py: -0.03, lean: -0.18 + 0.2 * acc, nod: 0.05 - 0.15 * acc, footL: [0.12, 0], footR: [0.17, -0.01], armL: [-1.25 + 0.4 * acc, 0.3], armR: [1.05 + 0.4 * acc, 0.3] };
      p = R.mix(run, sit, fall);
      // get up: feet come back under, weight forward, stand
      const up = smooth(8.9, 9.45, t);
      if (up > 0) p = R.mix(p, rest(-0.06, 0.07), up);
    } else if (t < T.walk) {
      // look up the hill; turn round
      p = rest(-0.06, 0.07); p.nod = keys(t, [[9.45, 0], [9.75, -0.2], [9.95, -0.18]]); p.lean = keys(t, [[9.45, 0.02], [9.75, -0.05]]);
      const tog = bump(t, T.turn1 - 0.1, T.turn1 + 0.1); p.py -= 0.035 * tog; p.footL = [-0.06 * (1 - tog), -0.03 * tog]; p.footR = [0.07 * (1 - tog), -0.03 * tog];
      face = t < T.turn1 ? 1 : -1;
    } else if (t < T.go) {
      // walk it back out of the dip, stop, turn, crouch
      face = t < T.turn2 ? -1 : 1;
      const d = (look(TAB.s, 4.2) - look(TAB.s, c)) * RI / RO;
      p = R.mix(rest(0.07, -0.06), R.walk(d + 0.16, { stride: 0.17, lean: 0.08, swing: 0.6 }), smooth(T.walk, T.walk + 0.25, t) * (1 - smooth(T.walkEnd - 0.2, T.walkEnd, t)));
      const tog = bump(t, T.turn2 - 0.1, T.turn2 + 0.1);
      if (t > T.turn2 - 0.1) { p = rest(-0.07, 0.07); p.py -= 0.035 * tog; p.footL = [-0.07 * (1 - tog), -0.03 * tog]; p.footR = [0.07 * (1 - tog), -0.03 * tog]; }
      const set = smooth(T.turn2 + 0.1, T.go, t);
      if (set > 0) p = R.mix(p, { ...rest(0.08, -0.12), py: -0.18, lean: 0.45, nod: -0.12, armL: [-0.9, 0.9], armR: [0.95, 1.3] }, set);
    } else if (t < T.over) {
      // the run at the hill: everything he has; on the crest, teetering, arms going round
      const d = (look(TAB.s, c) - look(TAB.s, 2.6)) * RI / RO + (t > T.crest ? (t - T.crest) * 1.6 : 0);
      p = R.run(d, { stride: 0.27, lean: 0.4, lift: 0.1 });
      p = R.mix({ ...rest(0.08, -0.12), py: -0.18, lean: 0.45, nod: -0.12, armL: [-0.9, 0.9], armR: [0.95, 1.3] }, p, smooth(T.go, T.go + 0.15, t));
      const climb = smooth(6.2, 9, c) * (1 - smooth(T.crest + 0.1, T.over, t));
      beta -= 0.35 * climb;
      if (t > T.crest) { const w = bump(t, T.crest, T.over); p.lean += 0.12 * w; p.armL = [p.armL[0] - 1.6 * w * Math.sin(14 * t), 0.4]; p.armR = [p.armR[0] + 1.6 * w * Math.sin(14 * t + 1), 0.4]; }
    } else if (t < LOOP_END) {
      // downhill: the ring outruns him; he is carried up its back, curls up and goes round with it
      const d = (look(TAB.s, c) - look(TAB.s, 2.6)) * RI / RO + 0.8;
      const run = R.run(d, { stride: 0.27, lean: lerp(0.3, -0.1, smooth(T.over, T.loop, t)), lift: 0.1 });
      const ball = { px: 0.0, py: -0.14, lean: 0.55, nod: 0.3, footL: [0.05, -0.07], footR: [0.09, -0.05], armL: [0.9, 1.6], armR: [1.05, 1.5] };
      tuck = smooth(T.loop - 0.25, T.loop + 0.1, t) * (1 - smooth(LOOP_END - 0.3, LOOP_END, t));
      p = R.mix(run, ball, tuck);
      if (t > LOOP_END - 0.3) p = R.mix(p, { ...rest(-0.06, 0.08), lean: 0.2, armL: [-1.3, 0.3], armR: [1.3, 0.3] }, smooth(LOOP_END - 0.3, LOOP_END, t));
      // carried a little way up the back, then round with the ring (one whole turn), easing back to the bottom
      if (t < T.loop) beta += 0.25 * smooth(T.over + 0.3, T.loop, t);
      else beta += 0.25 * (1 - smooth(LOOP_END - 0.35, LOOP_END, t)) + (phi - spin(cOf(T.loop)));
    } else {
      // dizzy, running to keep up as the ring slows, then walking on
      const d = (look(TAB.s, c) - look(TAB.s, cOf(LOOP_END))) * RI / RO;
      const dt = t - LOOP_END, dz = Math.exp(-dt / 1.1);
      const runP = R.run(d + 0.13, { stride: 0.25, lean: 0.1, lift: 0.07 }), walkP = R.walk(d + 0.16, { stride: 0.16, lean: 0.06, swing: 0.6 });
      p = R.mix(runP, walkP, smooth(1.6, 1.0, v));
      p = R.mix({ ...rest(-0.06, 0.08), lean: 0.2, armL: [-1.3, 0.3], armR: [1.3, 0.3] }, p, smooth(LOOP_END, LOOP_END + 0.3, t));
      p.nod += 0.32 * Math.sin(9 * t) * dz; p.lean += 0.12 * Math.sin(6.3 * t + 1) * dz;
      p.armL = [p.armL[0] - 1.0 * dz, p.armL[1]]; p.armR = [p.armR[0] + 1.0 * dz, p.armR[1]];
      if (t > 21) p.nod -= 0.06 * smooth(21, 22, t);
    }
    // the opening: when it comes round under his feet he hops over it
    let hop = 0;
    if (!tuck && (t < T.back || t > LOOP_END)) {
      const gap = wrap(phi + I.rad(I.GAP) - beta), w = I.rad(I.OPEN / 2 + 10);
      if (Math.abs(gap) < w) hop = Math.pow(Math.cos(Math.PI / 2 * gap / w), 2);
      if (Math.abs(v) < 0.6) hop *= Math.abs(v) / 0.6;
    }
    if (hop > 0) { hop *= clamp(Math.abs(v) / 2, 0.45, 1); p = { ...p, py: p.py - 0.12 * hop, footL: [p.footL[0], Math.min(p.footL[1], -0.1 * hop)], footR: [p.footR[0], Math.min(p.footR[1], -0.08 * hop)] }; }
    return { c, phi, beta, face, pose: p, hop };
  }

  // ---- camera -----------------------------------------------------------------------------------------------------
  function camAt(t) {
    const avg = (span) => { let a = [0, 0]; for (let k = 0; k < 7; k++) { const q = centre(cOf(Math.max(0, t - span * k / 6))); a[0] += q[0] / 7; a[1] += q[1] / 7; } return a; };
    const r = avg(0.45);
    const lead = keys(t, [[0, 0.5], [T.jog, 1.2], [T.stall, 0.6], [T.back + 0.5, -0.2], [T.rest, 0.4], [T.walk, -0.3], [T.go, 0.6], [T.over, 0.8], [T.loop, 0.4], [LOOP_END, 0.7], [T.slow, 0.3]]);
    const track = [r[0] + lead, r[1] - 0.15];
    const wide = smoother(seg(t, 11.6, 12.6)) * (1 - smoother(seg(t, 14.7, 15.6)));      // the run at the hill, seen whole
    const end = smoother(seg(t, 20.6, 22.4));                                             // let him roll away
    const cx = lerp(lerp(track[0], 8.6, wide), 23.6, end), cy = lerp(lerp(track[1], -1.25, wide), -0.9, end);
    const k = Math.exp(lerp(Math.log(keys(t, [[0, 270], [T.jog, 230], [T.stall, 230], [T.back + 0.5, 250], [9.0, 320], [10.0, 300], [T.go, 260], [T.crest, 230], [T.over, 230], [T.loop, 250], [LOOP_END, 250], [T.slow, 240]])), Math.log(118), wide));
    return I.camera(W, H, { cx, cy, k: lerp(k, 165, end), sy: 0.56 });
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------
  const TUFTS = (() => { const r = I.rng(9), o = []; for (let x = -12; x < 45; x += 0.35 + r() * 0.7) o.push([x, r()]); return o; })();
  function draw(ctx, t) {
    const { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(t, 1.2);
    I.background(ctx, THEME, W, H);
    const x0 = cam.cx - W / 2 / cam.k - 2, x1 = cam.cx + W / 2 / cam.k + 2;
    // far hills, faint, moving slower
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.16; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    for (let px = -20; px <= W + 20; px += 12) { const wx = (px - W / 2) / cam.k + cam.cx * 0.45, h = 1.2 + 0.7 * Math.sin(wx * 0.33) + 0.4 * Math.sin(wx * 0.91 + 1); const s = cam(cam.cx + (px - W / 2) / cam.k, -h - 0.6); const q = j([px, s[1]]); if (px === -20) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // the ground
    ctx.lineWidth = Math.max(2, 0.03 * cam.k); ctx.beginPath();
    for (let x = x0; x <= x1; x += 0.05) { const s = j(cam(x, -g(x))); if (x === x0) ctx.moveTo(s[0], s[1]); else ctx.lineTo(s[0], s[1]); }
    ctx.stroke();
    // tufts along it: they show the speed
    ctx.lineWidth = Math.max(1.2, 0.012 * cam.k);
    for (const [x, r] of TUFTS) { if (x < x0 || x > x1) continue; const n = 2 + Math.floor(r * 2); for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.35, l = 0.06 + 0.04 * r, b = [x + (k - 1) * 0.02, -g(x)]; const s0 = j(cam(b[0], b[1])), s1 = j(cam(b[0] + l * Math.cos(a), b[1] + l * Math.sin(a))); ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); } }
    // the ring, turned as far as it has rolled
    const h = hero(t), C = centre(h.c), cs = Math.cos(h.phi), sn = Math.sin(h.phi);
    I.fillPoly(ctx, RING.outline, cam, j, fg, (p) => [C[0] + cs * p[0] - sn * p[1], C[1] + sn * p[0] + cs * p[1]]);
    // him, on the ring's inner floor
    const rIn = RING.inner(h.beta - h.phi) ?? RI;
    I.figure(ctx, h.pose, I.onRing(C[0], C[1], rIn, h.beta, -1, -h.face), cam, j, fg);
    I.vignette(ctx, THEME, W, H, 0.22);
    const fade = Math.max(1 - smooth(0, 0.6, t), smooth(23.1, 24.0, t));
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- sound cues -------------------------------------------------------------------------------------------------
  function events() {
    const ev = [], air = [false, false]; let hopUp = false;
    for (let t = 0; t < DUR; t += 1 / 240) {
      const h = hero(t), f = [h.pose.footL[1], h.pose.footR[1]];
      f.forEach((y, i) => { if (y < -0.006) air[i] = true; else if (air[i] && y > -0.0008) { air[i] = false; ev.push({ t, type: 'step', amp: clamp(0.25 + Math.abs(vOf(t)) / 6, 0.25, 0.7), tone: 0.75, pan: 0 }); } });
      if (h.hop > 0.5 && !hopUp) { hopUp = true; } else if (h.hop < 0.05 && hopUp) { hopUp = false; ev.push({ t, type: 'step', amp: 0.6, tone: 0.7 }); }
    }
    ev.push({ t: 0, type: 'rumble', dur: DUR, speeds: Array.from({ length: Math.ceil(DUR * 50) }, (_, i) => Math.abs(vOf(i / 50))) });
    ev.push({ t: T.back + 0.6, type: 'land', amp: 0.6 }, { t: 15.55, type: 'creak' }, { t: T.over + 0.2, type: 'whoosh', dur: LOOP_END - T.over, amp: 0.3 });
    ev.push({ t: LOOP_END + 0.05, type: 'chime', f: 1318.5, amp: 0.12 }, { t: 9.75, type: 'hi', notes: [392, 349.2] });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'uphill', title: 'Uphill', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, cOf, LOOP_END };
});
