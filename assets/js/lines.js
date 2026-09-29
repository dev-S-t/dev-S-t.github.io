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
    syncToggle();
    requestAnimationFrame(() => { arts.forEach((a) => { a.dirty = true; }); drawIcons(); });
  });
  syncToggle();

  /* ---------- loader: leaves once the fonts are in and a few frames have drawn (at least 0.9 s, at most 4 s) ---------- */
  (() => {
    if (!root.classList.contains('is-loading')) return;
    const start = performance.now();
    const frames = (n) => new Promise((res) => { const f = () => (--n <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const ready = fonts.then(() => frames(4)).then(() => new Promise((res) => setTimeout(res, Math.max(0, 900 - (performance.now() - start)))));
    Promise.race([ready, new Promise((res) => setTimeout(res, 4000))]).then(() => {
      if (!root.classList.contains('is-loading')) return;
      // first the rings travel to the centre of the hero's rings (when the hero is on screen), then they open outward
      const svgEl = document.querySelector('.loader svg');
      const tun = window.__HIL && window.__HIL.tunnel;
      let dx = 0, dy = 0;
      if (tun && tun.y > 0 && tun.y < innerHeight && tun.x > 0 && tun.x < innerWidth) { dx = tun.x - innerWidth / 2; dy = tun.y - innerHeight / 2; }
      const travel = !reduce && svgEl && Math.hypot(dx, dy) > 2 ? 650 : 0;
      if (travel) { svgEl.style.setProperty('--dx', dx.toFixed(1) + 'px'); svgEl.style.setProperty('--dy', dy.toFixed(1) + 'px'); }
      setTimeout(() => {
        root.classList.remove('is-loading'); root.classList.add('is-leaving');
        setTimeout(() => root.classList.remove('is-leaving'), 950);
      }, travel);
    });
  })();

  /* ---------- navigation: full island while the links fit, a compact island with a Menu sheet once they don't ---------- */
  root.classList.add('nav-js');
  const navEl = document.querySelector('.topbar'), navList = document.getElementById('nav-list'), menuBtn = document.querySelector('.menu-toggle');
  function fitNav() {
    if (!navEl || !navList || !menuBtn) return;
    const wasOpen = navEl.classList.contains('open');
    navEl.classList.remove('compact', 'no-brand');
    navList.scrollLeft = 0;
    // 1) full island: the llms links may slide out of view to the right, the section links must all show
    const links = [...navList.children].filter((li) => !li.classList.contains('agents'));
    const last = links[links.length - 1];
    const fits = !last || last.getBoundingClientRect().right <= navList.getBoundingClientRect().right + 0.5;
    if (!fits) {
      // 2) compact island: mark, human-in-loop.dev, Menu, theme; 3) once the name no longer fits, mark, Menu, theme
      navEl.classList.add('compact');
      const brand = navEl.querySelector('.brand');
      const tog = navEl.querySelector('.theme-toggle'), nr = navEl.getBoundingClientRect();
      const crowded = (brand && brand.getBoundingClientRect().right > menuBtn.getBoundingClientRect().left - 12) || (tog && tog.getBoundingClientRect().right > nr.right - 4);
      if (brand && crowded) navEl.classList.add('no-brand');
    }
    if (!navEl.classList.contains('compact') && wasOpen) setMenu(false);
  }
  function setMenu(open) {
    if (!navEl || !menuBtn) return;
    navEl.classList.toggle('open', open);
    // the island drops its blur while the sheet is out (a filter would trap the fixed sheet inside it), also while it closes
    navEl.classList.add('menu-out'); clearTimeout(setMenu.t);
    if (!open) setMenu.t = setTimeout(() => navEl.classList.remove('menu-out'), 520);
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { const a = navList.querySelector('a'); if (a) setTimeout(() => a.focus({ preventScroll: true }), 60); }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => { const open = !navEl.classList.contains('open'); setMenu(open); if (!open) menuBtn.focus(); });
    navList.addEventListener('click', (e) => { if (e.target.closest('a') && navEl.classList.contains('open')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && navEl.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
    addEventListener('resize', fitNav);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
    fitNav();
  }

  /* ---------- pointer ---------- */
  // On a mouse the pointer is the cursor. On a touch screen it is the last touch, and it stays there (the eye keeps
  // looking at it, the head turns to it, the resume peels toward it as the page scrolls past); before the first touch
  // it rests at the centre of the screen. The line field only dents under a touch for a moment after it.
  const P = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0, touch: false, fresh: 0 };
  const coarse = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  if (coarse) { P.touch = true; P.tx = P.x = innerWidth / 2; P.ty = P.y = innerHeight * 0.5; P.tamt = 1; }
  const onPointer = (e) => {
    P.tx = e.clientX; P.ty = e.clientY;
    if (P.x < -9000) { P.x = P.tx; P.y = P.ty; }
    P.tamt = 1;
    P.touch = e.pointerType === 'touch' || e.pointerType === 'pen';
    if (P.touch) P.fresh = 1;
  };
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget && !P.touch) P.tamt = 0; });

  // shared with models.js
  const HIL = window.__HIL = { P, isDark, reduced: () => reduce, grip: null };
  Object.defineProperty(HIL, 'artCosts', { get: () => arts.filter((a) => a.visible).map((a) => a.kind + ' ' + (a.cost || 0).toFixed(2) + 'ms') });

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
    // VOAG: voice waveforms stacked like a ridgeline, each hiding the ones behind it (the first draft's drawing).
    // The pointer lifts the lines under it.
    voice(c, w, h, t, a) {
      const L = Math.round(clamp(h / 15, 16, 34)), top = h * 0.2, sp = (h * 0.76) / L, amp = h * 0.24;
      const R = rng(11);
      const seeds = Array.from({ length: L }, () => [R() * 100, R() * 100, R() * 100]);
      const px = a.pointer;
      const tt = reduce ? 0 : t;
      const ground = a.ground || '#F3F1EC';
      c.lineJoin = 'bevel';
      for (let k = 0; k < L; k++) {
        const base = top + k * sp, sd = seeds[k], pts = [];
        for (let x = 0; x <= w + 4; x += 4) {
          const u = x / w, env = Math.exp(-(((u - 0.5) / 0.2) ** 2));
          let v = 0.55 + 0.25 * Math.sin(x * 0.045 + sd[0] + tt * 1.6) + 0.2 * Math.sin(x * 0.11 + sd[1] - tt * 2.3) + 0.12 * Math.sin(x * 0.27 + sd[2] + tt * 3.1);
          v = Math.max(0, v) ** 2.2;
          let lift = 0;
          if (px && px.inside) lift = 0.9 * Math.exp(-(((x - px.x) / 34) ** 2)) * Math.exp(-(((base - px.y) / 60) ** 2));
          pts.push(x, base - amp * env * v - amp * lift - 1.5 * Math.sin(x * 0.6 + k));
        }
        const floor = Math.min(h, base + sp * 1.5 + 3);
        c.beginPath(); c.moveTo(0, floor); for (let n = 0; n < pts.length; n += 2) c.lineTo(pts[n], pts[n + 1]); c.lineTo(w, floor); c.closePath();
        c.fillStyle = ground; c.fill();
        c.beginPath(); c.moveTo(pts[0], pts[1]); for (let n = 2; n < pts.length; n += 2) c.lineTo(pts[n], pts[n + 1]);
        c.lineWidth = 1.1; c.stroke();
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
      if (st.born == null) st.born = t;
      const bt = t - st.born - 3.2; // the first blink waits 3.2 s after the eye first appears, then one every 6 s
      const blink = reduce || bt < 0 ? 1 : Math.max(0.08, Math.min(1, Math.abs(Math.sin(bt * 0.52)) * 6));
      c.save();
      c.beginPath(); c.moveTo(cx - ew, cy); c.quadraticCurveTo(cx, cy - eh * 2 * blink, cx + ew, cy); c.quadraticCurveTo(cx, cy + eh * 2 * blink, cx - ew, cy); c.closePath();
      c.lineWidth = 1.6; c.stroke(); c.clip();
      const ir = eh * 1.05, ix = cx + st.ox, iy = cy + st.oy;
      // the iris and the hatching never change shape: they are drawn once (per size, density and colour) and placed
      const dprE = a.dpr || 1, key = [w, h, dprE, a.fg].join('|');
      if (!st.cache || st.key !== key) {
        st.key = key;
        const R = Math.ceil(ir + 2), iris = document.createElement('canvas'); iris.width = iris.height = Math.ceil(R * 2 * dprE);
        const ic = iris.getContext('2d'); ic.scale(dprE, dprE); ic.strokeStyle = a.fg; ic.fillStyle = a.fg;
        ic.lineWidth = 0.8; ic.beginPath();
        for (let r = 4; r < ir; r += 3.2) { ic.moveTo(R + r, R); ic.arc(R, R, r, 0, TAU); }
        ic.stroke(); ic.beginPath(); ic.arc(R, R, ir * 0.36, 0, TAU); ic.fill();
        const hatch = document.createElement('canvas'); hatch.width = Math.ceil(w * dprE); hatch.height = Math.ceil(h * dprE);
        const hc = hatch.getContext('2d'); hc.scale(dprE, dprE); hc.strokeStyle = a.fg; hc.lineWidth = 0.6; hc.globalAlpha = 0.18; hc.beginPath();
        for (let x = cx - ew; x < cx + ew; x += 5) { hc.moveTo(x, cy - eh * 2); hc.lineTo(x + 8, cy + eh * 2); }
        hc.stroke();
        st.cache = { iris, R, hatch };
      }
      c.drawImage(st.cache.iris, ix - st.cache.R, iy - st.cache.R, st.cache.R * 2, st.cache.R * 2);
      c.drawImage(st.cache.hatch, 0, 0, w, h);
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
    // Experience: the timeline in the clearing across the rings. One axis from April 2025 to today, a tick at each
    // year, and one line per role under it. The rings around it carry the months.
    timeline(c, w, h, t, a) {
      const tl = a.tl; if (!tl) return;
      const X = (m) => tl.x0 + m * tl.pxm, ay = tl.axisY, nx = X(tl.now);
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(0), ay); c.lineTo(nx, ay);
      c.moveTo(X(tl.yearM), ay - 6); c.lineTo(X(tl.yearM), ay + 6);
      c.stroke();
      c.beginPath(); c.arc(X(0), ay, 3.4, 0, TAU); c.fill();
      tl.roles.forEach((r) => {
        const x0 = X(r.from), x1 = X(Math.min(r.to, tl.now));
        c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0, r.y); c.lineTo(x1, r.y); c.stroke();
        c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, r.y - 5); c.lineTo(x0, r.y + 5); c.moveTo(x1, r.y - 5); c.lineTo(x1, r.y + 5); c.stroke();
      });
      const pr = reduce ? 0 : (t % 2.6) / 2.6;
      c.beginPath(); c.arc(nx, ay, 3.4, 0, TAU); c.fill();
      c.globalAlpha = 1 - pr; c.lineWidth = 1; c.beginPath(); c.arc(nx, ay, 4 + pr * 16, 0, TAU); c.stroke(); c.globalAlpha = 1;
    },
    // Resume: the page itself, drawn as lines of type. Its corner is turned down; the pointer takes the corner and peels
    // the page back, and the sheet underneath carries the download arrow. The whole page is the download link.
    page(c, w, h, t, a) {
      const st = a.state || (a.state = { cx: 0, cy: 0, init: false });
      const g = a.ground || '#F3F1EC';
      const pw = w * 0.84, ph = Math.min(h * 0.9, pw * 1.414), x0 = w * 0.05, y0 = h * 0.035, x1 = x0 + pw, y1 = y0 + ph;
      const C = [x1, y1];
      // where the corner is: turned down a little at rest, following the pointer when it is over the page
      const breathe = reduce ? 0 : Math.sin(t * 0.9) * 0.18;
      let tx = x1 - pw * 0.2 * (1 + breathe * 0.6), ty = y1 - ph * 0.13 * (1 + breathe * 0.6);
      const p = a.pointer && a.pointer.inside ? a.pointer : null;
      if (p) {
        tx = clamp(p.x, x0 + pw * 0.12, x1 - 4); ty = clamp(p.y, y0 + ph * 0.12, y1 - 4);
        // on touch the pointer rests where it was left, so the page peels as it scrolls past it; a gentler peel there
        const dx = tx - C[0], dy = ty - C[1], d = Math.hypot(dx, dy), dm = Math.hypot(pw, ph) * (P.touch ? 0.45 : 0.72);
        if (d > dm) { tx = C[0] + dx / d * dm; ty = C[1] + dy / d * dm; }
      }
      if (!st.init) { st.cx = tx; st.cy = ty; st.init = true; }
      st.cx += (tx - st.cx) * 0.14; st.cy += (ty - st.cy) * 0.14;
      const Pc = [st.cx, st.cy];
      let nx = Pc[0] - C[0], ny = Pc[1] - C[1]; const nd = Math.hypot(nx, ny) || 1; nx /= nd; ny /= nd;
      const M = [(Pc[0] + C[0]) / 2, (Pc[1] + C[1]) / 2];
      const side = (x, y) => (x - M[0]) * nx + (y - M[1]) * ny; // < 0: the corner's side of the fold
      const rect = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const clip = (poly, keepFront) => { // one-line Sutherland-Hodgman
        const outp = [];
        for (let i = 0; i < poly.length; i++) {
          const P0 = poly[i], P1 = poly[(i + 1) % poly.length];
          const s0 = side(P0[0], P0[1]), s1 = side(P1[0], P1[1]);
          const in0 = keepFront ? s0 >= 0 : s0 < 0, in1 = keepFront ? s1 >= 0 : s1 < 0;
          if (in0) outp.push(P0);
          if (in0 !== in1) { const f = s0 / (s0 - s1); outp.push([P0[0] + (P1[0] - P0[0]) * f, P0[1] + (P1[1] - P0[1]) * f]); }
        }
        return outp;
      };
      const path = (poly) => { c.beginPath(); poly.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); };
      const front = clip(rect, true), under = clip(rect, false);
      const flap = under.map((q) => { const s = side(q[0], q[1]); return [q[0] - 2 * s * nx, q[1] - 2 * s * ny]; });
      // the pages underneath, offset: their edges and a hatched shadow
      c.fillStyle = g;
      for (let k = 2; k >= 1; k--) { const o = k * Math.max(4, w * 0.012); c.fillRect(x0 + o, y0 + o, pw, ph); c.lineWidth = 1; c.strokeRect(x0 + o + 0.5, y0 + o + 0.5, pw, ph); }
      c.fillRect(x0, y0, pw, ph);
      const sd = Math.max(10, w * 0.045);
      c.save(); c.beginPath(); c.rect(x0 + pw, y0 + 14, sd, ph + sd - 14); c.rect(x0 + 14, y0 + ph, pw - 14, sd); c.clip();
      c.lineWidth = 0.8; c.beginPath(); for (let d = -h; d < w + h; d += 5) { c.moveTo(d, h); c.lineTo(d + h, 0); } c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1; c.restore();
      // the sheet underneath, where the page has come away: the download arrow, sized to the space uncovered
      if (under.length > 2) {
        let ax = 0, ay = 0, area = 0;
        for (let i = 0; i < under.length; i++) { const P0 = under[i], P1 = under[(i + 1) % under.length]; const cr = P0[0] * P1[1] - P1[0] * P0[1]; area += cr; ax += (P0[0] + P1[0]) * cr; ay += (P0[1] + P1[1]) * cr; }
        area /= 2; if (Math.abs(area) > 1) { ax /= 6 * area; ay /= 6 * area; }
        const sz = Math.min(Math.sqrt(Math.abs(area)) * 0.42, pw * 0.3);
        if (sz > 10) {
          c.save(); path(under); c.clip();
          c.lineWidth = Math.max(1.4, sz * 0.07); c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(ax, ay - sz * 0.55); c.lineTo(ax, ay + sz * 0.25);
          c.moveTo(ax - sz * 0.3, ay - sz * 0.05); c.lineTo(ax, ay + sz * 0.25); c.lineTo(ax + sz * 0.3, ay - sz * 0.05);
          c.moveTo(ax - sz * 0.45, ay + sz * 0.5); c.lineTo(ax + sz * 0.45, ay + sz * 0.5); c.stroke();
          c.restore();
        }
      }
      // the page: its type as lines of words
      c.save(); path(front); c.fillStyle = g; c.fill(); c.clip();
      const R = rng(7), lh = ph * 0.021, mx = x0 + pw * 0.1, mw = pw * 0.8;
      const bar = (x, y, len, th) => { c.fillRect(x, y - th / 2, len, th); };
      c.fillStyle = getComputedStyle(a.cv).color;
      let y = y0 + ph * 0.09;
      bar(mx, y, mw * 0.5, ph * 0.02); y += ph * 0.034;
      bar(mx, y, mw * 0.36, ph * 0.007); y += ph * 0.024;
      for (let x = mx, k = 0; k < 4; k++) { const L2 = mw * (0.12 + R() * 0.1); bar(x, y, L2, ph * 0.004); x += L2 + mw * 0.04; }
      y += ph * 0.03; c.fillRect(mx, y, mw, 1); y += ph * 0.035;
      const sections = [5, 4, 6, 3];
      for (const n of sections) {
        if (y > y1 - ph * 0.08) break;
        bar(mx, y, mw * (0.16 + R() * 0.1), ph * 0.009); y += lh * 1.35;
        for (let i = 0; i < n && y < y1 - ph * 0.06; i++) {
          const bullet = i > 0 && R() < 0.7, x2 = mx + (bullet ? mw * 0.04 : 0);
          if (bullet) c.fillRect(mx + mw * 0.008, y - 1.2, 2.4, 2.4);
          let x = x2; const end = mx + mw * (i === n - 1 ? 0.5 + R() * 0.4 : 0.92 + R() * 0.08);
          while (x < end - 6) { const L2 = Math.min(end - x, 6 + R() * mw * 0.1); bar(x, y, L2, ph * 0.0045); x += L2 + 4 + R() * 3; }
          y += lh;
        }
        y += lh * 0.8;
      }
      c.restore();
      // the fold's shadow on the page: a few lines along the fold
      if (under.length > 2) {
        c.save(); path(front); c.clip();
        const ex = -ny, ey = nx, far = Math.hypot(pw, ph);
        for (let k = 1; k <= 4; k++) {
          const o = k * 3.2; c.lineWidth = 1; c.globalAlpha = 1 - k * 0.2;
          c.beginPath(); c.moveTo(M[0] + nx * o - ex * far, M[1] + ny * o - ey * far); c.lineTo(M[0] + nx * o + ex * far, M[1] + ny * o + ey * far); c.stroke();
        }
        c.globalAlpha = 1; c.restore();
      }
      c.lineWidth = 1.2; path(front); c.stroke();
      // the flap: the back of the paper, hatched across
      if (flap.length > 2) {
        path(flap); c.fillStyle = g; c.fill();
        c.save(); path(flap); c.clip();
        const ex = -ny, ey = nx; c.lineWidth = 0.7; c.beginPath();
        for (let d = -900; d < 900; d += 4.5) { const bx = M[0] + nx * d, by = M[1] + ny * d; c.moveTo(bx - ex * 900, by - ey * 900); c.lineTo(bx + ex * 900, by + ey * 900); }
        c.globalAlpha = 0.55; c.stroke(); c.globalAlpha = 1; c.restore();
        c.lineWidth = 1.4; path(flap); c.stroke();
      }
    },
    // Shortage events down 85%: supply as two lines, each break a shortage. The JIT-only line has twenty; this
    // system's has three. A sweep (or the pointer) runs along them and each break it has passed drops a mark.
    shortage(c, w, h, t, a) {
      const x0 = 6, x1 = w - 6, gw = Math.max(4, (x1 - x0) * 0.012);
      const sweep = a.pointer && a.pointer.inside ? clamp(a.pointer.x, x0, x1) : x0 + ((reduce ? 0.6 : t * 0.12) % 1) * (x1 - x0);
      [[20, h * 0.3, 3, 1.4], [3, h * 0.7, 11, 3.2]].forEach(([g, y, seed, lw]) => {
        const R = rng(seed), gaps = [];
        for (let tries = 0; gaps.length < g && tries < 500; tries++) { const gx = x0 + gw + R() * (x1 - x0 - 2 * gw); if (gaps.every((q) => Math.abs(q - gx) > gw * 2.2)) gaps.push(gx); }
        gaps.sort((p, q) => p - q);
        c.lineWidth = lw; c.beginPath(); let x = x0;
        for (const gx of gaps) { c.moveTo(x, y); c.lineTo(gx - gw / 2, y); x = gx + gw / 2; }
        c.moveTo(x, y); c.lineTo(x1, y); c.stroke();
        c.lineWidth = 1.2; c.beginPath();
        for (const gx of gaps) { if (sweep > gx) { const k = clamp((sweep - gx) / 40, 0, 1); c.moveTo(gx, y + 5); c.lineTo(gx, y + 5 + 14 * k); } }
        c.stroke();
      });
      c.lineWidth = 1; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(sweep, 4); c.lineTo(sweep, h - 4); c.stroke(); c.setLineDash([]);
    },
    // Wastage 11.2% -> 2.5%: a hundred platelet units. Eleven (and a fifth) are wasted, then most are rescued until two
    // and a half remain. The pointer scrubs from before (left) to after (right); otherwise it plays on a loop.
    wastage(c, w, h, t, a) {
      const st = a.state || (a.state = { k: 0 });
      const n = 10, cell = Math.min((w - 8) / n, (h - 8) / n), gx = (w - cell * n) / 2, gy = (h - cell * n) / 2;
      let k; // 0 = before, 1 = after
      if (a.pointer && a.pointer.inside) k = clamp((a.pointer.x - gx) / (cell * n), 0, 1);
      else { const cyc = reduce ? 5 : t % 6.5; k = cyc < 1.4 ? 0 : cyc < 3.2 ? (cyc - 1.4) / 1.8 : cyc < 5.6 ? 1 : 1 - (cyc - 5.6) / 0.9; k = k * k * (3 - 2 * k); }
      st.k = lerp(st.k, k, 0.25);
      const wasted = lerp(11.2, 2.5, st.k);
      // the wasted units, scattered but fixed; the ones rescued first are the last in this order
      const order = st.order || (st.order = (() => { const R = rng(41), o = [...Array(100).keys()]; for (let q = 99; q > 0; q--) { const r = Math.floor(R() * (q + 1)); [o[q], o[r]] = [o[r], o[q]]; } return o.slice(0, 12); })());
      const fillOf = new Map(); order.forEach((u, idx) => fillOf.set(u, clamp(wasted - idx, 0, 1)));
      for (let u = 0; u < 100; u++) {
        const x = gx + (u % n) * cell + cell / 2, y = gy + Math.floor(u / n) * cell + cell / 2;
        const f = fillOf.get(u) || 0;
        if (f > 0.02) { // a wasted unit: a bold cross, as wide as its share
          const r = cell * 0.36 * Math.sqrt(f);
          c.lineWidth = 2.2; c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke();
        } else { c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); }
      }
    },
    // 99.1% of demand met: a heavy ring closed all but 0.9%. A dot keeps going round; at the gap it flashes.
    fulfilment(c, w, h, t) {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4;
      const gap = TAU * 0.009, start = -Math.PI / 2 + gap / 2;
      c.lineWidth = 3.2; c.lineCap = 'butt'; c.beginPath(); c.arc(cx, cy, R, start, start + TAU - gap); c.stroke(); c.lineCap = 'round';
      c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R * 0.72, 0, TAU); c.stroke();
      // the gap's two edges, drawn out past the ring
      c.lineWidth = 1.4; c.beginPath();
      for (const ang of [-Math.PI / 2 - gap / 2, -Math.PI / 2 + gap / 2]) { c.moveTo(cx + Math.cos(ang) * (R - 7), cy + Math.sin(ang) * (R - 7)); c.lineTo(cx + Math.cos(ang) * (R + 9), cy + Math.sin(ang) * (R + 9)); }
      c.stroke();
      const ang = -Math.PI / 2 + ((reduce ? 0.3 : t * 0.22) % 1) * TAU;
      const inGap = Math.abs(((ang + Math.PI / 2 + TAU) % TAU)) < gap * 1.6 || Math.abs(((ang + Math.PI / 2 + TAU) % TAU) - TAU) < gap * 1.6;
      c.beginPath(); c.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, inGap ? 6 : 3.6, 0, TAU);
      if (inGap) { c.lineWidth = 1.4; c.stroke(); } else c.fill();
    },
    // MAE 5.85: demand as points, the forecast as one bold curve through them, each error a short tick.
    // A guide follows the pointer (or sweeps slowly) and enlarges the point it meets.
    mae(c, w, h, t, a) {
      const N = 22, R = rng(21), pts = [];
      const f = (u) => Math.sin(u * 5.2 + 0.4) * 0.28 + Math.sin(u * 1.9) * 0.18;
      for (let q = 0; q < N; q++) { const u = q / (N - 1); pts.push([u, f(u), f(u) + (R() - 0.5) * 0.22]); }
      const X = (u) => 8 + u * (w - 16), Y = (v) => h * (0.5 - v * 0.95);
      c.lineWidth = 2.6; c.beginPath();
      for (let x = 0; x <= w - 16; x += 3) { const u = x / (w - 16); const px = X(u), py = Y(f(u)); if (x === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      c.stroke();
      const gxp = a.pointer && a.pointer.inside ? a.pointer.x : X(((reduce ? 0.62 : t * 0.08) % 1));
      c.lineWidth = 1.1; c.beginPath();
      for (const [u, fc, ac] of pts) { c.moveTo(X(u), Y(fc)); c.lineTo(X(u), Y(ac)); }
      c.stroke();
      let best = 0; pts.forEach((p, q) => { if (Math.abs(X(p[0]) - gxp) < Math.abs(X(pts[best][0]) - gxp)) best = q; });
      for (let q = 0; q < N; q++) { const [u, , ac] = pts[q]; c.beginPath(); c.arc(X(u), Y(ac), q === best ? 5 : 2.6, 0, TAU); if (q === best) { c.lineWidth = 1.6; c.stroke(); } else c.fill(); }
      c.lineWidth = 1; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(gxp, 4); c.lineTo(gxp, h - 4); c.stroke(); c.setLineDash([]);
    },
    // 30 runs, paired: each run is one line from its wastage before (left) to after (right). Every one falls.
    // The mean is bold; the pointer (or a slow sweep) picks out one run.
    runs(c, w, h, t, a) {
      const R = rng(300), runs = [];
      for (let k = 0; k < 30; k++) runs.push([11.2 + (R() - 0.5) * 4.4, 2.5 + (R() - 0.5) * 2.2]);
      const x0 = w * 0.16, x1 = w * 0.84, Y = (v) => h - 10 - (v / 14.5) * (h - 20);
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, 6); c.lineTo(x0, h - 6); c.moveTo(x1, 6); c.lineTo(x1, h - 6); c.stroke();
      let pick = Math.floor(((reduce ? 0.4 : t * 0.35) % 30));
      if (a.pointer && a.pointer.inside) { let bd = 1e9; runs.forEach((r, k) => { const u = clamp((a.pointer.x - x0) / (x1 - x0), 0, 1); const d = Math.abs(lerp(Y(r[0]), Y(r[1]), u) - a.pointer.y); if (d < bd) { bd = d; pick = k; } }); }
      c.lineWidth = 0.7; c.beginPath();
      runs.forEach((r, k) => { if (k === pick) return; c.moveTo(x0, Y(r[0])); c.lineTo(x1, Y(r[1])); });
      c.stroke();
      c.beginPath(); runs.forEach((r) => { c.moveTo(x0 + 2, Y(r[0])); c.arc(x0, Y(r[0]), 2, 0, TAU); c.moveTo(x1 + 2, Y(r[1])); c.arc(x1, Y(r[1]), 2, 0, TAU); }); c.fill();
      const m0 = runs.reduce((q, r) => q + r[0], 0) / 30, m1 = runs.reduce((q, r) => q + r[1], 0) / 30;
      c.lineWidth = 3.4; c.beginPath(); c.moveTo(x0, Y(m0)); c.lineTo(x1, Y(m1)); c.stroke();
      c.beginPath(); c.arc(x0, Y(m0), 4.5, 0, TAU); c.arc(x1, Y(m1), 4.5, 0, TAU); c.fill();
      const pr = runs[pick];
      c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(x0, Y(pr[0])); c.lineTo(x1, Y(pr[1])); c.stroke(); c.setLineDash([]);
    }
  };
  const ANIMATED = new Set(['voice', 'eye', 'tenants', 'enclosure', 'converge', 'timeline', 'page', 'wastage', 'fulfilment', 'shortage', 'mae', 'runs']);

  const arts = [...document.querySelectorAll('canvas[data-emblem], canvas[data-figure], canvas[data-art]')].map((cv) => ({
    cv, kind: cv.dataset.emblem || cv.dataset.figure || cv.dataset.art, ctx: cv.getContext('2d'), dirty: true, visible: false,
    w: 0, h: 0, pointer: null, state: null, tl: null
  }));
  let artsScrolling = false;
  function drawArt(a, t) {
    const fn = DRAW[a.kind]; if (!fn) return;
    // while the page scrolls the drawings paint at 1x (the browser scales them up); sharp again at rest
    const dpr = artsScrolling && !HIL.capable ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    const w = a.cv.clientWidth, h = a.cv.clientHeight; if (!w || !h) return;
    if (a.w !== w || a.h !== h || a.dpr !== dpr) { a.cv.width = Math.round(w * dpr); a.cv.height = Math.round(h * dpr); a.w = w; a.h = h; a.dpr = dpr; }
    const c = a.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    if (a.dirty || !a.fg) { const cs = getComputedStyle(a.cv); a.fg = cs.color; a.ground = cs.getPropertyValue('--g').trim() || '#F3F1EC'; }
    const fg = a.fg;
    c.strokeStyle = fg; c.fillStyle = fg; c.lineCap = 'round'; c.lineJoin = 'round';
    const t0 = performance.now();
    fn(c, w, h, t, a);
    a.cost = (a.cost || 0) * 0.8 + (performance.now() - t0) * 0.2; // ms per draw, smoothed
    a.dirty = false;
  }
  let lastArtW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastArtW) > 2) { lastArtW = innerWidth; arts.forEach((a) => { a.dirty = true; }); } });
  // Animated drawings run at 30 fps and hold still while the page scrolls (they scroll with it), so scrolling
  // never waits on them; new or resized ones are still drawn at once.
  let artDir = 1, artLastY = scrollY, artTurn = 0;
  function tickArts(t, scrollingNow) {
    const vh = innerHeight;
    artsScrolling = !!scrollingNow;
    const dy = scrollY - artLastY; artLastY = scrollY; if (dy) artDir = dy > 0 ? 1 : -1;
    // While scrolling, the drawings in view plus 10% ahead in the scroll direction and 5% behind stay live. They take
    // turns, one per frame (two at rest), so no single frame carries them all and the scroll never hitches.
    const lo = scrollingNow ? (artDir > 0 ? -0.05 : -0.10) * vh : -120, hi = scrollingNow ? vh * (artDir > 0 ? 1.10 : 1.05) : vh + 120;
    const hasPointer = P.tamt > 0 && P.tx > -9000;
    const live = [];
    for (const a of arts) {
      const r = a.cv.getBoundingClientRect();
      const vis = r.bottom > -120 && r.top < vh + 120 && r.width > 0;
      if (vis && !a.visible) a.dirty = true;
      a.visible = vis;
      if (!a.visible) continue;
      // the drawing moves under a still pointer while the page scrolls, so the pointer is measured against it every frame
      a.pointer = hasPointer ? { x: P.tx - r.left, y: P.ty - r.top, inside: P.tx >= r.left && P.tx <= r.right && P.ty >= r.top && P.ty <= r.bottom } : null;
      if (a.dirty) { drawArt(a, t); continue; }
      if (!reduce && ANIMATED.has(a.kind) && r.bottom > lo && r.top < hi) live.push(a);
    }
    if (!live.length) return;
    const per = HIL.capable ? live.length : scrollingNow ? 1 : 2;
    for (let k = 0; k < Math.min(per, live.length); k++) drawArt(live[(artTurn + k) % live.length], t);
    artTurn = (artTurn + per) % Math.max(1, live.length);
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
    const parse = (v) => { const [y, m] = v.split('-').map(Number); return idx(y, m - 1); };
    const W = tlEl.clientWidth;
    const x0 = Math.min(40, W * 0.08), pxm = (W - x0 - Math.min(48, W * 0.1)) / nowF, X = (m) => x0 + m * pxm;
    const axisY = 40, lanes = [74, 100];
    const roles = [...document.querySelectorAll('.role[data-from]')].map((el, i) => ({
      from: parse(el.dataset.from), to: el.dataset.to === 'now' ? nowF : parse(el.dataset.to) + 1, y: lanes[i % 2]
    }));
    tlArt.tl = { x0, pxm, now: nowF, roles, axisY, yearM: idx(origin.y + 1, 0) };
    tlEl.querySelectorAll('[data-year]').forEach((el) => { el.style.left = X(Math.max(0, idx(Number(el.dataset.year), 0))) + 'px'; });
    const nowEl = tlEl.querySelector('.tl-now'); if (nowEl) nowEl.style.left = (X(nowF) + 8) + 'px';
    // each role's name sits just above the start of its line
    tlEl.querySelectorAll('.tl-role').forEach((el, i) => {
      const r = roles[i]; if (!r) return;
      el.style.left = X(r.from) + 'px';
      el.style.top = (r.y - 17) + 'px';
    });
    tlArt.dirty = true;
  }

  /* ---------- contact: the links ride an orbit under the black hole on wide screens ---------- */
  const contactEl = document.getElementById('contact');
  const orbitEl = document.querySelector('[data-orbit]');
  const coreEl = contactEl ? contactEl.querySelector('.contact-core') : null;
  function layoutOrbit() {}

  /* ---------- marks of tools, drawn as lines from the open Simple Icons set ---------- */
  const icons = [...document.querySelectorAll('canvas.lic[data-icon]')].map((cv) => ({ cv, slug: cv.dataset.icon, mask: null, hover: 0, thover: 0 }));
  let drawIcons = () => {};
  if (icons.length && window.fetch && window.Promise) {
    root.classList.add('icons-on');
    const VER = { linkedin: 13, playwright: 11 }; // marks that left the set after those versions
    const masks = new Map();
    const loadMask = (slug) => {
      if (masks.has(slug)) return masks.get(slug);
      const pr = fetch('https://cdn.jsdelivr.net/npm/simple-icons@' + (VER[slug] || 16) + '/icons/' + slug + '.svg')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(slug))))
        .then((svg) => new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }))
        .then((img) => {
          // render large, crop to the mark's own box, then keep a mask 96 px tall at the mark's proportions
          const BIG = 480, cb = document.createElement('canvas'); cb.width = cb.height = BIG;
          const cbx = cb.getContext('2d'); cbx.drawImage(img, 0, 0, BIG, BIG);
          const bd = cbx.getImageData(0, 0, BIG, BIG).data;
          let bx0 = BIG, by0 = BIG, bx1 = -1, by1 = -1;
          for (let y = 0; y < BIG; y++) for (let x = 0; x < BIG; x++) if (bd[(y * BIG + x) * 4 + 3] > 24) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
          if (bx1 < 0) { bx0 = 0; by0 = 0; bx1 = BIG - 1; by1 = BIG - 1; }
          const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, aspect = bw / bh;
          const H = 96, W = Math.max(8, Math.round(H * aspect)), cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
          const c2 = cv2.getContext('2d'); c2.drawImage(cb, bx0, by0, bw, bh, 0, 0, W, H);
          const d = c2.getImageData(0, 0, W, H).data, m = new Float32Array(W * H);
          for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] / 255;
          return { W, H, m, aspect };
        });
      masks.set(slug, pr); return pr;
    };
    // horizontal lines that thicken inside the mark, like the name in the hero
    const drawIcon = (ic, t) => {
      const cv = ic.cv; if (!ic.mask) return;
      const { W: MW, H: MH, m, aspect } = ic.mask;
      const wide = cv.classList.contains('lic-wide');
      // a square mark fits the square; a wordmark takes its own width at the tile's height
      const hh = cv.clientHeight; if (!hh) return;
      let ww = hh, dw = hh, dh = hh;
      if (wide) { ww = Math.round(hh * aspect); cv.style.width = ww + 'px'; dw = ww; }
      else if (aspect >= 1) dh = hh / aspect; else dw = hh * aspect;
      const ox = (ww - dw) / 2, oy = (hh - dh) / 2;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(ww * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(ww * dpr); cv.height = Math.round(hh * dpr); }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, ww, hh);
      c.fillStyle = getComputedStyle(cv).color;
      const sp = wide ? Math.max(1.6, dh / 17) : Math.max(2, dh / 15), ky = MH / dh, kx = MW / dw, cw = 1 / kx;
      c.beginPath();
      for (let y = sp / 2; y < dh; y += sp) {
        const r0 = Math.max(0, Math.floor((y - sp / 2) * ky)), r1 = Math.min(MH - 1, Math.ceil((y + sp / 2) * ky));
        const shift = ic.hover * 1.8 * Math.sin(y * 0.8 - t * 8);
        for (let xs = 0; xs < MW; xs++) {
          let cov = 0; for (let r = r0; r <= r1; r++) cov += m[r * MW + xs]; cov /= (r1 - r0 + 1);
          if (cov < 0.04) continue;
          const th = sp * 0.86 * Math.min(1, cov * 1.15);
          c.rect(ox + xs * cw + shift, oy + y - th / 2, cw + 0.05, th);
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
uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform float uOff;
uniform vec2 uMouse;uniform float uMouseAmt;uniform float uInvert;
uniform int uSecN;uniform vec4 uSec[12];uniform vec4 uSecB[12];
uniform int uRectN;uniform vec4 uRect[24];uniform vec4 uKind[24];
uniform vec4 uHero;uniform vec4 uTun;uniform vec4 uCliff;uniform vec4 uFig;
uniform sampler2D uName;uniform float uNameOn;
uniform vec4 uGrip;
uniform int uPeakN;uniform vec4 uPeak[8];
uniform vec4 uTL;uniform vec4 uTLm;uniform vec4 uRA;uniform vec4 uBH2;
uniform vec4 uBH;uniform sampler2D uLut;
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
// light paths around a black hole (units of M): R = 1/r after sweeping angle th, for impact parameter b
// (1 = fell in, -1 = escaped); G = the angle swept by the time the path escaped
vec2 lutAt(float b,float th){return texture(uLut,vec2(th/9.42477796*(767.0/768.0)+0.5/768.0,b/24.0*(511.0/512.0)+0.5/512.0)).rg;}
float rl(float dy,float c,float w){return 1.0-smoothstep(w*0.5-0.5,w*0.5+0.5,abs(dy-c));}

void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr+vec2(0.0,uOff);
 float t=uTime;

 int si=0;
 for(int i=0;i<12;i++){
  if(i>=uSecN)break;
  vec4 s=uSec[i];vec4 b=uSecB[i];float off=0.0;
  // a seam's edge is only worked out near that seam (it moves the boundary by at most b.y)
  if(abs(p.y-s.x)<b.y*1.1+2.0){
   if(b.x>0.5&&b.x<1.5)off=b.y*(0.8*sn(vec2(p.x/230.0,float(i)*7.3))+0.25*sn(vec2(p.x/37.0,float(i)*3.1)));
   else if(b.x>1.5&&b.x<2.5)off=b.y*sin(p.x/210.0+float(i)*1.7);
  }
  if(p.y>=s.x+off)si=i;
 }
 vec4 S=uSec[si];
 int scene=int(S.z+0.5);
 float secTop=S.x;float secH=max(S.y-S.x,1.0);
 bool inkGround=S.w>2.5?false:(S.w>1.5?true:((S.w>0.5)!=(uInvert>0.5)));
 vec3 PAPER=vec3(0.953,0.945,0.925);vec3 INK=vec3(0.051,0.051,0.047);
 vec3 bg=inkGround?INK:PAPER;vec3 fg=inkGround?PAPER:INK;

 float ruleA=0.0;
 if(si+1<uSecN){vec4 nS=uSec[si+1];vec4 nB=uSecB[si+1];
  if(nB.x>2.5){float dy=nS.x-p.y;
   if(dy>0.0&&dy<36.0)ruleA=max(max(rl(dy,3.0,2.6),rl(dy,8.0,0.8)),max(max(rl(dy,12.0,0.8),rl(dy,17.5,1.6)),max(rl(dy,24.0,0.6),rl(dy,30.0,0.6))));}}

 vec2 pw=p;float clear=0.0,wmul=1.0,glass=0.0,rimL=0.0,rimD=0.0,edge=0.0,sparse=0.0;
 for(int i=0;i<24;i++){
  if(i>=uRectN)break;
  vec4 r=uRect[i];
  // the rects come sorted by their top edge: past this row every later one starts lower still
  if(r.y>p.y+150.0)break;
  if(r.y+r.w<p.y-150.0)continue;
  vec4 k=uKind[i];int kind=int(k.x+0.5);
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
  // FAQ: a sheet of parallel wavy lines. The fist has taken hold of its top edge and dragged it down: the lines crowd
  // into the grip and fan back up to the sides, and the night shows through where the sheet was.
  // Each line is a fixed depth u below the sheet's original top edge. Without the waves the depth is solved
  // directly (piecewise: above the sheet, the dragged part, the part that relaxes back); the waves are then
  // folded in with a few fixed-point steps, since they bend the lines only slightly.
  vec2 G=uGrip.xy;float sp=uGrip.z;float L=uGrip.w;
  float top0=secTop+24.0;float D=max(G.y-top0,40.0);
  float k=exp(-pow(abs(pw.x-G.x)/L,1.3));
  float Ug=0.8*D,cg=1.0-0.95*0.8,T=cg*D/0.95;
  float A=D*k*cg;float wamp=0.0;float u=pw.y-top0;
  for(int it=0;it<3;it++){
   float Y=pw.y-top0-wamp;
   if(Y<D*k)u=Y-D*k;
   else if(Y<Ug+A)u=(Y-D*k)/(1.0-0.95*k);
   else{u=Y;for(int n=0;n<4;n++){float e=A*exp(-(u-Ug)/T);u-=(u+e-Y)/(1.0-e/T);}}
   float c=u<0.0?1.0:(u<Ug?1.0-0.95*u/D:cg*exp(-(u-Ug)/T));
   wamp=(11.0*sin(pw.x/170.0+u/210.0-t*0.3)+7.0*sin(pw.x/83.0-u/330.0+t*0.2+1.3)+5.0*sin(pw.x/47.0+u/120.0+2.1))*pow(1.0-k*c,1.5);
  }
  float fu=max(fwidth(u),1e-3);
  v1=u/sp+bump*0.4;vd1=u/sp;
  f1=clamp(u/fu+0.5,0.0,1.0);
  w=wvar*0.95;
  extra=max(extra,1.0-smoothstep(0.7,1.9,abs(u)/fu));
  extra=max(extra,stars(vec2(p.x,p.y-secTop),t)*(1.0-f1));
 }else if(scene==3||scene==7){
  // CASE STUDIES / SKILLS: terrain that rises under each item
  float h=n*0.85;
  for(int i=0;i<8;i++){if(i>=uPeakN)break;vec4 pk=uPeak[i];vec2 d=(pw-pk.xy)/(pk.z*1.05+110.0);h+=(1.6+0.9*pk.w)*exp(-dot(d,d)*1.1);}
  v1=h*(scene==3?12.5:10.0)+bump;vd1=v1;
 }else if(scene==4){
  // EXPERIENCE: growth rings. The pith is the first month of the career (the start of the timeline strip); each month
  // is a band of rings, denser toward its end like latewood and closed by a bold ring. The new year is a double ring,
  // the contract months are hatched across the grain, the rings grow bolder as the role grew, a few dry cracks run
  // outward, and the bark is today; past it nothing has grown yet. The rings straighten where the strip crosses them.
  vec2 C=vec2(uTLm.x,uTL.y+uTL.w);float pxm=max(uTLm.y,4.0);float nowM=uTLm.z;
  vec2 d=pw-C;float r=length(d);vec2 dir=d/max(r,1.0);
  float off=smoothstep(0.0,160.0,abs(pw.y-C.y))*smoothstep(0.0,90.0,r);
  float re=r+(0.03*r+6.0)*(sn(dir*1.3+vec2(r/700.0,t*0.01))+0.35*sn(dir*4.0+vec2(r/180.0,3.1)))*off+bump*2.2;
  float u=re/pxm;
  float Lm=max(2.0,floor(pxm/16.0+0.5));
  float mi=floor(u);float fr=u-mi;
  float grown=1.0-smoothstep(nowM-0.01,nowM+0.01,u);
  float gw=clamp(u/max(nowM,1.0),0.0,1.0);
  v1=(mi+pow(fr,0.78))*Lm;vd1=u*Lm;w=wvar*mix(0.42,0.95,gw);
  v2=u;vd2=u;w2=mix(1.3,2.3,gw);f2=grown;
  float s=atan(d.y,d.x)*r;
  float bark=smoothstep(nowM+0.02,nowM+0.06,u)*(1.0-smoothstep(nowM+0.32,nowM+0.4,u));
  float fib=step(0.42,fract(s/13.0+hash(vec2(floor(u*Lm*2.5),5.0))));
  f1=max(grown,bark*fib);
  extra=max(extra,(1.0-smoothstep(0.5,1.5,abs(re-(uTLm.w*pxm+5.0))))*grown);
  float inB=smoothstep(uRA.z-0.02,uRA.z+0.02,u)*(1.0-smoothstep(uRA.w-0.02,uRA.w+0.02,u));
  float hs=s/10.0;float hd=abs(fract(hs+0.5)-0.5)/max(fwidth(hs),1e-3);
  extra=max(extra,(1.0-smoothstep(0.3,1.1,hd))*inB*0.5*step(0.5,fract(u*Lm*0.5)));
  extra=max(extra,(1.0-smoothstep(0.6,1.8,abs(re-nowM*pxm)))*(0.6+0.4*sin(t*1.7)));
  float ang=atan(d.y,d.x);float cr=0.0;
  for(int j=0;j<3;j++){
   float a0=j==0?1.95:(j==1?-2.1:0.95);
   float da=abs(mod(ang-a0+3.14159,6.28318)-3.14159)*(1.0+0.5*sn(vec2(r/60.0,float(j)*4.0)));
   cr=max(cr,1.0-smoothstep(0.0,(1.5+r*0.012)/max(r,1.0),da));
  }
  clr2=max(clr2,cr*smoothstep(nowM*pxm*0.25,nowM*pxm*0.5,r)*grown);
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
  // CONTACT: a black hole, ray-traced. Each pixel follows its light path back from the eye, using a table of
  // paths around a Schwarzschild mass worked out once on the CPU, and takes the first place the path crosses the
  // accretion disk: the disk in front, then its far side bent over the top and under the bottom of the shadow,
  // then the thin images hugging the shadow. Paths that fall in are the shadow; paths that escape show the lines
  // and stars behind, bent into an Einstein ring. The disk is streaks on circular orbits turning at Kepler speed,
  // heavier on the side that comes toward you. The heading sits in the shadow.
  vec2 C=uBH.xy;float sc=uBH.z/5.196;float spin=uBH.w;
  float inc=uBH2.x;float lift=uBH2.z;float ready=uBH2.w;
  vec2 dp=rot(uBH2.y)*(p-C);
  vec2 s=vec2(dp.x,-dp.y)/sc;
  float b=length(s);vec2 sh=s/max(b,1e-4);
  const float RO=15.0;
  float hit=0.0,rh=0.0,phd=0.0,ord=0.0,fell=0.0,orbiting=0.0,esc=0.0;
  if(ready>0.5&&b<24.0){
   float A=cos(inc),Bv=sh.y*sin(inc);
   float th0=atan(A,-Bv);
   for(int k=0;k<3;k++){
    float th=th0+float(k)*3.14159265;
    float u=lutAt(b,th).r;
    if(u>0.49){fell=1.0;break;}
    if(u<=0.0){break;}
    float r=1.0/u;
    if(r>6.0&&r<RO){
     hit=1.0;rh=r;ord=float(k);
     vec3 P=r*vec3(sh*sin(th),cos(th));
     phd=atan(dot(P,vec3(0.0,cos(inc),-sin(inc))),P.x);
     break;
    }
   }
   vec2 e=lutAt(b,9.40);
   if(hit<0.5){ if(e.r>0.49)fell=1.0; else if(e.r>0.0)orbiting=1.0; }
   esc=e.g;
  }
  // the sky behind, bent: a thin lens at distance 10 M (an Einstein ring just outside the shadow)
  float defl=(ready>0.5&&b<24.0)?max(esc-3.14159265,0.0):(4.0/max(b,0.5)+11.78/max(b*b,0.25));
  float bs=b-defl*10.0;
  vec2 src=C+rot(-uBH2.y)*(vec2(sh.x,-sh.y)*bs*sc);
  float sky=(1.0-fell)*(1.0-hit)*(1.0-orbiting);
  float sy=src.y-secTop;
  v1=(sy+9.0*sin(src.x/260.0+sy/400.0)+n*14.0)/17.0+bump*0.5;vd1=v1;
  f1=sky*smoothstep(1.2,2.0,b/5.196);w=0.55;
  extra=max(extra,stars(vec2(src.x,src.y-secTop),t)*sky);
  if(hit>0.5){
   float lane=log(rh/6.0)*11.0;float li=floor(lane);
   float h1=hash(vec2(li,1.3)),h2=hash(vec2(li,8.1));
   float om=pow(6.0/rh,1.5);
   float s1=fract(phd*(2.0+floor(h1*6.0))*0.15915494-spin*om*(0.7+0.6*h1)+h1*9.0);
   float dash=smoothstep(0.0,0.015,s1)*(1.0-smoothstep(0.55+0.4*h2,0.57+0.4*h2,s1));
   float dop=-cos(phd)*sin(inc);
   v2=lane;vd2=lane;
   f2=dash*(1.0-smoothstep(RO*0.5,RO,rh));
   w2=mix(3.2,0.8,smoothstep(6.0,RO,rh))*(1.0+0.7*dop)*(ord>0.5?0.8:1.0)*(1.0+0.25*lift);
  }
  // the photon ring: light that orbits before reaching you, a hairline at the shadow's edge
  extra=max(extra,orbiting);
  extra=max(extra,(1.0-smoothstep(0.5,1.5,abs(b-5.196)*sc))*(1.0-hit)*ready);
  if(ready<0.5){extra=max(extra,1.0-smoothstep(0.5,1.5,abs(b*sc-uBH.z)));}
 }else if(scene==9){
  // RESUME: ruled lines, level and gently bowed, like a ream of paper seen edge-on
  float sy=pw.y-secTop;
  v1=(sy+7.0*sin(pw.x/320.0+sy/520.0)+n*12.0)/10.5+bump;vd1=v1;w=wvar*0.75;
 }else if(scene==11){
  // INNER PAGE HEADERS: the home page's tunnel, loosened. A spiral whose rings widen outward, centred right of the
  // title (data-cx, a share of the width); scrolling the header away winds it, the pointer twists it where it is.
  vec4 SB=uSecB[si];
  vec2 c=vec2(uRes.x/uDpr*(SB.z>0.0?SB.z:0.78),secTop+secH*0.5);
  vec2 d=pw-c;float r=length(d);float th=atan(d.y,d.x);
  vec2 dm=pw-uMouse;th+=uMouseAmt*0.9*exp(-dot(dm,dm)/(2.0*140.0*140.0));
  float rough=smoothstep(secH*0.35,secH*1.1,r);
  float rr=r+n*(4.0+70.0*rough);
  float prog=clamp(-secTop/secH,0.0,1.0);
  float fr=1.25*pow(rr+2.0,0.62);
  v1=fr-th*0.15915494-prog*14.0-t*0.1;vd1=fr;
  w=mix(0.7,1.2,rough)*wvar*0.8;
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
    const loop = (now) => { if (HIL.renderModels) HIL.renderModels(now / 1000); tickArts(now / 1000); requestAnimationFrame(loop); };
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
  ['uRes', 'uDpr', 'uTime', 'uOff', 'uMouse', 'uMouseAmt', 'uInvert', 'uSecN', 'uSec', 'uSecB', 'uRectN', 'uRect', 'uKind', 'uHero', 'uTun', 'uCliff', 'uFig',
    'uName', 'uNameOn', 'uGrip', 'uPeakN', 'uPeak', 'uTL', 'uTLm', 'uRA', 'uBH', 'uBH2', 'uLut', 'uMoon', 'uFoot', 'uCode', 'uCodeOn']
    .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  function makeTex(unit) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }
  const nameTex = makeTex(0), codeTex = makeTex(1), lutTex = makeTex(2);
  gl.uniform1i(U.uName, 0); gl.uniform1i(U.uCode, 1); gl.uniform1i(U.uLut, 2);
  // Light paths around a black hole, in units of M (horizon r = 2, shadow b = 3v3). For each impact parameter b the
  // path u(th) = 1/r is integrated from the eye (u = 0) with u'' = -u + 3u^2 (RK4). R stores u at each swept angle
  // (1 once it has fallen in, -1 once it has escaped); G stores the angle swept when it escaped.
  let lutReady = 0;
  function buildLut() {
    const W = 768, H = 512, BMAX = 24, THMAX = 3 * Math.PI, sub = 6, dth = THMAX / (W - 1), hh = dth / sub;
    const data = new Float32Array(W * H * 2);
    const f = (u) => -u + 3 * u * u;
    for (let j = 0; j < H; j++) {
      const b = Math.max(0.02, BMAX * j / (H - 1));
      let u = 0, v = 1 / b, th = 0, state = 0, thEsc = THMAX;
      for (let i = 0; i < W; i++) {
        const o = (j * W + i) * 2;
        data[o] = state === 0 ? u : state;
        if (state !== 0) continue;
        for (let k = 0; k < sub; k++) {
          const k1u = v, k1v = f(u);
          const k2u = v + 0.5 * hh * k1v, k2v = f(u + 0.5 * hh * k1u);
          const k3u = v + 0.5 * hh * k2v, k3v = f(u + 0.5 * hh * k2u);
          const k4u = v + hh * k3v, k4v = f(u + hh * k3u);
          const un = u + hh / 6 * (k1u + 2 * k2u + 2 * k3u + k4u), vn = v + hh / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
          if (!(un < 0.5)) { state = 1; break; }
          if (un < 0 && th > 0.05) { thEsc = th + hh * u / (u - un); state = -1; break; }
          u = un; v = vn; th += hh;
        }
      }
      for (let i = 0; i < W; i++) data[(j * W + i) * 2 + 1] = state === 1 ? 0 : thEsc;
    }
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, W, H, 0, gl.RG, gl.FLOAT, data);
    lutReady = 1;
  }
  function upload(unit, tex, canvas) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); }

  /* ---------- the page model ---------- */
  const SCENE = { tunnel: 0, head: 1, face: 1, cloth: 2, terrain: 3, strata: 4, stream: 5, engrave: 6, contour: 7, blackhole: 8, ledger: 9, ocean: 10, rings: 4, vortex: 11 };
  const SEAM = { cliff: [1, 44], wave: [2, 26], rule: [3, 0] };
  const KIND = { plate: 1, '': 1, glass: 2, clear: 3, sparse: 4 };
  const secs = [...document.querySelectorAll('[data-scene]')].map((el) => ({
    el, scene: SCENE[el.dataset.scene] || 0, pol: ({ inverse: 1, night: 2, day: 3 })[el.dataset.polarity] || 0, seam: SEAM[el.dataset.seam] || [0, 0], cx: parseFloat(el.dataset.cx) || 0
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
  const n2 = hero ? hero.querySelector('.n2') : null;
  const footEl = document.querySelector('.foot');
  const nav = document.querySelector('.topbar');

  // cut an element that hangs past its section along the seam into the next one (same curve as the shader)
  const faceCut = document.querySelector('.face-space .model');
  function cutAtSeam() {
    if (!faceCut) return;
    faceCut.style.clipPath = '';
    const sec = faceCut.closest('[data-scene]'), i = secs.findIndex((x) => x.el === sec), next = secs[i + 1];
    if (i < 0 || !next || innerWidth <= 820) return; // stacked (phones): the head sits above the text and fades out instead
    const r = faceCut.getBoundingClientRect(), nt = next.el.getBoundingClientRect().top;
    if (r.bottom <= nt) return;
    const [type, amp] = next.seam, k = i + 1;
    const off = (x) => (type === 2 ? amp * Math.sin(x / 210 + k * 1.7) : 0);
    const pts = ['0px 0px', r.width.toFixed(1) + 'px 0px'];
    for (let x = r.width; x >= -6; x -= 6) { const lx = Math.max(0, x); pts.push(lx.toFixed(1) + 'px ' + (nt - r.top + off(r.left + lx)).toFixed(1) + 'px'); }
    faceCut.style.clipPath = 'polygon(' + pts.join(',') + ')';
  }

  let handGripY = 0.3;
  function measureRadii() {
    if (handEl) {
      handEl.style.removeProperty('--grip-y');
      if (innerWidth > 900) {
        const sr = handEl.closest('[data-scene]').getBoundingClientRect(), hr = handEl.getBoundingClientRect();
        if (hr.height > 0) handEl.style.setProperty('--grip-y', clamp((sr.top + sr.height * 0.5 - hr.top) / hr.height, 0.1, 0.7).toFixed(4));
      }
      handGripY = parseFloat(getComputedStyle(handEl).getPropertyValue('--grip-y')) || 0.3;
      if (HIL.refitModels) HIL.refitModels();
    } plates.forEach((p) => { p.rad = parseFloat(getComputedStyle(p.el).borderTopLeftRadius) || 0; }); }

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
    const hr2 = n1.parentElement.getBoundingClientRect();
    const words = []; re.lastIndex = 0;
    while ((m = re.exec(node.textContent))) { range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length); words.push(range.getBoundingClientRect()); }
    if (!words.length) return;
    const first = words[0], last = words[words.length - 1];
    const rightEdge = Math.max(...words.map((w) => w.right)) - hr2.left;
    // measure the handle at a reference size, then size it to the space it gets
    n2.style.fontSize = '100px';
    const w100 = n2.offsetWidth || 1;
    const room = rightEdge - (first.right - hr2.left) - fsz * 0.16;
    const fitSize = Math.min(fsz * 0.34, room / w100 * 100);
    if (words.length > 1 && fitSize >= Math.max(26, fsz * 0.2)) {
      // right of the first word: same baseline, the handle's right edge on the name's right edge
      n2.style.fontSize = fitSize.toFixed(2) + 'px';
      const w2 = n2.offsetWidth, h2 = n2.offsetHeight;
      const base = first.bottom - hr2.top - fsz * 0.2; // Kalnia's descender sits about a fifth of the size below the baseline
      n2.style.left = (rightEdge - w2) + 'px';
      n2.style.top = (base - h2 * 0.8) + 'px';
    } else {
      // no room beside it (phones): under the last word, flush right
      n2.style.fontSize = (fsz * 0.34).toFixed(2) + 'px';
      n2.style.left = (rightEdge - n2.offsetWidth) + 'px';
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
  const footNarrow = () => footEl && footEl.clientWidth <= 700;
  function moonGeom() {
    if (!footEl) return null;
    const r = footEl.getBoundingClientRect();
    // the water line: 52% down, but always at least 40 px above the first tile, so the tiles stay in the water
    let hz = r.height * 0.52;
    const first = footEl.querySelector('p');
    if (first) hz = Math.min(hz, first.getBoundingClientRect().top - r.top - 40);
    footEl.style.setProperty('--hz', hz.toFixed(1) + 'px');
    // a tenth of the moon is past the left edge and a fiftieth is under the water
    const R = clamp(Math.min(r.width * 0.075, r.height * 0.11), 40, 120);
    return { x: R * 0.8, y: hz - R + R * 0.04, R, hz };
  }
  function drawCode() {
    if (!footEl) return;
    const r = footEl.getBoundingClientRect(); moon = moonGeom();
    const md = Math.min(devicePixelRatio || 1, 2);
    const cs = getComputedStyle(footEl, '::after');
    const fsz = parseFloat(cs.fontSize) || clamp(innerWidth * 0.056, 46, 88);
    const c0 = codeCanvas.getContext('2d');
    c0.font = fsz + 'px "Libre Barcode 128"';
    const cw = c0.measureText(CODE).width; if (!cw) return;
    footEl.style.setProperty('--code-w', cw.toFixed(1) + 'px');
    if (footNarrow()) { codeOn = 0; return; }
    codeCanvas.width = Math.max(1, Math.round(r.width * md)); codeCanvas.height = Math.max(1, Math.round(r.height * md));
    const c = codeCanvas.getContext('2d');
    c.setTransform(md, 0, 0, md, 0, 0); c.clearRect(0, 0, r.width, r.height);
    c.font = fsz + 'px "Libre Barcode 128"';
    // same box as .foot::after: right: var(--pad); bottom: 48% + 34px - .39em
    const pad = parseFloat(getComputedStyle(footEl).paddingRight) || 24;
    c.fillStyle = '#fff'; c.textBaseline = 'bottom';
    c.fillText(CODE, r.width - pad - cw, moon.hz - 34 + fsz * 0.39);
    upload(1, codeTex, codeCanvas);
    codeOn = 1;
  }

  /* ---------- sizing ---------- */
  let dpr = 1, quality = 1;
  // The canvas is taller than the viewport by an overscan above and below, and sits in the page (not fixed).
  // Each frame it is moved to the viewport and redrawn; between frames it scrolls with the content, so the lines
  // never drift behind the text, the plates or the 3D hand when a frame runs late.
  // The canvas height follows the large viewport (100lvh), which stays put when a phone's address bar hides or shows.
  const lvhProbe = document.createElement('div');
  lvhProbe.style.cssText = 'position:absolute;left:-9px;top:0;width:1px;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(lvhProbe);
  let OS = 160, docH = 0, viewH = 0;
  // Pixel density: sharp at rest; while scrolling the lines are drawn at 1x (or less if frames still run slow)
  // and the browser scales them up, which motion hides. scrollScale adapts to the device.
  let scrollScale = 1, scrolling = false;
  function sizeCanvas() {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const base = Math.min(devicePixelRatio || 1, 1.5) * quality;
    dpr = scrolling && !capable ? Math.min(base, scrollScale) : base;
    const maxPx = 3.2e6; if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h));
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; gl.viewport(0, 0, cw, ch); }
  }
  function resize() {
    viewH = lvhProbe.offsetHeight || innerHeight;
    OS = Math.round(Math.min(120, viewH * 0.12));
    cv.style.height = (viewH + 2 * OS) + 'px';
    docH = document.body.offsetHeight;
    sizeCanvas();
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


  function frameParams(vw, vh) {
    let n = 0;
    for (const s of secs) {
      const r = s.el.getBoundingClientRect();
      secBuf.set([r.top, r.bottom, s.scene, s.pol], n * 4); secBBuf.set([s.seam[0], s.seam[1], s.cx, 0], n * 4); n++;
    }
    gl.uniform1i(U.uSecN, n); gl.uniform4fv(U.uSec, secBuf); gl.uniform4fv(U.uSecB, secBBuf);

    let m = 0;
    const near = [];
    for (const p of plates) {
      p.lift += (p.tlift - p.lift) * 0.12;
      const r = p.el.getBoundingClientRect();
      if (!r.width || r.bottom < -160 || r.top > vh + 160) continue;
      near.push([r, p]);
    }
    near.sort((x, y) => x[0].top - y[0].top); // the shader stops at the first rect that starts below the pixel
    for (const [r, p] of near) {
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
      HIL.tunnel = { x: tcx, y: tcy };
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
      let gx = r.left + r.width / 2, gy = r.top + r.height * handGripY;
      if (HIL.grip && HIL.grip.ok) { gx = HIL.grip.x; gy = HIL.grip.y; }
      gl.uniform4f(U.uGrip, gx, gy, clamp(vw / 85, 12, 20), clamp(vw * 0.32, 150, 820));
    }
    let k = 0;
    for (const p of peaks) {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      peakBuf.set([r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) * 0.5, p.lift], k * 4); if (++k >= 8) break;
    }
    gl.uniform1i(U.uPeakN, k); gl.uniform4fv(U.uPeak, peakBuf);
    if (tlEl && tlArt && tlArt.tl) {
      const r = tlEl.getBoundingClientRect(), tl = tlArt.tl, A = tl.roles[0], B = tl.roles[1];
      gl.uniform4f(U.uTL, r.left, r.top, r.width, tl.axisY);
      gl.uniform4f(U.uTLm, r.left + tl.x0, tl.pxm, tl.now, tl.yearM);
      gl.uniform4f(U.uRA, A ? A.from : 0, A ? A.to : 0, B ? B.from : -9, B ? B.to : -9);
    }
    if (coreEl) {
      const cr = coreEl.getBoundingClientRect(), sr = contactEl.getBoundingClientRect();
      // wide: right of centre, the disk reaching left between the heading and the links; narrow: below the heading
      const wideC = sr.width >= 1000;
      const Rs = wideC ? Math.min(sr.width * 0.12, sr.height * 0.17, 300) : Math.min(sr.width * 0.3, 150);
      const cx = wideC ? sr.left + sr.width * 0.68 : sr.left + sr.width / 2;
      const cy = wideC ? sr.top + sr.height * 0.5 : cr.bottom + Rs * 2.05;
      const near = Math.hypot(P.x - cx, P.y - cy) < Rs * 2.2 && P.amt > 0.1 ? 1 : 0;
      bh.lift += (near - bh.lift) * 0.04;
      bh.spin += (reduce ? 0 : 1 / 60) * (0.5 + 0.9 * bh.lift);
      // scrolling through the section opens the disk a little, as if the view rose above its plane
      const prog = clamp((vh - sr.top) / (vh + sr.height), 0, 1);
      const px = P.amt > 0.1 ? clamp((P.x - cx) / vw, -0.5, 0.5) * 24 : 0, py = P.amt > 0.1 ? clamp((P.y - cy) / vh, -0.5, 0.5) * 16 : 0;
      gl.uniform4f(U.uBH, cx + px * 0.5, cy + py * 0.5, Rs, bh.spin);
      // seen almost edge-on (83 degrees); scrolling through the section raises the view a little
      gl.uniform4f(U.uBH2, lerp(1.45, 1.33, prog), wideC ? lerp(-0.16, -0.12, prog) : lerp(-0.07, -0.03, prog), bh.lift, lutReady);
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
      const darkGround = pol === 2 ? true : pol === 3 ? false : ((pol === 1) !== isDark());
      const want = darkGround ? 'dark' : 'light';
      if (nav.dataset.on !== want) nav.dataset.on = want;
    }
  }

  /* ---------- loop ---------- */
  // Capability: while the loader shows, ten full-sharpness frames are timed to completion (a 1-pixel read waits for
  // the GPU). If the line field takes under 6 ms, the device keeps full sharpness while scrolling and every drawing
  // animates together; otherwise the scroll trims apply.
  let capable = false;
  const bench = { n: 0, t: [] }, px1 = new Uint8Array(4);
  function benchFrame(nowT, t0) {
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
    const t1 = performance.now();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); // a bare round trip, to subtract
    const ms = Math.max(0, (t1 - t0) - (performance.now() - t1));
    if (++bench.n > 3) bench.t.push(ms); // the first frames include shader compilation
    if (bench.n === 10) {
      const s = bench.t.slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
      capable = med < 6; HIL.capable = capable; HIL.fieldMs = +med.toFixed(2);
      sizeCanvas();
    }
  }
  let last = performance.now(), time = 0, slow = 0, frames = 0, lastSY = -1, idleSkip = false, lastScrollT = -1e9, scrollFrames = 0, scrollSlow = 0;
  function relayout() {
    fitName(); measureRadii(); resize(); drawName(); drawCode(); layoutTimeline(); layoutOrbit(); cutAtSeam();
    arts.forEach((a) => { a.dirty = true; });
  }
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; // the first frame can be stamped before the script ran
    if (document.hidden) { requestAnimationFrame(frame); return; }
    if (!reduce) time += dt;
    if (relayoutPending) { relayoutPending = false; relayout(); }
    const scrolled = scrollY !== lastSY;
    const moving = scrolled || Math.abs(P.tx - P.x) + Math.abs(P.ty - P.y) > 0.5 || Math.abs(P.tamt - P.amt) > 0.01;
    lastSY = scrollY;
    if (scrolled) lastScrollT = now;
    const nowScrolling = now - lastScrollT < 220;
    if (nowScrolling !== scrolling) { scrolling = nowScrolling; sizeCanvas(); }
    // while scrolling, step the density down if frames are still slow (kept for the rest of the visit)
    if (scrolling && scrolled) {
      scrollFrames++; if (dt > 0.024) scrollSlow++;
      if (scrollFrames >= 24) {
        // a device judged capable that still drops frames while scrolling falls back to the trims
        if (scrollSlow > 10) { if (capable) { capable = false; HIL.capable = false; } else if (scrollScale > 0.62) scrollScale = Math.max(0.6, scrollScale - 0.15); sizeCanvas(); }
        scrollFrames = 0; scrollSlow = 0;
      }
    }
    if (!moving && (idleSkip = !idleSkip)) { requestAnimationFrame(frame); return; }
    const vw = innerWidth, vh = innerHeight;
    P.x += (P.tx - P.x) * 0.14; P.y += (P.ty - P.y) * 0.14; P.amt += ((reduce ? 0 : P.tamt) - P.amt) * 0.06;
    HIL.grip = null; // set again this frame if the hand is drawn; otherwise the grip comes from the layout
    if (HIL.renderModels) HIL.renderModels(time); // the 3D models first, so the fist's grip is this frame's
    const sy = scrollY, fy = Math.max(0, Math.min(sy - OS, docH - viewH - 2 * OS));
    cv.style.transform = 'translate3d(0,' + fy + 'px,0)';
    gl.uniform1f(U.uOff, fy - sy);
    frameParams(vw, vh);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uTime, time);
    P.fresh = Math.max(0, P.fresh - dt / 1.4);
    gl.uniform2f(U.uMouse, P.x, P.y); gl.uniform1f(U.uMouseAmt, P.touch ? P.amt * P.fresh : P.amt); gl.uniform1f(U.uInvert, isDark() ? 1 : 0);
    const timed = bench.n < 10 && !scrolling;
    if (timed) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); // let earlier work finish first
    const tb = timed ? performance.now() : 0;
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (timed) benchFrame(performance.now(), tb);
    HIL.time = time;
    tickArts(time, scrolling);
    if (!scrolling) { frames++; if (dt > 0.034) slow++; }
    // at rest, if frames are still slow, lower the resting density too (only the canvas is resized)
    if (frames >= 90) { if (slow > 45 && quality > 0.6) { quality -= 0.15; sizeCanvas(); } frames = 0; slow = 0; }
    requestAnimationFrame(frame);
  }
  root.classList.add('lines-live');
  relayout();
  requestAnimationFrame(frame);
  setTimeout(() => { try { buildLut(); } catch (e) { console.warn('[lines] black hole table:', e); } }, 250);
})();
