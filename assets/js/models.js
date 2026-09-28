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
varying vec3 vN; varying vec3 vV; varying float vDepth;
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
}`;

// contour lines of distance from the eye (like reference image 5), thicker where the light falls (like an engraving)
// constant pixel-width lines weighted by light, so flat areas get sparse thin lines rather than blobs
const FRAG = `
uniform vec3 uGround; uniform vec3 uLine; uniform float uDensity; uniform vec3 uLight; uniform float uRim; uniform float uMaxW; uniform float uDpr;
varying vec3 vN; varying vec3 vV; varying float vDepth;
float lineAt(float v, float fw, float wpx){ float d = abs(fract(v + 0.5) - 0.5) / fw; return 1.0 - smoothstep(wpx * 0.5 - 0.7, wpx * 0.5 + 0.7, d); }
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 vv = normalize(vV);
  float lam = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
  float v = vDepth * uDensity;
  float fw = max(fwidth(v), 1e-4);
  float l = max(0.0, log2(fw / 0.28)); float l0 = floor(l); float f = l - l0; float s0 = exp2(l0);
  float wpx = mix(0.45, uMaxW, pow(lam, 1.1)) * uDpr;
  float a = mix(lineAt(v / s0, fw / s0, wpx), lineAt(v / (2.0 * s0), fw / (2.0 * s0), wpx), smoothstep(0.0, 1.0, f));
  float rim = 1.0 - smoothstep(0.05, 0.28, abs(dot(n, vv)));
  a = max(a, rim * uRim);
  gl_FragColor = vec4(mix(uGround, uLine, a), 1.0);
}`;

function engraving(density, rim = 0.9, maxW = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGround: { value: new THREE.Color(0x0d0d0c) }, uLine: { value: new THREE.Color(0xf3f1ec) },
      uDensity: { value: density }, uLight: { value: new THREE.Vector3(-0.45, 0.55, 0.75) }, uRim: { value: rim }, uMaxW: { value: maxW }, uDpr: { value: Math.min(devicePixelRatio || 1, 2) }
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
  v.camera.position.set(0, 0.05, 9.2);
  let head = null, yaw = 0, pitch = 0;
  loader.load(HEAD_URL, (gltf) => {
    const holder = new THREE.Group();
    gltf.scene.traverse((o) => { if (o.isMesh) { o.material = mat; } });
    holder.add(gltf.scene);
    normalize(holder, 4.1);
    holder.position.y -= 0.72;
    pivot.add(holder);
    head = holder;
  }, undefined, (err) => console.warn('[models] head:', err));
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
  const mat = engraving(95, 0.9, 2.2); const armMat = engraving(95, 0.9, 2.2); v.mats.push(mat, armMat);
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
    // The joints of this rig are siblings, not a chain, so the fist is posed by hand (forward kinematics):
    // bending at a joint turns every joint after it around that joint, toward the palm.
    const P = (n) => B(n).position.clone();
    const thumbDir = P('thumb-phalanx-proximal').sub(P('middle-finger-metacarpal')).normalize();
    const fingerDir = P('middle-finger-phalanx-proximal').sub(P('wrist')).normalize();
    const palm = new THREE.Vector3().crossVectors(thumbDir, fingerDir).normalize(); // right hand: palm faces thumb x fingers
    // the right hand is a mirrored copy (negative scale), which flips cross products in its local space
    const armature = B('wrist').parent; if (armature) { armature.updateMatrixWorld(true); if (armature.matrixWorld.determinant() < 0) palm.negate(); }
    const bend = (chain, angles) => {
      for (let k = 0; k < angles.length; k++) {
        const j = B(chain[k + 1]), next = B(chain[k + 2]); if (!j || !next) break;
        const pivot = j.position.clone();
        const seg = next.position.clone().sub(pivot).normalize();
        const axis = new THREE.Vector3().crossVectors(seg, palm).normalize();
        const q = new THREE.Quaternion().setFromAxisAngle(axis, angles[k]);
        j.quaternion.premultiply(q);
        for (let m = k + 2; m < chain.length; m++) { const b = B(chain[m]); if (!b) continue; b.position.sub(pivot).applyQuaternion(q).add(pivot); b.quaternion.premultiply(q); }
      }
    };
    // the thumb swings in front of the curled fingers (opposition), then folds
    function bendThumb() {
      const chain = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'];
      const base = B(chain[0]).position.clone();
      const across = P('index-finger-phalanx-intermediate').sub(base).normalize();
      const swing = new THREE.Quaternion().setFromUnitVectors(P(chain[1]).sub(base).normalize(), across.clone().lerp(palm, 0.35).normalize());
      const q = new THREE.Quaternion().slerp(swing, 0.62);
      B(chain[0]).quaternion.premultiply(q);
      for (let m = 1; m < chain.length; m++) { const b = B(chain[m]); b.position.sub(base).applyQuaternion(q).add(base); b.quaternion.premultiply(q); }
      bend(chain, [0.55, 0.7]);
    }
    {
      // a pinch: thumb and index meet on the gathered lines, the other fingers curl into the palm
      const chainOf = (f) => [f + '-metacarpal', f + '-phalanx-proximal', f + '-phalanx-intermediate', f + '-phalanx-distal', f + '-tip'];
      bend(chainOf('index-finger'), [0.72, 0.95, 0.5]);
      bend(chainOf('middle-finger'), [1.3, 1.55, 0.95]);
      bend(chainOf('ring-finger'), [1.45, 1.6, 1.0]);
      bend(chainOf('pinky-finger'), [1.55, 1.65, 1.05]);
      const tchain = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'];
      bend(tchain, [0.25, 0.35]);
      const base = B(tchain[0]).position.clone();
      const aim = new THREE.Quaternion().setFromUnitVectors(P('thumb-tip').sub(base).normalize(), P('index-finger-tip').sub(base).normalize());
      tchain.forEach((n, m) => { const b = B(n); b.quaternion.premultiply(aim); if (m > 0) b.position.sub(base).applyQuaternion(aim).add(base); });
    }
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
    v.gripW = W('thumb-tip').add(W('index-finger-tip')).multiplyScalar(0.5);
    rig.add(holder, arm);
    grip = [B('thumb-tip'), B('index-finger-tip')];
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
