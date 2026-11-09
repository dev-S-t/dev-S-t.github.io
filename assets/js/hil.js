// human-in-loop.dev landing page. Everything is readable without this file; it only adds behaviour:
// the eyes (the o's of the lettering, the humans, Abyss) look toward the pointer, and the last loop draws itself
// when it comes into view.
(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const pupils = [...document.querySelectorAll('.pupil[data-ex]')];
  if (pupils.length && matchMedia('(hover: hover)').matches) {
    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGPoint();
    let px = 0, py = 0, raf = 0;
    const look = () => {
      raf = 0;
      for (const p of pupils) {
        const box = p.ownerSVGElement.getBoundingClientRect();
        if (box.bottom < -40 || box.top > innerHeight + 40) continue;
        const m = p.getScreenCTM(); if (!m) continue;
        const ex = +p.dataset.ex, ey = +p.dataset.ey, max = +p.dataset.m;
        pt.x = ex; pt.y = ey;
        const s = pt.matrixTransform(m), dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 50);
        const inv = m.inverse(), lx = inv.a * dx + inv.c * dy, ly = inv.b * dx + inv.d * dy, l = Math.hypot(lx, ly) || 1;
        p.setAttribute('cx', (ex + lx / l * max * k).toFixed(2));
        p.setAttribute('cy', (ey + ly / l * max * k).toFixed(2));
      }
    };
    addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });
  }

  const join = document.querySelector('.join');
  if (join) {
    if (!('IntersectionObserver' in window)) join.classList.add('in');
    else {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { join.classList.add('in'); io.disconnect(); } }, { threshold: 0.35 });
      io.observe(join);
    }
  }
})();
