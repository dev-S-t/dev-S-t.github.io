/* The footer, shared by the home page and About: the stream of lines and the figure who sorts it, and Copy link.
   Plain script, loaded deferred after GSAP; it draws on GSAP's ticker so it moves in step with the page. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = (t) => t * t * (3 - 2 * t);
  const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  const onScreen = (el, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '100px' }).observe(el);
  const start = () => {
    const gsap = window.gsap;
    const flow = document.querySelector('.ab-flow');
    if (flow && gsap && !reduce) lineStream(flow);
    const copy = document.querySelector('.ab-copy');
    copy?.addEventListener('click', () => {
      const t = copy.querySelector('.ab-copy-t'), was = t.textContent;
      const done = () => { t.textContent = copy.dataset.done; setTimeout(() => { t.textContent = was; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done).catch(() => {}); else done();
    });

    /* ================= The footer: a stream of lines, and the figure who sorts it ================= */
    // Short lines drift along a broad diagonal stream, each turned its own way: a tangle. The figure from the mark walks
    // toward the pointer (or, left alone, wanders along the stream) and pushes the lines aside with his arms; the ones he
    // touches turn to run with the stream and brighten, so the flow shows; then they slowly fall back into the tangle.
    function lineStream(canvas) {
      const g = canvas.getContext('2d'), host = canvas.parentElement;
      let w = 0, h = 0, dpr = 1, parts = [], live = false, MB = window.MarkBody;
      const FLOW = -0.42;                                     // the stream's direction: rising to the right
      const fx = Math.cos(FLOW), fy = Math.sin(FLOW), nx = -fy, ny = fx;
      const build = () => {
        dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr;
        const N = Math.round(Math.min(1500, (w * h) / 1100));
        parts = Array.from({ length: N }, () => {
          const g1 = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;   // bunched toward the stream's middle
          return { u: Math.random(), v: g1 * 0.32, sp: 0.00012 + Math.random() * 0.00022, a: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.01,
            len: 8 + Math.random() * 16, dx: 0, dy: 0, vx: 0, vy: 0, o: 0 };
        });
      };
      build(); addEventListener('resize', build);
      // where a point of the stream sits on screen: u runs along it (0 bottom left to 1 top right), v across it
      const at = (u, v) => {
        const L = Math.hypot(w, h) * 1.15, cx = w * 0.5, cy = h * 0.6, s = (u - 0.5) * L, bow = Math.sin(u * Math.PI) * h * 0.06;
        return [cx + fx * s + nx * (v * h + bow), cy + fy * s + ny * (v * h + bow)];
      };
      const ptr = { x: 0, y: 0, in: false };
      host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true; }, { passive: true });
      host.addEventListener('pointerleave', () => { ptr.in = false; });
      onScreen(canvas, (v) => { live = v; });
      if (!MB) loadScript('/assets/js/figure/mark.js').then(() => loadScript('/assets/js/figure/markbody.js')).then(() => { MB = window.MarkBody; }).catch(() => {});

      // the figure: where he is, where he is heading, which way he faces
      const man = { x: 0, y: 0, tx: 0, ty: 0, face: 1, step: 0, set: false };
      const hsh = (x) => { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); };
      // wading: leaning in, arms sweeping out to the sides in turn, as if parting tall grass; legs stepping
      const wade = (t, go) => ({
        root: { x: 0, y: 0, rot: 0, sx: 1 }, lean: 0.12 + 0.08 * go, bend: 0.78, nod: 0.06,
        feet: { L: { x: -0.06 + 0.1 * Math.sin(t * 5) * go, y: 0.33 }, R: { x: 0.07 - 0.1 * Math.sin(t * 5) * go, y: 0.33 } }, knee: { L: 1, R: -1 },
        hands: { F: { x: 0.18 + 0.24 * (0.5 + 0.5 * Math.sin(t * 3.2)), y: -0.22 + 0.16 * Math.cos(t * 3.2) },
                 B: { x: -0.18 - 0.24 * (0.5 + 0.5 * Math.sin(t * 3.2 + Math.PI)), y: -0.22 + 0.16 * Math.cos(t * 3.2 + Math.PI) } },
        elbow: { F: 1, B: -1 }, round: { F: 0.4, B: 0.4 }
      });

      gsap.ticker.add((time) => {
        if (!live || !w) return;
        const K = Math.min(150, h * 0.17, w * 0.22);           // his height on screen
        if (!man.set) { const [x, y] = at(0.42, 0); man.x = man.tx = x; man.y = man.ty = y; man.set = true; }
        if (ptr.in) { man.tx = ptr.x; man.ty = ptr.y + K * 0.35; }
        else { const [x, y] = at(0.3 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.08)), 0.04 * Math.sin(time * 0.3)); man.tx = x; man.ty = y; }
        const mx = (man.tx - man.x) * 0.035, my = (man.ty - man.y) * 0.035;
        man.x += mx; man.y += my;
        const go = Math.min(1, Math.hypot(mx, my) / 2 + 0.25);
        if (Math.abs(mx) > 0.15) man.face = mx > 0 ? 1 : -1;
        const hx = man.x, hy = man.y - K * 0.42, R = K * 1.05;   // the reach of his arms, round his chest

        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        g.lineCap = 'round';
        // two passes: the tangle (dim), then the lines he has sorted (bright), so the flow reads on top
        const calm = [], lit = [];
        for (const p of parts) {
          p.u += p.sp * (1 + p.o * 1.5); if (p.u > 1.05) { p.u -= 1.1; p.dx = p.dy = 0; p.o = 0; }
          const [bx, by] = at(p.u, p.v);
          let x = bx + p.dx, y = by + p.dy;
          const ddx = x - hx, ddy = y - hy, d = Math.hypot(ddx, ddy);
          if (d < R) {                                        // pushed aside, and turned to run with the stream
            const f = (1 - d / R) * 2.4 * go;
            p.vx += (ddx / (d || 1)) * f; p.vy += (ddy / (d || 1)) * f;
            p.o = Math.min(1, p.o + (1 - d / R) * 0.12);
          }
          p.vx += -p.dx * 0.004; p.vy += -p.dy * 0.004;       // drifting back toward the stream, slowly
          p.vx *= 0.9; p.vy *= 0.9; p.dx += p.vx; p.dy += p.vy;
          p.o *= 0.9965;                                       // and the order fades, a few seconds after
          p.a += p.spin;
          x = bx + p.dx; y = by + p.dy;
          const ang = p.a + (FLOW - p.a) * smooth(p.o), l = p.len * (1 + p.o * 0.6), c = Math.cos(ang) * l / 2, s = Math.sin(ang) * l / 2;
          (p.o > 0.25 ? lit : calm).push([x - c, y - s, x + c, y + s, p.o]);
        }
        g.lineWidth = 1.4; g.strokeStyle = 'rgba(255, 244, 230, .26)'; g.beginPath();
        for (const q of calm) { g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); }
        g.stroke();
        for (const q of lit) {
          const o = q[4];
          g.strokeStyle = o > 0.7 ? 'rgba(220, 80, 0, .95)' : `rgba(255, 244, 230, ${(0.35 + o * 0.6).toFixed(2)})`;
          g.lineWidth = 1.4 + o; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke();
        }
        // the figure
        if (MB) {
          const pose = wade(time, go); pose.root.sx = man.face;
          const lines = MB.body(pose), bf = Math.floor(time * 8), jit = Math.max(0.4, K * 0.006);
          const cam = (qx, qy) => [man.x + qx * K, man.y - K * 0.33 + qy * K]; cam.k = K;
          const j = (s2) => [s2[0] + (hsh(s2[0] * 0.07 + bf) - 0.5) * jit, s2[1] + (hsh(s2[1] * 0.07 + bf + 3.1) - 0.5) * jit];
          MB.draw(g, lines, cam, j, '#FFF4E6');
        }
      });
    }
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start); else start();
})();
