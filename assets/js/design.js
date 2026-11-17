/* The Design loop: Abhishek Sharma's portfolio, matched to his Framer site, with threads from human-in-loop.
   The Craft & the Kit is his own component (CraftAndKit.tsx), ported to plain script with its logic unchanged.
   Everything readable is in the HTML; with scripts off, or reduced motion, the page reads as it is. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.body;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- the moon sticker: lights off for the whole page ---------- */
  document.querySelectorAll('.dz-hero [data-toggle="dark"]').forEach((b) => b.addEventListener('click', () => root.classList.toggle('is-dark')));

  /* ---------- the palette: pointing at it tilts it ("press me ;)"); pressing it wakes the tools ---------- */
  const pal = document.querySelector('.dz-palette');
  if (pal) {
    pal.addEventListener('click', (e) => { if (!pal.classList.contains('is-on')) { pal.classList.add('is-on'); e.stopPropagation(); } });
    document.addEventListener('click', (e) => { if (!pal.contains(e.target)) pal.classList.remove('is-on'); });
    pal.addEventListener('pointerleave', () => setTimeout(() => { if (!pal.matches(':hover')) pal.classList.remove('is-on'); }, 1200));
  }

  /* ---------- the header and the dock hide as you read down and come back when you scroll up ---------- */
  const bars = [document.querySelector('.dz-top'), document.querySelector('.dz-dock')].filter(Boolean);
  if (bars.length) {
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y > 120 && y > lastY + 4) bars.forEach((b) => b.classList.add('is-hidden'));
      else if (y < lastY - 4 || y < 120) bars.forEach((b) => b.classList.remove('is-hidden'));
      lastY = y;
    }, { passive: true });
  }

  /* ---------- the dock: the tile under the pointer swells, its neighbours a little ---------- */
  const dock = document.querySelector('.dz-dock');
  if (dock) {
    const tiles = [...dock.querySelectorAll('a')];
    const mark = (i) => tiles.forEach((t, k) => { t.classList.toggle('m0', k === i); t.classList.toggle('m1', i >= 0 && Math.abs(k - i) === 1); });
    tiles.forEach((t, i) => { t.addEventListener('pointerenter', () => mark(i)); t.addEventListener('focus', () => mark(i)); t.addEventListener('blur', () => mark(-1)); });
    dock.addEventListener('pointerleave', () => mark(-1));
    // The Kit has its own toolbar at the bottom of the screen: the dock steps aside while the Kit is in view.
    const kitSec = document.querySelector('.kit');
    // ...and over the footer, whose links sit where the dock is
    const away = new Set(), foot = document.querySelector('.ab-foot');
    const watch = (el, t) => el && new IntersectionObserver(([e]) => { e.isIntersecting ? away.add(el) : away.delete(el); dock.classList.toggle('is-away', away.size > 0); }, { threshold: t }).observe(el);
    watch(kitSec, 0.3); watch(foot, 0.15);
  }

  /* ---------- the contact canvas: your own cursor joins Abhishek's ---------- */
  const canvas = document.querySelector('.dz-canvas'), you = canvas && canvas.querySelector('.dz-mate-you');
  if (canvas && you && fine) {
    canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); you.style.left = (e.clientX - r.left + 14) + 'px'; you.style.top = (e.clientY - r.top + 14) + 'px'; canvas.classList.add('has-you'); });
    canvas.addEventListener('pointerleave', () => canvas.classList.remove('has-you'));
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
        const col = getComputedStyle(root).getPropertyValue('--blue').trim() || '#0080FF';
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col;
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k], life = 1 - (now - b.t) / 700;
          g.globalAlpha = life * 0.55; g.lineWidth = 0.6 + life * 1.4;
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
        g.globalAlpha = 1;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- The Craft & the Kit ---------- */
  const kit = document.querySelector('.kit');
  if (kit) craftAndKit(kit);

  /* ---------- everything driven by GSAP ---------- */
  addEventListener('DOMContentLoaded', () => {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);
    if (window.DrawSVGPlugin) gsap.registerPlugin(window.DrawSVGPlugin);
    if (window.MorphSVGPlugin) gsap.registerPlugin(window.MorphSVGPlugin);
    const canDraw = !!window.DrawSVGPlugin, canMorph = !!window.MorphSVGPlugin;
    if (reduce) return;
    // An element that has a CSS transition on the property GSAP animates freezes at its starting pose, so those
    // elements drop their transition while GSAP brings them in.
    const calm = (sel) => { const els = gsap.utils.toArray(sel); els.forEach((e) => e.classList.add('no-tr')); return () => els.forEach((e) => e.classList.remove('no-tr')); };

    // his selection frames draw themselves on
    if (canDraw) gsap.from('.dz-frame path:first-of-type', { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut', stagger: 0.25, delay: 0.3 });
    // the hero arrives
    const introDone = calm('.dz-avatar, .dz-palette, .dz-sticker');
    const intro = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.1, clearProps: 'transform,opacity' }, onComplete: introDone });   // cleared after, so the CSS hovers work
    intro.from('.dz-avatar', { scale: 0.6, rotate: -20, opacity: 0, ease: 'back.out(1.6)' }, 0.1)
      .from('.dz-line', { yPercent: 60, opacity: 0, stagger: 0.12 }, 0.2)
      .from('.dz-tag', { y: 10, opacity: 0 }, 0.35)
      .from('.dz-palette', { x: 40, rotate: 12, opacity: 0 }, 0.4)
      .from('.dz-sticker', { scale: 0, stagger: 0.1, ease: 'back.out(2)' }, 0.5)
      .from('.dz-ghost', { x: 30, y: 20, opacity: 0, ease: 'power3.out' }, 0.9)
      .from('.dz-dock', { y: 80, opacity: 0 }, 0.6);
    // "the future.", its frame and the cursor drift together on a slow diagonal, as on his site
    // his timing: rest, step 12px up and to the left in .6s, rest, step back
    gsap.timeline({ repeat: -1, delay: 1.4, repeatDelay: 1.8 }).to('.dz-future', { x: -12, y: -12, duration: 0.6, ease: 'power2.inOut' }).to('.dz-future', { x: 0, y: 0, duration: 0.6, ease: 'power2.inOut' }, '+=1.8');

    // I build it: the words fill in as you read down; the marks pop in
    const ship = document.querySelector('.dz-ship-text');
    if (ship) {
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.append(s); } }); n.replaceWith(f); }
        else walk(n);
      });
      walk(ship);
      gsap.fromTo(ship.querySelectorAll('.w'), { opacity: 0.15 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: ship, start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } });
      gsap.from('.dz-tools img', { clearProps: 'transform,opacity', y: 50, scale: 0.4, opacity: 0, duration: 1, ease: 'back.out(1.8)', stagger: 0.08, scrollTrigger: { trigger: '.dz-tools', start: 'top 85%' } });
    }

    // projects and about come up as you reach them
    gsap.from('.pj', { clearProps: 'transform,opacity', y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.pjs', start: 'top 85%' } });
    gsap.from('.dz-work-head > *', { clearProps: 'transform,opacity', y: 24, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.dz-work-head', start: 'top 85%' } });
    const photoDone = calm('.dz-photo');
    gsap.from('.dz-photo', { clearProps: 'transform,opacity', onComplete: photoDone, rotate: -18, x: -60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.dz-about', start: 'top 75%' } });
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
      stops.forEach((s) => ST.create({ trigger: s, start: 'top 62%', end: 'max', onToggle: (t) => s.classList.toggle('is-on', t.isActive) }));
      gsap.from(stops, { x: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: time, start: 'top 75%' } });
    }

    // Contact: the frame draws round the closing line, the lines rise, the size counts up
    const cf = document.querySelector('.dz-cframe');
    if (cf) {
      const cin = gsap.timeline({ scrollTrigger: { trigger: cf, start: 'top 70%' } });
      cin.from(cf, { clipPath: 'inset(0 50% 0 50%)', duration: 1, ease: 'expo.inOut' })
        .from('.dz-cframe .dz-h', { scale: 0, stagger: 0.06, ease: 'back.out(2)', duration: 0.4 }, 0.6)
        .from('.dz-contact-title .ln > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.4)
        .from('.dz-contact-btns', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, 0.7);
      const w = cf.querySelector('.dz-size-w'), h = cf.querySelector('.dz-size-h'), o = { w: 0, h: 0 };
      cin.to(o, { w: Math.round(cf.offsetWidth), h: Math.round(cf.offsetHeight), duration: 1.2, ease: 'power2.out', onUpdate: () => { w.textContent = Math.round(o.w); h.textContent = Math.round(o.h); } }, 0.2);
      gsap.to('.dz-mate-a', { x: 260, y: -40, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    // the thread: one line down the left of the page, drawn by the scroll, bending in at each section
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
  function makeDots(canvas, shapeEls, svg) {
    if (!canvas || reduce) return { form() {} };
    const g = canvas.getContext('2d'); const N = innerWidth < 900 ? 420 : 900;
    let w = 0, h = 0, dpr = 1;
    const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, s: 1.2 + Math.random() * 1.6 }));
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; P.forEach((p) => { if (p.x <= 1) { p.x *= w; p.y *= h; } }); };
    size(); addEventListener('resize', size);
    const targets = shapeEls.map((el) => { const len = el.getTotalLength(), pts = []; for (let i = 0; i < N; i++) { const q = el.getPointAtLength((i / N) * len); pts.push([q.x + (Math.random() - 0.5) * 3.4, q.y + (Math.random() - 0.5) * 3.4]); } return pts; });
    let shape = 0; const ptr = { x: -1e4, y: -1e4 };
    canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', () => { ptr.x = ptr.y = -1e4; });
    let live = false; new IntersectionObserver(([e]) => { live = e.isIntersecting; }).observe(canvas);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!live || !w) return;
      const cr = canvas.getBoundingClientRect(), mr = svg.getBoundingClientRect(), sc = (mr.width / 100) * 2.3;
      const cx = mr.left - cr.left + mr.width / 2, cy = mr.top - cr.top + mr.height / 2, ox = cx - 50 * sc, oy = cy - 50 * sc, T = targets[shape];
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.fillStyle = getComputedStyle(document.body).getPropertyValue('--blue').trim() || '#0080FF';
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
    return { form(i) { shape = i; P.forEach((p) => { p.vx += (Math.random() - 0.5) * 18; p.vy += (Math.random() - 0.5) * 18; }); } };
  }

  /* ---------- The Craft & the Kit: Abhishek's component, ported from his Framer code file ---------- */
  // Physics drop onto the dot grid, then throw, rearrange, sort; eight tools (line them up, shake, gravity, pull it
  // together, pour some colour, another vibe, after-hours, hide the ghost); a joke on every pill. Same logic as his.
  function craftAndKit(kit) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = 'cubic-bezier(.2,.85,.25,1)', STEP = 26, PHASE = -2;
    const section = kit, stage = kit.querySelector('#kit-stage'), cursor = kit.querySelector('#kit-cursor'), helper = kit.querySelector('#kit-helper'), toolsEl = kit.querySelector('#kit-tools');
    const icons = {}; kit.querySelectorAll('#kit-icons')[0]?.content.querySelectorAll('[data-sym]').forEach((s) => { icons[s.dataset.sym] = s.innerHTML; });
    const CATS = [{ key: 'design', label: 'Design', color: '#2f6bff' }, { key: 'build', label: 'Build', color: '#7a5af0' }, { key: 'lead', label: 'Lead', color: '#1f9e73' }];
    const DATA = {
      design: [['Interaction design', 'where taps become delight.'], ['User flows', 'every dead-end, mapped.'], ['Wireframing', 'ugly on purpose.'], ['Prototyping', 'fake it till you ship it.'], ['Information architecture', 'a place for everything.'], ['UX research', 'I asked. They answered.'], ['Usability testing', 'watching people struggle (kindly).'], ['Design systems', 'build once, use forever.'], ['Dashboards & data-viz', 'making numbers behave.'], ['Responsive', 'looks good at 3am, any screen.']],
      build: [['Figma', 'where magic and crying happen.'], ['Framer', 'where this portfolio was born.'], ['WordPress', 'yes, still. it pays.'], ['HTML / CSS / JS', 'the honest three.'], ['Unity', '3D is just 2D with commitment.'], ['Claude Code', 'I made him help. no regrets.'], ['GitHub', 'commit messages: pure fiction.']],
      lead: [['Client POC', 'I run the room.'], ['Requirements & alignment', "translating 'make it pop'."], ['Design QA', 'off by 2px? I noticed.'], ['CRO', 'turning maybes into yeses.'], ['Shipping ownership', "it's not done till it's live."]]
    };
    const pills = []; let gi = 0;
    CATS.forEach((cat) => DATA[cat.key].forEach((row) => {
      const pos = document.createElement('div'); pos.className = 'pos';
      const pill = document.createElement('div'); pill.className = 'pill';
      pill.style.setProperty('--pc', cat.color); pill.style.setProperty('--wd', gi * 30 + 'ms'); pill.style.setProperty('--td', gi * 30 + 150 + 'ms');
      pill.innerHTML = `<span class="pill__clip"><span class="wave"></span></span><span class="d"></span><span class="label"></span><span class="tip"></span>`;
      pill.querySelector('.label').textContent = row[0]; pill.querySelector('.tip').textContent = row[1];
      pos.appendChild(pill); stage.appendChild(pos);
      pills.push({ pos, pill, cat, x: 0, y: 0, rot: 0, anim: null, samples: [] }); gi++;
    }));
    const labels = [], guides = [];
    CATS.forEach((cat) => {
      const l = document.createElement('div'); l.className = 'lab'; l.innerHTML = `<i></i>${cat.label}<span class="n">${DATA[cat.key].length}</span>`; l.querySelector('i').style.background = cat.color; stage.appendChild(l); labels.push(l);
      const g = document.createElement('div'); g.className = 'guide'; stage.appendChild(g); guides.push(g);
    });
    let seed = 1, sorted = false, laidWrap = false;
    const rng = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const applyMode = () => kit.classList.toggle('compact', stage.getBoundingClientRect().width < 820);
    const setXform = (p) => { p.pos.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`; };
    const stageRect = () => stage.getBoundingClientRect(), secRect = () => section.getBoundingClientRect();
    const snapToDot = (p, cx, cy) => {
      const sr = stageRect(), se = secRect(), offX = sr.left - se.left, offY = sr.top - se.top;
      const sx = Math.round((offX + cx - PHASE) / STEP) * STEP + PHASE, sy = Math.round((offY + cy - PHASE) / STEP) * STEP + PHASE;
      return { x: sx - offX - p.pill.offsetWidth / 2, y: sy - offY - p.pill.offsetHeight / 2 };
    };
    function computeDots() {
      const sr = stageRect(), W = sr.width, H = sr.height, r = rng(seed * 131 + 7), top = 54, bot = H - 20, n = pills.length;
      const gc = Math.max(3, Math.round(Math.sqrt(n * (W / Math.max(1, bot - top))))), gr = Math.ceil(n / gc), cw = W / gc, ch = (bot - top) / gr;
      const order = pills.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
      order.forEach((pi, idx) => {
        const p = pills[pi], w = p.pill.offsetWidth || 120, h = p.pill.offsetHeight || 40, gx = idx % gc, gy = (idx / gc) | 0;
        let cx = gx * cw + cw / 2 + (r() * 2 - 1) * cw * 0.24, cy = top + gy * ch + ch / 2 + (r() * 2 - 1) * ch * 0.26;
        cx = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, cx)); cy = Math.max(top + h / 2, Math.min(H - h / 2 - 4, cy));
        const s = snapToDot(p, cx, cy); p.dotX = s.x; p.dotY = s.y; p.dotRot = (r() * 2 - 1) * 15;
      });
    }
    function computeSort() {
      const sr = stageRect(), W = sr.width, H = sr.height;
      if (W >= 820) {
        laidWrap = false;
        const colGap = Math.max(24, W * 0.03), colW = (W - 2 * colGap) / 3, labelH = 44, maxCount = Math.max(...CATS.map((c) => DATA[c.key].length));
        let pillH = pills[0].pill.offsetHeight || 44;
        if (labelH + maxCount * pillH + (maxCount - 1) * 6 > H && !kit.classList.contains('compact')) { kit.classList.add('compact'); pillH = pills[0].pill.offsetHeight || 36; }
        const vgap = Math.max(6, Math.min(16, (H - labelH - 4 - maxCount * pillH) / (maxCount - 1))), step = pillH + vgap;
        CATS.forEach((cat, ci) => {
          const colX = ci * (colW + colGap); let idx = 0;
          pills.filter((p) => p.cat.key === cat.key).forEach((p) => { p.sortX = colX + 2; p.sortY = labelH + idx * step; p.sortRot = 0; idx++; });
          Object.assign(labels[ci].style, { left: colX + 'px', top: '0px', width: colW + 'px' });
          Object.assign(guides[ci].style, { left: colX - 12 + 'px', top: labelH - 8 + 'px', width: colW + 24 + 'px', height: (idx - 1) * step + pillH + 16 + 'px' });
        });
      } else {
        laidWrap = true;
        const pillH2 = pills[0].pill.offsetHeight || (kit.classList.contains('compact') ? 30 : 44), gap = 8;
        let rowH = pillH2 + 8, rowW = 0; const rows = [[]];
        pills.forEach((p) => { const w = (p.pill.offsetWidth || 120) + gap; if (rowW + w > W && rows[rows.length - 1].length) { rows.push([]); rowW = 0; } rows[rows.length - 1].push({ p, w: w - gap }); rowW += w; });
        if (rows.length * rowH > H - 8) rowH = Math.max(pillH2 + 4, (H - 8) / rows.length);
        const startY = Math.max(4, (H - rows.length * rowH) / 2);
        rows.forEach((row, ri) => { const rw = row.reduce((a, it) => a + it.w + gap, -gap); let cx = (W - rw) / 2; row.forEach((it) => { it.p.sortX = cx; it.p.sortY = startY + ri * rowH; it.p.sortRot = 0; cx += it.w + gap; }); });
      }
    }
    const cancel = (p) => { if (p.anim) { try { p.anim.cancel(); } catch (e) {} p.anim = null; } };
    const cancelAll = () => pills.forEach((p) => { p.pos.style.transition = ''; cancel(p); });
    function drop() {
      sorted = false; stage.classList.remove('sorted'); applyMode(); computeDots();
      const sr = stageRect();
      pills.forEach((p, i) => {
        cancel(p); p.x = p.dotX; p.y = p.dotY; p.rot = p.dotRot; setXform(p);
        if (reduce) return;
        const startY = -(sr.height * 0.7) - 120 - Math.random() * 120;
        const from = `translate(${p.x}px,${startY}px) rotate(${p.rot * 0.4}deg)`, over = `translate(${p.x}px,${p.y - 16}px) rotate(${p.rot * 1.05}deg)`, to = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
        p.anim = p.pos.animate([{ transform: from, offset: 0 }, { transform: to, offset: 0.72, easing: 'cubic-bezier(.3,1.4,.5,1)' }, { transform: over, offset: 0.86 }, { transform: to, offset: 1 }], { duration: 900 + Math.random() * 250, delay: i * 30, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'none' });
      });
    }
    function sort() {
      cancelAll(); applyMode(); computeSort(); sorted = true; stage.classList.toggle('sorted', !laidWrap);
      pills.forEach((p, i) => { cancel(p); p.x = p.sortX; p.y = p.sortY; p.rot = 0; p.pos.style.transition = `transform .7s ${EASE} ${i * 11}ms`; setXform(p); });
      if (!laidWrap && !reduce) { guides.forEach((g) => g.classList.add('flash')); setTimeout(() => guides.forEach((g) => g.classList.remove('flash')), 1000); }
      setTimeout(() => pills.forEach((p) => { p.pos.style.transition = ''; }), 760);
    }
    function throwPill(p, vx, vy) {
      const sr = stageRect(), w = p.pill.offsetWidth, h = p.pill.offsetHeight, k = 0.12;
      let tx = Math.max(0, Math.min(sr.width - w, p.x + vx * k)), ty = Math.max(0, Math.min(sr.height - h, p.y + vy * k));
      const s = snapToDot(p, tx + w / 2, ty + h / 2); tx = s.x; ty = s.y;
      const dur = Math.min(760, 220 + Math.hypot(tx - p.x, ty - p.y) * 1.4), from = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
      p.x = tx; p.y = ty; p.rot = (Math.random() * 2 - 1) * 10;
      cancel(p); p.anim = p.pos.animate([{ transform: from }, { transform: `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)` }], { duration: dur, easing: 'cubic-bezier(.18,.9,.3,1)', fill: 'none' }); setXform(p);
    }
    pills.forEach((p) => {
      p.pill.addEventListener('pointerdown', (e) => {
        if (sorted) return;
        dismissHelper(); cancel(p); p.pos.classList.add('dragging'); p.pill.setPointerCapture(e.pointerId);
        p.drag = { dx: e.clientX - p.x, dy: e.clientY - p.y }; p.samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
      });
      p.pill.addEventListener('pointermove', (e) => {
        if (!p.drag) return;
        p.x = e.clientX - p.drag.dx; p.y = e.clientY - p.drag.dy; setXform(p);
        p.samples.push({ t: performance.now(), x: e.clientX, y: e.clientY }); if (p.samples.length > 6) p.samples.shift();
      });
      p.pill.addEventListener('pointerup', (e) => {
        if (!p.drag) return;
        p.drag = null; p.pos.classList.remove('dragging'); try { p.pill.releasePointerCapture(e.pointerId); } catch (_) {}
        const s = p.samples; let vx = 0, vy = 0;
        if (s.length >= 2) { const a = s[0], b = s[s.length - 1], dt = Math.max(16, b.t - a.t); vx = ((b.x - a.x) / dt) * 1000; vy = ((b.y - a.y) / dt) * 1000; }
        if (Math.hypot(vx, vy) > 240) throwPill(p, vx, vy);
        else {
          const w = p.pill.offsetWidth, h = p.pill.offsetHeight, sn = snapToDot(p, p.x + w / 2, p.y + h / 2), from = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
          p.x = sn.x; p.y = sn.y; cancel(p);
          p.anim = p.pos.animate([{ transform: from }, { transform: `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)` }], { duration: 260, easing: EASE, fill: 'none' }); setXform(p);
        }
      });
    });
    const dismissHelper = () => helper.classList.remove('show');
    function moveTo(p, tx, ty, rot, dur) {
      cancel(p); const from = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
      p.x = tx; p.y = ty; p.rot = rot || 0;
      if (reduce) { setXform(p); return; }
      p.anim = p.pos.animate([{ transform: from }, { transform: `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)` }], { duration: dur || 440, easing: 'cubic-bezier(.2,.85,.3,1)', fill: 'none' }); setXform(p);
    }
    function pile() {
      cancelAll(); applyMode(); sorted = false; stage.classList.remove('sorted');
      const sr = stageRect(), W = sr.width, H = sr.height, pillH = pills[0].pill.offsetHeight || 44, gap = 8, rowH = pillH + 6;
      const arr = pills.slice().sort((a, b) => a.x - b.x), rows = [[]]; let rowW = 0;
      arr.forEach((p) => { const w = (p.pill.offsetWidth || 120) + gap; if (rowW + w > W && rows[rows.length - 1].length) { rows.push([]); rowW = 0; } rows[rows.length - 1].push(p); rowW += w; });
      rows.forEach((row, ri) => {
        const rw = row.reduce((a, p) => a + (p.pill.offsetWidth || 120) + gap, -gap); let cx = Math.max(4, (W - rw) / 2); const y = H - (rows.length - ri) * rowH;
        row.forEach((p, ci) => { moveTo(p, cx, y, (Math.random() * 2 - 1) * 6, 480 + ri * 60 + ci * 12); cx += (p.pill.offsetWidth || 120) + gap; });
      });
    }
    function gather() {
      cancelAll(); applyMode(); sorted = false; stage.classList.remove('sorted');
      const sr = stageRect(), W = sr.width, H = sr.height, cx0 = W / 2, cy0 = H / 2, compact = kit.classList.contains('compact');
      const perRow = compact ? 3 : 4, stepX = compact ? 96 : 158, ph = pills[0].pill.offsetHeight || 44, stepY = ph + 4, n = pills.length, rows = Math.ceil(n / perRow);
      pills.forEach((p, i) => {
        const r = (i / perRow) | 0, c = i % perRow, rowItems = Math.min(perRow, n - r * perRow);
        moveTo(p, cx0 + (c - (rowItems - 1) / 2) * stepX - (p.pill.offsetWidth || 140) / 2, cy0 + (r - (rows - 1) / 2) * stepY - ph / 2, (Math.random() * 2 - 1) * 4, 360 + i * 10);
      });
    }
    const toggleFill = () => { kit.classList.toggle('filled'); refreshTools(); };
    let lightCanvas = null;
    const toggleDark = () => {
      const on = kit.classList.toggle('dark');
      if (on) { lightCanvas = kit.style.getPropertyValue('--canvas'); kit.style.setProperty('--canvas', '#0e1014'); } else kit.style.setProperty('--canvas', lightCanvas || '#FAFAF7');
      refreshTools();
    };
    let cursorHidden = false;
    const toggleCursor = () => { cursorHidden = !cursorHidden; cursor.style.display = cursorHidden ? 'none' : ''; refreshTools(); };
    const VIBES = [
      { canvas: '#FAFAF7', accent: '#0b5fff', guide: '#0080FF', design: '#2f6bff', build: '#7a5af0', lead: '#1f9e73' },
      { canvas: '#FBF5EE', accent: '#e8622a', guide: '#f0863c', design: '#e8622a', build: '#d0480f', lead: '#b45309' },
      { canvas: '#EFF5FB', accent: '#2563eb', guide: '#2f6bff', design: '#2563eb', build: '#0ea5e9', lead: '#0d9488' },
      { canvas: '#FBF1F6', accent: '#db2777', guide: '#ec4899', design: '#db2777', build: '#9333ea', lead: '#e11d48' },
      { canvas: '#F0F6F1', accent: '#0f9d63', guide: '#10b981', design: '#059669', build: '#0d9488', lead: '#65a30d' }
    ];
    let vi = 0;
    const applyVibe = (v) => {
      if (!kit.classList.contains('dark')) kit.style.setProperty('--canvas', v.canvas); else lightCanvas = v.canvas;
      kit.style.setProperty('--accent', v.accent); kit.style.setProperty('--guide', v.guide);
      pills.forEach((p) => p.pill.style.setProperty('--pc', v[p.cat.key]));
      labels.forEach((l, ci) => { const ic = l.querySelector('i'); if (ic) ic.style.background = v[CATS[ci].key]; });
    };
    const nextVibe = () => { vi = (vi + 1) % VIBES.length; applyVibe(VIBES[vi]); };
    const TOOLS = [
      { sym: 'grid_view', tt: 'line them up', fn: sort },
      { sym: 'scatter_plot', tt: 'shake the canvas', fn: () => { seed++; drop(); } },
      { sym: 'vertical_align_bottom', tt: 'let gravity win', fn: pile },
      { sym: 'filter_center_focus', tt: 'pull it together', fn: gather },
      { sym: 'format_color_fill', tt: 'pour some colour', fn: toggleFill },
      { sym: 'palette', tt: 'try another vibe', fn: nextVibe },
      { sym: 'dark_mode', tt: 'after-hours', fn: toggleDark },
      { sym: 'arrow_selector_tool', tt: 'hide the ghost', fn: toggleCursor }
    ];
    TOOLS.forEach((t) => {
      const b = document.createElement('button'); b.className = 'tool'; b.type = 'button'; b.setAttribute('aria-label', t.tt);
      b.innerHTML = (icons[t.sym] || '') + `<span class="tt">${t.tt}</span>`;
      b.addEventListener('click', () => { dismissHelper(); t.fn(); });
      toolsEl.appendChild(b); t.el = b;
    });
    function refreshTools() {
      TOOLS.forEach((t) => {
        if (t.sym === 'format_color_fill') t.el.classList.toggle('on', kit.classList.contains('filled'));
        if (t.sym === 'dark_mode') t.el.classList.toggle('on', kit.classList.contains('dark'));
        if (t.sym === 'arrow_selector_tool') t.el.classList.toggle('on', cursorHidden);
      });
    }
    let started = false;
    function start() {
      if (started) return; started = true; drop();
      const total = pills.length * 30 + 1100;
      setTimeout(() => helper.classList.add('show'), reduce ? 200 : total);
      setTimeout(() => helper.classList.remove('show'), reduce ? 4000 : total + 7000);
    }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) start(); }), { threshold: 0.35 });
    function relayout() { if (sorted) sort(); else { computeDots(); pills.forEach((p) => { p.x = p.dotX; p.y = p.dotY; p.rot = p.dotRot; setXform(p); }); } }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 160); });
    const boot = () => io.observe(section);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(boot); setTimeout(boot, 600); } else boot();
  }
})();
