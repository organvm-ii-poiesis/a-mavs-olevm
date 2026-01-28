'use strict';

/* global createjs */

/**
 * @file uiSounds.js
 * @description UI Sound Effects module using SoundJS audio sprites
 *
 * Provides subtle audio feedback for UI interactions:
 * - Page transitions
 * - Hover events
 * - Click events
 *
 * Uses audio sprites for efficient loading (single file with multiple sounds)
 *
 * @requires SoundJS (CreateJS)
 */

/**
 * UISounds Module
 * Singleton pattern for managing UI sound effects
 */
const UISounds = {
  /** @type {boolean} Whether the module has been initialized */
  initialized: false,

  /** @type {boolean} Whether sounds are enabled */
  enabled: true,

  /** @type {boolean} Whether sounds have been registered */
  registered: false,

  /** @type {number} Master volume (0-1) */
  volume: 0.3,

  /** @type {Object} Sound configuration */
  config: {
    basePath: 'audio/',
    spriteFile: 'ui-sounds.ogg',
    // Fallback formats for browser compatibility
    alternateFormats: ['mp3', 'wav'],
    // Audio sprite definitions (startTime and duration in ms)
    sprites: {
      click: { startTime: 0, duration: 100 },
      hover: { startTime: 150, duration: 80 },
      pageEnter: { startTime: 300, duration: 300 },
      pageExit: { startTime: 700, duration: 400 },
      transition: { startTime: 1200, duration: 500 },
    },
  },

  /**
   * Initialize the UI sounds module
   * Registers sounds with SoundJS
   * @returns {boolean} True if initialization successful
   */
  init() {
    if (this.initialized) {
      return true;
    }

    // Check if SoundJS is available
    if (typeof createjs === 'undefined' || !createjs.Sound) {
      console.warn('UISounds: SoundJS not available, using silent mode');
      this.initialized = true;
      this.enabled = false;
      return false;
    }

    try {
      // Detect supported format
      const supported = this._detectFormat();
      if (!supported) {
        console.warn('UISounds: No supported audio format detected');
        this.enabled = false;
        return false;
      }

      // Build sprite array from config
      const sprites = Object.entries(this.config.sprites).map(([id, config]) => ({
        id,
        startTime: config.startTime,
        duration: config.duration,
      }));

      // Register the audio sprite
      createjs.Sound.registerSounds(
        [
          {
            src: this.config.spriteFile,
            data: { audioSprite: sprites },
          },
        ],
        this.config.basePath
      );

      this.registered = true;
      this.initialized = true;

      console.log('UISounds: Initialized successfully');
      return true;
    } catch (error) {
      console.error('UISounds: Initialization error:', error.message);
      this.enabled = false;
      return false;
    }
  },

  /**
   * Play a UI sound
   * @param {string} soundId - The sound to play (click, hover, pageEnter, pageExit, transition)
   * @param {number} [volumeMultiplier=1] - Volume multiplier (0-1)
   * @returns {Object|null} SoundJS instance or null if not playing
   */
  play(soundId, volumeMultiplier = 1) {
    if (!this.enabled || !this.initialized) {
      return null;
    }

    // Lazy initialization
    if (!this.registered) {
      this.init();
    }

    // Validate sound ID
    if (!this.config.sprites[soundId]) {
      console.warn(`UISounds: Unknown sound '${soundId}'`);
      return null;
    }

    try {
      const instance = createjs.Sound.play(soundId, {
        volume: this.volume * volumeMultiplier,
        interrupt: createjs.Sound.INTERRUPT_ANY,
      });
      return instance;
    } catch (error) {
      console.warn(`UISounds: Error playing '${soundId}':`, error.message);
      return null;
    }
  },

  /**
   * Play click sound
   * @param {number} [volume=1] - Volume multiplier
   */
  click(volume = 1) {
    this.play('click', volume);
  },

  /**
   * Play hover sound
   * @param {number} [volume=0.5] - Volume multiplier (default lower for less intrusive)
   */
  hover(volume = 0.5) {
    this.play('hover', volume);
  },

  /**
   * Play page enter sound
   * @param {number} [volume=1] - Volume multiplier
   */
  pageEnter(volume = 1) {
    this.play('pageEnter', volume);
  },

  /**
   * Play page exit sound
   * @param {number} [volume=1] - Volume multiplier
   */
  pageExit(volume = 1) {
    this.play('pageExit', volume);
  },

  /**
   * Play transition sound
   * @param {number} [volume=1] - Volume multiplier
   */
  transition(volume = 1) {
    this.play('transition', volume);
  },

  /**
   * Toggle sounds on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  /**
   * Enable sounds
   */
  enable() {
    this.enabled = true;
  },

  /**
   * Disable sounds
   */
  disable() {
    this.enabled = false;
  },

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  },

  /**
   * Get master volume
   * @returns {number} Current volume (0-1)
   */
  getVolume() {
    return this.volume;
  },

  /**
   * Check if sounds are enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled && this.initialized;
  },

  /**
   * Detect supported audio format
   * @private
   * @returns {string|null} Supported format or null
   */
  _detectFormat() {
    if (typeof createjs === 'undefined' || !createjs.Sound) {
      return null;
    }

    // SoundJS handles format detection internally
    // Just check if audio is supported at all
    const capabilities = createjs.Sound.getCapabilities();
    if (capabilities) {
      return 'ogg'; // Default format
    }

    return null;
  },
};

// Auto-initialize on DOM ready if SoundJS is available
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to not block page load
    setTimeout(() => {
      UISounds.init();
    }, 1000);
  });
}

// Export for ES modules or make global
if (typeof window !== 'undefined') {
  window.UISounds = UISounds;
}
