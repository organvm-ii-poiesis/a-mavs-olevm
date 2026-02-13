/**
 * @file OGODTKOLRenderer.js
 * @description TKOL Glitch renderer for OGOD animations.
 * Recreates the distinctive pixel-sorting/glitch aesthetic from the original
 * 2014 OGOD artwork generation process (algorithm inspired by radiohead.com
 * during the TKOL launch era).
 *
 * Hybrid approach: Canvas 2D preprocessing (full-image pixel sorting on load)
 * + Three.js WebGL shaders (scanline displacement, channel separation,
 * color quantization, temporal feedback, vignette + grain).
 *
 * The pixel sort runs ONCE on the full source image at native resolution,
 * producing long continuous vertical streaks that span the entire image height
 * — matching the original aesthetic. The sorted result is uploaded as a single
 * Three.js texture. The shader then samples individual grid cells using UV
 * offsets (like OGODWebGLRenderer's sampleCell pattern), while all GLSL
 * post-processing effects run at 60fps with audio reactivity.
 */

"use strict";

/**
 * OGODTKOLRenderer - TKOL pixel-sort glitch renderer
 * @class
 */
class OGODTKOLRenderer {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - Target canvas element
   * @param {number} [options.gridSize=21] - Grid dimension
   * @param {Object} [options.config] - TKOL config from ETCETER4_CONFIG.ogodAnimation.tkol
   * @param {Object} [options.audioAdapter] - OGODAudioAdapter instance
   */
  constructor(options = {}) {
    if (!options.canvas) {
      throw new Error("OGODTKOLRenderer requires a canvas element");
    }
    if (typeof THREE === "undefined") {
      throw new Error("OGODTKOLRenderer requires Three.js");
    }

    this.canvas = options.canvas;
    this.gridSize = options.gridSize || 21;
    this.audioAdapter = options.audioAdapter || null;

    // Config
    const cfg = options.config || {};
    this._sortThresholdLow = cfg.sortThresholdLow || 0.05;
    this._sortThresholdHigh = cfg.sortThresholdHigh || 0.95;
    this._sortDirection = cfg.sortDirection || "vertical";
    this._scanlineCount = cfg.scanlineCount || 40;
    this._displacementAmount = cfg.displacementAmount || 0.04;
    this._channelSeparation = cfg.channelSeparation || 0.012;
    this._quantizationLevels = cfg.quantizationLevels || 8;
    this._feedbackAmount = cfg.feedbackAmount || 0.3;
    this._audioInfluence = cfg.audioInfluence || 0.7;
    this._sortInterpolation = cfg.sortInterpolation ?? 1.0;

    // Three.js objects
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._material = null;
    this._mesh = null;

    // Textures
    this._sortedTexture = null; // Full-image sorted texture
    this._sourceImage = null;

    // Feedback buffers (ping-pong)
    this._bufferA = null;
    this._bufferB = null;
    this._currentBuffer = 0;

    // Offscreen canvas for full-image pixel sorting
    this._sortCanvas = document.createElement("canvas");
    this._sortCtx = this._sortCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    // State
    this._startTime = performance.now();
    this._beatPulse = 0;

    // Resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    this._initThree();
  }

  /**
   * Initialize Three.js renderer and shader pipeline
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

    // TKOL glitch shader — samples cells from the full sorted texture
    this._material = new THREE.ShaderMaterial({
      uniforms: {
        uSorted: { value: null },
        uFeedback: { value: this._bufferB.texture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
        // Grid cell sampling
        uGridSize: { value: this.gridSize },
        uCell: { value: new THREE.Vector2(0, 0) },
        // TKOL effect controls
        uScanlineCount: { value: this._scanlineCount },
        uDisplacementAmount: { value: this._displacementAmount },
        uChannelSeparation: { value: this._channelSeparation },
        uQuantizationLevels: { value: this._quantizationLevels },
        uFeedbackAmount: { value: this._feedbackAmount },
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

        uniform sampler2D uSorted;
        uniform sampler2D uFeedback;
        uniform float uTime;
        uniform vec2 uResolution;

        // Grid cell sampling
        uniform float uGridSize;
        uniform vec2 uCell;

        uniform float uScanlineCount;
        uniform float uDisplacementAmount;
        uniform float uChannelSeparation;
        uniform float uQuantizationLevels;
        uniform float uFeedbackAmount;
        uniform float uAudioInfluence;

        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uTrebleLevel;
        uniform float uEnergy;
        uniform float uBeatPulse;

        varying vec2 vUv;

        // Hash noise
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

        // Sample the sorted full-image texture at the current grid cell
        vec3 sampleCell(vec2 uv) {
          vec2 cellUv = (uCell + uv) / uGridSize;
          return texture2D(uSorted, cellUv).rgb;
        }

        // Sample at an offset UV (for channel separation, beat glitch)
        vec3 sampleCellOffset(vec2 uv, vec2 offset) {
          vec2 offsetUv = clamp(uv + offset, 0.0, 1.0);
          vec2 cellUv = (uCell + offsetUv) / uGridSize;
          return texture2D(uSorted, cellUv).rgb;
        }

        void main() {
          vec2 uv = vUv;

          // --- Block displacement (TKOL glitch, bass-reactive) ---
          float bassInfluence = uBassLevel * uAudioInfluence;

          // Variable band height (8-32 pixels, changes over time)
          float bandHeight = 8.0 + hash(vec2(floor(uTime * 3.0), 0.0)) * 24.0;
          float bandIndex = floor(uv.y * uResolution.y / bandHeight);
          float bandRand = hash(vec2(bandIndex, floor(uTime * 4.0)));

          // Sparse block displacement (only ~30% of bands shift)
          float blockDisplace = 0.0;
          if (bandRand > 0.7) {
            blockDisplace = (bandRand - 0.7) * 3.333 * uDisplacementAmount
              * (1.0 + bassInfluence * 4.0);
            // Random direction
            float dir = sign(hash(vec2(bandIndex + 100.0, floor(uTime * 4.0))) - 0.5);
            blockDisplace *= dir;
          }

          // Secondary sinusoidal scanline modulation (subtle)
          float scanlinePhase = uv.y * uScanlineCount + uTime * 2.0;
          float scanlineWave = sin(scanlinePhase * 6.2831853) * uDisplacementAmount * 0.3;

          // Per-line jitter for noise texture
          float lineNoise = hash(vec2(floor(uv.y * uResolution.y), floor(uTime * 8.0)));
          float jitter = (lineNoise - 0.5) * 0.008 * (1.0 + bassInfluence * 2.0);

          vec2 displacedUv = uv + vec2(blockDisplace + scanlineWave + jitter, 0.0);
          displacedUv = clamp(displacedUv, 0.0, 1.0);

          // --- RGB channel separation (treble-reactive) ---
          float trebleInfluence = uTrebleLevel * uAudioInfluence;
          float chromaAmount = uChannelSeparation * (1.0 + trebleInfluence * 4.0);

          // Horizontal channel offset with slight vertical drift
          vec2 rOffset = vec2(chromaAmount, chromaAmount * 0.3);
          vec2 bOffset = vec2(-chromaAmount, -chromaAmount * 0.3);

          float r = sampleCellOffset(displacedUv, rOffset).r;
          float g = sampleCell(displacedUv).g;
          float b = sampleCellOffset(displacedUv, bOffset).b;
          vec3 color = vec3(r, g, b);

          // --- Color quantization / banding ---
          float levels = uQuantizationLevels + uMidLevel * uAudioInfluence * 4.0;
          color = floor(color * levels + 0.5) / levels;

          // --- Temporal feedback (subtle ghosting) ---
          vec3 feedback = texture2D(uFeedback, uv).rgb;
          float fbAmount = uFeedbackAmount * (1.0 + uEnergy * 0.3);
          fbAmount = clamp(fbAmount, 0.0, 0.6);
          color = mix(color, feedback, fbAmount);

          // --- Beat pulse: brief brightness flash + extra displacement ---
          if (uBeatPulse > 0.05) {
            color += uBeatPulse * 0.15;
            // Extra horizontal glitch on beat
            float beatGlitch = hash(vec2(floor(uv.y * uResolution.y * 0.5), uBeatPulse)) - 0.5;
            vec2 beatOffset = vec2(beatGlitch * 0.02 * uBeatPulse, 0.0);
            vec3 beatSample = sampleCellOffset(uv, beatOffset);
            color = mix(color, beatSample, uBeatPulse * 0.3);
          }

          // --- Film grain ---
          float grain = (hash(uv * uResolution + fract(uTime * 100.0)) - 0.5) * 0.08;
          color += grain;

          // --- Vignette ---
          float dist = length(uv - vec2(0.5)) * 1.4;
          float vignette = 1.0 - dist * dist * 0.4;
          color *= vignette;

          // --- Scanline darkening (CRT-style) ---
          float scanlineDark = 1.0 - sin(uv.y * uResolution.y * 3.14159) * 0.04;
          color *= scanlineDark;

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
   * Set the source image — sorts the FULL image once at native resolution,
   * then uploads as a single Three.js texture for cell-based UV sampling.
   * @param {HTMLImageElement} image
   */
  setImage(image) {
    this._sourceImage = image;

    const imgW = image.naturalWidth;
    const imgH = image.naturalHeight;

    // Size the offscreen canvas to the full source image
    this._sortCanvas.width = imgW;
    this._sortCanvas.height = imgH;

    // Draw the full source image
    this._sortCtx.clearRect(0, 0, imgW, imgH);
    this._sortCtx.drawImage(image, 0, 0, imgW, imgH);

    // Get full-image pixel data
    const imageData = this._sortCtx.getImageData(0, 0, imgW, imgH);
    const data = imageData.data;

    // Pixel sort the entire image — creates long continuous vertical streaks
    if (this._sortDirection === "vertical") {
      this._sortColumns(data, imgW, imgH);
    } else {
      this._sortRows(data, imgW, imgH);
    }

    // Write sorted data back
    this._sortCtx.putImageData(imageData, 0, 0);

    // Upload as texture
    if (this._sortedTexture) {
      this._sortedTexture.dispose();
    }
    this._sortedTexture = new THREE.CanvasTexture(this._sortCanvas);
    this._sortedTexture.minFilter = THREE.LinearFilter;
    this._sortedTexture.magFilter = THREE.LinearFilter;
    this._sortedTexture.needsUpdate = true;

    this._material.uniforms.uSorted.value = this._sortedTexture;

    this._seedFeedback();
  }

  /**
   * Threshold-gated column sort by luminance.
   * Pixels within the luminance band are sorted; pixels outside stay in place.
   * Runs on the full image — produces long vertical streaks spanning the
   * entire image height, matching the original TKOL aesthetic.
   * @param {Uint8ClampedArray} data - RGBA pixel data
   * @param {number} w - Width
   * @param {number} h - Height
   * @private
   */
  _sortColumns(data, w, h) {
    const lo = this._sortThresholdLow;
    const hi = this._sortThresholdHigh;
    const interp = this._sortInterpolation;

    for (let x = 0; x < w; x++) {
      // Collect pixels in this column with their luminance
      const column = [];
      for (let y = 0; y < h; y++) {
        const idx = (y * w + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        column.push({
          y,
          idx,
          lum,
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3],
        });
      }

      // Find contiguous spans within the threshold band and sort them
      let spanStart = -1;
      for (let i = 0; i <= column.length; i++) {
        const inBand =
          i < column.length && column[i].lum >= lo && column[i].lum <= hi;
        if (inBand && spanStart === -1) {
          spanStart = i;
        } else if (!inBand && spanStart !== -1) {
          // Sort this span by luminance
          const span = column.slice(spanStart, i);
          span.sort((a, b) => a.lum - b.lum);

          // Blend sorted values with originals using interpolation factor
          for (let j = 0; j < span.length; j++) {
            const origIdx = column[spanStart + j].idx;
            const sorted = span[j];
            data[origIdx] = Math.round(
              data[origIdx] * (1 - interp) + sorted.r * interp,
            );
            data[origIdx + 1] = Math.round(
              data[origIdx + 1] * (1 - interp) + sorted.g * interp,
            );
            data[origIdx + 2] = Math.round(
              data[origIdx + 2] * (1 - interp) + sorted.b * interp,
            );
          }
          spanStart = -1;
        }
      }
    }
  }

  /**
   * Threshold-gated row sort by luminance.
   * @param {Uint8ClampedArray} data - RGBA pixel data
   * @param {number} w - Width
   * @param {number} h - Height
   * @private
   */
  _sortRows(data, w, h) {
    const lo = this._sortThresholdLow;
    const hi = this._sortThresholdHigh;
    const interp = this._sortInterpolation;

    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        row.push({
          x,
          idx,
          lum,
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3],
        });
      }

      let spanStart = -1;
      for (let i = 0; i <= row.length; i++) {
        const inBand = i < row.length && row[i].lum >= lo && row[i].lum <= hi;
        if (inBand && spanStart === -1) {
          spanStart = i;
        } else if (!inBand && spanStart !== -1) {
          const span = row.slice(spanStart, i);
          span.sort((a, b) => a.lum - b.lum);

          for (let j = 0; j < span.length; j++) {
            const origIdx = row[spanStart + j].idx;
            const sorted = span[j];
            data[origIdx] = Math.round(
              data[origIdx] * (1 - interp) + sorted.r * interp,
            );
            data[origIdx + 1] = Math.round(
              data[origIdx + 1] * (1 - interp) + sorted.g * interp,
            );
            data[origIdx + 2] = Math.round(
              data[origIdx + 2] * (1 - interp) + sorted.b * interp,
            );
          }
          spanStart = -1;
        }
      }
    }
  }

  /**
   * Seed feedback buffers with the initial sorted texture
   * @private
   */
  _seedFeedback() {
    if (!this._sortedTexture || !this._renderer) {
      return;
    }

    // Set cell to center for initial seed
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
   * Render a frame at the given grid position.
   * Updates the cell uniform so the shader samples the correct region
   * of the full sorted texture.
   * @param {number} col
   * @param {number} row
   */
  render(col, row) {
    if (!this._renderer || !this._sourceImage) {
      return;
    }

    // Update cell position — shader handles UV sampling
    this._material.uniforms.uCell.value.set(col, row);

    const u = this._material.uniforms;
    const now = performance.now();
    const elapsed = (now - this._startTime) / 1000;
    u.uTime.value = elapsed;

    // Beat pulse decay
    this._beatPulse = Math.max(0, this._beatPulse * 0.9);
    u.uBeatPulse.value = this._beatPulse;

    // Update audio uniforms
    if (this.audioAdapter) {
      const audio = this.audioAdapter.getUniforms();
      u.uBassLevel.value = audio.bass || 0;
      u.uMidLevel.value = audio.mid || 0;
      u.uTrebleLevel.value = audio.treble || 0;
      u.uEnergy.value = audio.energy || 0;

      if ((audio.beatHit || 0) > 0.8) {
        this._beatPulse = 1.0;
      }
    }

    // Ping-pong feedback
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
   * Render a static frame (center cell)
   */
  renderStatic() {
    const center = Math.floor(this.gridSize / 2);
    this.render(center, center);
  }

  /**
   * Handle window resize
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
    return "tkol";
  }

  /**
   * Dispose all resources
   */
  dispose() {
    window.removeEventListener("resize", this._onResize);

    if (this._sortedTexture) {
      this._sortedTexture.dispose();
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
    this._sortedTexture = null;
    this._sourceImage = null;
    this._sortCanvas = null;
    this._sortCtx = null;
  }
}

window.OGODTKOLRenderer = OGODTKOLRenderer;
