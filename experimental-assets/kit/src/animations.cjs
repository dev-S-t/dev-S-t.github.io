// Animations for the pages: small looping SVGs on a clear ground, drawn from the site's own mark (tools/logo) and
// lettering (assets/img/wordmark.svg). Each stops for readers who ask for less motion. 'paper' means ink lines for a
// paper page, 'ink' paper lines for an ink page.
const fs = require('fs'), path = require('path');
const L = require('./lib.cjs'), FIG = require('./figure.cjs');
const ROOT = path.resolve(__dirname, '../../..');
const G = require(ROOT + '/tools/logo/logo-gen.cjs');
const WORD = fs.readFileSync(ROOT + '/assets/img/wordmark.svg', 'utf8').match(/<symbol id="w" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);
const EYES = [[211.06, -10], [237.16, -10]]; // the pupils' rests in the lettering's two o's (assets/js lettering markup)

// IN SYNC: the mark's three rings turn one, two and three times a cycle, easing in and out, so their openings
// drift apart and meet again at 11 o'clock; the figure stands still inside them
function loader() {
  const { paths } = G.build({ texture: false, samples: 140 });
  const c = [G.RINGS.loop, G.RINGS.arms, G.RINGS.head];
  const css = c.map(([x, y], i) => `.r${i}{transform-origin:${x}px ${y}px;animation:t${i} 6s cubic-bezier(.65,0,.35,1) infinite}@keyframes t${i}{to{transform:rotate(${360 * (i + 1)}deg)}}`).join('');
  return (theme) => L.svg({ w: 100, h: 100, css, title: 'In sync: the three rings turn and line up their openings at 11 o\'clock', pw: 240, ph: 240,
    body: `<g fill="${L.THEMES[theme].fg}">${paths.slice(0, 3).map((d, i) => `<path class="r${i}" d="${d}"/>`).join('')}<path d="${paths[3]}${paths[4]}"/></g>` });
}

// WATCHING: the lettering, its two pupils looking about together and blinking now and then
function watching() {
  const vb = WORD[1];
  const look = [[0, 1.3, 0], [14, 1.3, 0], [18, -3.4, 0], [34, -3.4, 0], [38, -2.2, -2.6], [50, -2.2, -2.6], [54, 3.2, 1.3], [70, 3.2, 1.3], [74, 1.3, 0], [100, 1.3, 0]];
  const kf = look.map(([p, x, y]) => `${p}%{transform:translate(${x}px,${y}px)}`).join('');
  const css = `.p{animation:p 8s ease-in-out infinite}@keyframes p{${kf}}.lid{transform-box:fill-box;transform-origin:center;animation:b 8s infinite}@keyframes b{0%,86%,90%,100%{transform:scaleY(1)}88%{transform:scaleY(.08)}}`;
  return (theme) => {
    const fg = L.THEMES[theme].fg;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="553" height="85" role="img"><title>Watching: the lettering's eyes look around</title><style>${css}${L.CALM}</style>` +
      `<g color="${fg}">${WORD[2]}</g>` + EYES.map(([x, y]) => `<g class="p"><circle class="lid" cx="${x}" cy="${y}" r="2.5" fill="${fg}"/></g>`).join('') + '</svg>\n';
  };
}

// WALK: the figure walking, as six stop-motion frames, each set down a little crooked; the ground slides by
function walk() {
  const T = 0.84, n = 6, rnd = L.rng(3);
  const css = `.fr{opacity:0;animation:fr ${T}s step-end infinite}@keyframes fr{0%{opacity:1}${(100 / n).toFixed(2)}%{opacity:0}}` +
    `.gr{animation:gr ${T}s steps(${n}) infinite}@keyframes gr{to{stroke-dashoffset:24}}`;
  return (theme) => {
    const fg = L.THEMES[theme].fg;
    let frames = '';
    for (let k = 0; k < n; k++) {
      const jr = (rnd() - 0.5) * 2.4, jx = (rnd() - 0.5) * 2.4, jy = (rnd() - 0.5) * 1.6;
      frames += `<g class="fr" style="animation-delay:${(k * T / n).toFixed(3)}s" transform="translate(${L.n1(jx)} ${L.n1(jy)}) rotate(${L.n1(jr)} 160 172)">${FIG.draw(FIG.walkFrame(k, n), { x: 160, y: 172, size: 130, fg })}</g>`;
    }
    return L.svg({ w: 320, h: 200, css, title: 'Walk: the figure walking, frame by frame', body: frames + `<path class="gr" d="M14 178H306" stroke="${fg}" stroke-width="2.4" stroke-dasharray="14 10" stroke-linecap="round"/>` });
  };
}

// SPEAKING: a voice drawn as upright lines, louder in the middle, each rising and falling on its own beat
function speaking() {
  const rnd = L.rng(9), N = 33, bars = [];
  for (let i = 0; i < N; i++) { const t = i / (N - 1), env = 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * t), 1.4); bars.push([18 + i * 10, 8 + 44 * env * (0.6 + 0.4 * rnd()), Math.floor(rnd() * 4), (1.1 + rnd() * 0.9).toFixed(2), (-rnd() * 2).toFixed(2)]); }
  const shapes = ['.15;1;.4;.85;.2', '.3;.7;1;.35;.6', '.5;.2;.9;.6;1', '.2;.55;.3;1;.45'];
  const css = '.b{transform-box:fill-box;transform-origin:center;animation:var(--a) var(--d) ease-in-out infinite alternate}' +
    shapes.map((s, k) => `@keyframes s${k}{${s.split(';').map((v, j) => `${j * 25}%{transform:scaleY(${v})}`).join('')}}`).join('');
  return (theme) => L.svg({ w: 360, h: 120, css, title: 'Speaking: a voice made of lines',
    body: `<g stroke="${L.THEMES[theme].fg}" stroke-width="3.2" stroke-linecap="round">` + bars.map(([x, h, k, d, dl]) => `<path class="b" style="--a:s${k};--d:${d}s;animation-delay:${dl}s" d="M${x} ${60 - h}V${60 + h}"/>`).join('') + '</g>' });
}

// DRAW-ON: the mark paints itself stroke by stroke along its brush lines (loop, arms, head, spine, legs), holds,
// then fades and starts again
function drawOn() {
  const { paths, gaps } = G.build({ texture: true, samples: 160 });
  const loop = G.arc(...G.RINGS.loop, G.GAP, G.OPEN, 1, 0.025), arms = G.arc(...G.RINGS.arms, G.GAP, G.OPEN, 2, 0.03), head = G.arc(...G.RINGS.head, G.GAP, G.OPEN, 3, 0.03);
  const fig = G.figure(1), lines = [loop, arms, head, fig.spine[0], fig.legs[0]], widths = [9, 7, 8, 7, 7];
  const spans = [[0, 20], [20, 32], [32, 42], [42, 49], [49, 57]], P = 7;
  const sample = (f) => { const pts = []; for (let i = 0; i <= 120; i++) pts.push(f(-0.03 + 1.06 * i / 120)); return L.pathData([pts], 2); };
  const css = spans.map(([a, b], i) => `.d${i}{stroke-dasharray:1 1;stroke-dashoffset:1;animation:d${i} ${P}s linear infinite}@keyframes d${i}{0%,${a}%{stroke-dashoffset:1}${b}%,100%{stroke-dashoffset:0}}`).join('') +
    `.mk{animation:mk ${P}s infinite}@keyframes mk{0%,84%{opacity:1}94%,100%{opacity:0}}`;
  return (theme) => {
    const fg = L.THEMES[theme].fg;
    const body = `<defs><mask id="dry" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${gaps.join('')}" fill="none" stroke="#000" stroke-width=".34" stroke-linecap="round"/></mask>` +
      `<mask id="dm" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">${lines.map((f, i) => `<path class="d${i}" pathLength="1" d="${sample(f)}" fill="none" stroke="#fff" stroke-width="${widths[i]}" stroke-linecap="butt"/>`).join('')}</mask></defs>` +
      `<g class="mk"><g mask="url(#dm)"><path fill="${fg}" mask="url(#dry)" d="${paths.join('')}"/></g></g>`;
    return L.svg({ w: 100, h: 100, css, title: 'Draw-on: the mark paints itself stroke by stroke', body, pw: 240, ph: 240 });
  };
}

// SCROLL: a small open ring slides down a line and fades, to say there is more below
function scroll() {
  const css = '.ring{animation:sc 2.4s cubic-bezier(.5,0,.75,1) infinite}@keyframes sc{0%{transform:translateY(0);opacity:0}12%{opacity:1}70%{opacity:1}100%{transform:translateY(104px);opacity:0}}';
  const a0 = (-120 + 15) * Math.PI / 180, a1 = (-120 - 15 + 360) * Math.PI / 180, r = 7;
  const ring = `M${L.n2(30 + r * Math.cos(a0))} ${L.n2(24 + r * Math.sin(a0))}A${r} ${r} 0 1 1 ${L.n2(30 + r * Math.cos(a1))} ${L.n2(24 + r * Math.sin(a1))}`;
  return (theme) => { const fg = L.THEMES[theme].fg; return L.svg({ w: 60, h: 160, css, title: 'Scroll: a ring slides down a line', body: `<path d="M30 12V148" stroke="${fg}" stroke-width="1.2" opacity=".5"/><path class="ring" d="${ring}" fill="none" stroke="${fg}" stroke-width="2.6" stroke-linecap="round"/>` }); };
}

// THINKING: three small open rings turn one after another, the line-drawn version of the dots that mean "working"
function thinking() {
  const css = '.k{transform-box:fill-box;transform-origin:center;animation:k 1.8s cubic-bezier(.6,0,.4,1) infinite}@keyframes k{0%{transform:rotate(0)}40%,100%{transform:rotate(360deg)}}';
  const ring = (cx, cy, r) => { const a0 = (-120 + 15) * Math.PI / 180, a1 = (-120 - 15 + 360) * Math.PI / 180; return `M${L.n2(cx + r * Math.cos(a0))} ${L.n2(cy + r * Math.sin(a0))}A${r} ${r} 0 1 1 ${L.n2(cx + r * Math.cos(a1))} ${L.n2(cy + r * Math.sin(a1))}`; };
  return (theme) => { const fg = L.THEMES[theme].fg; return L.svg({ w: 120, h: 40, css, title: 'Thinking: three rings turn in turn',
    body: `<g fill="none" stroke="${fg}" stroke-width="2.6" stroke-linecap="round">` + [25, 60, 95].map((x, i) => `<path class="k" style="animation-delay:${(i * 0.22).toFixed(2)}s" d="${ring(x, 20, 9)}"/>`).join('') + '</g>' }); };
}

// LISTENING: open rings leave a small one and spread, fading, like a voice coming in
function listening() {
  const ring = (r) => { const a0 = (-120 + 15) * Math.PI / 180, a1 = (-120 - 15 + 360) * Math.PI / 180; return `M${L.n2(80 + r * Math.cos(a0))} ${L.n2(80 + r * Math.sin(a0))}A${r} ${r} 0 1 1 ${L.n2(80 + r * Math.cos(a1))} ${L.n2(80 + r * Math.sin(a1))}`; };
  const css = '.w{transform-origin:80px 80px;animation:w 2.4s cubic-bezier(.2,.6,.4,1) infinite}@keyframes w{0%{transform:scale(.3);opacity:0}15%{opacity:1}100%{transform:scale(1);opacity:0}}';
  return (theme) => { const fg = L.THEMES[theme].fg; return L.svg({ w: 160, h: 160, css, title: 'Listening: open rings spread from a small one',
    body: `<g fill="none" stroke="${fg}" stroke-linecap="round"><path d="${ring(16)}" stroke-width="4"/>` + [0, 0.8, 1.6].map((d) => `<path class="w" style="animation-delay:${d}s" d="${ring(66)}" stroke-width="3"/>`).join('') + '</g>' }); };
}

// SEARCHING: the figure, hand at his brow, looks one way, then the other, in stop-motion steps
function searching() {
  const T = 3.2, frames = [['watch', false], ['watch', false], ['stand', false], ['watch', true], ['watch', true], ['stand', true]];
  const css = `.fr{opacity:0;animation:fr ${T}s step-end infinite}@keyframes fr{0%{opacity:1}${(100 / frames.length).toFixed(2)}%{opacity:0}}`;
  return (theme) => { const fg = L.THEMES[theme].fg; return L.svg({ w: 200, h: 200, css, title: 'Searching: the figure looks one way, then the other',
    body: frames.map(([p, m], k) => `<g class="fr" style="animation-delay:${(k * T / frames.length).toFixed(2)}s">${FIG.draw(p, { x: 100, y: 182, size: 150, fg, mirror: m })}</g>`).join('') }); };
}

// HELLO: the figure waves, his arm going back and forth, frame by frame
function hello() {
  // the upper arm out to the side, clear of the head; the forearm swings
  const T = 1.2, arm = (a) => ({ ...FIG.POSES.stand, arms: [FIG.POSES.stand.arms[0], [[0.27, -0.42], [0.27 + 0.24 * Math.cos(a), -0.42 - 0.24 * Math.sin(a)]]] });
  const frames = [arm(0.55), arm(0.95), arm(1.35), arm(0.95)];
  const css = `.fr{opacity:0;animation:fr ${T}s step-end infinite}@keyframes fr{0%{opacity:1}25%{opacity:0}}`;
  return (theme) => { const fg = L.THEMES[theme].fg; return L.svg({ w: 200, h: 200, css, title: 'Hello: the figure waves',
    body: frames.map((p, k) => `<g class="fr" style="animation-delay:${(k * T / 4).toFixed(2)}s">${FIG.draw(p, { x: 92, y: 182, size: 150, fg })}</g>`).join('') }); };
}

// EYES: the lockup. The lettering's o's are eyes: they look at you, look about and find the mark; the figure in it turns
// his head toward them; they narrow, glance at you, and look back; he hops and sways his arms ring over his head from
// side to side (hello); the eyes go happy; then they look at you again. One 12 s cycle (the film Eyes, as a loop).
function eyes() {
  const T = 12, mark = G.build({ texture: true }), vb = WORD[1].split(' ').map(Number), WS = 56 / vb[3], ww = vb[2] * WS, wy = 50 - (-10 - vb[1]) * WS;
  const d = WORD[2].match(/<path d="([^"]+)"/)[1], subs = d.split('M').filter(Boolean).map((p) => 'M' + p), O = [17, 18];
  const rest = subs.filter((_, i) => !O.includes(i)).join(''), dot = WORD[2].match(/<circle[^>]*\/>/)[0];
  // keyframes from [seconds, value] pairs; a pair of equal neighbours holds
  const kf = (name, keys, prop = 'transform') => `@keyframes ${name}{${keys.map(([t, v]) => `${L.n2(100 * t / T)}%{${prop}:${v}}`).join('')}}`;
  const P = (x, y) => `translate(${x}px,${y}px)`, at = [0, 1], right = [3.5, -0.5], upl = [-1.3, -2.6], mk = [-3.6, 0.7];
  const look = [[0, at], [1.8, at], [1.95, right], [2.4, right], [2.55, upl], [3.0, upl], [3.12, mk], [5.25, mk], [5.37, at], [5.65, at], [5.77, mk], [9.15, mk], [9.3, at], [T, at]];
  const sc = (sx, sy) => `scale(${sx},${sy})`;
  const lid = [[0, sc(1, 1)], [1.1, sc(1, 1)], [1.2, sc(1, 0.08)], [1.3, sc(1, 1)], [3.1, sc(1, 1)], [3.22, sc(1.07, 1.07)], [3.6, sc(1.07, 1.07)], [3.85, sc(1, 1)], [4.6, sc(1, 1)], [4.85, sc(1, 0.68)], [6.1, sc(1, 0.68)], [6.25, sc(1, 1)], [10.7, sc(1, 1)], [10.8, sc(1, 0.08)], [10.9, sc(1, 1)], [T, sc(1, 1)]];
  const op = (on, off) => [[0, 0], [on - 0.08, 0], [on, 1], [off, 1], [off + 0.08, 0], [T, 0]];
  const head = [[0, 'translate(0,0) rotate(0deg)'], [3.8, 'translate(0,0) rotate(0deg)'], [4.25, 'translate(1.1px,0) rotate(20deg)'], [4.35, 'translate(1.1px,0) rotate(17deg)'], [4.45, 'translate(1.1px,0) rotate(18.5deg)'], [8.9, 'translate(1.1px,0) rotate(18deg)'], [9.3, 'translate(0,0) rotate(0deg)'], [T, 'translate(0,0) rotate(0deg)']];
  const SW = [6.5, 0.31, 4], swayK = [[0, 'rotate(0deg)'], [SW[0], 'rotate(0deg)']]; for (let k = 0; k < SW[2]; k++) swayK.push([SW[0] + SW[1] * (k + 0.5), `rotate(${k % 2 ? -11 : 11}deg)`]); swayK.push([SW[0] + SW[1] * SW[2] + 0.15, 'rotate(0deg)'], [T, 'rotate(0deg)']);
  const hop = [[0, 'translate(0,0)'], [6.35, 'translate(0,0)'], [6.55, 'translate(0,-4px)'], [6.75, 'translate(0,0)'], [7.75, 'translate(0,0)'], [7.88, 'translate(0,-1.6px)'], [8.0, 'translate(0,0)'], [T, 'translate(0,0)']];
  const SH = [50 + -0.0076 * 62, 50 + 0.425 * 62], HC = [G.RINGS.head[0], G.RINGS.head[1]];
  const css = `.p{animation:pl ${T}s infinite}${kf('pl', look.map(([t, [x, y]]) => [t, P(x, y)]))}` +
    `.lid{animation:lid ${T}s infinite}${kf('lid', lid)}` +
    `.o{animation:oo ${T}s infinite}${kf('oo', op(8.1, 9.0).map(([t, v]) => [t, 1 - v]), 'opacity')}.hp{opacity:0;animation:hp ${T}s infinite}${kf('hp', op(8.1, 9.0), 'opacity')}` +
    `.hd{transform-origin:${HC[0]}px ${HC[1]}px;animation:hd ${T}s infinite}${kf('hd', head)}` +
    `.sw{transform-origin:${L.n2(SH[0])}px ${L.n2(SH[1])}px;animation:sw ${T}s infinite}${kf('sw', swayK)}` +
    `.hop{animation:hop ${T}s infinite}${kf('hop', hop)}`;
  return (theme) => {
    const { fg, bg } = L.THEMES[theme], [loop, arms, hd, spine, legs] = mark.paths;
    const eye = ([x, y], i) => `<g class="lid" style="transform-origin:${x}px ${y}px"><path class="o" d="${subs[O[i]]}"/><g class="o"><g class="p"><circle cx="${x}" cy="${y}" r="2.5" fill="${fg}" stroke="none"/></g></g></g>` +
      `<path class="hp" d="M${L.n2(x - 7.6)} ${L.n2(y - 0.6)}A8.9 8.9 0 0 1 ${L.n2(x + 7.6)} ${L.n2(y - 0.6)}"/>`;
    const body = `<g fill="${fg}"><path d="${loop}"/><g class="hop"><path d="${spine}"/><path d="${legs}"/><g class="sw"><path d="${arms}"/></g><g class="hd"><path d="${hd}"/></g></g></g>` +
      `<g fill="none" stroke="${bg}" stroke-width=".34" stroke-linecap="round">${mark.gaps.map((g) => `<path d="${g}"/>`).join('')}</g>` +
      `<svg x="122" y="${L.n2(wy)}" width="${L.n2(ww)}" height="56" viewBox="${WORD[1]}" overflow="visible"><g fill="none" stroke="${fg}" stroke-width="4.2" stroke-linejoin="round"><path d="${rest}"/>${dot.replace('currentColor', fg)}${EYES.map(eye).join('')}</g></svg>`;
    return L.svg({ w: L.n2(122 + ww), h: 100, pw: 727, ph: 150, css, title: 'Eyes: the lettering\'s eyes find the figure in the mark, and he waves back', body });
  };
}

module.exports = { list: [
  ['watching', 'Watching', watching, 553, 85], ['eyes', 'Eyes', eyes, 727, 150], ['walk', 'Walk', walk, 320, 200],
  ['draw-on', 'Draw-on', drawOn, 240, 240], ['scroll', 'Scroll', scroll, 60, 160], ['thinking', 'Thinking', thinking, 120, 40],
  ['listening', 'Listening', listening, 160, 160], ['searching', 'Searching', searching, 200, 200], ['hello', 'Hello', hello, 200, 200]
] };
