/**
 * @file WeatherEffects.js
 * @description Weather particle systems for 3D immersive experiences
 * Creates rain, snow, and fog effects based on environmental data
 *
 * Weather Effect Parameters:
 * --------------------------
 * Rain:
 *   - intensity (0-1): Controls particle count and opacity
 *   - windSpeed (m/s): Affects horizontal drift
 *   - windDirection (radians): Direction of particle drift
 *
 * Snow:
 *   - intensity (0-1): Controls particle count and opacity
 *   - temperature (celsius): Below 0 triggers snow, affects density
 *   - windSpeed (m/s): Affects horizontal drift
 *
 * Fog:
 *   - density (0-1): Controls exponential fog density
 *   - humidity (%): Higher humidity = denser fog
 *   - visibility (meters): Affects fog far distance
 *
 * Usage:
 * ------
 * const weather = new WeatherEffects({
 *   sceneManager: mySceneManager,
 *   environmentData: myEnvData
 * });
 * await weather.initialize();
 * weather.start();
 */

'use strict';

/**
 * WeatherEffects - Manages weather particle systems
 * @class
 */
class WeatherEffects {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {EnvironmentData} [options.environmentData] - Environment data provider
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.weatherEffects || {}
        : {};

    this.sceneManager = options.sceneManager;
    this.environmentData = options.environmentData || null;

    // Configuration with defaults
    this.config = {
      enabled: config.enabled !== false,
      rain: {
        maxParticles: config.rain?.maxParticles || 5000,
        mobileParticles: config.rain?.mobileParticles || 1500,
        particleSize: config.rain?.particleSize || 0.1,
        fallSpeed: config.rain?.fallSpeed || 15,
        spread: config.rain?.spread || 100,
        height: config.rain?.height || 50,
        opacity: config.rain?.opacity || 0.6,
        color: config.rain?.color || '#a0a0ff',
      },
      snow: {
        maxParticles: config.snow?.maxParticles || 3000,
        mobileParticles: config.snow?.mobileParticles || 1000,
        particleSize: config.snow?.particleSize || 0.2,
        fallSpeed: config.snow?.fallSpeed || 2,
        spread: config.snow?.spread || 100,
        height: config.snow?.height || 50,
        opacity: config.snow?.opacity || 0.8,
        color: config.snow?.color || '#ffffff',
        wobbleAmount: config.snow?.wobbleAmount || 0.5,
      },
      fog: {
        minDensity: config.fog?.minDensity || 0.005,
        maxDensity: config.fog?.maxDensity || 0.05,
        transitionSpeed: config.fog?.transitionSpeed || 0.5,
      },
      wind: {
        maxInfluence: config.wind?.maxInfluence || 10,
        turbulence: config.wind?.turbulence || 0.3,
      },
    };

    // Detect mobile for particle count reduction
    this.isMobile = this._detectMobile();

    // State
    this.isInitialized = false;
    this.isRunning = false;

    // Particle systems
    this.rainSystem = null;
    this.snowSystem = null;
    this.currentFogDensity = 0;
    this.targetFogDensity = 0;

    // Current weather state
    this.currentWeather = {
      condition: 'clear',
      temperature: 20,
      humidity: 50,
      windSpeed: 0,
      windDirection: 0,
      precipitation: 0,
    };

    // Animation cleanup
    this.animationUnsubscribers = [];

    // Bind methods
    this._onEnvUpdate = this._onEnvUpdate.bind(this);
    this._updateParticles = this._updateParticles.bind(this);
  }

  /**
   * Detect if running on mobile device
   * @private
   * @returns {boolean}
   */
  _detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768
    );
  }

  /**
   * Get particle count based on device
   * @private
   * @param {string} type - 'rain' or 'snow'
   * @returns {number}
   */
  _getParticleCount(type) {
    const cfg = this.config[type];
    return this.isMobile ? cfg.mobileParticles : cfg.maxParticles;
  }

  /**
   * Initialize weather effects
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    if (!this.sceneManager) {
      console.warn('WeatherEffects: No scene manager provided');
      return;
    }

    // Create rain system (initially hidden)
    this._createRainSystem();

    // Create snow system (initially hidden)
    this._createSnowSystem();

    // Subscribe to environment updates if available
    if (this.environmentData) {
      this.environmentData.onUpdate(this._onEnvUpdate);
    }

    // Register animation callback
    const unsubscribe = this.sceneManager.onAnimate(this._updateParticles);
    this.animationUnsubscribers.push(unsubscribe);

    this.isInitialized = true;
  }

  /**
   * Create rain particle system
   * @private
   */
  _createRainSystem() {
    const count = this._getParticleCount('rain');
    const cfg = this.config.rain;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random horizontal position
      positions[i3] = (Math.random() - 0.5) * cfg.spread;
      // Random height
      positions[i3 + 1] = Math.random() * cfg.height;
      // Random depth
      positions[i3 + 2] = (Math.random() - 0.5) * cfg.spread;

      // Base velocity (mostly down)
      velocities[i3] = 0; // Will be affected by wind
      velocities[i3 + 1] = -(cfg.fallSpeed * (0.8 + Math.random() * 0.4));
      velocities[i3 + 2] = 0;

      // Random opacity variation
      opacities[i] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Rain shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(cfg.color) },
        uIntensity: { value: 0 },
        uWindX: { value: 0 },
        uWindZ: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: cfg.particleSize },
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float opacity;

        uniform float uTime;
        uniform float uIntensity;
        uniform float uWindX;
        uniform float uWindZ;
        uniform float uPixelRatio;
        uniform float uSize;

        varying float vOpacity;

        void main() {
          vOpacity = opacity * uIntensity;

          vec3 pos = position;

          // Apply wind influence
          pos.x += uWindX * 0.1;
          pos.z += uWindZ * 0.1;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size based on distance and intensity
          gl_PointSize = uSize * uPixelRatio * (200.0 / -mvPosition.z) * uIntensity;
          gl_PointSize = max(gl_PointSize, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;

        varying float vOpacity;

        void main() {
          // Create elongated raindrop shape
          vec2 center = gl_PointCoord - vec2(0.5);
          float d = length(center * vec2(1.0, 0.3)); // Stretch vertically

          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.2, d) * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.rainSystem = new THREE.Points(geometry, material);
    this.rainSystem.visible = false;
    this.rainSystem.name = 'weatherRain';
    this.rainSystem.frustumCulled = false;

    this.sceneManager.add(this.rainSystem);
  }

  /**
   * Create snow particle system
   * @private
   */
  _createSnowSystem() {
    const count = this._getParticleCount('snow');
    const cfg = this.config.snow;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count); // For wobble animation

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random horizontal position
      positions[i3] = (Math.random() - 0.5) * cfg.spread;
      // Random height
      positions[i3 + 1] = Math.random() * cfg.height;
      // Random depth
      positions[i3 + 2] = (Math.random() - 0.5) * cfg.spread;

      // Slower velocity for snow
      velocities[i3] = (Math.random() - 0.5) * cfg.wobbleAmount;
      velocities[i3 + 1] = -(cfg.fallSpeed * (0.5 + Math.random() * 0.5));
      velocities[i3 + 2] = (Math.random() - 0.5) * cfg.wobbleAmount;

      // Random phase for wobble
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    // Snow shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(cfg.color) },
        uIntensity: { value: 0 },
        uWindX: { value: 0 },
        uWindZ: { value: 0 },
        uWobble: { value: cfg.wobbleAmount },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: cfg.particleSize },
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float phase;

        uniform float uTime;
        uniform float uIntensity;
        uniform float uWindX;
        uniform float uWindZ;
        uniform float uWobble;
        uniform float uPixelRatio;
        uniform float uSize;

        varying float vOpacity;

        void main() {
          vOpacity = uIntensity * 0.9;

          vec3 pos = position;

          // Gentle wobble movement
          pos.x += sin(uTime * 2.0 + phase) * uWobble;
          pos.z += cos(uTime * 1.5 + phase * 0.7) * uWobble;

          // Apply wind influence
          pos.x += uWindX * 0.2;
          pos.z += uWindZ * 0.2;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size with variation
          float sizeVar = 0.7 + 0.6 * sin(phase);
          gl_PointSize = uSize * sizeVar * uPixelRatio * (200.0 / -mvPosition.z) * uIntensity;
          gl_PointSize = max(gl_PointSize, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;

        varying float vOpacity;

        void main() {
          // Circular snowflake
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          // Soft edge
          float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.snowSystem = new THREE.Points(geometry, material);
    this.snowSystem.visible = false;
    this.snowSystem.name = 'weatherSnow';
    this.snowSystem.frustumCulled = false;

    this.sceneManager.add(this.snowSystem);
  }

  /**
   * Handle environment data updates
   * @private
   * @param {Object} data - Environment data
   */
  _onEnvUpdate(data) {
    if (!data.weather) {
      return;
    }

    const weather = data.weather;
    this.currentWeather = {
      condition: weather.condition || 'clear',
      temperature: weather.temperature ?? 20,
      humidity: weather.humidity ?? 50,
      windSpeed: weather.windSpeed ?? 0,
      windDirection: weather.windDirection ?? 0,
      precipitation: this._calculatePrecipitation(weather),
    };

    // Update effects based on new weather
    this._updateWeatherEffects();
  }

  /**
   * Calculate precipitation intensity from weather data
   * @private
   * @param {Object} weather
   * @returns {number} 0-1 precipitation intensity
   */
  _calculatePrecipitation(weather) {
    const condition = weather.condition || 'clear';

    switch (condition) {
      case 'storm':
        return 1.0;
      case 'rain':
        return 0.7;
      case 'drizzle':
        return 0.3;
      case 'snow':
        return 0.8;
      case 'fog':
      case 'haze':
        return 0.1;
      case 'cloudy':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Update weather effects based on current conditions
   * @private
   */
  _updateWeatherEffects() {
    const { condition, temperature, humidity, windSpeed, precipitation } =
      this.currentWeather;

    // Determine effect type
    const isSnow =
      condition === 'snow' || (precipitation > 0 && temperature < 2);
    const isRain =
      !isSnow &&
      (condition === 'rain' ||
        condition === 'drizzle' ||
        condition === 'storm');
    const isFoggy =
      condition === 'fog' || condition === 'haze' || humidity > 80;

    // Update rain visibility and intensity
    if (this.rainSystem) {
      this.rainSystem.visible = isRain && precipitation > 0;
      if (this.rainSystem.material.uniforms) {
        this.rainSystem.material.uniforms.uIntensity.value = isRain
          ? precipitation
          : 0;

        // Wind influence
        const windX = Math.cos(this.currentWeather.windDirection) * windSpeed;
        const windZ = Math.sin(this.currentWeather.windDirection) * windSpeed;
        this.rainSystem.material.uniforms.uWindX.value =
          windX * (this.config.wind.maxInfluence / 20);
        this.rainSystem.material.uniforms.uWindZ.value =
          windZ * (this.config.wind.maxInfluence / 20);
      }
    }

    // Update snow visibility and intensity
    if (this.snowSystem) {
      this.snowSystem.visible = isSnow && precipitation > 0;
      if (this.snowSystem.material.uniforms) {
        this.snowSystem.material.uniforms.uIntensity.value = isSnow
          ? precipitation
          : 0;

        // Wind influence (lighter for snow)
        const windX = Math.cos(this.currentWeather.windDirection) * windSpeed;
        const windZ = Math.sin(this.currentWeather.windDirection) * windSpeed;
        this.snowSystem.material.uniforms.uWindX.value =
          windX * (this.config.wind.maxInfluence / 40);
        this.snowSystem.material.uniforms.uWindZ.value =
          windZ * (this.config.wind.maxInfluence / 40);
      }
    }

    // Update fog density target
    if (isFoggy) {
      // Map humidity (50-100) to fog density
      const humidityFactor = Math.max(0, (humidity - 50) / 50);
      this.targetFogDensity =
        this.config.fog.minDensity +
        (this.config.fog.maxDensity - this.config.fog.minDensity) *
          humidityFactor;
    } else {
      this.targetFogDensity = this.config.fog.minDensity;
    }
  }

  /**
   * Update particles each frame
   * @private
   * @param {number} delta - Time since last frame
   * @param {number} elapsed - Total elapsed time
   */
  _updateParticles(delta, elapsed) {
    if (!this.isRunning) {
      return;
    }

    // Get camera position for particle repositioning
    const camera = this.sceneManager.camera;
    const cameraPos = camera ? camera.position : new THREE.Vector3();

    // Update rain
    if (this.rainSystem && this.rainSystem.visible) {
      this._updateRainPositions(delta, cameraPos);
      this.rainSystem.material.uniforms.uTime.value = elapsed;
    }

    // Update snow
    if (this.snowSystem && this.snowSystem.visible) {
      this._updateSnowPositions(delta, cameraPos);
      this.snowSystem.material.uniforms.uTime.value = elapsed;
    }

    // Smoothly transition fog density
    this._updateFogDensity(delta);
  }

  /**
   * Update rain particle positions
   * @private
   * @param {number} delta
   * @param {THREE.Vector3} cameraPos
   */
  _updateRainPositions(delta, cameraPos) {
    const positions = this.rainSystem.geometry.attributes.position.array;
    const velocities = this.rainSystem.geometry.attributes.velocity.array;
    const count = positions.length / 3;
    const cfg = this.config.rain;

    const windX = this.rainSystem.material.uniforms.uWindX.value * 10;
    const windZ = this.rainSystem.material.uniforms.uWindZ.value * 10;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Move particle
      positions[i3] += (velocities[i3] + windX) * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += (velocities[i3 + 2] + windZ) * delta;

      // Reset if below ground or too far from camera
      if (positions[i3 + 1] < -2) {
        positions[i3] = cameraPos.x + (Math.random() - 0.5) * cfg.spread;
        positions[i3 + 1] = cameraPos.y + cfg.height;
        positions[i3 + 2] = cameraPos.z + (Math.random() - 0.5) * cfg.spread;
      }

      // Keep particles near camera horizontally
      const dx = positions[i3] - cameraPos.x;
      const dz = positions[i3 + 2] - cameraPos.z;
      if (Math.abs(dx) > cfg.spread / 2) {
        positions[i3] = cameraPos.x + (Math.random() - 0.5) * cfg.spread;
      }
      if (Math.abs(dz) > cfg.spread / 2) {
        positions[i3 + 2] = cameraPos.z + (Math.random() - 0.5) * cfg.spread;
      }
    }

    this.rainSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update snow particle positions
   * @private
   * @param {number} delta
   * @param {THREE.Vector3} cameraPos
   */
  _updateSnowPositions(delta, cameraPos) {
    const positions = this.snowSystem.geometry.attributes.position.array;
    const velocities = this.snowSystem.geometry.attributes.velocity.array;
    const count = positions.length / 3;
    const cfg = this.config.snow;

    const windX = this.snowSystem.material.uniforms.uWindX.value * 5;
    const windZ = this.snowSystem.material.uniforms.uWindZ.value * 5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Move particle with gentler motion
      positions[i3] += (velocities[i3] + windX) * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += (velocities[i3 + 2] + windZ) * delta;

      // Reset if below ground
      if (positions[i3 + 1] < -2) {
        positions[i3] = cameraPos.x + (Math.random() - 0.5) * cfg.spread;
        positions[i3 + 1] = cameraPos.y + cfg.height;
        positions[i3 + 2] = cameraPos.z + (Math.random() - 0.5) * cfg.spread;
      }

      // Keep particles near camera horizontally
      const dx = positions[i3] - cameraPos.x;
      const dz = positions[i3 + 2] - cameraPos.z;
      if (Math.abs(dx) > cfg.spread / 2) {
        positions[i3] = cameraPos.x + (Math.random() - 0.5) * cfg.spread;
      }
      if (Math.abs(dz) > cfg.spread / 2) {
        positions[i3 + 2] = cameraPos.z + (Math.random() - 0.5) * cfg.spread;
      }
    }

    this.snowSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update fog density smoothly
   * @private
   * @param {number} delta
   */
  _updateFogDensity(delta) {
    if (!this.sceneManager.scene.fog) {
      return;
    }

    const diff = this.targetFogDensity - this.currentFogDensity;
    if (Math.abs(diff) < 0.0001) {
      return;
    }

    const speed = this.config.fog.transitionSpeed;
    this.currentFogDensity += diff * Math.min(delta * speed, 1);

    // Update fog if it's FogExp2
    if (this.sceneManager.scene.fog.density !== undefined) {
      this.sceneManager.scene.fog.density = this.currentFogDensity;
    }
  }

  /**
   * Manually set weather conditions (for testing or overrides)
   * @param {Object} weather - Weather configuration
   * @param {string} [weather.condition] - Weather condition
   * @param {number} [weather.temperature] - Temperature in Celsius
   * @param {number} [weather.humidity] - Humidity percentage
   * @param {number} [weather.windSpeed] - Wind speed in m/s
   * @param {number} [weather.windDirection] - Wind direction in radians
   */
  setWeather(weather) {
    this.currentWeather = {
      ...this.currentWeather,
      ...weather,
      precipitation: this._calculatePrecipitation(weather),
    };
    this._updateWeatherEffects();
  }

  /**
   * Get current weather state
   * @returns {Object}
   */
  getWeather() {
    return { ...this.currentWeather };
  }

  /**
   * Start weather effects
   */
  start() {
    if (!this.isInitialized) {
      console.warn('WeatherEffects: Not initialized');
      return;
    }
    this.isRunning = true;
    this._updateWeatherEffects();
  }

  /**
   * Stop weather effects
   */
  stop() {
    this.isRunning = false;

    // Hide all particle systems
    if (this.rainSystem) {
      this.rainSystem.visible = false;
    }
    if (this.snowSystem) {
      this.snowSystem.visible = false;
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

    // Dispose rain system
    if (this.rainSystem) {
      this.sceneManager.remove(this.rainSystem);
      this.rainSystem.geometry.dispose();
      this.rainSystem.material.dispose();
      this.rainSystem = null;
    }

    // Dispose snow system
    if (this.snowSystem) {
      this.sceneManager.remove(this.snowSystem);
      this.snowSystem.geometry.dispose();
      this.snowSystem.material.dispose();
      this.snowSystem = null;
    }

    this.isInitialized = false;
  }
}

// Export for global scope
window.WeatherEffects = WeatherEffects;
