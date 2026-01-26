/**
 * @file BokehGridEnv.js
 * @description Bokeh grid environment for OGOD tracks
 * Creates instanced glowing spheres/hexagons with bloom shader
 * Used for: Street Fighter (23)
 */

'use strict';

/**
 * BokehGridEnvironment - Neon bokeh light world
 * @class
 * @extends EnvironmentBase
 */
class BokehGridEnvironment extends EnvironmentBase {
  constructor(options = {}) {
    super(options);
    this.gridSize = 20;
    this.bokehCount = 200;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create bokeh spheres
    this._createBokehSpheres();

    // Create ground grid
    this._createNeonGrid();

    // Create ambient glow planes
    this._createGlowPlanes();

    // Create floating hexagons
    this._createHexagons();

    // Ambient light
    const ambient = this._createAmbientLight(0.3);
    this._addObject(ambient);

    this.isInitialized = true;
  }

  _createBokehSpheres() {
    for (let i = 0; i < this.bokehCount; i++) {
      const colorIndex = i % this.colors.length;
      const color = this.colors[colorIndex];

      const radius = 0.5 + Math.random() * 2;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uSeed: { value: Math.random() * 100 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uSeed;
          varying vec3 vNormal;

          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + uSeed);
            float alpha = rim * (0.5 + 0.5 * pulse);
            vec3 finalColor = uColor * (1.0 + pulse * 0.5);
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 40,
        (Math.random() - 0.5) * 80
      );
      sphere.name = `bokeh_${i}`;

      this._addObject(sphere);

      const floatSpeed = 0.2 + Math.random() * 0.3;
      const floatOffset = Math.random() * Math.PI * 2;

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
        sphere.position.y += Math.sin(elapsed * floatSpeed + floatOffset) * 0.01;
      });
    }
  }

  _createNeonGrid() {
    const gridHelper = new THREE.GridHelper(100, this.gridSize, 0x00ffff, 0xff00ff);
    gridHelper.position.y = -2;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this._addObject(gridHelper);

    // Create glowing grid lines
    const lineCount = this.gridSize + 1;
    const spacing = 100 / this.gridSize;

    for (let i = 0; i < lineCount; i++) {
      const x = (i - this.gridSize / 2) * spacing;

      // X-axis lines
      const xGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-50, -1.9, x),
        new THREE.Vector3(50, -1.9, x),
      ]);

      // Z-axis lines
      const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -1.9, -50),
        new THREE.Vector3(x, -1.9, 50),
      ]);

      const color = this.colors[i % this.colors.length];
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
      });

      const xLine = new THREE.Line(xGeometry, material.clone());
      const zLine = new THREE.Line(zGeometry, material.clone());

      this._addObject(xLine);
      this._addObject(zLine);
    }
  }

  _createGlowPlanes() {
    const planeCount = 6;

    for (let i = 0; i < planeCount; i++) {
      const color = this.colors[i % this.colors.length];

      const geometry = new THREE.PlaneGeometry(40, 40);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color },
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
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            float dist = length(vUv - vec2(0.5));
            float alpha = smoothstep(0.5, 0.0, dist) * 0.15;
            float pulse = 0.5 + 0.5 * sin(uTime * 1.5);
            gl_FragColor = vec4(uColor, alpha * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      const angle = (i / planeCount) * Math.PI * 2;
      plane.position.set(
        Math.cos(angle) * 30,
        15 + Math.sin(angle * 2) * 5,
        Math.sin(angle) * 30
      );
      plane.lookAt(0, 10, 0);
      plane.name = `glowPlane_${i}`;

      this._addObject(plane);

      this._onAnimate((delta, elapsed) => {
        material.uniforms.uTime.value = elapsed;
        plane.rotation.z = elapsed * 0.1;
      });
    }
  }

  _createHexagons() {
    const hexCount = 30;

    for (let i = 0; i < hexCount; i++) {
      const color = this.colors[i % this.colors.length];
      const radius = 1 + Math.random() * 2;

      const shape = new THREE.Shape();
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (j === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      const hex = new THREE.Mesh(geometry, material);
      hex.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 60
      );
      hex.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      hex.name = `hexagon_${i}`;

      this._addObject(hex);

      const rotSpeed = (Math.random() - 0.5) * 0.5;

      this._onAnimate((delta, elapsed) => {
        hex.rotation.z += rotSpeed * delta;
        hex.position.y += Math.sin(elapsed + i) * 0.005;
      });
    }
  }
}

window.BokehGridEnvironment = BokehGridEnvironment;
