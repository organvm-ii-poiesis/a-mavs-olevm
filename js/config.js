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

  /**
   * 3D immersive experience configuration
   */
  threeD: {
    // API keys (replace with actual keys in production)
    // These should be set via environment variables or a separate secrets file
    weatherApiKey: '', // OpenWeatherMap API key
    astronomyApiId: '', // Astronomy API application ID
    astronomyApiSecret: '', // Astronomy API secret

    // Renderer settings
    renderer: {
      antialias: true,
      alpha: true,
      maxPixelRatio: 2,
      toneMapping: 'ACESFilmic',
      toneMappingExposure: 1.0,
    },

    // Landing page layer settings
    landing: {
      enabled: true,
      layers: {
        background: { opacity: 1.0, blendMode: 'normal' },
        textMask: { opacity: 0.8, blendMode: 'multiply' },
        menuMask: { opacity: 0.6, blendMode: 'screen' },
        buttonMask: { opacity: 1.0, blendMode: 'add' },
      },
      particles: {
        count: 1000,
        size: 0.05,
        speed: 0.5,
      },
      noise: {
        scale: 0.5,
        speed: 0.1,
        octaves: 4,
      },
    },

    // OGOD 3D environment settings
    ogodEnv: {
      enabled: true,
      camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        moveSpeed: 5.0,
        lookSpeed: 0.002,
      },
      fog: {
        enabled: true,
        near: 1,
        far: 50,
        density: 0.02,
      },
      audio: {
        masterVolume: 0.8,
        stemBlendRadius: 15, // Distance for stem crossfade
        reverbMix: 0.3,
        delayTime: 0.2,
      },
      postProcessing: {
        bloom: {
          enabled: true,
          strength: 0.5,
          threshold: 0.8,
          radius: 0.5,
        },
        depthOfField: {
          enabled: true,
          focusDistance: 10,
          aperture: 0.025,
          maxBlur: 0.01,
        },
      },
    },

    // Environment data update intervals (in milliseconds)
    updateIntervals: {
      weather: 300000, // 5 minutes
      astronomy: 3600000, // 1 hour
    },
  },

  /**
   * OGOD track configurations
   * Maps track numbers to their visual themes and color palettes
   */
  ogodTracks: {
    1: {
      game: 'Animal Crossing',
      archetype: 'gradient-fog',
      palette: ['#6B4C7A', '#C45B8E', '#D98C4A', '#5A6B3D'],
      artwork: 'img/photos/artwork/ogod/ogod1.jpg',
    },
    2: {
      game: 'Castlevania',
      archetype: 'layered-colors',
      palette: ['#FF1493', '#8B008B', '#000000', '#4A0028'],
      artwork: 'img/photos/artwork/ogod/ogod2.jpg',
    },
    3: {
      game: 'Chrono Trigger',
      archetype: 'glitch-digital',
      palette: ['#00FFFF', '#FF00FF', '#000000', '#FFFFFF'],
      artwork: 'img/photos/artwork/ogod/ogod3.jpg',
    },
    4: {
      game: 'Disco Train',
      archetype: 'stripe-bar',
      palette: ['#CDDC39', '#FFEB3B', '#FF9800', '#8BC34A'],
      artwork: 'img/photos/artwork/ogod/ogod4.jpg',
    },
    5: {
      game: 'DKC2 Stickerbush',
      archetype: 'high-contrast',
      palette: ['#000000', '#FFFFFF', '#1A1A1A', '#E5E5E5'],
      artwork: 'img/photos/artwork/ogod/ogod5.png',
    },
    6: {
      game: 'Earthworm Jim',
      archetype: 'gradient-fog',
      palette: ['#4DD0C4', '#D47BC4', '#E8A87C', '#7BC4D4'],
      artwork: 'img/photos/artwork/ogod/ogod6.jpg',
    },
    7: {
      game: 'Final Fantasy',
      archetype: 'gradient-fog',
      palette: ['#E8E8E8', '#C4D4E8', '#B8C8D8', '#D8E8F0'],
      artwork: 'img/photos/artwork/ogod/ogod7.jpg',
    },
    8: {
      game: 'FFIV',
      archetype: 'bokeh-grid',
      palette: ['#000000', '#00FF00', '#0066FF', '#00FFFF'],
      artwork: 'img/photos/artwork/ogod/ogod8.jpg',
    },
    9: {
      game: 'Golden Sun',
      archetype: 'gradient-fog',
      palette: ['#FF0000', '#CC0000', '#990000', '#660000'],
      artwork: 'img/photos/artwork/ogod/ogod9.jpg',
    },
    10: {
      game: 'Goldeneye 007',
      archetype: 'gradient-fog',
      palette: ['#B8C4D8', '#9EADC7', '#7A96C0', '#D4A5C9'],
      artwork: 'img/photos/artwork/ogod/ogod10.jpg',
    },
    11: {
      game: 'Harvest Moon',
      archetype: 'stripe-bar',
      palette: ['#00FF00', '#00CC00', '#000000', '#008800'],
      artwork: 'img/photos/artwork/ogod/ogod11.jpg',
    },
    12: {
      game: 'Kid Icarus',
      archetype: 'bokeh-grid',
      palette: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      artwork: 'img/photos/artwork/ogod/ogod12.jpg',
    },
    13: {
      game: 'Link to the Past',
      archetype: 'bokeh-grid',
      palette: ['#0000FF', '#4444FF', '#FFFFFF', '#C4D4FF'],
      artwork: 'img/photos/artwork/ogod/ogod13.jpg',
    },
    14: {
      game: "Luigi's Mansion",
      archetype: 'gradient-fog',
      palette: ['#7EC8A3', '#A3D4E8', '#E8B4C8', '#B8E4C8'],
      artwork: 'img/photos/artwork/ogod/ogod14.jpg',
    },
    15: {
      game: 'Mario 64',
      archetype: 'gradient-fog',
      palette: ['#87CEEB', '#90EE90', '#FFD700', '#FF6B6B'],
      artwork: 'img/photos/artwork/ogod/ogod15.png',
    },
    16: {
      game: 'Megaman 8',
      archetype: 'glitch-digital',
      palette: ['#00BFFF', '#FF4500', '#FFD700', '#32CD32'],
      artwork: 'img/photos/artwork/ogod/ogod16.jpg',
    },
    17: {
      game: 'Metroid Prime',
      archetype: 'gradient-fog',
      palette: ['#FF4500', '#1E90FF', '#00FF00', '#8B0000'],
      artwork: null,
    },
    18: {
      game: 'Metroid',
      archetype: 'stripe-bar',
      palette: ['#4A90A4', '#2E5A6B', '#1A3A4A', '#6EB4D4'],
      artwork: 'img/photos/artwork/ogod/ogod18.png',
    },
    19: {
      game: 'Okami',
      archetype: 'high-contrast',
      palette: ['#000000', '#FFFFFF', '#F5F5DC', '#1A1A1A'],
      artwork: 'img/photos/artwork/ogod/ogod19.jpg',
    },
    20: {
      game: 'Pikmin',
      archetype: 'stripe-bar',
      palette: ['#FF0000', '#0000FF', '#000000', '#FF00FF'],
      artwork: 'img/photos/artwork/ogod/ogod20.jpg',
    },
    21: {
      game: 'Resident Evil 4',
      archetype: 'glitch-digital',
      palette: ['#00FF00', '#FFFF00', '#00FFFF', '#FF0000'],
      artwork: 'img/photos/artwork/ogod/ogod21.jpg',
    },
    22: {
      game: 'Star Fox',
      archetype: 'gradient-fog',
      palette: ['#1E90FF', '#32CD32', '#FFD700', '#8B4513'],
      artwork: 'img/photos/artwork/ogod/ogod22.jpg',
    },
    23: {
      game: 'Street Fighter',
      archetype: 'bokeh-grid',
      palette: ['#0066FF', '#FFFF00', '#FF0000', '#00FFFF'],
      artwork: 'img/photos/artwork/ogod/ogod23.jpg',
    },
    24: {
      game: 'Mario RPG',
      archetype: 'gradient-fog',
      palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
      artwork: 'img/photos/artwork/ogod/ogod24.jpg',
    },
    25: {
      game: 'Mario Sunshine',
      archetype: 'gradient-fog',
      palette: ['#00BFFF', '#FFD700', '#32CD32', '#FF6347'],
      artwork: 'img/photos/artwork/ogod/ogod25.jpg',
    },
    26: {
      game: 'Melee',
      archetype: 'bokeh-grid',
      palette: ['#FF4500', '#1E90FF', '#32CD32', '#FFD700'],
      artwork: 'img/photos/artwork/ogod/ogod26.jpg',
    },
    27: {
      game: 'Twilight Princess',
      archetype: 'layered-colors',
      palette: ['#2F4F4F', '#8B4513', '#DAA520', '#556B2F'],
      artwork: 'img/photos/artwork/ogod/ogod27.jpg',
    },
    28: {
      game: 'Wind Waker',
      archetype: 'gradient-fog',
      palette: ['#FF7F7F', '#FF9F9F', '#FFBFBF', '#9F7FBF'],
      artwork: 'img/photos/artwork/ogod/ogod28.png',
    },
    29: {
      game: "Yoshi's Island",
      archetype: 'bokeh-grid',
      palette: ['#FF1493', '#4169E1', '#000000', '#FF69B4'],
      artwork: 'img/photos/artwork/ogod/ogod29.jpg',
    },
  },
};
