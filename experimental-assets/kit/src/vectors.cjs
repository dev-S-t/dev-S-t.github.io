// Vector images for everyday needs (empty states, notes, 404s, slides): the figure in a few poses, small objects
// from the loop's world, and dividers. Clear ground; 'paper' means ink lines for a paper page, 'ink' the reverse.
const path = require('path');
const L = require('./lib.cjs'), FIG = require('./figure.cjs'), { streamlines } = require('./flow.cjs');
const G = require(path.resolve(__dirname, '../../../tools/logo/logo-gen.cjs'));

const pose = (name, draw) => [`figure-${name}`, name[0].toUpperCase() + name.slice(1), () => (theme) => L.svg({ w: 200, h: 200, title: `The figure: ${name}`, body: draw(L.THEMES[theme].fg) }), 200, 200];
const figures = [
  pose('stand', (fg) => FIG.draw('stand', { x: 100, y: 182, size: 156, fg })),
  pose('walk', (fg) => FIG.draw(FIG.walkFrame(1, 6), { x: 100, y: 182, size: 156, fg })),
  pose('point', (fg) => FIG.draw('point', { x: 80, y: 182, size: 156, fg })),
  pose('wave', (fg) => FIG.draw('wave', { x: 90, y: 182, size: 156, fg })),
  pose('watch', (fg) => FIG.draw('watch', { x: 92, y: 182, size: 156, fg })),
  // holding a taut string that runs off to the right
  pose('pull', (fg) => FIG.draw('pull', { x: 78, y: 182, size: 156, fg }) + `<path d="M${L.n1(78 + 0.2 * 156)} ${L.n1(182 - 0.35 * 156)}L204 ${L.n1(182 - 0.35 * 156 - 6)}" stroke="${fg}" stroke-width="2" stroke-linecap="round"/>`),
  // sitting on the edge of a ledge, legs over the drop
  pose('sit', (fg) => { const top = []; for (let x = 20; x <= 92; x += 4) top.push([x, 132 + 2 * L.sn(x / 14, 2.2)]); return `<path fill="${fg}" d="M20 204L${top.map(([x, y]) => x + ' ' + L.n1(y)).join('L')}L92 204Z"/>` + FIG.draw('sit', { x: 92, y: 131, size: 128, fg }); })
];

// a line that ties one loop: it rises, turns over and crosses itself, then runs on
const knot = (cx, y, s) => `M${cx - 92} ${y}H${L.n1(cx - s * 0.35)}C${L.n1(cx + s * 0.95)} ${y} ${L.n1(cx + s * 1.0)} ${L.n1(y - s * 1.45)} ${cx} ${L.n1(y - s * 1.45)}C${L.n1(cx - s * 1.0)} ${L.n1(y - s * 1.45)} ${L.n1(cx - s * 0.95)} ${y} ${L.n1(cx + s * 0.35)} ${y}H${cx + 92}`;

// the stick man's head ring alone: open at 11 o'clock, thinning as it goes round
const headRing = (c, R, fg) => { const T = R * 0.136, a0 = (-120 + 15) * Math.PI / 180, span = 330 * Math.PI / 180, o = [], i = []; for (let k = 0; k <= 48; k++) { const t = k / 48, a = a0 + span * t, w = T * (1.2 - 0.5 * t); o.push([c[0] + (R + w) * Math.cos(a), c[1] + (R + w) * Math.sin(a)]); i.push([c[0] + (R - w) * Math.cos(a), c[1] + (R - w) * Math.sin(a)]); } return `<path fill="${fg}" d="M${o.concat(i.reverse()).map(([x, y]) => L.n1(x) + ' ' + L.n1(y)).join('L')}Z"/><circle cx="${L.n1(c[0] + R * Math.cos(a0))}" cy="${L.n1(c[1] + R * Math.sin(a0))}" r="${L.n1(T * 1.2)}" fill="${fg}"/><circle cx="${L.n1(c[0] + R * Math.cos(a0 + span))}" cy="${L.n1(c[1] + R * Math.sin(a0 + span))}" r="${L.n1(T * 0.7)}" fill="${fg}"/>`; };
const PAPERISH = (fg) => (fg === L.INK ? L.PAPER : L.INK); // the ground under a bead, so the loop breaks behind it

// small objects, 200 x 200
const ringD = (cx, cy, r, w) => G.outline(G.arc(cx, cy, r, G.GAP, G.OPEN, 1, 0.02), { base: w, seed: 1, swell: 0.22 });
function fingerprint() {
  const core = [104, 92], delta = [52, 182];
  const angle = (x, y) => 0.5 * Math.atan2(y - core[1], x - core[0]) - 0.5 * Math.atan2(y - delta[1], x - delta[0]) + 0.15 * L.sn(x / 90, y / 90);
  const lines = streamlines({ w: 200, h: 200, angle, dsep: 7, dtest: 2.8, minLen: 20, step: 0.8, margin: 4, stops: [[core[0], core[1], 4], [delta[0], delta[1], 5]], seed: [core[0] + 9, core[1]] }).map((l) => L.simplify(l, 0.15));
  return `<defs><clipPath id="tip"><ellipse cx="100" cy="104" rx="66" ry="86"/></clipPath></defs><path clip-path="url(#tip)" d="${L.pathData(lines, 2)}" stroke-width="2.1"/>`;
}
const objects = [
  ['eye', 'Eye', (fg) => `<circle cx="100" cy="100" r="62" fill="none" stroke="${fg}" stroke-width="15"/><circle cx="120" cy="100" r="19" fill="${fg}"/>`],
  ['ring', 'Open ring', (fg) => `<g transform="scale(2)"><path fill="${fg}" d="${ringD(50, 50, 38, 7.5)}"/></g>`],
  ['fingerprint', 'Fingerprint', (fg) => `<g fill="none" stroke="${fg}" stroke-linecap="round">${fingerprint()}</g>`],
  ['voice', 'Voice', (fg) => { const c = [122, 116], R = 38, a = -120; const arc = (r, half) => { const a0 = (a - half) * Math.PI / 180, a1 = (a + half) * Math.PI / 180; return `M${L.n1(c[0] + r * Math.cos(a0))} ${L.n1(c[1] + r * Math.sin(a0))}A${r} ${r} 0 0 1 ${L.n1(c[0] + r * Math.cos(a1))} ${L.n1(c[1] + r * Math.sin(a1))}`; };
    return headRing(c, R, fg) + `<g fill="none" stroke="${fg}" stroke-linecap="round"><path d="${arc(58, 13)}" stroke-width="6"/><path d="${arc(76, 17)}" stroke-width="5"/><path d="${arc(94, 20)}" stroke-width="4"/></g>`; }],
  ['knot', 'Knot', (fg) => `<path d="${knot(100, 128, 34)}" fill="none" stroke="${fg}" stroke-width="4" stroke-linecap="round"/>`],
  ['agents', 'Agents', (fg) => { const n = [[100, 46], [46, 146], [154, 146]], r = 24, e = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return `M${L.n1(a[0] + dx / l * (r + 8))} ${L.n1(a[1] + dy / l * (r + 8))}L${L.n1(b[0] - dx / l * (r + 8))} ${L.n1(b[1] - dy / l * (r + 8))}`; };
    return `<path d="${e(n[0], n[1])}${e(n[1], n[2])}${e(n[2], n[0])}" stroke="${fg}" stroke-width="2.4" stroke-linecap="round"/><g transform="scale(2)" fill="${fg}">${n.map(([x, y]) => `<path d="${ringD(x / 2, y / 2, r / 2, 3.4)}"/>`).join('')}</g>`; }],
  ['agents-loop', 'Agents on the loop', (fg) => { const c = [100, 102], R = 78; const at = (deg) => [c[0] + R * Math.cos(deg * Math.PI / 180), c[1] + R * Math.sin(deg * Math.PI / 180)];
    const beads = [-20, 70, 160].map((d) => at(d));
    return `<g transform="translate(${c[0] - 50 * R / 44} ${c[1] - 50 * R / 44}) scale(${L.n2(R / 44)})"><path fill="${fg}" d="${ringD(50, 50, 44, 3.4)}"/></g>` +
      beads.map(([x, y]) => `<circle cx="${L.n1(x)}" cy="${L.n1(y)}" r="19" fill="${PAPERISH(fg)}"/><g transform="translate(${L.n1(x - 50 * 0.36)} ${L.n1(y - 50 * 0.36)}) scale(.36)"><path fill="${fg}" d="${ringD(50, 50, 38, 7.5)}"/></g>`).join('') +
      FIG.draw('stand', { x: c[0] - 2, y: c[1] + 62, size: 104, fg }); }],
].map(([id, name, draw]) => [id, name, () => (theme) => L.svg({ w: 200, h: 200, title: name, body: draw(L.THEMES[theme].fg) }), 200, 200]);

// dividers, 1600 x 80
const torn = (fg) => { const p = []; for (let x = 0; x <= 1600; x += 3) p.push([x, 40 + 3.5 * L.sn(x / 37, 4.2) + 2 * L.sn(x / 11, 5.9) + 0.8 * L.sn(x / 4.1, 7.5)]); return `<path fill="${fg}" d="M0 80L${p.map(([x, y]) => x + ' ' + L.n1(y)).join('L')}L1600 80Z"/>`; };
const wave = (fg) => { const p = []; for (let x = 0; x <= 1600; x += 4) p.push([x, 40 + 14 * Math.sin(x / 70) * (0.6 + 0.4 * L.sn(x / 300, 1))]); return `<path d="${L.pathData([p])}" fill="none" stroke="${fg}" stroke-width="2"/>`; };
const rules = (fg) => [[3, 2.6], [8, 0.8], [12, 0.8], [17.5, 1.6], [24, 0.6], [30, 0.6]].map(([y, t]) => `<rect y="${(y + 22 - t / 2).toFixed(2)}" width="1600" height="${t}" fill="${fg}"/>`).join('');
const loopLine = (fg) => `<path d="M0 60H${800 - 16}${knot(800, 60, 24).replace(/^M[^C]+/, '')}H1600" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round"/>`;
const dividers = [['divider-tear', 'Tear', torn], ['divider-wave', 'Wave', wave], ['divider-rules', 'Rules', rules], ['divider-loop', 'Loop line', loopLine]]
  .map(([id, name, draw]) => [id, name, () => (theme) => L.svg({ w: 1600, h: 80, title: `Divider: ${name}`, body: draw(L.THEMES[theme].fg) }), 1600, 80]);

module.exports = { figures, objects, dividers };
