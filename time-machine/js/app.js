window.TimeMachine = window.TimeMachine || {};

(function () {

  const MIN_YEAR = 1940;
  const MAX_YEAR = 2026;

  const modeButtons = document.querySelectorAll('.mode-btn');
  const idleState = document.getElementById('idle-state');
  const timelineView = document.getElementById('timeline-view');

  const directView = document.getElementById('direct-view');
  const directForm = document.getElementById('direct-form');
  const directInput = document.getElementById('direct-year-input');
  const directError = document.getElementById('direct-error');

  const resultsView = document.getElementById('results-view');
  const resultsBackdrop = document.getElementById('results-backdrop');
  const resultsEyebrow = document.getElementById('results-eyebrow');
  const resultsTitle = document.getElementById('results-title');
  const resultsDescription = document.getElementById('results-description');
  const resultsGrid = document.getElementById('results-grid');
  const eventsList = document.getElementById('events-list');
  const cultureList = document.getElementById('culture-list');
  const factsList = document.getElementById('facts-list');
  const movieGridEl = document.getElementById('movie-grid');
  const backBtn = document.getElementById('back-btn');

  const yearNavRow = document.getElementById('year-nav-row');
  const navMinus10 = document.getElementById('nav-minus-10');
  const navMinus1 = document.getElementById('nav-minus-1');
  const navPlus1 = document.getElementById('nav-plus-1');
  const navPlus10 = document.getElementById('nav-plus-10');

  const expandedOverlay = document.getElementById('card-expanded-overlay');
  const expandedInner = document.getElementById('card-expanded-inner');
  const expandedClose = document.getElementById('card-expanded-close');

  const specialErrorScreen = document.getElementById('special-error-screen');
  const specialErrorMessage = document.getElementById('special-error-message');
  const specialErrorBack = document.getElementById('special-error-back');

  const tvTransition = document.getElementById('tv-transition');
  const tvYearEl = document.getElementById('tv-year');

  let lastMode = 'year';

  // Short flavor text for the results hero. Purely descriptive copy,
  // separate from the historical/cultural data in the JSON files.
  const ERA_INFO = {
    'theme-1940s': { label: '1940s — Film Noir', description: 'Venetian-blind shadows, a single spotlight, and a world seen in stark black and white.' },
    'theme-1950s': { label: '1950s — Atomic Age', description: 'Starburst clocks, chrome tailfins, and the optimism of the atomic age.' },
    'theme-1960s': { label: '1960s — Space Age', description: 'Starfields, chrome, and a decade racing toward the cosmos.' },
    'theme-1970s': { label: '1970s — Vintage', description: 'Warm tones, bell-bottoms, and vinyl records — a decade that ran on analog.' },
    'theme-1980s': { label: '1980s — Neon / Synthwave', description: 'Neon grids, synth-pop, and a skyline lit up like an arcade cabinet.' },
    'theme-1990s': { label: '1990s — VHS / Grunge', description: 'Tracking lines, dial-up modems, and the gritty energy of early alt culture.' },
    'theme-2000s': { label: '2000s — Y2K / Frutiger Aero', description: 'Glossy bubbles, aqua gradients, and the shiny optimism of the early web.' },
    'theme-2010s': { label: '2010s — Flat Design / Social Media', description: 'Flat colors, endless feeds, and interfaces built for the smartphone.' },
    'theme-2020s': { label: '2020s — Minimalism', description: 'Quiet interfaces, muted tones, and design that gets out of the way.' }
  };

  // gif: the fixed category banner used at the top of both the compact
  // card and the expanded overlay — a consistent branded image per
  // section, rather than an unpredictable per-item photo.
  const CARD_META = {
    events: { title: 'Historical Events', eyebrow: 'What happened', gif: 'assets/images/card-events.gif' },
    culture: { title: 'Music & Culture', eyebrow: 'The sound & style', gif: 'assets/images/card-culture.gif' },
    funFacts: { title: 'Fun Facts', eyebrow: 'Did you know', gif: 'assets/images/card-facts.gif' },
    movies: { title: 'Movies', eyebrow: 'On screen', gif: 'assets/images/card-movies.gif' }
  };


  // Four datasets, loaded as plain <script> tags into window.TimeMachineData
  // (see index.html) rather than fetch() — so the site keeps working when
  // index.html is opened directly via file://, with no local server. The
  // matching .json files sit alongside the .js ones in data/ as the source
  // of truth / for editing; only the .js versions are actually loaded.

  const d = window.TimeMachineData || {};
  const eventsData = d.events || [];
  const cultureData = d.culture || [];
  const factsData = d.facts || [];
  const moviesData = d.movies || [];

  if (!d.events || !d.culture || !d.facts || !d.movies) {
    console.error('Historical data did not load — check that data/historicalEvent.js, data/music___culture.js, data/fun_fact.js, and data/movie.js are present and loaded before js/app.js.');
  }

  function decadeOf(year) {
    return Math.floor(year / 10) * 10;
  }

  // Shared lookup for events/culture/facts, which all use the same
  // { event, date, year, image, wikipedia_url } shape: exact year match
  // first, falling back to any entry from the same decade.
  function getItemsFor(dataset, mode, value, limit) {
    const decade = mode === 'decade' ? value : decadeOf(value);
    let matches = mode === 'year' ? dataset.filter(function (item) { return item.year === value; }) : [];

    if (!matches.length) {
      matches = dataset.filter(function (item) { return decadeOf(item.year) === decade; });
    }

    return matches.slice()
      .sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); })
      .slice(0, limit);
  }

  // Same idea, different shape — sorts by release_date instead of date.
  function getMoviesFor(mode, value) {
    const decade = mode === 'decade' ? value : decadeOf(value);
    let matches = mode === 'year' ? moviesData.filter(function (m) { return m.year === value; }) : [];

    if (!matches.length) {
      matches = moviesData.filter(function (m) { return decadeOf(m.year) === decade; });
    }

    return matches.slice()
      .sort(function (a, b) { return (a.release_date || '').localeCompare(b.release_date || ''); })
      .slice(0, 6);
  }

  // ---------- small helpers ----------

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d2 = new Date(iso + 'T00:00:00Z');
    if (isNaN(d2)) return iso;
    return d2.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // Slowly scrolls a panel back and forth so its content is visible without
  // needing a visible scrollbar, pauses the instant the user hovers,
  // wheels, or drags it, and resumes a little while after they stop.
  // Works for either axis and coexists with real <a> links inside — a
  // gesture that starts on a link is left alone entirely so the browser's
  // native click/navigation isn't disturbed.
  function initAutoScroll(el, axis) {
    const vertical = axis === 'vertical';
    const SPEED = 16;          // px / second
    const EDGE_PAUSE = 900;    // ms to sit at each end before reversing
    const RESUME_DELAY = 1400; // ms of inactivity before auto-scroll resumes

    let direction = 1;
    let paused = false;
    let pauseUntil = 0;
    let lastTime = null;
    let resumeTimer = null;
    let rafId = null;

    function maxScroll() {
      return vertical ? (el.scrollHeight - el.clientHeight) : (el.scrollWidth - el.clientWidth);
    }
    function getScroll() { return vertical ? el.scrollTop : el.scrollLeft; }
    function setScroll(v) { if (vertical) el.scrollTop = v; else el.scrollLeft = v; }

    function tick(time) {
      rafId = requestAnimationFrame(tick);
      const max = maxScroll();
      if (max <= 2 || paused || time < pauseUntil) { lastTime = null; return; }
      if (lastTime === null) { lastTime = time; return; }

      const dt = (time - lastTime) / 1000;
      lastTime = time;

      let next = getScroll() + direction * SPEED * dt;
      if (next >= max) { next = max; direction = -1; pauseUntil = time + EDGE_PAUSE; }
      else if (next <= 0) { next = 0; direction = 1; pauseUntil = time + EDGE_PAUSE; }
      setScroll(next);
    }

    function pause() {
      paused = true;
      clearTimeout(resumeTimer);
    }
    function scheduleResume(delay) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; lastTime = null; }, delay);
    }

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', function () { scheduleResume(400); });
    el.addEventListener('wheel', function () { pause(); scheduleResume(RESUME_DELAY); }, { passive: true });

    let isDown = false;
    let startPos = 0;
    let startScroll = 0;
    let dragDistance = 0;

    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a')) return; // let link clicks through undisturbed
      isDown = true;
      dragDistance = 0;
      startPos = vertical ? e.clientY : e.clientX;
      startScroll = getScroll();
      pause();
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      const pos = vertical ? e.clientY : e.clientX;
      const delta = pos - startPos;
      dragDistance = Math.max(dragDistance, Math.abs(delta));
      setScroll(startScroll - delta);
    });
    function endDrag() {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('dragging');
      scheduleResume(RESUME_DELAY);
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    rafId = requestAnimationFrame(tick);

    return {
      wasDragging: function () { return dragDistance > 6; },
      resetScroll: function () { setScroll(0); lastTime = null; },
      stop: function () { cancelAnimationFrame(rafId); }
    };
  }

  // ---------- filling the small grid cards ----------
  // Note: card banners (the .card-image at the top of each card) are fixed
  // GIFs set directly in index.html — no longer generated from data.

  function fillItemsList(listEl, items) {
    listEl.innerHTML = '';
    items.forEach(function (item) {
      const li = document.createElement('li');
      if (item.wikipedia_url) {
        const a = document.createElement('a');
        a.href = item.wikipedia_url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'card-link';
        a.textContent = item.event;
        li.appendChild(a);
      } else {
        li.textContent = item.event;
      }
      if (item.date) {
        const meta = document.createElement('span');
        meta.className = 'card-list-meta';
        meta.textContent = ' — ' + formatDate(item.date);
        li.appendChild(meta);
      }
      listEl.appendChild(li);
    });
  }

  function fillMoviesGrid(containerEl, items) {
    containerEl.innerHTML = '';
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'movies-placeholder';
      p.textContent = 'No movies from this period in the dataset yet.';
      containerEl.appendChild(p);
      return;
    }
    items.forEach(function (m) {
      const card = document.createElement('div');
      card.className = 'movie-mini';

      if (m.image) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'movie-mini-image';
        const img = document.createElement('img');
        img.src = m.image;
        img.alt = m.name;
        imgWrap.appendChild(img);
        card.appendChild(imgWrap);
      }

      const title = document.createElement('a');
      title.className = 'movie-mini-title';
      title.href = m.wikipedia_url || '#';
      title.target = '_blank';
      title.rel = 'noopener';
      title.textContent = m.name;

      const meta = document.createElement('p');
      meta.className = 'movie-mini-meta';
      meta.textContent = [m.release_date ? formatDate(m.release_date) : '', m.country || ''].filter(Boolean).join(' · ');

      card.appendChild(title);
      card.appendChild(meta);
      containerEl.appendChild(card);
    });
  }

  // Auto-scroll runs on the same four .card-body panels for the whole
  // session — only their contents change between selections, not the
  // elements themselves — so this only needs to happen once.
  const cardBodyScrollers = Array.from(document.querySelectorAll('.card-body')).map(function (el) {
    return initAutoScroll(el, 'vertical');
  });

  // ---------- results page ----------

  let currentContent = { events: [], movies: [], culture: [], funFacts: [] };
  let currentMode = 'year';
  let currentValue = null;

  function updateYearNav() {
    const isYear = currentMode === 'year';
    yearNavRow.classList.toggle('is-year', isYear);
    navMinus10.hidden = !isYear;
    navMinus1.hidden = !isYear;
    navPlus1.hidden = !isYear;
    navPlus10.hidden = !isYear;
    if (!isYear) return;
    navMinus10.disabled = currentValue - 10 < MIN_YEAR;
    navMinus1.disabled = currentValue - 1 < MIN_YEAR;
    navPlus1.disabled = currentValue + 1 > MAX_YEAR;
    navPlus10.disabled = currentValue + 10 > MAX_YEAR;
  }

  function jumpYears(delta) {
    if (currentMode !== 'year' || currentValue === null) return;
    const newYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, currentValue + delta));
    if (newYear === currentValue) return;
    showResults('year', newYear, String(newYear));
  }

  navMinus10.addEventListener('click', function () { jumpYears(-10); });
  navMinus1.addEventListener('click', function () { jumpYears(-1); });
  navPlus1.addEventListener('click', function () { jumpYears(1); });
  navPlus10.addEventListener('click', function () { jumpYears(10); });

  function showResults(mode, value, label) {
    const themeClass = TimeMachine.getThemeClassForYear(value);
    const era = ERA_INFO[themeClass];

    const events = getItemsFor(eventsData, mode, value, 8);
    const culture = getItemsFor(cultureData, mode, value, 8);
    const funFacts = getItemsFor(factsData, mode, value, 8);
    const movies = getMoviesFor(mode, value);

    currentContent = { events: events, culture: culture, funFacts: funFacts, movies: movies };
    currentMode = mode;
    currentValue = value;

    resultsBackdrop.className = 'results-backdrop era-' + themeClass.replace('theme-', '');
    resultsEyebrow.textContent = era.label;
    resultsTitle.textContent = mode === 'year' ? 'WELCOME TO ' + value : 'EXPLORING THE ' + label.toUpperCase();
    resultsDescription.textContent = era.description;

    fillItemsList(eventsList, events);
    fillItemsList(cultureList, culture);
    fillItemsList(factsList, funFacts);
    fillMoviesGrid(movieGridEl, movies);
    cardBodyScrollers.forEach(function (s) { s.resetScroll(); });
    updateYearNav();

    timelineView.hidden = true;
    directView.hidden = true;
    resultsView.hidden = false;
    resultsView.scrollTop = 0;
  }

  // ---------- card expand / collapse ----------
  // Builds the full-screen view from the exact same currentContent used
  // for the small cards, so nothing is ever defined twice. Each item
  // (event, movie, culture note, or fun fact) becomes its own small card
  // with an image slot, laid out in a horizontally-scrolling strip you
  // browse the same way as the year/decade timeline.

  // Normalizes any of the four content types into a common shape so one
  // renderer can build sub-cards for all of them. events/culture/facts
  // share one schema; movies has its own but now includes images too.
  function normalizeSubItems(cardType, rawItems) {
    if (cardType === 'movies') {
      return rawItems.map(function (m) {
        const meta = [m.release_date ? formatDate(m.release_date) : '', m.country || ''].filter(Boolean).join(' · ');
        return { image: m.image || '', title: m.name, meta: meta, link: m.wikipedia_url || '' };
      });
    }
    return rawItems.map(function (item) {
      return { image: item.image || '', title: item.event, meta: item.date ? formatDate(item.date) : '', link: item.wikipedia_url || '' };
    });
  }

  function subCardsStripHTML(items, cardType) {
    if (!items.length) {
      return '<p class="movies-placeholder">Nothing recorded for this period yet.</p>';
    }
    const cards = items.map(function (it) {
      const imgInner = it.image
        ? '<img src="' + it.image + '" alt="' + escapeHtml(it.title) + '">'
        : '<!-- INSERT IMAGE HERE, e.g. <img src="assets/images/' + cardType + '.jpg" alt=""> --><span class="card-image-placeholder">Image goes here</span>';
      const titleInner = it.link
        ? '<a class="card-link" href="' + it.link + '" target="_blank" rel="noopener">' + escapeHtml(it.title) + '</a>'
        : escapeHtml(it.title);
      const metaHtml = it.meta ? '<p class="expanded-subcard-meta">' + escapeHtml(it.meta) + '</p>' : '';
      // data-link lets clicking anywhere on the card (e.g. the image) open
      // the same URL as the title link — see the click handler below.
      const linkAttr = it.link ? ' data-link="' + escapeHtml(it.link) + '"' : '';
      return (
        '<div class="expanded-subcard"' + linkAttr + '>' +
          '<div class="expanded-subcard-image">' + imgInner + '</div>' +
          '<div class="expanded-subcard-body">' +
            '<p class="expanded-subcard-title">' + titleInner + '</p>' +
            metaHtml +
          '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="expanded-strip"><div class="expanded-strip-track">' + cards + '</div></div>';
  }

  function openExpandedCard(cardType) {
    const meta = CARD_META[cardType];
    const rawItems = cardType === 'events' ? currentContent.events
      : cardType === 'movies' ? currentContent.movies
      : currentContent[cardType];

    const items = normalizeSubItems(cardType, rawItems);
    const stripHtml = subCardsStripHTML(items, cardType);

    expandedInner.innerHTML =
      '<div class="card-expanded-image"><img src="' + meta.gif + '" alt="' + escapeHtml(meta.title) + '"></div>' +
      '<div class="card-expanded-header">' +
        '<p class="card-expanded-eyebrow">' + meta.eyebrow + '</p>' +
        '<h2 class="card-expanded-title">' + meta.title + '</h2>' +
      '</div>' +
      stripHtml;

    const stripEl = expandedInner.querySelector('.expanded-strip');
    if (stripEl) {
      const scroller = initAutoScroll(stripEl, 'horizontal');

      // Clicking a sub-card (its image, meta text, or padding — anywhere
      // that isn't the title link, which already navigates on its own)
      // opens the same URL. Suppressed after a genuine drag so scrolling
      // the strip doesn't accidentally open a new tab.
      stripEl.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        if (scroller.wasDragging()) return;
        const card = e.target.closest('.expanded-subcard');
        if (card && card.dataset.link) {
          window.open(card.dataset.link, '_blank', 'noopener');
        }
      });
    }

    expandedOverlay.hidden = false;
  }

  function closeExpandedCard() {
    expandedOverlay.hidden = true;
  }

  resultsGrid.addEventListener('click', function (e) {
    const card = e.target.closest('.result-card');
    // Let clicks on real links (event/movie titles) navigate normally
    // instead of opening the expanded overlay.
    if (card && !e.target.closest('a')) openExpandedCard(card.dataset.cardType);
  });

  expandedClose.addEventListener('click', closeExpandedCard);

  expandedOverlay.addEventListener('click', function (e) {
    if (e.target === expandedOverlay) closeExpandedCard();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !expandedOverlay.hidden) closeExpandedCard();
  });

  // ---------- TV transition ----------

  function playTvTransition(mode, value, label) {
    tvYearEl.textContent = mode === 'year' ? value : label;

    tvTransition.hidden = false;
    tvTransition.classList.remove('playing');
    void tvTransition.offsetWidth; // force reflow so the animation restarts every time
    tvTransition.classList.add('playing');

    showResults(mode, value, label);

    setTimeout(function () {
      tvTransition.classList.remove('playing');
      tvTransition.hidden = true;
    }, 1550);
  }

  // ---------- mode switching ----------

  function selectMode(mode, activeBtn) {
    lastMode = mode;

    modeButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn === activeBtn);
    });

    idleState.hidden = true;
    resultsView.hidden = true;
    tvTransition.hidden = true;
    tvTransition.classList.remove('playing');
    specialErrorScreen.hidden = true;

    if (mode === 'direct') {
      timelineView.hidden = true;
      directView.hidden = false;
      directError.textContent = '';
      directInput.value = '';
      directInput.focus();
    } else {
      directView.hidden = true;
      timelineView.hidden = false;
      TimeMachine.timeline.start(mode);
    }
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectMode(btn.dataset.mode, btn);
    });
  });

  // ---------- direct year entry ----------

  // Only digits, capped at 4 characters, enforced live as you type —
  // maxlength alone doesn't stop pasted letters, and type="number" inputs
  // have their own quirks (e/E, scientific notation, no real maxlength).
  directInput.addEventListener('input', function () {
    directInput.value = directInput.value.replace(/\D/g, '').slice(0, 4);
  });

  function validateDirectYear(rawValue) {
    const trimmed = rawValue.trim();

    if (trimmed === '') return { valid: false, message: 'Please enter a year.' };
    if (!/^\d{4}$/.test(trimmed)) return { valid: false, message: 'Enter exactly 4 digits, like 1995.' };

    const year = Number(trimmed);
    if (year < MIN_YEAR) return { valid: false, special: 'past' };
    if (year > MAX_YEAR) return { valid: false, special: 'future' };
    return { valid: true, year: year };
  }

  function showSpecialError(message) {
    specialErrorMessage.textContent = message;
    directView.hidden = true;
    specialErrorScreen.hidden = false;
  }

  specialErrorBack.addEventListener('click', function () {
    specialErrorScreen.hidden = true;
    directView.hidden = false;
    directInput.value = '';
    directError.textContent = '';
    directInput.focus();
  });

  directForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const result = validateDirectYear(directInput.value);

    if (result.special === 'past') return showSpecialError("We can't dig too deep in the past.");
    if (result.special === 'future') return showSpecialError('Nobody knows the Future.');
    if (!result.valid) {
      directError.textContent = result.message;
      return;
    }

    directError.textContent = '';
    document.dispatchEvent(new CustomEvent('timeline:enter', {
      detail: { mode: 'year', value: result.year, label: String(result.year) }
    }));
  });

  // ---------- entering from the timeline (year or decade) ----------

  document.addEventListener('timeline:enter', function (e) {
    playTvTransition(e.detail.mode, e.detail.value, e.detail.label);
  });

  backBtn.addEventListener('click', function () {
    resultsView.hidden = true;
    if (lastMode === 'direct') {
      directView.hidden = false;
    } else {
      timelineView.hidden = false;
    }
  });

})();
