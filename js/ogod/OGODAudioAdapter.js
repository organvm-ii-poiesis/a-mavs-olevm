/**
 * @file OGODAudioAdapter.js
 * @description Bridge between the OGOD animation system and audio sources.
 * Wraps OGODAudioEngine (Tone.js, stem-separated) for full integration,
 * or falls back to Howler.js + Web Audio API analyzer for standalone use.
 * Returns zero uniforms when no audio is available (visual-only mode).
 */

"use strict";

/**
 * OGODAudioAdapter - Audio analysis bridge for OGOD animations
 * @class
 */
class OGODAudioAdapter {
  /**
   * @param {Object} options
   * @param {Object} [options.audioEngine] - OGODAudioEngine instance (preferred)
   * @param {Object} [options.howlInstance] - Howler.js Sound instance (fallback)
   * @param {HTMLAudioElement} [options.audioElement] - HTML audio element (fallback)
   */
  constructor(options = {}) {
    this._audioEngine = options.audioEngine || null;
    this._howlInstance = options.howlInstance || null;
    this._audioElement = options.audioElement || null;

    // Web Audio API fallback analyzer
    this._audioContext = null;
    this._analyserNode = null;
    this._sourceNode = null;
    this._frequencyData = null;

    // Cached analysis values
    this._uniforms = {
      bass: 0,
      mid: 0,
      treble: 0,
      energy: 0,
      beatHit: 0,
      kickHit: 0,
      snareHit: 0,
    };

    // Beat callback subscriptions
    this._beatCallbacks = [];
    this._unsubscribers = [];

    // Initialize appropriate source
    if (this._audioEngine) {
      this._initFromEngine();
    } else if (this._audioElement || this._howlInstance) {
      this._initWebAudioFallback();
    }
  }

  /**
   * Initialize from OGODAudioEngine (full-featured)
   * @private
   */
  _initFromEngine() {
    // Subscribe to beat events and forward them
    if (this._audioEngine.onBeat) {
      const unsub = this._audioEngine.onBeat(() => {
        this._fireBeatCallbacks();
      });
      this._unsubscribers.push(unsub);
    }
  }

  /**
   * Initialize Web Audio API fallback for standalone audio sources
   * @private
   */
  _initWebAudioFallback() {
    try {
      this._audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this._analyserNode = this._audioContext.createAnalyser();
      this._analyserNode.fftSize = 1024;
      this._analyserNode.smoothingTimeConstant = 0.8;
      this._frequencyData = new Uint8Array(
        this._analyserNode.frequencyBinCount,
      );

      // Connect source
      if (this._audioElement) {
        this._sourceNode = this._audioContext.createMediaElementSource(
          this._audioElement,
        );
        this._sourceNode.connect(this._analyserNode);
        this._analyserNode.connect(this._audioContext.destination);
      } else if (this._howlInstance && typeof Howler !== "undefined") {
        // Howler.js exposes the master gain node
        const ctx = Howler.ctx;
        if (ctx) {
          this._audioContext = ctx;
          this._analyserNode = ctx.createAnalyser();
          this._analyserNode.fftSize = 1024;
          this._analyserNode.smoothingTimeConstant = 0.8;
          this._frequencyData = new Uint8Array(
            this._analyserNode.frequencyBinCount,
          );
          Howler.masterGain.connect(this._analyserNode);
          this._analyserNode.connect(ctx.destination);
        }
      }
    } catch (_err) {
      console.warn("OGODAudioAdapter: Web Audio API initialization failed");
    }
  }

  /**
   * Get current audio analysis as uniform values
   * @returns {{ bass: number, mid: number, treble: number, energy: number, beatHit: number, kickHit: number, snareHit: number }}
   */
  getUniforms() {
    if (this._audioEngine) {
      return this._getFromEngine();
    }
    if (this._analyserNode) {
      return this._getFromAnalyser();
    }
    // No audio source - return zeros
    return this._uniforms;
  }

  /**
   * Get analysis from OGODAudioEngine
   * @private
   * @returns {Object}
   */
  _getFromEngine() {
    this._uniforms.bass = this._audioEngine.getBassLevel() || 0;
    this._uniforms.mid = this._audioEngine.getMidLevel() || 0;
    this._uniforms.treble = this._audioEngine.getTrebleLevel() || 0;
    this._uniforms.energy =
      (this._uniforms.bass + this._uniforms.mid + this._uniforms.treble) / 3;
    this._uniforms.beatHit = this._audioEngine.getBeatHit() || 0;

    const data = this._audioEngine.getAnalysisData();
    this._uniforms.kickHit = data.kickHit || 0;
    this._uniforms.snareHit = data.snareHit || 0;

    return this._uniforms;
  }

  /**
   * Get analysis from Web Audio API analyser node
   * @private
   * @returns {Object}
   */
  _getFromAnalyser() {
    this._analyserNode.getByteFrequencyData(this._frequencyData);

    const binCount = this._frequencyData.length;

    // Divide frequency spectrum into bass/mid/treble bands
    // Bass: 0-250Hz (roughly first ~6% of bins)
    // Mid: 250-4000Hz (roughly 6-40% of bins)
    // Treble: 4000Hz+ (roughly 40%+ of bins)
    const bassEnd = Math.floor(binCount * 0.06);
    const midEnd = Math.floor(binCount * 0.4);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    for (let i = 0; i < bassEnd; i++) {
      bassSum += this._frequencyData[i];
    }
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this._frequencyData[i];
    }
    for (let i = midEnd; i < binCount; i++) {
      trebleSum += this._frequencyData[i];
    }

    // Normalize to 0-1
    this._uniforms.bass = bassSum / (bassEnd * 255) || 0;
    this._uniforms.mid = midSum / ((midEnd - bassEnd) * 255) || 0;
    this._uniforms.treble = trebleSum / ((binCount - midEnd) * 255) || 0;
    this._uniforms.energy =
      (this._uniforms.bass + this._uniforms.mid + this._uniforms.treble) / 3;

    // Simple beat detection: bass spike above threshold
    const prevBeat = this._uniforms.beatHit;
    if (this._uniforms.bass > 0.7 && prevBeat < 0.3) {
      this._uniforms.beatHit = 1.0;
      this._fireBeatCallbacks();
    } else {
      // Decay
      this._uniforms.beatHit = Math.max(0, prevBeat * 0.9);
    }

    this._uniforms.kickHit = this._uniforms.beatHit;
    this._uniforms.snareHit = 0;

    return this._uniforms;
  }

  /**
   * Register a callback for beat events
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onBeat(callback) {
    this._beatCallbacks.push(callback);
    return () => {
      const idx = this._beatCallbacks.indexOf(callback);
      if (idx >= 0) {
        this._beatCallbacks.splice(idx, 1);
      }
    };
  }

  /**
   * Fire all registered beat callbacks
   * @private
   */
  _fireBeatCallbacks() {
    for (const cb of this._beatCallbacks) {
      try {
        cb();
      } catch (_e) {
        // Ignore callback errors
      }
    }
  }

  /**
   * Whether this adapter has an active audio source
   * @returns {boolean}
   */
  get hasAudio() {
    return !!(this._audioEngine || this._analyserNode);
  }

  /**
   * Connect to an OGODAudioEngine at runtime
   * @param {Object} audioEngine
   */
  setAudioEngine(audioEngine) {
    this._disposeEngine();
    this._audioEngine = audioEngine;
    this._initFromEngine();
  }

  /**
   * Connect to an HTML audio element at runtime
   * @param {HTMLAudioElement} element
   */
  setAudioElement(element) {
    this._disposeFallback();
    this._audioElement = element;
    this._initWebAudioFallback();
  }

  /**
   * Dispose engine subscriptions
   * @private
   */
  _disposeEngine() {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
    this._audioEngine = null;
  }

  /**
   * Dispose fallback audio resources
   * @private
   */
  _disposeFallback() {
    if (this._sourceNode) {
      try {
        this._sourceNode.disconnect();
      } catch (_e) {
        // May already be disconnected
      }
      this._sourceNode = null;
    }
    if (
      this._audioContext &&
      this._audioContext.state !== "closed" &&
      !this._howlInstance
    ) {
      // Only close context if we created it (not if it's Howler's)
      this._audioContext.close().catch(() => {});
    }
    this._analyserNode = null;
    this._audioContext = null;
    this._frequencyData = null;
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this._disposeEngine();
    this._disposeFallback();
    this._beatCallbacks = [];
    this._uniforms = {
      bass: 0,
      mid: 0,
      treble: 0,
      energy: 0,
      beatHit: 0,
      kickHit: 0,
      snareHit: 0,
    };
  }
}

window.OGODAudioAdapter = OGODAudioAdapter;
