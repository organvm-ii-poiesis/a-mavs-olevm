/**
 * @file LODManager.test.js
 * @description Unit tests for LODManager level-of-detail system
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../unit/setup.js';

// Import module by evaluating the source
const LODManagerSource = await import(
  '../../js/3d/core/LODManager.js?raw'
).then(m => m.default);
eval(LODManagerSource);

describe('LODManager', () => {
  let camera;
  let lodManager;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.getWorldPosition = vi.fn().mockImplementation(target => {
      target.x = camera.position.x;
      target.y = camera.position.y;
      target.z = camera.position.z;
      return target;
    });
  });

  afterEach(() => {
    if (lodManager) {
      lodManager.dispose();
    }
  });

  describe('constructor', () => {
    it('should throw error when camera is not provided', () => {
      expect(() => new LODManager({})).toThrow('LODManager requires a camera');
    });

    it('should initialize with default options', () => {
      lodManager = new LODManager({ camera });
      expect(lodManager.enableFadeTransitions).toBe(true);
      expect(lodManager.fadeRange).toBe(0.2);
      expect(lodManager.updateInterval).toBe(2);
    });

    it('should accept custom options', () => {
      lodManager = new LODManager({
        camera,
        enableFadeTransitions: false,
        fadeRange: 0.5,
        updateInterval: 4,
      });
      expect(lodManager.enableFadeTransitions).toBe(false);
      expect(lodManager.fadeRange).toBe(0.5);
      expect(lodManager.updateInterval).toBe(4);
    });

    it('should initialize stats object', () => {
      lodManager = new LODManager({ camera });
      expect(lodManager.stats.totalObjects).toBe(0);
      expect(lodManager.stats.activeHighDetail).toBe(0);
      expect(lodManager.stats.activeMediumDetail).toBe(0);
      expect(lodManager.stats.activeLowDetail).toBe(0);
      expect(lodManager.stats.totalTransitions).toBe(0);
    });
  });

  describe('register', () => {
    beforeEach(() => {
      lodManager = new LODManager({ camera });
    });

    it('should throw error when no levels provided', () => {
      expect(() => lodManager.register('test', [])).toThrow(
        'At least one LOD level is required'
      );
      expect(() => lodManager.register('test', null)).toThrow();
    });

    it('should register object with LOD levels', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const levels = [
        { object: mesh1, distance: 10 },
        { object: mesh2, distance: 50 },
      ];

      const container = lodManager.register('testObj', levels);

      expect(container).toBeDefined();
      expect(container.name).toBe('LOD_testObj');
      expect(lodManager.stats.totalObjects).toBe(1);
    });

    it('should warn when registering duplicate ID', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mesh = new THREE.Mesh();
      const levels = [{ object: mesh, distance: 10 }];

      lodManager.register('dup', levels);
      lodManager.register('dup', levels);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("'dup' already registered")
      );
      consoleSpy.mockRestore();
    });

    it('should sort levels by distance', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const mesh3 = new THREE.Mesh();

      // Provide levels out of order
      const levels = [
        { object: mesh2, distance: 50 },
        { object: mesh1, distance: 10 },
        { object: mesh3, distance: 100 },
      ];

      lodManager.register('sorted', levels);
      const lodObject = lodManager.lodObjects.get('sorted');

      expect(lodObject.levels[0].distance).toBe(10);
      expect(lodObject.levels[1].distance).toBe(50);
      expect(lodObject.levels[2].distance).toBe(100);
    });

    it('should set only first level visible initially', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      mesh1.visible = false;
      mesh2.visible = false;

      const levels = [
        { object: mesh1, distance: 10 },
        { object: mesh2, distance: 50 },
      ];

      lodManager.register('vis', levels);

      expect(levels[0].object.visible).toBe(true);
      expect(levels[1].object.visible).toBe(false);
    });

    it('should set position on container if provided', () => {
      const mesh = new THREE.Mesh();
      const levels = [{ object: mesh, distance: 10 }];
      const position = new THREE.Vector3(5, 10, 15);

      const container = lodManager.register('pos', levels, position);

      expect(container.position.copy).toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      lodManager = new LODManager({ camera });
    });

    it('should return false for non-existent object', () => {
      const result = lodManager.unregister('nonexistent');
      expect(result).toBe(false);
    });

    it('should remove object and dispose resources', () => {
      const geometry = { dispose: vi.fn() };
      const material = { dispose: vi.fn() };
      const mesh = {
        geometry,
        material,
        visible: true,
        userData: {},
      };

      const levels = [{ object: mesh, distance: 10 }];
      lodManager.register('disposable', levels);

      const result = lodManager.unregister('disposable');

      expect(result).toBe(true);
      expect(geometry.dispose).toHaveBeenCalled();
      expect(material.dispose).toHaveBeenCalled();
      expect(lodManager.stats.totalObjects).toBe(0);
    });

    it('should handle array materials', () => {
      const material1 = { dispose: vi.fn() };
      const material2 = { dispose: vi.fn() };
      const mesh = {
        geometry: { dispose: vi.fn() },
        material: [material1, material2],
        visible: true,
        userData: {},
      };

      const levels = [{ object: mesh, distance: 10 }];
      lodManager.register('multiMat', levels);
      lodManager.unregister('multiMat');

      expect(material1.dispose).toHaveBeenCalled();
      expect(material2.dispose).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      lodManager = new LODManager({ camera, updateInterval: 1 });
    });

    it('should skip update based on updateInterval', () => {
      lodManager.updateInterval = 3;
      lodManager._frameCount = 0;

      const mesh = new THREE.Mesh();
      const levels = [{ object: mesh, distance: 10 }];
      lodManager.register('throttle', levels);

      lodManager.update();
      // Frame 1 - should skip (1 % 3 !== 0)
      expect(lodManager._frameCount).toBe(1);
    });
  });

  describe('forceUpdate', () => {
    it('should reset frame count', () => {
      lodManager = new LODManager({ camera, updateInterval: 100 });
      lodManager._frameCount = 50;

      lodManager.forceUpdate();

      // forceUpdate resets frame count to 0, then calls update() which increments to 1
      expect(lodManager._frameCount).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return a copy of stats', () => {
      lodManager = new LODManager({ camera });
      const stats = lodManager.getStats();

      expect(stats).toHaveProperty('totalObjects');
      expect(stats).toHaveProperty('activeHighDetail');
      expect(stats).toHaveProperty('totalTransitions');

      // Modifying returned object should not affect internal stats
      stats.totalObjects = 999;
      expect(lodManager.stats.totalObjects).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should clean up all objects', () => {
      lodManager = new LODManager({ camera });

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      lodManager.register('obj1', [{ object: mesh1, distance: 10 }]);
      lodManager.register('obj2', [{ object: mesh2, distance: 10 }]);

      expect(lodManager.lodObjects.size).toBe(2);

      lodManager.dispose();

      expect(lodManager.lodObjects.size).toBe(0);
    });
  });

  describe('createLODLevels static method', () => {
    it('should handle unsupported geometry types', () => {
      const geometry = {
        type: 'CustomGeometry',
        parameters: {},
      };
      const material = {
        clone: vi.fn().mockReturnValue({ opacity: 1 }),
      };
      const mesh = {
        geometry,
        material,
        clone: vi.fn().mockReturnValue({}),
      };

      const distances = [20, 50];
      const levels = LODManager.createLODLevels(mesh, distances);

      // Should only have high detail level for unsupported types
      expect(levels).toHaveLength(1);
    });
  });

  describe('_simplifyGeometry static method', () => {
    it('should create simplified SphereGeometry', () => {
      const result = LODManager._simplifyGeometry(
        'SphereGeometry',
        { radius: 5 },
        8
      );
      expect(THREE.SphereGeometry).toHaveBeenCalledWith(5, 8, 8);
    });

    it('should create simplified BoxGeometry', () => {
      const result = LODManager._simplifyGeometry(
        'BoxGeometry',
        { width: 2, height: 3, depth: 4 },
        8
      );
      expect(THREE.BoxGeometry).toHaveBeenCalled();
    });

    it('should return null for unknown geometry types', () => {
      const result = LODManager._simplifyGeometry('UnknownGeometry', {}, 8);
      expect(result).toBeNull();
    });
  });
});
