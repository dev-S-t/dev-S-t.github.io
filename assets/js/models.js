/* human-in-loop.dev — 3D models drawn as engraved contour lines.
   Loaded lazily by lines.js when the About or FAQ section comes near.
   Head: "Infinite, 3D Head Scan" by Lee Perry-Smith, CC BY 3.0 (via the three.js examples).
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
uniform vec3 uGround; uniform vec3 uLine; uniform float uDensity; uniform vec3 uLight; uniform float uRim; uniform float uMaxW; uniform float uDpr; uniform float uFlow;
varying vec3 vN; varying vec3 vV; varying float vDepth; varying vec3 vMV;
float lineAt(float v, float fw, float wpx){ float d = abs(fract(v + 0.5) - 0.5) / fw; return 1.0 - smoothstep(wpx * 0.5 - 0.7, wpx * 0.5 + 0.7, d); }
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 vv = normalize(vV);
  float lam = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
  // uFlow 0: contours of distance from the eye; 1: upright lines that bend over the form (the cloth running on through the hand)
  float v = mix(vDepth, vMV.x + 0.9 * vDepth, uFlow) * uDensity;
  float fw = max(fwidth(v), 1e-4);
  float l = max(0.0, log2(fw / 0.28)); float l0 = floor(l); float f = l - l0; float s0 = exp2(l0);
  float wpx = mix(0.45, uMaxW, pow(lam, 1.1)) * uDpr;
  float a = mix(lineAt(v / s0, fw / s0, wpx), lineAt(v / (2.0 * s0), fw / (2.0 * s0), wpx), smoothstep(0.0, 1.0, f));
  float rim = 1.0 - smoothstep(0.05, 0.28, abs(dot(n, vv)));
  a = max(a, rim * uRim);
  gl_FragColor = vec4(mix(uGround, uLine, a), 1.0);
}`;

function engraving(density, rim = 0.9, maxW = 2.2, flow = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGround: { value: new THREE.Color(0x0d0d0c) }, uLine: { value: new THREE.Color(0xf3f1ec) },
      uDensity: { value: density }, uLight: { value: new THREE.Vector3(-0.45, 0.55, 0.75) }, uRim: { value: rim }, uMaxW: { value: maxW }, uFlow: { value: flow }, uDpr: { value: Math.min(devicePixelRatio || 1, 2) }
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
  const view = { canvas, renderer, scene, camera, visible: false, mats: [], w: 0, h: 0, dark: null, update: null };
  new IntersectionObserver((es) => { view.visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
  views.push(view);
  return view;
}

function sizeView(v) {
  const w = v.canvas.clientWidth, h = v.canvas.clientHeight;
  if (!w || !h) return false;
  if (w !== v.w || h !== v.h) {
    v.w = w; v.h = h;
    v.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    v.renderer.setSize(w, h, false);
    v.camera.aspect = w / h; v.camera.updateProjectionMatrix();
    if (v.fit) v.fit();
  }
  return true;
}

function syncColors(v) {
  const d = HIL.isDark();
  if (v.dark === d) return;
  v.dark = d;
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
    v.fit();
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
    pivot.rotation.set(pitch, yaw, 0);
  };
}

/* ---------- FAQ: the hand that pulls the cloth of lines ---------- */
const handCanvas = document.querySelector('canvas[data-model="hand"]');
if (handCanvas) {
  const v = makeView(handCanvas);
  const mat = engraving(70, 0.9, 1.8, 1); const armMat = engraving(70, 0.9, 1.8, 1); v.mats.push(mat, armMat);
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
    // the forearm, reaching up from below the frame
    const wp = W('wrist');
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.42, 12, 64, 1, false), armMat);
    arm.position.set(wp.x, wp.y - 6 + 0.5, wp.z - 0.04);
    v.wristW = wp.clone();
    v.gripW = W('thumb-tip').add(W('index-finger-phalanx-intermediate')).multiplyScalar(0.5);
    rig.add(holder, arm);
    grip = [B('thumb-tip'), B('index-finger-phalanx-intermediate')];
    v.fit();
  }, undefined, (err) => console.warn('[models] hand:', err));
  v.fit = () => {
    // the pinch sits about a quarter of the way down the tall canvas; the hand fills about half its width
    const fov = v.camera.fov * Math.PI / 180;
    const visW = 2.9, visH = visW / Math.max(v.camera.aspect, 0.2);
    const dist = visH / (2 * Math.tan(fov / 2));
    const cx = v.gripW ? (v.gripW.x + v.wristW.x) / 2 : 0;
    const y = (v.gripW ? v.gripW.y : 0) - (0.5 - 0.26) * visH;
    v.camera.position.set(cx, y, dist);
    v.camera.lookAt(cx, y, 0);
  };
  v.update = (t) => {
    const r = handCanvas.getBoundingClientRect();
    const amt = HIL.reduced() ? 0 : HIL.P.amt;
    const sway = HIL.reduced() ? 0 : Math.sin(t * 0.5) * 0.025;
    rig.rotation.z = sway + Math.max(-1, Math.min(1, (HIL.P.x - (r.left + r.width / 2)) / innerWidth)) * 0.08 * amt;
    rig.updateMatrixWorld(true);
    if (grip) {
      grip[0].getWorldPosition(tmp); tmp.add(grip[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5); tmp.project(v.camera);
      HIL.grip = { x: r.left + (tmp.x * 0.5 + 0.5) * r.width, y: r.top + (-tmp.y * 0.5 + 0.5) * r.height, ok: true };
    }
  };
}

/* ---------- render loop ---------- */
function loop() {
  const t = HIL.time || performance.now() / 1000;
  for (const v of views) {
    if (!v.visible && !(v.canvas.dataset.model === 'hand')) continue;
    if (!sizeView(v)) continue;
    syncColors(v);
    if (v.update) v.update(t);
    if (v.visible) v.renderer.render(v.scene, v.camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
