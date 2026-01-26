/**
 * @file HighContrastEnv.js
 * @description High contrast black/white environment for OGOD tracks
 * Creates stark lighting, shadow geometry, and silhouettes
 * Used for: Stickerbush DKC2 (5), Okami (19)
 * Supports audio-reactive visual effects
 *
 * Moon Phase Integration:
 * ----------------------
 * This environment responds to moon phase data:
 * - Full moon: Enhanced glow effects, brighter highlights
 * - New moon: Deeper shadows, more contrast
 * - Partial phases: Gradual transition between states
 */

'use strict';

/**
 * HighContrastEnvironment - Black and white shadow world with audio reactivity
 * @class
 * @extends EnvironmentBase
 */
class HighContrastEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {Object} [options.audioUniforms] - Audio-reactive uniform objects
   */
  constructor(options = {}) {
    super(options);
    // Override palette to ensure high contrast
    this.colors = [
      new THREE.Color(0x000000),
      new THREE.Color(0xffffff),
      new THREE.Color(0x1a1a1a),
      new THREE.Color(0xe5e5e5),
    ];

    // Moon phase settings from config
    const moonConfig =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.moon || {}
        : {};

    this.moonConfig = {
      glowMultiplier: moonConfig.glowMultiplier ?? 1.5,
      fullMoonThreshold: moonConfig.fullMoon?.threshold ?? 0.85,
      highlightBoost: moonConfig.fullMoon?.highlightBoost ?? 1.2,
    };

    // Current moon state
    this.moonIllumination = 0.5;
    this.isFullMoon = false;

    // References to moon-reactive elements
    this.moonGlowElements = [];
    this.directionalLight = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Set stark background
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

    // Create silhouette columns
    this._createSilhouetteColumns();

    // Create shadow planes
    this._createShadowPlanes();

    // Create light rays
    this._createLightRays();

    // Create contrast particles
    this._createContrastParticles();

    // Directional light for shadows
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(10, 20, 10);
    this._addObject(this.directionalLight);

    // Moon glow orb (visible in the sky, intensity based on moon phase)
    this._createMoonGlow();

    // Invisible floor for VR teleport
    const floor = this._createGround({ opacity: 0 });
    this._addObject(floor);

    this.isInitialized = true;
  }

  /**
   * Create moon glow orb in the environment
   * @private
   */
  _createMoonGlow() {
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIllumination: { value: 0.5 },
        uGlowColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIllumination;
        uniform vec3 uGlowColor;
        varying vec3 vNormal;

        void main() {
          // Fresnel-like glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float glow = fresnel * uIllumination;

          // Subtle pulse
          float pulse = 0.9 + 0.1 * sin(uTime * 0.5);
          glow *= pulse;

          vec3 color = uGlowColor * glow;
          float alpha = glow * 0.8;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const moonOrb = new THREE.Mesh(geometry, material);
    moonOrb.position.set(-40, 35, -60);
    moonOrb.name = 'moonGlowOrb';

    this._addObject(moonOrb);
    this.moonGlowElements.push({ mesh: moonOrb, material });

    // Animate moon glow
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Update moon phase effects
   * @param {number} illumination - Moon illumination 0-1
   */
  setMoonIllumination(illumination) {
    this.moonIllumination = illumination;
    this.isFullMoon = illumination >= this.moonConfig.fullMoonThreshold;

    // Update moon glow elements
    for (const element of this.moonGlowElements) {
      if (element.material.uniforms) {
        element.material.uniforms.uIllumination.value =
          illumination * this.moonConfig.glowMultiplier;
      }
    }

    // Adjust directional light for full moon
    if (this.directionalLight) {
      if (this.isFullMoon) {
        // Full moon: brighter, slightly warmer light
        this.directionalLight.intensity = 1.0 * this.moonConfig.highlightBoost;
        this.directionalLight.color.setHex(0xffeedd);
      } else {
        // Regular: standard white light
        this.directionalLight.intensity = 0.8 + illumination * 0.2;
        this.directionalLight.color.setHex(0xffffff);
      }
    }

    // Adjust fog for moon phase (clearer during full moon)
    const { scene } = this.sceneManager;
    if (scene.fog && scene.fog.density !== undefined) {
      const baseDensity = 0.015;
      // Less fog during full moon (better visibility)
      scene.fog.density = baseDensity * (1 - illumination * 0.3);
    }
  }

  /**
   * Get current moon state
   * @returns {Object}
   */
  getMoonState() {
    return {
      illumination: this.moonIllumination,
      isFullMoon: this.isFullMoon,
    };
  }

  _createSilhouetteColumns() {
    const columnCount = 20;

    for (let i = 0; i < columnCount; i++) {
      const isBlack = i % 2 === 0;
      const color = isBlack ? 0x000000 : 0xffffff;

      const width = 1 + Math.random() * 3;
      const height = 20 + Math.random() * 30;

      const geometry = new THREE.BoxGeometry(width, height, width);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isBlack ? 1.0 : 0.8,
      });

      const column = new THREE.Mesh(geometry, material);
      const angle = (i / columnCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 20;
      column.position.set(
        Math.cos(angle) * radius,
        height / 2 - 5,
        Math.sin(angle) * radius
      );
      column.name = `column_${i}`;

      this._addObject(column);

      // Subtle sway
      const swaySpeed = 0.1 + Math.random() * 0.1;

      this._onAnimate((delta, elapsed) => {
        column.rotation.z = Math.sin(elapsed * swaySpeed) * 0.02;
      });
    }
  }

  _createShadowPlanes() {
    const planeCount = 10;

    for (let i = 0; i < planeCount; i++) {
      const isBlack = i % 2 === 0;

      const geometry = new THREE.PlaneGeometry(50, 30);
      const material = new THREE.MeshBasicMaterial({
        color: isBlack ? 0x000000 : 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(
        (Math.random() - 0.5) * 60,
        15 + Math.random() * 10,
        -30 - i * 5
      );
      plane.rotation.y = (Math.random() - 0.5) * 0.5;
      plane.name = `shadowPlane_${i}`;

      this._addObject(plane);
    }
  }

  _createLightRays() {
    const rayCount = 8;
    const audioUniforms = this._getAudioUniforms();

    for (let i = 0; i < rayCount; i++) {
      const geometry = new THREE.CylinderGeometry(0.1, 3, 50, 8, 1, true);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIndex: { value: i },
          // Audio-reactive uniforms
          uBassLevel: audioUniforms.uBassLevel,
          uMidLevel: audioUniforms.uMidLevel,
          uKickHit: audioUniforms.uKickHit,
          uSnareHit: audioUniforms.uSnareHit,
          uEnergy: audioUniforms.uEnergy,
        },
        vertexShader: `
          uniform float uBassLevel;
          uniform float uKickHit;

          varying vec2 vUv;

          void main() {
            vUv = uv;

            vec3 pos = position;
            // Bass makes rays wider
            pos.x *= 1.0 + uBassLevel * 0.5;
            pos.z *= 1.0 + uBassLevel * 0.5;

            // Kick makes rays taller
            pos.y *= 1.0 + uKickHit * 0.3;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uIndex;
          uniform float uMidLevel;
          uniform float uSnareHit;
          uniform float uEnergy;

          varying vec2 vUv;

          void main() {
            float fade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

            // Audio-reactive flicker
            float audioSpeed = 3.0 + uEnergy * 2.0;
            float flicker = 0.5 + 0.5 * sin(uTime * audioSpeed + uIndex * 1.5);
            flicker += uMidLevel * 0.2;

            float alpha = fade * (0.3 + uEnergy * 0.2) * flicker;

            // Snare creates white flash
            vec3 color = vec3(1.0) + uSnareHit * 0.5;

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const ray = new THREE.Mesh(geometry, material);
      const angle = (i / rayCount) * Math.PI * 2;
      ray.position.set(Math.cos(angle) * 15, 25, Math.sin(angle) * 15);
      ray.rotation.x = -0.3;
      ray.rotation.z = angle;
      ray.name = `lightRay_${i}`;

      this._addObject(ray);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
      });
    }
  }

  _createContrastParticles() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Alternating black and white
      const intensity = Math.random() > 0.5 ? 1.0 : 0.0;
      colors[i3] = intensity;
      colors[i3 + 1] = intensity;
      colors[i3 + 2] = intensity;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'contrastParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3 + 1] += Math.sin(elapsed * 0.5 + i * 0.01) * 0.02;
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }
}

window.HighContrastEnvironment = HighContrastEnvironment;
