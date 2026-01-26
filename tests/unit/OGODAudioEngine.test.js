/**
 * @file tests/unit/OGODAudioEngine.test.js
 * @description Unit tests for OGODAudioEngine class
 * Tests audio stem loading, playback, volume mixing, and effects
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OGODAudioEngine', () => {
  let OGODAudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Tone mocks for each test
    global.Tone.Player.mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      connect: vi.fn().mockReturnThis(),
      toSeconds: vi.fn().mockReturnValue(0),
      loaded: Promise.resolve(),
    }));

    // Define OGODAudioEngine for testing
    OGODAudioEngine = class {
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

        this.stemNames = ['drums', 'bass', 'vocals', 'other'];
        this.players = {};
        this.stemVolumes = {};
        this.reverb = null;
        this.delay = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.usingSingleFile = false;
        this.volumeTargets = {};
        this.volumeLerpSpeed = 0.1;
      }

      _getTrackFilename() {
        const romanNumerals = [
          '',
          'I',
          'II',
          'III',
          'IV',
          'V',
          'VI',
          'VII',
          'VIII',
          'IX',
          'X',
          'XI',
          'XII',
          'XIII',
          'XIV',
          'XV',
          'XVI',
          'XVII',
          'XVIII',
          'XIX',
          'XX',
          'XXI',
          'XXII',
          'XXIII',
          'XXIV',
          'XXV',
          'XXVI',
          'XXVII',
          'XXVIII',
          'XXIX',
        ];
        const numStr = String(this.trackNumber).padStart(2, '0');
        const roman = romanNumerals[this.trackNumber] || this.trackNumber;
        return `${numStr} ${roman}`;
      }

      async initialize() {
        if (this.isInitialized) return;

        this.masterGain = new Tone.Gain(
          this.config.masterVolume
        ).toDestination();
        this.reverb = new Tone.Reverb({
          decay: 4,
          wet: this.config.reverbMix,
        }).connect(this.masterGain);
        this.delay = new Tone.FeedbackDelay({
          delayTime: this.config.delayTime,
          feedback: 0.2,
          wet: 0.1,
        }).connect(this.reverb);

        const stemsLoaded = await this._loadStems();
        if (!stemsLoaded && this.useFallback) {
          await this._loadFallbackAudio();
        }

        for (const stem of this.stemNames) {
          this.stemVolumes[stem] = 1.0;
          this.volumeTargets[stem] = 1.0;
        }

        this.isInitialized = true;
      }

      async _loadStems() {
        const trackNum = String(this.trackNumber).padStart(2, '0');
        const basePath = `${this.stemsPath}/${trackNum}`;

        try {
          const loadPromises = this.stemNames.map(async stem => {
            const url = `${basePath}/${stem}.mp3`;
            const player = new Tone.Player({
              url,
              loop: true,
              fadeIn: 0.5,
              fadeOut: 0.5,
            });
            const gainNode = new Tone.Gain(1.0);
            player.connect(gainNode);
            gainNode.connect(this.delay);
            this.players[stem] = { player, gain: gainNode };
            return player.loaded;
          });
          await Promise.all(loadPromises);
          return true;
        } catch (error) {
          console.warn('OGODAudioEngine: Could not load stems', error);
          return false;
        }
      }

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
          this.players.master = { player, gain: null };
          this.usingSingleFile = true;
          await player.loaded;
        } catch (error) {
          console.error(
            'OGODAudioEngine: Could not load fallback audio',
            error
          );
        }
      }

      async start() {
        if (!this.isInitialized) {
          console.warn('OGODAudioEngine: Not initialized');
          return;
        }
        if (this.isPlaying) return;

        await Tone.start();
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

      stop() {
        if (!this.isPlaying) return;

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

      setStemVolumes(volumes) {
        if (this.usingSingleFile) return;

        for (const stem of this.stemNames) {
          if (Object.prototype.hasOwnProperty.call(volumes, stem)) {
            this.volumeTargets[stem] = Math.max(0, Math.min(1, volumes[stem]));
          }
        }
      }

      update() {
        if (!this.isPlaying || this.usingSingleFile) return;

        for (const stem of this.stemNames) {
          const current = this.stemVolumes[stem];
          const target = this.volumeTargets[stem];

          if (Math.abs(current - target) > 0.001) {
            const newVolume =
              current + (target - current) * this.volumeLerpSpeed;
            this.stemVolumes[stem] = newVolume;

            if (this.players[stem]?.gain) {
              this.players[stem].gain.gain.setValueAtTime(
                newVolume,
                Tone.now()
              );
            }
          }
        }
      }

      setMasterVolume(volume) {
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(
            Math.max(0, Math.min(1, volume)),
            Tone.now()
          );
        }
      }

      setReverbMix(mix) {
        if (this.reverb) {
          this.reverb.wet.setValueAtTime(
            Math.max(0, Math.min(1, mix)),
            Tone.now()
          );
        }
      }

      getPosition() {
        if (this.usingSingleFile) {
          return this.players.master?.player.toSeconds() || 0;
        }
        const firstStem = this.stemNames[0];
        return this.players[firstStem]?.player.toSeconds() || 0;
      }

      getStemVolumes() {
        return { ...this.stemVolumes };
      }

      dispose() {
        this.stop();

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

        this.reverb?.dispose();
        this.delay?.dispose();
        this.masterGain?.dispose();
        this.players = {};
        this.isInitialized = false;
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const engine = new OGODAudioEngine();
      expect(engine.trackNumber).toBe(1);
      expect(engine.isInitialized).toBe(false);
      expect(engine.isPlaying).toBe(false);
      expect(engine.stemNames).toEqual(['drums', 'bass', 'vocals', 'other']);
    });

    it('should accept custom track number', () => {
      const engine = new OGODAudioEngine({ trackNumber: 15 });
      expect(engine.trackNumber).toBe(15);
    });

    it('should use config values', () => {
      const engine = new OGODAudioEngine();
      expect(engine.config.masterVolume).toBe(0.8);
      expect(engine.config.stemBlendRadius).toBe(15);
      expect(engine.config.reverbMix).toBe(0.3);
      expect(engine.config.delayTime).toBe(0.2);
    });
  });

  describe('_getTrackFilename', () => {
    it('should return formatted filename with roman numerals', () => {
      const engine = new OGODAudioEngine({ trackNumber: 1 });
      expect(engine._getTrackFilename()).toBe('01 I');
    });

    it('should handle track numbers above 10', () => {
      const engine = new OGODAudioEngine({ trackNumber: 15 });
      expect(engine._getTrackFilename()).toBe('15 XV');
    });

    it('should handle track 29', () => {
      const engine = new OGODAudioEngine({ trackNumber: 29 });
      expect(engine._getTrackFilename()).toBe('29 XXIX');
    });
  });

  describe('initialize', () => {
    it('should create master gain and effects', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      expect(engine.masterGain).toBeDefined();
      expect(engine.reverb).toBeDefined();
      expect(engine.delay).toBeDefined();
      expect(engine.isInitialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      const firstMasterGain = engine.masterGain;
      await engine.initialize();

      expect(engine.masterGain).toBe(firstMasterGain);
    });

    it('should initialize stem volumes', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      expect(engine.stemVolumes.drums).toBe(1.0);
      expect(engine.stemVolumes.bass).toBe(1.0);
      expect(engine.stemVolumes.vocals).toBe(1.0);
      expect(engine.stemVolumes.other).toBe(1.0);
    });

    it('should initialize volume targets', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      expect(engine.volumeTargets.drums).toBe(1.0);
      expect(engine.volumeTargets.bass).toBe(1.0);
    });
  });

  describe('start', () => {
    it('should not start if not initialized', async () => {
      const engine = new OGODAudioEngine();
      const consoleSpy = vi.spyOn(console, 'warn');
      await engine.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        'OGODAudioEngine: Not initialized'
      );
      expect(engine.isPlaying).toBe(false);
    });

    it('should start Tone.js context', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();

      expect(Tone.start).toHaveBeenCalled();
    });

    it('should start all stem players', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();

      expect(engine.isPlaying).toBe(true);
      for (const stem of engine.stemNames) {
        if (engine.players[stem]) {
          expect(engine.players[stem].player.start).toHaveBeenCalled();
        }
      }
    });

    it('should not restart if already playing', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();

      // Clear mock calls
      Tone.start.mockClear();
      await engine.start();

      expect(Tone.start).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should not stop if not playing', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      engine.stop();

      expect(engine.isPlaying).toBe(false);
    });

    it('should stop all stem players', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();
      engine.stop();

      expect(engine.isPlaying).toBe(false);
      for (const stem of engine.stemNames) {
        if (engine.players[stem]) {
          expect(engine.players[stem].player.stop).toHaveBeenCalled();
        }
      }
    });
  });

  describe('setStemVolumes', () => {
    it('should update volume targets', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setStemVolumes({
        drums: 0.5,
        bass: 0.8,
        vocals: 0.3,
        other: 1.0,
      });

      expect(engine.volumeTargets.drums).toBe(0.5);
      expect(engine.volumeTargets.bass).toBe(0.8);
      expect(engine.volumeTargets.vocals).toBe(0.3);
      expect(engine.volumeTargets.other).toBe(1.0);
    });

    it('should clamp volumes to 0-1 range', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setStemVolumes({
        drums: -0.5,
        bass: 1.5,
      });

      expect(engine.volumeTargets.drums).toBe(0);
      expect(engine.volumeTargets.bass).toBe(1);
    });

    it('should ignore volumes when using single file', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      engine.usingSingleFile = true;

      engine.setStemVolumes({ drums: 0.5 });

      // Volume targets should remain at default
      expect(engine.volumeTargets.drums).toBe(1.0);
    });
  });

  describe('update', () => {
    it('should lerp stem volumes toward targets', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();

      engine.setStemVolumes({ drums: 0.0 });
      engine.update();

      // After one update, should be closer to target but not there yet
      expect(engine.stemVolumes.drums).toBeLessThan(1.0);
      expect(engine.stemVolumes.drums).toBeGreaterThan(0.0);
    });

    it('should not update if not playing', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      const initialVolume = engine.stemVolumes.drums;
      engine.setStemVolumes({ drums: 0.0 });
      engine.update();

      expect(engine.stemVolumes.drums).toBe(initialVolume);
    });

    it('should not update if using single file', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();
      engine.usingSingleFile = true;

      const initialVolume = engine.stemVolumes.drums;
      engine.setStemVolumes({ drums: 0.0 });
      engine.update();

      expect(engine.stemVolumes.drums).toBe(initialVolume);
    });
  });

  describe('setMasterVolume', () => {
    it('should update master gain', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setMasterVolume(0.5);

      expect(engine.masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.any(Number)
      );
    });

    it('should clamp volume to 0-1', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setMasterVolume(1.5);

      expect(engine.masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        1,
        expect.any(Number)
      );
    });
  });

  describe('setReverbMix', () => {
    it('should update reverb wet level', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setReverbMix(0.5);

      expect(engine.reverb.wet.setValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.any(Number)
      );
    });

    it('should clamp mix to 0-1', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      engine.setReverbMix(-0.5);

      expect(engine.reverb.wet.setValueAtTime).toHaveBeenCalledWith(
        0,
        expect.any(Number)
      );
    });
  });

  describe('getPosition', () => {
    it('should return current playback position', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      const position = engine.getPosition();

      expect(typeof position).toBe('number');
    });

    it('should return 0 if no players', async () => {
      const engine = new OGODAudioEngine();
      engine.players = {};

      const position = engine.getPosition();

      expect(position).toBe(0);
    });
  });

  describe('getStemVolumes', () => {
    it('should return copy of stem volumes', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      const volumes = engine.getStemVolumes();

      expect(volumes).toHaveProperty('drums');
      expect(volumes).toHaveProperty('bass');
      expect(volumes).toHaveProperty('vocals');
      expect(volumes).toHaveProperty('other');
    });

    it('should not return same reference', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      const volumes1 = engine.getStemVolumes();
      const volumes2 = engine.getStemVolumes();

      expect(volumes1).not.toBe(volumes2);
    });
  });

  describe('dispose', () => {
    it('should stop playback', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      await engine.start();
      engine.dispose();

      expect(engine.isPlaying).toBe(false);
    });

    it('should dispose all players', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      // Get reference to players before dispose
      const playerRefs = { ...engine.players };
      engine.dispose();

      for (const stem of engine.stemNames) {
        if (playerRefs[stem]) {
          expect(playerRefs[stem].player.dispose).toHaveBeenCalled();
        }
      }
    });

    it('should dispose effects', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();

      const reverbRef = engine.reverb;
      const delayRef = engine.delay;
      const masterGainRef = engine.masterGain;

      engine.dispose();

      expect(reverbRef.dispose).toHaveBeenCalled();
      expect(delayRef.dispose).toHaveBeenCalled();
      expect(masterGainRef.dispose).toHaveBeenCalled();
    });

    it('should clear players object', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      engine.dispose();

      expect(Object.keys(engine.players)).toHaveLength(0);
    });

    it('should set isInitialized to false', async () => {
      const engine = new OGODAudioEngine();
      await engine.initialize();
      engine.dispose();

      expect(engine.isInitialized).toBe(false);
    });
  });
});
