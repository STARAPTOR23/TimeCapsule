// Shared namespace so app.js, timeline.js and themes.js can talk to each
// other without ES modules (plain <script> tags work when opening index.html
// directly via file:// — modules get blocked by CORS in that case).
window.TimeMachine = window.TimeMachine || {};

(function () {

  const RANGES = [
    { start: 1970, end: 1979, cls: 'theme-1970s' },
    { start: 1980, end: 1989, cls: 'theme-1980s' },
    { start: 1990, end: 1999, cls: 'theme-1990s' },
    { start: 2000, end: 2009, cls: 'theme-2000s' },
    { start: 2010, end: 2019, cls: 'theme-2010s' },
    { start: 2020, end: 2029, cls: 'theme-2020s' }
  ];

  // Works for both individual years (1995) and decade-start years (1990).
  function getThemeClassForYear(year) {
    const match = RANGES.find(function (r) {
      return year >= r.start && year <= r.end;
    });
    if (match) return match.cls;
    return year < RANGES[0].start ? RANGES[0].cls : RANGES[RANGES.length - 1].cls;
  }

  function applyBodyTheme(themeClass) {
    Array.from(document.body.classList).forEach(function (cls) {
      if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(themeClass);
  }

  TimeMachine.getThemeClassForYear = getThemeClassForYear;
  TimeMachine.applyBodyTheme = applyBodyTheme;

})();
