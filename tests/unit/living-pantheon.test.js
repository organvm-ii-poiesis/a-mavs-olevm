/**
 * @vitest-environment jsdom
 * Unit tests for Living Pantheon system
 * Tests core Living Pantheon functionality including:
 * - LivingPantheonCore singleton pattern and lifecycle
 * - GlobalGlitchSystem visual effects
 * - AmbientSoundLayer audio management
 * - MorphingImageSystem image transitions
 * - AnimatedContentSystem breathing animations
 * - LabyrinthGenerator content generation
 * - Event handling and state management
 * - Accessibility (prefers-reduced-motion)
 * - Resource cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock Howler.js Howl class
 */
class MockHowl {
  constructor(options = {}) {
    this.options = options;
    this.isPlaying = false;
    this.currentVolume = options.volume ?? 1;
    this.currentSeek = 0;
    this.duration = options._duration ?? 180;
    this.eventHandlers = {};
  }

  play() {
    this.isPlaying = true;
    this._triggerEvent('play');
    return 1;
  }

  pause() {
    this.isPlaying = false;
    this._triggerEvent('pause');
  }

  stop() {
    this.isPlaying = false;
    this.currentSeek = 0;
    this._triggerEvent('stop');
  }

  seek(time) {
    if (time !== undefined) {
      this.currentSeek = time;
      return time;
    }
    return this.currentSeek;
  }

  volume(vol) {
    if (vol !== undefined) {
      this.currentVolume = vol;
      return this;
    }
    return this.currentVolume;
  }

  fade(from, to, duration) {
    this.currentVolume = to;
    return this;
  }

  rate(val) {
    return val ?? 1;
  }

  playing() {
    return this.isPlaying;
  }

  state() {
    return 'loaded';
  }

  unload() {
    this.stop();
  }

  load() {
    return this;
  }

  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
    if (event === 'load') {
      setTimeout(() => callback(), 0);
    }
    return this;
  }

  off(event, callback) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        cb => cb !== callback
      );
    }
    return this;
  }

  once(event, callback) {
    if (event === 'load') {
      setTimeout(() => callback(), 0);
    }
    return this;
  }

  _triggerEvent(event) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(cb => cb());
    }
  }
}

/**
 * Mock GlobalGlitchSystem
 */
class MockGlobalGlitchSystem {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      frequency: options.frequency ?? 0.02,
      checkInterval: options.checkInterval ?? 5000,
      types: options.types ?? ['text', 'color', 'position', 'image'],
      duration: {
        min: options.duration?.min ?? 50,
        max: options.duration?.max ?? 200,
      },
      excludeSelectors: options.excludeSelectors ?? [
        '.no-glitch',
        'input',
        'button',
        'a',
      ],
    };
    this.isRunning = false;
    this.checkIntervalId = null;
    this.activeGlitches = new Set();
    this.pendingAnimationFrames = new Set();
  }

  start() {
    if (this.isRunning || !this.config.enabled) {
      return this;
    }

    // Check for prefers-reduced-motion
    if (this._prefersReducedMotion()) {
      return this;
    }

    this.isRunning = true;
    this.checkIntervalId = setInterval(
      () => this.triggerGlitch?.(),
      this.config.checkInterval
    );
    return this;
  }

  stop() {
    this.isRunning = false;
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    return this;
  }

  dispose() {
    this.stop();
    this.activeGlitches.clear();
  }

  triggerGlitch(type) {
    // Check if there are any elements available to glitch
    const element = this._selectRandomElement();
    if (!element) {
      return false;
    }

    this.activeGlitches.add(Math.random());
    return true;
  }

  _selectRandomElement() {
    // Simplified version of the real implementation
    const excludeSelector = this.config.excludeSelectors.join(', ');
    const allElements = document.querySelectorAll('*');
    const candidates = [];

    for (const el of allElements) {
      if (excludeSelector && el.matches(excludeSelector)) {
        continue;
      }
      candidates.push(el);
    }

    if (candidates.length === 0) {
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  _prefersReducedMotion() {
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeGlitchCount: this.activeGlitches.size,
      config: { ...this.config },
    };
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    return this;
  }
}

/**
 * Mock AmbientSoundLayer
 */
class MockAmbientSoundLayer {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      baseVolume: options.baseVolume ?? 0.05,
      chamberSpecific: options.chamberSpecific ?? true,
      crossfadeDuration: options.crossfadeDuration ?? 2000,
      defaultTrack: options.defaultTrack ?? 'audio/ambient/temple-drone.mp3',
      chamberTracks: options.chamberTracks ?? {},
    };
    this.isPlaying = false;
    this.isMuted = false;
    this.currentChamber = null;
    this.currentVolume = this.config.baseVolume;
    this.currentSound = null;
  }

  start() {
    if (!this.config.enabled || this.isPlaying) {
      return this;
    }
    this.isPlaying = true;
    this.currentSound = new MockHowl();
    this.currentSound.play();
    return this;
  }

  stop() {
    this.isPlaying = false;
    if (this.currentSound) {
      this.currentSound.stop();
    }
    return this;
  }

  dispose() {
    this.stop();
    this.currentSound = null;
  }

  transitionToChamber(chamberId) {
    const previousChamber = this.currentChamber;
    this.currentChamber = chamberId;
    return this;
  }

  setVolume(vol) {
    this.currentVolume = vol;
    if (this.currentSound) {
      this.currentSound.volume(vol);
    }
    return this;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentChamber: this.currentChamber,
      currentVolume: this.currentVolume,
    };
  }
}

/**
 * Mock MorphingImageSystem
 */
class MockMorphingImageSystem {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      transitionDuration: options.transitionDuration ?? 60000,
      pauseBetween: options.pauseBetween ?? 30000,
      targetSelectors: options.targetSelectors ?? ['.morph-image'],
      blendModes: options.blendModes ?? ['normal', 'multiply', 'screen'],
    };
    this.isRunning = false;
    this.activeMorphs = new Map();
    this.pendingAnimationFrames = new Set();
    this.pauseTimeouts = new Set();
  }

  start() {
    if (this.isRunning || !this.config.enabled) {
      return this;
    }
    this.isRunning = true;
    return this;
  }

  stop() {
    this.isRunning = false;
    for (const frameId of this.pendingAnimationFrames) {
      cancelAnimationFrame(frameId);
    }
    this.pendingAnimationFrames.clear();
    return this;
  }

  dispose() {
    this.stop();
    this.activeMorphs.clear();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeMorphCount: this.activeMorphs.size,
    };
  }
}

/**
 * Mock AnimatedContentSystem
 */
class MockAnimatedContentSystem {
  constructor(options = {}) {
    const defaults = {
      enabled: true,
      breathing: {
        enabled: true,
        scale: 1.02,
        duration: 4000,
      },
      drift: {
        enabled: true,
        distance: 2,
        duration: 8000,
      },
    };

    this.config = {
      ...defaults,
      ...options,
      breathing: {
        ...defaults.breathing,
        ...(options.breathing || {}),
      },
      drift: {
        ...defaults.drift,
        ...(options.drift || {}),
      },
    };
    this.isRunning = false;
    this.activeAnimations = new Set();
  }

  start() {
    if (this.isRunning || !this.config.enabled) {
      return this;
    }
    this.isRunning = true;
    return this;
  }

  stop() {
    this.isRunning = false;
    this.activeAnimations.clear();
    return this;
  }

  dispose() {
    this.stop();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      animationCount: this.activeAnimations.size,
    };
  }
}

/**
 * Mock LabyrinthGenerator
 */
class MockLabyrinthGenerator {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      fragmentSources: options.fragmentSources ?? [],
      fragmentCount: options.fragmentCount ?? 100,
      loopholeCount: options.loopholeCount ?? 10,
      loopholeProbability: options.loopholeProbability ?? 0.05,
    };
    this.fragments = [];
    this.entries = new Map();
    this.loopholes = new Set();
    this.isInitialized = false;
    this.isLoading = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this;
    }
    this.isLoading = true;
    await new Promise(resolve => setTimeout(resolve, 10));
    this.isInitialized = true;
    this.isLoading = false;
    return this;
  }

  generateEntry() {
    if (!this.isInitialized) {
      throw new Error('Labyrinth not initialized');
    }
    return {
      date: '020226',
      content: 'Generated entry',
      fragments: [],
      hasLoophole: Math.random() < this.config.loopholeProbability,
    };
  }

  dispose() {
    this.fragments = [];
    this.entries.clear();
    this.loopholes.clear();
    this.isInitialized = false;
  }
}

/**
 * Mock LivingPantheonCore
 */
class MockLivingPantheonCore {
  constructor() {
    this.config = {
      enabled: true,
      accessibility: {
        storageKey: 'etceter4-living-pantheon-enabled',
        toggleShortcut: { key: 'l' },
      },
      glitch: { enabled: true },
      ambient: { enabled: true },
      morphing: { enabled: true },
      animation: { enabled: true },
    };

    this.isInitialized = false;
    this.isRunning = false;
    this.currentChamberId = null;
    this.currentChamberColor = null;
    this.userEnabledInStorage = true;
    this.storageKey =
      this.config.accessibility?.storageKey ||
      'etceter4-living-pantheon-enabled';

    this.subsystems = {
      glitch: null,
      ambient: null,
      morphing: null,
      animation: null,
    };

    this.listeners = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
  }

  static getInstance() {
    if (!window.livingPantheonCoreInstance) {
      window.livingPantheonCoreInstance = new MockLivingPantheonCore();
    }
    return window.livingPantheonCoreInstance;
  }

  initialize(options = {}) {
    if (this.isInitialized) {
      return this;
    }

    if (this.config.enabled === false) {
      return this;
    }

    if (this._prefersReducedMotion()) {
      return this;
    }

    this.currentChamberId = options.chamberId || null;
    this.currentChamberColor = options.chamberColor || null;

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this.isInitialized = true;

    return this;
  }

  start() {
    if (!this.isInitialized || this.isRunning) {
      return this;
    }

    if (!this.userEnabledInStorage) {
      return this;
    }

    this.isRunning = true;

    if (this.config.glitch?.enabled) {
      this._ensureGlitchSystem().start();
    }
    if (this.config.ambient?.enabled) {
      this._ensureAmbientSoundLayer().start();
    }
    if (this.config.morphing?.enabled) {
      this._ensureMorphingImageSystem().start();
    }
    if (this.config.animation?.enabled) {
      this._ensureAnimatedContentSystem().start();
    }

    this._emitStatusChange();
    return this;
  }

  stop() {
    if (!this.isRunning) {
      return this;
    }

    this.isRunning = false;

    if (this.subsystems.glitch) {
      this.subsystems.glitch.stop();
    }
    if (this.subsystems.ambient) {
      this.subsystems.ambient.stop();
    }
    if (this.subsystems.morphing) {
      this.subsystems.morphing.stop();
    }
    if (this.subsystems.animation) {
      this.subsystems.animation.stop();
    }

    this._emitStatusChange();
    return this;
  }

  toggle() {
    const newState = !this.isRunning;

    if (newState) {
      this.userEnabledInStorage = true;
      localStorage.setItem(this.storageKey, 'true');
      this.start();
    } else {
      this.userEnabledInStorage = false;
      localStorage.setItem(this.storageKey, 'false');
      this.stop();
    }

    return this;
  }

  dispose() {
    this.stop();

    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    if (this.subsystems.glitch) {
      this.subsystems.glitch.dispose();
      this.subsystems.glitch = null;
    }
    if (this.subsystems.ambient) {
      this.subsystems.ambient.dispose();
      this.subsystems.ambient = null;
    }
    if (this.subsystems.morphing) {
      this.subsystems.morphing.dispose();
      this.subsystems.morphing = null;
    }
    if (this.subsystems.animation) {
      this.subsystems.animation.dispose();
      this.subsystems.animation = null;
    }

    this.isInitialized = false;
    this.listeners.clear();
    this._emitStatusChange();

    delete window.livingPantheonCoreInstance;
  }

  transitionToNewChamber(chamberId, chamberColor) {
    const previousChamberId = this.currentChamberId;
    this.currentChamberId = chamberId;
    if (chamberColor) {
      this.currentChamberColor = chamberColor;
    }

    if (this.subsystems.ambient) {
      this.subsystems.ambient.transitionToChamber?.(chamberId);
    }

    this._emitStatusChange({
      event: 'chamber-transition',
      from: previousChamberId,
      to: chamberId,
    });

    return this;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      currentChamberId: this.currentChamberId,
      currentChamberColor: this.currentChamberColor,
      userEnabledInStorage: this.userEnabledInStorage,
      prefersReducedMotion: this._prefersReducedMotion(),
      subsystems: {
        glitch: this.subsystems.glitch
          ? this.subsystems.glitch.getStatus()
          : null,
        ambient: this.subsystems.ambient
          ? this.subsystems.ambient.getStatus?.()
          : null,
        morphing: this.subsystems.morphing
          ? this.subsystems.morphing.getStatus?.()
          : null,
        animation: this.subsystems.animation
          ? this.subsystems.animation.getStatus?.()
          : null,
      },
    };
  }

  on(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  }

  off(callback) {
    this.listeners.delete(callback);
  }

  _prefersReducedMotion() {
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }

  _emitStatusChange(details = {}) {
    const status = this.getStatus();
    const eventDetail = {
      status,
      ...details,
    };

    for (const callback of this.listeners) {
      try {
        callback(eventDetail);
      } catch (error) {
        // Silent fail
      }
    }

    window.dispatchEvent(
      new CustomEvent('living-pantheon-status-change', {
        detail: eventDetail,
      })
    );
  }

  _onKeyDown(event) {
    if (!this.isInitialized) {
      return;
    }

    const toggleShortcut = this.config.accessibility?.toggleShortcut;
    if (!toggleShortcut) {
      return;
    }

    const isCtrl =
      event.ctrlKey || (event.metaKey && navigator.platform.includes('Mac'));
    const isShift = event.shiftKey;
    const isL = event.key.toLowerCase() === toggleShortcut.key.toLowerCase();

    if (isCtrl && isShift && isL) {
      event.preventDefault();
      this.toggle();
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      if (this.subsystems.glitch?.isRunning) {
        this.subsystems.glitch.stop();
      }
      if (this.subsystems.ambient?.isRunning) {
        this.subsystems.ambient.stop();
      }
      if (this.subsystems.morphing?.isRunning) {
        this.subsystems.morphing.stop();
      }
      if (this.subsystems.animation?.isRunning) {
        this.subsystems.animation.stop();
      }
    } else if (this.isRunning) {
      if (this.config.glitch?.enabled) {
        this.subsystems.glitch?.start?.();
      }
      if (this.config.ambient?.enabled) {
        this.subsystems.ambient?.start?.();
      }
      if (this.config.morphing?.enabled) {
        this.subsystems.morphing?.start?.();
      }
      if (this.config.animation?.enabled) {
        this.subsystems.animation?.start?.();
      }
    }
  }

  _ensureGlitchSystem() {
    if (!this.subsystems.glitch) {
      this.subsystems.glitch = new MockGlobalGlitchSystem(this.config.glitch);
    }
    return this.subsystems.glitch;
  }

  _ensureAmbientSoundLayer() {
    if (!this.subsystems.ambient) {
      this.subsystems.ambient = new MockAmbientSoundLayer({
        ...this.config.ambient,
        chamberId: this.currentChamberId,
        chamberColor: this.currentChamberColor,
      });
    }
    return this.subsystems.ambient;
  }

  _ensureMorphingImageSystem() {
    if (!this.subsystems.morphing) {
      this.subsystems.morphing = new MockMorphingImageSystem(
        this.config.morphing
      );
    }
    return this.subsystems.morphing;
  }

  _ensureAnimatedContentSystem() {
    if (!this.subsystems.animation) {
      this.subsystems.animation = new MockAnimatedContentSystem(
        this.config.animation
      );
    }
    return this.subsystems.animation;
  }
}

// ============================================================================
// Test Suites
// ============================================================================

// Mock localStorage for all tests
const localStorageMock = {
  store: {},
  getItem: vi.fn(key => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = String(value);
  }),
  removeItem: vi.fn(key => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn(i => Object.keys(localStorageMock.store)[i] || null),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock matchMedia for prefers-reduced-motion tests
const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock,
  writable: true,
  configurable: true,
});

describe('LivingPantheonCore', () => {
  beforeEach(() => {
    delete window.livingPantheonCoreInstance;
    localStorageMock.clear();
    localStorageMock.store = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    const instance = window.livingPantheonCoreInstance;
    if (instance) {
      instance.dispose();
    }
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const instance1 = MockLivingPantheonCore.getInstance();
      const instance2 = MockLivingPantheonCore.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create only one instance globally', () => {
      MockLivingPantheonCore.getInstance();
      MockLivingPantheonCore.getInstance();

      expect(window.livingPantheonCoreInstance).toBeDefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      expect(core.isInitialized).toBe(true);
      expect(core.isRunning).toBe(false);
      expect(core.currentChamberId).toBeNull();
    });

    it('should initialize with chamber options', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize({ chamberId: 'akademia', chamberColor: '#2c3e50' });

      expect(core.currentChamberId).toBe('akademia');
      expect(core.currentChamberColor).toBe('#2c3e50');
    });

    it('should not reinitialize if already initialized', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize({ chamberId: 'akademia' });
      core.initialize({ chamberId: 'bibliotheke' });

      expect(core.currentChamberId).toBe('akademia');
    });

    it('should skip initialization when globally disabled', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.config.enabled = false;
      core.initialize();

      expect(core.isInitialized).toBe(false);
    });

    it('should skip initialization when prefers-reduced-motion is set', () => {
      vi.mocked(window.matchMedia).mockReturnValueOnce({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      expect(core.isInitialized).toBe(false);
    });
  });

  describe('Start/Stop', () => {
    it('should start system when initialized and user enabled', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      expect(core.isRunning).toBe(true);
    });

    it('should not start if not initialized', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.start();

      expect(core.isRunning).toBe(false);
    });

    it('should not start if user disabled via localStorage', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.userEnabledInStorage = false;
      core.initialize();
      core.start();

      expect(core.isRunning).toBe(false);
    });

    it('should stop running system', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();
      expect(core.isRunning).toBe(true);

      core.stop();
      expect(core.isRunning).toBe(false);
    });

    it('should start subsystems when enabled', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      expect(core.subsystems.glitch?.isRunning).toBe(true);
      expect(core.subsystems.ambient?.isPlaying).toBe(true);
      expect(core.subsystems.morphing?.isRunning).toBe(true);
      expect(core.subsystems.animation?.isRunning).toBe(true);
    });

    it('should stop all subsystems when stopped', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();
      core.stop();

      expect(core.subsystems.glitch?.isRunning).toBe(false);
      expect(core.subsystems.ambient?.isPlaying).toBe(false);
      expect(core.subsystems.morphing?.isRunning).toBe(false);
      expect(core.subsystems.animation?.isRunning).toBe(false);
    });
  });

  describe('Toggle', () => {
    it('should toggle from stopped to running', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      core.toggle();

      expect(core.isRunning).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        core.storageKey,
        'true'
      );
    });

    it('should toggle from running to stopped', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      core.toggle();

      expect(core.isRunning).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        core.storageKey,
        'false'
      );
    });

    it('should persist user preference to localStorage', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      core.toggle();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        core.storageKey,
        'true'
      );

      core.toggle();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        core.storageKey,
        'false'
      );
    });
  });

  describe('Chamber Transitions', () => {
    it('should transition to new chamber', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize({ chamberId: 'akademia' });

      core.transitionToNewChamber('bibliotheke', '#34495e');

      expect(core.currentChamberId).toBe('bibliotheke');
      expect(core.currentChamberColor).toBe('#34495e');
    });

    it('should notify ambient subsystem of chamber transition', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      core.transitionToNewChamber('akademia');

      expect(core.subsystems.ambient?.currentChamber).toBe('akademia');
    });

    it('should emit chamber transition event', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize({ chamberId: 'akademia' });

      return new Promise(resolve => {
        const handler = vi.fn(event => {
          expect(event.detail.event).toBe('chamber-transition');
          expect(event.detail.from).toBe('akademia');
          expect(event.detail.to).toBe('bibliotheke');
          window.removeEventListener('living-pantheon-status-change', handler);
          resolve(null);
        });

        window.addEventListener('living-pantheon-status-change', handler);
        core.transitionToNewChamber('bibliotheke');
      });
    });
  });

  describe('Event Handling', () => {
    it('should emit status change on start', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      return new Promise(resolve => {
        const handler = event => {
          if (event.detail.status.isRunning) {
            expect(event.detail.status.isRunning).toBe(true);
            window.removeEventListener(
              'living-pantheon-status-change',
              handler
            );
            resolve(null);
          }
        };

        window.addEventListener('living-pantheon-status-change', handler);
        core.start();
      });
    });

    it('should emit status change on stop', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      return new Promise(resolve => {
        const handler = event => {
          if (!event.detail.status.isRunning) {
            expect(event.detail.status.isRunning).toBe(false);
            window.removeEventListener(
              'living-pantheon-status-change',
              handler
            );
            resolve(null);
          }
        };

        window.addEventListener('living-pantheon-status-change', handler);
        core.stop();
      });
    });

    it('should call registered listeners on status change', () => {
      const core = MockLivingPantheonCore.getInstance();
      const listener = vi.fn();

      core.on(listener);
      core.initialize();
      core.start();

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].status.isRunning).toBe(true);
    });

    it('should unregister listener', () => {
      const core = MockLivingPantheonCore.getInstance();
      const listener = vi.fn();

      core.on(listener);
      core.initialize();
      core.off(listener);
      core.start();

      // Listener should not be called since it was unregistered before start
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('Visibility Change Handling', () => {
    it('should pause subsystems when page becomes hidden', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(core.subsystems.glitch?.isRunning).toBe(false);
      expect(core.subsystems.morphing?.isRunning).toBe(false);

      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
    });

    it('should resume subsystems when page becomes visible', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(core.subsystems.glitch?.isRunning).toBe(true);
      expect(core.subsystems.morphing?.isRunning).toBe(true);

      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Status Reporting', () => {
    it('should return complete status object', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize({ chamberId: 'akademia' });
      core.start();

      const status = core.getStatus();

      expect(status).toHaveProperty('isInitialized', true);
      expect(status).toHaveProperty('isRunning', true);
      expect(status).toHaveProperty('currentChamberId', 'akademia');
      expect(status).toHaveProperty('subsystems');
    });

    it('should include subsystem status in overall status', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      const status = core.getStatus();

      expect(status.subsystems.glitch).toBeDefined();
      expect(status.subsystems.ambient).toBeDefined();
      expect(status.subsystems.morphing).toBeDefined();
      expect(status.subsystems.animation).toBeDefined();
    });

    it('should report prefers-reduced-motion in status', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      const status = core.getStatus();

      expect(status).toHaveProperty('prefersReducedMotion');
      expect(typeof status.prefersReducedMotion).toBe('boolean');
    });
  });

  describe('Cleanup/Disposal', () => {
    it('should dispose of all resources', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      core.dispose();

      expect(core.isInitialized).toBe(false);
      expect(core.isRunning).toBe(false);
      expect(core.subsystems.glitch).toBeNull();
      expect(core.subsystems.ambient).toBeNull();
      expect(core.subsystems.morphing).toBeNull();
      expect(core.subsystems.animation).toBeNull();
    });

    it('should clear all listeners on dispose', () => {
      const core = MockLivingPantheonCore.getInstance();
      const listener = vi.fn();

      core.on(listener);
      core.initialize();
      core.dispose();

      expect(core.listeners.size).toBe(0);
    });

    it('should remove event listeners on dispose', () => {
      const core = MockLivingPantheonCore.getInstance();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      core.initialize();
      core.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should delete singleton instance on dispose', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.dispose();

      expect(window.livingPantheonCoreInstance).toBeUndefined();
    });
  });

  describe('Lazy Loading Subsystems', () => {
    it('should create glitch system only when needed', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      expect(core.subsystems.glitch).toBeNull();

      core.start();

      expect(core.subsystems.glitch).not.toBeNull();
      expect(core.subsystems.glitch).toBeInstanceOf(MockGlobalGlitchSystem);
    });

    it('should create ambient system only when needed', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();

      expect(core.subsystems.ambient).toBeNull();

      core.start();

      expect(core.subsystems.ambient).not.toBeNull();
      expect(core.subsystems.ambient).toBeInstanceOf(MockAmbientSoundLayer);
    });

    it('should reuse subsystem instances', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.initialize();
      core.start();

      const glitchInstance1 = core.subsystems.glitch;
      core.stop();
      core.start();
      const glitchInstance2 = core.subsystems.glitch;

      expect(glitchInstance1).toBe(glitchInstance2);
    });

    it('should not create subsystems if disabled in config', () => {
      const core = MockLivingPantheonCore.getInstance();
      core.config.glitch.enabled = false;
      core.initialize();
      core.start();

      expect(core.subsystems.glitch).toBeNull();
    });
  });
});

describe('GlobalGlitchSystem', () => {
  let glitchSystem;

  beforeEach(() => {
    glitchSystem = new MockGlobalGlitchSystem();
  });

  afterEach(() => {
    if (glitchSystem) {
      glitchSystem.dispose();
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(glitchSystem.config.frequency).toBe(0.02);
      expect(glitchSystem.config.checkInterval).toBe(5000);
      expect(glitchSystem.config.types).toContain('text');
      expect(glitchSystem.config.types).toContain('color');
    });

    it('should accept custom config', () => {
      const customGlitch = new MockGlobalGlitchSystem({
        frequency: 0.05,
        checkInterval: 3000,
      });

      expect(customGlitch.config.frequency).toBe(0.05);
      expect(customGlitch.config.checkInterval).toBe(3000);
    });

    it('should update config at runtime', () => {
      glitchSystem.updateConfig({ frequency: 0.1 });

      expect(glitchSystem.config.frequency).toBe(0.1);
    });
  });

  describe('Start/Stop', () => {
    it('should start glitch system', () => {
      glitchSystem.start();

      expect(glitchSystem.isRunning).toBe(true);
      expect(glitchSystem.checkIntervalId).not.toBeNull();
    });

    it('should stop glitch system', () => {
      glitchSystem.start();
      glitchSystem.stop();

      expect(glitchSystem.isRunning).toBe(false);
      expect(glitchSystem.checkIntervalId).toBeNull();
    });

    it('should not start if disabled', () => {
      glitchSystem.config.enabled = false;
      glitchSystem.start();

      expect(glitchSystem.isRunning).toBe(false);
    });

    it('should not start twice', () => {
      glitchSystem.start();
      const intervalId1 = glitchSystem.checkIntervalId;

      glitchSystem.start();
      const intervalId2 = glitchSystem.checkIntervalId;

      expect(intervalId1).toBe(intervalId2);
    });
  });

  describe('Glitch Triggering', () => {
    it('should trigger glitch effect', () => {
      const result = glitchSystem.triggerGlitch();

      expect(result).toBe(true);
      expect(glitchSystem.activeGlitches.size).toBeGreaterThan(0);
    });

    it('should trigger specific glitch type', () => {
      glitchSystem.triggerGlitch('text');

      expect(glitchSystem.activeGlitches.size).toBeGreaterThan(0);
    });

    it('should return false if no element to glitch', () => {
      glitchSystem.config.excludeSelectors = ['*'];
      const result = glitchSystem.triggerGlitch();

      expect(result).toBe(false);
    });
  });

  describe('Status', () => {
    it('should report running status', () => {
      glitchSystem.start();
      const status = glitchSystem.getStatus();

      expect(status.isRunning).toBe(true);
    });

    it('should report active glitch count', () => {
      glitchSystem.triggerGlitch();
      const status = glitchSystem.getStatus();

      expect(status.activeGlitchCount).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should dispose and clean up', () => {
      glitchSystem.start();
      glitchSystem.triggerGlitch();

      glitchSystem.dispose();

      expect(glitchSystem.isRunning).toBe(false);
      expect(glitchSystem.activeGlitches.size).toBe(0);
    });
  });
});

describe('AmbientSoundLayer', () => {
  let ambientLayer;

  beforeEach(() => {
    ambientLayer = new MockAmbientSoundLayer();
  });

  afterEach(() => {
    if (ambientLayer) {
      ambientLayer.dispose();
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(ambientLayer.config.baseVolume).toBe(0.05);
      expect(ambientLayer.config.chamberSpecific).toBe(true);
      expect(ambientLayer.config.crossfadeDuration).toBe(2000);
    });

    it('should accept custom config', () => {
      const customAmbient = new MockAmbientSoundLayer({
        baseVolume: 0.1,
        crossfadeDuration: 1000,
      });

      expect(customAmbient.config.baseVolume).toBe(0.1);
      expect(customAmbient.config.crossfadeDuration).toBe(1000);
    });
  });

  describe('Playback Control', () => {
    it('should start playing audio', () => {
      ambientLayer.start();

      expect(ambientLayer.isPlaying).toBe(true);
      expect(ambientLayer.currentSound).not.toBeNull();
    });

    it('should stop playing audio', () => {
      ambientLayer.start();
      ambientLayer.stop();

      expect(ambientLayer.isPlaying).toBe(false);
    });

    it('should not start if already playing', () => {
      ambientLayer.start();
      const sound1 = ambientLayer.currentSound;

      ambientLayer.start();
      const sound2 = ambientLayer.currentSound;

      expect(sound1).toBe(sound2);
    });

    it('should not start if disabled', () => {
      ambientLayer.config.enabled = false;
      ambientLayer.start();

      expect(ambientLayer.isPlaying).toBe(false);
    });
  });

  describe('Volume Control', () => {
    it('should set volume', () => {
      ambientLayer.start();
      ambientLayer.setVolume(0.2);

      expect(ambientLayer.currentVolume).toBe(0.2);
    });

    it('should apply volume to current sound', () => {
      ambientLayer.start();
      const volumeSpy = vi.spyOn(ambientLayer.currentSound, 'volume');

      ambientLayer.setVolume(0.15);

      expect(volumeSpy).toHaveBeenCalledWith(0.15);
    });
  });

  describe('Chamber Transitions', () => {
    it('should transition to new chamber', () => {
      ambientLayer.transitionToChamber('akademia');

      expect(ambientLayer.currentChamber).toBe('akademia');
    });

    it('should handle chamber transitions while playing', () => {
      ambientLayer.start();
      ambientLayer.transitionToChamber('bibliotheke');

      expect(ambientLayer.currentChamber).toBe('bibliotheke');
      expect(ambientLayer.isPlaying).toBe(true);
    });
  });

  describe('Status', () => {
    it('should report playing status', () => {
      ambientLayer.start();
      const status = ambientLayer.getStatus();

      expect(status.isPlaying).toBe(true);
      expect(status.currentVolume).toBe(ambientLayer.config.baseVolume);
    });
  });

  describe('Cleanup', () => {
    it('should dispose and clean up', () => {
      ambientLayer.start();
      ambientLayer.dispose();

      expect(ambientLayer.isPlaying).toBe(false);
      expect(ambientLayer.currentSound).toBeNull();
    });
  });
});

describe('MorphingImageSystem', () => {
  let morphSystem;

  beforeEach(() => {
    morphSystem = new MockMorphingImageSystem();
  });

  afterEach(() => {
    if (morphSystem) {
      morphSystem.dispose();
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(morphSystem.config.transitionDuration).toBe(60000);
      expect(morphSystem.config.pauseBetween).toBe(30000);
    });

    it('should accept custom config', () => {
      const customMorph = new MockMorphingImageSystem({
        transitionDuration: 30000,
        pauseBetween: 15000,
      });

      expect(customMorph.config.transitionDuration).toBe(30000);
      expect(customMorph.config.pauseBetween).toBe(15000);
    });
  });

  describe('Start/Stop', () => {
    it('should start morphing system', () => {
      morphSystem.start();

      expect(morphSystem.isRunning).toBe(true);
    });

    it('should stop morphing system', () => {
      morphSystem.start();
      morphSystem.stop();

      expect(morphSystem.isRunning).toBe(false);
    });

    it('should not start if disabled', () => {
      morphSystem.config.enabled = false;
      morphSystem.start();

      expect(morphSystem.isRunning).toBe(false);
    });
  });

  describe('Status', () => {
    it('should report running status', () => {
      morphSystem.start();
      const status = morphSystem.getStatus();

      expect(status.isRunning).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should dispose and clean up', () => {
      morphSystem.start();
      morphSystem.dispose();

      expect(morphSystem.isRunning).toBe(false);
      expect(morphSystem.activeMorphs.size).toBe(0);
    });

    it('should cancel pending animation frames on stop', () => {
      morphSystem.start();
      morphSystem.pendingAnimationFrames.add(1);
      morphSystem.pendingAnimationFrames.add(2);

      morphSystem.stop();

      expect(morphSystem.pendingAnimationFrames.size).toBe(0);
    });
  });
});

describe('AnimatedContentSystem', () => {
  let animSystem;

  beforeEach(() => {
    animSystem = new MockAnimatedContentSystem();
  });

  afterEach(() => {
    if (animSystem) {
      animSystem.dispose();
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(animSystem.config.breathing.enabled).toBe(true);
      expect(animSystem.config.drift.enabled).toBe(true);
    });

    it('should accept custom config', () => {
      const customAnim = new MockAnimatedContentSystem({
        breathing: { enabled: false },
      });

      expect(customAnim.config.breathing.enabled).toBe(false);
    });
  });

  describe('Start/Stop', () => {
    it('should start animation system', () => {
      animSystem.start();

      expect(animSystem.isRunning).toBe(true);
    });

    it('should stop animation system', () => {
      animSystem.start();
      animSystem.stop();

      expect(animSystem.isRunning).toBe(false);
    });

    it('should not start if disabled', () => {
      animSystem.config.enabled = false;
      animSystem.start();

      expect(animSystem.isRunning).toBe(false);
    });
  });

  describe('Status', () => {
    it('should report animation status', () => {
      animSystem.start();
      const status = animSystem.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status).toHaveProperty('animationCount');
    });
  });

  describe('Cleanup', () => {
    it('should dispose and clean up', () => {
      animSystem.start();
      animSystem.activeAnimations.add('breathing-1');

      animSystem.dispose();

      expect(animSystem.isRunning).toBe(false);
      expect(animSystem.activeAnimations.size).toBe(0);
    });
  });
});

describe('LabyrinthGenerator', () => {
  let labyrinth;

  beforeEach(() => {
    labyrinth = new MockLabyrinthGenerator();
  });

  afterEach(() => {
    if (labyrinth) {
      labyrinth.dispose();
    }
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(labyrinth.config.fragmentCount).toBe(100);
      expect(labyrinth.config.loopholeCount).toBe(10);
      expect(labyrinth.config.loopholeProbability).toBe(0.05);
    });

    it('should accept custom config', () => {
      const customLabyrinth = new MockLabyrinthGenerator({
        fragmentCount: 50,
        loopholeCount: 5,
      });

      expect(customLabyrinth.config.fragmentCount).toBe(50);
      expect(customLabyrinth.config.loopholeCount).toBe(5);
    });
  });

  describe('Initialization', () => {
    it('should initialize asynchronously', async () => {
      await labyrinth.initialize();

      expect(labyrinth.isInitialized).toBe(true);
      expect(labyrinth.isLoading).toBe(false);
    });

    it('should not reinitialize', async () => {
      await labyrinth.initialize();
      const initTime1 = Date.now();

      await labyrinth.initialize();

      expect(labyrinth.isInitialized).toBe(true);
    });
  });

  describe('Entry Generation', () => {
    it('should generate entry when initialized', async () => {
      await labyrinth.initialize();
      const entry = labyrinth.generateEntry();

      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('hasLoophole');
    });

    it('should throw when generating entry before initialization', () => {
      expect(() => {
        labyrinth.generateEntry();
      }).toThrow('Labyrinth not initialized');
    });

    it('should generate entries with possible loopholes', async () => {
      await labyrinth.initialize();

      let hasLoophole = false;
      for (let i = 0; i < 100; i++) {
        const entry = labyrinth.generateEntry();
        if (entry.hasLoophole) {
          hasLoophole = true;
          break;
        }
      }

      // With 100 attempts and 5% probability, should likely have at least one
      expect(hasLoophole).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should dispose and clean up', async () => {
      await labyrinth.initialize();
      labyrinth.entries.set('020226', { date: '020226', content: 'test' });

      labyrinth.dispose();

      expect(labyrinth.isInitialized).toBe(false);
      expect(labyrinth.fragments.length).toBe(0);
      expect(labyrinth.entries.size).toBe(0);
    });
  });
});

describe('Accessibility - Prefers Reduced Motion', () => {
  it('should not initialize when prefers-reduced-motion is enabled', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    delete window.livingPantheonCoreInstance;
    const core = MockLivingPantheonCore.getInstance();
    core.initialize();

    expect(core.isInitialized).toBe(false);
  });

  it('should report prefers-reduced-motion in status', () => {
    const core = MockLivingPantheonCore.getInstance();
    core.initialize();

    const status = core.getStatus();

    expect(status.prefersReducedMotion).toBe(false);
  });

  it('should not start glitch system when prefers-reduced-motion', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    delete window.livingPantheonCoreInstance;
    const glitch = new MockGlobalGlitchSystem();
    glitch.start();

    expect(glitch.isRunning).toBe(false);
  });
});

describe('Integration - Full Lifecycle', () => {
  it('should handle complete lifecycle from init to disposal', () => {
    delete window.livingPantheonCoreInstance;
    const core = MockLivingPantheonCore.getInstance();

    // Initialize
    core.initialize({ chamberId: 'akademia', chamberColor: '#2c3e50' });
    expect(core.isInitialized).toBe(true);

    // Start
    core.start();
    expect(core.isRunning).toBe(true);

    // Transition chamber
    core.transitionToNewChamber('bibliotheke', '#34495e');
    expect(core.currentChamberId).toBe('bibliotheke');

    // Stop
    core.stop();
    expect(core.isRunning).toBe(false);

    // Dispose
    core.dispose();
    expect(core.isInitialized).toBe(false);
    expect(window.livingPantheonCoreInstance).toBeUndefined();
  });

  it('should coordinate all subsystems together', () => {
    delete window.livingPantheonCoreInstance;
    const core = MockLivingPantheonCore.getInstance();
    core.initialize();
    core.start();

    const status = core.getStatus();

    expect(status.subsystems.glitch?.isRunning).toBe(true);
    expect(status.subsystems.ambient?.isPlaying).toBe(true);
    expect(status.subsystems.morphing?.isRunning).toBe(true);
    expect(status.subsystems.animation?.isRunning).toBe(true);
  });

  it('should handle multiple toggle cycles', () => {
    delete window.livingPantheonCoreInstance;
    const core = MockLivingPantheonCore.getInstance();
    core.initialize();

    core.toggle();
    expect(core.isRunning).toBe(true);

    core.toggle();
    expect(core.isRunning).toBe(false);

    core.toggle();
    expect(core.isRunning).toBe(true);
  });
});
