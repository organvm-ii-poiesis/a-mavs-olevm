/**
 * Video Configuration
 * Defines video collections and metadata
 * Part of ETCETER4 Pantheon Project
 */

const videosConfig = {
  performances: {
    id: 'performances',
    title: 'Live Performances',
    description: 'Live performance videos and concert recordings',
    videos: [
      {
        id: 1,
        title: 'Live Performance 1',
        description: 'Description of the performance',
        // Option 1: Self-hosted
        src: '/video/performances/performance-1.mp4',
        poster: '/img/photos/live/performance-1-poster.jpg',
        thumbnail: '/img/photos/live/performance-1-thumb.jpg',
        duration: '5:30',
        date: '2024-01-15',
        // Option 2: YouTube
        // youtube: 'https://www.youtube.com/watch?v=VIDEO_ID',
        subtitles: [
          {
            label: 'English',
            lang: 'en',
            src: '/video/performances/performance-1-en.vtt',
          },
        ],
      },
      // Add more performance videos
    ],
  },

  visualAlbums: {
    id: 'visual-albums',
    title: 'Visual Albums',
    description: 'Music videos and visual album content',
    videos: [
      {
        id: 1,
        title: 'OGOD Visual Track 1',
        description: 'Visual accompaniment to OGOD track 1',
        src: '/video/visual-albums/ogod-track-1.mp4',
        poster: '/img/photos/artwork/ogod/track-1-poster.jpg',
        thumbnail: '/img/photos/artwork/ogod/track-1-thumb.jpg',
        duration: '3:45',
        date: '2016-06-15',
      },
      // Add more visual album videos
    ],
  },

  experimental: {
    id: 'experimental',
    title: 'Experimental Works',
    description: 'Video art and experimental visual pieces',
    videos: [
      {
        id: 1,
        title: 'Glitch Experiment 1',
        description: 'Experimental glitch art video',
        src: '/video/experimental/glitch-1.mp4',
        poster: '/img/photos/glitchpr0n/glitch-1-poster.jpg',
        thumbnail: '/img/photos/glitchpr0n/glitch-1-thumb.jpg',
        duration: '2:15',
        date: '2023-08-20',
      },
      // Add more experimental videos
    ],
  },

  // Example: Existing YouTube videos (current setup)
  youtubeArchive: {
    id: 'youtube-archive',
    title: 'YouTube Archive',
    description: 'Videos currently hosted on YouTube',
    videos: [
      {
        id: 1,
        title: 'Video 1',
        youtube: 'https://www.youtube.com/watch?v=BIaJcXkKW0E',
        thumbnail: 'https://img.youtube.com/vi/BIaJcXkKW0E/mqdefault.jpg',
        duration: '?:??',
        date: '2015',
      },
      {
        id: 2,
        title: 'Video 2',
        youtube: 'https://www.youtube.com/watch?v=8ofL2qbSap0',
        thumbnail: 'https://img.youtube.com/vi/8ofL2qbSap0/mqdefault.jpg',
        duration: '?:??',
        date: '2015',
      },
      {
        id: 3,
        title: 'Video 3',
        youtube: 'https://www.youtube.com/watch?v=IiaEEnfSuW8',
        thumbnail: 'https://img.youtube.com/vi/IiaEEnfSuW8/mqdefault.jpg',
        duration: '?:??',
        date: '2015',
      },
      {
        id: 4,
        title: 'Video 4',
        youtube: 'https://www.youtube.com/watch?v=KXaMIIBtrkQ',
        thumbnail: 'https://img.youtube.com/vi/KXaMIIBtrkQ/mqdefault.jpg',
        duration: '?:??',
        date: '2015',
      },
      {
        id: 5,
        title: 'Video 5',
        youtube: 'https://www.youtube.com/watch?v=eHW34l3RrAo',
        thumbnail: 'https://img.youtube.com/vi/eHW34l3RrAo/mqdefault.jpg',
        duration: '?:??',
        date: '2015',
      },
    ],
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = videosConfig;
}
