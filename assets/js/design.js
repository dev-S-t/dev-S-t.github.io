/* The Design loop: Abhishek Sharma's portfolio. His Framer site, rebuilt in plain HTML and GSAP, with threads from
   human-in-loop: selection boxes and lines that draw themselves (DrawSVG), the line the cursor leaves, a thread down
   the page, and, new, How I work (a drawn path, a morphing mark, dots that gather into it) and a growing timeline.
   Everything readable is in the HTML; with scripts off, or reduced motion, the page reads as it is. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.body;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- toggles: after-hours, another vibe, colour, the ghost ---------- */
  const arena = document.querySelector('.dz-arena');
  document.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.toggle;
    if (k === 'dark') root.classList.toggle('is-dark');
    if (k === 'vibe') root.classList.toggle('is-vibe');
    if (k === 'ghost') root.classList.toggle('no-ghost');
    if (k === 'colour' && arena) arena.classList.toggle('is-colour');
    document.querySelectorAll(`.dz-toolbar [data-toggle="${k}"]`).forEach((t) => t.classList.toggle('is-on',
      k === 'dark' ? root.classList.contains('is-dark') : k === 'vibe' ? root.classList.contains('is-vibe') : k === 'ghost' ? root.classList.contains('no-ghost') : arena.classList.contains('is-colour')));
  }));

  /* ---------- the swapping word after "I imagine." ---------- */
  const words = [...document.querySelectorAll('.dz-word')];
  if (words.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      const cur = words[i]; i = (i + 1) % words.length; const nx = words[i];
      if (window.gsap) {
        gsap.to(cur, { yPercent: -60, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { cur.classList.remove('is-on'); gsap.set(cur, { yPercent: 0, opacity: 1 }); } });
        nx.classList.add('is-on'); gsap.fromTo(nx, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.2 });
      } else { cur.classList.remove('is-on'); nx.classList.add('is-on'); }
      // the selection box follows the new word's width
      const box = document.querySelector('.dz-swap .sel-box rect');
      if (box && window.gsap) gsap.to(box, { attr: { width: nx.offsetWidth + 0.24 * parseFloat(getComputedStyle(nx).fontSize) + 10 }, duration: 0.5, ease: 'power3.inOut', delay: 0.15 });
    }, 2400);
  }

  /* ---------- the line the cursor leaves: a fine stroke that follows and fades ---------- */
  const trail = document.querySelector('.dz-trail');
  if (trail && fine && !reduce) {
    const g = trail.getContext('2d'); let w = 0, h = 0, dpr = 1; const pts = [];
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; trail.width = w * dpr; trail.height = h * dpr; };
    size(); addEventListener('resize', size);
    addEventListener('pointermove', (e) => { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 60) pts.shift(); }, { passive: true });
    const loop = () => {
      const now = performance.now();
      while (pts.length && now - pts[0].t > 700) pts.shift();
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      if (pts.length > 2) {
        const col = getComputedStyle(root).getPropertyValue('--blue').trim() || '#1677FF';
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k], life = 1 - (now - b.t) / 700;
          g.strokeStyle = col; g.globalAlpha = life * 0.55; g.lineWidth = 0.6 + life * 1.4;
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
        g.globalAlpha = 1;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- the Craft & the Kit: chips you can throw, line up, drop, pull together ---------- */
  const chips = [...document.querySelectorAll('.dz-chip')];
  if (arena && chips.length) {
    const st = chips.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, w: 0, h: 0, drag: false }));
    let W = 0, H = 0, physics = false;
    const measure = () => { W = arena.clientWidth; H = arena.clientHeight; chips.forEach((c, i) => { st[i].w = c.offsetWidth; st[i].h = c.offsetHeight; }); };
    const put = (i) => { const s = st[i]; chips[i].style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`; };
    const to = (targets, ease = 'power3.out', dur = 0.9) => {
      physics = false;
      chips.forEach((c, i) => {
        const s = st[i], t = targets[i];
        if (window.gsap && !reduce) gsap.to(s, { x: t.x, y: t.y, r: t.r || 0, duration: dur + Math.random() * 0.25, ease, onUpdate: () => put(i) });
        else { s.x = t.x; s.y = t.y; s.r = t.r || 0; put(i); }
      });
    };
    const scatter = () => to(chips.map((c, i) => ({ x: 20 + Math.random() * Math.max(10, W - st[i].w - 40), y: 20 + Math.random() * Math.max(10, H - st[i].h - 120), r: (Math.random() - 0.5) * 18 })), 'power3.out', 1);
    // rows from a starting point, wrapping at a width
    const pack = (list, x0, y0, wmax, gap = 8) => {
      let x = x0, y = y0, rowH = 0; const out = {};
      list.forEach((i) => { const s = st[i]; if (x + s.w > x0 + wmax) { x = x0; y += rowH + gap; rowH = 0; } out[i] = { x, y }; x += s.w + gap; rowH = Math.max(rowH, s.h); });
      return { out, bottom: y + rowH };
    };
    const tidy = () => {
      arena.classList.add('is-tidy');
      const cols = [...arena.querySelectorAll('.dz-cols span')].map((sp) => ({ x: sp.offsetLeft + 12, w: sp.offsetWidth - 24 }));
      const groups = ['design', 'build', 'lead'], targets = [];
      groups.forEach((gname, gi) => {
        const ids = chips.map((c, i) => (c.dataset.g === gname ? i : -1)).filter((i) => i >= 0);
        const { out } = pack(ids, cols[gi].x, 44, cols[gi].w);
        ids.forEach((i) => { targets[i] = out[i]; });
      });
      to(targets, 'power3.inOut', 0.9);
    };
    const gravity = () => {
      const ids = chips.map((c, i) => i).sort(() => Math.random() - 0.5);
      // fill rows from the floor up
      let x = 16, y = H - 16, rowH = 0; const targets = [];
      ids.forEach((i) => { const s = st[i]; if (x + s.w > W - 16) { x = 16 + Math.random() * 30; y -= rowH + 2; rowH = 0; } targets[i] = { x, y: y - s.h, r: (Math.random() - 0.5) * 10 }; x += s.w + 2 + Math.random() * 6; rowH = Math.max(rowH, s.h); });
      to(targets, 'bounce.out', 1.2);
    };
    const pull = () => {
      const ids = chips.map((c, i) => i); const wmax = Math.min(W - 40, 640);
      const { out, bottom } = pack(ids, 0, 0, wmax, 6);
      const ox = (W - wmax) / 2, oy = (H - bottom) / 2 - 20;
      to(ids.map((i) => ({ x: out[i].x + ox, y: out[i].y + oy, r: (Math.random() - 0.5) * 4 })), 'power4.inOut', 0.9);
    };
    const modes = { tidy, scatter, gravity, pull };
    document.querySelectorAll('.dz-toolbar [data-mode]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.mode !== 'tidy') arena.classList.remove('is-tidy');
      document.querySelectorAll('.dz-toolbar [data-mode]').forEach((o) => o.classList.toggle('is-on', o === b));
      modes[b.dataset.mode]();
    }));
    // throwing: drag a chip, let go, it flies on and bounces off the walls
    let grabbed = -1, lastX = 0, lastY = 0, lastT = 0;
    chips.forEach((c, i) => c.addEventListener('pointerdown', (e) => {
      if (window.gsap) gsap.killTweensOf(st[i]);
      grabbed = i; c.setPointerCapture(e.pointerId); c.classList.add('is-grab'); arena.classList.remove('is-tidy');
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); st[i].vx = st[i].vy = 0; physics = true;
    }));
    addEventListener('pointermove', (e) => {
      if (grabbed < 0) return;
      const s = st[grabbed], now = performance.now(), dt = Math.max(8, now - lastT);
      s.x += e.clientX - lastX; s.y += e.clientY - lastY; s.vx = (e.clientX - lastX) / dt * 16; s.vy = (e.clientY - lastY) / dt * 16;
      s.r = clamp(s.vx * 1.5, -20, 20); lastX = e.clientX; lastY = e.clientY; lastT = now; put(grabbed);
    });
    addEventListener('pointerup', () => { if (grabbed >= 0) { chips[grabbed].classList.remove('is-grab'); grabbed = -1; } });
    const step = () => {
      if (physics) chips.forEach((c, i) => {
        const s = st[i]; if (i === grabbed) return;
        if (Math.abs(s.vx) + Math.abs(s.vy) < 0.05) return;
        s.x += s.vx; s.y += s.vy; s.vx *= 0.94; s.vy *= 0.94; s.r *= 0.96;
        if (s.x < 0) { s.x = 0; s.vx *= -0.6; } if (s.x > W - s.w) { s.x = W - s.w; s.vx *= -0.6; }
        if (s.y < 0) { s.y = 0; s.vy *= -0.6; } if (s.y > H - s.h) { s.y = H - s.h; s.vy *= -0.6; }
        put(i);
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const start = () => { measure(); chips.forEach((c, i) => { st[i].x = W / 2; st[i].y = -60; put(i); }); scatter(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
    addEventListener('resize', () => { measure(); pull(); });
  }

  /* ---------- everything driven by GSAP ---------- */
  addEventListener('DOMContentLoaded', () => {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);
    if (window.DrawSVGPlugin) gsap.registerPlugin(window.DrawSVGPlugin);
    if (window.MorphSVGPlugin) gsap.registerPlugin(window.MorphSVGPlugin);
    const canDraw = !!window.DrawSVGPlugin, canMorph = !!window.MorphSVGPlugin;

    // selection boxes: size each rect to its box, then draw it on
    const fitBoxes = () => document.querySelectorAll('.sel-box').forEach((svg) => { const r = svg.querySelector('rect'), b = svg.getBoundingClientRect(); r.setAttribute('width', Math.max(0, b.width - 2)); r.setAttribute('height', Math.max(0, b.height - 2)); });
    fitBoxes(); addEventListener('resize', fitBoxes);
    if (document.fonts) document.fonts.ready.then(fitBoxes);
    if (reduce) return;
    if (canDraw) gsap.from('.sel-box rect', { drawSVG: '0%', duration: 1.4, ease: 'power2.inOut', stagger: 0.3, delay: 0.3 });

    // An element that has a CSS transition on the same property GSAP animates ends up frozen at its starting pose
    // (the two fight over the value), so those elements drop their transition while GSAP brings them in.
    const calm = (sel) => { const els = gsap.utils.toArray(sel); els.forEach((e) => e.classList.add('no-tr')); return () => els.forEach((e) => e.classList.remove('no-tr')); };
    const introDone = calm('.dz-avatar, .dz-palette, .dz-sticker, .dz-ghost');
    // the hero arrives: name, stickers, avatar, the two lines, the palette
    const intro = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.1 }, onComplete: introDone });
    intro.from('.dz-avatar', { scale: 0.6, rotate: -20, opacity: 0, ease: 'back.out(1.6)' }, 0.1)
      .from('.dz-line', { yPercent: 60, opacity: 0, stagger: 0.12 }, 0.2)
      .from('.dz-tag', { y: 10, opacity: 0 }, 0.35)
      .from('.dz-palette', { x: 40, rotate: 12, opacity: 0 }, 0.4)
      .from('.dz-sticker', { scale: 0, rotate: 40, stagger: 0.1, ease: 'back.out(2)' }, 0.5)
      .from('.dz-ghost', { x: 30, y: 20, opacity: 0, ease: 'power3.out' }, 0.9)
      .from('.dz-dock', { y: 80, opacity: 0 }, 0.6);

    // I build it: the words fill in as you read down; the tools pop in
    const ship = document.querySelector('.dz-ship-text');
    if (ship) {
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.append(s); } }); n.replaceWith(f); }
        else walk(n);
      });
      walk(ship);
      gsap.fromTo(ship.querySelectorAll('.w'), { opacity: 0.15 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: ship, start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } });
      const toolsDone = calm('.dz-tools li');
      gsap.from('.dz-tools li', { onComplete: toolsDone, y: 40, rotate: () => (Math.random() - 0.5) * 60, opacity: 0, duration: 1, ease: 'back.out(1.8)', stagger: 0.08, scrollTrigger: { trigger: '.dz-tools', start: 'top 85%' } });
    }

    // projects and about come up as you reach them
    gsap.from('.dz-folder', { y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.dz-folders', start: 'top 85%' } });
    gsap.from('.dz-work-head > *', { y: 24, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.dz-work-head', start: 'top 85%' } });
    const photoDone = calm('.dz-photo');
    gsap.from('.dz-photo', { onComplete: photoDone, rotate: -18, x: -60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.dz-about', start: 'top 75%' } });
    gsap.from('.dz-about-text > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.dz-about', start: 'top 70%' } });

    // How I work: pinned; the path draws to each step, the mark morphs, the dots gather into it
    const how = document.querySelector('.dz-how');
    if (how && innerWidth > 900) {
      const steps = [...how.querySelectorAll('.dz-step')], shapes = ['#shape-find', '#shape-sketch', '#shape-build', '#shape-ship'];
      const mark = how.querySelector('.dz-mark-path'), line = how.querySelector('.dz-how-line'), dots = makeDots(how.querySelector('.dz-dots'), shapes.map((s) => how.querySelector(s)), how.querySelector('.dz-mark'));
      let on = -1;
      const pick = (i) => {
        if (i === on) return; on = i;
        steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
        if (canMorph) gsap.to(mark, { morphSVG: shapes[i], duration: 0.8, ease: 'power3.inOut' });
        dots.form(i);
      };
      if (canDraw) gsap.set(line, { drawSVG: '0%' });
      ST.create({ trigger: how, start: 'top top', end: '+=260%', pin: '.dz-how-stick', scrub: 0.5, anticipatePin: 1,
        onUpdate: (s) => { if (canDraw) gsap.set(line, { drawSVG: `0% ${(s.progress * 100).toFixed(2)}%` }); pick(Math.min(3, Math.floor(s.progress * 4 + 0.05))); } });
      pick(0);
    }

    // Experience: the line grows as you read down; each stop lights when the line reaches it
    const time = document.querySelector('.dz-time');
    if (time) {
      const tl = time.querySelector('.dz-time-line'), stops = [...time.querySelectorAll('.dz-stop')];
      if (canDraw) gsap.fromTo(tl, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: time, start: 'top 70%', end: 'bottom 60%', scrub: 0.4 } });
      stops.forEach((s) => ST.create({ trigger: s, start: 'top 62%', onToggle: (t) => s.classList.toggle('is-on', t.isActive || t.progress > 0), end: 'max' }));
      gsap.from(stops, { x: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: time, start: 'top 75%' } });
    }

    // Contact: the lines rise out of their masks
    gsap.from('.dz-contact-title .ln > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.dz-contact', start: 'top 70%' } });
    gsap.from('.dz-contact-btns', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.dz-contact', start: 'top 60%' } });
    gsap.fromTo('.dz-foot-big', { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.dz-foot', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });

    // the thread: one line down the left of the page, bending in toward each section, drawn by the scroll
    const thread = document.querySelector('.dz-thread'), tp = thread && thread.querySelector('path');
    const buildThread = () => {
      if (!tp || innerWidth < 900) { if (thread) thread.style.display = 'none'; return; }
      thread.style.display = '';
      const H = document.documentElement.scrollHeight, x0 = 22; thread.setAttribute('height', H); thread.style.height = H + 'px';
      thread.setAttribute('viewBox', `0 0 ${innerWidth} ${H}`);
      let d = `M ${x0} 0`;
      document.querySelectorAll('main > section').forEach((sec) => {
        const y = sec.offsetTop + 90;
        d += ` L ${x0} ${y - 50} C ${x0} ${y - 20}, ${x0 + 18} ${y}, ${x0 + 40} ${y} C ${x0 + 18} ${y}, ${x0} ${y + 20}, ${x0} ${y + 50}`;
      });
      d += ` L ${x0} ${H}`; tp.setAttribute('d', d);
      if (canDraw) gsap.set(tp, { drawSVG: '0%' });
    };
    buildThread();
    ST.addEventListener('refresh', buildThread);
    if (canDraw && tp) ST.create({ start: 0, end: 'max', onUpdate: (s) => gsap.set(tp, { drawSVG: `0% ${(s.progress * 100).toFixed(2)}%` }) });
    addEventListener('load', () => ST.refresh());
  });

  /* ---------- dots that gather into a shape (How I work) ---------- */
  // About 900 dots drift loosely; for each step they fly to points along that step's mark, so the mark is drawn
  // in dots as well as in line. The pointer pushes them aside.
  function makeDots(canvas, shapeEls, svg) {
    if (!canvas || reduce) return { form() {} };
    const g = canvas.getContext('2d'); const N = innerWidth < 900 ? 420 : 900;
    let w = 0, h = 0, dpr = 1;
    const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), tx: 0, ty: 0, vx: 0, vy: 0, s: 1.2 + Math.random() * 1.6 }));
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; P.forEach((p) => { if (p.x <= 1) { p.x *= w; p.y *= h; } }); };
    size(); addEventListener('resize', size);
    // points along each shape, in the canvas's own pixels (the mark's box on screen)
    const targets = shapeEls.map((el) => {
      const len = el.getTotalLength(), pts = [];
      for (let i = 0; i < N; i++) { const q = el.getPointAtLength((i / N) * len); pts.push([q.x + (Math.random() - 0.5) * 3.4, q.y + (Math.random() - 0.5) * 3.4]); }
      return pts;
    });
    let shape = 0;
    const ptr = { x: -1e4, y: -1e4 };
    canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', () => { ptr.x = ptr.y = -1e4; });
    let live = false; new IntersectionObserver(([e]) => { live = e.isIntersecting; }).observe(canvas);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!live || !w) return;
      // the dots draw the step's mark large, centred on the small line mark: a halo of the same drawing
      const cr = canvas.getBoundingClientRect(), mr = svg.getBoundingClientRect(), sc = (mr.width / 100) * 2.3;
      const cx = mr.left - cr.left + mr.width / 2, cy = mr.top - cr.top + mr.height / 2;
      const ox = cx - 50 * sc, oy = cy - 50 * sc, T = targets[shape], col = getComputedStyle(document.body).getPropertyValue('--blue').trim() || '#1677FF';
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.fillStyle = col;
      for (let i = 0; i < N; i++) {
        const p = P[i], t = T[i], tx = ox + t[0] * sc, ty = oy + t[1] * sc;
        p.vx += (tx - p.x) * 0.02; p.vy += (ty - p.y) * 0.02;
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) { const d = Math.sqrt(d2) + 0.01, f = (1 - d / 80) * 2.2; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        p.vx *= 0.86; p.vy *= 0.86; p.x += p.vx; p.y += p.vy;
        g.globalAlpha = 0.55; g.fillRect(p.x, p.y, p.s, p.s);
      }
      g.globalAlpha = 1;
    };
    requestAnimationFrame(loop);
    return { form(i) {
      shape = i;
      // a little burst outward before they gather again
      P.forEach((p) => { p.vx += (Math.random() - 0.5) * 18; p.vy += (Math.random() - 0.5) * 18; });
    } };
  }
})();
