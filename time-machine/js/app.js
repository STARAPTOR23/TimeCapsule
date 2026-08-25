window.TimeMachine = window.TimeMachine || {};

(function () {

  const modeButtons = document.querySelectorAll('.mode-btn');
  const idleState = document.getElementById('idle-state');
  const timelineView = document.getElementById('timeline-view');

  const resultsView = document.getElementById('results-view');
  const resultsBackdrop = document.getElementById('results-backdrop');
  const resultsEyebrow = document.getElementById('results-eyebrow');
  const resultsTitle = document.getElementById('results-title');
  const resultsDescription = document.getElementById('results-description');
  const eventsList = document.getElementById('events-list');
  const cultureList = document.getElementById('culture-list');
  const factsList = document.getElementById('facts-list');
  const backBtn = document.getElementById('back-btn');

  // Short flavor text for the hero. Purely descriptive copy, separate from
  // the historical/cultural data in history.json.
  const ERA_INFO = {
    'theme-1970s': { label: '1970s — Vintage', description: 'Warm tones, bell-bottoms, and vinyl records — a decade that ran on analog.' },
    'theme-1980s': { label: '1980s — Retro Neon', description: 'Neon lights, synth-pop, and the first home computers lighting up living rooms.' },
    'theme-1990s': { label: '1990s — VHS / Pixel / Grunge', description: "Dial-up modems, grunge, and the early internet's chunky, colorful energy." },
    'theme-2000s': { label: '2000s — Early Internet / Glossy', description: 'Glossy interfaces, flip phones, and the web going mainstream.' },
    'theme-2010s': { label: '2010s — Minimal / Flat', description: 'Flat design, smartphones everywhere, and social media taking over.' },
    'theme-2020s': { label: '2020s — Modern / Futuristic', description: 'Dark mode, AI tools, and interfaces built to feel instant.' }
  };

  // Loaded once and cached — no need to re-fetch on every selection.
  let historyData = null;
  let historyLoadPromise = null;

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

  function showResults(mode, value, label) {
    loadHistoryData().then(function () {
      const themeClass = TimeMachine.getThemeClassForYear(value);
      const era = ERA_INFO[themeClass];
      const content = getContentFor(mode, value);

      resultsBackdrop.className = 'results-backdrop era-' + themeClass.replace('theme-', '');
      resultsEyebrow.textContent = era.label;
      resultsTitle.textContent = mode === 'year' ? 'WELCOME TO ' + value : 'EXPLORING THE ' + label.toUpperCase();
      resultsDescription.textContent = era.description;

      fillList(eventsList, content.events);
      fillList(cultureList, content.culture);
      fillList(factsList, content.funFacts);

      // Movie grid stays a placeholder — TMDB integration is the next stage.

      timelineView.hidden = true;
      resultsView.hidden = false;
      resultsView.scrollTop = 0;
    });
  }

  function selectMode(mode, activeBtn) {
    modeButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn === activeBtn);
    });

    idleState.hidden = true;
    resultsView.hidden = true;
    timelineView.hidden = false;

    TimeMachine.timeline.start(mode);
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectMode(btn.dataset.mode, btn);
    });
  });

  // Fired by timeline.js when the user confirms a year/decade selection.
  document.addEventListener('timeline:enter', function (e) {
    showResults(e.detail.mode, e.detail.value, e.detail.label);
  });

  backBtn.addEventListener('click', function () {
    resultsView.hidden = true;
    timelineView.hidden = false;
  });

  // Warm the cache as soon as the page loads, so the first selection
  // doesn't have to wait on the fetch.
  loadHistoryData();

})();
