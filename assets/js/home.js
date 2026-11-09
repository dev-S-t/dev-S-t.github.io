/* human-in-loop.dev: home page behaviour.
   Everything here is an enhancement: the page reads in full without it.
   1. The dot field: dots at rest, stretched into lines by the pointer and by scrolling.
   2. Smooth, weighted scrolling (Lenis) driving GSAP ScrollTrigger.
   3. Headings that rise in letter by letter; blocks that ease in.
   4. The walker: the logo's human, travelling from perch to perch with the reader.
   5. The nav follows the section beneath it; cards tilt toward the pointer. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const css = getComputedStyle(document.documentElement);
  const col = (n) => css.getPropertyValue(n).trim();

  /* ---------------- 1. Dot field ---------------- */
  function dotField(canvas) {
    const ctx = canvas.getContext('2d');
    const INK = col('--brown'), HOT = col('--orange');
    let w = 0, h = 0, dpr = 1, n = 0;
    let rx, ry, x, y, vx, vy;
    let running = false, visible = true, idleFrames = 0;
    const p = { x: -9999, y: -9999, vx: 0, vy: 0, last: 0, inside: false };

    function build() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = Math.max(18, Math.min(28, w / 64));
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      n = cols * rows;
      rx = new Float32Array(n); ry = new Float32Array(n);
      x = new Float32Array(n); y = new Float32Array(n);
      vx = new Float32Array(n); vy = new Float32Array(n);
      const ox = (w - (cols - 1) * gap) / 2, oy = (h - (rows - 1) * gap) / 2;
      let i = 0;
      for (let r2 = 0; r2 < rows; r2++) for (let c = 0; c < cols; c++, i++) {
        rx[i] = ox + c * gap; ry[i] = oy + r2 * gap;
        x[i] = rx[i]; y[i] = ry[i];
      }
    }

    // On arrival the dots fall in as short lines and settle into dots.
    function intro() {
      for (let i = 0; i < n; i++) {
        const d = 0.5 + Math.random();
        y[i] = ry[i] - 60 * d; vy[i] = 9 * d;
      }
      wake();
    }

    function frame() {
      if (!running) return;
      const R = 150, R2 = R * R;
      p.vx *= 0.86; p.vy *= 0.86;
      let energy = 0;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      const slow = new Path2D(), fast = new Path2D(), dots = new Path2D();
      for (let i = 0; i < n; i++) {
        const dx = x[i] - p.x, dy = y[i] - p.y, d2 = dx * dx + dy * dy;
        if (p.inside && d2 < R2) {
          const f = 1 - Math.sqrt(d2) / R;
          vx[i] += p.vx * f * 0.16 + dx * f * 0.012;
          vy[i] += p.vy * f * 0.16 + dy * f * 0.012;
        }
        vx[i] += (rx[i] - x[i]) * 0.055; vy[i] += (ry[i] - y[i]) * 0.055;
        vx[i] *= 0.8; vy[i] *= 0.8;
        x[i] += vx[i]; y[i] += vy[i];
        const s = Math.abs(vx[i]) + Math.abs(vy[i]);
        energy += s;
        if (s < 0.35) { dots.moveTo(x[i] + 1.1, y[i]); dots.arc(x[i], y[i], 1.1, 0, 6.2832); }
        else {
          const path = s > 5 ? fast : slow;
          path.moveTo(x[i] - vx[i] * 3.2, y[i] - vy[i] * 3.2); path.lineTo(x[i], y[i]);
        }
      }
      ctx.globalAlpha = 0.34; ctx.fillStyle = INK; ctx.fill(dots);
      ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(slow);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = HOT; ctx.stroke(fast);
      ctx.globalAlpha = 1;

      idleFrames = energy / n < 0.02 && Math.abs(p.vx) + Math.abs(p.vy) < 0.1 ? idleFrames + 1 : 0;
      if (idleFrames > 20 || !visible) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function wake() { if (!running && visible) { running = true; idleFrames = 0; requestAnimationFrame(frame); } }

    function still() { // one static frame, for reduced motion
      ctx.clearRect(0, 0, w, h); ctx.globalAlpha = 0.34; ctx.fillStyle = INK;
      const dots = new Path2D();
      for (let i = 0; i < n; i++) { dots.moveTo(rx[i] + 1.1, ry[i]); dots.arc(rx[i], ry[i], 1.1, 0, 6.2832); }
      ctx.fill(dots); ctx.globalAlpha = 1;
    }

    build();
    if (reduce) { still(); new ResizeObserver(() => { build(); still(); }).observe(canvas); return { kick() {} }; }

    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left, ny = e.clientY - r.top;
      if (p.inside) { p.vx += (nx - p.x) * 0.5; p.vy += (ny - p.y) * 0.5; }
      p.x = nx; p.y = ny; p.inside = true; wake();
    }, { passive: true });
    host.addEventListener('pointerleave', () => { p.inside = false; p.x = p.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }).observe(canvas);
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(); wake(); }, 120); }).observe(canvas);
    intro();

    return {
      // Scrolling pulls the dots into vertical lines, in proportion to speed.
      kick(v) {
        if (!visible || Math.abs(v) < 0.4) return;
        const k = Math.max(-40, Math.min(40, v)) * 0.09;
        for (let i = 0; i < n; i++) vy[i] -= k * (0.6 + 0.4 * ((i * 7919) % 13) / 13);
        wake();
      }
    };
  }

  const canvas = document.querySelector('.field');
  const field = canvas ? dotField(canvas) : { kick() {} };

  /* ---------------- Everything below needs GSAP ---------------- */
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  /* 2. Weighted scrolling */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', (e) => { ST.update(); field.kick(e.velocity); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    }));
  }

  /* 3. Headings rise letter by letter; blocks ease in */
  function split(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const wd = document.createElement('span'); wd.className = 'w'; wd.setAttribute('aria-hidden', 'true');
            [...part].forEach((chr) => { const c = document.createElement('span'); c.className = 'c'; c.textContent = chr; wd.appendChild(c); });
            frag.appendChild(wd);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    return el.querySelectorAll('.c');
  }

  if (!reduce) {
    document.querySelectorAll('h2.split').forEach((h) => {
      const chars = split(h);
      gsap.set(h, { overflow: 'hidden', paddingBottom: '0.08em' });
      gsap.from(chars, {
        yPercent: 115, rotate: 7, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.022,
        scrollTrigger: { trigger: h, start: 'top 88%' }
      });
    });
    // The hero title is already visible at first paint; it only settles a little.
    const hero = document.querySelector('.hero-title');
    if (hero) gsap.from(hero, { y: 26, duration: 1.6, ease: 'expo.out' });

    document.querySelectorAll('.rv').forEach((el) => {
      gsap.from(el, { y: 44, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });

    // Journey: the dotted track draws into a solid line as you go.
    const track = document.querySelector('.journey-line path');
    if (track) gsap.fromTo(track, { attr: { 'stroke-dasharray': '0 9' } }, {
      attr: { 'stroke-dasharray': '9 0' }, ease: 'none',
      scrollTrigger: { trigger: '.journey-track', start: 'top 80%', end: 'bottom 45%', scrub: 1 }
    });
  }

  /* 4. The walker */
  const walker = document.querySelector('.walker');
  const perches = [...document.querySelectorAll('[data-perch]')];
  if (walker && perches.length > 1 && !reduce) {
    const mark = walker.querySelector('.walker-mark');
    const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY }; };
    const scaleOf = (el) => parseFloat(el.dataset.scale || '1');
    const darkAt = (el) => el.closest('[data-theme]')?.dataset.theme === 'dark';

    gsap.set(walker, { x: () => at(perches[0]).x, y: () => at(perches[0]).y, scale: scaleOf(perches[0]) });
    walker.classList.toggle('on-dark', darkAt(perches[0]));

    perches.slice(1).forEach((to, k) => {
      const from = perches[k];
      const section = to.closest('section, footer') || to;
      const dir = Math.sign(at(to).x - at(from).x) || 1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: 'top 88%', end: 'top 30%', scrub: 1.4, invalidateOnRefresh: true,
          onUpdate: (self) => walker.classList.toggle('on-dark', self.progress > 0.5 ? darkAt(to) : darkAt(from))
        }
      });
      tl.fromTo(walker,
        { x: () => at(from).x, y: () => at(from).y, scale: scaleOf(from) },
        { x: () => at(to).x, y: () => at(to).y, scale: scaleOf(to), ease: 'power1.inOut', immediateRender: false }, 0);
      // A hop along the way: lean into the move, rise, land.
      tl.fromTo(mark, { y: 0, rotation: 0 },
        { keyframes: { y: [0, -70, -40, 0], rotation: [0, -14 * dir, 8 * dir, 0] }, ease: 'none', immediateRender: false }, 0);
    });
    addEventListener('load', () => ST.refresh());
    document.fonts && document.fonts.ready.then(() => ST.refresh());
  }

  /* 5. Nav: follows the theme beneath it, steps aside on the way down */
  const nav = document.querySelector('.nav');
  if (nav) {
    // Read the section under the nav directly, so a jump never leaves it on the wrong theme.
    const themed = [...document.querySelectorAll('[data-theme]')];
    const setTheme = () => {
      const probe = nav.offsetHeight / 2;
      const sec = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
      if (sec) nav.dataset.on = sec.dataset.theme;
    };
    setTheme();
    ST.addEventListener('refresh', setTheme);
    let lastY = 0;
    ST.create({ start: 0, end: 'max', onUpdate: (s) => {
      setTheme();
      const y = s.scroll();
      nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
      if (y < lastY - 2 || y < 400) nav.classList.remove('is-hidden');
      lastY = y;
    } });
  }

  // Cards lean toward the pointer.
  if (finePointer && !reduce) {
    document.querySelectorAll('.card-media, .person-photo').forEach((m) => {
      const rx = gsap.quickTo(m, 'rotationX', { duration: 0.8, ease: 'expo.out' });
      const ry = gsap.quickTo(m, 'rotationY', { duration: 0.8, ease: 'expo.out' });
      const link = m.parentElement;
      link.addEventListener('pointermove', (e) => {
        const r = m.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 8);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      });
      link.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }
})();
