window.TimeMachine = window.TimeMachine || {};

(function () {
  const modeButtons = document.querySelectorAll('.mode-btn');
  const idleState = document.getElementById('idle-state');
  const timelineView = document.getElementById('timeline-view');
  const directSearch = document.getElementById('direct-search');
  const yearInput = document.getElementById('year-input');
  const directExplore = document.getElementById('direct-explore');
  const inputError = document.getElementById('input-error');
  const resultsView = document.getElementById('results-view');
  const resultsBackdrop = document.getElementById('results-backdrop');
  const resultsEyebrow = document.getElementById('results-eyebrow');
  const resultsTitle = document.getElementById('results-title');
  const resultsDescription = document.getElementById('results-description');
  const eventsList = document.getElementById('events-list');
  const cultureList = document.getElementById('culture-list');
  const factsList = document.getElementById('facts-list');
  const backBtn = document.getElementById('back-btn');
  const tvTransition = document.getElementById('tv-transition');
  const tvYear = document.getElementById('tv-year');

  const ERA_INFO = {
    'theme-1940s': { label: '1940s — Film Noir', description: 'A wartime decade of radio, black-and-white cinema, swing, and dramatic change.' },
    'theme-1950s': { label: '1950s — Atomic Age', description: 'Post-war optimism, television, diners, rock and roll, and the dawn of the space age.' },
    'theme-1960s': { label: '1960s — Space Age / Psychedelic', description: 'A decade of cultural revolution, moonshots, counterculture, and bold new design.' },
    'theme-1970s': { label: '1970s — Vintage', description: 'Warm tones, bell-bottoms, and vinyl records — a decade that ran on analog.' },
    'theme-1980s': { label: '1980s — Retro Neon', description: 'Neon lights, synth-pop, and the first home computers lighting up living rooms.' },
    'theme-1990s': { label: '1990s — VHS / Pixel / Grunge', description: "Dial-up modems, grunge, and the early internet's chunky, colorful energy." },
    'theme-2000s': { label: '2000s — Early Internet / Glossy', description: 'Glossy interfaces, flip phones, and the web going mainstream.' },
    'theme-2010s': { label: '2010s — Minimal / Flat', description: 'Flat design, smartphones everywhere, and social media taking over.' },
    'theme-2020s': { label: '2020s — Modern / Futuristic', description: 'Dark mode, AI tools, and interfaces built to feel instant.' }
  };

  let historyData = null;
  let historyLoadPromise = null;

  function loadHistoryData() {
    if (historyLoadPromise) return historyLoadPromise;
    historyLoadPromise = fetch('data/history.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load history.json');
        return res.json();
      })
      .then(function (data) { historyData = data; return data; })
      .catch(function (err) {
        console.error('Could not load historical data:', err);
        historyData = { decades: {}, years: {} };
        return historyData;
      });
    return historyLoadPromise;
  }

  function decadeKeyFor(value) { return Math.floor(value / 10) * 10 + 's'; }

  function getContentFor(mode, value) {
    const decadeKey = decadeKeyFor(value);
    const decadeContent = (historyData.decades && historyData.decades[decadeKey]) || { events: [], culture: [], funFacts: [] };
    if (mode === 'decade') return decadeContent;
    return (historyData.years && historyData.years[String(value)]) || decadeContent;
  }

  function fillList(listEl, items) {
    listEl.innerHTML = '';
    (items || []).forEach(function (text) {
      const li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  function isValidYear(value) {
    const year = Number(value);
    return Number.isInteger(year) && year >= TimeMachine.validMinYear && year <= TimeMachine.validMaxYear;
  }

  function clearViews() {
    idleState.hidden = true;
    timelineView.hidden = true;
    directSearch.hidden = true;
    resultsView.hidden = true;
  }

  function selectMode(mode, activeBtn) {
    modeButtons.forEach(function (btn) { btn.classList.toggle('active', btn === activeBtn); });
    clearViews();
    if (mode === 'direct') {
      directSearch.hidden = false;
      yearInput.focus();
      return;
    }
    timelineView.hidden = false;
    TimeMachine.timeline.start(mode);
  }

  function showTvTransition(mode, value, label) {
    const themeClass = TimeMachine.getThemeClassForYear(value);
    TimeMachine.applyBodyTheme(themeClass);
    tvYear.textContent = mode === 'year' || mode === 'direct' ? value : label;
    tvTransition.className = 'tv-transition';
    tvTransition.hidden = false;
    void tvTransition.offsetWidth;
    tvTransition.classList.add('play');

    setTimeout(function () {
      showResults(mode, value, label);
      setTimeout(function () { tvTransition.classList.add('close'); }, 80);
      setTimeout(function () {
        tvTransition.hidden = true;
        tvTransition.className = 'tv-transition';
      }, 650);
    }, 1450);
  }

  function showResults(mode, value, label) {
    loadHistoryData().then(function () {
      const themeClass = TimeMachine.getThemeClassForYear(value);
      const era = ERA_INFO[themeClass];
      const content = getContentFor(mode, value);

      resultsBackdrop.className = 'results-backdrop bg-layer era-' + themeClass.replace('theme-', '');
      resultsEyebrow.textContent = era.label;
      resultsTitle.textContent = mode === 'year' || mode === 'direct' ? 'WELCOME TO ' + value : 'EXPLORING THE ' + label.toUpperCase();
      resultsDescription.textContent = era.description;
      fillList(eventsList, content.events);
      fillList(cultureList, content.culture);
      fillList(factsList, content.funFacts);

      timelineView.hidden = true;
      directSearch.hidden = true;
      resultsView.hidden = false;
      resultsView.scrollTop = 0;
    });
  }

  function exploreDirectYear() {
    const value = Number(yearInput.value);
    inputError.textContent = '';
    if (!isValidYear(value)) {
      inputError.textContent = 'Please enter a whole year from 1940 to 2026.';
      yearInput.focus();
      return;
    }
    modeButtons.forEach(function (btn) { btn.classList.toggle('active', btn.dataset.mode === 'direct'); });
    showTvTransition('direct', value, String(value));
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { selectMode(btn.dataset.mode, btn); });
  });

  directExplore.addEventListener('click', exploreDirectYear);
  yearInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') exploreDirectYear(); });

  document.addEventListener('timeline:enter', function (e) {
    showTvTransition(e.detail.mode, e.detail.value, e.detail.label);
  });

  backBtn.addEventListener('click', function () {
    resultsView.hidden = true;
    idleState.hidden = false;
    modeButtons.forEach(function (btn) { btn.classList.remove('active'); });
  });

  loadHistoryData();
})();
