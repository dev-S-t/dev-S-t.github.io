// FILM 16, Both Readings. The AI loop is black and white: both readings of where AI is going. The picture is split
// down the middle, paper on the left, ink on the right, and his loop stands on the seam. He looks left: the lines on the
// paper side settle into calm, even flow. He steps toward it, and that reading floods the picture. A crackle from the
// other side: he turns, the lines on the ink side go wild, he steps toward them, and the ink floods in. Left, right,
// left: he is yanked back and forth between them, faster, until he stops, shakes his head and plants himself on the
// seam. Then the loop itself starts to come apart along the seam, a half drifting each way. He reaches out, an arm into
// each side, catches the halves and pulls them back together; to hold them shut he takes his arms up over his head,
// elbows bent, then further, and the straight arms bend round into a ring, one front foot braced up the curve. What
// is left is the mark, half black, half white: holding both readings at once.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'), require('./field.js'));
  else (root.Films = root.Films || {}).readings = factory(root.Ink, root.MarkBody, root.Field);
})(this, function (I, MB, FL) {
  const W = 1920, H = 1080, FPS = 30, DUR = 21, PI = Math.PI;
  const { smooth, smoother, lerp, clamp } = I;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1), bump = (t, a, b) => Math.sin(PI * seg(t, a, b));
  const lp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const wq = (q) => ({ x: q[0], y: q[1], w: true }), lc = (q) => ({ x: q[0], y: q[1] });
  const lrp = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  const key = (ks) => (t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lrp(ks[i - 1][1], ks[i][1], smoother((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]))); return ks[ks.length - 1][1]; };
  const step = (ks) => (t) => { let v = ks[0][1]; for (const [k, x] of ks) if (t >= k) v = x; return v; };
  const table = (f) => { const o = [0]; for (let i = 1; i <= DUR * 240 + 2; i++) o.push(o[i - 1] + f(i / 240) / 240); return (t) => { const x = clamp(t, 0, DUR) * 240, i = Math.min(o.length - 2, Math.floor(x)); return lerp(o[i], o[i + 1], x - i); }; };
  const RF = 0.705, floorY = (x) => Math.sqrt(Math.max(0, RF * RF - x * x));
  const MP = MB.MARK_POSE(0, 0), ML = MB.MARK_LEAN, MH = (k) => [MP.hands[k].x, MP.hands[k].y], MF = (k) => [MP.feet[k].x, MP.feet[k].y], SHM = MB.MK.armF[0];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // ---- the story's clock ----------------------------------------------------------------------------------------------
  const T = { look1: 2.2, calm: [2.4, 3.6], step1: [3.6, 4.8], crack: 5.3, turn2: 5.55, wild: [5.6, 6.6], step2: [6.3, 7.5], yank: [7.9, 10.3], stop: [10.3, 11.4],
    split: [11.6, 12.8], reach: [12.6, 13.5], pull: [13.5, 14.6], up: [14.6, 15.6], over: [15.6, 16.4], round: [16.4, 17.2], settle: [17.4, 18.0], mark: [18.4, 19.2] };
  // where he stands (his pelvis, along the floor), which way he faces
  const YANK = [7.9, 8.6, 9.2, 9.75, 10.3];
  const bodyX = key([[0, 0], [T.step1[0], 0], [T.step1[1], -0.22], [T.step2[0], -0.22], [T.step2[1], 0.22], [YANK[0], 0.22], [YANK[1], -0.2], [YANK[2], 0.2], [YANK[3], -0.17], [YANK[4], 0.1], [T.stop[1], 0.0], [DUR, 0.0]]);
  const facing = step([[0, 1], [T.look1, -1], [T.turn2, 1], [YANK[0] + 0.05, -1], [YANK[1] + 0.05, 1], [YANK[2] + 0.05, -1], [YANK[3] + 0.05, 1], [T.split[0] + 0.2, -1], [T.split[0] + 0.75, 1]]);
  // the seam: stepping toward a reading floods the picture with it (toward paper: the seam moves right)
  const seam = (t) => -6.5 * bodyX(t) * (1 - smooth(T.stop[0], T.stop[1], t)) + 0;
  // how far each side has turned into its reading
  const calmA = (t) => smooth(T.calm[0], T.calm[1], t);
  const wildA = (t) => smooth(T.wild[0], T.wild[1], t);
  // the loop coming apart along the seam, and pulled back together
  const gap = key([[0, 0], [T.split[0], 0], [T.split[1], 0.12], [T.reach[1], 0.16], [T.pull[1], 0.0], [DUR, 0]]);

  // ---- him ---------------------------------------------------------------------------------------------------------
  const walked = table((t) => Math.abs(bodyX(t + 0.01) - bodyX(t - 0.01)) / 0.02);
  const speed = (t) => Math.abs(bodyX(t + 0.03) - bodyX(t - 0.03)) / 0.06;
  function standPose(t) {
    const x = bodyX(t), sx = facing(t), mv = smooth(0.05, 0.25, speed(t)), S = 0.13, ph = walked(t) / (2 * S);
    const foot = (q) => { const f = q - Math.floor(q); if (f < 0.5) return [S / 2 - S * (f / 0.5), 0]; const u = (f - 0.5) / 0.5; return [-S / 2 + S * (0.5 - 0.5 * Math.cos(PI * u)), -0.05 * Math.sin(PI * u)]; };
    // which way he is moving decides which way the stride goes, whatever way he faces
    const dir = Math.sign(bodyX(t + 0.03) - bodyX(t - 0.03)) || sx;
    const fp = (q, rest) => { const w = foot(q), fx = x + dir * w[0] * mv + rest * (1 - mv); return [fx, floorY(fx) + w[1] * mv]; };
    const fL = fp(ph, -0.075 * sx), fR = fp(ph + 0.5, 0.08 * sx), hip = 0.322 + 0.006 * Math.cos(4 * PI * ph) * mv;
    // the yank: thrown about; then dizzy
    const yk = bump(t, YANK[0], YANK[4]), dz = bump(t, T.stop[0], T.stop[1]);
    let lean = 0.04 + 0.08 * mv + 0.1 * yk * Math.sin(t * 9), nod = 0.1;
    // looking at the calm side: content; at the wild side: alarmed, leaning back
    nod += -0.12 * bump(t, T.calm[0], T.step1[0] + 0.4) - 0.2 * bump(t, T.crack, T.crack + 0.5);
    lean += -0.18 * bump(t, T.wild[0], T.step2[1]);
    nod += 0.18 * Math.sin((t - T.stop[0]) * 16) * dz;            // shaking his head
    const sw = Math.sin(2 * PI * ph) * mv;
    return { root: { x, y: floorY(x) - hip, rot: 0, sx }, lean, bend: 0.5, nod, sh: MB.B.shN,
      feet: { L: wq(fL), R: wq(fR) }, knee: { L: 1, R: 1 }, hands: { F: lc([0.13 + 0.1 * sw, 0.05]), B: lc([-0.1 - 0.1 * sw, 0.06]) }, elbow: { F: -1, B: 1 } };
  }
  // the hold: reaching out to each half of the loop, pulling them in, then arms up over his head and round into a ring;
  // bracing for it, his front foot steps up the curve (the legs of the mark)
  const GAPX = (t) => gap(t);
  function holdPose(t) {
    const p = standPose(Math.min(t, T.stop[1] + 0.2));
    const brace = smoother(seg(t, T.pull[0], T.up[0] + 0.3)), toMark = smoother(seg(t, T.up[0], T.over[1]));
    const pel = lp([p.root.x, p.root.y], [MP.root.x, MP.root.y], toMark);
    // the halves' inner edges, at shoulder height: where his hands catch them
    const shY = pel[1] - MB.B.spine * (1 - MB.B.sh);
    const edgeL = [-Math.sqrt(Math.max(0, (MB.MK.loop.r - MB.MK.loop.w / 2) ** 2 - shY * shY)) - GAPX(t) + 0.03, shY], edgeR = [-edgeL[0], shY];
    const reach = smoother(seg(t, ...T.reach));
    const rest = { F: [pel[0] + 0.13, pel[1] + 0.05], B: [pel[0] - 0.1, pel[1] + 0.06] };
    // out to the halves (front arm to the right, back arm to the left)
    let hF = lp(rest.F, edgeR, reach), hB = lp(rest.B, edgeL, reach), lenF = 0.36, lenB = 0.36, round = 0, sh = MB.B.shN;
    // the arms lengthen as he reaches: long arms, like the mark's
    lenF = lerp(0.36, dist(SHM, edgeR) * 1.04, reach); lenB = lerp(0.36, dist(SHM, edgeL) * 1.04, reach); sh = lerp(MB.B.shN, MB.B.sh, reach);
    // up over his head, elbows bent; further, straight; then round
    const up = smoother(seg(t, ...T.up)), over = smoother(seg(t, ...T.over)), rnd = smoother(seg(t, ...T.round));
    const UPF = [0.3, -0.36], UPB = [-0.32, -0.3];
    hF = lp(hF, UPF, up); hB = lp(hB, UPB, up); lenF = lerp(lenF, 0.86, up); lenB = lerp(lenB, 0.82, up);
    // further: the elbows' angle goes, the arms straight up in a V, one into each half
    const VF = [0.53, -0.3], VB = [-0.52, -0.28];
    hF = lp(hF, VF, over); hB = lp(hB, VB, over); lenF = lerp(lenF, dist(SHM, VF), over); lenB = lerp(lenB, dist(SHM, VB), over);
    // then the straight arms bend round over his head into a ring (an arc from the start, so no elbow comes back)
    if (t >= T.round[0]) { hF = lp(VF, MH('F'), rnd); hB = lp(VB, MH('B'), rnd); lenF = lerp(dist(SHM, VF), MB.B.armF, rnd); lenB = lerp(dist(SHM, VB), MB.B.armB, rnd); round = 1; }
    // the brace: back foot low, front foot steps up the curve
    const fL = lp([p.feet.L.x, p.feet.L.y], MF('L'), brace), fR0 = [p.feet.R.x, p.feet.R.y], fR = lp(fR0, MF('R'), brace), lift = 0.09 * Math.sin(PI * brace);
    const sxF = p.root.sx;
    return { root: { x: pel[0], y: pel[1], rot: 0, sx: sxF }, lean: lerp(p.lean, ML, toMark), bend: lerp(0.5, 1, toMark), nod: lerp(p.nod, -ML, toMark), sh,
      feet: { L: wq(fL), R: wq([fR[0], fR[1] - lift]) }, knee: { L: brace > 0.5 ? -1 : 1, R: 1 }, fore: { L: 0.85 * brace, R: 0 },
      hands: { F: wq(hF), B: wq(hB) }, elbow: { F: 1, B: -1 }, armLen: { F: Math.max(lenF, dist(SHM, hF) * 1.01), B: Math.max(lenB, dist(SHM, hB) * 1.01) }, round: { F: round, B: round } };
  }
  function hero(t) {
    if (t < T.split[0] + 0.8) return MB.body(standPose(t));
    let ln = MB.body(holdPose(t));
    if (t > T.settle[0]) ln = MB.settle(ln, smoother(seg(t, ...T.settle)));
    return ln;
  }

  // ---- the two readings ----------------------------------------------------------------------------------------------
  const MID = (t) => (x, y) => y + 0.09 * FL.fbm(x * 0.8 + 0.18 * t, y * 0.8, 3);
  const CALM = (t) => (x, y) => y + 0.035 * Math.sin(x * 1.6 + 0.5 * t) + 0.01 * Math.sin(x * 3.1 - 0.3 * t);
  const WILD = (t) => (x, y) => y + 0.34 * FL.fbm(x * 1.7 + 0.9 * t, y * 1.7 - 0.6 * t, 11) + 0.12 * FL.noise(x * 4.2 - 1.6 * t, y * 4.2 + t, 19);
  const RO = MB.MK.loop.r + MB.MK.loop.w / 2;
  function side(ctx, t, cam, j, which, x0, x1) {
    const th = which === 'paper' ? I.THEMES.paper : I.THEMES.ink, { bg, fg } = th;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
    ctx.fillStyle = bg; ctx.fillRect(x0, 0, x1 - x0, H);
    const a = which === 'paper' ? calmA(t) : wildA(t), m = MID(t), r = which === 'paper' ? CALM(t) : WILD(t);
    const F = (x, y) => (1 - a) * m(x, y) + a * r(x, y);
    const g = gap(t), mask = (x, y) => { const dx = x < 0 ? x + g : x - g; return clamp((Math.hypot(dx, y) - RO - 0.05) / 0.12, 0, 1); };
    FL.contours(ctx, F, cam, W, H, { step: which === 'paper' ? lerp(0.075, 0.09, a) : lerp(0.075, 0.06, a), cell: 6, mask, width: 1.25, color: fg, j, box: [x0 - 2, 0, x1 + 2, H] });
    // the loop, in two halves that can drift apart along the seam
    const c = cam(0, 0);
    for (const s of [-1, 1]) { ctx.save(); ctx.beginPath(); ctx.rect(s < 0 ? 0 : c[0], 0, s < 0 ? c[0] : W - c[0], H); ctx.clip(); MB.drawMark(ctx, cam, j, fg, bg, 'loop', [s * g, 0], 0); ctx.restore(); }
    // him
    const mk = smoother(seg(t, ...T.mark));
    if (mk < 1) { ctx.globalAlpha = 1 - smooth(0.3, 0.7, mk); MB.draw(ctx, hero(t), cam, j, fg); ctx.globalAlpha = 1; }
    if (mk > 0) { ctx.globalAlpha = smooth(0, 0.6, mk); MB.drawMark(ctx, cam, j, fg, bg, 'figure', [0, 0], 0); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  // ---- camera, picture -------------------------------------------------------------------------------------------------
  function camAt(t) {
    const k = key([[0, 330], [T.stop[1], 340], [T.split[1], 380], [T.mark[1], 400], [DUR, 410]])(t);
    const jolt = 0.012 * bump(t, YANK[0], YANK[4]) * Math.sin(t * 50);
    return I.camera(W, H, { cx: jolt, cy: 0.03, k });
  }
  function draw(ctx, t) {
    const cam = camAt(t), j = I.boil(t, 1.0), sxs = W / 2 + seam(t) * cam.k;
    side(ctx, t, cam, j, 'paper', 0, sxs);
    side(ctx, t, cam, j, 'ink', sxs, W);
    const fade = Math.max(1 - smooth(0, 0.8, t), smooth(DUR - 0.8, DUR, t)); if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = '#7f7e7a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  function events() {
    const ev = [{ t: 0, type: 'pad', amp: 0.03, chords: [[0, 5.6, [130.81, 196, 261.63, 329.63]], [5.3, 11.6, [123.47, 185, 246.94, 293.66]], [11.2, 17.2, [110, 164.81, 220, 277.18]], [16.8, DUR + 0.5, [130.81, 196, 261.63, 329.63, 392]]] }];
    const L = Math.ceil(DUR * 20) + 2;
    ev.push({ t: 0, type: 'chatter', dur: DUR, track: Array.from({ length: L }, (_, i) => { const s = i / 20; return 0.6 * wildA(s) * clamp(0.5 - seam(s) / 3, 0.2, 1); }) });
    ev.push({ t: T.look1, type: 'swish' }, { t: T.calm[0] + 0.2, type: 'hi', notes: [523.25, 659.25] }, { t: T.crack, type: 'crack' }, { t: T.turn2, type: 'swish' });
    for (const s of [T.step1[0] + 0.3, T.step1[0] + 0.75, T.step2[0] + 0.3, T.step2[0] + 0.75]) ev.push({ t: s, type: 'step', amp: 0.2 });
    YANK.slice(0, 4).forEach((y, i) => ev.push({ t: y, type: 'whoosh', dur: 0.5, amp: 0.12, from: i % 2 ? 0.5 : -0.5, to: i % 2 ? -0.5 : 0.5 }));
    ev.push({ t: T.stop[0] + 0.25, type: 'twinkle', notes: [1318.5, 1174.7, 1046.5, 987.8] });
    ev.push({ t: T.split[0], type: 'creak' }, { t: T.reach[1], type: 'tap' }, { t: T.pull[1] - 0.05, type: 'land' }, { t: T.up[0], type: 'rise', dur: T.round[1] - T.up[0] }, { t: T.mark[0] + 0.2, type: 'chime', f: 1046.5, amp: 0.1 });
    return ev.sort((a, b) => a.t - b.t);
  }

  return { id: 'readings', title: 'Both Readings', W, H, fps: FPS, dur: DUR, theme: 'paper', draw, events };
});
