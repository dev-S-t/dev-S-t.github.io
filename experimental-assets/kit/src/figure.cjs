// The stick man from the mark, in the proportions of the figure on the hero's cliff (FIG_* in assets/js/lines.js),
// with elbows and knees so he can do more than stand. Units: height 1, feet on y = 0, up is negative.
// The head is the mark's ring: open at 11 o'clock, thick where it starts and thinning as it goes round.
const { n2 } = require('./lib.cjs');

const R = 0.25, T = 0.034;           // head ring radius (to the middle of the stroke) and half its weight
const BODY = 0.072, ARM = 0.052, LEG = 0.06; // full stroke widths
const GAP_AT = -120, GAP = 30;       // the opening: centred 30 degrees left of the top, 30 degrees wide

// the poses: hip, neck, and the arms and legs as [elbow, hand] / [knee, foot]
const POSES = {
  stand: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.07, -0.31], [-0.105, -0.205]], [[0.07, -0.31], [0.11, -0.2]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  point: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.07, -0.31], [-0.105, -0.205]], [[0.15, -0.415], [0.31, -0.43]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  wave: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.07, -0.31], [-0.105, -0.205]], [[0.19, -0.45], [0.36, -0.62]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  watch: { hip: [-0.01, -0.2], neck: [0, -0.459], arms: [[[-0.07, -0.31], [-0.105, -0.205]], [[0.2, -0.44], [0.285, -0.665]]], legs: [[[-0.05, -0.1], [-0.1, 0]], [[0.05, -0.1], [0.1, 0]]] },
  // leaning back, both hands forward on something (a string)
  pull: { hip: [-0.03, -0.2], neck: [-0.085, -0.45], arms: [[[0.06, -0.37], [0.2, -0.355]], [[0.07, -0.33], [0.2, -0.345]]], legs: [[[0.07, -0.1], [0.14, 0]], [[-0.08, -0.1], [-0.15, 0]]] },
  // sitting on an edge at y = 0, legs over it, one hand on the edge behind
  sit: { hip: [0, 0], neck: [0.01, -0.259], arms: [[[-0.075, -0.1], [-0.13, 0]], [[0.07, -0.12], [0.12, -0.01]]], legs: [[[0.19, -0.005], [0.215, 0.22]], [[0.17, 0.02], [0.165, 0.24]]] }
};
// a walk, as stop-motion frames: legs swing, arms answer, the body bobs
function walkFrame(k, n = 6) {
  const ph = (k / n) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph), bob = -0.012 * Math.abs(c);
  const foot = (side) => { const x = 0.13 * s * side, lift = Math.max(0, -side * c) * 0.05; return [[x * 0.45 + 0.025, -0.1 + bob - lift * 0.5], [x, -lift]]; };
  const hand = (side) => [[-0.05 * s * side, -0.31 + bob], [-0.1 * s * side, -0.215 + bob]];
  return { hip: [0, -0.2 + bob], neck: [0.01, -0.459 + bob], arms: [hand(1), hand(-1)], legs: [foot(1), foot(-1)] };
}

// draw a pose at (x, y) = where the feet (or the seat) are, `size` px tall; mirror faces the other way
function draw(pose, { x = 0, y = 0, size = 100, fg = '#0D0D0C', mirror = false } = {}) {
  const p = typeof pose === 'string' ? POSES[pose] : pose, sx = mirror ? -1 : 1;
  const P = ([a, b]) => [x + a * size * sx, y + b * size];
  const pt = (q) => n2(q[0]) + ' ' + n2(q[1]);
  // the head sits on the neck, along the body's line
  const dx = p.neck[0] - p.hip[0], dy = p.neck[1] - p.hip[1], L = Math.hypot(dx, dy);
  const hc = [p.neck[0] + dx / L * R, p.neck[1] + dy / L * R];
  const sh = [p.neck[0] + (p.hip[0] - p.neck[0]) * 0.22, p.neck[1] + (p.hip[1] - p.neck[1]) * 0.22];
  const outer = [], inner = [], N = 56;
  const a0 = (GAP_AT + GAP / 2) * Math.PI / 180, span = (360 - GAP) * Math.PI / 180;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = a0 + span * t, w = T * (1.2 + (0.7 - 1.2) * t);
    // mirrored figures keep the opening at 11 o'clock, so the ring is drawn in screen space
    outer.push([x + (hc[0] * sx) * size + (R + w) * size * Math.cos(a), y + hc[1] * size + (R + w) * size * Math.sin(a)]);
    inner.push([x + (hc[0] * sx) * size + (R - w) * size * Math.cos(a), y + hc[1] * size + (R - w) * size * Math.sin(a)]);
  }
  const ring = 'M' + outer.concat(inner.reverse()).map(pt).join('L') + 'Z';
  const e0 = [x + hc[0] * sx * size + R * size * Math.cos(a0), y + hc[1] * size + R * size * Math.sin(a0)];
  const e1 = [x + hc[0] * sx * size + R * size * Math.cos(a0 + span), y + hc[1] * size + R * size * Math.sin(a0 + span)];
  const limb = (from, [mid, end]) => `M${pt(P(from))}L${pt(P(mid))}L${pt(P(end))}`;
  return `<g fill="${fg}"><path d="${ring}"/><circle cx="${n2(e0[0])}" cy="${n2(e0[1])}" r="${n2(T * 1.2 * size)}"/><circle cx="${n2(e1[0])}" cy="${n2(e1[1])}" r="${n2(T * 0.7 * size)}"/></g>` +
    `<g fill="none" stroke="${fg}" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M${pt(P(p.neck))}L${pt(P(p.hip))}" stroke-width="${n2(BODY * size)}"/>` +
    `<path d="${p.arms.map((a) => limb(sh, a)).join('')}" stroke-width="${n2(ARM * size)}"/>` +
    `<path d="${p.legs.map((l) => limb(p.hip, l)).join('')}" stroke-width="${n2(LEG * size)}"/></g>`;
}

module.exports = { draw, POSES, walkFrame, R, T };
