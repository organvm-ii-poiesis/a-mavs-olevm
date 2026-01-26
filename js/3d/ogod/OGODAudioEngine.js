/**
 * @file OGODAudioEngine.js
 * @description Audio engine for OGOD 3D environments using Tone.js
 * Handles stem-separated playback with position-based mixing
 */

'use strict';

/**
 * OGODAudioEngine - Stem-based audio mixing engine
 * @class
 */
class OGODAudioEngine {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.trackNumber - Track number (1-29)
   * @param {string} [options.stemsPath] - Base path for stem files
   * @param {boolean} [options.useFallback=true] - Use single file fallback if stems unavailable
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.ogodEnv?.audio || {}
        : {};

    this.trackNumber = options.trackNumber || 1;
    this.stemsPath = options.stemsPath || 'assets/audio/stems/ogod';
    this.fallbackPath = options.fallbackPath || 'ogod/ogodtracks';
    this.useFallback = options.useFallback !== false;

    this.config = {
      masterVolume: config.masterVolume || 0.8,
      stemBlendRadius: config.stemBlendRadius || 15,
      reverbMix: config.reverbMix || 0.3,
      delayTime: config.delayTime || 0.2,
    };

    // Stem names
    this.stemNames = ['drums', 'bass', 'vocals', 'other'];

    // Players for each stem
    this.players = {};
    this.stemVolumes = {};

    // Effects chain
    this.reverb = null;
    this.delay = null;
    this.masterGain = null;

    // State
    this.isInitialized = false;
    this.isPlaying = false;
    this.usingSingleFile = false;

    // Volume targets for smooth transitions
    this.volumeTargets = {};
    this.volumeLerpSpeed = 0.1;
  }

  /**
   * Get track filename from number
   * @private
   * @returns {string}
   */
  _getTrackFilename() {
    const romanNumerals = [
      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
      'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX',
    ];

    const numStr = String(this.trackNumber).padStart(2, '0');
    const roman = romanNumerals[this.trackNumber] || this.trackNumber;

    return `${numStr} ${roman}`;
  }

  /**
   * Initialize the audio engine
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create master gain
    this.masterGain = new Tone.Gain(this.config.masterVolume).toDestination();

    // Create effects
    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: this.config.reverbMix,
    }).connect(this.masterGain);

    this.delay = new Tone.FeedbackDelay({
      delayTime: this.config.delayTime,
      feedback: 0.2,
      wet: 0.1,
    }).connect(this.reverb);

    // Try to load stems
    const stemsLoaded = await this._loadStems();

    // Fall back to single file if stems not available
    if (!stemsLoaded && this.useFallback) {
      await this._loadFallbackAudio();
    }

    // Initialize volume targets
    for (const stem of this.stemNames) {
      this.stemVolumes[stem] = 1.0;
      this.volumeTargets[stem] = 1.0;
    }

    this.isInitialized = true;
  }

  /**
   * Load stem audio files
   * @private
   * @returns {Promise<boolean>} - Whether stems were loaded successfully
   */
  async _loadStems() {
    const trackNum = String(this.trackNumber).padStart(2, '0');
    const basePath = `${this.stemsPath}/${trackNum}`;

    try {
      const loadPromises = this.stemNames.map(async (stem) => {
        const url = `${basePath}/${stem}.mp3`;
        const player = new Tone.Player({
          url,
          loop: true,
          fadeIn: 0.5,
          fadeOut: 0.5,
        });

        // Connect through effects chain
        const gainNode = new Tone.Gain(1.0);
        player.connect(gainNode);
        gainNode.connect(this.delay);

        this.players[stem] = {
          player,
          gain: gainNode,
        };

        return player.loaded;
      });

      await Promise.all(loadPromises);
      return true;
    } catch (error) {
      console.warn('OGODAudioEngine: Could not load stems, will use fallback', error);
      return false;
    }
  }

  /**
   * Load single fallback audio file
   * @private
   * @returns {Promise<void>}
   */
  async _loadFallbackAudio() {
    const filename = this._getTrackFilename();
    const url = `${this.fallbackPath}/${filename}.mp3`;

    try {
      const player = new Tone.Player({
        url,
        loop: true,
        fadeIn: 0.5,
        fadeOut: 0.5,
      });

      player.connect(this.delay);

      this.players.master = {
        player,
        gain: null,
      };

      this.usingSingleFile = true;

      await player.loaded;
    } catch (error) {
      console.error('OGODAudioEngine: Could not load fallback audio', error);
    }
  }

  /**
   * Start audio playback
   */
  async start() {
    if (!this.isInitialized) {
      console.warn('OGODAudioEngine: Not initialized');
      return;
    }

    if (this.isPlaying) {
      return;
    }

    // Ensure Tone.js audio context is started
    await Tone.start();

    // Start all players
    const now = Tone.now();

    if (this.usingSingleFile) {
      this.players.master?.player.start(now);
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.start(now);
        }
      }
    }

    this.isPlaying = true;
  }

  /**
   * Stop audio playback
   */
  stop() {
    if (!this.isPlaying) {
      return;
    }

    if (this.usingSingleFile) {
      this.players.master?.player.stop();
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.stop();
        }
      }
    }

    this.isPlaying = false;
  }

  /**
   * Set stem volumes based on position
   * @param {Object} volumes - Object with stem names as keys and volumes (0-1) as values
   */
  setStemVolumes(volumes) {
    if (this.usingSingleFile) {
      // Can't mix individual stems with single file
      return;
    }

    for (const stem of this.stemNames) {
      if (Object.prototype.hasOwnProperty.call(volumes, stem)) {
        // Set target volume (will lerp towards it)
        this.volumeTargets[stem] = Math.max(0, Math.min(1, volumes[stem]));
      }
    }
  }

  /**
   * Update audio state - call each frame for smooth volume transitions
   */
  update() {
    if (!this.isPlaying || this.usingSingleFile) {
      return;
    }

    // Lerp volumes towards targets
    for (const stem of this.stemNames) {
      const current = this.stemVolumes[stem];
      const target = this.volumeTargets[stem];

      if (Math.abs(current - target) > 0.001) {
        const newVolume = current + (target - current) * this.volumeLerpSpeed;
        this.stemVolumes[stem] = newVolume;

        // Apply to gain node
        if (this.players[stem]?.gain) {
          this.players[stem].gain.gain.setValueAtTime(newVolume, Tone.now());
        }
      }
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume 0-1
   */
  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        Tone.now()
      );
    }
  }

  /**
   * Set reverb mix
   * @param {number} mix - Wet/dry mix 0-1
   */
  setReverbMix(mix) {
    if (this.reverb) {
      this.reverb.wet.setValueAtTime(
        Math.max(0, Math.min(1, mix)),
        Tone.now()
      );
    }
  }

  /**
   * Get current playback position
   * @returns {number} - Current position in seconds
   */
  getPosition() {
    if (this.usingSingleFile) {
      return this.players.master?.player.toSeconds() || 0;
    }

    // Use first stem as reference
    const firstStem = this.stemNames[0];
    return this.players[firstStem]?.player.toSeconds() || 0;
  }

  /**
   * Get current stem volumes
   * @returns {Object}
   */
  getStemVolumes() {
    return { ...this.stemVolumes };
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    // Dispose players
    if (this.usingSingleFile) {
      this.players.master?.player.dispose();
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.dispose();
          this.players[stem].gain.dispose();
        }
      }
    }

    // Dispose effects
    this.reverb?.dispose();
    this.delay?.dispose();
    this.masterGain?.dispose();

    this.players = {};
    this.isInitialized = false;
  }
}

// Export for global scope
window.OGODAudioEngine = OGODAudioEngine;

/**
 * Helper function to create a complete OGOD experience
 * @param {Object} options
 * @param {HTMLElement} options.container - Container element
 * @param {number} options.trackNumber - Track number (1-29)
 * @returns {Promise<Object>} - Object with sceneManager and audioEngine
 */
async function createOGODExperience(options = {}) {
  const { container, trackNumber = 1 } = options;

  // Create audio engine
  const audioEngine = new OGODAudioEngine({ trackNumber });
  await audioEngine.initialize();

  // Create scene manager with audio engine
  const sceneManager = new OGODSceneManager({
    container,
    trackNumber,
    audioEngine,
  });
  await sceneManager.initialize();

  // Connect audio update to animation loop
  sceneManager.sceneManager.onAnimate((delta) => {
    audioEngine.update(delta);
    sceneManager.controller?.update(delta);
  });

  return {
    sceneManager,
    audioEngine,
    start: () => {
      sceneManager.start();
      audioEngine.start();
    },
    stop: () => {
      sceneManager.stop();
      audioEngine.stop();
    },
    dispose: () => {
      sceneManager.dispose();
      audioEngine.dispose();
    },
  };
}

// Export helper
window.createOGODExperience = createOGODExperience;
