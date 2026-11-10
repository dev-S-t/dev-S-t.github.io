/* human-in-loop.dev: the three.js scenes on the home page. Loaded after first paint by home.js.
   three.js r160 (MIT), from jsdelivr, the same build the AI loop uses.

   reel    A card that unrolls like a carpet, then opens to full screen. Its surface is a fill box
           until the showreel video arrives (swap the CanvasTexture for a VideoTexture).
   loops   One cloud of dots. First it is the AI: a sphere of nodes joined by lines. Then the dots
           scatter, stretch and settle into the design: a golden spiral, a grid, and a loop with the
           logo's opening at eleven o'clock.
   portal  A real 3D fall: stars all round, a glass-sphere wormhole that bends the starlight behind it, a tunnel
           of wobbling lines, a warm corridor of line arches, and a pane of glass the logo's human breaks through.
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
// Draw a pose with the films' hand-drawn boil: the lines re-drawn 8 times a second.
function drawFig(MB, g, pose, x, y, k, t, color) {
  const ln = MB.body(pose);
  const cam = (px, py) => [x + px * k, y + py * k]; cam.k = k;
  const bf = Math.floor(t * 8), jit = Math.max(0.6, k * 0.006);
  const j = (s) => [s[0] + (hsh(s[0] * 0.07 + bf) - 0.5) * jit, s[1] + (hsh(s[1] * 0.07 + bf + 3.1) - 0.5) * jit];
  MB.draw(g, ln, cam, j, color);
}

const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

/* ---------------- portal: a real 3D fall ---------------- */
// The camera falls through a 3D world, scrubbed by the scroll, with the logo's human just ahead of it:
//   approach  stars all round (real parallax) and a wormhole: a glass sphere showing another sky, whose
//             gravity bends the stars behind it (a lens pass on the background), ringed by fine dotted lines
//             and spirals of particles flowing in.
//   through   a tunnel of wobbling line rings; stars pass as streaks.
//   a new place  a warm corridor of line arches, light at the far end, a pane of glass across it.
//   the glass he reaches it, it shatters toward us, he jumps through and falls, into the contact section.
const R_HOLE = 10, RINGS = 120, GAPZ = 1.2, TUN_R = 3.2;
const TUN_L = RINGS * GAPZ;
const Z_START = 140, Z_SURF = R_HOLE + 1.5, Z_TUN_END = -(R_HOLE + TUN_L);
const ARCHES = 9, ARCH_GAP = 8, Z_ROOM0 = Z_TUN_END - 6, Z_GLASS = Z_ROOM0 - ARCHES * ARCH_GAP - 6, Z_ROOM_END = Z_GLASS + 16;
const tunnelOffset = (z) => {           // the tunnel bends, but runs straight where it meets the hole and the room
  const u = -R_HOLE - z;
  if (u <= 0 || u >= TUN_L) return [0, 0];
  const amp = Math.min(1, u / 24) * Math.min(1, (TUN_L - u) / 24);
  return [(Math.sin(z * 0.06) * 2.6 + Math.sin(z * 0.023) * 1.8) * amp, Math.cos(z * 0.05) * 1.8 * amp * Math.min(1, u / 24)];
};

const GLSL_NOISE = /* glsl */`
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`;

function portal(THREE, ST, MB) {
  const sec = document.querySelector('.portal');
  const st = ST.getById('portal');
  if (!sec || !st) return;
  const canvas = sec.querySelector('.portal-canvas');
  const narrow = innerWidth < 900;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const PR = Math.min(devicePixelRatio || 1, narrow ? 1.25 : 1.5);
  renderer.setPixelRatio(PR); renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);
  const bg = new THREE.Scene(), fg = new THREE.Scene();
  fg.fog = new THREE.Fog(0x000000, 30, 110);
  const rt = new THREE.WebGLRenderTarget(4, 4);
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    rt.setSize(Math.round(w * PR), Math.round(h * PR));
  };
  size(); new ResizeObserver(size).observe(canvas);

  // 1. Stars, all round the path of the fall.
  const NS = narrow ? 4500 : 9000;
  const sP = new Float32Array(NS * 3), sS = new Float32Array(NS), sR = new Float32Array(NS);
  for (let i = 0; i < NS; i++) {
    let x, y; do { x = (Math.random() - 0.5) * 600; y = (Math.random() - 0.5) * 600; } while (x * x + y * y < 64);
    sP.set([x, y, -520 + Math.random() * 980], i * 3); sS[i] = Math.pow(Math.random(), 3) * 3 + 0.6; sR[i] = Math.random();
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sP, 3));
  sGeo.setAttribute('aS', new THREE.BufferAttribute(sS, 1)); sGeo.setAttribute('aR', new THREE.BufferAttribute(sR, 1));
  const sU = { uTime: { value: 0 }, uPR: { value: PR }, uDim: { value: 1 } };
  const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: sU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aS, aR; uniform float uTime, uPR; varying float vA; varying vec3 vC;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aS * uPR * 90.0 / -mv.z, 1.0, 9.0);
        vA = (0.55 + 0.45 * sin(uTime * (1.0 + aR * 3.0) + aR * 50.0)) * smoothstep(600.0, 60.0, -mv.z);
        vC = mix(vec3(1.0, 0.93, 0.84), mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.62, 0.38), step(0.5, aR)), 0.35);
      }`,
    fragmentShader: /* glsl */`
      uniform float uDim; varying float vA; varying vec3 vC;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vC, vA * uDim * smoothstep(0.5, 0.0, d)); }`
  }));
  stars.frustumCulled = false; bg.add(stars);

  // 2. The lens: the background (stars) is drawn first, then bent round the hole on its way to the screen.
  const lensScene = new THREE.Scene(), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lU = { tBg: { value: rt.texture }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uR: { value: 0 }, uAspect: { value: 1 }, uOn: { value: 0 }, uTime: { value: 0 } };
  lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: lU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tBg; uniform vec2 uC; uniform float uR, uAspect, uOn, uTime; varying vec2 vUv;
      void main() {
        vec2 d = (vUv - uC) * vec2(uAspect, 1.0); float r = length(d);
        vec2 uv = vUv;
        if (uOn > 0.0 && r > 1e-4) {
          float a = atan(d.y, d.x);
          float Re = uR * 1.3 * (1.0 + 0.035 * sin(a * 3.0 + uTime * 1.2) + 0.02 * sin(a * 5.0 - uTime));
          uv -= (d / r) * (Re * Re / max(r, uR * 0.98)) / vec2(uAspect, 1.0) * uOn;   // light bent round the hole
        }
        vec3 c = texture2D(tBg, uv).rgb;
        c += vec3(1.0, 0.86, 0.72) * 0.55 * uOn * smoothstep(uR * 1.28, uR, r) * smoothstep(uR * 0.95, uR * 1.02, r);  // photon ring
        gl_FragColor = vec4(c, 1.0);
      }`
  })));

  // 3. The wormhole: a glass sphere. Through it, another sky, swirling slowly; a bright rim where the glass turns.
  const hU = { uTime: { value: 0 } };
  const hole = new THREE.Mesh(new THREE.SphereGeometry(R_HOLE, 128, 96), new THREE.ShaderMaterial({
    uniforms: hU,
    vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vN; varying vec3 vV;
      void main() {
        vec3 p = position + normal * (sin(position.y * 0.6 + uTime * 1.2) * 0.14 + sin(position.x * 0.5 - uTime) * 0.1);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime; varying vec3 vN; varying vec3 vV;
      vec3 farSky(vec3 d) {
        vec2 s = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
        vec3 c = vec3(0.0);
        for (int L = 0; L < 3; L++) {
          vec2 g = s * (9.0 + float(L) * 8.0) + float(L) * 13.1;
          vec2 id = floor(g), f = fract(g) - 0.5;
          float h = hash(id);
          if (h > 0.62) { vec2 o = vec2(hash(id + 1.7), hash(id + 9.2)) - 0.5; float dd = length(f - o * 0.5);
            c += mix(vec3(1.0, 0.93, 0.84), vec3(1.0, 0.6, 0.35), step(0.8, hash(id + 2.2))) * smoothstep(0.08, 0.0, dd) * (0.4 + 0.6 * hash(id + 6.3)); }
        }
        // Mostly dark: a faint galaxy band and a little warm dust, so the stars read as stars.
        float band = exp(-pow(s.y - 0.35 * sin(s.x * 1.3), 2.0) * 12.0) * pow(fbm(s * 2.5 + 3.0), 2.0);
        c += vec3(0.85, 0.86, 0.95) * band * 0.22 + vec3(0.86, 0.33, 0.08) * pow(fbm(s * 1.6 + 9.0), 5.0) * 0.35;
        return c;
      }
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float ndv = max(dot(n, v), 0.0);
        vec3 d = refract(-v, n, 0.55); if (dot(d, d) < 1e-4) d = reflect(-v, n);
        float a = uTime * 0.08; d.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * d.xz;
        vec3 col = farSky(normalize(d)) * 1.3;
        float fres = pow(1.0 - ndv, 3.5);
        col = mix(col, vec3(1.0, 0.9, 0.8), fres * 0.6);
        col += vec3(0.86, 0.32, 0.05) * pow(1.0 - ndv, 8.0) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }`
  }));
  fg.add(hole);

  // 4. Fine lines round it: dotted rings, and particles spiralling in (igloo's minute lines, in our dots).
  const fine = new THREE.Group(); fg.add(fine);
  const ringMat = new THREE.PointsMaterial({ color: 0xFFEDD7, size: 0.11, transparent: true, opacity: 0.75, depthWrite: false });
  for (let k = 0; k < 5; k++) {
    const r = R_HOLE * (1.32 + k * 0.32), n = Math.round(r * 18), pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3); }
    const ring = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)), ringMat);
    ring.rotation.set(0.25 * Math.sin(k * 1.7), 0.3 * Math.cos(k * 2.3), 0); ring.userData.spin = (k % 2 ? -1 : 1) * (0.02 + k * 0.01);
    fine.add(ring);
  }
  const NI = narrow ? 1200 : 2400, iSeed = new Float32Array(NI * 3);
  for (let i = 0; i < NI; i++) iSeed.set([Math.random(), Math.random() * TAU, (Math.random() - 0.5) * 6], i * 3);
  const iGeo = new THREE.BufferGeometry();
  iGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NI * 3), 3));
  iGeo.setAttribute('aSeed', new THREE.BufferAttribute(iSeed, 3));
  const iU = { uTime: { value: 0 }, uPR: { value: PR } };
  const inflow = new THREE.Points(iGeo, new THREE.ShaderMaterial({
    uniforms: iU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aSeed; uniform float uTime, uPR; varying float vA;
      void main() {
        float s = fract(aSeed.x + uTime * 0.045);
        float r = ${R_HOLE.toFixed(1)} * (1.04 + 2.6 * (1.0 - s));
        float a = aSeed.y + s * 6.2832 * 1.4;
        vec3 p = vec3(cos(a) * r, sin(a) * r * 0.82, aSeed.z * (1.0 - s));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uPR * 40.0 / -mv.z, 1.0, 4.0);
        vA = s * (1.0 - s) * 3.2;
      }`,
    fragmentShader: 'varying float vA; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 0.86, 0.7, vA); }'
  }));
  inflow.frustumCulled = false; fine.add(inflow);

  // 5. The tunnel through: rings of lines that wobble, and lines along its length.
  const SEG = narrow ? 72 : 112, LONG = 16;
  const tv = RINGS * SEG * 2 + (RINGS - 1) * LONG * 2;
  const tAng = new Float32Array(tv), tRing = new Float32Array(tv), tKind = new Float32Array(tv);
  let v = 0;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SEG; s++) { tAng[v] = s / SEG * TAU; tRing[v++] = r; tAng[v] = (s + 1) / SEG * TAU; tRing[v++] = r; }
  for (let r = 0; r < RINGS - 1; r++) for (let l = 0; l < LONG; l++) { const a = l / LONG * TAU; tAng[v] = a; tRing[v] = r; tKind[v++] = 1; tAng[v] = a; tRing[v] = r + 1; tKind[v++] = 1; }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tv * 3), 3));
  tGeo.setAttribute('aAng', new THREE.BufferAttribute(tAng, 1)); tGeo.setAttribute('aRing', new THREE.BufferAttribute(tRing, 1)); tGeo.setAttribute('aKind', new THREE.BufferAttribute(tKind, 1));
  const tU = { uTime: { value: 0 }, uWob: { value: 0.12 }, uOn: { value: 0 } };
  const tunnel = new THREE.LineSegments(tGeo, new THREE.ShaderMaterial({
    uniforms: tU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aAng, aRing, aKind; uniform float uTime, uWob; varying float vFog; varying float vHot; varying float vKind;
      vec2 off(float z) { float u = -${R_HOLE.toFixed(1)} - z, L = ${TUN_L.toFixed(1)};
        float amp = clamp(u / 24.0, 0.0, 1.0) * clamp((L - u) / 24.0, 0.0, 1.0);
        return vec2((sin(z * 0.06) * 2.6 + sin(z * 0.023) * 1.8) * amp, cos(z * 0.05) * 1.8 * amp * clamp(u / 24.0, 0.0, 1.0)); }
      void main() {
        float z = -${R_HOLE.toFixed(1)} - aRing * ${GAPZ.toFixed(2)};
        float n = sin(aAng * 3.0 + uTime * 0.9 + aRing * 0.31) * 0.5 + sin(aAng * 5.0 - uTime * 0.7 + aRing * 0.17) * 0.3 + sin(aAng * 2.0 + aRing * 0.11 + uTime * 0.4) * 0.2;
        float r = ${TUN_R.toFixed(1)} * (1.0 + n * uWob);
        vec3 p = vec3(off(z) + vec2(cos(aAng), sin(aAng)) * r, z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vFog = smoothstep(60.0, 6.0, dist) * smoothstep(0.2, 2.0, dist);
        vHot = (1.0 - step(0.5, mod(aRing, 9.0))) * (1.0 - aKind); vKind = aKind;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uOn; varying float vFog; varying float vHot; varying float vKind;
      void main() { vec3 c = mix(vec3(1.0, 0.929, 0.843), vec3(0.863, 0.314, 0.0), vHot); gl_FragColor = vec4(c, vFog * uOn * mix(0.75, 0.28, vKind)); }`
  }));
  tunnel.frustumCulled = false; fg.add(tunnel);

  // 6. A new place: a warm corridor of line arches, light beyond the glass at its end.
  const arch = [];
  const push = (a, b) => arch.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  for (let k = 0; k < ARCHES; k++) {
    const z = Z_ROOM0 - k * ARCH_GAP, R = 6.5, cy = 1.2, floor = -7;
    for (let i = 0; i < 40; i++) { const a0 = i / 40 * Math.PI, a1 = (i + 1) / 40 * Math.PI; push([Math.cos(a0) * R, cy + Math.sin(a0) * R, z], [Math.cos(a1) * R, cy + Math.sin(a1) * R, z]); }
    push([R, cy, z], [R, floor, z]); push([-R, cy, z], [-R, floor, z]);
    // an inner, smaller arch: doorways within doorways
    for (let i = 0; i < 30; i++) { const a0 = i / 30 * Math.PI, a1 = (i + 1) / 30 * Math.PI, r2 = R * 0.78; push([Math.cos(a0) * r2, cy + Math.sin(a0) * r2, z - 0.6], [Math.cos(a1) * r2, cy + Math.sin(a1) * r2, z - 0.6]); }
  }
  for (const x of [-6.5, -3.25, 0, 3.25, 6.5]) push([x, -7, Z_ROOM0 + 4], [x, -7, Z_GLASS - 4]);
  for (let z = Z_ROOM0 + 4; z > Z_GLASS - 4; z -= 4) push([-6.5, -7, z], [6.5, -7, z]);
  const roomMat = new THREE.LineBasicMaterial({ color: 0xFFEDD7, transparent: true, opacity: 0 });
  fg.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(arch, 3)), roomMat));
  const glowU = { uOn: { value: 0 } };
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.ShaderMaterial({
    uniforms: glowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uOn; varying vec2 vUv; void main() { float d = length((vUv - 0.5) * vec2(1.5, 1.0)); gl_FragColor = vec4(mix(vec3(1.0, 0.93, 0.84), vec3(0.86, 0.32, 0.05), smoothstep(0.0, 0.5, d)), uOn * smoothstep(0.55, 0.0, d)); }'
  }));
  glow.position.z = Z_GLASS - 14; fg.add(glow);

  // 7. The glass: a pane of triangles that shatters toward us.
  const GW = 15, GH = 11, GX = 8, GY = 6, grid = [];
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const edge = i === 0 || j === 0 || i === GX || j === GY, jx = edge ? 0 : (Math.random() - 0.5) * 0.7, jy = edge ? 0 : (Math.random() - 0.5) * 0.7;
    grid.push([(i + jx) / GX * GW - GW / 2, (j + jy) / GY * GH - GH / 2 - 1]);
  }
  const gPos = [], gC = [], gR = [], lPos = [], lC = [], lR = [];
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    const a = grid[j * (GX + 1) + i], b = grid[j * (GX + 1) + i + 1], c = grid[(j + 1) * (GX + 1) + i], d = grid[(j + 1) * (GX + 1) + i + 1];
    for (const tri of [[a, b, d], [a, d, c]]) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, rr = Math.random();
      tri.forEach((q) => { gPos.push(q[0], q[1], 0); gC.push(cx, cy, 0); gR.push(rr); });
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n]) => { [tri[m], tri[n]].forEach((q) => { lPos.push(q[0], q[1], 0); lC.push(cx, cy, 0); lR.push(rr); }); });
    }
  }
  const gU = { uB: { value: 0 } };
  const shardVert = /* glsl */`
    attribute vec3 aC; attribute float aR; uniform float uB; varying float vR;
    vec3 rot(vec3 p, vec3 ax, float a) { ax = normalize(ax); return p * cos(a) + cross(ax, p) * sin(a) + ax * dot(ax, p) * (1.0 - cos(a)); }
    void main() {
      vec3 local = position - aC;
      local = rot(local, vec3(aR, 1.0 - aR, 0.5), aR * uB * 9.0);
      vec3 p = aC + local + vec3(aC.xy * uB * (0.4 + aR * 0.6), uB * (8.0 + aR * 26.0)) + vec3(0.0, -uB * uB * 7.0, 0.0);
      vR = aR;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`;
  const glassGeo = new THREE.BufferGeometry();
  glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPos, 3)); glassGeo.setAttribute('aC', new THREE.Float32BufferAttribute(gC, 3)); glassGeo.setAttribute('aR', new THREE.Float32BufferAttribute(gR, 1));
  const glass = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
    uniforms: gU, vertexShader: shardVert, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    fragmentShader: 'uniform float uB; varying float vR; void main() { gl_FragColor = vec4(vec3(1.0, 0.95, 0.9), 0.06 + 0.1 * vR * uB); }'
  }));
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.Float32BufferAttribute(lPos, 3)); crackGeo.setAttribute('aC', new THREE.Float32BufferAttribute(lC, 3)); crackGeo.setAttribute('aR', new THREE.Float32BufferAttribute(lR, 1));
  const cracks = new THREE.LineSegments(crackGeo, new THREE.ShaderMaterial({
    uniforms: gU, vertexShader: shardVert, transparent: true, depthWrite: false,
    fragmentShader: 'uniform float uB; varying float vR; void main() { gl_FragColor = vec4(1.0, 0.95, 0.9, mix(0.04, 0.85, smoothstep(0.0, 0.04, uB))); }'
  }));
  const pane = new THREE.Group(); pane.add(glass, cracks); pane.position.z = Z_GLASS; fg.add(pane);

  // 8. The human: the logo's figure, drawn each frame onto a card that always faces us, just ahead of the camera.
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const fg2 = fc.getContext('2d');
  const figTex = new THREE.CanvasTexture(fc); figTex.colorSpace = THREE.SRGBColorSpace;
  const fig = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: figTex, transparent: true, depthWrite: false, fog: false }));
  fg.add(fig);

  // The camera's fall, from the scroll.
  const camZ = (p) => {
    if (p < 0.45) { const a = clamp((p - 0.02) / 0.43); return lerp(Z_START, Z_SURF, 1 - Math.pow(1 - a, 2.2)); }
    if (p < 0.7) return lerp(Z_SURF, Z_TUN_END, smooth((p - 0.45) / 0.25));
    if (p < 0.88) return lerp(Z_TUN_END, Z_ROOM_END, smooth((p - 0.7) / 0.18));
    return Z_ROOM_END - (p - 0.88) * 20;
  };
  const black = new THREE.Color(0x000000), ox = new THREE.Color(0x2a0f0c), clear = new THREE.Color();
  const tmpV = new THREE.Vector3(), fwd = new THREE.Vector3();
  let raf = 0, last = 0, vel = 0;
  const loop = (ms) => {
    raf = requestAnimationFrame(loop);
    const t = ms / 1000, p = st.progress;
    vel += ((p - last) * 60 - vel) * 0.08; last = p;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;

    // camera
    const z = camZ(p), o = tunnelOffset(z), oa = tunnelOffset(z - 6);
    camera.position.set(o[0] + pointer.sx * 0.6, o[1] - pointer.sy * 0.45, z);
    camera.lookAt(oa[0], oa[1], z - 6);
    const inTunnel = z < -R_HOLE && z > Z_TUN_END;
    if (inTunnel) camera.rotateZ(t * 0.05 + (p - 0.45) * 2.0);
    camera.updateMatrixWorld();

    // what is on, and how much
    const room = clamp((p - 0.7) / 0.08);
    sU.uTime.value = t; sU.uDim.value = 1 - room * 0.9;
    hU.uTime.value = t; iU.uTime.value = t; tU.uTime.value = t; lU.uTime.value = t;
    tU.uOn.value = clamp((R_HOLE + 2 - z) / 6) * (1 - room);
    tU.uWob.value = 0.1 + clamp(Math.abs(vel) * 2.5, 0, 0.35);
    hole.visible = z > -R_HOLE - 2; fine.visible = z > -2;
    fine.children.forEach((r) => { if (r.userData.spin) r.rotation.z += r.userData.spin * 0.016; });
    roomMat.opacity = room * 0.75; glowU.uOn.value = room * 0.9;
    fg.fog.color.copy(clear.copy(black).lerp(ox, room)); fg.fog.near = 20; fg.fog.far = 95;
    const brk = smooth(clamp((p - 0.865) / 0.07)); gU.uB.value = brk; pane.visible = room > 0;

    // the lens, while we are outside the hole
    const dist = camera.position.length();
    const outside = dist > R_HOLE + 0.3;
    tmpV.set(0, 0, 0).project(camera);
    const ang = Math.asin(Math.min(1, R_HOLE / Math.max(dist, R_HOLE + 0.01)));
    lU.uC.value.set(tmpV.x * 0.5 + 0.5, tmpV.y * 0.5 + 0.5);
    lU.uR.value = Math.tan(ang) / Math.tan(camera.fov * Math.PI / 360) * 0.5;
    lU.uAspect.value = camera.aspect;
    lU.uOn.value = outside && tmpV.z < 1 ? 1 : 0;

    // the human, ahead of the camera
    camera.getWorldDirection(fwd);
    let D = lerp(9, 6.5, clamp(p / 0.45)), fx = Math.sin(t * 0.4) * 0.7, fy = Math.cos(t * 0.3) * 0.45 - 0.3, spin = t * 0.35 + p * 9;
    if (p > 0.84) {                                   // he reaches the glass, breaks it, and drops through
      const g1 = smooth((p - 0.84) / 0.03);
      D = lerp(D, camera.position.z - Z_GLASS - 0.5, g1);   // right up to the pane
      fx *= 1 - g1; fy = lerp(fy, -0.5, g1);
      const g2 = clamp((p - 0.87) / 0.1);
      D += g2 * 30; fy -= g2 * g2 * 30; spin += g2 * 6;
    }
    fig.position.copy(camera.position).addScaledVector(fwd, D);
    fig.position.x += fx; fig.position.y += fy;
    fig.quaternion.copy(camera.quaternion);
    fig.visible = !!MB && p > 0.015 && p < 0.985;
    if (fig.visible) {
      fg2.clearRect(0, 0, 512, 512);
      drawFig(MB, fg2, fallPose(t, spin), 256, 270, 190, t, '#FFEDD7');
      figTex.needsUpdate = true;
    }

    // draw: background into the target, then bent onto the screen, then the world on top
    renderer.setClearColor(clear.copy(black).lerp(ox, room), 1);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(bg, camera);
    renderer.setRenderTarget(null); renderer.clear();
    renderer.render(lensScene, ortho);
    renderer.clearDepth();
    renderer.render(fg, camera);
    canvas.style.opacity = (1 - smooth(clamp((p - 0.955) / 0.045))).toFixed(3);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
    if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(canvas);
  sec.classList.add('has-gl');
}

/* ---------------- contact: he arrives ---------------- */
// When the contact section comes into view: 4 seconds of falling in from above, tumbling; 3 seconds turning to
// face us and coming toward us; then he floats there and waves. Orange, behind the headline. Replays each visit.
function ctaFigure(MB) {
  const sec = document.querySelector('.cta'), cv = sec && sec.querySelector('.cta-fig');
  if (!cv || !MB) return;
  const g = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, start = -1, raf = 0;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; };
  size(); new ResizeObserver(size).observe(cv);
  const frame = (ms) => {
    raf = requestAnimationFrame(frame);
    const T = ms / 1000; if (start < 0) start = T;
    const t = T - start, m = Math.min(w, h);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const u = clamp(t / 4), rotA = T * 0.9 + u * 4;
    const xA = w * (0.5 + 0.16 * Math.sin(u * 3.2)), yA = lerp(-0.12 * h, 0.4 * h, 1 - Math.pow(1 - u, 1.6)), kA = m * lerp(0.08, 0.13, u);
    let pose, x, y, k;
    if (t < 4) { pose = fallPose(T, rotA); x = xA; y = yA; k = kA; }
    else if (t < 7) {
      const v = smooth((t - 4) / 3);
      const A = fallPose(T, wrapAngle(rotA) * (1 - v)), B = standPose(T, v);
      pose = mixPose(A, B, v); x = lerp(xA, w * 0.5, v); y = lerp(0.4 * h, 0.6 * h, v); k = lerp(kA, m * 0.3, v * v);
    } else { pose = standPose(T, 1); x = w * 0.5; y = 0.6 * h + Math.sin(T * 1.5) * 6; k = m * 0.3; }
    g.globalAlpha = 0.95;
    drawFig(MB, g, pose, x, y, k, T, '#DC5000');
    g.globalAlpha = 1;
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
    else {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (e.boundingClientRect.top > 0) start = -1;   // scrolled back up above it: play the arrival again next time
    }
  }, { threshold: 0.25 }).observe(cv);
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
  try { ctaFigure(MB); } catch (err) { console.warn('[scene] contact', err); }
}
