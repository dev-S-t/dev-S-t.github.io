/* human-in-loop.dev: the three.js scenes on the home page. Loaded after first paint by home.js.
   three.js r160 (MIT), from jsdelivr, the same build the AI loop uses.

   reel    A card that unrolls like a carpet, then opens to full screen. Its surface is a fill box
           until the showreel video arrives (swap the CanvasTexture for a VideoTexture).
   loops   One cloud of dots. First it is the AI: a sphere of nodes joined by lines. Then the dots
           scatter, stretch and settle into the design: a golden spiral, a grid, and a loop with the
           logo's opening at eleven o'clock.
   portal  A real 3D fall, igloo-style: a glowing stone ring with a membrane of fine crackling lines and three
           open rings inside; a tunnel of brush-stroke rings; a flash and a flip; then the logo's human glides
           toward us down a corridor of line arches and breaks the glass between us.
   contact The human arrives: four seconds falling in, three coming toward us, then a wave.

   Each scene reads the progress of the pinned ScrollTrigger home.js made for it, and only renders
   while its canvas is on screen. */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;

const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
// The shared clock: GSAP's ticker (set in start). Drawing on it keeps every canvas in step with the smoothed scroll.
let TICK = null;
const onClock = (fn, on) => {
  if (TICK) { if (on) TICK.add(fn); else TICK.remove(fn); return; }
  if (on) { const run = (ms) => { fn.raf = requestAnimationFrame(run); fn(ms / 1000); }; fn.raf = requestAnimationFrame(run); } else cancelAnimationFrame(fn.raf);
};
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
  let on = false, tick = null;
  const frame = (t) => { pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05; if (tick) tick(t); renderer.render(scene, camera); };
  new IntersectionObserver(([e]) => { if (e.isIntersecting !== on) { on = e.isIntersecting; onClock(frame, on); } }).observe(canvas);
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

/* ---------------- the figure: poses for the logo's own body ---------------- */
// MarkBody units: one unit is his height, y down, the pelvis at 0,0. Shape is never redrawn; only posed.
const TAU = Math.PI * 2;
const hsh = (x) => { const v = Math.sin(x * 127.1) * 43758.5453; return v - Math.floor(v); };
// Falling, spread out like a floating astronaut: arms wide and drifting, legs apart, knees soft.
const fallPose = (t, rot) => ({
  root: { x: 0, y: 0, rot, sx: 1 }, lean: 0.25 * Math.sin(t * 0.6), bend: 0.7, nod: 0.15 * Math.sin(t * 0.8),
  feet: { L: { x: -0.19 + 0.06 * Math.sin(t * 0.9), y: 0.26 }, R: { x: 0.2 + 0.05 * Math.cos(t * 1.2), y: 0.22 + 0.05 * Math.sin(t) } }, knee: { L: 1, R: -1 },
  hands: { F: { x: 0.42 + 0.05 * Math.sin(t * 1.3), y: -0.16 + 0.12 * Math.sin(t * 1.7) }, B: { x: -0.4 + 0.05 * Math.sin(t * 1.1 + 1), y: -0.1 + 0.12 * Math.cos(t * 1.4) } },
  elbow: { F: 1, B: -1 }, round: { F: 0.5, B: 0.5 }
});
// Upright, facing us; wave (0..1) raises the front hand and swings it.
const standPose = (t, wave) => ({
  root: { x: 0, y: 0, rot: 0, sx: 1 }, lean: 0.04 * Math.sin(t * 0.9), bend: 0.8, nod: 0.05 * Math.sin(t * 1.3),
  feet: { L: { x: -0.09, y: 0.33 }, R: { x: 0.1, y: 0.33 } }, knee: { L: 1, R: -1 },
  hands: { F: { x: 0.2 + 0.09 * Math.sin(t * 7) * wave, y: -0.05 - 0.47 * wave }, B: { x: -0.21, y: -0.02 - 0.06 * wave } },
  elbow: { F: 1, B: -1 }, round: { F: 0.3, B: 0.5 }
});
const mixPose = (a, b, u) => {
  const o = {};
  for (const k in b) {
    const A = a[k], B = b[k];
    if (typeof A === 'number' && typeof B === 'number') o[k] = A + (B - A) * u;
    else if (A && B && typeof A === 'object' && typeof B === 'object') o[k] = mixPose(A, B, u);
    else o[k] = u < 0.5 && A !== undefined ? A : B;
  }
  return o;
};
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// Gliding: arms out wide, legs trailing, facing us.
const glidePose = (t) => ({
  root: { x: 0, y: 0, rot: 0.08 * Math.sin(t * 0.9), sx: 1 }, lean: 0.05, bend: 0.75, nod: 0.06 * Math.sin(t * 1.2),
  feet: { L: { x: -0.13, y: 0.3 }, R: { x: 0.15, y: 0.27 } }, knee: { L: 1, R: -1 },
  hands: { F: { x: 0.44, y: -0.3 + 0.05 * Math.sin(t * 2.0) }, B: { x: -0.44, y: -0.28 + 0.05 * Math.cos(t * 2.0) } },
  elbow: { F: 1, B: -1 }, round: { F: 0.5, B: 0.5 }
});
// Floating as he falls: arms raised evenly, legs a little apart. Clean enough to read at any size and angle;
// s is driven by the scroll, so he only moves when you do.
const floatPose = (s, rot) => ({
  root: { x: 0, y: 0, rot, sx: 1 }, lean: 0.06 * Math.sin(s * 0.7), bend: 0.75, nod: 0.08 * Math.sin(s * 0.9),
  feet: { L: { x: -0.1 + 0.03 * Math.sin(s), y: 0.31 }, R: { x: 0.12 + 0.03 * Math.cos(s * 1.1), y: 0.29 } }, knee: { L: 1, R: -1 },
  hands: { F: { x: 0.27 + 0.03 * Math.sin(s * 1.3), y: -0.5 + 0.03 * Math.sin(s * 1.7) }, B: { x: -0.27 + 0.03 * Math.sin(s * 1.2 + 1), y: -0.48 + 0.03 * Math.cos(s * 1.5) } },
  elbow: { F: 1, B: -1 }, round: { F: 0.4, B: 0.4 }
});
// The jump: a crouch to spring from, the leap itself (straight, arms up), and the same crouch to land in.
const crouchPose = (rot = 0) => ({
  root: { x: 0, y: 0, rot, sx: 1 }, lean: 0.35, bend: 0.8, nod: 0.2,
  feet: { L: { x: -0.14, y: 0.2 }, R: { x: 0.12, y: 0.21 } }, knee: { L: 1, R: 1 },
  hands: { F: { x: 0.18, y: 0.06 }, B: { x: -0.24, y: 0.02 } }, elbow: { F: 1, B: -1 }, round: { F: 0.3, B: 0.3 }
});
const leapPose = (rot = 0) => ({
  root: { x: 0, y: 0, rot, sx: 1 }, lean: -0.05, bend: 0.6, nod: -0.1,
  feet: { L: { x: -0.05, y: 0.33 }, R: { x: 0.06, y: 0.33 } }, knee: { L: 1, R: 1 },
  hands: { F: { x: 0.14, y: -0.6 }, B: { x: -0.14, y: -0.58 } }, elbow: { F: 1, B: -1 }, round: { F: 0.2, B: 0.2 }
});
// Where the 3D figure is on screen (px), so the 2D figure can take over from exactly there.
const HAND = { x: 0, y: 0, k: 0, cx: 0, cy: 0 };
// The fall's scroll, mapped to the scene's own timeline. Near the core (scene 0.55 to 0.70) it takes about one and a
// half times as much scrolling to move as far: the screen moves slower under the wheel, as if the hole held on, but it
// stops the moment you stop.
const WARP = [[0, 0], [0.36, 0.42], [0.5, 0.55], [0.74, 0.7], [1, 1]];
const scenePos = (r) => { for (let i = 1; i < WARP.length; i++) { const [a0, b0] = WARP[i - 1], [a1, b1] = WARP[i]; if (r <= a1) return b0 + (b1 - b0) * clamp((r - a0) / (a1 - a0)); } return 1; };   // cx, cy: the portal's centre on screen
// Draw a pose with the films' hand-drawn boil: the lines re-drawn 8 times a second.
function drawFig(MB, g, pose, x, y, k, t, color) {
  const ln = MB.body(pose);
  const cam = (px, py) => [x + px * k, y + py * k]; cam.k = k;
  const bf = Math.floor(t * 8), jit = Math.max(0.6, k * 0.006);
  const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * jit, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * jit];
  MB.draw(g, ln, cam, j, color);
}

const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

/* ---------------- portal: the fall, igloo-style ---------------- */
// The camera falls through a 3D world, scrubbed by the scroll, the logo's human just ahead of it:
//   approach  dark space, dust and stars; a portal ahead: a heavy glowing ring of stone, a membrane of fine
//             crackling lines across it (dots joined into lines), and three open rings floating inside, each with
//             the loop's opening at eleven o'clock. He is dragged toward it and into it.
//   through   the membrane ripples and we pass it; a tunnel of soft brush-stroke rings rushes past toward a bright core.
//   flip      a white flash, and the world turns over.
//   glide     a warm corridor of line arches; he glides out of the light toward us as we scroll, larger and larger,
//             and hits the pane of glass between us. It shatters toward us and he jumps through, into the contact section.
const RR = 9;                                  // the portal ring's radius
const Z_CAM0 = 95, Z_CAM1 = 3;                 // approach
const TUN_N = 46, TUN_GAP = 3.2, TUN_Z0 = -4;  // tunnel rings
const TUN_END = TUN_Z0 - TUN_N * TUN_GAP;
const ROOM_Z = -600;                           // the corridor lives elsewhere; we arrive there in the flash

const GLSL_NOISE = /* glsl */`
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 hash2(vec2 p) { return vec2(hash(p), hash(p + 17.31)); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`;
// Stone: lit from the front and above, grooved into blocks (lines), with a bright glow on its inner face.
const stoneMat = (THREE, u, inner) => new THREE.ShaderMaterial({
  uniforms: u, transparent: true,
  vertexShader: /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
    void main() { vUv = uv; vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: GLSL_NOISE + /* glsl */`
    uniform float uTime, uGlow, uFade; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
    void main() {
      vec3 n = normalize(vN), v = normalize(vV), l = normalize(vec3(0.3, 0.6, 0.8));
      float tex = fbm(vUv * vec2(40.0, 6.0)) * 0.5 + fbm(vUv * vec2(160.0, 20.0)) * 0.25;
      float groove = smoothstep(0.012, 0.0, abs(fract(vUv.x * ${inner ? '1.0' : '12.0'}) - 0.5) - 0.488);   // block joints
      vec3 base = mix(vec3(0.23, 0.2, 0.19), vec3(0.62, 0.57, 0.52), tex);
      float dif = max(dot(n, l), 0.0) * 0.8 + 0.2;
      float spec = pow(max(dot(reflect(-l, n), v), 0.0), 24.0) * 0.5;
      float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      vec3 col = base * dif + spec + vec3(1.0, 0.92, 0.82) * fres * 0.35;
      col *= 1.0 - groove * 0.6;
      float r = length(vP.xy);
      float glow = ${inner ? '0.0' : 'smoothstep(' + (RR + 0.4).toFixed(1) + ', ' + (RR - 1.4).toFixed(1) + ', r)'};
      col += vec3(1.0, 0.86, 0.68) * glow * uGlow * (0.8 + 0.2 * sin(uTime * 2.0 + vUv.x * 30.0));
      gl_FragColor = vec4(col, uFade);
    }`
});

function portal(THREE, ST, MB) {
  const sec = document.querySelector('.portal');
  const st = ST.getById('portal');
  if (!sec || !st) return;
  const canvas = sec.querySelector('.portal-canvas'), flashEl = sec.querySelector('.portal-flash');
  const narrow = innerWidth < 900;
  const S = stage(THREE, canvas, { fov: 55, z: Z_CAM0, dpr: narrow ? 1 : 1.25 });
  const { scene, camera, renderer } = S;
  camera.far = 1500; camera.updateProjectionMatrix();
  scene.fog = new THREE.FogExp2(0x050403, 0.012);
  renderer.setClearColor(0x050403, 1);

  // Stars and dust.
  const NS = narrow ? 2500 : 5000, sp = new Float32Array(NS * 3), ss = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { const a = Math.random() * TAU, r = 14 + Math.pow(Math.random(), 0.6) * 260; sp.set([Math.cos(a) * r, Math.sin(a) * r, -260 + Math.random() * 380], i * 3); ss[i] = Math.random(); }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sGeo.setAttribute('aS', new THREE.BufferAttribute(ss, 1));
  const sU = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } };
  const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: sU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aS; uniform float uTime, uPR; varying float vA; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp((0.6 + aS * 2.2) * uPR * 60.0 / -mv.z, 1.0, 6.0); vA = (0.5 + 0.5 * sin(uTime * (1.0 + aS * 3.0) + aS * 40.0)) * smoothstep(300.0, 20.0, -mv.z); }',
    fragmentShader: 'varying float vA; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 0.93, 0.84, vA * smoothstep(0.5, 0.0, d)); }'
  }));
  stars.frustumCulled = false; scene.add(stars);

  // The portal: the ring, the membrane, the floating open rings, a halo of light.
  const portalG = new THREE.Group(); scene.add(portalG);
  const ringU = { uTime: { value: 0 }, uGlow: { value: 1 }, uFade: { value: 1 } };
  portalG.add(new THREE.Mesh(new THREE.TorusGeometry(RR, 1.7, 48, 220), stoneMat(THREE, ringU, false)));
  const inU = { uTime: { value: 0 }, uGlow: { value: 0 }, uFade: { value: 1 } };
  const GAP = 30 * Math.PI / 180;
  [4.6, 3.3, 2.0].forEach((r, i) => {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.34 - i * 0.04, 24, 120, TAU - GAP), stoneMat(THREE, inU, true));
    arc.rotation.z = (-135 + 15) * Math.PI / 180 + GAP; // the opening sits at eleven o'clock
    arc.position.z = -0.6 - i * 0.5; arc.userData.k = i; portalG.add(arc);
  });
  const memU = { uTime: { value: 0 }, uRip: { value: 0 }, uOn: { value: 1 } };
  const membrane = new THREE.Mesh(new THREE.CircleGeometry(RR - 0.9, 160), new THREE.ShaderMaterial({
    uniforms: memU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uRip, uTime; varying vec2 vP; void main() { vP = position.xy; vec3 p = position; float r = length(p.xy); p.z += sin(r * 1.6 - uTime * 6.0) * uRip * (1.0 - r / 8.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uOn; varying vec2 vP;
      // Voronoi edges: fine lines where cells meet, drifting, like igloo's crackle.
      float cells(vec2 p) {
        vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 g = vec2(float(x), float(y)), o = hash2(i + g); o = 0.5 + 0.45 * sin(uTime * 0.6 + 6.2831 * o);
          float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
        return d2 - d1;
      }
      void main() {
        float r = length(vP) / ${(RR - 0.9).toFixed(2)};
        float e1 = smoothstep(0.06, 0.0, cells(vP * 1.1)), e2 = smoothstep(0.05, 0.0, cells(vP * 2.7 + 4.0));
        float web = (e1 * 0.8 + e2 * 0.45) * smoothstep(0.15, 0.95, r);      // denser toward the rim
        float haze = 0.08 + 0.18 * smoothstep(0.4, 1.0, r) + 0.06 * fbm(vP * 0.6 + uTime * 0.1);
        vec3 col = vec3(1.0, 0.9, 0.78) * web * 0.9 + vec3(0.95, 0.88, 0.8) * haze;
        gl_FragColor = vec4(col, (web * 0.9 + haze) * uOn);
      }`
  }));
  portalG.add(membrane);
  const halo = (size, color, strength, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShaderMaterial({
      uniforms: { uS: { value: strength } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uS; varying vec2 vUv; void main() { float d = length(vUv - 0.5) * 2.0; float ring = exp(-pow((d - 0.42) * 7.0, 2.0)); gl_FragColor = vec4(vec3(${color}), (ring * 0.9 + exp(-d * 4.0) * 0.25) * uS); }`
    }));
    m.position.z = z; return m;
  };
  const halo1 = halo(RR * 4.6, '1.0, 0.92, 0.8', 0.9, 0.2); portalG.add(halo1);
  const haloU = halo1.material.uniforms.uS;
  // dust round the portal, drifting
  const ND = narrow ? 500 : 1000, dp = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) dp.set([(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 34, (Math.random() - 0.5) * 30 + 6], i * 3);
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dp, 3)),
    new THREE.PointsMaterial({ color: 0xFFEDD7, size: 0.08, transparent: true, opacity: 0.5, depthWrite: false }));
  portalG.add(dust);

  // The tunnel: soft brush-stroke rings, broken into arcs, rushing toward a bright core.
  const tunnel = new THREE.Group(); scene.add(tunnel);
  const tU = { uTime: { value: 0 }, uOn: { value: 0 } };
  const brush = new THREE.ShaderMaterial({
    uniforms: tU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP; varying float vZ; void main() { vP = position.xy; vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uOn; varying vec2 vP; varying float vZ;
      void main() {
        float a = atan(vP.y, vP.x), r = length(vP);
        // A brush stroke round the ring: bristle streaks run along it (stretched in angle, fine across it),
        // its edges ragged and soft, broken by a few gaps where the brush lifted.
        // Everything is sampled round the circle (cos, sin), so the stroke has no seam where the angle wraps.
        vec2 cs = vec2(cos(a), sin(a));
        float ua = a * 3.0 / 6.2832;
        float bristle = fbm(cs * 2.2 + vec2(r * 9.0, 0.0)) * 0.6 + fbm(cs * 5.0 + vec2(0.0, r * 26.0)) * 0.4;
        float rag = (fbm(cs * 3.0 + 7.0) - 0.5) * 0.6;
        float edge = smoothstep(0.0, 0.7, r - 3.0 - rag) * smoothstep(0.0, 0.7, 4.4 + rag - r);
        float lift = mix(0.25, 1.0, smoothstep(0.02, 0.24, abs(fract(ua + 0.13) - 0.5)));   // the brush thins rather than stops
        float alpha = edge * lift * (0.3 + 0.7 * smoothstep(0.25, 0.8, bristle)) * smoothstep(90.0, 10.0, vZ) * smoothstep(0.5, 4.0, vZ) * 0.6;
        vec3 col = mix(vec3(0.36, 0.33, 0.33), vec3(1.0, 0.95, 0.9), bristle);
        gl_FragColor = vec4(col, alpha * uOn);
      }`
  });
  const ringGeo = new THREE.RingGeometry(3.0, 4.4, 128, 4);
  for (let i = 0; i < TUN_N; i++) { const m = new THREE.Mesh(ringGeo, brush); m.position.z = TUN_Z0 - i * TUN_GAP; m.rotation.z = i * 0.7; m.userData.spin = (i % 2 ? 1 : -1) * 0.15; tunnel.add(m); }
  const coreU = { uS: { value: 0 } };
  const core = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
    uniforms: coreU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uS; varying vec2 vUv; void main() { float d = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(1.0, 0.97, 0.92, (exp(-d * 6.0) + exp(-d * 18.0)) * uS); }'
  }));
  core.position.z = TUN_END - 12; tunnel.add(core);

  // After the flip: a warm sky with a low sun, over a sea of ridge lines rolling toward us. He glides over it.
  const room = new THREE.Group(); room.position.z = ROOM_Z; scene.add(room);
  const ROWS = narrow ? 56 : 90, COLS = 180, ROW_GAP = 2.2;
  const nv = ROWS * (COLS - 1) * 2, ax = new Float32Array(nv), arow = new Float32Array(nv);
  let q = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) { ax[q] = c / (COLS - 1); arow[q++] = r; ax[q] = (c + 1) / (COLS - 1); arow[q++] = r; }
  const seaGeo = new THREE.BufferGeometry();
  seaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  seaGeo.setAttribute('aX', new THREE.BufferAttribute(ax, 1)); seaGeo.setAttribute('aRow', new THREE.BufferAttribute(arow, 1));
  const seaU = { uTime: { value: 0 }, uFlow: { value: 0 } };
  const sea = new THREE.LineSegments(seaGeo, new THREE.ShaderMaterial({
    uniforms: seaU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: GLSL_NOISE + `
      attribute float aX, aRow; uniform float uTime, uFlow; varying float vA; varying float vD; varying float vH;
      void main() {
        float x = mix(-80.0, 80.0, aX), z = -6.0 - aRow * ${ROW_GAP.toFixed(1)};
        float side = smoothstep(3.0, 26.0, abs(x));                       // a clear way down the middle, ridges rising either side
        float h = fbm(vec2(x * 0.05, (z - uFlow) * 0.05)) * 1.6 + fbm(vec2(x * 0.17, (z - uFlow) * 0.17)) * 0.4;
        float y = -7.5 + h * (1.5 + 9.0 * side);
        vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
        vD = -mv.z; vH = h;
        vA = smoothstep(${(ROWS * ROW_GAP).toFixed(1)}, 25.0, vD) * smoothstep(1.0, 8.0, vD);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; varying float vD; varying float vH;
      void main() {
        vec3 near = vec3(1.0, 0.93, 0.84), far = vec3(0.98, 0.45, 0.16);
        gl_FragColor = vec4(mix(near, far, smoothstep(30.0, 160.0, vD)) * (0.7 + 0.5 * vH), vA * 0.75);
      }`
  }));
  sea.frustumCulled = false; room.add(sea);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(900, 420), new THREE.ShaderMaterial({
    depthWrite: false, fog: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float y = vUv.y;
        vec3 top = vec3(0.1, 0.035, 0.03), mid = vec3(0.29, 0.12, 0.1), low = vec3(0.86, 0.36, 0.12);
        vec3 c = mix(low, mid, smoothstep(0.42, 0.56, y)); c = mix(c, top, smoothstep(0.56, 0.95, y));
        vec2 sp = (vUv - vec2(0.5, 0.47)) * vec2(2.14, 1.0);
        float d = length(sp);
        c += vec3(1.0, 0.9, 0.75) * (smoothstep(0.075, 0.068, d) * 0.9 + exp(-d * 9.0) * 0.6);   // the sun, low on the horizon
        gl_FragColor = vec4(c, 1.0);
      }`
  }));
  sky.position.set(0, 20, -260); room.add(sky);
  // the glass, a little in front of the camera, made of triangles that fly at us when it breaks
  const GW = 7.5, GH = 5, GX = 9, GY = 6, grid = [];
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const edge = i === 0 || j === 0 || i === GX || j === GY;
    grid.push([(i + (edge ? 0 : (Math.random() - 0.5) * 0.7)) / GX * GW - GW / 2, (j + (edge ? 0 : (Math.random() - 0.5) * 0.7)) / GY * GH - GH / 2]);
  }
  const gP = [], gC = [], gR = [], lP = [], lC = [], lR = [];
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    const a = grid[j * (GX + 1) + i], b = grid[j * (GX + 1) + i + 1], c = grid[(j + 1) * (GX + 1) + i], d = grid[(j + 1) * (GX + 1) + i + 1];
    for (const tri of [[a, b, d], [a, d, c]]) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, rr = Math.random();
      tri.forEach((q) => { gP.push(q[0], q[1], 0); gC.push(cx, cy, 0); gR.push(rr); });
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n]) => [tri[m], tri[n]].forEach((q) => { lP.push(q[0], q[1], 0); lC.push(cx, cy, 0); lR.push(rr); }));
    }
  }
  const gU = { uB: { value: 0 } };
  const shardVert = /* glsl */`
    attribute vec3 aC; attribute float aR; uniform float uB; varying float vR;
    vec3 rot(vec3 p, vec3 ax, float a) { ax = normalize(ax); return p * cos(a) + cross(ax, p) * sin(a) + ax * dot(ax, p) * (1.0 - cos(a)); }
    void main() {
      vec3 local = rot(position - aC, vec3(aR, 1.0 - aR, 0.5), aR * uB * 9.0);
      vec3 p = aC + local + vec3(aC.xy * uB * (1.2 + aR * 1.6), uB * (3.0 + aR * 9.0)) + vec3(0.0, -uB * uB * 3.0, 0.0);
      vR = aR; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`;
  const mk = (pos, cen, rnd) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cen, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(rnd, 1)); return g; };
  const glass = new THREE.Group();
  glass.add(new THREE.Mesh(mk(gP, gC, gR), new THREE.ShaderMaterial({ uniforms: gU, vertexShader: shardVert, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    fragmentShader: 'uniform float uB; varying float vR; void main() { gl_FragColor = vec4(1.0, 0.96, 0.92, (0.04 + 0.14 * vR) * smoothstep(0.0, 0.02, uB)); }' })));
  glass.add(new THREE.LineSegments(mk(lP, lC, lR), new THREE.ShaderMaterial({ uniforms: gU, vertexShader: shardVert, transparent: true, depthWrite: false, fog: false,
    fragmentShader: 'uniform float uB; varying float vR; void main() { gl_FragColor = vec4(1.0, 0.96, 0.92, 0.9 * smoothstep(0.0, 0.03, uB)); }' })));
  glass.position.z = -3.2; room.add(glass);

  // The human, on a card that always faces us.
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const fx2 = fc.getContext('2d');
  const figTex = new THREE.CanvasTexture(fc); figTex.colorSpace = THREE.SRGBColorSpace;
  const fig = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: figTex, transparent: true, depthWrite: false, fog: false }));
  scene.add(fig);
  // Falling, but readable: his tumble is a sway, not a spin, and his arms are up.
  const sinkPose = (t, sway) => {
    const p = fallPose(t, sway);
    p.hands = { F: { x: 0.28 + 0.06 * Math.sin(t * 1.4), y: -0.48 + 0.06 * Math.sin(t * 1.9) }, B: { x: -0.28 + 0.06 * Math.sin(t * 1.2 + 1), y: -0.46 + 0.06 * Math.cos(t * 1.6) } };
    return p;
  };

  const v3 = new THREE.Vector3(), fwd = new THREE.Vector3();
  let lastP = 0, vel = 0, flipRoll = 0;
  S.onTick((t) => {
    const p = scenePos(st.progress);
    vel += ((p - lastP) * 60 - vel) * 0.08; lastP = p;
    ringU.uTime.value = inU.uTime.value = memU.uTime.value = tU.uTime.value = sU.uTime.value = t;

    // phases
    const a = clamp(p / 0.42), b = clamp((p - 0.42) / 0.28), flash = Math.exp(-Math.pow((p - 0.72) / 0.014, 2));
    const glide = clamp((p - 0.75) / 0.17), brk = smooth(clamp((p - 0.915) / 0.06)), after = p >= 0.72;
    const crack = Math.exp(-Math.pow((p - 0.918) / 0.006, 2));
    // a soft veil of light as we cross the portal's membrane, a full flash at the flip, a crack at the glass
    const crossing = p < 0.6 ? Math.exp(-Math.pow((camera.position.z - 0.5) / 2.2, 2)) * 0.55 : 0;
    flashEl.style.opacity = Math.min(1, flash * 1.15 + crack * 0.6 + crossing).toFixed(3);

    // camera
    if (!after) {
      // through the tunnel the camera slows as the core nears (ease-out): more scroll for less ground, a pull to fight
      const z = p < 0.42 ? lerp(Z_CAM0, Z_CAM1, 1 - Math.pow(1 - a, 2.4)) : lerp(Z_CAM1, TUN_END + 6, 1 - Math.pow(1 - b, 2.4));
      const shake = Math.pow(b, 3) * 0.12;
      camera.position.set(pointer.sx * 1.2 + Math.sin(t * 31) * shake, -pointer.sy * 0.8 + Math.cos(t * 27) * shake, z);
      camera.lookAt(0, 0, z - 10);
      camera.rotateZ((p < 0.42 ? 0 : b * 1.6) + Math.sin(t * 0.3) * 0.02);
      flipRoll = 0;
    } else {
      // the flip: the world turns over in the flash, then settles; we stand in the corridor looking down it
      flipRoll = Math.PI * (1 - smooth(clamp((p - 0.72) / 0.03)));
      camera.position.set(pointer.sx * 0.5, -pointer.sy * 0.35, ROOM_Z + 2 + brk * 1.5);
      camera.lookAt(0, 0, ROOM_Z - 20);
      camera.rotateZ(flipRoll);
    }
    camera.updateMatrixWorld();
    if (!after) { const c0 = new THREE.Vector3(0, 0, 0).project(camera); HAND.cx = (c0.x * 0.5 + 0.5) * canvas.clientWidth; HAND.cy = (-c0.y * 0.5 + 0.5) * canvas.clientHeight; }

    // what is on
    // the portal fades as we pass through it, the tunnel fades in under it: no hard cut
    const cross = clamp((camera.position.z + 1.5) / 7);
    portalG.visible = !after && cross > 0;
    ringU.uFade.value = inU.uFade.value = cross; haloU.value = 0.9 * cross; dust.material.opacity = 0.5 * cross;
    memU.uRip.value = Math.exp(-Math.pow((camera.position.z - 0.5) / 2.0, 2)) * 1.2;
    memU.uOn.value = clamp((camera.position.z - 0.2) / 3) * cross;
    ringU.uGlow.value = 0.8 + 0.4 * a;
    portalG.children.forEach((c) => { if (c.userData.k !== undefined) c.rotation.z += 0.0025 * (c.userData.k % 2 ? -1 : 1) * (1 + c.userData.k); });
    tunnel.visible = !after;
    tU.uOn.value = clamp((5 - camera.position.z) / 8);
    tunnel.children.forEach((c) => { if (c.userData.spin) c.rotation.z += c.userData.spin * 0.016 * (1 + Math.abs(vel) * 20); });
    coreU.uS.value = clamp((p - 0.5) / 0.2) * 1.4;
    room.visible = after; gU.uB.value = brk;
    seaU.uTime.value = t; seaU.uFlow.value = t * 3 + glide * 90;
    scene.fog.density = after ? 0.004 : 0.012;
    renderer.setClearColor(after ? 0x1a0a08 : 0x050403, 1);

    // the human
    let pose, pos, scale = 1;
    if (!after) {
      camera.getWorldDirection(fwd);
      // In the tunnel he falls ahead of us; every movement here comes from the scroll (s), none from the clock.
      const sc = p * 60;
      pos = v3.copy(camera.position).addScaledVector(fwd, 7).add(new THREE.Vector3(Math.sin(sc * 0.5) * 0.6, Math.cos(sc * 0.4) * 0.4, 0));
      pose = floatPose(sc, 0.4 * Math.sin(sc * 0.7) + b * 2.5);
    } else {
      // out of the light, gliding toward us as we scroll; through the glass and past us
      const z = lerp(ROOM_Z - 46, ROOM_Z - 3.6, 1 - Math.pow(1 - glide, 1.6)) + brk * 6;   // quickly out of the light, then slowing as he reaches the glass
      const sc = p * 60;
      pos = v3.set(Math.sin(sc * 0.5) * 0.4 * (1 - glide), -0.2 + Math.sin(sc * 1.1) * 0.15 - brk * 1.5, z);
      pose = glidePose(sc);
    }
    fig.position.copy(pos); fig.scale.setScalar(scale);
    fig.quaternion.copy(camera.quaternion);
    // from 0.93 the 2D figure (arrival) carries him on, at the same place and size, into the contact section
    fig.visible = !!MB && p > 0.42 && p < 0.93 && !(p > 0.715 && p < 0.745);   // before 0.42 he is the 2D spiral (arrival)
    if (fig.visible) {
      fx2.clearRect(0, 0, 512, 512);
      // a soft dark halo, so he reads against the bright light of the corridor as well as against dark space
      fx2.shadowColor = 'rgba(16, 9, 4, 0.85)'; fx2.shadowBlur = after ? 14 : 6;
      drawFig(MB, fx2, pose, 256, 280, 175, t, '#FFEDD7');
      fx2.shadowBlur = 0; figTex.needsUpdate = true;
      // where he is on screen, and how big
      const pr = fig.position.clone().project(camera), d = camera.position.distanceTo(fig.position), hpx = canvas.clientHeight;
      const kpx = (175 * 3 / 512) * fig.scale.x * hpx / (2 * Math.tan(camera.fov * Math.PI / 360) * d);
      HAND.x = (pr.x * 0.5 + 0.5) * canvas.clientWidth; HAND.y = (-pr.y * 0.5 + 0.5) * hpx + kpx * (24 / 175); HAND.k = kpx;
    }

  });
  sec.classList.add('has-gl');
}

/* ---------------- arrival: the spiral in, and the jump out ---------------- */
// One layer fixed over the page (the hand-over canvas) and the contact section's own canvas, behind its words.
//   the spiral  (scene 0 to 0.42) he arrives from the walker, stretches up to his real size and falls round and in
//               toward the portal's centre, leaning into the turns, spinning only as he is drawn in.
//   the jump    (scene 0.93 to 1) after the glass breaks he crouches and leaps, up and out of the top of the screen.
//   the landing as the contact section arrives he drops in from above, behind its words, lands in a crouch, stands
//               and waves. All of it moves with the scroll; only the wave keeps time on its own.
const mixHex = (a, b, u) => { const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16)); return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',') + ')'; };
function arrival(MB, ST) {
  const pst = ST.getById('portal'), cta = document.querySelector('.cta'), ccv = cta && cta.querySelector('.cta-fig'), portalEl = document.querySelector('.portal');
  if (!MB || !pst || !cta || !ccv) return;
  const ov = document.createElement('canvas'); ov.className = 'hand-fig'; ov.setAttribute('aria-hidden', 'true'); document.body.appendChild(ov);
  const og = ov.getContext('2d'), cg = ccv.getContext('2d');
  let dpr = 1, w = 0, h = 0, cw = 0, ch = 0;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; ov.width = w * dpr; ov.height = h * dpr; cw = ccv.clientWidth; ch = ccv.clientHeight; ccv.width = cw * dpr; ccv.height = ch * dpr; };
  size(); addEventListener('resize', size);
  let from = null;
  const draw = (g, pose, x, y, k, t, color, halo) => {
    if (halo) { g.shadowColor = 'rgba(16, 9, 4, 0.8)'; g.shadowBlur = 10; }
    drawFig(MB, g, pose, x, y, k, t, color);
    g.shadowBlur = 0;
  };
  const frame = (t) => {
    og.setTransform(dpr, 0, 0, dpr, 0, 0); og.clearRect(0, 0, w, h);
    cg.setTransform(dpr, 0, 0, dpr, 0, 0); cg.clearRect(0, 0, cw, ch);
    const ps = scenePos(pst.progress), m = Math.min(w, h), K = Math.max(HAND.k || 0, 0.4 * m);
    const pr = portalEl.getBoundingClientRect(), r = cta.getBoundingClientRect();

    // the spiral
    if (ps < 0.42 && pr.top < h * 0.05 && pr.bottom > h * 0.5) {
      const sp = clamp(ps / 0.41), cx = HAND.cx || w / 2, cy = HAND.cy || h / 2;
      const grow = smooth(clamp(sp / 0.06));
      const ang = -2.75 + Math.pow(sp, 0.9) * Math.PI * 2 * 2.25;
      const rad = m * 0.36 * Math.pow(1 - smooth(sp), 1.15);
      const k = lerp(m * 0.09, m * 0.3, grow) * (1 - 0.88 * Math.pow(sp, 1.25));
      const lean = 0.45 * Math.sin(ang + 2.75) * smooth(clamp((sp - 0.04) / 0.15)), spin = Math.pow(smooth(clamp((sp - 0.62) / 0.38)), 1.5) * Math.PI * 3;
      const pose = floatPose(sp * 14, lean + spin);
      pose.root.stretch = [ang + Math.PI, 1 + 0.35 * (1 - grow) + 0.35 * smooth(clamp((sp - 0.75) / 0.25))];   // a little tall as he arrives, a little drawn as he goes in
      og.globalAlpha = 1 - smooth(clamp((sp - 0.93) / 0.07));
      draw(og, pose, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, k, t, '#FFEDD7', true);
      og.globalAlpha = 1;
      from = null; return;
    }

    // the jump, out of the top of the screen
    if (ps >= 0.93 && ps < 1 && pr.bottom > h * 0.5) {
      if (!from) from = HAND.k ? { x: HAND.x, y: HAND.y, k: HAND.k } : { x: w * 0.5, y: h * 0.62, k: K };
      const j = clamp((ps - 0.93) / 0.07);
      if (j < 0.32) {
        const c = smooth(j / 0.32);
        draw(og, mixPose(glidePose(ps * 60), crouchPose(), c), lerp(from.x, w * 0.5, c), lerp(from.y, h * 0.66, c), lerp(from.k, K, c), t, '#FFEDD7', true);
      } else {
        const l = (j - 0.32) / 0.68;
        const pose = mixPose(crouchPose(), leapPose(), smooth(clamp(l * 3)));
        draw(og, pose, w * 0.5, lerp(h * 0.66, -0.75 * K, Math.pow(l, 1.3)), K, t, '#FFEDD7', true);
      }
      return;
    }
    if (ps < 0.93) from = null;

    // the landing, behind the words of the contact section
    const rise = clamp(1 - r.top / h), cst = ST.getById('cta'), q = cst ? cst.progress : 0;
    const L = clamp((rise - 0.55) / 0.45) * 0.55 + clamp(q / 0.3) * 0.45;
    if (L <= 0) return;
    const landY = ch * 0.6, F = clamp(L / 0.75), G = clamp((L - 0.75) / 0.25);
    let pose, y = landY;
    if (F < 1) { pose = leapPose(); y = lerp(-0.8 * K, landY, F * F); }                         // dropping in, gathering speed
    else if (G < 0.4) pose = mixPose(leapPose(), crouchPose(), smooth(G / 0.4));                 // the landing: knees give
    else pose = mixPose(crouchPose(), standPose(t, smooth(clamp(q / 0.3 - 1) * 2)), smooth((G - 0.4) / 0.6));   // up, and a wave
    if (L >= 1) pose = standPose(t, smooth(clamp((q - 0.3) / 0.15)));
    draw(cg, pose, cw * 0.5, y + (L >= 1 ? Math.sin(t * 1.5) * 4 : 0), K, t, '#DC5000', false);
  };
  let on = false;
  const vis = new Set();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
    const want = vis.size > 0;
    if (want !== on) { on = want; onClock(frame, on); if (!on) og.clearRect(0, 0, ov.width, ov.height); }
  });
  io.observe(portalEl); io.observe(cta);
}

export async function start({ gsap, ST }) {
  TICK = gsap ? gsap.ticker : null;
  const [THREE] = await Promise.all([
    import(THREE_URL),
    loadScript('/assets/js/figure/mark.js').then(() => loadScript('/assets/js/figure/markbody.js')).catch((e) => console.warn('[scene] figure', e))
  ]);
  const MB = window.MarkBody || null;
  for (const make of [reel, loops, portal]) {
    try { make(THREE, ST, MB); } catch (err) { console.warn('[scene]', make.name, err); }
  }
  try { arrival(MB, ST); } catch (err) { console.warn('[scene] arrival', err); }
}
