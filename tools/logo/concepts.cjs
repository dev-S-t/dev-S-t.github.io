// Three more concepts for the mark, built on the same figure (head, raised arms, loop, S-spine, legs).
const G = require('./logo-gen.cjs');
const { arc, outline, streaks, figure, profile, GAP, RINGS, smooth, rad, wob } = G;
const f = (v) => (Math.round(v * 100) / 100).toString();
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- 1. One line: the loop, the arms and the head are one brush stroke spiralling inward ---------- */
function spiral() {
  const rings = [RINGS.loop, RINGS.arms, RINGS.head];
  const a0 = GAP + 7, span = 720 + 330, step = 115; // each ring glides inward over the last 115 degrees before the opening
  return (t) => {
    const deg = a0 + span * t, turn = (deg - a0) / 360, k = Math.min(2, Math.floor(turn));
    const into = (deg - a0) - 360 * (k + 1) + step; // degrees into the step-in zone of ring k
    const m = k < 2 ? smooth(0, step, into) : 0; // leaves one ring and arrives on the next tangent to both
    const A = rings[k], B = rings[Math.min(2, k + 1)];
    const cx = lerp(A[0], B[0], m), cy = lerp(A[1], B[1], m);
    const r = lerp(A[2], B[2], m) * (1 + wob(t * 3, 9, 0.01));
    const a = rad(deg);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
}
function conceptOneLine() {
  G.setPrecision(260, 2);
  const s = spiral();
  const prof = { base: 5.6, seed: 11, swell: 0.1, fade: 0.42, nib: 0.7, lift: 0.08 };
  const { spine, legs } = figure(1);
  const paths = [outline(s, prof, 320), outline(...spine), outline(...legs)];
  const gaps = [...streaks(s, prof, 3, 0.9), ...streaks(...legs, 2)];
  return { paths, gaps };
}

/* ---------- 2. Engraved: every stroke drawn as fine parallel hairlines, more of them where the stroke is heavy ---------- */
function hairlines(center, prof, lines, hair = 0.95) {
  const N = 200, out = [];
  const at = (t) => {
    const e = 0.002, p = center(t), a = center(Math.max(0, t - e)), b = center(Math.min(1, t + e));
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    return { p, n: [-ty, tx], W: profile(t, { ...prof, dir: Math.atan2(ty, tx) }) };
  };
  for (let k = 0; k < lines; k++) {
    const u = lines === 1 ? 0 : k / (lines - 1) * 2 - 1; // -1 .. 1 across the stroke
    const c = (t) => { const { p, n, W } = at(t); const o = u * Math.max(0, W / 2 - hair / 2); return [p[0] + n[0] * o, p[1] + n[1] * o]; };
    // the outer hairlines give out where the stroke is thin, as an engraver's lines do
    const fn = (t) => { const { W } = at(t); return hair * (0.55 + 0.45 * smooth(0, 0.08, t)) * (1 - 0.6 * smooth(0.9, 1, t) * (prof.end === 'press' ? 0 : 1)); };
    out.push(outline(c, { fn }, N));
  }
  return out;
}
function conceptEngraved() {
  G.setPrecision(200, 2);
  const loop = arc(...RINGS.loop, GAP, 15, 1, 0.025), arms = arc(...RINGS.arms, GAP - 4, 30, 2, 0.03), head = arc(...RINGS.head, GAP, 22, 3, 0.03);
  const { spine, legs } = figure(1);
  const paths = [
    ...hairlines(loop, { base: 8.4, seed: 1, swell: 0.3 }, 4),
    ...hairlines(arms, { base: 4.6, seed: 2, swell: 0.1, nib: 0.3 }, 3),
    ...hairlines(head, { base: 5.8, seed: 3, swell: 0.22 }, 3),
    ...hairlines(spine[0], { ...spine[1], base: 3.6 }, 2, 1.1),
    ...hairlines(legs[0], { ...legs[1], base: 3.6 }, 2, 1.1)
  ];
  return { paths, gaps: [] };
}

/* ---------- 3. Stamp: an inked seal, the figure and the rings cut out of it ---------- */
function conceptStamp() {
  const { paths } = G.build({ weight: 1.25, texture: false, samples: 180, decimals: 2 });
  // the seal's edge: a disc pressed unevenly
  const edge = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; const r = 49.2 * (1 + wob(i / 160, 21, 0.012) + 0.004 * Math.sin(a * 23)); edge.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]); }
  // specks where the ink did not take
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const specks = []; for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = 49 * Math.sqrt(0.35 + 0.65 * rnd()); const s = 0.25 + 0.7 * rnd() ** 3; specks.push(`M${f(50 + r * Math.cos(a) - s)} ${f(50 + r * Math.sin(a))}a${f(s)} ${f(s)} 0 1 0 ${f(2 * s)} 0a${f(s)} ${f(s)} 0 1 0 ${f(-2 * s)} 0`); }
  return { disc: 'M' + edge.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z', paths, specks };
}

function svgOf(kind, id, attrs = '') {
  if (kind === 'stamp') {
    const { disc, paths, specks } = conceptStamp();
    return `<svg viewBox="0 0 100 100"${attrs}><mask id="${id}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><path d="${disc}" fill="#fff"/><g transform="translate(50 50) scale(.84) translate(-50 -50)"><path d="${paths.join('')}" fill="#000"/></g><path d="${specks.join('')}" fill="#000"/></mask><rect width="100" height="100" fill="currentColor" mask="url(#${id}-cut)"/></svg>`;
  }
  const { paths, gaps } = kind === 'oneline' ? conceptOneLine() : conceptEngraved();
  const mask = gaps.length ? `<mask id="${id}-dry" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${gaps.join('')}" fill="none" stroke="#000" stroke-width=".34" stroke-linecap="round"/></mask>` : '';
  return `<svg viewBox="0 0 100 100"${attrs}>${mask}<path fill="currentColor"${gaps.length ? ` mask="url(#${id}-dry)"` : ''} d="${paths.join('')}"/></svg>`;
}
module.exports = { svgOf };
