/* human-in-loop.dev — line engine.
   One WebGL2 canvas paints every section's line field behind the content.
   Small Canvas2D drawings add the emblems and data figures.
   Content never depends on this file: without it the page is plain, readable HTML. */
(() => {
  'use strict';

  const root = document.documentElement;
  const isDark = () => root.getAttribute('data-theme') === 'dark';
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceMQ.matches;
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', (e) => { reduce = e.matches; });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- theme switch ---------- */
  const toggle = document.querySelector('.theme-toggle');
  const syncToggle = () => { if (toggle) toggle.setAttribute('aria-pressed', String(isDark())); };
  if (toggle) toggle.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('hil-theme', next); } catch (e) { /* storage blocked */ }
    syncToggle();
    requestAnimationFrame(() => arts.forEach((a) => { a.dirty = true; }));
  });
  syncToggle();

  /* ---------- pointer ---------- */
  const P = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0 };
  addEventListener('pointermove', (e) => {
    P.tx = e.clientX; P.ty = e.clientY;
    if (P.x < -9000) { P.x = P.tx; P.y = P.ty; }
    P.tamt = 1;
  }, { passive: true });
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) P.tamt = 0; });

  /* ---------- small helpers for the drawings ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function iso(ctx, w, h, f, lo, hi, step, cell) {
    const nx = Math.ceil(w / cell) + 1, ny = Math.ceil(h / cell) + 1;
    const g = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = f(i * cell, j * cell);
    ctx.beginPath();
    const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
    for (let L = lo; L <= hi; L += step) {
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i + 1], d = g[(j + 1) * nx + i];
        if (a !== a || b !== b || c !== c || d !== d) continue;
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell;
        const top = [x + cell * (L - a) / (b - a), y];
        const right = [x + cell, y + cell * (L - b) / (c - b)];
        const bottom = [x + cell * (L - d) / (c - d), y + cell];
        const left = [x, y + cell * (L - a) / (d - a)];
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 6: case 9: seg(top, bottom); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(top, right); seg(left, bottom); break;
        }
      }
    }
    ctx.stroke();
  }
  // the same stylised face the About section draws, in JS for the avatar emblem
  function faceH(x, y, turn) {
    const fx = x - turn * 0.11, fy = y;
    const head = 1 - (x / 0.78) ** 2 - ((y + 0.05) / 1.08) ** 2;
    let h = head > 0 ? Math.sqrt(head) : head * 0.6;
    if (y > 0.7) h = Math.max(h, (1 - (x / 0.36) ** 2) * 0.55 - (y - 0.7) * 0.2);
    const g = (u, v) => Math.exp(-(u * u + v * v));
    h += 0.16 * Math.exp(-(((fy + 0.36) / 0.07) ** 2)) * Math.exp(-((fx / 0.45) ** 2));
    h -= 0.26 * g((fx - 0.27) / 0.14, (fy + 0.2) / 0.085) + 0.26 * g((fx + 0.27) / 0.14, (fy + 0.2) / 0.085);
    const nose = Math.exp(-(((fx - turn * 0.07) / 0.075) ** 2)) * sstep(-0.32, 0.15, fy) * sstep(0.34, 0.18, fy);
    h += 0.34 * nose + 0.12 * g((fx - turn * 0.07) / 0.12, (fy - 0.2) / 0.07);
    h += 0.1 * g((Math.abs(fx) - 0.36) / 0.17, (fy - 0.12) / 0.2);
    h -= 0.07 * g(fx / 0.24, (fy - 0.46) / 0.035);
    h += 0.06 * g(fx / 0.2, (fy - 0.52) / 0.05) + 0.1 * g(fx / 0.2, (fy - 0.78) / 0.1);
    return h;
  }
  function sstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- the drawings (Canvas2D) ---------- */
  const DRAW = {
    tenants(c, w, h, t) { // AnyAssist: tenants in their own boundaries, one shared gateway line
      const n = 4, gap = w * 0.035, bw = (w - gap * (n + 1)) / n, bh = h * 0.62, y0 = h * 0.06, gy = h * 0.9;
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(gap * 0.4, gy); c.lineTo(w - gap * 0.4, gy); c.stroke();
      for (let i = 0; i < n; i++) {
        const x0 = gap + i * (bw + gap), cx = x0 + bw / 2, cy = y0 + bh / 2;
        c.lineWidth = 1.4; c.beginPath(); c.roundRect(x0, y0, bw, bh, Math.min(18, bw * 0.2)); c.stroke();
        c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx, y0 + bh); c.lineTo(cx, gy); c.stroke();
        c.beginPath(); c.arc(cx, gy, 2.6, 0, Math.PI * 2); c.fill();
        const sp = 3.6 + i * 1.7, breathe = reduce ? 0 : Math.sin(t * 0.6 + i) * 0.8;
        c.lineWidth = 0.8; c.beginPath();
        for (let r = sp + breathe; r < Math.min(bw, bh) / 2 - 5; r += sp) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, Math.PI * 2); }
        c.stroke();
      }
    },
    enclosure(c, w, h) { // Privacy RAG: flow passes around a closed boundary; one query touches it and returns
      const cx = w * 0.4, cy = h * 0.5, R = h * 0.3;
      c.lineWidth = 0.8;
      iso(c, w, h, (x, y) => { const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy; return r2 < (R + 3) * (R + 3) ? NaN : dy * (1 - (R * R) / r2); }, -h * 0.6, h * 0.6, 6.5, 3);
      c.lineWidth = 3.2; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 0.9; c.beginPath();
      for (let k = 1; k < 9; k++) { const r = R - 4 - k * (R - 8) / 9; c.moveTo(cx + r + k * 0.8, cy); c.arc(cx + k * 0.8, cy, r, 0, Math.PI * 2); }
      c.stroke();
      c.lineWidth = 1.3; c.beginPath(); c.moveTo(w, cy - 7); c.lineTo(cx + R + 12, cy - 7); c.arc(cx + R + 12, cy, 7, -Math.PI / 2, Math.PI / 2, true); c.lineTo(w, cy + 7); c.stroke();
    },
    converge(c, w, h) { // WhatsApp dispatch: many groups into one channel, then three agents
      const N = 15; c.lineWidth = 0.95; c.beginPath();
      for (let i = 0; i < N; i++) {
        const ys = h * (0.05 + 0.9 * i / (N - 1)), yc = h * 0.5 + (i - (N - 1) / 2) * 2.1;
        const g = Math.floor(i / 5), ye = h * (0.2 + 0.3 * g) + ((i % 5) - 2) * 4.2;
        c.moveTo(0, ys); c.bezierCurveTo(w * 0.24, ys, w * 0.3, yc, w * 0.47, yc); c.lineTo(w * 0.56, yc);
        c.bezierCurveTo(w * 0.7, yc, w * 0.72, ye, w * 0.93, ye);
      }
      c.stroke();
      c.lineWidth = 0.9; c.beginPath();
      for (let r = 3; r < 16; r += 3.2) { c.moveTo(w * 0.87 + r, h * 0.9); c.arc(w * 0.87, h * 0.9, r, 0, Math.PI * 2); }
      c.stroke();
    },
    ridgeline(c, w, h, t, ctx) { // VOAG: voice waveforms stacked, each hiding the ones behind it
      const L = Math.round(clamp(h / 15, 16, 34)), top = h * 0.2, sp = (h * 0.76) / L, amp = h * 0.24;
      const R = rng(11);
      const seeds = Array.from({ length: L }, () => [R() * 100, R() * 100, R() * 100]);
      const px = ctx.pointer;
      const tt = reduce ? 0 : t;
      for (let k = 0; k < L; k++) {
        const base = top + k * sp, s = seeds[k], pts = [];
        for (let x = 0; x <= w; x += 2) {
          const u = x / w, env = Math.exp(-(((u - 0.5) / 0.2) ** 2));
          let v = 0.55 + 0.25 * Math.sin(x * 0.045 + s[0] + tt * 1.6) + 0.2 * Math.sin(x * 0.11 + s[1] - tt * 2.3) + 0.12 * Math.sin(x * 0.27 + s[2] + tt * 3.1);
          v = Math.max(0, v) ** 2.2;
          let lift = 0;
          if (px && px.inside) lift = 0.9 * Math.exp(-(((x - px.x) / 34) ** 2)) * Math.exp(-(((base - px.y) / 60) ** 2));
          pts.push(x, base - amp * env * v - amp * lift - 1.5 * Math.sin(x * 0.6 + k));
        }
        c.beginPath(); c.moveTo(0, h); for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.lineTo(w, h); c.closePath();
        c.fillStyle = ctx.ground; c.fill();
        c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
        c.lineWidth = 1.1; c.stroke();
      }
    },
    face(c, w, h) { // Hireups: a face in contour lines, eyes left empty
      const s = Math.min(h * 0.46, w * 0.36), cx = w / 2, cy = h * 0.52;
      c.lineWidth = 0.85;
      iso(c, w, h, (x, y) => {
        const u = (x - cx) / s, v = (y - cy) / s;
        const e = Math.min(((u - 0.27) / 0.105) ** 2 + ((v + 0.2) / 0.05) ** 2, ((u + 0.27) / 0.105) ** 2 + ((v + 0.2) / 0.05) ** 2);
        if (e < 1) return NaN;
        const f = faceH(u, v, 0.15);
        return f < -0.02 ? NaN : f;
      }, 0.0, 1.4, 0.05, 2.5);
    },
    frames(c, w, h, t) { // MAGe: one line carried through every frame, agents along it, a brand rosette
      const rx = w * 0.1, ry = h * 0.5, R0 = Math.min(h * 0.34, w * 0.09);
      c.lineWidth = 0.7; c.beginPath();
      for (let k = 0; k < 16; k++) {
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) {
          const r = R0 * (0.62 + 0.3 * Math.sin(7 * a + k * 0.39));
          const x = rx + r * Math.cos(a), y = ry + r * Math.sin(a);
          if (a === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
      }
      c.stroke();
      const n = 5, fx0 = w * 0.24, fw = (w * 0.98 - fx0) / n, fh = h * 0.6, fy = (h - fh) / 2;
      c.lineWidth = 1.3;
      for (let i = 0; i < n; i++) { c.beginPath(); c.roundRect(fx0 + i * fw + 4, fy, fw - 8, fh, 8); c.stroke(); }
      c.lineWidth = 0.6;
      for (let i = 0; i < n; i++) {
        c.beginPath();
        const x0 = fx0 + i * fw + 10, x1 = fx0 + (i + 1) * fw - 10;
        for (let y = fy + 8 + i * 1.5; y < fy + fh - 6; y += 5 + i) { c.moveTo(x0, y); c.lineTo(x1, y); }
        c.globalAlpha = 0.45; c.stroke(); c.globalAlpha = 1;
      }
      const yl = (x) => h / 2 + Math.sin(x / 26 + (reduce ? 0 : t * 0.8)) * h * 0.13 + Math.sin(x / 9) * 2;
      c.lineWidth = 2; c.beginPath(); c.moveTo(rx + R0 * 0.9, yl(rx + R0 * 0.9));
      for (let x = rx + R0 * 0.9; x <= w; x += 2) c.lineTo(x, yl(x));
      c.stroke();
      for (let i = 0; i <= n; i++) { const x = fx0 + i * fw; c.beginPath(); c.arc(x, yl(x), 4, 0, Math.PI * 2); c.fill(); }
    },
    eye(c, w, h, t, ctx) { // UniBias: an eye that watches the pointer
      const cx = w / 2, cy = h / 2, ew = Math.min(w * 0.44, h * 0.95), eh = ew * 0.42;
      const st = ctx.state || (ctx.state = { ox: 0, oy: 0 });
      let tx = 0, ty = 0;
      if (ctx.pointer && P.amt > 0.05) { tx = clamp((ctx.pointer.x - cx) / w, -0.5, 0.5) * ew * 0.62; ty = clamp((ctx.pointer.y - cy) / h, -0.5, 0.5) * eh * 0.7; }
      st.ox = lerp(st.ox, tx, 0.12); st.oy = lerp(st.oy, ty, 0.12);
      const blink = reduce ? 1 : Math.max(0.08, Math.min(1, Math.abs(Math.sin(t * 0.52)) * 6));
      c.save();
      c.beginPath(); c.moveTo(cx - ew, cy); c.quadraticCurveTo(cx, cy - eh * 2 * blink, cx + ew, cy); c.quadraticCurveTo(cx, cy + eh * 2 * blink, cx - ew, cy); c.closePath();
      c.lineWidth = 1.6; c.stroke(); c.clip();
      const ir = eh * 1.05, ix = cx + st.ox, iy = cy + st.oy;
      c.lineWidth = 0.8; c.beginPath();
      for (let r = 4; r < ir; r += 3.2) { c.moveTo(ix + r, iy); c.arc(ix, iy, r, 0, Math.PI * 2); }
      c.stroke();
      c.beginPath(); c.arc(ix, iy, ir * 0.36, 0, Math.PI * 2); c.fill();
      c.lineWidth = 0.6; c.beginPath();
      for (let x = cx - ew; x < cx + ew; x += 5) { c.moveTo(x, cy - eh * 2); c.lineTo(x + 8, cy + eh * 2); }
      c.globalAlpha = 0.18; c.stroke(); c.globalAlpha = 1;
      c.restore();
      c.lineWidth = 0.7; c.beginPath();
      for (let k = 1; k < 5; k++) { c.moveTo(cx - ew - k * 7, cy); c.quadraticCurveTo(cx, cy - eh * 2 * blink - k * 9, cx + ew + k * 7, cy); }
      c.stroke();
    },
    forecast(c, w, h) { // Blood bank: forecast against actual demand, and 200-unit rows before and after
      const R = rng(7), N = 60, y0 = h * 0.08, ch = h * 0.46;
      const act = [], fc = [];
      for (let i = 0; i < N; i++) { const s = Math.sin(i / 4.2) * 0.35 + Math.sin(i / 11) * 0.25; fc.push(s); act.push(s + (R() - 0.5) * 0.35); }
      const X = (i) => (i / (N - 1)) * w, Y = (v) => y0 + ch * (0.5 - v * 0.7);
      c.lineWidth = 0.6; c.beginPath();
      for (let x = 0; x <= w; x += 3) { const i = (x / w) * (N - 1), i0 = Math.floor(i), f = i - i0, i1 = Math.min(N - 1, i0 + 1); const a = lerp(act[i0], act[i1], f), b = lerp(fc[i0], fc[i1], f); c.moveTo(x, Y(a)); c.lineTo(x, Y(b)); }
      c.globalAlpha = 0.55; c.stroke(); c.globalAlpha = 1;
      c.lineWidth = 1.8; c.beginPath(); fc.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)))); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); act.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)))); c.stroke();
      const rows = [[22, h * 0.72], [5, h * 0.9]];
      rows.forEach(([broken, ry], ri) => {
        const n = 200, sp = w / n, set = new Set(); const r2 = rng(40 + ri);
        while (set.size < broken) set.add(Math.floor(r2() * n));
        c.lineWidth = Math.max(0.6, sp * 0.45); c.beginPath();
        for (let i = 0; i < n; i++) { const x = i * sp + sp / 2; if (set.has(i)) { c.moveTo(x, ry - 9); c.lineTo(x, ry - 4); c.moveTo(x + 1, ry + 1); c.lineTo(x + 1, ry + 7); } else { c.moveTo(x, ry - 9); c.lineTo(x, ry + 7); } }
        c.stroke();
      });
    },
    anomaly(c, w, h) { // Fraud detection: rare breaks in steady lines; 24 of 25 are caught
      const L = 26, R = rng(3), sp = h / (L + 1), spikes = [];
      for (let k = 0; k < 25; k++) spikes.push([Math.floor(R() * L), 0.06 + R() * 0.88]);
      c.lineWidth = 0.8;
      for (let k = 0; k < L; k++) {
        const y = sp * (k + 1); c.beginPath(); c.moveTo(0, y);
        const mine = spikes.filter((s) => s[0] === k);
        for (let x = 0; x <= w; x += 2) {
          let dy = 0; for (const s of mine) dy -= 11 * Math.exp(-(((x - s[1] * w) / 4) ** 2));
          c.lineTo(x, y + dy);
        }
        c.stroke();
      }
      c.lineWidth = 1.2;
      spikes.forEach((s, i) => { if (i === 24) return; c.beginPath(); c.arc(s[1] * w, sp * (s[0] + 1) - 6, 8, 0, Math.PI * 2); c.stroke(); });
    },
    wastage(c, w, h) { // 1,000 units twice: 112 broken before, 25 after
      const blocks = [112, 25], gap = 18, bw = (w - gap) / 2, cols = 40, rows = 25;
      blocks.forEach((broken, b) => {
        const R = rng(100 + b), set = new Set(); while (set.size < broken) set.add(Math.floor(R() * 1000));
        const x0 = b * (bw + gap), sx = bw / cols, sy = h / rows;
        c.lineWidth = Math.max(0.6, sx * 0.34); c.beginPath();
        for (let i = 0; i < 1000; i++) {
          const x = x0 + (i % cols) * sx + sx / 2, y = Math.floor(i / cols) * sy + 1, hh = sy - 2;
          if (set.has(i)) { c.moveTo(x - 1, y); c.lineTo(x - 1, y + hh * 0.35); c.moveTo(x + 1, y + hh * 0.6); c.lineTo(x + 1, y + hh); }
          else { c.moveTo(x, y); c.lineTo(x, y + hh); }
        }
        c.stroke();
      });
    },
    fulfilment(c, w, h) { // 1,000 demands, 9 unmet
      const R = rng(9), set = new Set(); while (set.size < 9) set.add(Math.floor(R() * 1000));
      const cols = 100, rows = 10, sx = w / cols, sy = h / rows;
      c.lineWidth = Math.max(0.5, sx * 0.4); c.beginPath();
      for (let i = 0; i < 1000; i++) { if (set.has(i)) continue; const x = (i % cols) * sx + sx / 2, y = Math.floor(i / cols) * sy + 2; c.moveTo(x, y); c.lineTo(x, y + sy - 4); }
      c.stroke();
      c.lineWidth = 1.2;
      set.forEach((i) => { const x = (i % cols) * sx + sx / 2, y = Math.floor(i / cols) * sy + sy / 2; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.stroke(); });
    },
    mae(c, w, h) { // forecast hugging the actual series; the gap hatched
      const R = rng(21), N = 48, act = [], fc = [];
      for (let i = 0; i < N; i++) { const s = Math.sin(i / 3.3) * 0.32 + Math.sin(i / 9) * 0.22; fc.push(s); act.push(s + (R() - 0.5) * 0.28); }
      const X = (i) => (i / (N - 1)) * w, Y = (v) => h * (0.5 - v * 0.75);
      c.lineWidth = 0.6; c.beginPath();
      for (let x = 0; x <= w; x += 2.5) { const i = (x / w) * (N - 1), i0 = Math.floor(i), f = i - i0, i1 = Math.min(N - 1, i0 + 1); c.moveTo(x, Y(lerp(act[i0], act[i1], f))); c.lineTo(x, Y(lerp(fc[i0], fc[i1], f))); }
      c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1;
      c.lineWidth = 2; c.beginPath(); fc.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)))); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); act.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)))); c.stroke();
    },
    runs(c, w, h) { // 30 simulation runs, overlapping into one bundle
      c.lineWidth = 0.7; c.globalAlpha = 0.42;
      for (let k = 0; k < 30; k++) {
        const R = rng(300 + k); c.beginPath();
        for (let x = 0; x <= w; x += 3) { const u = x / w; const y = h * (0.18 + 0.64 * (1 - Math.exp(-u * 3.2))) + (R() - 0.5) * 5 + Math.sin(u * 9 + k) * 2; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke();
      }
      c.globalAlpha = 1;
    },
    voice(c, w, h) { c.lineWidth = 0.9; c.beginPath(); for (let r = 5; r < w * 1.2; r += 6) { c.moveTo(-6 + r, h / 2); c.arc(-6, h / 2, r, 0, Math.PI * 2); } c.stroke(); },
    lanes(c, w, h) { c.lineWidth = 1; c.beginPath(); [0.16, 0.5, 0.84].forEach((m) => { for (let i = -1; i <= 1; i++) { const y = h * m + i * 4; c.moveTo(0, y); c.lineTo(w, y); } }); c.stroke(); },
    spans(c, w, h) {
      const R = rng(5); c.lineWidth = 3; c.beginPath(); let x = 0; const words = [];
      while (x < w) { const L = 12 + R() * 36; words.push([x, L]); c.moveTo(x, h * 0.38); c.lineTo(Math.min(w, x + L), h * 0.38); x += L + 8; }
      c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1;
      const pick = words[Math.min(words.length - 1, 3)];
      c.lineWidth = 1.3; c.beginPath(); c.moveTo(pick[0] - 2, h * 0.62);
      for (let i = 0; i <= 20; i++) c.lineTo(pick[0] - 2 + (pick[1] + 4) * i / 20, h * 0.62 + Math.sin(i * 1.7) * 1.8);
      c.stroke();
      c.lineWidth = 1; c.beginPath(); c.moveTo(pick[0] - 2, h * 0.5); c.lineTo(pick[0] - 2, h * 0.74); c.moveTo(pick[0] + pick[1] + 2, h * 0.5); c.lineTo(pick[0] + pick[1] + 2, h * 0.74); c.stroke();
    },
    framesw(c, w, h) {
      const n = 4, fw = w / n; c.lineWidth = 1.1;
      for (let i = 0; i < n; i++) { c.beginPath(); c.roundRect(i * fw + 3, h * 0.14, fw - 6, h * 0.72, 6); c.stroke(); }
      c.lineWidth = 1.8; c.beginPath(); for (let x = 0; x <= w; x += 2) { const y = h / 2 + Math.sin(x / 18) * h * 0.18; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    },
    rules(c, w, h) { const ws = [0.5, 1, 2.4, 0.5, 1.4, 3.4, 0.6, 1, 0.5, 2]; let y = 4; ws.forEach((lw) => { c.lineWidth = lw; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); y += lw + 4.2; }); },
    contours(c, w, h) { c.lineWidth = 0.8; iso(c, w, h, (x, y) => Math.sin(x / 23) * Math.cos(y / 17) + Math.sin((x + y) / 41) * 0.8 + Math.cos(x / 61 - y / 29) * 0.5, -2, 2, 0.28, 2.5); }
  };
  const ALIAS = { frames: 'frames', voice: 'voice', lanes: 'lanes', spans: 'spans', rules: 'rules', contours: 'contours' };
  const ANIMATED = new Set(['ridgeline', 'eye', 'tenants', 'frames']);

  const arts = [...document.querySelectorAll('canvas[data-emblem], canvas[data-figure], canvas[data-swatch]')].map((cv) => {
    let kind = cv.dataset.emblem || cv.dataset.figure || cv.dataset.swatch;
    if (cv.dataset.swatch === 'frames') kind = 'framesw';
    else if (ALIAS[kind] && !cv.dataset.emblem) kind = ALIAS[kind];
    return { cv, kind, ctx: cv.getContext('2d'), dirty: true, visible: false, w: 0, h: 0, pointer: null, state: null, section: cv.closest('[data-polarity]') };
  });
  const artIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { const a = arts.find((x) => x.cv === e.target); if (a) { a.visible = e.isIntersecting; if (a.visible) a.dirty = true; } });
  }, { rootMargin: '120px' }) : null;
  arts.forEach((a) => {
    if (artIO) artIO.observe(a.cv); else a.visible = true;
    a.cv.addEventListener('pointermove', (e) => { const r = a.cv.getBoundingClientRect(); a.pointer = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true }; });
    a.cv.addEventListener('pointerleave', () => { if (a.pointer) a.pointer.inside = false; });
  });
  function drawArt(a, t) {
    const fn = DRAW[a.kind]; if (!fn) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = a.cv.clientWidth, h = a.cv.clientHeight; if (!w || !h) return;
    if (a.w !== w || a.h !== h) { a.cv.width = Math.round(w * dpr); a.cv.height = Math.round(h * dpr); a.w = w; a.h = h; }
    const c = a.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const fg = getComputedStyle(a.cv).color;
    const ground = a.section ? getComputedStyle(a.section).getPropertyValue('--g').trim() : '#F3F1EC';
    c.strokeStyle = fg; c.fillStyle = fg; c.lineCap = 'round'; c.lineJoin = 'round';
    const ctx = { pointer: a.kind === 'eye' ? pointerIn(a) : a.pointer, ground, state: a.state };
    fn(c, w, h, t, ctx);
    a.state = ctx.state;
    a.dirty = false;
  }
  function pointerIn(a) { const r = a.cv.getBoundingClientRect(); return { x: P.x - r.left, y: P.y - r.top, inside: true }; }
  let lastArtW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastArtW) > 2) { lastArtW = innerWidth; arts.forEach((a) => { a.dirty = true; }); } });
  function tickArts(t) {
    for (const a of arts) {
      if (!a.visible) continue;
      if (a.dirty || (!reduce && ANIMATED.has(a.kind))) drawArt(a, t);
    }
  }

  /* ---------- the line field (WebGL2) ---------- */
  const cv = document.getElementById('field');
  const gl = cv ? cv.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }) : null;

  const VS = `#version 300 es
in vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}`;

  const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;
uniform vec2 uMouse;uniform float uMouseAmt;uniform float uInvert;
uniform int uSecN;uniform vec4 uSec[12];uniform vec4 uSecB[12];
uniform int uRectN;uniform vec4 uRect[24];uniform vec4 uKind[24];
uniform vec4 uHero;uniform vec4 uTun;uniform vec4 uCliff;uniform vec4 uFig;
uniform sampler2D uName;uniform float uNameOn;
uniform vec4 uFace;uniform float uTurn;
uniform vec4 uHand;
uniform int uPeakN;uniform vec4 uPeak[8];
uniform vec4 uLoop;uniform vec4 uFig2;
uniform vec4 uGuil;
out vec4 o;

vec3 perm(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float sn(vec2 v){
 const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
 vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
 vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
 vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);
 vec3 p=perm(perm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
 vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
 vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
 m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
 vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);
}
float fbm(vec2 q,float t){
 vec2 w=vec2(sn(q*0.7+vec2(t,-0.7*t)),sn(q*0.7+vec2(5.2-0.6*t,1.3+t)));
 return 0.62*sn(q+0.55*w+vec2(0.0,t))+0.26*sn(q*2.03-0.4*w-vec2(t*0.5))+0.12*sn(q*4.1+vec2(t));
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}
float sdSeg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-ba*h);}
float sdRBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
float sdR(vec2 p,vec4 r,float rad,float pad){vec2 c=r.xy+r.zw*0.5;vec2 b=r.zw*0.5+pad;float rr=min(rad,min(b.x,b.y));vec2 q=abs(p-c)-b+rr;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-rr;}
vec2 nR(vec2 p,vec4 r,float rad,float pad){vec2 e=vec2(1.0,0.0);return normalize(vec2(sdR(p+e.xy,r,rad,pad)-sdR(p-e.xy,r,rad,pad),sdR(p+e.yx,r,rad,pad)-sdR(p-e.yx,r,rad,pad))+1e-6);}

float sdFigure(vec2 q){
 float d=length(q-vec2(0.02,-0.9))-0.085;
 d=smin(d,sdSeg(q,vec2(0.0,-0.78),vec2(-0.01,-0.44))-0.07,0.04);
 d=smin(d,sdSeg(q,vec2(0.0,-0.72),vec2(0.13,-0.5))-0.032,0.03);
 d=smin(d,sdSeg(q,vec2(-0.01,-0.72),vec2(-0.1,-0.52))-0.032,0.03);
 d=smin(d,sdSeg(q,vec2(0.0,-0.46),vec2(0.11,0.0))-0.042,0.03);
 d=smin(d,sdSeg(q,vec2(-0.02,-0.46),vec2(-0.13,-0.02))-0.042,0.03);
 return d;
}
float sdHand(vec2 q){
 float d=sdRBox(q-vec2(0.0,-0.44),vec2(0.16,0.15),0.07);
 d=smin(d,sdSeg(q,vec2(-0.115,-0.55),vec2(-0.145,-0.9))-0.042,0.03);
 d=smin(d,sdSeg(q,vec2(-0.04,-0.57),vec2(-0.047,-0.99))-0.044,0.03);
 d=smin(d,sdSeg(q,vec2(0.04,-0.56),vec2(0.056,-0.93))-0.042,0.03);
 d=smin(d,sdSeg(q,vec2(0.11,-0.52),vec2(0.155,-0.8))-0.036,0.03);
 d=smin(d,sdSeg(q,vec2(0.14,-0.36),vec2(0.3,-0.56))-0.046,0.05);
 d=smin(d,sdSeg(q,vec2(0.0,-0.3),vec2(0.035,0.8))-0.125,0.06);
 return d;
}
float g2(vec2 u){return exp(-dot(u,u));}
float faceH(vec2 q,float turn){
 vec2 f=q-vec2(turn*0.11,0.0);
 float head=1.0-pow(q.x/0.78,2.0)-pow((q.y+0.05)/1.08,2.0);
 float h=head>0.0?sqrt(head):head*0.6;
 if(q.y>0.7)h=max(h,(1.0-pow(q.x/0.36,2.0))*0.55-(q.y-0.7)*0.2);
 h+=0.16*exp(-pow((f.y+0.36)/0.07,2.0))*exp(-pow(f.x/0.45,2.0));
 h-=0.26*g2(vec2((f.x-0.27)/0.14,(f.y+0.2)/0.085))+0.26*g2(vec2((f.x+0.27)/0.14,(f.y+0.2)/0.085));
 float nose=exp(-pow((f.x-turn*0.07)/0.075,2.0))*smoothstep(-0.32,0.15,f.y)*smoothstep(0.34,0.18,f.y);
 h+=0.34*nose+0.12*g2(vec2((f.x-turn*0.07)/0.12,(f.y-0.2)/0.07));
 h+=0.1*g2(vec2((abs(f.x)-0.36)/0.17,(f.y-0.12)/0.2));
 h-=0.07*g2(vec2(f.x/0.24,(f.y-0.46)/0.035));
 h+=0.06*g2(vec2(f.x/0.2,(f.y-0.52)/0.05))+0.1*g2(vec2(f.x/0.2,(f.y-0.78)/0.1));
 return h;
}
float faceEye(vec2 q,float turn){vec2 f=q-vec2(turn*0.11,0.0);return min(pow((f.x-0.27)/0.105,2.0)+pow((f.y+0.2)/0.05,2.0),pow((f.x+0.27)/0.105,2.0)+pow((f.y+0.2)/0.05,2.0));}
float cliffTop(float x,float W,float H){
 float u=x/W;
 float ridge=H*(0.955-0.025*(0.5+0.5*sn(vec2(x/170.0,1.7)))-0.012*sn(vec2(x/41.0,4.1)));
 float rough=smoothstep(uCliff.x+0.02,uCliff.x+0.12,u);
 float top=H*uCliff.y-H*0.05*smoothstep(uCliff.x+0.1,1.0,u)+rough*(H*0.018*sn(vec2(x/60.0,9.3))+H*0.008*sn(vec2(x/17.0,2.2)));
 return mix(ridge,top,smoothstep(uCliff.z,uCliff.w,u));
}
float stars(vec2 q,float t){
 vec2 cell=floor(q/38.0);float h=hash(cell);
 vec2 sp=(cell+vec2(hash(cell+3.1),hash(cell+7.7)))*38.0;
 float r=0.5+1.3*pow(hash(cell+1.9),6.0);
 float tw=0.55+0.45*sin(t*1.3+h*40.0);
 return step(0.7,h)*(1.0-smoothstep(r-0.5,r+0.6,length(q-sp)))*tw;
}
float lineCov(float v,float fw,float hw){float d=abs(fract(v+0.5)-0.5);float aa=0.75*fw;return 1.0-smoothstep(hw-aa,hw+aa,d);}
float lineAlpha(float v,float vd,float wpx,float cov){
 float fw=max(fwidth(vd),1e-4);
 float l=max(0.0,log2(fw/0.2));float l0=floor(l);float f=l-l0;
 float s0=exp2(l0);float s1=s0*2.0;
 float a0=lineCov(v/s0,fw/s0,max(0.5*wpx*uDpr*fw/s0,0.5*cov));
 float a1=lineCov(v/s1,fw/s1,max(0.5*wpx*uDpr*fw/s1,0.5*cov));
 return mix(a0,a1,smoothstep(0.0,1.0,f));
}
float rl(float dy,float c,float w){return 1.0-smoothstep(w*0.5-0.5,w*0.5+0.5,abs(dy-c));}

void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
 float t=uTime;

 int si=0;
 for(int i=0;i<12;i++){
  if(i>=uSecN)break;
  vec4 s=uSec[i];vec4 b=uSecB[i];float off=0.0;
  if(b.x>0.5&&b.x<1.5)off=b.y*(0.8*sn(vec2(p.x/230.0,float(i)*7.3))+0.25*sn(vec2(p.x/37.0,float(i)*3.1)));
  else if(b.x>1.5&&b.x<2.5)off=b.y*sin(p.x/210.0+float(i)*1.7);
  if(p.y>=s.x+off)si=i;
 }
 vec4 S=uSec[si];
 int scene=int(S.z+0.5);
 float secTop=S.x;float secH=max(S.y-S.x,1.0);
 bool inkGround=(S.w>0.5)!=(uInvert>0.5);
 vec3 PAPER=vec3(0.953,0.945,0.925);vec3 INK=vec3(0.051,0.051,0.047);
 vec3 bg=inkGround?INK:PAPER;vec3 fg=inkGround?PAPER:INK;

 float ruleA=0.0;
 if(si+1<uSecN){vec4 nS=uSec[si+1];vec4 nB=uSecB[si+1];
  if(nB.x>2.5){float dy=nS.x-p.y;
   if(dy>0.0&&dy<36.0)ruleA=max(max(rl(dy,3.0,2.6),rl(dy,8.0,0.8)),max(max(rl(dy,12.0,0.8),rl(dy,17.5,1.6)),max(rl(dy,24.0,0.6),rl(dy,30.0,0.6))));}}

 vec2 pw=p;float clear=0.0,wmul=1.0,glass=0.0,rimL=0.0,rimD=0.0,edge=0.0,sparse=0.0;
 for(int i=0;i<24;i++){
  if(i>=uRectN)break;
  vec4 r=uRect[i];vec4 k=uKind[i];int kind=int(k.x+0.5);
  float d=sdR(p,r,k.y,k.z);
  if(d>150.0)continue;
  if(kind==1){clear=max(clear,1.0-smoothstep(-0.7,0.7,d));wmul=max(wmul,1.0+(0.7+0.9*k.w)*exp(-max(d,0.0)/10.0));}
  else if(kind==3){vec2 n=nR(p,r,k.y,k.z);float dd=max(d,0.0);pw-=n*(20.0+16.0*k.w)*exp(-dd/44.0);clear=max(clear,1.0-smoothstep(-4.0,16.0,d));wmul=max(wmul,1.0+1.2*exp(-dd/16.0));}
  else if(kind==4){sparse=max(sparse,1.0-smoothstep(0.0,80.0,d));}
  else if(kind==2){
   float ins=1.0-smoothstep(-0.7,0.7,d);
   if(ins>0.0){
    vec2 n=nR(p,r,k.y,k.z);float e=max(-d,0.0);
    float s=clamp(1.0-e/18.0,0.0,1.0);float sl=s*s*s;
    vec2 c=r.xy+r.zw*0.5;vec2 q=c+(p-c)/1.7+n*28.0*sl;
    pw=mix(pw,q,ins);glass=max(glass,ins);
    float ed=ins*(1.0-smoothstep(0.0,1.7,e));
    float ld=dot(n,normalize(vec2(-0.55,-0.83)));
    rimL=max(rimL,ed*max(ld,0.0)+ins*exp(-e/6.0)*0.2*max(ld,0.0));
    rimD=max(rimD,ed*max(-ld,0.0));edge=max(edge,ed);
   }
  }
 }

 float n=fbm(pw/460.0,t*0.03);
 vec2 dmv=pw-uMouse;float bump=uMouseAmt*4.2*exp(-dot(dmv,dmv)/(2.0*90.0*90.0));
 float wvar=mix(0.6,1.8,smoothstep(-0.55,0.75,sn(p/330.0+vec2(0.0,t*0.01))));

 float v1=0.0,vd1=0.0,v2=0.0,f1=1.0,f2=0.0,w=wvar,cov=0.0,solid=0.0,clr2=0.0,rim=0.0,extra=0.0;

 if(scene==0){
  vec2 hl=p-uHero.xy;
  vec2 c=uTun.xy;vec2 d=pw-c;float r=length(d);float th=atan(d.y,d.x);
  vec2 dm=pw-uMouse;th+=uMouseAmt*0.9*exp(-dot(dm,dm)/(2.0*140.0*140.0));
  float rough=smoothstep(uTun.z*0.55,uTun.z*1.2,r);
  float rr=r+n*(4.0+90.0*rough);
  float fr=1.41*pow(rr+2.0,0.641);
  v1=fr-th*0.15915494-uTun.w*22.0-t*0.12;vd1=fr;
  vec2 uvN=hl/uHero.zw;
  float m=(uNameOn>0.5&&uvN.x>0.0&&uvN.x<1.0&&uvN.y>0.0&&uvN.y<1.0)?texture(uName,uvN).r:0.0;
  cov=0.84*m;
  w=mix(0.7,1.25,rough)*wvar*0.8;
  float ct=cliffTop(hl.x,uHero.z,uHero.w);
  solid=max(solid,smoothstep(ct-0.8,ct+0.8,hl.y));
  vec2 fq=rot(-uFig.z)*(p-uFig.xy)/uFig.w;fq.x=-fq.x;
  solid=max(solid,1.0-smoothstep(-0.7,0.7,sdFigure(fq)*uFig.w));
 }else if(scene==1){
  vec2 q=(pw-uFace.xy)/uFace.z;
  float h=faceH(q,uTurn);
  float e=faceEye(q,uTurn);
  v1=h*22.0+n*0.35+bump*0.5;vd1=v1;
  f1=smoothstep(-0.3,0.02,h);
  v2=n*7.0+(pw.y-secTop)/70.0;f2=(1.0-f1)*0.32*smoothstep(0.0,200.0,pw.y-secTop);
  clr2=1.0-smoothstep(0.7,1.0,e);
  w=wvar*0.95;
 }else if(scene==2){
  vec2 hq=(p-uHand.xy)/uHand.z;
  float dh=sdHand(hq)*uHand.z;
  vec2 e2=vec2(1.5,0.0);
  vec2 gn=normalize(vec2(sdHand((p+e2.xy-uHand.xy)/uHand.z)-sdHand((p-e2.xy-uHand.xy)/uHand.z),sdHand((p+e2.yx-uHand.xy)/uHand.z)-sdHand((p-e2.yx-uHand.xy)/uHand.z))+1e-6);
  vec2 q=pw-gn*30.0*exp(-max(dh,0.0)/55.0);
  float sy=q.y-secTop;
  float dx=(q.x-uHand.x)/max(secH*0.9,300.0);
  float lift=secH*0.5*exp(-dx*dx*3.2);
  float wave=9.0*sin(q.x/48.0+sy/64.0+t*0.3)+n*24.0;
  v1=(sy+lift+wave)/7.0+bump;vd1=v1;
  float vs=secH*0.3/7.0;
  f1=smoothstep(vs,vs+9.0,v1);
  extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*(1.0-f1));
  clr2=1.0-smoothstep(-0.7,0.7,dh);
  rim=1.0-smoothstep(0.2,1.3,abs(dh-0.4));
 }else if(scene==3){
  float h=n*0.85;
  for(int i=0;i<8;i++){if(i>=uPeakN)break;vec4 pk=uPeak[i];vec2 d=(pw-pk.xy)/(pk.z*1.05+110.0);h+=(1.6+0.9*pk.w)*exp(-dot(d,d)*1.1);}
  v1=h*12.5+bump;vd1=v1;
 }else if(scene==4){
  float sy=pw.y-secTop;
  float fold=24.0*sin(pw.x/300.0+sy/540.0)+11.0*sin(pw.x/93.0-sy/230.0)+n*38.0;
  float u=sy+fold;
  v1=u/8.0+7.0*sin(u/70.0)+bump;vd1=v1;w=wvar*0.95;
 }else if(scene==5){
  float sy=pw.y-secTop;
  v1=(sy+n*44.0+14.0*sin(pw.x/170.0+sy/400.0))/9.5+bump;vd1=v1;w=wvar*0.9;
 }else if(scene==6){
  float sy=pw.y-secTop;
  v1=(sy+5.0*sin(pw.x/220.0+sy/160.0)+n*7.0)/4.6+bump*0.6;vd1=v1;w=0.55;
  v2=(sy*0.94+pw.x*0.34+n*9.0)/6.5;f2=0.6*smoothstep(0.05,0.45,n);
 }else if(scene==7){
  v1=n*24.0+bump;vd1=v1;
 }else if(scene==8){
  vec2 d=pw-uGuil.xy;float r=length(d);float a=atan(d.y,d.x);
  v1=(r+15.0*sin(9.0*a+r/36.0+t*0.04))/6.5;vd1=v1;
  v2=(r+15.0*sin(9.0*a-r/36.0+3.14159-t*0.04))/6.5;
  float env=(1.0-smoothstep(uGuil.z*0.92,uGuil.z*1.02,r))*smoothstep(uGuil.z*0.14,uGuil.z*0.22,r);
  f1=env;f2=env;w=0.8;
  extra=max(extra,(1.0-smoothstep(0.5,1.5,abs(r-uGuil.z*1.06)))*step(0.0,uGuil.z));
 }else if(scene==9){
  vec2 d=pw-uLoop.xy;float band=length(d)-uLoop.z;float T=uLoop.w;
  float tube=1.0-(band*band)/(T*T);float H=tube>0.0?sqrt(tube):0.0;
  float sy=pw.y-secTop;
  v1=(sy+n*26.0+7.0*sin(pw.x/95.0)-H*T*2.4)/7.5+bump;vd1=v1;
  w=wvar*mix(1.0,1.35,H);
  vec2 fq=(p-uFig2.xy)/uFig2.w;float fd=sdFigure(fq)*uFig2.w;
  clr2=1.0-smoothstep(-0.7,0.7,fd);rim=1.0-smoothstep(0.2,1.3,abs(fd-0.4));
 }else{
  float hz=secTop+secH*0.36;float dy=pw.y-hz;
  v1=1400.0/(max(dy,0.0)+16.0)+n*0.8;vd1=v1;
  f1=smoothstep(0.0,3.0,dy);
  extra=max(extra,1.0-smoothstep(0.6,1.6,abs(p.y-hz)));
  extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*(1.0-step(0.0,dy)));
 }

 float a1=lineAlpha(v1,vd1,w*wmul,cov)*f1;
 float a2=lineAlpha(v2,v2,0.9*wmul,0.0)*f2;
 float keep=step(mod(floor(v1+0.5),3.0),0.5);
 a1*=mix(1.0,keep,sparse);
 float A=max(a1,a2);
 A*=(1.0-clear)*(1.0-clr2);
 A*=mix(1.0,0.25,glass);
 A=max(A,max(extra*(1.0-clear),ruleA));
 A=max(A,rim*(1.0-clear));
 vec3 col=mix(bg,fg,A);
 col=mix(col,fg,solid);
 vec3 tc=inkGround?vec3(0.13,0.13,0.125):vec3(1.0);
 col=mix(col,tc,glass*0.45);
 col=mix(col,vec3(1.0),rimL*0.8);
 col=mix(col,fg,rimD*0.35+edge*0.16);
 o=vec4(col,1.0);
}`;

  if (!gl) {
    root.classList.add('no-lines');
    const loopArts = (now) => { tickArts(now / 1000); requestAnimationFrame(loopArts); };
    requestAnimationFrame(loopArts);
    return;
  }

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[lines] shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  if (vs && fs) { gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); }
  if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    if (vs && fs) console.error('[lines] link:', gl.getProgramInfoLog(prog));
    root.classList.add('no-lines');
    const loopArts = (now) => { tickArts(now / 1000); requestAnimationFrame(loopArts); };
    requestAnimationFrame(loopArts);
    return;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const al = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uDpr', 'uTime', 'uMouse', 'uMouseAmt', 'uInvert', 'uSecN', 'uSec', 'uSecB', 'uRectN', 'uRect', 'uKind', 'uHero', 'uTun', 'uCliff', 'uFig', 'uName', 'uNameOn', 'uFace', 'uTurn', 'uHand', 'uPeakN', 'uPeak', 'uLoop', 'uFig2', 'uGuil']
    .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  const nameTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, nameTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uName, 0);

  /* ---------- the page model ---------- */
  const SCENE = { tunnel: 0, face: 1, wings: 2, terrain: 3, strata: 4, stream: 5, engrave: 6, contour: 7, guilloche: 8, wrap: 9, horizon: 10 };
  const SEAM = { cliff: [1, 44], wave: [2, 26], rule: [3, 0] };
  const KIND = { plate: 1, '': 1, glass: 2, clear: 3, sparse: 4 };
  const secs = [...document.querySelectorAll('[data-scene]')].map((el) => ({
    el, scene: SCENE[el.dataset.scene] || 0, pol: el.dataset.polarity === 'inverse' ? 1 : 0, seam: SEAM[el.dataset.seam] || [0, 0]
  })).slice(0, 12);
  const plates = [...document.querySelectorAll('[data-plate]')].map((el) => ({ el, kind: KIND[el.dataset.plate] || 1, rad: 0, lift: 0, tlift: 0 }));
  plates.forEach((p) => {
    p.el.addEventListener('pointerenter', () => { p.tlift = 1; });
    p.el.addEventListener('pointerleave', () => { p.tlift = 0; });
    p.el.addEventListener('focusin', () => { p.tlift = 1; });
    p.el.addEventListener('focusout', () => { p.tlift = 0; });
  });
  const peaks = plates.filter((p) => p.el.hasAttribute('data-peak'));
  const hero = document.querySelector('.hero');
  const n1 = hero ? hero.querySelector('.n1') : null;
  const heroLoc = hero ? hero.querySelector('.hero-loc') : null;
  const faceEl = document.querySelector('[data-face]');
  const handEl = document.querySelector('[data-hand]');
  const loopEl = document.querySelector('[data-loop]');
  const contactEl = document.getElementById('contact');
  const resumeEl = document.getElementById('resume');
  const nav = document.querySelector('.topbar');

  function measureRadii() { plates.forEach((p) => { p.rad = parseFloat(getComputedStyle(p.el).borderTopLeftRadius) || 0; }); }

  /* ---------- the name, drawn only by the spiral's thickness ---------- */
  const nameCanvas = document.createElement('canvas');
  let nameOn = 0;
  // shrink the name until its widest line fits the hero, so it is never cut off
  function fitName() {
    if (!hero || !n1 || !n1.firstChild) return;
    n1.style.fontSize = '';
    const size = parseFloat(getComputedStyle(n1).fontSize);
    const hs = getComputedStyle(hero);
    const avail = hero.clientWidth - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight);
    const node = n1.firstChild, range = document.createRange();
    let widest = 0;
    if (getComputedStyle(n1).whiteSpace === 'nowrap') {
      range.selectNodeContents(n1); widest = range.getBoundingClientRect().width;
    } else {
      const re = /\S+/g; let m;
      while ((m = re.exec(node.textContent))) { range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length); widest = Math.max(widest, range.getBoundingClientRect().width); }
    }
    if (widest > avail) n1.style.fontSize = (size * avail / widest * 0.985).toFixed(2) + 'px';
  }
  function drawName() {
    if (!hero || !n1) return;
    const hr = hero.getBoundingClientRect();
    const md = Math.min(devicePixelRatio || 1, 1.5);
    nameCanvas.width = Math.max(1, Math.round(hr.width * md)); nameCanvas.height = Math.max(1, Math.round(hr.height * md));
    const c = nameCanvas.getContext('2d');
    c.setTransform(md, 0, 0, md, 0, 0); c.clearRect(0, 0, hr.width, hr.height);
    const cs = getComputedStyle(n1);
    const size = parseFloat(cs.fontSize);
    const stretch = parseFloat(cs.fontStretch) >= 120 ? 'expanded' : 'normal';
    c.font = `${cs.fontStyle} ${cs.fontWeight} ${stretch} ${cs.fontSize} ${cs.fontFamily}`;
    if ('fontStretch' in c) c.fontStretch = stretch;
    if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.lineWidth = size * 0.022; c.textBaseline = 'alphabetic';
    const node = n1.firstChild; if (!node || node.nodeType !== 3) return;
    const text = node.textContent; const range = document.createRange();
    const re = /\S+/g; let m;
    while ((m = re.exec(text))) {
      range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      const mt = c.measureText(m[0]);
      const asc = mt.fontBoundingBoxAscent || size * 0.8, desc = mt.fontBoundingBoxDescent || size * 0.2;
      const base = r.top - hr.top + (r.height - (asc + desc)) / 2 + asc;
      c.strokeText(m[0], r.left - hr.left, base); c.fillText(m[0], r.left - hr.left, base);
    }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, nameTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nameCanvas);
    nameOn = 1;
  }

  /* ---------- sizing ---------- */
  let dpr = 1, quality = 1;
  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 1.75) * quality;
    const maxPx = 3.4e6; if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
  }
  let relayoutPending = true;
  const ro = new ResizeObserver(() => { relayoutPending = true; });
  ro.observe(document.body); ro.observe(cv);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { relayoutPending = true; });
    Promise.all([document.fonts.load('700 100px "Kalnia"'), document.fonts.load('400 20px "Workbench"')]).then(() => { relayoutPending = true; }).catch(() => {});
  }

  /* ---------- per-frame state ---------- */
  const secBuf = new Float32Array(48), secBBuf = new Float32Array(48);
  const rectBuf = new Float32Array(96), kindBuf = new Float32Array(96), peakBuf = new Float32Array(32);
  let turn = 0, fig = null;
  const smooth = (x) => x * x * (3 - 2 * x);

  function frameParams(vw, vh) {
    let n = 0;
    for (const s of secs) {
      const r = s.el.getBoundingClientRect();
      secBuf.set([r.top, r.bottom, s.scene, s.pol], n * 4); secBBuf.set([s.seam[0], s.seam[1], 0, 0], n * 4); n++;
    }
    gl.uniform1i(U.uSecN, n); gl.uniform4fv(U.uSec, secBuf); gl.uniform4fv(U.uSecB, secBBuf);

    let m = 0;
    for (const p of plates) {
      p.lift += (p.tlift - p.lift) * 0.12;
      const r = p.el.getBoundingClientRect();
      if (!r.width || r.bottom < -160 || r.top > vh + 160) continue;
      rectBuf.set([r.left, r.top, r.width, r.height], m * 4); kindBuf.set([p.kind, p.rad, p.kind === 3 ? 8 : 0, p.lift], m * 4);
      if (++m >= 24) break;
    }
    gl.uniform1i(U.uRectN, m); gl.uniform4fv(U.uRect, rectBuf); gl.uniform4fv(U.uKind, kindBuf);

    if (hero) {
      const hr = hero.getBoundingClientRect();
      const narrow = hr.width < 760;
      const prog = reduce ? 0 : clamp(-hr.top / (hr.height * 0.95), 0, 1);
      const tu = narrow ? 0.5 : 0.36, tv = narrow ? 0.34 : 0.44;
      const tip = narrow ? 0.5 : 0.47;
      let topFrac = narrow ? 0.86 : 0.735;
      if (narrow && heroLoc) { const lr = heroLoc.getBoundingClientRect(); topFrac = clamp((lr.bottom - hr.top) / hr.height + 0.05, 0.72, 0.9); }
      gl.uniform4f(U.uHero, hr.left, hr.top, hr.width, hr.height);
      const tcx = hr.left + hr.width * tu, tcy = hr.top + hr.height * tv;
      gl.uniform4f(U.uTun, tcx, tcy, hr.height, prog);
      gl.uniform4f(U.uCliff, tip, topFrac, tip - 0.035, tip - 0.004);
      const size0 = hr.height * (narrow ? 0.055 : 0.075);
      const fx0 = hr.left + hr.width * (tip + 0.014), fy0 = hr.top + hr.height * topFrac;
      const e = smooth(prog);
      const fx = lerp(fx0, tcx, e) + Math.sin(prog * 3.2) * hr.width * 0.05;
      const fy = lerp(fy0, tcy + size0 * 0.4, e) - Math.sin(prog * Math.PI) * hr.height * 0.12;
      fig = [fx, fy, prog * 3.6, size0 * (1 - 0.82 * e)];
      gl.uniform4f(U.uFig, fig[0], fig[1], fig[2], fig[3]);
      gl.uniform1f(U.uNameOn, nameOn);
    }
    if (faceEl) {
      const r = faceEl.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
      const target = reduce ? 0.15 : clamp((P.x - cx) / (vw * 0.45), -1, 1) * P.amt;
      turn += (target - turn) * 0.05;
      gl.uniform4f(U.uFace, cx, cy, Math.min(r.height * 0.46, r.width * 0.6), 0); gl.uniform1f(U.uTurn, turn);
    }
    if (handEl) {
      const r = handEl.getBoundingClientRect(); const size = Math.min(r.height * 0.9, r.width / 0.62);
      gl.uniform4f(U.uHand, r.left + r.width / 2, r.bottom, size, 0);
    }
    let k = 0;
    for (const p of peaks) {
      const r = p.el.getBoundingClientRect();
      peakBuf.set([r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) * 0.5, p.lift], k * 4); if (++k >= 8) break;
    }
    gl.uniform1i(U.uPeakN, k); gl.uniform4fv(U.uPeak, peakBuf);
    if (contactEl) {
      const sr = contactEl.getBoundingClientRect();
      let cx, cy, R;
      if (innerWidth >= 1100 && loopEl) { const r = loopEl.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2; }
      else { cx = sr.left + sr.width * 0.7; cy = sr.top + sr.height * 0.3; R = Math.min(sr.width * 0.24, sr.height * 0.22); }
      const T = R * 0.15;
      gl.uniform4f(U.uLoop, cx, cy, R, T);
      const fs = (R - T) * 0.3;
      gl.uniform4f(U.uFig2, cx - (R - T) * 0.46, cy + (R - T) * 0.72, 0, fs);
    }
    if (resumeEl) {
      const r = resumeEl.getBoundingClientRect();
      const wide = r.width >= 900;
      gl.uniform4f(U.uGuil, r.left + r.width * (wide ? 0.73 : 0.5), r.top + r.height * 0.5, wide ? Math.min(r.width * 0.3, r.height * 0.46) : Math.min(r.width * 0.46, r.height * 0.42), 0);
    }
    if (nav) {
      let pol = 0;
      for (const s of secs) { const r = s.el.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { pol = s.pol; break; } }
      const darkGround = (pol === 1) !== isDark();
      const want = darkGround ? 'dark' : 'light';
      if (nav.dataset.on !== want) nav.dataset.on = want;
    }
  }

  /* ---------- loop ---------- */
  let last = performance.now(), time = 0, slow = 0, frames = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) { requestAnimationFrame(frame); return; }
    if (!reduce) time += dt;
    if (relayoutPending) { relayoutPending = false; fitName(); measureRadii(); resize(); drawName(); arts.forEach((a) => { a.dirty = true; }); }
    const vw = innerWidth, vh = innerHeight;
    P.x += (P.tx - P.x) * 0.14; P.y += (P.ty - P.y) * 0.14; P.amt += ((reduce ? 0 : P.tamt) - P.amt) * 0.06;
    frameParams(vw, vh);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, P.x, P.y); gl.uniform1f(U.uMouseAmt, P.amt); gl.uniform1f(U.uInvert, isDark() ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    tickArts(time);
    // performance guard: drop resolution when frames run long
    frames++; if (dt > 0.034) slow++;
    if (frames >= 90) { if (slow > 45 && quality > 0.55) { quality -= 0.15; relayoutPending = true; } frames = 0; slow = 0; }
    requestAnimationFrame(frame);
  }
  fitName(); measureRadii(); resize(); drawName();
  root.classList.add('lines-live');
  requestAnimationFrame(frame);
})();
