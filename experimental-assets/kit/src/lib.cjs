// Shared pieces for the kit: the two colours, a seeded random, the site's noise, compact path data, the SVG wrapper.
const PAPER = '#F3F1EC', INK = '#0D0D0C';
// paper: ink lines on paper (the site's light theme); ink: paper lines on ink
const THEMES = { paper: { bg: PAPER, fg: INK }, ink: { bg: INK, fg: PAPER } };

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// the site's 2D simplex noise and warped fbm (assets/js/lines.js)
const mod289 = (x) => x - Math.floor(x / 289) * 289, perm = (x) => mod289(((x * 34) + 1) * x), fract = (x) => x - Math.floor(x);
const Cx = 0.211324865405187, Cy = 0.366025403784439, Cz = -0.577350269189626, Cw = 0.024390243902439;
function sn(vx, vy) {
  const s = (vx + vy) * Cy; let ix = Math.floor(vx + s), iy = Math.floor(vy + s);
  const t = (ix + iy) * Cx, x0x = vx - ix + t, x0y = vy - iy + t, i1x = x0x > x0y ? 1 : 0, i1y = 1 - i1x;
  const ax = x0x + Cx - i1x, ay = x0y + Cx - i1y, bx = x0x + Cz, by = x0y + Cz;
  ix = mod289(ix); iy = mod289(iy);
  const p0 = perm(perm(iy) + ix), p1 = perm(perm(iy + i1y) + ix + i1x), p2 = perm(perm(iy + 1) + ix + 1);
  let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0), m1 = Math.max(0.5 - (ax * ax + ay * ay), 0), m2 = Math.max(0.5 - (bx * bx + by * by), 0);
  m0 *= m0; m0 *= m0; m1 *= m1; m1 *= m1; m2 *= m2; m2 *= m2;
  const q0 = 2 * fract(p0 * Cw) - 1, q1 = 2 * fract(p1 * Cw) - 1, q2 = 2 * fract(p2 * Cw) - 1;
  const h0 = Math.abs(q0) - 0.5, h1 = Math.abs(q1) - 0.5, h2 = Math.abs(q2) - 0.5;
  const a0 = q0 - Math.floor(q0 + 0.5), a1 = q1 - Math.floor(q1 + 0.5), a2 = q2 - Math.floor(q2 + 0.5);
  m0 *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h0 * h0);
  m1 *= 1.79284291400159 - 0.85373472095314 * (a1 * a1 + h1 * h1);
  m2 *= 1.79284291400159 - 0.85373472095314 * (a2 * a2 + h2 * h2);
  return 130 * (m0 * (a0 * x0x + h0 * x0y) + m1 * (a1 * ax + h1 * ay) + m2 * (a2 * bx + h2 * by));
}
function fbm(qx, qy, t = 0) {
  const wx = sn(qx * 0.7 + t, qy * 0.7 - 0.7 * t), wy = sn(qx * 0.7 + 5.2 - 0.6 * t, qy * 0.7 + 1.3 + t);
  return 0.62 * sn(qx + 0.55 * wx, qy + 0.55 * wy + t) + 0.26 * sn(qx * 2.03 - 0.4 * wx - t * 0.5, qy * 2.03 - 0.4 * wy - t * 0.5) + 0.12 * sn(qx * 4.1 + t, qy * 4.1 + t);
}
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// numbers and paths
const n1 = (v) => String(Math.round(v * 10) / 10), n2 = (v) => String(Math.round(v * 100) / 100);
// polylines -> path data: an absolute move per line, then short relative steps
function pathData(lines, dp = 1) {
  const k = 10 ** dp, r = (v) => Math.round(v * k) / k; let d = '';
  for (const pl of lines) {
    if (!pl || pl.length < 2) continue;
    let px = r(pl[0][0]), py = r(pl[0][1]); d += 'M' + px + ' ' + py; let seg = '';
    for (let i = 1; i < pl.length; i++) {
      const x = r(pl[i][0]), y = r(pl[i][1]), dx = r(x - px), dy = r(y - py);
      if (!dx && !dy) continue;
      const sx = String(dx), sy = String(dy);
      seg += (seg && !sx.startsWith('-') ? ' ' : '') + sx + (sy.startsWith('-') ? '' : ' ') + sy; px = x; py = y;
    }
    d += 'l' + (seg || '0 0');
  }
  return d;
}
// Ramer-Douglas-Peucker: drop points that sit within tol of the line through their neighbours
function simplify(pts, tol = 0.25) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let best = -1, bi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// every moving piece stops for readers who ask for less motion
const CALM = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';
// one SVG file: viewBox (w, h) shown at pw x ph, an optional ground, CSS (with the reduced-motion rule when it moves), a title for screen readers
function svg({ w, h, pw = w, ph = h, bg = null, css = '', title, body, extra = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${pw}" height="${ph}" role="img"${extra}><title>${esc(title)}</title>` +
    (css ? `<style>${css}${CALM}</style>` : '') + (bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : '') + body + '</svg>\n';
}

module.exports = { PAPER, INK, THEMES, rng, sn, fbm, smoothstep, mix, clamp, n1, n2, pathData, simplify, esc, CALM, svg };
