/**
 * @file OGODSceneManager.js
 * @description Manages 3D scene for OGOD immersive environments
 * Extends SceneManager with OGOD-specific features
 * Includes audio-reactive uniform bridging for visual effects
 * Integrates spatial audio with stem zone visualization
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
   * @param {boolean} [options.audioReactive=true] - Enable audio-reactive visuals
   * @param {boolean} [options.showZoneIndicators=false] - Show visual stem zone indicators
   * @param {boolean} [options.enableWeather=true] - Enable weather effects
   * @param {boolean} [options.enableTimeLighting=true] - Enable time-of-day lighting
   * @param {boolean} [options.enableMoonEffects=true] - Enable moon phase effects
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

    // Stem zone visual indicators
    this.showZoneIndicators = options.showZoneIndicators || false;
    this.zoneIndicators = [];

    // Audio reactivity configuration
    this.audioReactive = options.audioReactive !== false;

    // Environmental effects configuration
    this.enableWeather = options.enableWeather !== false;
    this.enableTimeLighting = options.enableTimeLighting !== false;
    this.enableMoonEffects = options.enableMoonEffects !== false;

    // Cached audio uniforms for environment shaders
    this.audioUniforms = {
      uBassLevel: { value: 0 },
      uMidLevel: { value: 0 },
      uTrebleLevel: { value: 0 },
      uSubBassLevel: { value: 0 },
      uKickHit: { value: 0 },
      uSnareHit: { value: 0 },
      uBeatHit: { value: 0 },
      uEnergy: { value: 0 },
      uBPM: { value: 0 },
    };

    // Spatial audio uniforms for visualization
    this.spatialUniforms = {
      uListenerSpeed: { value: 0 },
      uReverbWet: { value: 0 },
      uWindVolume: { value: 0 },
    };

    // Bind methods
    this._onPositionUpdate = this._onPositionUpdate.bind(this);
    this._updateAudioUniforms = this._updateAudioUniforms.bind(this);
    this._updateSpatialAudio = this._updateSpatialAudio.bind(this);
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

    // Enable post-processing if configured
    this._setupPostProcessing();

    // Initialize environmental effects
    await this._setupEnvironmentalEffects();

    this.isInitialized = true;
  }

  /**
   * Set up environmental effects (weather, lighting, moon)
   * @private
   * @returns {Promise<void>}
   */
  async _setupEnvironmentalEffects() {
    // Initialize environmental effects through SceneManager
    if (
      this.sceneManager &&
      typeof this.sceneManager.initEnvironmentalEffects === 'function'
    ) {
      await this.sceneManager.initEnvironmentalEffects({
        weather: this.enableWeather,
        lighting: this.enableTimeLighting,
        moon: this.enableMoonEffects,
      });

      // Connect moon effects to HighContrast environment if applicable
      if (
        this.environment &&
        typeof this.environment.setMoonIllumination === 'function'
      ) {
        this._setupMoonEnvironmentBridge();
      }
    }
  }

  /**
   * Bridge moon effects to environment-specific features
   * @private
   */
  _setupMoonEnvironmentBridge() {
    // Subscribe to environment data updates for moon phase
    if (this.sceneManager.environmentData) {
      this.sceneManager.environmentData.onUpdate(data => {
        if (data.astronomy && this.environment?.setMoonIllumination) {
          const illumination = (data.astronomy.moonIllumination || 50) / 100;
          this.environment.setMoonIllumination(illumination);
        }
      });
    }
  }

  /**
   * Set up post-processing effects
   * @private
   */
  _setupPostProcessing() {
    const sceneManager = this.sceneManager;
    const config = this.config.postProcessing || {};

    // SSAO (order 0) - Screen-space ambient occlusion
    if (config.ssao?.enabled && typeof SSAOPass !== 'undefined') {
      const ssaoPass = new SSAOPass({
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene: sceneManager.scene,
        camera: sceneManager.camera,
        quality: config.ssao.quality || 'medium',
      });
      sceneManager.addEffect('ssao', ssaoPass, { order: 0, enabled: true });
    }

    // DOF (order 10) - Depth of field
    if (config.depthOfField?.enabled && typeof DOFPass !== 'undefined') {
      const dofPass = new DOFPass({
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene: sceneManager.scene,
        camera: sceneManager.camera,
        focusDistance: config.depthOfField.focusDistance || 10,
        aperture: config.depthOfField.aperture || 0.025,
        maxBlur: config.depthOfField.maxBlur || 1.0,
      });
      sceneManager.addEffect('dof', dofPass, { order: 10, enabled: true });
    }

    // Motion Blur (order 20)
    if (config.motionBlur?.enabled && typeof MotionBlurPass !== 'undefined') {
      const motionBlurPass = new MotionBlurPass({
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        camera: sceneManager.camera,
        intensity: config.motionBlur.intensity || 1.0,
      });
      sceneManager.addEffect('motionBlur', motionBlurPass, { order: 20, enabled: true });
    }

    // Bloom (order 30) - existing implementation
    const bloomConfig = config.bloom;
    if (bloomConfig?.enabled && sceneManager.enableBloom) {
      sceneManager.enableBloom({
        strength: bloomConfig.strength || 0.5,
        threshold: bloomConfig.threshold || 0.8,
        radius: bloomConfig.radius || 0.5,
      });
    }
  }

  /**
   * Create the environment based on archetype
   * @private
   * @returns {Promise<void>}
   */
  async _createEnvironment() {
    const { archetype, palette } = this.trackConfig;

    // Common environment options including audio uniforms
    const envOptions = {
      sceneManager: this.sceneManager,
      palette,
      audioUniforms: this.audioReactive ? this.audioUniforms : null,
    };

    // Create environment based on archetype
    switch (archetype) {
      case 'gradient-fog':
        this.environment = new GradientFogEnvironment(envOptions);
        break;

      case 'stripe-bar':
        this.environment = new StripeBarEnvironment(envOptions);
        break;

      case 'bokeh-grid':
        this.environment = new BokehGridEnvironment(envOptions);
        break;

      case 'high-contrast':
        this.environment = new HighContrastEnvironment(envOptions);
        break;

      case 'layered-colors':
        this.environment = new LayeredColorsEnvironment(envOptions);
        break;

      case 'glitch-digital':
        this.environment = new GlitchDigitalEnvironment(envOptions);
        break;

      case 'waveform':
        this.environment = new WaveformEnvironment(envOptions);
        break;

      case 'iso-grid':
        this.environment = new IsoGridEnvironment(envOptions);
        break;

      case 'mirror-maze':
        this.environment = new MirrorMazeEnvironment(envOptions);
        break;

      case 'raymarch':
        this.environment = new RaymarchEnvironment(envOptions);
        break;

      default:
        // Default to gradient fog
        this.environment = new GradientFogEnvironment(envOptions);
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
      // Mobile gesture callbacks
      onSwipeLeft: this.onSwipeLeft || null,
      onSwipeRight: this.onSwipeRight || null,
      onLongPress: this.onLongPress || null,
    });
  }

  /**
   * Set callback for left swipe gesture (next track)
   * @param {Function} callback
   */
  setSwipeLeftCallback(callback) {
    this.onSwipeLeft = callback;
    if (this.controller) {
      this.controller.onSwipeLeft = callback;
    }
  }

  /**
   * Set callback for right swipe gesture (previous track)
   * @param {Function} callback
   */
  setSwipeRightCallback(callback) {
    this.onSwipeRight = callback;
    if (this.controller) {
      this.controller.onSwipeRight = callback;
    }
  }

  /**
   * Set callback for long-press gesture (context menu)
   * @param {Function} callback
   */
  setLongPressCallback(callback) {
    this.onLongPress = callback;
    if (this.controller) {
      this.controller.onLongPress = callback;
    }
  }

  /**
   * Get the FirstPersonController instance for haptic feedback access
   * @returns {FirstPersonController|null}
   */
  getController() {
    return this.controller;
  }

  /**
   * Set up color zones for stem audio mapping
   * Syncs with audio engine spatial zones if available
   * @private
   */
  _setupColorZones() {
    const { palette } = this.trackConfig;
    const stemNames = ['drums', 'bass', 'vocals', 'other'];

    // Default cardinal positions for stems (matching audio engine defaults)
    const defaultPositions = {
      drums: { x: 0, y: 0, z: -20 }, // North
      bass: { x: 0, y: 0, z: 20 }, // South
      vocals: { x: -20, y: 0, z: 0 }, // West
      other: { x: 20, y: 0, z: 0 }, // East
    };

    // Create color zones
    this.colorZones = stemNames.map((stem, i) => ({
      color: palette[i % palette.length],
      position: defaultPositions[stem] || { x: 0, y: 0, z: 0 },
      stem,
      radius: 15,
    }));

    // Sync zones with audio engine if available
    if (this.audioEngine && this.audioEngine.setStemZones) {
      this.audioEngine.setStemZones(this.colorZones);
    }

    // Create visual zone indicators if enabled
    if (this.showZoneIndicators) {
      this._createZoneIndicators();
    }
  }

  /**
   * Create visual indicators for stem zones
   * @private
   */
  _createZoneIndicators() {
    // Clear any existing indicators
    this._clearZoneIndicators();

    for (const zone of this.colorZones) {
      // Create a semi-transparent sphere to mark the zone
      const geometry = new THREE.SphereGeometry(zone.radius * 0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: zone.color,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        zone.position.x,
        zone.position.y + 1,
        zone.position.z
      );
      sphere.name = `zone-indicator-${zone.stem}`;

      // Add a subtle glow ring around the zone
      const ringGeometry = new THREE.RingGeometry(
        zone.radius * 0.8,
        zone.radius,
        32
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: zone.color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2; // Lay flat on ground
      ring.position.set(zone.position.x, 0.1, zone.position.z);
      ring.name = `zone-ring-${zone.stem}`;

      this.sceneManager.add(sphere);
      this.sceneManager.add(ring);
      this.zoneIndicators.push(sphere, ring);
    }
  }

  /**
   * Clear visual zone indicators
   * @private
   */
  _clearZoneIndicators() {
    for (const indicator of this.zoneIndicators) {
      this.sceneManager?.remove(indicator);
      if (indicator.geometry) {
        indicator.geometry.dispose();
      }
      if (indicator.material) {
        indicator.material.dispose();
      }
    }
    this.zoneIndicators = [];
  }

  /**
   * Update zone indicator visuals based on audio levels
   * @private
   */
  _updateZoneIndicators() {
    if (!this.showZoneIndicators || !this.audioEngine) {
      return;
    }

    const stemVolumes = this.audioEngine.getStemVolumes
      ? this.audioEngine.getStemVolumes()
      : {};

    for (const indicator of this.zoneIndicators) {
      // Extract stem name from indicator name
      const match = indicator.name.match(/zone-(indicator|ring)-(\w+)/);
      if (!match) {
        continue;
      }

      const stem = match[2];
      const volume = stemVolumes[stem] || 0;
      const isIndicator = match[1] === 'indicator';

      // Pulse the indicator based on volume
      if (isIndicator) {
        const baseScale = 1.0;
        const pulseScale = baseScale + volume * 0.5;
        indicator.scale.setScalar(pulseScale);
        indicator.material.opacity = 0.3 + volume * 0.4;
      } else {
        // Ring opacity based on proximity
        indicator.material.opacity = 0.1 + volume * 0.2;
      }
    }
  }

  /**
   * Handle position updates from controller
   * Updates audio engine with listener position and stem volumes
   * @private
   * @param {THREE.Vector3} position
   */
  _onPositionUpdate(position) {
    if (!this.audioEngine) {
      return;
    }

    // Update audio engine listener position for spatial audio
    if (this.audioEngine.setListenerPosition) {
      this.audioEngine.setListenerPosition({
        x: position.x,
        y: position.y,
        z: position.z,
      });
    }

    // Update listener orientation from camera
    if (this.audioEngine.setListenerOrientation && this.sceneManager?.camera) {
      const camera = this.sceneManager.camera;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      this.audioEngine.setListenerOrientation(
        { x: forward.x, y: forward.y, z: forward.z },
        { x: 0, y: 1, z: 0 } // Up vector
      );
    }

    // Calculate stem volumes based on distance to color zones
    const stemVolumes = {};

    for (const zone of this.colorZones) {
      const dx = position.x - zone.position.x;
      const dy = position.y - zone.position.y;
      const dz = position.z - zone.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Calculate volume based on distance (inverse distance, clamped)
      // This provides a smooth blend as player approaches zones
      const volume = Math.max(0, 1 - distance / zone.radius);
      stemVolumes[zone.stem] = volume;
    }

    // Update audio engine with new volumes
    this.audioEngine.setStemVolumes(stemVolumes);
  }

  /**
   * Update spatial audio state and uniforms
   * @private
   */
  _updateSpatialAudio() {
    if (!this.audioEngine) {
      return;
    }

    // Get spatial audio state from engine
    if (this.audioEngine.getListenerSpeed) {
      this.spatialUniforms.uListenerSpeed.value =
        this.audioEngine.getListenerSpeed();
    }
    if (this.audioEngine.getCurrentReverbWet) {
      this.spatialUniforms.uReverbWet.value =
        this.audioEngine.getCurrentReverbWet();
    }
    if (this.audioEngine.getCurrentWindVolume) {
      this.spatialUniforms.uWindVolume.value =
        this.audioEngine.getCurrentWindVolume();
    }

    // Update zone indicators if visible
    this._updateZoneIndicators();
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

    // Start environmental effects
    if (this.sceneManager.startEnvironmentalEffects) {
      this.sceneManager.startEnvironmentalEffects();
    }

    // Set up audio and spatial uniform updates in the animation loop
    if (this.audioEngine) {
      this.sceneManager.onAnimate(() => {
        // Update audio-reactive uniforms
        if (this.audioReactive) {
          this._updateAudioUniforms();
        }
        // Update spatial audio uniforms and visuals
        this._updateSpatialAudio();
      });
    }
  }

  /**
   * Stop the scene
   */
  stop() {
    this.isRunning = false;
    this.controller?.disable();

    // Stop environmental effects
    if (this.sceneManager?.stopEnvironmentalEffects) {
      this.sceneManager.stopEnvironmentalEffects();
    }

    this.sceneManager?.stop();
    this.audioEngine?.stop();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    // Clean up zone indicators
    this._clearZoneIndicators();

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

  /**
   * Update audio uniforms from audio engine analysis
   * @private
   */
  _updateAudioUniforms() {
    if (!this.audioReactive || !this.audioEngine) {
      return;
    }

    // Get analysis data from audio engine
    const analysis = this.audioEngine.getAnalysisData
      ? this.audioEngine.getAnalysisData()
      : null;

    if (!analysis) {
      return;
    }

    // Update uniform values
    this.audioUniforms.uBassLevel.value = analysis.bassLevel || 0;
    this.audioUniforms.uMidLevel.value = analysis.midLevel || 0;
    this.audioUniforms.uTrebleLevel.value = analysis.trebleLevel || 0;
    this.audioUniforms.uSubBassLevel.value = analysis.subBassLevel || 0;
    this.audioUniforms.uKickHit.value = analysis.kickHit || 0;
    this.audioUniforms.uSnareHit.value = analysis.snareHit || 0;
    this.audioUniforms.uBeatHit.value = analysis.beatHit || 0;
    this.audioUniforms.uEnergy.value = analysis.energy || 0;
    this.audioUniforms.uBPM.value = analysis.bpm || 0;
  }

  /**
   * Get current audio uniforms for external use
   * @returns {Object} Audio uniform objects
   */
  getAudioUniforms() {
    return this.audioUniforms;
  }

  /**
   * Get current audio analysis data
   * @returns {Object|null} Analysis data or null if unavailable
   */
  getAudioAnalysis() {
    if (this.audioEngine && this.audioEngine.getAnalysisData) {
      return this.audioEngine.getAnalysisData();
    }
    return null;
  }

  /**
   * Set audio reactivity enabled/disabled
   * @param {boolean} enabled
   */
  setAudioReactive(enabled) {
    this.audioReactive = enabled;
    if (this.environment && this.environment.setAudioReactive) {
      this.environment.setAudioReactive(enabled);
    }
  }

  // ========================================
  // ENVIRONMENTAL EFFECTS API
  // ========================================

  /**
   * Get current environmental data
   * @returns {Object|null}
   */
  getEnvironmentData() {
    return this.sceneManager?.getEnvironmentData?.() || null;
  }

  /**
   * Get visual parameters derived from environment
   * @returns {Object|null}
   */
  getEnvironmentVisualParams() {
    return this.sceneManager?.getEnvironmentVisualParams?.() || null;
  }

  /**
   * Manually set weather for testing or overrides
   * @param {Object} weather - Weather configuration
   */
  setWeather(weather) {
    if (this.sceneManager?.weatherEffects) {
      this.sceneManager.weatherEffects.setWeather(weather);
    }
  }

  /**
   * Manually set time of day for testing or overrides
   * @param {number} hours - Hour of day (0-23)
   * @param {number} [minutes=0]
   */
  setTimeOfDay(hours, minutes = 0) {
    if (this.sceneManager?.timeLighting) {
      this.sceneManager.timeLighting.setTime(hours, minutes);
    }
  }

  /**
   * Manually set moon phase for testing or overrides
   * @param {number} phase - Moon phase 0-1 (0.5 = full moon)
   */
  setMoonPhase(phase) {
    if (this.sceneManager?.moonEffects) {
      this.sceneManager.moonEffects.setMoonPhase(phase);
    }
    // Also update environment if it has moon-reactive features
    if (this.environment?.setMoonIllumination) {
      const illumination = Math.abs(Math.sin(phase * Math.PI));
      this.environment.setMoonIllumination(illumination);
    }
  }

  /**
   * Get current weather state
   * @returns {Object|null}
   */
  getWeather() {
    return this.sceneManager?.weatherEffects?.getWeather?.() || null;
  }

  /**
   * Get current moon state
   * @returns {Object|null}
   */
  getMoonState() {
    return this.sceneManager?.moonEffects?.getMoonData?.() || null;
  }

  /**
   * Get current time period (dawn, morning, afternoon, dusk, night)
   * @returns {string|null}
   */
  getTimePeriod() {
    return this.sceneManager?.timeLighting?.getPeriod?.() || null;
  }

  /**
   * Check if it's currently night
   * @returns {boolean}
   */
  isNight() {
    return this.sceneManager?.timeLighting?.isNight?.() || false;
  }

  // =========================================================================
  // SPATIAL AUDIO VISUALIZATION API
  // =========================================================================

  /**
   * Show or hide stem zone visual indicators
   * @param {boolean} visible - Whether to show zone indicators
   */
  setZoneIndicatorsVisible(visible) {
    this.showZoneIndicators = visible;

    if (visible && this.zoneIndicators.length === 0) {
      this._createZoneIndicators();
    } else if (!visible) {
      this._clearZoneIndicators();
    }
  }

  /**
   * Get spatial audio uniforms for shader integration
   * @returns {Object} Spatial uniform objects
   */
  getSpatialUniforms() {
    return this.spatialUniforms;
  }

  /**
   * Get combined audio and spatial uniforms
   * @returns {Object} Combined uniform objects
   */
  getAllAudioUniforms() {
    return {
      ...this.audioUniforms,
      ...this.spatialUniforms,
    };
  }

  /**
   * Set stem zone positions - updates both visual zones and audio engine zones
   * @param {Array} zones - Array of zone configurations
   */
  setStemZones(zones) {
    if (!Array.isArray(zones)) {
      return;
    }

    // Update local color zones
    this.colorZones = zones.map((zone, i) => ({
      color: zone.color || this.trackConfig.palette[i % this.trackConfig.palette.length],
      position: zone.position || { x: 0, y: 0, z: 0 },
      stem: zone.stem || ['drums', 'bass', 'vocals', 'other'][i % 4],
      radius: zone.radius || 15,
    }));

    // Sync with audio engine
    if (this.audioEngine && this.audioEngine.setStemZones) {
      this.audioEngine.setStemZones(this.colorZones);
    }

    // Recreate visual indicators if visible
    if (this.showZoneIndicators) {
      this._createZoneIndicators();
    }
  }

  /**
   * Get current listener speed from audio engine
   * @returns {number} Speed in units per second
   */
  getListenerSpeed() {
    if (this.audioEngine && this.audioEngine.getListenerSpeed) {
      return this.audioEngine.getListenerSpeed();
    }
    return 0;
  }

  /**
   * Get current reverb wet level
   * @returns {number} Wet level 0-1
   */
  getReverbWet() {
    if (this.audioEngine && this.audioEngine.getCurrentReverbWet) {
      return this.audioEngine.getCurrentReverbWet();
    }
    return 0;
  }

  /**
   * Get current wind volume
   * @returns {number} Wind volume 0-1
   */
  getWindVolume() {
    if (this.audioEngine && this.audioEngine.getCurrentWindVolume) {
      return this.audioEngine.getCurrentWindVolume();
    }
    return 0;
  }

  /**
   * Configure spatial audio settings
   * @param {Object} config - Spatial audio configuration
   * @param {boolean} [config.enabled] - Enable/disable spatial audio
   * @param {boolean} [config.dopplerEnabled] - Enable/disable Doppler effect
   * @param {number} [config.dopplerIntensity] - Doppler intensity 0-1
   * @param {boolean} [config.windEnabled] - Enable/disable wind effect
   */
  configureSpatialAudio(config) {
    if (!this.audioEngine) {
      return;
    }

    if (config.enabled !== undefined && this.audioEngine.setSpatialEnabled) {
      this.audioEngine.setSpatialEnabled(config.enabled);
    }
    if (config.dopplerEnabled !== undefined && this.audioEngine.setDopplerEnabled) {
      this.audioEngine.setDopplerEnabled(config.dopplerEnabled);
    }
    if (config.dopplerIntensity !== undefined && this.audioEngine.setDopplerIntensity) {
      this.audioEngine.setDopplerIntensity(config.dopplerIntensity);
    }
    if (config.windEnabled !== undefined && this.audioEngine.setWindEnabled) {
      this.audioEngine.setWindEnabled(config.windEnabled);
    }
  }

  /**
   * Configure reverb settings
   * @param {Object} config - Reverb configuration
   * @param {number} [config.decay] - Decay time in seconds
   * @param {number} [config.minWet] - Minimum wet/dry mix
   * @param {number} [config.maxWet] - Maximum wet/dry mix
   * @param {number} [config.distanceThreshold] - Distance for max reverb
   */
  configureReverb(config) {
    if (this.audioEngine && this.audioEngine.setReverbConfig) {
      this.audioEngine.setReverbConfig(config);
    }
  }

  /**
   * Get current environment instance
   * @returns {EnvironmentBase|null}
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Get floor objects for VR teleport raycast
   * @returns {THREE.Object3D[]}
   */
  getFloorObjects() {
    const floors = [];
    if (this.environment?.floorMesh) {
      floors.push(this.environment.floorMesh);
    }
    return floors;
  }
}

// Export for global scope
window.OGODSceneManager = OGODSceneManager;
