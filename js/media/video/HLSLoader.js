'use strict';

/**
 * HLSLoader
 * Adapter for HLS.js integration with video elements.
 * Provides a simplified interface for loading HLS streams,
 * managing quality levels, and handling HLS-specific events.
 *
 * @class HLSLoader
 * @example
 * const video = document.querySelector('video');
 * const loader = new HLSLoader(video);
 * await loader.loadSource('https://media.etceter4.com/video/stream/master.m3u8');
 * loader.on('qualitiesAvailable', (qualities) => console.log(qualities));
 */
class HLSLoader {
  /**
   * Create an HLSLoader instance
   * @param {HTMLVideoElement} videoElement - The video element to attach to
   * @param {Object} [config={}] - HLS.js configuration overrides
   */
  constructor(videoElement, config = {}) {
    if (!videoElement || videoElement.tagName !== 'VIDEO') {
      throw new Error('HLSLoader requires a valid video element');
    }

    this.videoElement = videoElement;
    this.hls = null;
    this.isSupported = false;
    this.hasNativeSupport = false;
    this.currentQuality = -1; // -1 = auto
    this.availableQualities = [];
    this.isLoaded = false;
    this.currentUrl = null;

    // Event listeners
    this.eventListeners = {};

    // Merge config with defaults
    this.config = {
      debug: false,
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      startLevel: -1, // Auto
      capLevelToPlayerSize: true,
      ...config,
    };

    // Check HLS.js support
    this.checkSupport();
  }

  /**
   * Check browser support for HLS
   * @private
   */
  checkSupport() {
    // Check if HLS.js is available and supported
    if (typeof window !== 'undefined' && window.Hls) {
      this.isSupported = window.Hls.isSupported();
    }

    // Check for native HLS support (Safari)
    this.hasNativeSupport = this.videoElement.canPlayType('application/vnd.apple.mpegurl') !== '';
  }

  /**
   * Check if HLS can be played (either via HLS.js or native)
   * @returns {boolean}
   */
  canPlay() {
    return this.isSupported || this.hasNativeSupport;
  }

  /**
   * Load an HLS source
   * @param {string} src - HLS manifest URL (.m3u8)
   * @returns {Promise<void>}
   */
  loadSource(src) {
    return new Promise((resolve, reject) => {
      this.currentUrl = src;

      if (this.isSupported) {
        this.loadWithHlsJs(src, resolve, reject);
      } else if (this.hasNativeSupport) {
        this.loadNative(src, resolve, reject);
      } else {
        reject(new Error('HLS is not supported in this browser'));
      }
    });
  }

  /**
   * Load source using HLS.js
   * @private
   */
  loadWithHlsJs(src, resolve, reject) {
    // Destroy existing instance
    if (this.hls) {
      this.hls.destroy();
    }

    const Hls = window.Hls;
    this.hls = new Hls(this.config);

    // Handle manifest parsed (qualities available)
    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      this.availableQualities = this.hls.levels.map((level, index) => ({
        index,
        height: level.height,
        width: level.width,
        bitrate: level.bitrate,
        name: level.height ? `${level.height}p` : 'Auto',
        codec: level.videoCodec,
      }));

      this.isLoaded = true;
      this.emit('qualitiesAvailable', this.availableQualities);
      this.emit('manifestParsed', data);
      resolve();
    });

    // Handle level switch
    this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      this.currentQuality = data.level;
      const level = this.hls.levels[data.level];
      this.emit('qualityChange', {
        levelIndex: data.level,
        quality: level.height ? `${level.height}p` : 'Auto',
        bitrate: level.bitrate,
      });
    });

    // Handle level loading
    this.hls.on(Hls.Events.LEVEL_LOADING, (event, data) => {
      this.emit('levelLoading', data);
    });

    // Handle fragment loaded
    this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      this.emit('fragmentLoaded', {
        duration: data.frag.duration,
        start: data.frag.start,
        level: data.frag.level,
      });
    });

    // Handle errors
    this.hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('HLSLoader: Fatal network error');
            this.emit('error', { type: 'network', fatal: true, details: data.details });
            // Try to recover
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('HLSLoader: Fatal media error');
            this.emit('error', { type: 'media', fatal: true, details: data.details });
            // Try to recover
            this.hls.recoverMediaError();
            break;
          default:
            console.error('HLSLoader: Fatal error, cannot recover');
            this.emit('error', { type: 'unknown', fatal: true, details: data.details });
            reject(new Error(`HLS fatal error: ${data.details}`));
            this.destroy();
            break;
        }
      } else {
        // Non-fatal error
        this.emit('error', { type: data.type, fatal: false, details: data.details });
      }
    });

    // Handle audio tracks
    this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
      this.emit('audioTracksUpdated', data.audioTracks);
    });

    // Handle subtitle tracks
    this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
      this.emit('subtitleTracksUpdated', data.subtitleTracks);
    });

    // Attach and load
    this.hls.attachMedia(this.videoElement);
    this.hls.loadSource(src);
  }

  /**
   * Load source using native HLS support (Safari)
   * @private
   */
  loadNative(src, resolve, reject) {
    this.videoElement.src = src;

    const handleLoadedMetadata = () => {
      this.isLoaded = true;
      // Native HLS doesn't expose quality levels in the same way
      this.availableQualities = [{ index: 0, name: 'Auto', height: null, bitrate: null }];
      this.emit('qualitiesAvailable', this.availableQualities);
      this.videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      resolve();
    };

    const handleError = () => {
      this.videoElement.removeEventListener('error', handleError);
      reject(new Error('Failed to load HLS source natively'));
    };

    this.videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    this.videoElement.addEventListener('error', handleError);
    this.videoElement.load();
  }

  /**
   * Get current quality level
   * @returns {number} Current level index (-1 for auto)
   */
  getCurrentQuality() {
    if (this.hls) {
      return this.hls.currentLevel;
    }
    return this.currentQuality;
  }

  /**
   * Set quality level
   * @param {number|string} level - Level index or 'auto'
   */
  setQuality(level) {
    if (!this.hls) {
      console.warn('HLSLoader: Cannot set quality without HLS.js');
      return;
    }

    if (level === 'auto' || level === -1) {
      this.hls.currentLevel = -1;
      this.currentQuality = -1;
    } else if (typeof level === 'number') {
      if (level >= 0 && level < this.hls.levels.length) {
        this.hls.currentLevel = level;
        this.currentQuality = level;
      }
    } else if (typeof level === 'string') {
      // Match by name (e.g., '720p')
      const levelIndex = this.hls.levels.findIndex(
        (l) => `${l.height}p` === level
      );
      if (levelIndex >= 0) {
        this.hls.currentLevel = levelIndex;
        this.currentQuality = levelIndex;
      }
    }
  }

  /**
   * Get all available quality levels
   * @returns {Array<Object>} Quality level objects
   */
  getAvailableQualities() {
    return this.availableQualities;
  }

  /**
   * Get next auto level (for predictive quality selection)
   * @returns {number} Next level index
   */
  getNextAutoLevel() {
    if (this.hls) {
      return this.hls.nextAutoLevel;
    }
    return -1;
  }

  /**
   * Set maximum quality level cap
   * @param {number} level - Maximum level index
   */
  setMaxQuality(level) {
    if (this.hls) {
      this.hls.autoLevelCapping = level;
    }
  }

  /**
   * Get current bandwidth estimate
   * @returns {number} Bandwidth in bits per second
   */
  getBandwidthEstimate() {
    if (this.hls) {
      return this.hls.bandwidthEstimate;
    }
    return 0;
  }

  /**
   * Get audio tracks
   * @returns {Array} Audio tracks
   */
  getAudioTracks() {
    if (this.hls) {
      return this.hls.audioTracks;
    }
    return [];
  }

  /**
   * Set audio track
   * @param {number} trackIndex - Audio track index
   */
  setAudioTrack(trackIndex) {
    if (this.hls) {
      this.hls.audioTrack = trackIndex;
    }
  }

  /**
   * Get subtitle tracks
   * @returns {Array} Subtitle tracks
   */
  getSubtitleTracks() {
    if (this.hls) {
      return this.hls.subtitleTracks;
    }
    return [];
  }

  /**
   * Set subtitle track
   * @param {number} trackIndex - Subtitle track index (-1 to disable)
   */
  setSubtitleTrack(trackIndex) {
    if (this.hls) {
      this.hls.subtitleTrack = trackIndex;
    }
  }

  /**
   * Start or restart loading
   * @param {number} [startPosition=-1] - Start position in seconds
   */
  startLoad(startPosition = -1) {
    if (this.hls) {
      this.hls.startLoad(startPosition);
    }
  }

  /**
   * Stop loading
   */
  stopLoad() {
    if (this.hls) {
      this.hls.stopLoad();
    }
  }

  /**
   * Recover from media error
   */
  recoverMediaError() {
    if (this.hls) {
      this.hls.recoverMediaError();
    }
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Unregister an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event] = this.eventListeners[event].filter(
      (cb) => cb !== callback
    );
  }

  /**
   * Emit an event
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`HLSLoader: Error in ${event} listener:`, err);
      }
    });
  }

  /**
   * Destroy the HLS instance and clean up
   */
  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    this.eventListeners = {};
    this.availableQualities = [];
    this.isLoaded = false;
    this.currentUrl = null;
    this.currentQuality = -1;
  }

  /**
   * Get loader state
   * @returns {Object} Current state
   */
  getState() {
    return {
      isSupported: this.isSupported,
      hasNativeSupport: this.hasNativeSupport,
      isLoaded: this.isLoaded,
      currentUrl: this.currentUrl,
      currentQuality: this.currentQuality,
      availableQualities: this.availableQualities,
      bandwidthEstimate: this.getBandwidthEstimate(),
    };
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.HLSLoader = HLSLoader;
}
