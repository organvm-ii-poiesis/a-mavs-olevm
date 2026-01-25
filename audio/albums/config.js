/**
 * Album Configuration
 * Defines track listings and metadata for all albums
 * Part of ETCETER4 Pantheon Project
 */

const albumsConfig = {
  ogod: {
    id: 'ogod',
    title: 'OGOD',
    artist: 'ET CETER4',
    year: 2016,
    coverArt: '/img/photos/artwork/ogod/cover.jpg',
    description: 'The debut album from ET CETER4',
    tracks: [
      {
        id: 1,
        title: 'Track 1',
        src: '/audio/albums/ogod/01-track-1.mp3',
        duration: '3:45',
      },
      {
        id: 2,
        title: 'Track 2',
        src: '/audio/albums/ogod/02-track-2.mp3',
        duration: '4:12',
      },
      {
        id: 3,
        title: 'Track 3',
        src: '/audio/albums/ogod/03-track-3.mp3',
        duration: '3:58',
      },
      // Add more tracks as needed
    ],
    links: {
      bandcamp: 'https://etceter4.bandcamp.com/album/ogod',
      spotify: 'https://open.spotify.com/album/...',
      youtube: 'https://youtube.com/...',
    },
  },

  rmxs: {
    id: 'rmxs',
    title: 'ET CETER4 RMXS',
    artist: 'ET CETER4',
    year: 2017,
    coverArt: '/img/photos/artwork/rmxs/cover.jpg',
    description: 'Remix album',
    tracks: [
      {
        id: 1,
        title: 'Remix 1',
        src: '/audio/albums/rmxs/01-remix-1.mp3',
        duration: '4:20',
      },
      {
        id: 2,
        title: 'Remix 2',
        src: '/audio/albums/rmxs/02-remix-2.mp3',
        duration: '3:55',
      },
      // Add more tracks as needed
    ],
    links: {
      bandcamp: 'https://etceter4.bandcamp.com/album/et-ceter4-rmxs',
    },
  },

  progressionDigression: {
    id: 'progression-digression',
    title: 'ProgressionDigression',
    artist: 'ET CETER4',
    year: 2015,
    coverArt: '/img/photos/artwork/progressiondigression/cover.jpg',
    description: 'The Progression of Digression',
    tracks: [
      {
        id: 1,
        title: 'Track 1',
        src: '/audio/albums/progression-digression/01-track-1.mp3',
        duration: '5:10',
      },
      // Add more tracks as needed
    ],
    links: {
      bandcamp:
        'https://etceter4.bandcamp.com/album/the-progression-of-digression',
    },
  },

  etc: {
    id: 'etc',
    title: 'Etc',
    artist: 'ET CETER4',
    year: 2014,
    coverArt: '/img/photos/artwork/etcetera/cover.jpg',
    description: 'Etc album',
    tracks: [
      {
        id: 1,
        title: 'Track 1',
        src: '/audio/albums/etc/01-track-1.mp3',
        duration: '4:05',
      },
      // Add more tracks as needed
    ],
    links: {
      bandcamp: 'https://etceter4.bandcamp.com/album/etc',
    },
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = albumsConfig;
}
