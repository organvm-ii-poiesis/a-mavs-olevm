/**
 * @file HighContrastEnv.js
 * @description High contrast black/white environment for OGOD tracks
 * Creates stark lighting, shadow geometry, and silhouettes
 * Used for: Stickerbush DKC2 (5), Okami (19)
 */

'use strict';

/**
 * HighContrastEnvironment - Black and white shadow world
 * @class
 * @extends EnvironmentBase
 */
class HighContrastEnvironment extends EnvironmentBase {
  constructor(options = {}) {
    super(options);
    // Override palette to ensure high contrast
    this.colors = [
      new THREE.Color(0x000000),
      new THREE.Color(0xffffff),
      new THREE.Color(0x1a1a1a),
      new THREE.Color(0xe5e5e5),
    ];
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    const { scene } = this.sceneManager;

    // Set stark background
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

    // Create silhouette columns
    this._createSilhouetteColumns();

    // Create shadow planes
    this._createShadowPlanes();

    // Create light rays
    this._createLightRays();

    // Create contrast particles
    this._createContrastParticles();

    // Directional light for shadows
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(10, 20, 10);
    this._addObject(directional);

    this.isInitialized = true;
  }

  _createSilhouetteColumns() {
    const columnCount = 20;

    for (let i = 0; i < columnCount; i++) {
      const isBlack = i % 2 === 0;
      const color = isBlack ? 0x000000 : 0xffffff;

      const width = 1 + Math.random() * 3;
      const height = 20 + Math.random() * 30;

      const geometry = new THREE.BoxGeometry(width, height, width);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isBlack ? 1.0 : 0.8,
      });

      const column = new THREE.Mesh(geometry, material);
      const angle = (i / columnCount) * Math.PI * 2;
      const radius = 20 + Math.random() * 20;
      column.position.set(
        Math.cos(angle) * radius,
        height / 2 - 5,
        Math.sin(angle) * radius
      );
      column.name = `column_${i}`;

      this._addObject(column);

      // Subtle sway
      const swaySpeed = 0.1 + Math.random() * 0.1;

      this._onAnimate((delta, elapsed) => {
        column.rotation.z = Math.sin(elapsed * swaySpeed) * 0.02;
      });
    }
  }

  _createShadowPlanes() {
    const planeCount = 10;

    for (let i = 0; i < planeCount; i++) {
      const isBlack = i % 2 === 0;

      const geometry = new THREE.PlaneGeometry(50, 30);
      const material = new THREE.MeshBasicMaterial({
        color: isBlack ? 0x000000 : 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(
        (Math.random() - 0.5) * 60,
        15 + Math.random() * 10,
        -30 - i * 5
      );
      plane.rotation.y = (Math.random() - 0.5) * 0.5;
      plane.name = `shadowPlane_${i}`;

      this._addObject(plane);
    }
  }

  _createLightRays() {
    const rayCount = 8;

    for (let i = 0; i < rayCount; i++) {
      const geometry = new THREE.CylinderGeometry(0.1, 3, 50, 8, 1, true);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIndex: { value: i },
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
          uniform float uIndex;
          varying vec2 vUv;

          void main() {
            float fade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
            float flicker = 0.5 + 0.5 * sin(uTime * 3.0 + uIndex * 1.5);
            float alpha = fade * 0.3 * flicker;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const ray = new THREE.Mesh(geometry, material);
      const angle = (i / rayCount) * Math.PI * 2;
      ray.position.set(Math.cos(angle) * 15, 25, Math.sin(angle) * 15);
      ray.rotation.x = -0.3;
      ray.rotation.z = angle;
      ray.name = `lightRay_${i}`;

      this._addObject(ray);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
      });
    }
  }

  _createContrastParticles() {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Alternating black and white
      const intensity = Math.random() > 0.5 ? 1.0 : 0.0;
      colors[i3] = intensity;
      colors[i3 + 1] = intensity;
      colors[i3 + 2] = intensity;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'contrastParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3 + 1] += Math.sin(elapsed * 0.5 + i * 0.01) * 0.02;
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }
}

window.HighContrastEnvironment = HighContrastEnvironment;
