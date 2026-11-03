// The stick man as a skeleton. Bones keep their lengths (the hero figure's proportions: a big ring head, short
// limbs); legs are solved with two-bone IK so feet stay where they are put; walking and running are driven by the
// distance travelled, so a planted foot never slides. Everything is a pure function: the same input gives the same
// pose, so a frame can be drawn at any time, in any order.
// Units: the figure is 1 tall, feet on y = 0, up is negative, x is the way he faces.
// Works in the browser (window.Rig) and in Node (require).
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Rig = factory(); })(this, function () {
  const B = {
    head: 0.25, headT: 0.034,          // head ring radius (to the middle of its stroke), half its weight at the thick end
    torso: 0.259, shoulder: 0.22,      // pelvis to neck; shoulders this far down from the neck
    upper: 0.15, fore: 0.14,           // upper arm, forearm (a little longer than the mark's figure, so arms act)
    thigh: 0.12, shin: 0.118,          // thigh, shin
    hip: 0.226,                        // pelvis height standing
    wBody: 0.072, wArm: 0.052, wLeg: 0.06
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = {
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t,
    sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
    back: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

  // two-bone IK: the knee goes to the front (x+)
  function ik(ax, ay, bx, by, l1, l2) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); const m = (l1 + l2) * 0.9995;
    if (d > m) { bx = ax + dx / d * m; by = ay + dy / d * m; dx = bx - ax; dy = by - ay; d = m; }
    d = Math.max(d, 1e-6);
    const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - a;
    return [[ax + l1 * Math.cos(k), ay + l1 * Math.sin(k)], [bx, by]];
  }

  // a pose: pelvis (px, py), torso lean (+ forward), head nod, arms [shoulder angle from straight down, + forward;
  // elbow bend, + forward], feet targets [x, y]
  const stand = () => ({ px: 0, py: -B.hip, lean: 0.02, nod: 0, armL: [-0.16, 0.12], armR: [0.16, 0.12], footL: [-0.06, 0], footR: [0.06, 0] });
  function mix(a, b, t) {
    const m2 = (p, q) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
    return { px: lerp(a.px, b.px, t), py: lerp(a.py, b.py, t), lean: lerp(a.lean, b.lean, t), nod: lerp(a.nod || 0, b.nod || 0, t), armL: m2(a.armL, b.armL), armR: m2(a.armR, b.armR), footL: m2(a.footL, b.footL), footR: m2(a.footR, b.footR) };
  }

  // a walk, at distance d along the ground (d in figure heights). One cycle is two strides.
  function walk(d, o = {}) {
    const s = o.stride ?? 0.15, lift = o.lift ?? 0.04, bob = o.bob ?? 0.008, sw = o.swing ?? 0.45;
    const ph = d / (2 * s), c = Math.cos(TAU * ph);
    const foot = (q) => { const f = q - Math.floor(q); if (f < 0.5) { const u = f / 0.5; return [s / 2 - s * u, 0]; } const u = (f - 0.5) / 0.5; return [-s / 2 + s * ease.sine(u), -lift * Math.sin(Math.PI * u)]; };
    return { px: 0.01, py: -B.hip + 0.006 + bob * Math.cos(2 * TAU * ph), lean: (o.lean ?? 0.06) + 0.015 * Math.cos(2 * TAU * ph), nod: 0.035 * Math.sin(2 * TAU * ph - 0.9),
      armL: [-sw * c, 0.22 + 0.32 * Math.max(0, -c)], armR: [sw * c, 0.22 + 0.32 * Math.max(0, c)], footL: foot(ph), footR: foot(ph + 0.5) };
  }
  // a run: longer strides, a moment in the air, leaning in, arms bent and pumping
  function run(d, o = {}) {
    const s = o.stride ?? 0.24, sf = 0.36, lift = o.lift ?? 0.09, Dc = 2 * s, sw = o.swing ?? 0.95;
    const ph = d / Dc, c = Math.cos(TAU * ph);
    const foot = (q) => { const f = q - Math.floor(q), st = sf * Dc; if (f < sf) { const u = f / sf; return [st / 2 - st * u, 0]; } const u = (f - sf) / (1 - sf); return [-st / 2 + st * ease.sine(u), -lift * Math.sin(Math.PI * u) - 0.02 * Math.sin(Math.PI * u) * (u < 0.5 ? 1 : 0)]; };
    const air = Math.max(0, Math.sin(2 * TAU * ph - 0.5));
    return { px: 0.03, py: -B.hip + 0.018 - 0.022 * air, lean: o.lean ?? 0.24, nod: 0.05 * Math.sin(2 * TAU * ph - 1.2),
      armL: [-sw * c * 0.8 + 0.25, 1.35], armR: [sw * c * 0.8 + 0.25, 1.35], footL: foot(ph), footR: foot(ph + 0.5) };
  }
  // a standing jump between two points on the ground: crouch, spring, tuck, land, absorb, rise.
  // u runs 0..1 over the whole jump; the pelvis travels `dist` forward, `height` up at the top
  function jump(u, dist, height) {
    const crouch = { px: -0.01, py: -0.13, lean: 0.32, nod: 0.12, armL: [-0.95, 0.35], armR: [-0.8, 0.3], footL: [-0.035, 0], footR: [0.045, 0] };
    const reach = { px: 0.02, py: -B.hip - 0.02, lean: 0.1, nod: -0.05, armL: [2.4, 0.2], armR: [2.55, 0.15], footL: [-0.02, 0], footR: [0.02, 0] };
    const tuck = { px: 0, py: -B.hip, lean: 0.12, nod: -0.02, armL: [1.7, 0.4], armR: [1.85, 0.35], footL: [-0.05, -0.1], footR: [0.03, -0.11] };
    const land = { px: 0.02, py: -0.135, lean: 0.25, nod: 0.08, armL: [0.9, 0.4], armR: [1.05, 0.35], footL: [-0.04, 0], footR: [0.05, 0] };
    const k = [0, 0.22, 0.34, 0.66, 0.8, 1];       // crouch, take off, top, touch down, absorbed, up
    let p, x = 0, y = 0;
    if (u < k[1]) p = mix(stand(), crouch, ease.io(seg(u, 0, k[1])));
    else if (u < k[2]) p = mix(crouch, reach, ease.out(seg(u, k[1], k[2])));
    else if (u < k[3]) p = mix(reach, tuck, ease.out(seg(u, k[2], (k[2] + k[3]) / 2)));
    else if (u < k[4]) p = mix(tuck, land, ease.out(seg(u, k[3], k[4])));
    else p = mix(land, stand(), ease.io(seg(u, k[4], 1)));
    // the flight: from take-off to touch-down the body follows a parabola; the feet go with it
    const f = seg(u, k[1] + 0.04, k[3]);
    if (f > 0 && f < 1) { x = dist * f; y = -height * 4 * f * (1 - f); }
    else if (f >= 1) x = dist;
    // the feet travel with the body (y is 0 on the ground)
    return { ...p, px: p.px + x, py: p.py + y, footL: [p.footL[0] + x, p.footL[1] + y], footR: [p.footR[0] + x, p.footR[1] + y] };
  }

  // a running leap, u 0..1 across the flight: the body rises and falls `height`; the front leg reaches forward and
  // the back leg trails, then they swap their reach for the landing; arms go up and forward like a long jumper
  function leap(u, height) {
    const y = -height * 4 * u * (1 - u), spread = Math.sin(Math.PI * Math.min(1, u * 1.15));
    return { px: 0.03, py: -B.hip - 0.01 + y, lean: 0.2 - 0.12 * u, nod: -0.06 + 0.1 * u,
      armL: [lerp(1.2, 0.5, u), 0.5], armR: [lerp(2.2, 1.0, u), 0.3],
      footL: [-0.05 - 0.13 * spread, y - 0.04 - 0.05 * spread], footR: [0.07 + 0.1 * spread, y - 0.06 * spread] };
  }

  // joint positions of a pose
  function solve(p) {
    const P = [p.px, p.py], up = [Math.sin(p.lean), -Math.cos(p.lean)];
    const N = [P[0] + up[0] * B.torso, P[1] + up[1] * B.torso], ha = p.lean + (p.nod || 0);
    const H = [N[0] + Math.sin(ha) * B.head, N[1] - Math.cos(ha) * B.head];
    const S = [N[0] + (P[0] - N[0]) * B.shoulder, N[1] + (P[1] - N[1]) * B.shoulder];
    const arm = ([a1, a2]) => { const e = [S[0] + Math.sin(a1) * B.upper, S[1] + Math.cos(a1) * B.upper]; return [S, e, [e[0] + Math.sin(a1 + a2) * B.fore, e[1] + Math.cos(a1 + a2) * B.fore]]; };
    const leg = (f) => { const [k, ft] = ik(P[0], P[1], f[0], f[1], B.thigh, B.shin); return [P, k, ft]; };
    return { head: H, headAngle: ha, neck: N, pelvis: P, armL: arm(p.armL), armR: arm(p.armR), legL: leg(p.footL), legR: leg(p.footR) };
  }

  // put a hand at (hx, hy) (figure units, his own frame): two-bone IK, the elbow below the line to the hand, so
  // the forearm bends forward as an arm does. side is 'armL' or 'armR'
  function reach(p, side, hx, hy) {
    const S = solve(p)[side][0]; let dx = hx - S[0], dy = hy - S[1], d = Math.hypot(dx, dy); const m = (B.upper + B.fore) * 0.999;
    if (d > m) { dx *= m / d; dy *= m / d; d = m; }
    d = Math.max(d, 1e-6);
    const al = Math.acos(clamp((B.upper * B.upper + d * d - B.fore * B.fore) / (2 * B.upper * d), -1, 1)), a1 = Math.atan2(dx, dy) - al;
    const e = [S[0] + Math.sin(a1) * B.upper, S[1] + Math.cos(a1) * B.upper];
    return { ...p, [side]: [a1, Math.atan2(S[0] + dx - e[0], S[1] + dy - e[1]) - a1] };
  }
  // where a hand is (his own frame)
  const hand = (p, side) => solve(p)[side][2];

  // the head ring as a closed outline (with its two round ends as separate circles): open at 11 o'clock in the
  // figure's own frame (it turns with him), thick where it starts, thinning as it goes round
  function headRing(cx, cy, r, t, turn = 0, n = 40) {
    const a0 = (-105) * Math.PI / 180 + turn, span = 330 * Math.PI / 180, o = [], i = [];
    for (let k = 0; k <= n; k++) { const u = k / n, a = a0 + span * u, w = t * (1.2 - 0.5 * u); o.push([cx + (r + w) * Math.cos(a), cy + (r + w) * Math.sin(a)]); i.push([cx + (r - w) * Math.cos(a), cy + (r - w) * Math.sin(a)]); }
    return { outline: o.concat(i.reverse()), ends: [[cx + r * Math.cos(a0), cy + r * Math.sin(a0), t * 1.2], [cx + r * Math.cos(a0 + span), cy + r * Math.sin(a0 + span), t * 0.7]] };
  }

  // draw on a canvas 2D context. map(x, y) takes figure units to the picture (it can bend round a planet);
  // k is px per unit near the figure (for line widths); turn is how far the figure's up has turned (for the head)
  function draw(ctx, pose, map, k, ink, turn = 0) {
    const j = solve(pose), m = (q) => map(q[0], q[1]);
    ctx.save(); ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const poly = (pts, w) => { ctx.lineWidth = w * k; ctx.beginPath(); pts.forEach((q, i) => { const [x, y] = m(q); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); };
    poly(j.legL, B.wLeg); poly(j.armL, B.wArm);
    poly([j.neck, j.pelvis], B.wBody);
    poly(j.legR, B.wLeg); poly(j.armR, B.wArm);
    const h = headRing(j.head[0], j.head[1], B.head, B.headT, j.headAngle);
    ctx.beginPath(); h.outline.forEach((q, i) => { const [x, y] = m(q); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill();
    h.ends.forEach(([x, y, r]) => { const [X, Y] = m([x, y]); ctx.beginPath(); ctx.arc(X, Y, r * k, 0, TAU); ctx.fill(); });
    ctx.restore();
    return j;
  }
  // the same, as SVG path data (for the site's loaders): strokes grouped by width, and the head as a fill
  function svgParts(pose, map) {
    const j = solve(pose), f = (v) => Math.round(v * 10) / 10, pt = (q) => { const [x, y] = map(q[0], q[1]); return f(x) + ' ' + f(y); };
    const line = (pts) => 'M' + pts.map(pt).join('L');
    const h = headRing(j.head[0], j.head[1], B.head, B.headT, j.headAngle, 28);
    const ends = h.ends.map(([x, y, r]) => { const [X, Y] = map(x, y); return [f(X), f(Y), r]; });
    return { legs: line(j.legL) + line(j.legR), arms: line(j.armL) + line(j.armR), body: line([j.neck, j.pelvis]), head: 'M' + h.outline.map(pt).join('L') + 'Z', ends };
  }

  return { B, TAU, clamp, lerp, ease, seg, ik, stand, mix, walk, run, jump, leap, solve, reach, hand, headRing, draw, svgParts };
});
