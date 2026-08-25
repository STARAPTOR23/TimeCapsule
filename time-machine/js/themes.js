// Shared namespace so app.js and timeline.js can communicate without modules.
window.TimeMachine = window.TimeMachine || {};

(function () {
  // Existing 1970s–2020s theme classes are intentionally preserved.
  const RANGES = [
    { start: 1940, end: 1949, cls: 'theme-1940s' },
    { start: 1950, end: 1959, cls: 'theme-1950s' },
    { start: 1960, end: 1969, cls: 'theme-1960s' },
    { start: 1970, end: 1979, cls: 'theme-1970s' },
    { start: 1980, end: 1989, cls: 'theme-1980s' },
    { start: 1990, end: 1999, cls: 'theme-1990s' },
    { start: 2000, end: 2009, cls: 'theme-2000s' },
    { start: 2010, end: 2019, cls: 'theme-2010s' },
    { start: 2020, end: 2026, cls: 'theme-2020s' }
  ];

  function getThemeClassForYear(year) {
    const numericYear = Number(year);
    const match = RANGES.find(function (r) {
      return numericYear >= r.start && numericYear <= r.end;
    });
    return match ? match.cls : 'theme-2020s';
  }

  function applyBodyTheme(themeClass) {
    Array.from(document.body.classList).forEach(function (cls) {
      if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(themeClass);
  }

  TimeMachine.getThemeClassForYear = getThemeClassForYear;
  TimeMachine.applyBodyTheme = applyBodyTheme;
  TimeMachine.validMinYear = 1940;
  TimeMachine.validMaxYear = 2026;
})();
