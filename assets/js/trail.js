/* The line the cursor leaves: a fine stroke that follows the pointer and fades within a moment. Shared by every page
   (the Design loop draws its own in its blue). Mouse and trackpad only; off with reduced motion. One small canvas,
   drawn only while there is a line to draw. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = () => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9990';
    document.body.appendChild(c);
    const g = c.getContext('2d'), pts = [], LIFE = 700;
    let w = 0, h = 0, dpr = 1, running = false;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; };
    size(); addEventListener('resize', size);
    const col = getComputedStyle(document.documentElement).getPropertyValue('--orange').trim() || '#DC5000';
    const frame = () => {
      const now = performance.now();
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k], life = 1 - (now - b.t) / LIFE;
        g.globalAlpha = life * 0.6; g.lineWidth = 0.6 + life * 1.4;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      g.globalAlpha = 1;
      if (pts.length) requestAnimationFrame(frame); else running = false;
    };
    addEventListener('pointermove', (e) => {
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 60) pts.shift();
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start); else start();
})();
