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
    const shown = gsap.utils.toArray('.ab-tools-head > *, .ab-block-head, .ab-block-count, .ab-table > div, .ab-make-side, .next-kicker, .foot-grid > *');
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
    gsap.from('.ab-scroll', { opacity: 0, y: 16, duration: 1, ease: 'expo.out', delay: 0.6 });
    gsap.to('.ab-word-in', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: 'top top', end: 'bottom top', scrub: 0.3 } });
    gsap.to('.ab-intro .ab-scroll, .ab-word', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: '20% top', end: '75% top', scrub: 0.3 } });
    // Who we are: each line rises out of its own mask, the right side a beat after the left; they lift away together.
    const heroIn = gsap.timeline({ scrollTrigger: { trigger: '.ab-hero', start: 'top 55%', toggleActions: 'play none none reverse' } });
    heroIn.from('.ab-hero-a .ln > span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
      .from('.ab-hero-b .ln > span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.25);
    gsap.to('.ab-hero p', { yPercent: -40, opacity: 0, ease: 'power1.in', scrollTrigger: { trigger: '.ab-hero', start: 'bottom 90%', end: 'bottom 20%', scrub: 0.4 } });
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
      gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.1, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 45%', scrub: 0.5 } });
    });
    // The crosshairs drift a little slower than the page.
    document.querySelectorAll('.ab-plus').forEach((p) => gsap.fromTo(p, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: p.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
  }

  /* ---------------- 4. The team ---------------- */
  const team = document.querySelector('.ab-team'), stick = document.querySelector('.ab-team-stick');
  const face = document.querySelector('.ab-face'), letter = document.querySelector('.ab-letter span'), bar = document.querySelector('.ab-team-bar b'), countN = document.querySelector('.ab-count-n');
  const portraits = lineFaces(face, people);
  let on = 0;
  const pick = (i) => {
    if (i === on) return;
    people.forEach((p, k) => p.classList.toggle('is-on', k === i));
    portraits.show(i);
    if (countN) countN.textContent = String(i + 1).padStart(3, '0');
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
  const cursor = document.querySelector('.ab-cursor');
  if (cursor && finePointer && !reduce && stick) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3.out' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3.out' });
    let left = false;
    stick.addEventListener('pointerenter', (e) => { gsap.set(cursor, { x: e.clientX, y: e.clientY }); gsap.to(cursor, { scale: 1, duration: 0.5, ease: 'back.out(1.6)' }); });
    stick.addEventListener('pointerleave', () => gsap.to(cursor, { scale: 0, duration: 0.35, ease: 'power2.in' }));
    stick.addEventListener('pointermove', (e) => {
      cx(e.clientX); cy(e.clientY);
      const l = e.clientX < innerWidth / 2; if (l !== left) { left = l; cursor.classList.toggle('is-left', l); }
    });
    stick.addEventListener('pointerdown', () => gsap.fromTo(cursor, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' }));
    face.addEventListener('click', () => go(left ? -1 : 1));
  }

  if (!reduce) {
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
      const swoosh = make.querySelector('.ab-swoosh path');
      const spread = () => Math.min(innerWidth * 0.22, 400) * 1.06;
      const tl = gsap.timeline({ scrollTrigger: { trigger: make, start: 'top top', end: '+=260%', pin: '.ab-make-stick', scrub: 0.6, invalidateOnRefresh: true } });
      tl.to('.ab-make-head', { yPercent: -120, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.05)
        .fromTo(swoosh, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.55 }, 0)
        .to('.ab-swoosh', { yPercent: -40, rotation: -6, ease: 'none', duration: 1 }, 0);
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
  const NM = small ? 2600 : 5200, ND = small ? 900 : 2200, N = NM + ND;
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
    const big = Math.random() < 0.035;
    size[i] = big ? 2.6 + Math.random() * 3.4 : 0.7 + Math.random() * 1.3;
    tone[i] = Math.random() < 0.06 ? 1 : 0;   // a few orange
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
  const NF = small ? 40 : 90, frag = [], fragPos = new Float32Array(NF * 6);
  for (let i = 0; i < NF; i++) frag.push({ a: Math.random() * Math.PI * 2, r: R * (0.9 + Math.random() * 0.9), y: (Math.random() - 0.5) * R * 1.6, s: 0.02 + Math.random() * 0.05, len: 0.2 + Math.random() * 0.7, tilt: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.6 });
  const fragGeo = new THREE.BufferGeometry(); fragGeo.setAttribute('position', new THREE.BufferAttribute(fragPos, 3));
  const frags = new THREE.LineSegments(fragGeo, new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0.55 }));
  frags.position.copy(C); frags.frustumCulled = false; scene.add(frags);

  // --- the valley: rows of contour lines, rising into ridges on both sides and far away
  const ROWS = small ? 70 : 110, COLS = small ? 120 : 180, W = 150, D = 120;
  const hgt = (x, z) => {
    const ax = Math.abs(x), dz = -z - 8;
    const ridge = Math.pow(Math.max(0, ax - 9), 1.35) * 0.42 * (1 + 0.35 * Math.sin(z * 0.11 + x * 0.05));
    const far = Math.max(0, dz - 25) * 0.18 * (1 + 0.5 * Math.sin(x * 0.07));
    const rough = (Math.sin(x * 0.9 + z * 0.4) * 0.12 + Math.sin(x * 0.31 - z * 0.7) * 0.18) * (0.3 + Math.min(1, ax / 14));
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
  const valley = new THREE.LineSegments(valleyGeo, new THREE.LineBasicMaterial({ color: 0xFFF4E6, transparent: true, opacity: 0.3 }));
  scene.add(valley);

  // --- the beam: fine lines from the cloud to the ground, and a soft glow around them
  const NB = small ? 140 : 260, bpos = [], bcol = [];
  for (let i = 0; i < NB; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.pow(Math.random(), 1.7) * 1.1, x = Math.cos(a) * rr, z = FIG.z + Math.sin(a) * rr;
    const y0 = Math.random() * 1.5, y1 = C.y - 3 - Math.random() * 3, k = 1 - rr / 1.1, c = 0.3 + 0.7 * k;
    bpos.push(x, y0, z, x, y1, z); bcol.push(c, c * 0.96, c * 0.9, c * 0.25, c * 0.24, c * 0.22);
  }
  const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); beamGeo.setAttribute('color', new THREE.Float32BufferAttribute(bcol, 3));
  const beam = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(beam);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,244,230,0)'); gr.addColorStop(0.5, 'rgba(255,244,230,1)'); gr.addColorStop(1, 'rgba(255,244,230,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,.9)'); v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.2)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Group();
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, C.y - 2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(0, (C.y - 2) / 2, FIG.z); m.rotation.y = (k / 3) * Math.PI; glow.add(m); }
  scene.add(glow);
  // --- light pooled on the ground: loose rings, and a scatter of short marks like pebbles
  const ring = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const pts = [], Rr = 1.1 + k * 0.7;
    for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * Rr, 0.03 + hgt(Math.cos(a) * Rr, FIG.z + Math.sin(a) * Rr), FIG.z + Math.sin(a) * Rr * 0.9)); }
    ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: k ? 0xFFF4E6 : 0xDC5000, transparent: true, opacity: k ? 0.18 - k * 0.022 : 0.7 })));
  }
  scene.add(ring);
  const peb = [];
  for (let i = 0; i < (small ? 160 : 360); i++) { const a = Math.random() * Math.PI * 2, r = 1.2 + Math.pow(Math.random(), 0.7) * 9, x = Math.cos(a) * r, z = FIG.z + Math.sin(a) * r * 0.8, y = hgt(x, z) + 0.03, l = 0.05 + Math.random() * 0.12, t = Math.random() * Math.PI;
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
  const K1 = [new THREE.Vector3(0, 2.4, 15), new THREE.Vector3(0, 5.4, -8)];
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
    const hA = heroAt(), a = smooth(clamp(p / hA)), b = smooth(clamp((p - hA) / (1 - hA)));
    if (p < hA) { P.lerpVectors(K0[0], K1[0], a); T.lerpVectors(K0[1], K1[1], a); }
    else { P.lerpVectors(K1[0], K2[0], b); T.lerpVectors(K1[1], K2[1], b); }
    P.x += pointer.sx * 1.2; P.y += pointer.sy * 0.6;
    cam.position.copy(P); cam.lookAt(T);

    // the cloud: each dot springs toward its place in the mark, and away from the pointer
    const life = Math.min(1, (performance.now() / 1000 - t0) / 2.5);
    cloud.rotation.y = Math.sin(time * 0.15) * 0.35 + pointer.sx * 0.25; cloud.rotation.x = Math.sin(time * 0.11) * 0.08;
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
    beam.material.opacity = 0.5 + 0.15 * Math.sin(time * 1.7) + 0.1 * Math.sin(time * 4.3);
    glow.children.forEach((m, k) => { m.material.opacity = 0.16 + 0.06 * Math.sin(time * 1.2 + k); });
    ring.rotation.y = time * 0.04;
    renderer.render(scene, cam);

    // the figure, in 2D, where his feet and head fall on screen
    v.copy(FIG).project(cam); v2.set(FIG.x, FIG.y + 1.8, FIG.z).project(cam);
    fg.setTransform(dpr, 0, 0, dpr, 0, 0); fg.clearRect(0, 0, w, h);
    if (MB && v.z < 1 && v.z > -1) {
      const fx = (v.x * 0.5 + 0.5) * w, fy = (-v.y * 0.5 + 0.5) * h, hy = (-v2.y * 0.5 + 0.5) * h, k = Math.max(3, (fy - hy) * 1.2);
      const pose = stand(time), lines = MB.body(pose), bf = Math.floor(time * 8), jit = Math.max(0.4, k * 0.006);
      const camF = (qx, qy) => [fx + qx * k, fy - k * 0.33 + qy * k]; camF.k = k;
      const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * jit, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * jit];
      fg.shadowColor = 'rgba(255, 244, 230, .7)'; fg.shadowBlur = 14;
      MB.draw(fg, lines, camF, j, '#FFF4E6');
      fg.shadowBlur = 0;
    }
  });
}

/* ================= 4. Portraits drawn in lines ================= */
// Each photo is read as light and dark. Rows of lines cross the screen, lifted where the face is light, and drawn
// brighter there, as if lit. Short dashes fall behind like rain. The pointer sends a ripple through the rows, and
// switching people morphs one face into the other. Until a photo is supplied (assets/img/team/), a sculpted
// stand-in (a lit head and shoulders) is drawn, with the brief for the photo under it.
function lineFaces(canvas, items) {
  if (!canvas) return { show() {} };
  const g = canvas.getContext('2d');
  const GW = 140, GH = 110;
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
        const s = Math.max(GW / img.width, GH / img.height), dw = img.width * s, dh = img.height * s;
        cg.drawImage(img, (GW - dw) / 2, (GH - dh) / 2, dw, dh);
        const d = cg.getImageData(0, 0, GW, GH).data, f = new Float32Array(GW * GH);
        for (let k = 0; k < GW * GH; k++) f[k] = (0.2126 * d[k * 4] + 0.7152 * d[k * 4 + 1] + 0.0722 * d[k * 4 + 2]) / 255;
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

  const ROWS = 96, STEPS = 220, SEG = 11;
  const frame = (time) => {
    if (!live || !w) return;
    if (mixT < 1) { mixT = Math.min(1, mixT + 0.022); const m = smooth(mixT), f = fields[target]; for (let k = 0; k < cur.length; k++) cur[k] = from[k] + (f[k] - from[k]) * m; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // the rain
    g.lineWidth = 1;
    for (const c of cols) {
      const x = Math.round(c.x * w) + 0.5, head = ((time * c.sp + c.off) % 1.3 - 0.15) * h;
      for (let y = head - c.len * h; y < head; y += 7) {
        const a = c.a * clamp((y - (head - c.len * h)) / (c.len * h));
        g.strokeStyle = `rgba(190, 220, 255, ${(a * 0.5).toFixed(3)})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 3); g.stroke();
      }
    }
    // the face
    const fh = h * 0.96, fw = Math.min(w * 0.75, fh * (GW / GH)), ox = (w - fw) / 2, oy = h * 0.06;
    const amp = (fh / ROWS) * 3.2, since = time - ptr.t;
    g.globalCompositeOperation = 'lighter';
    for (let r = 0; r < ROWS; r++) {
      const gy = Math.min(GH - 1, Math.round((r / (ROWS - 1)) * (GH - 1))), baseY = oy + (r / (ROWS - 1)) * fh;
      let px = 0, py = 0, acc = 0, n = 0;
      for (let c = 0; c <= STEPS; c++) {
        const x = (c / STEPS) * w, u = (x - ox) / fw, gx = Math.round(u * (GW - 1));
        const L = u >= 0 && u <= 1 ? cur[gy * GW + gx] : 0;
        const d = Math.hypot(x - ptr.x, baseY - ptr.y), rip = since < 3 ? Math.sin(d * 0.05 - since * 8) * Math.exp(-d / 160) * 12 * (1 - since / 3) : 0;
        const y = baseY - L * amp + Math.sin(u * 14 + time * 0.7 + r * 0.35) * 0.5 + rip;
        if (c) {
          if (n === 0) { g.beginPath(); g.moveTo(px, py); }
          g.lineTo(x, y); acc += L; n++;
          if (n === SEG || c === STEPS) {
            const lum = acc / n, edge = Math.min(1, Math.min(x, w - x) / (w * 0.12));
            g.strokeStyle = `rgba(255, 244, 230, ${((0.05 + Math.pow(lum, 1.6) * 0.95) * edge).toFixed(3)})`;
            g.lineWidth = 0.8 + lum * 0.9; g.stroke(); acc = 0; n = 0;
          }
        }
        px = x; py = y;
      }
    }
    g.globalCompositeOperation = 'source-over';
    if (placeholder[target]) {
      g.font = '400 11px Outfit, system-ui, sans-serif'; g.fillStyle = 'rgba(255, 244, 230, .5)'; g.textAlign = 'center';
      g.fillText(keys[target] + ' (photo to come)', w / 2, h - 20);
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
