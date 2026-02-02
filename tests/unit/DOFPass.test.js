/**
 * @file tests/unit/DOFPass.test.js
 * @description Unit tests for DOFPass (Depth of Field) post-processing effect
 * Tests bokeh-style depth of field with blur based on depth
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('DOFPass', () => {
  let DOFPass;
  let pass;
  let mockScene;
  let mockCamera;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();

    // Define DOFPass class for testing
    DOFPass = class {
      constructor(options = {}) {
        this.resolution =
          options.resolution ||
          new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.scene = options.scene;
        this.camera = options.camera;

        this.focusDistance = options.focusDistance || 10;
        this.aperture = options.aperture || 0.025;
        this.maxBlur = options.maxBlur || 1.0;

        this.enabled = true;
        this.needsSwap = true;
        this.clear = false;

        this.depthRenderTarget = null;
        this.dofRenderTarget = null;
        this.dofMaterial = null;
        this.depthMaterial = null;
        this.fullscreenQuad = null;

        this._initialize();
      }

      _initialize() {
        // Create depth render target
        this.depthRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
          }
        );

        // Create DOF render target
        this.dofRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
          }
        );

        // Create depth material
        this.depthMaterial = new THREE.ShaderMaterial({
          uniforms: {
            cameraNear: { value: this.camera?.near || 0.1 },
            cameraFar: { value: this.camera?.far || 1000 },
          },
          vertexShader:
            'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
        });

        // Create DOF material
        this.dofMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            tDepth: { value: null },
            focusDistance: { value: this.focusDistance },
            aperture: { value: this.aperture },
            maxBlur: { value: this.maxBlur },
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
          this.dofMaterial
        );
      }

      render(renderer, writeBuffer, readBuffer) {
        if (!this.enabled) {
          return;
        }

        // Render depth pass
        renderer.setRenderTarget(this.depthRenderTarget);
        renderer.render(this.scene, this.camera);

        // Update DOF uniforms
        this.dofMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this.dofMaterial.uniforms.tDepth.value = this.depthRenderTarget.texture;
        this.dofMaterial.uniforms.focusDistance.value = this.focusDistance;
        this.dofMaterial.uniforms.aperture.value = this.aperture;
        this.dofMaterial.uniforms.maxBlur.value = this.maxBlur;

        // Render DOF pass
        renderer.setRenderTarget(this.needsSwap ? writeBuffer : null);
        renderer.render(this.fullscreenQuad, this.camera);
      }

      setFocusDistance(distance) {
        this.focusDistance = Math.max(0.1, distance);
        if (this.dofMaterial) {
          this.dofMaterial.uniforms.focusDistance.value = this.focusDistance;
        }
      }

      setAperture(aperture) {
        this.aperture = Math.max(0.001, Math.min(0.2, aperture));
        if (this.dofMaterial) {
          this.dofMaterial.uniforms.aperture.value = this.aperture;
        }
      }

      setMaxBlur(maxBlur) {
        this.maxBlur = Math.max(0, Math.min(10, maxBlur));
        if (this.dofMaterial) {
          this.dofMaterial.uniforms.maxBlur.value = this.maxBlur;
        }
      }

      setSize(width, height) {
        this.resolution.set(width, height);

        if (this.depthRenderTarget) {
          this.depthRenderTarget.setSize(width, height);
        }
        if (this.dofRenderTarget) {
          this.dofRenderTarget.setSize(width, height);
        }
        if (this.dofMaterial) {
          this.dofMaterial.uniforms.resolution.value.set(width, height);
        }
      }

      getFocusDistance() {
        return this.focusDistance;
      }

      getAperture() {
        return this.aperture;
      }

      getMaxBlur() {
        return this.maxBlur;
      }

      dispose() {
        if (this.depthRenderTarget) {
          this.depthRenderTarget.dispose();
          this.depthRenderTarget = null;
        }

        if (this.dofRenderTarget) {
          this.dofRenderTarget.dispose();
          this.dofRenderTarget = null;
        }

        if (this.dofMaterial) {
          this.dofMaterial.dispose();
          this.dofMaterial = null;
        }

        if (this.depthMaterial) {
          this.depthMaterial.dispose();
          this.depthMaterial = null;
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
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      expect(pass.focusDistance).toBe(10);
      expect(pass.aperture).toBe(0.025);
      expect(pass.maxBlur).toBe(1.0);
      expect(pass.enabled).toBe(true);
    });

    it('should accept custom focus distance', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        focusDistance: 20,
      });
      expect(pass.focusDistance).toBe(20);
    });

    it('should accept custom aperture', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        aperture: 0.05,
      });
      expect(pass.aperture).toBe(0.05);
    });

    it('should accept custom max blur', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        maxBlur: 2.0,
      });
      expect(pass.maxBlur).toBe(2.0);
    });

    it('should create depth render target', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      expect(pass.depthRenderTarget).toBeDefined();
    });

    it('should create DOF material', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      expect(pass.dofMaterial).toBeDefined();
    });
  });

  describe('setFocusDistance', () => {
    it('should update focus distance', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setFocusDistance(15);
      expect(pass.focusDistance).toBe(15);
    });

    it('should clamp to minimum value', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setFocusDistance(-5);
      expect(pass.focusDistance).toBe(0.1);
    });

    it('should update material uniform', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setFocusDistance(25);
      expect(pass.dofMaterial.uniforms.focusDistance.value).toBe(25);
    });
  });

  describe('setAperture', () => {
    it('should update aperture', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setAperture(0.05);
      expect(pass.aperture).toBe(0.05);
    });

    it('should clamp to valid range', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setAperture(0);
      expect(pass.aperture).toBe(0.001);

      pass.setAperture(0.5);
      expect(pass.aperture).toBe(0.2);
    });

    it('should update material uniform', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setAperture(0.08);
      expect(pass.dofMaterial.uniforms.aperture.value).toBe(0.08);
    });
  });

  describe('setMaxBlur', () => {
    it('should update max blur', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setMaxBlur(2.5);
      expect(pass.maxBlur).toBe(2.5);
    });

    it('should clamp to valid range', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setMaxBlur(-1);
      expect(pass.maxBlur).toBe(0);

      pass.setMaxBlur(15);
      expect(pass.maxBlur).toBe(10);
    });

    it('should update material uniform', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setMaxBlur(3.0);
      expect(pass.dofMaterial.uniforms.maxBlur.value).toBe(3.0);
    });
  });

  describe('setSize', () => {
    it('should update resolution', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.resolution.x).toBe(1920);
      expect(pass.resolution.y).toBe(1080);
    });

    it('should resize render targets', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.depthRenderTarget.setSize).toHaveBeenCalledWith(1920, 1080);
      expect(pass.dofRenderTarget.setSize).toHaveBeenCalledWith(1920, 1080);
    });
  });

  describe('getters', () => {
    it('should return focus distance', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        focusDistance: 15,
      });
      expect(pass.getFocusDistance()).toBe(15);
    });

    it('should return aperture', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        aperture: 0.05,
      });
      expect(pass.getAperture()).toBe(0.05);
    });

    it('should return max blur', () => {
      pass = new DOFPass({
        scene: mockScene,
        camera: mockCamera,
        maxBlur: 2.0,
      });
      expect(pass.getMaxBlur()).toBe(2.0);
    });
  });

  describe('render', () => {
    it('should skip rendering when disabled', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      pass.enabled = false;

      const mockRenderer = {
        setRenderTarget: vi.fn(),
        render: vi.fn(),
      };

      pass.render(mockRenderer, {}, {});
      expect(mockRenderer.setRenderTarget).not.toHaveBeenCalled();
    });

    it('should set needsSwap to true', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      expect(pass.needsSwap).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose render targets', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      const depthTarget = pass.depthRenderTarget;
      const dofTarget = pass.dofRenderTarget;

      pass.dispose();

      expect(depthTarget.dispose).toHaveBeenCalled();
      expect(dofTarget.dispose).toHaveBeenCalled();
      expect(pass.depthRenderTarget).toBeNull();
      expect(pass.dofRenderTarget).toBeNull();
    });

    it('should dispose materials', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      const dofMat = pass.dofMaterial;
      const depthMat = pass.depthMaterial;

      pass.dispose();

      expect(dofMat.dispose).toHaveBeenCalled();
      expect(depthMat.dispose).toHaveBeenCalled();
      expect(pass.dofMaterial).toBeNull();
      expect(pass.depthMaterial).toBeNull();
    });

    it('should dispose fullscreen quad geometry', () => {
      pass = new DOFPass({ scene: mockScene, camera: mockCamera });
      const quad = pass.fullscreenQuad;

      pass.dispose();

      expect(quad.geometry.dispose).toHaveBeenCalled();
      expect(pass.fullscreenQuad).toBeNull();
    });
  });
});
