// Brush lettering for "human in loop" on the landing page (from the brand kit): one geometric skeleton, the o's of
// "loop" carry pupils so the word keeps an eye out. Also renders an even line and a streamline version.
const G = require('../logo/logo-gen.cjs');
const f = (v) => (Math.round(v * 100) / 100).toString();
const rad = (d) => d * Math.PI / 180;

// units: baseline y = 0, x-height at y = -20, ascender -32, descender +12; stroke 5
const W = 5, R = 7.5, CY = -10, XT = -20 + W / 2, AT = -32 + W / 2, DB = 12 - W / 2;
const arcPts = (cx, cy, r, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
const ln = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
const circ = (cx, cy, r) => arcPts(cx, cy, r, -90, 270, 64);

// each glyph: { w: centreline width, s: [polylines], d: [[x, y, r]] dots, eye: [cx, cy] bowls that can carry a pupil }
const glyphs = {
  h: { w: 15, s: [ln(0, AT, 0, 0), [...arcPts(R, CY, R, 180, 360), [15, 0]]] },
  n: { w: 15, s: [ln(0, XT, 0, 0), [...arcPts(R, CY, R, 180, 360), [15, 0]]] },
  m: { w: 26, s: [ln(0, XT, 0, 0), [...arcPts(6.5, CY, 6.5, 180, 360), [13, 0]], [[13, CY], ...arcPts(19.5, CY, 6.5, 180, 360), [26, 0]]] },
  u: { w: 15, s: [[[0, XT], ...arcPts(R, CY, R, 180, 0)], ln(15, XT, 15, 0)] },
  a: { w: 15, s: [circ(R, CY, R), ln(15, XT, 15, 0)] },
  i: { w: 0, s: [ln(0, XT, 0, 0)], d: [[0, -26.5, 3.2]] },
  l: { w: 0, s: [ln(0, AT, 0, 0)] },
  o: { w: 15, s: [circ(R, CY, R)], eye: [R, CY] },
  p: { w: 15, s: [ln(0, XT, 0, DB), circ(R, CY, R)] },
  d: { w: 15, s: [circ(R, CY, R), ln(15, AT, 15, 0)] },
  e: { w: 15, s: [[[1.2, CY], [15, CY], ...arcPts(R, CY, R, 0, -316).slice(1)]] },
  v: { w: 15, s: [[[0, XT], [7.5, 0], [15, XT]]] },
  '-': { w: 7, s: [ln(0, CY, 7, CY)] },
  '.': { w: 0, s: [], d: [[0, -2.6, 3.2]] }
};
const TRACK = 4.2, SPACE = 13.5;

// lay out a string: returns { strokes, dots, eyes, width } in font units
function layout(text, { eyes = 'loop', skipEyes = false } = {}) {
  let x = 0, end = 0; const strokes = [], dots = [], eyeAt = [];
  const words = text.split(' ');
  words.forEach((word, wi) => {
    [...word].forEach((ch, ci) => {
      const g = glyphs[ch]; if (!g) throw new Error('no glyph ' + ch);
      const eyed = g.eye && (eyes === 'all' || (eyes === 'loop' && word.replace(/[^a-z]/g, '').includes('loop')));
      if (!(eyed && skipEyes)) g.s.forEach((pl) => strokes.push(pl.map(([px, py]) => [px + x, py])));
      (g.d || []).forEach(([px, py, r]) => dots.push([px + x, py, r]));
      if (eyed) eyeAt.push([g.eye[0] + x, g.eye[1]]);
      end = x + g.w; x += g.w + W + TRACK;
    });
    x += SPACE - TRACK;
  });
  return { strokes, dots, eyes: eyeAt, width: end };
}

const pathOf = (pl) => 'M' + pl.map(([x, y]) => f(x) + ' ' + f(y)).join('L');
const pupil = (cx, cy, look = [1.45, -1.45], r = 2.5) => [cx + look[0], cy + look[1], r];

// renderer 1: even monoline
function mono(text, opt = {}) {
  const L = layout(text, opt), look = opt.look || [1.45, -1.45];
  const body = `<path d="${L.strokes.map(pathOf).join('')}" fill="none" stroke="currentColor" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>` +
    L.dots.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="currentColor"/>`).join('') +
    L.eyes.map(([x, y], i) => { const [px, py, r] = pupil(x, y, look); return `<circle class="pupil p${i}" data-ex="${f(x)}" data-ey="${f(y)}" data-m="2.1" cx="${f(px)}" cy="${f(py)}" r="${r}" fill="currentColor"/>`; }).join('');
  return { body, width: L.width, box: [-W / 2 - 1, -32 - 1, L.width + W + 2, 46] };
}

// renderer 2: brush, each stroke pressed on and lifted off
function brush(text, opt = {}) {
  const L = layout(text, opt), look = opt.look || [1.45, -1.45];
  G.setPrecision(56, 1);
  const along = (pl) => { const seg = [0]; for (let i = 1; i < pl.length; i++) seg.push(seg[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1])); const T = seg[seg.length - 1]; return (t) => { const s = t * T; let i = 1; while (i < seg.length - 1 && seg[i] < s) i++; const u = (s - seg[i - 1]) / ((seg[i] - seg[i - 1]) || 1); return [pl[i - 1][0] + (pl[i][0] - pl[i - 1][0]) * u, pl[i - 1][1] + (pl[i][1] - pl[i - 1][1]) * u]; }; };
  const paths = L.strokes.map((pl, i) => G.outline(along(pl), { base: W * 1.14, seed: i * 3 + 1, swell: 0.1, nib: 0.62, start: 'press', end: 'press' }, pl.length > 20 ? 56 : 14));
  const body = `<path d="${paths.join('')}" fill="currentColor"/>` +
    L.dots.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r * 1.05}" fill="currentColor"/>`).join('') +
    L.eyes.map(([x, y], i) => { const [px, py, r] = pupil(x, y, look); return `<circle class="pupil p${i}" data-ex="${f(x)}" data-ey="${f(y)}" data-m="2.1" cx="${f(px)}" cy="${f(py)}" r="${r}" fill="currentColor"/>`; }).join('');
  return { body, width: L.width, box: [-W / 2 - 1.5, -32 - 1.5, L.width + W + 3, 47] };
}

// renderer 3: streamline, every stroke drawn as three parallel lines
function offsetPl(pl, d) {
  const closed = Math.hypot(pl[0][0] - pl[pl.length - 1][0], pl[0][1] - pl[pl.length - 1][1]) < 0.01;
  return pl.map((p, i) => {
    const a = pl[i === 0 ? (closed ? pl.length - 2 : 0) : i - 1], b = pl[i === pl.length - 1 ? (closed ? 1 : i) : i + 1];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    return [p[0] - ty * d, p[1] + tx * d];
  });
}
function densify(pl) { const out = [pl[0]]; for (let i = 1; i < pl.length; i++) { const [x0, y0] = pl[i - 1], [x1, y1] = pl[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2.4)); for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); } return out; }
function stream(text, opt = {}) {
  const L = layout(text, opt), look = opt.look || [1.45, -1.45], gap = opt.gap || 1.9, hair = opt.hair || 0.95;
  const lines = L.strokes.flatMap((pl) => { const d = densify(pl); return [-gap, 0, gap].map((o) => pathOf(o ? offsetPl(d, o) : d)); });
  const body = `<path d="${lines.join('')}" fill="none" stroke="currentColor" stroke-width="${hair}" stroke-linecap="round" stroke-linejoin="round"/>` +
    L.dots.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r - 0.6)}" fill="none" stroke="currentColor" stroke-width="${hair}"/><circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="currentColor"/>`).join('') +
    L.eyes.map(([x, y], i) => { const [px, py] = pupil(x, y, look); return `<circle class="pupil p${i}" data-ex="${f(x)}" data-ey="${f(y)}" data-m="1.5" cx="${f(px)}" cy="${f(py)}" r="2.3" fill="currentColor"/>`; }).join('');
  return { body, width: L.width, box: [-W / 2 - 1, -32 - 1, L.width + W + 2, 46] };
}

const svg = (r, attrs = '') => `<svg viewBox="${r.box.map(f).join(' ')}"${attrs}>${r.body}</svg>`;
// the even line without the eyed o's: returns the letters and where each o goes
function monoBare(text) {
  const L = layout(text, { skipEyes: true });
  const body = `<path d="${L.strokes.map(pathOf).join('')}" fill="none" stroke="currentColor" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>` +
    L.dots.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="currentColor"/>`).join('');
  return { body, width: L.width, eyes: L.eyes, box: [-W / 2 - 1, -33, L.width + W + 2, 46] };
}
module.exports = { mono, brush, stream, monoBare, svg, layout, W };

if (require.main === module) {
  const fs = require('fs');
  const t = 'human in loop', d = 'human-in-loop.dev';
  const rows = [mono(t), brush(t), stream(t), mono(d), brush(d), stream(d)].map((r) => `<div>${svg(r, ' height="120"')}</div>`).join('');
  fs.writeFileSync(__dirname + '/type-proof.html', `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:30px;background:#F3F1EC;color:#0D0D0C;display:grid;gap:26px}</style>${rows}`);
  console.log('ok');
}
