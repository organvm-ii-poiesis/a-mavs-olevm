/**
 * @file OGODWebGLRenderer.js
 * @description Enhanced WebGL renderer for OGOD animations.
 * Uses Three.js full-screen quad with custom GLSL shaders.
 * Features: smooth grid cell interpolation, chromatic aberration,
 * feedback accumulation, noise overlay, palette-based color grading.
 * Audio-reactive shader parameters drive visual intensity.
 */

"use strict";

/**
 * OGODWebGLRenderer - Enhanced Three.js shader renderer
 * @class
 */
class OGODWebGLRenderer {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - Target canvas element
   * @param {number} [options.gridSize=21] - Grid dimension
   * @param {Object} [options.config] - Enhanced mode config from ETCETER4_CONFIG.ogodAnimation.enhanced
   * @param {Object} [options.audioAdapter] - OGODAudioAdapter instance
   * @param {Array<string>} [options.palette] - Color palette for grading
   */
  constructor(options = {}) {
    if (!options.canvas) {
      throw new Error("OGODWebGLRenderer requires a canvas element");
    }

    if (typeof THREE === "undefined") {
      throw new Error("OGODWebGLRenderer requires Three.js");
    }

    this.canvas = options.canvas;
    this.gridSize = options.gridSize || 21;
    this.audioAdapter = options.audioAdapter || null;

    // Config with defaults
    const cfg = options.config || {};
    this._transitionDuration = cfg.transitionDuration || 80;
    this._chromaticAberration = cfg.chromaticAberration || 0.003;
    this._feedbackAmount = cfg.feedbackAmount || 0.85;
    this._noiseAmount = cfg.noiseAmount || 0.15;
    this._bloomStrength = cfg.bloomStrength || 0.4;

    // Palette colors (up to 4)
    this._palette = (
      options.palette || ["#00FFFF", "#FF00FF", "#000000", "#FFFFFF"]
    ).map((c) => new THREE.Color(c));

    // Three.js objects
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._mesh = null;
    this._texture = null;

    // Feedback buffer
    this._feedbackTarget = null;
    this._feedbackScene = null;
    this._feedbackMaterial = null;
    this._feedbackMesh = null;

    // Transition state
    this._currentCol = 0;
    this._currentRow = 0;
    this._targetCol = 0;
    this._targetRow = 0;
    this._transitionProgress = 1.0; // 1 = fully transitioned
    this._transitionStartTime = 0;

    // Time tracking
    this._startTime = performance.now();

    // Resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    this._initThree();
  }

  /**
   * Initialize Three.js renderer, scene, camera, and shader material
   * @private
   */
  _initThree() {
    // Renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene + Camera (orthographic for full-screen quad)
    this._scene = new THREE.Scene();
    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Feedback render target
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;
    this._feedbackTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Feedback copy scene (renders previous frame to target)
    this._feedbackScene = new THREE.Scene();
    this._feedbackMaterial = new THREE.MeshBasicMaterial({
      map: null,
      transparent: false,
    });
    this._feedbackMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this._feedbackMaterial,
    );
    this._feedbackScene.add(this._feedbackMesh);

    // Main shader material
    this._material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uFeedback: { value: this._feedbackTarget.texture },
        uGridSize: { value: this.gridSize },
        uCurrentCell: { value: new THREE.Vector2(0, 0) },
        uTargetCell: { value: new THREE.Vector2(0, 0) },
        uTransition: { value: 1.0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
        // Effect controls
        uChromaticAberration: { value: this._chromaticAberration },
        uFeedbackAmount: { value: this._feedbackAmount },
        uNoiseAmount: { value: this._noiseAmount },
        uBloomStrength: { value: this._bloomStrength },
        // Palette
        uPalette0: { value: this._palette[0] || new THREE.Color("#00FFFF") },
        uPalette1: { value: this._palette[1] || new THREE.Color("#FF00FF") },
        uPalette2: { value: this._palette[2] || new THREE.Color("#000000") },
        uPalette3: { value: this._palette[3] || new THREE.Color("#FFFFFF") },
        uPaletteInfluence: { value: 0.15 },
        // Audio uniforms (zero when no audio)
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uTrebleLevel: { value: 0 },
        uEnergy: { value: 0 },
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

        uniform sampler2D uTexture;
        uniform sampler2D uFeedback;
        uniform float uGridSize;
        uniform vec2 uCurrentCell;
        uniform vec2 uTargetCell;
        uniform float uTransition;
        uniform float uTime;
        uniform vec2 uResolution;

        uniform float uChromaticAberration;
        uniform float uFeedbackAmount;
        uniform float uNoiseAmount;
        uniform float uBloomStrength;

        uniform vec3 uPalette0;
        uniform vec3 uPalette1;
        uniform vec3 uPalette2;
        uniform vec3 uPalette3;
        uniform float uPaletteInfluence;

        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uTrebleLevel;
        uniform float uEnergy;

        varying vec2 vUv;

        // Hash-based noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Smooth noise
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

        // Sample a grid cell from the source texture
        vec3 sampleCell(vec2 cell, vec2 uv) {
          vec2 cellUv = (cell + uv) / uGridSize;
          return texture2D(uTexture, cellUv).rgb;
        }

        void main() {
          vec2 uv = vUv;

          // Audio-reactive UV distortion
          float audioDistort = uBassLevel * 0.005;
          uv += audioDistort * vec2(
            sin(uv.y * 20.0 + uTime * 3.0),
            cos(uv.x * 20.0 + uTime * 2.0)
          );

          // Sample current and target cells with smooth interpolation
          vec3 currentColor = sampleCell(uCurrentCell, uv);
          vec3 targetColor = sampleCell(uTargetCell, uv);

          // Smooth easing for transition
          float t = uTransition;
          t = t * t * (3.0 - 2.0 * t); // smoothstep
          vec3 color = mix(currentColor, targetColor, t);

          // Chromatic aberration (audio-enhanced)
          float chromaAmount = uChromaticAberration + uTrebleLevel * 0.005;
          vec2 chromaOffset = vec2(chromaAmount, 0.0);
          vec3 colorR = mix(
            sampleCell(uCurrentCell, uv + chromaOffset),
            sampleCell(uTargetCell, uv + chromaOffset),
            t
          );
          vec3 colorB = mix(
            sampleCell(uCurrentCell, uv - chromaOffset),
            sampleCell(uTargetCell, uv - chromaOffset),
            t
          );
          color = vec3(colorR.r, color.g, colorB.b);

          // Feedback accumulation
          vec3 feedback = texture2D(uFeedback, vUv).rgb;
          float fbAmount = uFeedbackAmount + uEnergy * 0.1;
          fbAmount = clamp(fbAmount, 0.0, 0.95);
          color = mix(color, feedback, fbAmount * 0.3);

          // Noise overlay
          float n = noise(vUv * 200.0 + uTime * 5.0);
          float noiseAmount = uNoiseAmount + uMidLevel * 0.1;
          color += (n - 0.5) * noiseAmount * 0.3;

          // Palette-based color grading
          float luma = dot(color, vec3(0.299, 0.587, 0.114));
          vec3 paletteColor;
          if (luma < 0.25) {
            paletteColor = mix(uPalette2, uPalette0, luma * 4.0);
          } else if (luma < 0.5) {
            paletteColor = mix(uPalette0, uPalette1, (luma - 0.25) * 4.0);
          } else if (luma < 0.75) {
            paletteColor = mix(uPalette1, uPalette3, (luma - 0.5) * 4.0);
          } else {
            paletteColor = mix(uPalette3, vec3(1.0), (luma - 0.75) * 4.0);
          }
          color = mix(color, paletteColor, uPaletteInfluence);

          // Simple bloom (brighten highlights)
          float bloomLuma = dot(color, vec3(0.299, 0.587, 0.114));
          float bloomMask = smoothstep(0.7, 1.0, bloomLuma);
          float bloomAmount = uBloomStrength + uEnergy * 0.2;
          color += color * bloomMask * bloomAmount;

          // Scanline effect (subtle)
          float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.03;
          color -= scanline;

          gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        }
      `,
    });

    // Full-screen quad
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
    if (this._texture) {
      this._texture.dispose();
    }

    this._texture = new THREE.Texture(image);
    this._texture.needsUpdate = true;
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    this._material.uniforms.uTexture.value = this._texture;
  }

  /**
   * Set palette colors
   * @param {Array<string>} palette - Array of hex color strings
   */
  setPalette(palette) {
    this._palette = palette.map((c) => new THREE.Color(c));
    const u = this._material.uniforms;
    if (this._palette[0]) {
      u.uPalette0.value = this._palette[0];
    }
    if (this._palette[1]) {
      u.uPalette1.value = this._palette[1];
    }
    if (this._palette[2]) {
      u.uPalette2.value = this._palette[2];
    }
    if (this._palette[3]) {
      u.uPalette3.value = this._palette[3];
    }
  }

  /**
   * Render a grid cell. Handles smooth transition from previous cell.
   * @param {number} col - Column index
   * @param {number} row - Row index
   */
  render(col, row) {
    if (!this._renderer || !this._texture) {
      return;
    }

    const u = this._material.uniforms;
    const now = performance.now();
    const elapsed = (now - this._startTime) / 1000;
    u.uTime.value = elapsed;

    // If new cell, start transition
    if (col !== this._targetCol || row !== this._targetRow) {
      this._currentCol = this._targetCol;
      this._currentRow = this._targetRow;
      this._targetCol = col;
      this._targetRow = row;
      this._transitionProgress = 0;
      this._transitionStartTime = now;
    }

    // Update transition progress
    if (this._transitionProgress < 1.0) {
      const tElapsed = now - this._transitionStartTime;
      this._transitionProgress = Math.min(
        tElapsed / this._transitionDuration,
        1.0,
      );
    }

    u.uCurrentCell.value.set(this._currentCol, this._currentRow);
    u.uTargetCell.value.set(this._targetCol, this._targetRow);
    u.uTransition.value = this._transitionProgress;

    // Update audio uniforms if adapter is available
    if (this.audioAdapter) {
      const audio = this.audioAdapter.getUniforms();
      u.uBassLevel.value = audio.bass || 0;
      u.uMidLevel.value = audio.mid || 0;
      u.uTrebleLevel.value = audio.treble || 0;
      u.uEnergy.value = audio.energy || 0;
    }

    // Render to screen
    this._renderer.setRenderTarget(null);
    this._renderer.render(this._scene, this._camera);

    // Copy current frame to feedback buffer
    this._feedbackMaterial.map = this._renderer.properties.get(
      this._feedbackTarget,
    ).__webglTexture
      ? this._feedbackTarget.texture
      : null;

    // Simple feedback: render the current output back into the feedback target
    const currentTarget = this._renderer.getRenderTarget();
    this._renderer.setRenderTarget(this._feedbackTarget);
    this._renderer.render(this._scene, this._camera);
    this._renderer.setRenderTarget(currentTarget);
  }

  /**
   * Render a static frame (center cell)
   */
  renderStatic() {
    const center = Math.floor(this.gridSize / 2);
    this._targetCol = center;
    this._targetRow = center;
    this._currentCol = center;
    this._currentRow = center;
    this._transitionProgress = 1.0;
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

    // Resize feedback target
    if (this._feedbackTarget) {
      this._feedbackTarget.setSize(w, h);
    }
  }

  /**
   * Get renderer type identifier
   * @returns {string}
   */
  get type() {
    return "enhanced";
  }

  /**
   * Dispose of all Three.js resources
   */
  dispose() {
    window.removeEventListener("resize", this._onResize);

    if (this._texture) {
      this._texture.dispose();
    }
    if (this._material) {
      this._material.dispose();
    }
    if (this._mesh) {
      this._mesh.geometry.dispose();
    }
    if (this._feedbackTarget) {
      this._feedbackTarget.dispose();
    }
    if (this._feedbackMaterial) {
      this._feedbackMaterial.dispose();
    }
    if (this._feedbackMesh) {
      this._feedbackMesh.geometry.dispose();
    }
    if (this._renderer) {
      this._renderer.dispose();
    }

    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._texture = null;
  }
}

window.OGODWebGLRenderer = OGODWebGLRenderer;
