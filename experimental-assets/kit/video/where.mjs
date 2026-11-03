// Where ffmpeg, ffprobe and Chrome are, on any machine: the FFMPEG / FFPROBE / CHROME environment variables if set,
// then the PATH, then the usual install places.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const runs = (cmd) => { try { return spawnSync(cmd, ['-version'], { stdio: 'ignore' }).status === 0; } catch { return false; } };
// ffmpeg installed by winget on Windows is often not on the PATH of a non-interactive shell
const wingetBin = () => {
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Packages');
  if (!root || !existsSync(root)) return null;
  for (const p of readdirSync(root).filter((d) => d.startsWith('Gyan.FFmpeg'))) for (const b of readdirSync(join(root, p))) { const bin = join(root, p, b, 'bin'); if (existsSync(join(bin, 'ffmpeg.exe'))) return bin; }
  return null;
};
const ff = (name, env) => { if (process.env[env]) return process.env[env]; if (runs(name)) return name; const bin = wingetBin(); if (bin) return join(bin, name + '.exe'); throw new Error(`${name} not found: install ffmpeg, or set ${env} to its path`); };
export const ffmpeg = () => ff('ffmpeg', 'FFMPEG');
export const ffprobe = () => ff('ffprobe', 'FFPROBE');
export function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const places = { win32: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')], darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'] }[process.platform] || [];
  for (const p of places) if (p && existsSync(p)) return p;
  for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) if (runs(n)) return n;
  throw new Error('Chrome not found: install it, or set CHROME to its path');
}
