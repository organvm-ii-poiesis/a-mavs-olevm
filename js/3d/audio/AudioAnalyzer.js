/**
 * @file AudioAnalyzer.js
 * @description FFT frequency analyzer module for audio-visual reactivity
 * Uses Tone.js Analyser node for real-time frequency analysis
 */

'use strict';

/**
 * AudioAnalyzer - FFT frequency analysis for audio visualization
 * @class
 */
class AudioAnalyzer {
  /**
   * @param {Object} options - Configuration options
   * @param {number} [options.fftSize=2048] - FFT size (power of 2)
   * @param {number} [options.smoothing=0.8] - Smoothing factor (0-1)
   * @param {Object} [options.frequencyRanges] - Custom frequency band ranges in Hz
   */
  constructor(options = {}) {
    this.fftSize = options.fftSize || 2048;
    this.smoothing = options.smoothing || 0.8;

    // Frequency band ranges (in Hz)
    // Based on typical audio frequency distribution
    this.frequencyRanges = options.frequencyRanges || {
      subBass: { min: 20, max: 60 }, // Deep rumble, sub-bass
      bass: { min: 60, max: 250 }, // Kick drums, bass guitar
      lowMid: { min: 250, max: 500 }, // Lower vocals, warmth
      mid: { min: 500, max: 2000 }, // Vocals, instruments
      highMid: { min: 2000, max: 4000 }, // Presence, clarity
      treble: { min: 4000, max: 20000 }, // Brilliance, air
    };

    // Tone.js Analyser nodes
    this.fftAnalyser = null;
    this.waveformAnalyser = null;

    // Sample rate (will be set on initialization)
    this.sampleRate = 44100;

    // Cached frequency data arrays
    this.frequencyData = null;
    this.waveformData = null;

    // Smoothed band levels (0-1)
    this.bandLevels = {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0,
    };

    // Previous band levels for smoothing
    this._prevBandLevels = { ...this.bandLevels };

    // Energy history for analysis
    this.energyHistory = [];
    this.energyHistorySize = 60; // ~1 second at 60fps

    // State
    this.isInitialized = false;
    this.isConnected = false;
  }

  /**
   * Initialize the analyzer
   * @returns {AudioAnalyzer} - Returns this for chaining
   */
  initialize() {
    if (this.isInitialized) {
      return this;
    }

    // Create FFT analyser for frequency data
    this.fftAnalyser = new Tone.Analyser({
      type: 'fft',
      size: this.fftSize,
      smoothing: this.smoothing,
    });

    // Create waveform analyser for time-domain data
    this.waveformAnalyser = new Tone.Analyser({
      type: 'waveform',
      size: this.fftSize,
    });

    // Get sample rate from audio context
    this.sampleRate = Tone.context.sampleRate;

    // Pre-allocate data arrays
    this.frequencyData = new Float32Array(this.fftSize / 2);
    this.waveformData = new Float32Array(this.fftSize);

    this.isInitialized = true;
    return this;
  }

  /**
   * Connect a Tone.js audio node to the analyzer
   * @param {Tone.ToneAudioNode} audioNode - Audio node to analyze
   * @returns {AudioAnalyzer} - Returns this for chaining
   */
  connect(audioNode) {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Connect the audio node to both analyzers
    audioNode.connect(this.fftAnalyser);
    audioNode.connect(this.waveformAnalyser);

    this.isConnected = true;
    return this;
  }

  /**
   * Disconnect all inputs from the analyzer
   * @returns {AudioAnalyzer} - Returns this for chaining
   */
  disconnect() {
    if (this.fftAnalyser) {
      this.fftAnalyser.disconnect();
    }
    if (this.waveformAnalyser) {
      this.waveformAnalyser.disconnect();
    }
    this.isConnected = false;
    return this;
  }

  /**
   * Update analysis - call each frame
   * @returns {Object} - Current analysis data
   */
  update() {
    if (!this.isInitialized || !this.isConnected) {
      return this._getEmptyAnalysis();
    }

    // Get raw FFT data (values in dB, typically -100 to 0)
    const rawFFT = this.fftAnalyser.getValue();

    // Copy to our buffer
    for (let i = 0; i < rawFFT.length; i++) {
      this.frequencyData[i] = rawFFT[i];
    }

    // Get waveform data
    const rawWaveform = this.waveformAnalyser.getValue();
    for (let i = 0; i < rawWaveform.length; i++) {
      this.waveformData[i] = rawWaveform[i];
    }

    // Calculate band levels
    this._calculateBandLevels();

    // Calculate total energy
    const energy = this._calculateEnergy();

    // Update energy history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.energyHistorySize) {
      this.energyHistory.shift();
    }

    return {
      frequencyData: this.frequencyData,
      waveformData: this.waveformData,
      bandLevels: { ...this.bandLevels },
      energy: energy,
      averageEnergy: this._getAverageEnergy(),
    };
  }

  /**
   * Get raw frequency data array
   * @returns {Float32Array} - Frequency magnitude data
   */
  getFrequencyData() {
    if (!this.isConnected) {
      return new Float32Array(this.fftSize / 2);
    }
    return this.frequencyData;
  }

  /**
   * Get waveform (time-domain) data
   * @returns {Float32Array} - Waveform sample data
   */
  getWaveformData() {
    if (!this.isConnected) {
      return new Float32Array(this.fftSize);
    }
    return this.waveformData;
  }

  /**
   * Get sub-bass level (20-60Hz) - very deep bass
   * @returns {number} - Level 0-1
   */
  getSubBassLevel() {
    return this.bandLevels.subBass;
  }

  /**
   * Get bass level (60-250Hz) - kick drums, bass
   * @returns {number} - Level 0-1
   */
  getBassLevel() {
    return this.bandLevels.bass;
  }

  /**
   * Get low-mid level (250-500Hz) - warmth
   * @returns {number} - Level 0-1
   */
  getLowMidLevel() {
    return this.bandLevels.lowMid;
  }

  /**
   * Get mid level (500-2000Hz) - vocals, melody
   * @returns {number} - Level 0-1
   */
  getMidLevel() {
    return this.bandLevels.mid;
  }

  /**
   * Get high-mid level (2000-4000Hz) - presence
   * @returns {number} - Level 0-1
   */
  getHighMidLevel() {
    return this.bandLevels.highMid;
  }

  /**
   * Get treble level (4000-20000Hz) - brilliance
   * @returns {number} - Level 0-1
   */
  getTrebleLevel() {
    return this.bandLevels.treble;
  }

  /**
   * Get all band levels as an object
   * @returns {Object} - Object with all band levels
   */
  getAllBandLevels() {
    return { ...this.bandLevels };
  }

  /**
   * Get combined low frequency level (sub-bass + bass)
   * @returns {number} - Level 0-1
   */
  getCombinedBassLevel() {
    return Math.min(1, (this.bandLevels.subBass + this.bandLevels.bass) / 1.5);
  }

  /**
   * Get combined mid frequency level (lowMid + mid + highMid)
   * @returns {number} - Level 0-1
   */
  getCombinedMidLevel() {
    return Math.min(
      1,
      (this.bandLevels.lowMid + this.bandLevels.mid + this.bandLevels.highMid) /
        2
    );
  }

  /**
   * Get current energy level
   * @returns {number} - Energy level 0-1
   */
  getEnergy() {
    return this._calculateEnergy();
  }

  /**
   * Get average energy over recent history
   * @returns {number} - Average energy 0-1
   */
  getAverageEnergy() {
    return this._getAverageEnergy();
  }

  /**
   * Calculate band levels from frequency data
   * @private
   */
  _calculateBandLevels() {
    const binCount = this.frequencyData.length;
    const nyquist = this.sampleRate / 2;

    // Calculate level for each band
    for (const band in this.frequencyRanges) {
      if (Object.prototype.hasOwnProperty.call(this.frequencyRanges, band)) {
        const range = this.frequencyRanges[band];
        const level = this._getFrequencyRangeLevel(
          range.min,
          range.max,
          nyquist,
          binCount
        );

        // Smooth the value
        const prevLevel = this._prevBandLevels[band];
        const smoothedLevel =
          prevLevel + (level - prevLevel) * (1 - this.smoothing);

        this.bandLevels[band] = smoothedLevel;
        this._prevBandLevels[band] = smoothedLevel;
      }
    }
  }

  /**
   * Get the average level for a frequency range
   * @private
   * @param {number} minFreq - Minimum frequency in Hz
   * @param {number} maxFreq - Maximum frequency in Hz
   * @param {number} nyquist - Nyquist frequency
   * @param {number} binCount - Number of FFT bins
   * @returns {number} - Level 0-1
   */
  _getFrequencyRangeLevel(minFreq, maxFreq, nyquist, binCount) {
    // Convert frequency to bin index
    const minBin = Math.floor((minFreq / nyquist) * binCount);
    const maxBin = Math.min(
      binCount - 1,
      Math.ceil((maxFreq / nyquist) * binCount)
    );

    if (minBin >= maxBin) {
      return 0;
    }

    // Sum the magnitudes in this range
    let sum = 0;
    let count = 0;

    for (let i = minBin; i <= maxBin; i++) {
      // Convert from dB to linear (0-1)
      // FFT values are typically -100 to 0 dB
      const dbValue = this.frequencyData[i];
      // Normalize: -100dB = 0, 0dB = 1
      const normalized = Math.max(0, (dbValue + 100) / 100);
      sum += normalized;
      count++;
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Calculate current total energy from waveform
   * @private
   * @returns {number} - Energy level 0-1
   */
  _calculateEnergy() {
    if (!this.waveformData) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < this.waveformData.length; i++) {
      sum += this.waveformData[i] * this.waveformData[i];
    }

    // RMS (root mean square)
    const rms = Math.sqrt(sum / this.waveformData.length);

    // Normalize to 0-1 (typical waveform values are -1 to 1)
    return Math.min(1, rms * 2);
  }

  /**
   * Get average energy from history
   * @private
   * @returns {number}
   */
  _getAverageEnergy() {
    if (this.energyHistory.length === 0) {
      return 0;
    }

    const sum = this.energyHistory.reduce((a, b) => a + b, 0);
    return sum / this.energyHistory.length;
  }

  /**
   * Get empty analysis object (when not connected)
   * @private
   * @returns {Object}
   */
  _getEmptyAnalysis() {
    return {
      frequencyData: new Float32Array(this.fftSize / 2),
      waveformData: new Float32Array(this.fftSize),
      bandLevels: {
        subBass: 0,
        bass: 0,
        lowMid: 0,
        mid: 0,
        highMid: 0,
        treble: 0,
      },
      energy: 0,
      averageEnergy: 0,
    };
  }

  /**
   * Set smoothing factor
   * @param {number} smoothing - Smoothing factor 0-1
   */
  setSmoothing(smoothing) {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
    if (this.fftAnalyser) {
      this.fftAnalyser.smoothing = this.smoothing;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.disconnect();

    if (this.fftAnalyser) {
      this.fftAnalyser.dispose();
      this.fftAnalyser = null;
    }

    if (this.waveformAnalyser) {
      this.waveformAnalyser.dispose();
      this.waveformAnalyser = null;
    }

    this.frequencyData = null;
    this.waveformData = null;
    this.energyHistory = [];
    this.isInitialized = false;
  }
}

// Export for global scope
window.AudioAnalyzer = AudioAnalyzer;
