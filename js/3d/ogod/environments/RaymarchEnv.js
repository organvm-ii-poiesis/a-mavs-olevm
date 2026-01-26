/**
 * @file RaymarchEnv.js
 * @description Raymarched SDF (signed distance function) landscape environment
 * Full-screen shader approach with morphing organic shapes and fractal detail
 * Audio-reactive deformation creates otherworldly, demoscene-inspired visuals
 *
 * Inspired by: Shadertoy, demoscene, fractal art, iq's raymarching tutorials,
 *              Mandelbulb, Mercury SDF library, Revision demoparty
 *
 * Color palette mood: Cosmic and alien
 * - SDF surfaces colored by distance/normal
 * - Ambient occlusion creates depth
 * - Glow effects on edges
 * - Fog and atmosphere from palette
 *
 * Technical: Uses full-screen quad with raymarching fragment shader
 * Camera movement is handled by passing camera matrices to shader
 *
 * @class RaymarchEnvironment
 * @extends EnvironmentBase
 */

'use strict';

/**
 * RaymarchEnvironment - Raymarched fractal landscape
 * @class
 * @extends EnvironmentBase
 */
class RaymarchEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options - Configuration options
   * @param {SceneManager} options.sceneManager - Scene manager instance
   * @param {Array<string>} options.palette - Color palette array
   * @param {OGODAudioEngine} [options.audioEngine] - Optional audio engine for live data
   */
  constructor(options = {}) {
    super(options);

    this.audioEngine = options.audioEngine || null;

    // Raymarching quality settings
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.maxSteps = this.isMobile ? 64 : 128;
    this.maxDistance = 100;
    this.surfaceDistance = 0.001;

    // Audio levels
    this.bassLevel = 0;
    this.midLevel = 0;
    this.highLevel = 0;

    // Morph state
    this.morphState = 0;
  }

  /**
   * Initialize the raymarching environment
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create full-screen raymarching quad
    this._createRaymarchQuad();

    // Create ambient particles for depth perception
    this._createAmbientParticles();

    // Create post-processing glow layer
    this._createGlowOverlay();

    this.isInitialized = true;
  }

  /**
   * Create the full-screen raymarching quad
   * @private
   */
  _createRaymarchQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Complex raymarching shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uCameraPos: { value: new THREE.Vector3(0, 2, 5) },
        uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
        uFov: { value: 75 },
        uColor1: { value: this.colors[0] },
        uColor2: { value: this.colors[1] },
        uColor3: { value: this.colors[2] || this.colors[0] },
        uColor4: { value: this.colors[3] || this.colors[1] },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uMorphState: { value: 0 },
        uMaxSteps: { value: this.maxSteps },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uCameraPos;
        uniform vec3 uCameraTarget;
        uniform float uFov;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;
        uniform float uBassLevel;
        uniform float uMidLevel;
        uniform float uHighLevel;
        uniform float uMorphState;
        uniform float uMaxSteps;

        varying vec2 vUv;

        #define PI 3.14159265359
        #define MAX_DIST 100.0
        #define SURF_DIST 0.001

        // Rotation matrix
        mat2 rot2D(float a) {
          float s = sin(a), c = cos(a);
          return mat2(c, -s, s, c);
        }

        // Smooth min for organic blending
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        // Smooth max
        float smax(float a, float b, float k) {
          return -smin(-a, -b, k);
        }

        // SDF primitives
        float sdSphere(vec3 p, float r) {
          return length(p) - r;
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
        }

        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float sdOctahedron(vec3 p, float s) {
          p = abs(p);
          return (p.x + p.y + p.z - s) * 0.57735027;
        }

        // Fractal detail function
        float fractalNoise(vec3 p) {
          float d = 0.0;
          float amp = 1.0;
          float freq = 1.0;

          for (int i = 0; i < 4; i++) {
            vec3 q = p * freq;
            float n = sin(q.x + uTime * 0.3) * cos(q.y + uTime * 0.2) * sin(q.z + uTime * 0.4);
            d += n * amp;
            amp *= 0.5;
            freq *= 2.0;
          }

          return d * 0.2;
        }

        // Main scene SDF
        float sceneSDF(vec3 p) {
          // Apply overall rotation
          p.xz *= rot2D(uTime * 0.1);
          p.xy *= rot2D(uTime * 0.05);

          // Morphing organic base shape
          float morph = uMorphState;

          // Sphere
          float sphere = sdSphere(p, 2.0 + uBassLevel * 0.5);

          // Torus
          float torus = sdTorus(p, vec2(2.5 + uMidLevel * 0.3, 0.8));

          // Octahedron
          float octa = sdOctahedron(p, 2.5 + uHighLevel * 0.5);

          // Blend between shapes based on morph state
          float base;
          if (morph < 1.0) {
            base = mix(sphere, torus, morph);
          } else if (morph < 2.0) {
            base = mix(torus, octa, morph - 1.0);
          } else {
            base = mix(octa, sphere, morph - 2.0);
          }

          // Add fractal detail
          float detail = fractalNoise(p * 2.0);
          base += detail * (0.3 + uBassLevel * 0.2);

          // Audio-reactive displacement
          float audioDisplace = sin(p.x * 3.0 + uTime * 2.0) * uBassLevel * 0.2;
          audioDisplace += sin(p.y * 5.0 + uTime * 3.0) * uMidLevel * 0.15;
          audioDisplace += sin(p.z * 7.0 + uTime * 4.0) * uHighLevel * 0.1;
          base += audioDisplace;

          // Ground plane
          float ground = p.y + 4.0;

          // Orbiting satellite spheres
          float orbitSpeed = uTime * 0.5;
          vec3 sat1Pos = vec3(sin(orbitSpeed) * 4.0, cos(orbitSpeed * 0.7) * 2.0, cos(orbitSpeed) * 4.0);
          vec3 sat2Pos = vec3(cos(orbitSpeed * 1.3) * 3.5, sin(orbitSpeed * 0.9) * 2.5, sin(orbitSpeed * 1.3) * 3.5);
          vec3 sat3Pos = vec3(sin(orbitSpeed * 0.8) * 5.0, cos(orbitSpeed * 1.1) * 1.5, cos(orbitSpeed * 0.8) * 5.0);

          float sat1 = sdSphere(p - sat1Pos, 0.5 + uBassLevel * 0.3);
          float sat2 = sdSphere(p - sat2Pos, 0.4 + uMidLevel * 0.2);
          float sat3 = sdSphere(p - sat3Pos, 0.3 + uHighLevel * 0.2);

          // Combine all objects with smooth min
          float scene = smin(base, sat1, 0.5);
          scene = smin(scene, sat2, 0.4);
          scene = smin(scene, sat3, 0.3);
          scene = min(scene, ground);

          return scene;
        }

        // Calculate normal
        vec3 calcNormal(vec3 p) {
          const float h = 0.001;
          return normalize(vec3(
            sceneSDF(p + vec3(h, 0, 0)) - sceneSDF(p - vec3(h, 0, 0)),
            sceneSDF(p + vec3(0, h, 0)) - sceneSDF(p - vec3(0, h, 0)),
            sceneSDF(p + vec3(0, 0, h)) - sceneSDF(p - vec3(0, 0, h))
          ));
        }

        // Ambient occlusion
        float calcAO(vec3 p, vec3 n) {
          float ao = 0.0;
          float sca = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            float d = sceneSDF(p + n * h);
            ao += (h - d) * sca;
            sca *= 0.75;
          }
          return clamp(1.0 - ao * 3.0, 0.0, 1.0);
        }

        // Soft shadows
        float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
          float res = 1.0;
          float t = mint;
          for (int i = 0; i < 32; i++) {
            float h = sceneSDF(ro + rd * t);
            res = min(res, k * h / t);
            t += clamp(h, 0.02, 0.2);
            if (h < 0.001 || t > maxt) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        // Raymarching
        float rayMarch(vec3 ro, vec3 rd) {
          float t = 0.0;
          for (int i = 0; i < 128; i++) {
            if (float(i) >= uMaxSteps) break;
            vec3 p = ro + rd * t;
            float d = sceneSDF(p);
            t += d;
            if (d < SURF_DIST || t > MAX_DIST) break;
          }
          return t;
        }

        // Get color based on position and normal
        vec3 getColor(vec3 p, vec3 n) {
          // Base color from position
          float colorMix = (n.y + 1.0) * 0.5;

          vec3 color;
          if (colorMix < 0.33) {
            color = mix(uColor1, uColor2, colorMix * 3.0);
          } else if (colorMix < 0.66) {
            color = mix(uColor2, uColor3, (colorMix - 0.33) * 3.0);
          } else {
            color = mix(uColor3, uColor4, (colorMix - 0.66) * 3.0);
          }

          // Add variation based on position
          float posVariation = sin(p.x * 2.0 + p.y * 3.0 + p.z * 2.5 + uTime) * 0.5 + 0.5;
          color = mix(color, uColor4, posVariation * 0.3);

          return color;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * 2.0;
          uv.x *= uResolution.x / uResolution.y;

          // Camera setup
          vec3 ro = uCameraPos;
          vec3 target = uCameraTarget;

          // Calculate camera direction vectors
          vec3 forward = normalize(target - ro);
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
          vec3 up = cross(forward, right);

          // Calculate ray direction
          float fovRad = uFov * PI / 180.0;
          vec3 rd = normalize(forward + uv.x * right * tan(fovRad * 0.5) + uv.y * up * tan(fovRad * 0.5));

          // Raymarch
          float t = rayMarch(ro, rd);

          vec3 color;

          if (t < MAX_DIST) {
            vec3 p = ro + rd * t;
            vec3 n = calcNormal(p);

            // Get base color
            vec3 baseColor = getColor(p, n);

            // Lighting
            vec3 lightPos = vec3(5.0, 10.0, 5.0);
            vec3 lightDir = normalize(lightPos - p);

            // Diffuse
            float diff = max(dot(n, lightDir), 0.0);

            // Specular
            vec3 viewDir = normalize(ro - p);
            vec3 reflectDir = reflect(-lightDir, n);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

            // Ambient occlusion
            float ao = calcAO(p, n);

            // Soft shadow
            float shadow = softShadow(p + n * 0.02, lightDir, 0.1, 10.0, 8.0);

            // Combine lighting
            vec3 ambient = baseColor * 0.15;
            vec3 diffuse = baseColor * diff * 0.7;
            vec3 specular = vec3(1.0) * spec * 0.3;

            color = (ambient + (diffuse + specular) * shadow) * ao;

            // Fresnel rim lighting
            float fresnel = pow(1.0 - dot(n, viewDir), 3.0);
            color += uColor4 * fresnel * 0.4 * (1.0 + uBassLevel);

            // Distance fog
            float fog = 1.0 - exp(-t * 0.05);
            vec3 fogColor = mix(uColor1, uColor2, 0.5) * 0.3;
            color = mix(color, fogColor, fog);

          } else {
            // Background gradient
            float gradient = (rd.y + 1.0) * 0.5;
            color = mix(uColor1 * 0.1, uColor2 * 0.2, gradient);

            // Add stars
            vec2 starUv = vUv * 100.0;
            float star = step(0.998, fract(sin(dot(floor(starUv), vec2(12.9898, 78.233))) * 43758.5453));
            color += star * uColor4 * 0.5;
          }

          // Gamma correction
          color = pow(color, vec3(0.4545));

          // Audio-reactive vignette
          float vignette = 1.0 - length(vUv - 0.5) * (0.8 + uBassLevel * 0.4);
          color *= vignette;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    // Store reference for updates
    this.raymarchMaterial = material;

    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    quad.name = 'raymarchQuad';

    // Add to scene at specific render order
    quad.renderOrder = -1000;
    this._addObject(quad);

    // Handle window resize
    const onResize = () => {
      material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    };
    window.addEventListener('resize', onResize);

    // Animate
    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uBassLevel.value = this.bassLevel;
      material.uniforms.uMidLevel.value = this.midLevel;
      material.uniforms.uHighLevel.value = this.highLevel;

      // Update morph state (cycle through shapes)
      this.morphState = (elapsed * 0.2) % 3;
      material.uniforms.uMorphState.value = this.morphState;

      // Update camera position from scene camera
      const camera = this.sceneManager.camera;
      material.uniforms.uCameraPos.value.copy(camera.position);

      // Calculate target from camera direction
      const target = new THREE.Vector3(0, 0, -1);
      target.applyQuaternion(camera.quaternion);
      target.add(camera.position);
      material.uniforms.uCameraTarget.value.copy(target);

      material.uniforms.uFov.value = camera.fov;
    });

    // Store cleanup callback
    this.animationUnsubscribers.push(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  /**
   * Create ambient particles for depth perception
   * @private
   */
  _createAmbientParticles() {
    const count = this.isMobile ? 100 : 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Position particles in a sphere around origin
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 20;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'ambientParticles';
    particles.renderOrder = 1;

    this._addObject(particles);

    this._onAnimate((delta, elapsed) => {
      particles.rotation.y = elapsed * 0.02;
      particles.rotation.x = elapsed * 0.01;

      // Pulse size with audio
      material.size = 0.1 * (1 + this.bassLevel * 0.5);
    });
  }

  /**
   * Create post-processing glow overlay
   * @private
   */
  _createGlowOverlay() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: this.colors[3] || this.colors[0] },
        uBassLevel: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uBassLevel;
        varying vec2 vUv;

        void main() {
          // Vignette glow
          float dist = length(vUv - vec2(0.5));
          float glow = smoothstep(0.7, 0.3, dist) * 0.0;

          // Audio-reactive edge glow
          float edgeGlow = smoothstep(0.3, 0.5, dist) * uBassLevel * 0.15;

          // Pulsing effect
          float pulse = sin(uTime * 2.0) * 0.5 + 0.5;

          vec3 color = uColor * (glow + edgeGlow) * (0.5 + pulse * 0.5);

          gl_FragColor = vec4(color, glow + edgeGlow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });

    const overlay = new THREE.Mesh(geometry, material);
    overlay.frustumCulled = false;
    overlay.renderOrder = 1000;
    overlay.name = 'glowOverlay';

    this._addObject(overlay);

    this._onAnimate((delta, elapsed) => {
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uBassLevel.value = this.bassLevel;
    });
  }

  /**
   * Update audio levels from external audio engine
   * @param {Object} levels - Audio level data
   * @param {number} levels.bass - Bass level (0-1)
   * @param {number} levels.mid - Mid level (0-1)
   * @param {number} levels.high - High level (0-1)
   */
  setAudioLevels(levels) {
    this.bassLevel = levels.bass || 0;
    this.midLevel = levels.mid || 0;
    this.highLevel = levels.high || 0;
  }
}

// Export for global scope
window.RaymarchEnvironment = RaymarchEnvironment;
