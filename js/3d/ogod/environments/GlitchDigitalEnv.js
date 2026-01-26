/**
 * @file GlitchDigitalEnv.js
 * @description Glitch/digital environment for OGOD tracks
 * Creates scanlines, RGB shift, and displacement noise effects
 * Used for: Chrono Trigger (3), Metroid (18)
 */

'use strict';

/**
 * GlitchDigitalEnvironment - Corrupted digital world
 * @class
 * @extends EnvironmentBase
 */
class GlitchDigitalEnvironment extends EnvironmentBase {
  constructor(options = {}) {
    super(options);
    this.glitchIntensity = 0.5;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;
    scene.background = new THREE.Color(0x000000);

    // Create RGB split planes
    this._createRGBPlanes();

    // Create glitch blocks
    this._createGlitchBlocks();

    // Create scanline overlay
    this._createScanlines();

    // Create data stream particles
    this._createDataStream();

    // Create corrupted geometry
    this._createCorruptedGeometry();

    const ambient = this._createAmbientLight(0.3);
    this._addObject(ambient);

    this.isInitialized = true;
  }

  _createRGBPlanes() {
    const channels = [
      { color: new THREE.Color(1, 0, 0), offset: new THREE.Vector2(-0.02, 0) },
      { color: new THREE.Color(0, 1, 0), offset: new THREE.Vector2(0, 0) },
      { color: new THREE.Color(0, 0, 1), offset: new THREE.Vector2(0.02, 0) },
    ];

    channels.forEach((channel, i) => {
      const geometry = new THREE.PlaneGeometry(100, 60);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: channel.color },
          uOffset: { value: channel.offset },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          uniform vec2 uOffset;
          uniform float uTime;

          void main() {
            vUv = uv + uOffset;

            vec3 pos = position;
            // Random glitch displacement
            float glitch = step(0.99, fract(sin(uTime * 100.0 + position.y * 10.0) * 43758.5453));
            pos.x += glitch * 5.0 * sin(uTime * 50.0);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;

          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            // Create blocky pattern
            vec2 grid = floor(vUv * 20.0) / 20.0;
            float noise = random(grid + floor(uTime * 2.0));

            // Glitch probability
            float glitch = step(0.95, noise);

            float alpha = 0.1 + glitch * 0.3;
            gl_FragColor = vec4(uColor * (0.5 + glitch * 0.5), alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.z = -20 - i * 2;
      plane.name = `rgbPlane_${i}`;

      this._addObject(plane);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
        // Random offset glitch
        if (Math.random() < 0.02) {
          material.uniforms.uOffset.value.x = channel.offset.x + (Math.random() - 0.5) * 0.05;
        } else {
          material.uniforms.uOffset.value.x = channel.offset.x;
        }
      });
    });
  }

  _createGlitchBlocks() {
    const blockCount = 50;

    for (let i = 0; i < blockCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const width = 1 + Math.random() * 5;
      const height = 0.5 + Math.random() * 3;
      const depth = 0.1;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
      });

      const block = new THREE.Mesh(geometry, material);
      block.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20 - 10
      );
      block.name = `glitchBlock_${i}`;

      this._addObject(block);

      // Random glitch movement
      let glitchTimer = Math.random() * 5;

      this._onAnimate((delta, elapsed) => {
        glitchTimer -= delta;
        if (glitchTimer <= 0) {
          // Jump to new position
          block.position.x = (Math.random() - 0.5) * 60;
          block.position.y = (Math.random() - 0.5) * 40;
          block.scale.x = 0.5 + Math.random() * 2;
          block.scale.y = 0.5 + Math.random() * 2;
          material.opacity = 0.3 + Math.random() * 0.7;
          glitchTimer = 0.1 + Math.random() * 3;
        }
      });
    }
  }

  _createScanlines() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          // Scrolling scanlines
          float scanline = sin((vUv.y + uTime * 0.1) * 200.0) * 0.5 + 0.5;
          scanline = step(0.5, scanline);

          // Occasional bright line
          float brightLine = step(0.998, fract(vUv.y * 50.0 + uTime * 2.0));

          float alpha = scanline * 0.05 + brightLine * 0.2;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const scanlines = new THREE.Mesh(geometry, material);
    scanlines.position.z = 5;
    scanlines.name = 'scanlines';

    this._addObject(scanlines);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
    });
  }

  _createDataStream() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 60 - 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;
      velocities[i] = 10 + Math.random() * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'dataStream';

    this._addObject(particles);

    this._onAnimate((delta) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3 + 1] -= velocities[i] * delta;
        if (pos[i3 + 1] < -30) {
          pos[i3 + 1] = 30;
          pos[i3] = (Math.random() - 0.5) * 80;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }

  _createCorruptedGeometry() {
    // Create distorted geometric shapes
    const shapes = 10;

    for (let i = 0; i < shapes; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      // Random geometry type
      let geometry;
      const type = Math.floor(Math.random() * 3);
      switch (type) {
        case 0:
          geometry = new THREE.IcosahedronGeometry(2 + Math.random() * 3, 0);
          break;
        case 1:
          geometry = new THREE.OctahedronGeometry(2 + Math.random() * 3, 0);
          break;
        default:
          geometry = new THREE.TetrahedronGeometry(2 + Math.random() * 3, 0);
      }

      const material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20 - 5
      );
      mesh.name = `corrupted_${i}`;

      this._addObject(mesh);

      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      this._onAnimate((delta, elapsed) => {
        mesh.rotation.x += rotSpeed.x * delta;
        mesh.rotation.y += rotSpeed.y * delta;
        mesh.rotation.z += rotSpeed.z * delta;

        // Random scale glitch
        if (Math.random() < 0.01) {
          mesh.scale.setScalar(0.5 + Math.random() * 1.5);
        }
      });
    }
  }
}

window.GlitchDigitalEnvironment = GlitchDigitalEnvironment;
