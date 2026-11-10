/* About page. Structure and motion after lusion.co/about (Abhishek's reference); everything drawn is lines.
   1. Smooth scroll, nav, the reveal         4. The team: portraits drawn in lines, one person at a time
   2. The opening scene (three.js, lazy)     5. The record, what we make, the call, the next page
   3. Who we are, the statement word by word
   All text is in the HTML; with scripts off, or with reduced motion, the page reads top to bottom as it is. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const gsap = window.gsap, ST = window.ScrollTrigger;
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

/* The people list without scripts, or with reduced motion: both names show. */
const people = [...document.querySelectorAll('.ab-person')];
if (reduce) people.forEach((p) => p.classList.add('is-on'));

if (gsap && ST) {
  gsap.registerPlugin(ST);

  /* 1. Smooth scroll on mouse and trackpad, as on the home page */
  let smoother = null;
  if (!reduce && finePointer && window.ScrollSmoother) {
    gsap.registerPlugin(window.ScrollSmoother);
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1, effects: false });
  }

  // The nav takes the colour of what is under it; on the bright block it turns ink.
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
    // The reveal, the same as the home page: a soft oval opens across each block from the left as it fades in.
    const shown = gsap.utils.toArray('.ab-row-head, .ab-row-count, .ab-list li, .ab-make-head, .ab-card, .ab-cta-kicker, .ab-cta-sub, .next-kicker, .foot-grid > *');
    shown.forEach((el) => el.classList.add('entry'));
    gsap.set(shown, { opacity: 0, '--reveal': '0%' });
    ST.batch(shown, { start: 'top 92%', once: true, interval: 0.08, onEnter: (els) => {
      gsap.to(els, { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08, overwrite: 'auto' });
      gsap.to(els, { '--reveal': '230%', duration: 0.76, ease: 'power2.out', stagger: 0.08, onComplete: () => els.forEach((el) => el.classList.remove('entry')) });
    } });

    /* 3. The name lifts away; who we are slides in from the two sides and out again; the statement lights up word by word. */
    gsap.to('.ab-word span:first-child', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: 'top top', end: 'bottom top', scrub: 0.4 } });
    gsap.to('.ab-word span:last-child', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: 'top top', end: 'bottom top', scrub: 0.4 } });
    gsap.to('.ab-word, .ab-scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.ab-intro', start: '30% top', end: '90% top', scrub: 0.4 } });
    const we = gsap.timeline({ scrollTrigger: { trigger: '.ab-we', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    we.fromTo('.ab-we-a', { xPercent: -40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.4 }, 0)
      .fromTo('.ab-we-b', { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.4 }, 0)
      .to('.ab-we-a', { xPercent: -60, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.7)
      .to('.ab-we-b', { xPercent: 60, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.7);
    document.querySelectorAll('.ab-words').forEach((p) => {
      // split into words, keeping the emphasis (em) around its own words
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s); } });
          n.replaceWith(frag);
        } else walk(n);
      });
      walk(p);
      gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 45%', scrub: 0.5 } });
    });
  }

  /* 4. The team */
  const team = document.querySelector('.ab-team');
  const face = document.querySelector('.ab-face'), letter = document.querySelector('.ab-letter span'), bar = document.querySelector('.ab-team-bar b'), ticks = [...document.querySelectorAll('.ab-ticks i')];
  const portraits = lineFaces(face, people);
  let on = 0;
  const pick = (i) => {
    if (i === on) return;
    people.forEach((p, k) => p.classList.toggle('is-on', k === i));
    portraits.show(i);
    if (letter && !reduce) gsap.timeline().to(letter, { rotationX: 90, duration: 0.25, ease: 'power2.in', onComplete: () => { letter.textContent = people[i].querySelector('.ab-name').textContent.trim()[0]; } })
      .fromTo(letter, { rotationX: -90 }, { rotationX: 0, duration: 0.5, ease: 'power3.out' });
    else if (letter) letter.textContent = people[i].querySelector('.ab-name').textContent.trim()[0];
    on = i;
  };
  let teamST = null;
  if (!reduce && team) {
    const n = people.length;
    teamST = ST.create({ id: 'team', trigger: team, start: 'top top', end: () => '+=' + innerHeight * n * 0.8, pin: '.ab-team-stick', anticipatePin: 1,
      onUpdate: (s) => {
        const f = s.progress * n, i = Math.min(n - 1, Math.floor(f));
        pick(i); gsap.set(bar, { scaleX: Math.min(1, f - i) });
        ticks.forEach((t, k) => t.classList.toggle('on', k <= Math.round(s.progress * (ticks.length - 1))));
      } });
  }
  document.querySelector('.ab-next')?.addEventListener('click', () => {
    const i = (on + 1) % people.length;
    if (teamST) { const y = teamST.start + (teamST.end - teamST.start) * ((i + 0.5) / people.length); smoother ? smoother.scrollTo(y, true) : scrollTo({ top: y, behavior: 'smooth' }); }
    else pick(i);
  });

  if (!reduce) {
    /* 5. The record: the three words drift past in opposite directions; the counts tick up. */
    gsap.utils.toArray('.ab-drift p').forEach((p, i) => gsap.fromTo(p, { xPercent: i % 2 ? -30 : 10 }, { xPercent: i % 2 ? 10 : -30, ease: 'none', scrollTrigger: { trigger: '.ab-record', start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
    document.querySelectorAll('.ab-row-count').forEach((c) => {
      const end = parseInt(c.textContent, 10), node = [...c.childNodes].find((x) => x.nodeType === 3), o = { v: 0 };
      if (!node || !end) return;
      gsap.to(o, { v: end, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true }, onUpdate: () => { node.textContent = String(Math.round(o.v)).padStart(2, '0'); } });
    });
    // What we make: the big word slides, and each card's letter flips over as it arrives (and again on hover).
    gsap.fromTo('.ab-make-word', { xPercent: 4 }, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: '.ab-make', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    document.querySelectorAll('.ab-card').forEach((card) => {
      const l = card.querySelector('.ab-card-letter span');
      gsap.fromTo(l, { rotationX: -180 }, { rotationX: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
      card.addEventListener('mouseenter', () => gsap.fromTo(l, { rotationX: 0 }, { rotationX: 360, duration: 0.9, ease: 'power3.inOut', overwrite: true }));
    });
  }

  // Let's make it together: every letter twice, so on hover the second copy rolls up a letter at a time.
  const roll = document.querySelector('.ab-roll');
  if (roll) {
    let i = 0;   // letters grouped by word, so a line never breaks inside one
    roll.innerHTML = roll.textContent.trim().split(/\s+/).map((word) => `<span class="wd">${[...word].map((c) => `<span class="l" style="--i:${i++}"><span>${c}</span><span>${c}</span></span>`).join('')}</span>`).join(' ');
    // it rises into place a letter at a time when it arrives (CSS, using the same per-letter delay as the hover)
    const title = document.querySelector('.ab-cta-title');
    if (!reduce) { title.classList.add('is-low'); ST.create({ trigger: roll, start: 'top 85%', once: true, onEnter: () => title.classList.remove('is-low') }); }
  }

  // Next page: the bar fills as you keep scrolling; at the end it goes to the projects.
  if (!reduce) {
    const nb = document.querySelector('.next-bar b'), link = document.querySelector('.next-title');
    let gone = false;
    gsap.fromTo(nb, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top top', end: '+=120%', pin: '.next-stick', scrub: 0.6,
      onUpdate: (self) => { if (gone || self.progress < 0.999 || self.direction < 0) return; gone = true; location.href = link.href; } } });
  }

  /* 2. The opening scene: loaded once the page has loaded, so the first paint never waits for it. */
  const stage = document.querySelector('.ab-stage');
  if (stage && !reduce) {
    const go = () => openingScene(stage).catch((e) => console.warn('[about] scene', e));
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    if (document.readyState === 'complete') idle(go); else addEventListener('load', () => idle(go), { once: true });
  } else if (stage) stage.remove();

  addEventListener('load', () => ST.refresh(), { once: true });
}

/* ---------------- 2. The opening scene ---------------- */
// A field of contour lines runs to the horizon; a beam of fine vertical lines falls on the figure from far above.
// Scrolling through the first three sections lifts the camera up the beam, looking down at him as he grows small.
async function openingScene(stage) {
  const canGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!canGL) return;
  const [THREE] = await Promise.all([import(THREE_URL), loadScript('/assets/js/figure/mark.js').then(() => loadScript('/assets/js/figure/markbody.js'))]);
  const MB = window.MarkBody;
  const glc = stage.querySelector('.ab-gl'), fc = stage.querySelector('.ab-fig'), fg = fc.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x030203, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x030203, 18, 80);
  const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  // the field: rows of lines across x, each lifted by soft hills; a dip where the figure stands
  const ROWS = 90, COLS = 160, W = 120, D = 90;
  const h = (x, z) => {
    const hills = Math.sin(x * 0.11 + z * 0.05) * 1.4 + Math.sin(x * 0.23 - z * 0.13) * 0.7 + Math.cos(z * 0.09 + x * 0.04) * 1.1;
    const far = smooth(clamp((-z - 10) / 50));
    const flat = 1 - Math.exp(-(x * x + (z + 6) * (z + 6)) / 60);
    return hills * flat * (0.4 + far * 1.8) + far * far * 6;
  };
  const pos = [];
  for (let r = 0; r < ROWS; r++) {
    const z = 8 - (r / (ROWS - 1)) * D;
    for (let c = 0; c < COLS - 1; c++) {
      const x0 = -W / 2 + (c / (COLS - 1)) * W, x1 = -W / 2 + ((c + 1) / (COLS - 1)) * W;
      pos.push(x0, h(x0, z), z, x1, h(x1, z), z);
    }
  }
  const fieldGeo = new THREE.BufferGeometry(); fieldGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const field = new THREE.LineSegments(fieldGeo, new THREE.LineBasicMaterial({ color: 0xFFEDD7, transparent: true, opacity: 0.32 }));
  scene.add(field);

  // the beam: many fine vertical lines in a narrow column, brightest at its core
  const BEAM = 260, bpos = [], bcol = [];
  for (let i = 0; i < BEAM; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.pow(Math.random(), 1.8) * 1.6, x = Math.cos(a) * rr, z = -6 + Math.sin(a) * rr;
    const y0 = Math.random() * 3, y1 = y0 + 20 + Math.random() * 60, k = 1 - rr / 1.6;
    bpos.push(x, y0, z, x, y1, z);
    const c = 0.25 + 0.75 * k; bcol.push(c, c * 0.93, c * 0.84, c * 0.4, c * 0.37, c * 0.33);
  }
  const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); beamGeo.setAttribute('color', new THREE.Float32BufferAttribute(bcol, 3));
  const beam = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(beam);
  // a ring of light on the ground around him, drawn as a few loose circles
  const ring = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const pts = []; const R = 1.2 + k * 0.5;
    for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, 0.02, -6 + Math.sin(a) * R)); }
    ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xDC5000, transparent: true, opacity: 0.5 - k * 0.09 })));
  }
  scene.add(ring);

  let w = 0, hh = 0, dpr = 1;
  const size = () => { w = innerWidth; hh = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr); renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); fc.width = w * dpr; fc.height = hh * dpr; };
  size(); addEventListener('resize', size);

  // scroll: 0 at the top of the page, 1 when the statement has passed
  const say = document.querySelector('.ab-say'), teamEl = document.querySelector('.ab-team');
  const prog = () => { const end = say.offsetTop + say.offsetHeight - innerHeight * 0.5; const y = (window.ScrollSmoother && window.ScrollSmoother.get()) ? window.ScrollSmoother.get().scrollTop() : scrollY; return clamp(y / end); };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const stand = (t) => ({ root: { x: 0, y: 0, rot: 0, sx: 1 }, lean: 0.03 * Math.sin(t * 0.7), bend: 0.8, nod: -0.12, feet: { L: { x: -0.09, y: 0.33 }, R: { x: 0.1, y: 0.33 } }, knee: { L: 1, R: -1 }, hands: { F: { x: 0.2, y: -0.03 }, B: { x: -0.21, y: -0.02 } }, elbow: { F: 1, B: -1 }, round: { F: 0.3, B: 0.5 } });
  const hsh = (x) => { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); };
  const v = new THREE.Vector3(), v2 = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = !e.isIntersecting; }).observe(teamEl);   // stop once the team covers the screen

  gsap.ticker.add((time) => {
    const p = prog();
    stage.style.opacity = String(1 - smooth(clamp((p - 0.82) / 0.18)));
    if (!visible || p >= 1) return;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    // the camera: low and close, looking at him; then up the beam, looking down
    const e = smooth(p);
    cam.position.set(pointer.sx * 2.2, lerp(2.2, 26, e), lerp(9, -2, e));
    cam.lookAt(pointer.sx * 0.6, lerp(1.6, 0, e), lerp(-6, -6.5, e));
    cam.rotation.z += pointer.sx * -0.02;
    beam.material.opacity = 0.55 + 0.2 * Math.sin(time * 1.3);
    ring.rotation.y = time * 0.05;
    renderer.render(scene, cam);

    // the figure, drawn in 2D where his feet and head fall on screen
    v.set(0, 0, -6).project(cam); v2.set(0, 1.9, -6).project(cam);
    const fx = (v.x * 0.5 + 0.5) * w, fy = (-v.y * 0.5 + 0.5) * hh, hy = (-v2.y * 0.5 + 0.5) * hh;
    const k = Math.max(4, (fy - hy) * 1.25);
    fg.setTransform(dpr, 0, 0, dpr, 0, 0); fg.clearRect(0, 0, w, hh);
    if (MB && v.z < 1) {
      const pose = stand(time), lines = MB.body(pose), bf = Math.floor(time * 8), jit = Math.max(0.5, k * 0.006);
      const camF = (px, py) => [fx + px * k, fy - k * 0.33 + py * k]; camF.k = k;
      const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * jit, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * jit];
      fg.shadowColor = 'rgba(220, 80, 0, .55)'; fg.shadowBlur = 18;
      MB.draw(fg, lines, camF, j, '#FFEDD7');
      fg.shadowBlur = 0;
    }
  });
}

/* ---------------- 4. Portraits drawn in lines ---------------- */
// Each photo is read as light and dark; rows of lines cross the frame, lifted where the face is light and drawn
// heavier where it is dark. The pointer sends a ripple through them. Until a photo is supplied (assets/img/team/),
// a soft stand-in shape is drawn, with the brief for the photo written under it.
function lineFaces(canvas, items) {
  if (!canvas) return { show() {} };
  const g = canvas.getContext('2d');
  const GW = 120, GH = 90;                               // the sampling grid
  const fields = items.map(() => null), keys = items.map((it) => it.dataset.keyword || '');
  const cur = new Float32Array(GW * GH), from = new Float32Array(GW * GH);
  let target = 0, mixT = 1, w = 0, h = 0, dpr = 1, live = false, placeholder = items.map(() => true);
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; };
  size(); addEventListener('resize', size);

  const standIn = (seed) => {                           // a head and shoulders, lit from the upper left
    const f = new Float32Array(GW * GH), tilt = seed ? 0.04 : -0.03;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const u = x / (GW - 1), v = y / (GH - 1);
      const hx = (u - 0.5 - tilt * (v - 0.4)) / 0.15, hy = (v - 0.4) / 0.27, head = 1 - smooth(clamp(Math.hypot(hx, hy) - 0.6, 0, 0.4) / 0.4);
      const sx = (u - 0.5) / 0.36, sy = (v - 1.04) / 0.3, body = 1 - smooth(clamp(Math.hypot(sx, sy) - 0.7, 0, 0.3) / 0.3);
      const nx = (u - 0.5) / 0.06, neck = v > 0.6 && v < 0.8 ? 1 - smooth(clamp(Math.abs(nx) - 0.6, 0, 0.4) / 0.4) : 0;
      const light = 0.55 + 0.45 * (1 - u) * (1 - v * 0.6);
      f[y * GW + x] = Math.max(head, body, neck) * light;
    }
    return f;
  };
  items.forEach((it, i) => {
    fields[i] = standIn(i);
    const src = it.dataset.photo; if (!src) return;
    const img = new Image(); img.decoding = 'async';
    img.onload = () => {                                 // the real photo replaces the stand-in
      const c = document.createElement('canvas'); c.width = GW; c.height = GH; const cg = c.getContext('2d', { willReadFrequently: true });
      const s = Math.max(GW / img.width, GH / img.height), dw = img.width * s, dh = img.height * s;
      cg.drawImage(img, (GW - dw) / 2, (GH - dh) / 2, dw, dh);
      const d = cg.getImageData(0, 0, GW, GH).data, f = new Float32Array(GW * GH);
      for (let k = 0; k < GW * GH; k++) f[k] = (0.2126 * d[k * 4] + 0.7152 * d[k * 4 + 1] + 0.0722 * d[k * 4 + 2]) / 255;
      fields[i] = f; placeholder[i] = false;
      if (i === target) { from.set(cur); mixT = 0; }
    };
    img.src = src;
  });
  cur.set(fields[0]);

  const ptr = { x: -9999, y: -9999, t: -9 };
  canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.t = performance.now() / 1000; }, { passive: true });
  new IntersectionObserver(([e]) => { live = e.isIntersecting; }).observe(canvas);

  const ROWS = 72;
  const frame = (time) => {
    if (!live) return;
    if (mixT < 1) { mixT = Math.min(1, mixT + 0.025); const m = smooth(mixT), f = fields[target]; for (let k = 0; k < cur.length; k++) cur[k] = from[k] + (f[k] - from[k]) * m; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    // the portrait's frame: centred, a little taller than wide
    const fh = h * 0.86, fw = Math.min(w * 0.9, fh * (GW / GH)), ox = (w - fw) / 2, oy = (h - fh) / 2 + h * 0.02;
    const amp = fh / ROWS * 2.6, since = time - ptr.t;
    g.lineCap = 'round';
    for (let r = 0; r < ROWS; r++) {
      const gy = Math.min(GH - 1, Math.round((r / (ROWS - 1)) * (GH - 1))), baseY = oy + (r / (ROWS - 1)) * fh;
      g.beginPath();
      let dark = 0;
      for (let c = 0; c <= 200; c++) {
        const x = (c / 200) * w, u = (x - ox) / fw, gx = Math.round(u * (GW - 1));
        const L = u >= 0 && u <= 1 ? cur[gy * GW + gx] : 0;
        const d = Math.hypot(x - ptr.x, baseY - ptr.y), rip = since < 3 ? Math.sin(d * 0.06 - since * 9) * Math.exp(-d / 140) * 10 * (1 - since / 3) : 0;
        const y = baseY - L * amp + Math.sin(u * 18 + time * 0.8 + r * 0.4) * 0.6 + rip;
        c ? g.lineTo(x, y) : g.moveTo(x, y);
        dark += L;
      }
      const a = 0.16 + 0.7 * (dark / 201) * (w / fw);
      const grad = g.createLinearGradient(0, 0, w, 0);   // the lines fade out toward the screen's edges
      grad.addColorStop(0, 'rgba(255, 237, 215, 0)'); grad.addColorStop(0.18, `rgba(255, 237, 215, ${a.toFixed(3)})`);
      grad.addColorStop(0.82, `rgba(255, 237, 215, ${a.toFixed(3)})`); grad.addColorStop(1, 'rgba(255, 237, 215, 0)');
      g.strokeStyle = grad; g.lineWidth = 1;
      g.stroke();
    }
    if (placeholder[target]) {                           // the brief for the photo, as on every image slot
      g.font = '400 11px Outfit, system-ui, sans-serif'; g.fillStyle = 'rgba(255, 237, 215, .5)'; g.textAlign = 'center';
      g.fillText(keys[target], w / 2, oy + fh + 12);
    }
  };
  if (window.gsap) window.gsap.ticker.add(frame); else { const loop = (t) => { frame(t / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  return { show(i) { if (i === target) return; from.set(cur); target = i; mixT = 0; } };
}
