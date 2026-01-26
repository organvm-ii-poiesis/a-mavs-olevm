/**
 * @file SceneManager.js
 * @description Core Three.js scene lifecycle management for ETCETER4
 * Handles renderer, scene, camera, and post-processing setup
 */

'use strict';

/**
 * SceneManager - Manages Three.js scene lifecycle
 * @class
 */
class SceneManager {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - DOM element to render into
   * @param {boolean} [options.antialias=true] - Enable antialiasing
   * @param {boolean} [options.alpha=true] - Enable transparent background
   * @param {number} [options.pixelRatio] - Device pixel ratio (defaults to device)
   */
  constructor(options = {}) {
    const {
      container,
      antialias = true,
      alpha = true,
      pixelRatio = Math.min(window.devicePixelRatio, 2),
    } = options;

    if (!container) {
      throw new Error('SceneManager requires a container element');
    }

    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.animationCallbacks = [];

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias,
      alpha,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();

    // Create default camera (can be overridden)
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Bind methods
    this._animate = this._animate.bind(this);
    this._onResize = this._onResize.bind(this);

    // Set up resize listener
    window.addEventListener('resize', this._onResize);
  }

  /**
   * Set background color or texture
   * @param {THREE.Color|THREE.Texture|string} background
   */
  setBackground(background) {
    if (typeof background === 'string') {
      this.scene.background = new THREE.Color(background);
    } else {
      this.scene.background = background;
    }
  }

  /**
   * Set fog for the scene
   * @param {THREE.Fog|THREE.FogExp2} fog
   */
  setFog(fog) {
    this.scene.fog = fog;
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Register a callback to be called each animation frame
   * @param {Function} callback - Receives (deltaTime, elapsedTime)
   * @returns {Function} Unsubscribe function
   */
  onAnimate(callback) {
    this.animationCallbacks.push(callback);
    return () => {
      const index = this.animationCallbacks.indexOf(callback);
      if (index > -1) {
        this.animationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.clock.start();
    this._animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    this.clock.stop();
  }

  /**
   * Internal animation loop
   * @private
   */
  _animate() {
    if (!this.isRunning) {
      return;
    }

    requestAnimationFrame(this._animate);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Call all animation callbacks
    for (const callback of this.animationCallbacks) {
      callback(deltaTime, elapsedTime);
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   * @private
   */
  _onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);

    // Dispose of scene objects
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();

    // Remove canvas from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }

    this.animationCallbacks = [];
  }

  /**
   * Get the Three.js renderer
   * @returns {THREE.WebGLRenderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get the main scene
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get the camera
   * @returns {THREE.Camera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Set the camera
   * @param {THREE.Camera} camera
   */
  setCamera(camera) {
    this.camera = camera;
    this._onResize();
  }
}

// Export for global scope (no build step)
window.SceneManager = SceneManager;
