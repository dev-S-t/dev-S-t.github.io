// Line fields, the site's way: every line is a contour of one scalar field F(x, y). Change F and the lines change
// with it, so a tunnel of rings can stretch into streamlines and curl back into rings without any line being drawn
// by hand. Contours are found with marching squares on a screen-space grid, a few pixels a cell.
//   contours(ctx, F, cam, W, H, { step, cell, phase, j, mask, width, color })
//     F(x, y) -> value (world units); step: level spacing; phase: shifts every level (moves the lines);
//     mask(x, y) -> 0..1 how much line to draw there (0 hides it); j: the boil (screen jitter)
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Field = factory(); })(this, function () {
  function contours(ctx, F, cam, W, H, o = {}) {
    // box: [x0, y0, x1, y1] in screen pixels, to work out only part of the picture
    const bx = o.box ? [Math.max(0, Math.floor(o.box[0])), Math.max(0, Math.floor(o.box[1])), Math.min(W, Math.ceil(o.box[2])), Math.min(H, Math.ceil(o.box[3]))] : [0, 0, W, H];
    if (bx[2] <= bx[0] || bx[3] <= bx[1]) return;
    const cell = o.cell || 8, nx = Math.ceil((bx[2] - bx[0]) / cell) + 1, ny = Math.ceil((bx[3] - bx[1]) / cell) + 1, step = o.step, phase = o.phase || 0;
    const inv = cam.inv, v = new Float32Array(nx * ny), wx = new Float32Array(nx * ny), wy = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const p = inv(bx[0] + i * cell, bx[1] + j * cell), k = j * nx + i; wx[k] = p[0]; wy[k] = p[1]; v[k] = F(p[0], p[1]) / step - phase; }
    const jit = o.j || ((q) => q);
    ctx.save(); ctx.strokeStyle = o.color || '#000'; ctx.lineWidth = o.width || 1.3; ctx.lineCap = 'round';
    // batch segments by mask strength so faded lines can be drawn lighter
    const bands = 4, paths = Array.from({ length: bands }, () => new Path2D());
    const put = (x0, y0, x1, y1, m) => { if (m <= 0.02) return; const b = Math.min(bands - 1, Math.floor(m * bands)); const a = jit([x0, y0]), c = jit([x1, y1]); paths[b].moveTo(a[0], a[1]); paths[b].lineTo(c[0], c[1]); };
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i, a = v[k], b = v[k + 1], c = v[k + nx + 1], d = v[k + nx];
      if (!isFinite(a + b + c + d)) continue;
      const lo = Math.ceil(Math.min(a, b, c, d)), hi = Math.floor(Math.max(a, b, c, d));
      if (hi < lo) continue;
      const x = bx[0] + i * cell, y = bx[1] + j * cell;
      const m = o.mask ? o.mask(wx[k], wy[k]) : 1;
      for (let L = lo; L <= hi; L++) {
        // edge crossings: top (a-b), right (b-c), bottom (d-c), left (a-d)
        const pts = [];
        if ((a < L) !== (b < L)) pts.push([x + cell * (L - a) / (b - a), y]);
        if ((b < L) !== (c < L)) pts.push([x + cell, y + cell * (L - b) / (c - b)]);
        if ((d < L) !== (c < L)) pts.push([x + cell * (L - d) / (c - d), y + cell]);
        if ((a < L) !== (d < L)) pts.push([x, y + cell * (L - a) / (d - a)]);
        if (pts.length === 2) put(pts[0][0], pts[0][1], pts[1][0], pts[1][1], m);
        else if (pts.length === 4) { put(pts[0][0], pts[0][1], pts[1][0], pts[1][1], m); put(pts[2][0], pts[2][1], pts[3][0], pts[3][1], m); }
      }
    }
    for (let b = 0; b < bands; b++) { ctx.globalAlpha = (b + 1) / bands; ctx.stroke(paths[b]); }
    ctx.restore();
  }
  // smooth value noise, for warping fields
  function hash(i, j, s) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s = 1) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy); const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s); return (a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w) * 2 - 1; }
  const fbm = (x, y, s = 1) => noise(x, y, s) * 0.6 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.1;
  return { contours, noise, fbm };
});
