// FILM 1, The Gap. He walks the rim of his ring-shaped world; at eleven o'clock the ring is open and he has to jump
// it; then the camera pulls back and there are many worlds, each with its own walker. See STORYBOARD.md.
// Everything is a function of time. Story time (tau) runs slower than the clock over the top of the leap.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js'), require('./ink.js'));
  else (root.Films = root.Films || {}).gap = factory(root.Rig, root.Ink);
})(this, function (R, I) {
  const W = 1920, H = 1080, FPS = 30, THEME = 'ink';
  const { smooth, smoother, lerp, clamp } = I;
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lrp(v, b[i], u)) : a + (b - a) * u);
  // keyframes [[t, value], ...], eased between neighbours
  function keys(t, ks, e = smoother) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], e((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
    return ks[ks.length - 1][1];
  }
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const bump = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));

  // ---- the world: his planet is a brush ring, radius 3 figure heights; s is distance along its rim, 0 at the tip
  // where it runs out (225 degrees, the tail of the stroke), counting clockwise
  const PLANET = I.ring(3, 0.12, { seed: 1 });
  const RS = 3.06;                                   // mean surface radius, for turning distance into angle
  const angleOf = (s) => PLANET.tipA + s / RS;
  const surf = (s) => { const a = angleOf(s), r = PLANET.outer(a); if (r != null) return r; const u = clamp(s / (30 * Math.PI / 180 * RS), 0, 1); return lerp(PLANET.outer(PLANET.tipA - 1e-6), PLANET.outer(PLANET.startA + 1e-6), u); };
  const frameAt = (s, sx = 1, lift = 0) => I.onRing(0, 0, surf(s) + lift, angleOf(s), 1, sx);
  const worldAt = (s, h = 0) => { const a = angleOf(s), r = surf(s) + h; return [r * Math.cos(a), r * Math.sin(a)]; };

  // ---- his performance, in story time. Distances in figure heights. --------------------------------------------
  const STR = 0.16;                                  // walking stride
  const S_STOP = -0.2, S_BACK = S_STOP - 0.96;       // where he stops at the edge, and where he backs up to
  const DC = 1.13 / 2.18, S_TO = 2.36 * DC - 1.16;   // sprint: two cycles and a bit, taking off from the left foot
  const T_RUN = 10.4, T_TO = 11.7, V_TO = 2 * (S_TO - S_BACK) / (T_TO - T_RUN);
  const S_L = 1.7, T_F = (S_L - S_TO) / V_TO, T_L = T_TO + T_F, HJ = 0.48;
  const LAND_T = 0.14, S_SET = S_L + V_TO * LAND_T;  // where the landing run-out settles
  const REST_ARMS = { armL: [-0.32, 0.18], armR: [0.28, 0.22] }, HP = R.B.hip;
  const rest = (fl, fr, o = {}) => ({ px: 0, py: -HP + 0.008, lean: 0.02, nod: 0, ...REST_ARMS, footL: [fl, 0], footR: [fr, 0], ...o });
  const PEBBLE = { s: -0.04, r: 0.022 };
  const T_KICK = 4.95 + 0.5 * Math.asin(0.622) / Math.PI;     // when the toe meets the pebble

  // A: the walk in, 1.6 heights, easing to a stop on a double-support step
  const walkInD = (t) => (t < 2.8 ? 0.5 * t : 1.4 + 0.5 * Math.min(t - 2.8, 0.8) - 0.5 * Math.pow(Math.min(t - 2.8, 0.8), 2) / 1.6);
  // a foot stepping from one place to another between two times (absolute rim positions), lifted on the way
  const step = (t, t0, t1, a, b, h = 0.045) => { const u = seg(t, t0, t1); return [lerp(a, b, smoother(u)), -h * Math.sin(Math.PI * u)]; };

  function hero(t) {
    // A walk in
    if (t < 3.8) {
      const d = walkInD(t), p = R.walk(d, { stride: STR, lean: 0.07, swing: 0.6 });
      return { s: S_STOP - 1.6 + d, pose: R.mix(p, rest(0.08, -0.08), smooth(3.3, 3.8, t)), sx: 1 };
    }
    // B-D at the edge: lean over, look down, nudge the pebble, watch it fall, straighten, gulp
    if (t < 7.6) {
      const p = rest(0.08, -0.08);
      p.lean = keys(t, [[3.8, 0.02], [4.5, 0.3], [5.3, 0.3], [6.1, 0.38], [6.85, 0.38], [7.25, 0.0], [7.6, 0.02]]);
      p.nod = keys(t, [[3.8, 0], [4.5, 0.42], [4.9, 0.42], [5.1, 0.5], [6.3, 0.66], [6.85, 0.62], [7.2, -0.07], [7.36, 0.12], [7.6, 0.02]]);
      p.px = keys(t, [[3.8, 0], [4.5, -0.035], [6.85, -0.035], [7.25, 0]]);
      p.py = -HP + 0.008 + 0.016 * bump(t, 7.28, 7.5);
      const back = { armL: [-1.2, 0.35], armR: [-0.95, 0.42] };
      p.armL = keys(t, [[3.8, REST_ARMS.armL], [4.5, back.armL], [6.85, back.armL], [7.3, REST_ARMS.armL]]);
      p.armR = keys(t, [[3.8, REST_ARMS.armR], [4.5, back.armR], [6.85, back.armR], [7.3, REST_ARMS.armR]]);
      const u = seg(t, 4.95, 5.45);
      p.footL = [0.08 + 0.045 * Math.sin(Math.PI * u), -0.01 * Math.sin(Math.PI * u)];
      return { s: S_STOP, pose: p, sx: 1 };
    }
    // E back away from the edge, three slow steps backwards, eyes on the edge
    if (t < 9.6) {
      const dE = -0.96 * smoother(seg(t, 7.6, 9.6)), p = R.walk(1.6 + dE, { stride: STR, lean: -0.02, swing: 0.25, bob: 0.005 });
      p.nod = 0.14 + 0.03 * Math.sin(t * 5); p.lean = -0.03;
      return { s: S_STOP + dE, pose: R.mix(rest(0.08, -0.08), p, smooth(7.6, 7.85, t)), sx: 1 };
    }
    // F set: the back foot steps back, he sinks into a crouch, rocks once, is still
    if (t < T_RUN) {
      const p = rest(0.08, -0.08);
      p.footR = step(t, 9.62, 9.86, -0.08, -0.24, 0.035);
      p.py = keys(t, [[9.6, -HP + 0.008], [9.95, -0.17]]);
      p.lean = keys(t, [[9.6, 0.02], [9.95, 0.45]]);
      p.nod = keys(t, [[9.6, 0.1], [9.95, -0.16]]);
      p.armL = keys(t, [[9.6, REST_ARMS.armL], [9.95, [-0.95, 0.9]]]);
      p.armR = keys(t, [[9.6, REST_ARMS.armR], [9.95, [0.95, 1.3]]]);
      p.px = -0.035 * bump(t, 9.95, 10.3);
      return { s: S_BACK, pose: p, sx: 1 };
    }
    // G the sprint: even acceleration to take-off speed, the left foot pushing off at the very end of the rim
    if (t < T_TO) {
      const tt = t - T_RUN, d = 0.5 * (V_TO / (T_TO - T_RUN)) * tt * tt;
      const p = R.run(d, { stride: DC / 2, lean: 0.28, lift: 0.1 });
      const set = hero(T_RUN - 1e-6).pose;
      return { s: S_BACK + d, pose: R.mix(set, p, smooth(T_RUN, T_RUN + 0.16, t)), sx: 1 };
    }
    // H the leap: drive the knee, arms up, hang, legs come through for the landing
    if (t < T_L) {
      const u = (t - T_TO) / T_F, y = -HJ * 4 * u * (1 - u);
      const K = [
        [0, { px: 0.03, py: -HP, lean: 0.3, nod: -0.05, armL: [-0.9, 0.5], armR: [1.5, 0.7], footL: [-0.12, 0], footR: [0.1, -0.12] }],
        [0.45, { px: 0.0, py: -HP - 0.01, lean: 0.12, nod: -0.1, armL: [-1.95, -0.25], armR: [1.95, 0.25], footL: [-0.17, -0.05], footR: [0.15, -0.09] }],
        [0.85, { px: 0.0, py: -0.19, lean: 0.22, nod: 0.05, armL: [1.5, 0.3], armR: [1.75, 0.25], footL: [0.15, -0.04], footR: [0.12, -0.06] }],
        [1, { px: 0.0, py: -0.19, lean: 0.22, nod: 0.05, armL: [1.5, 0.3], armR: [1.75, 0.25], footL: [0.1, 0], footR: [0.06, 0] }]];
      let p = K[0][1];
      for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { p = R.mix(K[i - 1][1], K[i][1], I.smoother((u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]))); break; }
      const off = R.run(S_TO - S_BACK, { stride: DC / 2, lean: 0.28, lift: 0.1 });
      p = R.mix(off, p, smooth(0, 0.12, u));
      p = { ...p, py: p.py + y, footL: [p.footL[0], p.footL[1] + y], footR: [p.footR[0], p.footR[1] + y] };
      return { s: S_TO + V_TO * (t - T_TO), pose: p, sx: 1 };
    }
    // I the landing: the feet stay where they landed, the body carries on over them, two stumbling steps, steady
    if (t < T_L + 0.9) {
      const dt = t - T_L, s = S_L + V_TO * LAND_T * (1 - Math.exp(-dt / LAND_T));
      const fR = step(t, T_L + 0.1, T_L + 0.26, S_L + 0.06, S_L + 0.33, 0.06), fL = step(t, T_L + 0.24, T_L + 0.4, S_L + 0.1, S_L + 0.19, 0.05);
      const a = Math.exp(-3.5 * dt), settle = smooth(0.35, 0.9, dt);
      const p = {
        px: 0, py: keys(dt, [[0, -0.19], [0.08, -0.142], [0.3, -0.19], [0.55, -HP], [0.8, -HP + 0.008]]),
        lean: keys(dt, [[0, 0.22], [0.1, 0.3], [0.35, 0.1], [0.6, -0.05], [0.85, 0.02]]), nod: keys(dt, [[0, 0.05], [0.1, 0.14], [0.5, -0.08], [0.8, 0]]),
        armL: lrp([-1.5 + 0.9 * Math.sin(13 * dt) * a, 0.3], REST_ARMS.armL, settle), armR: lrp([1.6 + 0.9 * Math.sin(13 * dt + 1.4) * a, 0.3], REST_ARMS.armR, settle),
        footL: [fL[0] - s, fL[1]], footR: [fR[0] - s, fR[1]] };
      return { s, pose: p, sx: 1 };
    }
    // J turn round, look at the gap, a small fist, turn back
    if (t < 15.75) {
      const p = rest(S_L + 0.19 - S_SET, S_L + 0.33 - S_SET);
      const sx = t < 14.8 ? (t < 13.68 ? 1 : -1) : (t < 15.54 ? -1 : 1), tog = bump(t, 13.58, 13.78) + bump(t, 15.44, 15.64);
      p.footL = [p.footL[0] * (1 - tog), -0.03 * tog]; p.footR = [p.footR[0] * (1 - tog), -0.03 * tog];
      p.py += -0.035 * (bump(t, 13.58, 13.78) + bump(t, 15.44, 15.64));
      p.nod = keys(t, [[13.5, 0], [13.95, 0.24], [14.55, 0.24], [14.75, -0.06], [15.3, -0.06], [15.6, 0]]);
      p.armR = keys(t, [[14.55, REST_ARMS.armR], [14.74, [1.75, 0.7]], [14.86, [0.95, 1.75]], [15.2, [0.98, 1.72]], [15.42, REST_ARMS.armR]]);
      p.py += 0.02 * bump(t, 14.8, 15.0);
      p.lean = keys(t, [[14.6, 0.02], [14.8, -0.06], [15.3, -0.04], [15.5, 0.02]]);
      return { s: S_SET, pose: p, sx };
    }
    // K walk on, two cycles, and stop: someone is waving
    if (t < 17.35) {
      const d = 0.64 * smoother(seg(t, 15.75, 17.35)), p = R.walk(d + STR, { stride: STR, lean: 0.06, swing: 0.6 });
      return { s: S_SET + d, pose: R.mix(rest(S_L + 0.19 - S_SET, S_L + 0.33 - S_SET), p, smooth(15.75, 16.0, t)), sx: 1 };
    }
    // L wave back
    if (t < 19.3) {
      const p = rest(-0.08, 0.08), w = 14;
      const up = smooth(17.85, 18.1, t) * (1 - smooth(18.95, 19.2, t));
      p.armR = lrp(REST_ARMS.armR, [1.95 + 0.12 * Math.sin(w * t), 0.8 + 0.5 * Math.sin(w * t + 0.8)], up);
      p.nod = -0.06 * smooth(17.4, 17.8, t); p.lean = 0.02 - 0.04 * up;
      return { s: S_SET + 0.64, pose: R.mix(R.walk(0.64 + STR, { stride: STR, lean: 0.06, swing: 0.6 }), p, smooth(17.35, 17.6, t)), sx: 1 };
    }
    // M and on round his world
    const v = 0.5, tt = t - 19.3, d = tt < 0.8 ? v * tt * tt / 1.6 : v * (tt - 0.4);
    const p = R.walk(0.64 + STR + d, { stride: STR, lean: 0.06, swing: 0.6 });
    return { s: S_SET + 0.64 + d, pose: R.mix(rest(-0.08, 0.08), p, smooth(19.3, 19.55, t)), sx: 1 };
  }

  // ---- the others: rings scattered through the dark, each with a walker going round and hopping its gap ---------
  const NEIGHBOUR = { c: [6.6, -3.0], r: 1.5 };
  const WORLDS = (() => {
    const rnd = I.rng(11), out = [{ c: NEIGHBOUR.c, r: NEIGHBOUR.r, v: 0.45, s0: 0, n: true }, { c: [-8.5, 3.6], r: 2.1, v: 0.5, s0: 4 }, { c: [13, 6.5], r: 2.6, v: 0.42, s0: 9 }, { c: [-4.5, -11], r: 1.8, v: 0.55, s0: 2 }];
    for (let tries = 0; out.length < 60 && tries < 6000; tries++) {
      const c = [(rnd() * 2 - 1) * 160, (rnd() * 2 - 1) * 92], r = 1.2 + rnd() * 2.4;
      if (Math.hypot(c[0], c[1]) < 12 + r) continue;
      if (out.some((o) => Math.hypot(o.c[0] - c[0], o.c[1] - c[1]) < o.r + r + 9)) continue;
      out.push({ c, r, v: 0.38 + rnd() * 0.25, s0: rnd() * 40 });
    }
    for (const w of out) { w.g = I.ring(w.r, 0.1, { seed: 2 + Math.floor(w.r * 10), N: 120 }); w.rs = w.r + 0.05; w.L = 2 * Math.PI * w.rs; }
    return out;
  })();
  // a walker on a ring: walks clockwise, and at the opening breaks into a quick hop over it
  function walker(w, t) {
    const gapS = (330 / 360) * w.L, sA = gapS - 0.14, sB = w.L + 0.16, D = sB - sA, vh = 2.6 * w.v;
    const Tw = (w.L - D) / w.v, Th = D / vh, lap = Tw + Th;
    let u = ((t + w.s0 / w.v) % lap + lap) % lap, s, pose;
    if (u < Tw) { s = 0.16 + u * w.v; pose = R.walk(s, { stride: 0.15, lean: 0.06 }); const h = u / Tw; if (h > 0.97) pose = R.mix(pose, R.leap(0, 0.3), smooth(0.97, 1, h)); }
    else { const h = (u - Tw) / Th; s = sA + h * D; pose = R.mix(R.leap(h, 0.3), R.walk(0.16, { stride: 0.15, lean: 0.06 }), smooth(0.85, 1, h)); }
    return { a: w.g.startA + s / w.rs, pose };
  }

  // ---- story time: the clock slows to 38% over the top of the leap -----------------------------------------------
  const SLOW = [11.88, 12.42], RATE = 0.38, DUR_STORY = 23.0;
  const TAB = (() => { const dt = 1 / 1200, out = [0]; let tau = 0, t = 0; while (tau < DUR_STORY + 1) { const w = smooth(SLOW[0] - 0.12, SLOW[0] + 0.1, tau) * (1 - smooth(SLOW[1] - 0.1, SLOW[1] + 0.12, tau)); tau += dt * (1 - (1 - RATE) * w); t += dt; out.push(tau); } return { dt, out }; })();
  const tauOf = (t) => { const i = Math.min(TAB.out.length - 2, Math.floor(t / TAB.dt)), f = t / TAB.dt - i; return lerp(TAB.out[i], TAB.out[i + 1], f); };
  const timeOf = (tau) => { let lo = 0, hi = TAB.out.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAB.out[m] < tau) lo = m; else hi = m; } return lo * TAB.dt; };
  const DUR = Math.ceil(timeOf(DUR_STORY) * FPS) / FPS;

  // ---- the camera -------------------------------------------------------------------------------------------------
  function heroS(t) { return hero(t).s; }
  function camAt(t) {
    // follow him (a little behind, smoothed), frame the gap for the jump, then pull away into the dark
    const avg = (f, t, span) => { let a = 0; for (let i = 0; i < 7; i++) a += f(t - span * i / 6); return a / 7; };
    let sc = avg(heroS, t, 0.35) + 0.2;
    sc = lerp(sc, 0.82, smoother(seg(t, 9.9, 11.6)) * (1 - smoother(seg(t, 12.9, 14.2))));
    const near = { k: keys(t, [[9.5, 380], [11.2, 235], [12.9, 235], [14.3, 360]]), sx: keys(t, [[9.5, 0.42], [11.0, 0.5], [12.9, 0.5], [14.3, 0.45]]), sy: keys(t, [[9.5, 0.66], [11.0, 0.7], [12.9, 0.7], [14.3, 0.66]]) };
    const c0 = worldAt(sc), r0 = -Math.PI / 2 - angleOf(sc), rot0 = Math.atan2(Math.sin(r0), Math.cos(r0));
    const a = smoother(seg(t, 15.2, 17.4)), b = smoother(seg(t, 19.2, 22.4));
    const cx = lerp(lerp(c0[0], 3.4, a), 0, b), cy = lerp(lerp(c0[1], -3.7, a), -1, b);
    const k = Math.exp(lerp(lerp(Math.log(near.k), Math.log(150), a), Math.log(6.4), b));
    return I.camera(W, H, { cx, cy, k, rot: lerp(rot0, 0, a), sx: lerp(near.sx, 0.5, a), sy: lerp(near.sy, 0.52, a) });
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------
  const STARS = (() => { const r = I.rng(3), o = []; for (let i = 0; i < 420; i++) o.push([r() * 2600 - 1300, r() * 2600 - 1300, 0.6 + r() * 1.4, 0.12 + r() * 0.4, 0.2 + r() * 0.5]); return o; })();
  function draw(ctx, clock) {
    const t = tauOf(clock), { bg, fg } = I.THEMES[THEME], cam = camAt(t), j = I.boil(clock, 1.3);
    I.background(ctx, THEME, W, H);
    // stars: drift with the camera's turn, gather a little as it pulls back
    const zoom = Math.pow(cam.k / 250, 0.22), cr = Math.cos(cam.rot), sr = Math.sin(cam.rot);
    ctx.fillStyle = fg;
    for (const [x, y, rad, al, depth] of STARS) {
      const X = x * zoom, Y = y * zoom - 300 * depth * (1 - zoom), px = W / 2 + cr * X - sr * Y, py = H / 2 + sr * X + cr * Y;
      if (px < -5 || py < -5 || px > W + 5 || py > H + 5) continue;
      ctx.globalAlpha = al * (0.75 + 0.25 * Math.sin(clock * 1.3 + x)); ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // other worlds
    for (const w of WORLDS) {
      const sc = cam(w.c[0], w.c[1]), rr = (w.r + 1.3) * cam.k;
      if (sc[0] < -rr || sc[1] < -rr || sc[0] > W + rr || sc[1] > H + rr) continue;
      I.fillPoly(ctx, w.g.outline, cam, j, fg, (p) => [p[0] + w.c[0], p[1] + w.c[1]], 1.7);
      if (cam.k < 1.5) continue;
      let a, pose, sx = 1;
      if (w.n && t < 19.0) {
        // the neighbour stands on top, facing him, and waves first; then turns and walks on
        a = -100 * Math.PI / 180; pose = rest(-0.07, 0.07);
        const up = smooth(16.9, 17.15, t) * (1 - smooth(18.1, 18.35, t));
        pose.armR = lrp(REST_ARMS.armR, [1.95 + 0.12 * Math.sin(15 * t + 1), 0.8 + 0.5 * Math.sin(15 * t + 1.8)], up);
        sx = t < 18.58 ? -1 : 1; const tog = bump(t, 18.48, 18.68); pose.footL = [pose.footL[0] * (1 - tog), -0.03 * tog]; pose.footR = [pose.footR[0] * (1 - tog), -0.03 * tog];
        pose.py += -0.03 * bump(t, 18.5, 18.7);
      } else if (w.n) {
        const tt = t - 19.0, d = tt < 0.8 ? w.v * tt * tt / 1.6 : w.v * (tt - 0.4);
        a = -100 * Math.PI / 180 + d / w.rs; pose = R.mix(rest(-0.07, 0.07), R.walk(d + STR, { stride: STR, lean: 0.06, swing: 0.6 }), smooth(19.0, 19.25, t));
      } else ({ a, pose } = walker(w, t));
      I.figure(ctx, pose, I.onRing(w.c[0], w.c[1], w.g.outer(a) ?? w.rs, a, 1, sx), cam, j, fg);
    }
    // his world
    I.fillPoly(ctx, PLANET.outline, cam, j, fg);
    // the pebble: sits at the edge, nudged off, rolls to the tip and drops into the dark
    if (t < 7.5) {
      let pos, sc = 1, al = 1;
      const tk = T_KICK, v0 = 0.24, tTip = tk + (0 - PEBBLE.s) / v0;
      if (t < tk) pos = worldAt(PEBBLE.s, PEBBLE.r);
      else if (t < tTip) pos = worldAt(PEBBLE.s + v0 * (t - tk), PEBBLE.r);
      else {
        const a = angleOf(0), P = worldAt(0, PEBBLE.r), T = [-Math.sin(a), Math.cos(a)], N = [Math.cos(a), Math.sin(a)], dt = t - tTip, g = 2.2;
        pos = [P[0] + T[0] * v0 * dt - N[0] * 0.5 * g * dt * dt, P[1] + T[1] * v0 * dt - N[1] * 0.5 * g * dt * dt];
        sc = Math.max(0.05, 1 - dt / 1.6); al = 1 - smooth(0.9, 1.6, dt);
      }
      const p = j(cam(pos[0], pos[1]));
      ctx.globalAlpha = al; ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(p[0], p[1], PEBBLE.r * cam.k * sc, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    // him
    const h = hero(t);
    I.figure(ctx, h.pose, frameAt(h.s, h.sx), cam, j, fg);
    I.vignette(ctx, THEME, W, H, 0.5);
    // fade in and out
    const fade = Math.max(1 - smooth(0, 0.6, t), smooth(22.2, 23.0, t));
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- the sound cues, in clock time ------------------------------------------------------------------------------
  function events() {
    const ev = [], at = (tau) => timeOf(tau);
    // footsteps: whenever a foot comes down
    const air = [false, false]; let prevS = hero(0).s;
    for (let tau = 0; tau < DUR_STORY; tau += 1 / 240) {
      const h = hero(tau), f = [h.pose.footL[1], h.pose.footR[1]], v = Math.abs(h.s - prevS) * 240; prevS = h.s;
      f.forEach((y, i) => { if (y < -0.006) air[i] = true; else if (air[i] && y > -0.0008) { air[i] = false; ev.push({ t: at(tau), type: 'step', amp: clamp(0.3 + v / 1.9, 0.3, 1), pan: -0.08 }); } });
    }
    ev.push({ t: at(T_KICK), type: 'tap' }, { t: at(T_KICK + 0.2), type: 'fall', dur: 1.7 }, { t: at(7.32), type: 'gulp' });
    ev.push({ t: at(T_TO - 0.05), type: 'whoosh', dur: timeOf(T_L) - timeOf(T_TO) + 0.2 }, { t: at(SLOW[0]), type: 'hold', dur: timeOf(SLOW[1]) - timeOf(SLOW[0]) });
    ev.push({ t: at(T_L), type: 'land' }, { t: at(13.7), type: 'swish' }, { t: at(14.82), type: 'chime' }, { t: at(15.55), type: 'swish' });
    ev.push({ t: at(17.0), type: 'hi', notes: [784, 988] }, { t: at(18.0), type: 'hi', notes: [659, 784] });
    [19.7, 20.15, 20.55, 20.95, 21.3, 21.6, 21.85].forEach((tau, i) => ev.push({ t: at(tau), type: 'pluck', f: [392, 440, 523, 587, 659, 784, 880][i], pan: ((i * 0.37) % 1) * 1.4 - 0.7 }));
    ev.push({ t: 0, type: 'pad', dur: DUR, land: at(T_L), bloom: at(19.4), end: at(22.4) });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'gap', title: 'The Gap', W, H, fps: FPS, dur: DUR, theme: THEME, draw, events, hero, tauOf, timeOf };
});
