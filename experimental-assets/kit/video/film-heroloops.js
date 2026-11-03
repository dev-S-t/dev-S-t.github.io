// Seamless loops for the website, from the idea films: each one comes back to its first frame after DUR seconds, so a
// page can play it on repeat behind a section. Everything that moves completes whole cycles: rings advance exactly
// whole steps, noise travels round a circle in its own space, and the hand-drawn boil repeats.
//   loop-kept   the mark at the centre of its calm rings, the rings drifting outward (paper)
//   loop-edge   the site's tunnel of lines, and him on the cliff edge, watching (paper)
//   loop-island the kept loop, calm inside, in a field of noise (ink)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else { const f = factory(root.Ink, root.MarkBody, root.Field); root.Films = Object.assign(root.Films || {}, f); }
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 10, PI = Math.PI;
  const { clamp } = I;
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2, RIN = MB.MK.loop.r - MB.MK.loop.w / 2;
  // the boil repeats every DUR seconds
  const boil = (t, amp) => I.boil(t % DUR, amp);
  const lc = (x, y) => ({ x, y }), w = (x, y) => ({ x, y, w: true });
  const base = (id, theme, draw) => ({ id, title: id, W, H, fps: FPS, dur: DUR, theme, draw, events: () => [] });

  // ---- kept: the mark in its rings ----------------------------------------------------------------------------------
  const keptStep = 0.034;
  const kept = base('loop-kept', 'paper', (ctx, t) => {
    const { bg, fg } = I.THEMES.paper, cam = I.camera(W, H, { cx: 0, cy: 0, k: 470 }), j = boil(t, 0.9);
    I.background(ctx, 'paper', W, H);
    // rings: one whole step outward every DUR seconds, with a slow even breathing in their spacing
    const F = (x, y) => { const r = Math.hypot(x, y); return r - RO + 0.004 * Math.sin(2 * PI * t / DUR + r * 3); };
    FL.contours(ctx, F, cam, W, H, { step: keptStep, phase: (t / DUR) * 2, cell: 6, mask: (x, y) => clamp((Math.hypot(x, y) - RO - 0.03) / 0.15, 0, 1), width: 1.25, color: fg, j });
    MB.drawMark(ctx, cam, (q) => q, fg, bg, 'all');
    I.vignette(ctx, 'paper', W, H, 0.18);
  });

  // ---- edge: the tunnel and the watcher ---------------------------------------------------------------------------------
  const CT = [3.1, 1.75], CLIFF = (() => { const r = I.rng(3), top = [], face = []; for (let x = -14; x <= 0; x += 0.12) top.push([x, 0.02 * Math.sin(x * 3.1) + 0.015 * (r() - 0.5)]); for (let y = 0; y <= 14; y += 0.18) face.push([-0.04 - 0.25 * Math.sin(y * 0.7) - 0.06 * (r() - 0.5) - y * 0.12, y]); return [...top, ...face, [-14, 14]]; })();
  const edge = base('loop-edge', 'paper', (ctx, t) => {
    const { fg } = I.THEMES.paper, cam = I.camera(W, H, { cx: 1.3, cy: 0.3, k: 250 }), j = boil(t, 1.0);
    I.background(ctx, 'paper', W, H);
    const F = (x, y) => { const dx = x - CT[0], dy = y - CT[1], r = Math.hypot(dx, dy); return r * (1 + 0.035 * FL.fbm(x * 0.6, y * 0.6, 3)) + 0.06 * FL.fbm(2.2 * dx / (r + 1e-6) + 9, 2.2 * dy / (r + 1e-6) + r * 0.3, 5); };
    FL.contours(ctx, F, cam, W, H, { step: 0.085, phase: (t / DUR) * 3, cell: 7, width: 1.15, color: fg, j });
    ctx.fillStyle = fg; ctx.beginPath(); CLIFF.forEach((q, i) => { const s = j(cam(q[0], q[1])); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill();
    // him, watching: a breath every DUR / 2 seconds, his head following the tunnel a little
    const br = Math.sin(4 * PI * t / DUR), x = -0.22;
    const p = { root: { x, y: -0.33 + 0.004 * br, rot: 0, sx: 1 }, lean: 0.04, bend: 0.4, nod: 0.08 + 0.03 * Math.sin(2 * PI * t / DUR), feet: { L: w(x - 0.07, 0.02), R: w(x + 0.08, 0.02) }, knee: { L: 1, R: 1 }, hands: { F: lc(0.13, 0.05 - 0.004 * br), B: lc(-0.1, 0.06) }, elbow: { F: -1, B: 1 } };
    MB.draw(ctx, MB.body(p), cam, j, fg);
    I.vignette(ctx, 'paper', W, H, 0.18);
  });

  // ---- island: the kept loop in the noise ---------------------------------------------------------------------------
  const island = base('loop-island', 'ink', (ctx, t) => {
    const { bg, fg } = I.THEMES.ink, cam = I.camera(W, H, { cx: 0, cy: 0.02, k: 330 }), j = boil(t, 1.0), a = 2 * PI * t / DUR;
    I.background(ctx, 'ink', W, H);
    // the noise travels round a circle in its own space, so it comes back to where it started
    const ox = 1.6 * Math.cos(a), oy = 1.6 * Math.sin(a);
    const noiseF = (x, y) => FL.fbm(x * 1.25 + ox, y * 1.25 + oy, 21) + 0.35 * FL.noise(x * 3.1 + 2 * ox, y * 3.1 - 2 * oy, 33);
    FL.contours(ctx, noiseF, cam, W, H, { step: 0.07, cell: 7, mask: (x, y) => clamp((Math.hypot(x, y) - RO - 0.02) / 0.15, 0, 1) * 0.75, width: 1.0, color: fg, j });
    const calm = (x, y) => (x * 0.5 + y * 0.866) + 0.05 * Math.sin(x * 4 - a) - 0.075 * 2 * (t / DUR);
    const ctr = cam(0, 0), box = [ctr[0] - RIN * cam.k, ctr[1] - RIN * cam.k, ctr[0] + RIN * cam.k, ctr[1] + RIN * cam.k];
    FL.contours(ctx, calm, cam, W, H, { step: 0.075, cell: 5, box, mask: (x, y) => clamp((RIN - 0.04 - Math.hypot(x, y)) / 0.1, 0, 1), width: 1.0, color: fg, j });
    MB.drawMark(ctx, cam, (q) => q, fg, bg, 'all');
    I.vignette(ctx, 'ink', W, H, 0.45);
  });

  const out = { 'loop-kept': kept, 'loop-edge': edge, 'loop-island': island };
  return typeof module === 'object' && module.exports ? out : out;
});
