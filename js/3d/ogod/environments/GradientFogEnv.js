/**
 * @file GradientFogEnv.js
 * @description Gradient fog environment for OGOD tracks
 * Creates volumetric color zones with soft particles and flowing fog
 * Used for: Animal Crossing (1), Goldeneye (10), Luigi's Mansion (14), Wind Waker (28)
 * Supports audio-reactive visual effects
 */

'use strict';

/**
 * GradientFogEnvironment - Soft gradient fog world with audio reactivity
 * @class
 * @extends EnvironmentBase
 */
class GradientFogEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {Object} [options.audioUniforms] - Audio-reactive uniform objects
   */
  constructor(options = {}) {
    super(options);

    this.fogDensity = 0.02;
    this.particleCount = 2000;
    this.zoneRadius = 20;
  }

  /**
   * Initialize the gradient fog environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Create gradient sky dome
    this._createSkyDome();

    // Create volumetric fog zones at cardinal positions
    this._createFogZones();

    // Create floating particles (dust/pollen effect)
    this._createAtmosphericParticles();

    // Create subtle ground gradient
    this._createGradientGround();

    // Create angled fog planes for depth
    this._createFogPlanes();

    // Add ambient light
    const ambient = this._createAmbientLight(0.6);
    this._addObject(ambient);

    this.isInitialized = true;
  }

  /**
   * Create gradient sky dome with audio reactivity
   * @private
   */
  _createSkyDome() {
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const audioUniforms = this._getAudioUniforms();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: this.colors[0] },
        uBottomColor: { value: this.colors[1] },
        uMidColor: { value: this.colors[2] || this.colors[0] },
        uOffset: { value: 0.5 },
        uExponent: { value: 0.6 },
        uTime: { value: 0 },
        // Audio-reactive uniforms
        uBassLevel: audioUniforms.uBassLevel,
        uMidLevel: audioUniforms.uMidLevel,
        uTrebleLevel: audioUniforms.uTrebleLevel,
        uKickHit: audioUniforms.uKickHit,
        uEnergy: audioUniforms.uEnergy,
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform vec3 uMidColor;
        uniform float uOffset;
        uniform float uExponent;
        uniform float uTime;

        // Audio-reactive uniforms
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uTrebleLevel;
        uniform float uKickHit;
        uniform float uEnergy;

        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, min(1.0, (h + uOffset) * 0.5));
          t = pow(t, uExponent);

          // Create gradient with middle color band
          vec3 color;
          if (t < 0.5) {
            color = mix(uBottomColor, uMidColor, t * 2.0);
          } else {
            color = mix(uMidColor, uTopColor, (t - 0.5) * 2.0);
          }

          // Add subtle time-based variation
          float wave = sin(vWorldPosition.x * 0.02 + uTime * 0.1) * 0.02;
          color += wave;

          // Audio-reactive color shift
          // Bass boosts warm colors (bottom), treble boosts cool colors (top)
          color += uBassLevel * 0.15 * uBottomColor;
          color += uTrebleLevel * 0.1 * uTopColor;

          // Kick causes brief brightness pulse
          color *= 1.0 + uKickHit * 0.2;

          // Energy affects overall saturation
          float saturationBoost = 1.0 + uEnergy * 0.2;
          vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
          color = mix(gray, color, saturationBoost);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyDome = new THREE.Mesh(geometry, material);
    skyDome.name = 'skyDome';
    this._addObject(skyDome);

    // Animate sky
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create volumetric fog zones at positions
   * @private
   */
  _createFogZones() {
    const positions = [
      { x: -25, y: 0, z: 0 },
      { x: 25, y: 0, z: 0 },
      { x: 0, y: 0, z: -25 },
      { x: 0, y: 0, z: 25 },
    ];

    positions.forEach((pos, i) => {
      const color = this.colors[i % this.colors.length];
      this._createFogZone(color, pos, i);
    });
  }

  /**
   * Create a single fog zone
   * @private
   * @param {THREE.Color} color
   * @param {Object} position
   * @param {number} index
   */
  _createFogZone(color, position, index) {
    // Create volumetric fog using layered transparent spheres
    const layers = 5;
    const baseRadius = this.zoneRadius;

    for (let i = 0; i < layers; i++) {
      const radius = baseRadius * (1 - i * 0.15);
      const opacity = 0.03 + i * 0.01;

      const geometry = new THREE.SphereGeometry(radius, 24, 24);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(position.x, position.y + 5, position.z);
      sphere.name = `fogZone_${index}_layer_${i}`;

      this._addObject(sphere);

      // Animate the fog zones
      const speed = 0.1 + index * 0.02;
      const offset = index * Math.PI * 0.5;

      this._onAnimate((delta, elapsed) => {
        sphere.position.y =
          position.y + 5 + Math.sin(elapsed * speed + offset) * 2;
        sphere.scale.setScalar(
          1 + Math.sin(elapsed * speed * 0.5 + offset) * 0.1
        );
      });
    }

    // Add glowing core with audio reactivity
    const coreGeometry = new THREE.SphereGeometry(3, 16, 16);
    const audioUniforms = this._getAudioUniforms();

    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color },
        uTime: { value: 0 },
        // Audio-reactive uniforms
        uBassLevel: audioUniforms.uBassLevel,
        uKickHit: audioUniforms.uKickHit,
        uBeatHit: audioUniforms.uBeatHit,
        uEnergy: audioUniforms.uEnergy,
      },
      vertexShader: `
        uniform float uBassLevel;
        uniform float uKickHit;

        varying vec3 vNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          // Audio-reactive scale - bass and kick expand the core
          float audioScale = 1.0 + uBassLevel * 0.3 + uKickHit * 0.5;
          vec3 scaledPosition = position * audioScale;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uBassLevel;
        uniform float uKickHit;
        uniform float uBeatHit;
        uniform float uEnergy;

        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = 0.5 + 0.5 * sin(uTime * 2.0);

          // Audio-reactive brightness
          float audioBrightness = 1.0 + uBassLevel * 0.4 + uKickHit * 0.6;

          // Beat hit causes flash
          float beatFlash = uBeatHit * 0.5;

          // Energy affects glow intensity
          float energyGlow = 0.3 + 0.2 * pulse + uEnergy * 0.3;

          vec3 finalColor = uColor * audioBrightness;
          finalColor += beatFlash;

          gl_FragColor = vec4(finalColor, intensity * energyGlow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(position.x, position.y + 5, position.z);
    core.name = `fogZoneCore_${index}`;

    this._addObject(core);

    this._onAnimate((delta, elapsed) => {
      coreMaterial.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create atmospheric particles with audio reactivity
   * @private
   */
  _createAtmosphericParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = this.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randomness = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spread particles in a large area
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      // Pick color from palette
      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.3 + 0.1;
      randomness[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomness, 1));

    const audioUniforms = this._getAudioUniforms();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        // Audio-reactive uniforms
        uBassLevel: audioUniforms.uBassLevel,
        uMidLevel: audioUniforms.uMidLevel,
        uTrebleLevel: audioUniforms.uTrebleLevel,
        uKickHit: audioUniforms.uKickHit,
        uSnareHit: audioUniforms.uSnareHit,
        uEnergy: audioUniforms.uEnergy,
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;

        uniform float uTime;
        uniform float uPixelRatio;

        // Audio-reactive uniforms
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uTrebleLevel;
        uniform float uKickHit;
        uniform float uSnareHit;
        uniform float uEnergy;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vAudioBrightness;

        void main() {
          vColor = color;  // 'color' is injected by Three.js from buffer attribute

          vec3 pos = position;

          // Floating animation - speed influenced by energy
          float floatSpeed = (0.2 + aRandom * 0.3) * (1.0 + uEnergy * 0.5);
          pos.y += sin(uTime * floatSpeed + aRandom * 10.0) * 2.0;
          pos.x += cos(uTime * floatSpeed * 0.5 + aRandom * 5.0) * 1.0;

          // Audio-reactive displacement
          // Bass causes vertical bounce, treble causes horizontal spread
          pos.y += uBassLevel * 3.0 * sin(aRandom * 6.28);
          pos.x += uTrebleLevel * 2.0 * cos(aRandom * 6.28 + uTime);

          // Kick hit causes outward explosion
          float kickDisplace = uKickHit * 5.0;
          pos += normalize(position) * kickDisplace * aRandom;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size reacts to audio - bass makes particles larger
          float audioSize = size * (1.0 + uBassLevel * 0.5 + uKickHit * 0.8);
          gl_PointSize = audioSize * uPixelRatio * (200.0 / -mvPosition.z);

          // Fade based on distance and animation
          float distanceFade = smoothstep(50.0, 10.0, -mvPosition.z);
          vAlpha = distanceFade * (0.5 + 0.5 * sin(uTime * 0.5 + aRandom * 6.28));

          // Pass audio brightness to fragment shader
          vAudioBrightness = 1.0 + uMidLevel * 0.3 + uSnareHit * 0.5;
        }
      `,
      fragmentShader: `
        uniform float uKickHit;
        uniform float uEnergy;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vAudioBrightness;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;

          // Apply audio brightness
          vec3 brightColor = vColor * vAudioBrightness;

          // Energy increases opacity
          alpha *= (1.0 + uEnergy * 0.3);

          // Kick creates flash effect
          brightColor += uKickHit * 0.3;

          gl_FragColor = vec4(brightColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'atmosphericParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create gradient ground plane with audio reactivity
   * @private
   */
  _createGradientGround() {
    const geometry = new THREE.PlaneGeometry(200, 200, 64, 64);
    const audioUniforms = this._getAudioUniforms();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: this.colors[0] },
        uColor2: { value: this.colors[1] },
        uTime: { value: 0 },
        // Audio-reactive uniforms
        uBassLevel: audioUniforms.uBassLevel,
        uMidLevel: audioUniforms.uMidLevel,
        uKickHit: audioUniforms.uKickHit,
        uEnergy: audioUniforms.uEnergy,
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        uniform float uTime;
        uniform float uBassLevel;
        uniform float uKickHit;

        void main() {
          vUv = uv;
          vPosition = position;

          vec3 pos = position;

          // Subtle wave animation - amplitude influenced by bass
          float waveAmplitude = 0.5 + uBassLevel * 2.0;
          pos.z = sin(position.x * 0.05 + uTime * 0.2) * waveAmplitude +
                  cos(position.y * 0.05 + uTime * 0.15) * waveAmplitude;

          // Kick creates ripple from center
          float distFromCenter = length(position.xy);
          float kickRipple = uKickHit * sin(distFromCenter * 0.1 - uTime * 5.0) * 2.0;
          pos.z += kickRipple * smoothstep(50.0, 0.0, distFromCenter);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uKickHit;
        uniform float uEnergy;

        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Radial gradient from center
          float dist = length(vUv - vec2(0.5)) * 2.0;

          vec3 color = mix(uColor1, uColor2, dist);

          // Add subtle pattern - speed influenced by energy
          float patternSpeed = 0.1 + uEnergy * 0.2;
          float pattern = sin(vPosition.x * 0.1 + uTime * patternSpeed) *
                         cos(vPosition.y * 0.1 + uTime * patternSpeed * 0.75) * 0.5 + 0.5;
          color = mix(color, uColor1, pattern * 0.1);

          // Audio-reactive color shift
          color += uBassLevel * 0.1 * uColor2;
          color += uMidLevel * 0.05 * uColor1;

          // Kick creates brightness pulse
          color *= 1.0 + uKickHit * 0.3;

          // Fade at edges
          float alpha = smoothstep(1.0, 0.5, dist) * (0.5 + uEnergy * 0.2);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.name = 'teleportFloor';

    // Store reference for VR teleport
    this.floorMesh = ground;

    this._addObject(ground);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create angled fog planes for parallax depth
   * @private
   */
  _createFogPlanes() {
    const planeCount = 6;

    for (let i = 0; i < planeCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const geometry = new THREE.PlaneGeometry(80, 40);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.08 - i * 0.01,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const plane = new THREE.Mesh(geometry, material);

      // Position at varying depths and angles
      const angle = (i / planeCount) * Math.PI * 2;
      const distance = 30 + i * 5;
      plane.position.x = Math.cos(angle) * distance;
      plane.position.z = Math.sin(angle) * distance;
      plane.position.y = 10 + Math.random() * 10;
      plane.rotation.y = angle + Math.PI / 2;
      plane.rotation.x = (Math.random() - 0.5) * 0.3;
      plane.name = `fogPlane_${i}`;

      this._addObject(plane);

      // Gentle sway animation
      const swaySpeed = 0.1 + Math.random() * 0.1;
      const swayAmount = 0.05 + Math.random() * 0.05;

      this._onAnimate((delta, elapsed) => {
        plane.rotation.z = Math.sin(elapsed * swaySpeed) * swayAmount;
        plane.position.y = 10 + i * 2 + Math.sin(elapsed * swaySpeed * 0.5) * 2;
      });
    }
  }
}

// Export for global scope
window.GradientFogEnvironment = GradientFogEnvironment;
