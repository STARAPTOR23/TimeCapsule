// Vanilla recreation of a "BorderGlow" component: a cone of color sweeps
// around an element's border, following the cursor, and only becomes
// visible once the cursor gets close to the edge (edgeSensitivity).
window.TimeMachine = window.TimeMachine || {};

(function () {

  // Accepts either "R G B" (e.g. "40 80 80") or any normal CSS color.
  function parseColor(raw) {
    if (!raw) return 'rgba(80, 160, 160, 0.5)';
    const parts = raw.trim().split(/\s+/);
    if (parts.length === 3 && parts.every(function (p) { return /^\d+$/.test(p); })) {
      return 'rgb(' + parts.join(' ') + ' / 0.5)';
    }
    return raw;
  }

  // Builds a conic-gradient with a bright cone of `colors` centered on
  // `angle`, spanning `spread` degrees, and transparent everywhere else.
  function buildConicGradient(angle, spread, colors) {
    const half = spread / 2;
    const start = angle - half;
    const step = spread / Math.max(colors.length - 1, 1);
    const stops = ['transparent 0deg', 'transparent ' + start + 'deg'];
    colors.forEach(function (c, i) {
      stops.push(c + ' ' + (start + step * i) + 'deg');
    });
    stops.push('transparent ' + (angle + half) + 'deg', 'transparent 360deg');
    return 'conic-gradient(from 0deg, ' + stops.join(', ') + ')';
  }

  function initCard(el) {
    const edgeSensitivity = parseFloat(el.dataset.edgeSensitivity) || 30;
    const glowIntensity = parseFloat(el.dataset.glowIntensity) || 1;
    const glowRadius = parseFloat(el.dataset.glowRadius) || 40;
    const coneSpread = parseFloat(el.dataset.coneSpread) || 60;
    const colors = (el.dataset.colors || '#c084fc,#f472b6,#38bdf8')
      .split(',')
      .map(function (c) { return c.trim(); });
    const glowColor = parseColor(el.dataset.glowColor);

    el.style.setProperty('--glow-radius', glowRadius + 'px');
    el.style.setProperty('--glow-color', glowColor);
    if (el.dataset.borderRadius) el.style.borderRadius = el.dataset.borderRadius + 'px';

    let raf = null;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const edgeDist = Math.min(x, rect.width - x, y, rect.height - y);
      const opacity = edgeDist < edgeSensitivity
        ? Math.max(0, 1 - edgeDist / edgeSensitivity) * glowIntensity
        : 0;
      const angle = (Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180 / Math.PI + 90 + 360) % 360;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.style.setProperty('--glow-opacity', opacity.toFixed(2));
        el.style.setProperty('--glow-x', (x / rect.width * 100).toFixed(1) + '%');
        el.style.setProperty('--glow-y', (y / rect.height * 100).toFixed(1) + '%');
        el.style.setProperty('--glow-gradient', buildConicGradient(angle, coneSpread, colors));
      });
    }

    function onLeave() {
      el.style.setProperty('--glow-opacity', 0);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  }

  function init() {
    document.querySelectorAll('.border-glow').forEach(initCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
