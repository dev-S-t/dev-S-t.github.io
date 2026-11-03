// Render a film to MP4: headless Chrome draws each frame of player.html, the PNGs are piped into ffmpeg with the
// sound from audio.cjs.
//   node render.mjs <film>                      -> out/<film>.mp4
//   node render.mjs <film> --sheet 0,1.5,3      -> out/<film>-sheet.png (contact sheet at those seconds)
//   node render.mjs <film> --sheet 0:24:0.5     -> every half second
//   options: --cols 4  --w 640  --tag name  --from s --to s (render part of the film)
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ffmpeg, chrome as findChrome } from './where.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), OUT = join(HERE, 'out');
if (typeof WebSocket === 'undefined') throw new Error('render.mjs needs Node 22 or newer');
const FFMPEG = ffmpeg(), CHROME = findChrome();
const args = process.argv.slice(2), film = args[0], opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'film-')), port = 9500 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--force-device-scale-factor=1', `--user-data-dir=${profile}`, '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 150; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch { } await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') console.log('EXCEPTION', JSON.stringify(m.params.exceptionDetails).slice(0, 800)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); return r.result.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: pathToFileURL(join(HERE, 'player.html')).href + `?film=${film}&render=1` });
for (let i = 0; i < 100; i++) { await sleep(100); try { if (await evaluate('!!window.FILM && document.fonts.status === "loaded"')) break; } catch { } }
const info = await evaluate('window.FILM');
const done = async () => { ws.close(); chrome.kill(); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch { } };

if (args.includes('--sheet')) {
  const spec = opt('sheet'); let times;
  if (spec.includes(':')) { const [a, b, s] = spec.split(':').map(Number); times = []; for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(3)); } else times = spec.split(',').map(Number);
  const crop = opt('crop', null), url = await evaluate(`sheet(${JSON.stringify(times)}, ${+opt('cols', 4)}, ${+opt('w', 640)}, ${crop ? JSON.stringify(crop.split(',').map(Number)) : 'null'})`);
  const file = join(OUT, `${film}-sheet${opt('tag', '') ? '-' + opt('tag') : ''}.png`);
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); console.log('sheet', file);
  await done(); process.exit(0);
}

// the sound first
const silent = args.includes('--silent');
if (!silent) execFileSync(process.execPath, [join(HERE, 'audio.cjs'), film], { stdio: 'inherit' });
const wav = join(OUT, `${film}.wav`), mp4 = join(OUT, `${film}${opt('tag', '') ? '-' + opt('tag') : ''}.mp4`);
const from = Math.round(+opt('from', 0) * info.fps), to = Math.min(info.frames, Math.round(+opt('to', info.dur) * info.fps));
const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'png', '-i', '-',
  ...(silent ? [] : ['-ss', String(from / info.fps), '-i', wav]), '-map', '0:v', ...(silent ? [] : ['-map', '1:a']), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation',
  '-pix_fmt', 'yuv420p', ...(silent ? ['-an'] : ['-af', 'loudnorm=I=-19:TP=-1.5:LRA=14', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest']), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = from; i < to; i++) {
  const url = await evaluate(`renderFrame(${i})`);
  if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0) process.stdout.write(`\r${film} frame ${i}/${to} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log(`\n${mp4} ${existsSync(mp4) ? 'written' : 'FAILED'} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await done(); process.exit(0);
