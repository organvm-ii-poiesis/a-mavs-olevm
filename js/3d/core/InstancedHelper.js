/**
 * @file InstancedHelper.js
 * @description Helper utilities for creating instanced geometry in ETCETER4 3D
 * Reduces draw calls by batching similar geometry with InstancedMesh
 *
 * Performance Impact:
 * - Reduces draw calls from N to 1 for N instances
 * - GPU-side transformation (faster than CPU)
 * - Typical improvement: 10x fewer draw calls
 * - Memory overhead: ~64 bytes per instance (matrix + color)
 */

'use strict';

/**
 * InstancedHelper - Utilities for creating and managing instanced meshes
 * @class
 */
class InstancedHelper {
  /**
   * Create an instanced mesh from repeated geometry pattern
   * @param {Object} options - Configuration options
   * @param {THREE.BufferGeometry} options.geometry - Base geometry to instance
   * @param {THREE.Material} options.material - Base material (should support instancing)
   * @param {number} options.count - Number of instances
   * @param {Function} [options.positionCallback] - Function(index) => THREE.Vector3
   * @param {Function} [options.rotationCallback] - Function(index) => THREE.Euler
   * @param {Function} [options.scaleCallback] - Function(index) => THREE.Vector3 | number
   * @param {Function} [options.colorCallback] - Function(index) => THREE.Color (requires vertex colors)
   * @returns {THREE.InstancedMesh}
   */
  static createInstancedMesh(options = {}) {
    const {
      geometry,
      material,
      count,
      positionCallback,
      rotationCallback,
      scaleCallback,
      colorCallback,
    } = options;

    if (!geometry || !material || !count) {
      throw new Error(
        'InstancedHelper: geometry, material, and count are required'
      );
    }

    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    // Reusable objects for matrix construction
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    // Set up instance colors if callback provided
    if (colorCallback) {
      const colors = new Float32Array(count * 3);
      const color = new THREE.Color();

      for (let i = 0; i < count; i++) {
        const c = colorCallback(i);
        if (c instanceof THREE.Color) {
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        } else {
          color.set(c);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
      }

      instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
        colors,
        3
      );
    }

    // Set up transforms for each instance
    for (let i = 0; i < count; i++) {
      // Position
      if (positionCallback) {
        const pos = positionCallback(i);
        position.copy(pos);
      } else {
        position.set(0, 0, 0);
      }

      // Rotation
      if (rotationCallback) {
        const rot = rotationCallback(i);
        if (rot instanceof THREE.Euler) {
          quaternion.setFromEuler(rot);
        } else if (rot instanceof THREE.Quaternion) {
          quaternion.copy(rot);
        } else {
          euler.set(rot.x || 0, rot.y || 0, rot.z || 0);
          quaternion.setFromEuler(euler);
        }
      } else {
        quaternion.identity();
      }

      // Scale
      if (scaleCallback) {
        const s = scaleCallback(i);
        if (typeof s === 'number') {
          scale.set(s, s, s);
        } else {
          scale.copy(s);
        }
      } else {
        scale.set(1, 1, 1);
      }

      // Compose matrix
      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);
    }

    // Important: mark matrix buffer for update
    instancedMesh.instanceMatrix.needsUpdate = true;

    return instancedMesh;
  }

  /**
   * Create instanced spheres (optimized for bokeh/particle effects)
   * @param {Object} options - Configuration options
   * @param {number} options.count - Number of spheres
   * @param {number} options.radius - Base sphere radius
   * @param {number} [options.segments=16] - Sphere geometry segments
   * @param {Array<THREE.Color>} [options.colors] - Color palette for cycling
   * @param {Object} [options.spread] - Position spread {x, y, z}
   * @param {Object} [options.radiusVariation] - {min, max} multipliers
   * @param {THREE.Material} [options.material] - Custom material (default: MeshBasicMaterial)
   * @returns {THREE.InstancedMesh}
   */
  static createInstancedSpheres(options = {}) {
    const {
      count,
      radius = 1,
      segments = 16,
      colors = [new THREE.Color(0xffffff)],
      spread = { x: 100, y: 50, z: 100 },
      radiusVariation = { min: 0.5, max: 1.5 },
      material = null,
    } = options;

    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Use provided material or create default
    const mat =
      material ||
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.6,
      });

    // Need to enable instanced color if using colors
    if (colors.length > 1) {
      mat.vertexColors = false; // instanceColor doesn't use vertexColors
    }

    return InstancedHelper.createInstancedMesh({
      geometry,
      material: mat,
      count,
      positionCallback: i =>
        new THREE.Vector3(
          (Math.random() - 0.5) * spread.x,
          Math.random() * spread.y,
          (Math.random() - 0.5) * spread.z
        ),
      scaleCallback: i => {
        const s =
          radiusVariation.min +
          Math.random() * (radiusVariation.max - radiusVariation.min);
        return s;
      },
      colorCallback: i => colors[i % colors.length],
    });
  }

  /**
   * Create instanced boxes (optimized for bars/columns)
   * @param {Object} options - Configuration options
   * @param {number} options.count - Number of boxes
   * @param {Object} [options.size] - Base size {width, height, depth}
   * @param {Array<THREE.Color>} [options.colors] - Color palette
   * @param {Function} [options.positionCallback] - Custom position function
   * @param {Function} [options.sizeCallback] - Custom size function(index) => {width, height, depth}
   * @param {THREE.Material} [options.material] - Custom material
   * @returns {THREE.InstancedMesh}
   */
  static createInstancedBoxes(options = {}) {
    const {
      count,
      size = { width: 1, height: 1, depth: 1 },
      colors = [new THREE.Color(0xffffff)],
      positionCallback = null,
      sizeCallback = null,
      material = null,
    } = options;

    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);

    const mat =
      material ||
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.7,
      });

    return InstancedHelper.createInstancedMesh({
      geometry,
      material: mat,
      count,
      positionCallback:
        positionCallback || (i => new THREE.Vector3((i - count / 2) * 2, 0, 0)),
      scaleCallback: sizeCallback
        ? i => {
            const s = sizeCallback(i);
            return new THREE.Vector3(
              s.width / size.width,
              s.height / size.height,
              s.depth / size.depth
            );
          }
        : null,
      colorCallback: i => colors[i % colors.length],
    });
  }

  /**
   * Create instanced planes (optimized for particles/billboards)
   * @param {Object} options - Configuration options
   * @param {number} options.count - Number of planes
   * @param {number} [options.size=1] - Plane size
   * @param {Array<THREE.Color>} [options.colors] - Color palette
   * @param {Object} [options.spread] - Position spread
   * @param {THREE.Material} [options.material] - Custom material
   * @returns {THREE.InstancedMesh}
   */
  static createInstancedPlanes(options = {}) {
    const {
      count,
      size = 1,
      colors = [new THREE.Color(0xffffff)],
      spread = { x: 100, y: 50, z: 100 },
      material = null,
    } = options;

    const geometry = new THREE.PlaneGeometry(size, size);

    const mat =
      material ||
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });

    return InstancedHelper.createInstancedMesh({
      geometry,
      material: mat,
      count,
      positionCallback: i =>
        new THREE.Vector3(
          (Math.random() - 0.5) * spread.x,
          (Math.random() - 0.5) * spread.y,
          (Math.random() - 0.5) * spread.z
        ),
      rotationCallback: i =>
        new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
      colorCallback: i => colors[i % colors.length],
    });
  }

  /**
   * Update instance transforms in batch (for animation)
   * @param {THREE.InstancedMesh} instancedMesh - The instanced mesh
   * @param {Function} updateCallback - Function(index, matrix, time) - should modify matrix
   * @param {number} time - Current time for animation
   * @param {number} [startIndex=0] - Start index for partial updates
   * @param {number} [endIndex] - End index for partial updates
   */
  static updateInstanceTransforms(
    instancedMesh,
    updateCallback,
    time,
    startIndex = 0,
    endIndex = null
  ) {
    const count = instancedMesh.count;
    const end = endIndex !== null ? Math.min(endIndex, count) : count;
    const matrix = new THREE.Matrix4();

    for (let i = startIndex; i < end; i++) {
      instancedMesh.getMatrixAt(i, matrix);
      updateCallback(i, matrix, time);
      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Update instance colors in batch
   * @param {THREE.InstancedMesh} instancedMesh - The instanced mesh
   * @param {Function} colorCallback - Function(index, time) => THREE.Color
   * @param {number} time - Current time for animation
   */
  static updateInstanceColors(instancedMesh, colorCallback, time) {
    if (!instancedMesh.instanceColor) {
      console.warn('InstancedHelper: instanceColor not set on mesh');
      return;
    }

    const count = instancedMesh.count;
    const colors = instancedMesh.instanceColor.array;

    for (let i = 0; i < count; i++) {
      const color = colorCallback(i, time);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    instancedMesh.instanceColor.needsUpdate = true;
  }

  /**
   * Create a shader material optimized for instanced rendering with per-instance data
   * @param {Object} options - Shader options
   * @param {Object} [options.uniforms] - Additional uniforms
   * @param {string} [options.vertexShaderPrefix] - Code to add before main()
   * @param {string} [options.vertexShaderMain] - Code inside main()
   * @param {string} [options.fragmentShaderPrefix] - Code to add before main()
   * @param {string} [options.fragmentShaderMain] - Code inside main()
   * @param {boolean} [options.useInstanceColor=true] - Use instance colors
   * @returns {THREE.ShaderMaterial}
   */
  static createInstancedShaderMaterial(options = {}) {
    const {
      uniforms = {},
      vertexShaderPrefix = '',
      vertexShaderMain = '',
      fragmentShaderPrefix = '',
      fragmentShaderMain = '',
      useInstanceColor = true,
      transparent = true,
      blending = THREE.NormalBlending,
      depthWrite = true,
    } = options;

    const baseUniforms = {
      uTime: { value: 0 },
      ...uniforms,
    };

    return new THREE.ShaderMaterial({
      uniforms: baseUniforms,
      vertexShader: `
        ${useInstanceColor ? 'attribute vec3 instanceColor;' : ''}
        ${vertexShaderPrefix}

        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          ${useInstanceColor ? 'vColor = instanceColor;' : 'vColor = vec3(1.0);'}
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;

          ${vertexShaderMain || 'gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);'}
        }
      `,
      fragmentShader: `
        ${fragmentShaderPrefix}

        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          ${fragmentShaderMain || 'gl_FragColor = vec4(vColor, 1.0);'}
        }
      `,
      transparent,
      blending,
      depthWrite,
    });
  }
}

// Export for global scope
window.InstancedHelper = InstancedHelper;
