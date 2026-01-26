/**
 * @file MirrorMazeEnv.js
 * @description Infinite mirror/reflection hall environment
 * Creates recursive mirror reflections using CubeCamera
 * Mirrors pulse and distort with audio for a trippy, disorienting aesthetic
 *
 * Inspired by: Mirror mazes, infinity rooms, Yayoi Kusama installations,
 *              kaleidoscopes, Enter the Void, 2001: A Space Odyssey
 *
 * Color palette mood: Ethereal and hypnotic
 * - Reflective surfaces with palette tints
 * - Chromatic aberration on distorted mirrors
 * - Ambient fog colored by palette
 *
 * Performance: Uses limited CubeCamera updates and LOD for reflections
 * Recursive depth limited for performance (3-4 levels max)
 *
 * @class MirrorMazeEnvironment
 * @extends EnvironmentBase
 */

'use strict';

/**
 * MirrorMazeEnvironment - Infinite reflection hall
 * @class
 * @extends EnvironmentBase
 */
class MirrorMazeEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {OGODAudioEngine} [options.audioEngine] - Optional audio engine for live data
   */
  constructor(options = {}) {
    super(options);

    this.audioEngine = options.audioEngine || null;

    // Mirror configuration
    this.corridorLength = 100;
    this.corridorWidth = 20;
    this.corridorHeight = 15;
    this.mirrorCount = 8;

    // Mobile detection for reduced complexity
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.mirrorCount = 4;
    }

    // Cube cameras for reflections
    this.cubeCameras = [];
    this.cubeRenderTargets = [];

    // Mirror meshes for animation
    this.mirrors = [];

    // Reflection update throttle (update every N frames)
    this.reflectionUpdateInterval = this.isMobile ? 6 : 3;
    this.frameCount = 0;

    // Audio levels
    this.bassLevel = 0;
    this.midLevel = 0;
    this.highLevel = 0;
  }

  /**
   * Initialize the mirror maze environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Dark ambient background
    const bgColor = new THREE.Color(0x050510);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.01);

    // Create the mirror corridor
    this._createMirrorCorridor();

    // Create reflective floor and ceiling
    this._createReflectiveSurfaces();

    // Create floating orbs for visual interest
    this._createFloatingOrbs();

    // Create ambient light sources
    this._createAmbientLighting();

    // Create particle effects
    this._createReflectionParticles();

    // Create infinity portal at the end
    this._createInfinityPortal();

    this.isInitialized = true;
  }

  /**
   * Create the main mirror corridor with reflective walls
   * @private
   */
  _createMirrorCorridor() {
    const mirrorSpacing = this.corridorLength / this.mirrorCount;

    // Create mirrors on both sides of the corridor
    for (let i = 0; i < this.mirrorCount; i++) {
      const z = -i * mirrorSpacing - mirrorSpacing / 2;

      // Left mirror
      this._createMirrorPanel(
        new THREE.Vector3(-this.corridorWidth / 2, this.corridorHeight / 2, z),
        new THREE.Euler(0, Math.PI / 2, 0),
        i,
        'left'
      );

      // Right mirror
      this._createMirrorPanel(
        new THREE.Vector3(this.corridorWidth / 2, this.corridorHeight / 2, z),
        new THREE.Euler(0, -Math.PI / 2, 0),
        i,
        'right'
      );
    }

    // Animate mirrors
    this._onAnimate((delta, elapsed) => {
      this.frameCount++;
      this._updateMirrors(elapsed);
    });
  }

  /**
   * Create a single mirror panel
   * @private
   * @param {THREE.Vector3} position
   * @param {THREE.Euler} rotation
   * @param {number} index
   * @param {string} side
   */
  _createMirrorPanel(position, rotation, index, side) {
    const width = this.corridorLength / this.mirrorCount - 0.5;
    const height = this.corridorHeight - 1;

    // Create cube render target for reflection
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
      this.isMobile ? 128 : 256,
      {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      }
    );

    // Create cube camera
    const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
    cubeCamera.position.copy(position);

    this.cubeCameras.push(cubeCamera);
    this.cubeRenderTargets.push(cubeRenderTarget);
    this._addObject(cubeCamera);

    // Mirror material with reflection and distortion
    const colorIndex = index % this.colors.length;
    const tintColor = this.colors[colorIndex];

    const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uCubeMap: { value: cubeRenderTarget.texture },
        uTintColor: { value: tintColor },
        uTime: { value: 0 },
        uDistortion: { value: 0 },
        uBassLevel: { value: 0 },
        uIndex: { value: index },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uDistortion;
        uniform float uBassLevel;
        uniform float uIndex;

        varying vec3 vReflect;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;

          vec3 pos = position;

          // Audio-reactive wave distortion
          float wave = sin(pos.y * 2.0 + uTime * 2.0 + uIndex) * uDistortion;
          wave += sin(pos.x * 3.0 + uTime * 1.5) * uDistortion * 0.5;
          wave *= uBassLevel * 2.0 + 0.5;

          pos.z += wave * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Calculate reflection vector
          vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
          vec3 cameraToVertex = normalize(pos - cameraPosition);
          vReflect = reflect(cameraToVertex, worldNormal);
        }
      `,
      fragmentShader: `
        uniform samplerCube uCubeMap;
        uniform vec3 uTintColor;
        uniform float uTime;
        uniform float uDistortion;
        uniform float uBassLevel;

        varying vec3 vReflect;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Sample reflection with chromatic aberration
          vec3 reflectR = vReflect + vec3(uDistortion * 0.02, 0.0, 0.0);
          vec3 reflectG = vReflect;
          vec3 reflectB = vReflect - vec3(uDistortion * 0.02, 0.0, 0.0);

          float r = textureCube(uCubeMap, reflectR).r;
          float g = textureCube(uCubeMap, reflectG).g;
          float b = textureCube(uCubeMap, reflectB).b;

          vec3 reflection = vec3(r, g, b);

          // Add tint color
          vec3 color = mix(reflection, uTintColor, 0.15);

          // Edge darkening for frame effect
          float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          edge *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          color *= 0.7 + edge * 0.3;

          // Audio pulse glow
          float pulse = uBassLevel * 0.3;
          color += uTintColor * pulse;

          // Slight vignette
          float vignette = 1.0 - length(vUv - vec2(0.5)) * 0.5;
          color *= vignette;

          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mirror = new THREE.Mesh(geometry, material);
    mirror.position.copy(position);
    mirror.rotation.copy(rotation);
    mirror.userData = {
      index,
      side,
      cubeCamera,
      material,
      baseDistortion: 0.1 + Math.random() * 0.1,
    };
    mirror.name = `mirror_${side}_${index}`;

    this._addObject(mirror);
    this.mirrors.push(mirror);

    // Create mirror frame
    this._createMirrorFrame(position, rotation, width, height, tintColor);
  }

  /**
   * Create decorative frame around a mirror
   * @private
   */
  _createMirrorFrame(position, rotation, width, height, color) {
    const frameWidth = 0.3;

    // Frame geometry (4 bars)
    const frameParts = [
      {
        w: width + frameWidth * 2,
        h: frameWidth,
        x: 0,
        y: height / 2 + frameWidth / 2,
      },
      {
        w: width + frameWidth * 2,
        h: frameWidth,
        x: 0,
        y: -height / 2 - frameWidth / 2,
      },
      { w: frameWidth, h: height, x: -width / 2 - frameWidth / 2, y: 0 },
      { w: frameWidth, h: height, x: width / 2 + frameWidth / 2, y: 0 },
    ];

    frameParts.forEach(part => {
      const geometry = new THREE.BoxGeometry(part.w, part.h, frameWidth);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8,
      });

      const frame = new THREE.Mesh(geometry, material);
      frame.position.copy(position);
      frame.position.x += Math.cos(rotation.y) * part.x;
      frame.position.y += part.y;
      frame.rotation.copy(rotation);

      this._addObject(frame);
    });
  }

  /**
   * Update mirror reflections and distortions
   * @private
   * @param {number} elapsed
   */
  _updateMirrors(elapsed) {
    // Update cube cameras periodically (expensive operation)
    if (this.frameCount % this.reflectionUpdateInterval === 0) {
      const { renderer, scene } = this.sceneManager;

      // Temporarily hide mirrors to prevent recursive artifacts
      this.mirrors.forEach(m => (m.visible = false));

      this.cubeCameras.forEach(cubeCamera => {
        cubeCamera.update(renderer, scene);
      });

      this.mirrors.forEach(m => (m.visible = true));
    }

    // Update mirror materials
    this.mirrors.forEach(mirror => {
      const { material, baseDistortion } = mirror.userData;

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uBassLevel.value = this.bassLevel;

      // Audio-reactive distortion
      const distortion = baseDistortion * (1 + this.bassLevel * 2);
      material.uniforms.uDistortion.value = distortion;
    });
  }

  /**
   * Create reflective floor and ceiling
   * @private
   */
  _createReflectiveSurfaces() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(
      this.corridorWidth,
      this.corridorLength,
      32,
      64
    );
    const floorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: this.colors[0] },
        uColor2: { value: this.colors[1] },
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
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
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uBassLevel;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Infinite corridor illusion with stripes
          float stripe = step(0.5, fract(vUv.y * 20.0 + uTime * 0.1));

          vec3 color = mix(uColor1 * 0.2, uColor2 * 0.3, stripe);

          // Add distance fade
          float fade = smoothstep(0.0, 0.3, vUv.y);
          color *= 0.3 + fade * 0.7;

          // Audio pulse
          float pulse = uBassLevel * 0.2;
          color += uColor1 * pulse * (1.0 - vUv.y);

          // Reflection-like gradient
          float reflection = smoothstep(1.0, 0.5, vUv.y) * 0.3;
          color += vec3(reflection);

          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.position.z = -this.corridorLength / 2;
    floor.name = 'floor';

    this._addObject(floor);

    // Ceiling (similar but inverted)
    const ceiling = floor.clone();
    ceiling.position.y = this.corridorHeight;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.name = 'ceiling';

    this._addObject(ceiling);

    this._onAnimate((delta, elapsed) => {
      floorMaterial.uniforms.uTime.value = elapsed;
      floorMaterial.uniforms.uBassLevel.value = this.bassLevel;
    });
  }

  /**
   * Create floating orbs that reflect in mirrors
   * @private
   */
  _createFloatingOrbs() {
    const orbCount = this.isMobile ? 8 : 20;

    for (let i = 0; i < orbCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const radius = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uIndex: { value: i },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uIndex;
          varying vec3 vNormal;

          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + uIndex);

            vec3 color = uColor * (0.5 + rim * 0.8) * (0.8 + pulse * 0.4);
            float alpha = 0.6 + rim * 0.4;

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const orb = new THREE.Mesh(geometry, material);
      orb.position.set(
        (Math.random() - 0.5) * (this.corridorWidth - 2),
        2 + Math.random() * (this.corridorHeight - 4),
        -Math.random() * this.corridorLength
      );
      orb.userData = {
        baseY: orb.position.y,
        floatSpeed: 0.3 + Math.random() * 0.4,
        floatAmount: 1 + Math.random() * 2,
        orbitSpeed: 0.2 + Math.random() * 0.3,
        orbitRadius: 1 + Math.random() * 2,
      };
      orb.name = `orb_${i}`;

      this._addObject(orb);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;

        const data = orb.userData;
        orb.position.y =
          data.baseY + Math.sin(elapsed * data.floatSpeed) * data.floatAmount;
        orb.position.x +=
          Math.cos(elapsed * data.orbitSpeed) * data.orbitRadius * delta;
      });
    }
  }

  /**
   * Create ambient lighting for the corridor
   * @private
   */
  _createAmbientLighting() {
    // Main ambient light
    const ambient = this._createAmbientLight(0.2);
    this._addObject(ambient);

    // Colored point lights along the corridor
    const lightCount = 6;
    const spacing = this.corridorLength / lightCount;

    for (let i = 0; i < lightCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const light = new THREE.PointLight(color, 0.8, 25);
      light.position.set(
        0,
        this.corridorHeight - 2,
        -i * spacing - spacing / 2
      );
      light.name = `corridorLight_${i}`;

      this._addObject(light);

      // Animate light intensity
      this._onAnimate((delta, elapsed) => {
        light.intensity = 0.5 + Math.sin(elapsed * 1.5 + i * 1.0) * 0.3;
        light.intensity *= 1 + this.bassLevel * 0.5;
      });
    }
  }

  /**
   * Create particle effects that enhance the reflection illusion
   * @private
   */
  _createReflectionParticles() {
    const count = this.isMobile ? 200 : 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * this.corridorWidth;
      positions[i3 + 1] = Math.random() * this.corridorHeight;
      positions[i3 + 2] = -Math.random() * this.corridorLength;

      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'reflectionParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3 + 1] += Math.sin(elapsed * 0.5 + i * 0.1) * 0.01;
        pos[i3] += Math.cos(elapsed * 0.3 + i * 0.05) * 0.005;
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }

  /**
   * Create infinity portal at the end of the corridor
   * @private
   */
  _createInfinityPortal() {
    const geometry = new THREE.RingGeometry(3, 5, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColors: {
          value: this.colors.map(c => new THREE.Vector3(c.r, c.g, c.b)),
        },
        uBassLevel: { value: 0 },
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
        uniform vec3 uColors[4];
        uniform float uBassLevel;
        varying vec2 vUv;

        void main() {
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float dist = length(vUv - vec2(0.5));

          // Rotating color bands
          float band = fract(angle / 6.28 * 4.0 + uTime * 0.5);
          int colorIdx = int(band * 4.0);

          vec3 color = uColors[colorIdx];

          // Pulsing glow
          float glow = 0.5 + 0.5 * sin(uTime * 3.0);
          glow *= 1.0 + uBassLevel;

          color *= glow;

          // Edge fade
          float alpha = smoothstep(0.0, 0.3, dist) * smoothstep(0.5, 0.35, dist);
          alpha *= 0.8;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const portal = new THREE.Mesh(geometry, material);
    portal.position.set(0, this.corridorHeight / 2, -this.corridorLength);
    portal.name = 'infinityPortal';

    this._addObject(portal);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uBassLevel.value = this.bassLevel;

      // Slow rotation
      portal.rotation.z = elapsed * 0.1;
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

  /**
   * Override dispose to clean up render targets
   */
  dispose() {
    // Dispose cube render targets
    this.cubeRenderTargets.forEach(rt => rt.dispose());
    this.cubeRenderTargets = [];
    this.cubeCameras = [];
    this.mirrors = [];

    super.dispose();
  }
}

// Export for global scope
window.MirrorMazeEnvironment = MirrorMazeEnvironment;
