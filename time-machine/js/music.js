// TIME CAPSULE — music track list
//
// This is the ONLY file you need to touch to add music. Nothing here is
// filled in on purpose — drop your own .mp3 files in and list them below.
//
// HOW TO ADD A TRACK
// 1. Put an .mp3 file into the matching folder under assets/audio/, e.g.
//    assets/audio/1980s/my-song.mp3
// 2. Add an entry to that section's `tracks` array below:
//      { title: 'My Song', artist: 'Optional Artist Name', src: 'assets/audio/1980s/my-song.mp3' }
//    `artist` is optional — leave it out (or blank) and the player just
//    shows the title on its own.
//
// Each section can hold as many tracks as you want — the music player
// (the note icon in the header) lists all of them and lets the visitor
// pick, rather than only ever picking one automatically:
//   - More than one track in a section: plays through them in order and
//     loops back to the first when the last one ends.
//   - Exactly one track: just loops that track.
//   - Zero tracks: the player shows a "nothing here yet" message for that
//     section instead of erroring.
//
// Playback starts automatically as soon as the site loads (starting on
// the 'home' section below) if the browser allows it — most browsers
// require one click/tap/keypress on the page first, in which case it
// starts right on that first interaction instead.
//
// SECTIONS
// 'home' plays on the idle screen and the "Enter a Year" screen — anywhere
// no decade theme is active yet. The rest match the era theme classes
// used throughout the site (see js/themes.js), and switch automatically
// as the visitor browses into that decade, whether via the timeline,
// typing a year directly, or a quick-jump chip.

window.TimeMachineMusic = window.TimeMachineMusic || {};

window.TimeMachineMusic.SECTIONS = {
  home: {
    label: 'Home',
    folder: 'assets/audio/home/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/home/track-name.mp3' },
      { title: 'Wii', artist: 'Nintendo', src: 'assets/audio/home/Wii.mp3' },
      { title: 'Dededes Royal Payback', artist: 'IDk Nintendo?', src: 'assets/audio/home/Dedede´s Royal Payback.mp3' }
    ]
  },
  'theme-1940s': {
    label: '1940s',
    folder: 'assets/audio/1940s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1940s/track-name.mp3' },
    ]
  },
  'theme-1950s': {
    label: '1950s',
    folder: 'assets/audio/1950s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1950s/track-name.mp3' },
    ]
  },
  'theme-1960s': {
    label: '1960s',
    folder: 'assets/audio/1960s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1960s/track-name.mp3' },
    ]
  },
  'theme-1970s': {
    label: '1970s',
    folder: 'assets/audio/1970s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1970s/track-name.mp3' },
    ]
  },
  'theme-1980s': {
    label: '1980s',
    folder: 'assets/audio/1980s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1980s/track-name.mp3' },
    ]
  },
  'theme-1990s': {
    label: '1990s',
    folder: 'assets/audio/1990s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1990s/track-name.mp3' },
    ]
  },
  'theme-2000s': {
    label: '2000s',
    folder: 'assets/audio/2000s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2000s/track-name.mp3' },
    ]
  },
  'theme-2010s': {
    label: '2010s',
    folder: 'assets/audio/2010s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2010s/track-name.mp3' },
    ]
  },
  'theme-2020s': {
    label: '2020s',
    folder: 'assets/audio/2020s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2020s/track-name.mp3' },
    ]
  }
};
