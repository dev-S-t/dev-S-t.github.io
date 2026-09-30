// Drawings on the landing page (index.html), written between <!-- art:NAME --> and <!-- /art --> markers. All of them
// come from the mark's own animations, so the landing looks like the mark in motion, not like the AI loop:
//   name        "human in loop" in brush lettering; the o's of loop are eyes (pupils move with the pointer)
//   fall        the mark falling along the 30 degree line of its openings, the air lining up round it as streamlines
//   draw        the mark painting itself, stroke by stroke
//   loop-ai / loop-design / loop-next   three loops coming down the same line: one with its keeper, one whose keeper
//               is still a sketch, one empty and open
//   p-sahil / p-abhishek / p-abyss      the people: a human peeking over the edge of their loop; Abyss is only eyes
//   join        an empty loop drawing itself, a figure sketched in
// usage (from the repo root): node tools/landing/art.cjs      run again after the mark or the lettering changes
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const G = require(ROOT + '/tools/logo/logo-gen.cjs');
const T = require('./type.cjs');
const f = (v) => (Math.round(v * 100) / 100).toString();
const rad = (d) => d * Math.PI / 180;
const pathOf = (pl) => 'M' + pl.map(([x, y]) => f(x) + ' ' + f(y)).join('L');

/* ---------- the mark, stroke by stroke (outline to fill, centreline to draw along) ---------- */
function parts() {
  G.setPrecision(150, 2);
  const R = G.RINGS, { spine, legs } = G.figure(1);
  const strokes = [
    [G.arc(...R.loop, G.GAP, G.OPEN, 1, 0.025), { base: 5.4, seed: 1, swell: 0.22 }],
    [G.arc(...R.arms, G.GAP, G.OPEN, 2, 0.03), { base: 3.6, seed: 2, swell: 0.05, nib: 0.3 }],
    [G.arc(...R.head, G.GAP, G.OPEN, 3, 0.03), { base: 4.3, seed: 3, swell: 0.18 }],
    spine, legs
  ];
  return strokes.map(([c, p]) => ({ c, fill: G.outline(c, p), centre: pathOf(Array.from({ length: 81 }, (_, i) => c(i / 80))), w: p.base * 1.6 + 2 }));
}
const P = parts();
const sketchOf = (list) => `<path d="${list.map((p) => p.centre).join('')}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="1.6 3.2"/>`;

/* ---------- lettering ---------- */
function name() {
  const r = T.brush('human in loop');
  return `<svg class="name-art" viewBox="${r.box.map(f).join(' ')}" aria-hidden="true" focusable="false">${r.body}</svg>`;
}

/* ---------- streamlines: half circles hugging the front of a loop, running back into a tail ---------- */
function streamlines(radii, lens, widths, scale = 1) {
  const cub = (p0, p1, p2, p3, t) => { const s = 1 - t; return [0, 1].map((j) => s * s * s * p0[j] + 3 * s * s * t * p1[j] + 3 * s * t * t * p2[j] + t * t * t * p3[j]); };
  const out = [];
  radii.forEach((r0, i) => {
    const r = r0 * scale, L = lens[i] * scale;
    for (const side of [1, -1]) {
      const pts = [];
      for (let a = 0; a <= 90; a += 6) pts.push([r * Math.cos(rad(a)), side * r * Math.sin(rad(a))]);
      for (let t = 0.05; t <= 1.001; t += 0.05) pts.push(cub([0, side * r], [-0.42 * L, side * r], [-0.78 * L, side * r * 0.34], [-L, side * r * 0.1], t));
      out.push(`<path d="${pathOf(pts)}" stroke-width="${f(widths[i] * Math.sqrt(scale))}" pathLength="1" style="--i:${out.length}"/>`);
    }
  });
  return out.join('');
}

/* ---------- the fall: the view follows the mark down the 30 degree line; the air streams past ---------- */
function fall() {
  let seed = 29; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, Pd = 240;
  const streaks = [];
  for (let i = 0; i < 64; i++) { const u = rnd() * Pd, v = (rnd() * 2 - 1) * 330, len = 10 + rnd() ** 2 * 80, w = 0.5 + rnd() * 1.1; for (const c of [-2, -1, 0, 1, 2]) streaks.push(`<path d="M${f(u + c * Pd - len / 2)} ${f(v)}h${f(len)}" stroke-width="${f(w)}"/>`); }
  const figure = P.map((p, i) => i === 0 ? `<g class="shell"><path fill="currentColor" d="${p.fill}"/></g>` : `<path fill="currentColor" d="${p.fill}"/>`).join('');
  return `<svg class="fall-art" viewBox="-150 -90 900 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<mask id="fall-m" maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800"><rect x="-400" y="-400" width="800" height="800" fill="#fff"/><circle r="68" fill="#000"/><path d="M0 -100L-420 -60V60L0 100Z" fill="#000"/></mask>
<g transform="translate(300 180) rotate(60)">
<g mask="url(#fall-m)"><g class="streaks" fill="none" stroke="currentColor" stroke-linecap="round">${streaks.join('')}</g></g>
<g class="meteor"><g class="heat" fill="none" stroke-linecap="round">${streamlines([57, 63, 69.5, 76.5, 84, 92], [150, 192, 234, 276, 318, 360], [2, 1.7, 1.4, 1.1, 0.85, 0.65])}</g>
<g transform="rotate(-60)"><g transform="translate(-58 -58) scale(1.16)">${figure}</g></g></g>
</g></svg>`;
}

/* ---------- draw-on ---------- */
function draw() {
  const masks = P.map((p, i) => `<mask id="dr${i}" maskUnits="userSpaceOnUse" x="-5" y="-5" width="110" height="110"><path class="dash" style="--d:${[0, 0.55, 1.05, 1.5, 1.85][i]}s" d="${p.centre}" pathLength="1" fill="none" stroke="#fff" stroke-width="${f(p.w)}" stroke-linecap="round" stroke-linejoin="round"/></mask>`).join('');
  return `<svg class="draw-art" viewBox="0 0 100 100" role="img" aria-label="The human-in-loop mark drawing itself">${masks}${P.map((p, i) => `<path fill="currentColor" mask="url(#dr${i})" d="${p.fill}"/>`).join('')}</svg>`;
}

/* ---------- a loop coming down the 30 degree line, with its tail of streamlines ---------- */
function loopFall(kind, label) {
  const body = kind === 'ai' ? P.map((p) => `<path fill="currentColor" d="${p.fill}"/>`).join('')
    : kind === 'design' ? `<path fill="currentColor" d="${P[0].fill}"/>${sketchOf(P.slice(1))}`
      : `<path d="${P[0].centre}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 3.4"/>`;
  return `<svg class="loop-art" viewBox="-110 -110 220 220" role="img" aria-label="${label}"><g transform="rotate(60)"><g class="tail" fill="none" stroke="currentColor" stroke-linecap="round">${streamlines([54, 62, 71], [96, 124, 150], [1.2, 0.9, 0.7], 0.9)}</g><g transform="rotate(-60) translate(-50 -50)">${body}</g></g></svg>`;
}

/* ---------- Peek: a human peeking over the inner edge of their loop (from the brand kit) ---------- */
const B = { ro: 46, ri: 32.5, head: [50, 81.5, 17.5], eyes: [[43, 73.2], [57, 73.2]], er: 5.2, pr: 2.7 };
const hair = {
  bald: '',
  curls: [35.4, 41.2, 47.4, 53.6, 59.8, 65.2].map((x, i) => `<circle cx="${x}" cy="${i === 0 || i === 5 ? 71.2 : 66.4}" r="${i === 0 || i === 5 ? 3.9 : 4.6}"/>`).join('')
};
function peek(id, who, label) {
  const [hx, hy, hr] = B.head;
  const band = `M${50 - B.ro} 50a${B.ro} ${B.ro} 0 1 0 ${2 * B.ro} 0a${B.ro} ${B.ro} 0 1 0 ${-2 * B.ro} 0ZM${50 - B.ri} 50a${B.ri} ${B.ri} 0 1 1 ${2 * B.ri} 0a${B.ri} ${B.ri} 0 1 1 ${-2 * B.ri} 0Z`;
  return `<svg class="peek-art" viewBox="0 0 100 100" role="img" aria-label="${label}"><clipPath id="${id}h"><circle cx="50" cy="50" r="${B.ri - 1.5}"/></clipPath>
<mask id="${id}f" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/>${B.eyes.map(([x, y]) => `<circle class="eyehole" cx="${x}" cy="${y}" r="${B.er}" fill="#000"/>`).join('')}</mask>
<path d="${band}" fill="currentColor" fill-rule="evenodd"/>
<g clip-path="url(#${id}h)"><g class="peek-head"><g fill="currentColor" mask="url(#${id}f)"><circle cx="${hx}" cy="${hy}" r="${hr}"/>${hair[who]}</g>
${B.eyes.map(([x, y]) => `<circle class="pupil" data-ex="${x}" data-ey="${y}" data-m="2.1" cx="${f(x + 1.5)}" cy="${f(y - 1.5)}" r="${B.pr}" fill="currentColor"/>`).join('')}</g></g></svg>`;
}
// Abyss: no loop, no face, only a pair of eyes in the dark, watching from far
function abyss() {
  return `<svg class="peek-art abyss-art" viewBox="0 0 100 100" role="img" aria-label="Abyss: a pair of eyes in the dark"><circle cx="50" cy="50" r="46" fill="currentColor"/>
${[[39, 50], [61, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.4" class="eye-white"/><circle class="pupil" data-ex="${x}" data-ey="${y}" data-m="3.6" cx="${x + 2}" cy="${y - 2}" r="3.2"/>`).join('')}</svg>`;
}

/* ---------- join: an empty loop drawing itself, a keeper sketched in ---------- */
function join() {
  return `<svg class="join-art" viewBox="0 0 100 100" role="img" aria-label="An empty loop drawing itself, with a keeper sketched in">
<mask id="jn" maskUnits="userSpaceOnUse" x="-5" y="-5" width="110" height="110"><path class="dash" style="--d:0s" d="${P[0].centre}" pathLength="1" fill="none" stroke="#fff" stroke-width="${f(P[0].w)}" stroke-linecap="round"/></mask>
<path fill="currentColor" mask="url(#jn)" d="${P[0].fill}"/><g class="join-sketch">${sketchOf(P.slice(1))}</g></svg>`;
}

const art = {
  name: name(), fall: fall(), draw: draw(),
  'loop-ai': loopFall('ai', 'The AI loop, coming down with its keeper inside'),
  'loop-design': loopFall('design', 'The Design loop: the loop drawn, its keeper still a sketch'),
  'loop-next': loopFall('next', 'An empty loop, not drawn yet'),
  'p-sahil': peek('ps', 'bald', 'Sahil peeking over the edge of the AI loop'),
  'p-abhishek': peek('pa', 'curls', 'Abhishek peeking over the edge of the Design loop'),
  'p-abyss': abyss(),
  join: join()
};
const file = ROOT + '/index.html';
let html = fs.readFileSync(file, 'utf8'), n = 0;
for (const [k, v] of Object.entries(art)) {
  const re = new RegExp(`(<!-- art:${k} -->)[\\s\\S]*?(<!-- /art -->)`);
  if (re.test(html)) { html = html.replace(re, (m, a, b) => a + v + b); n++; }
}
fs.writeFileSync(file, html);
console.log('drawings written:', n, 'of', Object.keys(art).length);
