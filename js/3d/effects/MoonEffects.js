/**
 * @file MoonEffects.js
 * @description Moon phase effects for 3D immersive experiences
 * Creates lunar glow, night tinting, and full moon special effects
 *
 * Moon Phase Values:
 * -----------------
 * - 0.00: New Moon (no illumination)
 * - 0.25: First Quarter (half illuminated)
 * - 0.50: Full Moon (full illumination)
 * - 0.75: Last Quarter (half illuminated)
 * - 1.00: New Moon again
 *
 * Effects:
 * --------
 * - Moon Glow: Intensity varies with lunar phase
 * - Night Tinting: Subtle blue color shift during night scenes
 * - Full Moon Boost: Enhanced bloom and highlights during full moon
 *
 * Usage:
 * ------
 * const moon = new MoonEffects({
 *   sceneManager: mySceneManager,
 *   environmentData: myEnvData,
 *   timeLighting: myTimeLighting
 * });
 * await moon.initialize();
 * moon.start();
 */

'use strict';

/**
 * MoonEffects - Manages moon phase-based visual effects
 * @class
 */
class MoonEffects {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {EnvironmentData} [options.environmentData] - Environment data provider
   * @param {TimeLighting} [options.timeLighting] - Time lighting controller
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.moon || {}
        : {};

    this.sceneManager = options.sceneManager;
    this.environmentData = options.environmentData || null;
    this.timeLighting = options.timeLighting || null;

    // Configuration with defaults
    this.config = {
      enabled: config.enabled !== false,
      glowMultiplier: config.glowMultiplier ?? 1.5,
      nightTint: {
        color: config.nightTint?.color || '#4466aa',
        intensity: config.nightTint?.intensity ?? 0.2,
      },
      fullMoon: {
        threshold: config.fullMoon?.threshold ?? 0.85,
        bloomBoost: config.fullMoon?.bloomBoost ?? 0.3,
        highlightBoost: config.fullMoon?.highlightBoost ?? 1.2,
      },
    };

    // State
    this.isInitialized = false;
    this.isRunning = false;

    // Moon data
    this.moonData = {
      phase: 0.5, // 0-1, 0.5 = full
      illumination: 50, // 0-100%
      isFullMoon: false,
    };

    // Lighting modifiers
    this.moonLight = null;
    this.moonGlowMesh = null;

    // Original bloom settings (to restore)
    this.originalBloomStrength = null;

    // Animation cleanup
    this.animationUnsubscribers = [];

    // Bind methods
    this._onEnvUpdate = this._onEnvUpdate.bind(this);
    this._updateMoonEffects = this._updateMoonEffects.bind(this);
  }

  /**
   * Initialize moon effects
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    if (!this.sceneManager) {
      console.warn('MoonEffects: No scene manager provided');
      return;
    }

    // Create moon light
    this._createMoonLight();

    // Create moon glow (visible in sky at night)
    this._createMoonGlow();

    // Store original bloom settings
    if (this.sceneManager.bloomPass) {
      this.originalBloomStrength = this.sceneManager.bloomPass.strength;
    }

    // Subscribe to environment updates if available
    if (this.environmentData) {
      this.environmentData.onUpdate(this._onEnvUpdate);
    } else {
      // Calculate moon phase algorithmically
      this._calculateMoonPhase();
    }

    // Register animation callback
    const unsubscribe = this.sceneManager.onAnimate(this._updateMoonEffects);
    this.animationUnsubscribers.push(unsubscribe);

    this.isInitialized = true;
  }

  /**
   * Create moon light (directional light representing moonlight)
   * @private
   */
  _createMoonLight() {
    // Moon light - dimmer, slightly blue directional light
    this.moonLight = new THREE.DirectionalLight(0x8888ff, 0);
    this.moonLight.position.set(-50, 40, -50);
    this.moonLight.name = 'moonLight';
    this.sceneManager.add(this.moonLight);
  }

  /**
   * Create moon glow sphere in the sky
   * @private
   */
  _createMoonGlow() {
    // Create a glowing sphere to represent the moon
    const geometry = new THREE.SphereGeometry(5, 32, 32);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIllumination: { value: 0.5 },
        uPhase: { value: 0.5 },
        uGlowColor: { value: new THREE.Color(0xffffee) },
        uGlowIntensity: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIllumination;
        uniform float uPhase;
        uniform vec3 uGlowColor;
        uniform float uGlowIntensity;

        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Basic moon disc
          float moon = 1.0;

          // Create phase shadow (simplified crescent)
          float phaseAngle = uPhase * 3.14159 * 2.0;
          float shadowX = cos(phaseAngle);
          float shadowStrength = smoothstep(-0.3, 0.3, vUv.x - 0.5 - shadowX * 0.3);

          // Apply illumination
          float brightness = uIllumination * shadowStrength;

          // Glow effect
          float glow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          glow *= uGlowIntensity;

          vec3 color = uGlowColor * brightness;
          color += uGlowColor * glow * 0.5;

          // Add subtle shimmer
          float shimmer = 0.02 * sin(uTime * 0.5 + vUv.x * 10.0) * sin(vUv.y * 10.0);
          color += shimmer * uGlowIntensity;

          float alpha = max(brightness * 0.8, glow * 0.5) * uGlowIntensity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.moonGlowMesh = new THREE.Mesh(geometry, material);
    this.moonGlowMesh.position.set(-80, 60, -100);
    this.moonGlowMesh.name = 'moonGlow';
    this.moonGlowMesh.visible = false; // Hidden during day

    this.sceneManager.add(this.moonGlowMesh);
  }

  /**
   * Handle environment data updates
   * @private
   * @param {Object} data - Environment data
   */
  _onEnvUpdate(data) {
    if (!data.astronomy) {
      return;
    }

    this.moonData = {
      phase: data.astronomy.moonPhase ?? 0.5,
      illumination: data.astronomy.moonIllumination ?? 50,
      isFullMoon:
        data.astronomy.moonIllumination >= this.config.fullMoon.threshold * 100,
    };

    this._updateMoonVisuals();
  }

  /**
   * Calculate moon phase algorithmically (fallback)
   * @private
   */
  _calculateMoonPhase() {
    // Synodic month (moon cycle) is approximately 29.53 days
    const synodicMonth = 29.53;
    // Reference new moon date: January 6, 2000
    const referenceNewMoon = new Date('2000-01-06T00:00:00Z').getTime();
    const now = Date.now();
    const daysSinceReference = (now - referenceNewMoon) / (1000 * 60 * 60 * 24);
    const moonAge = daysSinceReference % synodicMonth;
    const phase = moonAge / synodicMonth;

    // Calculate illumination (0 at new moon, 100 at full moon)
    const illumination = Math.abs(Math.sin(phase * Math.PI)) * 100;

    this.moonData = {
      phase,
      illumination,
      isFullMoon: illumination >= this.config.fullMoon.threshold * 100,
    };

    this._updateMoonVisuals();
  }

  /**
   * Update moon visual elements based on current data
   * @private
   */
  _updateMoonVisuals() {
    const { illumination, isFullMoon } = this.moonData;
    const normalizedIllumination = illumination / 100;

    // Update moon light intensity
    if (this.moonLight) {
      // Moon light is only visible at night
      const isNight = this.timeLighting
        ? this.timeLighting.isNight()
        : this._isNightTime();

      if (isNight) {
        this.moonLight.intensity =
          normalizedIllumination * 0.3 * this.config.glowMultiplier;
      } else {
        this.moonLight.intensity = 0;
      }
    }

    // Update moon glow visibility and intensity
    if (this.moonGlowMesh && this.moonGlowMesh.material.uniforms) {
      const isNight = this.timeLighting
        ? this.timeLighting.isNight()
        : this._isNightTime();

      this.moonGlowMesh.visible = isNight;

      if (isNight) {
        this.moonGlowMesh.material.uniforms.uIllumination.value =
          normalizedIllumination;
        this.moonGlowMesh.material.uniforms.uPhase.value = this.moonData.phase;
        this.moonGlowMesh.material.uniforms.uGlowIntensity.value =
          normalizedIllumination * this.config.glowMultiplier;
      }
    }

    // Update bloom for full moon
    this._updateBloomForMoon(isFullMoon, normalizedIllumination);

    // Apply night tinting
    this._updateNightTint();
  }

  /**
   * Update bloom settings for moon effects
   * @private
   * @param {boolean} isFullMoon
   * @param {number} illumination - 0-1
   */
  _updateBloomForMoon(isFullMoon, illumination) {
    if (!this.sceneManager.bloomPass) {
      return;
    }

    const isNight = this.timeLighting
      ? this.timeLighting.isNight()
      : this._isNightTime();

    if (isNight && isFullMoon) {
      // Boost bloom during full moon
      const baseStrength =
        this.originalBloomStrength !== null
          ? this.originalBloomStrength
          : this.sceneManager.bloomPass.strength;

      this.sceneManager.bloomPass.strength =
        baseStrength + this.config.fullMoon.bloomBoost * illumination;
    } else if (this.originalBloomStrength !== null) {
      // Restore original bloom
      this.sceneManager.bloomPass.strength = this.originalBloomStrength;
    }
  }

  /**
   * Apply night tinting to scene
   * @private
   */
  _updateNightTint() {
    // This modifies the scene's fog color to add a subtle blue tint at night
    const isNight = this.timeLighting
      ? this.timeLighting.isNight()
      : this._isNightTime();

    if (!isNight) {
      return;
    }

    const fog = this.sceneManager.scene.fog;
    if (!fog) {
      return;
    }

    // Get the current fog color
    const currentColor = fog.color.clone();

    // Create tint color
    const tintColor = new THREE.Color(this.config.nightTint.color);

    // Blend based on moon illumination and tint intensity
    const blendFactor =
      this.config.nightTint.intensity *
      (1 - (this.moonData.illumination / 100) * 0.5); // Less tint with more moonlight

    currentColor.lerp(tintColor, blendFactor);

    // Apply (this is a subtle effect, not replacing the fog color entirely)
    fog.color.lerp(currentColor, 0.1);
  }

  /**
   * Check if it's night time (fallback when no TimeLighting)
   * @private
   * @returns {boolean}
   */
  _isNightTime() {
    const hours = new Date().getHours();
    return hours >= 20 || hours < 5;
  }

  /**
   * Update moon effects each frame
   * @private
   * @param {number} delta - Time since last frame
   * @param {number} elapsed - Total elapsed time
   */
  _updateMoonEffects(delta, elapsed) {
    if (!this.isRunning) {
      return;
    }

    // Update moon glow shader time
    if (
      this.moonGlowMesh &&
      this.moonGlowMesh.visible &&
      this.moonGlowMesh.material.uniforms
    ) {
      this.moonGlowMesh.material.uniforms.uTime.value = elapsed;
    }

    // Recalculate visuals periodically (in case time changes)
    // This is already handled by environment data updates, but
    // we refresh night tint smoothly here
    this._updateNightTint();
  }

  /**
   * Get current moon data
   * @returns {Object} {phase, illumination, isFullMoon}
   */
  getMoonData() {
    return { ...this.moonData };
  }

  /**
   * Get moon illumination as a factor (0-1)
   * @returns {number}
   */
  getIlluminationFactor() {
    return this.moonData.illumination / 100;
  }

  /**
   * Check if it's a full moon
   * @returns {boolean}
   */
  isFullMoon() {
    return this.moonData.isFullMoon;
  }

  /**
   * Manually set moon phase (for testing or overrides)
   * @param {number} phase - Moon phase 0-1 (0.5 = full moon)
   */
  setMoonPhase(phase) {
    const normalizedPhase = Math.max(0, Math.min(1, phase));
    const illumination = Math.abs(Math.sin(normalizedPhase * Math.PI)) * 100;

    this.moonData = {
      phase: normalizedPhase,
      illumination,
      isFullMoon: illumination >= this.config.fullMoon.threshold * 100,
    };

    this._updateMoonVisuals();
  }

  /**
   * Set full moon state directly (for testing)
   * @param {boolean} isFull
   */
  setFullMoon(isFull) {
    this.setMoonPhase(isFull ? 0.5 : 0);
  }

  /**
   * Start moon effects
   */
  start() {
    if (!this.isInitialized) {
      console.warn('MoonEffects: Not initialized');
      return;
    }
    this.isRunning = true;

    // Update visuals immediately
    this._updateMoonVisuals();
  }

  /**
   * Stop moon effects
   */
  stop() {
    this.isRunning = false;

    // Hide moon glow
    if (this.moonGlowMesh) {
      this.moonGlowMesh.visible = false;
    }

    // Disable moon light
    if (this.moonLight) {
      this.moonLight.intensity = 0;
    }

    // Restore original bloom
    if (this.sceneManager.bloomPass && this.originalBloomStrength !== null) {
      this.sceneManager.bloomPass.strength = this.originalBloomStrength;
    }
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

    // Remove moon light
    if (this.moonLight) {
      this.sceneManager.remove(this.moonLight);
      this.moonLight = null;
    }

    // Remove moon glow
    if (this.moonGlowMesh) {
      this.sceneManager.remove(this.moonGlowMesh);
      this.moonGlowMesh.geometry.dispose();
      this.moonGlowMesh.material.dispose();
      this.moonGlowMesh = null;
    }

    this.isInitialized = false;
  }
}

// Export for global scope
window.MoonEffects = MoonEffects;
