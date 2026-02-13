/**
 * @file config.js
 * @description Centralized configuration for ETCETER4 site
 * Extracts magic numbers and configurable values for easier maintenance
 *
 * API Key Configuration:
 * ----------------------
 * To enable weather and astronomy features, you need to provide API keys.
 * There are several ways to configure these:
 *
 * 1. Direct Configuration (not recommended for production):
 *    Edit the threeD.weatherApiKey, astronomyApiId, and astronomyApiSecret values below.
 *
 * 2. Environment-based (recommended):
 *    Create a js/config.local.js file (gitignored) with:
 *    ```
 *    if (typeof ETCETER4_CONFIG !== 'undefined') {
 *      ETCETER4_CONFIG.threeD.weatherApiKey = 'your-openweathermap-api-key';
 *      ETCETER4_CONFIG.threeD.astronomyApiId = 'your-astronomy-api-id';
 *      ETCETER4_CONFIG.threeD.astronomyApiSecret = 'your-astronomy-api-secret';
 *    }
 *    ```
 *    Then include this file after config.js in your HTML.
 *
 * 3. URL Parameters (for testing):
 *    Add ?weatherApiKey=xxx to the URL for temporary testing.
 *
 * API Sources:
 * - Weather: https://openweathermap.org/api (free tier available)
 * - Astronomy: https://astronomyapi.com/ (free tier available)
 *
 * Fallback Behavior:
 * When APIs are unavailable or fail, the system uses intelligent defaults:
 * - Weather: Clear sky, 20°C, 50% humidity, no wind
 * - Moon phase: Calculated algorithmically (accurate to ~1 day)
 * - Time-of-day: Based on device clock
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
   * OGOD visual album configuration (legacy, kept for backward compat)
   */
  ogod: {
    frameInterval: 120,
    gridSize: 21,
    totalFrames: 410,
  },

  /**
   * OGOD animation engine configuration
   * Controls the modern canvas/WebGL animation system
   */
  ogodAnimation: {
    defaultMode: 'enhanced',
    faithful: {
      gridSize: 21,
      totalFrames: 410,
      frameInterval: 120,
    },
    enhanced: {
      transitionDuration: 80,
      chromaticAberration: 0.003,
      feedbackAmount: 0.85,
      noiseAmount: 0.15,
      bloomStrength: 0.4,
    },
    generative: {
      feedbackDecay: 0.92,
      feedbackZoom: 1.002,
      noiseScale: 5.0,
      audioInfluence: 0.6,
    },
    tkol: {
      sortThresholdLow: 0.05,
      sortThresholdHigh: 0.95,
      sortDirection: 'vertical',
      scanlineCount: 40,
      displacementAmount: 0.04,
      channelSeparation: 0.012,
      quantizationLevels: 8,
      feedbackAmount: 0.3,
      audioInfluence: 0.7,
      sortInterpolation: 1.0,
    },
    playback: {
      defaultOrder: 'sequential',
      loopMode: 'loop',
    },
    accessibility: {
      respectReducedMotion: true,
      reducedMotionFallback: 'static',
    },
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
    // See file header for configuration instructions
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
        ssao: {
          enabled: false,
          quality: 'medium',
        },
        depthOfField: {
          enabled: false,
          focusDistance: 10,
          aperture: 0.025,
          maxBlur: 1.0,
        },
        motionBlur: {
          enabled: false,
          intensity: 1.0,
        },
      },
    },

    // Weather effects configuration
    weatherEffects: {
      enabled: true,
      // Rain particle settings
      rain: {
        maxParticles: 5000, // Maximum rain particles (reduced on mobile)
        mobileParticles: 1500, // Particle count for mobile devices
        particleSize: 0.1, // Base particle size
        fallSpeed: 15, // Base fall speed
        spread: 100, // Horizontal spread area
        height: 50, // Rain spawn height
        opacity: 0.6, // Base opacity
        color: '#a0a0ff', // Rain color (slight blue tint)
      },
      // Snow particle settings
      snow: {
        maxParticles: 3000, // Maximum snow particles (reduced on mobile)
        mobileParticles: 1000, // Particle count for mobile devices
        particleSize: 0.2, // Base particle size
        fallSpeed: 2, // Base fall speed (slower than rain)
        spread: 100, // Horizontal spread area
        height: 50, // Snow spawn height
        opacity: 0.8, // Base opacity
        color: '#ffffff', // Snow color
        wobbleAmount: 0.5, // Horizontal drift amount
      },
      // Fog settings
      fog: {
        minDensity: 0.005, // Minimum fog density
        maxDensity: 0.05, // Maximum fog density (high humidity)
        transitionSpeed: 0.5, // How fast fog transitions
      },
      // Wind influence on particles
      wind: {
        maxInfluence: 10, // Maximum horizontal velocity from wind
        turbulence: 0.3, // Random turbulence factor
      },
    },

    // Time-of-day lighting configuration
    lighting: {
      enabled: true,
      // Sun simulation parameters
      sun: {
        // Intensity multipliers for different times of day
        intensity: {
          night: 0.1,
          dawn: 0.5,
          morning: 0.8,
          afternoon: 1.0,
          dusk: 0.5,
        },
        // Sun position calculation parameters
        elevation: {
          night: -30, // Below horizon
          dawn: 5, // Just above horizon
          morning: 30, // Rising
          afternoon: 60, // High
          dusk: 5, // Setting
        },
      },
      // Ambient light configuration
      ambient: {
        // Base intensities by time of day
        intensity: {
          night: 0.15,
          dawn: 0.4,
          morning: 0.6,
          afternoon: 0.7,
          dusk: 0.4,
        },
        // Color temperatures (Kelvin) by time of day
        colorTemperature: {
          night: 8000, // Cool blue
          dawn: 3000, // Warm orange
          morning: 5500, // Neutral daylight
          afternoon: 6000, // Slightly cool
          dusk: 2500, // Very warm
        },
      },
      // Smooth transition settings
      transition: {
        duration: 2.0, // Seconds for color/intensity transitions
        easing: 'easeInOutQuad', // Easing function name
      },
    },

    // Moon phase configuration
    moon: {
      enabled: true,
      // Glow intensity multiplier based on illumination
      glowMultiplier: 1.5,
      // Color tinting during night scenes
      nightTint: {
        color: '#4466aa', // Slight blue tint
        intensity: 0.2, // How strong the tint is
      },
      // Full moon special effects
      fullMoon: {
        threshold: 0.85, // Illumination percentage to trigger effects
        bloomBoost: 0.3, // Additional bloom strength
        highlightBoost: 1.2, // Multiply highlight brightness
      },
    },

    // Environment data update intervals (in milliseconds)
    updateIntervals: {
      weather: 300000, // 5 minutes
      astronomy: 3600000, // 1 hour
    },

    // Response caching configuration
    cache: {
      weatherTTL: 300000, // 5 minutes
      astronomyTTL: 3600000, // 1 hour
      locationTTL: 86400000, // 24 hours
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
      sourceImage: 'ogod/bgimages/ogod1.png',
    },
    2: {
      game: 'Castlevania',
      archetype: 'layered-colors',
      palette: ['#FF1493', '#8B008B', '#000000', '#4A0028'],
      artwork: 'img/photos/artwork/ogod/ogod2.jpg',
      sourceImage: 'ogod/bgimages/tumblr_na2bnr60KJ1rkla8lo1_1280.png',
    },
    3: {
      game: 'Chrono Trigger',
      archetype: 'glitch-digital',
      palette: ['#00FFFF', '#FF00FF', '#000000', '#FFFFFF'],
      artwork: 'img/photos/artwork/ogod/ogod3.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0g60uIzHM1rkla8lo1_1280.jpg',
    },
    4: {
      game: 'Disco Train',
      archetype: 'stripe-bar',
      palette: ['#CDDC39', '#FFEB3B', '#FF9800', '#8BC34A'],
      artwork: 'img/photos/artwork/ogod/ogod4.jpg',
      sourceImage: 'ogod/bgimages/tumblr_mxwumuwOvi1rkla8lo1_500.png',
    },
    5: {
      game: 'DKC2 Stickerbush',
      archetype: 'high-contrast',
      palette: ['#000000', '#FFFFFF', '#1A1A1A', '#E5E5E5'],
      artwork: 'img/photos/artwork/ogod/ogod5.png',
      sourceImage: 'ogod/bgimages/tumblr_nfea9aCJOk1rkla8lo1_1280.jpg',
    },
    6: {
      game: 'Earthworm Jim',
      archetype: 'gradient-fog',
      palette: ['#4DD0C4', '#D47BC4', '#E8A87C', '#7BC4D4'],
      artwork: 'img/photos/artwork/ogod/ogod6.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n7mmg05iLM1rkla8lo1_1280.png',
    },
    7: {
      game: 'Final Fantasy',
      archetype: 'gradient-fog',
      palette: ['#E8E8E8', '#C4D4E8', '#B8C8D8', '#D8E8F0'],
      artwork: 'img/photos/artwork/ogod/ogod7.jpg',
      sourceImage: 'ogod/bgimages/tumblr_na5ei3a6cE1rkla8lo1_r1_1280.png',
    },
    8: {
      game: 'FFIV',
      archetype: 'bokeh-grid',
      palette: ['#000000', '#00FF00', '#0066FF', '#00FFFF'],
      artwork: 'img/photos/artwork/ogod/ogod8.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n854ss5vxo1rkla8lo1_r1_1280-2.png',
    },
    9: {
      game: 'Golden Sun',
      archetype: 'gradient-fog',
      palette: ['#FF0000', '#CC0000', '#990000', '#660000'],
      artwork: 'img/photos/artwork/ogod/ogod9.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n5y981k4Xm1rkla8lo1_1280.png',
    },
    10: {
      game: 'Goldeneye 007',
      archetype: 'gradient-fog',
      palette: ['#B8C4D8', '#9EADC7', '#7A96C0', '#D4A5C9'],
      artwork: 'img/photos/artwork/ogod/ogod10.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0my2eR9BS1rkla8lo1_r1_500.jpg',
    },
    11: {
      game: 'Harvest Moon',
      archetype: 'stripe-bar',
      palette: ['#00FF00', '#00CC00', '#000000', '#008800'],
      artwork: 'img/photos/artwork/ogod/ogod11.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0wqegtf5K1rkla8lo1_500 copy 2.png',
    },
    12: {
      game: 'Kid Icarus',
      archetype: 'bokeh-grid',
      palette: ['#FF00FF', '#00FFFF', '#FFFF00', '#00FF00'],
      artwork: 'img/photos/artwork/ogod/ogod12.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0vzqeTdhs1rkla8lo1_500.jpg',
    },
    13: {
      game: 'Link to the Past',
      archetype: 'bokeh-grid',
      palette: ['#0000FF', '#4444FF', '#FFFFFF', '#C4D4FF'],
      artwork: 'img/photos/artwork/ogod/ogod13.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n99xrl93UE1rkla8lo2_1280.png',
    },
    14: {
      game: "Luigi's Mansion",
      archetype: 'gradient-fog',
      palette: ['#7EC8A3', '#A3D4E8', '#E8B4C8', '#B8E4C8'],
      artwork: 'img/photos/artwork/ogod/ogod14.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n3q0d6xwbR1rkla8lo1_1280.jpeg',
    },
    15: {
      game: 'Mario 64',
      archetype: 'gradient-fog',
      palette: ['#87CEEB', '#90EE90', '#FFD700', '#FF6B6B'],
      artwork: 'img/photos/artwork/ogod/ogod15.png',
      sourceImage: 'ogod/bgimages/tumblr_n7ohxa4Xuw1rkla8lo1_1280.png',
    },
    16: {
      game: 'Megaman 8',
      archetype: 'glitch-digital',
      palette: ['#00BFFF', '#FF4500', '#FFD700', '#32CD32'],
      artwork: 'img/photos/artwork/ogod/ogod16.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n8mekghYYk1rkla8lo1_1280.png',
    },
    17: {
      game: 'Metroid Prime',
      archetype: 'gradient-fog',
      palette: ['#FF4500', '#1E90FF', '#00FF00', '#8B0000'],
      artwork: null,
      sourceImage: 'ogod/bgimages/tumblr_nbbxbggIob1rkla8lo2_1280.png',
    },
    18: {
      game: 'Metroid',
      archetype: 'stripe-bar',
      palette: ['#4A90A4', '#2E5A6B', '#1A3A4A', '#6EB4D4'],
      artwork: 'img/photos/artwork/ogod/ogod18.png',
      sourceImage: 'ogod/bgimages/tumblr_n7otnd5bC11rkla8lo1_1280.png',
    },
    19: {
      game: 'Okami',
      archetype: 'high-contrast',
      palette: ['#000000', '#FFFFFF', '#F5F5DC', '#1A1A1A'],
      artwork: 'img/photos/artwork/ogod/ogod19.jpg',
      sourceImage: 'ogod/bgimages/DSC_1880-Recovered.jpg',
    },
    20: {
      game: 'Pikmin',
      archetype: 'stripe-bar',
      palette: ['#FF0000', '#0000FF', '#000000', '#FF00FF'],
      artwork: 'img/photos/artwork/ogod/ogod20.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n9hgugfwK71rkla8lo1_1280.png',
    },
    21: {
      game: 'Resident Evil 4',
      archetype: 'glitch-digital',
      palette: ['#00FF00', '#FFFF00', '#00FFFF', '#FF0000'],
      artwork: 'img/photos/artwork/ogod/ogod21.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n2qsnhTfae1rkla8lo1_1280.png',
    },
    22: {
      game: 'Star Fox',
      archetype: 'gradient-fog',
      palette: ['#1E90FF', '#32CD32', '#FFD700', '#8B4513'],
      artwork: 'img/photos/artwork/ogod/ogod22.jpg',
      sourceImage: 'ogod/bgimages/tumblr_mztdsvevZy1rkla8lo1_500.jpg',
    },
    23: {
      game: 'Street Fighter',
      archetype: 'bokeh-grid',
      palette: ['#0066FF', '#FFFF00', '#FF0000', '#00FFFF'],
      artwork: 'img/photos/artwork/ogod/ogod23.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n3ix9w07FC1rkla8lo1_1280.png',
    },
    24: {
      game: 'Mario RPG',
      archetype: 'gradient-fog',
      palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
      artwork: 'img/photos/artwork/ogod/ogod24.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n7zt5g3SIP1rkla8lo1_1280.png',
    },
    25: {
      game: 'Mario Sunshine',
      archetype: 'gradient-fog',
      palette: ['#00BFFF', '#FFD700', '#32CD32', '#FF6347'],
      artwork: 'img/photos/artwork/ogod/ogod25.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0wqegtf5K1rkla8lo1_500 copy.png',
    },
    26: {
      game: 'Melee',
      archetype: 'bokeh-grid',
      palette: ['#FF4500', '#1E90FF', '#32CD32', '#FFD700'],
      artwork: 'img/photos/artwork/ogod/ogod26.jpg',
      sourceImage: 'ogod/bgimages/tumblr_n0sff7ZKnp1rkla8lo1_500.jpg',
    },
    27: {
      game: 'Twilight Princess',
      archetype: 'layered-colors',
      palette: ['#2F4F4F', '#8B4513', '#DAA520', '#556B2F'],
      artwork: 'img/photos/artwork/ogod/ogod27.jpg',
      sourceImage:
        'ogod/bgimages/sin_city_style_rain_by_flashgunner-d3069a7.jpg',
    },
    28: {
      game: 'Wind Waker',
      archetype: 'gradient-fog',
      palette: ['#FF7F7F', '#FF9F9F', '#FFBFBF', '#9F7FBF'],
      artwork: 'img/photos/artwork/ogod/ogod28.png',
      sourceImage: 'ogod/bgimages/bg05.png',
    },
    29: {
      game: "Yoshi's Island",
      archetype: 'bokeh-grid',
      palette: ['#FF1493', '#4169E1', '#000000', '#FF69B4'],
      artwork: 'img/photos/artwork/ogod/ogod29.jpg',
      sourceImage: 'ogod/bgimages/tumblr_mqthg6a2y61rkla8lo1_1280.jpg',
    },
  },

  /**
   * Self-hosted media infrastructure configuration
   * Workstream B: Replace Bandcamp embeds with self-hosted audio/video
   */
  media: {
    // Cloudflare R2 storage base URL
    r2BaseUrl: 'https://media.etceter4.com',

    /**
     * Get the appropriate base URL for the current environment
     * @returns {string} Base URL for media assets
     */
    baseUrl() {
      if (typeof window !== 'undefined') {
        const hostname = window.location?.hostname || '';

        // Local development - use local fallback
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return '/media';
        }
      }
      // Production and preview deployments use R2
      return this.r2BaseUrl;
    },

    // Audio player settings
    audio: {
      // Default audio format preference order
      formatPriority: ['mp3', 'flac', 'ogg'],
      // Preview clip duration in seconds
      previewDuration: 30,
      // Waveform visualization settings
      waveform: {
        height: 80,
        barWidth: 2,
        barGap: 1,
        primaryColor: '#00FFFF',
        secondaryColor: '#FF00FF',
        progressColor: '#FFFFFF',
        backgroundColor: 'transparent',
      },
      // Crossfade duration between tracks (ms)
      crossfadeDuration: 1000,
      // Volume settings
      defaultVolume: 0.8,
      fadeOutDuration: 500,
      fadeInDuration: 500,
    },

    // Video player settings
    video: {
      // Quality preference order
      qualityOrder: ['1080p', '720p', '480p', '360p'],
      // Default to adaptive streaming if available
      preferAdaptive: true,
      // Thumbnail preview interval (seconds)
      thumbnailInterval: 10,
      // Buffer ahead duration (seconds)
      bufferAhead: 30,
      // HLS.js configuration
      hlsConfig: {
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // Auto quality selection
        enableWorker: true,
        lowLatencyMode: false,
      },
    },

    // Album metadata
    albums: {
      ogod: {
        id: 'ogod',
        title: 'OGOD',
        shortTitle: 'OGOD',
        artist: 'ET CETER4',
        year: 2015,
        trackCount: 29,
        coverArt: {
          large: 'audio/albums/ogod/cover-1200.jpg',
          medium: 'audio/albums/ogod/cover-600.jpg',
          small: 'audio/albums/ogod/cover-300.jpg',
        },
        hasLyrics: true,
        hasStems: true,
        tracks: [
          { id: 'ogod-01', title: 'I. Overture', duration: '2:45' },
          { id: 'ogod-02', title: 'II. Descent', duration: '3:12' },
          { id: 'ogod-03', title: 'III. Labyrinth', duration: '2:58' },
          { id: 'ogod-04', title: 'IV. Horizon', duration: '3:30' },
          { id: 'ogod-05', title: 'V. Cascade', duration: '2:15' },
          { id: 'ogod-06', title: 'VI. Mirage', duration: '3:05' },
          { id: 'ogod-07', title: 'VII. Tempest', duration: '2:48' },
          { id: 'ogod-08', title: 'VIII. Reverie', duration: '3:22' },
          { id: 'ogod-09', title: 'IX. Eclipse', duration: '2:35' },
          { id: 'ogod-10', title: 'X. Zenith', duration: '3:10' },
          { id: 'ogod-11', title: 'XI. Resonance', duration: '2:52' },
          { id: 'ogod-12', title: 'XII. Fragment', duration: '1:55' },
          { id: 'ogod-13', title: 'XIII. Drift', duration: '3:40' },
          { id: 'ogod-14', title: 'XIV. Pulse', duration: '2:28' },
          { id: 'ogod-15', title: 'XV. Fracture', duration: '3:15' },
          { id: 'ogod-16', title: 'XVI. Convergence', duration: '2:42' },
          { id: 'ogod-17', title: 'XVII. Static', duration: '1:48' },
          { id: 'ogod-18', title: 'XVIII. Bloom', duration: '3:33' },
          { id: 'ogod-19', title: 'XIX. Threshold', duration: '2:20' },
          { id: 'ogod-20', title: 'XX. Cipher', duration: '3:08' },
          { id: 'ogod-21', title: 'XXI. Hollow', duration: '2:55' },
          { id: 'ogod-22', title: 'XXII. Surge', duration: '3:18' },
          { id: 'ogod-23', title: 'XXIII. Passage', duration: '2:10' },
          { id: 'ogod-24', title: 'XXIV. Void', duration: '3:45' },
          { id: 'ogod-25', title: 'XXV. Refraction', duration: '2:38' },
          { id: 'ogod-26', title: 'XXVI. Signal', duration: '3:02' },
          { id: 'ogod-27', title: 'XXVII. Ascent', duration: '2:22' },
          { id: 'ogod-28', title: 'XXVIII. Dissolution', duration: '3:50' },
          { id: 'ogod-29', title: 'XXIX. Coda', duration: '4:15' },
        ],
      },
      rmxs: {
        id: 'rmxs',
        title: 'ET CETER4 RMXS',
        shortTitle: 'RMXS',
        artist: 'ET CETER4',
        year: 2020,
        trackCount: 6,
        coverArt: {
          large: 'audio/albums/rmxs/cover-1200.jpg',
          medium: 'audio/albums/rmxs/cover-600.jpg',
          small: 'audio/albums/rmxs/cover-300.jpg',
        },
        tracks: [
          {
            id: 'rmx-01',
            title: 'Opening (Recontextualized)',
            duration: '4:30',
          },
          {
            id: 'rmx-02',
            title: 'Tangent I (Deconstructed)',
            duration: '5:15',
          },
          {
            id: 'rmx-03',
            title: 'Parallel Lines (Inverted)',
            duration: '4:45',
          },
          { id: 'rmx-04', title: 'Recursive (Unfolded)', duration: '5:50' },
          { id: 'rmx-05', title: 'Convergence (Scattered)', duration: '4:20' },
          { id: 'rmx-06', title: 'Return (Reimagined)', duration: '6:10' },
        ],
      },
      progressionDigression: {
        id: 'progression-digression',
        title: 'The Progression of Digression',
        shortTitle: 'P/D',
        artist: 'ET CETER4',
        year: 2012,
        trackCount: 12,
        coverArt: {
          large: 'audio/albums/progression-digression/cover-1200.jpg',
          medium: 'audio/albums/progression-digression/cover-600.jpg',
          small: 'audio/albums/progression-digression/cover-300.jpg',
        },
        tracks: [
          { id: 'pd-01', title: 'Opening Statement', duration: '4:12' },
          { id: 'pd-02', title: 'Tangent I', duration: '3:45' },
          { id: 'pd-03', title: 'Parallel Lines', duration: '5:20' },
          { id: 'pd-04', title: 'Deviation', duration: '3:58' },
          { id: 'pd-05', title: 'Recursive', duration: '4:30' },
          { id: 'pd-06', title: 'Tangent II', duration: '3:15' },
          { id: 'pd-07', title: 'Convergence Point', duration: '4:48' },
          { id: 'pd-08', title: 'Lateral Drift', duration: '3:22' },
          { id: 'pd-09', title: 'Tangent III', duration: '3:55' },
          { id: 'pd-10', title: 'Return Path', duration: '4:10' },
          { id: 'pd-11', title: 'Final Digression', duration: '5:05' },
          { id: 'pd-12', title: 'Closing Statement', duration: '6:15' },
        ],
      },
      etc: {
        id: 'etc',
        title: 'Etc',
        shortTitle: 'Etc',
        artist: 'ET CETER4',
        year: 2011,
        trackCount: 5,
        coverArt: {
          large: 'audio/albums/etc/cover-1200.jpg',
          medium: 'audio/albums/etc/cover-600.jpg',
          small: 'audio/albums/etc/cover-300.jpg',
        },
        tracks: [
          { id: 'etc-01', title: 'Et', duration: '3:30' },
          { id: 'etc-02', title: 'Cetera', duration: '4:15' },
          { id: 'etc-03', title: 'And So On', duration: '3:55' },
          { id: 'etc-04', title: 'Continued', duration: '4:40' },
          { id: 'etc-05', title: 'Ellipsis', duration: '5:20' },
        ],
      },
    },

    // Service Worker caching settings
    cache: {
      enabled: true,
      // Cache audio for offline listening
      audioTTL: 604800000, // 7 days
      // Cache video thumbnails
      thumbnailTTL: 86400000, // 24 hours
      // Max cached audio size in bytes (100MB)
      maxAudioCacheSize: 104857600,
    },
  },

  /**
   * Living Pantheon generative features configuration
   * Workstream C: Generative visual/audio system
   */
  livingPantheon: {
    // Master toggle
    enabled: true,

    // Global glitch effects (2% random visual glitches)
    glitch: {
      enabled: true,
      // Probability of glitch occurring per check (0.02 = 2%)
      frequency: 0.02,
      // Check interval in milliseconds
      checkInterval: 5000,
      // Available glitch effect types
      types: ['text', 'color', 'position', 'image'],
      // Duration of glitch effect in milliseconds
      duration: {
        min: 50,
        max: 200,
      },
      // Elements to exclude from glitching (selectors)
      excludeSelectors: ['.no-glitch', 'input', 'button', 'a'],
    },

    // Morphing image system (photo→glitch→abstract over 60s)
    morphing: {
      enabled: true,
      // Total transition duration in milliseconds
      transitionDuration: 60000,
      // Pause between morph cycles
      pauseBetween: 30000,
      // Image containers to morph (selectors)
      targetSelectors: ['.morph-image', '.morphing-target'],
      // Blend modes to cycle through
      blendModes: ['normal', 'multiply', 'screen', 'overlay', 'difference'],
    },

    // Ambient sound layer (5% volume background)
    ambient: {
      enabled: true,
      // Base volume (0.0 to 1.0, recommended 0.05 for 5%)
      baseVolume: 0.05,
      // Chamber-specific ambient sounds
      chamberSpecific: true,
      // Fade duration when changing chambers
      crossfadeDuration: 2000,
      // Default ambient track path
      defaultTrack: 'audio/ambient/temple-drone.mp3',
      // Chamber-specific ambient tracks
      chamberTracks: {
        akademia: 'audio/ambient/scholarly-hum.mp3',
        bibliotheke: 'audio/ambient/paper-rustle.mp3',
        oikos: 'audio/ambient/hearth-crackle.mp3',
        pinakotheke: 'audio/ambient/gallery-echo.mp3',
        odeion: 'audio/ambient/concert-hall.mp3',
        theatron: 'audio/ambient/stage-ambience.mp3',
        agora: 'audio/ambient/crowd-murmur.mp3',
        symposion: 'audio/ambient/conversation.mp3',
        ergasterion: 'audio/ambient/machine-hum.mp3',
        khronos: 'audio/ambient/clock-tick.mp3',
      },
    },

    // Animated content (breathing sections, text drift)
    animation: {
      enabled: true,
      // Breathing animation (subtle scale pulse)
      breathing: {
        enabled: true,
        // Scale range (1.0 = no scale, 1.02 = 2% larger)
        scaleMin: 1.0,
        scaleMax: 1.02,
        // Duration of one breath cycle in milliseconds
        duration: 4000,
        // Elements to animate (selectors)
        targetSelectors: ['.breathing', '.living-element'],
      },
      // Text drift (subtle position movement)
      textDrift: {
        enabled: true,
        // Maximum drift in pixels
        maxDrift: 2,
        // Duration of drift cycle in milliseconds
        duration: 8000,
        // Elements to animate (selectors)
        targetSelectors: ['.drifting-text', '.living-text'],
      },
    },

    // Generative labyrinth (expanded diary with fragments)
    labyrinth: {
      enabled: true,
      // Number of text fragments to include
      fragmentCount: 100,
      // Number of secret loopholes
      loopholeCount: 10,
      // Fragment sources
      fragmentSources: ['js/living-pantheon/data/fragments.json'],
      // Loophole trigger probability
      loopholeProbability: 0.05,
    },

    // Glitch tunnel transitions between chambers
    glitchTunnels: {
      enabled: true,
      // Probability of triggering per navigation (0.1 = 10%)
      probability: 0.1,
      // Total effect duration in milliseconds
      duration: 2000,
      // Capture resolution (lower = faster)
      captureWidth: 640,
      captureHeight: 480,
      // Pixel sort parameters
      pixelSort: {
        thresholdLow: 0.1,
        thresholdHigh: 0.85,
      },
    },

    // Accessibility settings
    accessibility: {
      // Respect prefers-reduced-motion media query
      respectReducedMotion: true,
      // Allow user to toggle via localStorage
      allowUserToggle: true,
      // LocalStorage key for user preference
      storageKey: 'etceter4-living-pantheon-enabled',
      // Keyboard shortcut to toggle (Ctrl+Shift+L)
      toggleShortcut: { ctrl: true, shift: true, key: 'l' },
    },
  },

  /**
   * Chamber configuration
   * Maps chamber IDs to their visual themes
   */
  chambers: {
    // East Wing - Scholarship
    akademia: {
      name: 'AKADEMIA',
      subtitle: 'Essays, research, theoretical writings',
      color: '#00FFFF',
      wing: 'east',
    },
    bibliotheke: {
      name: 'BIBLIOTHEKE',
      subtitle: 'Poetry, prose, lyrics, literary criticism',
      color: '#8B4513',
      secondaryColor: '#F5F5DC',
      wing: 'east',
    },
    pinakotheke: {
      name: 'PINAKOTHEKE',
      subtitle: 'Photography, digital art, glitch, generative',
      color: '#FF00FF',
      wing: 'east',
    },

    // West Wing - Discourse
    agora: {
      name: 'AGORA',
      subtitle: 'Political commentary, manifestos, social critique',
      color: '#DC143C',
      wing: 'west',
    },
    symposion: {
      name: 'SYMPOSION',
      subtitle: 'Dialogues, interviews, conversations',
      color: '#722F37',
      secondaryColor: '#F5F5DC',
      wing: 'west',
    },
    oikos: {
      name: 'OIKOS',
      subtitle: 'Reflections, dreams, confessions',
      color: '#FF8C00',
      secondaryColor: '#FFB6C1',
      wing: 'west',
    },

    // Southern Portico - Performance
    odeion: {
      name: 'ODEION',
      subtitle: 'Albums, singles, demos, experimental',
      color: '#FFD700',
      wing: 'south',
    },
    theatron: {
      name: 'THEATRON',
      subtitle: 'Performance recordings, rehearsals, stage',
      color: '#800080',
      wing: 'south',
    },

    // Northern Portal - Process
    ergasterion: {
      name: 'ERGASTERION',
      subtitle: 'Code experiments, prototypes, interactive demos',
      color: '#00FF00',
      wing: 'north',
    },
    khronos: {
      name: 'KHRONOS',
      subtitle: 'Historical archive, evolution tracking, milestones',
      color: '#4169E1',
      wing: 'north',
    },
  },

  /**
   * Discovery system configuration
   * Unified search, filtering, and content discovery across all chambers
   */
  discovery: {
    // Search configuration
    search: {
      // Minimum characters before search triggers
      minQueryLength: 2,
      // Debounce delay for search input (ms)
      debounceMs: 300,
      // MiniSearch options
      fuzzyThreshold: 0.3,
      // Field weights for search scoring
      fieldWeights: {
        title: 3,
        tags: 2.5,
        description: 2,
        content: 1,
      },
      // Maximum results to return
      maxResults: 50,
    },

    // Filter configuration
    filters: {
      // Maximum tags shown in tag cloud
      maxTagsShown: 20,
      // Persist filter state to URL
      persistToUrl: true,
      // Default filter state
      defaults: {
        tags: [],
        chambers: [],
        types: [],
        wings: [],
      },
    },

    // Related works configuration
    relatedWorks: {
      // Maximum related items to show
      maxItems: 5,
      // Minimum score threshold to show item
      scoreThreshold: 0.15,
      // Scoring weights
      weights: {
        tagOverlap: 0.4, // Jaccard similarity of tags
        sameSection: 0.15, // Same section within chamber
        sameChamber: 0.1, // Same chamber
        sameWing: 0.05, // Same wing
        temporal: 0.15, // Temporal proximity (same year/period)
        typeMatch: 0.15, // Same content type
      },
    },

    // Pagination configuration
    pagination: {
      // Items per page in discovery view
      itemsPerPage: 24,
      // Maximum page navigation buttons to show
      maxPageButtons: 7,
    },

    // UI configuration
    ui: {
      // Show quick filter buttons
      showQuickFilters: true,
      // Quick filter presets
      quickFilters: [
        { id: 'all', label: 'All', criteria: {} },
        { id: 'audio', label: 'Audio', criteria: { types: ['audio'] } },
        { id: 'visual', label: 'Visual', criteria: { types: ['visual'] } },
        { id: 'text', label: 'Writing', criteria: { types: ['text'] } },
        { id: 'code', label: 'Code', criteria: { types: ['code'] } },
      ],
      // Animate result changes
      animateResults: true,
      // Animation duration (ms)
      animationDuration: 200,
    },

    // Keyboard shortcuts
    shortcuts: {
      // Open global search modal
      openSearch: { meta: true, key: 'k' },
      // Close modal
      closeModal: { key: 'Escape' },
      // Navigate results
      nextResult: { key: 'ArrowDown' },
      prevResult: { key: 'ArrowUp' },
      // Select result
      selectResult: { key: 'Enter' },
    },

    // Accessibility
    accessibility: {
      // Storage key for preferences
      storageKey: 'etceter4-discovery-prefs',
      // ARIA labels
      ariaLabels: {
        searchInput: 'Search all chambers',
        filterPanel: 'Filter options',
        resultsGrid: 'Search results',
        tagCloud: 'Filter by tag',
        pagination: 'Results pagination',
      },
    },
  },
};
