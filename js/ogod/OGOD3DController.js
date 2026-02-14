/**
 * @file OGOD3DController.js
 * @description Controller for the OGOD 3D immersive experience page.
 * Extracted from pageData.js for cleaner separation of concerns.
 *
 * Manages track loading, audio toggle, loading UI, and cleanup
 * for the #ogod3d page section.
 *
 * @requires ETCETER4_CONFIG - Global configuration (ogodTracks)
 * @requires createOGODExperience - Factory for 3D experience instances
 * @requires Tone - Tone.js audio library
 * @requires showNewSection - SPA navigation function
 */

'use strict';

/**
 * OGOD 3D page controller
 * Encapsulates all initialization logic for the #ogod3d page
 */
class OGOD3DController {
  constructor() {
    this.state = window.ogod3dState || {
      currentTrack: 1,
      experience: null,
      audioStarted: false,
      isTransitioning: false,
    };
    window.ogod3dState = this.state;
  }

  /**
   * Initialize the 3D experience page
   * Called from pageData.js when #ogod3d is first visited
   */
  init() {
    const container = document.getElementById('ogod3d-container');
    const loadingScreen = document.getElementById('ogod3d-loading');
    const loadingBar = document.getElementById('ogod3d-loading-bar');
    const loadingText = document.getElementById('ogod3d-loading-text');

    if (!container) {
      console.warn('OGOD 3D: Container not found');
      return;
    }

    this._initTrackSelector();
    this._initAudioButton();
    this._initBackButton();
    this._loadTrack(this.state.currentTrack, container, loadingScreen, loadingBar, loadingText);
  }

  /**
   * Update loading UI elements
   * @param {HTMLElement} loadingBar - Progress bar element
   * @param {HTMLElement} loadingText - Status text element
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} text - Status message
   */
  _updateLoading(loadingBar, loadingText, progress, text) {
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  /**
   * Load a track into the 3D experience
   * @param {number} trackNum - Track number to load
   * @param {HTMLElement} container - 3D container element
   * @param {HTMLElement} loadingScreen - Loading overlay
   * @param {HTMLElement} loadingBar - Progress bar
   * @param {HTMLElement} loadingText - Status text
   */
  async _loadTrack(trackNum, container, loadingScreen, loadingBar, loadingText) {
    if (this.state.isTransitioning) {
      return;
    }

    const isInitialLoad = !this.state.experience;

    if (!isInitialLoad) {
      this.state.isTransitioning = true;
      this.state.experience.dispose();
      this.state.experience = null;
    }

    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
    this._updateLoading(loadingBar, loadingText, 10, 'Loading environment...');

    this.state.currentTrack = trackNum;

    document.querySelectorAll('.ogod3d-track-btn').forEach(btn => {
      btn.classList.toggle(
        'active',
        parseInt(btn.dataset.track) === trackNum
      );
    });

    try {
      this._updateLoading(loadingBar, loadingText, 30, 'Creating 3D scene...');
      container.innerHTML = '';

      this.state.experience = await createOGODExperience({
        container,
        trackNumber: trackNum,
      });

      this._updateLoading(loadingBar, loadingText, 70, 'Starting visuals...');
      this.state.experience.sceneManager.start();

      this._updateLoading(loadingBar, loadingText, 100, 'Ready!');

      setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
        }
        this.state.isTransitioning = false;
      }, 300);

      if (this.state.audioStarted && this.state.experience.audioEngine) {
        this.state.experience.audioEngine.start();
      }
    } catch (error) {
      console.error('OGOD 3D: Failed to load track:', error);
      this._updateLoading(loadingBar, loadingText, 100, 'Error loading track');
      this.state.isTransitioning = false;
    }
  }

  /** Initialize track selector buttons */
  _initTrackSelector() {
    const trackSelector = document.getElementById('ogod3d-track-selector');
    if (!trackSelector || trackSelector.dataset.initialized) {
      return;
    }

    trackSelector.dataset.initialized = 'true';
    const tracks = ETCETER4_CONFIG.ogodTracks;
    const romanNumerals = OGOD3DController.ROMAN_NUMERALS;

    Object.keys(tracks).forEach(num => {
      const btn = document.createElement('button');
      btn.className = `ogod3d-track-btn${
        parseInt(num) === this.state.currentTrack ? ' active' : ''
      }`;
      btn.dataset.track = num;
      btn.textContent = romanNumerals[num];
      btn.title = tracks[num].game;
      btn.onclick = () => {
        const container = document.getElementById('ogod3d-container');
        const loadingScreen = document.getElementById('ogod3d-loading');
        const loadingBar = document.getElementById('ogod3d-loading-bar');
        const loadingText = document.getElementById('ogod3d-loading-text');
        this._loadTrack(parseInt(num), container, loadingScreen, loadingBar, loadingText);
      };
      trackSelector.appendChild(btn);
    });
  }

  /** Initialize audio toggle button */
  _initAudioButton() {
    const audioBtn = document.getElementById('ogod3d-audio-btn');
    if (!audioBtn || audioBtn.dataset.initialized) {
      return;
    }

    audioBtn.dataset.initialized = 'true';
    audioBtn.onclick = async () => {
      if (!this.state.audioStarted && typeof Tone !== 'undefined') {
        await Tone.start();
        this.state.audioStarted = true;
        audioBtn.textContent = 'Audio Playing';
        audioBtn.classList.add('playing');

        if (this.state.experience?.audioEngine) {
          this.state.experience.audioEngine.start();
        }
      }
    };
  }

  /** Initialize back navigation button */
  _initBackButton() {
    const backBtn = document.getElementById('ogod3d-back-btn');
    if (!backBtn || backBtn.dataset.initialized) {
      return;
    }

    backBtn.dataset.initialized = 'true';
    backBtn.onclick = e => {
      e.preventDefault();
      if (this.state.experience) {
        this.state.experience.dispose();
        this.state.experience = null;
      }
      showNewSection(_pID.vision);
    };
  }
}

/** Roman numeral lookup table */
OGOD3DController.ROMAN_NUMERALS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX',
  'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX',
];
