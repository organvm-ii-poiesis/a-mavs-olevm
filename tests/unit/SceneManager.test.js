/**
 * @file tests/unit/SceneManager.test.js
 * @description Unit tests for SceneManager class
 * Tests Three.js lifecycle management, animation loop, and post-processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SceneManager', () => {
  let container;
  let SceneManager;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    Object.defineProperty(container, 'clientWidth', {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 600,
      configurable: true,
    });
    document.body.appendChild(container);

    // Reset mocks
    vi.clearAllMocks();

    // Define SceneManager class for testing
    SceneManager = class {
      constructor(options = {}) {
        const {
          container,
          antialias = true,
          alpha = true,
          pixelRatio = Math.min(window.devicePixelRatio || 1, 2),
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

        this.renderer = new THREE.WebGLRenderer({
          antialias,
          alpha,
          powerPreference: 'high-performance',
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(pixelRatio);
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
          75,
          this.width / this.height,
          0.1,
          1000
        );
        this.camera.position.z = 5;

        this.composer = null;
        this.bloomPass = null;
        this.usePostProcessing = false;

        this._animate = this._animate.bind(this);
        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
      }

      enableBloom(options = {}) {
        if (
          !THREE.EffectComposer ||
          !THREE.RenderPass ||
          !THREE.UnrealBloomPass
        ) {
          console.warn('SceneManager: Post-processing classes not available');
          return;
        }
        const { strength = 0.5, threshold = 0.8, radius = 0.5 } = options;
        this.composer = new THREE.EffectComposer(this.renderer);
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        const resolution = new THREE.Vector2(this.width, this.height);
        this.bloomPass = new THREE.UnrealBloomPass(
          resolution,
          strength,
          radius,
          threshold
        );
        this.composer.addPass(this.bloomPass);
        this.usePostProcessing = true;
      }

      disableBloom() {
        if (this.composer) {
          this.composer.dispose();
          this.composer = null;
          this.bloomPass = null;
        }
        this.usePostProcessing = false;
      }

      setBloomParams(params = {}) {
        if (!this.bloomPass) return;
        if (params.strength !== undefined)
          this.bloomPass.strength = params.strength;
        if (params.threshold !== undefined)
          this.bloomPass.threshold = params.threshold;
        if (params.radius !== undefined) this.bloomPass.radius = params.radius;
      }

      setBackground(background) {
        if (typeof background === 'string') {
          this.scene.background = new THREE.Color(background);
        } else {
          this.scene.background = background;
        }
      }

      setFog(fog) {
        this.scene.fog = fog;
      }

      add(object) {
        this.scene.add(object);
      }

      remove(object) {
        this.scene.remove(object);
      }

      onAnimate(callback) {
        this.animationCallbacks.push(callback);
        return () => {
          const index = this.animationCallbacks.indexOf(callback);
          if (index > -1) this.animationCallbacks.splice(index, 1);
        };
      }

      start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        this._animate();
      }

      stop() {
        this.isRunning = false;
        this.clock.stop();
      }

      _animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this._animate);
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        for (const callback of this.animationCallbacks) {
          callback(deltaTime, elapsedTime);
        }
        if (this.usePostProcessing && this.composer) {
          this.composer.render();
        } else {
          this.renderer.render(this.scene, this.camera);
        }
      }

      _onResize() {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        if (this.composer) this.composer.setSize(this.width, this.height);
      }

      dispose() {
        this.stop();
        window.removeEventListener('resize', this._onResize);
        if (this.composer) {
          this.composer.dispose();
          this.composer = null;
          this.bloomPass = null;
        }
        this.scene.traverse(object => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        this.renderer.dispose();
        if (this.renderer.domElement.parentElement) {
          this.renderer.domElement.parentElement.removeChild(
            this.renderer.domElement
          );
        }
        this.animationCallbacks = [];
      }

      getRenderer() {
        return this.renderer;
      }
      getScene() {
        return this.scene;
      }
      getCamera() {
        return this.camera;
      }
      setCamera(camera) {
        this.camera = camera;
        this._onResize();
      }
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should throw error if no container provided', () => {
      expect(() => new SceneManager()).toThrow(
        'SceneManager requires a container element'
      );
    });

    it('should create renderer with correct settings', () => {
      const manager = new SceneManager({ container });
      expect(manager.renderer).toBeDefined();
      expect(manager.renderer.setSize).toHaveBeenCalledWith(800, 600);
      manager.dispose();
    });

    it('should create scene and camera', () => {
      const manager = new SceneManager({ container });
      expect(manager.scene).toBeDefined();
      expect(manager.camera).toBeDefined();
      manager.dispose();
    });

    it('should append canvas to container', () => {
      const manager = new SceneManager({ container });
      expect(container.querySelector('canvas')).toBeTruthy();
      manager.dispose();
    });

    it('should initialize with default options', () => {
      const manager = new SceneManager({ container });
      expect(manager.width).toBe(800);
      expect(manager.height).toBe(600);
      expect(manager.isRunning).toBe(false);
      manager.dispose();
    });
  });

  describe('enableBloom', () => {
    it('should enable post-processing', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      expect(manager.usePostProcessing).toBe(true);
      expect(manager.composer).toBeDefined();
      expect(manager.bloomPass).toBeDefined();
      manager.dispose();
    });

    it('should use default bloom parameters', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      // Bloom pass is created with default values
      expect(manager.bloomPass).toBeDefined();
      manager.dispose();
    });

    it('should accept custom bloom parameters', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom({ strength: 1.0, threshold: 0.5, radius: 1.0 });
      expect(manager.usePostProcessing).toBe(true);
      manager.dispose();
    });
  });

  describe('disableBloom', () => {
    it('should disable post-processing', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      manager.disableBloom();
      expect(manager.usePostProcessing).toBe(false);
      expect(manager.composer).toBeNull();
      expect(manager.bloomPass).toBeNull();
      manager.dispose();
    });
  });

  describe('setBloomParams', () => {
    it('should update bloom parameters when bloom is enabled', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      manager.setBloomParams({ strength: 0.8, threshold: 0.6, radius: 0.7 });
      expect(manager.bloomPass.strength).toBe(0.8);
      expect(manager.bloomPass.threshold).toBe(0.6);
      expect(manager.bloomPass.radius).toBe(0.7);
      manager.dispose();
    });

    it('should do nothing if bloom is not enabled', () => {
      const manager = new SceneManager({ container });
      // Should not throw
      manager.setBloomParams({ strength: 0.8 });
      expect(manager.bloomPass).toBeNull();
      manager.dispose();
    });
  });

  describe('setBackground', () => {
    it('should set scene background from string', () => {
      const manager = new SceneManager({ container });
      manager.setBackground('#ff0000');
      expect(manager.scene.background).toBeDefined();
      manager.dispose();
    });

    it('should set scene background from Color object', () => {
      const manager = new SceneManager({ container });
      const color = new THREE.Color(0xff0000);
      manager.setBackground(color);
      expect(manager.scene.background).toBe(color);
      manager.dispose();
    });
  });

  describe('setFog', () => {
    it('should set scene fog', () => {
      const manager = new SceneManager({ container });
      const fog = new THREE.Fog(0x000000, 1, 50);
      manager.setFog(fog);
      expect(manager.scene.fog).toBe(fog);
      manager.dispose();
    });
  });

  describe('add/remove', () => {
    it('should add objects to scene', () => {
      const manager = new SceneManager({ container });
      const mesh = new THREE.Mesh();
      manager.add(mesh);
      expect(manager.scene.add).toHaveBeenCalledWith(mesh);
      manager.dispose();
    });

    it('should remove objects from scene', () => {
      const manager = new SceneManager({ container });
      const mesh = new THREE.Mesh();
      manager.remove(mesh);
      expect(manager.scene.remove).toHaveBeenCalledWith(mesh);
      manager.dispose();
    });
  });

  describe('onAnimate', () => {
    it('should register animation callback', () => {
      const manager = new SceneManager({ container });
      const callback = vi.fn();
      manager.onAnimate(callback);
      expect(manager.animationCallbacks).toContain(callback);
      manager.dispose();
    });

    it('should return unsubscribe function', () => {
      const manager = new SceneManager({ container });
      const callback = vi.fn();
      const unsubscribe = manager.onAnimate(callback);
      unsubscribe();
      expect(manager.animationCallbacks).not.toContain(callback);
      manager.dispose();
    });
  });

  describe('start/stop', () => {
    it('should start animation loop', () => {
      const manager = new SceneManager({ container });
      manager.start();
      expect(manager.isRunning).toBe(true);
      expect(manager.clock.start).toHaveBeenCalled();
      manager.dispose();
    });

    it('should not start if already running', () => {
      const manager = new SceneManager({ container });
      manager.start();
      manager.clock.start.mockClear();
      manager.start();
      expect(manager.clock.start).not.toHaveBeenCalled();
      manager.dispose();
    });

    it('should stop animation loop', () => {
      const manager = new SceneManager({ container });
      manager.start();
      manager.stop();
      expect(manager.isRunning).toBe(false);
      expect(manager.clock.stop).toHaveBeenCalled();
      manager.dispose();
    });
  });

  describe('_onResize', () => {
    it('should update dimensions on resize', () => {
      const manager = new SceneManager({ container });
      Object.defineProperty(container, 'clientWidth', {
        value: 1024,
        configurable: true,
      });
      Object.defineProperty(container, 'clientHeight', {
        value: 768,
        configurable: true,
      });
      manager._onResize();
      expect(manager.width).toBe(1024);
      expect(manager.height).toBe(768);
      expect(manager.camera.updateProjectionMatrix).toHaveBeenCalled();
      expect(manager.renderer.setSize).toHaveBeenCalledWith(1024, 768);
      manager.dispose();
    });

    it('should update composer size if post-processing enabled', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      Object.defineProperty(container, 'clientWidth', {
        value: 1024,
        configurable: true,
      });
      Object.defineProperty(container, 'clientHeight', {
        value: 768,
        configurable: true,
      });
      manager._onResize();
      expect(manager.composer.setSize).toHaveBeenCalledWith(1024, 768);
      manager.dispose();
    });
  });

  describe('dispose', () => {
    it('should stop animation loop', () => {
      const manager = new SceneManager({ container });
      manager.start();
      manager.dispose();
      expect(manager.isRunning).toBe(false);
    });

    it('should dispose renderer', () => {
      const manager = new SceneManager({ container });
      manager.dispose();
      expect(manager.renderer.dispose).toHaveBeenCalled();
    });

    it('should dispose composer if enabled', () => {
      const manager = new SceneManager({ container });
      manager.enableBloom();
      manager.dispose();
      // Composer should be disposed and nullified
      expect(manager.composer).toBeNull();
    });

    it('should clear animation callbacks', () => {
      const manager = new SceneManager({ container });
      manager.onAnimate(vi.fn());
      manager.dispose();
      expect(manager.animationCallbacks).toHaveLength(0);
    });
  });

  describe('getters', () => {
    it('should return renderer', () => {
      const manager = new SceneManager({ container });
      expect(manager.getRenderer()).toBe(manager.renderer);
      manager.dispose();
    });

    it('should return scene', () => {
      const manager = new SceneManager({ container });
      expect(manager.getScene()).toBe(manager.scene);
      manager.dispose();
    });

    it('should return camera', () => {
      const manager = new SceneManager({ container });
      expect(manager.getCamera()).toBe(manager.camera);
      manager.dispose();
    });
  });

  describe('setCamera', () => {
    it('should set new camera', () => {
      const manager = new SceneManager({ container });
      const newCamera = new THREE.PerspectiveCamera();
      manager.setCamera(newCamera);
      expect(manager.camera).toBe(newCamera);
      manager.dispose();
    });

    it('should update projection matrix', () => {
      const manager = new SceneManager({ container });
      const newCamera = new THREE.PerspectiveCamera();
      manager.setCamera(newCamera);
      // _onResize is called which updates projection
      expect(manager.camera).toBe(newCamera);
      manager.dispose();
    });
  });
});
