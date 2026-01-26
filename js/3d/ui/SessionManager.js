/**
 * @file SessionManager.js
 * @description Session state persistence for OGOD 3D experience
 * Saves/loads settings, volumes, position to localStorage with auto-save
 */

'use strict';

/**
 * SessionManager - Manages session state persistence
 * @class
 */
class SessionManager {
  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.storageKey='ogod-session'] - localStorage key prefix
   * @param {number} [options.autoSaveInterval=5000] - Auto-save interval in ms (0 to disable)
   * @param {number} [options.debounceDelay=500] - Debounce delay for saves
   */
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'ogod-session';
    this.autoSaveInterval =
      options.autoSaveInterval !== undefined ? options.autoSaveInterval : 5000;
    this.debounceDelay = options.debounceDelay || 500;

    // State components
    this.settingsPanel = null;
    this.stemMixer = null;
    this.presetSelector = null;
    this.sceneManager = null;
    this.audioEngine = null;

    // Debounce timers
    this._saveTimer = null;
    this._autoSaveTimer = null;

    // Session state
    this._state = {
      settings: null,
      mixer: null,
      preset: null,
      position: null,
      trackNumber: null,
      timestamp: null,
    };

    // Bind methods
    this._autoSave = this._autoSave.bind(this);
  }

  /**
   * Initialize session manager and load saved state
   * @returns {Object|null} Loaded state or null if none exists
   */
  initialize() {
    // Load any existing state
    const loadedState = this.load();

    // Start auto-save if enabled
    if (this.autoSaveInterval > 0) {
      this._startAutoSave();
    }

    return loadedState;
  }

  /**
   * Set component references
   * @param {Object} components
   * @param {Object} [components.settingsPanel]
   * @param {Object} [components.stemMixer]
   * @param {Object} [components.presetSelector]
   * @param {Object} [components.sceneManager]
   * @param {Object} [components.audioEngine]
   */
  setComponents(components) {
    if (components.settingsPanel) {
      this.settingsPanel = components.settingsPanel;
    }
    if (components.stemMixer) {
      this.stemMixer = components.stemMixer;
    }
    if (components.presetSelector) {
      this.presetSelector = components.presetSelector;
    }
    if (components.sceneManager) {
      this.sceneManager = components.sceneManager;
    }
    if (components.audioEngine) {
      this.audioEngine = components.audioEngine;
    }
  }

  /**
   * Save current state to localStorage
   * @param {boolean} [immediate=false] - Skip debounce
   */
  save(immediate = false) {
    if (immediate) {
      this._performSave();
    } else {
      this._debouncedSave();
    }
  }

  /**
   * Debounced save to prevent excessive writes
   * @private
   */
  _debouncedSave() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }

    this._saveTimer = setTimeout(() => {
      this._performSave();
      this._saveTimer = null;
    }, this.debounceDelay);
  }

  /**
   * Perform the actual save operation
   * @private
   */
  _performSave() {
    try {
      // Gather state from all components
      this._state = {
        settings: this.settingsPanel?.getSettings() || null,
        mixer: this.stemMixer?.getState() || null,
        preset: this.presetSelector?.getState() || null,
        position: this._getPosition(),
        trackNumber: this.presetSelector?.currentTrack || null,
        timestamp: Date.now(),
      };

      // Save to localStorage
      const stateJson = JSON.stringify(this._state);
      localStorage.setItem(this.storageKey, stateJson);

      // Also save version for migration purposes
      localStorage.setItem(`${this.storageKey}-version`, '1');
    } catch (error) {
      console.warn('SessionManager: Failed to save state', error);
    }
  }

  /**
   * Get current camera position
   * @private
   * @returns {Object|null}
   */
  _getPosition() {
    if (!this.sceneManager) {
      return null;
    }

    const camera =
      this.sceneManager.sceneManager?.camera || this.sceneManager.camera;
    if (!camera) {
      return null;
    }

    return {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      rotationY: camera.rotation.y,
    };
  }

  /**
   * Load state from localStorage
   * @returns {Object|null} Loaded state or null
   */
  load() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) {
        return null;
      }

      this._state = JSON.parse(stateJson);

      // Check if state is too old (more than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (
        this._state.timestamp &&
        Date.now() - this._state.timestamp > maxAge
      ) {
        console.log('SessionManager: Saved state expired, clearing');
        this.clear();
        return null;
      }

      return this._state;
    } catch (error) {
      console.warn('SessionManager: Failed to load state', error);
      return null;
    }
  }

  /**
   * Apply loaded state to components
   * @param {Object} [state] - State to apply (uses loaded state if not provided)
   */
  applyState(state) {
    const stateToApply = state || this._state;
    if (!stateToApply) {
      return;
    }

    // Apply settings
    if (stateToApply.settings && this.settingsPanel) {
      this.settingsPanel.loadSettings(stateToApply.settings);
    }

    // Apply mixer state
    if (stateToApply.mixer && this.stemMixer) {
      this.stemMixer.loadState(stateToApply.mixer);
    }

    // Apply preset state
    if (stateToApply.preset && this.presetSelector) {
      this.presetSelector.loadState(stateToApply.preset);
    }

    // Apply position
    if (stateToApply.position) {
      this._applyPosition(stateToApply.position);
    }
  }

  /**
   * Apply position to camera
   * @private
   * @param {Object} position
   */
  _applyPosition(position) {
    if (!this.sceneManager || !position) {
      return;
    }

    const camera =
      this.sceneManager.sceneManager?.camera || this.sceneManager.camera;
    if (!camera) {
      return;
    }

    camera.position.set(position.x || 0, position.y || 2, position.z || 0);

    if (position.rotationY !== undefined) {
      camera.rotation.y = position.rotationY;
    }
  }

  /**
   * Clear saved state
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(`${this.storageKey}-version`);
      this._state = {
        settings: null,
        mixer: null,
        preset: null,
        position: null,
        trackNumber: null,
        timestamp: null,
      };
    } catch (error) {
      console.warn('SessionManager: Failed to clear state', error);
    }
  }

  /**
   * Reset to default values
   */
  resetToDefaults() {
    // Clear saved state
    this.clear();

    // Reset each component to defaults
    if (this.settingsPanel) {
      this.settingsPanel._resetToDefaults();
    }

    if (this.stemMixer) {
      this.stemMixer.loadState({
        masterVolume: 80,
        volumes: { drums: 100, bass: 100, vocals: 100, other: 100 },
        muted: { drums: false, bass: false, vocals: false, other: false },
        soloed: { drums: false, bass: false, vocals: false, other: false },
      });
    }

    if (this.presetSelector) {
      this.presetSelector.resetToRecommended();
    }

    // Reset position to origin
    this._applyPosition({ x: 0, y: 2, z: 0, rotationY: 0 });
  }

  /**
   * Save settings specifically
   * @param {Object} settings
   */
  saveSettings(settings) {
    this._state.settings = settings;
    this.save();
  }

  /**
   * Save mixer state specifically
   * @param {Object} mixerState
   */
  saveMixerState(mixerState) {
    this._state.mixer = mixerState;
    this.save();
  }

  /**
   * Save preset state specifically
   * @param {Object} presetState
   */
  savePresetState(presetState) {
    this._state.preset = presetState;
    this.save();
  }

  /**
   * Save position specifically
   * @param {Object} position
   */
  savePosition(position) {
    this._state.position = position;
    this.save();
  }

  /**
   * Start auto-save timer
   * @private
   */
  _startAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
    }

    this._autoSaveTimer = setInterval(this._autoSave, this.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   * @private
   */
  _stopAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }

  /**
   * Auto-save callback
   * @private
   */
  _autoSave() {
    this._performSave();
  }

  /**
   * Get the current state
   * @returns {Object}
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Get the saved track number
   * @returns {number|null}
   */
  getSavedTrackNumber() {
    return this._state.trackNumber;
  }

  /**
   * Check if there is saved state
   * @returns {boolean}
   */
  hasSavedState() {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the timestamp of last save
   * @returns {number|null}
   */
  getLastSaveTime() {
    return this._state.timestamp;
  }

  /**
   * Export state as JSON string
   * @returns {string}
   */
  exportState() {
    return JSON.stringify(this._state, null, 2);
  }

  /**
   * Import state from JSON string
   * @param {string} stateJson
   * @returns {boolean} Success
   */
  importState(stateJson) {
    try {
      const importedState = JSON.parse(stateJson);
      this._state = importedState;
      this.applyState(importedState);
      this.save(true);
      return true;
    } catch (error) {
      console.error('SessionManager: Failed to import state', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Final save before disposing
    this._performSave();

    // Stop auto-save
    this._stopAutoSave();

    // Clear timers
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }

    // Clear references
    this.settingsPanel = null;
    this.stemMixer = null;
    this.presetSelector = null;
    this.sceneManager = null;
    this.audioEngine = null;
  }
}

// Export for global scope
window.SessionManager = SessionManager;
