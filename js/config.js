/**
 * @file config.js
 * @description Centralized configuration for ETCETER4 site
 * Extracts magic numbers and configurable values for easier maintenance
 */

'use strict';

/**
 * @global {Object} ETCETER4_CONFIG - Global configuration object
 */
// eslint-disable-next-line no-unused-vars
const ETCETER4_CONFIG = {
  /**
   * Image gallery configuration
   * Counts for each photo collection
   */
  images: {
    media: 44,
    faster: 28,
    slip: 6,
    live: 5,
  },

  /**
   * Animation timing configuration (in milliseconds)
   */
  animations: {
    fadeOutDelay: 150,
    fadeOutDuration: 200,
    fadeInDuration: 500,
    transitionCooldown: 50,
    navigationDebounce: 100,
  },

  /**
   * OGOD visual album configuration
   */
  ogod: {
    frameInterval: 120,
    gridSize: 21,
    totalFrames: 410,
  },

  /**
   * Carousel configuration
   */
  carousel: {
    loadOffset: 4,
    swipeThreshold: 50,
  },
};
