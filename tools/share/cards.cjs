// Share cards: the picture a link shows when it is posted on LinkedIn, WhatsApp, X, Slack and the like.
//
// For every page (every index.html that is not a redirect stub) this draws a 1200 x 630 card: the mark falling like
// a meteor (tools/share/fall.svg), and a paper plate with the lockup, the page's <h1> and its address. It also draws
// one 600 x 600 square for X's small card. Headless Chrome turns each into a PNG in assets/og/.
// A page that has no share tags yet gets them added after its last og: / twitter: tag, pointing at its card.
//
// usage (from the repo root):   node tools/share/cards.cjs              every page
//                                node tools/share/cards.cjs projects/voag  only the pages whose path contains that
// Chrome is looked for in the usual place on Windows; set CHROME=/path/to/chrome elsewhere.
// Run it again whenever a page is added, a page's <h1> changes, or the mark or the lettering changes.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const G = require(ROOT + '/tools/logo/logo-gen.cjs');
const LT = require(ROOT + '/tools/logo/lettering.cjs');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const only = process.argv[2] || '';

/* ---------- the pieces ---------- */
const fall = fs.readFileSync(__dirname + '/fall.svg', 'utf8').replace('<svg viewBox="0 0 600 360"', '<svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice"');
// the lockup: the mark with its brush streaks, and the site's lettering with its eyes, x-height centred on the mark
const wsym = fs.readFileSync(ROOT + '/assets/img/wordmark.svg', 'utf8').match(/<symbol id="w" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/);
const wvb = wsym[1].split(' ').map(Number), wh = 56, ws = wh / wvb[3], ww = wvb[2] * ws, wy = 50 - (-10 - wvb[1]) * ws;
const pupils = (LT.brand.match(/<circle class="pupil[^>]*\/>/g) || []).join('');
const lockup = `<svg viewBox="0 0 ${(122 + ww).toFixed(1)} 100" style="color:#0D0D0C">${G.svg({ texture: true }).replace('<svg ', '<svg x="0" y="0" width="100" height="100" ')}<svg x="122" y="${wy.toFixed(2)}" width="${ww.toFixed(2)}" height="${wh}" viewBox="${wsym[1]}">${wsym[2]}${pupils}</svg></svg>`;
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kalnia:wdth,wght@100..125,100..700&family=Workbench&display=swap">';
// the fall's own look, frozen: dashed trail and flow lines, each line's dashes at its own offset
const fallCss = `.fall{--bg:#F3F1EC;color:#0D0D0C}
.fall .trail path{stroke-dasharray:.16 .06;animation:trail 1.1s linear infinite paused;animation-delay:calc(var(--i) * -.17s)}
.fall .stream path{stroke-dasharray:.07 .025;animation:streamflow 1.5s linear infinite paused;animation-delay:calc(var(--i) * -.11s)}
@keyframes trail{to{stroke-dashoffset:-.22}}@keyframes streamflow{to{stroke-dashoffset:-.095}}`;
const base = `*{margin:0;box-sizing:border-box}html,body{background:#F3F1EC;color:#0D0D0C;overflow:hidden}svg{display:block}${fallCss}`;

/* ---------- the pages ---------- */
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  if (e.name.startsWith('.') || e.name === 'tools' || e.name === 'node_modules') return;
  const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'index.html') files.push(p);
});
walk(ROOT);
const pages = files.map((file) => {
  const s = fs.readFileSync(file, 'utf8'); if (/http-equiv="refresh"/.test(s)) return null; // redirect stubs
  const m = s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/); if (!m) return null;
  const h1 = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/');
  return { file, rel, slug: rel ? rel.replace(/\//g, '-') : 'home', h1, url: 'human-in-loop.dev/' + (rel ? rel + '/' : '') };
}).filter((p) => p && p.rel.includes(only));

/* ---------- drawing ---------- */
const esc = (s) => s.replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/</g, '&lt;');
const card = (p) => `<!doctype html><meta charset="utf-8">${fonts}<style>${base}
body{width:1200px;height:630px;position:relative}
.scene{position:absolute;left:250px;top:-45px;width:1200px;height:720px}.scene svg{width:100%;height:100%}
.plate{position:absolute;left:44px;top:44px;bottom:44px;width:560px;background:#F3F1EC;border-radius:28px;padding:40px 44px;display:flex;flex-direction:column;justify-content:space-between}
.lk svg{height:58px;width:auto}
h1{font:600 60px/1.04 Kalnia,Georgia,serif;font-variation-settings:"wdth" 112;letter-spacing:-.01em;text-wrap:balance}
.u{font:22px Workbench,ui-monospace,monospace;letter-spacing:.02em}
</style><div class="scene">${fall}</div><div class="plate"><div class="lk">${lockup}</div><h1 id="t">${esc(p.h1)}</h1><div class="u">${esc(p.url)}</div></div>
<script>document.fonts.ready.then(()=>{const t=document.getElementById('t');let s=60;while((t.scrollHeight>300||t.scrollWidth>472)&&s>30){s-=2;t.style.fontSize=s+'px'}});</script>`;
const square = `<!doctype html><meta charset="utf-8"><style>${base}body{width:600px;height:600px;position:relative}.scene{position:absolute;left:-500px;top:-180px;width:1600px;height:960px}.scene svg{width:100%;height:100%}</style><div class="scene">${fall}</div>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hil-cards-'));
function shoot(html, w, h, out) {
  const f = path.join(tmp, 'page.html'); fs.writeFileSync(f, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${path.join(tmp, 'profile')}`,
    `--window-size=${w},${h}`, '--virtual-time-budget=8000', `--screenshot=${out}`, 'file:///' + f.split(path.sep).join('/')], { stdio: 'ignore' });
}
fs.mkdirSync(ROOT + '/assets/og', { recursive: true });
for (const p of pages) { shoot(card(p), 1200, 630, path.join(ROOT, 'assets/og', p.slug + '.png')); console.log('card', p.slug); }
if (!only) { shoot(square, 600, 600, path.join(ROOT, 'assets/og/square.png')); console.log('square'); }
fs.rmSync(tmp, { recursive: true, force: true });

/* ---------- tags: add them to any page that has none yet ---------- */
for (const p of pages) {
  let s = fs.readFileSync(p.file, 'utf8');
  if (s.includes('property="og:image"')) continue;
  const alt = esc(`The human-in-loop.dev mark falling like a meteor, beside the title: ${p.h1}`).replace(/"/g, '&quot;');
  const og = `\n  <meta property="og:image" content="https://human-in-loop.dev/assets/og/${p.slug}.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="${alt}">`;
  const tw = `\n  <meta name="twitter:image" content="https://human-in-loop.dev/assets/og/square.png">\n  <meta name="twitter:image:alt" content="The human-in-loop.dev mark falling like a meteor">`;
  const lines = s.split('\n');
  const last = (re) => lines.map((l, i) => (re.test(l) ? i : -1)).filter((i) => i >= 0).pop();
  const lo = last(/<meta property="og:/), lt = last(/<meta name="twitter:/);
  if (lo == null) { console.log('NO og: TAGS, add them by hand:', p.rel || '/'); continue; }
  if (lt != null) { lines[lt] += tw; lines[lo] += og; } else lines[lo] += og + tw;
  fs.writeFileSync(p.file, lines.join('\n'));
  console.log('tags added', p.rel || '/');
}
