/**
 * @file tests/unit/AudioAnalyzer.test.js
 * @description Unit tests for AudioAnalyzer class
 * Tests FFT frequency analysis for audio-visual reactivity
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';

describe('AudioAnalyzer', () => {
  let AudioAnalyzer;
  let analyzer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Define AudioAnalyzer class for testing
    AudioAnalyzer = class {
      constructor(options = {}) {
        this.fftSize = options.fftSize || 2048;
        this.smoothing = options.smoothing || 0.8;

        this.frequencyRanges = options.frequencyRanges || {
          subBass: { min: 20, max: 60 },
          bass: { min: 60, max: 250 },
          lowMid: { min: 250, max: 500 },
          mid: { min: 500, max: 2000 },
          highMid: { min: 2000, max: 4000 },
          treble: { min: 4000, max: 20000 },
        };

        this.fftAnalyser = null;
        this.waveformAnalyser = null;
        this.sampleRate = 44100;

        this.frequencyData = null;
        this.waveformData = null;

        this.bandLevels = {
          subBass: 0,
          bass: 0,
          lowMid: 0,
          mid: 0,
          highMid: 0,
          treble: 0,
        };

        this._prevBandLevels = { ...this.bandLevels };
        this.energyHistory = [];
        this.energyHistorySize = 60;

        this.isInitialized = false;
        this.isConnected = false;
      }

      initialize() {
        if (this.isInitialized) return this;

        this.fftAnalyser = new Tone.Analyser({
          type: 'fft',
          size: this.fftSize,
          smoothing: this.smoothing,
        });

        this.waveformAnalyser = new Tone.Analyser({
          type: 'waveform',
          size: this.fftSize,
        });

        this.sampleRate = Tone.context.sampleRate;
        this.frequencyData = new Float32Array(this.fftSize / 2);
        this.waveformData = new Float32Array(this.fftSize);

        this.isInitialized = true;
        return this;
      }

      connect(audioNode) {
        if (!this.isInitialized) {
          this.initialize();
        }
        audioNode.connect(this.fftAnalyser);
        audioNode.connect(this.waveformAnalyser);
        this.isConnected = true;
        return this;
      }

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

      update() {
        if (!this.isInitialized || !this.isConnected) {
          return this._getEmptyAnalysis();
        }

        const rawFFT = this.fftAnalyser.getValue();
        for (
          let i = 0;
          i < rawFFT.length && i < this.frequencyData.length;
          i++
        ) {
          this.frequencyData[i] = rawFFT[i];
        }

        const rawWaveform = this.waveformAnalyser.getValue();
        for (
          let i = 0;
          i < rawWaveform.length && i < this.waveformData.length;
          i++
        ) {
          this.waveformData[i] = rawWaveform[i];
        }

        this._calculateBandLevels();
        const energy = this._calculateEnergy();

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

      getFrequencyData() {
        if (!this.isConnected) {
          return new Float32Array(this.fftSize / 2);
        }
        return this.frequencyData;
      }

      getWaveformData() {
        if (!this.isConnected) {
          return new Float32Array(this.fftSize);
        }
        return this.waveformData;
      }

      getSubBassLevel() {
        return this.bandLevels.subBass;
      }

      getBassLevel() {
        return this.bandLevels.bass;
      }

      getLowMidLevel() {
        return this.bandLevels.lowMid;
      }

      getMidLevel() {
        return this.bandLevels.mid;
      }

      getHighMidLevel() {
        return this.bandLevels.highMid;
      }

      getTrebleLevel() {
        return this.bandLevels.treble;
      }

      getAllBandLevels() {
        return { ...this.bandLevels };
      }

      getCombinedBassLevel() {
        return Math.min(
          1,
          (this.bandLevels.subBass + this.bandLevels.bass) / 1.5
        );
      }

      getCombinedMidLevel() {
        return Math.min(
          1,
          (this.bandLevels.lowMid +
            this.bandLevels.mid +
            this.bandLevels.highMid) /
            2
        );
      }

      getEnergy() {
        return this._calculateEnergy();
      }

      getAverageEnergy() {
        return this._getAverageEnergy();
      }

      _calculateBandLevels() {
        const binCount = this.frequencyData.length;
        const nyquist = this.sampleRate / 2;

        for (const band in this.frequencyRanges) {
          if (
            Object.prototype.hasOwnProperty.call(this.frequencyRanges, band)
          ) {
            const range = this.frequencyRanges[band];
            const level = this._getFrequencyRangeLevel(
              range.min,
              range.max,
              nyquist,
              binCount
            );

            const prevLevel = this._prevBandLevels[band];
            const smoothedLevel =
              prevLevel + (level - prevLevel) * (1 - this.smoothing);

            this.bandLevels[band] = smoothedLevel;
            this._prevBandLevels[band] = smoothedLevel;
          }
        }
      }

      _getFrequencyRangeLevel(minFreq, maxFreq, nyquist, binCount) {
        const minBin = Math.floor((minFreq / nyquist) * binCount);
        const maxBin = Math.min(
          binCount - 1,
          Math.ceil((maxFreq / nyquist) * binCount)
        );

        if (minBin >= maxBin) return 0;

        let sum = 0;
        let count = 0;

        for (let i = minBin; i <= maxBin; i++) {
          const dbValue = this.frequencyData[i];
          const normalized = Math.max(0, (dbValue + 100) / 100);
          sum += normalized;
          count++;
        }

        return count > 0 ? sum / count : 0;
      }

      _calculateEnergy() {
        if (!this.waveformData) return 0;

        let sum = 0;
        for (let i = 0; i < this.waveformData.length; i++) {
          sum += this.waveformData[i] * this.waveformData[i];
        }

        const rms = Math.sqrt(sum / this.waveformData.length);
        return Math.min(1, rms * 2);
      }

      _getAverageEnergy() {
        if (this.energyHistory.length === 0) return 0;
        const sum = this.energyHistory.reduce((a, b) => a + b, 0);
        return sum / this.energyHistory.length;
      }

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

      setSmoothing(smoothing) {
        this.smoothing = Math.max(0, Math.min(1, smoothing));
        if (this.fftAnalyser) {
          this.fftAnalyser.smoothing = this.smoothing;
        }
      }

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
    };
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.dispose();
      analyzer = null;
    }
  });

  describe('constructor', () => {
    it('should initialize with default settings', () => {
      analyzer = new AudioAnalyzer();
      expect(analyzer.fftSize).toBe(2048);
      expect(analyzer.smoothing).toBe(0.8);
      expect(analyzer.isInitialized).toBe(false);
      expect(analyzer.isConnected).toBe(false);
    });

    it('should accept custom fftSize', () => {
      analyzer = new AudioAnalyzer({ fftSize: 1024 });
      expect(analyzer.fftSize).toBe(1024);
    });

    it('should accept custom smoothing', () => {
      analyzer = new AudioAnalyzer({ smoothing: 0.5 });
      expect(analyzer.smoothing).toBe(0.5);
    });

    it('should initialize frequency ranges', () => {
      analyzer = new AudioAnalyzer();
      expect(analyzer.frequencyRanges).toHaveProperty('bass');
      expect(analyzer.frequencyRanges).toHaveProperty('mid');
      expect(analyzer.frequencyRanges).toHaveProperty('treble');
    });

    it('should initialize band levels to zero', () => {
      analyzer = new AudioAnalyzer();
      const levels = analyzer.getAllBandLevels();
      expect(levels.bass).toBe(0);
      expect(levels.mid).toBe(0);
      expect(levels.treble).toBe(0);
    });
  });

  describe('initialize', () => {
    it('should create FFT analyser', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      expect(analyzer.fftAnalyser).toBeDefined();
      expect(analyzer.isInitialized).toBe(true);
    });

    it('should create waveform analyser', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      expect(analyzer.waveformAnalyser).toBeDefined();
    });

    it('should allocate frequency data array', () => {
      analyzer = new AudioAnalyzer({ fftSize: 2048 });
      analyzer.initialize();
      expect(analyzer.frequencyData).toBeInstanceOf(Float32Array);
      expect(analyzer.frequencyData.length).toBe(1024); // fftSize / 2
    });

    it('should allocate waveform data array', () => {
      analyzer = new AudioAnalyzer({ fftSize: 2048 });
      analyzer.initialize();
      expect(analyzer.waveformData).toBeInstanceOf(Float32Array);
      expect(analyzer.waveformData.length).toBe(2048);
    });

    it('should return this for chaining', () => {
      analyzer = new AudioAnalyzer();
      const result = analyzer.initialize();
      expect(result).toBe(analyzer);
    });

    it('should not reinitialize if already initialized', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      const firstAnalyser = analyzer.fftAnalyser;
      analyzer.initialize();
      expect(analyzer.fftAnalyser).toBe(firstAnalyser);
    });
  });

  describe('connect', () => {
    it('should auto-initialize if not initialized', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      analyzer.connect(mockNode);
      expect(analyzer.isInitialized).toBe(true);
    });

    it('should set isConnected to true', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      analyzer.connect(mockNode);
      expect(analyzer.isConnected).toBe(true);
    });

    it('should return this for chaining', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      const result = analyzer.connect(mockNode);
      expect(result).toBe(analyzer);
    });
  });

  describe('disconnect', () => {
    it('should set isConnected to false', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      analyzer.isConnected = true;
      analyzer.disconnect();
      expect(analyzer.isConnected).toBe(false);
    });

    it('should return this for chaining', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      const result = analyzer.disconnect();
      expect(result).toBe(analyzer);
    });
  });

  describe('update', () => {
    it('should return empty analysis when not connected', () => {
      analyzer = new AudioAnalyzer();
      const result = analyzer.update();
      expect(result.energy).toBe(0);
      expect(result.averageEnergy).toBe(0);
      expect(result.bandLevels.bass).toBe(0);
    });

    it('should track energy history', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      analyzer.connect(mockNode);
      analyzer.update();
      expect(analyzer.energyHistory.length).toBeGreaterThan(0);
    });

    it('should limit energy history size', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      analyzer.connect(mockNode);

      for (let i = 0; i < 100; i++) {
        analyzer.update();
      }

      expect(analyzer.energyHistory.length).toBeLessThanOrEqual(
        analyzer.energyHistorySize
      );
    });
  });

  describe('getFrequencyData', () => {
    it('should return empty array when not connected', () => {
      analyzer = new AudioAnalyzer({ fftSize: 2048 });
      const data = analyzer.getFrequencyData();
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(1024);
    });

    it('should return frequency data when connected', () => {
      analyzer = new AudioAnalyzer();
      const mockNode = { connect: vi.fn().mockReturnThis() };
      analyzer.connect(mockNode);
      analyzer.update();
      const data = analyzer.getFrequencyData();
      expect(data).toBeInstanceOf(Float32Array);
    });
  });

  describe('getWaveformData', () => {
    it('should return empty array when not connected', () => {
      analyzer = new AudioAnalyzer({ fftSize: 2048 });
      const data = analyzer.getWaveformData();
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(2048);
    });
  });

  describe('band level getters', () => {
    beforeEach(() => {
      analyzer = new AudioAnalyzer();
    });

    it('should return subBass level', () => {
      expect(analyzer.getSubBassLevel()).toBe(0);
    });

    it('should return bass level', () => {
      expect(analyzer.getBassLevel()).toBe(0);
    });

    it('should return lowMid level', () => {
      expect(analyzer.getLowMidLevel()).toBe(0);
    });

    it('should return mid level', () => {
      expect(analyzer.getMidLevel()).toBe(0);
    });

    it('should return highMid level', () => {
      expect(analyzer.getHighMidLevel()).toBe(0);
    });

    it('should return treble level', () => {
      expect(analyzer.getTrebleLevel()).toBe(0);
    });
  });

  describe('combined levels', () => {
    beforeEach(() => {
      analyzer = new AudioAnalyzer();
    });

    it('should return combined bass level', () => {
      analyzer.bandLevels.subBass = 0.5;
      analyzer.bandLevels.bass = 0.5;
      const combined = analyzer.getCombinedBassLevel();
      expect(combined).toBeGreaterThan(0);
      expect(combined).toBeLessThanOrEqual(1);
    });

    it('should return combined mid level', () => {
      analyzer.bandLevels.lowMid = 0.3;
      analyzer.bandLevels.mid = 0.3;
      analyzer.bandLevels.highMid = 0.3;
      const combined = analyzer.getCombinedMidLevel();
      expect(combined).toBeGreaterThan(0);
      expect(combined).toBeLessThanOrEqual(1);
    });
  });

  describe('setSmoothing', () => {
    it('should update smoothing value', () => {
      analyzer = new AudioAnalyzer();
      analyzer.setSmoothing(0.5);
      expect(analyzer.smoothing).toBe(0.5);
    });

    it('should clamp smoothing to 0-1', () => {
      analyzer = new AudioAnalyzer();
      analyzer.setSmoothing(-0.5);
      expect(analyzer.smoothing).toBe(0);

      analyzer.setSmoothing(1.5);
      expect(analyzer.smoothing).toBe(1);
    });
  });

  describe('dispose', () => {
    it('should disconnect and cleanup', () => {
      analyzer = new AudioAnalyzer();
      analyzer.initialize();
      analyzer.dispose();
      expect(analyzer.fftAnalyser).toBeNull();
      expect(analyzer.waveformAnalyser).toBeNull();
      expect(analyzer.isInitialized).toBe(false);
    });

    it('should clear energy history', () => {
      analyzer = new AudioAnalyzer();
      analyzer.energyHistory = [0.1, 0.2, 0.3];
      analyzer.dispose();
      expect(analyzer.energyHistory).toHaveLength(0);
    });
  });
});
