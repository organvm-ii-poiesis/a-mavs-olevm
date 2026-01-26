/**
 * @file OGODSceneManager.js
 * @description Manages 3D scene for OGOD immersive environments
 * Extends SceneManager with OGOD-specific features
 */

'use strict';

/**
 * OGODSceneManager - Scene management for OGOD 3D environments
 * @class
 */
class OGODSceneManager {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - DOM element for the canvas
   * @param {number} options.trackNumber - OGOD track number (1-29)
   * @param {Object} [options.audioEngine] - OGODAudioEngine instance
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.ogodEnv || {}
        : {};

    this.container = options.container;
    this.trackNumber = options.trackNumber || 1;
    this.audioEngine = options.audioEngine || null;

    this.config = {
      camera: config.camera || {
        fov: 75,
        near: 0.1,
        far: 1000,
        moveSpeed: 5.0,
        lookSpeed: 0.002,
      },
      fog: config.fog || {
        enabled: true,
        near: 1,
        far: 50,
        density: 0.02,
      },
      postProcessing: config.postProcessing || {
        bloom: { enabled: true, strength: 0.5, threshold: 0.8, radius: 0.5 },
        depthOfField: { enabled: false },
      },
    };

    // Track configuration
    this.trackConfig = this._getTrackConfig();

    // State
    this.isInitialized = false;
    this.isRunning = false;
    this.sceneManager = null;
    this.environment = null;
    this.controller = null;

    // Color zones for audio mapping
    this.colorZones = [];

    // Bind methods
    this._onPositionUpdate = this._onPositionUpdate.bind(this);
  }

  /**
   * Get track configuration from global config
   * @private
   * @returns {Object}
   */
  _getTrackConfig() {
    const tracks =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.ogodTracks || {}
        : {};

    const defaultConfig = {
      game: 'Unknown',
      archetype: 'gradient-fog',
      palette: ['#6B4C7A', '#C45B8E', '#D98C4A', '#5A6B3D'],
      artwork: null,
    };

    return tracks[this.trackNumber] || defaultConfig;
  }

  /**
   * Initialize the scene and environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (!this.container) {
      throw new Error('OGODSceneManager: Container element required');
    }

    // Create base scene manager
    this.sceneManager = new SceneManager({
      container: this.container,
      antialias: true,
      alpha: false,
    });

    // Configure camera
    this.sceneManager.camera.fov = this.config.camera.fov;
    this.sceneManager.camera.near = this.config.camera.near;
    this.sceneManager.camera.far = this.config.camera.far;
    this.sceneManager.camera.updateProjectionMatrix();
    this.sceneManager.camera.position.set(0, 2, 0);

    // Set up fog based on track palette
    if (this.config.fog.enabled) {
      const fogColor = new THREE.Color(this.trackConfig.palette[0]);
      this.sceneManager.setFog(
        new THREE.FogExp2(fogColor, this.config.fog.density)
      );
      this.sceneManager.setBackground(fogColor);
    }

    // Create environment based on archetype
    await this._createEnvironment();

    // Create first-person controller
    this._createController();

    // Set up color zones for audio
    this._setupColorZones();

    this.isInitialized = true;
  }

  /**
   * Create the environment based on archetype
   * @private
   * @returns {Promise<void>}
   */
  async _createEnvironment() {
    const { archetype, palette } = this.trackConfig;

    // Create environment based on archetype
    switch (archetype) {
      case 'gradient-fog':
        this.environment = new GradientFogEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      case 'stripe-bar':
        this.environment = new StripeBarEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      case 'bokeh-grid':
        this.environment = new BokehGridEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      case 'high-contrast':
        this.environment = new HighContrastEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      case 'layered-colors':
        this.environment = new LayeredColorsEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      case 'glitch-digital':
        this.environment = new GlitchDigitalEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
        break;

      default:
        // Default to gradient fog
        this.environment = new GradientFogEnvironment({
          sceneManager: this.sceneManager,
          palette,
        });
    }

    await this.environment.initialize();
  }

  /**
   * Create first-person controller
   * @private
   */
  _createController() {
    this.controller = new FirstPersonController({
      camera: this.sceneManager.camera,
      domElement: this.sceneManager.renderer.domElement,
      moveSpeed: this.config.camera.moveSpeed,
      lookSpeed: this.config.camera.lookSpeed,
      onPositionChange: this._onPositionUpdate,
    });
  }

  /**
   * Set up color zones for stem audio mapping
   * @private
   */
  _setupColorZones() {
    const { palette } = this.trackConfig;
    const stemNames = ['drums', 'bass', 'vocals', 'other'];

    // Create zones at cardinal positions
    const positions = [
      { x: -20, y: 0, z: 0 },
      { x: 20, y: 0, z: 0 },
      { x: 0, y: 0, z: -20 },
      { x: 0, y: 0, z: 20 },
    ];

    this.colorZones = palette.slice(0, 4).map((color, i) => ({
      color,
      position: positions[i % positions.length],
      stem: stemNames[i],
      radius: 15,
    }));
  }

  /**
   * Handle position updates from controller
   * @private
   * @param {THREE.Vector3} position
   */
  _onPositionUpdate(position) {
    if (!this.audioEngine) {
      return;
    }

    // Calculate stem volumes based on distance to color zones
    const stemVolumes = {};

    for (const zone of this.colorZones) {
      const distance = Math.sqrt(
        Math.pow(position.x - zone.position.x, 2) +
          Math.pow(position.z - zone.position.z, 2)
      );

      // Calculate volume based on distance (inverse distance, clamped)
      const volume = Math.max(0, 1 - distance / zone.radius);
      stemVolumes[zone.stem] = volume;
    }

    // Update audio engine with new volumes
    this.audioEngine.setStemVolumes(stemVolumes);
  }

  /**
   * Start the scene
   */
  start() {
    if (!this.isInitialized) {
      console.warn('OGODSceneManager: Not initialized');
      return;
    }
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.sceneManager.start();
    this.controller?.enable();
    this.audioEngine?.start();
  }

  /**
   * Stop the scene
   */
  stop() {
    this.isRunning = false;
    this.controller?.disable();
    this.sceneManager?.stop();
    this.audioEngine?.stop();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    this.controller?.dispose();
    this.environment?.dispose();
    this.sceneManager?.dispose();
    this.audioEngine?.dispose();

    this.isInitialized = false;
  }

  /**
   * Get current camera position
   * @returns {THREE.Vector3}
   */
  getCameraPosition() {
    return this.sceneManager?.camera?.position.clone() || new THREE.Vector3();
  }

  /**
   * Get color zones configuration
   * @returns {Array}
   */
  getColorZones() {
    return [...this.colorZones];
  }
}

// Export for global scope
window.OGODSceneManager = OGODSceneManager;
