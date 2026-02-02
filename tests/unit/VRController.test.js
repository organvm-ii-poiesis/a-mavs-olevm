/**
 * @file VRController.test.js
 * @description Unit tests for VRController WebXR VR support
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '../unit/setup.js';

// Import module by evaluating the source
const VRControllerSource = await import(
  '../../js/3d/vr/VRController.js?raw'
).then(m => m.default);
eval(VRControllerSource);

describe('VRController', () => {
  let vrController;
  let mockRenderer;
  let mockScene;
  let mockCamera;

  beforeEach(() => {
    // Create mock renderer
    mockRenderer = {
      xr: {
        enabled: false,
        setSession: vi.fn().mockResolvedValue(undefined),
        getController: vi.fn().mockReturnValue({
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          userData: {},
        }),
        getControllerGrip: vi.fn().mockReturnValue({
          add: vi.fn(),
        }),
      },
      domElement: document.createElement('canvas'),
    };

    // Create mock scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    };

    // Create mock camera
    mockCamera = new THREE.PerspectiveCamera();

    // Reset navigator.xr mock
    global.navigator.xr = {
      isSessionSupported: vi.fn().mockResolvedValue(true),
      requestSession: vi.fn().mockResolvedValue({
        requestReferenceSpace: vi.fn().mockResolvedValue({}),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      }),
    };
  });

  afterEach(() => {
    if (vrController) {
      vrController.dispose();
    }
    // Clean up any DOM elements
    const vrButtons = document.querySelectorAll('.ogod-vr-button');
    vrButtons.forEach(btn => btn.remove());

    const announcer = document.getElementById('ogod-sr-announcer');
    if (announcer) announcer.remove();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.renderer).toBe(mockRenderer);
      expect(vrController.scene).toBe(mockScene);
      expect(vrController.camera).toBe(mockCamera);
    });

    it('should initialize state flags', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.isSupported).toBe(false); // Async, not yet resolved
      expect(vrController.isSessionActive).toBe(false);
      expect(vrController.xrSession).toBeNull();
    });

    it('should default to teleport locomotion mode', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.locomotionMode).toBe('teleport');
    });

    it('should store callbacks', () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const onTeleport = vi.fn();
      const onInteract = vi.fn();

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
        onSessionStart: onStart,
        onSessionEnd: onEnd,
        onTeleport: onTeleport,
        onInteract: onInteract,
      });

      expect(vrController.onSessionStart).toBe(onStart);
      expect(vrController.onSessionEnd).toBe(onEnd);
      expect(vrController.onTeleport).toBe(onTeleport);
      expect(vrController.onInteract).toBe(onInteract);
    });

    it('should create camera rig with camera', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.cameraRig).toBeDefined();
      expect(vrController.cameraRig.add).toHaveBeenCalledWith(mockCamera);
    });

    it('should check reduced motion preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.prefersReducedMotion).toBe(true);
    });
  });

  describe('_checkVRSupport', () => {
    it('should detect WebXR support', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      // Wait for async support check
      await vi.waitFor(() => {
        expect(navigator.xr.isSessionSupported).toHaveBeenCalledWith(
          'immersive-vr'
        );
      });
    });

    it('should set isSupported true when VR is available', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });
    });

    it('should set isSupported false when VR is not available', async () => {
      navigator.xr.isSessionSupported.mockResolvedValue(false);

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(false);
      });
    });

    it('should handle missing WebXR API', async () => {
      delete global.navigator.xr;

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      // Should not throw, just log and set unsupported
      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(false);
      });

      // Restore for other tests
      global.navigator.xr = {
        isSessionSupported: vi.fn().mockResolvedValue(true),
        requestSession: vi.fn().mockResolvedValue({
          requestReferenceSpace: vi.fn().mockResolvedValue({}),
          addEventListener: vi.fn(),
          end: vi.fn().mockResolvedValue(undefined),
        }),
      };
    });
  });

  describe('_createVRButton', () => {
    it('should create VR button when supported', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.vrButton).not.toBeNull();
      });

      expect(vrController.vrButton.className).toBe('ogod-vr-button');
      expect(vrController.vrButton.getAttribute('aria-label')).toBe(
        'Enter VR mode'
      );
    });

    it('should have accessible attributes', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.vrButton).not.toBeNull();
      });

      expect(vrController.vrButton.getAttribute('role')).toBe('button');
    });
  });

  describe('showVRButton / hideVRButton', () => {
    it('should add button to document body', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      vrController.showVRButton();

      expect(document.body.contains(vrController.vrButton)).toBe(true);
    });

    it('should remove button from document body', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      vrController.showVRButton();
      vrController.hideVRButton();

      expect(document.body.contains(vrController.vrButton)).toBe(false);
    });

    it('should not show button if not supported', async () => {
      navigator.xr.isSessionSupported.mockResolvedValue(false);

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(false);
      });

      vrController.showVRButton();

      // Button should not be in body since not supported
      expect(document.body.querySelector('.ogod-vr-button')).toBeNull();
    });
  });

  describe('startVRSession', () => {
    it('should return false if not supported', async () => {
      navigator.xr.isSessionSupported.mockResolvedValue(false);

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(false);
      });

      const result = await vrController.startVRSession();

      expect(result).toBe(false);
    });

    it('should request VR session when supported', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      // Just verify it attempts to start - actual session setup is async
      const result = await vrController.startVRSession();

      expect(navigator.xr.requestSession).toHaveBeenCalled();
    });
  });

  describe('endVRSession', () => {
    it('should end active session', async () => {
      const mockSession = {
        requestReferenceSpace: vi.fn().mockResolvedValue({}),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      };
      navigator.xr.requestSession.mockResolvedValue(mockSession);

      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      await vrController.startVRSession();
      await vrController.endVRSession();

      expect(mockSession.end).toHaveBeenCalled();
    });
  });

  describe('setLocomotionMode', () => {
    it('should set locomotion mode to teleport', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      vrController.setLocomotionMode('teleport');

      expect(vrController.locomotionMode).toBe('teleport');
    });

    it('should set locomotion mode to smooth', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      vrController.setLocomotionMode('smooth');

      expect(vrController.locomotionMode).toBe('smooth');
    });
  });

  describe('isVRSupported / isVRActive', () => {
    it('should return support status', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      expect(vrController.isVRSupported()).toBe(true);
    });

    it('should return false for active status initially', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.isVRActive()).toBe(false);
    });
  });

  describe('getCameraRigPosition / setCameraRigPosition', () => {
    it('should have camera rig', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      expect(vrController.cameraRig).toBeDefined();
      expect(vrController.cameraRig.position).toBeDefined();
    });

    it('should set camera rig position', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      const newPos = new THREE.Vector3(10, 5, 20);
      vrController.setCameraRigPosition(newPos);

      expect(vrController.cameraRig.position.copy).toHaveBeenCalledWith(newPos);
    });
  });

  describe('updateTeleport', () => {
    it('should not update when not teleporting', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      vrController.isTeleporting = false;
      vrController.updateTeleport([]);

      // Should return early, no changes
      expect(vrController.teleportMarker).toBeNull();
    });

    it('should not update when session not active', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      vrController.isTeleporting = true;
      vrController.isSessionActive = false;
      vrController.updateTeleport([]);

      // Should return early
      expect(vrController.teleportMarker).toBeNull();
    });
  });

  describe('_announceToScreenReader', () => {
    it('should create live region if not exists', () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      vrController._announceToScreenReader('Test message');

      const liveRegion = document.getElementById('ogod-sr-announcer');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion.getAttribute('role')).toBe('status');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('dispose', () => {
    it('should clean up resources', async () => {
      vrController = new VRController({
        renderer: mockRenderer,
        scene: mockScene,
        camera: mockCamera,
      });

      await vi.waitFor(() => {
        expect(vrController.isSupported).toBe(true);
      });

      vrController.showVRButton();
      vrController.dispose();

      expect(vrController.controllers).toHaveLength(0);
      expect(vrController.controllerGrips).toHaveLength(0);
    });
  });
});
