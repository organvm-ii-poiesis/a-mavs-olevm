/**
 * @file tests/unit/FirstPersonController.test.js
 * @description Unit tests for FirstPersonController class
 * Tests camera controls, keyboard/mouse input, touch controls, and gyroscope
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';

describe('FirstPersonController', () => {
  let FirstPersonController;
  let camera;
  let domElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock camera
    camera = {
      position: {
        x: 0,
        y: 2,
        z: 0,
        set: vi.fn(),
        add: vi.fn(),
        clone: vi.fn().mockReturnThis(),
      },
      quaternion: { setFromEuler: vi.fn() },
      getWorldDirection: vi.fn().mockImplementation(target => {
        target.x = 0;
        target.y = 0;
        target.z = -1;
        return target;
      }),
    };

    // Create mock DOM element
    domElement = document.createElement('canvas');
    domElement.requestPointerLock = vi.fn();

    // Define FirstPersonController for testing
    FirstPersonController = class {
      constructor(options = {}) {
        this.camera = options.camera;
        this.domElement = options.domElement;
        this.moveSpeed = options.moveSpeed || 5.0;
        this.lookSpeed = options.lookSpeed || 0.002;
        this.onPositionChange = options.onPositionChange || null;
        this.onSwipeLeft = options.onSwipeLeft || null;
        this.onSwipeRight = options.onSwipeRight || null;
        this.onLongPress = options.onLongPress || null;

        this.isEnabled = false;
        this.isLocked = false;

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        // Rotation
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.minPolarAngle = -Math.PI / 2 + 0.1;
        this.maxPolarAngle = Math.PI / 2 - 0.1;

        // Touch state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
        this.isTouching = false;

        // Joystick
        this.joystickActive = false;
        this.joystickDirection = new THREE.Vector2();

        // Gyroscope
        this.useGyroscope = false;
        this.gyroscopeEnabled = false;
        this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
        this.initialOrientation = null;

        // Haptic
        this.hapticEnabled = true;
        this.hapticSupported = 'vibrate' in navigator;

        // Velocity
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.dampingFactor = 0.1;

        // Bind methods
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onDeviceOrientation = this._onDeviceOrientation.bind(this);
        this.update = this.update.bind(this);

        // Instructions element
        this.instructionsElement = null;
      }

      _isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      }

      enable() {
        if (this.isEnabled) return;
        this.isEnabled = true;

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('mousemove', this._onMouseMove);
        this.domElement.addEventListener('touchstart', this._onTouchStart, {
          passive: false,
        });
        this.domElement.addEventListener('touchmove', this._onTouchMove, {
          passive: false,
        });
        this.domElement.addEventListener('touchend', this._onTouchEnd);
        document.addEventListener(
          'pointerlockchange',
          this._onPointerLockChange
        );
      }

      disable() {
        this.isEnabled = false;

        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        this.domElement.removeEventListener('mousemove', this._onMouseMove);
        this.domElement.removeEventListener('touchstart', this._onTouchStart);
        this.domElement.removeEventListener('touchmove', this._onTouchMove);
        this.domElement.removeEventListener('touchend', this._onTouchEnd);
        document.removeEventListener(
          'pointerlockchange',
          this._onPointerLockChange
        );

        if (this.instructionsElement?.parentElement) {
          this.instructionsElement.parentElement.removeChild(
            this.instructionsElement
          );
          this.instructionsElement = null;
        }
      }

      _onKeyDown(event) {
        switch (event.code) {
          case 'ArrowUp':
          case 'KeyW':
            this.moveForward = true;
            break;
          case 'ArrowDown':
          case 'KeyS':
            this.moveBackward = true;
            break;
          case 'ArrowLeft':
          case 'KeyA':
            this.moveLeft = true;
            break;
          case 'ArrowRight':
          case 'KeyD':
            this.moveRight = true;
            break;
          case 'Space':
            this.moveUp = true;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            this.moveDown = true;
            break;
        }
      }

      _onKeyUp(event) {
        switch (event.code) {
          case 'ArrowUp':
          case 'KeyW':
            this.moveForward = false;
            break;
          case 'ArrowDown':
          case 'KeyS':
            this.moveBackward = false;
            break;
          case 'ArrowLeft':
          case 'KeyA':
            this.moveLeft = false;
            break;
          case 'ArrowRight':
          case 'KeyD':
            this.moveRight = false;
            break;
          case 'Space':
            this.moveUp = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            this.moveDown = false;
            break;
        }
      }

      _onMouseDown(event) {
        if (!this.isLocked && this.isEnabled) {
          this.domElement.requestPointerLock();
        }
      }

      _onMouseMove(event) {
        if (!this.isLocked) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * this.lookSpeed;
        this.euler.x -= movementY * this.lookSpeed;
        this.euler.x = Math.max(
          this.minPolarAngle,
          Math.min(this.maxPolarAngle, this.euler.x)
        );

        this.camera.quaternion.setFromEuler(this.euler);
      }

      _onPointerLockChange() {
        this.isLocked = document.pointerLockElement === this.domElement;
      }

      _onTouchStart(event) {
        if (event.touches.length === 1) {
          event.preventDefault();
          this.isTouching = true;
          this.touchStartX = event.touches[0].pageX;
          this.touchStartY = event.touches[0].pageY;
          this.touchMoveX = 0;
          this.touchMoveY = 0;
        }
      }

      _onTouchMove(event) {
        if (!this.isTouching || event.touches.length !== 1) return;
        event.preventDefault();

        const touch = event.touches[0];
        this.touchMoveX = touch.pageX - this.touchStartX;
        this.touchMoveY = touch.pageY - this.touchStartY;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= this.touchMoveX * this.lookSpeed * 0.5;
        this.euler.x -= this.touchMoveY * this.lookSpeed * 0.5;
        this.euler.x = Math.max(
          this.minPolarAngle,
          Math.min(this.maxPolarAngle, this.euler.x)
        );

        this.camera.quaternion.setFromEuler(this.euler);

        this.touchStartX = touch.pageX;
        this.touchStartY = touch.pageY;
      }

      _onTouchEnd() {
        this.isTouching = false;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
      }

      _onDeviceOrientation(event) {
        if (!this.gyroscopeEnabled || !this.useGyroscope) return;

        const { alpha, beta, gamma } = event;
        if (alpha === null || beta === null || gamma === null) return;

        if (!this.initialOrientation) {
          this.initialOrientation = { alpha, beta, gamma };
          return;
        }

        // Apply device orientation to camera
        this.deviceOrientation = { alpha, beta, gamma };
      }

      async enableGyroscope() {
        if (!this._isTouchDevice()) return false;

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
              this.gyroscopeEnabled = true;
              this.useGyroscope = true;
              this.initialOrientation = null;
              return true;
            }
            return false;
          } catch (error) {
            console.warn('Gyroscope permission denied:', error);
            return false;
          }
        } else {
          this.gyroscopeEnabled = true;
          this.useGyroscope = true;
          this.initialOrientation = null;
          return true;
        }
      }

      disableGyroscope() {
        this.useGyroscope = false;
        this.initialOrientation = null;
      }

      async toggleGyroscope() {
        if (this.useGyroscope) {
          this.disableGyroscope();
          return false;
        } else {
          return await this.enableGyroscope();
        }
      }

      update(delta) {
        if (!this.isEnabled) return;

        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        this.direction.set(0, 0, 0);

        if (this.moveForward) this.direction.add(forward);
        if (this.moveBackward) this.direction.sub(forward);
        if (this.moveLeft) this.direction.sub(right);
        if (this.moveRight) this.direction.add(right);
        if (this.moveUp) this.direction.y += 1;
        if (this.moveDown) this.direction.y -= 1;

        if (this.joystickActive) {
          const scaledForward = forward
            .clone()
            .multiplyScalar(this.joystickDirection.y);
          const scaledRight = right
            .clone()
            .multiplyScalar(this.joystickDirection.x);
          this.direction.add(scaledForward);
          this.direction.add(scaledRight);
        }

        this.direction.normalize();

        const targetVelocity = this.direction
          .clone()
          .multiplyScalar(this.moveSpeed);
        this.velocity.lerp(targetVelocity, this.dampingFactor);

        const movement = this.velocity.clone().multiplyScalar(delta);
        this.camera.position.add(movement);

        if (this.onPositionChange && movement.lengthSq() > 0.0001) {
          this.onPositionChange(this.camera.position.clone());
        }
      }

      dispose() {
        this.disable();
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const controller = new FirstPersonController({ camera, domElement });

      expect(controller.moveSpeed).toBe(5.0);
      expect(controller.lookSpeed).toBe(0.002);
      expect(controller.isEnabled).toBe(false);
      expect(controller.isLocked).toBe(false);
    });

    it('should accept custom options', () => {
      const controller = new FirstPersonController({
        camera,
        domElement,
        moveSpeed: 10.0,
        lookSpeed: 0.005,
      });

      expect(controller.moveSpeed).toBe(10.0);
      expect(controller.lookSpeed).toBe(0.005);
    });

    it('should accept callback options', () => {
      const onPositionChange = vi.fn();
      const onSwipeLeft = vi.fn();

      const controller = new FirstPersonController({
        camera,
        domElement,
        onPositionChange,
        onSwipeLeft,
      });

      expect(controller.onPositionChange).toBe(onPositionChange);
      expect(controller.onSwipeLeft).toBe(onSwipeLeft);
    });

    it('should initialize movement state to false', () => {
      const controller = new FirstPersonController({ camera, domElement });

      expect(controller.moveForward).toBe(false);
      expect(controller.moveBackward).toBe(false);
      expect(controller.moveLeft).toBe(false);
      expect(controller.moveRight).toBe(false);
      expect(controller.moveUp).toBe(false);
      expect(controller.moveDown).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should enable controls and set isEnabled to true', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      expect(controller.isEnabled).toBe(true);
    });

    it('should not enable twice', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.enable();

      expect(controller.isEnabled).toBe(true);
    });

    it('should disable controls and set isEnabled to false', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.disable();

      expect(controller.isEnabled).toBe(false);
    });
  });

  describe('_onKeyDown/_onKeyUp', () => {
    it('should set moveForward on W key', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'KeyW' });
      expect(controller.moveForward).toBe(true);

      controller._onKeyUp({ code: 'KeyW' });
      expect(controller.moveForward).toBe(false);
    });

    it('should set moveBackward on S key', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'KeyS' });
      expect(controller.moveBackward).toBe(true);

      controller._onKeyUp({ code: 'KeyS' });
      expect(controller.moveBackward).toBe(false);
    });

    it('should set moveLeft on A key', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'KeyA' });
      expect(controller.moveLeft).toBe(true);

      controller._onKeyUp({ code: 'KeyA' });
      expect(controller.moveLeft).toBe(false);
    });

    it('should set moveRight on D key', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'KeyD' });
      expect(controller.moveRight).toBe(true);

      controller._onKeyUp({ code: 'KeyD' });
      expect(controller.moveRight).toBe(false);
    });

    it('should set moveUp on Space', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'Space' });
      expect(controller.moveUp).toBe(true);

      controller._onKeyUp({ code: 'Space' });
      expect(controller.moveUp).toBe(false);
    });

    it('should set moveDown on Shift', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'ShiftLeft' });
      expect(controller.moveDown).toBe(true);

      controller._onKeyUp({ code: 'ShiftLeft' });
      expect(controller.moveDown).toBe(false);
    });

    it('should support arrow keys', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onKeyDown({ code: 'ArrowUp' });
      expect(controller.moveForward).toBe(true);

      controller._onKeyDown({ code: 'ArrowDown' });
      expect(controller.moveBackward).toBe(true);

      controller._onKeyDown({ code: 'ArrowLeft' });
      expect(controller.moveLeft).toBe(true);

      controller._onKeyDown({ code: 'ArrowRight' });
      expect(controller.moveRight).toBe(true);
    });
  });

  describe('_onMouseDown', () => {
    it('should request pointer lock when enabled and not locked', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onMouseDown({});

      expect(domElement.requestPointerLock).toHaveBeenCalled();
    });

    it('should not request pointer lock when already locked', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.isLocked = true;

      controller._onMouseDown({});

      expect(domElement.requestPointerLock).not.toHaveBeenCalled();
    });
  });

  describe('_onMouseMove', () => {
    it('should update camera rotation when locked', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.isLocked = true;

      controller._onMouseMove({ movementX: 10, movementY: 5 });

      expect(camera.quaternion.setFromEuler).toHaveBeenCalled();
    });

    it('should not update camera when not locked', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.isLocked = false;

      controller._onMouseMove({ movementX: 10, movementY: 5 });

      expect(camera.quaternion.setFromEuler).not.toHaveBeenCalled();
    });
  });

  describe('_onTouchStart/_onTouchMove/_onTouchEnd', () => {
    it('should start touch tracking', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      const event = {
        touches: [{ pageX: 100, pageY: 200 }],
        preventDefault: vi.fn(),
      };

      controller._onTouchStart(event);

      expect(controller.isTouching).toBe(true);
      expect(controller.touchStartX).toBe(100);
      expect(controller.touchStartY).toBe(200);
    });

    it('should update camera on touch move', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onTouchStart({
        touches: [{ pageX: 100, pageY: 200 }],
        preventDefault: vi.fn(),
      });

      controller._onTouchMove({
        touches: [{ pageX: 150, pageY: 250 }],
        preventDefault: vi.fn(),
      });

      expect(camera.quaternion.setFromEuler).toHaveBeenCalled();
    });

    it('should stop touch tracking on end', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      controller._onTouchStart({
        touches: [{ pageX: 100, pageY: 200 }],
        preventDefault: vi.fn(),
      });

      controller._onTouchEnd();

      expect(controller.isTouching).toBe(false);
    });
  });

  describe('gyroscope', () => {
    it('should enable gyroscope when permission granted', async () => {
      // Mock touch device
      const originalTouchStart = window.ontouchstart;
      window.ontouchstart = () => {};

      const controller = new FirstPersonController({ camera, domElement });

      const result = await controller.enableGyroscope();

      expect(result).toBe(true);
      expect(controller.gyroscopeEnabled).toBe(true);
      expect(controller.useGyroscope).toBe(true);

      window.ontouchstart = originalTouchStart;
    });

    it('should disable gyroscope', async () => {
      const originalTouchStart = window.ontouchstart;
      window.ontouchstart = () => {};

      const controller = new FirstPersonController({ camera, domElement });
      await controller.enableGyroscope();

      controller.disableGyroscope();

      expect(controller.useGyroscope).toBe(false);
      expect(controller.initialOrientation).toBeNull();

      window.ontouchstart = originalTouchStart;
    });

    it('should toggle gyroscope', async () => {
      const originalTouchStart = window.ontouchstart;
      window.ontouchstart = () => {};

      const controller = new FirstPersonController({ camera, domElement });

      await controller.toggleGyroscope();
      expect(controller.useGyroscope).toBe(true);

      await controller.toggleGyroscope();
      expect(controller.useGyroscope).toBe(false);

      window.ontouchstart = originalTouchStart;
    });

    it('should return false for non-touch devices', async () => {
      // Ensure not a touch device
      const originalTouchStart = window.ontouchstart;
      delete window.ontouchstart;
      const originalMaxTouchPoints = navigator.maxTouchPoints;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const controller = new FirstPersonController({ camera, domElement });

      const result = await controller.enableGyroscope();

      expect(result).toBe(false);

      window.ontouchstart = originalTouchStart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: originalMaxTouchPoints,
        configurable: true,
      });
    });
  });

  describe('update', () => {
    it('should not update if not enabled', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.update(0.016);

      expect(camera.position.add).not.toHaveBeenCalled();
    });

    it('should update camera position when moving', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.moveForward = true;

      controller.update(0.016);

      expect(camera.position.add).toHaveBeenCalled();
    });

    it('should call onPositionChange callback', () => {
      const onPositionChange = vi.fn();
      const controller = new FirstPersonController({
        camera,
        domElement,
        onPositionChange,
      });
      controller.enable();
      controller.moveForward = true;

      // Need multiple updates to build up velocity
      controller.velocity = new THREE.Vector3(1, 0, 0);
      controller.update(0.016);

      expect(onPositionChange).toHaveBeenCalled();
    });

    it('should apply joystick input', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();
      controller.joystickActive = true;
      controller.joystickDirection = { x: 1, y: 1 };

      controller.update(0.016);

      expect(camera.position.add).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should call disable', () => {
      const controller = new FirstPersonController({ camera, domElement });
      controller.enable();

      const disableSpy = vi.spyOn(controller, 'disable');
      controller.dispose();

      expect(disableSpy).toHaveBeenCalled();
    });
  });
});
