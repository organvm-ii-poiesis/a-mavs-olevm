/**
 * @file MotionBlurPass.js
 * @description Velocity-based motion blur post-processing pass
 * Tracks camera and object movement to apply directional blur
 */

'use strict';

/**
 * MotionBlurPass - Velocity-based motion blur effect
 * Applies directional blur based on camera/object velocity
 * @class
 * @extends THREE.Pass (conceptually)
 */
class MotionBlurPass {
  /**
   * @param {Object} options - Configuration options
   * @param {THREE.Vector2} options.resolution - Render resolution
   * @param {THREE.Camera} options.camera - Camera for velocity tracking
   * @param {number} [options.intensity=1.0] - Motion blur intensity
   * @param {number} [options.samples=8] - Number of blur samples
   * @param {string} [options.quality='medium'] - Quality preset: 'low', 'medium', 'high'
   */
  constructor(options = {}) {
    const {
      resolution = new THREE.Vector2(window.innerWidth, window.innerHeight),
      camera,
      intensity = 1.0,
      samples = 8,
      quality = 'medium',
    } = options;

    this.resolution = resolution;
    this.camera = camera;
    this.enabled = true;
    this.needsSwap = true;

    // Motion blur parameters
    this.intensity = intensity;
    this.samples = samples;

    // Quality presets
    this.qualitySettings = {
      low: { samples: 4, velocityScale: 0.5 },
      medium: { samples: 8, velocityScale: 1.0 },
      high: { samples: 16, velocityScale: 1.5 },
    };
    this.quality = this.qualitySettings[quality] || this.qualitySettings.medium;
    this.samples = this.quality.samples;

    // Previous frame matrices for velocity calculation
    this.previousViewMatrix = new THREE.Matrix4();
    this.previousProjectionMatrix = new THREE.Matrix4();
    this.previousViewProjectionMatrix = new THREE.Matrix4();
    this.currentViewProjectionMatrix = new THREE.Matrix4();
    this.inverseViewProjectionMatrix = new THREE.Matrix4();

    // Track if this is the first frame
    this.isFirstFrame = true;

    // Velocity tracking
    this.previousCameraPosition = new THREE.Vector3();
    this.previousCameraRotation = new THREE.Euler();
    this.cameraVelocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();

    // Create materials
    this._createMaterials();

    // Create fullscreen quad
    this._createFullscreenQuad();
  }

  /**
   * Create shader materials for motion blur
   * @private
   */
  _createMaterials() {
    // Velocity buffer material (calculates per-pixel velocity)
    this.velocityMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        prevViewProjMatrix: { value: new THREE.Matrix4() },
        currViewProjMatrix: { value: new THREE.Matrix4() },
        invViewProjMatrix: { value: new THREE.Matrix4() },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000 },
        velocityScale: { value: this.quality.velocityScale },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDepth;
        uniform mat4 prevViewProjMatrix;
        uniform mat4 currViewProjMatrix;
        uniform mat4 invViewProjMatrix;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float velocityScale;

        varying vec2 vUv;

        float getLinearDepth(float depth) {
          float z = depth * 2.0 - 1.0;
          return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }

        void main() {
          // Get depth
          float depth = texture2D(tDepth, vUv).r;

          // Reconstruct world position from depth
          vec4 clipPos = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          vec4 worldPos = invViewProjMatrix * clipPos;
          worldPos /= worldPos.w;

          // Project to previous frame
          vec4 prevClipPos = prevViewProjMatrix * worldPos;
          prevClipPos /= prevClipPos.w;
          vec2 prevUv = prevClipPos.xy * 0.5 + 0.5;

          // Calculate velocity
          vec2 velocity = (vUv - prevUv) * velocityScale;

          // Pack velocity into color (with bias to handle negative values)
          gl_FragColor = vec4(velocity * 0.5 + 0.5, 0.0, 1.0);
        }
      `,
    });

    // Motion blur material (applies directional blur based on velocity)
    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tVelocity: { value: null },
        resolution: { value: new THREE.Vector2() },
        intensity: { value: this.intensity },
        samples: { value: this.samples },
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
        uniform sampler2D tVelocity;
        uniform vec2 resolution;
        uniform float intensity;
        uniform float samples;

        varying vec2 vUv;

        void main() {
          // Unpack velocity
          vec2 velocity = texture2D(tVelocity, vUv).rg * 2.0 - 1.0;
          velocity *= intensity;

          // Skip if velocity is negligible
          float speed = length(velocity);
          if (speed < 0.001) {
            gl_FragColor = texture2D(tDiffuse, vUv);
            return;
          }

          // Normalize velocity and limit blur length
          vec2 texelSize = 1.0 / resolution;
          float maxBlurPixels = 20.0;
          velocity = normalize(velocity) * min(speed, maxBlurPixels * length(texelSize));

          // Accumulate samples along velocity vector
          vec4 result = vec4(0.0);
          float totalWeight = 0.0;

          for (float i = 0.0; i < ${this.quality.samples}.0; i++) {
            float t = (i / (${this.quality.samples}.0 - 1.0)) - 0.5;
            vec2 sampleUv = vUv + velocity * t;

            // Clamp to texture bounds
            sampleUv = clamp(sampleUv, vec2(0.0), vec2(1.0));

            // Weight center samples more heavily
            float weight = 1.0 - abs(t) * 2.0;
            weight = max(weight, 0.1);

            result += texture2D(tDiffuse, sampleUv) * weight;
            totalWeight += weight;
          }

          gl_FragColor = result / totalWeight;
        }
      `,
    });

    // Simple camera-based motion blur (fallback for performance)
    this.cameraBluMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        velocity: { value: new THREE.Vector2() },
        resolution: { value: new THREE.Vector2() },
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
        uniform vec2 velocity;
        uniform vec2 resolution;
        uniform float intensity;

        varying vec2 vUv;

        void main() {
          vec2 texelSize = 1.0 / resolution;
          vec2 blur = velocity * intensity * texelSize * 50.0;

          // Skip if velocity is negligible
          if (length(blur) < texelSize.x * 0.5) {
            gl_FragColor = texture2D(tDiffuse, vUv);
            return;
          }

          vec4 result = vec4(0.0);
          float totalWeight = 0.0;

          const int SAMPLES = ${this.quality.samples};
          for (int i = 0; i < SAMPLES; i++) {
            float t = float(i) / float(SAMPLES - 1) - 0.5;
            vec2 sampleUv = clamp(vUv + blur * t, vec2(0.0), vec2(1.0));

            float weight = 1.0 - abs(t) * 1.5;
            weight = max(weight, 0.1);

            result += texture2D(tDiffuse, sampleUv) * weight;
            totalWeight += weight;
          }

          gl_FragColor = result / totalWeight;
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
      this.blurMaterial
    );
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.fsQuad);
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Velocity buffer render target
    const params = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };
    this.velocityTarget = new THREE.WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y,
      params
    );
  }

  /**
   * Update camera velocity tracking
   * @param {number} deltaTime - Time since last frame
   * @private
   */
  _updateVelocity(deltaTime) {
    if (!this.camera || this.isFirstFrame) {
      if (this.camera) {
        this.previousCameraPosition.copy(this.camera.position);
        this.previousCameraRotation.copy(this.camera.rotation);
        this.previousViewMatrix.copy(this.camera.matrixWorldInverse);
        this.previousProjectionMatrix.copy(this.camera.projectionMatrix);
        this.previousViewProjectionMatrix.multiplyMatrices(
          this.previousProjectionMatrix,
          this.previousViewMatrix
        );
      }
      this.isFirstFrame = false;
      return;
    }

    // Calculate linear velocity
    this.cameraVelocity
      .copy(this.camera.position)
      .sub(this.previousCameraPosition)
      .divideScalar(Math.max(deltaTime, 0.001));

    // Calculate angular velocity
    this.angularVelocity.set(
      (this.camera.rotation.x - this.previousCameraRotation.x) / deltaTime,
      (this.camera.rotation.y - this.previousCameraRotation.y) / deltaTime,
      (this.camera.rotation.z - this.previousCameraRotation.z) / deltaTime
    );

    // Store current matrices
    this.currentViewProjectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );

    // Store for next frame
    this.previousCameraPosition.copy(this.camera.position);
    this.previousCameraRotation.copy(this.camera.rotation);
  }

  /**
   * Set intensity
   * @param {number} intensity - Motion blur intensity
   */
  setIntensity(intensity) {
    this.intensity = intensity;
    this.blurMaterial.uniforms.intensity.value = intensity;
    this.cameraBluMaterial.uniforms.intensity.value = intensity;
  }

  /**
   * Set number of samples
   * @param {number} samples - Number of blur samples
   */
  setSamples(samples) {
    this.samples = samples;
    this.blurMaterial.uniforms.samples.value = samples;
    // Note: Shader needs recompile for sample count change in loop
  }

  /**
   * Get current parameters
   * @returns {Object} Current motion blur parameters
   */
  getParams() {
    return {
      intensity: this.intensity,
      samples: this.samples,
    };
  }

  /**
   * Set parameters
   * @param {Object} params - Parameters to update
   */
  setParams(params = {}) {
    if (params.intensity !== undefined) {
      this.setIntensity(params.intensity);
    }
    if (params.samples !== undefined) {
      this.setSamples(params.samples);
    }
  }

  /**
   * Render the motion blur effect
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.WebGLRenderTarget} writeBuffer
   * @param {THREE.WebGLRenderTarget} readBuffer
   * @param {number} deltaTime - Time since last frame
   */
  render(renderer, writeBuffer, readBuffer, deltaTime = 0.016) {
    if (!this.enabled) {
      return;
    }

    // Update velocity tracking
    this._updateVelocity(deltaTime);

    // Use simple camera-based blur (more efficient)
    const velocityMag =
      this.cameraVelocity.length() + Math.abs(this.angularVelocity.y) * 2.0;

    if (velocityMag < 0.01) {
      // No significant motion, skip blur
      return;
    }

    // Calculate screen-space velocity from camera rotation
    const screenVelocity = new THREE.Vector2(
      -this.angularVelocity.y * 0.5,
      this.angularVelocity.x * 0.3
    );

    // Apply camera blur
    this.cameraBluMaterial.uniforms.tDiffuse.value = readBuffer.texture;
    this.cameraBluMaterial.uniforms.velocity.value = screenVelocity;
    this.cameraBluMaterial.uniforms.resolution.value.set(
      this.resolution.x,
      this.resolution.y
    );

    this.fsQuad.material = this.cameraBluMaterial;
    renderer.setRenderTarget(writeBuffer);
    renderer.render(this.fsScene, this.fsCamera);

    // Update previous matrices for next frame
    this.previousViewProjectionMatrix.copy(this.currentViewProjectionMatrix);
  }

  /**
   * Handle resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.resolution.set(width, height);
    this.velocityTarget.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.velocityTarget.dispose();
    this.velocityMaterial.dispose();
    this.blurMaterial.dispose();
    this.cameraBluMaterial.dispose();
    this.fsQuad.geometry.dispose();
  }
}

// Export for global scope
window.MotionBlurPass = MotionBlurPass;
