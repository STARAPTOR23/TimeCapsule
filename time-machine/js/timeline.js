window.TimeMachine = window.TimeMachine || {};

(function () {

  const viewport = document.getElementById('timeline-viewport');
  const track = document.getElementById('timeline-track');
  const bgLayerA = document.getElementById('bg-layer-a');
  const bgLayerB = document.getElementById('bg-layer-b');
  const enterBtn = document.getElementById('enter-btn');
  const arrowLeft = document.getElementById('arrow-left');
  const arrowRight = document.getElementById('arrow-right');

  let items = [];          // [{ value, label, themeClass }]
  let mode = 'year';
  let activeIndex = 0;
  let offset = 0;           // current track translateX, in px
  let itemSpacing = 200;    // distance between two item centers, measured after render
  let currentBgLayer = bgLayerA;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let snapTimer = null;

  // ---------- building the two data sets ----------

  function buildYearItems() {
    const arr = [];
    for (let year = 1940; year <= 2026; year++) {
      arr.push({ value: year, label: String(year), themeClass: TimeMachine.getThemeClassForYear(year) });
    }
    return arr;
  }

  function buildDecadeItems() {
    return [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map(function (start) {
      return { value: start, label: start + 's', themeClass: TimeMachine.getThemeClassForYear(start) };
    });
  }

  // ---------- rendering ----------

  // Manual double-click tracking, keyed by item index rather than relying
  // on the browser's native dblclick — an off-center item starts sliding
  // toward the middle the instant the first click lands, so by the time
  // the second click arrives the element has moved out from under a
  // stationary mouse and native dblclick pairing can miss it entirely.
  let lastClickIndex = -1;
  let lastClickTime = 0;
  const DOUBLE_CLICK_MS = 400;

  function render() {
    track.innerHTML = '';
    items.forEach(function (item, index) {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.dataset.index = index;
      li.innerHTML = '<span class="item-label">' + item.label + '</span>';
      li.addEventListener('click', function () {
        const now = Date.now();
        const isDoubleClick = index === lastClickIndex && (now - lastClickTime) < DOUBLE_CLICK_MS;

        goToIndex(index, true);

        if (isDoubleClick) {
          triggerEnter();
          lastClickIndex = -1;
          lastClickTime = 0;
        } else {
          lastClickIndex = index;
          lastClickTime = now;
        }
      });
      track.appendChild(li);
    });
  }

  function measureSpacing() {
    const els = track.children;
    if (els.length > 1) {
      itemSpacing = els[1].offsetLeft - els[0].offsetLeft;
    }
  }

  // ---------- positioning ----------

  function centerOffsetForIndex(index) {
    const el = track.children[index];
    const viewportCenter = viewport.clientWidth / 2;
    const itemCenter = el.offsetLeft + el.offsetWidth / 2;
    return viewportCenter - itemCenter;
  }

  // Keeps the track from being scrolled past the first or last item —
  // without this, a fast wheel flick or drag could fling the track well
  // beyond 1940 or 2026 into empty space before the snap-back catches up.
  function clampOffset(px) {
    if (!track.children.length) return px;
    const maxOffset = centerOffsetForIndex(0);               // leftmost item centered
    const minOffset = centerOffsetForIndex(items.length - 1); // rightmost item centered
    return Math.min(maxOffset, Math.max(minOffset, px));
  }

  function applyOffset(px, animate) {
    offset = px;
    track.style.transition = animate ? 'transform .45s cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = 'translateX(' + px + 'px)';
    updateVisualState();
  }

  // Scales/fades/blurs every item based on distance from viewport center,
  // and figures out which item is currently closest to it.
  function updateVisualState() {
    const viewportCenter = viewport.clientWidth / 2;

    // First pass: find the truly-closest item before touching any styles.
    // (Doing this in the same pass that applies styles was a real bug —
    // comparing against a closestIndex that was still being updated mid-
    // loop meant several items could flash the "active" glow on their way
    // past, not just the one that ends up actually centered.)
    let closestIndex = activeIndex;
    let closestDist = Infinity;
    Array.from(track.children).forEach(function (el, index) {
      const itemCenter = el.offsetLeft + el.offsetWidth / 2 + offset;
      const dist = Math.abs(itemCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = index;
      }
    });

    // Second pass: apply the visual treatment now that closestIndex is final.
    Array.from(track.children).forEach(function (el, index) {
      const itemCenter = el.offsetLeft + el.offsetWidth / 2 + offset;
      const dist = Math.abs(itemCenter - viewportCenter);
      const norm = Math.min(dist / (itemSpacing * 2.2), 1);
      el.style.transform = 'scale(' + (1 - norm * 0.55).toFixed(3) + ')';
      el.style.opacity = (1 - norm * 0.75).toFixed(3);
      el.style.filter = 'blur(' + (norm * 4).toFixed(2) + 'px)';
      el.classList.toggle('active', index === closestIndex);
    });

    if (closestIndex !== activeIndex || track.dataset.needsInit) {
      activeIndex = closestIndex;
      delete track.dataset.needsInit;
      onActiveChange();
    }
  }

  function onActiveChange() {
    const item = items[activeIndex];
    crossfadeBackground(item.themeClass);
    TimeMachine.applyBodyTheme(item.themeClass);
    enterBtn.textContent = mode === 'year'
      ? 'ENTER ' + item.value
      : 'EXPLORE THE ' + item.label.toUpperCase();
  }

  // Two stacked backdrop layers swap which one is on top, so the era
  // pattern cross-fades instead of cutting instantly.
  function crossfadeBackground(themeClass) {
    const nextLayer = currentBgLayer === bgLayerA ? bgLayerB : bgLayerA;
    nextLayer.className = 'bg-layer era-' + themeClass.replace('theme-', '');
    void nextLayer.offsetWidth; // force reflow so the opacity transition actually plays
    nextLayer.classList.add('active');
    currentBgLayer.classList.remove('active');
    currentBgLayer = nextLayer;
  }

  function goToIndex(index, animate) {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    applyOffset(centerOffsetForIndex(clamped), animate !== false);
  }

  // ---------- input: mouse wheel / trackpad ----------

  function onWheel(e) {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    applyOffset(clampOffset(offset - delta), false);
    clearTimeout(snapTimer);
    snapTimer = setTimeout(function () { goToIndex(activeIndex, true); }, 120);
  }

  // ---------- input: drag (mouse + touch, via Pointer Events) ----------

  function onPointerDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartOffset = offset;
    viewport.classList.add('dragging');
    viewport.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    applyOffset(clampOffset(dragStartOffset + (e.clientX - dragStartX)), false);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('dragging');
    goToIndex(activeIndex, true);
  }

  // ---------- input: keyboard ----------

  function onKeydown(e) {
    if (!track.children.length) return;
    if (e.key === 'ArrowRight') { goToIndex(activeIndex + 1, true); }
    else if (e.key === 'ArrowLeft') { goToIndex(activeIndex - 1, true); }
    else if (e.key === 'Enter') { triggerEnter(); }
  }

  // ---------- entering a selection ----------

  function triggerEnter() {
    const item = items[activeIndex];
    document.dispatchEvent(new CustomEvent('timeline:enter', {
      detail: { mode: mode, value: item.value, label: item.label }
    }));
  }

  // ---------- public entry point (called from app.js) ----------

  function start(newMode) {
    mode = newMode;
    items = mode === 'year' ? buildYearItems() : buildDecadeItems();

    track.className = 'timeline-track mode-' + mode;
    track.dataset.needsInit = 'true';
    render();

    arrowLeft.onclick = function () { goToIndex(activeIndex - 1, true); };
    arrowRight.onclick = function () { goToIndex(activeIndex + 1, true); };
    enterBtn.onclick = triggerEnter;

    // Wait until .timeline-viewport actually has a real, non-zero width
    // before measuring/positioning anything. .timeline-view was just made
    // visible (removed its `hidden` attribute) in this same tick, and in
    // practice a single requestAnimationFrame isn't always enough for the
    // browser to have committed that layout change — clientWidth can still
    // read 0 one frame later. If that happens, the centering math targets
    // the left edge of a "0-width" viewport instead of the real center,
    // which shoves every item off-screen while all the *bookkeeping*
    // (active index, theme, button text) stays perfectly self-consistent —
    // which is exactly why the year/theme could look right while the
    // timeline itself appeared completely blank. Retrying every frame
    // until the width is real removes the guesswork entirely.
    function positionOnceReady() {
      if (!viewport.clientWidth) {
        requestAnimationFrame(positionOnceReady);
        return;
      }

      measureSpacing();

      // Default to today's decade/year so the timeline opens somewhere relevant.
      const defaultValue = mode === 'year' ? 2026 : 2020;
      const defaultIndex = items.findIndex(function (i) { return i.value === defaultValue; });
      activeIndex = defaultIndex >= 0 ? defaultIndex : 0;

      goToIndex(activeIndex, false);
    }

    requestAnimationFrame(positionOnceReady);

    // Belt-and-suspenders: if the display font ('Anton') is still loading
    // when positionOnceReady ran, items get measured using the fallback
    // font's (different) widths. Once the real font swaps in, every
    // item's actual width can shift, which drifts the centering math out
    // from under the layout we already computed. Re-measuring once fonts
    // are confirmed loaded corrects for that.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureSpacing();
        goToIndex(activeIndex, false);
      });
    }
  }

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', function () {
    measureSpacing();
    goToIndex(activeIndex, false);
  });

  TimeMachine.timeline = { start: start };

})();
