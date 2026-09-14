// Shared namespace so app.js, timeline.js and themes.js can talk to each
// other without ES modules (plain <script> tags work when opening index.html
// directly via file:// — modules get blocked by CORS in that case).
window.TimeMachine = window.TimeMachine || {};

(function () {

  const RANGES = [
    { start: 1940, end: 1949, cls: 'theme-1940s' },
    { start: 1950, end: 1959, cls: 'theme-1950s' },
    { start: 1960, end: 1969, cls: 'theme-1960s' },
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

  // Lets other modules (currently just the music player) react whenever the
  // active era changes, without themes.js needing to know they exist.
  // Subscribers are called with the theme class every time applyBodyTheme
  // runs — including repeats, so a subscriber that only cares about actual
  // changes should de-dupe on its own (the music player does, since
  // switching "sections" only makes sense when the section actually changes).
  const themeChangeSubscribers = [];

  function onThemeChange(callback) {
    themeChangeSubscribers.push(callback);
  }

  function applyBodyTheme(themeClass) {
    Array.from(document.body.classList).forEach(function (cls) {
      if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    document.body.classList.add(themeClass);
    themeChangeSubscribers.forEach(function (cb) { cb(themeClass); });
  }

  // A couple of eras get a looping video backdrop instead of (well, behind)
  // the usual CSS pattern. Shared here so both the timeline crossfade and
  // the results-page backdrop can inject the same <video> for a given era
  // without duplicating the file paths in two places.
  const ERA_VIDEO = {
    'theme-1940s': 'assets/video/film-bg.mp4',
    'theme-1950s': 'assets/video/atomic-bg.mp4',
    'theme-1960s': 'assets/video/space-bg.mp4',
    'theme-1970s': 'assets/video/vintage-bg.mp4',
    'theme-1980s': 'assets/video/synth-bg.mp4',
    'theme-1990s': 'assets/video/matrix-bg.mp4',
    'theme-2000s': 'assets/video/frutiger-bg.mp4',
    'theme-2010s': 'assets/video/vapor-bg.mp4',
    'theme-2020s': 'assets/video/minimal-bg.mp4'
  };

  function getVideoForTheme(themeClass) {
    return ERA_VIDEO[themeClass] || null;
  }

  // Builds (or clears) the looping <video> inside a given backdrop element
  // for the given era. Reused for both the timeline's bg-layer divs and the
  // results page's single backdrop div, so the video markup/attributes only
  // need to be defined once.
  function setBackdropVideo(container, themeClass) {
    const existing = container.querySelector('.bg-video');
    const src = getVideoForTheme(themeClass);

    if (!src) {
      if (existing) existing.remove();
      return;
    }

    // Already showing the right video — leave it playing rather than
    // restarting it (avoids a visible flash/reset on every re-entry).
    if (existing && existing.dataset.src === src) return;
    if (existing) existing.remove();

    const video = document.createElement('video');
    video.className = 'bg-video';
    video.src = src;
    video.dataset.src = src;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    container.insertBefore(video, container.firstChild);
    // Autoplay can still be blocked in some contexts (e.g. very first paint
    // before any user gesture); play() is called explicitly and its promise
    // rejection is swallowed since a still frame of the CSS pattern behind
    // it is a fine fallback either way.
    video.play().catch(function () {});
  }

  TimeMachine.getThemeClassForYear = getThemeClassForYear;
  TimeMachine.applyBodyTheme = applyBodyTheme;
  TimeMachine.onThemeChange = onThemeChange;
  TimeMachine.getVideoForTheme = getVideoForTheme;
  TimeMachine.setBackdropVideo = setBackdropVideo;

})();
