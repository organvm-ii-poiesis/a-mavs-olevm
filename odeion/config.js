/**
 * @file odeion/config.js
 * @description ODEION chamber configuration and music metadata
 * Maps albums, singles, demos, and experimental works with cover art and track info
 */

'use strict';

// eslint-disable-next-line no-unused-vars
const ODEION_CONFIG = {
  /**
   * Chamber metadata
   */
  chamber: {
    id: 'odeion',
    name: 'ODEION',
    subtitle: 'Albums, singles, demos, experimental',
    description: 'Music hall and performance chamber featuring audio works, compositions, and sonic experiments',
    color: '#FFD700', // Gold
    secondaryColor: '#000000', // Black
    wing: 'south',
  },

  /**
   * Album catalog
   */
  albums: [
    {
      id: 'ogod',
      type: 'album',
      title: 'OGOD',
      artist: 'ET CETER4',
      year: 2015,
      description: 'Visual album with 29 video game music arrangements',
      trackCount: 29,
      duration: '1:15:30',
      coverArt: {
        large: '../audio/albums/ogod/cover-1200.jpg',
        medium: '../audio/albums/ogod/cover-600.jpg',
        small: '../audio/albums/ogod/cover-300.jpg',
      },
      features: ['stems', 'lyrics', 'visual-sync'],
      status: 'released',
      category: 'album',
    },
    {
      id: 'progression-digression',
      type: 'album',
      title: 'The Progression of Digression',
      artist: 'ET CETER4',
      year: 2012,
      description: 'Full-length debut exploring musical transformation and evolutionary themes',
      trackCount: 12,
      duration: '48:15',
      coverArt: {
        large: '../audio/albums/progression-digression/cover-1200.jpg',
        medium: '../audio/albums/progression-digression/cover-600.jpg',
        small: '../audio/albums/progression-digression/cover-300.jpg',
      },
      features: ['remaster-2024'],
      status: 'released',
      category: 'album',
    },
    {
      id: 'rmxs',
      type: 'album',
      title: 'ET CETER4 RMXS',
      artist: 'ET CETER4',
      year: 2020,
      description: 'Comprehensive remix collection featuring collaborations and reinterpretations',
      trackCount: 0, // TBD
      duration: 'TBD',
      coverArt: {
        large: '../audio/albums/rmxs/cover-1200.jpg',
        medium: '../audio/albums/rmxs/cover-600.jpg',
        small: '../audio/albums/rmxs/cover-300.jpg',
      },
      features: [],
      status: 'released',
      category: 'album',
    },
    {
      id: 'etc',
      type: 'album',
      title: 'Etc',
      artist: 'ET CETER4',
      year: 2011,
      description: 'Early collection of instrumental sketches and melodic studies',
      trackCount: 0, // TBD
      duration: 'TBD',
      coverArt: {
        large: '../audio/albums/etc/cover-1200.jpg',
        medium: '../audio/albums/etc/cover-600.jpg',
        small: '../audio/albums/etc/cover-300.jpg',
      },
      features: [],
      status: 'released',
      category: 'album',
    },
  ],

  /**
   * Singles catalog
   */
  singles: [
    {
      id: 'single-01',
      type: 'single',
      title: 'Title [Single]',
      artist: 'ET CETER4',
      year: 2024,
      description: 'Single release with expanded remix versions',
      trackCount: 1,
      duration: '3:45',
      coverArt: {
        large: '../audio/singles/single-01/cover-1200.jpg',
        medium: '../audio/singles/single-01/cover-600.jpg',
        small: '../audio/singles/single-01/cover-300.jpg',
      },
      features: ['remixes'],
      status: 'released',
      category: 'single',
    },
  ],

  /**
   * Demos catalog
   */
  demos: [
    {
      id: 'demo-01',
      type: 'demo',
      title: 'Untitled Demo [WIP]',
      artist: 'ET CETER4',
      year: 2024,
      description: 'Early concept exploration for upcoming work',
      trackCount: 1,
      duration: '4:20',
      coverArt: {
        large: null,
        medium: null,
        small: null,
      },
      features: ['unreleased', 'work-in-progress'],
      status: 'demo',
      category: 'demo',
    },
  ],

  /**
   * Experimental works catalog
   */
  experimental: [
    {
      id: 'exp-01',
      type: 'experimental',
      title: 'Ambient Study No. 1',
      artist: 'ET CETER4',
      year: 2023,
      description: 'Generative ambient soundscape using algorithmic composition',
      trackCount: 1,
      duration: '~15:00',
      coverArt: {
        large: null,
        medium: null,
        small: null,
      },
      features: ['generative', 'ambient', 'algorithmic'],
      status: 'published',
      category: 'experimental',
    },
    {
      id: 'exp-02',
      type: 'experimental',
      title: 'Glitch Variations',
      artist: 'ET CETER4',
      year: 2023,
      description: 'Sound design exploration using digital artifacts as musical material',
      trackCount: 1,
      duration: '6:30',
      coverArt: {
        large: null,
        medium: null,
        small: null,
      },
      features: ['glitch', 'sound-design', 'electronic'],
      status: 'published',
      category: 'experimental',
    },
  ],

  /**
   * Audio player configuration
   */
  player: {
    waveform: {
      height: 80,
      barWidth: 2,
      barGap: 1,
      primaryColor: '#FFD700',
      secondaryColor: '#000000',
      progressColor: '#FFFFFF',
      backgroundColor: 'transparent',
    },
    defaultVolume: 0.8,
    crossfadeDuration: 1000,
    fadeOutDuration: 500,
    fadeInDuration: 500,
  },

  /**
   * Get all music items across all categories
   */
  getAllItems: function() {
    return [
      ...this.albums,
      ...this.singles,
      ...this.demos,
      ...this.experimental,
    ];
  },

  /**
   * Get items by category
   */
  getItemsByCategory: function(category) {
    if (category === 'all') {
      return this.getAllItems();
    }
    return this.getAllItems().filter(item => item.category === category);
  },

  /**
   * Get item by ID
   */
  getItemById: function(id) {
    return this.getAllItems().find(item => item.id === id);
  },

  /**
   * Get cover art URL
   */
  getCoverArt: function(item, size = 'medium') {
    if (!item || !item.coverArt) return null;
    return item.coverArt[size] || item.coverArt.medium || null;
  },
};
