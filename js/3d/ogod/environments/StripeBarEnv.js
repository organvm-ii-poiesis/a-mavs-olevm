/**
 * @file StripeBarEnv.js
 * @description Stripe/bar environment for OGOD tracks
 * Creates extruded planes and ribbon geometry with parallax motion
 * Used for: Chrono Trigger (3), Stickerbush DKC2 (5), Metroid (18)
 * Supports audio-reactive visual effects
 *
 * Performance Optimizations:
 * - Uses InstancedMesh for vertical bars (30 bars -> 1 draw call)
 * - Uses InstancedMesh for scanlines (20 lines -> 1 draw call)
 * - Per-instance animation via instance attributes
 * - Draw calls reduced from ~60 to ~5
 */

'use strict';

/**
 * StripeBarEnvironment - Parallel stripe and bar world with audio reactivity
 * @class
 * @extends EnvironmentBase
 */
class StripeBarEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {Object} [options.audioUniforms] - Audio-reactive uniform objects
   */
  constructor(options = {}) {
    super(options);
    this.barCount = 30;
    this.barHeight = 50;
    this.barSpacing = 4;

    // Listen for quality changes
    this._qualityChangeHandler = this._onQualityChange.bind(this);
    window.addEventListener('qualitychange', this._qualityChangeHandler);
  }

  /**
   * Handle quality preset changes
   * @private
   */
  _onQualityChange(event) {
    const preset = event.detail.preset;
    // Adjust particle count based on quality
    if (preset && this._particleMaterial) {
      this._particleMaterial.opacity = preset.particleMultiplier || 0.8;
    }
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create vertical stripe bars using instancing
    this._createInstancedVerticalBars();

    // Create horizontal scanlines using instancing
    this._createInstancedScanlines();

    // Create floating ribbon geometry
    this._createRibbons();

    // Create glitch particles
    this._createGlitchParticles();

    // Ambient light
    const ambient = this._createAmbientLight(0.4);
    this._addObject(ambient);

    // Invisible floor for VR teleport
    const floor = this._createGround({ opacity: 0 });
    this._addObject(floor);

    this.isInitialized = true;
  }

  /**
   * Create instanced vertical bars
   * Performance: 30 bars = 1 draw call instead of 30
   * @private
   */
  _createInstancedVerticalBars() {
    // Create base box geometry at unit size
    const geometry = new THREE.BoxGeometry(1, 1, 0.5);

    // Instance attributes
    const speeds = new Float32Array(this.barCount);
    const offsets = new Float32Array(this.barCount);
    const widths = new Float32Array(this.barCount);
    const opacities = new Float32Array(this.barCount);
    const baseZ = new Float32Array(this.barCount);

    for (let i = 0; i < this.barCount; i++) {
      speeds[i] = 0.2 + Math.random() * 0.3;
      offsets[i] = i * 0.1;
      widths[i] = 0.5 + Math.random() * 1.5;
      opacities[i] = 0.6 + Math.random() * 0.4;
      baseZ[i] = -20 + (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute(
      'aSpeed',
      new THREE.InstancedBufferAttribute(speeds, 1)
    );
    geometry.setAttribute(
      'aOffset',
      new THREE.InstancedBufferAttribute(offsets, 1)
    );
    geometry.setAttribute(
      'aWidth',
      new THREE.InstancedBufferAttribute(widths, 1)
    );
    geometry.setAttribute(
      'aOpacity',
      new THREE.InstancedBufferAttribute(opacities, 1)
    );
    geometry.setAttribute(
      'aBaseZ',
      new THREE.InstancedBufferAttribute(baseZ, 1)
    );

    // Get audio uniforms for reactivity
    const audioUniforms = this._getAudioUniforms();

    // Instanced shader material with audio reactivity
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColors: { value: this.colors },
        uBarHeight: { value: this.barHeight },
        // Audio-reactive uniforms
        uBassLevel: audioUniforms.uBassLevel,
        uMidLevel: audioUniforms.uMidLevel,
        uKickHit: audioUniforms.uKickHit,
        uSnareHit: audioUniforms.uSnareHit,
        uEnergy: audioUniforms.uEnergy,
      },
      vertexShader: `
        attribute float aSpeed;
        attribute float aOffset;
        attribute float aWidth;
        attribute float aOpacity;
        attribute float aBaseZ;

        uniform float uTime;
        uniform float uBarHeight;
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uKickHit;
        uniform float uEnergy;

        varying float vOpacity;
        varying float vColorIndex;
        varying float vAudioBrightness;

        void main() {
          vColorIndex = mod(float(gl_InstanceID), 4.0);
          vOpacity = aOpacity;

          // Scale position by width and height
          vec3 scaledPos = position;
          scaledPos.x *= aWidth;
          scaledPos.y *= uBarHeight;

          // Get base position from instance matrix
          vec4 worldPos = instanceMatrix * vec4(scaledPos, 1.0);

          // Wave motion animation - speed influenced by energy
          float animSpeed = aSpeed * (1.0 + uEnergy * 0.5);
          float wave = sin(uTime * animSpeed + aOffset) * 5.0;
          worldPos.z = aBaseZ + wave;

          // Audio-reactive scaling - bass pulses bar height
          float bassScale = 1.0 + uBassLevel * 0.2 + uKickHit * 0.3;
          float scaleAnim = bassScale + sin(uTime * aSpeed * 0.5 + aOffset) * 0.1;
          worldPos.y *= scaleAnim;

          // Kick causes horizontal push based on instance index
          float kickPush = uKickHit * sin(float(gl_InstanceID) * 0.3) * 2.0;
          worldPos.x += kickPush;

          // Audio brightness for fragment shader
          vAudioBrightness = 1.0 + uMidLevel * 0.3 + uKickHit * 0.4;

          gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColors[4];
        uniform float uSnareHit;

        varying float vOpacity;
        varying float vColorIndex;
        varying float vAudioBrightness;

        void main() {
          vec3 color;
          int idx = int(vColorIndex);
          if (idx == 0) color = uColors[0];
          else if (idx == 1) color = uColors[1];
          else if (idx == 2) color = uColors[2];
          else color = uColors[3];

          // Apply audio brightness
          color *= vAudioBrightness;

          // Snare creates color flash
          color += uSnareHit * 0.3;

          gl_FragColor = vec4(color, vOpacity);
        }
      `,
      transparent: true,
    });

    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.barCount
    );
    instancedMesh.name = 'verticalBarsInstanced';

    // Set up initial positions
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < this.barCount; i++) {
      position.set(
        (i - this.barCount / 2) * this.barSpacing,
        this.barHeight / 2 - 5,
        baseZ[i]
      );

      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    // Store references
    this._barMesh = instancedMesh;
    this._barMaterial = material;

    this._addObject(instancedMesh);

    // Single animation callback
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  /**
   * Create instanced scanlines
   * Performance: 20 scanlines = 1 draw call instead of 20
   * @private
   */
  _createInstancedScanlines() {
    const lineCount = 20;

    // Create base plane geometry
    const geometry = new THREE.PlaneGeometry(200, 0.2);

    // Instance attributes
    const flickerSpeeds = new Float32Array(lineCount);
    for (let i = 0; i < lineCount; i++) {
      flickerSpeeds[i] = 5 + Math.random() * 10;
    }

    geometry.setAttribute(
      'aFlickerSpeed',
      new THREE.InstancedBufferAttribute(flickerSpeeds, 1)
    );

    // Instanced shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColors: { value: this.colors },
      },
      vertexShader: `
        attribute float aFlickerSpeed;

        uniform float uTime;

        varying float vColorIndex;
        varying float vFlicker;

        void main() {
          vColorIndex = mod(float(gl_InstanceID), 4.0);

          // Calculate flicker
          vFlicker = 0.2 + abs(sin(uTime * aFlickerSpeed)) * 0.3;

          vec4 worldPos = instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColors[4];

        varying float vColorIndex;
        varying float vFlicker;

        void main() {
          vec3 color;
          int idx = int(vColorIndex);
          if (idx == 0) color = uColors[0];
          else if (idx == 1) color = uColors[1];
          else if (idx == 2) color = uColors[2];
          else color = uColors[3];

          gl_FragColor = vec4(color, vFlicker);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      lineCount
    );
    instancedMesh.name = 'scanlinesInstanced';

    // Set up positions
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < lineCount; i++) {
      position.set(0, (i - lineCount / 2) * 3, -15);
      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    // Store references
    this._scanlineMesh = instancedMesh;
    this._scanlineMaterial = material;

    this._addObject(instancedMesh);

    // Single animation callback
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  _createRibbons() {
    const ribbonCount = 8;

    for (let r = 0; r < ribbonCount; r++) {
      const points = [];
      const segments = 50;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * 100;
        const y = Math.sin(t * Math.PI * 4) * 5 + (r - ribbonCount / 2) * 8;
        const z = Math.cos(t * Math.PI * 2) * 10 - 10;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.3, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: this.colors[r % this.colors.length],
        transparent: true,
        opacity: 0.5,
      });

      const ribbon = new THREE.Mesh(geometry, material);
      ribbon.name = `ribbon_${r}`;

      this._addObject(ribbon);

      // Wave animation
      const speed = 0.3 + r * 0.05;

      this._onAnimate((delta, elapsed) => {
        ribbon.rotation.x = Math.sin(elapsed * speed) * 0.1;
        ribbon.position.y = Math.sin(elapsed * speed * 0.5) * 2;
      });
    }
  }

  _createGlitchParticles() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'glitchParticles';

    this._addObject(particles);

    this._onAnimate(() => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // Random glitch displacement
        if (Math.random() < 0.02) {
          pos[i3] += (Math.random() - 0.5) * 5;
          pos[i3 + 1] += (Math.random() - 0.5) * 5;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }
  /**
   * Clean up resources
   * @override
   */
  dispose() {
    // Remove quality change listener
    window.removeEventListener('qualitychange', this._qualityChangeHandler);

    // Call parent dispose
    super.dispose();
  }
}

window.StripeBarEnvironment = StripeBarEnvironment;
