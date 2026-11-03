// Drawing kit for the films: themes, noise, the brush ring (ported from tools/logo/logo-gen.cjs so a world, a wheel
// or a frame is drawn with the same brush as the mark), a camera, the hand-drawn boil, and the figure on a surface.
// Works in the browser (window.Ink) and in Node (require), so the films can be stepped in Node for the sound.
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(require('./rig.js')); else root.Ink = factory(root.Rig); })(this, function (Rig) {
  const THEMES = { paper: { bg: '#F3F1EC', fg: '#0D0D0C' }, ink: { bg: '#0D0D0C', fg: '#F3F1EC' } };
  const TAU = Math.PI * 2, rad = (d) => d * Math.PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const smoother = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (6 * t - 15) + 10); };

  // seeded random, and smooth value noise
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(i, j, s) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }

  // ---- the brush ring (same arc, width profile and outline as the mark) ----
  const wob = (t, seed, amp) => amp * (Math.sin(t * 5.3 + seed * 1.7) * 0.6 + Math.sin(t * 11.1 + seed * 3.1) * 0.4);
  const GAP = -120, OPEN = 30;
  function profile(t, { base, start = 'press', end = 'lift', seed = 0, swell = 0.24, lift = 0.16, dir = null, nib = 1 }) {
    let w = base * (1 - swell + swell * Math.sin(Math.PI * Math.min(1, t * 1.15)));
    if (dir != null) w *= (1 - 0.42 * nib) + 0.52 * nib * Math.abs(Math.sin(dir - rad(40)));
    w *= 1 + wob(t * 2, seed + 7, 0.09) + wob(t * 13, seed + 3, 0.035);
    if (start === 'taper') w *= 0.2 + 0.8 * smooth(0, 0.14, t); else w *= 0.86 + 0.14 * smooth(0, 0.05, t);
    if (end === 'lift') w *= 0.3 + 0.7 * (1 - smooth(1 - lift, 1, t));
    return w;
  }
  // a ring of radius r (centre 0,0) open at 11 o'clock, brush width `base`; nib 0 gives an even width all round so
  // a ring that turns (a wheel) does not show a fixed light direction
  function ring(r, base, { seed = 1, spiral = 0.025, swell = 0.22, nib = 1, N = 360 } = {}) {
    const a0 = rad(GAP + OPEN / 2), a1 = rad(GAP - OPEN / 2 + 360);
    const C = [], Wd = [], A = [];
    for (let i = 0; i <= N; i++) { const t = i / N, a = a0 + (a1 - a0) * t, rr = r * (1 + wob(t, seed, 0.012) + spiral * (t - 0.5)); C.push([rr * Math.cos(a), rr * Math.sin(a)]); A.push(a); }
    for (let i = 0; i <= N; i++) { const p = C[Math.max(0, i - 1)], q = C[Math.min(N, i + 1)]; Wd.push(profile(i / N, { base, seed, swell, nib, dir: Math.atan2(q[1] - p[1], q[0] - p[0]) })); }
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const p = C[Math.max(0, i - 1)], q = C[Math.min(N, i + 1)]; let tx = q[0] - p[0], ty = q[1] - p[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const h = Wd[i] / 2; L.push([C[i][0] - ty * h, C[i][1] + tx * h]); R.push([C[i][0] + ty * h, C[i][1] - tx * h]);
    }
    const cap = (from, c, w) => { const out = [], b = Math.atan2(from[1] - c[1], from[0] - c[0]); for (let k = 1; k < 10; k++) { const a = b - Math.PI * k / 10; out.push([c[0] + Math.cos(a) * w / 2, c[1] + Math.sin(a) * w / 2]); } return out; };
    const outline = [...L, ...cap(L[N], C[N], Wd[N]), ...R.reverse(), ...cap(R[R.length - 1], C[0], Wd[0])];
    // outer and inner surface radius at an angle (null in the opening): feet stand on these
    const at = (a, side) => {
      let t = (((a - a0) % TAU) + TAU) % TAU / (a1 - a0); if (t > 1) return null;
      const f = t * N, i = Math.min(N - 1, Math.floor(f)), u = f - i, rr = lerp(Math.hypot(...C[i]), Math.hypot(...C[i + 1]), u), w = lerp(Wd[i], Wd[i + 1], u);
      return rr + side * w / 2;
    };
    return { r, base, a0, a1, outline, outer: (a) => at(a, 1), inner: (a) => at(a, -1), tipA: a1, startA: a0 };
  }

  // ---- camera: world units -> pixels. (cx, cy) is the world point shown at (sx, sy) on screen; rot turns the world
  // (radians, + clockwise on screen); k is pixels per world unit
  function camera(W, H, { cx = 0, cy = 0, k = 100, rot = 0, sx = 0.5, sy = 0.5 } = {}) {
    const c = Math.cos(rot), s = Math.sin(rot), ox = W * sx, oy = H * sy;
    const f = (x, y) => { const dx = x - cx, dy = y - cy; return [ox + k * (c * dx - s * dy), oy + k * (s * dx + c * dy)]; };
    f.k = k; f.rot = rot; f.cx = cx; f.cy = cy;
    f.inv = (X, Y) => { const a = (X - ox) / k, b = (Y - oy) / k; return [cx + c * a + s * b, cy - s * a + c * b]; };
    return f;
  }

  // ---- the boil: every line is re-drawn 12 times a second with a slightly different hand. j(x, y) jitters a
  // screen point, smoothly in space so a line bends rather than breaks
  function boil(t, amp = 1.2, rate = 12) {
    const seed = Math.floor(t * rate) + 1, f = 1 / 90;
    return (p) => [p[0] + amp * noise(p[0] * f, p[1] * f, seed), p[1] + amp * noise(p[0] * f + 31.7, p[1] * f - 12.3, seed)];
  }

  // ---- paper: a fixed grain, drawn once and laid over every frame
  let grainCache = null;
  function grain(theme) {
    if (grainCache && grainCache.theme === theme) return grainCache.c;
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), im = g.createImageData(512, 512), r = rng(7);
    const tone = theme === 'ink' ? 255 : 0;
    for (let i = 0; i < 512 * 512; i++) { const v = r(); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = tone; im.data[i * 4 + 3] = v < 0.5 ? Math.floor(v * 18) : 0; }
    g.putImageData(im, 0, 0); grainCache = { theme, c }; return c;
  }
  function background(ctx, theme, W, H) {
    const { bg } = THEMES[theme]; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (typeof document !== 'undefined') { ctx.save(); ctx.globalAlpha = theme === 'ink' ? 0.5 : 0.7; ctx.fillStyle = ctx.createPattern(grain(theme), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  function vignette(ctx, theme, W, H, amt = 0.35) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, theme === 'ink' ? `rgba(0,0,0,${amt})` : `rgba(60,50,30,${amt * 0.35})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // fill a polygon given in world units through the camera and the boil
  // (minPx: when the shape is drawn so small that its stroke would be thinner than this, thicken it by outlining)
  function fillPoly(ctx, pts, cam, j, color, mapW = (p) => p, minPx = 0, base = 0.1) {
    ctx.beginPath(); pts.forEach((p, i) => { const q = mapW(p), s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    const extra = minPx - base * cam.k; if (extra > 0) { ctx.strokeStyle = color; ctx.lineWidth = extra; ctx.lineJoin = 'round'; ctx.stroke(); }
  }

  // a figure frame on a surface: the point at angle a on a ring centred (cx, cy) with surface radius rs, upright
  // away from the centre (out = 1) or towards it (out = -1, standing on the inside); facing clockwise unless flip.
  // returns local (x, y) -> world
  function onRing(cx, cy, rs, a, out = 1, sx = 1) {
    const c = Math.cos(a), s = Math.sin(a), P = [cx + rs * c, cy + rs * s];
    // up is (c, s) * out; forward (clockwise) is (-s, c)
    return (x, y) => { const X = x * sx; return [P[0] - X * s - y * out * c, P[1] + X * c - y * out * s]; };
  }
  // the figure on flat ground at (x0, y0) in the world, facing +x (sx = -1 faces -x), rotated by rot
  function onGround(x0, y0, sx = 1, rot = 0) {
    const c = Math.cos(rot), s = Math.sin(rot);
    return (x, y) => { const X = x * sx; return [x0 + c * X - s * y, y0 + s * X + c * y]; };
  }
  // draw the figure: local -> world (frame) -> screen (camera) -> boil
  // (small figures are drawn with strokes of at least 1.1 px, the head as a stroked arc, so they never vanish)
  function figure(ctx, pose, frame, cam, j, color, scale = 1) {
    const k = cam.k * scale, m = (q) => { const w = frame(q[0] * scale, q[1] * scale); return j(cam(w[0], w[1])); };
    if (k >= 40) return Rig.draw(ctx, pose, (x, y) => m([x, y]), k, color);
    const J = Rig.solve(pose), B = Rig.B;
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const poly = (pts, w) => { ctx.lineWidth = Math.max(w * k, 1.1); ctx.beginPath(); pts.forEach((q, i) => { const p = m(q); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); };
    poly(J.legL, B.wLeg); poly(J.legR, B.wLeg); poly(J.armL, B.wArm); poly(J.armR, B.wArm); poly([J.neck, J.pelvis], B.wBody);
    const a0 = -105 * Math.PI / 180 + J.headAngle, arc = []; for (let i = 0; i <= 16; i++) { const a = a0 + (330 * Math.PI / 180) * i / 16; arc.push([J.head[0] + B.head * Math.cos(a), J.head[1] + B.head * Math.sin(a)]); }
    poly(arc, B.headT * 2); ctx.restore(); return J;
  }

  return { THEMES, TAU, rad, clamp, lerp, smooth, smoother, rng, noise, ring, camera, boil, background, vignette, fillPoly, onRing, onGround, figure, GAP, OPEN };
});
