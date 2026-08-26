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
  const backBtn = document.getElementById('back-btn');

  const expandedOverlay = document.getElementById('card-expanded-overlay');
  const expandedInner = document.getElementById('card-expanded-inner');
  const expandedClose = document.getElementById('card-expanded-close');

  const tvTransition = document.getElementById('tv-transition');
  const tvYearEl = document.getElementById('tv-year');

  let lastMode = 'year';

  // Short flavor text for the results hero. Purely descriptive copy,
  // separate from the historical/cultural data in history.json.
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

  // Metadata for each card, used both for the small grid card and for
  // building the full-screen expanded view from the same data.
  const CARD_META = {
    events: { title: 'Historical Events', eyebrow: 'What happened' },
    culture: { title: 'Music & Culture', eyebrow: 'The sound & style' },
    funFacts: { title: 'Fun Facts', eyebrow: 'Did you know' },
    movies: { title: 'Movies', eyebrow: 'On screen' }
  };

  // Loaded once and cached — no need to re-fetch on every selection.
  let historyData = null;
  let historyLoadPromise = null;

  // The events/culture/funFacts arrays currently on screen, kept around so
  // the expanded-card overlay can reuse them without a second data lookup.
  let currentContent = { events: [], culture: [], funFacts: [] };

  function loadHistoryData() {
    if (historyLoadPromise) return historyLoadPromise;
    historyLoadPromise = fetch('data/history.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load history.json');
        return res.json();
      })
      .then(function (data) {
        historyData = data;
        return data;
      })
      .catch(function (err) {
        console.error('Could not load historical data:', err);
        historyData = { decades: {}, years: {} };
        return historyData;
      });
    return historyLoadPromise;
  }

  // Decade key like "1990s" from either a year (1995) or a decade start (1990).
  function decadeKeyFor(value) {
    return Math.floor(value / 10) * 10 + 's';
  }

  // Year-specific data wins when present; otherwise falls back to the
  // whole decade's content so every year always has something to show.
  function getContentFor(mode, value) {
    const decadeKey = decadeKeyFor(value);
    const decadeContent = (historyData.decades && historyData.decades[decadeKey]) || { events: [], culture: [], funFacts: [] };

    if (mode === 'decade') return decadeContent;

    const yearContent = historyData.years && historyData.years[String(value)];
    return yearContent || decadeContent;
  }

  function fillList(listEl, items) {
    listEl.innerHTML = '';
    (items || []).forEach(function (text) {
      const li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  // ---------- results page ----------

  function showResults(mode, value, label) {
    loadHistoryData().then(function () {
      const themeClass = TimeMachine.getThemeClassForYear(value);
      const era = ERA_INFO[themeClass];
      const content = getContentFor(mode, value);
      currentContent = content;

      resultsBackdrop.className = 'results-backdrop era-' + themeClass.replace('theme-', '');
      resultsEyebrow.textContent = era.label;
      resultsTitle.textContent = mode === 'year' ? 'WELCOME TO ' + value : 'EXPLORING THE ' + label.toUpperCase();
      resultsDescription.textContent = era.description;

      fillList(eventsList, content.events);
      fillList(cultureList, content.culture);
      fillList(factsList, content.funFacts);

      // Movie grid stays a placeholder — TMDB integration is a later stage.

      timelineView.hidden = true;
      directView.hidden = true;
      resultsView.hidden = false;
      resultsView.scrollTop = 0;
    });
  }

  // ---------- card expand / collapse ----------

  function openExpandedCard(cardType) {
    const meta = CARD_META[cardType];
    const items = cardType === 'movies' ? null : currentContent[cardType];

    let html = '';
    html += '<div class="card-expanded-image">';
    html += '<!-- INSERT EXPANDED IMAGE HERE, e.g. <img src="assets/images/' + cardType + '.jpg" alt="' + meta.title + '"> -->';
    html += 'Image goes here';
    html += '</div>';
    html += '<div class="card-expanded-body">';
    html += '<p class="card-expanded-eyebrow">' + meta.eyebrow + '</p>';
    html += '<h2 class="card-expanded-title">' + meta.title + '</h2>';

    if (items) {
      html += '<ul class="card-list large">';
      items.forEach(function (text) {
        html += '<li>' + text + '</li>';
      });
      html += '</ul>';
    } else {
      html += '<p class="movies-placeholder">Movie data arrives once TMDB is wired up in the next stage.</p>';
    }

    html += '</div>';

    expandedInner.innerHTML = html;
    expandedOverlay.hidden = false;
  }

  function closeExpandedCard() {
    expandedOverlay.hidden = true;
  }

  resultsGrid.addEventListener('click', function (e) {
    const card = e.target.closest('.result-card');
    if (card) openExpandedCard(card.dataset.cardType);
  });

  expandedClose.addEventListener('click', closeExpandedCard);

  expandedOverlay.addEventListener('click', function (e) {
    if (e.target === expandedOverlay) closeExpandedCard();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !expandedOverlay.hidden) closeExpandedCard();
  });

  // ---------- TV transition ----------
  // Plays for ~1.55s: pop in -> year flickers on -> zooms into the screen.
  // The results page is prepared underneath while it plays, so it's ready
  // the instant the TV is hidden again.

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

  function validateDirectYear(rawValue) {
    const trimmed = rawValue.trim();
    if (trimmed === '') return { valid: false, message: 'Please enter a year.' };

    const year = Number(trimmed);
    if (!Number.isInteger(year)) return { valid: false, message: 'Years must be a whole number, like 1995.' };
    if (year < MIN_YEAR || year > MAX_YEAR) {
      return { valid: false, message: 'Please pick a year between ' + MIN_YEAR + ' and ' + MAX_YEAR + '.' };
    }
    return { valid: true, year: year };
  }

  directForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const result = validateDirectYear(directInput.value);
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
  // timeline.js dispatches this same event for both year and decade mode.

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

  // Warm the cache as soon as the page loads.
  loadHistoryData();

})();
