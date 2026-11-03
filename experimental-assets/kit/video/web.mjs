// A copy of a rendered film small enough for the collection page (under 14 MB): two-pass H.264 at the bit rate that
// fits, audio kept. Films already small enough are copied as they are.
//   node web.mjs <film>                 -> out/<film>-web.mp4
//   node web.mjs <film> --mb 6 --w 1600 -> a smaller copy (for a looping section background), out/<film>-web.mp4
import { execFileSync } from 'node:child_process';
import { statSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ffmpeg, ffprobe } from './where.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), OUT = join(HERE, 'out');
const FF = ffmpeg(), NULL = process.platform === 'win32' ? 'NUL' : '/dev/null';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const film = args[0], src = join(OUT, `${film}.mp4`), dst = join(OUT, `${film}-web.mp4`), LIMIT = opt('--mb', 14) * 1024 * 1024, WIDTH = opt('--w', 0);
const scale = WIDTH ? ['-vf', `scale=${WIDTH}:-2:flags=lanczos`] : [];
if (!WIDTH && statSync(src).size <= LIMIT) { copyFileSync(src, dst); console.log(dst, 'copied'); process.exit(0); }
const dur = +execFileSync(ffprobe(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString();
const kbps = Math.floor((LIMIT * 0.95 * 8 / 1000) / dur - 160);
const log = join(OUT, `${film}-2pass`);
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, ...scale, '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${kbps}k`, '-pass', '1', '-passlogfile', log, '-an', '-f', 'null', NULL]);
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, ...scale, '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${kbps}k`, '-pass', '2', '-passlogfile', log, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', dst]);
for (const f of [`${log}-0.log`, `${log}-0.log.mbtree`]) { try { rmSync(f); } catch { } }
console.log(dst, (statSync(dst).size / 1048576).toFixed(1) + ' MB at', kbps + 'k');
