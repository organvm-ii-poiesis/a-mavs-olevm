/**
 * @file WaveformEnv.js
 * @description Audio waveform visualization as 3D landscape environment
 * Creates terrain from time-domain waveform, colors from frequency spectrum
 * Player walks through the evolving audio waveform
 *
 * Inspired by: Music visualizers (Winamp, milkdrop), audio editors, demoscene
 *
 * Color palette mood: Dynamic frequency-based gradient mapping
 * - Low frequencies (bass): Palette color 0 (often deep/warm)
 * - Mid frequencies: Palette colors 1-2 (transitions)
 * - High frequencies (treble): Palette color 3 (often bright/cool)
 *
 * @class WaveformEnvironment
 * @extends EnvironmentBase
 */

'use strict';

/**
 * WaveformEnvironment - Audio waveform terrain visualization
 * @class
 * @extends EnvironmentBase
 */
class WaveformEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {OGODAudioEngine} [options.audioEngine] - Optional audio engine for live data
   */
  constructor(options = {}) {
    super(options);

    this.audioEngine = options.audioEngine || null;

    // Waveform terrain configuration
    this.terrainWidth = 100;
    this.terrainDepth = 200;
    this.terrainSegmentsX = 128;
    this.terrainSegmentsZ = 256;
    this.heightScale = 15;

    // Frequency bands for coloring
    this.frequencyBands = 64;

    // Mobile detection for reduced complexity
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.terrainSegmentsX = 64;
      this.terrainSegmentsZ = 128;
      this.frequencyBands = 32;
    }

    // Simulated audio data (when no real audio engine)
    this.waveformData = new Float32Array(this.terrainSegmentsX);
    this.frequencyData = new Float32Array(this.frequencyBands);

    // Animation state
    this.waveOffset = 0;
    this.scrollSpeed = 5;
  }

  /**
   * Initialize the waveform environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Set background based on darkest palette color
    const bgColor = this._getDarkenedColor(this.colors[0], 0.2);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.008);

    // Create waveform terrain mesh
    this._createWaveformTerrain();

    // Create frequency spectrum bars
    this._createFrequencyBars();

    // Create ambient particles
    this._createWaveParticles();

    // Create sky gradient dome
    this._createSkyDome();

    // Create horizon glow
    this._createHorizonGlow();

    // Ambient light
    const ambient = this._createAmbientLight(0.4);
    this._addObject(ambient);

    // Add directional light for terrain shading
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(0, 50, -50);
    this._addObject(directional);

    this.isInitialized = true;
  }

  /**
   * Darken a color by a factor
   * @private
   * @param {THREE.Color} color
   * @param {number} factor - 0-1 (0 = black, 1 = original)
   * @returns {THREE.Color}
   */
  _getDarkenedColor(color, factor) {
    return new THREE.Color(
      color.r * factor,
      color.g * factor,
      color.b * factor
    );
  }

  /**
   * Create the main waveform terrain
   * @private
   */
  _createWaveformTerrain() {
    const geometry = new THREE.PlaneGeometry(
      this.terrainWidth,
      this.terrainDepth,
      this.terrainSegmentsX - 1,
      this.terrainSegmentsZ - 1
    );

    // Create custom shader material for audio-reactive terrain
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: this.colors[0] },
        uColor2: { value: this.colors[1] },
        uColor3: { value: this.colors[2] || this.colors[0] },
        uColor4: { value: this.colors[3] || this.colors[1] },
        uHeightScale: { value: this.heightScale },
        uScrollOffset: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uHeightScale;
        uniform float uScrollOffset;
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uHighLevel;

        varying vec2 vUv;
        varying float vHeight;
        varying float vFrequency;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                              -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                                  dot(x12.zw, x12.zw)), 0.0);
          m = m * m; m = m * m;
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

        void main() {
          vUv = uv;

          vec3 pos = position;

          // Calculate scrolling position
          float scrolledZ = uv.y + uScrollOffset;

          // Create waveform height based on multiple noise layers
          float wave1 = snoise(vec2(uv.x * 4.0, scrolledZ * 2.0 + uTime * 0.1)) * 0.5;
          float wave2 = snoise(vec2(uv.x * 8.0, scrolledZ * 4.0 + uTime * 0.2)) * 0.25;
          float wave3 = snoise(vec2(uv.x * 16.0, scrolledZ * 8.0 + uTime * 0.3)) * 0.125;

          // Base waveform
          float baseWave = wave1 + wave2 + wave3;

          // Audio-reactive modulation
          float bassWave = sin(scrolledZ * 3.0 + uTime) * uBassLevel * 0.5;
          float midWave = sin(uv.x * 8.0 + scrolledZ * 6.0 + uTime * 1.5) * uMidLevel * 0.3;
          float highWave = sin(uv.x * 20.0 + scrolledZ * 15.0 + uTime * 2.0) * uHighLevel * 0.15;

          float totalHeight = baseWave + bassWave + midWave + highWave;
          pos.z = totalHeight * uHeightScale;

          vHeight = totalHeight;

          // Calculate frequency band for coloring based on x position
          vFrequency = uv.x;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;
        uniform float uTime;
        uniform float uBassLevel;

        varying vec2 vUv;
        varying float vHeight;
        varying float vFrequency;

        void main() {
          // Map frequency to color gradient
          vec3 color;
          float freq = vFrequency;

          if (freq < 0.33) {
            color = mix(uColor1, uColor2, freq * 3.0);
          } else if (freq < 0.66) {
            color = mix(uColor2, uColor3, (freq - 0.33) * 3.0);
          } else {
            color = mix(uColor3, uColor4, (freq - 0.66) * 3.0);
          }

          // Height-based brightness
          float brightness = 0.5 + vHeight * 0.5;
          color *= brightness;

          // Add glow based on height peaks
          float glow = smoothstep(0.3, 0.8, vHeight) * 0.3;
          color += glow * uColor4;

          // Audio-reactive pulse
          float pulse = 0.9 + uBassLevel * 0.2;
          color *= pulse;

          // Distance fade
          float fade = smoothstep(1.0, 0.0, vUv.y);
          float alpha = 0.7 + fade * 0.3;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -5;
    terrain.position.z = -this.terrainDepth / 2;
    terrain.name = 'waveformTerrain';

    this._addObject(terrain);

    // Store reference for animation
    this.terrainMaterial = material;

    // Animate terrain
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uScrollOffset.value = elapsed * 0.05;

      // Simulate audio levels if no real audio engine
      if (!this.audioEngine) {
        const bass = 0.3 + Math.sin(elapsed * 0.8) * 0.3;
        const mid = 0.4 + Math.sin(elapsed * 1.2 + 1.0) * 0.3;
        const high = 0.3 + Math.sin(elapsed * 2.0 + 2.0) * 0.2;

        material.uniforms.uBassLevel.value = bass;
        material.uniforms.uMidLevel.value = mid;
        material.uniforms.uHighLevel.value = high;
      }
    });
  }

  /**
   * Create frequency spectrum visualization bars
   * @private
   */
  _createFrequencyBars() {
    const barCount = this.isMobile ? 16 : 32;
    const barWidth = this.terrainWidth / barCount;
    const maxHeight = 20;

    for (let i = 0; i < barCount; i++) {
      const colorIndex = Math.floor((i / barCount) * this.colors.length);
      const color = this.colors[colorIndex % this.colors.length];

      const geometry = new THREE.BoxGeometry(barWidth * 0.8, 1, barWidth * 0.8);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uIndex: { value: i },
          uBarCount: { value: barCount },
          uMaxHeight: { value: maxHeight },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uIndex;
          uniform float uBarCount;
          uniform float uMaxHeight;

          varying vec3 vNormal;
          varying float vHeight;

          void main() {
            vNormal = normalize(normalMatrix * normal);

            vec3 pos = position;

            // Audio-reactive height based on frequency band
            float freq = uIndex / uBarCount;
            float wave = sin(uTime * 2.0 + freq * 6.28) * 0.5 + 0.5;
            float height = wave * uMaxHeight;

            // Scale in Y
            pos.y *= height;
            pos.y += height * 0.5;

            vHeight = height / uMaxHeight;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;

          varying vec3 vNormal;
          varying float vHeight;

          void main() {
            // Rim lighting effect
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

            // Height-based glow
            float glow = vHeight * 0.5;

            vec3 color = uColor * (0.8 + rim * 0.4 + glow);

            // Pulse effect
            float pulse = 0.8 + sin(uTime * 3.0) * 0.2;
            color *= pulse;

            gl_FragColor = vec4(color, 0.8 + vHeight * 0.2);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = (i - barCount / 2) * barWidth + barWidth / 2;
      bar.position.y = -4;
      bar.position.z = 20;
      bar.name = `frequencyBar_${i}`;

      this._addObject(bar);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
      });
    }
  }

  /**
   * Create ambient particles that react to audio
   * @private
   */
  _createWaveParticles() {
    const count = this.isMobile ? 500 : 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randomness = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * this.terrainWidth * 1.5;
      positions[i3 + 1] = Math.random() * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * this.terrainDepth;

      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.1 + Math.random() * 0.4;
      randomness[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomness, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBassLevel: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;

        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uBassLevel;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          vec3 pos = position;

          // Audio-reactive movement
          float audioOffset = uBassLevel * 2.0;
          pos.y += sin(uTime * 0.5 + aRandom * 10.0) * (2.0 + audioOffset);
          pos.x += cos(uTime * 0.3 + aRandom * 5.0) * 1.5;
          pos.z += sin(uTime * 0.2 + aRandom * 8.0) * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size based on distance and audio
          float sizeMultiplier = 1.0 + uBassLevel * 0.5;
          gl_PointSize = size * uPixelRatio * sizeMultiplier * (200.0 / -mvPosition.z);

          // Alpha based on position and movement
          float distanceFade = smoothstep(80.0, 20.0, -mvPosition.z);
          vAlpha = distanceFade * (0.4 + 0.3 * sin(uTime * 0.5 + aRandom * 6.28));
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'waveParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;

      // Simulate bass level if no audio engine
      if (!this.audioEngine) {
        material.uniforms.uBassLevel.value =
          0.3 + Math.sin(elapsed * 0.8) * 0.3;
      }
    });
  }

  /**
   * Create gradient sky dome
   * @private
   */
  _createSkyDome() {
    const geometry = new THREE.SphereGeometry(150, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: {
          value: this._getDarkenedColor(this.colors[3] || this.colors[0], 0.3),
        },
        uBottomColor: { value: this._getDarkenedColor(this.colors[0], 0.1) },
        uTime: { value: 0 },
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
        uniform float uTime;

        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, min(1.0, (h + 0.5) * 0.5));

          vec3 color = mix(uBottomColor, uTopColor, t);

          // Subtle animated gradient
          float wave = sin(vWorldPosition.x * 0.02 + uTime * 0.1) * 0.02;
          color += wave;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyDome = new THREE.Mesh(geometry, material);
    skyDome.name = 'skyDome';

    this._addObject(skyDome);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create horizon glow effect
   * @private
   */
  _createHorizonGlow() {
    const geometry = new THREE.PlaneGeometry(200, 40);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: this.colors[1] },
        uColor2: { value: this.colors[2] || this.colors[0] },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          float gradient = smoothstep(0.0, 1.0, vUv.y);
          vec3 color = mix(uColor1, uColor2, gradient);

          float pulse = 0.5 + 0.5 * sin(uTime * 0.5);
          float alpha = (1.0 - gradient) * 0.2 * pulse;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glow = new THREE.Mesh(geometry, material);
    glow.position.y = -5;
    glow.position.z = -this.terrainDepth / 2 - 20;
    glow.name = 'horizonGlow';

    this._addObject(glow);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Update audio levels from external audio engine
   * @param {Object} levels - Audio level data
   * @param {number} levels.bass - Bass level (0-1)
   * @param {number} levels.mid - Mid level (0-1)
   * @param {number} levels.high - High level (0-1)
   */
  setAudioLevels(levels) {
    if (this.terrainMaterial) {
      this.terrainMaterial.uniforms.uBassLevel.value = levels.bass || 0;
      this.terrainMaterial.uniforms.uMidLevel.value = levels.mid || 0;
      this.terrainMaterial.uniforms.uHighLevel.value = levels.high || 0;
    }
  }
}

// Export for global scope
window.WaveformEnvironment = WaveformEnvironment;
