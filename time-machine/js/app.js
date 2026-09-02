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
  // for the small cards, so nothing is ever defined twice. Each item
  // (event, movie, culture note, or fun fact) becomes its own small card
  // with an image slot, laid out in a horizontally-scrolling strip you
  // browse the same way as the year/decade timeline.

  function buildImageHTML(url, cardType, title) {
    if (url) return '<div class="card-expanded-image"><img src="' + url + '" alt="' + escapeHtml(title) + '"></div>';
    return '<div class="card-expanded-image"><!-- INSERT EXPANDED IMAGE HERE, e.g. <img src="assets/images/' + cardType + '.jpg" alt="' + title + '"> -->Image goes here</div>';
  }

  // Normalizes any of the four content types into a common shape so one
  // renderer can build sub-cards for all of them.
  function normalizeSubItems(cardType, rawItems) {
    if (cardType === 'events') {
      return rawItems.map(function (e) {
        return { image: e.image || '', title: e.event, meta: e.date ? formatDate(e.date) : '', link: e.wikipedia_url || '' };
      });
    }
    if (cardType === 'movies') {
      return rawItems.map(function (m) {
        const meta = [m.release_date ? formatDate(m.release_date) : '', m.country || ''].filter(Boolean).join(' · ');
        return { image: '', title: m.name, meta: meta, link: m.wikipedia_url || '' };
      });
    }
    // culture / funFacts: plain strings, no per-item image or link.
    return rawItems.map(function (text) {
      return { image: '', title: text, meta: '', link: '' };
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
      return (
        '<div class="expanded-subcard">' +
          '<div class="expanded-subcard-image">' + imgInner + '</div>' +
          '<div class="expanded-subcard-body">' +
            '<p class="expanded-subcard-title">' + titleInner + '</p>' +
            metaHtml +
          '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="expanded-strip cursor-target"><div class="expanded-strip-track">' + cards + '</div></div>';
  }

  // Lightweight horizontal-scroll behavior for the sub-card strip: wheel
  // scrolling and click-drag, same interaction family as the main timeline
  // but without its centering/scaling — this just needs to scroll.
  function initExpandedScroll(el) {
    el.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }, { passive: false });

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    el.addEventListener('pointerdown', function (e) {
      isDown = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    });
    el.addEventListener('pointerup', function () {
      isDown = false;
      el.classList.remove('dragging');
    });
    el.addEventListener('pointercancel', function () {
      isDown = false;
      el.classList.remove('dragging');
    });
  }

  function openExpandedCard(cardType) {
    const meta = CARD_META[cardType];
    const rawItems = cardType === 'events' ? currentContent.events
      : cardType === 'movies' ? currentContent.movies
      : currentContent[cardType];

    const items = normalizeSubItems(cardType, rawItems);
    const stripHtml = subCardsStripHTML(items, cardType);

    // Only the "events" type currently has a hero image (real data from
    // historicalEvent.json); the others show the placeholder + insertion
    // comment until you have images to drop in for them too.
    const heroImage = cardType === 'events' ? currentContent.eventsImage : '';

    expandedInner.innerHTML =
      buildImageHTML(heroImage, cardType, meta.title) +
      '<div class="card-expanded-header">' +
        '<p class="card-expanded-eyebrow">' + meta.eyebrow + '</p>' +
        '<h2 class="card-expanded-title">' + meta.title + '</h2>' +
      '</div>' +
      stripHtml;

    const stripEl = expandedInner.querySelector('.expanded-strip');
    if (stripEl) initExpandedScroll(stripEl);

    expandedOverlay.hidden = false;
    document.body.classList.add('modal-cursor-off');
  }

  function closeExpandedCard() {
    expandedOverlay.hidden = true;
    document.body.classList.remove('modal-cursor-off');
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
    document.body.classList.add('modal-cursor-off');

    showResults(mode, value, label);

    setTimeout(function () {
      tvTransition.classList.remove('playing');
      tvTransition.hidden = true;
      document.body.classList.remove('modal-cursor-off');
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

  // Warm the cache as soon as the page loads.
  loadAllData();

})();
