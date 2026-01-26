/**
 * @file IsoGridEnv.js
 * @description Isometric grid environment with audio-reactive columns
 * Creates a grid of blocks that rise and fall based on audio frequencies
 * Retro game aesthetic inspired by Q*bert, Monument Valley, and classic arcade games
 *
 * Inspired by: Q*bert, Monument Valley, isometric puzzle games, voxel art
 *
 * Color palette mood: Retro arcade neon meets puzzle game pastels
 * - Columns colored by position in grid (creates rainbow gradient effect)
 * - Height determines brightness and glow intensity
 * - Audio-reactive color pulsing
 *
 * Camera: Supports both 45-degree isometric view and free-roam first-person
 *
 * @class IsoGridEnvironment
 * @extends EnvironmentBase
 */

'use strict';

/**
 * IsoGridEnvironment - Isometric audio-reactive grid
 * @class
 * @extends EnvironmentBase
 */
class IsoGridEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {OGODAudioEngine} [options.audioEngine] - Optional audio engine for live data
   */
  constructor(options = {}) {
    super(options);

    this.audioEngine = options.audioEngine || null;

    // Grid configuration
    this.gridSizeX = 20;
    this.gridSizeZ = 20;
    this.blockSize = 2;
    this.blockSpacing = 0.2;
    this.maxBlockHeight = 15;
    this.minBlockHeight = 0.5;

    // Mobile detection for reduced complexity
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.gridSizeX = 12;
      this.gridSizeZ = 12;
    }

    // Store block references for animation
    this.blocks = [];
    this.blockMaterials = [];

    // Audio levels
    this.bassLevel = 0;
    this.midLevel = 0;
    this.highLevel = 0;
  }

  /**
   * Initialize the isometric grid environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Set dark background for neon effect
    const bgColor = new THREE.Color(0x0a0a12);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.015);

    // Create the isometric grid of blocks
    this._createBlockGrid();

    // Create floor grid lines
    this._createGridLines();

    // Create ambient glow effects
    this._createAmbientGlow();

    // Create floating particles
    this._createFloatingParticles();

    // Create sky gradient
    this._createSkyGradient();

    // Lighting
    const ambient = this._createAmbientLight(0.3);
    this._addObject(ambient);

    // Add directional light for block shadows
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(10, 30, 10);
    this._addObject(directional);

    // Add point lights at corners for colorful illumination
    this._createCornerLights();

    this.isInitialized = true;
  }

  /**
   * Create the main grid of audio-reactive blocks
   * @private
   */
  _createBlockGrid() {
    const totalWidth = this.gridSizeX * (this.blockSize + this.blockSpacing);
    const totalDepth = this.gridSizeZ * (this.blockSize + this.blockSpacing);
    const offsetX = -totalWidth / 2 + this.blockSize / 2;
    const offsetZ = -totalDepth / 2 + this.blockSize / 2;

    // Note: Using individual meshes instead of instanced mesh for per-block animation control
    // This allows fine-grained per-block animations. For larger grids, consider instanced mesh
    // with custom attributes for better performance.

    // Create individual blocks for animation control
    for (let x = 0; x < this.gridSizeX; x++) {
      for (let z = 0; z < this.gridSizeZ; z++) {
        const colorIndex = (x + z) % this.colors.length;
        const color = this.colors[colorIndex];

        const blockGeom = new THREE.BoxGeometry(
          this.blockSize,
          1,
          this.blockSize
        );
        const blockMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.1,
          roughness: 0.3,
          metalness: 0.7,
        });

        const block = new THREE.Mesh(blockGeom, blockMat);
        const posX = offsetX + x * (this.blockSize + this.blockSpacing);
        const posZ = offsetZ + z * (this.blockSize + this.blockSpacing);

        block.position.set(posX, 0, posZ);
        block.userData = {
          gridX: x,
          gridZ: z,
          baseY: 0,
          targetHeight: this.minBlockHeight,
          currentHeight: this.minBlockHeight,
          phaseOffset: (x + z) * 0.3,
          frequencyBand: (x / this.gridSizeX + z / this.gridSizeZ) / 2,
        };

        block.name = `block_${x}_${z}`;

        this._addObject(block);
        this.blocks.push(block);
        this.blockMaterials.push(blockMat);
      }
    }

    // Animate all blocks
    this._onAnimate((delta, elapsed) => {
      this._updateBlocks(elapsed);
    });
  }

  /**
   * Update block heights based on audio and time
   * @private
   * @param {number} elapsed - Elapsed time
   */
  _updateBlocks(elapsed) {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const mat = this.blockMaterials[i];
      const data = block.userData;

      // Calculate target height based on audio levels and position
      const freqBand = data.frequencyBand;
      let audioInfluence = 0;

      // Map frequency bands to audio levels
      if (freqBand < 0.33) {
        audioInfluence = this.bassLevel * (1 - freqBand * 3);
      } else if (freqBand < 0.66) {
        audioInfluence = this.midLevel;
      } else {
        audioInfluence = this.highLevel * (freqBand - 0.66) * 3;
      }

      // Add wave animation
      const wave = Math.sin(elapsed * 1.5 + data.phaseOffset) * 0.5 + 0.5;

      // Calculate target height
      const targetHeight =
        this.minBlockHeight +
        (this.maxBlockHeight - this.minBlockHeight) *
          (wave * 0.4 + audioInfluence * 0.6);

      // Smooth interpolation
      data.currentHeight += (targetHeight - data.currentHeight) * 0.1;

      // Apply height
      block.scale.y = data.currentHeight;
      block.position.y = data.currentHeight / 2;

      // Update emissive based on height
      const emissiveIntensity =
        0.05 + (data.currentHeight / this.maxBlockHeight) * 0.25;
      mat.emissiveIntensity = emissiveIntensity;
    }
  }

  /**
   * Create grid lines on the floor
   * @private
   */
  _createGridLines() {
    const gridSize =
      Math.max(this.gridSizeX, this.gridSizeZ) *
      (this.blockSize + this.blockSpacing);
    const divisions = Math.max(this.gridSizeX, this.gridSizeZ);

    // Create main grid
    const gridHelper = new THREE.GridHelper(
      gridSize,
      divisions,
      this.colors[0].getHex(),
      this.colors[1].getHex()
    );
    gridHelper.position.y = -0.1;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;

    this._addObject(gridHelper);

    // Add glowing edge lines
    const edgeGeometry = new THREE.BufferGeometry();
    const edgePositions = [];
    const halfSize = gridSize / 2;

    // Outer boundary
    edgePositions.push(-halfSize, 0, -halfSize);
    edgePositions.push(halfSize, 0, -halfSize);
    edgePositions.push(halfSize, 0, -halfSize);
    edgePositions.push(halfSize, 0, halfSize);
    edgePositions.push(halfSize, 0, halfSize);
    edgePositions.push(-halfSize, 0, halfSize);
    edgePositions.push(-halfSize, 0, halfSize);
    edgePositions.push(-halfSize, 0, -halfSize);

    edgeGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(edgePositions, 3)
    );

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: this.colors[2] || this.colors[0],
      transparent: true,
      opacity: 0.6,
    });

    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.position.y = 0.01;
    edgeLines.name = 'gridEdges';

    this._addObject(edgeLines);
  }

  /**
   * Create ambient glow planes under the grid
   * @private
   */
  _createAmbientGlow() {
    const glowCount = 4;
    const gridSize =
      Math.max(this.gridSizeX, this.gridSizeZ) *
      (this.blockSize + this.blockSpacing);

    for (let i = 0; i < glowCount; i++) {
      const color = this.colors[i % this.colors.length];

      const geometry = new THREE.PlaneGeometry(gridSize * 0.8, gridSize * 0.8);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uIndex: { value: i },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uIndex;
          varying vec2 vUv;

          void main() {
            float dist = length(vUv - vec2(0.5));
            float alpha = smoothstep(0.5, 0.0, dist) * 0.15;

            float pulse = 0.5 + 0.5 * sin(uTime * 0.8 + uIndex * 1.57);
            alpha *= pulse;

            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const glow = new THREE.Mesh(geometry, material);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.5 - i * 0.5;
      glow.name = `ambientGlow_${i}`;

      this._addObject(glow);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
      });
    }
  }

  /**
   * Create floating particles around the grid
   * @private
   */
  _createFloatingParticles() {
    const count = this.isMobile ? 300 : 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const gridSize =
      Math.max(this.gridSizeX, this.gridSizeZ) *
      (this.blockSize + this.blockSpacing);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * gridSize * 1.5;
      positions[i3 + 1] = Math.random() * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * gridSize * 1.5;

      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.1 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.1) * 2.0;
          pos.x += cos(uTime * 0.3 + position.z * 0.1) * 1.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (150.0 / -mvPosition.z);

          vAlpha = smoothstep(60.0, 20.0, -mvPosition.z) * 0.6;
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
    particles.name = 'floatingParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create sky gradient dome
   * @private
   */
  _createSkyGradient() {
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x0a0a20) },
        uBottomColor: { value: new THREE.Color(0x000005) },
        uHorizonColor: { value: this.colors[0] },
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
        uniform vec3 uHorizonColor;
        uniform float uTime;

        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;

          vec3 color;
          if (h > 0.0) {
            color = mix(uHorizonColor * 0.1, uTopColor, h);
          } else {
            color = mix(uHorizonColor * 0.1, uBottomColor, -h);
          }

          // Add subtle horizon glow
          float horizonGlow = exp(-abs(h) * 5.0) * 0.15;
          color += uHorizonColor * horizonGlow;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const sky = new THREE.Mesh(geometry, material);
    sky.name = 'skyGradient';

    this._addObject(sky);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create colored point lights at grid corners
   * @private
   */
  _createCornerLights() {
    const gridSize =
      Math.max(this.gridSizeX, this.gridSizeZ) *
      (this.blockSize + this.blockSpacing);
    const halfSize = gridSize / 2;

    const corners = [
      { x: -halfSize, z: -halfSize },
      { x: halfSize, z: -halfSize },
      { x: halfSize, z: halfSize },
      { x: -halfSize, z: halfSize },
    ];

    corners.forEach((corner, i) => {
      const color = this.colors[i % this.colors.length];
      const light = new THREE.PointLight(color, 0.8, 50);
      light.position.set(corner.x, 10, corner.z);
      light.name = `cornerLight_${i}`;

      this._addObject(light);

      // Animate light intensity
      this._onAnimate((delta, elapsed) => {
        light.intensity = 0.5 + Math.sin(elapsed * 0.8 + i * 1.57) * 0.3;
      });
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
    this.bassLevel = levels.bass || 0;
    this.midLevel = levels.mid || 0;
    this.highLevel = levels.high || 0;
  }
}

// Export for global scope
window.IsoGridEnvironment = IsoGridEnvironment;
