// Vanilla recreation of a "TargetCursor" component: a small crosshair that
// idles near the mouse and spins slowly, then snaps to frame any element
// with the .cursor-target class when you hover it.
window.TimeMachine = window.TimeMachine || {};

(function () {

  // Skip entirely on touch devices — there's no hover/mouse to track there,
  // and hiding the cursor would just break things.
  if (!window.matchMedia('(pointer: fine)').matches) return;

  // ---- configuration (mirrors the React component's props) ----
  const spinDuration = 2;            // seconds per idle rotation
  const hoverDuration = 0.2;         // seconds to animate into/out of a target
  const cursorColor = '#ffffff';
  const cursorColorOnTarget = '#B497CF';
  const parallaxOn = true;

  const cursor = document.createElement('div');
  cursor.className = 'target-cursor spin';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<span class="target-corner tl"></span>' +
    '<span class="target-corner tr"></span>' +
    '<span class="target-corner bl"></span>' +
    '<span class="target-corner br"></span>' +
    '<span class="target-dot"></span>';
  document.body.appendChild(cursor);
  document.body.classList.add('has-target-cursor');

  cursor.style.setProperty('--tc-color', cursorColor);
  cursor.style.setProperty('--tc-spin', spinDuration + 's');
  cursor.style.transitionDuration = hoverDuration + 's';

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let activeTarget = null;

  function moveIdle() {
    cursor.style.left = (mouseX - 12) + 'px';
    cursor.style.top = (mouseY - 12) + 'px';
    cursor.style.width = '24px';
    cursor.style.height = '24px';
  }

  // Frames the target's bounding box, with a small parallax lean toward
  // wherever the mouse currently sits inside it.
  function frameTarget(target, x, y) {
    const rect = target.getBoundingClientRect();
    let offsetX = 0;
    let offsetY = 0;

    if (parallaxOn) {
      offsetX = ((x - (rect.left + rect.width / 2)) / rect.width) * 12;
      offsetY = ((y - (rect.top + rect.height / 2)) / rect.height) * 12;
    }

    cursor.style.left = (rect.left - 8 + offsetX) + 'px';
    cursor.style.top = (rect.top - 8 + offsetY) + 'px';
    cursor.style.width = (rect.width + 16) + 'px';
    cursor.style.height = (rect.height + 16) + 'px';
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (activeTarget && document.body.contains(activeTarget)) {
      frameTarget(activeTarget, mouseX, mouseY);
    } else {
      moveIdle();
    }
  });

  // Event delegation, so this also works for elements timeline.js creates
  // after this script has already run.
  document.addEventListener('mouseover', function (e) {
    const target = e.target.closest('.cursor-target');
    if (!target) return;
    activeTarget = target;
    cursor.classList.remove('spin');
    cursor.classList.add('on-target');
    cursor.style.setProperty('--tc-color', cursorColorOnTarget);
    frameTarget(target, mouseX, mouseY);
  });

  document.addEventListener('mouseout', function (e) {
    const target = e.target.closest('.cursor-target');
    if (!target) return;
    if (e.relatedTarget && target.contains(e.relatedTarget)) return; // still inside
    activeTarget = null;
    cursor.classList.add('spin');
    cursor.classList.remove('on-target');
    cursor.style.setProperty('--tc-color', cursorColor);
    moveIdle();
  });

  moveIdle();

})();
