/**
 * @file TimeLighting.js
 * @description Time-of-day lighting system for 3D immersive experiences
 * Calculates sun position, manages ambient and directional lights
 *
 * Time-of-Day Periods:
 * -------------------
 * - Night: 20:00 - 05:00 (dark blue ambient, moon/stars lighting)
 * - Dawn: 05:00 - 08:00 (warm orange/pink, low sun angle)
 * - Morning: 08:00 - 12:00 (bright, neutral daylight)
 * - Afternoon: 12:00 - 17:00 (bright, slightly warm)
 * - Dusk: 17:00 - 20:00 (warm red/orange, low sun angle)
 *
 * Lighting Components:
 * -------------------
 * - Directional Light: Simulates sun/moon, casts shadows
 * - Ambient Light: Base fill light, colored by time of day
 * - Hemisphere Light: Sky/ground color contribution
 *
 * Usage:
 * ------
 * const lighting = new TimeLighting({
 *   sceneManager: mySceneManager,
 *   environmentData: myEnvData
 * });
 * await lighting.initialize();
 * lighting.start();
 */

'use strict';

/**
 * TimeLighting - Manages time-of-day lighting
 * @class
 */
class TimeLighting {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {EnvironmentData} [options.environmentData] - Environment data provider
   * @param {Object} [options.location] - {lat, lng} for sun position calculation
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.lighting || {}
        : {};

    this.sceneManager = options.sceneManager;
    this.environmentData = options.environmentData || null;
    this.location = options.location || { lat: 40.7128, lng: -74.006 };

    // Configuration with defaults
    this.config = {
      enabled: config.enabled !== false,
      sun: {
        intensity: {
          night: config.sun?.intensity?.night ?? 0.1,
          dawn: config.sun?.intensity?.dawn ?? 0.5,
          morning: config.sun?.intensity?.morning ?? 0.8,
          afternoon: config.sun?.intensity?.afternoon ?? 1.0,
          dusk: config.sun?.intensity?.dusk ?? 0.5,
        },
        elevation: {
          night: config.sun?.elevation?.night ?? -30,
          dawn: config.sun?.elevation?.dawn ?? 5,
          morning: config.sun?.elevation?.morning ?? 30,
          afternoon: config.sun?.elevation?.afternoon ?? 60,
          dusk: config.sun?.elevation?.dusk ?? 5,
        },
      },
      ambient: {
        intensity: {
          night: config.ambient?.intensity?.night ?? 0.15,
          dawn: config.ambient?.intensity?.dawn ?? 0.4,
          morning: config.ambient?.intensity?.morning ?? 0.6,
          afternoon: config.ambient?.intensity?.afternoon ?? 0.7,
          dusk: config.ambient?.intensity?.dusk ?? 0.4,
        },
        colorTemperature: {
          night: config.ambient?.colorTemperature?.night ?? 8000,
          dawn: config.ambient?.colorTemperature?.dawn ?? 3000,
          morning: config.ambient?.colorTemperature?.morning ?? 5500,
          afternoon: config.ambient?.colorTemperature?.afternoon ?? 6000,
          dusk: config.ambient?.colorTemperature?.dusk ?? 2500,
        },
      },
      transition: {
        duration: config.transition?.duration ?? 2.0,
        easing: config.transition?.easing ?? 'easeInOutQuad',
      },
    };

    // State
    this.isInitialized = false;
    this.isRunning = false;

    // Lights
    this.directionalLight = null;
    this.ambientLight = null;
    this.hemisphereLight = null;

    // Current values (for smooth transitions)
    this.current = {
      period: 'afternoon',
      sunIntensity: 1.0,
      sunElevation: 60,
      sunAzimuth: 0,
      ambientIntensity: 0.7,
      ambientColor: new THREE.Color(0xffffff),
    };

    // Target values
    this.target = { ...this.current };

    // Animation cleanup
    this.animationUnsubscribers = [];

    // Bind methods
    this._onEnvUpdate = this._onEnvUpdate.bind(this);
    this._updateLighting = this._updateLighting.bind(this);
  }

  /**
   * Initialize time-based lighting
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    if (!this.sceneManager) {
      console.warn('TimeLighting: No scene manager provided');
      return;
    }

    // Create lights
    this._createLights();

    // Subscribe to environment updates if available
    if (this.environmentData) {
      this.environmentData.onUpdate(this._onEnvUpdate);
    } else {
      // Use current time for initial values
      this._calculateLightingFromTime(new Date());
    }

    // Register animation callback
    const unsubscribe = this.sceneManager.onAnimate(this._updateLighting);
    this.animationUnsubscribers.push(unsubscribe);

    this.isInitialized = true;
  }

  /**
   * Create lighting objects
   * @private
   */
  _createLights() {
    const { scene } = this.sceneManager;

    // Directional light (sun/moon)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(50, 50, 50);
    this.directionalLight.name = 'timeSunLight';
    scene.add(this.directionalLight);

    // Ambient light (fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambientLight.name = 'timeAmbientLight';
    scene.add(this.ambientLight);

    // Hemisphere light (sky/ground)
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.3);
    this.hemisphereLight.name = 'timeHemisphereLight';
    scene.add(this.hemisphereLight);
  }

  /**
   * Handle environment data updates
   * @private
   * @param {Object} data - Environment data
   */
  _onEnvUpdate(data) {
    if (!data.time) {
      return;
    }

    // Update location if available
    if (data.location && data.location.available) {
      this.location = {
        lat: data.location.lat,
        lng: data.location.lng,
      };
    }

    // Calculate lighting from time data
    this._calculateLightingFromTimeData(data.time);
  }

  /**
   * Calculate lighting from EnvironmentData time object
   * @private
   * @param {Object} timeData
   */
  _calculateLightingFromTimeData(timeData) {
    const period = timeData.period || 'afternoon';

    // Get target values for this period
    this.target.period = period;
    this.target.sunIntensity = this.config.sun.intensity[period];
    this.target.sunElevation = this.config.sun.elevation[period];
    this.target.ambientIntensity = this.config.ambient.intensity[period];

    // Calculate sun azimuth based on time of day (rough approximation)
    // East at dawn (90), South at noon (180), West at dusk (270)
    const timeOfDay = timeData.timeOfDay || 0.5;
    this.target.sunAzimuth = (timeOfDay * 360 + 90) % 360;

    // Calculate ambient color from color temperature
    const colorTemp = this.config.ambient.colorTemperature[period];
    this.target.ambientColor = this._kelvinToColor(colorTemp);

    // Update hemisphere light colors based on period
    this._updateHemisphereColors(period);
  }

  /**
   * Calculate lighting from Date object
   * @private
   * @param {Date} date
   */
  _calculateLightingFromTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Determine period
    let period;
    if (hours >= 5 && hours < 8) {
      period = 'dawn';
    } else if (hours >= 8 && hours < 12) {
      period = 'morning';
    } else if (hours >= 12 && hours < 17) {
      period = 'afternoon';
    } else if (hours >= 17 && hours < 20) {
      period = 'dusk';
    } else {
      period = 'night';
    }

    // Calculate time of day (0-1)
    const timeOfDay = (hours * 60 + minutes) / 1440;

    this._calculateLightingFromTimeData({
      period,
      timeOfDay,
    });
  }

  /**
   * Update hemisphere light colors based on period
   * @private
   * @param {string} period
   */
  _updateHemisphereColors(period) {
    if (!this.hemisphereLight) {
      return;
    }

    // Sky and ground colors by period
    const colors = {
      night: { sky: 0x1a1a3a, ground: 0x0a0a15 },
      dawn: { sky: 0xff7f50, ground: 0x4a3a30 },
      morning: { sky: 0x87ceeb, ground: 0x4a6b4a },
      afternoon: { sky: 0x6bb3d9, ground: 0x5a7a5a },
      dusk: { sky: 0xff6b4a, ground: 0x4a3020 },
    };

    const periodColors = colors[period] || colors.afternoon;
    this.hemisphereLight.color.setHex(periodColors.sky);
    this.hemisphereLight.groundColor.setHex(periodColors.ground);
  }

  /**
   * Convert color temperature (Kelvin) to RGB color
   * @private
   * @param {number} kelvin - Color temperature in Kelvin
   * @returns {THREE.Color}
   */
  _kelvinToColor(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;

    // Red
    if (temp <= 66) {
      r = 255;
    } else {
      r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      r = Math.min(255, Math.max(0, r));
    }

    // Green
    if (temp <= 66) {
      g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    } else {
      g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    }
    g = Math.min(255, Math.max(0, g));

    // Blue
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
      b = Math.min(255, Math.max(0, b));
    }

    return new THREE.Color(r / 255, g / 255, b / 255);
  }

  /**
   * Easing function
   * @private
   * @param {number} t - Value 0-1
   * @returns {number}
   */
  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Lerp between two values
   * @private
   * @param {number} a
   * @param {number} b
   * @param {number} t
   * @returns {number}
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Update lighting each frame
   * @private
   * @param {number} delta - Time since last frame
   */
  _updateLighting(delta) {
    if (!this.isRunning) {
      return;
    }

    // Calculate smooth transition factor
    const transitionSpeed = 1 / this.config.transition.duration;
    const t = Math.min(delta * transitionSpeed, 1);

    // Smoothly interpolate sun intensity
    this.current.sunIntensity = this._lerp(
      this.current.sunIntensity,
      this.target.sunIntensity,
      t
    );

    // Smoothly interpolate sun elevation
    this.current.sunElevation = this._lerp(
      this.current.sunElevation,
      this.target.sunElevation,
      t
    );

    // Smoothly interpolate sun azimuth
    this.current.sunAzimuth = this._lerp(
      this.current.sunAzimuth,
      this.target.sunAzimuth,
      t
    );

    // Smoothly interpolate ambient intensity
    this.current.ambientIntensity = this._lerp(
      this.current.ambientIntensity,
      this.target.ambientIntensity,
      t
    );

    // Smoothly interpolate ambient color
    this.current.ambientColor.lerp(this.target.ambientColor, t);

    // Apply to lights
    this._applyLighting();
  }

  /**
   * Apply current lighting values to lights
   * @private
   */
  _applyLighting() {
    // Update directional light
    if (this.directionalLight) {
      this.directionalLight.intensity = this.current.sunIntensity;

      // Calculate sun position from elevation and azimuth
      const elevationRad = (this.current.sunElevation * Math.PI) / 180;
      const azimuthRad = (this.current.sunAzimuth * Math.PI) / 180;
      const distance = 100;

      this.directionalLight.position.set(
        distance * Math.cos(elevationRad) * Math.sin(azimuthRad),
        distance * Math.sin(elevationRad),
        distance * Math.cos(elevationRad) * Math.cos(azimuthRad)
      );

      // Set color based on elevation (warmer near horizon)
      const horizonFactor = 1 - Math.abs(this.current.sunElevation) / 90;
      const sunColor = new THREE.Color(0xffffff);
      if (horizonFactor > 0.5) {
        // Near horizon - more orange/red
        sunColor.lerp(new THREE.Color(0xff8c00), (horizonFactor - 0.5) * 2);
      }
      this.directionalLight.color.copy(sunColor);
    }

    // Update ambient light
    if (this.ambientLight) {
      this.ambientLight.intensity = this.current.ambientIntensity;
      this.ambientLight.color.copy(this.current.ambientColor);
    }

    // Update hemisphere light intensity
    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = this.current.ambientIntensity * 0.5;
    }
  }

  /**
   * Get current sun position for external use
   * @returns {Object} {elevation, azimuth, intensity}
   */
  getSunPosition() {
    return {
      elevation: this.current.sunElevation,
      azimuth: this.current.sunAzimuth,
      intensity: this.current.sunIntensity,
    };
  }

  /**
   * Get current period
   * @returns {string}
   */
  getPeriod() {
    return this.current.period;
  }

  /**
   * Check if it's night time
   * @returns {boolean}
   */
  isNight() {
    return this.current.period === 'night';
  }

  /**
   * Manually set time of day (for testing or overrides)
   * @param {number} hours - Hour of day (0-23)
   * @param {number} [minutes=0] - Minutes
   */
  setTime(hours, minutes = 0) {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    this._calculateLightingFromTime(date);
  }

  /**
   * Set a specific period directly
   * @param {string} period - 'night', 'dawn', 'morning', 'afternoon', 'dusk'
   */
  setPeriod(period) {
    const validPeriods = ['night', 'dawn', 'morning', 'afternoon', 'dusk'];
    if (!validPeriods.includes(period)) {
      console.warn(`TimeLighting: Invalid period "${period}"`);
      return;
    }

    this._calculateLightingFromTimeData({ period, timeOfDay: 0.5 });
  }

  /**
   * Start lighting updates
   */
  start() {
    if (!this.isInitialized) {
      console.warn('TimeLighting: Not initialized');
      return;
    }
    this.isRunning = true;

    // Apply initial values
    this._applyLighting();
  }

  /**
   * Stop lighting updates
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    // Unsubscribe from animations
    for (const unsubscribe of this.animationUnsubscribers) {
      unsubscribe();
    }
    this.animationUnsubscribers = [];

    // Remove lights from scene
    const { scene } = this.sceneManager;
    if (this.directionalLight) {
      scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
    if (this.ambientLight) {
      scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    if (this.hemisphereLight) {
      scene.remove(this.hemisphereLight);
      this.hemisphereLight = null;
    }

    this.isInitialized = false;
  }
}

// Export for global scope
window.TimeLighting = TimeLighting;
