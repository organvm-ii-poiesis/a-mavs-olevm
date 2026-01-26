/**
 * @file LayeredColorsEnv.js
 * @description Layered colors environment for OGOD tracks
 * Creates stacked transparent planes at varying depths with depth fog
 * Used for: Castlevania (2), Metroid (18)
 * Supports audio-reactive visual effects
 */

'use strict';

/**
 * LayeredColorsEnvironment - Stacked color plane world with audio reactivity
 * @class
 * @extends EnvironmentBase
 */
class LayeredColorsEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {Object} [options.audioUniforms] - Audio-reactive uniform objects
   */
  constructor(options = {}) {
    super(options);
    this.layerCount = 15;
    this.layerSpacing = 5;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create color planes at depths
    this._createColorLayers();

    // Create floating orbs between layers
    this._createFloatingOrbs();

    // Create mist particles
    this._createMistParticles();

    // Create ambient pulse
    this._createAmbientPulse();

    const ambient = this._createAmbientLight(0.4);
    this._addObject(ambient);

    this.isInitialized = true;
  }

  _createColorLayers() {
    const audioUniforms = this._getAudioUniforms();

    for (let i = 0; i < this.layerCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];
      const z = -i * this.layerSpacing - 10;

      const geometry = new THREE.PlaneGeometry(100, 60);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uDepth: { value: i / this.layerCount },
          // Audio-reactive uniforms
          uBassLevel: audioUniforms.uBassLevel,
          uMidLevel: audioUniforms.uMidLevel,
          uKickHit: audioUniforms.uKickHit,
          uEnergy: audioUniforms.uEnergy,
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float uTime;
          uniform float uBassLevel;
          uniform float uKickHit;

          void main() {
            vUv = uv;
            vPosition = position;

            vec3 pos = position;

            // Wave animation - amplitude influenced by bass
            float waveAmp = 2.0 + uBassLevel * 3.0;
            pos.x += sin(position.y * 0.05 + uTime * 0.2) * waveAmp;
            pos.y += cos(position.x * 0.05 + uTime * 0.15) * waveAmp;

            // Kick pushes layers back momentarily
            pos.z -= uKickHit * 2.0;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uDepth;
          uniform float uMidLevel;
          uniform float uKickHit;
          uniform float uEnergy;

          varying vec2 vUv;
          varying vec3 vPosition;

          void main() {
            // Radial gradient
            float dist = length(vUv - vec2(0.5));
            float fade = smoothstep(0.7, 0.2, dist);

            // Depth-based opacity
            float depthFade = 1.0 - uDepth * 0.5;

            // Animated opacity - enhanced by audio
            float audioSpeed = 0.5 + uEnergy * 0.3;
            float pulse = 0.5 + 0.5 * sin(uTime * audioSpeed + uDepth * 3.14);
            pulse += uMidLevel * 0.2;

            float alpha = fade * depthFade * (0.15 + 0.1 * pulse + uEnergy * 0.1);

            // Audio-reactive color
            vec3 finalColor = uColor * (1.0 + uMidLevel * 0.3);
            finalColor += uKickHit * 0.2;

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.z = z;
      plane.name = `colorLayer_${i}`;

      this._addObject(plane);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
      });
    }
  }

  _createFloatingOrbs() {
    const orbCount = 50;

    for (let i = 0; i < orbCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const radius = 0.5 + Math.random() * 1.5;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
      });

      const orb = new THREE.Mesh(geometry, material);
      orb.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30,
        -Math.random() * this.layerCount * this.layerSpacing - 5
      );
      orb.name = `orb_${i}`;

      this._addObject(orb);

      const floatSpeed = 0.3 + Math.random() * 0.3;
      const floatOffset = Math.random() * Math.PI * 2;

      this._onAnimate((delta, elapsed) => {
        orb.position.y += Math.sin(elapsed * floatSpeed + floatOffset) * 0.01;
        orb.position.x +=
          Math.cos(elapsed * floatSpeed * 0.7 + floatOffset) * 0.005;
      });
    }
  }

  _createMistParticles() {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] =
        -Math.random() * this.layerCount * this.layerSpacing - 5;

      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.2 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'mistParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3] += Math.sin(elapsed * 0.2 + i * 0.01) * 0.02;
        pos[i3 + 1] += Math.cos(elapsed * 0.15 + i * 0.02) * 0.02;
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }

  _createAmbientPulse() {
    const geometry = new THREE.SphereGeometry(80, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: this.colors[0] },
        uColor2: { value: this.colors[1] },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec3 vPosition;

        void main() {
          float t = (normalize(vPosition).y + 1.0) * 0.5;
          vec3 color = mix(uColor1, uColor2, t);
          float pulse = 0.5 + 0.5 * sin(uTime * 0.3);
          float alpha = 0.05 + 0.03 * pulse;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = 'ambientPulse';

    this._addObject(sphere);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }
}

window.LayeredColorsEnvironment = LayeredColorsEnvironment;
