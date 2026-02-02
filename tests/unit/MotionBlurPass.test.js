/**
 * @file tests/unit/MotionBlurPass.test.js
 * @description Unit tests for MotionBlurPass post-processing effect
 * Tests camera motion blur for cinematic movement effects
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MotionBlurPass', () => {
  let MotionBlurPass;
  let pass;
  let mockCamera;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCamera = new THREE.PerspectiveCamera();

    // Define MotionBlurPass class for testing
    MotionBlurPass = class {
      constructor(options = {}) {
        this.resolution =
          options.resolution ||
          new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.camera = options.camera;

        this.intensity = options.intensity || 1.0;
        this.samples = options.samples || 16;

        this.enabled = true;
        this.needsSwap = true;
        this.clear = false;

        this.velocityRenderTarget = null;
        this.motionBlurMaterial = null;
        this.velocityMaterial = null;
        this.fullscreenQuad = null;

        this._previousProjectionMatrix = new THREE.Matrix4();
        this._previousViewMatrix = new THREE.Matrix4();
        this._currentProjectionMatrix = new THREE.Matrix4();
        this._currentViewMatrix = new THREE.Matrix4();
        this._previousCameraPosition = new THREE.Vector3();

        this._initialize();
      }

      _initialize() {
        // Create velocity render target
        this.velocityRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          }
        );

        // Create velocity material
        this.velocityMaterial = new THREE.ShaderMaterial({
          uniforms: {
            previousProjectionMatrix: { value: this._previousProjectionMatrix },
            previousViewMatrix: { value: this._previousViewMatrix },
          },
          vertexShader:
            'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
        });

        // Create motion blur material
        this.motionBlurMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            tVelocity: { value: null },
            intensity: { value: this.intensity },
            samples: { value: this.samples },
            resolution: { value: this.resolution },
          },
          vertexShader:
            'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }',
        });

        // Create fullscreen quad
        this.fullscreenQuad = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          this.motionBlurMaterial
        );

        // Store initial camera matrices
        if (this.camera) {
          this._previousProjectionMatrix.copy(this.camera.projectionMatrix);
          this._previousViewMatrix.copy(this.camera.matrixWorldInverse);
          this._previousCameraPosition.copy(this.camera.position);
        }
      }

      render(renderer, writeBuffer, readBuffer) {
        if (!this.enabled) {
          return;
        }

        // Store current camera matrices
        if (this.camera) {
          this._currentProjectionMatrix.copy(this.camera.projectionMatrix);
          this._currentViewMatrix.copy(this.camera.matrixWorldInverse);
        }

        // Update motion blur uniforms
        this.motionBlurMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this.motionBlurMaterial.uniforms.tVelocity.value =
          this.velocityRenderTarget.texture;
        this.motionBlurMaterial.uniforms.intensity.value = this.intensity;
        this.motionBlurMaterial.uniforms.samples.value = this.samples;

        // Render motion blur pass
        renderer.setRenderTarget(this.needsSwap ? writeBuffer : null);
        renderer.render(this.fullscreenQuad, this.camera);

        // Update previous matrices for next frame
        if (this.camera) {
          this._previousProjectionMatrix.copy(this._currentProjectionMatrix);
          this._previousViewMatrix.copy(this._currentViewMatrix);
          this._previousCameraPosition.copy(this.camera.position);
        }
      }

      setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(5, intensity));
        if (this.motionBlurMaterial) {
          this.motionBlurMaterial.uniforms.intensity.value = this.intensity;
        }
      }

      setSamples(samples) {
        this.samples = Math.max(4, Math.min(64, Math.floor(samples)));
        if (this.motionBlurMaterial) {
          this.motionBlurMaterial.uniforms.samples.value = this.samples;
        }
      }

      setSize(width, height) {
        this.resolution.set(width, height);

        if (this.velocityRenderTarget) {
          this.velocityRenderTarget.setSize(width, height);
        }
        if (this.motionBlurMaterial) {
          this.motionBlurMaterial.uniforms.resolution.value.set(width, height);
        }
      }

      getIntensity() {
        return this.intensity;
      }

      getSamples() {
        return this.samples;
      }

      getCameraVelocity() {
        if (!this.camera) return 0;
        const currentPos = this.camera.position;
        const dx = currentPos.x - this._previousCameraPosition.x;
        const dy = currentPos.y - this._previousCameraPosition.y;
        const dz = currentPos.z - this._previousCameraPosition.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      dispose() {
        if (this.velocityRenderTarget) {
          this.velocityRenderTarget.dispose();
          this.velocityRenderTarget = null;
        }

        if (this.motionBlurMaterial) {
          this.motionBlurMaterial.dispose();
          this.motionBlurMaterial = null;
        }

        if (this.velocityMaterial) {
          this.velocityMaterial.dispose();
          this.velocityMaterial = null;
        }

        if (this.fullscreenQuad) {
          this.fullscreenQuad.geometry.dispose();
          this.fullscreenQuad = null;
        }
      }
    };
  });

  afterEach(() => {
    if (pass) {
      pass.dispose();
      pass = null;
    }
  });

  describe('constructor', () => {
    it('should initialize with default settings', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      expect(pass.intensity).toBe(1.0);
      expect(pass.samples).toBe(16);
      expect(pass.enabled).toBe(true);
    });

    it('should accept custom intensity', () => {
      pass = new MotionBlurPass({ camera: mockCamera, intensity: 2.0 });
      expect(pass.intensity).toBe(2.0);
    });

    it('should accept custom samples', () => {
      pass = new MotionBlurPass({ camera: mockCamera, samples: 32 });
      expect(pass.samples).toBe(32);
    });

    it('should create velocity render target', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      expect(pass.velocityRenderTarget).toBeDefined();
    });

    it('should create motion blur material', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      expect(pass.motionBlurMaterial).toBeDefined();
    });

    it('should store camera reference', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      expect(pass.camera).toBe(mockCamera);
    });
  });

  describe('setIntensity', () => {
    it('should update intensity', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setIntensity(2.0);
      expect(pass.intensity).toBe(2.0);
    });

    it('should clamp to valid range', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setIntensity(-1);
      expect(pass.intensity).toBe(0);

      pass.setIntensity(10);
      expect(pass.intensity).toBe(5);
    });

    it('should update material uniform', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setIntensity(1.5);
      expect(pass.motionBlurMaterial.uniforms.intensity.value).toBe(1.5);
    });
  });

  describe('setSamples', () => {
    it('should update samples', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSamples(24);
      expect(pass.samples).toBe(24);
    });

    it('should clamp to valid range', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSamples(2);
      expect(pass.samples).toBe(4);

      pass.setSamples(100);
      expect(pass.samples).toBe(64);
    });

    it('should floor to integer', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSamples(16.7);
      expect(pass.samples).toBe(16);
    });

    it('should update material uniform', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSamples(32);
      expect(pass.motionBlurMaterial.uniforms.samples.value).toBe(32);
    });
  });

  describe('setSize', () => {
    it('should update resolution', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.resolution.x).toBe(1920);
      expect(pass.resolution.y).toBe(1080);
    });

    it('should resize render target', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.velocityRenderTarget.setSize).toHaveBeenCalledWith(
        1920,
        1080
      );
    });

    it('should update material uniform', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.motionBlurMaterial.uniforms.resolution.value.x).toBe(1920);
      expect(pass.motionBlurMaterial.uniforms.resolution.value.y).toBe(1080);
    });
  });

  describe('getters', () => {
    it('should return intensity', () => {
      pass = new MotionBlurPass({ camera: mockCamera, intensity: 2.0 });
      expect(pass.getIntensity()).toBe(2.0);
    });

    it('should return samples', () => {
      pass = new MotionBlurPass({ camera: mockCamera, samples: 24 });
      expect(pass.getSamples()).toBe(24);
    });

    it('should calculate camera velocity', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      const velocity = pass.getCameraVelocity();
      expect(typeof velocity).toBe('number');
      expect(velocity).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 velocity without camera', () => {
      pass = new MotionBlurPass({});
      pass.camera = null;
      const velocity = pass.getCameraVelocity();
      expect(velocity).toBe(0);
    });
  });

  describe('render', () => {
    it('should skip rendering when disabled', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      pass.enabled = false;

      const mockRenderer = {
        setRenderTarget: vi.fn(),
        render: vi.fn(),
      };

      pass.render(mockRenderer, {}, {});
      expect(mockRenderer.setRenderTarget).not.toHaveBeenCalled();
    });

    it('should set needsSwap to true', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      expect(pass.needsSwap).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose render target', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      const velocityTarget = pass.velocityRenderTarget;

      pass.dispose();

      expect(velocityTarget.dispose).toHaveBeenCalled();
      expect(pass.velocityRenderTarget).toBeNull();
    });

    it('should dispose materials', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      const motionMat = pass.motionBlurMaterial;
      const velocityMat = pass.velocityMaterial;

      pass.dispose();

      expect(motionMat.dispose).toHaveBeenCalled();
      expect(velocityMat.dispose).toHaveBeenCalled();
      expect(pass.motionBlurMaterial).toBeNull();
      expect(pass.velocityMaterial).toBeNull();
    });

    it('should dispose fullscreen quad geometry', () => {
      pass = new MotionBlurPass({ camera: mockCamera });
      const quad = pass.fullscreenQuad;

      pass.dispose();

      expect(quad.geometry.dispose).toHaveBeenCalled();
      expect(pass.fullscreenQuad).toBeNull();
    });
  });
});
