/* human-in-loop.dev: home page behaviour. Everything here is an enhancement; the page reads in full without it.
   1. Hero field: a grid of dots, and three rings of dots flowing round a loop with the logo's opening at eleven
      o'clock. The pointer and scrolling stretch dots into lines.
   2. Weighted scrolling (Lenis) driving GSAP ScrollTrigger.
   3. Pinned scenes: the reel unrolls, the loops turn from AI to design, the portal opens into a tunnel.
      The three.js versions load later, from scene.js; until then (and without WebGL) the CSS versions run.
   4. Words that ink in, headings that rise, line drawings that draw themselves.
   5. The walker: the logo's human travels with the reader and says something when it lands.
   6. Nav, tilting cards, magnetic buttons. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const css = getComputedStyle(document.documentElement);
  const col = (n) => css.getPropertyValue(n).trim();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- 1. Hero field ---------------- */
  function heroField(canvas, perch) {
    const ctx = canvas.getContext('2d');
    const INK = col('--brown'), HOT = col('--orange'), DARK = col('--ink');
    let w = 0, h = 0, n = 0, m = 0, visible = true, running = false, t0 = performance.now();
    let rx, ry, x, y, vx, vy; // all dots: grid first (n), then ring dots (m)
    let ringU, ringR, ringS;   // ring dots: position along the arc, ring radius, speed
    let cx = 0, cy = 0, R = 0;
    const GAP0 = -135 * Math.PI / 180, GAP = 30 * Math.PI / 180; // the opening, 11 o'clock, 30 degrees
    const p = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };

    function build() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const narrow = w < 900;
      cx = narrow ? w * 0.7 : w * 0.78; cy = narrow ? Math.max(h * 0.36, 290) : h * 0.5;
      R = narrow ? Math.min(w * 0.2, h * 0.1) : Math.min(w * 0.16, h * 0.27);
      const gap = Math.max(20, Math.min(30, w / 56));
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      n = cols * rows;
      const radii = [1, 0.76, 0.52], speeds = [0.018, -0.026, 0.04];
      const counts = radii.map((f) => Math.round((2 * Math.PI * R * f) / 9));
      m = counts.reduce((a, b) => a + b, 0);
      const N = n + m;
      rx = new Float32Array(N); ry = new Float32Array(N); x = new Float32Array(N); y = new Float32Array(N);
      vx = new Float32Array(N); vy = new Float32Array(N);
      ringU = new Float32Array(m); ringR = new Float32Array(m); ringS = new Float32Array(m);
      const ox = (w - (cols - 1) * gap) / 2, oy = (h - (rows - 1) * gap) / 2;
      let i = 0;
      for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++, i++) { rx[i] = x[i] = ox + b * gap; ry[i] = y[i] = oy + a * gap; }
      let k = 0;
      radii.forEach((f, ri) => { for (let j = 0; j < counts[ri]; j++, k++) { ringU[k] = j / counts[ri]; ringR[k] = R * f; ringS[k] = speeds[ri]; } });
      placeRings(0, true);
      // The walker stands on top of the outer ring.
      if (perch) { perch.style.left = cx + 'px'; perch.style.top = (cy - R - 4) + 'px'; }
    }

    function placeRings(dt, snap) {
      for (let k = 0; k < m; k++) {
        ringU[k] = (ringU[k] + ringS[k] * dt + 1) % 1;
        const a = GAP0 + GAP / 2 + ringU[k] * (2 * Math.PI - GAP);
        const i = n + k;
        rx[i] = cx + Math.cos(a) * ringR[k]; ry[i] = cy + Math.sin(a) * ringR[k];
        if (snap) { x[i] = rx[i]; y[i] = ry[i]; }
      }
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      if (!reduce) placeRings(dt, false);
      p.vx *= 0.86; p.vy *= 0.86;
      ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
      const R2 = 150 * 150;
      const gridDots = new Path2D(), ringDots = new Path2D(), slow = new Path2D(), fast = new Path2D();
      for (let i = 0; i < n + m; i++) {
        const dx = x[i] - p.x, dy = y[i] - p.y, d2 = dx * dx + dy * dy;
        if (p.inside && d2 < R2) {
          const f = 1 - Math.sqrt(d2) / 150;
          vx[i] += p.vx * f * 0.16 + dx * f * 0.012; vy[i] += p.vy * f * 0.16 + dy * f * 0.012;
        }
        vx[i] += (rx[i] - x[i]) * 0.06; vy[i] += (ry[i] - y[i]) * 0.06;
        vx[i] *= 0.8; vy[i] *= 0.8; x[i] += vx[i]; y[i] += vy[i];
        const s = Math.abs(vx[i]) + Math.abs(vy[i]);
        if (s < 0.45) {
          const target = i < n ? gridDots : ringDots, rad = i < n ? 1 : 1.6;
          target.moveTo(x[i] + rad, y[i]); target.arc(x[i], y[i], rad, 0, 6.2832);
        } else {
          const path = s > 5 ? fast : slow;
          path.moveTo(x[i] - vx[i] * 3.2, y[i] - vy[i] * 3.2); path.lineTo(x[i], y[i]);
        }
      }
      ctx.globalAlpha = 0.22; ctx.fillStyle = INK; ctx.fill(gridDots);
      ctx.globalAlpha = 0.85; ctx.fillStyle = DARK; ctx.fill(ringDots);
      ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(slow);
      ctx.globalAlpha = 0.95; ctx.strokeStyle = HOT; ctx.stroke(fast);
      ctx.globalAlpha = 1;
      if (!visible || reduce) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function wake() { if (!running && visible) { running = true; t0 = performance.now(); requestAnimationFrame(frame); } }

    build();
    if (reduce) { running = true; frame(performance.now()); new ResizeObserver(() => { build(); running = true; frame(performance.now()); }).observe(canvas); return { kick() {} }; }
    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(); const nx = e.clientX - r.left, ny = e.clientY - r.top;
      if (p.inside) { p.vx += (nx - p.x) * 0.5; p.vy += (ny - p.y) * 0.5; }
      p.x = nx; p.y = ny; p.inside = true;
    }, { passive: true });
    host.addEventListener('pointerleave', () => { p.inside = false; p.x = p.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }).observe(canvas);
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(); wake(); }, 120); }).observe(canvas);
    for (let i = 0; i < n + m; i++) { const d = 0.5 + Math.random(); y[i] -= 60 * d; vy[i] = 9 * d; } // dots fall in as lines
    wake();
    return {
      kick(v) {
        if (!visible || Math.abs(v) < 0.4) return;
        const k = clamp(v, -40, 40) * 0.09;
        for (let i = 0; i < n + m; i++) vy[i] -= k * (0.6 + 0.4 * ((i * 7919) % 13) / 13);
      }
    };
  }
  const field = (() => { const c = document.querySelector('.field'); return c ? heroField(c, document.querySelector('.perch-hero')) : { kick() {} }; })();

  /* ---------------- Everything below needs GSAP ---------------- */
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  /* 2. Weighted scrolling */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on('scroll', (e) => { ST.update(); field.kick(e.velocity); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault(); lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    }));
  }

  /* 3. Pinned scenes (created first, so later triggers measure the pin spacing) */
  if (!reduce) {
    // The reel: a small, tilted card grows, flattens and opens to full screen; PLAY and REEL part.
    const card = document.querySelector('.reel-card');
    const cover = () => Math.max(innerWidth / card.offsetWidth, innerHeight / card.offsetHeight) * 1.02;
    const reelTl = gsap.timeline({ scrollTrigger: { id: 'reel', trigger: '.reel', start: 'top top', end: '+=160%', pin: '.reel-stick', scrub: 1, invalidateOnRefresh: true } });
    reelTl.fromTo(card, { scale: 0.42, rotation: -5, borderRadius: 18 }, { scale: 1, rotation: 0, borderRadius: 14, ease: 'power2.out', duration: 0.55 }, 0)
      .to(card, { scale: cover, borderRadius: 0, ease: 'power2.in', duration: 0.45 }, 0.55)
      .fromTo('.reel-label span:first-child', { xPercent: 0 }, { xPercent: -70, ease: 'power1.inOut', duration: 0.7 }, 0)
      .fromTo('.reel-label span:last-child', { xPercent: 0 }, { xPercent: 70, ease: 'power1.inOut', duration: 0.7 }, 0)
      .to('.reel-label', { opacity: 0, duration: 0.2 }, 0.75);

    // The loops: AI, then design.
    const loopsTl = gsap.timeline({ scrollTrigger: { id: 'loops', trigger: '.loops', start: 'top top', end: '+=300%', pin: '.loops-stick', scrub: 1 } });
    loopsTl.fromTo('.panel-ai', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.12)
      .to('.panel-ai', { autoAlpha: 0, y: -40, duration: 0.08 }, 0.42)
      .fromTo('.panel-design', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.66)
      .fromTo('.loops-meter b', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
      .fromTo('.loops-fallback', { rotation: 0, scale: 0.8 }, { rotation: 140, scale: 1.1, ease: 'none', duration: 1 }, 0)
      .set({}, {}, 1);

    // The portal: the picture grows to fill the screen, then you fall into a tunnel of lines.
    const pCard = document.querySelector('.portal-card'), pStick = document.querySelector('.portal-stick');
    const delta = () => {
      const s = pStick.getBoundingClientRect(), c = pCard.getBoundingClientRect();
      return { x: s.left + s.width / 2 - (c.left + c.width / 2), y: s.top + s.height / 2 - (c.top + c.height / 2), k: Math.max(s.width / c.width, s.height / c.height) * 1.04 };
    };
    const portalTl = gsap.timeline({ scrollTrigger: { id: 'portal', trigger: '.portal', start: 'top top', end: '+=280%', pin: '.portal-stick', scrub: 1, invalidateOnRefresh: true } });
    portalTl.to('.portal-title, .portal-copy', { autoAlpha: 0, y: -40, duration: 0.14, stagger: 0.04 }, 0.04)
      .to(pCard, { x: () => delta().x, y: () => delta().y, scale: () => delta().k, borderRadius: 0, ease: 'power2.inOut', duration: 0.3 }, 0)
      .to(pCard, { autoAlpha: 0, duration: 0.1 }, 0.33)
      .fromTo('.portal-fallback', { scale: 0.2, autoAlpha: 0 }, { scale: 3, autoAlpha: 1, ease: 'power1.in', duration: 0.6 }, 0.3)
      .fromTo('.portal-end', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.8)
      .set({}, {}, 1);
  }

  /* 4. Words, headings, drawings */
  if (!reduce) {
    const hero = document.querySelector('.hero-title');
    if (hero) gsap.from(hero.querySelectorAll('.ln'), { y: 30, duration: 1.6, ease: 'expo.out', stagger: 0.08 });

    // The statement inks in, word by word.
    document.querySelectorAll('.words').forEach((el) => {
      const parts = el.textContent.trim().split(/\s+/);
      el.innerHTML = parts.map((w) => `<span class="wd">${w}</span>`).join(' ');
      gsap.fromTo(el.querySelectorAll('.wd'), { color: '#D7C3A8' }, {
        color: col('--ink'), stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true }
      });
    });

    // Headings rise letter by letter.
    document.querySelectorAll('h2.split').forEach((h) => {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      const words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="c">${c}</span>`).join('')}</span>`).join(' ');
      gsap.set(h, { overflow: 'hidden', paddingBottom: '0.08em' });
      gsap.from(h.querySelectorAll('.c'), { yPercent: 115, rotate: 7, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.022, scrollTrigger: { trigger: h, start: 'top 88%' } });
    });

    // Line drawings draw themselves on the way in, and again on hover.
    document.querySelectorAll('.svc').forEach((svc) => {
      const strokes = svc.querySelectorAll('.draw [pathLength]');
      gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: { trigger: svc, start: 'top 85%' } });
      svc.addEventListener('mouseenter', () => gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.08, overwrite: true }));
      gsap.from(svc, { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: svc, start: 'top 92%' } });
    });

    // The process line draws through the steps as you scroll.
    const procPath = document.querySelector('.proc-line path');
    if (procPath) {
      procPath.setAttribute('pathLength', '1'); procPath.style.strokeDasharray = '1';
      gsap.fromTo(procPath, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.proc', start: 'top 75%', end: 'bottom 55%', scrub: 1 } });
    }

    document.querySelectorAll('.card, .step, .person, .statement-foot').forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }

  /* 5. The walker */
  const walker = document.querySelector('.walker');
  const perches = [...document.querySelectorAll('[data-perch]')];
  if (walker && perches.length > 1 && !reduce) {
    const mark = walker.querySelector('.walker-mark'), bubble = walker.querySelector('.walker-say');
    const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY }; };
    const scaleOf = (el) => parseFloat(el.dataset.scale || '1');
    const darkAt = (el) => el.closest('[data-theme]')?.dataset.theme === 'dark';
    let saidFor = null, hushTimer = 0;
    const say = (el) => {
      if (saidFor === el) return;
      saidFor = el; bubble.textContent = el.dataset.say || '';
      walker.classList.toggle('say-left', el.getBoundingClientRect().left > innerWidth * 0.6);
      walker.classList.add('talk'); clearTimeout(hushTimer);
      hushTimer = setTimeout(() => walker.classList.remove('talk'), 3600);
    };
    const hush = () => { if (saidFor) { saidFor = null; walker.classList.remove('talk'); } };

    gsap.set(walker, { x: () => at(perches[0]).x, y: () => at(perches[0]).y, scale: scaleOf(perches[0]) });
    walker.style.setProperty('--s', scaleOf(perches[0]));
    walker.classList.toggle('on-dark', darkAt(perches[0]));
    setTimeout(() => { if (scrollY < 40) say(perches[0]); }, 1400);

    perches.slice(1).forEach((to, k) => {
      const from = perches[k];
      const section = to.closest('section, footer') || to;
      const dir = Math.sign(at(to).x - at(from).x) || 1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: 'top 88%', end: 'top 28%', scrub: 1.4, invalidateOnRefresh: true,
          onUpdate: (self) => {
            walker.classList.toggle('on-dark', self.progress > 0.5 ? darkAt(to) : darkAt(from));
            walker.style.setProperty('--s', gsap.getProperty(walker, 'scale'));
            if (self.progress > 0.97 && self.direction > 0) say(to);
            else if (self.progress < 0.03 && self.direction < 0) say(from);
            else if (self.progress > 0.05 && self.progress < 0.95) hush();
          }
        }
      });
      tl.fromTo(walker, { x: () => at(from).x, y: () => at(from).y, scale: scaleOf(from) },
        { x: () => at(to).x, y: () => at(to).y, scale: scaleOf(to), ease: 'power1.inOut', immediateRender: false }, 0);
      tl.fromTo(mark, { y: 0, rotation: 0 }, { keyframes: { y: [0, -80, -40, 0], rotation: [0, -14 * dir, 8 * dir, 0] }, ease: 'none', immediateRender: false }, 0);
    });
    addEventListener('load', () => ST.refresh());
    document.fonts && document.fonts.ready.then(() => ST.refresh());
  }

  /* 6. Nav, cards, buttons */
  const nav = document.querySelector('.nav');
  if (nav) {
    const themed = [...document.querySelectorAll('[data-theme]')];
    const setTheme = () => {
      const probe = nav.offsetHeight / 2;
      const sec = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
      if (sec) nav.dataset.on = sec.dataset.theme;
    };
    setTheme(); ST.addEventListener('refresh', setTheme);
    let lastY = 0;
    ST.create({ start: 0, end: 'max', onUpdate: (s) => {
      setTheme();
      const y = s.scroll();
      nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
      if (y < lastY - 2 || y < 400) nav.classList.remove('is-hidden');
      lastY = y;
    } });
  }

  if (finePointer && !reduce) {
    document.querySelectorAll('.card-media, .person-photo').forEach((m) => {
      const rx = gsap.quickTo(m, 'rotationX', { duration: 0.8, ease: 'expo.out' });
      const ry = gsap.quickTo(m, 'rotationY', { duration: 0.8, ease: 'expo.out' });
      const link = m.parentElement;
      link.addEventListener('pointermove', (e) => { const r = m.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); });
      link.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    // Magnetic buttons: they lean toward the pointer (a bigger, friendlier target: Fitts's law).
    document.querySelectorAll('.magnetic').forEach((b) => {
      const mx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'expo.out' }), my = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'expo.out' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.28); my((e.clientY - r.top - r.height / 2) * 0.4); });
      b.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* 3b. Load the three.js scenes on the first interaction (scroll, pointer, touch, key). They all sit below the
     fold, so nobody sees them before interacting, and the first paint and main thread never wait for them.
     Until then, and without WebGL, the CSS versions of the reel, loops and portal run. */
  const canGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!reduce && canGL) {
    let loaded = false;
    const go = () => {
      if (loaded) return; loaded = true;
      ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach((ev) => removeEventListener(ev, go));
      import('/assets/js/scene.js').then((mod) => mod.start({ gsap, ST })).catch((err) => console.warn('[scene] not loaded', err));
    };
    ['scroll', 'pointermove', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, go, { passive: true, once: true }));
    if (scrollY > innerHeight) go(); // opened part-way down the page
  }
})();
