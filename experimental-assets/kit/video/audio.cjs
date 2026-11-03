// Sound for the films, synthesised from each film's cue list (film.events()): footsteps, plucked strings
// (Karplus-Strong), bells, whooshes, a pad, all through a small hall reverb. Writes out/<film>.wav (48 kHz stereo).
//   node audio.cjs <film>
const fs = require('fs'), path = require('path');
const SR = 48000, TAU = Math.PI * 2;
const film = process.argv[2], F = require(`./film-${film}.js`);
const N = Math.ceil((F.dur + 0.5) * SR);
const dry = [new Float32Array(N), new Float32Array(N)], wet = [new Float32Array(N), new Float32Array(N)];

let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
// put a mono sample into the mix at (pan -1..1) with a reverb send
function put(i, v, pan = 0, send = 0.25) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  dry[0][i] += v * l; dry[1][i] += v * r; wet[0][i] += v * l * send; wet[1][i] += v * r * send;
}
// a two-pole resonant band-pass (state variable), for shaping noise
function svf() { let lo = 0, bp = 0; return (x, f, q) => { const g = 2 * Math.sin(Math.PI * Math.min(f, SR / 6) / SR); lo += g * bp; const hi = x - lo - bp / q; bp += g * hi; return { lo, bp, hi }; }; }

const S = {
  // a footstep: a soft low knock and a little grit
  step({ t, amp = 0.6, pan = 0, tone = 1 }) {
    const i0 = Math.round(t * SR), n = Math.round(0.14 * SR), f = svf(); let ph = 0;
    const fr = (90 + rnd() * 20) * tone;
    for (let i = 0; i < n; i++) { const x = i / SR, e = Math.exp(-x / 0.035); ph += TAU * fr * (1 - 0.35 * Math.min(1, x / 0.05)) / SR;
      put(i0 + i, amp * (0.55 * Math.sin(ph) * e + 0.18 * f(noise(), 1700 * tone, 1.2).bp * Math.exp(-x / 0.012)), pan, 0.12); }
  },
  tap({ t }) { const i0 = Math.round(t * SR); for (let i = 0; i < 0.25 * SR; i++) { const x = i / SR; put(i0 + i, 0.22 * Math.sin(TAU * 2350 * x) * Math.exp(-x / 0.05) + 0.1 * noise() * Math.exp(-x / 0.004), 0.15, 0.3); } },
  // the pebble's long fall: a falling whistle that thins out into the dark
  fall({ t, dur }) {
    const i0 = Math.round(t * SR), n = Math.round(dur * SR); let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n, f = 1500 * Math.pow(260 / 1500, u) * (1 + 0.006 * Math.sin(TAU * 5.5 * i / SR)); ph += TAU * f / SR;
      put(i0 + i, 0.09 * Math.sin(ph) * Math.min(1, u * 12) * Math.pow(1 - u, 1.6), 0.25 - 0.3 * u, 0.5); }
  },
  gulp({ t }) { const i0 = Math.round(t * SR); let ph = 0; for (let i = 0; i < 0.16 * SR; i++) { const x = i / SR, f = 300 * Math.pow(0.45, x / 0.16); ph += TAU * f / SR; put(i0 + i, 0.3 * Math.sin(ph) * Math.sin(Math.PI * x / 0.16), 0, 0.15); } },
  // air: band-passed noise sweeping up and down, panned across
  whoosh({ t, dur, amp = 0.32, from = -0.6, to = 0.6 }) {
    const i0 = Math.round(t * SR), n = Math.round(dur * SR), f = svf();
    for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * Math.pow(u, 0.7)); put(i0 + i, amp * e * f(noise(), 350 + 1600 * Math.sin(Math.PI * u), 1.6).bp, from + (to - from) * u, 0.35); }
  },
  swish({ t }) { S.whoosh({ t, dur: 0.18, amp: 0.12, from: -0.2, to: 0.2 }); },
  // held breath over the slow motion: a high shimmer and a low swell
  hold({ t, dur }) {
    const i0 = Math.round(t * SR), n = Math.round(dur * SR);
    for (let i = 0; i < n; i++) { const x = i / SR, u = i / n, e = Math.pow(Math.sin(Math.PI * u), 1.5);
      put(i0 + i, e * (0.035 * Math.sin(TAU * 1760 * x) * (0.6 + 0.4 * Math.sin(TAU * 6 * x)) + 0.03 * Math.sin(TAU * 2637 * x) + 0.12 * Math.sin(TAU * 55 * x)), 0, 0.6); }
  },
  land({ t }) {
    const i0 = Math.round(t * SR), f = svf(); let ph = 0;
    for (let i = 0; i < 0.5 * SR; i++) { const x = i / SR; ph += TAU * (72 * Math.pow(0.6, x / 0.25)) / SR; put(i0 + i, 0.75 * Math.sin(ph) * Math.exp(-x / 0.11) + 0.35 * f(noise(), 500, 0.8).lo * Math.exp(-x / 0.05), 0.1, 0.2); }
  },
  // a bell: inharmonic partials, each fading at its own rate
  chime({ t, f = 1046.5, amp = 0.16, pan = 0.1 }) {
    const i0 = Math.round(t * SR), P = [[1, 1, 1.6], [2.0, 0.5, 1.0], [3.01, 0.32, 0.6], [4.17, 0.2, 0.4], [5.43, 0.12, 0.25]];
    for (let i = 0; i < 2.2 * SR; i++) { const x = i / SR; let v = 0; for (const [m, a, d] of P) v += a * Math.sin(TAU * f * m * x) * Math.exp(-x / d); put(i0 + i, amp * v * Math.min(1, x * 400), pan, 0.45); }
  },
  // a plucked string: a burst of noise in a delay line that loses a little every pass
  pluck({ t, f, amp = 0.32, pan = 0, decay = 0.996, bright = 0.5, len = 3 }) {
    const i0 = Math.round(t * SR), D = SR / f, n = Math.floor(D), frac = D - n, buf = new Float32Array(n + 2);
    let lp = 0; for (let k = 0; k < buf.length; k++) { lp += (noise() - lp) * (0.3 + 0.7 * bright); buf[k] = lp; }
    let idx = 0, prev = 0, dc = 0, dcy = 0;
    for (let i = 0; i < len * SR; i++) {
      const a = buf[idx], b = buf[(idx + 1) % buf.length], y = decay * ((1 - frac) * a + frac * b) * 0.5 + decay * 0.5 * prev;
      prev = a; buf[idx] = y; idx = (idx + 1) % buf.length;
      dcy = y - dc + 0.995 * dcy; dc = y;               // keep it off DC
      put(i0 + i, amp * dcy * Math.min(1, i / 40), pan, 0.4);
    }
  },
  hi({ t, notes }) { notes.forEach((f, k) => S.pluck({ t: t + k * 0.13, f, amp: 0.22, pan: 0.35, decay: 0.994 })); },
  // a pad: soft detuned sines moving through chords
  pad({ t: t0, dur, chords, amp = 0.05 }) {
    for (let c = 0; c < chords.length; c++) {
      const [ts, te, notes] = chords[c], i0 = Math.round(ts * SR), i1 = Math.min(N, Math.round(te * SR));
      for (const f of notes) for (const det of [-0.0025, 0, 0.0031]) {
        const ff = f * (1 + det), pan = det * 180, lfo = 0.13 + Math.abs(det) * 40;
        for (let i = i0; i < i1; i++) { const x = i / SR, e = Math.min(1, (x - ts) / 1.6) * Math.min(1, (te - x) / 1.4);
          put(i, amp * e * (Math.sin(TAU * ff * x) + 0.18 * Math.sin(TAU * 2 * ff * x)) * (0.75 + 0.25 * Math.sin(TAU * lfo * x)) / 3, pan, 0.5); }
      }
    }
  }
};
// the ring rolling: a low rumble that grows with its speed
S.rumble = ({ speeds }) => {
  const f = svf(); let ph = 0;
  for (let i = 0; i < N; i++) { const x = i / SR, k = Math.min(speeds.length - 1, x * 50), v = speeds[Math.floor(k)] + (speeds[Math.ceil(k)] - speeds[Math.floor(k)]) * (k % 1), a = Math.min(1, v / 4);
    ph += TAU * (38 + 14 * a) / SR; put(i, a * (0.14 * f(noise(), 90 + 160 * a, 0.9).lo + 0.05 * Math.sin(ph)), 0, 0.15); }
};
// a creak: a slow, rough, wavering tone
S.creak = ({ t }) => { const i0 = Math.round(t * SR); let ph = 0; for (let i = 0; i < 0.55 * SR; i++) { const x = i / SR, f = 150 - 40 * x + 12 * Math.sin(TAU * 7 * x); ph += TAU * f / SR; const saw = 2 * ((ph / TAU) % 1) - 1; put(i0 + i, 0.06 * saw * Math.sin(Math.PI * x / 0.55) * (0.6 + 0.4 * Math.sin(TAU * 31 * x)), 0.1, 0.3); } };
// night: crickets, pairs of quick high chirps, here and there
S.crickets = ({ t, dur }) => {
  const r = (() => { let s = 77; return () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; })();
  for (let c = t + 0.2; c < t + dur; c += 0.35 + r() * 0.9) {
    const f = 4300 + r() * 700, pan = r() * 1.4 - 0.7, fade = Math.min(1, (t + dur - c) / 3);
    for (let k = 0; k < 3; k++) { const i0 = Math.round((c + k * 0.045) * SR); for (let i = 0; i < 0.03 * SR; i++) { const x = i / SR; put(i0 + i, 0.025 * fade * Math.sin(TAU * f * x) * Math.sin(Math.PI * x / 0.03), pan, 0.5); } }
  }
};
// a sleeper's breath: soft noise, in (rising) or out (falling)
S.breath = ({ t, dur, out }) => { const i0 = Math.round(t * SR), n = Math.round(dur * SR), f = svf(); for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * u) ** 2; put(i0 + i, 0.07 * e * f(noise(), out ? 900 - 300 * u : 600 + 300 * u, 0.7).bp, -0.1, 0.2); } };
// first light: high soft partials fading in
S.shimmer = ({ t, dur }) => { const i0 = Math.round(t * SR), n = Math.round(dur * SR); for (let i = 0; i < n + SR * 3; i++) { const x = i / SR, e = Math.min(1, x / dur) * Math.min(1, (n + SR * 3 - i) / (SR * 3)); put(i0 + i, 0.02 * e * (Math.sin(TAU * 1568 * x) + 0.7 * Math.sin(TAU * 2093 * x + 1) + 0.5 * Math.sin(TAU * 2637 * x + 2)) * (0.7 + 0.3 * Math.sin(TAU * 0.7 * x)), 0, 0.7); } };
// a bird: a quick falling-rising whistle
S.chirp = ({ t, f }) => { const i0 = Math.round(t * SR); let ph = 0; for (let k = 0; k < 2; k++) for (let i = 0; i < 0.09 * SR; i++) { const x = i / SR, u = x / 0.09, fr = f * (1 + 0.25 * Math.sin(Math.PI * u)) * (k ? 1.12 : 1); ph += TAU * fr / SR; put(i0 + Math.round(k * 0.13 * SR) + i, 0.045 * Math.sin(ph) * Math.sin(Math.PI * u), -0.6, 0.6); } };
S.rustle = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); for (let i = 0; i < 0.35 * SR; i++) { const u = i / (0.35 * SR); put(i0 + i, 0.09 * Math.sin(Math.PI * u) * f(noise(), 2400, 0.6).bp * (0.6 + 0.4 * Math.sin(TAU * 23 * u)), 0, 0.2); } };
// a yawn: breath through a vowel that opens and closes, the pitch rising then falling
S.yawn = ({ t }) => {
  const i0 = Math.round(t * SR), n = Math.round(1.3 * SR), f1 = svf(), f2 = svf(); let ph = 0;
  for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * Math.min(1, u * 1.2)) ** 1.5, p = 170 + 90 * Math.sin(Math.PI * Math.min(1, u * 1.4)) - 40 * u; ph += TAU * p / SR;
    const src = 0.6 * (2 * ((ph / TAU) % 1) - 1) + 0.4 * noise(), open = Math.sin(Math.PI * u);
    put(i0 + i, 0.16 * e * (f1(src, 500 + 400 * open, 3).bp + 0.6 * f2(src, 1100 + 500 * open, 4).bp), 0, 0.25); }
};
// the stretch: a held hum that rises with the reach and wavers at the top
S.rise = ({ t, dur }) => {
  const i0 = Math.round(t * SR), n = Math.round(dur * SR); let ph = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = 196 * Math.pow(2, (7 / 12) * Math.min(1, u * 1.25)) * (1 + 0.006 * Math.sin(TAU * 5 * i / SR) + (u > 0.78 ? 0.012 * Math.sin(TAU * 11 * i / SR) : 0)); ph += TAU * f / SR;
    const e = Math.min(1, u * 4) * (1 - Math.max(0, (u - 0.9) / 0.1)); put(i0 + i, 0.08 * e * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)), 0, 0.4); }
};
S.exhale = ({ t }) => S.breath({ t, dur: 1.1, out: true });
// light: a chord that blooms
S.swell = ({ t, dur }) => S.pad({ chords: [[t, t + dur + 2.5, [261.63, 329.63, 392, 523.25, 659.25]]], amp: 0.07 });
// the firefly: little bells, a zip when it darts, a clap, and a hum that follows it round
S.twinkle = ({ t, notes }) => notes.forEach((f, k) => S.chime({ t: t + k * 0.09, f, amp: 0.05, pan: -0.3 }));
S.zip = ({ t }) => { const i0 = Math.round(t * SR); let ph = 0; for (let i = 0; i < 0.16 * SR; i++) { const u = i / (0.16 * SR), f = 900 * Math.pow(4, u); ph += TAU * f / SR; put(i0 + i, 0.05 * Math.sin(ph) * Math.sin(Math.PI * u), 0.2, 0.3); } };
S.clap = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); for (let i = 0; i < 0.12 * SR; i++) { const x = i / SR; put(i0 + i, 0.35 * f(noise(), 1300, 0.9).bp * Math.exp(-x / 0.018), 0.1, 0.35); } };
S.buzz = ({ track }) => {
  let ph = 0, ph2 = 0;
  for (let i = 0; i < N; i++) { const x = i / SR, k = Math.min(track.length - 2, Math.floor(x * 50)), u = x * 50 - k, q = track[k].map((v, c) => v + (track[k + 1][c] - v) * u);
    if (q[1] <= 0.001) continue; const f = 1750 + 500 * q[2]; ph += TAU * f / SR; ph2 += TAU * (f * 1.5) / SR;
    put(i, q[1] * (0.012 + 0.01 * q[2]) * (Math.sin(ph) + 0.4 * Math.sin(ph2)) * (0.6 + 0.4 * Math.sin(TAU * 13 * x)), q[0], 0.45); }
};
// the circus: a crowd, a fanfare, a drumroll, a fuse, the boom, a slide whistle, a splat, gasps, a cymbal, applause
S.crowd = ({ dur }) => { const f = svf(), g = svf(); let m = 0; for (let i = 0; i < Math.min(N, dur * SR); i++) { if (i % 2400 === 0) m = 0.6 + 0.4 * rnd(); const x = i / SR; put(i, 0.05 * (0.7 + 0.3 * Math.sin(TAU * 0.13 * x)) * m * (f(noise(), 420, 1.4).bp + 0.6 * g(noise(), 900, 2).bp), 0, 0.5); } };
S.fanfare = ({ t, notes }) => {
  notes.forEach((f, k) => { const t0 = t + k * 0.11, i0 = Math.round(t0 * SR), n = Math.round((1.6 - k * 0.11) * SR), lp = svf(); let ph = 0;
    for (let i = 0; i < n; i++) { const x = i / SR, e = Math.min(1, x / 0.03) * Math.exp(-x / 1.4) * Math.min(1, (n - i) / (0.2 * SR)); ph += f * (1 + 0.004 * Math.sin(TAU * 5.5 * x)) / SR; const saw = 2 * (ph % 1) - 1;
      put(i0 + i, 0.07 * e * lp(saw, 900 + 2200 * Math.exp(-x / 0.25), 0.9).lo, (k - notes.length / 2) * 0.15, 0.4); } });
};
S.applause = ({ t, dur, amp = 1 }) => { const f = svf(); for (let c = 0; c < dur * 70; c++) { const tc = t + rnd() * dur, u = (tc - t) / dur, e = Math.min(1, u * 6) * Math.min(1, (1 - u) * 2.5), i0 = Math.round(tc * SR), fc = 900 + rnd() * 2200, pan = rnd() * 1.6 - 0.8; for (let i = 0; i < 0.025 * SR; i++) put(i0 + i, amp * e * 0.11 * f(noise(), fc, 1.2).bp * Math.exp(-i / SR / 0.006), pan, 0.35); } };
S.ooh = ({ t }) => { const i0 = Math.round(t * SR), n = Math.round(1.1 * SR), f1 = svf(), f2 = svf(); for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * u) ** 1.5, src = noise(); put(i0 + i, 0.18 * e * (f1(src, 380 + 80 * Math.sin(Math.PI * u), 6).bp + 0.5 * f2(src, 780, 7).bp), 0, 0.4); } };
S.gasp = ({ t }) => { const i0 = Math.round(t * SR), n = Math.round(0.45 * SR), f = svf(); for (let i = 0; i < n; i++) { const u = i / n, e = Math.min(1, u * 8) * (1 - u); put(i0 + i, 0.16 * e * f(noise(), 1200 + 900 * u, 1.5).bp, 0, 0.4); } };
S.drumroll = ({ t, dur }) => { const f = svf(); for (let k = 0; k < dur * 24; k++) { const tk = t + k / 24, u = k / (dur * 24), i0 = Math.round(tk * SR), amp = 0.06 + 0.16 * u * u; for (let i = 0; i < 0.04 * SR; i++) put(i0 + i, amp * (f(noise(), 2600, 0.7).bp + 0.3 * noise()) * Math.exp(-i / SR / 0.012), 0.15, 0.3); } };
S.fuse = ({ t, dur }) => { const i0 = Math.round(t * SR), n = Math.round(dur * SR), f = svf(); for (let i = 0; i < n; i++) { const u = i / n, crack = rnd() < 0.002 ? 1 : 0; put(i0 + i, 0.05 * Math.min(1, u * 10) * f(noise(), 5000, 0.8).hi + 0.15 * crack * noise(), -0.5, 0.2); } };
S.boom = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); let ph = 0; for (let i = 0; i < 1.6 * SR; i++) { const x = i / SR; ph += TAU * (58 * Math.pow(0.5, x / 0.4)) / SR; const v = Math.tanh(1.8 * (0.9 * Math.sin(ph) * Math.exp(-x / 0.45) + 0.7 * f(noise(), 300, 0.7).lo * Math.exp(-x / 0.25))); put(i0 + i, 0.8 * v, -0.4, 0.5); } };
S.whistle = ({ t, dur }) => { const i0 = Math.round(t * SR), n = Math.round(dur * SR); let ph = 0; for (let i = 0; i < n; i++) { const u = i / n, f = 700 + 900 * Math.sin(Math.PI * Math.min(1, u * 1.05)); ph += TAU * f / SR; put(i0 + i, 0.06 * Math.min(1, u * 8) * Math.min(1, (1 - u) * 8) * Math.sin(ph), -0.6 + 1.2 * u, 0.4); } };
S.splat = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); let ph = 0; for (let i = 0; i < 0.5 * SR; i++) { const x = i / SR; ph += TAU * (90 * Math.pow(0.6, x / 0.2)) / SR; put(i0 + i, 0.5 * Math.sin(ph) * Math.exp(-x / 0.12) + 0.45 * f(noise(), 650, 1.1).bp * Math.exp(-x / 0.07), 0.3, 0.3); } };
S.cymbal = ({ t }) => { const i0 = Math.round(t * SR), f = svf(), P = [3120, 4410, 5230, 6870, 8020, 9530]; for (let i = 0; i < 3.2 * SR; i++) { const x = i / SR, e = Math.exp(-x / 0.9); let m = 0; for (const p of P) m += Math.sin(TAU * p * x + p); put(i0 + i, 0.16 * e * (f(noise(), 7000, 0.6).hi + 0.12 * m) * Math.min(1, x * 500), 0.1, 0.5); } };
// the storm: a whistled tune, plinks of single drops, rain that thickens, thunder, a crack, a shaken foot
S.tune = ({ t, notes, until }) => { for (let k = 0; k < notes.length; k++) { const [dt, f] = notes[k], t0 = t + dt, t1 = Math.min(until, t + (notes[k + 1] ? notes[k + 1][0] : dt + 0.5)); if (t0 >= until) break; const i0 = Math.round(t0 * SR), n = Math.round((t1 - t0) * SR); let ph = 0; for (let i = 0; i < n; i++) { const x = i / SR, e = Math.min(1, x / 0.03) * Math.min(1, (n - i) / (0.04 * SR)); ph += TAU * f * (1 + 0.012 * Math.sin(TAU * 6 * x)) / SR; put(i0 + i, 0.07 * e * (Math.sin(ph) + 0.08 * noise()), -0.2, 0.3); } } };
S.plink = ({ t, big }) => { const i0 = Math.round(t * SR), f0 = big ? 1900 : 2400 + 600 * rnd(); let ph = 0; for (let i = 0; i < (big ? 0.6 : 0.15) * SR; i++) { const x = i / SR; ph += TAU * f0 * (1 + 0.6 * Math.exp(-x / 0.01)) / SR; put(i0 + i, (big ? 0.2 : 0.06) * Math.sin(ph) * Math.exp(-x / (big ? 0.18 : 0.04)), 0.1, big ? 0.6 : 0.3); } };
S.rain = ({ t, track }) => { const f = svf(), g = svf(); for (let i = Math.round(t * SR); i < N; i++) { const x = i / SR, k = Math.min(track.length - 2, Math.floor(x * 20)), u = x * 20 - k, r = track[k] + (track[k + 1] - track[k]) * u; if (r <= 0.001) continue; put(i, r * (0.07 * f(noise(), 2500, 0.5).bp + 0.05 * g(noise(), 600, 0.7).lo + (rnd() < 0.004 * r ? 0.25 * noise() : 0)), (rnd() - 0.5) * 0.6, 0.4); } };
S.thunder = ({ t, amp = 1 }) => { const i0 = Math.round(t * SR), f = svf(); for (let i = 0; i < 3.5 * SR; i++) { const x = i / SR, e = Math.min(1, x / 0.15) * Math.exp(-x / 1.1) * (0.7 + 0.3 * Math.sin(TAU * 2.3 * x)); put(i0 + i, amp * 0.45 * e * f(noise(), 110, 0.6).lo, 0, 0.5); } };
S.crack = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); for (let i = 0; i < 0.6 * SR; i++) { const x = i / SR; put(i0 + i, 0.5 * Math.exp(-x / 0.08) * (f(noise(), 3000, 0.4).bp + 0.5 * noise()), 0.2, 0.6); } };
S.flick = ({ t }) => { for (let k = 0; k < 4; k++) S.plink({ t: t + 0.08 + k * 0.11 }); S.swish({ t }); };
// keeper: a clock's ticks (the eleventh louder and lower), the air of the fall following its speed, the loop forming
S.tick = ({ t, amp = 0.2, last }) => { const i0 = Math.round(t * SR), f = svf(); for (let i = 0; i < 0.18 * SR; i++) { const x = i / SR; put(i0 + i, amp * (0.8 * f(noise(), last ? 1400 : 2600, 6).bp * Math.exp(-x / 0.012) + 0.5 * Math.sin(TAU * (last ? 520 : 880) * x) * Math.exp(-x / (last ? 0.12 : 0.03))), -0.2, last ? 0.6 : 0.25); } };
S.fallwind = ({ t, dur, track }) => { const f = svf(), g = svf(); for (let i = Math.round(t * SR); i < Math.min(N, Math.round((t + dur) * SR)); i++) { const x = i / SR, k = Math.min(track.length - 2, Math.floor(x * 20)), u = x * 20 - k, s = track[k] + (track[k + 1] - track[k]) * u; if (s < 0.005) continue; put(i, s * (0.16 * f(noise(), 300 + 900 * s, 0.6).bp + 0.1 * g(noise(), 120, 0.7).lo) * (0.85 + 0.15 * Math.sin(TAU * 0.9 * x)), 0, 0.35); } };
S.fwoom = ({ t }) => { const i0 = Math.round(t * SR), f = svf(); let ph = 0; for (let i = 0; i < 1.6 * SR; i++) { const x = i / SR, e = Math.min(1, x / 0.25) * Math.exp(-x / 0.6); ph += TAU * (45 + 30 * Math.exp(-x / 0.3)) / SR; put(i0 + i, e * (0.35 * Math.sin(ph) + 0.2 * f(noise(), 500 + 1500 * Math.exp(-x / 0.4), 0.8).bp), 0.2, 0.5); } };
// the noise of everything: a bed of hiss, and a crowd of tiny blips at random pitches, all following one level
S.chatter = ({ t, dur, track }) => {
  const lvl = (x) => { const k = Math.min(track.length - 2, Math.floor(x * 20)), u = x * 20 - k; return track[k] + (track[k + 1] - track[k]) * u; };
  const f = svf(); for (let i = Math.round(t * SR); i < Math.min(N, Math.round((t + dur) * SR)); i++) { const x = i / SR, l = lvl(x); if (l < 0.003) continue; put(i, 0.05 * l * f(noise(), 3200, 0.5).bp, 0, 0.2); }
  for (let c = t; c < t + dur; c += 0.012 + 0.03 * rnd()) { const l = lvl(c); if (l < 0.02 || rnd() > l) continue; const fr = 300 * Math.pow(2, rnd() * 4.5), len = 0.02 + 0.06 * rnd(), i0 = Math.round(c * SR), pan = rnd() * 1.6 - 0.8; let ph = 0; for (let i = 0; i < len * SR; i++) { ph += TAU * fr / SR; put(i0 + i, 0.035 * l * Math.sin(ph) * Math.sin(Math.PI * i / (len * SR)), pan, 0.25); } }
};
// the fall: wind tearing at something that shakes, rough and pulsing, following a level
S.buffet = ({ track }) => { const f = svf(), g = svf(); for (let i = 0; i < N; i++) { const x = i / SR, k = Math.min(track.length - 2, Math.floor(x * 20)), u = x * 20 - k, l = track[k] + (track[k + 1] - track[k]) * u; if (l < 0.004) continue; const am = 0.55 + 0.45 * Math.sin(TAU * 7.5 * x + 2 * Math.sin(TAU * 1.3 * x)); put(i, l * am * (0.22 * f(noise(), 140 + 80 * l, 1.2).lo + 0.05 * g(noise(), 900, 0.7).bp), 0, 0.12); } };
// burning: a hiss and a scatter of crackles, following a level
S.crackle = ({ track }) => { const f = svf(); for (let i = 0; i < N; i++) { const x = i / SR, k = Math.min(track.length - 2, Math.floor(x * 20)), u = x * 20 - k, l = track[k] + (track[k + 1] - track[k]) * u; if (l < 0.004) continue; put(i, 0.035 * l * f(noise(), 2400, 0.6).bp, 0.15, 0.2); if (rnd() < 0.0009 * l) { const n = Math.round((0.002 + 0.006 * rnd()) * SR), a = (0.15 + 0.25 * rnd()) * l, pan = rnd() * 1.2 - 0.6; for (let q = 0; q < n; q++) put(i + q, a * noise() * Math.exp(-q / (n * 0.3)), pan, 0.25); } } };
// film 1's pad, from its cue: A minor until he lands, F, then C as the worlds appear
S.gappad = ({ dur, land, bloom, end }) => S.pad({ t: 0, dur, chords: [[0, land + 0.6, [110, 130.81, 164.81, 220]], [land - 0.4, bloom + 0.6, [87.31, 130.81, 174.61, 220]], [bloom - 0.4, Math.min(dur, end + 2.2), [65.41, 130.81, 164.81, 196, 261.63]]] });

for (const e of F.events()) { const fn = e.type === 'pad' && film === 'gap' ? S.gappad : S[e.type]; if (!fn) throw new Error('no sound for ' + e.type); fn(e); }

// reverb: a small Freeverb (eight combs, four all-passes per side)
function reverb(x, spread) {
  const out = new Float32Array(N), combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ b: new Float32Array(d + spread), i: 0, s: 0 })), aps = [556, 441, 341, 225].map((d) => ({ b: new Float32Array(d + spread), i: 0 }));
  const fb = 0.86, damp = 0.25;
  for (let n = 0; n < N; n++) {
    let y = 0; const xin = x[n] * 0.015;
    for (const c of combs) { const o = c.b[c.i]; c.s = o * (1 - damp) + c.s * damp; c.b[c.i] = xin + c.s * fb; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of aps) { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = o - y; }
    out[n] = y;
  }
  return out;
}
const rv = [reverb(wet[0], 0), reverb(wet[1], 23)];
const mix = [new Float32Array(N), new Float32Array(N)];
let peak = 0;
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) { const v = dry[c][i] + rv[c][i] * 3.2; mix[c][i] = v; peak = Math.max(peak, Math.abs(v)); }
const gain = 0.89 / Math.max(peak, 0.2);
// fade the last half second, soft-clip, 16-bit
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) { const tail = Math.min(1, (N - i) / (0.5 * SR)), v = Math.tanh(mix[c][i] * gain * 1.1) * tail; buf.writeInt16LE(Math.round(v * 32000), 44 + i * 4 + c * 2); }
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', `${film}.wav`), buf);
console.log(`${film}.wav ${(N / SR).toFixed(1)}s peak ${peak.toFixed(2)}`);
