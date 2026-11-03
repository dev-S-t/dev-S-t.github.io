// Evenly spaced streamlines (after Jobard and Lefer): lines that follow a direction field and keep a set distance
// from each other, the way fingerprint ridges do. dir(x, y) returns an angle; lines are oriented as they are traced.
function streamlines({ w, h, angle, dsep, dtest = dsep * 0.55, step = 2, margin = 30, stops = [], minLen = dsep * 3, maxSteps = 6000, seed = [w / 2, h / 2] }) {
  const cell = dsep, gw = Math.ceil((w + 2 * margin) / cell) + 1, gh = Math.ceil((h + 2 * margin) / cell) + 1;
  const grid = new Map(); // cell -> [[x, y, line, index]]
  const key = (x, y) => Math.floor((x + margin) / cell) + Math.floor((y + margin) / cell) * gw;
  let touched = null; // the cells the line being traced has written to, so a rejected line can be taken back cheaply
  const add = (x, y, id, i) => { const k = key(x, y); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push([x, y, id, i]); if (touched) touched.add(k); };
  const selfGap = Math.ceil((dsep * 2.2) / step);
  function free(x, y, d, id = -1, i = 0) {
    const cx = Math.floor((x + margin) / cell), cy = Math.floor((y + margin) / cell), r = Math.ceil(d / cell);
    for (let gy = cy - r; gy <= cy + r; gy++) for (let gx = cx - r; gx <= cx + r; gx++) {
      if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
      const a = grid.get(gx + gy * gw); if (!a) continue;
      for (const p of a) {
        if (p[2] === id && Math.abs(p[3] - i) < selfGap) continue;
        const dx = p[0] - x, dy = p[1] - y; if (dx * dx + dy * dy < d * d) return false;
      }
    }
    return true;
  }
  const inside = (x, y) => x > -margin && y > -margin && x < w + margin && y < h + margin;
  const nearStop = (x, y) => stops.some(([sx, sy, r]) => (x - sx) ** 2 + (y - sy) ** 2 < r * r);
  const vec = (x, y, prev) => { const a = angle(x, y); let vx = Math.cos(a), vy = Math.sin(a); if (prev && vx * prev[0] + vy * prev[1] < 0) { vx = -vx; vy = -vy; } return [vx, vy]; };

  const lines = []; let nextId = 0;
  function trace(sx, sy) {
    if (!inside(sx, sy) || nearStop(sx, sy) || !free(sx, sy, dsep * 0.95)) return null;
    const id = nextId++, half = (sign) => {
      const pts = []; let x = sx, y = sy, v = vec(x, y); v = [v[0] * sign, v[1] * sign];
      for (let s = 0; s < maxSteps; s++) {
        const v1 = vec(x, y, v), mx = x + v1[0] * step / 2, my = y + v1[1] * step / 2, v2 = vec(mx, my, v1);
        const nx = x + v2[0] * step, ny = y + v2[1] * step;
        if (!inside(nx, ny) || nearStop(nx, ny) || !free(nx, ny, dtest, id, sign * (s + 1))) break;
        pts.push([nx, ny]); x = nx; y = ny; v = v2;
        add(nx, ny, id, sign * (s + 1)); // own points block the line from running back into itself later
      }
      return pts;
    };
    touched = new Set(); add(sx, sy, id, 0);
    const fwd = half(1), back = half(-1);
    const line = back.reverse().concat([[sx, sy]], fwd);
    let len = 0; for (let i = 1; i < line.length; i++) len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    if (len < minLen) { for (const k of touched) grid.set(k, grid.get(k).filter((p) => p[2] !== id)); touched = null; return null; }
    touched = null;
    lines.push(line);
    return line;
  }
  const queue = [];
  const seedsFrom = (line) => { for (let i = 0; i < line.length; i += 3) { const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; queue.push([line[i][0] - ty * dsep, line[i][1] + tx * dsep], [line[i][0] + ty * dsep, line[i][1] - tx * dsep]); } };
  const first = trace(seed[0], seed[1]); if (first) seedsFrom(first);
  let qi = 0; // a moving index: shifting a long queue would be quadratic
  const drain = () => { while (qi < queue.length) { const [x, y] = queue[qi++]; const l = trace(x, y); if (l) seedsFrom(l); } };
  drain();
  // fill whatever the spreading missed
  for (let y = 0; y <= h; y += dsep * 1.5) for (let x = 0; x <= w; x += dsep * 1.5) { const l = trace(x, y); if (l) { seedsFrom(l); drain(); } }
  return lines;
}

module.exports = { streamlines };
