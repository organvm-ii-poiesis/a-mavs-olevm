/**
 * @file OGODGenerativeRenderer.js
 * @description Generative renderer for OGOD animations.
 * Uses the source image as seed data for living generative art.
 * Dual-buffer feedback loop with UV distortion, noise dissolve,
 * and beat-reactive chromatic pulses. The source image remains
 * recognizable as origin material but is continuously transformed.
 */

"use strict";

/**
 * OGODGenerativeRenderer - Three.js generative feedback renderer
 * @class
 */
class OGODGenerativeRenderer {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - Target canvas element
   * @param {number} [options.gridSize=21] - Grid dimension
   * @param {Object} [options.config] - Generative config from ETCETER4_CONFIG.ogodAnimation.generative
   * @param {Object} [options.audioAdapter] - OGODAudioAdapter instance
   * @param {Object} [options.imageAnalysis] - Pre-computed image analysis data
   */
  constructor(options = {}) {
    if (!options.canvas) {
      throw new Error("OGODGenerativeRenderer requires a canvas element");
    }
    if (typeof THREE === "undefined") {
      throw new Error("OGODGenerativeRenderer requires Three.js");
    }

    this.canvas = options.canvas;
    this.gridSize = options.gridSize || 21;
    this.audioAdapter = options.audioAdapter || null;

    const cfg = options.config || {};
    this._feedbackDecay = cfg.feedbackDecay || 0.92;
    this._feedbackZoom = cfg.feedbackZoom || 1.002;
    this._noiseScale = cfg.noiseScale || 5.0;
    this._audioInfluence = cfg.audioInfluence || 0.6;

    // Three.js objects
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._mesh = null;
    this._sourceTexture = null;

    // Dual-buffer ping-pong
    this._bufferA = null;
    this._bufferB = null;
    this._currentBuffer = 0; // 0 = write to A read from B, 1 = vice versa

    // State
    this._startTime = performance.now();
    this._beatPulse = 0;

    // Resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    this._initThree();
  }

  /**
   * Initialize Three.js with generative feedback shader
   * @private
   */
  _initThree() {
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;

    this._renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this._scene = new THREE.Scene();
    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Dual feedback buffers
    const bufferParams = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    };
    this._bufferA = new THREE.WebGLRenderTarget(w, h, bufferParams);
    this._bufferB = new THREE.WebGLRenderTarget(w, h, bufferParams);

    // Generative shader material
    this._material = new THREE.ShaderMaterial({
      uniforms: {
        uSource: { value: null },
        uFeedback: { value: this._bufferB.texture },
        uGridSize: { value: this.gridSize },
        uCell: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
        // Generative controls
        uFeedbackDecay: { value: this._feedbackDecay },
        uFeedbackZoom: { value: this._feedbackZoom },
        uNoiseScale: { value: this._noiseScale },
        uAudioInfluence: { value: this._audioInfluence },
        // Audio uniforms
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uTrebleLevel: { value: 0 },
        uEnergy: { value: 0 },
        uBeatPulse: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D uSource;
        uniform sampler2D uFeedback;
        uniform float uGridSize;
        uniform vec2 uCell;
        uniform float uTime;
        uniform vec2 uResolution;

        uniform float uFeedbackDecay;
        uniform float uFeedbackZoom;
        uniform float uNoiseScale;
        uniform float uAudioInfluence;

        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uTrebleLevel;
        uniform float uEnergy;
        uniform float uBeatPulse;

        varying vec2 vUv;

        // Simplex-like noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5);

          // Sample source image (current grid cell)
          vec2 sourceUv = (uCell + uv) / uGridSize;
          vec3 sourceColor = texture2D(uSource, sourceUv).rgb;

          // UV distortion modulated by audio and noise
          float audioDistort = uBassLevel * uAudioInfluence * 0.02;
          float noiseDistort = fbm(uv * uNoiseScale + uTime * 0.3) * 0.01;
          vec2 distortion = vec2(
            sin(uv.y * 15.0 + uTime * 2.0) * (audioDistort + noiseDistort),
            cos(uv.x * 15.0 + uTime * 1.5) * (audioDistort + noiseDistort)
          );

          // Feedback zoom (slight zoom toward center each frame)
          vec2 feedbackUv = (uv - center) / uFeedbackZoom + center + distortion;
          feedbackUv = clamp(feedbackUv, 0.0, 1.0);
          vec3 feedback = texture2D(uFeedback, feedbackUv).rgb;

          // Noise-based dissolve between source and feedback
          float dissolve = fbm(uv * uNoiseScale * 2.0 + uTime * 0.5);
          dissolve = smoothstep(0.3, 0.7, dissolve + uEnergy * 0.3);

          // Mix source image with feedback using dissolve
          float sourceBlend = 0.08 + uMidLevel * uAudioInfluence * 0.1;
          vec3 color = mix(feedback * uFeedbackDecay, sourceColor, sourceBlend * dissolve);

          // Beat-reactive chromatic pulse
          if (uBeatPulse > 0.1) {
            float chromaAmount = uBeatPulse * 0.01;
            vec2 chromaOffset = vec2(chromaAmount, 0.0);
            vec3 colorR = texture2D(uFeedback, feedbackUv + chromaOffset).rgb;
            vec3 colorB = texture2D(uFeedback, feedbackUv - chromaOffset).rgb;
            vec3 chromaColor = vec3(colorR.r, color.g, colorB.b);
            color = mix(color, chromaColor, uBeatPulse * 0.5);
          }

          // Treble sparkle (high-frequency noise highlights)
          float sparkle = step(0.98, noise(uv * 100.0 + uTime * 10.0));
          color += sparkle * uTrebleLevel * uAudioInfluence * vec3(0.3);

          // Vignette
          float dist = length(uv - center) * 1.4;
          float vignette = 1.0 - dist * dist * 0.3;
          color *= vignette;

          // Subtle color rotation over time
          float hueShift = sin(uTime * 0.2) * 0.05;
          mat3 colorRotation = mat3(
            cos(hueShift), -sin(hueShift), 0.0,
            sin(hueShift), cos(hueShift), 0.0,
            0.0, 0.0, 1.0
          );
          color = colorRotation * color;

          gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this._mesh = new THREE.Mesh(geometry, this._material);
    this._scene.add(this._mesh);

    this._onResize();
  }

  /**
   * Set the source image
   * @param {HTMLImageElement} image
   */
  setImage(image) {
    if (this._sourceTexture) {
      this._sourceTexture.dispose();
    }

    this._sourceTexture = new THREE.Texture(image);
    this._sourceTexture.needsUpdate = true;
    this._sourceTexture.minFilter = THREE.LinearFilter;
    this._sourceTexture.magFilter = THREE.LinearFilter;

    this._material.uniforms.uSource.value = this._sourceTexture;

    // Seed the feedback buffer with the source image
    this._seedFeedback();
  }

  /**
   * Seed the feedback buffers with the source image (center cell)
   * @private
   */
  _seedFeedback() {
    if (!this._sourceTexture || !this._renderer) {
      return;
    }

    // Render one frame of the center cell into both buffers
    const center = Math.floor(this.gridSize / 2);
    this._material.uniforms.uCell.value.set(center, center);
    this._material.uniforms.uTime.value = 0;

    this._renderer.setRenderTarget(this._bufferA);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(this._bufferB);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(null);
  }

  /**
   * Render a frame. The grid cell position influences which part of the
   * source image is mixed into the generative feedback loop.
   * @param {number} col
   * @param {number} row
   */
  render(col, row) {
    if (!this._renderer || !this._sourceTexture) {
      return;
    }

    const u = this._material.uniforms;
    const now = performance.now();
    const elapsed = (now - this._startTime) / 1000;
    u.uTime.value = elapsed;
    u.uCell.value.set(col, row);

    // Beat pulse decay
    this._beatPulse = Math.max(0, this._beatPulse * 0.92);
    u.uBeatPulse.value = this._beatPulse;

    // Update audio uniforms
    if (this.audioAdapter) {
      const audio = this.audioAdapter.getUniforms();
      u.uBassLevel.value = audio.bass || 0;
      u.uMidLevel.value = audio.mid || 0;
      u.uTrebleLevel.value = audio.treble || 0;
      u.uEnergy.value = audio.energy || 0;

      // Beat trigger
      if ((audio.beatHit || 0) > 0.8) {
        this._beatPulse = 1.0;
      }
    }

    // Ping-pong: read from one buffer, write to the other
    const readBuffer =
      this._currentBuffer === 0 ? this._bufferB : this._bufferA;
    const writeBuffer =
      this._currentBuffer === 0 ? this._bufferA : this._bufferB;

    u.uFeedback.value = readBuffer.texture;

    // Render to write buffer
    this._renderer.setRenderTarget(writeBuffer);
    this._renderer.render(this._scene, this._camera);

    // Render to screen
    this._renderer.setRenderTarget(null);
    this._renderer.render(this._scene, this._camera);

    // Swap buffers
    this._currentBuffer = 1 - this._currentBuffer;
  }

  /**
   * Render a static frame (seed image, center cell)
   */
  renderStatic() {
    const center = Math.floor(this.gridSize / 2);
    this.render(center, center);
  }

  /**
   * Handle resize
   * @private
   */
  _onResize() {
    if (!this._renderer) {
      return;
    }
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;

    this._renderer.setSize(w, h);

    if (this._material) {
      this._material.uniforms.uResolution.value.set(w, h);
    }

    if (this._bufferA) {
      this._bufferA.setSize(w, h);
    }
    if (this._bufferB) {
      this._bufferB.setSize(w, h);
    }
  }

  /**
   * @returns {string}
   */
  get type() {
    return "generative";
  }

  /**
   * Dispose all resources
   */
  dispose() {
    window.removeEventListener("resize", this._onResize);

    if (this._sourceTexture) {
      this._sourceTexture.dispose();
    }
    if (this._material) {
      this._material.dispose();
    }
    if (this._mesh) {
      this._mesh.geometry.dispose();
    }
    if (this._bufferA) {
      this._bufferA.dispose();
    }
    if (this._bufferB) {
      this._bufferB.dispose();
    }
    if (this._renderer) {
      this._renderer.dispose();
    }

    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._sourceTexture = null;
  }
}

window.OGODGenerativeRenderer = OGODGenerativeRenderer;
