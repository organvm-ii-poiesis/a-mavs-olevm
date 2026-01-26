/**
 * @file FirstPersonController.js
 * @description First-person camera controls for OGOD 3D environments
 * Supports keyboard, mouse, touch, device orientation, and gamepad
 *
 * GESTURE MAPPINGS:
 * - Single finger drag: Look around (rotate camera)
 * - Pinch: Zoom (adjust FOV) - two fingers moving apart/together
 * - Two-finger rotate: Camera orbit - two fingers rotating
 * - Swipe (quick flick): Menu navigation (left/right for prev/next track)
 * - Long-press: Context menu (show track info)
 * - Joystick (left side): Movement control
 *
 * GAMEPAD MAPPINGS (Xbox/PlayStation):
 * - Left stick: Movement (forward/back/strafe)
 * - Right stick: Camera look
 * - Left trigger: Slow walk
 * - Right trigger: Speed boost
 * - A/X button: Jump/move up
 * - B/Circle: Move down
 * - Start/Options: Toggle menu
 * - Select/Share: Show track info
 *
 * HAPTIC FEEDBACK:
 * - Short pulse on track change
 * - Subtle vibration on beat detection
 * - Medium vibration on environment interaction
 *
 * KEYBOARD CUSTOMIZATION:
 * - All keys can be rebound via setKeyBinding()
 * - Bindings stored in localStorage
 * - Supports QWERTY, AZERTY, and custom layouts
 */

'use strict';

/**
 * Default keyboard bindings
 * @constant
 */
const DEFAULT_KEY_BINDINGS = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  moveUp: ['Space'],
  moveDown: ['ShiftLeft', 'ShiftRight'],
  menu: ['Escape'],
  interact: ['KeyE', 'Enter'],
};

/**
 * AZERTY keyboard layout preset
 * @constant
 */
const AZERTY_KEY_BINDINGS = {
  moveForward: ['KeyZ', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyQ', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  moveUp: ['Space'],
  moveDown: ['ShiftLeft', 'ShiftRight'],
  menu: ['Escape'],
  interact: ['KeyE', 'Enter'],
};

/**
 * Gamepad button mappings (standard gamepad layout)
 * @constant
 */
const GAMEPAD_BUTTON_MAP = {
  A: 0, // Xbox A / PlayStation X
  B: 1, // Xbox B / PlayStation Circle
  X: 2, // Xbox X / PlayStation Square
  Y: 3, // Xbox Y / PlayStation Triangle
  LB: 4, // Left bumper
  RB: 5, // Right bumper
  LT: 6, // Left trigger
  RT: 7, // Right trigger
  SELECT: 8, // Back / Share
  START: 9, // Start / Options
  L3: 10, // Left stick press
  R3: 11, // Right stick press
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
};

/**
 * Key binding storage key for localStorage
 * @constant
 */
const KEY_BINDINGS_STORAGE_KEY = 'ogod_key_bindings';

// Export constants to global scope
window.DEFAULT_KEY_BINDINGS = DEFAULT_KEY_BINDINGS;
window.AZERTY_KEY_BINDINGS = AZERTY_KEY_BINDINGS;
window.GAMEPAD_BUTTON_MAP = GAMEPAD_BUTTON_MAP;

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
   * @param {Function} [options.onSwipeLeft] - Callback for left swipe gesture
   * @param {Function} [options.onSwipeRight] - Callback for right swipe gesture
   * @param {Function} [options.onLongPress] - Callback for long-press gesture
   * @param {Function} [options.onMenuToggle] - Callback for menu toggle (gamepad Start)
   * @param {Function} [options.onInteract] - Callback for interact action
   */
  constructor(options = {}) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.moveSpeed = options.moveSpeed || 5.0;
    this.lookSpeed = options.lookSpeed || 0.002;
    this.onPositionChange = options.onPositionChange || null;
    this.onSwipeLeft = options.onSwipeLeft || null;
    this.onSwipeRight = options.onSwipeRight || null;
    this.onLongPress = options.onLongPress || null;
    this.onMenuToggle = options.onMenuToggle || null;
    this.onInteract = options.onInteract || null;

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

    // Speed modifiers (for gamepad triggers)
    this.speedMultiplier = 1.0;
    this.baseSpeed = this.moveSpeed;

    // Rotation
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.minPolarAngle = -Math.PI / 2 + 0.1; // Looking down limit
    this.maxPolarAngle = Math.PI / 2 - 0.1; // Looking up limit

    // Touch state (single finger)
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isTouching = false;
    this.touchStartTime = 0;

    // Multi-touch state for gesture detection
    this.activeTouches = new Map(); // Track all active touches
    this.gestureType = null; // 'pinch', 'rotate', 'drag', or null
    this.initialPinchDistance = 0;
    this.initialPinchAngle = 0;
    this.initialFOV = 75;
    this.minFOV = 30;
    this.maxFOV = 120;

    // Swipe detection
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.swipeStartTime = 0;
    this.swipeThreshold = 100; // Minimum distance for swipe
    this.swipeMaxTime = 300; // Maximum time in ms for swipe

    // Long-press detection
    this.longPressTimer = null;
    this.longPressDuration = 500; // Time in ms to trigger long-press
    this.longPressTriggered = false;

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

    // Haptic feedback settings
    this.hapticEnabled = true;
    this.hapticSupported = 'vibrate' in navigator;

    // Reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Gamepad state
    this.gamepadIndex = null;
    this.gamepadConnected = false;
    this.gamepadDeadzone = 0.15;
    this.gamepadLookSensitivity = 2.0;
    this.lastGamepadButtons = {};
    this.gamepadPromptElement = null;
    this.gamepadMoveX = 0;
    this.gamepadMoveY = 0;
    this.gamepadVibrationActuator = null;

    // Keyboard customization
    this.keyBindings = this._loadKeyBindings();
    this.keyBindingMode = false; // True when waiting for key input to rebind
    this.pendingBindingAction = null;
    this.onKeyBindingComplete = null;

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
    this._onGamepadConnected = this._onGamepadConnected.bind(this);
    this._onGamepadDisconnected = this._onGamepadDisconnected.bind(this);
    this._onOrientationChange = this._onOrientationChange.bind(this);
    this.update = this.update.bind(this);

    // Listen for reduced motion preference changes
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', e => {
        this.prefersReducedMotion = e.matches;
      });

    // Listen for gamepad events
    window.addEventListener('gamepadconnected', this._onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);

    // Create mobile controls if on touch device
    if (this._isTouchDevice()) {
      this._createMobileControls();
    }

    // Check for already connected gamepads
    this._checkExistingGamepads();
  }

  // ==================== KEYBOARD CUSTOMIZATION ====================

  /**
   * Load key bindings from localStorage or use defaults
   * @private
   * @returns {Object}
   */
  _loadKeyBindings() {
    try {
      const stored = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults in case new actions were added
        return { ...DEFAULT_KEY_BINDINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load key bindings from localStorage:', e);
    }
    return { ...DEFAULT_KEY_BINDINGS };
  }

  /**
   * Save key bindings to localStorage
   * @private
   */
  _saveKeyBindings() {
    try {
      localStorage.setItem(
        KEY_BINDINGS_STORAGE_KEY,
        JSON.stringify(this.keyBindings)
      );
    } catch (e) {
      console.warn('Failed to save key bindings to localStorage:', e);
    }
  }

  /**
   * Get current key bindings
   * @returns {Object}
   */
  getKeyBindings() {
    return { ...this.keyBindings };
  }

  /**
   * Set a specific key binding
   * @param {string} action - The action to bind (e.g., 'moveForward')
   * @param {string[]} keys - Array of key codes (e.g., ['KeyW', 'ArrowUp'])
   */
  setKeyBinding(action, keys) {
    if (DEFAULT_KEY_BINDINGS[action] !== undefined) {
      this.keyBindings[action] = Array.isArray(keys) ? keys : [keys];
      this._saveKeyBindings();
    } else {
      console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Start key binding mode - next key press will be bound to the action
   * @param {string} action - The action to rebind
   * @param {Function} [callback] - Called when binding is complete
   */
  startKeyBindingMode(action, callback) {
    if (DEFAULT_KEY_BINDINGS[action] === undefined) {
      console.warn(`Unknown action: ${action}`);
      return;
    }
    this.keyBindingMode = true;
    this.pendingBindingAction = action;
    this.onKeyBindingComplete = callback;
    this._announceToScreenReader(`Press a key to bind to ${action}`);
  }

  /**
   * Cancel key binding mode
   */
  cancelKeyBindingMode() {
    this.keyBindingMode = false;
    this.pendingBindingAction = null;
    this.onKeyBindingComplete = null;
  }

  /**
   * Apply a keyboard layout preset
   * @param {string} layout - 'qwerty', 'azerty', or 'default'
   */
  applyKeyboardLayout(layout) {
    switch (layout.toLowerCase()) {
      case 'azerty':
        this.keyBindings = { ...AZERTY_KEY_BINDINGS };
        break;
      case 'qwerty':
      case 'default':
      default:
        this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
        break;
    }
    this._saveKeyBindings();
    this._announceToScreenReader(`Keyboard layout changed to ${layout}`);
  }

  /**
   * Reset all key bindings to defaults
   */
  resetKeyBindings() {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
    this._saveKeyBindings();
    this._announceToScreenReader('Key bindings reset to defaults');
  }

  /**
   * Check if a key code matches an action
   * @private
   * @param {string} keyCode - The key code to check
   * @param {string} action - The action to check against
   * @returns {boolean}
   */
  _isKeyForAction(keyCode, action) {
    const keys = this.keyBindings[action];
    return keys && keys.includes(keyCode);
  }

  // ==================== GAMEPAD SUPPORT ====================

  /**
   * Check for already connected gamepads
   * @private
   */
  _checkExistingGamepads() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this._onGamepadConnected({ gamepad: gamepads[i] });
        break;
      }
    }
  }

  /**
   * Handle gamepad connected
   * @private
   * @param {GamepadEvent} event
   */
  _onGamepadConnected(event) {
    console.log('Gamepad connected:', event.gamepad.id);
    this.gamepadIndex = event.gamepad.index;
    this.gamepadConnected = true;

    // Show gamepad prompt
    this._showGamepadPrompt();

    // Announce to screen readers
    this._announceToScreenReader('Gamepad connected: ' + event.gamepad.id);
  }

  /**
   * Handle gamepad disconnected
   * @private
   * @param {GamepadEvent} event
   */
  _onGamepadDisconnected(event) {
    console.log('Gamepad disconnected:', event.gamepad.id);
    if (event.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null;
      this.gamepadConnected = false;
      this._hideGamepadPrompt();

      // Announce to screen readers
      this._announceToScreenReader('Gamepad disconnected');
    }
  }

  /**
   * Show gamepad button prompt UI
   * @private
   */
  _showGamepadPrompt() {
    if (this.gamepadPromptElement) {
      return;
    }

    this.gamepadPromptElement = document.createElement('div');
    this.gamepadPromptElement.className = 'ogod-gamepad-prompt';
    this.gamepadPromptElement.setAttribute('role', 'status');
    this.gamepadPromptElement.setAttribute('aria-live', 'polite');
    this.gamepadPromptElement.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: sans-serif;
      font-size: 14px;
      border-radius: 8px;
      z-index: 1001;
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    this.gamepadPromptElement.innerHTML = `
      <span style="font-size: 20px;" aria-hidden="true">&#x1F3AE;</span>
      <span>Gamepad connected! Use sticks to navigate.</span>
    `;

    document.body.appendChild(this.gamepadPromptElement);

    // Fade in
    requestAnimationFrame(() => {
      if (this.gamepadPromptElement) {
        this.gamepadPromptElement.style.opacity = '1';
      }
    });

    // Fade out after 4 seconds
    setTimeout(() => {
      if (this.gamepadPromptElement) {
        this.gamepadPromptElement.style.opacity = '0';
        setTimeout(() => {
          this._hideGamepadPrompt();
        }, 300);
      }
    }, 4000);
  }

  /**
   * Hide gamepad button prompt UI
   * @private
   */
  _hideGamepadPrompt() {
    if (this.gamepadPromptElement?.parentElement) {
      this.gamepadPromptElement.parentElement.removeChild(
        this.gamepadPromptElement
      );
      this.gamepadPromptElement = null;
    }
  }

  /**
   * Poll gamepad state and update controls
   * @private
   */
  _updateGamepad() {
    if (!this.gamepadConnected || this.gamepadIndex === null) {
      return;
    }

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) {
      return;
    }

    // Left stick - movement
    const leftX = this._applyDeadzone(gamepad.axes[0]);
    const leftY = this._applyDeadzone(gamepad.axes[1]);

    // Right stick - camera look
    const rightX = this._applyDeadzone(gamepad.axes[2]);
    const rightY = this._applyDeadzone(gamepad.axes[3]);

    // Update movement from left stick
    this.gamepadMoveX = leftX;
    this.gamepadMoveY = leftY;

    // Update camera rotation from right stick
    if (Math.abs(rightX) > 0 || Math.abs(rightY) > 0) {
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= rightX * this.lookSpeed * this.gamepadLookSensitivity;
      this.euler.x -= rightY * this.lookSpeed * this.gamepadLookSensitivity;

      // Clamp vertical rotation
      this.euler.x = Math.max(
        this.minPolarAngle,
        Math.min(this.maxPolarAngle, this.euler.x)
      );

      this.camera.quaternion.setFromEuler(this.euler);
    }

    // Triggers - speed modification
    const leftTrigger = gamepad.buttons[GAMEPAD_BUTTON_MAP.LT]?.value || 0;
    const rightTrigger = gamepad.buttons[GAMEPAD_BUTTON_MAP.RT]?.value || 0;

    // Left trigger = slow walk (0.3x), Right trigger = sprint (2x)
    if (leftTrigger > 0.1) {
      this.speedMultiplier = 0.3;
    } else if (rightTrigger > 0.1) {
      this.speedMultiplier = 1.0 + rightTrigger;
    } else {
      this.speedMultiplier = 1.0;
    }

    // Button presses (with edge detection)
    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.A, () => {
      this.moveUp = true;
      setTimeout(() => {
        this.moveUp = false;
      }, 100);
    });

    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.B, () => {
      this.moveDown = true;
      setTimeout(() => {
        this.moveDown = false;
      }, 100);
    });

    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.START, () => {
      if (this.onMenuToggle) {
        this.onMenuToggle();
      }
    });

    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.SELECT, () => {
      if (this.onLongPress) {
        this.onLongPress({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
    });

    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.X, () => {
      if (this.onInteract) {
        this.onInteract();
      }
    });

    // D-pad navigation
    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.LEFT, () => {
      if (this.onSwipeRight) {
        this.onSwipeRight();
      }
    });

    this._handleGamepadButton(gamepad, GAMEPAD_BUTTON_MAP.RIGHT, () => {
      if (this.onSwipeLeft) {
        this.onSwipeLeft();
      }
    });

    // Haptic feedback for gamepad (if supported)
    if (gamepad.vibrationActuator) {
      this.gamepadVibrationActuator = gamepad.vibrationActuator;
    }
  }

  /**
   * Handle a gamepad button with edge detection
   * @private
   * @param {Gamepad} gamepad
   * @param {number} buttonIndex
   * @param {Function} callback
   */
  _handleGamepadButton(gamepad, buttonIndex, callback) {
    const pressed = gamepad.buttons[buttonIndex]?.pressed || false;
    const wasPressed = this.lastGamepadButtons[buttonIndex] || false;

    // Detect button press (rising edge)
    if (pressed && !wasPressed) {
      callback();
      this._triggerGamepadHaptic('short');
    }

    this.lastGamepadButtons[buttonIndex] = pressed;
  }

  /**
   * Apply deadzone to analog stick value
   * @private
   * @param {number} value
   * @returns {number}
   */
  _applyDeadzone(value) {
    if (Math.abs(value) < this.gamepadDeadzone) {
      return 0;
    }
    // Normalize the value outside the deadzone
    const sign = value > 0 ? 1 : -1;
    return (
      (sign * (Math.abs(value) - this.gamepadDeadzone)) /
      (1 - this.gamepadDeadzone)
    );
  }

  /**
   * Trigger gamepad haptic feedback
   * @private
   * @param {string} type - 'short', 'medium', 'long'
   */
  _triggerGamepadHaptic(type) {
    if (!this.gamepadVibrationActuator || this.prefersReducedMotion) {
      return;
    }

    const durations = {
      short: { duration: 50, weakMagnitude: 0.3, strongMagnitude: 0.3 },
      medium: { duration: 100, weakMagnitude: 0.5, strongMagnitude: 0.5 },
      long: { duration: 200, weakMagnitude: 0.7, strongMagnitude: 0.7 },
    };

    const settings = durations[type] || durations.short;

    try {
      this.gamepadVibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: settings.duration,
        weakMagnitude: settings.weakMagnitude,
        strongMagnitude: settings.strongMagnitude,
      });
    } catch (e) {
      // Haptic feedback may not be supported
    }
  }

  /**
   * Check if gamepad is connected
   * @returns {boolean}
   */
  isGamepadConnected() {
    return this.gamepadConnected;
  }

  /**
   * Get connected gamepad info
   * @returns {Object|null}
   */
  getGamepadInfo() {
    if (!this.gamepadConnected || this.gamepadIndex === null) {
      return null;
    }

    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) {
      return null;
    }

    return {
      id: gamepad.id,
      index: gamepad.index,
      connected: gamepad.connected,
      mapping: gamepad.mapping,
      axes: gamepad.axes.length,
      buttons: gamepad.buttons.length,
    };
  }

  // ==================== ACCESSIBILITY ====================

  /**
   * Announce message to screen readers
   * @private
   * @param {string} message
   */
  _announceToScreenReader(message) {
    // Create or reuse live region
    let liveRegion = document.getElementById('ogod-sr-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'ogod-sr-announcer';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
    }

    // Clear and set new message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }

  /**
   * Announce position change for screen readers
   * @param {THREE.Vector3} position
   */
  announcePosition(position) {
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    const z = Math.round(position.z);
    this._announceToScreenReader(`Position: ${x}, ${y}, ${z}`);
  }

  /**
   * Announce environment change for screen readers
   * @param {string} environmentName
   */
  announceEnvironment(environmentName) {
    this._announceToScreenReader(`Entered ${environmentName} environment`);
  }

  /**
   * Check if reduced motion is preferred
   * @returns {boolean}
   */
  shouldReduceMotion() {
    return this.prefersReducedMotion;
  }

  // ==================== TOUCH AND DEVICE ORIENTATION ====================

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
   * Designed with 44px minimum touch targets and thumb-friendly positioning
   * @private
   */
  _createMobileControls() {
    // Detect screen size for responsive sizing
    const isSmallScreen = window.innerWidth < 400;
    const joystickSize = isSmallScreen ? 100 : 120;
    const knobSize = isSmallScreen ? 44 : 50;
    const buttonSize = 44; // Minimum touch target size

    // Create virtual joystick for movement
    this.joystickContainer = document.createElement('div');
    this.joystickContainer.className = 'ogod-joystick-container';
    this.joystickContainer.setAttribute('role', 'application');
    this.joystickContainer.setAttribute('aria-label', 'Movement joystick');
    this.joystickContainer.style.cssText = `
      position: fixed;
      left: max(20px, env(safe-area-inset-left, 20px));
      bottom: max(100px, calc(80px + env(safe-area-inset-bottom, 0px)));
      width: ${joystickSize}px;
      height: ${joystickSize}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      touch-action: none;
      z-index: 1000;
      -webkit-tap-highlight-color: transparent;
    `;

    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'ogod-joystick-knob';
    this.joystickKnob.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: ${knobSize}px;
      height: ${knobSize}px;
      margin: -${knobSize / 2}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      pointer-events: none;
      transition: transform 0.05s ease-out;
    `;

    this.joystickContainer.appendChild(this.joystickKnob);

    // Joystick events
    this.joystickContainer.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      this.joystickActive = true;
      this._triggerHaptic('light');
    });

    this.joystickContainer.addEventListener('touchmove', e => {
      e.preventDefault();
      e.stopPropagation();
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
      const maxDistance = rect.width / 2 - knobSize / 2;

      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      // Update knob position
      this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

      // Update direction
      this.joystickDirection.set(dx / maxDistance, -dy / maxDistance);
    });

    this.joystickContainer.addEventListener('touchend', e => {
      e.stopPropagation();
      this.joystickActive = false;
      this.joystickDirection.set(0, 0);
      this.joystickKnob.style.transform = 'translate(0, 0)';
    });

    // Create button container for right side (thumb zone)
    this.mobileButtonContainer = document.createElement('div');
    this.mobileButtonContainer.className = 'ogod-mobile-buttons';
    this.mobileButtonContainer.setAttribute('role', 'group');
    this.mobileButtonContainer.setAttribute('aria-label', 'Control buttons');
    this.mobileButtonContainer.style.cssText = `
      position: fixed;
      right: max(20px, env(safe-area-inset-right, 20px));
      bottom: max(100px, calc(80px + env(safe-area-inset-bottom, 0px)));
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 1000;
    `;

    // Create gyroscope toggle button
    this.gyroButton = document.createElement('button');
    this.gyroButton.className = 'ogod-gyro-button';
    this.gyroButton.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>';
    this.gyroButton.setAttribute('aria-label', 'Toggle gyroscope controls');
    this.gyroButton.setAttribute('role', 'switch');
    this.gyroButton.setAttribute('aria-checked', 'false');
    this.gyroButton.style.cssText = `
      width: ${buttonSize}px;
      height: ${buttonSize}px;
      min-width: ${buttonSize}px;
      min-height: ${buttonSize}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      padding: 0;
    `;

    // Add focus indicator for keyboard navigation
    this.gyroButton.addEventListener('focus', () => {
      this.gyroButton.style.outline = '2px solid #00ffff';
      this.gyroButton.style.outlineOffset = '2px';
    });
    this.gyroButton.addEventListener('blur', () => {
      this.gyroButton.style.outline = 'none';
    });

    this.gyroButton.addEventListener('click', async () => {
      this._triggerHaptic('short');
      const enabled = await this.toggleGyroscope();
      this.gyroButton.style.background = enabled
        ? 'rgba(0, 255, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.15)';
      this.gyroButton.style.borderColor = enabled
        ? 'rgba(0, 255, 255, 0.7)'
        : 'rgba(255, 255, 255, 0.3)';
      this.gyroButton.setAttribute('aria-checked', enabled.toString());
      this._announceToScreenReader(
        enabled ? 'Gyroscope controls enabled' : 'Gyroscope controls disabled'
      );
    });

    // Create haptic feedback toggle button
    this.hapticButton = document.createElement('button');
    this.hapticButton.className = 'ogod-haptic-button';
    this.hapticButton.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 9c0-1 .5-3 3-3s3 2 3 3v7c0 1-.5 3-3 3s-3-2-3-3V9z"/><path d="M13 9c0-1 .5-3 3-3s3 2 3 3v7c0 1-.5 3-3 3s-3-2-3-3V9z"/><path d="M3 12h2M19 12h2"/></svg>';
    this.hapticButton.setAttribute('aria-label', 'Toggle haptic feedback');
    this.hapticButton.setAttribute('role', 'switch');
    this.hapticButton.setAttribute(
      'aria-checked',
      this.hapticEnabled.toString()
    );
    this.hapticButton.style.cssText = `
      width: ${buttonSize}px;
      height: ${buttonSize}px;
      min-width: ${buttonSize}px;
      min-height: ${buttonSize}px;
      border-radius: 50%;
      background: ${this.hapticEnabled ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
      border: 2px solid ${this.hapticEnabled ? 'rgba(0, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)'};
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      padding: 0;
      ${!this.hapticSupported ? 'display: none;' : ''}
    `;

    // Add focus indicator for keyboard navigation
    this.hapticButton.addEventListener('focus', () => {
      this.hapticButton.style.outline = '2px solid #00ffff';
      this.hapticButton.style.outlineOffset = '2px';
    });
    this.hapticButton.addEventListener('blur', () => {
      this.hapticButton.style.outline = 'none';
    });

    this.hapticButton.addEventListener('click', () => {
      this.hapticEnabled = !this.hapticEnabled;
      this._triggerHaptic('short');
      this.hapticButton.style.background = this.hapticEnabled
        ? 'rgba(0, 255, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.15)';
      this.hapticButton.style.borderColor = this.hapticEnabled
        ? 'rgba(0, 255, 255, 0.7)'
        : 'rgba(255, 255, 255, 0.3)';
      this.hapticButton.setAttribute(
        'aria-checked',
        this.hapticEnabled.toString()
      );
      this._announceToScreenReader(
        this.hapticEnabled
          ? 'Haptic feedback enabled'
          : 'Haptic feedback disabled'
      );
    });

    // Add buttons to container
    this.mobileButtonContainer.appendChild(this.gyroButton);
    this.mobileButtonContainer.appendChild(this.hapticButton);

    // Handle orientation changes
    window.addEventListener('orientationchange', this._onOrientationChange);
    window.addEventListener('resize', this._onOrientationChange);
  }

  /**
   * Handle orientation and resize changes for mobile controls
   * @private
   */
  _onOrientationChange() {
    // Adjust controls based on orientation
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 400;

    if (this.joystickContainer) {
      const joystickSize = isSmallScreen ? 90 : 120;
      this.joystickContainer.style.width = `${joystickSize}px`;
      this.joystickContainer.style.height = `${joystickSize}px`;

      // In landscape, move controls closer to edges
      if (isLandscape) {
        this.joystickContainer.style.bottom =
          'max(20px, env(safe-area-inset-bottom, 20px))';
      } else {
        this.joystickContainer.style.bottom =
          'max(100px, calc(80px + env(safe-area-inset-bottom, 0px)))';
      }
    }

    if (this.mobileButtonContainer) {
      if (isLandscape) {
        this.mobileButtonContainer.style.bottom =
          'max(20px, env(safe-area-inset-bottom, 20px))';
      } else {
        this.mobileButtonContainer.style.bottom =
          'max(100px, calc(80px + env(safe-area-inset-bottom, 0px)))';
      }
    }
  }

  // ==================== ENABLE/DISABLE CONTROLS ====================

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
    this.domElement.addEventListener('touchcancel', this._onTouchEnd);

    // Pointer lock
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    // Device orientation for mobile
    if (this._isTouchDevice()) {
      window.addEventListener('deviceorientation', this._onDeviceOrientation);
      if (this.joystickContainer) {
        document.body.appendChild(this.joystickContainer);
      }
      if (this.mobileButtonContainer) {
        document.body.appendChild(this.mobileButtonContainer);
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
    this.domElement.removeEventListener('touchcancel', this._onTouchEnd);
    document.removeEventListener(
      'pointerlockchange',
      this._onPointerLockChange
    );
    window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    window.removeEventListener('orientationchange', this._onOrientationChange);
    window.removeEventListener('resize', this._onOrientationChange);

    if (this.joystickContainer?.parentElement) {
      this.joystickContainer.parentElement.removeChild(this.joystickContainer);
    }
    if (this.mobileButtonContainer?.parentElement) {
      this.mobileButtonContainer.parentElement.removeChild(
        this.mobileButtonContainer
      );
    }

    this._cancelLongPressTimer();
    this._hideInstructions();
    this._hideGamepadPrompt();
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
    this.instructionsElement.setAttribute('role', 'status');
    this.instructionsElement.setAttribute('aria-live', 'polite');
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
        <p style="margin: 0 0 5px;">Pinch to zoom | Two-finger rotate</p>
        <p style="margin: 0 0 5px;">Swipe left/right for tracks</p>
        <p style="margin: 0; opacity: 0.7;">Use joystick to move</p>
      `;
    } else if (this.gamepadConnected) {
      this.instructionsElement.innerHTML = `
        <p style="margin: 0 0 5px;">Left stick to move | Right stick to look</p>
        <p style="margin: 0 0 5px;">A to jump | Triggers for speed</p>
        <p style="margin: 0;">D-pad left/right for tracks</p>
      `;
    } else {
      // Show custom key bindings if modified
      const forward = this.keyBindings.moveForward[0].replace('Key', '');
      const backward = this.keyBindings.moveBackward[0].replace('Key', '');
      const left = this.keyBindings.moveLeft[0].replace('Key', '');
      const right = this.keyBindings.moveRight[0].replace('Key', '');

      this.instructionsElement.innerHTML = `
        <p style="margin: 0 0 5px;">Click to enable controls</p>
        <p style="margin: 0;">${forward}${left}${backward}${right} to move | Mouse to look</p>
      `;
    }

    document.body.appendChild(this.instructionsElement);

    // Fade out after 5 seconds (faster if reduced motion)
    const fadeDelay = this.prefersReducedMotion ? 3000 : 5000;
    setTimeout(() => {
      if (this.instructionsElement) {
        this.instructionsElement.style.opacity = '0';
        setTimeout(
          () => {
            this._hideInstructions();
          },
          this.prefersReducedMotion ? 0 : 500
        );
      }
    }, fadeDelay);
  }

  /**
   * Hide instructions
   * @private
   */
  _hideInstructions() {
    if (this.instructionsElement?.parentElement) {
      this.instructionsElement.parentElement.removeChild(
        this.instructionsElement
      );
      this.instructionsElement = null;
    }
  }

  // ==================== INPUT HANDLERS ====================

  /**
   * Handle keydown
   * @private
   * @param {KeyboardEvent} event
   */
  _onKeyDown(event) {
    // Handle key binding mode
    if (this.keyBindingMode) {
      event.preventDefault();
      const action = this.pendingBindingAction;
      this.keyBindings[action] = [event.code];
      this._saveKeyBindings();
      this.keyBindingMode = false;
      this.pendingBindingAction = null;

      if (this.onKeyBindingComplete) {
        this.onKeyBindingComplete(action, event.code);
        this.onKeyBindingComplete = null;
      }

      this._announceToScreenReader(
        `${action} bound to ${event.code.replace('Key', '')}`
      );
      return;
    }

    // Check against current bindings
    if (this._isKeyForAction(event.code, 'moveForward')) {
      this.moveForward = true;
    }
    if (this._isKeyForAction(event.code, 'moveBackward')) {
      this.moveBackward = true;
    }
    if (this._isKeyForAction(event.code, 'moveLeft')) {
      this.moveLeft = true;
    }
    if (this._isKeyForAction(event.code, 'moveRight')) {
      this.moveRight = true;
    }
    if (this._isKeyForAction(event.code, 'moveUp')) {
      this.moveUp = true;
    }
    if (this._isKeyForAction(event.code, 'moveDown')) {
      this.moveDown = true;
    }
    if (this._isKeyForAction(event.code, 'menu')) {
      if (this.onMenuToggle) {
        this.onMenuToggle();
      }
    }
    if (this._isKeyForAction(event.code, 'interact')) {
      if (this.onInteract) {
        this.onInteract();
      }
    }
  }

  /**
   * Handle keyup
   * @private
   * @param {KeyboardEvent} event
   */
  _onKeyUp(event) {
    if (this._isKeyForAction(event.code, 'moveForward')) {
      this.moveForward = false;
    }
    if (this._isKeyForAction(event.code, 'moveBackward')) {
      this.moveBackward = false;
    }
    if (this._isKeyForAction(event.code, 'moveLeft')) {
      this.moveLeft = false;
    }
    if (this._isKeyForAction(event.code, 'moveRight')) {
      this.moveRight = false;
    }
    if (this._isKeyForAction(event.code, 'moveUp')) {
      this.moveUp = false;
    }
    if (this._isKeyForAction(event.code, 'moveDown')) {
      this.moveDown = false;
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
   * Handle touch start - supports multiple gestures
   * @private
   * @param {TouchEvent} event
   */
  _onTouchStart(event) {
    event.preventDefault();

    // Track all touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, {
        startX: touch.pageX,
        startY: touch.pageY,
        currentX: touch.pageX,
        currentY: touch.pageY,
      });
    }

    const touchCount = this.activeTouches.size;

    if (touchCount === 1) {
      // Single finger - could be drag, swipe, or long-press
      this.isTouching = true;
      const touch = event.touches[0];
      this.touchStartX = touch.pageX;
      this.touchStartY = touch.pageY;
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      this.touchStartTime = Date.now();

      // Swipe tracking
      this.swipeStartX = touch.pageX;
      this.swipeStartY = touch.pageY;
      this.swipeStartTime = Date.now();

      // Long-press detection
      this.longPressTriggered = false;
      this._startLongPressTimer(touch.pageX, touch.pageY);

      this.gestureType = 'drag';
    } else if (touchCount === 2) {
      // Two fingers - determine pinch vs rotate
      this._cancelLongPressTimer();
      this._initTwoFingerGesture(event.touches);
    }
  }

  /**
   * Initialize two-finger gesture (pinch or rotate)
   * @private
   * @param {TouchList} touches
   */
  _initTwoFingerGesture(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch2.pageX - touch1.pageX;
    const dy = touch2.pageY - touch1.pageY;

    this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    this.initialPinchAngle = Math.atan2(dy, dx);
    this.initialFOV = this.camera.fov;

    // Will be determined during move based on which changes more
    this.gestureType = null;
  }

  /**
   * Start long-press timer
   * @private
   * @param {number} x - Touch X position
   * @param {number} y - Touch Y position
   */
  _startLongPressTimer(x, y) {
    this._cancelLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this._triggerHaptic('medium');
      if (this.onLongPress) {
        this.onLongPress({ x, y });
      }
    }, this.longPressDuration);
  }

  /**
   * Cancel long-press timer
   * @private
   */
  _cancelLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Handle touch move - supports multiple gestures
   * @private
   * @param {TouchEvent} event
   */
  _onTouchMove(event) {
    event.preventDefault();

    // Update tracked touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const tracked = this.activeTouches.get(touch.identifier);
      if (tracked) {
        tracked.currentX = touch.pageX;
        tracked.currentY = touch.pageY;
      }
    }

    const touchCount = event.touches.length;

    if (touchCount === 1 && this.isTouching) {
      // Single finger drag - look around
      const touch = event.touches[0];
      const moveX = touch.pageX - this.touchStartX;
      const moveY = touch.pageY - this.touchStartY;

      // Cancel long-press if moved too much
      if (Math.abs(moveX) > 10 || Math.abs(moveY) > 10) {
        this._cancelLongPressTimer();
      }

      this.touchMoveX = moveX;
      this.touchMoveY = moveY;

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
    } else if (touchCount === 2) {
      // Two-finger gesture: pinch-to-zoom or rotate
      this._handleTwoFingerMove(event.touches);
    }
  }

  /**
   * Handle two-finger gesture (pinch or rotate)
   * @private
   * @param {TouchList} touches
   */
  _handleTwoFingerMove(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch2.pageX - touch1.pageX;
    const dy = touch2.pageY - touch1.pageY;

    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    const currentAngle = Math.atan2(dy, dx);

    const distanceDelta = currentDistance - this.initialPinchDistance;
    const angleDelta = currentAngle - this.initialPinchAngle;

    // Determine gesture type if not yet determined
    if (!this.gestureType) {
      const distanceChange = Math.abs(distanceDelta);
      const angleChange = Math.abs(angleDelta) * 100; // Scale angle to compare with distance

      // Threshold to start gesture detection
      if (distanceChange > 20 || angleChange > 15) {
        this.gestureType = distanceChange > angleChange ? 'pinch' : 'rotate';
      }
    }

    if (this.gestureType === 'pinch') {
      // Pinch-to-zoom: adjust FOV
      const scale = currentDistance / this.initialPinchDistance;
      const newFOV = this.initialFOV / scale;

      this.camera.fov = Math.max(this.minFOV, Math.min(this.maxFOV, newFOV));
      this.camera.updateProjectionMatrix();

      // Subtle haptic feedback at FOV limits
      if (this.camera.fov === this.minFOV || this.camera.fov === this.maxFOV) {
        this._triggerHaptic('light');
      }
    } else if (this.gestureType === 'rotate') {
      // Two-finger rotate: orbit camera (yaw)
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= angleDelta * 0.5;
      this.camera.quaternion.setFromEuler(this.euler);

      // Update initial angle for continuous rotation
      this.initialPinchAngle = currentAngle;
    }
  }

  /**
   * Handle touch end - detect swipes and clean up
   * @private
   * @param {TouchEvent} event
   */
  _onTouchEnd(event) {
    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    this._cancelLongPressTimer();

    // Check for swipe gesture on single finger release
    if (this.gestureType === 'drag' && !this.longPressTriggered) {
      const endTime = Date.now();
      const touch = event.changedTouches[0];
      const deltaX = touch.pageX - this.swipeStartX;
      const deltaY = touch.pageY - this.swipeStartY;
      const deltaTime = endTime - this.swipeStartTime;

      // Check if it's a quick horizontal swipe
      if (
        deltaTime < this.swipeMaxTime &&
        Math.abs(deltaX) > this.swipeThreshold &&
        Math.abs(deltaX) > Math.abs(deltaY) * 2
      ) {
        if (deltaX > 0) {
          // Swipe right - previous track
          this._triggerHaptic('short');
          if (this.onSwipeRight) {
            this.onSwipeRight();
          }
        } else {
          // Swipe left - next track
          this._triggerHaptic('short');
          if (this.onSwipeLeft) {
            this.onSwipeLeft();
          }
        }
      }
    }

    // Reset state if all touches ended
    if (this.activeTouches.size === 0) {
      this.isTouching = false;
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      this.gestureType = null;
    } else if (this.activeTouches.size === 1) {
      // Transition from two fingers to one
      const remainingTouch = this.activeTouches.values().next().value;
      this.touchStartX = remainingTouch.currentX;
      this.touchStartY = remainingTouch.currentY;
      this.gestureType = 'drag';
    }
  }

  // ==================== HAPTIC FEEDBACK ====================

  /**
   * Trigger haptic feedback
   * @param {string} type - 'light', 'short', 'medium', 'beat', 'interaction'
   */
  _triggerHaptic(type) {
    if (
      !this.hapticEnabled ||
      !this.hapticSupported ||
      this.prefersReducedMotion
    ) {
      return;
    }

    const patterns = {
      light: [10],
      short: [25],
      medium: [50],
      beat: [15, 30, 15], // Double pulse for beat
      interaction: [20, 20, 40], // Pattern for environment interaction
    };

    const pattern = patterns[type] || patterns.short;

    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Vibration API may not be available or permitted
      console.debug('Haptic feedback not available:', e);
    }
  }

  /**
   * Enable or disable haptic feedback
   * @param {boolean} enabled
   */
  setHapticEnabled(enabled) {
    this.hapticEnabled = enabled;
  }

  /**
   * Check if haptic feedback is available
   * @returns {boolean}
   */
  isHapticAvailable() {
    return this.hapticSupported && !this.prefersReducedMotion;
  }

  /**
   * Trigger haptic feedback for beat detection (public method for audio engine)
   * @param {number} intensity - 0 to 1
   */
  triggerBeatHaptic(intensity = 0.5) {
    if (intensity > 0.7) {
      this._triggerHaptic('beat');
    } else if (intensity > 0.4) {
      this._triggerHaptic('short');
    } else {
      this._triggerHaptic('light');
    }
  }

  /**
   * Trigger haptic feedback for environment interaction
   */
  triggerInteractionHaptic() {
    this._triggerHaptic('interaction');
  }

  // ==================== DEVICE ORIENTATION ====================

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
    const yaw =
      THREE.MathUtils.degToRad(deltaAlpha) * this.gyroscopeSensitivity;
    const pitch =
      THREE.MathUtils.degToRad(deltaBeta - 90) * this.gyroscopeSensitivity;

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

  // ==================== UPDATE LOOP ====================

  /**
   * Update controller state - call each frame
   * @param {number} delta - Time since last frame
   */
  update(delta) {
    if (!this.isEnabled) {
      return;
    }

    // Update gamepad
    this._updateGamepad();

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
      this.direction.add(
        forward.clone().multiplyScalar(this.joystickDirection.y)
      );
      this.direction.add(
        right.clone().multiplyScalar(this.joystickDirection.x)
      );
    }

    // Add gamepad stick input
    if (this.gamepadConnected && this.gamepadMoveX !== undefined) {
      this.direction.add(forward.clone().multiplyScalar(-this.gamepadMoveY));
      this.direction.add(right.clone().multiplyScalar(this.gamepadMoveX));
    }

    this.direction.normalize();

    // Apply velocity with damping
    const effectiveSpeed = this.baseSpeed * this.speedMultiplier;
    const targetVelocity = this.direction.multiplyScalar(effectiveSpeed);
    this.velocity.lerp(targetVelocity, this.dampingFactor);

    // Update position
    const movement = this.velocity.clone().multiplyScalar(delta);
    this.camera.position.add(movement);

    // Notify position change
    if (this.onPositionChange && movement.lengthSq() > 0.0001) {
      this.onPositionChange(this.camera.position.clone());
    }
  }

  // ==================== CLEANUP ====================

  /**
   * Clean up resources
   */
  dispose() {
    this.disable();

    // Remove gamepad listeners
    window.removeEventListener('gamepadconnected', this._onGamepadConnected);
    window.removeEventListener(
      'gamepaddisconnected',
      this._onGamepadDisconnected
    );

    // Remove screen reader announcer
    const announcer = document.getElementById('ogod-sr-announcer');
    if (announcer?.parentElement) {
      announcer.parentElement.removeChild(announcer);
    }
  }
}

// Export for global scope
window.FirstPersonController = FirstPersonController;
