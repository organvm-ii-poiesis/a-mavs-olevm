/**
 * @file FirstPersonController.js
 * @description First-person camera controls for OGOD 3D environments
 * Supports keyboard, mouse, touch, and device orientation
 */

'use strict';

/**
 * FirstPersonController - First-person camera navigation
 * @class
 */
class FirstPersonController {
  /**
   * @param {Object} options - Configuration options
   * @param {THREE.Camera} options.camera - Camera to control
   * @param {HTMLElement} options.domElement - DOM element for input events
   * @param {number} [options.moveSpeed=5.0] - Movement speed
   * @param {number} [options.lookSpeed=0.002] - Look sensitivity
   * @param {Function} [options.onPositionChange] - Callback when position changes
   */
  constructor(options = {}) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.moveSpeed = options.moveSpeed || 5.0;
    this.lookSpeed = options.lookSpeed || 0.002;
    this.onPositionChange = options.onPositionChange || null;

    // State
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
    this.minPolarAngle = -Math.PI / 2 + 0.1; // Looking down limit
    this.maxPolarAngle = Math.PI / 2 - 0.1; // Looking up limit

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isTouching = false;

    // Velocity for smooth movement
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.dampingFactor = 0.1;

    // Gyroscope/device orientation state
    this.useGyroscope = false;
    this.gyroscopeEnabled = false;
    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.initialOrientation = null;
    this.gyroscopeSensitivity = 0.5;

    // Mobile joystick state
    this.joystickActive = false;
    this.joystickDirection = new THREE.Vector2();

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

    // Create mobile controls if on touch device
    if (this._isTouchDevice()) {
      this._createMobileControls();
    }
  }

  /**
   * Check if device supports touch
   * @private
   * @returns {boolean}
   */
  _isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Create mobile control overlays
   * @private
   */
  _createMobileControls() {
    // Create virtual joystick for movement
    this.joystickContainer = document.createElement('div');
    this.joystickContainer.className = 'ogod-joystick-container';
    this.joystickContainer.style.cssText = `
      position: fixed;
      left: 30px;
      bottom: 100px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
      touch-action: none;
      z-index: 1000;
    `;

    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'ogod-joystick-knob';
    this.joystickKnob.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: 50px;
      height: 50px;
      margin: -25px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      pointer-events: none;
    `;

    this.joystickContainer.appendChild(this.joystickKnob);

    // Joystick events
    this.joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.joystickActive = true;
    });

    this.joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.joystickActive) {
        return;
      }

      const rect = this.joystickContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const touch = e.touches[0];
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;

      // Clamp to circle
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = rect.width / 2 - 25;

      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      // Update knob position
      this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

      // Update direction
      this.joystickDirection.set(dx / maxDistance, -dy / maxDistance);
    });

    this.joystickContainer.addEventListener('touchend', () => {
      this.joystickActive = false;
      this.joystickDirection.set(0, 0);
      this.joystickKnob.style.transform = 'translate(0, 0)';
    });

    // Create gyroscope toggle button
    this.gyroButton = document.createElement('button');
    this.gyroButton.className = 'ogod-gyro-button';
    this.gyroButton.innerHTML = '&#x1F3AE;'; // Gamepad emoji as icon
    this.gyroButton.setAttribute('aria-label', 'Toggle gyroscope controls');
    this.gyroButton.style.cssText = `
      position: fixed;
      right: 30px;
      bottom: 100px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s;
    `;

    this.gyroButton.addEventListener('click', async () => {
      const enabled = await this.toggleGyroscope();
      this.gyroButton.style.background = enabled
        ? 'rgba(0, 255, 255, 0.4)'
        : 'rgba(255, 255, 255, 0.2)';
      this.gyroButton.style.borderColor = enabled
        ? 'rgba(0, 255, 255, 0.8)'
        : 'rgba(255, 255, 255, 0.4)';
    });
  }

  /**
   * Enable controls
   */
  enable() {
    if (this.isEnabled) {
      return;
    }
    this.isEnabled = true;

    // Keyboard events
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

    // Mouse events
    this.domElement.addEventListener('mousedown', this._onMouseDown);
    this.domElement.addEventListener('mousemove', this._onMouseMove);

    // Touch events
    this.domElement.addEventListener('touchstart', this._onTouchStart, {
      passive: false,
    });
    this.domElement.addEventListener('touchmove', this._onTouchMove, {
      passive: false,
    });
    this.domElement.addEventListener('touchend', this._onTouchEnd);

    // Pointer lock
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    // Device orientation for mobile
    if (this._isTouchDevice()) {
      window.addEventListener('deviceorientation', this._onDeviceOrientation);
      if (this.joystickContainer) {
        document.body.appendChild(this.joystickContainer);
      }
      if (this.gyroButton) {
        document.body.appendChild(this.gyroButton);
      }
    }

    // Show instructions
    this._showInstructions();
  }

  /**
   * Disable controls
   */
  disable() {
    this.isEnabled = false;

    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this.domElement.removeEventListener('mousedown', this._onMouseDown);
    this.domElement.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('touchstart', this._onTouchStart);
    this.domElement.removeEventListener('touchmove', this._onTouchMove);
    this.domElement.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    window.removeEventListener('deviceorientation', this._onDeviceOrientation);

    if (this.joystickContainer?.parentElement) {
      this.joystickContainer.parentElement.removeChild(this.joystickContainer);
    }
    if (this.gyroButton?.parentElement) {
      this.gyroButton.parentElement.removeChild(this.gyroButton);
    }

    this._hideInstructions();
  }

  /**
   * Show control instructions
   * @private
   */
  _showInstructions() {
    if (this.instructionsElement) {
      return;
    }

    this.instructionsElement = document.createElement('div');
    this.instructionsElement.className = 'ogod-instructions';
    this.instructionsElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-family: sans-serif;
      font-size: 14px;
      border-radius: 8px;
      z-index: 1000;
      text-align: center;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.5s;
    `;

    if (this._isTouchDevice()) {
      this.instructionsElement.innerHTML = `
        <p style="margin: 0 0 5px;">Drag to look around</p>
        <p style="margin: 0 0 5px;">Use joystick to move</p>
        <p style="margin: 0; opacity: 0.7;">Tap 🎮 for gyroscope</p>
      `;
    } else {
      this.instructionsElement.innerHTML = `
        <p style="margin: 0 0 5px;">Click to enable controls</p>
        <p style="margin: 0;">WASD to move | Mouse to look</p>
      `;
    }

    document.body.appendChild(this.instructionsElement);

    // Fade out after 5 seconds
    setTimeout(() => {
      if (this.instructionsElement) {
        this.instructionsElement.style.opacity = '0';
        setTimeout(() => {
          this._hideInstructions();
        }, 500);
      }
    }, 5000);
  }

  /**
   * Hide instructions
   * @private
   */
  _hideInstructions() {
    if (this.instructionsElement?.parentElement) {
      this.instructionsElement.parentElement.removeChild(this.instructionsElement);
      this.instructionsElement = null;
    }
  }

  /**
   * Handle keydown
   * @private
   * @param {KeyboardEvent} event
   */
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

  /**
   * Handle keyup
   * @private
   * @param {KeyboardEvent} event
   */
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

  /**
   * Handle mouse down - request pointer lock
   * @private
   * @param {MouseEvent} event
   */
  _onMouseDown(event) {
    if (!this.isLocked && this.isEnabled) {
      this.domElement.requestPointerLock();
    }
  }

  /**
   * Handle mouse move
   * @private
   * @param {MouseEvent} event
   */
  _onMouseMove(event) {
    if (!this.isLocked) {
      return;
    }

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * this.lookSpeed;
    this.euler.x -= movementY * this.lookSpeed;

    // Clamp vertical rotation
    this.euler.x = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.euler.x)
    );

    this.camera.quaternion.setFromEuler(this.euler);
  }

  /**
   * Handle pointer lock change
   * @private
   */
  _onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  /**
   * Handle touch start
   * @private
   * @param {TouchEvent} event
   */
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

  /**
   * Handle touch move
   * @private
   * @param {TouchEvent} event
   */
  _onTouchMove(event) {
    if (!this.isTouching || event.touches.length !== 1) {
      return;
    }
    event.preventDefault();

    const touch = event.touches[0];
    this.touchMoveX = touch.pageX - this.touchStartX;
    this.touchMoveY = touch.pageY - this.touchStartY;

    // Update rotation
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= this.touchMoveX * this.lookSpeed * 0.5;
    this.euler.x -= this.touchMoveY * this.lookSpeed * 0.5;

    // Clamp
    this.euler.x = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.euler.x)
    );

    this.camera.quaternion.setFromEuler(this.euler);

    // Reset for continuous movement
    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;
  }

  /**
   * Handle touch end
   * @private
   */
  _onTouchEnd() {
    this.isTouching = false;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
  }

  /**
   * Handle device orientation (gyroscope)
   * @private
   * @param {DeviceOrientationEvent} event
   */
  _onDeviceOrientation(event) {
    if (!this.gyroscopeEnabled || !this.useGyroscope) {
      return;
    }

    const { alpha, beta, gamma } = event;

    // Ignore if no data
    if (alpha === null || beta === null || gamma === null) {
      return;
    }

    // Store initial orientation on first reading
    if (!this.initialOrientation) {
      this.initialOrientation = { alpha, beta, gamma };
      return;
    }

    // Calculate relative orientation from initial position
    const deltaAlpha = alpha - this.initialOrientation.alpha;
    const deltaBeta = beta - this.initialOrientation.beta;
    // Note: deltaGamma could be used for roll/tilt in landscape orientation

    // Convert to radians and apply sensitivity
    const yaw = THREE.MathUtils.degToRad(deltaAlpha) * this.gyroscopeSensitivity;
    const pitch = THREE.MathUtils.degToRad(deltaBeta - 90) * this.gyroscopeSensitivity;

    // Apply rotation - blend with current euler
    this.euler.setFromQuaternion(this.camera.quaternion);

    // Apply yaw (horizontal rotation) - use gamma for landscape orientation
    this.euler.y = -yaw;

    // Apply pitch (vertical rotation) with clamping
    this.euler.x = THREE.MathUtils.clamp(
      -pitch,
      this.minPolarAngle,
      this.maxPolarAngle
    );

    this.camera.quaternion.setFromEuler(this.euler);
  }

  /**
   * Enable gyroscope controls (requires user gesture)
   * @returns {Promise<boolean>} - Whether gyroscope was enabled
   */
  async enableGyroscope() {
    if (!this._isTouchDevice()) {
      return false;
    }

    // Check if DeviceOrientationEvent requires permission (iOS 13+)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.gyroscopeEnabled = true;
          this.useGyroscope = true;
          this.initialOrientation = null; // Reset initial orientation
          return true;
        }
        return false;
      } catch (error) {
        console.warn('Gyroscope permission denied:', error);
        return false;
      }
    } else {
      // Android and older iOS don't require permission
      this.gyroscopeEnabled = true;
      this.useGyroscope = true;
      this.initialOrientation = null;
      return true;
    }
  }

  /**
   * Disable gyroscope controls
   */
  disableGyroscope() {
    this.useGyroscope = false;
    this.initialOrientation = null;
  }

  /**
   * Toggle gyroscope controls
   * @returns {Promise<boolean>} - Whether gyroscope is now enabled
   */
  async toggleGyroscope() {
    if (this.useGyroscope) {
      this.disableGyroscope();
      return false;
    } else {
      return await this.enableGyroscope();
    }
  }

  /**
   * Update controller state - call each frame
   * @param {number} delta - Time since last frame
   */
  update(delta) {
    if (!this.isEnabled) {
      return;
    }

    // Get camera direction vectors
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    // Calculate movement from keyboard
    this.direction.set(0, 0, 0);

    if (this.moveForward) {
      this.direction.add(forward);
    }
    if (this.moveBackward) {
      this.direction.sub(forward);
    }
    if (this.moveLeft) {
      this.direction.sub(right);
    }
    if (this.moveRight) {
      this.direction.add(right);
    }
    if (this.moveUp) {
      this.direction.y += 1;
    }
    if (this.moveDown) {
      this.direction.y -= 1;
    }

    // Add joystick input for mobile
    if (this.joystickActive) {
      this.direction.add(forward.multiplyScalar(this.joystickDirection.y));
      this.direction.add(right.multiplyScalar(this.joystickDirection.x));
    }

    this.direction.normalize();

    // Apply velocity with damping
    const targetVelocity = this.direction.multiplyScalar(this.moveSpeed);
    this.velocity.lerp(targetVelocity, this.dampingFactor);

    // Update position
    const movement = this.velocity.clone().multiplyScalar(delta);
    this.camera.position.add(movement);

    // Notify position change
    if (this.onPositionChange && movement.lengthSq() > 0.0001) {
      this.onPositionChange(this.camera.position.clone());
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.disable();
  }
}

// Export for global scope
window.FirstPersonController = FirstPersonController;
