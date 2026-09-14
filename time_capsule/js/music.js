// TIME CAPSULE — music track list
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
      { title: 'Experience', artist: 'Ludovico Einaudi', src: 'assets/audio/home/Ludovico Einaudi - Experience.mp3' },
      { title: 'Horizon', artist: 'Tycho', src: 'assets/audio/home/Tycho - Horizon.mp3' },
      { title: 'Intro', artist: 'The xx', src: 'assets/audio/home/The xx - Intro.mp3' }
    ]
  },
  'theme-1940s': {
    label: '1940s',
    folder: 'assets/audio/1940s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1940s/track-name.mp3' },
      { title: 'Moonlight Serenade', artist: 'Glenn Miller', src: 'assets/audio/1940s/Glenn Miller - Moonlight Serenade.mp3' },
      { title: 'In the Mood', artist: 'Glenn Miller', src: 'assets/audio/1940s/Glenn Miller - In the Mood.mp3' },
      { title: 'Amber Lights', artist: 'Chill Cole', src: 'assets/audio/1940s/Chill Cole - Amber Lights.mp3' }
    ]
  },
  'theme-1950s': {
    label: '1950s',
    folder: 'assets/audio/1950s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1950s/track-name.mp3' },
      { title: 'Tequila', artist: 'The Champs', src: 'assets/audio/1950s/The Champs - Tequila.mp3' },
      { title: 'Perfidia', artist: 'The Ventures', src: 'assets/audio/1950s/The Ventures - Perfidia.mp3' },
      { title: 'Rebel Rouser', artist: 'Duane Eddy', src: 'assets/audio/1950s/Duane Eddy - Rebel Rouser.mp3' }
    ]
  },
  'theme-1960s': {
    label: '1960s',
    folder: 'assets/audio/1960s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1960s/track-name.mp3' },
      { title: 'Booker T. & the M.G.', artist: 'Booker T. & the M.G.s', src: 'assets/audio/1960s/Green Onions.mp3' },
      { title: 'Telstar', artist: 'The Tornados', src: 'assets/audio/1960s/The Tornados - Telstar.mp3' },
      { title: 'Apache', artist: 'The Shadows', src: 'assets/audio/1960s/The Shadows - Apache.mp3' }
    ]
  },
  'theme-1970s': {
    label: '1970s',
    folder: 'assets/audio/1970s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1970s/track-name.mp3' },
      { title: 'Breezin\'', artist: 'George Benson', src: 'assets/audio/1970s/George Benson - Breezin.mp3' },
      { title: 'A Fifth of Beethoven', artist: 'Walter Murphy', src: 'assets/audio/1970s/Walter Murphy - A Fifth of Beethoven.mp3' },
      { title: 'Sirius', artist: 'The Alan Parson Project', src: 'assets/audio/1970s/The Alan Parson Project - Sirius.mp3' }
    ]
  },
  'theme-1980s': {
    label: '1980s',
    folder: 'assets/audio/1980s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1980s/track-name.mp3' },
      { title: 'Resonance', artist: 'HOME', src: 'assets/audio/1980s/HOME - Resonance.mp3' },
      { title: 'Nightcall', artist: 'Kavinsky', src: 'assets/audio/1980s/Kavinsky - Nightcall.mp3' },
      { title: 'Love On A Real Train', artist: 'Tangerine Dream', src: 'assets/audio/1980s/Tangerine Dream - Love On A Real Train.mp3' }
    ]
  },
  'theme-1990s': {
    label: '1990s',
    folder: 'assets/audio/1990s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/1990s/track-name.mp3' },
      { title: 'Children', artist: 'Robert Miles', src: 'assets/audio/1990s/Robert Miles - Children.mp3' },
      { title: 'Better Off Alone', artist: 'Alice Deejay', src: 'assets/audio/1990s/Alice Deejay - Better Off Alone.mp3' },
      { title: 'Galvanize', artist: 'The Chemical Brothers', src: 'assets/audio/1990s/The Chemical Brothers - Galvanize.mp3' }
    ]
  },
  'theme-2000s': {
    label: '2000s',
    folder: 'assets/audio/2000s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2000s/track-name.mp3' },
      { title: 'aquatic ambience', artist: 'scizzie', src: 'assets/audio/2000s/scizzie - aquatic ambience.mp3' },
      { title: 'aruarian dance', artist: 'Nujabes', src: 'assets/audio/2000s/Nujabes - aruarian dance.mp3' },
      { title: 'Sweet Disposition', artist: 'The Temper Trap', src: 'assets/audio/2000s/The Temper Trap - Sweet Disposition.mp3' }
    ]
  },
  'theme-2010s': {
    label: '2010s',
    folder: 'assets/audio/2010s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2010s/track-name.mp3' },
      { title: 'Moog City 2', artist: 'C418', src: 'assets/audio/2010s/C418 - Moog City 2.mp3' },
      { title: 'Midnight City', artist: 'M83', src: 'assets/audio/2010s/M83 - Midnight City.mp3' },
      { title: 'Dreams', artist: 'Anamanaguchi & Flux Pavilion', src: 'assets/audio/2010s/Anamanaguchi & Flux Pavilion - Dreams.mp3' }
    ]
  },
  'theme-2020s': {
    label: '2020s',
    folder: 'assets/audio/2020s/',
    tracks: [
      // { title: 'Track Name', artist: 'Artist Name', src: 'assets/audio/2020s/track-name.mp3' },
      { title: 'Port Elpis', artist: 'San-Z', src: 'assets/audio/2020s/San-Z - Port Elpis.mp3' },
      { title: 'naples', artist: 'nightiger', src: 'assets/audio/2020s/nightiger - naples.mp3' },
      { title: 'Memory Reboot', artist: 'VØJ & Narvent', src: 'assets/audio/2020s/VØJ & Narvent - Memory Reboot.mp3' }
    ]
  }
};
