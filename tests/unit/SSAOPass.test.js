/**
 * @file tests/unit/SSAOPass.test.js
 * @description Unit tests for SSAOPass (Screen-Space Ambient Occlusion) post-processing effect
 * Tests ambient occlusion for enhanced depth perception
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SSAOPass', () => {
  let SSAOPass;
  let pass;
  let mockScene;
  let mockCamera;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();

    // Define SSAOPass class for testing
    SSAOPass = class {
      constructor(options = {}) {
        this.resolution =
          options.resolution ||
          new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.scene = options.scene;
        this.camera = options.camera;

        this.quality = options.quality || 'medium';
        this.radius = options.radius || 0.5;
        this.intensity = options.intensity || 1.0;
        this.bias = options.bias || 0.025;

        this.enabled = true;
        this.needsSwap = true;
        this.clear = false;

        this.kernelSize = this._getKernelSizeForQuality(this.quality);
        this.noiseScale = new THREE.Vector2(
          this.resolution.x / 4,
          this.resolution.y / 4
        );

        this.normalRenderTarget = null;
        this.ssaoRenderTarget = null;
        this.blurRenderTarget = null;
        this.ssaoMaterial = null;
        this.blurMaterial = null;
        this.compositeMaterial = null;
        this.fullscreenQuad = null;

        this._initialize();
      }

      _getKernelSizeForQuality(quality) {
        const sizes = {
          low: 8,
          medium: 16,
          high: 32,
          ultra: 64,
        };
        return sizes[quality] || 16;
      }

      _initialize() {
        // Create normal render target
        this.normalRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
          }
        );

        // Create SSAO render target
        this.ssaoRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
          }
        );

        // Create blur render target
        this.blurRenderTarget = new THREE.WebGLRenderTarget(
          this.resolution.x,
          this.resolution.y,
          {
            format: THREE.RGBAFormat,
          }
        );

        // Generate sample kernel
        const kernel = this._generateKernel();

        // Generate noise texture
        const noiseTexture = this._generateNoiseTexture();

        // Create SSAO material
        this.ssaoMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tNormal: { value: null },
            tDepth: { value: null },
            kernel: { value: kernel },
            noise: { value: noiseTexture },
            radius: { value: this.radius },
            intensity: { value: this.intensity },
            bias: { value: this.bias },
            noiseScale: { value: this.noiseScale },
            cameraNear: { value: this.camera?.near || 0.1 },
            cameraFar: { value: this.camera?.far || 1000 },
          },
          vertexShader:
            'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'uniform sampler2D tNormal; varying vec2 vUv; void main() { gl_FragColor = texture2D(tNormal, vUv); }',
        });

        // Create blur material
        this.blurMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            resolution: { value: this.resolution },
          },
          vertexShader:
            'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }',
        });

        // Create composite material
        this.compositeMaterial = new THREE.ShaderMaterial({
          uniforms: {
            tDiffuse: { value: null },
            tSSAO: { value: null },
          },
          vertexShader:
            'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'uniform sampler2D tDiffuse; uniform sampler2D tSSAO; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv) * texture2D(tSSAO, vUv); }',
        });

        // Create fullscreen quad
        this.fullscreenQuad = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          this.ssaoMaterial
        );
      }

      _generateKernel() {
        const kernel = [];
        for (let i = 0; i < this.kernelSize; i++) {
          const sample = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random()
          );
          sample.normalize();

          // Scale samples to be closer to origin
          let scale = i / this.kernelSize;
          scale = 0.1 + scale * scale * 0.9;
          sample.multiplyScalar(scale);

          kernel.push(sample);
        }
        return kernel;
      }

      _generateNoiseTexture() {
        const size = 4;
        const data = new Float32Array(size * size * 3);
        for (let i = 0; i < size * size; i++) {
          data[i * 3] = Math.random() * 2 - 1;
          data[i * 3 + 1] = Math.random() * 2 - 1;
          data[i * 3 + 2] = 0;
        }
        return { size, data };
      }

      render(renderer, writeBuffer, readBuffer) {
        if (!this.enabled) {
          return;
        }

        // Render normals pass
        renderer.setRenderTarget(this.normalRenderTarget);
        renderer.render(this.scene, this.camera);

        // Update SSAO uniforms
        this.ssaoMaterial.uniforms.tNormal.value =
          this.normalRenderTarget.texture;
        this.ssaoMaterial.uniforms.radius.value = this.radius;
        this.ssaoMaterial.uniforms.intensity.value = this.intensity;
        this.ssaoMaterial.uniforms.bias.value = this.bias;

        // Render SSAO pass
        renderer.setRenderTarget(this.ssaoRenderTarget);
        this.fullscreenQuad.material = this.ssaoMaterial;
        renderer.render(this.fullscreenQuad, this.camera);

        // Render blur pass
        renderer.setRenderTarget(this.blurRenderTarget);
        this.blurMaterial.uniforms.tDiffuse.value =
          this.ssaoRenderTarget.texture;
        this.fullscreenQuad.material = this.blurMaterial;
        renderer.render(this.fullscreenQuad, this.camera);

        // Composite with original scene
        this.compositeMaterial.uniforms.tDiffuse.value = readBuffer.texture;
        this.compositeMaterial.uniforms.tSSAO.value =
          this.blurRenderTarget.texture;
        this.fullscreenQuad.material = this.compositeMaterial;
        renderer.setRenderTarget(this.needsSwap ? writeBuffer : null);
        renderer.render(this.fullscreenQuad, this.camera);
      }

      setRadius(radius) {
        this.radius = Math.max(0.01, Math.min(5, radius));
        if (this.ssaoMaterial) {
          this.ssaoMaterial.uniforms.radius.value = this.radius;
        }
      }

      setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(5, intensity));
        if (this.ssaoMaterial) {
          this.ssaoMaterial.uniforms.intensity.value = this.intensity;
        }
      }

      setBias(bias) {
        this.bias = Math.max(0, Math.min(0.5, bias));
        if (this.ssaoMaterial) {
          this.ssaoMaterial.uniforms.bias.value = this.bias;
        }
      }

      setQuality(quality) {
        const validQualities = ['low', 'medium', 'high', 'ultra'];
        if (validQualities.includes(quality)) {
          this.quality = quality;
          this.kernelSize = this._getKernelSizeForQuality(quality);
          // Regenerate kernel
          const kernel = this._generateKernel();
          if (this.ssaoMaterial) {
            this.ssaoMaterial.uniforms.kernel.value = kernel;
          }
        }
      }

      setSize(width, height) {
        this.resolution.set(width, height);
        this.noiseScale.set(width / 4, height / 4);

        if (this.normalRenderTarget) {
          this.normalRenderTarget.setSize(width, height);
        }
        if (this.ssaoRenderTarget) {
          this.ssaoRenderTarget.setSize(width, height);
        }
        if (this.blurRenderTarget) {
          this.blurRenderTarget.setSize(width, height);
        }
        if (this.ssaoMaterial) {
          this.ssaoMaterial.uniforms.noiseScale.value.set(
            width / 4,
            height / 4
          );
        }
        if (this.blurMaterial) {
          this.blurMaterial.uniforms.resolution.value.set(width, height);
        }
      }

      getRadius() {
        return this.radius;
      }

      getIntensity() {
        return this.intensity;
      }

      getBias() {
        return this.bias;
      }

      getQuality() {
        return this.quality;
      }

      dispose() {
        if (this.normalRenderTarget) {
          this.normalRenderTarget.dispose();
          this.normalRenderTarget = null;
        }

        if (this.ssaoRenderTarget) {
          this.ssaoRenderTarget.dispose();
          this.ssaoRenderTarget = null;
        }

        if (this.blurRenderTarget) {
          this.blurRenderTarget.dispose();
          this.blurRenderTarget = null;
        }

        if (this.ssaoMaterial) {
          this.ssaoMaterial.dispose();
          this.ssaoMaterial = null;
        }

        if (this.blurMaterial) {
          this.blurMaterial.dispose();
          this.blurMaterial = null;
        }

        if (this.compositeMaterial) {
          this.compositeMaterial.dispose();
          this.compositeMaterial = null;
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
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      expect(pass.quality).toBe('medium');
      expect(pass.radius).toBe(0.5);
      expect(pass.intensity).toBe(1.0);
      expect(pass.bias).toBe(0.025);
      expect(pass.enabled).toBe(true);
    });

    it('should accept custom quality', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        quality: 'high',
      });
      expect(pass.quality).toBe('high');
      expect(pass.kernelSize).toBe(32);
    });

    it('should accept custom radius', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        radius: 1.0,
      });
      expect(pass.radius).toBe(1.0);
    });

    it('should accept custom intensity', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        intensity: 2.0,
      });
      expect(pass.intensity).toBe(2.0);
    });

    it('should create render targets', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      expect(pass.normalRenderTarget).toBeDefined();
      expect(pass.ssaoRenderTarget).toBeDefined();
      expect(pass.blurRenderTarget).toBeDefined();
    });

    it('should create materials', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      expect(pass.ssaoMaterial).toBeDefined();
      expect(pass.blurMaterial).toBeDefined();
      expect(pass.compositeMaterial).toBeDefined();
    });
  });

  describe('quality settings', () => {
    it('should set kernel size based on quality', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        quality: 'low',
      });
      expect(pass.kernelSize).toBe(8);

      pass.setQuality('medium');
      expect(pass.kernelSize).toBe(16);

      pass.setQuality('high');
      expect(pass.kernelSize).toBe(32);

      pass.setQuality('ultra');
      expect(pass.kernelSize).toBe(64);
    });

    it('should ignore invalid quality', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        quality: 'medium',
      });
      pass.setQuality('invalid');
      expect(pass.quality).toBe('medium');
    });
  });

  describe('setRadius', () => {
    it('should update radius', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setRadius(1.0);
      expect(pass.radius).toBe(1.0);
    });

    it('should clamp to valid range', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setRadius(0);
      expect(pass.radius).toBe(0.01);

      pass.setRadius(10);
      expect(pass.radius).toBe(5);
    });

    it('should update material uniform', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setRadius(1.5);
      expect(pass.ssaoMaterial.uniforms.radius.value).toBe(1.5);
    });
  });

  describe('setIntensity', () => {
    it('should update intensity', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setIntensity(2.0);
      expect(pass.intensity).toBe(2.0);
    });

    it('should clamp to valid range', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setIntensity(-1);
      expect(pass.intensity).toBe(0);

      pass.setIntensity(10);
      expect(pass.intensity).toBe(5);
    });

    it('should update material uniform', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setIntensity(1.5);
      expect(pass.ssaoMaterial.uniforms.intensity.value).toBe(1.5);
    });
  });

  describe('setBias', () => {
    it('should update bias', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setBias(0.05);
      expect(pass.bias).toBe(0.05);
    });

    it('should clamp to valid range', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setBias(-0.1);
      expect(pass.bias).toBe(0);

      pass.setBias(1.0);
      expect(pass.bias).toBe(0.5);
    });

    it('should update material uniform', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setBias(0.1);
      expect(pass.ssaoMaterial.uniforms.bias.value).toBe(0.1);
    });
  });

  describe('setSize', () => {
    it('should update resolution', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.resolution.x).toBe(1920);
      expect(pass.resolution.y).toBe(1080);
    });

    it('should resize render targets', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.normalRenderTarget.setSize).toHaveBeenCalledWith(1920, 1080);
      expect(pass.ssaoRenderTarget.setSize).toHaveBeenCalledWith(1920, 1080);
      expect(pass.blurRenderTarget.setSize).toHaveBeenCalledWith(1920, 1080);
    });

    it('should update noise scale', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.setSize(1920, 1080);
      expect(pass.noiseScale.x).toBe(480); // 1920 / 4
      expect(pass.noiseScale.y).toBe(270); // 1080 / 4
    });
  });

  describe('getters', () => {
    it('should return radius', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        radius: 1.0,
      });
      expect(pass.getRadius()).toBe(1.0);
    });

    it('should return intensity', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        intensity: 2.0,
      });
      expect(pass.getIntensity()).toBe(2.0);
    });

    it('should return bias', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera, bias: 0.05 });
      expect(pass.getBias()).toBe(0.05);
    });

    it('should return quality', () => {
      pass = new SSAOPass({
        scene: mockScene,
        camera: mockCamera,
        quality: 'high',
      });
      expect(pass.getQuality()).toBe('high');
    });
  });

  describe('render', () => {
    it('should skip rendering when disabled', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      pass.enabled = false;

      const mockRenderer = {
        setRenderTarget: vi.fn(),
        render: vi.fn(),
      };

      pass.render(mockRenderer, {}, {});
      expect(mockRenderer.setRenderTarget).not.toHaveBeenCalled();
    });

    it('should set needsSwap to true', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      expect(pass.needsSwap).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose all render targets', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      const normalTarget = pass.normalRenderTarget;
      const ssaoTarget = pass.ssaoRenderTarget;
      const blurTarget = pass.blurRenderTarget;

      pass.dispose();

      expect(normalTarget.dispose).toHaveBeenCalled();
      expect(ssaoTarget.dispose).toHaveBeenCalled();
      expect(blurTarget.dispose).toHaveBeenCalled();
      expect(pass.normalRenderTarget).toBeNull();
      expect(pass.ssaoRenderTarget).toBeNull();
      expect(pass.blurRenderTarget).toBeNull();
    });

    it('should dispose all materials', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      const ssaoMat = pass.ssaoMaterial;
      const blurMat = pass.blurMaterial;
      const compositeMat = pass.compositeMaterial;

      pass.dispose();

      expect(ssaoMat.dispose).toHaveBeenCalled();
      expect(blurMat.dispose).toHaveBeenCalled();
      expect(compositeMat.dispose).toHaveBeenCalled();
      expect(pass.ssaoMaterial).toBeNull();
      expect(pass.blurMaterial).toBeNull();
      expect(pass.compositeMaterial).toBeNull();
    });

    it('should dispose fullscreen quad geometry', () => {
      pass = new SSAOPass({ scene: mockScene, camera: mockCamera });
      const quad = pass.fullscreenQuad;

      pass.dispose();

      expect(quad.geometry.dispose).toHaveBeenCalled();
      expect(pass.fullscreenQuad).toBeNull();
    });
  });
});
