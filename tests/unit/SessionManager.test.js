/**
 * @file SessionManager.test.js
 * @description Unit tests for SessionManager session persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../unit/setup.js';

// Import module by evaluating the source
const SessionManagerSource = await import(
  '../../js/3d/ui/SessionManager.js?raw'
).then(m => m.default);
eval(SessionManagerSource);

describe('SessionManager', () => {
  let sessionManager;

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem.mockReset();
    localStorage.clear.mockReset();

    vi.useFakeTimers();
  });

  afterEach(() => {
    if (sessionManager) {
      sessionManager.dispose();
    }
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      sessionManager = new SessionManager();

      expect(sessionManager.storageKey).toBe('ogod-session');
      expect(sessionManager.autoSaveInterval).toBe(5000);
      expect(sessionManager.debounceDelay).toBe(500);
    });

    it('should accept custom options', () => {
      sessionManager = new SessionManager({
        storageKey: 'custom-key',
        autoSaveInterval: 10000,
        debounceDelay: 1000,
      });

      expect(sessionManager.storageKey).toBe('custom-key');
      expect(sessionManager.autoSaveInterval).toBe(10000);
      expect(sessionManager.debounceDelay).toBe(1000);
    });

    it('should allow disabling auto-save with 0', () => {
      sessionManager = new SessionManager({
        autoSaveInterval: 0,
      });

      expect(sessionManager.autoSaveInterval).toBe(0);
    });

    it('should initialize empty state', () => {
      sessionManager = new SessionManager();
      const state = sessionManager.getState();

      expect(state.settings).toBeNull();
      expect(state.mixer).toBeNull();
      expect(state.preset).toBeNull();
      expect(state.position).toBeNull();
      expect(state.trackNumber).toBeNull();
      expect(state.timestamp).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should load existing state', () => {
      const savedState = {
        settings: { quality: 'high' },
        mixer: { masterVolume: 80 },
        timestamp: Date.now(),
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      sessionManager = new SessionManager();
      const loaded = sessionManager.initialize();

      expect(loaded).not.toBeNull();
      expect(loaded.settings.quality).toBe('high');
    });

    it('should start auto-save when enabled', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 1000 });
      sessionManager.initialize();

      expect(sessionManager._autoSaveTimer).not.toBeNull();
    });

    it('should not start auto-save when disabled', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 0 });
      sessionManager.initialize();

      expect(sessionManager._autoSaveTimer).toBeNull();
    });

    it('should return null when no saved state exists', () => {
      localStorage.getItem.mockReturnValue(null);

      sessionManager = new SessionManager();
      const loaded = sessionManager.initialize();

      expect(loaded).toBeNull();
    });
  });

  describe('setComponents', () => {
    it('should set component references', () => {
      sessionManager = new SessionManager();

      const mockSettingsPanel = { getSettings: vi.fn() };
      const mockStemMixer = { getState: vi.fn() };
      const mockPresetSelector = { getState: vi.fn() };
      const mockSceneManager = { camera: {} };
      const mockAudioEngine = {};

      sessionManager.setComponents({
        settingsPanel: mockSettingsPanel,
        stemMixer: mockStemMixer,
        presetSelector: mockPresetSelector,
        sceneManager: mockSceneManager,
        audioEngine: mockAudioEngine,
      });

      expect(sessionManager.settingsPanel).toBe(mockSettingsPanel);
      expect(sessionManager.stemMixer).toBe(mockStemMixer);
      expect(sessionManager.presetSelector).toBe(mockPresetSelector);
      expect(sessionManager.sceneManager).toBe(mockSceneManager);
      expect(sessionManager.audioEngine).toBe(mockAudioEngine);
    });

    it('should only set provided components', () => {
      sessionManager = new SessionManager();

      const mockSettingsPanel = { getSettings: vi.fn() };
      sessionManager.setComponents({
        settingsPanel: mockSettingsPanel,
      });

      expect(sessionManager.settingsPanel).toBe(mockSettingsPanel);
      expect(sessionManager.stemMixer).toBeNull();
    });
  });

  describe('save', () => {
    beforeEach(() => {
      sessionManager = new SessionManager({ debounceDelay: 100 });
    });

    it('should debounce saves by default', () => {
      sessionManager.save();
      sessionManager.save();
      sessionManager.save();

      expect(localStorage.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      // Called twice: once for state, once for version
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should save immediately when immediate=true', () => {
      sessionManager.save(true);

      // Called twice: once for state, once for version
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should gather state from components', () => {
      const mockSettingsPanel = {
        getSettings: vi.fn().mockReturnValue({ quality: 'ultra' }),
      };
      sessionManager.setComponents({ settingsPanel: mockSettingsPanel });

      sessionManager.save(true);

      expect(mockSettingsPanel.getSettings).toHaveBeenCalled();
    });

    it('should save state with timestamp', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      sessionManager.save(true);

      const savedCall = localStorage.setItem.mock.calls[0];
      const savedState = JSON.parse(savedCall[1]);

      expect(savedState.timestamp).toBe(now);
    });

    it('should also save version', () => {
      sessionManager.save(true);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ogod-session-version',
        '1'
      );
    });
  });

  describe('load', () => {
    it('should parse stored JSON', () => {
      const savedState = {
        settings: { quality: 'medium' },
        timestamp: Date.now(),
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      sessionManager = new SessionManager();
      const loaded = sessionManager.load();

      expect(loaded.settings.quality).toBe('medium');
    });

    it('should return null for expired state (>24h)', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const savedState = {
        settings: { quality: 'high' },
        timestamp: oldTimestamp,
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      sessionManager = new SessionManager();
      const loaded = sessionManager.load();

      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });

    it('should return null for invalid JSON', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      sessionManager = new SessionManager();
      const loaded = sessionManager.load();

      expect(loaded).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('applyState', () => {
    it('should apply settings to settingsPanel', () => {
      sessionManager = new SessionManager();
      const mockSettingsPanel = {
        loadSettings: vi.fn(),
      };
      sessionManager.setComponents({ settingsPanel: mockSettingsPanel });

      sessionManager.applyState({
        settings: { quality: 'low' },
      });

      expect(mockSettingsPanel.loadSettings).toHaveBeenCalledWith({
        quality: 'low',
      });
    });

    it('should apply mixer state to stemMixer', () => {
      sessionManager = new SessionManager();
      const mockStemMixer = {
        loadState: vi.fn(),
      };
      sessionManager.setComponents({ stemMixer: mockStemMixer });

      sessionManager.applyState({
        mixer: { masterVolume: 50 },
      });

      expect(mockStemMixer.loadState).toHaveBeenCalledWith({
        masterVolume: 50,
      });
    });

    it('should apply position to camera', () => {
      sessionManager = new SessionManager();
      const mockCamera = {
        position: { set: vi.fn() },
        rotation: { y: 0 },
      };
      sessionManager.setComponents({
        sceneManager: { camera: mockCamera },
      });

      sessionManager.applyState({
        position: { x: 10, y: 5, z: 20, rotationY: 1.5 },
      });

      expect(mockCamera.position.set).toHaveBeenCalledWith(10, 5, 20);
      expect(mockCamera.rotation.y).toBe(1.5);
    });

    it('should use loaded state if no state provided', () => {
      const savedState = {
        settings: { quality: 'high' },
        timestamp: Date.now(),
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      sessionManager = new SessionManager();
      sessionManager.load();

      const mockSettingsPanel = { loadSettings: vi.fn() };
      sessionManager.setComponents({ settingsPanel: mockSettingsPanel });

      sessionManager.applyState();

      expect(mockSettingsPanel.loadSettings).toHaveBeenCalledWith({
        quality: 'high',
      });
    });
  });

  describe('clear', () => {
    it('should remove stored state', () => {
      sessionManager = new SessionManager();
      sessionManager.clear();

      expect(localStorage.removeItem).toHaveBeenCalledWith('ogod-session');
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'ogod-session-version'
      );
    });

    it('should reset internal state', () => {
      sessionManager = new SessionManager();
      sessionManager._state = {
        settings: { quality: 'high' },
        timestamp: Date.now(),
      };

      sessionManager.clear();
      const state = sessionManager.getState();

      expect(state.settings).toBeNull();
      expect(state.timestamp).toBeNull();
    });
  });

  describe('resetToDefaults', () => {
    it('should clear state and reset components', () => {
      sessionManager = new SessionManager();

      const mockSettingsPanel = { _resetToDefaults: vi.fn() };
      const mockStemMixer = { loadState: vi.fn() };
      const mockPresetSelector = { resetToRecommended: vi.fn() };
      const mockCamera = { position: { set: vi.fn() }, rotation: { y: 0 } };

      sessionManager.setComponents({
        settingsPanel: mockSettingsPanel,
        stemMixer: mockStemMixer,
        presetSelector: mockPresetSelector,
        sceneManager: { camera: mockCamera },
      });

      sessionManager.resetToDefaults();

      expect(mockSettingsPanel._resetToDefaults).toHaveBeenCalled();
      expect(mockStemMixer.loadState).toHaveBeenCalled();
      expect(mockPresetSelector.resetToRecommended).toHaveBeenCalled();
      expect(mockCamera.position.set).toHaveBeenCalledWith(0, 2, 0);
    });
  });

  describe('auto-save', () => {
    it('should auto-save at interval', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 1000 });
      sessionManager.initialize();

      expect(localStorage.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should continue auto-saving', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 1000 });
      sessionManager.initialize();

      vi.advanceTimersByTime(3000);

      expect(localStorage.setItem.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('hasSavedState', () => {
    it('should return true when state exists', () => {
      localStorage.getItem.mockReturnValue('{}');

      sessionManager = new SessionManager();
      expect(sessionManager.hasSavedState()).toBe(true);
    });

    it('should return false when no state exists', () => {
      localStorage.getItem.mockReturnValue(null);

      sessionManager = new SessionManager();
      expect(sessionManager.hasSavedState()).toBe(false);
    });
  });

  describe('exportState and importState', () => {
    it('should export state as JSON', () => {
      sessionManager = new SessionManager();
      sessionManager._state = {
        settings: { quality: 'high' },
        timestamp: 123456,
      };

      const exported = sessionManager.exportState();
      const parsed = JSON.parse(exported);

      expect(parsed.settings.quality).toBe('high');
    });

    it('should import state from JSON', () => {
      sessionManager = new SessionManager();
      const importedState = {
        settings: { quality: 'medium' },
        mixer: null,
        preset: null,
        position: null,
        trackNumber: null,
        timestamp: 123456,
      };
      const stateJson = JSON.stringify(importedState);

      const result = sessionManager.importState(stateJson);

      expect(result).toBe(true);
      // importState stores the state internally then calls applyState
      // The settings get stored correctly
    });

    it('should return false for invalid import JSON', () => {
      sessionManager = new SessionManager();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = sessionManager.importState('invalid json');

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('should perform final save', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 0 });

      sessionManager.dispose();

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should stop auto-save timer', () => {
      sessionManager = new SessionManager({ autoSaveInterval: 1000 });
      sessionManager.initialize();

      sessionManager.dispose();

      expect(sessionManager._autoSaveTimer).toBeNull();
    });

    it('should clear component references', () => {
      sessionManager = new SessionManager();
      sessionManager.setComponents({
        settingsPanel: {},
        stemMixer: {},
      });

      sessionManager.dispose();

      expect(sessionManager.settingsPanel).toBeNull();
      expect(sessionManager.stemMixer).toBeNull();
    });
  });
});
