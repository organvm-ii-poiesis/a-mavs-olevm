'use strict';

/**
 * @file audioReactiveShader.js
 * @description WebGL-enabled p5.js sketch that uses custom shaders
 * and responds to audio input via the AudioAnalyzerBridge
 *
 * Features:
 * - Custom GLSL shaders for visual effects
 * - Real-time audio reactivity (bass, mid, treble)
 * - Beat detection for visual pulses
 * - Smooth animations with time-based uniforms
 *
 * @requires p5.js
 * @requires audioAnalyzerBridge.js (for audioBridge global)
 */

/**
 * Audio-Reactive WebGL Sketch
 * A p5.js sketch that renders audio-reactive visuals using custom shaders
 * @param {p5} p - The p5 instance
 */
// eslint-disable-next-line no-unused-vars
const audioReactiveShaderSketch = function (p) {
  /** @type {p5.Shader|null} */
  let audioShader = null;

  /** @type {boolean} */
  let shaderLoaded = false;

  /** @type {boolean} */
  let shaderError = false;

  /** @type {number} */
  const startTime = Date.now();

  /** @type {Object} Audio values with fallback */
  let audioValues = {
    bass: 0,
    mid: 0,
    treble: 0,
    overall: 0,
  };

  /** @type {number} Beat intensity for visual pulse */
  let beatIntensity = 0;

  /**
   * Inline vertex shader (for cases where file loading fails)
   */
  const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;

    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `;

  /**
   * Inline fragment shader (fallback or when file not available)
   */
  const fragmentShaderSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uBeatIntensity;

    varying vec2 vTexCoord;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vTexCoord;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // Animated rings based on audio
      float bassRing = sin(dist * 20.0 - uTime * 2.0 + uBass * 6.28) * 0.5 + 0.5;
      float midRing = sin(dist * 15.0 - uTime * 1.5 + uMid * 6.28) * 0.5 + 0.5;
      float trebleRing = sin(dist * 25.0 - uTime * 3.0 + uTreble * 6.28) * 0.5 + 0.5;

      // Noise modulated by audio
      float noiseVal = smoothNoise(uv * 5.0 + uTime * 0.2);
      float audioNoise = noiseVal * (uBass + uMid + uTreble) * 0.3;

      // Colors driven by frequency bands
      float r = bassRing * (0.5 + uBass * 0.5) + audioNoise;
      float g = midRing * (0.3 + uMid * 0.7) + audioNoise * 0.5;
      float b = trebleRing * (0.4 + uTreble * 0.6) + audioNoise * 0.7;

      // Vignette effect
      float vignette = 1.0 - dist * 1.2;
      vignette = clamp(vignette, 0.0, 1.0);

      vec3 color = vec3(r, g, b) * vignette;

      // Beat pulse effect
      color += vec3(0.2, 0.1, 0.3) * uBeatIntensity * (1.0 - dist);

      // Total energy glow
      float totalEnergy = (uBass + uMid + uTreble) / 3.0;
      color += vec3(0.1, 0.05, 0.15) * totalEnergy * (1.0 - dist * 2.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  /**
   * Preload - Load shader files
   */
  p.preload = function () {
    try {
      // Try to load shader files
      audioShader = p.loadShader(
        'js/shaders/default.vert',
        'js/shaders/audioReactive.frag',
        () => {
          shaderLoaded = true;
          console.log('Audio reactive shader loaded from files');
        },
        err => {
          console.warn('Shader file load failed, using inline shader:', err);
          shaderError = true;
        }
      );
    } catch (err) {
      console.warn('Shader preload error:', err.message);
      shaderError = true;
    }
  };

  /**
   * Setup - Initialize WebGL canvas
   */
  p.setup = function () {
    try {
      // Create WebGL canvas
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noStroke();

      // If file loading failed, create shader from inline sources
      if (shaderError || !audioShader) {
        try {
          audioShader = p.createShader(vertexShaderSource, fragmentShaderSource);
          shaderLoaded = true;
          console.log('Using inline audio reactive shader');
        } catch (inlineErr) {
          console.error('Failed to create inline shader:', inlineErr.message);
          shaderLoaded = false;
        }
      }

      // Try to connect audio analyzer
      if (typeof window.audioBridge !== 'undefined' && !window.audioBridge.isConnected) {
        window.audioBridge.connect();
      }
    } catch (err) {
      console.error('Audio reactive sketch setup error:', err.message);
    }
  };

  /**
   * Draw - Main render loop
   */
  p.draw = function () {
    if (!shaderLoaded || !audioShader) {
      // Fallback: show loading or error state
      p.background(20, 20, 40);
      return;
    }

    try {
      // Get audio data if available
      if (typeof window.audioBridge !== 'undefined' && window.audioBridge.isConnected) {
        audioValues = window.audioBridge.update();

        // Update beat intensity with decay
        if (window.audioBridge.isBeat()) {
          beatIntensity = 1.0;
        } else {
          beatIntensity *= 0.9; // Decay
        }
      } else {
        // Simulate audio values for visual interest when no audio
        const t = (Date.now() - startTime) / 1000;
        audioValues.bass = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.3;
        audioValues.mid = (Math.sin(t * 0.7 + 1) * 0.5 + 0.5) * 0.2;
        audioValues.treble = (Math.sin(t * 1.1 + 2) * 0.5 + 0.5) * 0.15;
        beatIntensity *= 0.95;
      }

      // Calculate time in seconds
      const elapsedTime = (Date.now() - startTime) / 1000;

      // Apply shader
      p.shader(audioShader);

      // Set uniforms
      audioShader.setUniform('uResolution', [p.width, p.height]);
      audioShader.setUniform('uTime', elapsedTime);
      audioShader.setUniform('uBass', audioValues.bass || 0);
      audioShader.setUniform('uMid', audioValues.mid || 0);
      audioShader.setUniform('uTreble', audioValues.treble || 0);
      audioShader.setUniform('uBeatIntensity', beatIntensity);

      // Draw a full-screen quad
      // In WEBGL mode, origin is at center, so we offset
      p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    } catch (err) {
      console.error('Audio reactive sketch draw error:', err.message);
    }
  };

  /**
   * Handle window resize
   */
  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  /**
   * Handle mouse click - try to connect audio
   */
  p.mouseClicked = function () {
    // Try to connect audio analyzer on first click
    if (typeof window.audioBridge !== 'undefined' && !window.audioBridge.isConnected) {
      window.audioBridge.connect();
    }
  };
};

/**
 * Alternative: Non-WebGL audio-reactive sketch (fallback for older browsers)
 * Uses 2D canvas with audio-reactive colors
 * @param {p5} p - The p5 instance
 */
// eslint-disable-next-line no-unused-vars
const audioReactive2DSketch = function (p) {
  /** @type {number} */
  const startTime = Date.now();

  /** @type {Object} */
  let audioValues = { bass: 0, mid: 0, treble: 0 };

  /** @type {Array} Particles for visualization */
  const particles = [];

  /** @type {number} Max number of particles */
  const maxParticles = 100;

  /**
   * Particle class for 2D visualization
   */
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = p.random(p.width);
      this.y = p.random(p.height);
      this.size = p.random(2, 8);
      this.speedX = p.random(-1, 1);
      this.speedY = p.random(-1, 1);
      this.life = 255;
    }

    update(bass, mid, treble) {
      // Movement influenced by audio
      this.x += this.speedX * (1 + bass * 3);
      this.y += this.speedY * (1 + mid * 3);

      // Size pulsing with treble
      this.displaySize = this.size * (1 + treble * 2);

      // Wrap around edges
      if (this.x < 0) {
        this.x = p.width;
      }
      if (this.x > p.width) {
        this.x = 0;
      }
      if (this.y < 0) {
        this.y = p.height;
      }
      if (this.y > p.height) {
        this.y = 0;
      }
    }

    display(bass, mid, treble) {
      // Color based on audio
      const r = p.map(bass, 0, 1, 100, 255);
      const g = p.map(mid, 0, 1, 50, 200);
      const b = p.map(treble, 0, 1, 150, 255);

      p.fill(r, g, b, 200);
      p.noStroke();
      p.ellipse(this.x, this.y, this.displaySize);
    }
  }

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);

    // Create particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    // Try to connect audio
    if (typeof window.audioBridge !== 'undefined') {
      window.audioBridge.connect();
    }
  };

  p.draw = function () {
    // Semi-transparent background for trails
    p.background(20, 20, 40, 30);

    // Get audio data
    if (typeof window.audioBridge !== 'undefined' && window.audioBridge.isConnected) {
      audioValues = window.audioBridge.update();
    } else {
      // Simulate values
      const t = (Date.now() - startTime) / 1000;
      audioValues.bass = Math.sin(t * 0.5) * 0.3 + 0.3;
      audioValues.mid = Math.sin(t * 0.7 + 1) * 0.2 + 0.2;
      audioValues.treble = Math.sin(t * 1.1 + 2) * 0.15 + 0.15;
    }

    // Update and display particles
    for (const particle of particles) {
      particle.update(audioValues.bass, audioValues.mid, audioValues.treble);
      particle.display(audioValues.bass, audioValues.mid, audioValues.treble);
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.mouseClicked = function () {
    if (typeof window.audioBridge !== 'undefined' && !window.audioBridge.isConnected) {
      window.audioBridge.connect();
    }
  };
};
