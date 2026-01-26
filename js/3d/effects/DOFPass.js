/**
 * @file DOFPass.js
 * @description Bokeh-style Depth of Field post-processing pass
 * Creates cinematic focus effects with customizable aperture and blur
 */

'use strict';

/**
 * DOFPass - Depth of Field post-processing effect
 * Uses depth buffer for distance calculation with optimized downsampled blur
 * @class
 * @extends THREE.Pass (conceptually)
 */
class DOFPass {
  /**
   * @param {Object} options - Configuration options
   * @param {THREE.Vector2} options.resolution - Render resolution
   * @param {THREE.Scene} options.scene - Scene to render
   * @param {THREE.Camera} options.camera - Camera for depth calculation
   * @param {number} [options.focusDistance=10] - Distance to focus point
   * @param {number} [options.aperture=0.025] - Aperture size (affects blur intensity)
   * @param {number} [options.maxBlur=1.0] - Maximum blur radius
   * @param {string} [options.quality='medium'] - Quality preset: 'low', 'medium', 'high'
   */
  constructor(options = {}) {
    const {
      resolution = new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera,
      focusDistance = 10,
      aperture = 0.025,
      maxBlur = 1.0,
      quality = 'medium',
    } = options;

    this.resolution = resolution;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.needsSwap = true;

    // DOF parameters
    this.focusDistance = focusDistance;
    this.aperture = aperture;
    this.maxBlur = maxBlur;

    // Quality presets affect blur samples and downscale factor
    this.qualitySettings = {
      low: { samples: 4, downscale: 4 },
      medium: { samples: 8, downscale: 2 },
      high: { samples: 16, downscale: 1 },
    };
    this.quality = this.qualitySettings[quality] || this.qualitySettings.medium;

    // Create render targets
    this._createRenderTargets();

    // Create materials
    this._createMaterials();

    // Create fullscreen quad
    this._createFullscreenQuad();
  }

  /**
   * Create render targets for DOF processing
   * @private
   */
  _createRenderTargets() {
    const params = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    };

    const depthParams = {
      ...params,
      type: THREE.FloatType,
    };

    // Full resolution depth
    this.depthTarget = new THREE.WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y,
      depthParams
    );
    this.depthTarget.depthBuffer = true;
    this.depthTarget.depthTexture = new THREE.DepthTexture();
    this.depthTarget.depthTexture.type = THREE.UnsignedIntType;

    // Downsampled blur targets
    const blurWidth = Math.floor(this.resolution.x / this.quality.downscale);
    const blurHeight = Math.floor(this.resolution.y / this.quality.downscale);

    this.blurTargetH = new THREE.WebGLRenderTarget(
      blurWidth,
      blurHeight,
      params
    );
    this.blurTargetV = new THREE.WebGLRenderTarget(
      blurWidth,
      blurHeight,
      params
    );
  }

  /**
   * Create shader materials for DOF
   * @private
   */
  _createMaterials() {
    // Depth extraction material (renders scene to get depth)
    this.depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });

    // Bokeh blur material (horizontal pass)
    this.blurMaterialH = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        resolution: { value: new THREE.Vector2() },
        focusDistance: { value: this.focusDistance },
        aperture: { value: this.aperture },
        maxBlur: { value: this.maxBlur },
        nearClip: { value: 0.1 },
        farClip: { value: 1000 },
        direction: { value: new THREE.Vector2(1, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform vec2 resolution;
        uniform float focusDistance;
        uniform float aperture;
        uniform float maxBlur;
        uniform float nearClip;
        uniform float farClip;
        uniform vec2 direction;

        varying vec2 vUv;

        float getDepth(vec2 uv) {
          float depth = texture2D(tDepth, uv).r;
          // Convert from [0,1] to linear depth
          float z = depth * 2.0 - 1.0;
          return (2.0 * nearClip * farClip) / (farClip + nearClip - z * (farClip - nearClip));
        }

        float getBlurSize(float depth) {
          float coc = aperture * abs(depth - focusDistance) / depth;
          return clamp(coc, 0.0, maxBlur);
        }

        void main() {
          float centerDepth = getDepth(vUv);
          float blur = getBlurSize(centerDepth);

          vec2 texelSize = 1.0 / resolution;
          vec4 result = vec4(0.0);
          float totalWeight = 0.0;

          // Bokeh-style disc sampling with ${this.quality.samples} samples
          const int SAMPLES = ${this.quality.samples};
          float sampleCount = float(SAMPLES);

          for (int i = -SAMPLES / 2; i <= SAMPLES / 2; i++) {
            float offset = float(i);
            vec2 sampleUv = vUv + direction * texelSize * offset * blur * 4.0;

            // Sample and weight
            vec4 sampleColor = texture2D(tDiffuse, sampleUv);
            float sampleDepth = getDepth(sampleUv);

            // Bokeh weight (circular falloff)
            float weight = 1.0 - abs(offset) / (sampleCount * 0.5);
            weight = weight * weight; // Quadratic falloff for bokeh shape

            // Depth-aware weighting (prevent bleed from sharp to blurred)
            float depthDiff = abs(sampleDepth - centerDepth);
            weight *= smoothstep(blur * 10.0, 0.0, depthDiff);

            result += sampleColor * weight;
            totalWeight += weight;
          }

          gl_FragColor = result / totalWeight;
        }
      `,
    });

    // Vertical blur pass (same shader, different direction)
    this.blurMaterialV = this.blurMaterialH.clone();
    this.blurMaterialV.uniforms.direction.value = new THREE.Vector2(0, 1);

    // Final composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tBlurred: { value: null },
        tDepth: { value: null },
        focusDistance: { value: this.focusDistance },
        aperture: { value: this.aperture },
        maxBlur: { value: this.maxBlur },
        nearClip: { value: 0.1 },
        farClip: { value: 1000 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tBlurred;
        uniform sampler2D tDepth;
        uniform float focusDistance;
        uniform float aperture;
        uniform float maxBlur;
        uniform float nearClip;
        uniform float farClip;

        varying vec2 vUv;

        float getDepth(vec2 uv) {
          float depth = texture2D(tDepth, uv).r;
          float z = depth * 2.0 - 1.0;
          return (2.0 * nearClip * farClip) / (farClip + nearClip - z * (farClip - nearClip));
        }

        void main() {
          float depth = getDepth(vUv);
          float coc = aperture * abs(depth - focusDistance) / depth;
          float blurAmount = clamp(coc / maxBlur, 0.0, 1.0);

          vec4 sharp = texture2D(tDiffuse, vUv);
          vec4 blurred = texture2D(tBlurred, vUv);

          // Smooth transition between sharp and blurred
          gl_FragColor = mix(sharp, blurred, smoothstep(0.0, 0.3, blurAmount));
        }
      `,
    });
  }

  /**
   * Create fullscreen quad for rendering
   * @private
   */
  _createFullscreenQuad() {
    this.fsQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.blurMaterialH
    );
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.fsQuad);
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Set focus distance
   * @param {number} distance - Distance to focus point
   */
  setFocusDistance(distance) {
    this.focusDistance = distance;
    this.blurMaterialH.uniforms.focusDistance.value = distance;
    this.blurMaterialV.uniforms.focusDistance.value = distance;
    this.compositeMaterial.uniforms.focusDistance.value = distance;
  }

  /**
   * Set aperture
   * @param {number} aperture - Aperture size (affects blur intensity)
   */
  setAperture(aperture) {
    this.aperture = aperture;
    this.blurMaterialH.uniforms.aperture.value = aperture;
    this.blurMaterialV.uniforms.aperture.value = aperture;
    this.compositeMaterial.uniforms.aperture.value = aperture;
  }

  /**
   * Set maximum blur
   * @param {number} maxBlur - Maximum blur radius
   */
  setMaxBlur(maxBlur) {
    this.maxBlur = maxBlur;
    this.blurMaterialH.uniforms.maxBlur.value = maxBlur;
    this.blurMaterialV.uniforms.maxBlur.value = maxBlur;
    this.compositeMaterial.uniforms.maxBlur.value = maxBlur;
  }

  /**
   * Update camera clip planes
   * @param {number} near - Near clip plane
   * @param {number} far - Far clip plane
   */
  setClipPlanes(near, far) {
    this.blurMaterialH.uniforms.nearClip.value = near;
    this.blurMaterialH.uniforms.farClip.value = far;
    this.blurMaterialV.uniforms.nearClip.value = near;
    this.blurMaterialV.uniforms.farClip.value = far;
    this.compositeMaterial.uniforms.nearClip.value = near;
    this.compositeMaterial.uniforms.farClip.value = far;
  }

  /**
   * Get current parameters
   * @returns {Object} Current DOF parameters
   */
  getParams() {
    return {
      focusDistance: this.focusDistance,
      aperture: this.aperture,
      maxBlur: this.maxBlur,
    };
  }

  /**
   * Set parameters
   * @param {Object} params - Parameters to update
   */
  setParams(params = {}) {
    if (params.focusDistance !== undefined) {
      this.setFocusDistance(params.focusDistance);
    }
    if (params.aperture !== undefined) {
      this.setAperture(params.aperture);
    }
    if (params.maxBlur !== undefined) {
      this.setMaxBlur(params.maxBlur);
    }
  }

  /**
   * Render the DOF effect
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.WebGLRenderTarget} writeBuffer
   * @param {THREE.WebGLRenderTarget} readBuffer
   */
  render(renderer, writeBuffer, readBuffer) {
    if (!this.enabled) {
      return;
    }

    // Store original render target
    const currentRenderTarget = renderer.getRenderTarget();

    // Update resolution uniforms
    const blurWidth = Math.floor(this.resolution.x / this.quality.downscale);
    const blurHeight = Math.floor(this.resolution.y / this.quality.downscale);
    this.blurMaterialH.uniforms.resolution.value.set(blurWidth, blurHeight);
    this.blurMaterialV.uniforms.resolution.value.set(blurWidth, blurHeight);

    // Render scene to depth target (to get depth texture)
    renderer.setRenderTarget(this.depthTarget);
    renderer.render(this.scene, this.camera);

    // Pass 1: Horizontal blur
    this.blurMaterialH.uniforms.tDiffuse.value = readBuffer.texture;
    this.blurMaterialH.uniforms.tDepth.value = this.depthTarget.depthTexture;
    this.fsQuad.material = this.blurMaterialH;
    renderer.setRenderTarget(this.blurTargetH);
    renderer.render(this.fsScene, this.fsCamera);

    // Pass 2: Vertical blur
    this.blurMaterialV.uniforms.tDiffuse.value = this.blurTargetH.texture;
    this.blurMaterialV.uniforms.tDepth.value = this.depthTarget.depthTexture;
    this.fsQuad.material = this.blurMaterialV;
    renderer.setRenderTarget(this.blurTargetV);
    renderer.render(this.fsScene, this.fsCamera);

    // Pass 3: Composite
    this.compositeMaterial.uniforms.tDiffuse.value = readBuffer.texture;
    this.compositeMaterial.uniforms.tBlurred.value = this.blurTargetV.texture;
    this.compositeMaterial.uniforms.tDepth.value =
      this.depthTarget.depthTexture;
    this.fsQuad.material = this.compositeMaterial;
    renderer.setRenderTarget(writeBuffer);
    renderer.render(this.fsScene, this.fsCamera);

    // Restore render target
    renderer.setRenderTarget(currentRenderTarget);
  }

  /**
   * Handle resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.resolution.set(width, height);

    this.depthTarget.setSize(width, height);

    const blurWidth = Math.floor(width / this.quality.downscale);
    const blurHeight = Math.floor(height / this.quality.downscale);
    this.blurTargetH.setSize(blurWidth, blurHeight);
    this.blurTargetV.setSize(blurWidth, blurHeight);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.depthTarget.dispose();
    this.blurTargetH.dispose();
    this.blurTargetV.dispose();

    this.depthMaterial.dispose();
    this.blurMaterialH.dispose();
    this.blurMaterialV.dispose();
    this.compositeMaterial.dispose();

    this.fsQuad.geometry.dispose();
  }
}

// Export for global scope
window.DOFPass = DOFPass;
