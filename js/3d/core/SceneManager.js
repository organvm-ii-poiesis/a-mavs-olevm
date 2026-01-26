/**
 * @file SceneManager.js
 * @description Core Three.js scene lifecycle management for ETCETER4
 * Handles renderer, scene, camera, post-processing, frustum culling, and adaptive quality
 *
 * Performance Features:
 * - Frustum culling with spatial grouping
 * - Adaptive quality based on FPS monitoring
 * - Object update skipping for off-screen objects
 * - Draw call and triangle count tracking
 * - Battery/thermal management for mobile devices
 * - Tab visibility handling to reduce power when hidden
 * - requestIdleCallback for non-critical updates
 */

'use strict';

/**
 * SceneManager - Manages Three.js scene lifecycle
 * @class
 */
class SceneManager {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - DOM element to render into
   * @param {boolean} [options.antialias=true] - Enable antialiasing
   * @param {boolean} [options.alpha=true] - Enable transparent background
   * @param {number} [options.pixelRatio] - Device pixel ratio (defaults to device)
   * @param {boolean} [options.enableFrustumCulling=true] - Enable frustum culling optimization
   * @param {boolean} [options.enableAdaptiveQuality=true] - Enable adaptive quality
   * @param {string} [options.initialQuality] - Initial quality preset name
   * @param {boolean} [options.enablePowerManagement=true] - Enable battery/visibility management
   */
  constructor(options = {}) {
    const {
      container,
      antialias = true,
      alpha = true,
      pixelRatio = Math.min(window.devicePixelRatio, 2),
      enableFrustumCulling = true,
      enableAdaptiveQuality = true,
      initialQuality = null,
      enablePowerManagement = true,
    } = options;

    if (!container) {
      throw new Error('SceneManager requires a container element');
    }

    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.animationCallbacks = [];
    this.idleCallbacks = [];

    // Store initial options for quality changes
    this._initialAntialias = antialias;
    this._initialPixelRatio = pixelRatio;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias,
      alpha,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();

    // Create default camera (can be overridden)
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Post-processing
    this.composer = null;
    this.bloomPass = null;
    this.usePostProcessing = false;

    // Effect chain management
    this.effects = new Map(); // Map<name, { pass, enabled, order }>
    this.effectOrder = []; // Array of effect names in render order
    this.renderPass = null; // Base render pass

    // Environmental effects integration
    this.environmentData = null;
    this.weatherEffects = null;
    this.timeLighting = null;
    this.moonEffects = null;

    // ========================================
    // FRUSTUM CULLING SYSTEM
    // ========================================
    this.enableFrustumCulling = enableFrustumCulling;
    this._frustum = new THREE.Frustum();
    this._projScreenMatrix = new THREE.Matrix4();
    this._boundingSphere = new THREE.Sphere();
    this._boundingBox = new THREE.Box3();

    // Spatial regions for grouped culling
    this._spatialRegions = new Map();
    this._regionSize = 20; // World units per region

    // Culling statistics
    this.cullingStats = {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      regionsChecked: 0,
      regionsCulled: 0,
    };

    // Objects registered for culling updates
    this._cullableObjects = new Set();

    // ========================================
    // ADAPTIVE QUALITY SYSTEM
    // ========================================
    this.enableAdaptiveQuality = enableAdaptiveQuality;

    // Detect initial quality if not provided
    const detectedQuality =
      typeof detectRecommendedQuality === 'function'
        ? detectRecommendedQuality()
        : 'high';
    this._currentQualityLevel = initialQuality || detectedQuality;
    this._currentQualityPreset =
      typeof getQualityPreset === 'function'
        ? getQualityPreset(this._currentQualityLevel)
        : null;

    // FPS monitoring
    this._fpsHistory = [];
    this._frameTimestamps = [];
    this._lastQualityChangeTime = 0;
    this._qualityIncreaseCount = 0;

    // Performance stats
    this.performanceStats = {
      fps: 60,
      avgFps: 60,
      minFps: 60,
      maxFps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      qualityLevel: this._currentQualityLevel,
    };

    // ========================================
    // POWER MANAGEMENT SYSTEM
    // ========================================
    this.enablePowerManagement = enablePowerManagement;
    this.isTabVisible = true;
    this.batteryLevel = 1;
    this.isCharging = true;
    this.lowBatteryThreshold = 0.2; // 20%
    this.frameSkipCount = 0;
    this.targetFrameRate = 60;
    this.reducedFrameRate = 30;
    this.particleThrottleFactor = 1;
    this._lastFrameTime = 0;
    this._frameInterval = 1000 / 60;

    // Bind methods
    this._animate = this._animate.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onBatteryChange = this._onBatteryChange.bind(this);

    // Set up resize listener
    window.addEventListener('resize', this._onResize);

    // Set up power management if enabled
    if (this.enablePowerManagement) {
      this._initPowerManagement();
    }

    // Apply initial quality
    if (this._currentQualityPreset) {
      this._applyQualityPreset(this._currentQualityPreset);
    }
  }

  /**
   * Enable post-processing with bloom effect
   * @param {Object} options - Bloom options
   * @param {number} [options.strength=0.5] - Bloom strength
   * @param {number} [options.threshold=0.8] - Brightness threshold
   * @param {number} [options.radius=0.5] - Bloom radius
   */
  enableBloom(options = {}) {
    if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) {
      console.warn('SceneManager: Post-processing classes not available');
      return;
    }

    const { strength = 0.5, threshold = 0.8, radius = 0.5 } = options;

    // Create composer
    this.composer = new THREE.EffectComposer(this.renderer);

    // Add render pass
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Add bloom pass
    const resolution = new THREE.Vector2(this.width, this.height);
    this.bloomPass = new THREE.UnrealBloomPass(
      resolution,
      strength,
      radius,
      threshold
    );
    this.composer.addPass(this.bloomPass);

    this.usePostProcessing = true;
  }

  /**
   * Disable post-processing
   */
  disableBloom() {
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloomPass = null;
    }
    this.usePostProcessing = false;
  }

  /**
   * Set bloom parameters
   * @param {Object} params
   */
  setBloomParams(params = {}) {
    if (!this.bloomPass) {
      return;
    }

    if (params.strength !== undefined) {
      this.bloomPass.strength = params.strength;
    }
    if (params.threshold !== undefined) {
      this.bloomPass.threshold = params.threshold;
    }
    if (params.radius !== undefined) {
      this.bloomPass.radius = params.radius;
    }
  }

  // ========================================
  // EFFECT CHAIN MANAGEMENT
  // ========================================

  /**
   * Initialize the effect composer with a render pass
   * Call this before adding any effects
   */
  initEffectComposer() {
    if (!THREE.EffectComposer || !THREE.RenderPass) {
      console.warn('SceneManager: EffectComposer or RenderPass not available');
      return false;
    }

    // Create composer if not exists
    if (!this.composer) {
      this.composer = new THREE.EffectComposer(this.renderer);
    }

    // Create render pass if not exists
    if (!this.renderPass) {
      this.renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);
    }

    this.usePostProcessing = true;
    return true;
  }

  /**
   * Add an effect to the chain
   * @param {string} name - Unique name for the effect
   * @param {Object} pass - Effect pass instance (DOFPass, MotionBlurPass, SSAOPass, etc.)
   * @param {Object} [options] - Effect options
   * @param {boolean} [options.enabled=true] - Whether effect is enabled
   * @param {number} [options.order] - Order in the chain (lower = earlier)
   * @returns {boolean} Success
   */
  addEffect(name, pass, options = {}) {
    if (!this.initEffectComposer()) {
      return false;
    }

    const { enabled = true, order = this.effects.size } = options;

    // Store effect data
    this.effects.set(name, {
      pass,
      enabled,
      order,
    });

    // Rebuild effect chain
    this._rebuildEffectChain();

    return true;
  }

  /**
   * Remove an effect from the chain
   * @param {string} name - Effect name
   * @returns {boolean} Success
   */
  removeEffect(name) {
    const effectData = this.effects.get(name);
    if (!effectData) {
      console.warn(`SceneManager: Effect '${name}' not found`);
      return false;
    }

    // Dispose the pass
    if (effectData.pass && typeof effectData.pass.dispose === 'function') {
      effectData.pass.dispose();
    }

    this.effects.delete(name);

    // Rebuild effect chain
    this._rebuildEffectChain();

    return true;
  }

  /**
   * Enable an effect by name
   * @param {string} name - Effect name
   * @returns {boolean} Success
   */
  enableEffect(name) {
    const effectData = this.effects.get(name);
    if (!effectData) {
      console.warn(`SceneManager: Effect '${name}' not found`);
      return false;
    }

    effectData.enabled = true;
    if (effectData.pass) {
      effectData.pass.enabled = true;
    }

    return true;
  }

  /**
   * Disable an effect by name
   * @param {string} name - Effect name
   * @returns {boolean} Success
   */
  disableEffect(name) {
    const effectData = this.effects.get(name);
    if (!effectData) {
      console.warn(`SceneManager: Effect '${name}' not found`);
      return false;
    }

    effectData.enabled = false;
    if (effectData.pass) {
      effectData.pass.enabled = false;
    }

    return true;
  }

  /**
   * Check if an effect is enabled
   * @param {string} name - Effect name
   * @returns {boolean} Whether the effect is enabled
   */
  isEffectEnabled(name) {
    const effectData = this.effects.get(name);
    return effectData ? effectData.enabled : false;
  }

  /**
   * Set the order of effects in the chain
   * @param {Array<string>} orderArray - Array of effect names in desired order
   */
  setEffectOrder(orderArray) {
    let order = 0;
    for (const name of orderArray) {
      const effectData = this.effects.get(name);
      if (effectData) {
        effectData.order = order++;
      }
    }

    // Rebuild effect chain with new order
    this._rebuildEffectChain();
  }

  /**
   * Get effect parameters
   * @param {string} name - Effect name
   * @returns {Object|null} Effect parameters or null if not found
   */
  getEffectParams(name) {
    const effectData = this.effects.get(name);
    if (!effectData || !effectData.pass) {
      return null;
    }

    // Check if pass has getParams method
    if (typeof effectData.pass.getParams === 'function') {
      return effectData.pass.getParams();
    }

    // Fallback: return common parameters
    return {
      enabled: effectData.enabled,
    };
  }

  /**
   * Set effect parameters
   * @param {string} name - Effect name
   * @param {Object} params - Parameters to set
   * @returns {boolean} Success
   */
  setEffectParams(name, params) {
    const effectData = this.effects.get(name);
    if (!effectData || !effectData.pass) {
      console.warn(`SceneManager: Effect '${name}' not found`);
      return false;
    }

    // Check if pass has setParams method
    if (typeof effectData.pass.setParams === 'function') {
      effectData.pass.setParams(params);
      return true;
    }

    // Fallback: try setting params directly
    for (const [key, value] of Object.entries(params)) {
      if (effectData.pass[key] !== undefined) {
        effectData.pass[key] = value;
      }
    }

    return true;
  }

  /**
   * Get all registered effect names
   * @returns {Array<string>} Array of effect names
   */
  getEffectNames() {
    return Array.from(this.effects.keys());
  }

  /**
   * Get effect instance by name
   * @param {string} name - Effect name
   * @returns {Object|null} Effect pass instance or null
   */
  getEffect(name) {
    const effectData = this.effects.get(name);
    return effectData ? effectData.pass : null;
  }

  /**
   * Rebuild the effect chain based on current order
   * @private
   */
  _rebuildEffectChain() {
    if (!this.composer) {
      return;
    }

    // Clear existing passes (except render pass)
    this.composer.passes = [];

    // Re-add render pass first
    if (this.renderPass) {
      this.composer.addPass(this.renderPass);
    }

    // Sort effects by order
    const sortedEffects = Array.from(this.effects.entries()).sort(
      (a, b) => a[1].order - b[1].order
    );

    // Update effect order array
    this.effectOrder = sortedEffects.map(([name]) => name);

    // Add effects to composer
    for (const [name, effectData] of sortedEffects) {
      if (effectData.pass) {
        this.composer.addPass(effectData.pass);
      }
    }

    // Re-add bloom pass if it exists (for backward compatibility)
    if (this.bloomPass && !this.effects.has('bloom')) {
      this.composer.addPass(this.bloomPass);
    }
  }

  /**
   * Dispose all effects and clean up the effect chain
   */
  disposeAllEffects() {
    for (const [name, effectData] of this.effects) {
      if (effectData.pass && typeof effectData.pass.dispose === 'function') {
        effectData.pass.dispose();
      }
    }

    this.effects.clear();
    this.effectOrder = [];

    // Rebuild chain (will just have render pass)
    this._rebuildEffectChain();
  }

  // ========================================
  // POWER MANAGEMENT METHODS
  // ========================================

  /**
   * Initialize power management features
   * @private
   */
  _initPowerManagement() {
    // Visibility API - reduce frame rate when tab not visible
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Battery API - lower quality on low battery
    if ('getBattery' in navigator) {
      navigator
        .getBattery()
        .then(battery => {
          this.battery = battery;
          this.batteryLevel = battery.level;
          this.isCharging = battery.charging;

          // Listen for battery changes
          battery.addEventListener('levelchange', this._onBatteryChange);
          battery.addEventListener('chargingchange', this._onBatteryChange);

          // Initial quality adjustment
          this._adjustQualityForBattery();
        })
        .catch(err => {
          console.debug('Battery API not available:', err);
        });
    }

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', e => {
        this.prefersReducedMotion = e.matches;
        if (e.matches && typeof getQualityPreset === 'function') {
          this.setQuality('low');
        }
      });
  }

  /**
   * Handle visibility change (tab switching)
   * @private
   */
  _onVisibilityChange() {
    this.isTabVisible = !document.hidden;

    if (document.hidden) {
      // Tab is hidden - reduce to minimal updates
      this.targetFrameRate = 5; // Very low frame rate when not visible
      this._frameInterval = 1000 / this.targetFrameRate;
      console.debug(
        'Tab hidden - reducing frame rate to',
        this.targetFrameRate
      );
    } else {
      // Tab is visible - restore frame rate based on battery
      this.targetFrameRate = this._shouldReduceFrameRate()
        ? this.reducedFrameRate
        : 60;
      this._frameInterval = 1000 / this.targetFrameRate;
      console.debug(
        'Tab visible - restoring frame rate to',
        this.targetFrameRate
      );
    }
  }

  /**
   * Handle battery level/charging changes
   * @private
   */
  _onBatteryChange() {
    if (!this.battery) {
      return;
    }

    this.batteryLevel = this.battery.level;
    this.isCharging = this.battery.charging;

    this._adjustQualityForBattery();
  }

  /**
   * Adjust quality settings based on battery level
   * @private
   */
  _adjustQualityForBattery() {
    if (this.isCharging) {
      // Charging - use current quality or restore to high
      if (
        this._currentQualityLevel === 'low' &&
        this.performanceStats.avgFps > 45
      ) {
        if (typeof getQualityPreset === 'function') {
          this.setQuality('medium');
        }
      }
      this.particleThrottleFactor = 1;
      return;
    }

    if (this.batteryLevel <= this.lowBatteryThreshold) {
      // Low battery - use low quality and throttle particles
      if (typeof getQualityPreset === 'function') {
        this.setQuality('low');
      }
      this.particleThrottleFactor = 0.3;
      this.targetFrameRate = this.reducedFrameRate;
      this._frameInterval = 1000 / this.targetFrameRate;
      console.debug(
        'Low battery - switching to low quality, throttling particles'
      );
    } else if (this.batteryLevel <= 0.5) {
      // Medium battery - use medium quality
      if (
        typeof getQualityPreset === 'function' &&
        (this._currentQualityLevel === 'high' ||
          this._currentQualityLevel === 'ultra')
      ) {
        this.setQuality('medium');
      }
      this.particleThrottleFactor = 0.7;
      console.debug('Medium battery - switching to medium quality');
    } else {
      // Good battery - use full quality
      this.particleThrottleFactor = 1;
    }
  }

  /**
   * Check if frame rate should be reduced
   * @private
   * @returns {boolean}
   */
  _shouldReduceFrameRate() {
    return !this.isCharging && this.batteryLevel <= this.lowBatteryThreshold;
  }

  /**
   * Get particle throttle factor (0-1) for particle system optimization
   * @returns {number}
   */
  getParticleThrottleFactor() {
    return this.particleThrottleFactor;
  }

  /**
   * Check if tab is currently visible
   * @returns {boolean}
   */
  isVisible() {
    return this.isTabVisible;
  }

  /**
   * Register an idle callback for non-critical updates
   * Uses requestIdleCallback when available
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onIdle(callback) {
    this.idleCallbacks.push(callback);
    return () => {
      const index = this.idleCallbacks.indexOf(callback);
      if (index > -1) {
        this.idleCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Schedule idle callbacks
   * @private
   */
  _scheduleIdleCallbacks() {
    if (this.idleCallbacks.length === 0) {
      return;
    }

    const runIdleCallbacks = deadline => {
      while ((deadline.timeRemaining ? deadline.timeRemaining() : 10) > 0) {
        // Run callbacks while we have idle time
        for (const callback of this.idleCallbacks) {
          if (deadline.timeRemaining && deadline.timeRemaining() <= 0) {
            break;
          }
          try {
            callback();
          } catch (e) {
            console.error('Idle callback error:', e);
          }
        }
        break; // Only run once per idle period
      }

      // Schedule next idle period if still running
      if (this.isRunning && this.idleCallbacks.length > 0) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(runIdleCallbacks, { timeout: 1000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => runIdleCallbacks({ timeRemaining: () => 16 }), 100);
        }
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runIdleCallbacks, { timeout: 1000 });
    } else {
      setTimeout(() => runIdleCallbacks({ timeRemaining: () => 16 }), 100);
    }
  }

  /**
   * Set background color or texture
   * @param {THREE.Color|THREE.Texture|string} background
   */
  setBackground(background) {
    if (typeof background === 'string') {
      this.scene.background = new THREE.Color(background);
    } else {
      this.scene.background = background;
    }
  }

  /**
   * Set fog for the scene
   * @param {THREE.Fog|THREE.FogExp2} fog
   */
  setFog(fog) {
    this.scene.fog = fog;
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Register a callback to be called each animation frame
   * @param {Function} callback - Receives (deltaTime, elapsedTime)
   * @returns {Function} Unsubscribe function
   */
  onAnimate(callback) {
    this.animationCallbacks.push(callback);
    return () => {
      const index = this.animationCallbacks.indexOf(callback);
      if (index > -1) {
        this.animationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.clock.start();
    this._animate();

    // Start idle callbacks for non-critical updates
    this._scheduleIdleCallbacks();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    this.clock.stop();
  }

  /**
   * Internal animation loop
   * @private
   */
  _animate() {
    if (!this.isRunning) {
      return;
    }

    requestAnimationFrame(this._animate);

    // Frame rate throttling for power management
    if (this.enablePowerManagement && this.targetFrameRate < 60) {
      const now = performance.now();
      const elapsed = now - this._lastFrameTime;

      if (elapsed < this._frameInterval) {
        return; // Skip this frame to maintain target frame rate
      }

      this._lastFrameTime = now - (elapsed % this._frameInterval);
    }

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Track FPS for adaptive quality
    this._trackFPS();

    // Update frustum culling
    if (this.enableFrustumCulling) {
      this._updateFrustumCulling();
    }

    // Call all animation callbacks
    for (const callback of this.animationCallbacks) {
      callback(deltaTime, elapsedTime);
    }

    // Update effect passes that need deltaTime (e.g., motion blur)
    for (const [name, effectData] of this.effects) {
      if (effectData.pass && effectData.pass._deltaTime !== undefined) {
        effectData.pass._deltaTime = deltaTime;
      }
    }

    // Render the scene (with or without post-processing)
    if (this.usePostProcessing && this.composer) {
      // Pass deltaTime to composer for effects that need it
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // Update performance stats
    this._updatePerformanceStats();

    // Check adaptive quality
    if (this.enableAdaptiveQuality) {
      this._checkAdaptiveQuality();
    }
  }

  // ========================================
  // FRUSTUM CULLING METHODS
  // ========================================

  /**
   * Register an object for frustum culling
   * @param {THREE.Object3D} object - Object to cull
   * @param {Object} [options] - Culling options
   * @param {boolean} [options.skipUpdate=false] - Skip animation updates when culled
   * @param {Function} [options.onVisibilityChange] - Callback when visibility changes
   */
  registerCullable(object, options = {}) {
    const cullData = {
      object,
      skipUpdate: options.skipUpdate || false,
      onVisibilityChange: options.onVisibilityChange || null,
      wasVisible: true,
      boundingSphere: null,
    };

    // Pre-compute bounding sphere if geometry exists
    if (object.geometry && object.geometry.boundingSphere === null) {
      object.geometry.computeBoundingSphere();
    }

    this._cullableObjects.add(cullData);

    // Register in spatial region
    this._addToSpatialRegion(object);

    return () => this.unregisterCullable(object);
  }

  /**
   * Unregister an object from frustum culling
   * @param {THREE.Object3D} object
   */
  unregisterCullable(object) {
    for (const cullData of this._cullableObjects) {
      if (cullData.object === object) {
        this._cullableObjects.delete(cullData);
        break;
      }
    }
    this._removeFromSpatialRegion(object);
  }

  /**
   * Add object to spatial region for grouped culling
   * @private
   */
  _addToSpatialRegion(object) {
    const pos = object.position;
    const regionKey = this._getRegionKey(pos.x, pos.y, pos.z);

    if (!this._spatialRegions.has(regionKey)) {
      this._spatialRegions.set(regionKey, {
        objects: new Set(),
        boundingBox: new THREE.Box3(),
        isVisible: true,
      });
    }

    const region = this._spatialRegions.get(regionKey);
    region.objects.add(object);

    // Expand region bounding box
    this._expandRegionBounds(region, object);
  }

  /**
   * Remove object from spatial region
   * @private
   */
  _removeFromSpatialRegion(object) {
    const pos = object.position;
    const regionKey = this._getRegionKey(pos.x, pos.y, pos.z);
    const region = this._spatialRegions.get(regionKey);

    if (region) {
      region.objects.delete(object);
      if (region.objects.size === 0) {
        this._spatialRegions.delete(regionKey);
      }
    }
  }

  /**
   * Get spatial region key from position
   * @private
   */
  _getRegionKey(x, y, z) {
    const rx = Math.floor(x / this._regionSize);
    const ry = Math.floor(y / this._regionSize);
    const rz = Math.floor(z / this._regionSize);
    return `${rx},${ry},${rz}`;
  }

  /**
   * Expand region bounding box to include object
   * @private
   */
  _expandRegionBounds(region, object) {
    if (object.geometry && object.geometry.boundingBox === null) {
      object.geometry.computeBoundingBox();
    }

    if (object.geometry && object.geometry.boundingBox) {
      this._boundingBox.copy(object.geometry.boundingBox);
      this._boundingBox.applyMatrix4(object.matrixWorld);
      region.boundingBox.union(this._boundingBox);
    } else {
      // For objects without geometry, use position-based bounds
      const halfSize = this._regionSize / 2;
      const pos = object.position;
      this._boundingBox.set(
        new THREE.Vector3(pos.x - halfSize, pos.y - halfSize, pos.z - halfSize),
        new THREE.Vector3(pos.x + halfSize, pos.y + halfSize, pos.z + halfSize)
      );
      region.boundingBox.union(this._boundingBox);
    }
  }

  /**
   * Update frustum culling for all registered objects
   * @private
   */
  _updateFrustumCulling() {
    // Reset stats
    this.cullingStats.totalObjects = 0;
    this.cullingStats.visibleObjects = 0;
    this.cullingStats.culledObjects = 0;
    this.cullingStats.regionsChecked = 0;
    this.cullingStats.regionsCulled = 0;

    // Update frustum from camera
    this.camera.updateMatrixWorld();
    this._projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);

    // First pass: cull entire regions
    for (const [key, region] of this._spatialRegions) {
      this.cullingStats.regionsChecked++;

      // Check if region bounding box intersects frustum
      region.isVisible = this._frustum.intersectsBox(region.boundingBox);

      if (!region.isVisible) {
        this.cullingStats.regionsCulled++;
        // Hide all objects in culled region
        for (const obj of region.objects) {
          if (obj.visible !== false) {
            obj.visible = false;
          }
        }
      }
    }

    // Second pass: individual object culling within visible regions
    for (const cullData of this._cullableObjects) {
      const object = cullData.object;
      this.cullingStats.totalObjects++;

      // Skip if in culled region
      const regionKey = this._getRegionKey(
        object.position.x,
        object.position.y,
        object.position.z
      );
      const region = this._spatialRegions.get(regionKey);

      if (region && !region.isVisible) {
        this.cullingStats.culledObjects++;
        continue;
      }

      // Perform individual frustum test
      let isVisible = true;

      if (object.geometry && object.geometry.boundingSphere) {
        this._boundingSphere.copy(object.geometry.boundingSphere);
        this._boundingSphere.applyMatrix4(object.matrixWorld);
        isVisible = this._frustum.intersectsSphere(this._boundingSphere);
      }

      // Update visibility
      if (isVisible !== cullData.wasVisible) {
        object.visible = isVisible;
        cullData.wasVisible = isVisible;

        if (cullData.onVisibilityChange) {
          cullData.onVisibilityChange(isVisible);
        }
      }

      if (isVisible) {
        this.cullingStats.visibleObjects++;
      } else {
        this.cullingStats.culledObjects++;
      }
    }
  }

  /**
   * Get frustum culling statistics
   * @returns {Object} Culling stats
   */
  getCullingStats() {
    return { ...this.cullingStats };
  }

  // ========================================
  // ADAPTIVE QUALITY METHODS
  // ========================================

  /**
   * Track FPS for adaptive quality decisions
   * @private
   */
  _trackFPS() {
    const now = performance.now();
    this._frameTimestamps.push(now);

    // Keep only last 60 frames
    while (this._frameTimestamps.length > 60) {
      this._frameTimestamps.shift();
    }

    // Calculate FPS from timestamps
    if (this._frameTimestamps.length >= 2) {
      const oldest = this._frameTimestamps[0];
      const newest = this._frameTimestamps[this._frameTimestamps.length - 1];
      const elapsed = newest - oldest;
      const fps = ((this._frameTimestamps.length - 1) / elapsed) * 1000;

      this._fpsHistory.push(fps);

      // Keep history for averaging
      const config =
        typeof AdaptiveQualityConfig !== 'undefined'
          ? AdaptiveQualityConfig
          : { sampleFrames: 60 };

      while (this._fpsHistory.length > config.sampleFrames) {
        this._fpsHistory.shift();
      }

      this.performanceStats.fps = Math.round(fps);
    }
  }

  /**
   * Update performance statistics
   * @private
   */
  _updatePerformanceStats() {
    // Calculate FPS stats
    if (this._fpsHistory.length > 0) {
      const sum = this._fpsHistory.reduce((a, b) => a + b, 0);
      this.performanceStats.avgFps = Math.round(sum / this._fpsHistory.length);
      this.performanceStats.minFps = Math.round(Math.min(...this._fpsHistory));
      this.performanceStats.maxFps = Math.round(Math.max(...this._fpsHistory));
    }

    // Get renderer info
    const info = this.renderer.info;
    this.performanceStats.drawCalls = info.render.calls;
    this.performanceStats.triangles = info.render.triangles;
    this.performanceStats.frameTime = 1000 / (this.performanceStats.fps || 60);
    this.performanceStats.qualityLevel = this._currentQualityLevel;
  }

  /**
   * Check if quality should be adjusted
   * @private
   */
  _checkAdaptiveQuality() {
    const config =
      typeof AdaptiveQualityConfig !== 'undefined'
        ? AdaptiveQualityConfig
        : null;

    if (!config || !config.enabled) {
      return;
    }

    const now = performance.now();

    // Respect cooldown period
    if (now - this._lastQualityChangeTime < config.cooldownTime) {
      return;
    }

    // Need enough samples
    if (this._fpsHistory.length < config.sampleFrames * 0.5) {
      return;
    }

    const avgFps = this.performanceStats.avgFps;
    const qualityOrder = config.qualityOrder;
    const currentIndex = qualityOrder.indexOf(this._currentQualityLevel);

    // Check for quality drop
    if (avgFps < config.lowerThreshold) {
      // Count consecutive low frames
      const lowFrames = this._fpsHistory.filter(
        fps => fps < config.lowerThreshold
      ).length;

      if (lowFrames >= config.aggressiveDropFrames && currentIndex > 0) {
        // Drop quality
        const newLevel = qualityOrder[currentIndex - 1];
        this.setQuality(newLevel);
        console.log(
          `[SceneManager] Quality dropped to ${newLevel} (avg FPS: ${avgFps})`
        );
      }
    }

    // Check for quality increase
    if (config.allowIncrease && avgFps > config.upperThreshold) {
      if (
        currentIndex < qualityOrder.length - 1 &&
        this._qualityIncreaseCount < config.maxIncreases
      ) {
        const newLevel = qualityOrder[currentIndex + 1];
        this.setQuality(newLevel);
        this._qualityIncreaseCount++;
        console.log(
          `[SceneManager] Quality increased to ${newLevel} (avg FPS: ${avgFps})`
        );
      }
    }
  }

  /**
   * Set quality preset
   * @param {string} level - Quality level name (low, medium, high, ultra)
   */
  setQuality(level) {
    if (typeof getQualityPreset !== 'function') {
      console.warn('SceneManager: QualityConfig not loaded');
      return;
    }

    const preset = getQualityPreset(level);
    if (!preset) {
      console.warn(`SceneManager: Unknown quality level '${level}'`);
      return;
    }

    this._currentQualityLevel = level;
    this._currentQualityPreset = preset;
    this._lastQualityChangeTime = performance.now();
    this._fpsHistory = []; // Reset FPS history

    this._applyQualityPreset(preset);
  }

  /**
   * Apply quality preset settings
   * @private
   */
  _applyQualityPreset(preset) {
    // Update resolution scale
    const targetPixelRatio = Math.min(
      this._initialPixelRatio * preset.resolutionScale,
      preset.maxPixelRatio
    );
    this.renderer.setPixelRatio(targetPixelRatio);

    // Update post-processing
    if (preset.postProcessing.enabled && this.bloomPass) {
      this.setBloomParams({
        strength: preset.postProcessing.bloomStrength,
        radius: preset.postProcessing.bloomRadius,
        threshold: preset.postProcessing.bloomThreshold,
      });
    } else if (!preset.postProcessing.enabled && this.usePostProcessing) {
      // Could disable bloom, but that might be jarring
      // Instead, just reduce intensity
      if (this.bloomPass) {
        this.bloomPass.strength = 0;
      }
    }

    // Dispatch quality change event for other systems to respond
    const event = new CustomEvent('qualitychange', {
      detail: {
        level: this._currentQualityLevel,
        preset,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current quality preset
   * @returns {Object} Current quality configuration
   */
  getQualityPreset() {
    return this._currentQualityPreset;
  }

  /**
   * Get current quality level name
   * @returns {string} Quality level name
   */
  getQualityLevel() {
    return this._currentQualityLevel;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  /**
   * Handle window resize
   * @private
   */
  _onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);

    // Resize composer if using post-processing
    if (this.composer) {
      this.composer.setSize(this.width, this.height);
    }

    // Resize all registered effects
    for (const [name, effectData] of this.effects) {
      if (effectData.pass && typeof effectData.pass.setSize === 'function') {
        effectData.pass.setSize(this.width, this.height);
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);

    // Clean up power management listeners
    if (this.enablePowerManagement) {
      document.removeEventListener(
        'visibilitychange',
        this._onVisibilityChange
      );
      if (this.battery) {
        this.battery.removeEventListener('levelchange', this._onBatteryChange);
        this.battery.removeEventListener(
          'chargingchange',
          this._onBatteryChange
        );
      }
    }

    // Dispose environmental effects
    this.disposeEnvironmentalEffects();

    // Dispose all registered effects
    this.disposeAllEffects();

    // Dispose post-processing
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloomPass = null;
      this.renderPass = null;
    }

    // Clear culling data
    this._cullableObjects.clear();
    this._spatialRegions.clear();

    // Clear FPS history
    this._fpsHistory = [];
    this._frameTimestamps = [];

    // Clear idle callbacks
    this.idleCallbacks = [];

    // Dispose of scene objects
    this.scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();

    // Remove canvas from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }

    this.animationCallbacks = [];
  }

  // ========================================
  // ENVIRONMENTAL EFFECTS INTEGRATION
  // ========================================

  /**
   * Initialize environmental effects (weather, time-of-day lighting, moon)
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.weather=true] - Enable weather effects
   * @param {boolean} [options.lighting=true] - Enable time-of-day lighting
   * @param {boolean} [options.moon=true] - Enable moon phase effects
   * @returns {Promise<void>}
   */
  async initEnvironmentalEffects(options = {}) {
    const { weather = true, lighting = true, moon = true } = options;

    // Create shared environment data provider
    if (!this.environmentData && typeof EnvironmentData !== 'undefined') {
      this.environmentData = new EnvironmentData();
      await this.environmentData.initialize();
    }

    // Initialize weather effects
    if (weather && typeof WeatherEffects !== 'undefined') {
      this.weatherEffects = new WeatherEffects({
        sceneManager: this,
        environmentData: this.environmentData,
      });
      await this.weatherEffects.initialize();
    }

    // Initialize time-of-day lighting
    if (lighting && typeof TimeLighting !== 'undefined') {
      this.timeLighting = new TimeLighting({
        sceneManager: this,
        environmentData: this.environmentData,
      });
      await this.timeLighting.initialize();
    }

    // Initialize moon effects
    if (moon && typeof MoonEffects !== 'undefined') {
      this.moonEffects = new MoonEffects({
        sceneManager: this,
        environmentData: this.environmentData,
        timeLighting: this.timeLighting,
      });
      await this.moonEffects.initialize();
    }
  }

  /**
   * Start all environmental effects
   */
  startEnvironmentalEffects() {
    if (this.weatherEffects) {
      this.weatherEffects.start();
    }
    if (this.timeLighting) {
      this.timeLighting.start();
    }
    if (this.moonEffects) {
      this.moonEffects.start();
    }
  }

  /**
   * Stop all environmental effects
   */
  stopEnvironmentalEffects() {
    if (this.weatherEffects) {
      this.weatherEffects.stop();
    }
    if (this.timeLighting) {
      this.timeLighting.stop();
    }
    if (this.moonEffects) {
      this.moonEffects.stop();
    }
  }

  /**
   * Dispose all environmental effects
   */
  disposeEnvironmentalEffects() {
    if (this.weatherEffects) {
      this.weatherEffects.dispose();
      this.weatherEffects = null;
    }
    if (this.timeLighting) {
      this.timeLighting.dispose();
      this.timeLighting = null;
    }
    if (this.moonEffects) {
      this.moonEffects.dispose();
      this.moonEffects = null;
    }
    if (this.environmentData) {
      this.environmentData.dispose();
      this.environmentData = null;
    }
  }

  /**
   * Get current environmental data
   * @returns {Object|null}
   */
  getEnvironmentData() {
    return this.environmentData ? this.environmentData.getData() : null;
  }

  /**
   * Get visual parameters derived from environment
   * @returns {Object|null}
   */
  getEnvironmentVisualParams() {
    return this.environmentData ? this.environmentData.getVisualParams() : null;
  }

  /**
   * Get the Three.js renderer
   * @returns {THREE.WebGLRenderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get the main scene
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get the camera
   * @returns {THREE.Camera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Set the camera
   * @param {THREE.Camera} camera
   */
  setCamera(camera) {
    this.camera = camera;
    this._onResize();
  }
}

// Export for global scope (no build step)
window.SceneManager = SceneManager;
