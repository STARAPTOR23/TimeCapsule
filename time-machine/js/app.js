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
  const eventsCardImage = document.getElementById('events-card-image');
  const cultureList = document.getElementById('culture-list');
  const factsList = document.getElementById('facts-list');
  const movieGridEl = document.getElementById('movie-grid');
  const backBtn = document.getElementById('back-btn');

  const expandedOverlay = document.getElementById('card-expanded-overlay');
  const expandedInner = document.getElementById('card-expanded-inner');
  const expandedClose = document.getElementById('card-expanded-close');

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

  const CARD_META = {
    events: { title: 'Historical Events', eyebrow: 'What happened' },
    culture: { title: 'Music & Culture', eyebrow: 'The sound & style' },
    funFacts: { title: 'Fun Facts', eyebrow: 'Did you know' },
    movies: { title: 'Movies', eyebrow: 'On screen' }
  };

  // ---------- data loading ----------
  // Three sources: history.js (culture + fun facts, plus decade-level
  // fallback text for events), historicalEvent.js (real dated events, some
  // with images), and movie.js (real movie titles per year). Each is
  // loaded as a plain script (see index.html) into window.TimeMachineData
  // — not fetch() — so this keeps working when index.html is opened
  // directly via file://, with no server.

  let historyData = { decades: {}, years: {} };
  let eventsData = [];
  let moviesData = [];
  let dataReady = false;

  function loadAllData() {
    if (!dataReady) {
      const d = window.TimeMachineData || {};
      if (!d.history || !d.historicalEvent || !d.movie) {
        console.error('Historical data did not load — check that data/history.js, data/historicalEvent.js, and data/movie.js are present and loaded before js/app.js.');
      }
      historyData = d.history || { decades: {}, years: {} };
      eventsData = d.historicalEvent || [];
      moviesData = d.movie || [];
      dataReady = true;
    }
    return Promise.resolve();
  }

  function decadeOf(year) {
    return Math.floor(year / 10) * 10;
  }

  // Exact year match first; falls back to any entry from the same decade;
  // falls back again to the generic decade text from history.json so the
  // card is never empty.
  function getEventsFor(mode, value) {
    const decade = mode === 'decade' ? value : decadeOf(value);
    let matches = mode === 'year' ? eventsData.filter(function (e) { return e.year === value; }) : [];

    if (!matches.length) {
      matches = eventsData.filter(function (e) { return decadeOf(e.year) === decade; });
    }

    matches = matches.slice()
      .sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); })
      .slice(0, 8);

    if (!matches.length) {
      const decadeKey = decade + 's';
      const fallbackText = (historyData.decades[decadeKey] && historyData.decades[decadeKey].events) || [];
      matches = fallbackText.map(function (t) { return { event: t, date: '', image: '', wikipedia_url: '' }; });
    }

    return matches;
  }

  // Same idea, but movies has no decade-text fallback — if the dataset has
  // nothing for that period (e.g. pre-1960), the card just says so.
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

  function getCultureFactsFor(mode, value) {
    const decadeKey = (mode === 'decade' ? value : decadeOf(value)) + 's';
    const decadeContent = historyData.decades[decadeKey] || { culture: [], funFacts: [] };
    if (mode === 'decade') return decadeContent;
    return historyData.years[String(value)] || decadeContent;
  }

  // ---------- small helpers ----------

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  function setCardImage(containerEl, url, altText) {
    containerEl.innerHTML = url
      ? '<img src="' + url + '" alt="' + escapeHtml(altText) + '">'
      : '<span class="card-image-placeholder">Image goes here</span>';
  }

  // ---------- filling the small grid cards ----------

  function fillTextList(listEl, items) {
    listEl.innerHTML = '';
    (items || []).forEach(function (text) {
      const li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  function fillEventsList(listEl, items) {
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

  // ---------- results page ----------

  let currentContent = { events: [], movies: [], culture: [], funFacts: [], eventsImage: '' };

  function showResults(mode, value, label) {
    loadAllData().then(function () {
      const themeClass = TimeMachine.getThemeClassForYear(value);
      const era = ERA_INFO[themeClass];

      const events = getEventsFor(mode, value);
      const movies = getMoviesFor(mode, value);
      const cultureFacts = getCultureFactsFor(mode, value);
      const eventsImage = (events.find(function (e) { return e.image; }) || {}).image || '';

      currentContent = {
        events: events,
        movies: movies,
        culture: cultureFacts.culture || [],
        funFacts: cultureFacts.funFacts || [],
        eventsImage: eventsImage
      };

      resultsBackdrop.className = 'results-backdrop era-' + themeClass.replace('theme-', '');
      resultsEyebrow.textContent = era.label;
      resultsTitle.textContent = mode === 'year' ? 'WELCOME TO ' + value : 'EXPLORING THE ' + label.toUpperCase();
      resultsDescription.textContent = era.description;

      fillEventsList(eventsList, events);
      fillTextList(cultureList, currentContent.culture);
      fillTextList(factsList, currentContent.funFacts);
      fillMoviesGrid(movieGridEl, movies);
      setCardImage(eventsCardImage, eventsImage, 'Historical events');

      timelineView.hidden = true;
      directView.hidden = true;
      resultsView.hidden = false;
      resultsView.scrollTop = 0;
    });
  }

  // ---------- card expand / collapse ----------
  // Builds the full-screen view from the exact same currentContent used
  // for the small cards, so nothing is ever defined twice.

  function buildImageHTML(url, cardType, title) {
    if (url) return '<div class="card-expanded-image"><img src="' + url + '" alt="' + escapeHtml(title) + '"></div>';
    return '<div class="card-expanded-image"><!-- INSERT EXPANDED IMAGE HERE, e.g. <img src="assets/images/' + cardType + '.jpg" alt="' + title + '"> -->Image goes here</div>';
  }

  function eventsListHTML(items) {
    if (!items.length) return '<p class="movies-placeholder">No recorded events for this period yet.</p>';
    return '<ul class="card-list large">' + items.map(function (item) {
      const dateStr = item.date ? ' <span class="card-list-meta">— ' + formatDate(item.date) + '</span>' : '';
      const inner = item.wikipedia_url
        ? '<a class="card-link" href="' + item.wikipedia_url + '" target="_blank" rel="noopener">' + escapeHtml(item.event) + '</a>'
        : escapeHtml(item.event);
      return '<li>' + inner + dateStr + '</li>';
    }).join('') + '</ul>';
  }

  function moviesListHTML(items) {
    if (!items.length) return '<p class="movies-placeholder">No movies from this period in the dataset yet.</p>';
    return '<div class="movie-grid large">' + items.map(function (m) {
      const meta = [m.release_date ? formatDate(m.release_date) : '', m.country || ''].filter(Boolean).join(' · ');
      const titleHtml = m.wikipedia_url
        ? '<a class="movie-mini-title" href="' + m.wikipedia_url + '" target="_blank" rel="noopener">' + escapeHtml(m.name) + '</a>'
        : '<span class="movie-mini-title">' + escapeHtml(m.name) + '</span>';
      return '<div class="movie-mini">' + titleHtml + '<p class="movie-mini-meta">' + escapeHtml(meta) + '</p></div>';
    }).join('') + '</div>';
  }

  function textListHTML(items) {
    if (!items.length) return '<p class="movies-placeholder">Nothing recorded for this period yet.</p>';
    return '<ul class="card-list large">' + items.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') + '</ul>';
  }

  function openExpandedCard(cardType) {
    const meta = CARD_META[cardType];
    let bodyHtml;
    let imageHtml;

    if (cardType === 'events') {
      bodyHtml = eventsListHTML(currentContent.events);
      imageHtml = buildImageHTML(currentContent.eventsImage, cardType, meta.title);
    } else if (cardType === 'movies') {
      bodyHtml = moviesListHTML(currentContent.movies);
      imageHtml = buildImageHTML('', cardType, meta.title);
    } else {
      bodyHtml = textListHTML(currentContent[cardType]);
      imageHtml = buildImageHTML('', cardType, meta.title);
    }

    expandedInner.innerHTML =
      imageHtml +
      '<div class="card-expanded-body">' +
      '<p class="card-expanded-eyebrow">' + meta.eyebrow + '</p>' +
      '<h2 class="card-expanded-title">' + meta.title + '</h2>' +
      bodyHtml +
      '</div>';

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
  loadAllData();

})();
