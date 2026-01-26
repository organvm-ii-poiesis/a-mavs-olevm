/**
 * @file SSAOPass.js
 * @description Screen-Space Ambient Occlusion post-processing pass
 * Adds realistic shadowing in crevices and corners
 */

'use strict';

/**
 * SSAOPass - Screen-Space Ambient Occlusion effect
 * Samples hemisphere around each pixel to calculate occlusion
 * @class
 * @extends THREE.Pass (conceptually)
 */
class SSAOPass {
  /**
   * @param {Object} options - Configuration options
   * @param {THREE.Vector2} options.resolution - Render resolution
   * @param {THREE.Scene} options.scene - Scene to render
   * @param {THREE.Camera} options.camera - Camera for calculations
   * @param {number} [options.radius=0.5] - Sample radius in world units
   * @param {number} [options.intensity=1.0] - SSAO intensity
   * @param {number} [options.bias=0.025] - Depth bias to prevent self-occlusion
   * @param {string} [options.quality='medium'] - Quality preset: 'low', 'medium', 'high'
   */
  constructor(options = {}) {
    const {
      resolution = new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera,
      radius = 0.5,
      intensity = 1.0,
      bias = 0.025,
      quality = 'medium',
    } = options;

    this.resolution = resolution;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.needsSwap = true;

    // SSAO parameters
    this.radius = radius;
    this.intensity = intensity;
    this.bias = bias;

    // Quality presets (affects sample count and blur)
    this.qualitySettings = {
      low: { kernelSize: 8, blurPasses: 1, noiseSize: 4, downscale: 2 },
      medium: { kernelSize: 16, blurPasses: 2, noiseSize: 4, downscale: 1 },
      high: { kernelSize: 32, blurPasses: 2, noiseSize: 8, downscale: 1 },
    };
    this.quality = this.qualitySettings[quality] || this.qualitySettings.medium;

    // Generate sample kernel
    this._generateKernel();

    // Create noise texture
    this._createNoiseTexture();

    // Create render targets
    this._createRenderTargets();

    // Create materials
    this._createMaterials();

    // Create fullscreen quad
    this._createFullscreenQuad();
  }

  /**
   * Generate hemisphere sample kernel
   * @private
   */
  _generateKernel() {
    const kernelSize = this.quality.kernelSize;
    this.kernel = [];

    for (let i = 0; i < kernelSize; i++) {
      // Generate random point in hemisphere
      const sample = new THREE.Vector3(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random() // Only positive z (hemisphere)
      );

      sample.normalize();

      // Scale sample to distribute more points closer to origin
      let scale = i / kernelSize;
      scale = 0.1 + scale * scale * 0.9; // Lerp between 0.1 and 1.0
      sample.multiplyScalar(scale);

      this.kernel.push(sample);
    }
  }

  /**
   * Create noise texture for sample rotation
   * @private
   */
  _createNoiseTexture() {
    const noiseSize = this.quality.noiseSize;
    const size = noiseSize * noiseSize;
    const data = new Float32Array(size * 4);

    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      // Random rotation vector in tangent space
      data[stride] = Math.random() * 2.0 - 1.0;
      data[stride + 1] = Math.random() * 2.0 - 1.0;
      data[stride + 2] = 0.0;
      data[stride + 3] = 1.0;
    }

    this.noiseTexture = new THREE.DataTexture(
      data,
      noiseSize,
      noiseSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.noiseTexture.wrapS = THREE.RepeatWrapping;
    this.noiseTexture.wrapT = THREE.RepeatWrapping;
    this.noiseTexture.needsUpdate = true;
  }

  /**
   * Create render targets
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

    const downscale = this.quality.downscale;
    const ssaoWidth = Math.floor(this.resolution.x / downscale);
    const ssaoHeight = Math.floor(this.resolution.y / downscale);

    // Depth and normal target
    this.normalDepthTarget = new THREE.WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y,
      depthParams
    );
    this.normalDepthTarget.depthBuffer = true;
    this.normalDepthTarget.depthTexture = new THREE.DepthTexture();
    this.normalDepthTarget.depthTexture.type = THREE.UnsignedIntType;

    // SSAO target (potentially downscaled)
    this.ssaoTarget = new THREE.WebGLRenderTarget(
      ssaoWidth,
      ssaoHeight,
      params
    );

    // Blur targets
    this.blurTargetH = new THREE.WebGLRenderTarget(
      ssaoWidth,
      ssaoHeight,
      params
    );
    this.blurTargetV = new THREE.WebGLRenderTarget(
      ssaoWidth,
      ssaoHeight,
      params
    );
  }

  /**
   * Create shader materials
   * @private
   */
  _createMaterials() {
    // Normal + Depth material
    this.normalDepthMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        varying vec4 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * vViewPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec4 vViewPosition;

        void main() {
          // Pack normal into RGB, depth into A
          vec3 normal = normalize(vNormal) * 0.5 + 0.5;
          float depth = -vViewPosition.z;
          gl_FragColor = vec4(normal, depth);
        }
      `,
    });

    // SSAO calculation material
    const kernelArray = [];
    this.kernel.forEach(k => kernelArray.push(k.x, k.y, k.z));

    this.ssaoMaterial = new THREE.ShaderMaterial({
      defines: {
        KERNEL_SIZE: this.quality.kernelSize,
      },
      uniforms: {
        tNormalDepth: { value: null },
        tDepth: { value: null },
        tNoise: { value: this.noiseTexture },
        kernel: { value: this.kernel },
        resolution: { value: new THREE.Vector2() },
        noiseScale: { value: new THREE.Vector2() },
        radius: { value: this.radius },
        intensity: { value: this.intensity },
        bias: { value: this.bias },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000 },
        projectionMatrix: { value: new THREE.Matrix4() },
        inverseProjectionMatrix: { value: new THREE.Matrix4() },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tNormalDepth;
        uniform sampler2D tDepth;
        uniform sampler2D tNoise;
        uniform vec3 kernel[KERNEL_SIZE];
        uniform vec2 resolution;
        uniform vec2 noiseScale;
        uniform float radius;
        uniform float intensity;
        uniform float bias;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform mat4 projectionMatrix;
        uniform mat4 inverseProjectionMatrix;

        varying vec2 vUv;

        float getLinearDepth(float depth) {
          float z = depth * 2.0 - 1.0;
          return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }

        vec3 getViewPosition(vec2 uv, float depth) {
          vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          vec4 viewPos = inverseProjectionMatrix * clipPos;
          return viewPos.xyz / viewPos.w;
        }

        void main() {
          // Get normal and depth
          vec4 normalDepth = texture2D(tNormalDepth, vUv);
          vec3 normal = normalize(normalDepth.rgb * 2.0 - 1.0);
          float depth = texture2D(tDepth, vUv).r;

          // Skip background
          if (depth >= 1.0) {
            gl_FragColor = vec4(1.0);
            return;
          }

          // Get view-space position
          vec3 viewPos = getViewPosition(vUv, depth);

          // Get random rotation vector
          vec3 randomVec = texture2D(tNoise, vUv * noiseScale).xyz * 2.0 - 1.0;

          // Create TBN matrix
          vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
          vec3 bitangent = cross(normal, tangent);
          mat3 TBN = mat3(tangent, bitangent, normal);

          // Calculate occlusion
          float occlusion = 0.0;

          for (int i = 0; i < KERNEL_SIZE; i++) {
            // Transform sample to view space
            vec3 samplePos = TBN * kernel[i];
            samplePos = viewPos + samplePos * radius;

            // Project sample to screen space
            vec4 offset = projectionMatrix * vec4(samplePos, 1.0);
            offset.xyz /= offset.w;
            offset.xy = offset.xy * 0.5 + 0.5;

            // Get depth at sample position
            float sampleDepth = texture2D(tDepth, offset.xy).r;
            float sampleLinearDepth = getLinearDepth(sampleDepth);

            // Range check and accumulate
            float rangeCheck = smoothstep(0.0, 1.0, radius / abs(-viewPos.z - sampleLinearDepth));
            occlusion += (sampleLinearDepth <= -samplePos.z - bias ? 1.0 : 0.0) * rangeCheck;
          }

          occlusion = 1.0 - (occlusion / float(KERNEL_SIZE));
          occlusion = pow(occlusion, intensity);

          gl_FragColor = vec4(vec3(occlusion), 1.0);
        }
      `,
    });

    // Bilateral blur material (preserves edges)
    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        resolution: { value: new THREE.Vector2() },
        direction: { value: new THREE.Vector2(1, 0) },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000 },
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
        uniform vec2 direction;
        uniform float cameraNear;
        uniform float cameraFar;

        varying vec2 vUv;

        float getLinearDepth(float depth) {
          float z = depth * 2.0 - 1.0;
          return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }

        void main() {
          vec2 texelSize = 1.0 / resolution;
          float centerDepth = getLinearDepth(texture2D(tDepth, vUv).r);

          float result = 0.0;
          float totalWeight = 0.0;

          // Bilateral filter weights
          float weights[5];
          weights[0] = 0.0625;
          weights[1] = 0.25;
          weights[2] = 0.375;
          weights[3] = 0.25;
          weights[4] = 0.0625;

          for (int i = -2; i <= 2; i++) {
            vec2 offset = direction * texelSize * float(i);
            vec2 sampleUv = vUv + offset;

            float sampleValue = texture2D(tDiffuse, sampleUv).r;
            float sampleDepth = getLinearDepth(texture2D(tDepth, sampleUv).r);

            // Edge-aware weight
            float depthDiff = abs(centerDepth - sampleDepth);
            float edgeWeight = exp(-depthDiff * depthDiff * 10.0);

            float weight = weights[i + 2] * edgeWeight;
            result += sampleValue * weight;
            totalWeight += weight;
          }

          gl_FragColor = vec4(vec3(result / totalWeight), 1.0);
        }
      `,
    });

    // Composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tSSAO: { value: null },
        intensity: { value: this.intensity },
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
        uniform sampler2D tSSAO;
        uniform float intensity;

        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float ao = texture2D(tSSAO, vUv).r;

          // Apply ambient occlusion
          color.rgb *= mix(1.0, ao, intensity);

          gl_FragColor = color;
        }
      `,
    });
  }

  /**
   * Create fullscreen quad
   * @private
   */
  _createFullscreenQuad() {
    this.fsQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.ssaoMaterial
    );
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.fsQuad);
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Set radius
   * @param {number} radius - Sample radius in world units
   */
  setRadius(radius) {
    this.radius = radius;
    this.ssaoMaterial.uniforms.radius.value = radius;
  }

  /**
   * Set intensity
   * @param {number} intensity - SSAO intensity
   */
  setIntensity(intensity) {
    this.intensity = intensity;
    this.ssaoMaterial.uniforms.intensity.value = intensity;
    this.compositeMaterial.uniforms.intensity.value = intensity;
  }

  /**
   * Set bias
   * @param {number} bias - Depth bias
   */
  setBias(bias) {
    this.bias = bias;
    this.ssaoMaterial.uniforms.bias.value = bias;
  }

  /**
   * Get current parameters
   * @returns {Object} Current SSAO parameters
   */
  getParams() {
    return {
      radius: this.radius,
      intensity: this.intensity,
      bias: this.bias,
    };
  }

  /**
   * Set parameters
   * @param {Object} params - Parameters to update
   */
  setParams(params = {}) {
    if (params.radius !== undefined) {
      this.setRadius(params.radius);
    }
    if (params.intensity !== undefined) {
      this.setIntensity(params.intensity);
    }
    if (params.bias !== undefined) {
      this.setBias(params.bias);
    }
  }

  /**
   * Render the SSAO effect
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.WebGLRenderTarget} writeBuffer
   * @param {THREE.WebGLRenderTarget} readBuffer
   */
  render(renderer, writeBuffer, readBuffer) {
    if (!this.enabled) {
      return;
    }

    const downscale = this.quality.downscale;
    const ssaoWidth = Math.floor(this.resolution.x / downscale);
    const ssaoHeight = Math.floor(this.resolution.y / downscale);

    // Update uniforms
    this.ssaoMaterial.uniforms.resolution.value.set(ssaoWidth, ssaoHeight);
    this.ssaoMaterial.uniforms.noiseScale.value.set(
      ssaoWidth / this.quality.noiseSize,
      ssaoHeight / this.quality.noiseSize
    );
    this.ssaoMaterial.uniforms.cameraNear.value = this.camera.near;
    this.ssaoMaterial.uniforms.cameraFar.value = this.camera.far;
    this.ssaoMaterial.uniforms.projectionMatrix.value.copy(
      this.camera.projectionMatrix
    );
    this.ssaoMaterial.uniforms.inverseProjectionMatrix.value
      .copy(this.camera.projectionMatrix)
      .invert();

    this.blurMaterial.uniforms.resolution.value.set(ssaoWidth, ssaoHeight);
    this.blurMaterial.uniforms.cameraNear.value = this.camera.near;
    this.blurMaterial.uniforms.cameraFar.value = this.camera.far;

    // Pass 1: Render normals and depth
    const originalOverrideMaterial = this.scene.overrideMaterial;
    this.scene.overrideMaterial = this.normalDepthMaterial;
    renderer.setRenderTarget(this.normalDepthTarget);
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = originalOverrideMaterial;

    // Pass 2: Calculate SSAO
    this.ssaoMaterial.uniforms.tNormalDepth.value =
      this.normalDepthTarget.texture;
    this.ssaoMaterial.uniforms.tDepth.value =
      this.normalDepthTarget.depthTexture;
    this.fsQuad.material = this.ssaoMaterial;
    renderer.setRenderTarget(this.ssaoTarget);
    renderer.render(this.fsScene, this.fsCamera);

    // Pass 3-4: Bilateral blur
    let blurInput = this.ssaoTarget;
    let blurOutput = this.blurTargetH;

    for (let i = 0; i < this.quality.blurPasses; i++) {
      // Horizontal blur
      this.blurMaterial.uniforms.tDiffuse.value = blurInput.texture;
      this.blurMaterial.uniforms.tDepth.value =
        this.normalDepthTarget.depthTexture;
      this.blurMaterial.uniforms.direction.value.set(1, 0);
      this.fsQuad.material = this.blurMaterial;
      renderer.setRenderTarget(blurOutput);
      renderer.render(this.fsScene, this.fsCamera);

      // Vertical blur
      this.blurMaterial.uniforms.tDiffuse.value = blurOutput.texture;
      this.blurMaterial.uniforms.direction.value.set(0, 1);
      renderer.setRenderTarget(this.blurTargetV);
      renderer.render(this.fsScene, this.fsCamera);

      blurInput = this.blurTargetV;
      blurOutput = this.blurTargetH;
    }

    // Pass 5: Composite
    this.compositeMaterial.uniforms.tDiffuse.value = readBuffer.texture;
    this.compositeMaterial.uniforms.tSSAO.value = this.blurTargetV.texture;
    this.fsQuad.material = this.compositeMaterial;
    renderer.setRenderTarget(writeBuffer);
    renderer.render(this.fsScene, this.fsCamera);
  }

  /**
   * Handle resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.resolution.set(width, height);

    const downscale = this.quality.downscale;
    const ssaoWidth = Math.floor(width / downscale);
    const ssaoHeight = Math.floor(height / downscale);

    this.normalDepthTarget.setSize(width, height);
    this.ssaoTarget.setSize(ssaoWidth, ssaoHeight);
    this.blurTargetH.setSize(ssaoWidth, ssaoHeight);
    this.blurTargetV.setSize(ssaoWidth, ssaoHeight);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.normalDepthTarget.dispose();
    this.ssaoTarget.dispose();
    this.blurTargetH.dispose();
    this.blurTargetV.dispose();

    this.noiseTexture.dispose();
    this.normalDepthMaterial.dispose();
    this.ssaoMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();

    this.fsQuad.geometry.dispose();
  }
}

// Export for global scope
window.SSAOPass = SSAOPass;
