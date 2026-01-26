/**
 * @file BeatDetector.js
 * @description Beat detection engine using energy-based onset detection
 * Detects kicks (low frequency) and snares (mid-high frequency)
 */

'use strict';

/**
 * BeatDetector - Onset detection and beat tracking
 * @class
 */
class BeatDetector {
  /**
   * @param {Object} options - Configuration options
   * @param {AudioAnalyzer} [options.analyzer] - AudioAnalyzer instance to use
   * @param {number} [options.kickThreshold=1.5] - Energy threshold multiplier for kick detection
   * @param {number} [options.snareThreshold=1.3] - Energy threshold multiplier for snare detection
   * @param {number} [options.kickDecay=0.95] - Decay rate for kick threshold adaptation
   * @param {number} [options.snareDecay=0.95] - Decay rate for snare threshold adaptation
   * @param {number} [options.minBeatInterval=100] - Minimum ms between beats (anti-flutter)
   */
  constructor(options = {}) {
    this.analyzer = options.analyzer || null;

    // Detection thresholds (multiplier above average)
    this.kickThreshold = options.kickThreshold || 1.5;
    this.snareThreshold = options.snareThreshold || 1.3;

    // Adaptive threshold decay rates
    this.kickDecay = options.kickDecay || 0.95;
    this.snareDecay = options.snareDecay || 0.95;

    // Minimum interval between beats (prevents flutter, in ms)
    this.minBeatInterval = options.minBeatInterval || 100;

    // Energy history buffers for threshold adaptation
    this.kickEnergyHistory = [];
    this.snareEnergyHistory = [];
    this.historySize = 43; // ~720ms at 60fps for BPM detection

    // Current adaptive thresholds
    this.adaptiveKickThreshold = 0;
    this.adaptiveSnareThreshold = 0;

    // Last beat timestamps (for debouncing)
    this.lastKickTime = 0;
    this.lastSnareTime = 0;
    this.lastBeatTime = 0;

    // Beat state (decays over time for visual effects)
    this.kickHit = 0;
    this.snareHit = 0;
    this.beatHit = 0;

    // Decay rate for hit values (per frame)
    this.hitDecay = 0.85;

    // BPM estimation
    this.beatTimes = [];
    this.maxBeatTimes = 20;
    this.estimatedBPM = 0;

    // Callbacks
    this._onKickCallbacks = [];
    this._onSnareCallbacks = [];
    this._onBeatCallbacks = [];

    // State
    this.isEnabled = true;
  }

  /**
   * Set the audio analyzer to use
   * @param {AudioAnalyzer} analyzer - AudioAnalyzer instance
   * @returns {BeatDetector} - Returns this for chaining
   */
  setAnalyzer(analyzer) {
    this.analyzer = analyzer;
    return this;
  }

  /**
   * Register a callback for kick (bass) beats
   * @param {Function} callback - Called when a kick is detected
   * @returns {Function} - Unsubscribe function
   */
  onKick(callback) {
    this._onKickCallbacks.push(callback);
    return () => {
      const index = this._onKickCallbacks.indexOf(callback);
      if (index !== -1) {
        this._onKickCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for snare (mid/high) beats
   * @param {Function} callback - Called when a snare is detected
   * @returns {Function} - Unsubscribe function
   */
  onSnare(callback) {
    this._onSnareCallbacks.push(callback);
    return () => {
      const index = this._onSnareCallbacks.indexOf(callback);
      if (index !== -1) {
        this._onSnareCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for any beat (kick or snare)
   * @param {Function} callback - Called when any beat is detected
   * @returns {Function} - Unsubscribe function
   */
  onBeat(callback) {
    this._onBeatCallbacks.push(callback);
    return () => {
      const index = this._onBeatCallbacks.indexOf(callback);
      if (index !== -1) {
        this._onBeatCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update beat detection - call each frame
   * @returns {Object} - Current beat state
   */
  update() {
    if (!this.isEnabled || !this.analyzer) {
      return this._getEmptyState();
    }

    const now = performance.now();

    // Get frequency band levels from analyzer
    const bassLevel = this.analyzer.getCombinedBassLevel();
    const midLevel = this.analyzer.getCombinedMidLevel();
    const trebleLevel = this.analyzer.getTrebleLevel();

    // Calculate kick energy (weighted toward sub-bass and bass)
    const kickEnergy = bassLevel * 1.5 + this.analyzer.getSubBassLevel() * 0.5;

    // Calculate snare energy (mid frequencies with some high-mid)
    const snareEnergy =
      midLevel * 1.2 +
      this.analyzer.getHighMidLevel() * 0.5 +
      trebleLevel * 0.3;

    // Update energy histories
    this.kickEnergyHistory.push(kickEnergy);
    this.snareEnergyHistory.push(snareEnergy);

    if (this.kickEnergyHistory.length > this.historySize) {
      this.kickEnergyHistory.shift();
    }
    if (this.snareEnergyHistory.length > this.historySize) {
      this.snareEnergyHistory.shift();
    }

    // Calculate adaptive thresholds
    const avgKickEnergy = this._getAverage(this.kickEnergyHistory);
    const avgSnareEnergy = this._getAverage(this.snareEnergyHistory);

    // Update adaptive thresholds with decay
    this.adaptiveKickThreshold =
      this.adaptiveKickThreshold * this.kickDecay +
      avgKickEnergy * this.kickThreshold * (1 - this.kickDecay);

    this.adaptiveSnareThreshold =
      this.adaptiveSnareThreshold * this.snareDecay +
      avgSnareEnergy * this.snareThreshold * (1 - this.snareDecay);

    // Minimum thresholds to prevent detection on silence
    const minKickThreshold = 0.1;
    const minSnareThreshold = 0.08;

    const effectiveKickThreshold = Math.max(
      this.adaptiveKickThreshold,
      minKickThreshold
    );
    const effectiveSnareThreshold = Math.max(
      this.adaptiveSnareThreshold,
      minSnareThreshold
    );

    // Detect kicks
    let kickDetected = false;
    if (
      kickEnergy > effectiveKickThreshold &&
      now - this.lastKickTime > this.minBeatInterval
    ) {
      kickDetected = true;
      this.kickHit = 1.0;
      this.lastKickTime = now;
      this._triggerCallbacks(this._onKickCallbacks, {
        energy: kickEnergy,
        time: now,
      });
    }

    // Detect snares
    let snareDetected = false;
    if (
      snareEnergy > effectiveSnareThreshold &&
      now - this.lastSnareTime > this.minBeatInterval
    ) {
      snareDetected = true;
      this.snareHit = 1.0;
      this.lastSnareTime = now;
      this._triggerCallbacks(this._onSnareCallbacks, {
        energy: snareEnergy,
        time: now,
      });
    }

    // Any beat detected
    if (kickDetected || snareDetected) {
      this.beatHit = 1.0;
      this.lastBeatTime = now;

      // Record beat time for BPM estimation
      this.beatTimes.push(now);
      if (this.beatTimes.length > this.maxBeatTimes) {
        this.beatTimes.shift();
      }

      // Update BPM estimate
      this._updateBPM();

      this._triggerCallbacks(this._onBeatCallbacks, {
        isKick: kickDetected,
        isSnare: snareDetected,
        energy: Math.max(kickEnergy, snareEnergy),
        time: now,
        bpm: this.estimatedBPM,
      });
    }

    // Decay hit values for smooth visual transitions
    this.kickHit *= this.hitDecay;
    this.snareHit *= this.hitDecay;
    this.beatHit *= this.hitDecay;

    // Clean up very small values
    if (this.kickHit < 0.01) {
      this.kickHit = 0;
    }
    if (this.snareHit < 0.01) {
      this.snareHit = 0;
    }
    if (this.beatHit < 0.01) {
      this.beatHit = 0;
    }

    return this.getState();
  }

  /**
   * Get current beat state
   * @returns {Object} - Current beat state
   */
  getState() {
    return {
      kickHit: this.kickHit,
      snareHit: this.snareHit,
      beatHit: this.beatHit,
      isKickActive: this.kickHit > 0.5,
      isSnareActive: this.snareHit > 0.5,
      isBeatActive: this.beatHit > 0.5,
      estimatedBPM: this.estimatedBPM,
      timeSinceLastKick: performance.now() - this.lastKickTime,
      timeSinceLastSnare: performance.now() - this.lastSnareTime,
      timeSinceLastBeat: performance.now() - this.lastBeatTime,
    };
  }

  /**
   * Get current kick hit value (0-1, decays over time)
   * @returns {number} - Kick hit level
   */
  getKickHit() {
    return this.kickHit;
  }

  /**
   * Get current snare hit value (0-1, decays over time)
   * @returns {number} - Snare hit level
   */
  getSnareHit() {
    return this.snareHit;
  }

  /**
   * Get current beat hit value (0-1, decays over time)
   * @returns {number} - Beat hit level
   */
  getBeatHit() {
    return this.beatHit;
  }

  /**
   * Get estimated BPM
   * @returns {number} - Estimated beats per minute
   */
  getBPM() {
    return this.estimatedBPM;
  }

  /**
   * Check if a kick is currently active
   * @returns {boolean}
   */
  isKickActive() {
    return this.kickHit > 0.5;
  }

  /**
   * Check if a snare is currently active
   * @returns {boolean}
   */
  isSnareActive() {
    return this.snareHit > 0.5;
  }

  /**
   * Check if any beat is currently active
   * @returns {boolean}
   */
  isBeatActive() {
    return this.beatHit > 0.5;
  }

  /**
   * Set kick detection threshold
   * @param {number} threshold - Threshold multiplier (1.0-3.0 typical)
   */
  setKickThreshold(threshold) {
    this.kickThreshold = Math.max(1.0, Math.min(3.0, threshold));
  }

  /**
   * Set snare detection threshold
   * @param {number} threshold - Threshold multiplier (1.0-3.0 typical)
   */
  setSnareThreshold(threshold) {
    this.snareThreshold = Math.max(1.0, Math.min(3.0, threshold));
  }

  /**
   * Set hit decay rate
   * @param {number} decay - Decay rate (0-1, higher = slower decay)
   */
  setHitDecay(decay) {
    this.hitDecay = Math.max(0, Math.min(0.99, decay));
  }

  /**
   * Enable/disable beat detection
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Reset beat detection state
   */
  reset() {
    this.kickEnergyHistory = [];
    this.snareEnergyHistory = [];
    this.beatTimes = [];
    this.kickHit = 0;
    this.snareHit = 0;
    this.beatHit = 0;
    this.estimatedBPM = 0;
    this.adaptiveKickThreshold = 0;
    this.adaptiveSnareThreshold = 0;
    this.lastKickTime = 0;
    this.lastSnareTime = 0;
    this.lastBeatTime = 0;
  }

  /**
   * Calculate array average
   * @private
   * @param {Array<number>} arr
   * @returns {number}
   */
  _getAverage(arr) {
    if (arr.length === 0) {
      return 0;
    }
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Update BPM estimation from beat times
   * @private
   */
  _updateBPM() {
    if (this.beatTimes.length < 4) {
      return;
    }

    // Calculate intervals between beats
    const intervals = [];
    for (let i = 1; i < this.beatTimes.length; i++) {
      intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
    }

    // Filter out outliers (too fast or too slow)
    const minInterval = 200; // Max 300 BPM
    const maxInterval = 2000; // Min 30 BPM

    const validIntervals = intervals.filter(
      interval => interval >= minInterval && interval <= maxInterval
    );

    if (validIntervals.length < 2) {
      return;
    }

    // Calculate average interval
    const avgInterval = this._getAverage(validIntervals);

    // Convert to BPM
    const bpm = 60000 / avgInterval;

    // Smooth BPM estimate
    if (this.estimatedBPM === 0) {
      this.estimatedBPM = bpm;
    } else {
      // Use exponential moving average
      this.estimatedBPM = this.estimatedBPM * 0.9 + bpm * 0.1;
    }
  }

  /**
   * Trigger callback functions
   * @private
   * @param {Array<Function>} callbacks
   * @param {Object} data
   */
  _triggerCallbacks(callbacks, data) {
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('BeatDetector callback error:', error);
      }
    }
  }

  /**
   * Get empty state object
   * @private
   * @returns {Object}
   */
  _getEmptyState() {
    return {
      kickHit: 0,
      snareHit: 0,
      beatHit: 0,
      isKickActive: false,
      isSnareActive: false,
      isBeatActive: false,
      estimatedBPM: 0,
      timeSinceLastKick: Infinity,
      timeSinceLastSnare: Infinity,
      timeSinceLastBeat: Infinity,
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    this._onKickCallbacks = [];
    this._onSnareCallbacks = [];
    this._onBeatCallbacks = [];
    this.reset();
    this.analyzer = null;
  }
}

// Export for global scope
window.BeatDetector = BeatDetector;
