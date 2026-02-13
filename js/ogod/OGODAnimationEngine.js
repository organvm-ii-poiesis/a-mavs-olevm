/**
 * @file OGODAnimationEngine.js
 * @description Core orchestrator for the OGOD animation system.
 * Manages rendering modes (faithful/enhanced/generative), image loading,
 * frame sequencing, and lifecycle of the animation.
 */

'use strict';

/**
 * OGODAnimationEngine - Main animation orchestrator
 * @class
 */
class OGODAnimationEngine {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - DOM element to render into
   * @param {string} [options.mode='faithful'] - Render mode: 'faithful' | 'enhanced' | 'generative'
   * @param {number} [options.trackNumber] - OGOD track number (1-29)
   * @param {string} [options.imageSrc] - Direct image source (overrides track lookup)
   * @param {HTMLImageElement} [options.imageElement] - Pre-loaded image element
   * @param {Object} [options.audioAdapter] - OGODAudioAdapter instance
   */
  constructor(options = {}) {
    if (!options.container) {
      throw new Error('OGODAnimationEngine requires a container element');
    }

    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.ogodAnimation || {}
        : {};

    this.container = options.container;
    this.mode = options.mode || config.defaultMode || 'faithful';
    this.trackNumber = options.trackNumber || null;
    this.audioAdapter = options.audioAdapter || null;

    // Config
    this._config = config;
    this._faithfulConfig = config.faithful || {
      gridSize: 21,
      totalFrames: 410,
      frameInterval: 120,
    };
    this._accessibilityConfig = config.accessibility || {
      respectReducedMotion: true,
      reducedMotionFallback: 'static',
    };

    // Components
    this.imageLoader = new OGODImageLoader();
    this.sequencer = null;
    this.renderer = null;

    // State
    this._isRunning = false;
    this._isInitialized = false;
    this._intervalId = null;
    this._rafId = null;
    this._isPaused = false;

    // Canvas element
    this._canvas = null;

    // Reduced motion check
    this._prefersReducedMotion =
      this._accessibilityConfig.respectReducedMotion &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Store image source options for init
    this._imageSrc = options.imageSrc || null;
    this._imageElement = options.imageElement || null;
  }

  /**
   * Initialize the engine: load image, create renderer and sequencer
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._isInitialized) {
      return;
    }

    // Create canvas
    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;';
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute(
      'aria-label',
      this.trackNumber
        ? `OGOD Track ${this.trackNumber} animation`
        : 'OGOD animation'
    );
    this.container.appendChild(this._canvas);

    // Load image
    let image;
    if (this._imageElement) {
      image = await this.imageLoader.loadFromElement(this._imageElement);
    } else if (this._imageSrc) {
      image = await this.imageLoader.load(this._imageSrc);
    } else if (this.trackNumber) {
      image = await this.imageLoader.loadTrack(this.trackNumber);
    } else {
      throw new Error(
        'OGODAnimationEngine: No image source provided (set trackNumber, imageSrc, or imageElement)'
      );
    }

    // Create sequencer
    this.sequencer = new OGODFrameSequencer({
      gridSize: this._faithfulConfig.gridSize,
      totalFrames: this._faithfulConfig.totalFrames,
    });

    // Create renderer based on mode
    this._createRenderer();
    this.renderer.setImage(image);

    this._isInitialized = true;

    // If reduced motion, show static frame
    if (this._prefersReducedMotion) {
      this.renderer.renderStatic();
    }
  }

  /**
   * Create the appropriate renderer for the current mode
   * @private
   */
  _createRenderer() {
    // Dispose existing renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    switch (this.mode) {
      case 'enhanced':
        // WebGL renderer - Phase 2
        if (typeof OGODWebGLRenderer !== 'undefined') {
          this.renderer = new OGODWebGLRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
            config: this._config.enhanced,
            audioAdapter: this.audioAdapter,
          });
        } else {
          console.warn(
            'OGODAnimationEngine: WebGL renderer not available, falling back to faithful'
          );
          this.mode = 'faithful';
          this.renderer = new OGODCanvasRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
          });
        }
        break;

      case 'generative':
        // Generative renderer - Phase 4
        if (typeof OGODGenerativeRenderer !== 'undefined') {
          this.renderer = new OGODGenerativeRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
            config: this._config.generative,
            audioAdapter: this.audioAdapter,
          });
        } else {
          console.warn(
            'OGODAnimationEngine: Generative renderer not available, falling back to faithful'
          );
          this.mode = 'faithful';
          this.renderer = new OGODCanvasRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
          });
        }
        break;

      case 'tkol':
        // TKOL Glitch renderer - pixel sorting + WebGL post-processing
        if (typeof OGODTKOLRenderer !== 'undefined') {
          this.renderer = new OGODTKOLRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
            config: this._config.tkol,
            audioAdapter: this.audioAdapter,
          });
        } else {
          console.warn(
            'OGODAnimationEngine: TKOL renderer not available, falling back to faithful'
          );
          this.mode = 'faithful';
          this.renderer = new OGODCanvasRenderer({
            canvas: this._canvas,
            gridSize: this._faithfulConfig.gridSize,
          });
        }
        break;

      case 'faithful':
      default:
        this.renderer = new OGODCanvasRenderer({
          canvas: this._canvas,
          gridSize: this._faithfulConfig.gridSize,
        });
        break;
    }
  }

  /**
   * Start the animation
   */
  start() {
    if (!this._isInitialized) {
      console.warn(
        'OGODAnimationEngine: Not initialized. Call initialize() first.'
      );
      return;
    }

    if (this._isRunning) {
      return;
    }

    if (this._prefersReducedMotion) {
      // Don't animate - static frame already rendered
      return;
    }

    this._isRunning = true;
    this._isPaused = false;

    if (this.mode === 'faithful') {
      // Use setInterval to match original timing exactly
      this._startInterval();
    } else {
      // Use requestAnimationFrame for WebGL modes
      this._startRAF();
    }
  }

  /**
   * Stop the animation
   */
  stop() {
    this._isRunning = false;
    this._stopInterval();
    this._stopRAF();
  }

  /**
   * Pause/unpause the animation
   */
  togglePause() {
    if (this._isPaused) {
      this._isPaused = false;
      if (this._isRunning) {
        if (this.mode === 'faithful') {
          this._startInterval();
        } else {
          this._startRAF();
        }
      }
    } else {
      this._isPaused = true;
      this._stopInterval();
      this._stopRAF();
    }
  }

  /**
   * Whether the engine is currently paused
   * @returns {boolean}
   */
  get isPaused() {
    return this._isPaused;
  }

  /**
   * Whether the engine is currently running
   * @returns {boolean}
   */
  get isRunning() {
    return this._isRunning && !this._isPaused;
  }

  /**
   * Switch rendering mode
   * @param {string} newMode - 'faithful' | 'enhanced' | 'generative'
   */
  setMode(newMode) {
    if (newMode === this.mode) {
      return;
    }

    const wasRunning = this._isRunning;
    this.stop();

    this.mode = newMode;
    const image = this.imageLoader.image;

    this._createRenderer();
    if (image) {
      this.renderer.setImage(image);
    }

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Switch to a different track
   * @param {number} trackNumber - Track number (1-29)
   * @returns {Promise<void>}
   */
  async setTrack(trackNumber) {
    const wasRunning = this._isRunning;
    this.stop();

    this.trackNumber = trackNumber;
    const image = await this.imageLoader.loadTrack(trackNumber);
    this.renderer.setImage(image);
    this.sequencer.reset();

    // Update aria label
    if (this._canvas) {
      this._canvas.setAttribute(
        'aria-label',
        `OGOD Track ${trackNumber} animation`
      );
    }

    if (this._prefersReducedMotion) {
      this.renderer.renderStatic();
    } else if (wasRunning) {
      this.start();
    }
  }

  /**
   * Load a custom image (not from track config)
   * @param {string} src - Image URL/path
   * @returns {Promise<void>}
   */
  async setCustomImage(src) {
    const wasRunning = this._isRunning;
    this.stop();

    const image = await this.imageLoader.load(src);
    this.renderer.setImage(image);
    this.sequencer.reset();

    if (this._prefersReducedMotion) {
      this.renderer.renderStatic();
    } else if (wasRunning) {
      this.start();
    }
  }

  /**
   * Start setInterval-based animation (faithful mode)
   * @private
   */
  _startInterval() {
    this._stopInterval();
    const interval = this._faithfulConfig.frameInterval || 120;

    // Render the current frame immediately
    const { col, row } = this.sequencer.current;
    this.renderer.render(col, row);

    this._intervalId = setInterval(() => {
      const { col: c, row: r } = this.sequencer.advance();
      this.renderer.render(c, r);
    }, interval);
  }

  /**
   * Stop interval timer
   * @private
   */
  _stopInterval() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  /**
   * Start requestAnimationFrame-based animation (WebGL modes)
   * @private
   */
  _startRAF() {
    this._stopRAF();
    const interval = this._faithfulConfig.frameInterval || 120;
    let lastFrameTime = performance.now();

    const animate = now => {
      if (!this._isRunning || this._isPaused) {
        return;
      }

      this._rafId = requestAnimationFrame(animate);

      // Throttle frame advances to match configured interval
      const elapsed = now - lastFrameTime;
      if (elapsed >= interval) {
        lastFrameTime = now - (elapsed % interval);
        this.sequencer.advance();
      }

      // Render every animation frame for smooth shader effects
      const { col, row } = this.sequencer.current;
      this.renderer.render(col, row);
    };

    this._rafId = requestAnimationFrame(animate);
  }

  /**
   * Stop requestAnimationFrame loop
   * @private
   */
  _stopRAF() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Get the canvas element
   * @returns {HTMLCanvasElement|null}
   */
  get canvas() {
    return this._canvas;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.stop();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.imageLoader) {
      this.imageLoader.dispose();
    }

    if (this._canvas && this._canvas.parentElement) {
      this._canvas.parentElement.removeChild(this._canvas);
    }
    this._canvas = null;
    this.sequencer = null;
    this._isInitialized = false;
  }
}

window.OGODAnimationEngine = OGODAnimationEngine;
