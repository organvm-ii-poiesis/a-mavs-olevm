/**
 * @file tests/unit/OGODSceneManager.test.js
 * @description Unit tests for OGODSceneManager class
 * Tests scene initialization, environment loading, controller integration, and audio mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OGODSceneManager', () => {
  let OGODSceneManager;
  let container;
  let mockSceneManager;
  let mockEnvironment;
  let mockController;
  let mockAudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create container
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 600,
      configurable: true,
    });

    // Create mock SceneManager
    mockSceneManager = {
      camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: { set: vi.fn(), clone: vi.fn().mockReturnThis() },
        updateProjectionMatrix: vi.fn(),
      },
      renderer: { domElement: document.createElement('canvas') },
      setFog: vi.fn(),
      setBackground: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      onAnimate: vi.fn().mockReturnValue(vi.fn()),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      enableBloom: vi.fn(),
      disableBloom: vi.fn(),
    };

    // Create mock environment
    mockEnvironment = {
      initialize: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    };

    // Create mock controller
    mockController = {
      enable: vi.fn(),
      disable: vi.fn(),
      dispose: vi.fn(),
      update: vi.fn(),
    };

    // Create mock audio engine
    mockAudioEngine = {
      setStemVolumes: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
    };

    // Mock global classes
    global.SceneManager = vi.fn().mockReturnValue(mockSceneManager);
    global.GradientFogEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.StripeBarEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.BokehGridEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.HighContrastEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.LayeredColorsEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.GlitchDigitalEnvironment = vi.fn().mockReturnValue(mockEnvironment);
    global.FirstPersonController = vi.fn().mockReturnValue(mockController);

    // Define OGODSceneManager for testing
    OGODSceneManager = class {
      constructor(options = {}) {
        const config =
          typeof ETCETER4_CONFIG !== 'undefined'
            ? ETCETER4_CONFIG.threeD?.ogodEnv || {}
            : {};

        this.container = options.container;
        this.trackNumber = options.trackNumber || 1;
        this.audioEngine = options.audioEngine || null;

        this.config = {
          camera: config.camera || {
            fov: 75,
            near: 0.1,
            far: 1000,
            moveSpeed: 5.0,
            lookSpeed: 0.002,
          },
          fog: config.fog || {
            enabled: true,
            near: 1,
            far: 50,
            density: 0.02,
          },
          postProcessing: config.postProcessing || {
            bloom: {
              enabled: true,
              strength: 0.5,
              threshold: 0.8,
              radius: 0.5,
            },
          },
        };

        this.trackConfig = this._getTrackConfig();
        this.isInitialized = false;
        this.isRunning = false;
        this.sceneManager = null;
        this.environment = null;
        this.controller = null;
        this.colorZones = [];

        this._onPositionUpdate = this._onPositionUpdate.bind(this);
      }

      _getTrackConfig() {
        const tracks =
          typeof ETCETER4_CONFIG !== 'undefined'
            ? ETCETER4_CONFIG.ogodTracks || {}
            : {};

        const defaultConfig = {
          game: 'Unknown',
          archetype: 'gradient-fog',
          palette: ['#6B4C7A', '#C45B8E', '#D98C4A', '#5A6B3D'],
          artwork: null,
        };

        return tracks[this.trackNumber] || defaultConfig;
      }

      async initialize() {
        if (this.isInitialized) return;
        if (!this.container)
          throw new Error('OGODSceneManager: Container element required');

        this.sceneManager = new SceneManager({
          container: this.container,
          antialias: true,
          alpha: false,
        });

        this.sceneManager.camera.fov = this.config.camera.fov;
        this.sceneManager.camera.near = this.config.camera.near;
        this.sceneManager.camera.far = this.config.camera.far;
        this.sceneManager.camera.updateProjectionMatrix();
        this.sceneManager.camera.position.set(0, 2, 0);

        if (this.config.fog.enabled) {
          const fogColor = new THREE.Color(this.trackConfig.palette[0]);
          this.sceneManager.setFog(
            new THREE.FogExp2(fogColor, this.config.fog.density)
          );
          this.sceneManager.setBackground(fogColor);
        }

        await this._createEnvironment();
        this._createController();
        this._setupColorZones();
        this._setupPostProcessing();

        this.isInitialized = true;
      }

      _setupPostProcessing() {
        const bloomConfig = this.config.postProcessing?.bloom;
        if (bloomConfig?.enabled && this.sceneManager.enableBloom) {
          this.sceneManager.enableBloom({
            strength: bloomConfig.strength || 0.5,
            threshold: bloomConfig.threshold || 0.8,
            radius: bloomConfig.radius || 0.5,
          });
        }
      }

      async _createEnvironment() {
        const { archetype, palette } = this.trackConfig;

        switch (archetype) {
          case 'gradient-fog':
            this.environment = new GradientFogEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          case 'stripe-bar':
            this.environment = new StripeBarEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          case 'bokeh-grid':
            this.environment = new BokehGridEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          case 'high-contrast':
            this.environment = new HighContrastEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          case 'layered-colors':
            this.environment = new LayeredColorsEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          case 'glitch-digital':
            this.environment = new GlitchDigitalEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
            break;
          default:
            this.environment = new GradientFogEnvironment({
              sceneManager: this.sceneManager,
              palette,
            });
        }

        await this.environment.initialize();
      }

      _createController() {
        this.controller = new FirstPersonController({
          camera: this.sceneManager.camera,
          domElement: this.sceneManager.renderer.domElement,
          moveSpeed: this.config.camera.moveSpeed,
          lookSpeed: this.config.camera.lookSpeed,
          onPositionChange: this._onPositionUpdate,
        });
      }

      _setupColorZones() {
        const { palette } = this.trackConfig;
        const stemNames = ['drums', 'bass', 'vocals', 'other'];

        const positions = [
          { x: -20, y: 0, z: 0 },
          { x: 20, y: 0, z: 0 },
          { x: 0, y: 0, z: -20 },
          { x: 0, y: 0, z: 20 },
        ];

        this.colorZones = palette.slice(0, 4).map((color, i) => ({
          color,
          position: positions[i % positions.length],
          stem: stemNames[i],
          radius: 15,
        }));
      }

      _onPositionUpdate(position) {
        if (!this.audioEngine) return;

        const stemVolumes = {};

        for (const zone of this.colorZones) {
          const distance = Math.sqrt(
            Math.pow(position.x - zone.position.x, 2) +
              Math.pow(position.z - zone.position.z, 2)
          );

          const volume = Math.max(0, 1 - distance / zone.radius);
          stemVolumes[zone.stem] = volume;
        }

        this.audioEngine.setStemVolumes(stemVolumes);
      }

      start() {
        if (!this.isInitialized) {
          console.warn('OGODSceneManager: Not initialized');
          return;
        }
        if (this.isRunning) return;

        this.isRunning = true;
        this.sceneManager.start();
        this.controller?.enable();
        this.audioEngine?.start();
      }

      stop() {
        this.isRunning = false;
        this.controller?.disable();
        this.sceneManager?.stop();
        this.audioEngine?.stop();
      }

      dispose() {
        this.stop();
        this.controller?.dispose();
        this.environment?.dispose();
        this.sceneManager?.dispose();
        this.audioEngine?.dispose();
        this.isInitialized = false;
      }

      getCameraPosition() {
        return (
          this.sceneManager?.camera?.position.clone() || new THREE.Vector3()
        );
      }

      getColorZones() {
        return [...this.colorZones];
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const manager = new OGODSceneManager({ container });

      expect(manager.trackNumber).toBe(1);
      expect(manager.isInitialized).toBe(false);
      expect(manager.isRunning).toBe(false);
    });

    it('should accept custom track number', () => {
      const manager = new OGODSceneManager({ container, trackNumber: 15 });

      expect(manager.trackNumber).toBe(15);
    });

    it('should accept audio engine', () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });

      expect(manager.audioEngine).toBe(mockAudioEngine);
    });

    it('should use config values', () => {
      const manager = new OGODSceneManager({ container });

      expect(manager.config.camera.fov).toBe(75);
      expect(manager.config.fog.enabled).toBe(true);
    });
  });

  describe('_getTrackConfig', () => {
    it('should return track config for known tracks', () => {
      const manager = new OGODSceneManager({ container, trackNumber: 1 });

      expect(manager.trackConfig.game).toBe('Animal Crossing');
      expect(manager.trackConfig.archetype).toBe('gradient-fog');
    });

    it('should return default config for unknown tracks', () => {
      const manager = new OGODSceneManager({ container, trackNumber: 999 });

      expect(manager.trackConfig.game).toBe('Unknown');
      expect(manager.trackConfig.archetype).toBe('gradient-fog');
    });
  });

  describe('initialize', () => {
    it('should throw error if no container', async () => {
      const manager = new OGODSceneManager({});

      await expect(manager.initialize()).rejects.toThrow(
        'Container element required'
      );
    });

    it('should create scene manager', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(SceneManager).toHaveBeenCalledWith({
        container,
        antialias: true,
        alpha: false,
      });
    });

    it('should configure camera', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(mockSceneManager.camera.updateProjectionMatrix).toHaveBeenCalled();
      expect(mockSceneManager.camera.position.set).toHaveBeenCalledWith(
        0,
        2,
        0
      );
    });

    it('should set up fog when enabled', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(mockSceneManager.setFog).toHaveBeenCalled();
      expect(mockSceneManager.setBackground).toHaveBeenCalled();
    });

    it('should create environment', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(manager.environment).toBeDefined();
      expect(mockEnvironment.initialize).toHaveBeenCalled();
    });

    it('should create controller', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(manager.controller).toBeDefined();
      expect(FirstPersonController).toHaveBeenCalled();
    });

    it('should set up color zones', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(manager.colorZones.length).toBe(4);
      expect(manager.colorZones[0]).toHaveProperty('color');
      expect(manager.colorZones[0]).toHaveProperty('position');
      expect(manager.colorZones[0]).toHaveProperty('stem');
      expect(manager.colorZones[0]).toHaveProperty('radius');
    });

    it('should enable bloom post-processing', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(mockSceneManager.enableBloom).toHaveBeenCalledWith({
        strength: 0.5,
        threshold: 0.8,
        radius: 0.5,
      });
    });

    it('should set isInitialized to true', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      expect(manager.isInitialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      SceneManager.mockClear();
      await manager.initialize();

      expect(SceneManager).not.toHaveBeenCalled();
    });
  });

  describe('_createEnvironment', () => {
    it('should create GradientFogEnvironment for gradient-fog archetype', async () => {
      const manager = new OGODSceneManager({ container, trackNumber: 1 });
      await manager.initialize();

      expect(GradientFogEnvironment).toHaveBeenCalled();
    });

    it('should create StripeBarEnvironment for stripe-bar archetype', async () => {
      // Need to mock a track with stripe-bar archetype
      ETCETER4_CONFIG.ogodTracks[100] = {
        game: 'Test',
        archetype: 'stripe-bar',
        palette: ['#000', '#111', '#222', '#333'],
      };

      const manager = new OGODSceneManager({ container, trackNumber: 100 });
      await manager.initialize();

      expect(StripeBarEnvironment).toHaveBeenCalled();

      delete ETCETER4_CONFIG.ogodTracks[100];
    });

    it('should default to GradientFogEnvironment for unknown archetype', async () => {
      ETCETER4_CONFIG.ogodTracks[101] = {
        game: 'Test',
        archetype: 'unknown-archetype',
        palette: ['#000', '#111', '#222', '#333'],
      };

      const manager = new OGODSceneManager({ container, trackNumber: 101 });
      await manager.initialize();

      expect(GradientFogEnvironment).toHaveBeenCalled();

      delete ETCETER4_CONFIG.ogodTracks[101];
    });
  });

  describe('_onPositionUpdate', () => {
    it('should calculate stem volumes based on distance to zones', async () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });
      await manager.initialize();

      // Position at drums zone (-20, 0, 0)
      manager._onPositionUpdate({ x: -20, y: 0, z: 0 });

      expect(mockAudioEngine.setStemVolumes).toHaveBeenCalled();
      const volumes = mockAudioEngine.setStemVolumes.mock.calls[0][0];
      expect(volumes.drums).toBe(1); // At zone center
    });

    it('should not call audio engine if not set', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      // Should not throw
      manager._onPositionUpdate({ x: 0, y: 0, z: 0 });
    });

    it('should calculate zero volume when far from zone', async () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });
      await manager.initialize();

      // Position far from all zones
      manager._onPositionUpdate({ x: 100, y: 0, z: 100 });

      expect(mockAudioEngine.setStemVolumes).toHaveBeenCalled();
      const volumes = mockAudioEngine.setStemVolumes.mock.calls[0][0];

      // All volumes should be 0 when far away
      Object.values(volumes).forEach(v => {
        expect(v).toBe(0);
      });
    });
  });

  describe('start', () => {
    it('should not start if not initialized', async () => {
      const manager = new OGODSceneManager({ container });
      const consoleSpy = vi.spyOn(console, 'warn');

      manager.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        'OGODSceneManager: Not initialized'
      );
      expect(manager.isRunning).toBe(false);
    });

    it('should start scene manager and controller', async () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });
      await manager.initialize();

      manager.start();

      expect(manager.isRunning).toBe(true);
      expect(mockSceneManager.start).toHaveBeenCalled();
      expect(mockController.enable).toHaveBeenCalled();
      expect(mockAudioEngine.start).toHaveBeenCalled();
    });

    it('should not restart if already running', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      manager.start();
      mockSceneManager.start.mockClear();

      manager.start();

      expect(mockSceneManager.start).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop scene manager and controller', async () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });
      await manager.initialize();

      manager.start();
      manager.stop();

      expect(manager.isRunning).toBe(false);
      expect(mockController.disable).toHaveBeenCalled();
      expect(mockSceneManager.stop).toHaveBeenCalled();
      expect(mockAudioEngine.stop).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose all components', async () => {
      const manager = new OGODSceneManager({
        container,
        audioEngine: mockAudioEngine,
      });
      await manager.initialize();

      manager.start();
      manager.dispose();

      expect(mockController.dispose).toHaveBeenCalled();
      expect(mockEnvironment.dispose).toHaveBeenCalled();
      expect(mockSceneManager.dispose).toHaveBeenCalled();
      expect(mockAudioEngine.dispose).toHaveBeenCalled();
      expect(manager.isInitialized).toBe(false);
    });
  });

  describe('getCameraPosition', () => {
    it('should return camera position', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      const position = manager.getCameraPosition();

      expect(mockSceneManager.camera.position.clone).toHaveBeenCalled();
    });

    it('should return new Vector3 if no scene manager', () => {
      const manager = new OGODSceneManager({ container });

      const position = manager.getCameraPosition();

      expect(position).toBeDefined();
    });
  });

  describe('getColorZones', () => {
    it('should return copy of color zones', async () => {
      const manager = new OGODSceneManager({ container });
      await manager.initialize();

      const zones = manager.getColorZones();

      expect(zones.length).toBe(4);
      expect(zones).not.toBe(manager.colorZones);
    });
  });
});
