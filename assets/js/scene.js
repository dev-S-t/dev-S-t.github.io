/* human-in-loop.dev: the three.js scenes on the home page. Loaded after first paint by home.js.
   three.js r160 (MIT), from jsdelivr, the same build the AI loop uses.

   reel    A card that unrolls like a carpet, then opens to full screen. Its surface is a fill box
           until the showreel video arrives (swap the CanvasTexture for a VideoTexture).
   loops   One cloud of dots. First it is the AI: a sphere of nodes joined by lines. Then the dots
           scatter, stretch and settle into the design: a golden spiral, a grid, and a loop with the
           logo's opening at eleven o'clock.
   portal  A tunnel of wobbling line rings. Scroll and you fall through it.

   Each scene reads the progress of the pinned ScrollTrigger home.js made for it, and only renders
   while its canvas is on screen. */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;

const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

function stage(THREE, canvas, { fov = 35, z = 5 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 300);
  camera.position.z = z;
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  size(); new ResizeObserver(size).observe(canvas);
  let raf = 0, tick = null;
  const loop = (t) => { raf = requestAnimationFrame(loop); pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05; if (tick) tick(t / 1000); renderer.render(scene, camera); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
    if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(canvas);
  return {
    THREE, renderer, scene, camera,
    onTick(f) { tick = f; },
    view(dist) { const h = 2 * Math.tan(camera.fov * Math.PI / 360) * dist; return { w: h * camera.aspect, h }; }
  };
}

/* ---------------- reel ---------------- */
function fillTexture() {
  const c = document.createElement('canvas'); c.width = 1600; c.height = 900;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 1600, 900);
  grd.addColorStop(0, '#5A2A24'); grd.addColorStop(0.45, '#4A1E1A'); grd.addColorStop(1, '#22100C');
  g.fillStyle = grd; g.fillRect(0, 0, 1600, 900);
  g.fillStyle = 'rgba(255,237,215,0.14)';
  for (let y = 12; y < 900; y += 24) for (let x = 12; x < 1600; x += 24) { g.beginPath(); g.arc(x, y, 1.3, 0, 6.2832); g.fill(); }
  // Three rings with the logo's opening, faint, as a placeholder for the video.
  g.strokeStyle = 'rgba(255,237,215,0.35)'; g.lineWidth = 2; g.lineCap = 'round'; g.setLineDash([2, 12]);
  const a0 = -135 * Math.PI / 180 + 15 * Math.PI / 180, a1 = a0 + (330 * Math.PI / 180);
  [220, 168, 116].forEach((r) => { g.beginPath(); g.arc(800, 450, r, a0, a1); g.stroke(); });
  g.setLineDash([]); g.strokeStyle = 'rgba(255,237,215,0.8)'; g.lineWidth = 2;
  g.beginPath(); g.arc(800, 450, 46, 0, 6.2832); g.stroke();
  g.fillStyle = '#FFEDD7'; g.beginPath(); g.moveTo(788, 428); g.lineTo(788, 472); g.lineTo(822, 450); g.closePath(); g.fill();
  return c;
}

function reel(THREE, ST) {
  const sec = document.querySelector('.reel');
  const st = ST.getById('reel');
  if (!sec || !st) return;
  const S = stage(THREE, sec.querySelector('.reel-canvas'), { fov: 35, z: 5 });
  const W = 1.6, H = 0.9;
  const tex = new THREE.CanvasTexture(fillTexture()); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const u = { uTex: { value: tex }, uP: { value: 0 }, uW: { value: W }, uH: { value: H }, uR: { value: 0.045 }, uWave: { value: 0 }, uTime: { value: 0 }, uRound: { value: 0.04 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, transparent: true,
    vertexShader: /* glsl */`
      uniform float uP, uW, uR, uWave, uTime;
      varying vec2 vUv; varying float vShade;
      void main() {
        vUv = uv;
        vec3 p = position;
        float edge = mix(-uW * 0.5, uW * 0.5, uP);   // flat up to here, rolled beyond
        float d = p.x - edge;
        vShade = 1.0;
        if (d > 0.0) {
          float r = uR + d * 0.035;                  // the roll thickens as it wraps
          float a = d / r;
          p.x = edge + r * sin(a);
          p.z = r * (1.0 - cos(a));
          vShade = 0.55 + 0.45 * cos(a);
        }
        p.z += sin(p.x * 4.0 + uTime * 2.0) * uWave + sin(p.y * 5.0 + uTime * 1.5) * uWave * 0.4;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTex; uniform float uRound, uW, uH;
      varying vec2 vUv; varying float vShade;
      float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main() {
        vec2 pp = (vUv - 0.5) * vec2(uW, uH);
        float a = 1.0 - smoothstep(-0.002, 0.002, rbox(pp, vec2(uW, uH) * 0.5, uRound));
        vec3 c = texture2D(uTex, vUv).rgb * vShade;
        if (!gl_FrontFacing) c *= 0.5;
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 220, 20), mat);
  S.scene.add(mesh);
  let last = 0, vel = 0;
  S.onTick((t) => {
    const p = st.progress;
    vel += ((p - last) * 60 - vel) * 0.12; last = p;
    u.uTime.value = t;
    const a = clamp(p / 0.55), b = clamp((p - 0.55) / 0.45);
    u.uP.value = smooth(clamp(p / 0.5));
    u.uWave.value = clamp(Math.abs(vel) * 0.5, 0, 0.07) * (1 - b);
    const v = S.view(5);
    const s0 = (v.w * 0.42) / W, s1 = (v.w * 0.8) / W, s2 = Math.max(v.w / W, v.h / H) * 1.02;
    const sc = p < 0.55 ? lerp(s0, s1, easeOut(a)) : lerp(s1, s2, easeIn(b));
    mesh.scale.setScalar(sc);
    mesh.rotation.set(lerp(0.12, 0, a) + pointer.sy * 0.04 * (1 - b), lerp(-0.4, 0, a) + pointer.sx * 0.06 * (1 - b), lerp(-0.08, 0, a));
    u.uRound.value = lerp(0.04, 0, b);
  });
  sec.classList.add('has-gl');
}

/* ---------------- loops ---------------- */
function loops(THREE, ST) {
  const sec = document.querySelector('.loops');
  const st = ST.getById('loops');
  if (!sec || !st) return;
  const S = stage(THREE, sec.querySelector('.loops-canvas'), { fov: 40, z: 6.4 });
  const N = innerWidth < 900 ? 2600 : 4400;
  const aA = new Float32Array(N * 3), aB = new Float32Array(N * 3), aS = new Float32Array(N * 3), aR = new Float32Array(N);
  const PHI = 1.618034;
  const GAP0 = -135 * Math.PI / 180, GAP = 30 * Math.PI / 180;
  for (let i = 0; i < N; i++) {
    // A: a sphere of nodes (Fibonacci), a few drawn inward for depth.
    const t = (i + 0.5) / N, yy = 1 - 2 * t, rr = Math.sqrt(1 - yy * yy), th = i * 2.399963;
    const rad = 1.75 * (i % 9 === 0 ? 0.55 + Math.random() * 0.3 : 0.94 + Math.random() * 0.1);
    aA.set([Math.cos(th) * rr * rad, yy * rad, Math.sin(th) * rr * rad], i * 3);
    // B: the design board, in a plane: a golden spiral, a grid of thirds, a loop with the opening.
    const k = i % 20; let bx, by;
    if (k < 8) { const q = Math.random() * 3.6 * Math.PI; const r = 0.055 * Math.pow(PHI, q * 2 / Math.PI); bx = Math.cos(q) * r - 0.15; by = Math.sin(q) * r; }
    else if (k < 15) {
      const L = 1.8, line = Math.floor(Math.random() * 8), s = (Math.random() * 2 - 1) * L, f = L / 3;
      const fixed = [-L, -f, f, L][line % 4];
      if (line < 4) { bx = fixed; by = s; } else { bx = s; by = fixed; }
    } else { const a = GAP0 + GAP / 2 + Math.random() * (2 * Math.PI - GAP); bx = Math.cos(a) * 1.8; by = -Math.sin(a) * 1.8; }
    aB.set([bx, by, (Math.random() - 0.5) * 0.06], i * 3);
    // S: scattered, before the sphere forms.
    aS.set([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6], i * 3);
    aR[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aA.slice(), 3));
  geo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
  const u = { uIn: { value: 0 }, uMix: { value: 0 }, uTime: { value: 0 }, uRot: { value: 0 }, uSize: { value: 16 * Math.min(devicePixelRatio || 1, 1.75) } };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aA, aB, aS; attribute float aR;
      uniform float uIn, uMix, uTime, uRot, uSize;
      varying float vA; varying float vHot;
      vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
      float stag(float t, float r) { return smoothstep(0.0, 1.0, clamp(t * 1.6 - r * 0.6, 0.0, 1.0)); }
      void main() {
        float tIn = stag(uIn, aR), tMix = stag(uMix, aR);
        vec3 p = mix(aS, rotY(aA, uRot), tIn);
        p = mix(p, aB, tMix);
        float mid = sin(tMix * 3.14159);
        p += vec3(sin(uTime * 0.7 + aR * 40.0), cos(uTime * 0.6 + aR * 30.0), sin(uTime * 0.5 + aR * 20.0)) * (0.012 + 0.6 * mid);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.55 + aR * 0.8) * (1.0 + mid * 1.2) / -mv.z;
        vA = 0.45 + 0.55 * aR;
        vHot = step(0.93, aR);
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying float vHot;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 c = mix(vec3(1.0, 0.929, 0.843), vec3(0.863, 0.314, 0.0), vHot);
        gl_FragColor = vec4(c, vA * smoothstep(0.5, 0.2, d));
      }`
  }));
  pts.frustumCulled = false;

  // Lines for A: each node joined to its two nearest neighbours.
  const nodes = []; for (let i = 0; i < N && nodes.length < 520; i += Math.floor(N / 520)) nodes.push(i);
  const segA = [];
  nodes.forEach((i) => {
    const best = [[1e9, -1], [1e9, -1]];
    nodes.forEach((j) => {
      if (i === j) return;
      const dx = aA[i * 3] - aA[j * 3], dy = aA[i * 3 + 1] - aA[j * 3 + 1], dz = aA[i * 3 + 2] - aA[j * 3 + 2], d = dx * dx + dy * dy + dz * dz;
      if (d < best[1][0]) { best[1] = [d, j]; best.sort((a, b) => a[0] - b[0]); }
    });
    best.forEach(([, j]) => { if (j >= 0) segA.push(aA[i * 3], aA[i * 3 + 1], aA[i * 3 + 2], aA[j * 3], aA[j * 3 + 1], aA[j * 3 + 2]); });
  });
  const linesA = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(segA, 3)),
    new THREE.LineBasicMaterial({ color: 0xFFEDD7, transparent: true, opacity: 0, depthWrite: false }));
  const groupA = new THREE.Group(); groupA.add(linesA);

  // Lines for B: the grid, the spiral and the loop, drawn.
  const segB = []; const L = 1.8, f = L / 3;
  [-L, -f, f, L].forEach((c) => { segB.push(c, -L, 0, c, L, 0, -L, c, 0, L, c, 0); });
  const poly = (fn, n) => { for (let i = 0; i < n; i++) { const a = fn(i / n), b = fn((i + 1) / n); segB.push(a[0], a[1], 0, b[0], b[1], 0); } };
  poly((t) => { const q = t * 3.6 * Math.PI, r = 0.055 * Math.pow(PHI, q * 2 / Math.PI); return [Math.cos(q) * r - 0.15, Math.sin(q) * r]; }, 220);
  poly((t) => { const a = GAP0 + GAP / 2 + t * (2 * Math.PI - GAP); return [Math.cos(a) * 1.8, -Math.sin(a) * 1.8]; }, 160);
  const linesB = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(segB, 3)),
    new THREE.LineBasicMaterial({ color: 0xDC5000, transparent: true, opacity: 0, depthWrite: false }));

  const root = new THREE.Group(); root.add(groupA, linesB, pts); S.scene.add(root);
  S.onTick((t) => {
    const p = st.progress;
    const inn = smooth(clamp(p / 0.16)), mix = smooth(clamp((p - 0.44) / 0.24));
    u.uTime.value = t; u.uIn.value = inn; u.uMix.value = mix;
    u.uRot.value = t * 0.12 + p * 2.0;
    groupA.rotation.y = u.uRot.value;
    linesA.material.opacity = 0.2 * inn * clamp(1 - mix * 2.5);
    linesB.material.opacity = 0.55 * clamp((mix - 0.7) / 0.3);
    root.rotation.x = pointer.sy * 0.18 + lerp(0, -0.12, mix);
    root.rotation.y = pointer.sx * 0.25;
    // Keep the shapes clear of the text: the AI panel sits bottom left, the design panel bottom right.
    const narrow = innerWidth < 900;
    root.position.set(narrow ? 0 : lerp(1.1, -1.2, mix), narrow ? 0.7 : 0.1, 0);
    root.scale.setScalar(narrow ? 0.72 : lerp(1, 0.86, mix));
  });
  sec.classList.add('has-gl');
}

/* ---------------- portal ---------------- */
function portal(THREE, ST) {
  const sec = document.querySelector('.portal');
  const st = ST.getById('portal');
  if (!sec || !st) return;
  const canvas = sec.querySelector('.portal-canvas');
  const S = stage(THREE, canvas, { fov: 70, z: 0 });
  const RINGS = 120, SEG = innerWidth < 900 ? 72 : 128, LONG = 18, GAPZ = 1.15;
  const verts = RINGS * SEG * 2 + (RINGS - 1) * LONG * 2;
  const ang = new Float32Array(verts), ring = new Float32Array(verts), kind = new Float32Array(verts);
  let v = 0;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SEG; s++) {
    ang[v] = s / SEG * Math.PI * 2; ring[v] = r; v++;
    ang[v] = (s + 1) / SEG * Math.PI * 2; ring[v] = r; v++;
  }
  for (let r = 0; r < RINGS - 1; r++) for (let l = 0; l < LONG; l++) {
    const a = l / LONG * Math.PI * 2;
    ang[v] = a; ring[v] = r; kind[v] = 1; v++;
    ang[v] = a; ring[v] = r + 1; kind[v] = 1; v++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
  geo.setAttribute('aAng', new THREE.BufferAttribute(ang, 1));
  geo.setAttribute('aRing', new THREE.BufferAttribute(ring, 1));
  geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  const u = { uTime: { value: 0 }, uWob: { value: 0.12 }, uFade: { value: 0 }, uGap: { value: GAPZ } };
  const lines = new THREE.LineSegments(geo, new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aAng, aRing, aKind;
      uniform float uTime, uWob, uGap;
      varying float vFog; varying float vHot; varying float vKind;
      vec2 path(float z) { return vec2(sin(z * 0.06) * 2.6 + sin(z * 0.023) * 1.8, cos(z * 0.05) * 1.8); }
      void main() {
        float z = -aRing * uGap;
        float n = sin(aAng * 3.0 + uTime * 0.9 + aRing * 0.31) * 0.5
                + sin(aAng * 5.0 - uTime * 0.7 + aRing * 0.17) * 0.3
                + sin(aAng * 2.0 + aRing * 0.11 + uTime * 0.4) * 0.2;
        float r = 2.4 * (1.0 + n * uWob);
        vec3 p = vec3(path(z) + vec2(cos(aAng), sin(aAng)) * r, z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vFog = smoothstep(70.0, 8.0, dist) * smoothstep(0.3, 2.5, dist);
        vHot = (1.0 - step(0.5, mod(aRing, 9.0))) * (1.0 - aKind);
        vKind = aKind;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uFade;
      varying float vFog; varying float vHot; varying float vKind;
      void main() {
        vec3 c = mix(vec3(1.0, 0.929, 0.843), vec3(0.863, 0.314, 0.0), vHot);
        gl_FragColor = vec4(c, vFog * uFade * mix(0.75, 0.3, vKind));
      }`
  }));
  lines.frustumCulled = false;
  S.scene.add(lines);
  const path = (z) => [Math.sin(z * 0.06) * 2.6 + Math.sin(z * 0.023) * 1.8, Math.cos(z * 0.05) * 1.8];
  const LEN = RINGS * GAPZ - 60;
  let last = 0, vel = 0;
  S.onTick((t) => {
    const p = st.progress;
    vel += ((p - last) * 60 - vel) * 0.1; last = p;
    const fade = smooth(clamp((p - 0.26) / 0.12));
    canvas.style.opacity = fade.toFixed(3);
    u.uFade.value = 1; u.uTime.value = t;
    u.uWob.value = 0.1 + clamp(Math.abs(vel) * 2.5, 0, 0.35);
    const travel = smooth(clamp((p - 0.28) / 0.72));
    const zc = 4 - travel * LEN;
    const c = path(zc), ahead = path(zc - 6);
    S.camera.position.set(c[0] + pointer.sx * 0.5, c[1] - pointer.sy * 0.4, zc);
    S.camera.lookAt(ahead[0], ahead[1], zc - 6);
    S.camera.rotateZ(t * 0.05 + travel * 1.2);
  });
  sec.classList.add('has-gl');
}

export async function start({ ST }) {
  const THREE = await import(THREE_URL);
  for (const make of [reel, loops, portal]) {
    try { make(THREE, ST); } catch (err) { console.warn('[scene]', make.name, err); }
  }
}
