/* human-in-loop.dev — 3D models drawn as engraved contour lines.
   Loaded lazily by lines.js when the About or FAQ section comes near.
   Head: "Infinite, 3D Head Scan" by Lee Perry-Smith, licensed CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/),
   loaded from the three.js examples (examples/models/gltf/LeePerrySmith); drawn here in engraved lines, not otherwise modified.
   Hand: WebXR generic hand, webxr-input-profiles, MIT License, Copyright (c) 2019 Amazon. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const HIL = window.__HIL || { P: { x: 0, y: 0, amt: 0 }, isDark: () => false, reduced: () => false };
const HEAD_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';
const HAND_URL = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/right.glb';

const VERT = `
#include <common>
#include <skinning_pars_vertex>
varying vec3 vN; varying vec3 vV; varying float vDepth; varying vec3 vMV;
void main(){
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vN = normalize(transformedNormal);
  vV = -mvPosition.xyz;
  vDepth = -mvPosition.z;
  vMV = mvPosition.xyz;
}`;

// contour lines of distance from the eye (like reference image 5), thicker where the light falls (like an engraving)
// constant pixel-width lines weighted by light, so flat areas get sparse thin lines rather than blobs
const FRAG = `
uniform vec3 uGround; uniform vec3 uLine; uniform float uDensity; uniform vec3 uLight; uniform float uRim; uniform float uMaxW; uniform float uDpr; uniform float uFlow; uniform vec2 uDir; uniform float uLook;
varying vec3 vN; varying vec3 vV; varying float vDepth; varying vec3 vMV;
float lineAt(float v, float fw, float wpx){ float d = abs(fract(v + 0.5) - 0.5) / fw; return 1.0 - smoothstep(wpx * 0.5 - 0.7, wpx * 0.5 + 0.7, d); }
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 vv = normalize(vV);
  if (uLook > 0.5) {
    float ndv = abs(dot(n, vv));
    vec3 L = normalize(uLight);
    vec3 R = reflect(-vv, n);
    float a;
    if (uLook < 1.5) {
      // black metal: the body is ground colour; a sky of horizontal bands is reflected in it, drawn as lines that
      // crowd and bend over the knuckles; the bands brighten toward the sky, and the light's highlight fattens them
      // mostly black: only the upper sky is reflected, as a few fine lines, and the light makes short hot streaks
      float v = (R.y * 0.9 + 0.2 * R.x) * 6.0;
      float fw = max(fwidth(v), 1e-4);
      float sky = smoothstep(-0.05, 0.9, R.y);
      float spec = pow(max(dot(R, L), 0.0), 40.0);
      float wpx = (mix(0.0, 1.5, sky) + 5.0 * spec) * uDpr;
      a = lineAt(v, fw, wpx) * sky;
      a = max(a, smoothstep(0.6, 0.95, spec));
    } else {
      // glass: the lines behind the hand, bent by its surface; the edges gather light, one long highlight
      vec2 sp = gl_FragCoord.xy / uDpr;
      float v = (sp.y + n.y * 26.0 * (1.0 - ndv * 0.5) + n.x * 8.0) / 4.2;
      float fw = max(fwidth(v), 1e-4);
      a = lineAt(v, fw, 0.8 * uDpr) * 0.8;
      float spec = pow(max(dot(R, L), 0.0), 60.0);
      a = max(a, smoothstep(0.35, 0.8, spec));
    }
    float rim = 1.0 - smoothstep(0.03, uLook < 1.5 ? 0.12 : 0.2, ndv);
    a = max(a, rim * 0.95);
    gl_FragColor = vec4(mix(uGround, uLine, a), 1.0);
    return;
  }
  float lam = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
  // uFlow 0: contours of distance from the eye; 1: parallel lines across the screen (along uDir's normal) that bend over the form
  float v = mix(vDepth, dot(vMV.xy, uDir) + 0.9 * vDepth, uFlow) * uDensity;
  float fw = max(fwidth(v), 1e-4);
  float l = max(0.0, log2(fw / 0.28)); float l0 = floor(l); float f = l - l0; float s0 = exp2(l0);
  float wpx = mix(0.45, uMaxW, pow(lam, 1.1)) * uDpr;
  float a = mix(lineAt(v / s0, fw / s0, wpx), lineAt(v / (2.0 * s0), fw / (2.0 * s0), wpx), smoothstep(0.0, 1.0, f));
  float rim = 1.0 - smoothstep(0.05, 0.28, abs(dot(n, vv)));
  a = max(a, rim * uRim);
  gl_FragColor = vec4(mix(uGround, uLine, a), 1.0);
}`;

function engraving(density, rim = 0.9, maxW = 2.2, flow = 0, dir = [1, 0]) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGround: { value: new THREE.Color(0x0d0d0c) }, uLine: { value: new THREE.Color(0xf3f1ec) },
      uDensity: { value: density }, uLight: { value: new THREE.Vector3(-0.45, 0.55, 0.75) }, uRim: { value: rim }, uMaxW: { value: maxW }, uFlow: { value: flow }, uLook: { value: 0 }, uDir: { value: new THREE.Vector2(dir[0], dir[1]) }, uDpr: { value: Math.min(devicePixelRatio || 1, 2) }
    },
    vertexShader: VERT, fragmentShader: FRAG
  });
}

function sectionColors(el) {
  const sec = el.closest('[data-polarity]');
  const cs = getComputedStyle(sec || document.body);
  return [new THREE.Color(cs.getPropertyValue('--g').trim() || '#0D0D0C'), new THREE.Color(cs.getPropertyValue('--f').trim() || '#F3F1EC')];
}

const loader = new GLTFLoader();
const views = [];

function makeView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  // a view is redrawn only when something about it changed (size, colours, pose); otherwise its last frame stays up
  const view = { canvas, renderer, scene, camera, visible: false, mats: [], w: 0, h: 0, dark: null, update: null, dirty: true };
  new IntersectionObserver((es) => { view.visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
  views.push(view);
  return view;
}

function sizeView(v) {
  const w = v.canvas.clientWidth, h = v.canvas.clientHeight;
  if (!w || !h) return false;
  if (w !== v.w || h !== v.h) {
    v.w = w; v.h = h;
    const pr = Math.min(devicePixelRatio || 1, 1.5);
    v.renderer.setPixelRatio(pr);
    v.mats.forEach((mt) => { mt.uniforms.uDpr.value = pr; });
    v.renderer.setSize(w, h, false);
    v.camera.aspect = w / h; v.camera.updateProjectionMatrix();
    if (v.fit) v.fit();
    v.dirty = true;
  }
  return true;
}

function syncColors(v) {
  const d = HIL.isDark();
  if (v.dark === d) return;
  v.dark = d; v.dirty = true;
  const [g, f] = sectionColors(v.canvas);
  v.mats.forEach((m) => { m.uniforms.uGround.value.copy(g); m.uniforms.uLine.value.copy(f); });
}

function normalize(obj, height) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const s = height / size.y;
  obj.scale.multiplyScalar(s);
  obj.position.sub(center.multiplyScalar(s));
}

/* ---------- About: the head ---------- */
const headCanvas = document.querySelector('canvas[data-model="head"]');
if (headCanvas) {
  const v = makeView(headCanvas);
  const mat = engraving(120, 0.75, 2.4); v.mats.push(mat);
  const pivot = new THREE.Group(); v.scene.add(pivot);
  let head = null, box = null, yaw = 0, pitch = 0;
  loader.load(HEAD_URL, (gltf) => {
    const holder = new THREE.Group();
    gltf.scene.traverse((o) => { if (o.isMesh) { o.material = mat; } });
    holder.add(gltf.scene);
    normalize(holder, 4.1);
    pivot.add(holder);
    head = holder;
    box = new THREE.Box3().setFromObject(holder);
    v.fit(); v.dirty = true;
  }, undefined, (err) => console.warn('[models] head:', err));
  v.fit = () => {
    if (!box) return;
    // the crown sits just below the top edge; the cut of the scan lands below the bottom edge, which on
    // side-by-side layouts is hidden past the section's seam, so the torso runs to the section's end
    const fov = v.camera.fov * Math.PI / 180;
    const aspect = Math.max(v.camera.aspect, 0.2);
    let visH = (box.max.y - box.min.y) / 0.97;
    visH = Math.max(visH, (box.max.x - box.min.x) / (1.6 * aspect));
    const cy = box.min.y - 0.02 * visH + visH / 2;
    const dist = visH / (2 * Math.tan(fov / 2));
    v.camera.position.set(0, cy, dist);
    v.camera.lookAt(0, cy, 0);
  };
  v.update = (t) => {
    const r = headCanvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.42;
    const amt = HIL.reduced() ? 0 : HIL.P.amt;
    const ty = Math.max(-1, Math.min(1, (HIL.P.x - cx) / (innerWidth * 0.45))) * 0.6 * amt + (HIL.reduced() ? 0.18 : Math.sin(t * 0.35) * 0.06);
    const tx = Math.max(-1, Math.min(1, (HIL.P.y - cy) / (innerHeight * 0.5))) * 0.24 * amt;
    yaw += (ty - yaw) * 0.06; pitch += (tx - pitch) * 0.06;
    if (Math.abs(yaw - pivot.rotation.y) + Math.abs(pitch - pivot.rotation.x) < 0.0008) return false;
    pivot.rotation.set(pitch, yaw, 0);
    return true;
  };
}

/* ---------- FAQ: the hand that pulls the cloth of lines ---------- */
const handCanvas = document.querySelector('canvas[data-model="hand"]');
if (handCanvas) {
  const v = makeView(handCanvas);
  const mat = engraving(40, 1.0, 1.25, 1, [0, 1]); const armMat = engraving(40, 1.0, 1.25, 1, [0, 1]); v.mats.push(mat, armMat);
  const rig = new THREE.Group(); v.scene.add(rig);
  let grip = null, fist = null;
  const tmp = new THREE.Vector3();
  loader.load(HAND_URL, (gltf) => {
    const model = gltf.scene;
    const bones = {};
    model.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) { o.material = mat; o.frustumCulled = false; }
      if (o.isBone) bones[o.name] = o;
    });
    const B = (n) => bones[n];
    if (!B('wrist') || !B('middle-finger-metacarpal')) { console.warn('[models] hand: unexpected rig'); return; }
    // The joints of this rig are siblings, not a chain, so the fist is posed with forward kinematics.
    // Each joint's own X axis is its bending axis (WebXR joint frames: -Z along the bone, +Y out of the back
    // of the hand), and a negative turn curls toward the palm. Turning a joint carries every later joint.
    const X = new THREE.Vector3(1, 0, 0);
    const flex = (chain, k, ang) => {
      const j = B(chain[k]); const pivot = j.position.clone();
      const q = new THREE.Quaternion().setFromAxisAngle(X.clone().applyQuaternion(j.quaternion).normalize(), ang);
      for (let m = k; m < chain.length; m++) { const bn = B(chain[m]); if (!bn) continue; if (m > k) bn.position.sub(pivot).applyQuaternion(q).add(pivot); bn.quaternion.premultiply(q); }
    };
    const chainOf = (f) => [f + '-metacarpal', f + '-phalanx-proximal', f + '-phalanx-intermediate', f + '-phalanx-distal', f + '-tip'];
    // a closed fist gathering the cloth: the fingers curl a little more toward the little finger,
    // and the thumb folds over to press the lines against the side of the index finger
    [['index-finger', [-1.05, -1.35, -0.8]], ['middle-finger', [-1.3, -1.45, -0.85]], ['ring-finger', [-1.4, -1.45, -0.8]], ['pinky-finger', [-1.5, -1.4, -0.75]]]
      .forEach(([f, angles]) => angles.forEach((ang, i) => flex(chainOf(f), i + 1, ang)));
    const thumb = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'];
    flex(thumb, 1, -0.8); flex(thumb, 2, -0.75);
    model.updateMatrixWorld(true);
    // orient: knuckles up, palm toward the viewer and turned a little, wrist below
    const W = (n) => B(n).getWorldPosition(new THREE.Vector3());
    const up = W('middle-finger-metacarpal').sub(W('wrist')).normalize();
    const thumbW = W('thumb-phalanx-proximal').sub(W('middle-finger-metacarpal')).normalize();
    const facing = new THREE.Vector3().crossVectors(thumbW, up).normalize();
    const side = new THREE.Vector3().crossVectors(up, facing).normalize();
    const basis = new THREE.Matrix4().makeBasis(side, up, facing).transpose();
    const holder = new THREE.Group(); holder.add(model);
    holder.quaternion.setFromRotationMatrix(basis).premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, 0.3, 0.1)));
    holder.updateMatrixWorld(true);
    // size: the span from wrist to knuckles becomes one unit
    const span = W('middle-finger-phalanx-proximal').distanceTo(W('wrist'));
    holder.scale.setScalar(1 / span); holder.updateMatrixWorld(true);
    const knuck = W('middle-finger-phalanx-proximal');
    holder.position.sub(knuck); holder.updateMatrixWorld(true);
    // the forearm: narrow at the wrist, fuller toward the elbow, a little flattened; it fades into the sheet below
    const wp = W('wrist');
    const prof = [[0.001, 0.22], [0.2, 0.2], [0.26, 0.04], [0.285, -0.3], [0.33, -0.9], [0.385, -1.6], [0.415, -2.4], [0.42, -3.2], [0.4, -4.2], [0.38, -5.4]].map(([r, y]) => new THREE.Vector2(r, y));
    const arm = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), armMat);
    arm.scale.set(1.15, 1, 0.92);
    arm.position.set(wp.x, wp.y + 0.02, wp.z - 0.03);
    arm.rotation.z = -0.05;
    v.wristW = wp.clone();
    v.gripW = W('thumb-tip').add(W('index-finger-phalanx-intermediate')).multiplyScalar(0.5);
    rig.add(holder, arm);
    grip = [B('thumb-tip'), B('index-finger-phalanx-intermediate')];
    v.fit(); v.dirty = true;
  }, undefined, (err) => console.warn('[models] hand:', err));
  v.fit = () => {
    // the fist sits where the CSS says (--grip-y, a share of the canvas height); the hand fills about a third of the width
    const gyF = parseFloat(getComputedStyle(handCanvas).getPropertyValue('--grip-y')) || 0.3;
    const fov = v.camera.fov * Math.PI / 180;
    const visW = 2.4, visH = visW / Math.max(v.camera.aspect, 0.2);
    const dist = visH / (2 * Math.tan(fov / 2));
    const cx = v.gripW ? (v.gripW.x + v.wristW.x) / 2 : 0;
    const y = (v.gripW ? v.gripW.y : 0) - (0.5 - gyF) * visH;
    v.camera.position.set(cx, y, dist);
    v.camera.lookAt(cx, y, 0);
    if (!v.w || !v.h) return;
    // lines about 3.2 px apart at any size, three times finer than the sheet behind the hand
    v.mats.forEach((mt) => { mt.uniforms.uDensity.value = (v.w / visW) / 3.2; });
    // the forearm fades out a little below the wrist, into the sheet
    const unit = v.w / visW, gy = gyF * v.h;
    const end = Math.min(gy + unit * 2.7, v.h - 8), start = Math.min(gy + unit * 1.2, end - unit * 0.6);
    const mask = 'linear-gradient(to bottom, #000 ' + Math.round(start) + 'px, transparent ' + Math.round(end) + 'px)';
    handCanvas.style.webkitMaskImage = mask; handCanvas.style.maskImage = mask;
  };
  const LOOKS = { engrave: 0, metal: 1, glass: 2 };
  // the hand holds still (it does not follow the pointer); it is redrawn only when its look or size changes
  let gripN = null;
  v.update = () => {
    const r = handCanvas.getBoundingClientRect();
    const look = LOOKS[handCanvas.dataset.look] || 0;
    let changed = false;
    if (v.mats[0].uniforms.uLook.value !== look) { v.mats.forEach((mt) => { mt.uniforms.uLook.value = look; }); changed = true; }
    if (grip) {
      if (!gripN || v.dirty) { grip[0].getWorldPosition(tmp); tmp.add(grip[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5); tmp.project(v.camera); gripN = [tmp.x, tmp.y]; }
      HIL.grip = { x: r.left + (gripN[0] * 0.5 + 0.5) * r.width, y: r.top + (-gripN[1] * 0.5 + 0.5) * r.height, ok: true };
    }
    return changed;
  };
}

/* ---------- rendering: driven by the line engine's frame, so the models and the lines always show the same scroll ---------- */
function renderModels(t) {
  for (const v of views) {
    if (!v.visible) continue;
    if (!sizeView(v)) continue;
    syncColors(v);
    const moved = v.update ? v.update(t) : false;
    if (moved || v.dirty) { v.renderer.render(v.scene, v.camera); v.dirty = false; }
  }
}
HIL.renderModels = renderModels;
HIL.refitModels = () => views.forEach((v) => { v.w = 0; });
if (!window.__HIL) { const own = (now) => { renderModels(now / 1000); requestAnimationFrame(own); }; requestAnimationFrame(own); }
