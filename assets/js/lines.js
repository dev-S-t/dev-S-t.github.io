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
    requestAnimationFrame(() => { arts.forEach((a) => { a.dirty = true; }); drawIcons(); });
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
    // VOAG: two faces in profile, a person and the agent, and the call is the space between them (Rubin's vase).
    // Your pointer is the caller's voice. When the caller stops, the agent answers after a short pause.
    voice(c, w, h, t, a) {
      const st = a.state || (a.state = { last: t, px: null, turn: 0, turnT: t - 0.4, quiet: 0, spoke: 0, len: 1.6, hH: new Float32Array(200), hA: new Float32Array(200), acc: 0, ampH: 0, ampA: 0, blinkT: t + 2, gap: 0.24, gapT: -9 });
      const dt = Math.min(0.1, Math.max(0, t - st.last)); st.last = t;
      const p = a.pointer && a.pointer.inside ? a.pointer : null;
      const syll = (x) => 0.3 + 0.7 * Math.abs(Math.sin(x * 7.3)) * Math.abs(Math.sin(x * 2.1 + 1));
      let tH = 0, tA = 0;
      if (p) { const v = st.px ? Math.hypot(p.x - st.px[0], p.y - st.px[1]) / Math.max(dt, 0.016) : 0; st.px = [p.x, p.y]; tH = clamp(v / 700, 0, 1); } else st.px = null;
      const since = t - st.turnT;
      if (st.turn === 0) { // the caller's turn: scripted when nobody is pointing
        if (!p) tH = since > 0.3 && since < 2.4 ? syll(since) : 0;
        if (tH > 0.08) { st.spoke += dt; st.quiet = 0; } else st.quiet += dt;
        if (st.spoke > 0.4 && st.quiet > 0.24) { st.turn = 1; st.turnT = t; st.len = clamp(st.spoke * 0.8, 1, 2.2); st.gap = st.quiet; st.gapT = t; st.spoke = 0; }
      } else { // the agent's turn
        tA = since < st.len ? syll(since + 0.9) : 0;
        if (since > st.len + 0.7) { st.turn = 0; st.turnT = t; st.quiet = 0; }
      }
      st.ampH = lerp(st.ampH, tH, 0.35); st.ampA = lerp(st.ampA, tA, 0.35);
      st.acc += dt * 50; // voice histories, 50 samples a second
      while (st.acc >= 1) { st.acc -= 1; st.hH.copyWithin(1, 0); st.hA.copyWithin(1, 0); st.hH[0] = st.ampH; st.hA[0] = st.ampA; }
      // one face profile, facing right (forehead, brow, eye, nose, lips, chin, neck)
      const PROF = [[0, 0.4], [0.08, 0.5], [0.2, 0.555], [0.3, 0.578], [0.35, 0.556], [0.41, 0.6], [0.5, 0.74], [0.54, 0.66], [0.575, 0.632], [0.6, 0.668], [0.628, 0.622], [0.655, 0.655], [0.71, 0.6], [0.77, 0.646], [0.83, 0.56], [0.9, 0.47], [1, 0.47]];
      const prof = (yn) => {
        let i = 1; while (i < PROF.length - 1 && PROF[i][0] < yn) i++;
        const p0 = PROF[Math.max(0, i - 2)][1], p1 = PROF[i - 1][1], p2 = PROF[i][1], p3 = PROF[Math.min(PROF.length - 1, i + 1)][1];
        const u = clamp((yn - PROF[i - 1][0]) / (PROF[i][0] - PROF[i - 1][0]), 0, 1);
        return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
      };
      const top = h * 0.04, H = h * 0.92, sp = 5;
      const fh = Math.min(H, w * 0.9) * 0.62;
      const gapHalf = Math.max(12, w * 0.03);
      const xb = w / 2 - gapHalf - (0.74 - 0.47) * fh;
      const mouthY = top + H * 0.628, eyeY = top + H * 0.352;
      const xL = (y, open) => { const yn = (y - top) / H; const m = (yn - 0.628) / 0.022; return xb + (prof(yn) - 0.47) * fh - open * fh * 0.05 * Math.exp(-m * m); };
      const q = 6; // the agent is the same face, quantised to a grid
      const xR = (y) => w - Math.round(xL(y, st.ampA) / q) * q;
      const mL = xL(mouthY, 0), mR = w - mL;
      if (t > st.blinkT + 0.15) st.blinkT = t + 2.4 + Math.random() * 3.6;
      const blink = t > st.blinkT && t < st.blinkT + 0.15;
      const eyeX = xL(eyeY, 0) - fh * 0.12, eRx = fh * 0.055, eRy = fh * 0.021;
      const wave = (hist, d, y) => {
        if (d < 0) return 0;
        const i = Math.floor(d / 360 * 50); if (i >= hist.length) return 0;
        const amp = hist[i]; if (amp < 0.02) return 0;
        const sg = 5 + d * 0.3, e = (y - mouthY) / sg;
        return amp * Math.exp(-e * e) * Math.sin(d * 0.34 - t * 11) * 9 * Math.sqrt(8 / sg);
      };
      c.lineCap = 'butt';
      for (let y = top; y <= top + H + 0.1; y += sp) {
        const k = Math.round((y - top) / sp);
        const l = xL(y, st.ampH), r = xR(y);
        // the person: uneven, hand-drawn weight
        c.lineWidth = sp * (0.5 + 0.16 * ((k * 37) % 11) / 10); c.beginPath();
        if (!blink && Math.abs(y - eyeY) < eRy) { const hw = eRx * Math.sqrt(1 - Math.pow((y - eyeY) / eRy, 2)); c.moveTo(0, y); c.lineTo(eyeX - hw, y); c.moveTo(eyeX + hw, y); c.lineTo(l, y); }
        else { c.moveTo(0, y); c.lineTo(l, y); }
        c.stroke();
        // the agent: even weight, in regular cells
        c.lineWidth = sp * 0.56; c.setLineDash([9, 3]); c.beginPath(); c.moveTo(w, y); c.lineTo(r, y); c.stroke(); c.setLineDash([]);
        // the call between them
        c.lineWidth = 0.9; c.beginPath();
        for (let x = l + 3; x <= r - 3; x += 4) { const dy = wave(st.hH, x - mL, y) + wave(st.hA, mR - x, y); if (x === l + 3) c.moveTo(x, y + dy); else c.lineTo(x, y + dy); }
        c.stroke();
      }
      if (!blink) { c.beginPath(); c.arc(eyeX + eRx * 0.3, eyeY, eRy * 0.75, 0, TAU); c.fill(); }
      // the agent's eye: a ring that opens while it speaks
      const ax = w - eyeX, er = eRy * 1.25 + st.ampA * 3;
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(ax, eyeY, er + 4, 0, TAU); c.fill(); c.restore();
      c.lineWidth = 1.3; c.beginPath(); c.arc(ax, eyeY, er, 0, TAU); c.stroke();
      c.beginPath(); c.arc(ax, eyeY, 1.8, 0, TAU); c.fill();
      // the pause before the answer, shown for a moment after each turn
      const shown = t - st.gapT;
      if (shown < 1.8) {
        const gy = top + H * 0.955, gw = Math.max(18, st.gap * 220), gx = w / 2 - gw / 2;
        c.save(); c.globalCompositeOperation = 'destination-out'; c.fillRect(w / 2 - 70, gy - 16, 140, 30); c.restore();
        c.globalAlpha = Math.min(1, (1.8 - shown) * 2);
        c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy - 5); c.lineTo(gx, gy + 5); c.moveTo(gx, gy); c.lineTo(gx + gw, gy); c.moveTo(gx + gw, gy - 5); c.lineTo(gx + gw, gy + 5); c.stroke();
        c.font = '11px Workbench, ui-monospace, monospace'; c.textAlign = 'center'; c.fillText('p95 < 300 ms', w / 2, gy - 7);
        c.globalAlpha = 1;
      }
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
      // the agent sits in the knot where every chat passes; its rings swell as each message goes through
      let pulse = 0;
      for (let i = 0; i < N; i++) { const fm = move((t * 0.32 + i * 0.137) % 1); pulse += Math.exp(-Math.pow((fm - 0.5) / 0.05, 2)); }
      const kx = w * 0.515, ky = h * 0.5;
      c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(kx, ky, 9, 0, TAU); c.fill(); c.restore();
      c.lineWidth = 0.9; c.beginPath();
      for (let k = 0; k < 4; k++) { const r = 12 + k * 4.4 + Math.min(pulse, 1.5) * (1.5 + k * 1.4); c.moveTo(kx + r, ky); c.arc(kx, ky, r, 0, TAU); }
      c.stroke();
      c.beginPath(); c.arc(kx, ky, 3, 0, TAU); c.fill();
      // each group chat the messages are routed into
      c.lineWidth = 1;
      for (let g = 0; g < 3; g++) { const gy = h * (0.2 + 0.3 * g); c.beginPath(); c.arc(w * 0.955, gy, 5.5, 0, TAU); c.stroke(); c.beginPath(); c.arc(w * 0.955, gy, 2, 0, TAU); c.fill(); }
    },
    // Experience: the record in the rock. The engine draws the layers, the faults and the role lenses;
    // this adds the month ticks, the leaders down to each role, and today's line.
    timeline(c, w, h, t, a) {
      const tl = a.tl; if (!tl) return;
      const H = tl.bandH, x1 = tl.x0 + tl.months * tl.pxm;
      c.lineWidth = 1; c.beginPath();
      for (let m = 0; m <= tl.months; m++) { const x = Math.round(tl.x0 + m * tl.pxm) + 0.5; const yr = (tl.startMonth + m) % 12 === 0; c.moveTo(x, H - (yr ? 22 : 10)); c.lineTo(x, H + 1); }
      c.moveTo(tl.x0, H + 0.5); c.lineTo(x1, H + 0.5);
      c.stroke();
      tl.roles.forEach((r) => {
        c.beginPath(); c.arc(r.x0, r.yc, 4, 0, TAU); c.fill();
        if (!tl.leaders || !r.tile) return;
        const tx = r.tile.x + 30, ty = r.tile.y, ey = H + 30;
        c.lineWidth = 1.6; c.beginPath(); c.moveTo(r.x0, r.yc + 4); c.lineTo(r.x0, ey); c.lineTo(tx, ey); c.lineTo(tx, ty); c.stroke();
        c.beginPath(); c.arc(tx, ey, 3, 0, TAU); c.fill();
      });
      const nx = tl.nowX, ny = tl.roles[0] ? tl.roles[0].yc : H / 2, pr = reduce ? 0 : (t % 2.4) / 2.4;
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(nx, 4); c.lineTo(nx, H); c.stroke();
      c.globalAlpha = 1 - pr; c.lineWidth = 1; c.beginPath(); c.arc(nx, ny, 5 + pr * 24, 0, TAU); c.stroke(); c.globalAlpha = 1;
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
    const parse = (v) => { const [y, m] = v.split('-').map(Number); return idx(y, m - 1); };
    const W = tlEl.clientWidth, H = tlEl.clientHeight;
    const pad = parseFloat(getComputedStyle(tlEl.parentElement).paddingLeft) || 24;
    const x0 = pad, pxm = (W - 2 * pad) / months, X = (m) => x0 + m * pxm;
    const tr = tlEl.getBoundingClientRect();
    const roles = [...document.querySelectorAll('.role[data-from]')].map((el, i) => {
      const from = parse(el.dataset.from), to = el.dataset.to === 'now' ? nowF : parse(el.dataset.to) + 1;
      const er = el.getBoundingClientRect();
      return { el, x0: X(from), x1: X(to), yc: H * (i === 0 ? 0.64 : 0.27), hh: H * (i === 0 ? 0.2 : 0.1), tile: { x: er.left - tr.left, y: er.top - tr.top } };
    });
    tlArt.tl = { months, x0, pxm, nowX: X(nowF), startMonth: origin.m, roles, bandH: H, leaders: W >= 900, yearX: X(idx(2026, 0)) };
    tlEl.querySelectorAll('[data-year]').forEach((el) => { el.style.left = Math.max(x0 + 40, X(idx(Number(el.dataset.year), 0))) + 'px'; });
    tlArt.dirty = true;
  }

  /* ---------- contact: the links ride an orbit under the black hole on wide screens ---------- */
  const contactEl = document.getElementById('contact');
  const orbitEl = document.querySelector('[data-orbit]');
  const coreEl = contactEl ? contactEl.querySelector('.contact-core') : null;
  const ORBIT = [150, 125, 90, 55, 30]; // degrees below the hole's centre line
  function layoutOrbit() {
    if (!contactEl || !orbitEl || !coreEl) return;
    const items = [...orbitEl.children];
    contactEl.classList.remove('orbit-on');
    items.forEach((li) => { li.style.left = ''; li.style.top = ''; });
    const W = contactEl.clientWidth;
    if (W < 1000) return;
    contactEl.classList.add('orbit-on');
    const rs = coreEl.offsetWidth / 1.6;
    const cx = coreEl.offsetLeft + coreEl.offsetWidth / 2, cy = coreEl.offsetTop + coreEl.offsetHeight / 2;
    const pad = parseFloat(getComputedStyle(contactEl).paddingLeft) || 24;
    const ea = Math.min(W / 2 - pad - 40, rs * 2.9), eb = rs * 1.62;
    items.forEach((li, i) => {
      const ang = ORBIT[i % ORBIT.length] * Math.PI / 180, lw = li.offsetWidth;
      li.style.left = clamp(cx + Math.cos(ang) * ea, pad + lw / 2, W - pad - lw / 2) + 'px';
      li.style.top = (cy + Math.sin(ang) * eb * (i === 2 ? 1.12 : 1)) + 'px';
    });
  }

  /* ---------- marks of tools, drawn as lines from the open Simple Icons set ---------- */
  const icons = [...document.querySelectorAll('canvas.lic[data-icon]')].map((cv) => ({ cv, slug: cv.dataset.icon, mask: null, hover: 0, thover: 0 }));
  let drawIcons = () => {};
  if (icons.length && window.fetch && window.Promise) {
    root.classList.add('icons-on');
    const VER = { linkedin: 13 }; // LinkedIn left the set after version 13
    const masks = new Map();
    const loadMask = (slug) => {
      if (masks.has(slug)) return masks.get(slug);
      const pr = fetch('https://cdn.jsdelivr.net/npm/simple-icons@' + (VER[slug] || 16) + '/icons/' + slug + '.svg')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(slug))))
        .then((svg) => new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }))
        .then((img) => {
          const S = 96, cv2 = document.createElement('canvas'); cv2.width = cv2.height = S;
          const c2 = cv2.getContext('2d'); c2.drawImage(img, 4, 4, S - 8, S - 8);
          const d = c2.getImageData(0, 0, S, S).data, m = new Float32Array(S * S);
          for (let i = 0; i < S * S; i++) m[i] = d[i * 4 + 3] / 255;
          return { S, m };
        });
      masks.set(slug, pr); return pr;
    };
    // horizontal lines that thicken inside the mark, like the name in the hero
    const drawIcon = (ic, t) => {
      const cv = ic.cv, size = cv.clientWidth; if (!size || !ic.mask) return;
      const dpr = Math.min(devicePixelRatio || 1, 2), px = Math.round(size * dpr);
      if (cv.width !== px) { cv.width = px; cv.height = px; }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, size, size);
      c.fillStyle = getComputedStyle(cv).color;
      const { S, m } = ic.mask, sp = Math.max(2, size / 15), k = S / size, cw = 1 / k;
      c.beginPath();
      for (let y = sp / 2; y < size; y += sp) {
        const r0 = Math.max(0, Math.floor((y - sp / 2) * k)), r1 = Math.min(S - 1, Math.ceil((y + sp / 2) * k));
        const shift = ic.hover * 1.8 * Math.sin(y * 0.8 - t * 8);
        for (let xs = 0; xs < S; xs++) {
          let cov = 0; for (let r = r0; r <= r1; r++) cov += m[r * S + xs]; cov /= (r1 - r0 + 1);
          if (cov < 0.04) continue;
          const th = sp * 0.86 * Math.min(1, cov * 1.15);
          c.rect(xs * cw + shift, y - th / 2, cw + 0.05, th);
        }
      }
      c.fill();
    };
    let animating = false;
    const tick = (now) => {
      const t = now / 1000; let any = false;
      icons.forEach((ic) => { const prev = ic.hover; ic.hover += (ic.thover - ic.hover) * 0.12; if (Math.abs(ic.hover - prev) > 0.002 || ic.hover > 0.01) { any = true; drawIcon(ic, t); } });
      if (any && !reduce) requestAnimationFrame(tick); else animating = false;
    };
    icons.forEach((ic) => {
      const host = ic.cv.closest('li, article') || ic.cv;
      host.addEventListener('pointerenter', () => { ic.thover = 1; if (!animating && !reduce) { animating = true; requestAnimationFrame(tick); } });
      host.addEventListener('pointerleave', () => { ic.thover = 0; });
      loadMask(ic.slug).then((mk) => { ic.mask = mk; drawIcon(ic, 0); }).catch(() => { ic.cv.style.display = 'none'; });
    });
    drawIcons = () => icons.forEach((ic) => drawIcon(ic, 0));
    addEventListener('resize', () => drawIcons());
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
uniform vec4 uTL;uniform vec4 uTLm;uniform vec4 uRA;uniform vec4 uRB;uniform vec4 uSeal;uniform vec4 uSeal2;uniform vec4 uBH2;
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
  vec4 nm=(uNameOn>0.5&&uvN.x>0.0&&uvN.x<1.0&&uvN.y>0.0&&uvN.y<1.0)?texture(uName,uvN):vec4(0.0);
  cov=0.84*nm.r;
  clr2=max(clr2,nm.g);rim=max(rim,nm.b);
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
  // EXPERIENCE: strata. The timeline is a calm band through the rock: each month a small fault,
  // each role a lens where the layers crowd together (the long role thickens as it grew), a clean cut at the new year.
  float sy=pw.y-secTop;
  float tb=smoothstep(uTL.y-70.0,uTL.y+10.0,p.y)*(1.0-smoothstep(uTL.y+uTL.w-10.0,uTL.y+uTL.w+70.0,p.y));
  float fold=(18.0*sin(pw.x/340.0+sy/560.0)+8.0*sin(pw.x/113.0-sy/260.0)+n*30.0)*(1.0-0.92*tb);
  float mo=(p.x-uTLm.x)/max(uTLm.y,1.0);
  float inT=step(0.0,mo)*step(mo,uTLm.z);
  float fault=tb*inT*(hash(vec2(floor(mo),3.7))-0.5)*6.0;
  float g=0.0,lens=0.0;
  if(uRA.y>uRA.x){
   float wx=smoothstep(uRA.x-4.0,uRA.x+22.0,p.x)*(1.0-smoothstep(uRA.y-4.0,uRA.y+14.0+5.0*sn(vec2(p.y/9.0,t*0.7)),p.x));
   float q=clamp((p.x-uRA.x)/max(uRA.y-uRA.x,1.0),0.0,1.0);
   float hh=uRA.w*mix(0.16,1.0,pow(q,0.75))*(1.0+0.05*sin(t*1.4));
   float dy1=(p.y-uRA.z)/hh;g+=wx*2.8*hh*tanh(dy1)*exp(-dy1*dy1/14.0);
   lens=max(lens,wx*(1.0-smoothstep(hh*0.85,hh*1.1,abs(p.y-uRA.z))));
  }
  if(uRB.y>uRB.x){
   float wx=smoothstep(uRB.x-4.0,uRB.x+14.0,p.x)*(1.0-smoothstep(uRB.y-14.0,uRB.y+4.0,p.x));
   float dy2=(p.y-uRB.z)/uRB.w;g+=wx*2.8*uRB.w*tanh(dy2)*exp(-dy2*dy2/14.0);
   lens=max(lens,wx*(1.0-smoothstep(uRB.w*0.85,uRB.w*1.1,abs(p.y-uRB.z))));
  }
  float u=sy+fold+fault+g;
  v1=u/8.5+6.0*sin(u/75.0)*(1.0-tb)+bump;vd1=v1;w=wvar*0.9*(1.0+0.9*lens);
  clr2=max(clr2,tb*inT*(1.0-smoothstep(0.8,2.2,abs(p.x-uTLm.w))));
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
  // CONTACT: a black hole seen almost edge-on (after Gargantua in Interstellar), made only of lines.
  // The disk is streaks on circular orbits turning at Kepler speed; its far side is bent over the top of the
  // shadow by gravity (with a thin copy underneath); the photon ring edges the shadow. The heading sits in the shadow.
  vec2 C=uBH.xy;float Rs=uBH.z;float k=uBH2.x;float spin=uBH.w;
  vec2 dp=p-C;float r=length(dp);
  vec2 d=rot(uBH2.y)*dp;
  float shadow=1.0-smoothstep(Rs-0.8,Rs+0.8,r);
  float rin=Rs*1.45,rout=Rs*4.4;
  vec2 q=vec2(d.x,d.y/k);float rho=length(q);float ph=atan(q.y,q.x);
  float disk=smoothstep(rin,rin*1.05,rho)*(1.0-smoothstep(rout*0.7,rout,rho));
  float near=step(0.0,d.y);
  float lane=log(max(rho,1.0)/rin)*rin/2.6;float li=floor(lane);
  float h1=hash(vec2(li,1.3)),h2=hash(vec2(li,8.1));
  float s1=fract(ph*(2.0+floor(h1*7.0))*0.15915494-spin*pow(rin/max(rho,1.0),1.5)*(0.7+0.6*h1)+h1*9.0);
  float dash=smoothstep(0.0,0.02,s1)*(1.0-smoothstep(0.3+0.55*h2,0.34+0.55*h2,s1));
  v2=lane;vd2=lane;
  f2=disk*mix(1.0,dash,mix(0.45,0.85,smoothstep(rin,rin*2.2,rho)))*mix(1.0-shadow,1.0,near);
  w2=mix(2.3,0.55,smoothstep(rin,rout,rho))*(1.0+0.45*clamp(-d.x/(Rs*3.0),-1.0,1.0));
  float al=atan(-d.y,d.x);float sa=sin(al);
  float T=Rs*(sa>0.0?(0.12+0.62*pow(sa,1.3)):(0.04+0.06*sa*sa));
  float e=r-Rs*1.035;
  float arc=step(0.0,e)*(1.0-smoothstep(T*0.85,T,e));
  float rl=rin+(e/max(T,1.0))*(rout-rin)*0.42;
  float lane2=log(max(rl,1.0)/rin)*rin/2.4;float lj=floor(lane2);
  float g1=hash(vec2(lj,4.4)),g2=hash(vec2(lj,2.2));
  float s2=fract(al*(2.0+floor(g1*7.0))*0.15915494+spin*pow(rin/rl,1.5)*(0.7+0.6*g1)+g1*5.0);
  float dash2=smoothstep(0.0,0.02,s2)*(1.0-smoothstep(0.35+0.5*g2,0.39+0.5*g2,s2));
  v1=lane2;vd1=lane2;
  f1=arc*mix(1.0,dash2,0.75)*(1.0-f2*near);
  w=mix(1.6,0.7,clamp(e/max(T,1.0),0.0,1.0));
  extra=max(extra,1.0-smoothstep(0.5,1.6,abs(r-Rs*1.012)));
  extra=max(extra,(1.0-smoothstep(0.3,1.0,abs(r-Rs*1.03)))*0.4);
  extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*(1.0-shadow)*(1.0-arc)*(1.0-disk));
 }else if(scene==9){
  // RESUME: a guilloche seal, like the security printing on a certificate. Two rosettes interfere; the second
  // one's centre follows the pointer, so moire fringes sweep through the seal. As the pointer comes close, a
  // download arrow printed as a half-line shift appears in the rings. The seal's centre is the download link.
  vec2 C=uSeal.xy;float R=uSeal.z;
  vec2 d=pw-C;float r=length(d);float a=atan(d.y,d.x);
  if(r<R*1.05){
   vec2 d2=pw-C-uSeal2.xy;float r2=length(d2);float a2=atan(d2.y,d2.x);
   float env=(1.0-smoothstep(R*0.95,R*0.985,r))*smoothstep(R*0.25,R*0.28,r);
   vec2 u=d/R;
   float ad=min(sdSeg(u,vec2(0.0,-0.66),vec2(0.0,0.24)),min(sdSeg(u,vec2(-0.3,-0.05),vec2(0.0,0.26)),sdSeg(u,vec2(0.3,-0.05),vec2(0.0,0.26))));
   ad=min(ad,sdSeg(u,vec2(-0.46,0.6),vec2(0.46,0.6)));
   float lat=(1.0-smoothstep(0.08,0.1,ad))*uSeal.w;
   v1=(r+R*0.05*sin(9.0*a+r/(R*0.09)+uSeal2.z))/5.4;vd1=r/5.4;
   v2=(r2+R*0.05*sin(9.0*a2-r2/(R*0.09)+3.14159-uSeal2.z))/5.4+0.5*lat;vd2=r2/5.4;
   f1=env;f2=env;w=0.7;w2=0.7;
  }else{
   float sy=pw.y-secTop;
   v1=(sy+n*34.0+9.0*sin(pw.x/180.0))/10.0+bump;vd1=v1;
   f1=smoothstep(R*1.05,R*1.35,r);w=wvar*0.8;
  }
  extra=max(extra,1.0-smoothstep(0.4,1.2,abs(r-R)));
  extra=max(extra,1.0-smoothstep(0.3,1.0,abs(r-R*1.028)));
  extra=max(extra,(1.0-smoothstep(0.3,1.0,abs(r-R*0.245)))*0.85);
 }else{
  // FOOTER: a night ocean. A small moon rises at the left edge, part below the water; the barcode on the
  // horizon (in the page) throws its reflection on the waves.
  float hz=uMoon.w;float dy=pw.y-hz;
  vec2 mc=uMoon.xy;float R=uMoon.z;
  if(dy>0.0){
   float Z=620.0/(dy+4.0);float X=(pw.x-mc.x)/(dy+4.0)*0.7;
   float H=0.35*sin(X*1.3+Z*0.9-t*1.2)+0.22*sin(-X*2.1+Z*1.4-t*0.9)+0.12*sin(X*3.7+Z*2.6-t*1.7);
   v1=Z*1.5+H*1.3+bump*0.3;vd1=Z*1.5;
   float path=exp(-pow((pw.x-mc.x)/(R*(0.8+dy/220.0)),2.0));
   vec2 mu=(vec2(pw.x+H*6.0,hz-dy*0.9)-uFoot.xy)/uFoot.zw;
   float bar=(uCodeOn>0.5&&mu.x>0.0&&mu.x<1.0&&mu.y>0.0&&mu.y<1.0)?texture(uCode,mu).r:0.0;
   bar*=1.0-smoothstep(10.0,150.0,dy);
   w=wvar*(1.0+1.8*path+2.4*bar);
   v2=v1*2.7;vd2=vd1*2.7;f2=max(path*0.85,bar*0.8);w2=0.9;
  }else{
   f1=0.0;
   float md=length(p-mc);
   solid=1.0-smoothstep(R-0.8,R+0.8,md);
   float halo=md/6.0;float hd=abs(fract(halo+0.5)-0.5)*6.0;
   extra=max(extra,(1.0-smoothstep(0.35,1.1,hd))*smoothstep(R*1.1,R*1.16,md)*(1.0-smoothstep(R*1.3,R*2.6,md))*0.8);
   extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*step(R*1.35,md));
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
    layoutTimeline(); layoutOrbit();
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
    'uName', 'uNameOn', 'uGrip', 'uPeakN', 'uPeak', 'uTL', 'uTLm', 'uRA', 'uRB', 'uSeal', 'uSeal2', 'uBH', 'uBH2', 'uMoon', 'uFoot', 'uCode', 'uCodeOn']
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
  const SCENE = { tunnel: 0, head: 1, face: 1, cloth: 2, terrain: 3, strata: 4, stream: 5, engrave: 6, contour: 7, blackhole: 8, seal: 9, ocean: 10 };
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
  const sealEl = document.querySelector('[data-seal]');
  const n2 = hero ? hero.querySelector('.n2') : null;
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
    if (!n2 || !root.classList.contains('lines-live')) return;
    n2.style.left = ''; n2.style.top = '';
    const fsz = parseFloat(getComputedStyle(n1).fontSize);
    n2.style.fontSize = (fsz * 0.34).toFixed(2) + 'px';
    const hr2 = n1.parentElement.getBoundingClientRect();
    const words = []; re.lastIndex = 0;
    while ((m = re.exec(node.textContent))) { range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length); words.push(range.getBoundingClientRect()); }
    if (!words.length) return;
    const w2 = n2.offsetWidth, gap = fsz * 0.14, first = words[0], last = words[words.length - 1];
    if (first.right - hr2.left + gap + w2 <= hr2.width) {
      n2.style.left = (first.right - hr2.left + gap) + 'px';
      n2.style.top = (first.top - hr2.top + fsz * 0.05) + 'px';
    } else {
      n2.style.left = (hr2.width - w2) + 'px';
      n2.style.top = (last.bottom - hr2.top + fsz * 0.04) + 'px';
    }
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
    c.fillStyle = '#f00'; c.strokeStyle = '#f00'; c.lineJoin = 'round'; c.lineWidth = size * 0.022; c.textBaseline = 'alphabetic';
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
    // the handle: green is cut out of the spiral, blue is its fine outline
    if (n2 && n2.firstChild && root.classList.contains('lines-live')) {
      const r2 = n2.getBoundingClientRect(), cs2 = getComputedStyle(n2), s2 = parseFloat(cs2.fontSize);
      const stretch2 = parseFloat(cs2.fontStretch) >= 120 ? 'expanded' : 'normal';
      c.font = cs2.fontStyle + ' ' + cs2.fontWeight + ' ' + stretch2 + ' ' + cs2.fontSize + ' ' + cs2.fontFamily;
      if ('fontStretch' in c) c.fontStretch = stretch2;
      if ('letterSpacing' in c) c.letterSpacing = cs2.letterSpacing === 'normal' ? '0px' : cs2.letterSpacing;
      const mt2 = c.measureText(n2.textContent);
      const asc2 = mt2.fontBoundingBoxAscent || s2 * 0.8, desc2 = mt2.fontBoundingBoxDescent || s2 * 0.2;
      const b2 = r2.top - hr.top + (r2.height - (asc2 + desc2)) / 2 + asc2;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = '#0f0'; c.fillText(n2.textContent, r2.left - hr.left, b2);
      c.strokeStyle = '#00f'; c.lineWidth = 1.3; c.strokeText(n2.textContent, r2.left - hr.left, b2);
      c.globalCompositeOperation = 'source-over';
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
    // a tenth of the moon is past the left edge and a fiftieth is under the water
    const R = clamp(Math.min(r.width * 0.075, r.height * 0.11), 40, 120);
    return { x: R * 0.8, y: hz - R + R * 0.04, R, hz };
  }
  function drawCode() {
    if (!footEl) return;
    const r = footEl.getBoundingClientRect(); moon = moonGeom();
    const md = Math.min(devicePixelRatio || 1, 2);
    codeCanvas.width = Math.max(1, Math.round(r.width * md)); codeCanvas.height = Math.max(1, Math.round(r.height * md));
    const c = codeCanvas.getContext('2d');
    c.setTransform(md, 0, 0, md, 0, 0); c.clearRect(0, 0, r.width, r.height);
    // same box as .foot::after: right: var(--pad); bottom: 48% + 34px; font-size clamp(46px, 5.6vw, 88px)
    const fsz = clamp(innerWidth * 0.056, 46, 88);
    c.font = fsz + 'px "Libre Barcode 128"';
    const cw = c.measureText(CODE).width; if (!cw) return;
    footEl.style.setProperty('--code-w', cw.toFixed(1) + 'px');
    const pad = parseFloat(getComputedStyle(footEl).paddingRight) || 24;
    c.fillStyle = '#fff'; c.textBaseline = 'bottom';
    c.fillText(CODE, r.width - pad - cw, r.height * 0.52 - 34 + fsz * 0.39);
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
  const bh = { lift: 0, spin: 0 };
  const seal = { x: 0, y: 0, show: 0 };

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
    if (tlEl && tlArt && tlArt.tl) {
      const r = tlEl.getBoundingClientRect(), tl = tlArt.tl, R0 = tl.roles[0], R1 = tl.roles[1];
      gl.uniform4f(U.uTL, r.left, r.top, r.width, r.height);
      gl.uniform4f(U.uTLm, r.left + tl.x0, tl.pxm, tl.months, r.left + tl.yearX);
      if (R0) gl.uniform4f(U.uRA, r.left + R0.x0, r.left + R0.x1, r.top + R0.yc, R0.hh); else gl.uniform4f(U.uRA, 0, 0, 0, 1);
      if (R1) gl.uniform4f(U.uRB, r.left + R1.x0, r.left + R1.x1, r.top + R1.yc, R1.hh); else gl.uniform4f(U.uRB, 0, 0, 0, 1);
    }
    if (coreEl) {
      const cr = coreEl.getBoundingClientRect(), sr = contactEl.getBoundingClientRect();
      // phones: the heading sits above the hole rather than inside its shadow
      const narrowC = sr.width < 700;
      const Rs = narrowC ? sr.width * 0.3 : cr.width / 1.6, cx = cr.left + cr.width / 2, cy = narrowC ? cr.bottom + Rs * 1.45 : cr.top + cr.height / 2;
      const near = Math.hypot(P.x - cx, P.y - cy) < Rs * 2.2 && P.amt > 0.1 ? 1 : 0;
      bh.lift += (near - bh.lift) * 0.04;
      bh.spin += (reduce ? 0 : 1 / 60) * (0.5 + 0.9 * bh.lift);
      // scrolling through the section opens the disk a little, as if the view rose above its plane
      const prog = clamp((vh - sr.top) / (vh + sr.height), 0, 1);
      const px = P.amt > 0.1 ? clamp((P.x - cx) / vw, -0.5, 0.5) * 24 : 0, py = P.amt > 0.1 ? clamp((P.y - cy) / vh, -0.5, 0.5) * 16 : 0;
      gl.uniform4f(U.uBH, cx + px * 0.5, cy + py * 0.5, Rs, bh.spin);
      gl.uniform4f(U.uBH2, lerp(0.11, 0.2, prog), lerp(-0.075, -0.025, prog), bh.lift, 0);
    }
    if (sealEl) {
      const r = sealEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width * 0.48;
      const dx = P.x - cx, dy = P.y - cy, dist = Math.hypot(dx, dy);
      const on = P.amt > 0.1 && dist < R * 1.6;
      // near the centre the rosettes line up and the arrow shows; further out they slide apart into moire
      const pull = on ? clamp((dist - R * 0.25) / (R * 1.2), 0, 1) : 0;
      const tx = on ? (dx / Math.max(dist, 1)) * R * 0.07 * pull : Math.cos(time * 0.21) * R * 0.025;
      const ty = on ? (dy / Math.max(dist, 1)) * R * 0.07 * pull : Math.sin(time * 0.17) * R * 0.025;
      seal.x += (tx - seal.x) * 0.06; seal.y += (ty - seal.y) * 0.06;
      seal.show += ((on && dist < R * 0.7 ? 1 : 0) - seal.show) * 0.05;
      gl.uniform4f(U.uSeal, cx, cy, R, seal.show);
      gl.uniform4f(U.uSeal2, seal.x, seal.y, time * 0.05, 0);
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
    fitName(); measureRadii(); resize(); drawName(); drawCode(); layoutTimeline(); layoutOrbit();
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
  root.classList.add('lines-live');
  relayout();
  requestAnimationFrame(frame);
})();
