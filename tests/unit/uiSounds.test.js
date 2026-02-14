/**
 * @file tests/unit/uiSounds.test.js
 * @description Unit tests for the UISounds singleton module (js/uiSounds.js)
 *
 * Tests the UI sound effects module including:
 * - Initialization with and without SoundJS
 * - Enable/disable toggle behavior
 * - Sound playback via createjs.Sound
 * - Volume control and clamping
 * - Convenience methods (click, hover, pageEnter, pageExit, transition)
 * - Lazy initialization on play
 * - Silent mode fallback when SoundJS is unavailable
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './setup.js';

/**
 * Build a fresh UISounds object for each test to avoid state leakage.
 * Mirrors the singleton from js/uiSounds.js.
 */
function createUISounds() {
  return {
    initialized: false,
    enabled: true,
    registered: false,
    volume: 0.3,

    config: {
      basePath: 'audio/',
      spriteFile: 'ui-sounds.ogg',
      alternateFormats: ['mp3', 'wav'],
      sprites: {
        click: { startTime: 0, duration: 100 },
        hover: { startTime: 150, duration: 80 },
        pageEnter: { startTime: 300, duration: 300 },
        pageExit: { startTime: 700, duration: 400 },
        transition: { startTime: 1200, duration: 500 },
      },
    },

    init() {
      if (this.initialized) {
        return true;
      }

      if (typeof createjs === 'undefined' || !createjs.Sound) {
        console.warn('UISounds: SoundJS not available, using silent mode');
        this.initialized = true;
        this.enabled = false;
        return false;
      }

      try {
        const supported = this._detectFormat();
        if (!supported) {
          console.warn('UISounds: No supported audio format detected');
          this.enabled = false;
          return false;
        }

        const sprites = Object.entries(this.config.sprites).map(
          ([id, cfg]) => ({
            id,
            startTime: cfg.startTime,
            duration: cfg.duration,
          })
        );

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
        return true;
      } catch (error) {
        console.error('UISounds: Initialization error:', error.message);
        this.enabled = false;
        return false;
      }
    },

    play(soundId, volumeMultiplier = 1) {
      if (!this.enabled || !this.initialized) {
        return null;
      }

      if (!this.registered) {
        this.init();
      }

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

    click(volume = 1) {
      this.play('click', volume);
    },

    hover(volume = 0.5) {
      this.play('hover', volume);
    },

    pageEnter(volume = 1) {
      this.play('pageEnter', volume);
    },

    pageExit(volume = 1) {
      this.play('pageExit', volume);
    },

    transition(volume = 1) {
      this.play('transition', volume);
    },

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    },

    enable() {
      this.enabled = true;
    },

    disable() {
      this.enabled = false;
    },

    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
    },

    getVolume() {
      return this.volume;
    },

    isEnabled() {
      return this.enabled && this.initialized;
    },

    _detectFormat() {
      if (typeof createjs === 'undefined' || !createjs.Sound) {
        return null;
      }

      const capabilities = createjs.Sound.getCapabilities();
      if (capabilities) {
        return 'ogg';
      }

      return null;
    },
  };
}

// ---- Mock createjs.Sound ----

function createMockCreatejs() {
  const mockSoundInstance = { volume: 0.3, interrupt: null };

  return {
    Sound: {
      registerSounds: vi.fn(),
      play: vi.fn().mockReturnValue(mockSoundInstance),
      getCapabilities: vi.fn().mockReturnValue({ ogg: true }),
      INTERRUPT_ANY: 'any',
    },
    _mockSoundInstance: mockSoundInstance,
  };
}

// ---- Tests ----

describe('UISounds', () => {
  let UISounds;
  let mockCreatejs;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatejs = createMockCreatejs();
    global.createjs = mockCreatejs;
    UISounds = createUISounds();
  });

  afterEach(() => {
    delete global.createjs;
  });

  describe('default state', () => {
    it('should start uninitialized', () => {
      expect(UISounds.initialized).toBe(false);
      expect(UISounds.registered).toBe(false);
    });

    it('should start enabled', () => {
      expect(UISounds.enabled).toBe(true);
    });

    it('should have default volume of 0.3', () => {
      expect(UISounds.volume).toBe(0.3);
    });

    it('should have five sprite definitions', () => {
      const spriteNames = Object.keys(UISounds.config.sprites);
      expect(spriteNames).toEqual([
        'click',
        'hover',
        'pageEnter',
        'pageExit',
        'transition',
      ]);
    });

    it('should report isEnabled as false before initialization', () => {
      // enabled is true but initialized is false, so isEnabled returns false
      expect(UISounds.isEnabled()).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize successfully when SoundJS is available', () => {
      const result = UISounds.init();

      expect(result).toBe(true);
      expect(UISounds.initialized).toBe(true);
      expect(UISounds.registered).toBe(true);
    });

    it('should register sounds with createjs.Sound', () => {
      UISounds.init();

      expect(mockCreatejs.Sound.registerSounds).toHaveBeenCalledTimes(1);

      const [sounds, basePath] =
        mockCreatejs.Sound.registerSounds.mock.calls[0];
      expect(basePath).toBe('audio/');
      expect(sounds).toHaveLength(1);
      expect(sounds[0].src).toBe('ui-sounds.ogg');
      expect(sounds[0].data.audioSprite).toHaveLength(5);
    });

    it('should build sprites array from config', () => {
      UISounds.init();

      const sprites =
        mockCreatejs.Sound.registerSounds.mock.calls[0][0][0].data.audioSprite;
      const clickSprite = sprites.find(s => s.id === 'click');
      expect(clickSprite).toEqual({ id: 'click', startTime: 0, duration: 100 });

      const transitionSprite = sprites.find(s => s.id === 'transition');
      expect(transitionSprite).toEqual({
        id: 'transition',
        startTime: 1200,
        duration: 500,
      });
    });

    it('should return true on subsequent calls without re-registering', () => {
      UISounds.init();
      const result = UISounds.init();

      expect(result).toBe(true);
      expect(mockCreatejs.Sound.registerSounds).toHaveBeenCalledTimes(1);
    });

    it('should fall back to silent mode when createjs is undefined', () => {
      delete global.createjs;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = UISounds.init();

      expect(result).toBe(false);
      expect(UISounds.initialized).toBe(true);
      expect(UISounds.enabled).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        'UISounds: SoundJS not available, using silent mode'
      );

      warnSpy.mockRestore();
    });

    it('should fall back to silent mode when createjs.Sound is missing', () => {
      global.createjs = {};
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = UISounds.init();

      expect(result).toBe(false);
      expect(UISounds.enabled).toBe(false);

      warnSpy.mockRestore();
    });

    it('should disable when no audio format is detected', () => {
      mockCreatejs.Sound.getCapabilities.mockReturnValue(null);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = UISounds.init();

      expect(result).toBe(false);
      expect(UISounds.enabled).toBe(false);

      warnSpy.mockRestore();
    });

    it('should handle initialization errors gracefully', () => {
      mockCreatejs.Sound.registerSounds.mockImplementation(() => {
        throw new Error('Audio context failed');
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = UISounds.init();

      expect(result).toBe(false);
      expect(UISounds.enabled).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'UISounds: Initialization error:',
        'Audio context failed'
      );

      errorSpy.mockRestore();
    });
  });

  describe('play', () => {
    beforeEach(() => {
      UISounds.init();
    });

    it('should play a valid sound and return the instance', () => {
      const instance = UISounds.play('click');

      expect(mockCreatejs.Sound.play).toHaveBeenCalledTimes(1);
      expect(mockCreatejs.Sound.play).toHaveBeenCalledWith('click', {
        volume: 0.3,
        interrupt: 'any',
      });
      expect(instance).toBeDefined();
    });

    it('should apply volume multiplier', () => {
      UISounds.play('hover', 0.5);

      const callArgs = mockCreatejs.Sound.play.mock.calls[0][1];
      expect(callArgs.volume).toBeCloseTo(0.15); // 0.3 * 0.5
    });

    it('should return null for unknown sound IDs', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = UISounds.play('nonexistent');

      expect(result).toBeNull();
      expect(mockCreatejs.Sound.play).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "UISounds: Unknown sound 'nonexistent'"
      );

      warnSpy.mockRestore();
    });

    it('should return null when disabled', () => {
      UISounds.disable();
      const result = UISounds.play('click');

      expect(result).toBeNull();
      expect(mockCreatejs.Sound.play).not.toHaveBeenCalled();
    });

    it('should return null when not initialized', () => {
      const fresh = createUISounds();
      global.createjs = mockCreatejs;

      // enabled but not initialized
      const result = fresh.play('click');
      expect(result).toBeNull();
    });

    it('should handle play errors gracefully', () => {
      mockCreatejs.Sound.play.mockImplementation(() => {
        throw new Error('Playback failed');
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = UISounds.play('click');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "UISounds: Error playing 'click':",
        'Playback failed'
      );

      warnSpy.mockRestore();
    });

    it('should attempt lazy init if initialized but not registered', () => {
      // Simulate a state where initialized is true but registered is false.
      // In practice this is an edge case: init() early-returns because
      // initialized is already true, so registerSounds is NOT called again.
      // The play still proceeds because the sound ID is valid.
      UISounds.initialized = true;
      UISounds.registered = false;

      mockCreatejs.Sound.registerSounds.mockClear();

      UISounds.play('click');

      // init() short-circuits on the initialized guard, so no re-registration
      expect(mockCreatejs.Sound.registerSounds).toHaveBeenCalledTimes(0);
      // But play still fires because the sound ID is valid
      expect(mockCreatejs.Sound.play).toHaveBeenCalledWith('click', {
        volume: 0.3,
        interrupt: 'any',
      });
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      UISounds.init();
    });

    it('click() should play the click sound at default volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.click();
      expect(playSpy).toHaveBeenCalledWith('click', 1);
    });

    it('click() should accept a custom volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.click(0.7);
      expect(playSpy).toHaveBeenCalledWith('click', 0.7);
    });

    it('hover() should play the hover sound at default volume 0.5', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.hover();
      expect(playSpy).toHaveBeenCalledWith('hover', 0.5);
    });

    it('hover() should accept a custom volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.hover(0.2);
      expect(playSpy).toHaveBeenCalledWith('hover', 0.2);
    });

    it('pageEnter() should play the pageEnter sound', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.pageEnter();
      expect(playSpy).toHaveBeenCalledWith('pageEnter', 1);
    });

    it('pageExit() should play the pageExit sound', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.pageExit();
      expect(playSpy).toHaveBeenCalledWith('pageExit', 1);
    });

    it('transition() should play the transition sound', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.transition();
      expect(playSpy).toHaveBeenCalledWith('transition', 1);
    });

    it('pageEnter() should accept a custom volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.pageEnter(0.5);
      expect(playSpy).toHaveBeenCalledWith('pageEnter', 0.5);
    });

    it('pageExit() should accept a custom volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.pageExit(0.8);
      expect(playSpy).toHaveBeenCalledWith('pageExit', 0.8);
    });

    it('transition() should accept a custom volume', () => {
      const playSpy = vi.spyOn(UISounds, 'play');
      UISounds.transition(0.6);
      expect(playSpy).toHaveBeenCalledWith('transition', 0.6);
    });
  });

  describe('enable / disable / toggle', () => {
    it('disable() should set enabled to false', () => {
      UISounds.disable();
      expect(UISounds.enabled).toBe(false);
    });

    it('enable() should set enabled to true', () => {
      UISounds.disable();
      UISounds.enable();
      expect(UISounds.enabled).toBe(true);
    });

    it('toggle() should flip enabled state and return new value', () => {
      expect(UISounds.enabled).toBe(true);

      const result1 = UISounds.toggle();
      expect(result1).toBe(false);
      expect(UISounds.enabled).toBe(false);

      const result2 = UISounds.toggle();
      expect(result2).toBe(true);
      expect(UISounds.enabled).toBe(true);
    });

    it('should not play sounds when disabled', () => {
      UISounds.init();
      UISounds.disable();

      const result = UISounds.play('click');

      expect(result).toBeNull();
      expect(mockCreatejs.Sound.play).not.toHaveBeenCalled();
    });

    it('should resume playing sounds after re-enabling', () => {
      UISounds.init();
      UISounds.disable();
      UISounds.enable();

      const result = UISounds.play('click');

      expect(result).toBeDefined();
      expect(mockCreatejs.Sound.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('isEnabled', () => {
    it('should return false when not initialized', () => {
      expect(UISounds.isEnabled()).toBe(false);
    });

    it('should return true when initialized and enabled', () => {
      UISounds.init();
      expect(UISounds.isEnabled()).toBe(true);
    });

    it('should return false when initialized but disabled', () => {
      UISounds.init();
      UISounds.disable();
      expect(UISounds.isEnabled()).toBe(false);
    });

    it('should return false when enabled but in silent mode (no SoundJS)', () => {
      delete global.createjs;
      UISounds.init();
      // init sets enabled=false in silent mode, even though initialized=true
      expect(UISounds.isEnabled()).toBe(false);
    });
  });

  describe('volume control', () => {
    it('setVolume() should update the volume', () => {
      UISounds.setVolume(0.7);
      expect(UISounds.volume).toBeCloseTo(0.7);
    });

    it('getVolume() should return the current volume', () => {
      UISounds.setVolume(0.5);
      expect(UISounds.getVolume()).toBeCloseTo(0.5);
    });

    it('setVolume() should clamp values below 0 to 0', () => {
      UISounds.setVolume(-0.5);
      expect(UISounds.volume).toBe(0);
    });

    it('setVolume() should clamp values above 1 to 1', () => {
      UISounds.setVolume(2.5);
      expect(UISounds.volume).toBe(1);
    });

    it('setVolume(0) should mute without disabling', () => {
      UISounds.setVolume(0);
      expect(UISounds.volume).toBe(0);
      expect(UISounds.enabled).toBe(true);
    });

    it('volume should affect play output', () => {
      UISounds.setVolume(0.8);
      UISounds.init();
      UISounds.play('click', 0.5);

      const callArgs = mockCreatejs.Sound.play.mock.calls[0][1];
      expect(callArgs.volume).toBeCloseTo(0.4); // 0.8 * 0.5
    });
  });

  describe('_detectFormat', () => {
    it('should return "ogg" when capabilities are available', () => {
      const format = UISounds._detectFormat();
      expect(format).toBe('ogg');
    });

    it('should return null when capabilities are null', () => {
      mockCreatejs.Sound.getCapabilities.mockReturnValue(null);
      const format = UISounds._detectFormat();
      expect(format).toBeNull();
    });

    it('should return null when createjs is undefined', () => {
      delete global.createjs;
      const format = UISounds._detectFormat();
      expect(format).toBeNull();
    });

    it('should return null when createjs.Sound is missing', () => {
      global.createjs = {};
      const format = UISounds._detectFormat();
      expect(format).toBeNull();
    });
  });

  describe('sprite configuration', () => {
    it('should have non-overlapping sprite timings', () => {
      const sprites = UISounds.config.sprites;
      const entries = Object.entries(sprites).sort(
        (a, b) => a[1].startTime - b[1].startTime
      );

      for (let i = 0; i < entries.length - 1; i++) {
        const current = entries[i][1];
        const next = entries[i + 1][1];
        const currentEnd = current.startTime + current.duration;
        expect(currentEnd).toBeLessThanOrEqual(next.startTime);
      }
    });

    it('should have positive durations for all sprites', () => {
      const sprites = UISounds.config.sprites;
      for (const [, cfg] of Object.entries(sprites)) {
        expect(cfg.duration).toBeGreaterThan(0);
      }
    });

    it('should have non-negative start times', () => {
      const sprites = UISounds.config.sprites;
      for (const [, cfg] of Object.entries(sprites)) {
        expect(cfg.startTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('integration with page navigation pattern', () => {
    // Validates the guard pattern used in page.js and sketch.js:
    // if (typeof UISounds !== 'undefined' && UISounds.isEnabled()) { ... }

    it('should work with the typeof guard pattern used in page.js', () => {
      UISounds.init();

      // Simulate the guard: typeof UISounds !== 'undefined' && UISounds.isEnabled()
      const guard = typeof UISounds !== 'undefined' && UISounds.isEnabled();
      expect(guard).toBe(true);

      if (guard) {
        UISounds.pageExit(0.5);
      }

      expect(mockCreatejs.Sound.play).toHaveBeenCalledWith('pageExit', {
        volume: 0.3 * 0.5,
        interrupt: 'any',
      });
    });

    it('should not play when guard fails due to disabled state', () => {
      UISounds.init();
      UISounds.disable();

      const guard = typeof UISounds !== 'undefined' && UISounds.isEnabled();
      expect(guard).toBe(false);
    });

    it('should support hover and click patterns from sketch.js', () => {
      UISounds.init();

      // Matches playMenuHoverSound() in sketch.js
      if (typeof UISounds !== 'undefined' && UISounds.isEnabled()) {
        UISounds.hover(0.3);
      }
      expect(mockCreatejs.Sound.play).toHaveBeenCalledWith('hover', {
        volume: 0.3 * 0.3,
        interrupt: 'any',
      });

      mockCreatejs.Sound.play.mockClear();

      // Matches playMenuClickSound() in sketch.js
      if (typeof UISounds !== 'undefined' && UISounds.isEnabled()) {
        UISounds.click(0.5);
      }
      expect(mockCreatejs.Sound.play).toHaveBeenCalledWith('click', {
        volume: 0.3 * 0.5,
        interrupt: 'any',
      });
    });
  });
});
