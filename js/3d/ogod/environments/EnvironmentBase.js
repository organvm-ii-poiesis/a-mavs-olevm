/**
 * @file EnvironmentBase.js
 * @description Abstract base class for OGOD 3D environments
 * Defines common interface and utilities for all environment types
 * Supports audio-reactive uniforms for visual effects
 */

'use strict';

/**
 * EnvironmentBase - Abstract base class for environments
 * @class
 * @abstract
 */
class EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {Object} [options.audioUniforms] - Audio-reactive uniform objects from OGODSceneManager
   */
  constructor(options = {}) {
    if (this.constructor === EnvironmentBase) {
      throw new Error('EnvironmentBase is abstract and cannot be instantiated');
    }

    this.sceneManager = options.sceneManager;
    this.palette = options.palette || [
      '#6B4C7A',
      '#C45B8E',
      '#D98C4A',
      '#5A6B3D',
    ];

    // Convert palette to Three.js colors
    this.colors = this.palette.map(hex => new THREE.Color(hex));

    // Objects created by this environment (for cleanup)
    this.objects = [];

    // Animation callbacks (for cleanup)
    this.animationUnsubscribers = [];

    // Audio-reactive uniforms (shared reference from OGODSceneManager)
    this.audioUniforms = options.audioUniforms || null;
    this.audioReactive = !!options.audioUniforms;

    // Floor mesh for VR teleport raycast
    this.floorMesh = null;

    // State
    this.isInitialized = false;
  }

  /**
   * Get audio-reactive uniforms for use in shaders
   * Returns default uniforms with value 0 if audio is not enabled
   * @protected
   * @returns {Object} Uniform objects for shaders
   */
  _getAudioUniforms() {
    if (this.audioUniforms) {
      return {
        uBassLevel: this.audioUniforms.uBassLevel,
        uMidLevel: this.audioUniforms.uMidLevel,
        uTrebleLevel: this.audioUniforms.uTrebleLevel,
        uSubBassLevel: this.audioUniforms.uSubBassLevel,
        uKickHit: this.audioUniforms.uKickHit,
        uSnareHit: this.audioUniforms.uSnareHit,
        uBeatHit: this.audioUniforms.uBeatHit,
        uEnergy: this.audioUniforms.uEnergy,
        uBPM: this.audioUniforms.uBPM,
      };
    }

    // Return static zero uniforms if audio not enabled
    return {
      uBassLevel: { value: 0 },
      uMidLevel: { value: 0 },
      uTrebleLevel: { value: 0 },
      uSubBassLevel: { value: 0 },
      uKickHit: { value: 0 },
      uSnareHit: { value: 0 },
      uBeatHit: { value: 0 },
      uEnergy: { value: 0 },
      uBPM: { value: 0 },
    };
  }

  /**
   * Set audio reactivity enabled/disabled
   * @param {boolean} enabled
   */
  setAudioReactive(enabled) {
    this.audioReactive = enabled;
  }

  /**
   * Initialize the environment - must be implemented by subclasses
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Add an object to the scene and track it
   * @protected
   * @param {THREE.Object3D} object
   */
  _addObject(object) {
    this.sceneManager.add(object);
    this.objects.push(object);
  }

  /**
   * Register an animation callback
   * @protected
   * @param {Function} callback
   */
  _onAnimate(callback) {
    const unsubscribe = this.sceneManager.onAnimate(callback);
    this.animationUnsubscribers.push(unsubscribe);
  }

  /**
   * Create a color zone mesh at a position
   * @protected
   * @param {THREE.Color} color - Zone color
   * @param {Object} position - {x, y, z}
   * @param {number} [radius=15] - Zone radius
   * @returns {THREE.Mesh}
   */
  _createColorZone(color, position, radius = 15) {
    // Create a large transparent sphere representing the zone
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    return mesh;
  }

  /**
   * Create particle system
   * @protected
   * @param {Object} options
   * @param {number} options.count - Particle count
   * @param {THREE.Color} options.color - Particle color
   * @param {number} options.size - Particle size
   * @param {number} options.spread - Area spread
   * @returns {THREE.Points}
   */
  _createParticles(options = {}) {
    const {
      count = 1000,
      color = new THREE.Color(0xffffff),
      size = 0.05,
      spread = 50,
    } = options;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position within spread
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = Math.random() * spread * 0.5;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;

      // Color with slight variation
      colors[i3] = color.r + (Math.random() - 0.5) * 0.1;
      colors[i3 + 1] = color.g + (Math.random() - 0.5) * 0.1;
      colors[i3 + 2] = color.b + (Math.random() - 0.5) * 0.1;

      // Random size
      sizes[i] = size * (0.5 + Math.random());
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create a ground plane for VR teleport
   * @protected
   * @param {Object} options
   * @returns {THREE.Mesh}
   */
  _createGround(options = {}) {
    const { size = 200, color = this.colors[0], opacity = 0.3 } = options;

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.name = 'teleportFloor';

    // Store reference for VR teleport
    this.floorMesh = ground;

    return ground;
  }

  /**
   * Get the floor mesh for VR teleport raycast
   * @returns {THREE.Mesh|null}
   */
  getFloorMesh() {
    return this.floorMesh;
  }

  /**
   * Create ambient lighting
   * @protected
   * @param {number} intensity
   * @returns {THREE.AmbientLight}
   */
  _createAmbientLight(intensity = 0.5) {
    return new THREE.AmbientLight(0xffffff, intensity);
  }

  /**
   * Lerp between two colors
   * @protected
   * @param {THREE.Color} a
   * @param {THREE.Color} b
   * @param {number} t - 0-1
   * @returns {THREE.Color}
   */
  _lerpColor(a, b, t) {
    return new THREE.Color(
      a.r + (b.r - a.r) * t,
      a.g + (b.g - a.g) * t,
      a.b + (b.b - a.b) * t
    );
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Remove all objects from scene
    for (const object of this.objects) {
      this.sceneManager.remove(object);

      // Dispose geometry and material
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    }

    // Unsubscribe from animations
    for (const unsubscribe of this.animationUnsubscribers) {
      unsubscribe();
    }

    this.objects = [];
    this.animationUnsubscribers = [];
    this.isInitialized = false;
  }
}

// Export for global scope
window.EnvironmentBase = EnvironmentBase;
