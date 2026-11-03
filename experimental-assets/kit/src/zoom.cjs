// Agents on the loop, forever: the picture of the big loop with the figure inside and three small rings riding it,
// where every small ring is the whole picture again, smaller. The view zooms into one small ring; inside it is the
// figure, and its own three rings on its own loop; when it fills the view the view is the first picture again, so
// it loops with no seam.
// The zoom is a scaling about the one point the picture and its copy share (the fixed point of the map that takes
// the picture to the copy), with the scale growing exponentially so it feels steady. A round frame hides the parent
// loop, which runs off past the edge as the copy grows.
const path = require('path');
const L = require('./lib.cjs'), FIG = require('./figure.cjs');
const G = require(path.resolve(__dirname, '../../../tools/logo/logo-gen.cjs'));

const R = 100;                       // the big loop's radius (to the middle of its stroke)
const s = 0.2;                       // each small ring is the whole picture at this scale
const BEADS = [-20, 70, 160];        // where the small rings ride the loop (degrees; 0 = 3 o'clock, clockwise)
const TARGET = 0;                    // the one the view goes into
const D = 128;                       // the picture's radius, loop and rings and all: the round frame
const DEPTH = 4;                     // levels drawn (the fourth is under a pixel)
const T = 7;                         // seconds per level

function build() {
  const loop = G.outline(G.arc(0, 0, R, G.GAP, G.OPEN, 1, 0.022), { base: 7.6, seed: 1, swell: 0.22 });
  const at = (deg) => [R * Math.cos(deg * Math.PI / 180), R * Math.sin(deg * Math.PI / 180)];
  const p = at(BEADS[TARGET]), f = [p[0] / (1 - s), p[1] / (1 - s)]; // the fixed point: f = p + s (f - 0)
  // the exponential zoom, as keyframes: scale (1/s)^u about f
  const steps = 24, kf = [];
  for (let i = 0; i <= steps; i++) { const u = i / steps; kf.push(`${(u * 100).toFixed(2)}%{transform:scale(${Math.pow(1 / s, u).toFixed(4)})}`); }
  const css = `.z{transform-origin:${L.n2(D + f[0])}px ${L.n2(D + f[1])}px;animation:z ${T}s linear infinite}@keyframes z{${kf.join('')}}`;
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    // one level: its loop and its figure, then its three rings, each a disc of ground (so the loop seems to pass
    // behind it) holding the next level down; the disc is a touch larger than the picture so, at the end of each zoom,
    // it covers the whole round frame
    let defs = `<g id="unit"><path d="${loop}" fill="${fg}"/>${FIG.draw('stand', { x: -2, y: 80, size: 128, fg })}</g>`;
    for (let lv = DEPTH - 1; lv >= 0; lv--) {
      const inner = lv === DEPTH - 1 ? '' : BEADS.map((b) => { const [x, y] = at(b); return `<circle cx="${L.n2(x)}" cy="${L.n2(y)}" r="${L.n2(D * s * 1.02)}" fill="${bg}"/><use href="#L${lv + 1}" transform="translate(${L.n2(x)} ${L.n2(y)}) scale(${s})"/>`; }).join('');
      defs += `<g id="L${lv}"><use href="#unit"/>${inner}</g>`;
    }
    return L.svg({ w: 2 * D, h: 2 * D, pw: 360, ph: 360, css, title: 'Agents on the loop: the view zooms into one small ring, finds the same figure and the same three rings inside, and goes on for ever',
      body: `<defs>${defs}<clipPath id="frame"><circle cx="${D}" cy="${D}" r="${D}"/></clipPath></defs><circle cx="${D}" cy="${D}" r="${D}" fill="${bg}"/><g clip-path="url(#frame)"><g class="z"><use href="#L0" transform="translate(${D} ${D})"/></g></g>` });
  };
}

module.exports = { list: [['agents-zoom', 'Agents on the loop, forever', build, 360, 360]] };
