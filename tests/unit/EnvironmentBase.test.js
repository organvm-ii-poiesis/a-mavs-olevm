/**
 * @file EnvironmentBase.test.js
 * @description Unit tests for EnvironmentBase abstract class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../unit/setup.js';

// Import module by evaluating the source
const EnvironmentBaseSource = await import(
  '../../js/3d/ogod/environments/EnvironmentBase.js?raw'
).then(m => m.default);
eval(EnvironmentBaseSource);

// Create a concrete implementation for testing
class TestEnvironment extends EnvironmentBase {
  async initialize() {
    this.isInitialized = true;
    return Promise.resolve();
  }
}

describe('EnvironmentBase', () => {
  let environment;
  let mockSceneManager;

  beforeEach(() => {
    mockSceneManager = {
      add: vi.fn(),
      remove: vi.fn(),
      onAnimate: vi.fn().mockReturnValue(() => {}),
    };
  });

  afterEach(() => {
    if (environment) {
      environment.dispose();
    }
  });

  describe('constructor', () => {
    it('should throw error when instantiated directly', () => {
      expect(() => {
        new EnvironmentBase({ sceneManager: mockSceneManager });
      }).toThrow('EnvironmentBase is abstract and cannot be instantiated');
    });

    it('should allow subclass instantiation', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment).toBeInstanceOf(EnvironmentBase);
    });

    it('should store sceneManager reference', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.sceneManager).toBe(mockSceneManager);
    });

    it('should use default palette if not provided', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.palette).toHaveLength(4);
      expect(environment.palette[0]).toBe('#6B4C7A');
    });

    it('should use custom palette if provided', () => {
      const customPalette = ['#FF0000', '#00FF00', '#0000FF'];
      environment = new TestEnvironment({
        sceneManager: mockSceneManager,
        palette: customPalette,
      });
      expect(environment.palette).toEqual(customPalette);
    });

    it('should convert palette to THREE.Color objects', () => {
      environment = new TestEnvironment({
        sceneManager: mockSceneManager,
        palette: ['#FF0000', '#00FF00'],
      });
      expect(environment.colors).toHaveLength(2);
      expect(environment.colors[0]).toBeDefined();
    });

    it('should initialize empty objects array', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.objects).toEqual([]);
    });

    it('should initialize empty animation unsubscribers', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.animationUnsubscribers).toEqual([]);
    });

    it('should set audioReactive based on audioUniforms', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.audioReactive).toBe(false);

      const audioUniforms = { uBassLevel: { value: 0 } };
      environment = new TestEnvironment({
        sceneManager: mockSceneManager,
        audioUniforms,
      });
      expect(environment.audioReactive).toBe(true);
    });

    it('should initialize floorMesh as null', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.floorMesh).toBeNull();
    });

    it('should initialize isInitialized as false', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      expect(environment.isInitialized).toBe(false);
    });
  });

  describe('initialize (abstract)', () => {
    it('should throw error in base class', async () => {
      // Create a minimal subclass that doesn't override initialize
      class MinimalEnv extends EnvironmentBase {
        constructor(options) {
          super(options);
        }
      }

      // Need to bypass the abstract check
      const orig = EnvironmentBase;
      class TempBase extends orig {
        constructor(options) {
          // Call grandparent constructor behavior
          Object.setPrototypeOf(this, MinimalEnv.prototype);
        }
      }

      // The base class initialize should throw
      const env = new TestEnvironment({ sceneManager: mockSceneManager });
      // Replace with base implementation temporarily
      const baseInit = EnvironmentBase.prototype.initialize;

      await expect(baseInit.call(env)).rejects.toThrow(
        'initialize() must be implemented by subclass'
      );
    });
  });

  describe('_getAudioUniforms', () => {
    it('should return audio uniforms when provided', () => {
      const audioUniforms = {
        uBassLevel: { value: 0.5 },
        uMidLevel: { value: 0.3 },
        uTrebleLevel: { value: 0.2 },
        uSubBassLevel: { value: 0.4 },
        uKickHit: { value: 1 },
        uSnareHit: { value: 0 },
        uBeatHit: { value: 0 },
        uEnergy: { value: 0.7 },
        uBPM: { value: 120 },
      };

      environment = new TestEnvironment({
        sceneManager: mockSceneManager,
        audioUniforms,
      });

      const uniforms = environment._getAudioUniforms();

      expect(uniforms.uBassLevel.value).toBe(0.5);
      expect(uniforms.uMidLevel.value).toBe(0.3);
      expect(uniforms.uBPM.value).toBe(120);
    });

    it('should return zero uniforms when audio not enabled', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const uniforms = environment._getAudioUniforms();

      expect(uniforms.uBassLevel.value).toBe(0);
      expect(uniforms.uMidLevel.value).toBe(0);
      expect(uniforms.uTrebleLevel.value).toBe(0);
      expect(uniforms.uEnergy.value).toBe(0);
      expect(uniforms.uBPM.value).toBe(0);
    });
  });

  describe('setAudioReactive', () => {
    it('should update audioReactive flag', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      expect(environment.audioReactive).toBe(false);

      environment.setAudioReactive(true);
      expect(environment.audioReactive).toBe(true);

      environment.setAudioReactive(false);
      expect(environment.audioReactive).toBe(false);
    });
  });

  describe('_addObject', () => {
    it('should add object to scene manager', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const mesh = new THREE.Mesh();

      environment._addObject(mesh);

      expect(mockSceneManager.add).toHaveBeenCalledWith(mesh);
    });

    it('should track object for cleanup', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const mesh = new THREE.Mesh();

      environment._addObject(mesh);

      expect(environment.objects).toContain(mesh);
    });
  });

  describe('_onAnimate', () => {
    it('should register animation callback', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const callback = vi.fn();

      environment._onAnimate(callback);

      expect(mockSceneManager.onAnimate).toHaveBeenCalledWith(callback);
    });

    it('should store unsubscriber', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const callback = vi.fn();

      environment._onAnimate(callback);

      expect(environment.animationUnsubscribers).toHaveLength(1);
    });
  });

  describe('_createColorZone', () => {
    it('should create sphere mesh', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const color = new THREE.Color(0xff0000);
      const position = { x: 10, y: 5, z: 20 };

      const zone = environment._createColorZone(color, position);

      expect(THREE.SphereGeometry).toHaveBeenCalled();
      expect(THREE.MeshBasicMaterial).toHaveBeenCalled();
      expect(THREE.Mesh).toHaveBeenCalled();
    });

    it('should use provided radius', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const color = new THREE.Color(0xff0000);
      const position = { x: 0, y: 0, z: 0 };

      environment._createColorZone(color, position, 25);

      expect(THREE.SphereGeometry).toHaveBeenCalledWith(25, 32, 32);
    });

    it('should use default radius of 15', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const color = new THREE.Color(0xff0000);
      const position = { x: 0, y: 0, z: 0 };

      environment._createColorZone(color, position);

      expect(THREE.SphereGeometry).toHaveBeenCalledWith(15, 32, 32);
    });
  });

  describe('_createParticles', () => {
    it('should create Points object', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const particles = environment._createParticles({
        count: 500,
        color: new THREE.Color(0xffffff),
        size: 0.1,
        spread: 30,
      });

      expect(THREE.Points).toHaveBeenCalled();
      expect(THREE.BufferGeometry).toHaveBeenCalled();
      expect(THREE.PointsMaterial).toHaveBeenCalled();
    });

    it('should use default values', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const particles = environment._createParticles();

      expect(THREE.PointsMaterial).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 0.05,
          vertexColors: true,
          transparent: true,
        })
      );
    });
  });

  describe('_createGround', () => {
    it('should create plane mesh', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const ground = environment._createGround();

      expect(THREE.PlaneGeometry).toHaveBeenCalled();
      expect(THREE.MeshBasicMaterial).toHaveBeenCalled();
    });

    it('should use default size of 200', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      environment._createGround();

      expect(THREE.PlaneGeometry).toHaveBeenCalledWith(200, 200);
    });

    it('should use custom size', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      environment._createGround({ size: 500 });

      expect(THREE.PlaneGeometry).toHaveBeenCalledWith(500, 500);
    });

    it('should store floor mesh reference for VR teleport', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const ground = environment._createGround();

      expect(environment.floorMesh).toBe(ground);
    });

    it('should name mesh for teleport identification', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      const ground = environment._createGround();

      expect(ground.name).toBe('teleportFloor');
    });
  });

  describe('getFloorMesh', () => {
    it('should return null before ground created', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      expect(environment.getFloorMesh()).toBeNull();
    });

    it('should return floor mesh after creation', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const ground = environment._createGround();

      expect(environment.getFloorMesh()).toBe(ground);
    });
  });

  describe('_createAmbientLight', () => {
    it('should create ambient light with default intensity', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      environment._createAmbientLight();

      expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.5);
    });

    it('should create ambient light with custom intensity', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });

      environment._createAmbientLight(0.8);

      expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.8);
    });
  });

  describe('_lerpColor', () => {
    it('should interpolate between colors at t=0', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const a = new THREE.Color(1, 0, 0); // Red
      const b = new THREE.Color(0, 1, 0); // Green

      const result = environment._lerpColor(a, b, 0);

      expect(result.r).toBe(1);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should interpolate between colors at t=1', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const a = new THREE.Color(1, 0, 0); // Red
      const b = new THREE.Color(0, 1, 0); // Green

      const result = environment._lerpColor(a, b, 1);

      expect(result.r).toBe(0);
      expect(result.g).toBe(1);
      expect(result.b).toBe(0);
    });

    it('should interpolate between colors at t=0.5', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const a = new THREE.Color(1, 0, 0); // Red
      const b = new THREE.Color(0, 1, 0); // Green

      const result = environment._lerpColor(a, b, 0.5);

      expect(result.r).toBe(0.5);
      expect(result.g).toBe(0.5);
      expect(result.b).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should remove objects from scene', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const mesh = new THREE.Mesh();
      environment._addObject(mesh);

      environment.dispose();

      expect(mockSceneManager.remove).toHaveBeenCalledWith(mesh);
    });

    it('should dispose geometry and material', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const geometry = { dispose: vi.fn() };
      const material = { dispose: vi.fn() };
      const mesh = { geometry, material };
      environment.objects.push(mesh);

      environment.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
      expect(material.dispose).toHaveBeenCalled();
    });

    it('should handle array materials', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const material1 = { dispose: vi.fn() };
      const material2 = { dispose: vi.fn() };
      const mesh = {
        geometry: { dispose: vi.fn() },
        material: [material1, material2],
      };
      environment.objects.push(mesh);

      environment.dispose();

      expect(material1.dispose).toHaveBeenCalled();
      expect(material2.dispose).toHaveBeenCalled();
    });

    it('should call animation unsubscribers', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      const unsubscribe = vi.fn();
      environment.animationUnsubscribers.push(unsubscribe);

      environment.dispose();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should clear arrays', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      environment.objects.push({});
      environment.animationUnsubscribers.push(() => {});

      environment.dispose();

      expect(environment.objects).toHaveLength(0);
      expect(environment.animationUnsubscribers).toHaveLength(0);
    });

    it('should set isInitialized to false', () => {
      environment = new TestEnvironment({ sceneManager: mockSceneManager });
      environment.isInitialized = true;

      environment.dispose();

      expect(environment.isInitialized).toBe(false);
    });
  });
});
