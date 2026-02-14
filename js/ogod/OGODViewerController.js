/**
 * @file OGODViewerController.js
 * @description Controller for the OGOD 2D Animation Viewer page.
 * Extracted from pageData.js for cleaner separation of concerns.
 *
 * Manages track loading, mode switching, keyboard controls, and cleanup
 * for the #ogod-viewer page section.
 *
 * @requires ETCETER4_CONFIG - Global configuration (ogodTracks)
 * @requires OGODAnimationEngine - 2D animation engine
 * @requires OGODAudioAdapter - Audio adapter for standalone playback
 * @requires showNewSection - SPA navigation function
 */

'use strict';

/**
 * OGOD Viewer page controller
 * Encapsulates all initialization logic for the #ogod-viewer page
 */
class OGODViewerController {
  constructor() {
    this.state = window.ogodViewerState || {
      currentTrack: 1,
      currentMode: 'enhanced',
      engine: null,
      audioAdapter: null,
    };
    window.ogodViewerState = this.state;
  }

  /**
   * Initialize the viewer page
   * Called from pageData.js when #ogod-viewer is first visited
   */
  init() {
    const container = document.getElementById('ogod-viewer-container');
    if (!container) {
      console.warn('OGOD Viewer: Container not found');
      return;
    }

    this._checkDeepLink();
    this._initTrackSelector(container);
    this._initModeSelector(container);
    this._initBackButton(container);
    this._initPauseButton(container);
    this._initFileInput(container);
    this._initKeyboardControls(container);
    this._loadTrack(this.state.currentTrack, container);
  }

  /** Check for deep link query param (?ogod=N) */
  _checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const ogodParam = params.get('ogod');
    if (ogodParam) {
      const trackNum = parseInt(ogodParam);
      if (trackNum >= 1 && trackNum <= 29) {
        this.state.currentTrack = trackNum;
      }
    }
  }

  /**
   * Update track info display
   * @param {number} trackNum - Track number
   */
  _updateTrackInfo(trackNum) {
    const tracks = ETCETER4_CONFIG.ogodTracks;
    const track = tracks[trackNum];
    const infoEl = document.getElementById('ogod-viewer-track-info');
    if (infoEl && track) {
      infoEl.textContent = `Track ${OGODViewerController.ROMAN_NUMERALS[trackNum]} \u2014 ${track.game}`;
    }
  }

  /**
   * Load a track with the current mode
   * @param {number} trackNum - Track number to load
   * @param {HTMLElement} container - Viewer container element
   */
  async _loadTrack(trackNum, container) {
    if (this.state.engine) {
      this.state.engine.dispose();
      this.state.engine = null;
    }

    this.state.currentTrack = trackNum;
    container.innerHTML = '';

    document.querySelectorAll('.ogod-viewer-track-btn').forEach(btn => {
      btn.classList.toggle(
        'active',
        parseInt(btn.dataset.track) === trackNum
      );
    });

    this._updateTrackInfo(trackNum);

    if (this.state.currentMode === '3d') {
      if (window.ogod3dState) {
        window.ogod3dState.currentTrack = trackNum;
      }
      showNewSection(_pID.ogod3d);
      return;
    }

    try {
      if (!this.state.audioAdapter) {
        this.state.audioAdapter = new OGODAudioAdapter({});
      }

      this.state.engine = new OGODAnimationEngine({
        container,
        mode: this.state.currentMode,
        trackNumber: trackNum,
        audioAdapter: this.state.audioAdapter,
      });

      const tracks = ETCETER4_CONFIG.ogodTracks;
      const trackConfig = tracks[trackNum];
      if (
        trackConfig &&
        trackConfig.palette &&
        this.state.engine.renderer &&
        this.state.engine.renderer.setPalette
      ) {
        this.state.engine.renderer.setPalette(trackConfig.palette);
      }

      await this.state.engine.initialize();
      this.state.engine.start();
    } catch (error) {
      console.error('OGOD Viewer: Failed to load track:', error);
    }
  }

  /**
   * Switch rendering mode
   * @param {string} mode - Mode name ('faithful', 'enhanced', 'generative', '3d')
   * @param {HTMLElement} container - Viewer container
   */
  _setMode(mode, container) {
    if (mode === this.state.currentMode) {
      return;
    }

    this.state.currentMode = mode;

    document.querySelectorAll('.ogod-viewer-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === '3d') {
      if (window.ogod3dState) {
        window.ogod3dState.currentTrack = this.state.currentTrack;
      }
      showNewSection(_pID.ogod3d);
      return;
    }

    if (this.state.engine) {
      this.state.engine.setMode(mode);
    } else {
      this._loadTrack(this.state.currentTrack, container);
    }
  }

  /** Initialize track selector buttons */
  _initTrackSelector(container) {
    const trackSelector = document.getElementById('ogod-viewer-track-selector');
    if (!trackSelector || trackSelector.dataset.initialized) {
      return;
    }

    trackSelector.dataset.initialized = 'true';
    const tracks = ETCETER4_CONFIG.ogodTracks;
    const romanNumerals = OGODViewerController.ROMAN_NUMERALS;

    Object.keys(tracks).forEach(num => {
      const btn = document.createElement('button');
      btn.className = `ogod3d-track-btn ogod-viewer-track-btn${parseInt(num) === this.state.currentTrack ? ' active' : ''}`;
      btn.dataset.track = num;
      btn.textContent = romanNumerals[num];
      btn.title = tracks[num].game;
      btn.onclick = () => this._loadTrack(parseInt(num), container);
      trackSelector.appendChild(btn);
    });
  }

  /** Initialize mode selector buttons */
  _initModeSelector(container) {
    const modeSelector = document.getElementById('ogod-viewer-mode-selector');
    if (!modeSelector || modeSelector.dataset.initialized) {
      return;
    }

    modeSelector.dataset.initialized = 'true';
    modeSelector.querySelectorAll('.ogod-viewer-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.state.currentMode);
      btn.onclick = () => this._setMode(btn.dataset.mode, container);
    });
  }

  /** Initialize back button */
  _initBackButton() {
    const backBtn = document.getElementById('ogod-viewer-back-btn');
    if (!backBtn || backBtn.dataset.initialized) {
      return;
    }

    backBtn.dataset.initialized = 'true';
    backBtn.onclick = e => {
      e.preventDefault();
      if (this.state.engine) {
        this.state.engine.dispose();
        this.state.engine = null;
      }
      showNewSection(_pID.vision);
    };
  }

  /** Initialize pause toggle button */
  _initPauseButton() {
    const pauseBtn = document.getElementById('ogod-viewer-pause-btn');
    if (!pauseBtn || pauseBtn.dataset.initialized) {
      return;
    }

    pauseBtn.dataset.initialized = 'true';
    pauseBtn.onclick = () => {
      if (this.state.engine) {
        this.state.engine.togglePause();
        pauseBtn.textContent = this.state.engine.isPaused ? 'Play' : 'Pause';
      }
    };
  }

  /** Initialize custom image file input */
  _initFileInput() {
    const fileInput = document.getElementById('ogod-viewer-file-input');
    if (!fileInput || fileInput.dataset.initialized) {
      return;
    }

    fileInput.dataset.initialized = 'true';
    fileInput.onchange = async e => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      const url = URL.createObjectURL(file);
      if (this.state.engine) {
        await this.state.engine.setCustomImage(url);
      }
    };
  }

  /** Initialize keyboard controls */
  _initKeyboardControls(container) {
    const pauseBtn = document.getElementById('ogod-viewer-pause-btn');

    const keyHandler = e => {
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT'
      ) {
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (this.state.engine) {
            this.state.engine.togglePause();
            if (pauseBtn) {
              pauseBtn.textContent = this.state.engine.isPaused ? 'Play' : 'Pause';
            }
          }
          break;
        case '1':
          this._setMode('faithful', container);
          break;
        case '2':
          this._setMode('enhanced', container);
          break;
        case '3':
          this._setMode('generative', container);
          break;
        case 'ArrowLeft':
          if (this.state.currentTrack > 1) {
            this._loadTrack(this.state.currentTrack - 1, container);
          }
          break;
        case 'ArrowRight':
          if (this.state.currentTrack < 29) {
            this._loadTrack(this.state.currentTrack + 1, container);
          }
          break;
      }
    };
    document.addEventListener('keydown', keyHandler);
    window._ogodViewerKeyHandler = keyHandler;
  }
}

/** Roman numeral lookup table */
OGODViewerController.ROMAN_NUMERALS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX',
  'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX',
];
