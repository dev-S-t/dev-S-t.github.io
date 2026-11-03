// a test sheet of the mark's body in a few poses (not a film): t picks the pose
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ink.js'), require('./markbody.js'));
  else (root.Films = root.Films || {}).poses = factory(root.Ink, root.MarkBody);
})(this, function (I, MB) {
  const W = 1920, H = 1080;
  const w = (x, y) => ({ x, y, w: true });
  const base = () => MB.MARK_POSE();
  const P = [
    (p) => p,
    (p) => ({ ...p, round: { F: 0, B: 0 } }),
    (p) => ({ ...p, round: { F: 0.5, B: 0.5 } }),
    // ordinary arms trying to get over the head, and stretching
    (p) => ({ ...p, round: { F: 0, B: 0 }, armLen: { F: 0.36, B: 0.36 }, sh: 0.3, hands: { F: w(0.1, -0.35), B: w(-0.1, -0.35) } }),
    (p) => ({ ...p, round: { F: 0, B: 0 }, armLen: { F: 0.8, B: 0.7 }, sh: 0.4, hands: { F: w(0.0, -0.45), B: w(-0.2, -0.42) } }),
    // standing, ordinary
    (p) => ({ root: { x: 0, y: 0.4, rot: 0, sx: 1 }, lean: 0.02, bend: 0.35, nod: 0, feet: { L: w(-0.08, 0.7), R: w(0.08, 0.7) }, knee: { L: 1, R: 1 }, hands: { F: w(0.12, 0.42), B: w(-0.1, 0.42) }, elbow: { F: -1, B: 1 } }),
    // arms out wide, balancing
    (p) => ({ ...p, armLen: undefined, sh: undefined, round: { F: 0, B: 0 }, hands: { F: w(0.34, 0.12), B: w(-0.34, 0.1) }, elbow: { F: -1, B: 1 } }),
    // tucked ball, rolling
    (p) => ({ root: { x: 0, y: 0.35, rot: 0.6, sx: 1 }, lean: 1.0, bend: 0.8, nod: 0.6, feet: { L: { x: 0.1, y: -0.02 }, R: { x: 0.13, y: 0.0 } }, knee: { L: 1, R: 1 }, hands: { F: { x: 0.2, y: 0.06 }, B: { x: 0.17, y: 0.08 } }, elbow: { F: 1, B: 1 } }),
    // flying, arms forward
    (p) => ({ root: { x: 0, y: 0.1, rot: 1.25, sx: 1 }, lean: 0.0, bend: 0.4, nod: -0.15, feet: { L: { x: -0.08, y: 0.3 }, R: { x: 0.04, y: 0.31 } }, knee: { L: 1, R: 1 }, hands: { F: { x: 0.1, y: -0.62 }, B: { x: -0.02, y: -0.6 } }, elbow: { F: 1, B: -1 } })
  ];
  function draw(ctx, t) {
    const i = Math.max(0, Math.min(P.length - 1, Math.round(t))), cam = I.camera(W, H, { cx: 0, cy: 0, k: 440 }), j = (q) => q;
    I.background(ctx, 'paper', W, H);
    MB.drawMark(ctx, cam, j, '#0D0D0C', '#F3F1EC', 'loop');
    MB.draw(ctx, MB.body(P[i](base())), cam, j, '#0D0D0C');
  }
  return { id: 'poses', title: 'Poses', W, H, fps: 1, dur: P.length, draw, events: () => [] };
});
