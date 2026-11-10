/* human-in-loop.dev: home page behaviour. Everything here is an enhancement; the page reads in full without it.
   1. Hero field: a grid of dots, and three rings of dots flowing round a loop with the logo's opening at eleven
      o'clock. The pointer and scrolling stretch dots into lines.
   2. Weighted scrolling: GSAP ScrollSmoother, as on gsap.com, driving ScrollTrigger.
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
  function heroField(canvas, perch, opts = {}) {
    const ctx = canvas.getContext('2d');
    // opts.dark: cream dots on a dark ground (the contact section); opts.rings: false for the grid alone.
    const dark = !!opts.dark, rings = opts.rings !== false;
    const INK = dark ? col('--cream') : col('--brown'), HOT = col('--orange'), DARK = col('--ink');
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
      const gap = narrow ? 30 : Math.max(20, Math.min(30, w / 56)); // fewer dots on phones
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      n = cols * rows;
      const radii = [1, 0.76, 0.52], speeds = [0.018, -0.026, 0.04];
      const counts = rings ? radii.map((f) => Math.round((2 * Math.PI * R * f) / 9)) : [0, 0, 0];
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
      ctx.globalAlpha = dark ? 0.16 : 0.22; ctx.fillStyle = INK; ctx.fill(gridDots);
      ctx.globalAlpha = 0.85; ctx.fillStyle = DARK; ctx.fill(ringDots);
      ctx.globalAlpha = dark ? 0.5 : 0.6; ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(slow);
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
    // Start once the page has loaded, so the animation never competes with loading.
    if (document.readyState === 'complete') wake(); else addEventListener('load', wake, { once: true });
    return {
      kick(v) {
        if (!visible || Math.abs(v) < 0.4) return;
        const k = clamp(v, -40, 40) * 0.09;
        for (let i = 0; i < n + m; i++) vy[i] -= k * (0.6 + 0.4 * ((i * 7919) % 13) / 13);
      }
    };
  }
  const field = (() => { const c = document.querySelector('.field'); return c ? heroField(c, document.querySelector('.perch-hero')) : { kick() {} }; })();
  // The contact section gets the same field: cream dots on black, stretched into lines by the pointer.
  const ctaField = (() => { const c = document.querySelector('.cta-field'); return c ? heroField(c, null, { rings: false, dark: true }) : { kick() {} }; })();

  /* ---------------- Everything below needs GSAP ---------------- */
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  // Setup below the fold runs in small tasks, each in its own turn of the event loop, so the main thread
  // is never blocked for long while the page is loading (keeps Total Blocking Time low on slow phones).
  const tasks = [];
  const later = (fn) => { if (!reduce) tasks.push(fn); };
  const runTasks = () => {
    // One full re-measure, after the setup, the load event and the fonts: each refresh is a long task.
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const next = () => {
      const fn = tasks.shift();
      if (!fn) { Promise.all([loaded, fonts]).then(() => setTimeout(() => ST.refresh(), 0)); return; }
      fn(); setTimeout(next, 0);
    };
    setTimeout(next, 0);
  };

  /* 2. Weighted scrolling: ScrollSmoother, the engine gsap.com uses. The page follows the wheel with a long,
     eased lag. gsap.com itself scrolls natively and lets crisp entrance animations do the work, so the lag here is
     kept light (1 second) and the scenes follow the scroll almost directly: one layer of smoothing, never two. */
  let smoother = null;
  // Mouse and trackpad only: on touch screens native scrolling already has momentum, and smoothing it fights the finger.
  if (!reduce && finePointer && window.ScrollSmoother) {
    gsap.registerPlugin(window.ScrollSmoother);
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1, effects: true, smoothTouch: 0.1 });
    gsap.ticker.add(() => { const v = smoother.getVelocity() / 60; field.kick(v); ctaField.kick(v); });
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault(); smoother.scrollTo(target, true, 'top top');
    }));
  }

  /* 3. Pinned scenes (created first, so later triggers measure the pin spacing) */
  later(() => {
    // The reel: a small, tilted card grows, flattens and opens to full screen; PLAY and REEL part.
    const card = document.querySelector('.reel-card');
    const cover = () => Math.max(innerWidth / card.offsetWidth, innerHeight / card.offsetHeight) * 1.02;
    const reelTl = gsap.timeline({ scrollTrigger: { id: 'reel', trigger: '.reel', start: 'top top', end: '+=200%', pin: '.reel-stick', scrub: 0.5, invalidateOnRefresh: true } });
    reelTl.fromTo(card, { scale: 0.42, rotation: -5, borderRadius: 18 }, { scale: 1, rotation: 0, borderRadius: 14, ease: 'power2.out', duration: 0.55 }, 0)
      .to(card, { scale: cover, borderRadius: 0, ease: 'power2.in', duration: 0.45 }, 0.55)
      .fromTo('.reel-label span:first-child', { xPercent: 0 }, { xPercent: -70, ease: 'power1.inOut', duration: 0.7 }, 0)
      .fromTo('.reel-label span:last-child', { xPercent: 0 }, { xPercent: 70, ease: 'power1.inOut', duration: 0.7 }, 0)
      .to('.reel-label', { opacity: 0, duration: 0.2 }, 0.75);

  });
  later(() => {
    // The loops: AI, then design.
    const loopsTl = gsap.timeline({ scrollTrigger: { id: 'loops', trigger: '.loops', start: 'top top', end: '+=360%', pin: '.loops-stick', scrub: 0.5 } });
    loopsTl.fromTo('.panel-ai', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.12)
      .to('.panel-ai', { autoAlpha: 0, y: -40, duration: 0.08 }, 0.42)
      .fromTo('.panel-design', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.66)
      .fromTo('.loops-meter b', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
      .fromTo('.loops-fallback', { rotation: 0, scale: 0.8 }, { rotation: 140, scale: 1.1, ease: 'none', duration: 1 }, 0)
      .set({}, {}, 1);

  });
  later(() => {
    // The work showcase: the section pins and the cards move right to left as you scroll. The card in the middle
    // faces you; the others turn away by how far they are from it. The bar below follows the one in the middle.
    const sec = document.querySelector('.work'), track = sec && sec.querySelector('.work-track');
    if (!sec || !track) return;
    const cards = [...track.querySelectorAll('.wcard')], stage = sec.querySelector('.work-stage');
    const nameEl = sec.querySelector('.work-name'), tagsEl = sec.querySelector('.work-tags'), noEl = sec.querySelector('.work-no');
    const curEl = sec.querySelector('.work-cur'), totEl = sec.querySelector('.work-total'), bar = sec.querySelector('.work-count b');
    const pad2 = (n) => String(n).padStart(2, '0');
    totEl.textContent = pad2(cards.length);
    let active = -1;
    const show = (a) => {
      if (a === active) return; active = a;
      cards.forEach((c, i) => c.classList.toggle('on', i === a));
      nameEl.textContent = cards[a].querySelector('.wcard-title').textContent;
      tagsEl.textContent = cards[a].dataset.tags || '';
      noEl.textContent = curEl.textContent = pad2(a + 1);
    };
    show(0);
    if (innerWidth < 900) return;                  // phones keep a row you swipe through
    sec.classList.add('is-show');
    gsap.set(track, { overflow: 'visible', scrollSnapType: 'none' });
    const centre = (el) => el.offsetLeft + el.offsetWidth / 2;
    const layout = (prog) => {
      const mid = stage.clientWidth / 2, first = centre(cards[0]), span = centre(cards[cards.length - 1]) - first;
      const x = mid - first - span * prog, step = cards[0].offsetWidth + 32;
      gsap.set(track, { x });
      cards.forEach((c) => {
        const d = (centre(c) + x - mid) / step, ad = Math.min(Math.abs(d), 2.5);
        gsap.set(c, { rotationY: -Math.max(-1, Math.min(1, d)) * 38, z: -ad * 160, scale: 1 - ad * 0.06, opacity: 1 - Math.max(0, ad - 1.2) * 0.5, zIndex: 10 - Math.round(ad * 2) });
      });
      show(Math.round(prog * (cards.length - 1)));
      gsap.set(bar, { scaleX: prog });
    };
    ST.create({ id: 'work', trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.75 * (cards.length - 1)), pin: '.work-stick',
      invalidateOnRefresh: true, onUpdate: (s) => layout(s.progress), onRefresh: (s) => layout(s.progress) });
    layout(0);

    // A distorted plane on hover: the picture ripples like water (an SVG displacement over turbulence that drifts),
    // and the card tips back a little. One shared filter; it is only applied to the card under the pointer.
    if (!finePointer) return;
    const disp = document.querySelector('#ripple feDisplacementMap'), turb = document.querySelector('#ripple feTurbulence');
    if (!disp || !turb) return;
    const fx = { s: 0, f: 0.006 };
    let current = null;
    gsap.ticker.add(() => {
      if (!current) return;
      disp.setAttribute('scale', fx.s.toFixed(2));
      turb.setAttribute('baseFrequency', `${fx.f.toFixed(4)} ${(fx.f * 2).toFixed(4)}`);
    });
    cards.forEach((c) => {
      const link = c.querySelector('.wcard-link'), media = c.querySelector('.wcard-media');
      link.addEventListener('pointerenter', () => {
        if (current && current !== media) current.style.filter = '';
        current = media; media.style.filter = 'url(#ripple)';
        gsap.to(fx, { s: 26, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        gsap.fromTo(fx, { f: 0.004 }, { f: 0.012, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to(media, { rotationX: 7, transformPerspective: 900, duration: 0.9, ease: 'expo.out' });
      });
      link.addEventListener('pointerleave', () => {
        gsap.killTweensOf(fx, 'f');
        gsap.to(fx, { s: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto', onComplete: () => { if (current === media) { media.style.filter = ''; current = null; } } });
        gsap.to(media, { rotationX: 0, duration: 0.9, ease: 'expo.out' });
      });
    });
  });
  later(() => {
    // Into space: a long fall. The words drift away, the human tumbles toward the wormhole and through it.
    // (scene.js draws the space, the wormhole and the human from this trigger's progress.)
    // Ten screens of scroll (at least 4,000px): the approach, the wormhole, the tunnel, a new place, the glass.
    // Near the end of the tunnel the scroll gets heavy: the smoothing deepens, so the page lags further behind the
    // wheel, as if the hole were pulling back. It eases off again after the flip.
    const portalTl = gsap.timeline({ scrollTrigger: { id: 'portal', trigger: '.portal', start: 'top top', end: () => '+=' + Math.max(4800, innerHeight * 12), pin: '.portal-stick', scrub: 0.4, invalidateOnRefresh: true } });
    // Phases (scene.js): approach the portal 0-0.42, through it and the tunnel 0.42-0.70, flash and flip at 0.72,
    // he glides toward us 0.75-0.92, breaks the glass at 0.92, and jumps out toward the contact section.
    portalTl.to('.portal-intro', { autoAlpha: 0, y: -80, duration: 0.08, ease: 'power2.in' }, 0.05)
      .fromTo('.portal-mid', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.52)
      .to('.portal-mid', { autoAlpha: 0, y: -30, duration: 0.05 }, 0.64)

      .fromTo('.portal-meter b', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
      .set({}, {}, 1);
  });
  later(() => {
    // The contact section holds still for 120% of the screen, so a fast scroll can't skip past it.
    ST.create({ id: 'cta', trigger: '.cta', start: 'top top', end: '+=120%', pin: true });
  });

  /* 4. Words, headings, drawings */
  if (!reduce) {
    const hero = document.querySelector('.hero-title');
    if (hero) gsap.from(hero.querySelectorAll('.ln'), { y: 30, duration: 1.6, ease: 'expo.out', stagger: 0.08 });
  }
  later(() => {
    // The statement inks in, word by word, from the tone colour (which still passes contrast at this size).
    document.querySelectorAll('.words').forEach((el) => {
      const parts = el.textContent.trim().split(/\s+/);
      el.innerHTML = parts.map((w) => `<span class="wd">${w}</span>`).join(' ');
      gsap.fromTo(el.querySelectorAll('.wd'), { color: col('--tone') }, {
        color: col('--ink'), stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true }
      });
    });

  });
  later(() => {
    // Headings rise letter by letter.
    document.querySelectorAll('h2.split').forEach((h) => {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      const words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="c">${c}</span>`).join('')}</span>`).join(' ');
      gsap.set(h, { overflow: 'hidden', paddingBottom: '0.08em' });
      gsap.from(h.querySelectorAll('.c'), { yPercent: 115, rotate: 7, opacity: 0, duration: 1.15, ease: 'expo.out', stagger: 0.022, scrollTrigger: { trigger: h, start: 'top 88%' } });
    });

  });
  later(() => {
    // Line drawings draw themselves on the way in, and again on hover.
    document.querySelectorAll('.svc').forEach((svc) => {
      const strokes = svc.querySelectorAll('.draw [pathLength]');
      gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: { trigger: svc, start: 'top 85%' } });
      svc.addEventListener('mouseenter', () => gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.08, overwrite: true }));
    });

    // The process ribbon: a thick line draws over a dotted track, its head (a dot) leading the way.
    // Real path length in its own units (no non-scaling stroke), so the dash maths stays exact and smooth.
    const ribbon = document.querySelector('.proc-ribbon'), head = document.querySelector('.proc-head');
    if (ribbon) {
      const len = ribbon.getTotalLength(), state = { p: 0 }, steps = [...document.querySelectorAll('.step')];
      ribbon.style.strokeDasharray = `${len} ${len}`; ribbon.style.strokeDashoffset = len;
      const draw = () => {
        ribbon.style.strokeDashoffset = len * (1 - state.p);
        const pt = ribbon.getPointAtLength(len * state.p); head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y);
        steps.forEach((s, i) => s.classList.toggle('on', state.p >= (i + 0.25) / steps.length)); // each step lights up as the head passes
      };
      gsap.to(state, { p: 1, ease: 'none', onUpdate: draw, scrollTrigger: { trigger: '.proc', start: 'top 80%', end: 'bottom 50%', scrub: 0.8 } });
    }

    // The reveal (after Fragment): each block fades in while a soft oval opens across it from the left, in small
    // staggered batches as they reach the bottom of the screen. Only blocks with no entrance of their own; never the
    // hero (already on screen) or the pinned 3D stages. The mask comes off once it is done.
    const shown = gsap.utils.toArray('.idx, .statement-foot, .svc-col-name, .svc, .step, .tm-name, .cta-center > *, .next-kicker, .foot-grid > *')
      .filter((el) => !el.closest('.hero, .reel, .loops, .portal, .work-stage'));
    shown.forEach((el) => el.classList.add('entry'));
    gsap.set(shown, { opacity: 0, '--reveal': '0%' });
    ST.batch(shown, {
      start: 'top 92%', once: true, interval: 0.08,
      onEnter: (els) => {
        gsap.to(els, { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08, overwrite: 'auto' });
        gsap.to(els, { '--reveal': '230%', duration: 0.76, ease: 'power2.out', stagger: 0.08, onComplete: () => els.forEach((el) => el.classList.remove('entry')) });
      }
    });
  });

  /* 4a. The humans: the section pins and the scroll walks through the people. The name you are on turns ink and
     its line fills; the picture wipes in from the right. A name is a button that scrolls to its person.
     Phones keep a plain stacked list. */
  later(() => {
    const sec = document.querySelector('.team'), items = gsap.utils.toArray('.tm');
    if (!sec || items.length < 2 || innerWidth < 900) return;
    const bars = items.map((it) => it.querySelector('.tm-bar i')), n = items.length;
    let on = 0;
    const pick = (i) => {
      if (i === on) return;
      items.forEach((it, k) => it.classList.toggle('is-on', k === i));
      const m = items[i].querySelector('.tm-media');
      if (m && !reduce) gsap.fromTo(m, { clipPath: 'inset(0% 0% 0% 100% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 0.9, ease: 'power4.out', clearProps: 'clipPath' });
      on = i;
    };
    const st = ST.create({
      id: 'team', trigger: sec, start: 'top top', end: () => '+=' + innerHeight * n * 0.6, pin: '.team-stick', anticipatePin: 1,
      onUpdate: (s) => { const f = s.progress * n, i = Math.min(n - 1, Math.floor(f)); pick(i); bars.forEach((b, k) => gsap.set(b, { scaleX: k === i ? Math.min(1, f - i) : 0 })); }
    });
    items.forEach((it, k) => it.querySelector('.tm-name').addEventListener('click', () => {
      const y = st.start + (st.end - st.start) * ((k + 0.5) / n);
      smoother ? smoother.scrollTo(y, true) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }));
  });

  // With reduced motion there is no pin: the names simply switch the picture.
  if (reduce) document.querySelectorAll('.tm').forEach((it, k, all) => it.querySelector('.tm-name').addEventListener('click', () => all.forEach((o, j) => o.classList.toggle('is-on', j === k))));

  /* 4b. Weight in every section: parts move at different speeds (parallax), and lists lean with the speed of the
     scroll, then settle, so a flick of the wheel feels like moving something heavy. */
  later(() => {
    const lag = (sel, dist) => document.querySelectorAll(sel).forEach((el) => {
      gsap.fromTo(el, { y: dist }, { y: -dist, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    lag('.sec-head h2:not(.team h2)', 40);  // not in the pinned humans section, where it would slide onto its label
    lag('.statement-text', 50); lag('.svc-col-name', 30);
    lag('.card:nth-child(2), .card:nth-child(4)', 70); lag('.proc-steps', 24);
    // Pictures drift inside their frames.
    document.querySelectorAll('.card-media').forEach((m) => {
      gsap.fromTo(m, { backgroundPosition: '50% 0%' }, { backgroundPosition: '50% 100%', ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    const leaners = gsap.utils.toArray('.work-list, .svc-cols');
    const skew = gsap.quickTo(leaners, 'skewY', { duration: 0.9, ease: 'power3.out' });
    ST.create({ start: 0, end: 'max', onUpdate: (s) => skew(clamp(s.getVelocity() / -900, -3, 3)) });
  });

  /* 4c. Contact: the line drawings drift with the scroll at their own depth, and lean away from the pointer;
     the headline's underlines draw in when it arrives. */
  later(() => {
    const floats = gsap.utils.toArray('.float');
    floats.forEach((f) => {
      const d = parseFloat(f.dataset.depth || '0.5');
      gsap.fromTo(f, { y: 160 * d }, { y: -160 * d, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: 2 } });
    });
    const cta = document.querySelector('.cta');
    if (cta && finePointer) {
      const movers = floats.map((f) => ({ f, i: f.querySelector('i'), x: gsap.quickTo(f.querySelector('i'), 'x', { duration: 1.2, ease: 'expo.out' }), y: gsap.quickTo(f.querySelector('i'), 'y', { duration: 1.2, ease: 'expo.out' }) }));
      cta.addEventListener('pointermove', (e) => movers.forEach((m) => {
        const r = m.f.getBoundingClientRect(), dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY, d = Math.hypot(dx, dy) || 1;
        // Lean away as the pointer comes near; once it is over a drawing, hold still so the hover can show.
        const push = d < r.width * 0.55 ? 0 : Math.max(0, 1 - d / 320) * 70; m.x((dx / d) * push); m.y((dy / d) * push);
      }));
      cta.addEventListener('pointerleave', () => movers.forEach((m) => { m.x(0); m.y(0); }));
    }
    gsap.fromTo('.cta-title .ul', { '--u': 0 }, { '--u': 1, duration: 1.4, ease: 'expo.inOut', stagger: 0.18, scrollTrigger: { trigger: '.cta-title', start: 'top 75%' } });
  });

  // The contact section's drawings only drift while it is on screen.
  { const cta = document.querySelector('.cta'); if (cta) new IntersectionObserver(([e]) => cta.classList.toggle('live', e.isIntersecting)).observe(cta); }

  // Hover lines near the right edge open leftwards, so they never run off the screen.
  document.querySelectorAll('.quipped').forEach((el) => el.addEventListener('pointerenter', () => {
    const q = el.querySelector(':scope > .quip'); if (!q || q.classList.contains('quip-pill')) return;
    q.classList.toggle('quip-end', el.getBoundingClientRect().left + 270 > innerWidth);
  }));

  /* 4d. The stages lean with the pointer, like a screen being tipped: the reel, the loops, space and contact. */
  if (finePointer) later(() => {
    document.querySelectorAll('.tilt').forEach((el) => {
      const host = el.parentElement;
      gsap.set(el, { scale: 1.04, transformPerspective: 1400 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 1.4, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 1.4, ease: 'power3.out' });
      host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 6); rx(-((e.clientY - r.top) / r.height - 0.5) * 4.5); });
      host.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    // Titles trail their pictures a little, as on gsap.com.
    if (smoother) smoother.effects('.card-title, .card-desc', { lag: (i) => 0.12 + (i % 3) * 0.06 });
  });

  /* 5. The walker */
  const walker = document.querySelector('.walker');
  const perches = [...document.querySelectorAll('[data-perch]')];
  // Stand him on the hero's rings straight away; his travels are set up with the rest.
  if (walker && perches[0] && !reduce) {
    const c0 = document.querySelector('#smooth-content') || document.body, r0 = perches[0].getBoundingClientRect(), cr = c0.getBoundingClientRect();
    gsap.set(walker, { x: r0.left - cr.left, y: r0.top - cr.top, scale: parseFloat(perches[0].dataset.scale || '1') });
  }
  if (walker && perches.length > 1) later(() => {
    const mark = walker.querySelector('.walker-mark'), bubble = walker.querySelector('.walker-say');
    // Positions inside the scrolling content (the walker lives there too), so smoothing never makes him drift.
    const content = document.querySelector('#smooth-content') || document.body;
    const at = (el) => { const r = el.getBoundingClientRect(), c = content.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top }; };
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
    // Once he has been pulled into the hole, the 3D figure carries on for him, through to the contact section.
    ST.create({ trigger: '.portal', start: 'top top', endTrigger: '.foot', end: 'bottom bottom', onToggle: (s) => walker.classList.toggle('away', s.isActive) });

    perches.slice(1).forEach((to, k) => {
      const from = perches[k];
      const section = to.closest('section, footer') || to;
      const dir = Math.sign(at(to).x - at(from).x) || 1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: 'top 88%', end: 'top 28%', scrub: 0.8, invalidateOnRefresh: true,
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

    // Into the space section: he comes down from his last perch to where his spiral will start (upper left of the
    // portal), upright and growing; there the full figure takes over at his real size (scene.js, arrival).
    // was: dragged in, pulled from his last perch to the middle of the screen,
    // spinning and shrinking, into the hole; the 3D figure takes over from that point.
    const last = perches[perches.length - 1], portalEl = document.querySelector('.portal');
    if (portalEl) {
      const target = () => { const a = at(portalEl), m = Math.min(innerWidth, innerHeight); return { x: a.x + innerWidth / 2 + Math.cos(-2.75) * m * 0.36, y: a.y + innerHeight / 2 + Math.sin(-2.75) * m * 0.36 }; };
      gsap.timeline({ scrollTrigger: { trigger: portalEl, start: 'top 85%', end: 'top top', scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (self) => { walker.classList.toggle('on-dark', self.progress > 0.3); if (self.progress > 0.05) hush(); } } })
        .fromTo(walker, { x: () => at(last).x, y: () => at(last).y, scale: scaleOf(last), rotation: 0 },
          { x: () => target().x, y: () => target().y, scale: 2.4, rotation: 0, ease: 'power2.inOut', immediateRender: false });
    }
  });

  /* 5b. Next page: the bar fills as you keep scrolling; at the end it goes to the About page, if there is one yet. */
  later(() => {
    const next = document.querySelector('.next'), bar = document.querySelector('.next-bar b'), link = document.querySelector('.next-title');
    if (!next || !bar) return;
    let gone = false;
    gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: next, start: 'top top', end: '+=120%', pin: '.next-stick', scrub: 0.6,
      onUpdate: (self) => {
        if (gone || self.progress < 0.999 || self.direction < 0) return;
        gone = true;
        fetch(link.getAttribute('href'), { method: 'HEAD' }).then((r) => { if (r.ok) location.href = link.href; else gone = false; }).catch(() => { gone = false; });
      } } });
  });

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

  if (finePointer) later(() => {
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
  });
  // Below-the-fold setup waits for the first sign of a reader (scroll, wheel, pointer, touch, key): nothing it
  // drives is visible before then, and the first paint and main thread stay free while the page loads.
  {
    const evs = ['scroll', 'wheel', 'pointermove', 'touchstart', 'keydown'];
    let started = false;
    const start = () => { if (started) return; started = true; evs.forEach((ev) => removeEventListener(ev, start)); runTasks(); };
    evs.forEach((ev) => addEventListener(ev, start, { passive: true }));
    if (scrollY > 50 || location.hash) start();
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
