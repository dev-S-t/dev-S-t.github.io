// Section backgrounds, 1600 x 900, made to cover a section of any shape (preserveAspectRatio slice). Each one
// moves slowly, and stands still for readers who ask for less motion. build() computes the drawing once and
// returns a function of the theme ('paper' | 'ink').
const L = require('./lib.cjs'), FIG = require('./figure.cjs'), { streamlines } = require('./flow.cjs');
const W = 1600, H = 900;
const cover = ' preserveAspectRatio="xMidYMid slice"';

// LOOP: a fingerprint's loop pattern, its ridges traced along a flow field with one core and one delta, stopping
// and starting again now and then as real ones do. A soft band sweeps down it and the ridges swell as it passes,
// like a reader taking the print
function loop() {
  const core = [W * 0.62, H * 0.42], delta = [W * 0.3, H * 0.9], dsep = 16;
  const angle = (x, y) => 0.5 * Math.atan2(y - core[1], x - core[0]) - 0.5 * Math.atan2(y - delta[1], x - delta[0]) + 0.22 * L.sn(x / 560 + 3, y / 560);
  const raw = streamlines({ w: W, h: H, angle, dsep, dtest: dsep * 0.4, minLen: dsep * 5, step: 2.2, stops: [[core[0], core[1], dsep * 0.6], [delta[0], delta[1], dsep * 0.8]], seed: [core[0] + dsep * 1.5, core[1]] });
  const rnd = L.rng(11), ridges = [];
  for (const l of raw) {
    let cur = [], acc = 0, next = 260 + rnd() * 700;
    for (let j = 0; j < l.length; j++) {
      if (j) acc += Math.hypot(l[j][0] - l[j - 1][0], l[j][1] - l[j - 1][1]);
      if (acc > next) { if (cur.length > 2) ridges.push(L.simplify(cur, 0.3)); cur = []; acc = -(dsep * 0.5 + rnd() * dsep * 0.5); next = 300 + rnd() * 800; continue; }
      if (acc >= 0) cur.push(l[j]);
    }
    if (cur.length > 2) ridges.push(L.simplify(cur, 0.3));
  }
  const d = L.pathData(ridges), band = 300;
  const css = `.band{animation:band 9s linear infinite}@keyframes band{from{transform:translateY(0)}to{transform:translateY(${H + band}px)}}`;
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const body = `<defs><path id="rg" d="${d}"/><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="scan" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect class="band" x="-10" y="${-band}" width="${W + 20}" height="${band}" fill="url(#sg)"/></mask></defs>` +
      `<g fill="none" stroke="${fg}" stroke-linecap="round" stroke-linejoin="round"><use href="#rg" stroke-width="3.2"/><g mask="url(#scan)"><use href="#rg" stroke-width="6.4"/></g></g>`;
    return L.svg({ w: W, h: H, bg, css, title: 'Loop: the ridges of a fingerprint with a loop pattern, read by a passing scan', body, extra: cover });
  };
}

// IN SYNC: two sets of rings, one still and one circling it a little off centre; where they agree and disagree,
// broad moire bands appear and sweep round as the second set moves
function sync() {
  const c = [W * 0.5, H * 0.52], s = 8.6, sw = 1.3, R = Math.hypot(W, H) / 2 + 80, off = 40;
  let rings = ''; for (let r = s; r < R; r += s) rings += `<circle cx="${c[0]}" cy="${c[1]}" r="${L.n1(r)}"/>`;
  const css = `.o{transform-origin:${c[0]}px ${c[1]}px;animation:o 28s linear infinite}@keyframes o{to{transform:rotate(360deg)}}`;
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const body = `<g fill="none" stroke="${fg}" stroke-width="${sw}">${rings}<g class="o"><g transform="translate(${off} 0)">${rings}</g></g></g>`;
    return L.svg({ w: W, h: H, bg, css, title: 'In Sync: two sets of rings drifting in and out of step', body, extra: cover });
  };
}

// STRINGS: a row of taut strings. The figure pulls one aside, lets go, and it rings out and settles while he
// watches; its neighbours answer a little
function strings() {
  const S = 50, xs = []; for (let x = 75; x <= W - 75; x += S) xs.push(x);
  const p = 21, x0 = xs[p], fx = 1205, fy = 868, size = 150;
  const hand = [fx - 0.2 * size, fy - 0.35 * size];
  const P = 9, rel = 24; // seconds per cycle; the release, as a share of it
  // the ring-out: a half sine swinging side to side, each swing smaller, then still
  const kf = [`0%,${rel - 0.01}%{transform:scaleX(1)}`];
  for (let n = 0, t = rel; t < 80; n++, t += 2.3) kf.push(`${t.toFixed(2)}%{transform:scaleX(${(Math.exp(-n * 0.14) * (n % 2 ? -1 : 1)).toFixed(3)})}`);
  kf.push('82%,100%{transform:scaleX(0)}');
  const css = `.v{transform-origin:${x0}px 0;animation:v ${P}s infinite}.v2{transform-origin:${xs[p - 1]}px 0}.v3{transform-origin:${xs[p + 1]}px 0}.v2,.v3{animation:v ${P}s infinite}@keyframes v{${kf.join('')}}` +
    `.held{animation:held ${P}s step-end infinite}.free{animation:free ${P}s step-end infinite}` +
    `@keyframes held{0%{opacity:1}${rel}%{opacity:0}}@keyframes free{0%{opacity:0}${rel}%{opacity:1}}`;
  const bump = (x, a) => { const pts = []; for (let i = 0; i <= 48; i++) { const y = -5 + 910 * i / 48; pts.push([x + a * Math.sin(Math.PI * i / 48), y]); } return L.pathData([pts]); };
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const still = xs.filter((_, i) => Math.abs(i - p) > 1).map((x) => `M${x} -5V905`).join('');
    const body = `<g fill="none" stroke="${fg}" stroke-width="1.3">` +
      `<path d="${still}"/>` +
      `<path class="v2" d="${bump(xs[p - 1], 7)}"/><path class="v3" d="${bump(xs[p + 1], 7)}"/>` +
      `<path class="held" d="M${x0} -5L${L.n1(hand[0])} ${L.n1(hand[1])}L${x0} 905"/>` +
      `<g class="free"><path class="v" d="${bump(x0, hand[0] - x0)}"/></g></g>` +
      `<g class="held">${FIG.draw('pull', { x: fx, y: fy, size, fg, mirror: true })}</g>` +
      `<g class="free">${FIG.draw('watch', { x: fx + 6, y: fy, size, fg, mirror: true })}</g>`;
    return L.svg({ w: W, h: H, bg, css, title: 'Strings: a figure plucks one of a row of strings and watches it ring', body, extra: cover });
  };
}

// FALL: a stream of lines runs along the top of a cliff and pours over its edge, each line falling in a parabola
// and thinning into the drop; across the gap the figure sits on a ledge and watches
function fall() {
  const xe = 1000, top = 560, N = 13, rnd = L.rng(5);
  const rough = (x, s) => 3 * L.sn(x / 60, s) + 1.4 * L.sn(x / 17, s + 2);
  const lines = [];
  for (let i = 0; i < N; i++) {
    const y0 = 418 + i * 10.6, lip = top - 6 - (N - 1 - i) * 7.2, pts = [];
    for (let x = -12; x <= xe; x += 8) { const k = L.smoothstep(xe * 0.62, xe, x); pts.push([x, L.mix(y0, lip, k) + 2.4 * L.sn(x / 95, i * 0.7) * (1 - k)]); }
    const v = 230 + 170 * (1 - i / (N - 1)) + 30 * rnd(), g = 900;
    for (let t = 0.02; ; t += 0.02) { const x = xe + v * t, y = lip + 0.5 * g * t * t; pts.push([x, y]); if (y > H + 20) break; }
    lines.push(L.simplify(pts, 0.2));
  }
  const cliff = []; for (let x = -10; x <= xe; x += 6) cliff.push([x, top + rough(x, 3.1)]);
  const ledge = []; for (let x = 1352; x <= W + 10; x += 6) ledge.push([x, 640 + rough(x, 8.3) * 0.8]);
  const css = '.s{stroke-dasharray:54 8;animation:s 2.4s linear infinite}' + [0, 1, 2, 3].map((k) => `.s${k}{animation-delay:-${(k * 0.6).toFixed(1)}s}`).join('') + '@keyframes s{to{stroke-dashoffset:-62}}';
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const body = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset=".66" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#g)"/></mask></defs>` +
      `<g mask="url(#m)" fill="none" stroke="${fg}" stroke-width="1.5" stroke-linecap="round">` + lines.map((l, i) => `<path class="s s${i % 4}" d="${L.pathData([l])}"/>`).join('') + '</g>' +
      `<path fill="${fg}" d="M-10 ${H + 10}L${cliff.map(([x, y]) => L.n1(x) + ' ' + L.n1(y)).join('L')}L${xe - 26} ${H + 10}Z"/>` +
      `<path fill="${fg}" d="M1340 ${H + 10}L${ledge.map(([x, y]) => L.n1(x) + ' ' + L.n1(y)).join('L')}L${W + 10} ${H + 10}Z"/>` +
      FIG.draw('sit', { x: 1372, y: 640 + rough(1372, 8.3) * 0.8, size: 120, fg, mirror: true });
    return L.svg({ w: W, h: H, bg, css, title: 'Fall: a stream of lines pours over a cliff while a figure watches from a ledge', body, extra: cover });
  };
}

// SWEEP: the mark at the centre and even rays all round it, except one wedge: the rays stop where the mark's
// rings open, at 11 o'clock, so the opening runs on out to the edge. A hand goes round once every 12 seconds, a
// second an hour, lighting the rays it passes; at 11 it crosses the empty wedge, the eleventh hour
function sweep() {
  const G = require(require('path').resolve(__dirname, '../../../tools/logo/logo-gen.cjs'));
  const c = [W * 0.5, H * 0.5], r0 = 150, r1 = 1100, step = 2, P = 12, k = 2.25; // k: mark units -> px
  const rays = [];
  for (let a = -90; a < 270; a += step) { if (a > 224 && a < 256) continue; rays.push(a); } // 224..256 is -136..-104: the opening
  const at = (a, r) => [c[0] + r * Math.cos(a * Math.PI / 180), c[1] + r * Math.sin(a * Math.PI / 180)];
  const mark = G.build({ texture: true, samples: 180 });
  // each ray lights as the hand passes (its delay is its clock position), then fades back
  const css = `.r{animation:r ${P}s linear infinite}@keyframes r{0%{opacity:1}12%{opacity:.36}100%{opacity:.36}}` +
    `.hand{transform-origin:${c[0]}px ${c[1]}px;animation:hand ${P}s linear infinite}@keyframes hand{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const body = `<g stroke="${fg}" stroke-width="1.5" stroke-linecap="round">` +
      rays.map((a) => { const [x0, y0] = at(a, r0), [x1, y1] = at(a, r1); return `<path class="r" style="animation-delay:${(-(P - ((a + 90) / 360) * P)).toFixed(2)}s" d="M${L.n1(x0)} ${L.n1(y0)}L${L.n1(x1)} ${L.n1(y1)}"/>`; }).join('') +
      `<path class="hand" d="M${c[0]} ${c[1] - r0}V${c[1] - r1}" stroke-width="2.6"/></g>` +
      `<g transform="translate(${L.n1(c[0] - 50 * k)} ${L.n1(c[1] - 50 * k)}) scale(${k})"><mask id="dry" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${mark.gaps.join('')}" fill="none" stroke="#000" stroke-width=".34" stroke-linecap="round"/></mask><path fill="${fg}" mask="url(#dry)" d="${mark.paths.join('')}"/></g>`;
    return L.svg({ w: W, h: H, bg, css, title: "Sweep: the mark with even rays all round it, open at 11 o'clock, and a clock hand going round", body, extra: cover });
  };
}

// CONSTELLATION: the loops of many keepers, each one a whole mark, placed on the lines of the mark itself and joined
// along them, so the lines between them draw the mark (as in the film): head ring, spine, both arms, legs, the outer
// loop both ways from the feet. No line crosses an opening at eleven. Posts run along the lines; on ink, stars.
function constellation() {
  const C = require('../video/film-constellation.js'), M = require('../video/mark.js');
  const K = H * 0.42 / 0.753, cx = W / 2, cy = H / 2, P = (q) => [cx + K * q[0], cy + K * q[1]];
  const lines = C.EDGES.map((e) => C.cut(e.path, C.NODES[e.a].f ? C.GAPR : 0, e.L - (C.NODES[e.b].f ? C.GAPR : 0)).map(P));
  const d = L.pathData(lines.map((l) => L.simplify(l, 0.2)), 1), nodes = Object.values(C.NODES).filter((n) => n.f).map((n) => P(n.c));
  const sm = K * C.S / 62, big = K / 62;
  const rnd = L.rng(5), stars = Array.from({ length: 170 }, () => [rnd() * W, rnd() * H, 0.6 + rnd() * 1.3, 0.15 + rnd() * 0.4]);
  const css = '.posts{animation:posts 4s linear infinite}@keyframes posts{to{stroke-dashoffset:-46}}';
  return (theme) => {
    const { bg, fg } = L.THEMES[theme];
    const mark = `<g id="mk" fill="${fg}">${M.paths.map((p) => `<path d="${p}"/>`).join('')}<g fill="none" stroke="${bg}" stroke-width=".34" stroke-linecap="round">${M.gaps.map((p) => `<path d="${p}"/>`).join('')}</g></g>`;
    const body = `<defs>${mark}</defs>` +
      (theme === 'ink' ? `<g fill="${fg}">${stars.map(([x, y, r, a]) => `<circle cx="${L.n1(x)}" cy="${L.n1(y)}" r="${L.n1(r)}" opacity="${L.n2(a)}"/>`).join('')}</g>` : '') +
      `<use href="#mk" opacity=".09" transform="translate(${L.n1(cx)} ${L.n1(cy)}) scale(${L.n2(big)}) translate(-50 -50)"/>` +
      `<g fill="none" stroke="${fg}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke-width="2" opacity=".6"/><path class="posts" d="${d}" stroke-width="5" stroke-dasharray="0 46"/></g>` +
      nodes.map(([x, y]) => `<use href="#mk" transform="translate(${L.n1(x)} ${L.n1(y)}) scale(${L.n2(sm)}) translate(-50 -50)"/>`).join('');
    return L.svg({ w: W, h: H, bg, css, title: 'Constellation: the loops of many keepers placed on the lines of the mark, so that the lines between them draw it', body, extra: cover });
  };
}

module.exports = { W, H, list: [['loop', 'Loop', loop], ['in-sync', 'In Sync', sync], ['strings', 'Strings', strings], ['sweep', 'Sweep', sweep], ['constellation', 'Constellation', constellation], ['starry', 'Starry Night', require('./starry.cjs').starry, ['both']], ['starry-2', 'Starry Night II', require('./starry2.cjs').starry2, ['both']], ['starry-3', 'Starry Night III', require('./starry3.cjs').starry3, ['both']]] };
