/* human-in-loop.dev — line engine.
   One WebGL2 canvas paints every section's line field behind the content.
   Canvas2D drawings add the interactive project assets and data figures.
   models.js (loaded lazily) draws the 3D head and hand in engraved lines.
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
  const TAU = Math.PI * 2;

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

  // shared with models.js
  const HIL = window.__HIL = { P, isDark, reduced: () => reduce, grip: null };

  /* ---------- helpers ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Code 128 (set B) for the Libre Barcode 128 font: start, data, mod-103 checksum, stop
  function code128B(s) {
    let sum = 104; let out = String.fromCharCode(204);
    for (let i = 0; i < s.length; i++) { sum += (s.charCodeAt(i) - 32) * (i + 1); out += s[i]; }
    const c = sum % 103;
    return out + String.fromCharCode(c < 95 ? c + 32 : c + 100) + String.fromCharCode(206);
  }
  function pathLen(pts) { let L = 0; for (let i = 2; i < pts.length; i += 2) L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); return L; }
  function pointAt(pts, f) {
    const target = f * pathLen(pts); let acc = 0;
    for (let i = 2; i < pts.length; i += 2) {
      const seg = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
      if (acc + seg >= target) { const u = (target - acc) / (seg || 1); return [lerp(pts[i - 2], pts[i], u), lerp(pts[i - 1], pts[i + 1], u)]; }
      acc += seg;
    }
    return [pts[pts.length - 2], pts[pts.length - 1]];
  }
  function bez(x0, y0, x1, y1, x2, y2, x3, y3, n, out) {
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); }
    return out;
  }

  /* ---------- the interactive drawings (Canvas2D) ---------- */
  const DRAW = {
    // VOAG: a caller speaks (your pointer is the voice); the agent answers under 300 ms later
    voice(c, w, h, t, a) {
      const col = 5, cols = Math.floor((w * 0.86) / col), speed = 26; // columns per second
      const idle = (tt) => { const cyc = ((tt % 3.4) + 3.4) % 3.4; return cyc < 2.6 ? (0.35 + 0.55 * Math.abs(Math.sin(cyc * 7.3)) * Math.abs(Math.sin(cyc * 2.1 + 1))) : 0.02; };
      if (!a.state) { // start mid-call: the history is already full when the tile first appears
        a.state = { caller: [], last: t, px: null, acc: 0, amp: idle(t) };
        for (let k = cols + 40; k > 0; k--) a.state.caller.push(idle(t - k / speed) * (0.55 + 0.45 * Math.random()));
      }
      const st = a.state;
      const dt = Math.min(0.1, Math.max(0, t - st.last)); st.last = t;
      let target;
      const p = a.pointer;
      if (p && p.inside) {
        const v = st.px ? Math.hypot(p.x - st.px[0], p.y - st.px[1]) / Math.max(dt, 0.016) : 0;
        st.px = [p.x, p.y];
        target = clamp(v / 900, 0, 1);
      } else {
        st.px = null;
        target = idle(t); // speak for 2.6 s, then a short pause
      }
      st.amp = lerp(st.amp, target, 0.25);
      st.acc += dt * speed;
      while (st.acc >= 1) { st.acc -= 1; st.caller.push(st.amp * (0.55 + 0.45 * Math.random())); if (st.caller.length > cols + 40) st.caller.shift(); }
      const delayCols = Math.round(0.28 * speed); // 280 ms
      const mid = h * 0.5, nowX = w * 0.9, amp = h * 0.36;
      c.lineWidth = 1; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(0, mid); c.lineTo(nowX, mid); c.stroke(); c.globalAlpha = 1;
      const n = st.caller.length;
      c.lineWidth = 2.2;
      c.beginPath();
      for (let i = 0; i < Math.min(n, cols); i++) {
        const x = nowX - i * col, v = st.caller[n - 1 - i];
        if (v > 0.03) { c.moveTo(x, mid - 3); c.lineTo(x, mid - 3 - v * amp); }
      }
      c.stroke();
      // the agent: same rhythm, delayed, answered below the line
      c.lineWidth = 1.2; c.beginPath();
      for (let i = delayCols; i < Math.min(n, cols); i++) {
        const x = nowX - i * col, v = st.caller[n - 1 - i + delayCols] || 0;
        const r = Math.min(1, v * 1.1);
        if (r > 0.03) { c.moveTo(x, mid + 3); c.lineTo(x, mid + 3 + r * amp * 0.8); }
      }
      c.stroke();
      // the gap: under 300 ms between hearing and answering
      const gx = nowX - delayCols * col;
      c.lineWidth = 1; c.beginPath();
      c.moveTo(gx, mid + 8); c.lineTo(gx, mid + 20); c.moveTo(nowX, mid + 8); c.lineTo(nowX, mid + 20); c.moveTo(gx, mid + 14); c.lineTo(nowX, mid + 14);
      c.stroke();
      c.beginPath(); c.arc(nowX, mid, 3.2 + (reduce ? 0 : Math.sin(t * 6) * 0.8), 0, TAU); c.fill();
    },
    // UniBias: an eye that watches the pointer
    eye(c, w, h, t, a) {
      const cx = w / 2, cy = h / 2, ew = Math.min(w * 0.44, h * 0.95), eh = ew * 0.42;
      const st = a.state || (a.state = { ox: 0, oy: 0 });
      let tx = 0, ty = 0;
      const r0 = a.cv.getBoundingClientRect(); const px = P.x - r0.left, py = P.y - r0.top;
      if (P.amt > 0.05) { tx = clamp((px - cx) / w, -0.5, 0.5) * ew * 0.62; ty = clamp((py - cy) / h, -0.5, 0.5) * eh * 0.7; }
      st.ox = lerp(st.ox, tx, 0.12); st.oy = lerp(st.oy, ty, 0.12);
      const blink = reduce ? 1 : Math.max(0.08, Math.min(1, Math.abs(Math.sin(t * 0.52)) * 6));
      c.save();
      c.beginPath(); c.moveTo(cx - ew, cy); c.quadraticCurveTo(cx, cy - eh * 2 * blink, cx + ew, cy); c.quadraticCurveTo(cx, cy + eh * 2 * blink, cx - ew, cy); c.closePath();
      c.lineWidth = 1.6; c.stroke(); c.clip();
      const ir = eh * 1.05, ix = cx + st.ox, iy = cy + st.oy;
      c.lineWidth = 0.8; c.beginPath();
      for (let r = 4; r < ir; r += 3.2) { c.moveTo(ix + r, iy); c.arc(ix, iy, r, 0, TAU); }
      c.stroke();
      c.beginPath(); c.arc(ix, iy, ir * 0.36, 0, TAU); c.fill();
      c.lineWidth = 0.6; c.beginPath();
      for (let x = cx - ew; x < cx + ew; x += 5) { c.moveTo(x, cy - eh * 2); c.lineTo(x + 8, cy + eh * 2); }
      c.globalAlpha = 0.18; c.stroke(); c.globalAlpha = 1;
      c.restore();
      c.lineWidth = 0.7; c.beginPath();
      for (let k = 1; k < 5; k++) { c.moveTo(cx - ew - k * 7, cy); c.quadraticCurveTo(cx, cy - eh * 2 * blink - k * 9, cx + ew + k * 7, cy); }
      c.stroke();
    },
    // AnyAssist: every tenant has its own chamber; a query ripples only inside the chamber it belongs to
    tenants(c, w, h, t, a) {
      const n = 4, gap = w * 0.04, bw = (w - gap * (n + 1)) / n, bh = h * 0.66, y0 = h * 0.06, gy = h * 0.9;
      const st = a.state || (a.state = { ripples: [[], [], [], []], lastSpawn: 0, active: 0, pulse: 0 });
      const p = a.pointer && a.pointer.inside ? a.pointer : null;
      let active = Math.floor(t / 2.4) % n, qx = null, qy = null;
      if (p) for (let i = 0; i < n; i++) { const x0 = gap + i * (bw + gap); if (p.x > x0 && p.x < x0 + bw && p.y > y0 && p.y < y0 + bh) { active = i; qx = p.x; qy = p.y; } }
      if (active !== st.active) { st.active = active; st.pulse = 0; }
      st.pulse = Math.min(1, st.pulse + 0.035);
      if (t - st.lastSpawn > 0.42 && st.pulse >= 1) {
        const x0 = gap + active * (bw + gap);
        st.ripples[active].push({ x: qx != null ? qx : x0 + bw * (0.3 + 0.4 * Math.random()), y: qy != null ? qy : y0 + bh * (0.3 + 0.4 * Math.random()), t0: t });
        st.lastSpawn = t;
      }
      // the shared gateway line, with the query travelling along it to its tenant
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(gap * 0.4, gy); c.lineTo(w - gap * 0.4, gy); c.stroke();
      for (let i = 0; i < n; i++) {
        const x0 = gap + i * (bw + gap), cx = x0 + bw / 2, cy = y0 + bh / 2, on = i === active;
        c.lineWidth = on ? 1.8 : 1.1; c.beginPath(); c.roundRect(x0, y0, bw, bh, Math.min(18, bw * 0.2)); c.stroke();
        c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx, y0 + bh); c.lineTo(cx, gy); c.stroke();
        c.save(); c.beginPath(); c.roundRect(x0 + 1, y0 + 1, bw - 2, bh - 2, Math.min(17, bw * 0.2)); c.clip();
        c.globalAlpha = on ? 0.55 : 0.3; c.lineWidth = 0.7; c.beginPath();
        const sp = 5 + i * 1.6;
        for (let r = sp; r < Math.max(bw, bh); r += sp) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, TAU); }
        c.stroke(); c.globalAlpha = 1;
        const rs = st.ripples[i];
        for (let k = rs.length - 1; k >= 0; k--) {
          const rr = (t - rs[k].t0) * 70; if (rr > Math.max(bw, bh) * 1.2) { rs.splice(k, 1); continue; }
          c.globalAlpha = clamp(1 - rr / (Math.max(bw, bh) * 1.2), 0, 1); c.lineWidth = 1.5; c.beginPath(); c.arc(rs[k].x, rs[k].y, rr, 0, TAU); c.stroke();
        }
        c.globalAlpha = 1; c.restore();
      }
      const ax = gap + active * (bw + gap) + bw / 2, e = st.pulse;
      const px = e < 0.7 ? lerp(gap * 0.4, ax, e / 0.7) : ax, py = e < 0.7 ? gy : lerp(gy, y0 + bh, (e - 0.7) / 0.3);
      c.beginPath(); c.arc(px, py, 3.4, 0, TAU); c.fill();
    },
    // Privacy RAG: data stays inside the wall; only the answer leaves, toward whoever asked
    enclosure(c, w, h, t, a) {
      const cx = w * 0.42, cy = h * 0.5, R = Math.min(h * 0.3, w * 0.2);
      const st = a.state || (a.state = { flow: null, fw: 0, fh: 0 });
      if (!st.flow || st.fw !== w || st.fh !== h) { // potential flow around a cylinder, computed once per size
        st.fw = w; st.fh = h; st.flow = [];
        for (let k = -9; k <= 9; k++) {
          const y0 = cy + k * (h / 19), pts = [];
          for (let x = -4; x <= w + 4; x += 3) {
            const dx = x - cx; let y = y0;
            for (let it = 0; it < 8; it++) { const dy = y - cy, r2 = dx * dx + dy * dy; const f = dy * (1 - (R + 10) * (R + 10) / Math.max(r2, 1)) - (y0 - cy); y -= f * 0.5; }
            if (Math.hypot(dx, y - cy) < R + 6) { pts.push(NaN, NaN); continue; }
            pts.push(x, y);
          }
          st.flow.push(pts);
        }
      }
      c.lineWidth = 0.8; c.beginPath();
      for (const pts of st.flow) { let pen = false; for (let i = 0; i < pts.length; i += 2) { const x = pts[i], y = pts[i + 1]; if (x !== x) { pen = false; continue; } if (!pen) { c.moveTo(x, y); pen = true; } else c.lineTo(x, y); } }
      c.stroke();
      // the wall
      c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      // inside: dense-vector rings and keyword rings, turning as it reasons
      const spin = reduce ? 0 : t * 0.35;
      for (let k = 1; k < 10; k++) {
        const r = R - 3 - k * (R - 8) / 10;
        c.lineWidth = 0.9; c.setLineDash(k % 2 ? [] : [2.5, 3.5]); c.lineDashOffset = k % 2 ? 0 : -spin * 20;
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      }
      c.setLineDash([]);
      // who is asking: the pointer if it is here, otherwise an agent arriving from the right
      let qx, qy; const p = a.pointer && a.pointer.inside ? a.pointer : null;
      if (p) { qx = p.x; qy = p.y; } else { const ph = (t % 5) / 5; qx = lerp(w + 10, cx + R + 40, Math.min(1, ph * 2.2)); qy = cy - R * 0.4 + Math.sin(t) * 6; }
      const dx = qx - cx, dy = qy - cy, d = Math.hypot(dx, dy);
      if (d > R + 8) {
        const ux = dx / d, uy = dy / d, bx = cx + ux * R, by = cy + uy * R;
        c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by); c.lineTo(qx, qy); c.stroke();
        const f = reduce ? 0.5 : (t * 1.4) % 1;
        c.beginPath(); c.arc(lerp(bx, qx, f), lerp(by, qy, f), 2.6, 0, TAU); c.fill();
        c.lineWidth = 1; c.beginPath(); c.arc(qx, qy, 6, 0, TAU); c.stroke();
      }
    },
    // WhatsApp dispatch: messages from many groups pour into one channel and leave, routed, in under a minute
    converge(c, w, h, t, a) {
      const st = a.state || (a.state = { paths: null, pw: 0, ph: 0, extra: [] });
      const N = 15;
      if (!st.paths || st.pw !== w || st.ph !== h) {
        st.pw = w; st.ph = h; st.paths = [];
        for (let i = 0; i < N; i++) {
          const ys = h * (0.05 + 0.9 * i / (N - 1)), yc = h * 0.5 + (i - (N - 1) / 2) * 2.1;
          const g = Math.floor(i / 5), ye = h * (0.2 + 0.3 * g) + ((i % 5) - 2) * 4.2;
          const pts = []; bez(0, ys, w * 0.24, ys, w * 0.3, yc, w * 0.47, yc, 30, pts); pts.push(w * 0.56, yc); bez(w * 0.56, yc, w * 0.7, yc, w * 0.72, ye, w * 0.93, ye, 30, pts);
          st.paths.push(pts);
        }
      }
      const p = a.pointer && a.pointer.inside ? a.pointer : null;
      let hot = -1;
      if (p && p.x < w * 0.3) { let best = 1e9; st.paths.forEach((pts, i) => { const d = Math.abs(pts[1] + (pts[pts.length - 1] - pts[1]) * 0 - p.y); if (d < best) { best = d; hot = i; } }); }
      st.paths.forEach((pts, i) => {
        c.lineWidth = i === hot ? 1.8 : 0.9; c.beginPath(); c.moveTo(pts[0], pts[1]);
        for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]);
        c.stroke();
      });
      if (hot >= 0 && Math.random() < 0.12) st.extra.push({ i: hot, t0: t });
      const move = (f) => f * f * (3 - 2 * f);
      for (let i = 0; i < N; i++) { const f = ((t * 0.32 + i * 0.137) % 1); const [x, y] = pointAt(st.paths[i], move(f)); c.beginPath(); c.arc(x, y, 2.3, 0, TAU); c.fill(); }
      for (let k = st.extra.length - 1; k >= 0; k--) { const e = st.extra[k], f = (t - e.t0) * 0.6; if (f > 1) { st.extra.splice(k, 1); continue; } const [x, y] = pointAt(st.paths[e.i], move(f)); c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); }
      c.lineWidth = 0.9; c.beginPath();
      for (let r = 3; r < 16; r += 3.2) { c.moveTo(w * 0.87 + r, h * 0.9); c.arc(w * 0.87, h * 0.9, r, 0, TAU); }
      c.stroke();
    },
    // Experience: a real time axis, from April 2025 to today
    timeline(c, w, h, t, a) {
      const tl = a.tl; if (!tl) return;
      const X = (m) => (m / tl.months) * w;
      const base = h - 18;
      // month ticks, a taller line at each new year
      c.lineWidth = 1; c.beginPath();
      for (let m = 0; m <= tl.months; m++) { const x = Math.round(X(m)) + 0.5; const yr = (tl.startMonth + m) % 12 === 0; c.moveTo(x, base); c.lineTo(x, base - (yr ? h - 26 : 9)); }
      c.moveTo(0, base + 0.5); c.lineTo(w, base + 0.5); c.stroke();
      // the roles: bundles of lines between their dates; the longer one thickens as responsibility grows
      tl.roles.forEach((r, ri) => {
        const x0 = X(r.from), x1 = X(r.to), y = r.y * h;
        let top = y;
        if (ri === 0) {
          // the long role: a wedge of lines that widens as the responsibility grew
          const hMax = h * 0.34, gap = 4, n = Math.floor(hMax / gap);
          c.lineWidth = 1.5; c.beginPath();
          for (let k = 0; k < n; k++) {
            const off = (k - (n - 1) / 2) * gap;
            const start = lerp(x0, x1, Math.pow(Math.abs(off) / (hMax / 2), 1.3) * 0.85);
            c.moveTo(start, y + off); c.lineTo(x1, y + off);
          }
          c.stroke();
          top = y - 4;
        } else {
          // the short contract: a dense block of upright hatching
          const hh = h * 0.2;
          c.lineWidth = 1.3; c.beginPath();
          for (let x = x0; x <= x1; x += 3.4) { c.moveTo(x, y - hh / 2); c.lineTo(x, y + hh / 2); }
          c.stroke();
          top = y + hh / 2;
        }
        c.lineWidth = 1; c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, base); c.stroke();
        if (r.card) { c.setLineDash([2, 4]); c.beginPath(); c.moveTo(x0, base); c.lineTo(x0, h); c.stroke(); c.setLineDash([]); }
        c.beginPath(); c.arc(x0, y, 3, 0, TAU); c.fill();
      });
      // today: a line that keeps moving, with a slow pulse
      const nx = X(tl.now);
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(nx, 8); c.lineTo(nx, base); c.stroke();
      const pr = reduce ? 0 : (t % 2.2) / 2.2;
      c.globalAlpha = 1 - pr; c.lineWidth = 1; c.beginPath(); c.arc(nx, tl.roles[0].y * h, 4 + pr * 16, 0, TAU); c.stroke(); c.globalAlpha = 1;
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
      set.forEach((i) => { const x = (i % cols) * sx + sx / 2, y = Math.floor(i / cols) * sy + sy / 2; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.stroke(); });
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
    }
  };
  const ANIMATED = new Set(['voice', 'eye', 'tenants', 'enclosure', 'converge', 'timeline']);

  const arts = [...document.querySelectorAll('canvas[data-emblem], canvas[data-figure], canvas[data-art]')].map((cv) => ({
    cv, kind: cv.dataset.emblem || cv.dataset.figure || cv.dataset.art, ctx: cv.getContext('2d'), dirty: true, visible: false,
    w: 0, h: 0, pointer: null, state: null, tl: null
  }));
  arts.forEach((a) => {
    const host = a.cv.closest('article') || a.cv;
    host.addEventListener('pointermove', (e) => { const r = a.cv.getBoundingClientRect(); a.pointer = { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }; });
    host.addEventListener('pointerleave', () => { if (a.pointer) a.pointer.inside = false; });
  });
  function drawArt(a, t) {
    const fn = DRAW[a.kind]; if (!fn) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = a.cv.clientWidth, h = a.cv.clientHeight; if (!w || !h) return;
    if (a.w !== w || a.h !== h) { a.cv.width = Math.round(w * dpr); a.cv.height = Math.round(h * dpr); a.w = w; a.h = h; }
    const c = a.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const fg = getComputedStyle(a.cv).color;
    c.strokeStyle = fg; c.fillStyle = fg; c.lineCap = 'round'; c.lineJoin = 'round';
    fn(c, w, h, t, a);
    a.dirty = false;
  }
  let lastArtW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastArtW) > 2) { lastArtW = innerWidth; arts.forEach((a) => { a.dirty = true; }); } });
  function tickArts(t) {
    const vh = innerHeight;
    for (const a of arts) {
      const r = a.cv.getBoundingClientRect();
      const vis = r.bottom > -120 && r.top < vh + 120 && r.width > 0;
      if (vis && !a.visible) a.dirty = true;
      a.visible = vis;
      if (!a.visible) continue;
      if (a.dirty || (!reduce && ANIMATED.has(a.kind))) drawArt(a, t);
    }
  }

  /* ---------- experience timeline layout (dates -> positions) ---------- */
  const tlEl = document.querySelector('[data-timeline]');
  const tlArt = arts.find((a) => a.kind === 'timeline');
  function layoutTimeline() {
    if (!tlEl || !tlArt) return;
    const origin = { y: 2025, m: 3 }; // April 2025, month index from 0
    const now = new Date();
    const idx = (y, m) => (y - origin.y) * 12 + (m - origin.m);
    const nowF = idx(now.getFullYear(), now.getMonth()) + now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const months = Math.ceil(nowF) + 1;
    const parse = (s) => { if (s === 'now') return nowF; const [y, m] = s.split('-').map(Number); return idx(y, m - 1); };
    const roles = [...document.querySelectorAll('.role[data-from]')].map((el, i) => ({
      el, from: parse(el.dataset.from), to: el.dataset.to === 'now' ? nowF : parse(el.dataset.to) + 1, y: i === 0 ? 0.62 : 0.3, card: true
    }));
    tlArt.tl = { months, now: nowF, startMonth: origin.m, roles };
    const w = tlEl.clientWidth;
    tlEl.querySelectorAll('[data-year]').forEach((s) => { const m = idx(Number(s.dataset.year), 0); s.style.left = Math.max(0, (m / months) * w) + 'px'; });
    tlArt.dirty = true;
  }

  /* ---------- contact: link tiles sit just outside the loop, never on its text ---------- */
  const contactEl = document.getElementById('contact');
  const loopEl = document.querySelector('[data-loop]');
  const LOOP_ANGLES = [-90, -12, 58, 122, 192];
  function layoutLoop() {
    if (!contactEl || !loopEl) return;
    const items = [...loopEl.children];
    contactEl.classList.remove('ring-on');
    items.forEach((li) => { li.style.left = ''; li.style.top = ''; });
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const pad = parseFloat(getComputedStyle(contactEl).paddingLeft) || 24;
    contactEl.classList.add('ring-on');
    const sizes = items.map((li) => [li.offsetWidth, li.offsetHeight]);
    const maxW = Math.max(...sizes.map((s) => s[0]));
    const R = Math.min(vh * 0.3, 300, vw / 2 - pad - maxW - 28);
    if (R < 150) { contactEl.classList.remove('ring-on'); contactEl.style.removeProperty('--ring'); return; }
    contactEl.style.setProperty('--ring', (R * 2) + 'px');
    items.forEach((li, i) => {
      const ang = LOOP_ANGLES[i % LOOP_ANGLES.length] * Math.PI / 180, cs = Math.cos(ang), sn = Math.sin(ang);
      const [w, h] = sizes[i];
      const ext = Math.abs(cs) * w / 2 + Math.abs(sn) * h / 2 + 22;
      li.style.left = (R + cs * (R + ext) - w / 2) + 'px';
      li.style.top = (R + sn * (R + ext) - h / 2) + 'px';
    });
  }

  /* ---------- 3D models, loaded only when their sections come near ---------- */
  const modelCanvases = document.querySelectorAll('canvas[data-model]');
  if (modelCanvases.length && 'IntersectionObserver' in window) {
    let started = false;
    const mio = new IntersectionObserver((es) => {
      if (started || !es.some((e) => e.isIntersecting)) return;
      started = true; mio.disconnect();
      import('/assets/js/models.js').catch((err) => console.warn('[lines] 3D models unavailable:', err));
    }, { rootMargin: '150% 0px' });
    modelCanvases.forEach((m) => mio.observe(m));
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
uniform vec4 uGrip;
uniform int uPeakN;uniform vec4 uPeak[8];
uniform vec4 uLoop;uniform vec4 uFig2;
uniform vec4 uBH;
uniform vec4 uMoon;uniform vec4 uFoot;uniform sampler2D uCode;uniform float uCodeOn;
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
float cliffTop(float x,float W,float H){
 float u=x/W;
 float ridge=H*(0.955-0.025*(0.5+0.5*sn(vec2(x/170.0,1.7)))-0.012*sn(vec2(x/41.0,4.1)));
 float rough=smoothstep(uCliff.w+0.015,uCliff.w+0.09,u);
 float top=H*uCliff.z-H*0.035*smoothstep(uCliff.w+0.08,1.0,u)+rough*(H*0.014*sn(vec2(x/60.0,9.3))+H*0.006*sn(vec2(x/17.0,2.2)));
 return mix(ridge,top,smoothstep(uCliff.x,uCliff.y,u));
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

 float v1=0.0,vd1=0.0,v2=0.0,vd2=0.0,f1=1.0,f2=0.0,w=wvar,w2=0.9,cov=0.0,solid=0.0,clr2=0.0,rim=0.0,extra=0.0;

 if(scene==0){
  // HERO: the tunnel; the name is the spiral's thickness; a figure stands on the cliff
  vec2 hl=p-uHero.xy;
  vec2 c=uTun.xy;vec2 d=pw-c;float r=length(d);float th=atan(d.y,d.x);
  vec2 dm=pw-uMouse;th+=uMouseAmt*0.9*exp(-dot(dm,dm)/(2.0*140.0*140.0));
  float rough=smoothstep(uTun.z*0.55,uTun.z*1.2,r);
  float rr=r+n*(4.0+90.0*rough);
  float fr=1.41*pow(rr+2.0,0.641)*clamp(sqrt(1000.0*uDpr/uRes.x),1.0,1.55); // finer rings on small screens, so the name keeps enough lines
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
  // ABOUT: quiet contours; the 3D head is drawn on its own canvas above
  float sy=pw.y-secTop;
  v1=n*8.0+sy/90.0+bump*0.5;vd1=v1;
  f1=0.4*smoothstep(0.0,220.0,sy);w=0.8;
 }else if(scene==2){
  // FAQ: a hand grips the cloth of lines and pulls it; the lines gather in the fist and the night shows through
  vec2 G=uGrip.xy;vec2 d=pw-G;float r=length(d);
  vec2 q=vec2(d.x,d.y-0.0005*d.x*d.x);
  float ph=atan(q.x,q.y);
  ph+=(0.05*sin(r/38.0-t*0.45+ph*7.0)+0.035*n)*smoothstep(20.0,280.0,r);
  float pmax=1.08;
  float cloth=1.0-smoothstep(pmax-0.07,pmax+0.02,abs(ph));
  v1=ph*uGrip.z+bump*0.6;vd1=v1;
  f1=cloth;
  w=wvar*mix(1.7,0.95,smoothstep(0.0,240.0,r));
  // the gathered end of the cloth sticking up out of the fist
  float pu=atan(q.x,-q.y);
  v2=pu*46.0;vd2=v2;f2=(1.0-smoothstep(0.2,0.28,abs(pu)))*(1.0-smoothstep(uGrip.w*0.55,uGrip.w*0.8,r));w2=1.1;
  extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*(1.0-cloth)*(1.0-f2));
 }else if(scene==3||scene==7){
  // CASE STUDIES / SKILLS: terrain that rises under each item
  float h=n*0.85;
  for(int i=0;i<8;i++){if(i>=uPeakN)break;vec4 pk=uPeak[i];vec2 d=(pw-pk.xy)/(pk.z*1.05+110.0);h+=(1.6+0.9*pk.w)*exp(-dot(d,d)*1.1);}
  v1=h*(scene==3?12.5:10.0)+bump;vd1=v1;
 }else if(scene==4){
  // EXPERIENCE: strata
  float sy=pw.y-secTop;
  float fold=18.0*sin(pw.x/340.0+sy/560.0)+8.0*sin(pw.x/113.0-sy/260.0)+n*30.0;
  float u=sy+fold;
  v1=u/8.5+6.0*sin(u/75.0)+bump;vd1=v1;w=wvar*0.9;
 }else if(scene==5){
  // PROJECTS: water passing stones
  float sy=pw.y-secTop;
  v1=(sy+n*44.0+14.0*sin(pw.x/170.0+sy/400.0))/9.5+bump;vd1=v1;w=wvar*0.9;
 }else if(scene==6){
  // PUBLICATION: engraving, cross-hatched where the terrain is high
  float sy=pw.y-secTop;
  v1=(sy+5.0*sin(pw.x/220.0+sy/160.0)+n*7.0)/4.6+bump*0.6;vd1=v1;w=0.6;
  v2=(sy*0.94+pw.x*0.34+n*9.0)/6.5;vd2=v2;f2=0.6*smoothstep(0.05,0.45,n);w2=0.7;
 }else if(scene==8){
  // RESUME: a black hole bending the lines behind it (point-mass lens), with an inclined accretion disk
  vec2 C=uBH.xy;float RE=uBH.z;float Rh=RE*0.46;
  vec2 th=p-C;float r=length(th);
  vec2 src=C+th-RE*RE*th/max(r*r,1.0);
  float ns=fbm(src/420.0,t*0.03);
  v1=(src.y*0.93+src.x*0.37)/6.2+ns*2.4;vd1=v1;
  float hz=1.0-smoothstep(Rh-0.8,Rh+0.8,r);
  f1=1.0-hz;w=0.8+0.9*smoothstep(RE*2.2,RE*0.9,r);
  vec2 dd=vec2(th.x,th.y/0.2);float rho=length(dd);
  float disk=smoothstep(Rh*1.25,Rh*1.5,rho)*(1.0-smoothstep(Rh*2.8,Rh*3.4,rho));
  v2=rho/5.0+atan(dd.y,dd.x)*0.31830989-t*0.9*(1.0+uBH.w);vd2=rho/5.0;
  f2=disk*(th.y>0.0?1.0:(1.0-hz));
  w2=mix(1.7,0.5,smoothstep(-Rh*2.6,Rh*2.6,th.x));
  float ar=r/3.0;float ad=abs(fract(ar+0.5)-0.5)*3.0;
  float band=smoothstep(Rh*1.03,Rh*1.1,r)*(1.0-smoothstep(Rh*1.4,Rh*1.7,r));
  extra=max(extra,(1.0-smoothstep(0.3,1.2,ad))*band*(th.y<0.0?1.0:0.4)*(1.0-f2));
  extra=max(extra,(1.0-smoothstep(0.5,1.6,abs(r-Rh*1.02))));
 }else if(scene==9){
  // CONTACT: lines wrap the loop the way they wrap the figure in reference 4
  vec2 d=pw-uLoop.xy;float band=length(d)-uLoop.z;float T=uLoop.w;
  float tube=1.0-(band*band)/(T*T);float H=tube>0.0?sqrt(tube):0.0;
  float sy=pw.y-secTop;
  v1=(sy+n*26.0+7.0*sin(pw.x/95.0)-H*T*2.4)/7.5+bump;vd1=v1;
  w=wvar*mix(1.0,1.35,H);
  vec2 fq=(p-uFig2.xy)/uFig2.w;float fd=sdFigure(fq)*uFig2.w;
  clr2=1.0-smoothstep(-0.7,0.7,fd);rim=1.0-smoothstep(0.2,1.3,abs(fd-0.4));
 }else{
  // FOOTER: a night ocean; the moon is a barcode that scans as human-in-loop.dev
  float hz=uMoon.w;float dy=pw.y-hz;
  vec2 mc=uMoon.xy;float R=uMoon.z;
  vec2 fuv=(p-uFoot.xy)/uFoot.zw;
  if(dy>0.0){
   float Z=620.0/(dy+4.0);float X=(pw.x-mc.x)/(dy+4.0)*0.7;
   float H=0.35*sin(X*1.3+Z*0.9-t*1.2)+0.22*sin(-X*2.1+Z*1.4-t*0.9)+0.12*sin(X*3.7+Z*2.6-t*1.7);
   v1=Z*1.5+H*1.3+bump*0.3;vd1=Z*1.5;
   float path=exp(-pow((pw.x-mc.x)/(R*(0.55+dy/280.0)),2.0));
   w=wvar*(1.0+1.8*path);
   vec2 mu=(vec2(pw.x+H*7.0,hz-dy*0.9)-uFoot.xy)/uFoot.zw;
   float bar=uCodeOn>0.5?texture(uCode,mu).r:0.0;
   v2=v1*2.7;vd2=vd1*2.7;f2=path*0.85*(1.0-bar*0.9);w2=0.9;
   f1*=1.0-0.75*bar*path;
  }else{
   f1=0.0;
   float md=length(p-mc);
   float bar=uCodeOn>0.5?texture(uCode,fuv).r:0.0;
   solid=(1.0-smoothstep(R-0.8,R+0.8,md))*(1.0-bar);
   float halo=md/7.0;float hd=abs(fract(halo+0.5)-0.5)*7.0;
   extra=max(extra,(1.0-smoothstep(0.35,1.1,hd))*smoothstep(R*1.08,R*1.14,md)*(1.0-smoothstep(R*1.2,R*2.1,md))*0.75);
   extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*step(R*1.3,md));
  }
  extra=max(extra,1.0-smoothstep(0.6,1.6,abs(p.y-hz)));
 }

 float a1=lineAlpha(v1,vd1,w*wmul,cov)*f1;
 float a2=lineAlpha(v2,vd2,w2*wmul,0.0)*f2;
 float keep=step(mod(floor(v1+0.5),3.0),0.5);
 a1*=mix(1.0,keep,sparse);
 float A=max(a1,a2);
 A*=(1.0-clear)*(1.0-clr2);
 A*=mix(1.0,0.25,glass);
 A=max(A,max(extra*(1.0-clear),ruleA));
 A=max(A,rim*(1.0-clear));
 vec3 col=mix(bg,fg,A);
 col=mix(col,fg,solid*(1.0-clear));
 vec3 tc=inkGround?vec3(0.13,0.13,0.125):vec3(1.0);
 col=mix(col,tc,glass*0.45);
 col=mix(col,vec3(1.0),rimL*0.8);
 col=mix(col,fg,rimD*0.35+edge*0.16);
 o=vec4(col,1.0);
}`;

  function startArtsOnly() {
    root.classList.add('no-lines');
    const loop = (now) => { tickArts(now / 1000); requestAnimationFrame(loop); };
    layoutTimeline(); layoutLoop();
    requestAnimationFrame(loop);
  }
  if (!gl) { startArtsOnly(); return; }

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
    startArtsOnly(); return;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const al = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uDpr', 'uTime', 'uMouse', 'uMouseAmt', 'uInvert', 'uSecN', 'uSec', 'uSecB', 'uRectN', 'uRect', 'uKind', 'uHero', 'uTun', 'uCliff', 'uFig',
    'uName', 'uNameOn', 'uGrip', 'uPeakN', 'uPeak', 'uLoop', 'uFig2', 'uBH', 'uMoon', 'uFoot', 'uCode', 'uCodeOn']
    .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  function makeTex(unit) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }
  const nameTex = makeTex(0), codeTex = makeTex(1);
  gl.uniform1i(U.uName, 0); gl.uniform1i(U.uCode, 1);
  function upload(unit, tex, canvas) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); }

  /* ---------- the page model ---------- */
  const SCENE = { tunnel: 0, head: 1, face: 1, cloth: 2, terrain: 3, strata: 4, stream: 5, engrave: 6, contour: 7, blackhole: 8, wrap: 9, ocean: 10 };
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
  const heroId = hero ? hero.querySelector('[data-cliff]') : null;
  const handEl = document.querySelector('[data-hand]');
  const bhEl = document.querySelector('[data-bh]');
  const footEl = document.querySelector('.foot');
  const nav = document.querySelector('.topbar');

  function measureRadii() { plates.forEach((p) => { p.rad = parseFloat(getComputedStyle(p.el).borderTopLeftRadius) || 0; }); }

  /* ---------- the name, drawn only by the spiral's thickness ---------- */
  const nameCanvas = document.createElement('canvas');
  let nameOn = 0;
  function fitName() {
    if (!hero || !n1 || !n1.firstChild) return;
    n1.style.fontSize = '';
    const size = parseFloat(getComputedStyle(n1).fontSize);
    const hs = getComputedStyle(hero);
    const avail = hero.clientWidth - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight);
    const node = n1.firstChild, range = document.createRange();
    let widest = 0; const re = /\S+/g; let m;
    while ((m = re.exec(node.textContent))) { range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length); widest = Math.max(widest, range.getBoundingClientRect().width); }
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
    upload(0, nameTex, nameCanvas);
    nameOn = 1;
  }

  /* ---------- the footer moon: a real Code 128 barcode ---------- */
  const codeCanvas = document.createElement('canvas');
  const CODE = code128B('human-in-loop.dev');
  let codeOn = 0, moon = null;
  function moonGeom() {
    if (!footEl) return null;
    const r = footEl.getBoundingClientRect();
    const hz = r.height * 0.52;
    // on phones the moon grows so the barcode keeps at least about a pixel per module
    const R = r.width < 700 ? Math.min(r.width * 0.33, 150) : clamp(Math.min(r.width * 0.12, r.height * 0.17), 76, 220);
    return { x: r.width * (r.width < 700 ? 0.5 : 0.74), y: hz - R * 1.25, R, hz };
  }
  function drawCode() {
    if (!footEl) return;
    const r = footEl.getBoundingClientRect(); moon = moonGeom();
    const md = Math.min(devicePixelRatio || 1, 2);
    codeCanvas.width = Math.max(1, Math.round(r.width * md)); codeCanvas.height = Math.max(1, Math.round(r.height * md));
    const c = codeCanvas.getContext('2d');
    c.setTransform(md, 0, 0, md, 0, 0); c.clearRect(0, 0, r.width, r.height);
    c.font = '100px "Libre Barcode 128"';
    const w100 = c.measureText(CODE).width; if (!w100) return;
    const size = 100 * (moon.R * 1.56) / w100;
    c.font = `${size}px "Libre Barcode 128"`;
    const mt = c.measureText(CODE);
    const barH = (mt.actualBoundingBoxAscent || size * 0.7) + (mt.actualBoundingBoxDescent || 0);
    const k = (moon.R * 0.82) / Math.max(barH, 1);
    c.save(); c.translate(moon.x - mt.width / 2, moon.y); c.scale(1, k);
    c.fillStyle = '#fff'; c.textBaseline = 'alphabetic';
    c.fillText(CODE, 0, (mt.actualBoundingBoxAscent - (mt.actualBoundingBoxDescent || 0)) / 2);
    c.restore();
    upload(1, codeTex, codeCanvas);
    codeOn = 1;
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
    Promise.all([document.fonts.load('700 100px "Kalnia"'), document.fonts.load('400 20px "Workbench"'), document.fonts.load('100px "Libre Barcode 128"'), document.fonts.load('15px "Michroma"')])
      .then(() => { relayoutPending = true; }).catch(() => {});
  }

  /* ---------- per-frame state ---------- */
  const secBuf = new Float32Array(48), secBBuf = new Float32Array(48);
  const rectBuf = new Float32Array(96), kindBuf = new Float32Array(96), peakBuf = new Float32Array(32);
  const smooth = (x) => x * x * (3 - 2 * x);
  const bh = { x: 0, y: 0, lift: 0, init: false };

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
      const tu = narrow ? 0.5 : 0.36, tv = narrow ? 0.3 : 0.4;
      // the cliff is cut to hold the identity text: its face sits just left of the text, its top just above it
      let tip = narrow ? 0.06 : 0.5, topFrac = narrow ? 0.72 : 0.7;
      if (heroId) {
        const ir = heroId.getBoundingClientRect();
        tip = clamp((ir.left - hr.left - (narrow ? 10 : 46)) / hr.width, 0.02, 0.9);
        topFrac = clamp((ir.top - hr.top - (narrow ? 30 : 44)) / hr.height, 0.3, 0.92);
      }
      gl.uniform4f(U.uHero, hr.left, hr.top, hr.width, hr.height);
      const tcx = hr.left + hr.width * tu, tcy = hr.top + hr.height * tv;
      gl.uniform4f(U.uTun, tcx, tcy, hr.height, prog);
      gl.uniform4f(U.uCliff, tip - 0.035, tip - 0.004, topFrac, tip);
      const size0 = hr.height * (narrow ? 0.05 : 0.07);
      const fx0 = hr.left + hr.width * (tip + 0.012) + (narrow ? 8 : 0), fy0 = hr.top + hr.height * topFrac;
      const e = smooth(prog);
      const fx = lerp(fx0, tcx, e) + Math.sin(prog * 3.2) * hr.width * 0.05;
      const fy = lerp(fy0, tcy + size0 * 0.4, e) - Math.sin(prog * Math.PI) * hr.height * 0.12;
      gl.uniform4f(U.uFig, fx, fy, prog * 3.6, size0 * (1 - 0.82 * e));
      gl.uniform1f(U.uNameOn, nameOn);
    }
    if (handEl) {
      const r = handEl.getBoundingClientRect();
      let gx = r.left + r.width / 2, gy = r.top + Math.min(r.height * 0.2, r.width * 0.5);
      if (HIL.grip && HIL.grip.ok) { gx = HIL.grip.x; gy = HIL.grip.y; }
      gl.uniform4f(U.uGrip, gx, gy, clamp(vw / 26, 30, 58), Math.max(40, r.width * 0.2));
    }
    let k = 0;
    for (const p of peaks) {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      peakBuf.set([r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) * 0.5, p.lift], k * 4); if (++k >= 8) break;
    }
    gl.uniform1i(U.uPeakN, k); gl.uniform4fv(U.uPeak, peakBuf);
    if (contactEl) {
      const sr = contactEl.getBoundingClientRect();
      let cx, cy, R;
      if (contactEl.classList.contains('ring-on') && loopEl) { const r = loopEl.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2; }
      else { R = Math.min(sr.width * 0.3, 140); cx = sr.left + sr.width / 2; cy = sr.top + 96 + R; } // narrow: the loop gets its own space above the heading
      const T = R * 0.15;
      gl.uniform4f(U.uLoop, cx, cy, R, T);
      gl.uniform4f(U.uFig2, cx, cy + (R - T) * 0.97, 0, (R - T) * 0.22); // standing on the inside of the loop, below the text
    }
    if (bhEl) {
      const r = bhEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inside = P.x > r.left && P.x < r.right && P.y > r.top && P.y < r.bottom && P.amt > 0.1;
      const tx = inside ? cx + clamp(P.x - cx, -r.width * 0.3, r.width * 0.3) * 0.4 : cx;
      const ty = inside ? cy + clamp(P.y - cy, -r.height * 0.3, r.height * 0.3) * 0.4 : cy;
      if (!bh.init) { bh.x = tx - cx; bh.y = ty - cy; bh.init = true; }
      bh.x += ((tx - cx) - bh.x) * 0.04; bh.y += ((ty - cy) - bh.y) * 0.04; bh.lift += ((inside ? 1 : 0) - bh.lift) * 0.05;
      const RE = Math.min(r.width, r.height) * 0.19 * (1 + 0.22 * bh.lift);
      gl.uniform4f(U.uBH, cx + bh.x, cy + bh.y, RE, bh.lift);
    }
    if (footEl && moon) {
      const r = footEl.getBoundingClientRect();
      gl.uniform4f(U.uFoot, r.left, r.top, r.width, r.height);
      gl.uniform4f(U.uMoon, r.left + moon.x, r.top + moon.y, moon.R, r.top + moon.hz);
      gl.uniform1f(U.uCodeOn, codeOn);
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
  function relayout() {
    fitName(); measureRadii(); resize(); drawName(); drawCode(); layoutTimeline(); layoutLoop();
    arts.forEach((a) => { a.dirty = true; });
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) { requestAnimationFrame(frame); return; }
    if (!reduce) time += dt;
    if (relayoutPending) { relayoutPending = false; relayout(); }
    const vw = innerWidth, vh = innerHeight;
    P.x += (P.tx - P.x) * 0.14; P.y += (P.ty - P.y) * 0.14; P.amt += ((reduce ? 0 : P.tamt) - P.amt) * 0.06;
    frameParams(vw, vh);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, P.x, P.y); gl.uniform1f(U.uMouseAmt, P.amt); gl.uniform1f(U.uInvert, isDark() ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    HIL.time = time;
    tickArts(time);
    frames++; if (dt > 0.034) slow++;
    if (frames >= 90) { if (slow > 45 && quality > 0.55) { quality -= 0.15; relayoutPending = true; } frames = 0; slow = 0; }
    requestAnimationFrame(frame);
  }
  relayout();
  root.classList.add('lines-live');
  requestAnimationFrame(frame);
})();
