/* human-in-loop.dev: the three.js scenes on the home page. Loaded after first paint by home.js.
   three.js r160 (MIT), from jsdelivr, the same build the AI loop uses.

   reel    A card that unrolls like a carpet, then opens to full screen. Its surface is a fill box
           until the showreel video arrives (swap the CanvasTexture for a VideoTexture).
   loops   One cloud of dots. First it is the AI: a sphere of nodes joined by lines. Then the dots
           scatter, stretch and settle into the design: a golden spiral, a grid, and a loop with the
           logo's opening at eleven o'clock.
   portal  Space: a wormhole that bends the starlight, ringed with fine dotted lines. The logo's human tumbles
           toward it and is gone; then you follow, and the stars become lines.

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

function stage(THREE, canvas, { fov = 35, z = 5, dpr = 1.75 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
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
  // The design board is not flat to the screen: it is turned and tipped, so its lines run at angles.
  const TILT = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.5, 0.55, -0.24, 'YXZ'));
  const tiltArr = (arr) => { const v = new THREE.Vector3(); for (let i = 0; i < arr.length; i += 3) { v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(TILT); arr[i] = v.x; arr[i + 1] = v.y; arr[i + 2] = v.z; } };
  tiltArr(aB);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aA.slice(), 3));
  geo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
  const off = new Float32Array(N * 3), offAttr = new THREE.BufferAttribute(off, 3);
  offAttr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aOff', offAttr);
  const u = { uIn: { value: 0 }, uMix: { value: 0 }, uTime: { value: 0 }, uRot: { value: 0 }, uSize: { value: 16 * Math.min(devicePixelRatio || 1, 1.75) } };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aA, aB, aS, aOff; attribute float aR;
      uniform float uIn, uMix, uTime, uRot, uSize;
      varying float vA; varying float vHot;
      vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
      float stag(float t, float r) { return smoothstep(0.0, 1.0, clamp(t * 1.6 - r * 0.6, 0.0, 1.0)); }
      void main() {
        float tIn = stag(uIn, aR), tMix = stag(uMix, aR);
        vec3 p = mix(aS, rotY(aA, uRot), tIn);
        p = mix(p, aB + aOff, tMix);
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
  tiltArr(segB);
  const segBase = Float32Array.from(segB), segOff = new Float32Array(segB.length);
  const linesB = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(segB, 3)),
    new THREE.LineBasicMaterial({ color: 0xDC5000, transparent: true, opacity: 0, depthWrite: false }));
  const segAttr = linesB.geometry.attributes.position; segAttr.setUsage(THREE.DynamicDrawUsage);

  // The slash: drag the cursor across the design board and it splits along the cursor's path, each side pushed
  // apart, then pulls itself back together. Worked out in the board's own space, on the CPU, only while it is in use.
  const stick = sec.querySelector('.loops-stick'), cv = sec.querySelector('.loops-canvas');
  const ms = { x: 0, y: 0, px: 0, py: 0, on: false, moved: false };
  stick.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    ms.x = ((e.clientX - r.left) / r.width) * 2 - 1; ms.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    if (!ms.on) { ms.px = ms.x; ms.py = ms.y; } ms.on = true; ms.moved = true;
  }, { passive: true });
  stick.addEventListener('pointerleave', () => { ms.on = false; });
  const inv = new THREE.Matrix4(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hA = new THREE.Vector3(), hB = new THREE.Vector3(), vel = new THREE.Vector3(), perp = new THREE.Vector3();
  const nrm = new THREE.Vector3(0, 0, 1).applyMatrix4(TILT).normalize();
  const toLocal = (nx, ny, out) => { ray.setFromCamera({ x: nx, y: ny }, S.camera); return ray.ray.intersectPlane(plane, out) ? out.applyMatrix4(inv) : null; };
  let live = false;
  const cut = (base, offs, n, R) => {
    const ex = hB.x - hA.x, ey = hB.y - hA.y, ez = hB.z - hA.z, el = ex * ex + ey * ey + ez * ez || 1e-9, sp = Math.min(Math.sqrt(el), 0.5);
    for (let i = 0; i < n; i++) {
      const k = i * 3, x = base[k] + offs[k], y = base[k + 1] + offs[k + 1], z = base[k + 2] + offs[k + 2];
      const t = clamp(((x - hA.x) * ex + (y - hA.y) * ey + (z - hA.z) * ez) / el);
      const dx = x - (hA.x + ex * t), dy = y - (hA.y + ey * t), dz = z - (hA.z + ez * t), d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= R) continue;
      const f = (1 - d / R) ** 2, side = Math.sign(dx * perp.x + dy * perp.y + dz * perp.z) || 1;
      offs[k] += vel.x * f * 0.4 + perp.x * side * f * sp * 1.2;
      offs[k + 1] += vel.y * f * 0.4 + perp.y * side * f * sp * 1.2;
      offs[k + 2] += vel.z * f * 0.4 + perp.z * side * f * sp * 1.2;
    }
  };
  function slash(mix) {
    if (ms.on && ms.moved && mix > 0.85) {
      ms.moved = false;
      root.updateMatrixWorld(); inv.copy(root.matrixWorld).invert();
      if (toLocal(ms.px, ms.py, hA) && toLocal(ms.x, ms.y, hB)) {
        vel.subVectors(hB, hA);
        if (vel.lengthSq() > 1e-6) {
          perp.crossVectors(vel, nrm).normalize();
          cut(aB, off, N, 0.5); cut(segBase, segOff, segBase.length / 3, 0.5);
          live = true;
        }
      }
    }
    ms.px = ms.x; ms.py = ms.y;
    if (!live) return;
    let e = 0;
    for (let i = 0; i < off.length; i++) { off[i] *= 0.9; e += Math.abs(off[i]); }
    for (let i = 0; i < segOff.length; i++) { segOff[i] *= 0.9; segAttr.array[i] = segBase[i] + segOff[i]; }
    offAttr.needsUpdate = true; segAttr.needsUpdate = true;
    if (e < 1e-4 * N) { off.fill(0); segOff.fill(0); segAttr.array.set(segBase); live = false; }
  }

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
    slash(mix);
  });
  sec.classList.add('has-gl');
}

/* ---------------- portal: into space ---------------- */
// One full-screen shader. A black sky with three layers of stars and a faint warm nebula. A wormhole at the centre
// bends the light around it (stars near its edge smear into arcs and wobble), rimmed by a bright photon ring and by
// fine dotted rings that stretch into lines when you scroll fast. Inside it, another sky. Scroll on and the hole
// opens to fill the screen, and you rush through: stars become long lines, rings of fine lines fly past.
const SPACE_FRAG = /* glsl */`
  uniform vec2 uRes; uniform float uTime, uP, uVel; uniform vec2 uMouse;
  varying vec2 vUv;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
  vec3 stars(vec2 p, vec2 dir, float stretch, float seed) {
    vec3 c = vec3(0.0);
    for (int L = 0; L < 4; L++) {
      float sc = 14.0 + float(L) * 18.0;
      vec2 g = p * sc + seed * 17.0 + float(L) * 31.7;
      vec2 id = floor(g), f = fract(g) - 0.5;
      float h = hash(id);
      if (h > 0.7) {
        vec2 o = vec2(hash(id + 1.7), hash(id + 9.2)) - 0.5;
        vec2 q = f - o * 0.5;
        float a = dot(q, dir), b = dot(q, vec2(-dir.y, dir.x));
        float d = length(vec2(a / stretch, b));
        float sz = (0.035 + 0.06 * hash(id + 4.1)) * (1.0 - float(L) * 0.2);
        float br = smoothstep(sz, 0.0, d) * (0.35 + 0.65 * hash(id + 6.3));
        br *= 0.7 + 0.3 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
        vec3 tint = mix(vec3(1.0, 0.93, 0.84), mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.62, 0.38), step(0.5, hash(id + 2.2))), 0.4 * hash(id + 8.8));
        c += tint * br;
      }
    }
    return c;
  }
  // A band of the galaxy across the sky. The hole bends it, which is what makes the lensing readable.
  float band(vec2 s) {
    vec2 dir = normalize(vec2(1.0, 0.38));
    float dist = dot(s, vec2(-dir.y, dir.x)) + 0.06 * sin(dot(s, dir) * 3.0);
    return exp(-dist * dist * 10.0) * (0.3 + 0.7 * fbm(s * 3.2 + 2.0));
  }
  vec3 sky(vec2 s, vec2 dir, float stretch, float seed) {
    float b = band(s);
    vec3 c = stars(s, dir, stretch, seed) + stars(s * 1.8 + 3.0, dir, stretch, seed + 1.0) * b * 1.3;
    c += vec3(0.93, 0.87, 0.8) * b * 0.2;
    c += vec3(0.86, 0.38, 0.12) * b * smoothstep(0.55, 0.85, fbm(s * 5.0 + seed)) * 0.22;
    return c;
  }
  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float p = uP;
    vec2 c = uMouse * vec2(0.02, -0.02);
    float approach = smoothstep(0.04, 0.72, p), enter = smoothstep(0.68, 0.8, p), tunnel = smoothstep(0.76, 0.86, p);
    float R = mix(0.03, 0.24, approach * approach);
    R = mix(R, 1.5, enter * enter);
    vec2 d = uv - c; float r = length(d); vec2 rd = d / max(r, 1e-4); float ang = atan(d.y, d.x);
    float wob = 1.0 + 0.04 * sin(ang * 3.0 + uTime * 1.3) + 0.025 * sin(ang * 5.0 - uTime * 0.9 + p * 20.0);
    float Re = R * 1.2 * wob;
    float speed = clamp(abs(uVel) * 0.9, 0.0, 1.0);
    vec3 col;
    if (r > R) {
      vec2 src = uv - rd * (Re * Re / r);                 // light bent round the hole
      vec2 sk = (src - c) / (1.0 + p * 1.6) + c;           // the sky opens out as we fall
      float stretch = 1.0 + speed * 2.5 + smoothstep(R * 2.4, R, r) * 2.5;
      col = sky(sk, normalize(sk - c + 1e-5), min(stretch, 5.0), 0.0);
      col += vec3(1.0, 0.86, 0.72) * 0.55 * smoothstep(R * 1.22, R, r) * smoothstep(R * 0.97, R * 1.03, r);   // photon ring
      for (int k = 0; k < 4; k++) {                        // fine dotted rings: dots that stretch into lines
        float fk = float(k);
        float rk = R * (1.4 + fk * 0.5 + 0.03 * sin(uTime * 0.7 + fk));
        float ring = smoothstep(1.8 / uRes.y, 0.0, abs(r - rk));
        float n2 = 90.0 + fk * 40.0;
        float dir = mod(fk, 2.0) < 1.0 ? 1.0 : -1.0;
        float da = fract(ang / 6.2832 * n2 + uTime * (0.05 + 0.03 * fk) * dir) - 0.5;
        float duty = mix(0.07, 0.46, speed);
        ring *= smoothstep(duty, duty * 0.4, abs(da));
        col += vec3(1.0, 0.93, 0.84) * ring * 0.4 * (1.0 - enter);
      }
    } else {
      vec2 q = d / R; float z = sqrt(max(0.0, 1.0 - dot(q, q)));
      vec2 d2 = q / (z + 0.35) * 1.6;
      float ca = cos(uTime * 0.05), sa = sin(uTime * 0.05);
      d2 = mat2(ca, -sa, sa, ca) * d2;
      // Inside: another sky, seen through a glass ball. Brighter, its galaxy band crossing at another angle.
      col = sky(mat2(0.6, -0.8, 0.8, 0.6) * d2 * 0.5 + 0.4, normalize(d2 + 1e-5), 1.0, 3.0) * 1.6;
      col += vec3(0.86, 0.36, 0.1) * pow(fbm(d2 * 1.4 + uTime * 0.02), 3.0) * 0.5;
      col *= 0.6 + 0.4 * z;
      col += vec3(1.0, 0.9, 0.78) * pow(1.0 - z, 4.0) * 0.6;  // the glassy rim
    }
    if (tunnel > 0.0) {                                     // through: long star lines and rings rushing past
      float lr = log(max(r, 1e-3)), tr = uTime * 0.6 + p * 30.0;
      vec2 tp = vec2(ang / 6.2832 * 48.0, lr * 6.0 - tr);
      vec2 tid = floor(tp), tf = fract(tp) - 0.5;
      float th = hash(tid);
      float streak = step(0.86, th) * smoothstep(0.06, 0.0, abs(tf.x)) * smoothstep(0.5, 0.1, abs(tf.y) * (0.6 + speed));
      vec3 tcol = mix(vec3(1.0, 0.93, 0.84), vec3(1.0, 0.48, 0.2), step(0.95, th)) * streak * smoothstep(0.02, 0.25, r);
      float rr = fract(lr * 2.2 - tr * 0.35);
      tcol += vec3(1.0, 0.9, 0.8) * smoothstep(0.02, 0.0, abs(rr - 0.5)) * 0.25 * (1.0 + 0.5 * sin(ang * 6.0 + uTime)) * smoothstep(0.03, 0.3, r);
      col = mix(col, tcol + col * 0.3, tunnel);
    }
    float done = smoothstep(0.95, 1.0, p);                  // out the other side: quiet space, ready for the contact section
    col = mix(col, stars(uv * 1.2, vec2(1.0, 0.0), 1.0, 7.0) * 0.45, done);
    col *= 1.0 - 0.35 * dot(uv, uv);
    gl_FragColor = vec4(col, 1.0);
  }`;

const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

function portal(THREE, ST, MB) {
  const sec = document.querySelector('.portal');
  const st = ST.getById('portal');
  if (!sec || !st) return;
  const S = stage(THREE, sec.querySelector('.portal-canvas'), { fov: 50, z: 1, dpr: innerWidth < 900 ? 1 : 1.25 });
  const u = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uP: { value: 0 }, uVel: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: SPACE_FRAG
  }));
  quad.frustumCulled = false; S.scene.add(quad);

  // The human, falling: the logo's own figure (MarkBody), tumbling, arms and legs drifting like an astronaut's,
  // drawn with a slight hand-drawn boil. Near the hole he is stretched toward it, then gone.
  const fig = sec.querySelector('.portal-fig'), g = fig.getContext('2d');
  let fw = 0, fh = 0, fdpr = 1;
  const sizeFig = () => { fdpr = Math.min(devicePixelRatio || 1, 2); fw = fig.clientWidth; fh = fig.clientHeight; fig.width = fw * fdpr; fig.height = fh * fdpr; };
  sizeFig(); new ResizeObserver(sizeFig).observe(fig);
  const bez = (a, b, c, d, t) => { const s = 1 - t; return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d; };
  const hsh = (x) => { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); };
  const size = new THREE.Vector2();
  let last = 0, vel = 0, prev = null;
  S.onTick((t) => {
    const p = st.progress;
    vel += ((p - last) * 60 - vel) * 0.08; last = p;
    S.renderer.getSize(size);
    u.uRes.value.set(size.x, size.y); u.uTime.value = t; u.uP.value = p; u.uVel.value = vel * 6; u.uMouse.value.set(pointer.sx, pointer.sy);

    g.setTransform(fdpr, 0, 0, fdpr, 0, 0); g.clearRect(0, 0, fw, fh);
    const f = clamp((p - 0.05) / 0.66);
    if (!MB || f <= 0 || f >= 1) { prev = null; return; }
    const e = f * f * (3 - 2 * f);
    const x = fw * bez(0.2, 0.06, 0.8, 0.5, e) + pointer.sx * 12, y = fh * bez(-0.08, 0.6, 0.12, 0.5, e) + pointer.sy * 8;
    const k = Math.min(fw, fh) * 0.24 * (1 - 0.9 * Math.pow(e, 1.4));
    const toC = Math.atan2(fh / 2 - y, fw / 2 - x), pull = 1 + 2.2 * Math.pow(clamp((e - 0.7) / 0.3), 2);
    const rot = t * 0.3 + e * 5 + Math.sin(t * 0.7) * 0.25;
    const pose = {
      root: { x: 0, y: 0, rot, sx: 1, stretch: [toC, pull], squashHead: true },   // stretched toward the hole
      lean: 0.25 * Math.sin(t * 0.6), bend: 0.7, nod: 0.15 * Math.sin(t * 0.8),
      // Spread out like a floating astronaut: arms wide and drifting, legs apart, knees soft.
      feet: { L: { x: -0.19 + 0.06 * Math.sin(t * 0.9), y: 0.26 }, R: { x: 0.2 + 0.05 * Math.cos(t * 1.2), y: 0.22 + 0.05 * Math.sin(t) } }, knee: { L: 1, R: -1 },
      hands: { F: { x: 0.42 + 0.05 * Math.sin(t * 1.3), y: -0.16 + 0.12 * Math.sin(t * 1.7) }, B: { x: -0.4 + 0.05 * Math.sin(t * 1.1 + 1), y: -0.1 + 0.12 * Math.cos(t * 1.4) } },
      elbow: { F: 1, B: -1 }, round: { F: 0.5, B: 0.5 }
    };
    const ln = MB.body(pose);
    const cam = (px, py) => [x + px * k, y + py * k]; cam.k = k;
    const bf = Math.floor(t * 8);                                   // the boil: lines re-drawn 8 times a second
    const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * 1.1, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * 1.1];
    // Speed lines behind him: dots that stretch into lines the faster he falls.
    if (prev) {
      const dx = x - prev[0], dy = y - prev[1], dl = Math.hypot(dx, dy) || 1, sp = Math.min(60, dl * 6 + Math.abs(vel) * 400);
      if (sp > 2) {
        const ux = -dx / dl, uy = -dy / dl;
        g.strokeStyle = 'rgba(255,237,215,0.45)'; g.lineWidth = 1.2; g.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const o = (i - 3) * k * 0.09, sx = x - uy * o + ux * k * 0.35, sy = y + ux * o + uy * k * 0.35, L = sp * (0.6 + hsh(i + bf) * 0.8);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + ux * L, sy + uy * L); g.stroke();
        }
      }
    }
    prev = [x, y];
    g.globalAlpha = 1 - clamp((e - 0.88) / 0.12);
    MB.draw(g, ln, cam, j, '#FFEDD7');
    g.globalAlpha = 1;
  });
  sec.classList.add('has-gl');
}

export async function start({ ST }) {
  const [THREE] = await Promise.all([
    import(THREE_URL),
    loadScript('/assets/js/figure/mark.js').then(() => loadScript('/assets/js/figure/markbody.js')).catch((e) => console.warn('[scene] figure', e))
  ]);
  const MB = window.MarkBody || null;
  for (const make of [reel, loops, portal]) {
    try { make(THREE, ST, MB); } catch (err) { console.warn('[scene]', make.name, err); }
  }
}
