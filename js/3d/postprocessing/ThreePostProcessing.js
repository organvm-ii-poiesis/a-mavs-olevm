'use strict';

/**
 * @file ThreePostProcessing.js
 * @description Minimal EffectComposer implementation for bloom effects.
 * Provides THREE.RenderPass, THREE.UnrealBloomPass, and THREE.EffectComposer.
 * Extracted from inline script for lazy loading with OGOD 3D chamber.
 *
 * @requires THREE (Three.js must be loaded first)
 */

(function () {
  if (typeof THREE === 'undefined') {
    return;
  }

  // Simple render pass that renders a scene
  THREE.RenderPass = class RenderPass {
    constructor(scene, camera) {
      this.scene = scene;
      this.camera = camera;
      this.enabled = true;
      this.clear = true;
      this.needsSwap = false;
    }
    render(renderer, writeBuffer, readBuffer) {
      renderer.setRenderTarget(this.clear ? null : readBuffer);
      renderer.render(this.scene, this.camera);
    }
  };

  // Simple bloom pass using additive blending
  THREE.UnrealBloomPass = class UnrealBloomPass {
    constructor(resolution, strength, radius, threshold) {
      this.resolution = resolution;
      this.strength = strength;
      this.radius = radius;
      this.threshold = threshold;
      this.enabled = true;
      this.needsSwap = true;

      const params = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      };

      this.renderTargetBright = new THREE.WebGLRenderTarget(
        resolution.x,
        resolution.y,
        params
      );
      this.renderTargetBlur = new THREE.WebGLRenderTarget(
        resolution.x / 2,
        resolution.y / 2,
        params
      );

      this.brightMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          luminosityThreshold: { value: threshold },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float luminosityThreshold;
          varying vec2 vUv;
          void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float luma = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
            float brightness = max(0.0, luma - luminosityThreshold);
            gl_FragColor = texel * brightness * 2.0;
          }
        `,
      });

      this.blurMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          direction: { value: new THREE.Vector2(1, 0) },
          resolution: { value: new THREE.Vector2(resolution.x, resolution.y) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 direction;
          uniform vec2 resolution;
          varying vec2 vUv;
          void main() {
            vec2 texelSize = 1.0 / resolution;
            vec4 result = vec4(0.0);
            float weights[5];
            weights[0] = 0.227027;
            weights[1] = 0.1945946;
            weights[2] = 0.1216216;
            weights[3] = 0.054054;
            weights[4] = 0.016216;
            result += texture2D(tDiffuse, vUv) * weights[0];
            for (int i = 1; i < 5; i++) {
              vec2 offset = direction * texelSize * float(i) * 2.0;
              result += texture2D(tDiffuse, vUv + offset) * weights[i];
              result += texture2D(tDiffuse, vUv - offset) * weights[i];
            }
            gl_FragColor = result;
          }
        `,
      });

      this.compositeMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          tBloom: { value: null },
          bloomStrength: { value: strength },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform sampler2D tBloom;
          uniform float bloomStrength;
          varying vec2 vUv;
          void main() {
            vec4 base = texture2D(tDiffuse, vUv);
            vec4 bloom = texture2D(tBloom, vUv);
            gl_FragColor = base + bloom * bloomStrength;
          }
        `,
      });

      this.fsQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        this.brightMaterial
      );
      this.fsScene = new THREE.Scene();
      this.fsScene.add(this.fsQuad);
      this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    render(renderer, writeBuffer, readBuffer) {
      this.brightMaterial.uniforms.tDiffuse.value = readBuffer.texture;
      this.fsQuad.material = this.brightMaterial;
      renderer.setRenderTarget(this.renderTargetBright);
      renderer.render(this.fsScene, this.fsCamera);

      this.blurMaterial.uniforms.tDiffuse.value =
        this.renderTargetBright.texture;
      this.blurMaterial.uniforms.direction.value.set(1, 0);
      this.fsQuad.material = this.blurMaterial;
      renderer.setRenderTarget(this.renderTargetBlur);
      renderer.render(this.fsScene, this.fsCamera);

      this.blurMaterial.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
      this.blurMaterial.uniforms.direction.value.set(0, 1);
      renderer.setRenderTarget(this.renderTargetBright);
      renderer.render(this.fsScene, this.fsCamera);

      this.compositeMaterial.uniforms.tDiffuse.value = readBuffer.texture;
      this.compositeMaterial.uniforms.tBloom.value =
        this.renderTargetBright.texture;
      this.compositeMaterial.uniforms.bloomStrength.value = this.strength;
      this.fsQuad.material = this.compositeMaterial;
      renderer.setRenderTarget(writeBuffer);
      renderer.render(this.fsScene, this.fsCamera);
    }

    dispose() {
      this.renderTargetBright.dispose();
      this.renderTargetBlur.dispose();
      this.brightMaterial.dispose();
      this.blurMaterial.dispose();
      this.compositeMaterial.dispose();
    }
  };

  // Effect composer
  THREE.EffectComposer = class EffectComposer {
    constructor(renderer) {
      this.renderer = renderer;
      this.passes = [];

      const size = renderer.getSize(new THREE.Vector2());
      const params = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      };

      this.renderTarget1 = new THREE.WebGLRenderTarget(size.x, size.y, params);
      this.renderTarget2 = new THREE.WebGLRenderTarget(size.x, size.y, params);
      this.writeBuffer = this.renderTarget1;
      this.readBuffer = this.renderTarget2;
    }

    addPass(pass) {
      this.passes.push(pass);
    }

    render() {
      for (let i = 0; i < this.passes.length; i++) {
        const pass = this.passes[i];
        if (!pass.enabled) {
          continue;
        }

        pass.render(this.renderer, this.writeBuffer, this.readBuffer);

        if (pass.needsSwap) {
          const tmp = this.readBuffer;
          this.readBuffer = this.writeBuffer;
          this.writeBuffer = tmp;
        }
      }
      this.renderer.setRenderTarget(null);
    }

    setSize(width, height) {
      this.renderTarget1.setSize(width, height);
      this.renderTarget2.setSize(width, height);
    }

    dispose() {
      this.renderTarget1.dispose();
      this.renderTarget2.dispose();
    }
  };
})();
