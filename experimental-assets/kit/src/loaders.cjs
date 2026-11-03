// Two loaders that never end, drawn with the skeleton in ../video/rig.js (bones keep their lengths, feet stay
// planted), sampled 24 times a second into discrete SMIL values.
//   Orbit: he jogs round the outside of the ring and leaps the opening at 11 o'clock, lap after lap.
//   Wheel: he runs inside the ring and it rolls from one wall to the other; at each wall he turns and runs back.
const path = require('path');
const L = require('./lib.cjs'), R = require('../video/rig.js');
const G = require(path.resolve(__dirname, '../../../tools/logo/logo-gen.cjs'));
const FPS = 24;

// write sampled frames of the figure (and anything else) as one SVG
function figureSvg({ w, h, dur, frames, theme, k, extra = () => '', title }) {
  const { fg } = L.THEMES[theme], n = frames.length;
  const anim = (attr, vals) => (new Set(vals).size > 1 ? `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(';')}"/>` : '');
  const parts = frames.map((f) => R.svgParts(f.pose, f.map));
  const stroke = (key, width) => `<path d="${parts[0][key]}" fill="none" stroke="${fg}" stroke-width="${L.n2(width * k)}" stroke-linecap="round" stroke-linejoin="round">${anim('d', parts.map((p) => p[key]))}</path>`;
  const end = (i) => `<circle cx="${parts[0].ends[i][0]}" cy="${parts[0].ends[i][1]}" r="${L.n2(parts[0].ends[i][2] * k)}" fill="${fg}">${anim('cx', parts.map((p) => p.ends[i][0]))}${anim('cy', parts.map((p) => p.ends[i][1]))}</circle>`;
  const body = extra(fg, anim, frames) + `<g class="fig">` + stroke('legs', R.B.wLeg) + stroke('arms', R.B.wArm) + stroke('body', R.B.wBody) +
    `<path d="${parts[0].head}" fill="${fg}">${anim('d', parts.map((p) => p.head))}</path>` + end(0) + end(1) + '</g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${L.esc(title)}</title>${body}</svg>\n`;
}
const ringPath = (cx, cy, r, base) => G.outline(G.arc(cx, cy, r, G.GAP, G.OPEN, 1, 0.02), { base, seed: 1, swell: 0.22 });

// ORBIT: the ring sits still; he runs clockwise round its outside, his feet on its rim, his body always pointing
// away from its centre. Coming up the left side he reaches the opening, takes off just before it and lands just
// after it, and runs on. One lap is one loop of the file
function orbit() {
  const W = 360, H = 360, C = [180, 184], Rm = 68, base = 10, Rg = Rm + base / 2 + 0.5, k = 60;
  const lap = 2 * Math.PI * Rg / k;                 // one lap, in figure heights
  const strides = 17, stride = lap / (2 * strides); // a whole number of steps per lap, so the loop is seamless
  const v = 1.05, T = lap / v;                      // speed in heights per second, and the lap time
  // the opening runs from 225 to 255 degrees; he takes off at 220 and lands at 261 (screen angles, clockwise)
  const toS = (deg) => ((deg - (-90) + 360) % 360) * Math.PI / 180 * Rg / k; // distance from the top, clockwise
  const sA = toS(220), sB = toS(261), tA = sA / v, tB = sB / v;
  const pose = (t) => {
    const d = v * t;
    let p = R.run(d, { stride, lift: 0.07, lean: 0.2, swing: 0.8 });
    const bumpA = Math.exp(-Math.pow((t - (tA - 0.08)) / 0.06, 2)), bumpB = Math.exp(-Math.pow((t - (tB + 0.07)) / 0.07, 2));
    p = { ...p, py: p.py + 0.035 * bumpA + 0.045 * bumpB, lean: p.lean + 0.1 * bumpA };   // gather before, give on landing
    const u = (t - tA) / (tB - tA);
    if (u > -0.12 && u < 1.12) {
      const w = R.ease.sine(R.clamp(Math.min((u + 0.12) / 0.14, (1.12 - u) / 0.14), 0, 1));
      p = R.mix(p, R.leap(R.clamp(u, 0, 1), 0.3), w);
    }
    return p;
  };
  // figure units -> the picture: he stands on the rim where he has got to, upright away from the centre (a rigid
  // turn, so his head stays round; the rim curves away less than a pixel under his feet)
  const mapAt = (t) => { const th = v * t * k / Rg - Math.PI / 2, c = Math.cos(th), s = Math.sin(th), P = [C[0] + Rg * c, C[1] + Rg * s];
    return (x, y) => [P[0] - x * k * s - y * k * c, P[1] + x * k * c - y * k * s]; };
  const n = Math.round(T * FPS), frames = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * T; frames.push({ pose: pose(t), map: mapAt(t) }); }
  return (theme) => figureSvg({ w: W, h: H, dur: L.n2(T), frames, theme, k, title: 'Orbit: the figure runs round the outside of the ring and leaps the opening at 11 o\'clock, lap after lap',
    extra: (fg) => `<path d="${ringPath(C[0], C[1], Rm, base)}" fill="${fg}"/>` });
}

// WHEEL: he runs inside the ring and it rolls; near a wall it slows and stops against it, he turns round, and runs
// back the other way. Rolling is honest: the ring turns by the distance it covers, and his feet step at the speed
// the floor under him moves
function wheel() {
  const W = 480, H = 240, ground = 214, wallL = 34, wallR = 446, Rm = 54, base = 8.5, Ro = Rm + base / 2, Ri = Rm - base / 2, k = 64;
  const cy = ground - Ro, x0 = wallL + Ro + 1, x1 = wallR - Ro - 1, run = 2.6, turn = 0.75, T = 2 * (run + turn);
  // speed: pick up over the first 30%, run flat out, brake over the last 22%
  const go = (u) => { const a = 0.3, b = 0.22, vmax = 1 / (1 - a / 2 - b / 2); if (u < a) return vmax * u * u / (2 * a); if (u < 1 - b) return vmax * (a / 2 + u - a); const r = 1 - u; return 1 - vmax * r * r / (2 * b); };
  const vel = (u) => { const a = 0.3, b = 0.22, vmax = 1 / (1 - a / 2 - b / 2); return u < a ? vmax * u / a : u < 1 - b ? vmax : vmax * (1 - u) / b; };
  // where the ring is: across and back, easing out of each wall and into the next
  const at = (t) => {
    const tt = ((t % T) + T) % T;
    if (tt < run) return { x: x0 + (x1 - x0) * go(tt / run), dir: 1, phase: 'run', u: tt / run };
    if (tt < run + turn) return { x: x1, dir: 1, phase: 'turn', u: (tt - run) / turn };
    if (tt < 2 * run + turn) return { x: x1 + (x0 - x1) * go((tt - run - turn) / run), dir: -1, phase: 'run', u: (tt - run - turn) / run };
    return { x: x0, dir: -1, phase: 'turn', u: (tt - 2 * run - turn) / turn };
  };
  // how far his feet have walked: the floor moves under him at (inner / outer radius) of the ring's speed
  const walked = (t) => { const tt = ((t % T) + T) % T, span = (x1 - x0) * Ri / Ro / k; if (tt < run) return span * go(tt / run); if (tt < run + turn) return span; if (tt < 2 * run + turn) return span + span * go((tt - run - turn) / run); return 2 * span; };
  const n = Math.round(T * FPS), frames = [], rings = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * T, a = at(t), speed = a.phase === 'run' ? vel(a.u) / 1.35 : 0;
    let p = R.mix(R.stand(), R.run(walked(t), { stride: 0.2, lift: 0.06, lean: 0.16, swing: 0.75 }), R.clamp(speed * 1.8, 0, 1));
    let mirror = a.dir < 0;
    if (a.phase === 'turn') {
      // stop, look back over the shoulder, turn round (the flip happens while he stands square), ready to go
      const u = a.u, lookBack = Math.sin(Math.PI * R.clamp(u / 0.5, 0, 1));
      p = { ...R.stand(), nod: -0.15 * lookBack, lean: -0.04 * lookBack };
      mirror = u < 0.5 ? a.dir < 0 : a.dir > 0;
    }
    const bump = a.phase === 'turn' ? Math.exp(-Math.pow(a.u / 0.12, 2)) : 0;     // the ring meets the wall
    const sx = mirror ? -1 : 1, fx = a.x, fy = cy + Ri;
    frames.push({ pose: p, map: (x, y) => [fx + x * k * sx, fy + y * k] });
    rings.push({ x: a.x - 3 * bump * a.dir, rot: ((a.x - x0) / Ro) * 180 / Math.PI, sq: 1 - 0.035 * bump });
  }
  return (theme) => figureSvg({ w: W, h: H, dur: L.n2(T), frames, theme, k, title: 'Wheel: the figure runs inside the ring and it rolls from one wall to the other and back, for ever',
    extra: (fg, anim) => `<path d="M${wallL} ${ground - 92}V${ground}M${wallR} ${ground - 92}V${ground}" stroke="${fg}" stroke-width="3" stroke-linecap="round"/><path d="M12 ${ground}H${W - 12}" stroke="${fg}" stroke-width="2" opacity=".35"/>` +
      `<g transform="translate(${L.n1(rings[0].x)} ${cy})"><animateTransform attributeName="transform" type="translate" dur="${L.n2(T)}s" repeatCount="indefinite" calcMode="discrete" values="${rings.map((r) => L.n1(r.x) + ' ' + cy).join(';')}"/>` +
      `<g><animateTransform attributeName="transform" type="scale" dur="${L.n2(T)}s" repeatCount="indefinite" calcMode="discrete" values="${rings.map((r) => L.n2(r.sq) + ' 1').join(';')}"/>` +
      `<g><animateTransform attributeName="transform" type="rotate" dur="${L.n2(T)}s" repeatCount="indefinite" calcMode="discrete" values="${rings.map((r) => L.n1(r.rot)).join(';')}"/>` +
      `<path d="${ringPath(0, 0, Rm, base)}" fill="${fg}"/></g></g></g>` });
}

module.exports = { list: [['loader-orbit', 'Orbit loader', orbit, 360, 360], ['loader-wheel', 'Wheel loader', wheel, 480, 240]] };
