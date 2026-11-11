/* About page. Structure and motion after lusion.co/about (Abhishek's reference); everything drawn is lines, or
   dots that become lines. All text is in the HTML; with scripts off, or with reduced motion, the page reads top to
   bottom as it is.
   1. Smooth scroll, nav, the reveal          5. The record: drifting words and a lens
   2. The world: a cloud of dots shaped like  6. How it goes: four cards dealt, turned, laid out
      the mark, a beam, the figure, a valley  7. Let's make it together: a heap of marks
   3. Who we are, the statement               8. Next page
   4. The team: portraits in lines, a disc that follows the pointer */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const narrow = () => innerWidth < 900;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const gsap = window.gsap, ST = window.ScrollTrigger;
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
const onScreen = (el, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '100px' }).observe(el);

const people = [...document.querySelectorAll('.ab-person')];
if (reduce) people.forEach((p) => p.classList.add('is-on'));

if (gsap && ST) {
  gsap.registerPlugin(ST);

  /* ---------------- 1. Smooth scroll, nav, the reveal ---------------- */
  let smoother = null;
  if (!reduce && finePointer && window.ScrollSmoother) {
    gsap.registerPlugin(window.ScrollSmoother);
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1, effects: false });
  }
  const scrollY_ = () => (smoother ? smoother.scrollTop() : scrollY);

  const nav = document.querySelector('.nav'), themed = [...document.querySelectorAll('[data-theme]')];
  let lastY = 0;
  const setTheme = () => {
    const probe = nav.offsetHeight / 2, sec = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    if (sec) nav.dataset.on = sec.dataset.theme === 'dark' ? 'dark' : 'light';
  };
  ST.create({ start: 0, end: 'max', onUpdate: (s) => {
    setTheme();
    const y = s.scroll();
    nav.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
    if (y < lastY - 2 || y < 400) nav.classList.remove('is-hidden');
    lastY = y;
  } });
  ST.addEventListener('refresh', setTheme);

  if (!reduce) {
    const shown = gsap.utils.toArray('.ab-tools-head > *, .ab-belt-win, .ab-block-head, .ab-block-count, .ab-table > div, .ab-make-side, .next-kicker, .foot-grid > *');
    shown.forEach((el) => el.classList.add('entry'));
    gsap.set(shown, { opacity: 0, '--reveal': '0%' });
    ST.batch(shown, { start: 'top 92%', once: true, interval: 0.08, onEnter: (els) => {
      gsap.to(els, { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08, overwrite: 'auto' });
      gsap.to(els, { '--reveal': '230%', duration: 0.76, ease: 'power2.out', stagger: 0.08, onComplete: () => els.forEach((el) => el.classList.remove('entry')) });
    } });

    /* ---------------- 3. The name, who we are, the statement ---------------- */
    // The name rises out of the bottom of the screen on arrival, then sinks and fades as you scroll on.
    gsap.set('.ab-word', { overflow: 'hidden' });
    gsap.from('.ab-word-in', { yPercent: 100, duration: 1.4, ease: 'expo.out', delay: 0.15 });
    gsap.from('.ab-rule-row', { opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.7 });
    // the scroll moves the whole line (the h1), never the word inside it, which belongs to the entrance above
    gsap.fromTo('.ab-word', { yPercent: 0 }, { yPercent: 30, immediateRender: false, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: 'top top', end: 'bottom top', scrub: 0.3 } });
    gsap.fromTo('.ab-word, .ab-rule-row', { opacity: 1 }, { opacity: 0, immediateRender: false, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: '20% top', end: '75% top', scrub: 0.3 } });
    // Who we are: each word rises out of its own mask, in one calm sweep; the sentence fades as you move on.
    document.querySelectorAll('.ab-rise').forEach((p) => {
      const wrap = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.append(w); else { const m = document.createElement('span'); m.className = 'wm'; const i = document.createElement('span'); i.textContent = w; m.append(i); frag.append(m); } });
          n.replaceWith(frag);
        } else wrap(n);
      });
      wrap(p);
      gsap.from(p.querySelectorAll('.wm > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: p, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });
    gsap.from('.ab-hero .ab-label', { opacity: 0, y: 12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ab-hero .ab-label', start: 'top 90%', toggleActions: 'play none none reverse' } });
    gsap.to('.ab-hero > *', { opacity: 0, y: -40, ease: 'power1.in', scrollTrigger: { trigger: '.ab-hero', start: 'bottom 75%', end: 'bottom 25%', scrub: 0.4 } });
    // The statement lights up a word at a time.
    document.querySelectorAll('.ab-words').forEach((p) => {
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s); } });
          n.replaceWith(frag);
        } else walk(n);
      });
      walk(p);
      gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 45%', scrub: 0.5 } });
    });
    // The crosshairs drift a little slower than the page.
    document.querySelectorAll('.ab-plus').forEach((p) => gsap.fromTo(p, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: p.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
  }

  /* ---------------- 4. The team ---------------- */
  const team = document.querySelector('.ab-team'), stick = document.querySelector('.ab-team-stick');
  const face = document.querySelector('.ab-face'), letter = document.querySelector('.ab-letter span'), bar = document.querySelector('.ab-team-bar b'), countN = document.querySelector('.ab-count-n');
  const portraits = contourFaces(face, people) || lineFaces(face, people);
  let on = 0;
  const pick = (i) => {
    if (i === on) return;
    people.forEach((p, k) => p.classList.toggle('is-on', k === i));
    portraits.show(i);
    if (countN) countN.textContent = String(i + 1).padStart(2, '0');
    const ch = people[i].querySelector('.ab-name').textContent.trim()[0];
    if (letter && !reduce) gsap.timeline().to(letter, { rotationX: 90, duration: 0.22, ease: 'power2.in', onComplete: () => { letter.textContent = ch; } }).fromTo(letter, { rotationX: -90 }, { rotationX: 0, duration: 0.5, ease: 'power3.out' });
    else if (letter) letter.textContent = ch;
    on = i;
  };
  let teamST = null;
  if (!reduce && team) {
    const n = people.length;
    teamST = ST.create({ id: 'team', trigger: team, start: 'top top', end: () => '+=' + innerHeight * n * 0.9, pin: stick, anticipatePin: 1,
      onUpdate: (s) => { const f = s.progress * n, i = Math.min(n - 1, Math.floor(f)); pick(i); gsap.set(bar, { scaleX: Math.min(1, f - i) }); } });
  }
  const go = (dir) => {
    const i = (on + dir + people.length) % people.length;
    if (teamST) { const y = teamST.start + (teamST.end - teamST.start) * ((i + 0.5) / people.length); smoother ? smoother.scrollTo(y, true) : scrollTo({ top: y, behavior: 'smooth' }); }
    else pick(i);
  };
  document.querySelector('.ab-next')?.addEventListener('click', () => go(1));
  document.querySelector('.ab-prev')?.addEventListener('click', () => go(-1));
  // The disc: follows the pointer over the team; its arrow points to the side you are on, and a click goes that way.
  // Whether it shows is worked out every frame from where the pointer is, not from enter and leave events: the page
  // glides under a resting pointer (smooth scroll, the pin), and those events never fire then, which left the disc
  // stuck on screen or missing. It hides over the menu bar and the keyboard buttons.
  const cursor = document.querySelector('.ab-cursor');
  if (cursor && finePointer && !reduce && stick) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
    const P = { x: -1, y: -1, moved: false };
    let left = false, shown = false;
    addEventListener('pointermove', (e) => { P.x = e.clientX; P.y = e.clientY; P.moved = true; }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { P.x = P.y = -1; });
    gsap.ticker.add(() => {
      if (P.x < 0) { if (shown) { shown = false; gsap.to(cursor, { scale: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' }); } return; }
      const r = stick.getBoundingClientRect(), over = document.elementFromPoint(P.x, P.y);
      const inside = P.x >= r.left && P.x <= r.right && P.y >= r.top && P.y <= r.bottom && over && stick.contains(over) && !over.closest('.ab-team-nav');
      if (inside !== shown) {
        shown = inside;
        if (inside) { gsap.set(cursor, { x: P.x, y: P.y }); gsap.to(cursor, { scale: 1, duration: 0.45, ease: 'back.out(1.6)', overwrite: 'auto' }); }
        else gsap.to(cursor, { scale: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
        stick.style.cursor = inside ? 'none' : '';
      }
      if (shown && P.moved) { cx(P.x); cy(P.y); P.moved = false; const l = P.x < innerWidth / 2; if (l !== left) { left = l; cursor.classList.toggle('is-left', l); } }
    });
    stick.addEventListener('pointerdown', () => { if (shown) gsap.fromTo(cursor, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: 'auto' }); });
    stick.addEventListener('click', (e) => { if (shown && !e.target.closest('a, button')) go(left ? -1 : 1); });
  }

  if (!reduce) {
    /* ---------------- What we build with ---------------- */
    // Each row holds its names twice (the second set hidden from screen readers) and drifts half its width, forever; the scroll's speed pushes it along,
    // so a flick of the wheel sends the names past, then they ease back to their own pace.
    const belts = gsap.utils.toArray('.ab-belt').map((ul, i) => {
      const dir = i % 2 ? 1 : -1;
      gsap.set(ul, { xPercent: dir > 0 ? -50 : 0 });
      return gsap.to(ul, { xPercent: dir > 0 ? 0 : -50, duration: 60 + i * 10, ease: 'none', repeat: -1 });
    });
    if (belts.length) {
      const boost = { v: 1 };
      ST.create({ trigger: '.ab-tools', start: 'top bottom', end: 'bottom top', onUpdate: (s) => {
        gsap.to(boost, { v: 1 + Math.min(6, Math.abs(s.getVelocity()) / 300), duration: 0.2, overwrite: true, onUpdate: () => belts.forEach((t) => t.timeScale(boost.v)) });
        gsap.to(boost, { v: 1, duration: 1.2, delay: 0.2, ease: 'power2.out', onUpdate: () => belts.forEach((t) => t.timeScale(boost.v)) });
      } });
      document.querySelector('.ab-rowset')?.addEventListener('pointerenter', () => belts.forEach((t) => gsap.to(t, { timeScale: 0.25, duration: 0.6 })));
      document.querySelector('.ab-rowset')?.addEventListener('pointerleave', () => belts.forEach((t) => gsap.to(t, { timeScale: 1, duration: 0.6 })));
    }

    /* ---------------- 5. The record ---------------- */
    [0, 1, 2].forEach((i) => gsap.fromTo(`.ab-drift-words p:nth-child(${i + 1})`, { xPercent: i % 2 ? -40 : 0 }, { xPercent: i % 2 ? 0 : -40, ease: 'none', scrollTrigger: { trigger: '.ab-record', start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
    const rec = document.querySelector('.ab-record'), lens = document.querySelector('.ab-lens');
    if (rec && lens) {
      const L = { x: 0.3, y: 0.25, tx: 0.3, ty: 0.25, r: 0 }, follow = { on: false };
      ST.create({ trigger: rec, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { if (!follow.on) { L.tx = 0.25 + 0.5 * Math.sin(s.progress * Math.PI * 1.4); L.ty = 0.12 + 0.76 * s.progress; } } });
      if (finePointer) {
        rec.addEventListener('pointermove', (e) => { const r = rec.getBoundingClientRect(); follow.on = true; L.tx = (e.clientX - r.left) / r.width; L.ty = (e.clientY - r.top) / r.height; });
        rec.addEventListener('pointerleave', () => { follow.on = false; });
      }
      let live = false; onScreen(rec, (v) => { live = v; });
      gsap.ticker.add((t) => {
        if (!live) return;
        L.x += (L.tx - L.x) * 0.08; L.y += (L.ty - L.y) * 0.08;
        const r = (narrow() ? 26 : 14) + Math.sin(t * 1.3) * 0.8;
        lens.style.setProperty('--lx', (L.x * 100).toFixed(2) + '%'); lens.style.setProperty('--ly', (L.y * 100).toFixed(2) + '%'); lens.style.setProperty('--lr', r.toFixed(2) + 'vw');
        lens.querySelectorAll('p').forEach((p, i) => { p.style.backgroundPosition = `${(t * 40 + i * 200) % 2000}px 0`; });
      });
    }
    document.querySelectorAll('.ab-block-count .n').forEach((c) => {
      const end = parseInt(c.textContent, 10), o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true }, onUpdate: () => { c.textContent = String(Math.round(o.v)).padStart(2, '0'); } });
    });
    gsap.to('.ab-spark', { rotation: 360, ease: 'none', scrollTrigger: { trigger: '.ab-record', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });

    /* ---------------- 6. How it goes ---------------- */
    const make = document.querySelector('.ab-make');
    const cards = gsap.utils.toArray('.ab-card');
    gsap.from('.ab-make-head .ln > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: make, start: 'top 60%' } });
    gsap.from('.ab-minis li', { rotationY: 180, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.ab-minis', start: 'top 85%' } });
    if (make && cards.length && !narrow()) {
      make.classList.add('deal');
      const spread = () => Math.min(innerWidth * 0.22, 400) * 1.06;
      const tl = gsap.timeline({ scrollTrigger: { trigger: make, start: 'top top', end: '+=260%', pin: '.ab-make-stick', scrub: 0.6, invalidateOnRefresh: true } });
      tl.to('.ab-make-head', { yPercent: -120, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.05);
      cards.forEach((c, i) => {
        const d = i - (cards.length - 1) / 2, inner = c.querySelector('.ab-card-in');
        gsap.set(c, { y: () => innerHeight * 0.7, rotation: d * 3, x: d * 8 });
        tl.to(c, { y: () => -innerHeight * 0.04 + Math.abs(d) * 26, x: () => d * spread() * 0.62, rotation: d * 11, ease: 'power3.out', duration: 0.3 }, 0.12 + i * 0.03)
          .to(inner, { rotationY: 180, ease: 'power2.inOut', duration: 0.22 }, 0.48 + i * 0.07)
          .to(c, { x: () => d * spread(), y: () => Math.abs(d) * 6, rotation: d * 1.6, ease: 'power2.inOut', duration: 0.28 }, 0.72);
      });
      tl.to({}, { duration: 0.1 });
      // Each card leans toward the pointer.
      if (finePointer) cards.forEach((c) => {
        const inner = c.querySelector('.ab-card-face');
        const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        gsap.set(inner, { rotationY: 180, transformPerspective: 900 });
        c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); ry(180 + ((e.clientX - r.left) / r.width - 0.5) * 16); rx(-((e.clientY - r.top) / r.height - 0.5) * 12); });
        c.addEventListener('pointerleave', () => { rx(0); ry(180); });
      });
    }
  }

  /* ---------------- 7. Let's make it together ---------------- */
  const roll = document.querySelector('.ab-roll');
  if (roll) {
    let i = 0;   // letters grouped by word, so a line never breaks inside one; each letter twice for the hover roll
    roll.innerHTML = roll.textContent.trim().split(/\s+/).map((word) => `<span class="wd">${[...word].map((c) => `<span class="l" style="--i:${i++}"><span>${c}</span><span>${c}</span></span>`).join('')}</span>`).join(' ');
    const title = document.querySelector('.ab-cta-title');
    if (!reduce) { title.classList.add('is-low'); ST.create({ trigger: roll, start: 'top 85%', once: true, onEnter: () => title.classList.remove('is-low') }); }
  }
  const heap = document.querySelector('.ab-heap');
  if (heap && !reduce) markHeap(heap);

  /* ---------------- The footer ---------------- */
  const flow = document.querySelector('.ab-flow');
  if (flow && !reduce) lineStream(flow);
  const copy = document.querySelector('.ab-copy');
  copy?.addEventListener('click', () => {
    const t = copy.querySelector('.ab-copy-t'), was = t.textContent;
    const done = () => { t.textContent = copy.dataset.done; setTimeout(() => { t.textContent = was; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done).catch(() => {}); else done();
  });

  /* ---------------- 8. Next page ---------------- */
  if (!reduce) {
    const nb = document.querySelector('.next-bar b'), link = document.querySelector('.next-title');
    let gone = false;
    gsap.fromTo(nb, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top top', end: '+=120%', pin: '.next-stick', scrub: 0.6,
      onUpdate: (self) => { if (gone || self.progress < 0.999 || self.direction < 0) return; gone = true; location.href = link.href; } } });
  }

  /* ---------------- 2. The world (loaded once the page has loaded) ---------------- */
  const stage = document.querySelector('.ab-stage');
  if (stage && !reduce) {
    const start = () => world(stage, scrollY_).catch((e) => console.warn('[about] world', e));
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    if (document.readyState === 'complete') idle(start); else addEventListener('load', () => idle(start), { once: true });
  } else if (stage) stage.remove();

  addEventListener('load', () => ST.refresh(), { once: true });
}

/* ================= 2. The world ================= */
// A cloud of dots in the shape of the mark hangs in the dark; a beam of fine lines falls from it onto the figure,
// who stands in a valley drawn in contour lines. The camera starts inside the cloud (behind the name), pulls back and
// down to find him (who we are), then rises up the beam into the light (the statement). The pointer pushes the dots.
async function world(stage, scrollPos) {
  const canGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!canGL) return;
  const [THREE] = await Promise.all([import(THREE_URL), loadScript('/assets/js/figure/mark.js').then(() => loadScript('/assets/js/figure/markbody.js')).catch(() => null)]);
  const MB = window.MarkBody;
  const small = narrow();
  const glc = stage.querySelector('.ab-gl'), fc = stage.querySelector('.ab-fig'), fg = fc.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x030203, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x030203, 22, 95);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  const C = new THREE.Vector3(0, 13, -8);          // the cloud's centre
  const FIG = new THREE.Vector3(0, 0, -8);         // where he stands

  // --- the cloud: dots sampled from the mark itself, plus loose dust around it
  const markPts = await new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const S = 160, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, S, S); const d = g.getImageData(0, 0, S, S).data, pts = [];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 90) pts.push([x / S - 0.5, 0.5 - y / S]);
      ok(pts);
    };
    img.onerror = () => ok([]);
    img.src = '/assets/img/logo.svg';
  });
  const NM = small ? 2400 : 4600, ND = small ? 200 : 500, N = NM + ND;
  const home = new Float32Array(N * 3), pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), size = new Float32Array(N), tone = new Float32Array(N);
  const R = 7.5;
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (i < NM && markPts.length) {
      const p = markPts[(Math.random() * markPts.length) | 0];
      x = p[0] * R * 2 + (Math.random() - 0.5) * 0.12; y = p[1] * R * 2 + (Math.random() - 0.5) * 0.12; z = (Math.random() - 0.5) * 1.6 * (1 - Math.hypot(p[0], p[1]));
    } else {
      const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), r = R * (0.5 + Math.pow(Math.random(), 0.6) * 0.9);
      x = Math.sin(v) * Math.cos(u) * r; y = Math.cos(v) * r * 0.8; z = Math.sin(v) * Math.sin(u) * r * 0.6;
    }
    home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
    pos[i * 3] = x * 2.6 + (Math.random() - 0.5) * 30; pos[i * 3 + 1] = y * 2.6 + (Math.random() - 0.5) * 30; pos[i * 3 + 2] = z + (Math.random() - 0.5) * 30;   // they gather on load
    const big = Math.random() < 0.01;
    size[i] = big ? 2.2 + Math.random() * 1.6 : 0.6 + Math.random() * 0.9;
    tone[i] = Math.random() < 0.015 ? 1 : 0;   // a very few orange
  }
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  cloudGeo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  cloudGeo.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 }, uFade: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float size; attribute float tone; varying float vTone; varying float vFar; uniform float uScale;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = size * uScale * (28.0 / -mv.z); vTone = tone; vFar = clamp(-mv.z / 60.0, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`
      varying float vTone; varying float vFar; uniform float uFade;
      void main() { vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.12, d); vec3 col = mix(vec3(1.0, 0.957, 0.902), vec3(0.86, 0.31, 0.0), vTone);
        gl_FragColor = vec4(col, a * (0.85 - vFar * 0.5) * uFade); }`
  });
  const cloud = new THREE.Points(cloudGeo, cloudMat);
  cloud.position.copy(C); cloud.frustumCulled = false;
  scene.add(cloud);

  // --- line fragments drifting round the cloud, like pieces broken off it
  const NF = 0, frag = [], fragPos = new Float32Array(NF * 6);
  for (let i = 0; i < NF; i++) frag.push({ a: Math.random() * Math.PI * 2, r: R * (0.9 + Math.random() * 0.9), y: (Math.random() - 0.5) * R * 1.6, s: 0.02 + Math.random() * 0.05, len: 0.2 + Math.random() * 0.7, tilt: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.6 });
  const fragGeo = new THREE.BufferGeometry(); fragGeo.setAttribute('position', new THREE.BufferAttribute(fragPos, 3));
  const frags = new THREE.LineSegments(fragGeo, new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0.55 }));
  frags.position.copy(C); frags.frustumCulled = false; scene.add(frags);

  // --- the valley: rows of contour lines, rising into ridges on both sides and far away
  const ROWS = small ? 22 : 30, COLS = small ? 120 : 200, W = 150, D = 110;
  const hgt = (x, z) => {
    const ax = Math.abs(x), dz = -z - 8;
    const ridge = Math.pow(Math.max(0, ax - 12), 1.3) * 0.22 * (1 + 0.3 * Math.sin(z * 0.11 + x * 0.05));
    const far = Math.max(0, dz - 25) * 0.18 * (1 + 0.5 * Math.sin(x * 0.07));
    const rough = Math.sin(x * 0.21 - z * 0.13) * 0.25 * Math.min(1, ax / 20);
    const bowl = -0.25 * Math.exp(-(x * x + (z + 8) * (z + 8)) / 30);
    return ridge + far + rough + bowl;
  };
  const vpos = [];
  for (let r = 0; r < ROWS; r++) {
    const z = 14 - (r / (ROWS - 1)) * D;
    for (let c = 0; c < COLS - 1; c++) {
      const x0 = -W / 2 + (c / (COLS - 1)) * W, x1 = -W / 2 + ((c + 1) / (COLS - 1)) * W;
      vpos.push(x0, hgt(x0, z), z, x1, hgt(x1, z), z);
    }
  }
  const valleyGeo = new THREE.BufferGeometry(); valleyGeo.setAttribute('position', new THREE.Float32BufferAttribute(vpos, 3));
  const valley = new THREE.LineSegments(valleyGeo, new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0.13 }));
  scene.add(valley);

  // --- the beam: fine lines from the cloud to the ground, and a soft glow around them
  const NB = small ? 40 : 70, bpos = [], bcol = [];
  for (let i = 0; i < NB; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.pow(Math.random(), 2.2) * 0.45, x = Math.cos(a) * rr, z = FIG.z + Math.sin(a) * rr;
    const y0 = Math.random() * 1.0, y1 = C.y - 3 - Math.random() * 3, k = 1 - rr / 0.45, c = 0.3 + 0.7 * k;
    bpos.push(x, y0, z, x, y1, z); bcol.push(c, c * 0.96, c * 0.9, c * 0.25, c * 0.24, c * 0.22);
  }
  const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); beamGeo.setAttribute('color', new THREE.Float32BufferAttribute(bcol, 3));
  const beam = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  const bolt = new THREE.Group(); bolt.add(beam);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,244,230,0)'); gr.addColorStop(0.5, 'rgba(255,244,230,1)'); gr.addColorStop(1, 'rgba(255,244,230,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,.9)'); v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.2)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Group();
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, C.y - 2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(0, (C.y - 2) / 2, FIG.z); m.rotation.y = (k / 3) * Math.PI; glow.add(m); }
  bolt.add(glow);
  // --- light pooled on the ground: loose rings, and a scatter of short marks like pebbles
  const ring = new THREE.Group();
  for (let k = 0; k < 2; k++) {
    const pts = [], Rr = 1.1 + k * 1.4;
    for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * Rr, 0.03 + hgt(Math.cos(a) * Rr, FIG.z + Math.sin(a) * Rr), FIG.z + Math.sin(a) * Rr * 0.9)); }
    ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: k ? 0xFFF4E6 : 0xDC5000, transparent: true, opacity: k ? 0.12 : 0.6 })));
  }
  scene.add(ring);

  // ---------------- The arrival: a beam strikes down from the cloud, he lands, the mark burns into the ground ----------------
  // Scroll-driven, like all his movement. The bolt reaches down with a prism of coloured light twisting round its core;
  // the impact flashes, sends rings racing out across the ground and throws up dust; the loops of the mark burn into the
  // ground where he lands, hot orange cooling to cream; he rises out of a crouch, and the beam calms to a thin thread.
  const TOP = C.y - 3, GY = hgt(0, FIG.z) + 0.04;
  // the prism: seven strands of colour twisting round the core
  const hpos = [], hcol = [], HUES = [[1, .08, .05], [1, .42, 0], [1, .9, .05], [.1, 1, .3], [0, .75, 1], [.2, .2, 1], [.75, .1, 1]];   // the full spectrum, saturated
  [...HUES, ...HUES].forEach((c, k) => {          // fourteen strands: each colour twice, on two radii
    const SEG = 90;
    for (let i = 0; i < SEG; i++) {
      const y0 = (i / SEG) * TOP, y1 = ((i + 1) / SEG) * TOP, a0 = k / 14 * Math.PI * 2 + y0 * 0.9, a1 = k / 14 * Math.PI * 2 + y1 * 0.9, r = k < 7 ? 0.55 : 0.78;
      hpos.push(Math.cos(a0) * r, y0, FIG.z + Math.sin(a0) * r, Math.cos(a1) * r, y1, FIG.z + Math.sin(a1) * r);
      hcol.push(...c, ...c);
    }
  });
  const helixGeo = new THREE.BufferGeometry(); helixGeo.setAttribute('position', new THREE.Float32BufferAttribute(hpos, 3)); helixGeo.setAttribute('color', new THREE.Float32BufferAttribute(hcol, 3));
  const helix = new THREE.LineSegments(helixGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const helixPivot = new THREE.Group(); helixPivot.position.set(0, 0, FIG.z); helix.position.set(0, 0, -FIG.z); helixPivot.add(helix); bolt.add(helixPivot);
  scene.add(bolt);
  // the shockwave: three rings racing out over the ground
  const waves = [0, 1, 2].map(() => {
    const pts = []; for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a) * 0.9)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    l.position.set(0, GY, FIG.z); scene.add(l); return l;
  });
  // dust thrown out by the impact (each grain's path is fixed; the scroll says how far along it is)
  const ND2 = small ? 160 : 320, dust = new Float32Array(ND2 * 3), dustDir = [];
  for (let i = 0; i < ND2; i++) dustDir.push({ a: Math.random() * Math.PI * 2, sp: 2 + Math.random() * 9, up: 1.5 + Math.random() * 5 });
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xFFF4E6, size: 0.06, transparent: true, opacity: 0, depthWrite: false }));
  dustPts.frustumCulled = false; scene.add(dustPts);
  // the mark, burnt into the ground: the logo's own dots, laid flat round where he lands, revealed from the centre out
  const GR = 4.4, glyphN = Math.min(markPts.length, small ? 1600 : 3200), gpos = new Float32Array(glyphN * 3), grad = new Float32Array(glyphN);
  for (let i = 0; i < glyphN; i++) {
    const q = markPts[Math.floor((i / glyphN) * markPts.length)];
    const x = q[0] * GR * 2, z = FIG.z - q[1] * GR * 2 * 0.95;
    gpos[i * 3] = x; gpos[i * 3 + 1] = hgt(x, z) + 0.035; gpos[i * 3 + 2] = z; grad[i] = Math.hypot(q[0], q[1]) * 2;
  }
  const glyphGeo = new THREE.BufferGeometry(); glyphGeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3)); glyphGeo.setAttribute('rad', new THREE.BufferAttribute(grad, 1));
  const glyphMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uReveal: { value: 0 }, uHeat: { value: 1 }, uScale: { value: 1 } },
    vertexShader: `attribute float rad; varying float vRad; uniform float uScale; void main(){ vRad = rad; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uScale * 26.0 / -mv.z; }`,
    fragmentShader: `varying float vRad; uniform float uReveal, uHeat;
      void main(){ vec2 c = gl_PointCoord - 0.5; if (length(c) > 0.5) discard;
        float on = smoothstep(uReveal, uReveal - 0.12, vRad);            // burning outward from the centre
        float edge = smoothstep(uReveal - 0.18, uReveal, vRad) * on;       // the burning edge glows hottest
        vec3 hot = vec3(1.0, 0.45, 0.08), cool = vec3(1.0, 0.957, 0.902);
        vec3 col = mix(cool, hot, clamp(uHeat + edge, 0.0, 1.0));
        gl_FragColor = vec4(col, on * (0.55 + 0.45 * edge) * (0.5 + 0.5 * uHeat) + edge * 0.4); }`
  });
  const glyph = new THREE.Points(glyphGeo, glyphMat); glyph.frustumCulled = false; scene.add(glyph);
  const crouch = () => ({ root: { x: 0, y: 0, rot: 0, sx: 1 }, lean: 0.35, bend: 0.8, nod: 0.25, feet: { L: { x: -0.16, y: 0.2 }, R: { x: 0.14, y: 0.21 } }, knee: { L: 1, R: 1 }, hands: { F: { x: 0.22, y: 0.16 }, B: { x: -0.26, y: 0.1 } }, elbow: { F: 1, B: -1 }, round: { F: 0.3, B: 0.3 } });
  const mixPose = (a, b, u) => { const o = {}; for (const k in b) { const A = a[k], B = b[k]; if (typeof A === 'number' && typeof B === 'number') o[k] = A + (B - A) * u; else if (A && B && typeof A === 'object') o[k] = mixPose(A, B, u); else o[k] = u < 0.5 && A !== undefined ? A : B; } return o; };
  const arrival = { s: 0 };
  const peb = [];
  for (let i = 0; i < 0; i++) { const a = Math.random() * Math.PI * 2, r = 1.2 + Math.pow(Math.random(), 0.7) * 9, x = Math.cos(a) * r, z = FIG.z + Math.sin(a) * r * 0.8, y = hgt(x, z) + 0.03, l = 0.05 + Math.random() * 0.12, t = Math.random() * Math.PI;
    peb.push(x - Math.cos(t) * l, y, z - Math.sin(t) * l, x + Math.cos(t) * l, y, z + Math.sin(t) * l); }
  const pebGeo = new THREE.BufferGeometry(); pebGeo.setAttribute('position', new THREE.Float32BufferAttribute(peb, 3));
  scene.add(new THREE.LineSegments(pebGeo, new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0.55 })));

  let w = 0, h = 0, dpr = 1;
  const resize = () => { w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2); renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 62 : 45; cam.updateProjectionMatrix(); fc.width = w * dpr; fc.height = h * dpr; cloudMat.uniforms.uScale.value = h / 900 * dpr; };
  resize(); addEventListener('resize', resize);

  // scroll: 0 at the top, 1 at the end of the statement
  const say = document.querySelector('.ab-say'), hero = document.querySelector('.ab-hero'), teamEl = document.querySelector('.ab-team');
  const prog = () => { const end = say.offsetTop + say.offsetHeight - innerHeight * 0.6; return clamp(scrollPos() / end); };
  const heroAt = () => clamp((hero.offsetTop + hero.offsetHeight * 0.35) / (say.offsetTop + say.offsetHeight - innerHeight * 0.6));
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = -(e.clientY / innerHeight * 2 - 1); pointer.active = true; }, { passive: true });

  // camera keys: [position, target]
  const K0 = [new THREE.Vector3(0, 13.4, 5.5), new THREE.Vector3(0, 12.6, -8)];
  const K1 = [new THREE.Vector3(small ? 0 : -4.2, 4.6, 15.5), new THREE.Vector3(small ? 0 : -4.2, 4.2, -8)];   // high enough to see the mark on the ground
  const K2 = [new THREE.Vector3(0, 9, 2), new THREE.Vector3(0, 13, -8)];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -C.z), hit = new THREE.Vector3(), local = new THREE.Vector3();
  const stand = (t) => ({ root: { x: 0, y: 0, rot: 0, sx: 1 }, lean: 0.03 * Math.sin(t * 0.7), bend: 0.8, nod: -0.16, feet: { L: { x: -0.09, y: 0.33 }, R: { x: 0.1, y: 0.33 } }, knee: { L: 1, R: -1 }, hands: { F: { x: 0.2, y: -0.03 }, B: { x: -0.21, y: -0.02 } }, elbow: { F: 1, B: -1 }, round: { F: 0.3, B: 0.5 } });
  const hsh = (x) => { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); };
  const v = new THREE.Vector3(), v2 = new THREE.Vector3();
  let covered = false;
  ST.create({ trigger: teamEl, start: 'top top', end: 'max', onToggle: (s) => { covered = s.isActive; } });
  const t0 = performance.now() / 1000;

  gsap.ticker.add((time) => {
    const p = prog();
    stage.style.opacity = String(1 - smooth(clamp((p - 0.86) / 0.14)));
    if (covered || p >= 1) return;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    const hA = heroAt(), a = smooth(clamp(p / (hA * 0.45))), b = smooth(clamp((p - hA) / (1 - hA)));   // the camera comes down first; then the strike
    if (p < hA) { P.lerpVectors(K0[0], K1[0], a); T.lerpVectors(K0[1], K1[1], a); }
    else { P.lerpVectors(K1[0], K2[0], b); T.lerpVectors(K1[1], K2[1], b); }
    P.x += pointer.sx * 0.6; P.y += pointer.sy * 0.3;
    // the arrival, from the first scroll until "who we are" is in place
    const S = clamp((p - hA * 0.42) / (hA * 0.55)); arrival.s = S;
    const reach = smooth(clamp(S / 0.22));                                   // the bolt reaching down
    const flash = S > 0.18 ? Math.exp(-Math.pow((S - 0.245) / 0.035, 2)) : 0; // the impact
    P.y += Math.sin(time * 70) * 0.09 * flash; P.x += Math.cos(time * 53) * 0.06 * flash;   // the ground shakes
    cam.position.copy(P); cam.lookAt(T);

    // the cloud: each dot springs toward its place in the mark, and away from the pointer
    const life = Math.min(1, (performance.now() / 1000 - t0) / 2.5);
    cloud.rotation.y = Math.sin(time * 0.12) * 0.22 + pointer.sx * 0.12; cloud.rotation.x = Math.sin(time * 0.11) * 0.08;
    let px = 1e9, py = 1e9, pz = 0;
    if (pointer.active) {
      ray.setFromCamera({ x: pointer.x, y: pointer.y }, cam);
      if (ray.ray.intersectPlane(plane, hit)) { local.copy(hit); cloud.worldToLocal(local); px = local.x; py = local.y; pz = local.z; }
    }
    const stiff = 0.012 + 0.02 * life;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      const nx = home[j] + Math.sin(time * 0.6 + i * 0.37) * 0.06, ny = home[j + 1] + Math.cos(time * 0.5 + i * 0.21) * 0.06, nz = home[j + 2];
      let fx = (nx - pos[j]) * stiff, fy = (ny - pos[j + 1]) * stiff, fz = (nz - pos[j + 2]) * stiff;
      const dx = pos[j] - px, dy = pos[j + 1] - py, d2 = dx * dx + dy * dy;
      if (d2 < 6.25) { const d = Math.sqrt(d2) + 0.001, f = (1 - d / 2.5) * 0.09; fx += (dx / d) * f; fy += (dy / d) * f; fz += (pos[j + 2] - pz > 0 ? 1 : -1) * f * 0.5; }
      vel[j] = (vel[j] + fx) * 0.9; vel[j + 1] = (vel[j + 1] + fy) * 0.9; vel[j + 2] = (vel[j + 2] + fz) * 0.9;
      pos[j] += vel[j]; pos[j + 1] += vel[j + 1]; pos[j + 2] += vel[j + 2];
    }
    cloudGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < NF; i++) {
      const f = frag[i]; f.a += f.s * 0.02; f.tilt += f.spin * 0.02;
      const x = Math.cos(f.a) * f.r, z = Math.sin(f.a) * f.r * 0.6, y = f.y + Math.sin(time * 0.4 + i) * 0.3, dx = Math.cos(f.tilt) * f.len, dy = Math.sin(f.tilt) * f.len;
      fragPos.set([x - dx, y - dy, z, x + dx, y + dy, z], i * 6);
    }
    fragGeo.attributes.position.needsUpdate = true;
    // the bolt: reaches down from the cloud, blazes at the impact, then calms to a thin thread
    const blaze = S < 0.22 ? 1 : lerp(1, 0.3, smooth(clamp((S - 0.3) / 0.5)));
    bolt.visible = reach > 0.001;
    const X = 1 + flash * 1.6 + (1 - smooth(clamp((S - 0.25) / 0.4))) * 0.8 * (S > 0.22 ? 1 : reach);   // thick while it blazes
    bolt.scale.set(X, reach, X);
    bolt.position.set(0, TOP * (1 - reach), FIG.z * (1 - X));   // widening round its own axis, which stands at FIG.z
    beam.material.opacity = (0.42 + 0.08 * Math.sin(time * 1.3)) * (0.6 + blaze * 0.9);
    glow.children.forEach((m, k) => { m.material.opacity = (0.08 + 0.02 * Math.sin(time * 1.2 + k)) * (1 + blaze * 3 + flash * 6); });
    helix.material.opacity = (S < 0.22 ? reach : 1 - smooth(clamp((S - 0.32) / 0.4)));
    helixPivot.rotation.y = time * 2.2 + S * 20;
    // the shockwave, the dust, the mark
    const tw = clamp((S - 0.23) / 0.5);
    waves.forEach((l, k) => { const t = clamp(tw * 1.25 - k * 0.12); l.scale.setScalar(0.4 + Math.pow(t, 0.7) * 22); l.material.opacity = t > 0 && t < 1 ? (1 - t) * 0.85 : 0; });
    const dt = clamp((S - 0.23) / 0.6);
    for (let i = 0; i < ND2; i++) { const d = dustDir[i], r = d.sp * Math.pow(dt, 0.6); dust[i * 3] = Math.cos(d.a) * r; dust[i * 3 + 1] = GY + Math.max(0, d.up * dt - 7 * dt * dt); dust[i * 3 + 2] = FIG.z + Math.sin(d.a) * r * 0.9; }
    dustGeo.attributes.position.needsUpdate = true; dustPts.material.opacity = dt > 0 && dt < 1 ? (1 - dt) * 0.8 : 0;
    glyphMat.uniforms.uReveal.value = smooth(clamp((S - 0.24) / 0.32)) * 1.25;
    glyphMat.uniforms.uHeat.value = 1 - smooth(clamp((S - 0.45) / 0.5));
    glyphMat.uniforms.uScale.value = h / 900 * dpr;
    ring.visible = S > 0.3; ring.children.forEach((l, k) => { l.material.opacity = (k ? 0.12 : 0.6) * smooth(clamp((S - 0.3) / 0.3)); });
    ring.rotation.y = time * 0.04;
    renderer.render(scene, cam);

    // the figure, in 2D, where his feet and head fall on screen
    v.copy(FIG).project(cam); v2.set(FIG.x, FIG.y + 1.8, FIG.z).project(cam);
    fg.setTransform(dpr, 0, 0, dpr, 0, 0); fg.clearRect(0, 0, w, h);
    const fx = (v.x * 0.5 + 0.5) * w, fy = (-v.y * 0.5 + 0.5) * h;
    // the flash: a burst of white from the point of impact, washing the screen for an instant
    if (flash > 0.01 && v.z < 1) {
      const gr = fg.createRadialGradient(fx, fy, 0, fx, fy, Math.max(w, h) * 0.7);
      gr.addColorStop(0, `rgba(255, 250, 240, ${(flash * 0.95).toFixed(3)})`); gr.addColorStop(0.25, `rgba(255, 236, 210, ${(flash * 0.45).toFixed(3)})`); gr.addColorStop(1, 'rgba(255, 236, 210, 0)');
      fg.fillStyle = gr; fg.fillRect(0, 0, w, h);
    }
    const appear = smooth(clamp((S - 0.25) / 0.16));   // he comes out of the light
    if (MB && appear > 0 && v.z < 1 && v.z > -1) {
      const hy = (-v2.y * 0.5 + 0.5) * h, k = Math.max(3, (fy - hy) * 1.2);
      const rise = smooth(clamp((S - 0.42) / 0.36));     // out of the landing crouch, up to standing
      const pose = mixPose(crouch(), stand(time), rise), lines = MB.body(pose), bf = Math.floor(time * 8), jit = Math.max(0.4, k * 0.006);
      const camF = (qx, qy) => [fx + qx * k, fy - k * 0.33 + qy * k]; camF.k = k;
      const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * jit, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * jit];
      const hot = 1 - smooth(clamp((S - 0.3) / 0.3));
      fg.globalAlpha = appear;
      fg.shadowColor = `rgba(255, 244, 230, ${(0.5 + hot * 0.5).toFixed(2)})`; fg.shadowBlur = 10 + hot * 30;
      MB.draw(fg, lines, camF, j, hot > 0.5 ? '#FFFFFF' : '#FFF4E6');
      fg.shadowBlur = 0; fg.globalAlpha = 1;
    }
  });
}

/* ================= 4. Portraits in contour lines ================= */
// Each face is drawn as contour lines, like a map of its light: every line joins points of equal brightness, so they
// ring the eyes, the nose and the cheeks. The source is the photo cut out from its background, in grey with local
// contrast lifted so the eyes keep their shape (assets/img/team/*-lines.webp, the alpha is the cut). It runs on the
// graphics card: the lines drift slowly, swell gently round the pointer, and one face flows into the other.
function contourFaces(canvas, items) {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fs = `#extension GL_OES_standard_derivatives : enable
    precision highp float;
    uniform sampler2D uA, uB; uniform float uMix, uTime, uLevels, uPush; uniform vec4 uFrame; uniform vec2 uPtr; uniform float uDpr;
    void main() {
      vec2 uv = (gl_FragCoord.xy - uFrame.xy) / uFrame.zw; uv.y = 1.0 - uv.y;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
      vec2 tu = vec2(0.05 + uv.x * 0.9, 0.005 + uv.y * 0.99);
      vec4 a = texture2D(uA, tu), b = texture2D(uB, tu);
      float L = mix(a.r, b.r, uMix), Ld = mix(a.g, b.g, uMix), M = mix(a.a, b.a, uMix);
      if (M < 0.01) discard;
      // a gentle swell round the pointer: the lines part and ring it, then settle
      vec2 d = (uv - uPtr) * vec2(uFrame.z / uFrame.w, 1.0);
      float bump = exp(-dot(d, d) / 0.006) * uPush;
      float v = (pow(L, 0.8) + bump * 0.12) * uLevels + uTime * 0.12;
      float g = fwidth(v);
      float dist = 0.5 - abs(fract(v) - 0.5);                  // how far from the nearest contour
      float line = 1.0 - smoothstep(0.0, g * 1.2 + 0.0001, dist);   // one pixel wide, anti-aliased
      float edge = smoothstep(0.0, 0.08, uv.x) * smoothstep(0.0, 0.08, 1.0 - uv.x) * smoothstep(0.0, 0.1, 1.0 - uv.y);
      float sparse = 1.0 - smoothstep(0.45, 0.9, g);   // where lines crowd closer than a few pixels, let them go, so no grey smudges
      float alpha = line * sparse * smoothstep(0.02, 0.4, M) * edge * mix(0.34, 1.0, pow(Ld, 0.75));
      gl_FragColor = vec4(1.0, 0.957, 0.902, alpha);
    }`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  let prog;
  try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link'); }
  catch (e) { console.warn('[about] portraits', e); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uA = U('uA'), uB = U('uB'), uMix = U('uMix'), uTime = U('uTime'), uLevels = U('uLevels'), uPush = U('uPush'), uFrame = U('uFrame'), uPtr = U('uPtr');
  gl.uniform1i(uA, 0); gl.uniform1i(uB, 1);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const blank = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0])); return t; };
  const texs = items.map(() => blank());
  items.forEach((it, i) => {
    const img = new Image(); img.decoding = 'async';
    img.onload = () => {
      // A smooth map of the light: blurred enough that the lines follow the shape of the face, not the grain of the
      // skin or the weave of a shirt, but not so much that the eyes are lost. The light is filled in up to the edge
      // of the cut (blur of light-times-cut, divided by blur of the cut), so the outline does not pile up in rings.
      const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const cg = c.getContext('2d', { willReadFrequently: true });
      cg.drawImage(img, 0, 0, S, S);
      const px = cg.getImageData(0, 0, S, S), d = px.data, N = S * S, LM = new Float32Array(N), M = new Float32Array(N), tmp = new Float32Array(N);
      for (let k = 0; k < N; k++) { const m = d[k * 4 + 3] / 255; M[k] = m; LM[k] = (d[k * 4] / 255) * m; }
      const box = (a, r) => {                       // one horizontal and one vertical running-average pass
        for (let y = 0; y < S; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += a[y * S + Math.min(S - 1, Math.max(0, x))];
          for (let x = 0; x < S; x++) { tmp[y * S + x] = acc / (2 * r + 1); acc += a[y * S + Math.min(S - 1, x + r + 1)] - a[y * S + Math.max(0, x - r)]; } }
        for (let x = 0; x < S; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[Math.min(S - 1, Math.max(0, y)) * S + x];
          for (let y = 0; y < S; y++) { a[y * S + x] = acc / (2 * r + 1); acc += tmp[Math.min(S - 1, y + r + 1) * S + x] - tmp[Math.max(0, y - r) * S + x]; } }
      };
      // two maps: a heavily smoothed one that the contours follow (even, flowing lines, like a map of depth), and a
      // lightly smoothed one that sets each line's brightness (so eyes, brows and beard read along the lines)
      const LM2 = Float32Array.from(LM), Mb = Float32Array.from(M), Mb2 = Float32Array.from(M);
      [5, 5, 4].forEach((r) => { box(LM, r); box(Mb, r); });
      [1, 1].forEach((r) => { box(LM2, r); box(Mb2, r); });
      for (let k = 0; k < N; k++) {
        const f = Mb[k] > 0.02 ? LM[k] / Mb[k] : 0, f2 = Mb2[k] > 0.02 ? LM2[k] / Mb2[k] : 0;
        d[k * 4] = Math.round(Math.min(1, f) * 255); d[k * 4 + 1] = Math.round(Math.min(1, f2) * 255); d[k * 4 + 2] = 0; d[k * 4 + 3] = Math.round(M[k] * 255);
      }
      cg.putImageData(px, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, texs[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    img.src = it.dataset.photo;
  });

  let w = 0, h = 0, dpr = 1, live = false, cur = 0, next = 0, mix = { v: 0 };
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); gl.viewport(0, 0, canvas.width, canvas.height); };
  size(); addEventListener('resize', size);
  onScreen(canvas, (v) => { live = v; });
  // the pointer, in the portrait's own coordinates; its pull rises while it moves and fades when it rests
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, push: 0, target: 0 }, frame = { x: 0, y: 0, w: 1, h: 1 };
  canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.tx = (e.clientX - r.left - frame.x) / frame.w; ptr.ty = (e.clientY - r.top - frame.y) / frame.h; ptr.target = 1;
  }, { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { ptr.target = 0; });

  const draw = (time) => {
    if (!live || !w) return;
    // the portrait's frame: a little taller than wide, centred, clear of the corners' text
    const fw = Math.min(w * 0.86, h * 0.8 / 1.1), fh = fw * 1.1;
    frame.w = fw; frame.h = fh; frame.x = (w - fw) / 2; frame.y = Math.max(h * 0.1, (h - fh) / 2 - h * 0.04);
    ptr.x += (ptr.tx - ptr.x) * 0.12; ptr.y += (ptr.ty - ptr.y) * 0.12; ptr.push += (ptr.target - ptr.push) * 0.06;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texs[cur]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texs[next]);
    gl.uniform1f(uMix, smooth(mix.v)); gl.uniform1f(uTime, time); gl.uniform1f(uLevels, 30);
    gl.uniform1f(uPush, ptr.push); gl.uniform2f(uPtr, ptr.x, ptr.y);
    // gl_FragCoord runs from the bottom; the frame is given in device pixels from the bottom left
    gl.uniform4f(uFrame, frame.x * dpr, (h - frame.y - fh) * dpr, fw * dpr, fh * dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  gsap.ticker.add(draw);
  return { show(i) {
    if (i === next && mix.v < 1) return;
    if (i === cur && mix.v === 0) return;
    if (mix.v >= 1) cur = next;       // the last change finished: start from the face now showing
    next = i; mix.v = 0;
    gsap.to(mix, { v: 1, duration: 1.1, ease: 'power2.inOut', overwrite: true, onComplete: () => { cur = next; mix.v = 0; } });
  } };
}

/* ================= 4. Portraits drawn in lines ================= */
// Each photo (cut out from its background, in grey: assets/img/team/*-lines.webp) is read as light and dark. Rows of lines cross the screen, lifted where the face is light, and drawn
// brighter there, as if lit. Short dashes fall behind like rain. The pointer sends a ripple through the rows, and
// switching people morphs one face into the other. Until a photo is supplied (assets/img/team/), a sculpted
// stand-in (a lit head and shoulders) is drawn, with the brief for the photo under it.
function lineFaces(canvas, items) {
  if (!canvas) return { show() {} };
  const g = canvas.getContext('2d');
  const GW = 180, GH = 198;   // a little taller than wide: a head and shoulders
  const fields = [], keys = items.map((it) => it.dataset.keyword || ''), placeholder = items.map(() => true);
  const cur = new Float32Array(GW * GH), from = new Float32Array(GW * GH);
  let target = 0, mixT = 1, w = 0, h = 0, dpr = 1, live = false;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; };
  size(); addEventListener('resize', size);

  // a head and shoulders, lit from the upper left, as a sculptor's bust
  const bust = (seed) => {
    const f = new Float32Array(GW * GH), turn = seed ? 0.18 : -0.14, Lx = -0.55, Ly = 0.55, Lz = 0.63;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const u = x / (GW - 1), v = y / (GH - 1);
      let best = 0;
      const shade = (nx, ny, nz) => Math.max(0, nx * Lx + ny * Ly + nz * Lz) * 0.85 + 0.08;
      // head: an ellipsoid turned a little
      const hx = (u - 0.5) / 0.15, hy = (v - 0.36) / 0.21, hr = hx * hx + hy * hy;
      if (hr < 1) { const nz = Math.sqrt(1 - hr); let nx = hx * Math.cos(turn) + nz * Math.sin(turn); const nzz = -hx * Math.sin(turn) + nz * Math.cos(turn); best = Math.max(best, shade(nx, -hy, nzz) * (0.75 + 0.25 * nz)); }
      // nose and brow: a soft ridge down the middle of the face
      const rx = (u - 0.5 - turn * 0.12) / 0.018, ry = (v - 0.38) / 0.07;
      if (hr < 1 && rx * rx + ry * ry < 1) best = Math.min(1, best + 0.18 * (1 - rx * rx - ry * ry));
      // neck
      const nx2 = (u - 0.5) / 0.075;
      if (v > 0.5 && v < 0.74 && Math.abs(nx2) < 1) { const nz = Math.sqrt(1 - nx2 * nx2); best = Math.max(best, shade(nx2, 0.1, nz) * 0.6); }
      // shoulders
      const sx = (u - 0.5) / 0.42, sy = (v - 1.02) / 0.3, sr = sx * sx + sy * sy;
      if (sr < 1) { const nz = Math.sqrt(1 - sr); best = Math.max(best, shade(sx, -sy, nz) * 0.9); }
      f[y * GW + x] = best;
    }
    return f;
  };
  items.forEach((it, i) => {
    fields[i] = bust(i);
    const src = it.dataset.photo; if (!src) return;
    fetch(src, { method: 'HEAD' }).then((r) => {
      if (!r.ok) return;
      const img = new Image(); img.decoding = 'async';
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = GW; c.height = GH; const cg = c.getContext('2d', { willReadFrequently: true });
        // frame the head and shoulders: the photos are square with the person centred and the head near the top
        let sh = img.height * 0.98, sw = sh * (GW / GH);
        if (sw > img.width) { sw = img.width; sh = sw * (GH / GW); }
        cg.drawImage(img, (img.width - sw) / 2, img.height * 0.01, sw, sh, 0, 0, GW, GH);
        const d = cg.getImageData(0, 0, GW, GH).data, f = new Float32Array(GW * GH), mask = new Float32Array(GW * GH), seen = [];
        // the background fades out in a soft oval around the person; the light inside is stretched to the full range
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
          const k = y * GW + x, u = x / (GW - 1) - 0.5, v = y / (GH - 1) - 0.52;
          const r = Math.hypot(u / 0.6, v / 0.75), m = 1 - smooth(clamp((r - 0.85) / 0.25));   // the source is already cut out on black; this only softens the frame's corners
          mask[k] = m * (1 - smooth(clamp((y / (GH - 1) - 0.86) / 0.14)));
          f[k] = (0.2126 * d[k * 4] + 0.7152 * d[k * 4 + 1] + 0.0722 * d[k * 4 + 2]) / 255;
          if (m > 0.6 && f[k] > 0.04) seen.push(f[k]);   // levels from the person only, not the black around them
        }
        seen.sort((a, b) => a - b);
        const lo = seen[Math.floor(seen.length * 0.04)] || 0, hi = seen[Math.floor(seen.length * 0.985)] || 1;
        for (let k = 0; k < GW * GH; k++) f[k] = Math.pow(clamp((f[k] - lo) / (hi - lo || 1)), 1.15) * mask[k];
        fields[i] = f; placeholder[i] = false;
        if (i === target) { from.set(cur); mixT = 0; }
      };
      img.src = src;
    }).catch(() => {});
  });
  cur.set(fields[0]);

  // rain: columns of short dashes falling slowly
  const cols = Array.from({ length: 46 }, () => ({ x: Math.random(), sp: 0.02 + Math.random() * 0.06, off: Math.random(), len: 0.15 + Math.random() * 0.5, a: 0.15 + Math.random() * 0.35 }));
  const ptr = { x: -9999, y: -9999, t: -9 };
  canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.t = performance.now() / 1000; }, { passive: true });
  onScreen(canvas, (v) => { live = v; });

  const ROWS = 118, STEPS = 220, SEG = 8;
  const frame = (time) => {
    if (!live || !w) return;
    if (mixT < 1) { mixT = Math.min(1, mixT + 0.022); const m = smooth(mixT), f = fields[target]; for (let k = 0; k < cur.length; k++) cur[k] = from[k] + (f[k] - from[k]) * m; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // the face
    const fw = Math.min(w * 0.86, h * 0.78 * (GW / GH)), fh = fw * (GH / GW), ox = (w - fw) / 2, oy = Math.max(h * 0.11, (h - fh) / 2 - h * 0.06);   // keep its proportions on any screen
    const amp = (fh / ROWS) * 1.5, since = time - ptr.t;
    g.globalCompositeOperation = 'lighter';
    for (let r = 0; r < ROWS; r++) {
      const fy = (r / (ROWS - 1)) * (GH - 1), gy0 = Math.floor(fy), gy1 = Math.min(GH - 1, gy0 + 1), ty = fy - gy0, baseY = oy + (r / (ROWS - 1)) * fh;
      let px = 0, py = 0, acc = 0, n = 0;
      for (let c = 0; c <= STEPS; c++) {
        const u = c / STEPS, x = ox + u * fw, fx = u * (GW - 1), gx0 = Math.floor(fx), gx1 = Math.min(GW - 1, gx0 + 1), tx = fx - gx0;
        // smooth (bilinear) sampling, so edges are curves, not steps
        const L = (cur[gy0 * GW + gx0] * (1 - tx) + cur[gy0 * GW + gx1] * tx) * (1 - ty) + (cur[gy1 * GW + gx0] * (1 - tx) + cur[gy1 * GW + gx1] * tx) * ty;
        const d = Math.hypot(x - ptr.x, baseY - ptr.y), rip = since < 3 ? Math.sin(d * 0.05 - since * 8) * Math.exp(-d / 160) * 12 * (1 - since / 3) : 0;
        const y = baseY - L * amp + Math.sin(u * 14 + time * 0.7 + r * 0.35) * 0.5 + rip;
        if (c) {
          if (n === 0) { g.beginPath(); g.moveTo(px, py); }
          g.lineTo(x, y); acc += L; n++;
          if (n === SEG || c === STEPS) {
            const lum = acc / n, uu = (x - ox) / fw, vv = r / (ROWS - 1);
            const edge = smooth(clamp(Math.min(uu, 1 - uu) / 0.2)) * smooth(clamp((1 - vv) / 0.12));   // soft at the sides and the foot
            g.strokeStyle = `rgba(255, 244, 230, ${((0.004 + Math.pow(lum, 0.9) * 1.0) * edge).toFixed(3)})`;
            g.lineWidth = 1; g.stroke(); acc = 0; n = 0;
          }
        }
        px = x; py = y;
      }
    }
    g.globalCompositeOperation = 'source-over';
    if (placeholder[target]) {
      g.font = '400 11px Outfit, system-ui, sans-serif'; g.fillStyle = 'rgba(255, 244, 230, .5)'; g.textAlign = 'center';
      g.fillText(keys[target] + ', photo to come', w / 2, oy + fh + 18);
    }
  };
  if (window.gsap) window.gsap.ticker.add(frame); else { const loop = (t) => { frame(t / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  return { show(i) { if (i === target) return; from.set(cur); target = i; mixT = 0; } };
}

/* ================= 7. A heap of marks ================= */
// Small line marks (crosses, rings, triangles, squares, dashes) lie in a drift across the bottom of the call.
// They fall into place when it arrives, and move out of the pointer's way, then settle back.
function markHeap(canvas) {
  const g = canvas.getContext('2d'), host = canvas.parentElement;
  let w = 0, h = 0, dpr = 1, parts = [], live = false, dropped = false;
  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr;
    const N = Math.round(Math.min(1400, (w * h) / 900));
    parts = [];
    for (let i = 0; i < N; i++) {
      const x = Math.random() * w, u = x / w;
      const H = h * (0.2 + 0.12 * Math.sin(u * Math.PI * 2.2 + 0.6) + 0.07 * Math.sin(u * Math.PI * 6.1 + 2) + 0.1 * Math.exp(-Math.pow((u - 0.82) / 0.12, 2)));
      const y = h - Math.pow(Math.random(), 0.8) * H;
      parts.push({ hx: x, hy: y, x, y: dropped ? y : y - h * (0.6 + Math.random()), vx: 0, vy: 0, k: (Math.random() * 5) | 0, s: 4 + Math.random() * 5, r: Math.random() * Math.PI });
    }
  };
  build(); addEventListener('resize', build);
  const ptr = { x: -9999, y: -9999 };
  host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; }, { passive: true });
  host.addEventListener('pointerleave', () => { ptr.x = ptr.y = -9999; });
  onScreen(canvas, (v) => { live = v; });
  ST.create({ trigger: host, start: 'top 70%', once: true, onEnter: () => { dropped = true; } });
  gsap.ticker.add(() => {
    if (!live) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255, 244, 230, .92)'; g.lineWidth = 1.5; g.lineCap = 'round';
    g.beginPath();
    for (const p of parts) {
      if (dropped) {
        let fx = (p.hx - p.x) * 0.02, fy = (p.hy - p.y) * 0.02;
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 16900) { const d = Math.sqrt(d2) + 0.01, f = (1 - d / 130) * 3.2; fx += (dx / d) * f; fy += (dy / d) * f; p.r += 0.05; }
        p.vx = (p.vx + fx) * 0.84; p.vy = (p.vy + fy) * 0.84; p.x += p.vx; p.y += p.vy;
      }
      const s = p.s, c = Math.cos(p.r), sn = Math.sin(p.r);
      const L = (ax, ay, bx, by) => { g.moveTo(p.x + ax * c - ay * sn, p.y + ax * sn + ay * c); g.lineTo(p.x + bx * c - by * sn, p.y + bx * sn + by * c); };
      if (p.k === 0) { L(-s, 0, s, 0); L(0, -s, 0, s); }                       // cross
      else if (p.k === 1) { g.moveTo(p.x + s * 0.7, p.y); g.arc(p.x, p.y, s * 0.7, 0, Math.PI * 2); }   // ring
      else if (p.k === 2) { L(0, -s, s * 0.87, s * 0.5); L(s * 0.87, s * 0.5, -s * 0.87, s * 0.5); L(-s * 0.87, s * 0.5, 0, -s); }   // triangle
      else if (p.k === 3) { const q = s * 0.62; L(-q, -q, q, -q); L(q, -q, q, q); L(q, q, -q, q); L(-q, q, -q, -q); }   // square
      else L(-s, 0, s, 0);                                                      // dash
    }
    g.stroke();
  });
}


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
