/**
 * @file StripeBarEnv.js
 * @description Stripe/bar environment for OGOD tracks
 * Creates extruded planes and ribbon geometry with parallax motion
 * Used for: Chrono Trigger (3), Stickerbush DKC2 (5), Metroid (18)
 */

'use strict';

/**
 * StripeBarEnvironment - Parallel stripe and bar world
 * @class
 * @extends EnvironmentBase
 */
class StripeBarEnvironment extends EnvironmentBase {
  constructor(options = {}) {
    super(options);
    this.barCount = 30;
    this.barHeight = 50;
    this.barSpacing = 4;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create vertical stripe bars
    this._createVerticalBars();

    // Create horizontal scanlines
    this._createScanlines();

    // Create floating ribbon geometry
    this._createRibbons();

    // Create glitch particles
    this._createGlitchParticles();

    // Ambient light
    const ambient = this._createAmbientLight(0.4);
    this._addObject(ambient);

    this.isInitialized = true;
  }

  _createVerticalBars() {
    const totalWidth = this.barCount * this.barSpacing;

    for (let i = 0; i < this.barCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const width = 0.5 + Math.random() * 1.5;
      const geometry = new THREE.BoxGeometry(width, this.barHeight, 0.5);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.4,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = (i - this.barCount / 2) * this.barSpacing;
      bar.position.y = this.barHeight / 2 - 5;
      bar.position.z = -20 + (Math.random() - 0.5) * 10;
      bar.name = `verticalBar_${i}`;

      this._addObject(bar);

      // Animate bars with wave motion
      const speed = 0.2 + Math.random() * 0.3;
      const offset = i * 0.1;

      this._onAnimate((delta, elapsed) => {
        bar.position.z = -20 + Math.sin(elapsed * speed + offset) * 5;
        bar.scale.y = 1 + Math.sin(elapsed * speed * 0.5 + offset) * 0.1;
      });
    }
  }

  _createScanlines() {
    const lineCount = 20;

    for (let i = 0; i < lineCount; i++) {
      const colorIndex = i % this.colors.length;
      const geometry = new THREE.PlaneGeometry(200, 0.2);
      const material = new THREE.MeshBasicMaterial({
        color: this.colors[colorIndex],
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });

      const line = new THREE.Mesh(geometry, material);
      line.position.y = (i - lineCount / 2) * 3;
      line.position.z = -15;
      line.name = `scanline_${i}`;

      this._addObject(line);

      // Scanline flicker
      const flickerSpeed = 5 + Math.random() * 10;

      this._onAnimate((delta, elapsed) => {
        material.opacity = 0.2 + Math.abs(Math.sin(elapsed * flickerSpeed)) * 0.3;
      });
    }
  }

  _createRibbons() {
    const ribbonCount = 8;

    for (let r = 0; r < ribbonCount; r++) {
      const points = [];
      const segments = 50;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * 100;
        const y = Math.sin(t * Math.PI * 4) * 5 + (r - ribbonCount / 2) * 8;
        const z = Math.cos(t * Math.PI * 2) * 10 - 10;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.3, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: this.colors[r % this.colors.length],
        transparent: true,
        opacity: 0.5,
      });

      const ribbon = new THREE.Mesh(geometry, material);
      ribbon.name = `ribbon_${r}`;

      this._addObject(ribbon);

      // Wave animation
      const speed = 0.3 + r * 0.05;

      this._onAnimate((delta, elapsed) => {
        ribbon.rotation.x = Math.sin(elapsed * speed) * 0.1;
        ribbon.position.y = Math.sin(elapsed * speed * 0.5) * 2;
      });
    }
  }

  _createGlitchParticles() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'glitchParticles';

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // Random glitch displacement
        if (Math.random() < 0.02) {
          pos[i3] += (Math.random() - 0.5) * 5;
          pos[i3 + 1] += (Math.random() - 0.5) * 5;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    });
  }
}

window.StripeBarEnvironment = StripeBarEnvironment;
