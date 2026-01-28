'use strict';

/* global Howler */

/**
 * @file audioAnalyzerBridge.js
 * @description Bridges Howler.js audio to p5.js shader uniforms using Web Audio API
 *
 * This module creates an audio analyzer that connects to Howler.js's master output
 * and provides frequency band data (bass, mid, treble) for use in WebGL shaders.
 *
 * @requires Howler.js
 */

/**
 * AudioAnalyzerBridge Class
 * Analyzes audio from Howler.js and provides frequency band data
 */
class AudioAnalyzerBridge {
  constructor() {
    /** @type {AnalyserNode|null} */
    this.analyser = null;

    /** @type {Uint8Array|null} */
    this.dataArray = null;

    /** @type {number} */
    this.fftSize = 256;

    /** @type {boolean} */
    this.isConnected = false;

    /** @type {Object} Frequency band values (0.0 - 1.0) */
    this.bands = {
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0,
    };

    /** @type {Object} Smoothed values for less jittery visuals */
    this.smoothBands = {
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0,
    };

    /** @type {number} Smoothing factor (0 = no smoothing, 1 = max smoothing) */
    this.smoothingFactor = 0.8;

    /** @type {number} Peak detection threshold */
    this.peakThreshold = 0.7;

    /** @type {boolean} Whether a beat was detected this frame */
    this.beatDetected = false;
  }

  /**
   * Connect to Howler.js audio context
   * @returns {boolean} True if connection successful
   */
  connect() {
    if (this.isConnected) {
      return true;
    }

    // Check if Howler is available
    if (typeof Howler === 'undefined') {
      console.warn('AudioAnalyzerBridge: Howler.js not found');
      return false;
    }

    try {
      // Get Howler's audio context
      const ctx = Howler.ctx;
      if (!ctx) {
        console.warn('AudioAnalyzerBridge: No audio context available');
        return false;
      }

      // Create analyser node
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect Howler's master gain to analyser
      // Note: Howler.masterGain is the master gain node
      if (Howler.masterGain) {
        Howler.masterGain.connect(this.analyser);
        // Don't connect analyser to destination - Howler already does that
      } else {
        console.warn('AudioAnalyzerBridge: No master gain available');
        return false;
      }

      // Create data array for frequency data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isConnected = true;

      console.log('AudioAnalyzerBridge: Connected to Howler.js');
      return true;
    } catch (error) {
      console.error('AudioAnalyzerBridge: Connection error:', error.message);
      return false;
    }
  }

  /**
   * Disconnect from audio context
   */
  disconnect() {
    if (this.analyser && Howler.masterGain) {
      try {
        Howler.masterGain.disconnect(this.analyser);
      } catch {
        // May already be disconnected
      }
    }
    this.isConnected = false;
    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Update frequency analysis
   * Call this once per frame before reading band values
   * @returns {Object} The frequency band values
   */
  update() {
    if (!this.isConnected || !this.analyser || !this.dataArray) {
      return this.smoothBands;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    const len = this.dataArray.length;
    let bass = 0;
    let mid = 0;
    let treble = 0;

    // Split frequency data into three bands
    // Bass: 0-15% of spectrum (roughly 20-150Hz)
    // Mid: 15-50% of spectrum (roughly 150-2000Hz)
    // Treble: 50-100% of spectrum (roughly 2000-20000Hz)
    const bassEnd = Math.floor(len * 0.15);
    const midEnd = Math.floor(len * 0.5);

    for (let i = 0; i < len; i++) {
      const value = this.dataArray[i];
      if (i < bassEnd) {
        bass += value;
      } else if (i < midEnd) {
        mid += value;
      } else {
        treble += value;
      }
    }

    // Normalize to 0-1 range
    this.bands.bass = bass / (bassEnd * 255);
    this.bands.mid = mid / ((midEnd - bassEnd) * 255);
    this.bands.treble = treble / ((len - midEnd) * 255);
    this.bands.overall = (this.bands.bass + this.bands.mid + this.bands.treble) / 3;

    // Apply smoothing for less jittery visuals
    this.smoothBands.bass = this._lerp(this.smoothBands.bass, this.bands.bass, 1 - this.smoothingFactor);
    this.smoothBands.mid = this._lerp(this.smoothBands.mid, this.bands.mid, 1 - this.smoothingFactor);
    this.smoothBands.treble = this._lerp(this.smoothBands.treble, this.bands.treble, 1 - this.smoothingFactor);
    this.smoothBands.overall = this._lerp(this.smoothBands.overall, this.bands.overall, 1 - this.smoothingFactor);

    // Simple beat detection (bass peaks)
    this.beatDetected = this.bands.bass > this.peakThreshold && this.bands.bass > this.smoothBands.bass * 1.5;

    return this.smoothBands;
  }

  /**
   * Get raw (unsmoothed) band values
   * @returns {Object} Raw frequency band values
   */
  getRawBands() {
    return this.bands;
  }

  /**
   * Get smoothed band values
   * @returns {Object} Smoothed frequency band values
   */
  getSmoothedBands() {
    return this.smoothBands;
  }

  /**
   * Check if a beat was detected this frame
   * @returns {boolean} True if beat detected
   */
  isBeat() {
    return this.beatDetected;
  }

  /**
   * Set smoothing factor
   * @param {number} factor - Smoothing factor (0-1)
   */
  setSmoothing(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Set peak detection threshold
   * @param {number} threshold - Peak threshold (0-1)
   */
  setPeakThreshold(threshold) {
    this.peakThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Linear interpolation helper
   * @private
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Get full frequency spectrum as array
   * Useful for more detailed visualizations
   * @returns {Uint8Array|null} Full frequency data or null if not connected
   */
  getSpectrum() {
    if (!this.isConnected || !this.analyser || !this.dataArray) {
      return null;
    }
    return this.dataArray;
  }
}

// Create global instance
window.audioBridge = new AudioAnalyzerBridge();

/**
 * Auto-connect when Howler plays audio
 * Listens for any Howl instance to start playing
 */
if (typeof Howler !== 'undefined') {
  // Try to connect when first audio plays
  document.addEventListener(
    'click',
    function initAudioBridge() {
      if (!window.audioBridge.isConnected) {
        // Small delay to ensure Howler context is ready
        setTimeout(() => {
          window.audioBridge.connect();
        }, 100);
      }
      document.removeEventListener('click', initAudioBridge);
    },
    { once: true }
  );
}
