/* global MediaURLResolver, URL, document */
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
    description:
      'Music hall and performance chamber featuring audio works, compositions, and sonic experiments',
    color: '#FFD700', // Gold
    secondaryColor: '#000000', // Black
    wing: 'south',
  },

  /**
   * Album catalog
   */
  albums: Object.values(globalThis.ETCETER4_SOURCE_CATALOGUE?.albums || {}).map(
    album => ({
      ...album,
      type: 'album',
      category: 'album',
      status: 'released',
      features: [],
    })
  ),

  // These categories remain available for verified future works.
  singles: [],
  demos: [],
  experimental: [],

  // Preserve the previous template identities without claiming they are releases.
  // Original records and the recovery path are documented in docs/SOURCE_CATALOGUE.md.
  unverifiedItems: [
    {
      id: 'single-01',
      title: 'Title [Single]',
      type: 'single',
      status: 'unverified',
    },
    {
      id: 'demo-01',
      title: 'Untitled Demo [WIP]',
      type: 'demo',
      status: 'unverified',
    },
    {
      id: 'exp-01',
      title: 'Ambient Study No. 1',
      type: 'experimental',
      status: 'unverified',
    },
    {
      id: 'exp-02',
      title: 'Glitch Variations',
      type: 'experimental',
      status: 'unverified',
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
  getAllItems: function () {
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
  getItemsByCategory: function (category) {
    if (category === 'all') {
      return this.getAllItems();
    }
    const normalized =
      { albums: 'album', singles: 'single', demos: 'demo' }[category] ||
      category;
    return this.getAllItems().filter(item => item.category === normalized);
  },

  /**
   * Get item by ID
   */
  getItemById: function (id) {
    return this.getAllItems().find(item => item.id === id);
  },

  /**
   * Get cover art URL
   * Uses MediaURLResolver if available, otherwise falls back to local paths
   */
  getCoverArt: function (item, size = 'medium') {
    if (!item) return null;

    // Use MediaURLResolver if available for R2 URLs
    if (typeof MediaURLResolver !== 'undefined' && item.id) {
      return MediaURLResolver.resolveCoverArt(item.id, size);
    }

    // Fallback to local cover art paths
    if (!item.coverArt) return null;
    return item.coverArt[size] || item.coverArt.medium || null;
  },

  /** Resolve only verified sources, relative to either the SPA or standalone room. */
  getAudioUrl: function (albumId, trackNumber, format = 'mp3') {
    const album = this.getItemById(albumId);
    const track = album?.tracks.find(item => item.number === trackNumber);
    const source = track?.formats?.[format] || track?.src || track?.url;
    if (!source) return null;
    // The root SPA and /odeion/index.html share this configuration.
    const standalone =
      typeof document !== 'undefined' &&
      /\/odeion\/(?:index\.html)?$/.test(new URL(document.baseURI).pathname);
    return standalone ? `../${source}` : source;
  },

  getWaveformUrl: function (albumId, trackNumber) {
    return (
      this.getItemById(albumId)?.tracks.find(
        track => track.number === trackNumber
      )?.waveformUrl || null
    );
  },

  getLyricsUrl: function (albumId, trackNumber) {
    const album = this.getItemById(albumId);
    if (!album?.hasLyrics) return null;
    return (
      album.tracks.find(track => track.number === trackNumber)?.lyricsUrl ||
      null
    );
  },
};
