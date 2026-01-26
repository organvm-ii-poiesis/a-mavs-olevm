/**
 * @file LandingCompositor.js
 * @description Manages the 4-layer compositing system for the landing page
 * Layers: Background, TextMask, MenuMask, ButtonMask
 */

'use strict';

/**
 * LandingCompositor - Orchestrates the 4-layer landing page visual system
 * @class
 */
class LandingCompositor {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - DOM element for the canvas
   * @param {EnvironmentData} [options.environmentData] - Environmental data provider
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.landing || {}
        : {};

    this.container = options.container;
    this.environmentData = options.environmentData || null;
    this.config = {
      layers: config.layers || {
        background: { opacity: 1.0, blendMode: 'normal' },
        textMask: { opacity: 0.8, blendMode: 'multiply' },
        menuMask: { opacity: 0.6, blendMode: 'screen' },
        buttonMask: { opacity: 1.0, blendMode: 'add' },
      },
      particles: config.particles || { count: 1000, size: 0.05, speed: 0.5 },
      noise: config.noise || { scale: 0.5, speed: 0.1, octaves: 4 },
    };

    this.isInitialized = false;
    this.isRunning = false;
    this.sceneManager = null;
    this.envData = null;
    this.visualParams = null;

    // Layer references
    this.layers = {
      background: null,
      textMask: null,
      menuMask: null,
      buttonMask: null,
    };

    // Animation frame ID
    this._animationId = null;

    // Bind methods
    this._onEnvUpdate = this._onEnvUpdate.bind(this);
  }

  /**
   * Initialize the compositor and all layers
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Ensure container exists
    if (!this.container) {
      console.warn('LandingCompositor: No container element');
      return;
    }

    // Create scene manager
    this.sceneManager = new SceneManager({
      container: this.container,
      antialias: true,
      alpha: true,
    });

    // Initialize environment data if not provided
    if (!this.environmentData) {
      this.environmentData = new EnvironmentData();
    }
    await this.environmentData.initialize();
    this.environmentData.onUpdate(this._onEnvUpdate);

    // Get initial visual params
    this.visualParams = this.environmentData.getVisualParams();

    // Create layers
    this._createBackgroundLayer();
    this._createTextMaskLayer();
    this._createMenuMaskLayer();
    this._createButtonMaskLayer();

    this.isInitialized = true;
  }

  /**
   * Create the background layer with noise-based gradients
   * @private
   */
  _createBackgroundLayer() {
    const { scene, camera } = this.sceneManager;

    // Create gradient background based on time of day
    const colors = this._getTimeBasedColors();

    // Create a large plane for background
    const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(colors.primary) },
        uColor2: { value: new THREE.Color(colors.secondary) },
        uColor3: { value: new THREE.Color(colors.tertiary) },
        uNoiseScale: { value: this.config.noise.scale },
        uNoiseSpeed: { value: this.config.noise.speed },
        uMoonGlow: { value: this.visualParams?.moonGlow || 0.5 },
        uParticleDensity: { value: this.visualParams?.particleDensity || 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uMoonGlow;
        uniform float uParticleDensity;

        varying vec2 vUv;
        varying vec3 vPosition;

        // Simplex noise functions
        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec2 mod289_2(vec2 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec3 permute(vec3 x) {
          return mod289(((x * 34.0) + 10.0) * x);
        }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289_2(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
            dot(x12.zw, x12.zw)), 0.0);
          m = m * m;
          m = m * m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 4; i++) {
            value += amplitude * snoise(st * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 st = vUv * uNoiseScale;
          float t = uTime * uNoiseSpeed;

          // Create flowing noise pattern
          float n1 = fbm(st + t * 0.3);
          float n2 = fbm(st * 1.5 - t * 0.2 + vec2(10.0, 0.0));
          float n3 = fbm(st * 2.0 + t * 0.1 + vec2(0.0, 5.0));

          // Blend colors based on noise
          float blend1 = smoothstep(-0.5, 0.5, n1);
          float blend2 = smoothstep(-0.3, 0.7, n2);

          vec3 color = mix(uColor1, uColor2, blend1);
          color = mix(color, uColor3, blend2 * 0.5);

          // Add subtle glow based on moon
          color += vec3(0.02, 0.03, 0.05) * uMoonGlow * (0.5 + 0.5 * n3);

          // Add particle-like sparkles
          float sparkle = pow(max(0.0, n3), 8.0) * uParticleDensity;
          color += vec3(sparkle);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
      depthWrite: false,
    });

    const backgroundMesh = new THREE.Mesh(geometry, material);
    backgroundMesh.position.z = -10;
    backgroundMesh.name = 'backgroundLayer';

    scene.add(backgroundMesh);
    this.layers.background = backgroundMesh;

    // Register animation callback
    this.sceneManager.onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create the text mask layer for ETCETER4 text elements
   * @private
   */
  _createTextMaskLayer() {
    const { scene } = this.sceneManager;

    // Create floating particles that will interact with text
    const particleCount = Math.floor(this.config.particles.count * 0.4);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = -5 + Math.random() * 2;

      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = 0;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: this.config.layers.textMask.opacity },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;

        uniform float uTime;
        uniform float uPixelRatio;

        varying float vOpacity;

        void main() {
          vec3 pos = position;

          // Animate particles
          pos.x += sin(uTime * 0.5 + position.y * 0.1) * 0.5;
          pos.y += cos(uTime * 0.3 + position.x * 0.1) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);

          vOpacity = smoothstep(0.0, 0.5, abs(sin(uTime * 0.5 + position.x)));
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;

        varying float vOpacity;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, d) * uOpacity * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'textMaskLayer';

    scene.add(particles);
    this.layers.textMask = particles;

    // Animation
    this.sceneManager.onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create the menu mask layer
   * @private
   */
  _createMenuMaskLayer() {
    const { scene } = this.sceneManager;

    // Create flowing lines/ribbons
    const geometry = new THREE.BufferGeometry();
    const ribbonCount = 20;
    const pointsPerRibbon = 50;
    const positions = new Float32Array(ribbonCount * pointsPerRibbon * 3);
    const colors = new Float32Array(ribbonCount * pointsPerRibbon * 3);

    const palette = ['#00ffff', '#ff00ff', '#ffff00', '#ff0000'];

    for (let r = 0; r < ribbonCount; r++) {
      const color = new THREE.Color(palette[r % palette.length]);
      const baseY = (r / ribbonCount - 0.5) * 20;

      for (let p = 0; p < pointsPerRibbon; p++) {
        const i = (r * pointsPerRibbon + p) * 3;
        const t = p / pointsPerRibbon;

        positions[i] = (t - 0.5) * 40;
        positions[i + 1] = baseY + Math.sin(t * Math.PI * 4) * 2;
        positions[i + 2] = -7 + Math.sin(t * Math.PI * 2) * 0.5;

        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: this.config.layers.menuMask.opacity * 0.3 },
      },
      vertexShader: `
        uniform float uTime;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;  // 'color' injected by Three.js from buffer attribute

          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.1) * 1.0;
          pos.z += cos(uTime * 0.3 + position.y * 0.1) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 3.0;

          vAlpha = 0.5 + 0.5 * sin(uTime + position.x * 0.2);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          gl_FragColor = vec4(vColor, uOpacity * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const ribbons = new THREE.Points(geometry, material);
    ribbons.name = 'menuMaskLayer';

    scene.add(ribbons);
    this.layers.menuMask = ribbons;

    // Animation
    this.sceneManager.onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create the button mask layer with pulsing glow
   * @private
   */
  _createButtonMaskLayer() {
    const { scene } = this.sceneManager;

    // Create a glowing ring/halo effect
    const geometry = new THREE.RingGeometry(1.5, 2.0, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00ffff') },
        uOpacity: { value: this.config.layers.buttonMask.opacity },
        uMoonGlow: { value: this.visualParams?.moonGlow || 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uMoonGlow;

        varying vec2 vUv;

        void main() {
          // Pulsing effect
          float pulse = 0.5 + 0.5 * sin(uTime * 2.0);

          // Radial gradient
          float dist = length(vUv - vec2(0.5));
          float alpha = smoothstep(0.5, 0.2, dist) * (0.3 + 0.7 * pulse);

          // Add moon influence
          alpha *= 0.7 + 0.3 * uMoonGlow;

          // Color shift over time
          vec3 color = uColor;
          color.r += sin(uTime * 0.5) * 0.1;
          color.b += cos(uTime * 0.3) * 0.1;

          gl_FragColor = vec4(color, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const glow = new THREE.Mesh(geometry, material);
    glow.position.z = -3;
    glow.position.y = -3; // Position near button area
    glow.name = 'buttonMaskLayer';

    scene.add(glow);
    this.layers.buttonMask = glow;

    // Animation
    this.sceneManager.onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
      // Gentle rotation
      glow.rotation.z = Math.sin(elapsed * 0.2) * 0.1;
    });
  }

  /**
   * Get time-based color palette
   * @private
   * @returns {Object}
   */
  _getTimeBasedColors() {
    const period = this.visualParams?.period || 'day';

    const colorSchemes = {
      dawn: {
        primary: '#ff7e5f',
        secondary: '#feb47b',
        tertiary: '#6a0572',
      },
      morning: {
        primary: '#00d2ff',
        secondary: '#3a7bd5',
        tertiary: '#ffffff',
      },
      afternoon: {
        primary: '#56ccf2',
        secondary: '#2f80ed',
        tertiary: '#f2f2f2',
      },
      dusk: {
        primary: '#fc466b',
        secondary: '#3f5efb',
        tertiary: '#1a1a2e',
      },
      night: {
        primary: '#0f0c29',
        secondary: '#302b63',
        tertiary: '#24243e',
      },
    };

    return colorSchemes[period] || colorSchemes.afternoon;
  }

  /**
   * Handle environment data updates
   * @private
   * @param {Object} data
   */
  _onEnvUpdate(data) {
    this.envData = data;
    this.visualParams = this.environmentData.getVisualParams();

    // Update layer uniforms based on new data
    this._updateLayerUniforms();
  }

  /**
   * Update layer uniforms with current visual params
   * @private
   */
  _updateLayerUniforms() {
    if (!this.visualParams) {
      return;
    }

    const colors = this._getTimeBasedColors();

    // Update background
    if (this.layers.background?.material?.uniforms) {
      const bg = this.layers.background.material.uniforms;
      bg.uColor1.value.set(colors.primary);
      bg.uColor2.value.set(colors.secondary);
      bg.uColor3.value.set(colors.tertiary);
      bg.uMoonGlow.value = this.visualParams.moonGlow;
      bg.uParticleDensity.value = this.visualParams.particleDensity;
    }

    // Update button glow
    if (this.layers.buttonMask?.material?.uniforms) {
      const btn = this.layers.buttonMask.material.uniforms;
      btn.uMoonGlow.value = this.visualParams.moonGlow;
    }
  }

  /**
   * Start the animation
   */
  start() {
    if (!this.isInitialized) {
      console.warn('LandingCompositor: Not initialized');
      return;
    }
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.sceneManager.start();
  }

  /**
   * Stop the animation
   */
  stop() {
    this.isRunning = false;
    if (this.sceneManager) {
      this.sceneManager.stop();
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    if (this.environmentData) {
      this.environmentData.dispose();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    this.layers = {
      background: null,
      textMask: null,
      menuMask: null,
      buttonMask: null,
    };

    this.isInitialized = false;
  }
}

// Export for global scope
window.LandingCompositor = LandingCompositor;

// Auto-initialize when document is ready (if enabled in config)
document.addEventListener('DOMContentLoaded', () => {
  const config =
    typeof ETCETER4_CONFIG !== 'undefined'
      ? ETCETER4_CONFIG.threeD?.landing
      : null;

  if (config?.enabled !== false) {
    const container = document.getElementById('landingPageCanvasWrapper');
    if (container) {
      window.landingCompositor = new LandingCompositor({ container });
      window.landingCompositor.initialize().then(() => {
        window.landingCompositor.start();
      });
    }
  }
});
