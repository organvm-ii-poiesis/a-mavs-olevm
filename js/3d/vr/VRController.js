/**
 * @file VRController.js
 * @description WebXR VR support for OGOD 3D environments
 * Implements VR headset detection, stereo rendering, and hand controller tracking
 *
 * FEATURES:
 * - WebXR Device API integration
 * - VR headset detection and session management
 * - Stereo rendering for left/right eyes
 * - Hand controller tracking (if available)
 * - Teleportation locomotion option
 * - "Enter VR" button in UI
 *
 * CONTROLLER MAPPINGS (VR Controllers):
 * - Trigger: Teleport / Interact
 * - Grip: Grab objects
 * - Thumbstick: Smooth locomotion (optional)
 * - A/X button: Jump / Confirm
 * - B/Y button: Cancel / Menu
 */

'use strict';

/**
 * VRController - WebXR VR support for OGOD environments
 * @class
 */
class VRController {
  /**
   * @param {Object} options - Configuration options
   * @param {THREE.WebGLRenderer} options.renderer - Three.js renderer
   * @param {THREE.Scene} options.scene - Three.js scene
   * @param {THREE.Camera} options.camera - Three.js camera
   * @param {Function} [options.onSessionStart] - Callback when VR session starts
   * @param {Function} [options.onSessionEnd] - Callback when VR session ends
   * @param {Function} [options.onTeleport] - Callback when teleport is triggered
   * @param {Function} [options.onInteract] - Callback when interact is triggered
   */
  constructor(options = {}) {
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.camera = options.camera;
    this.onSessionStart = options.onSessionStart || null;
    this.onSessionEnd = options.onSessionEnd || null;
    this.onTeleport = options.onTeleport || null;
    this.onInteract = options.onInteract || null;

    // State
    this.isSupported = false;
    this.isSessionActive = false;
    this.xrSession = null;
    this.xrReferenceSpace = null;

    // Controllers
    this.controllers = [];
    this.controllerGrips = [];
    this.handModels = [];

    // Locomotion
    this.locomotionMode = 'teleport'; // 'teleport' or 'smooth'
    this.teleportMarker = null;
    this.teleportRaycaster = new THREE.Raycaster();
    this.teleportTargetPosition = new THREE.Vector3();
    this.isTeleporting = false;

    // UI
    this.vrButton = null;

    // Camera rig for VR movement
    this.cameraRig = new THREE.Group();
    this.cameraRig.add(this.camera);

    // Reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Bind methods
    this._onSessionStarted = this._onSessionStarted.bind(this);
    this._onSessionEnded = this._onSessionEnded.bind(this);
    this._onSelectStart = this._onSelectStart.bind(this);
    this._onSelectEnd = this._onSelectEnd.bind(this);
    this._onSqueezeStart = this._onSqueezeStart.bind(this);
    this._onSqueezeEnd = this._onSqueezeEnd.bind(this);

    // Check for WebXR support
    this._checkVRSupport();
  }

  /**
   * Check if WebXR VR is supported
   * @private
   */
  async _checkVRSupport() {
    if ('xr' in navigator) {
      try {
        this.isSupported = await navigator.xr.isSessionSupported(
          'immersive-vr'
        );
        if (this.isSupported) {
          console.log('WebXR VR is supported');
          this._createVRButton();
        } else {
          console.log('WebXR VR is not supported on this device');
        }
      } catch (e) {
        console.warn('Error checking WebXR support:', e);
        this.isSupported = false;
      }
    } else {
      console.log('WebXR API not available');
      this.isSupported = false;
    }
  }

  /**
   * Create the "Enter VR" button
   * @private
   */
  _createVRButton() {
    this.vrButton = document.createElement('button');
    this.vrButton.className = 'ogod-vr-button';
    this.vrButton.setAttribute('aria-label', 'Enter VR mode');
    this.vrButton.setAttribute('role', 'button');
    this.vrButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="8" cy="12" r="2"/>
        <circle cx="16" cy="12" r="2"/>
        <path d="M10 12h4"/>
      </svg>
      <span>Enter VR</span>
    `;
    this.vrButton.style.cssText = `
      position: fixed;
      bottom: 140px;
      right: 20px;
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(138, 43, 226, 0.5);
      color: #8a2be2;
      font-family: sans-serif;
      font-size: 14px;
      cursor: pointer;
      border-radius: 8px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    `;

    // Hover effect
    this.vrButton.addEventListener('mouseenter', () => {
      this.vrButton.style.background = 'rgba(138, 43, 226, 0.2)';
      this.vrButton.style.borderColor = '#8a2be2';
    });
    this.vrButton.addEventListener('mouseleave', () => {
      if (!this.isSessionActive) {
        this.vrButton.style.background = 'rgba(0, 0, 0, 0.7)';
        this.vrButton.style.borderColor = 'rgba(138, 43, 226, 0.5)';
      }
    });

    // Focus indicator
    this.vrButton.addEventListener('focus', () => {
      this.vrButton.style.outline = '2px solid #8a2be2';
      this.vrButton.style.outlineOffset = '2px';
    });
    this.vrButton.addEventListener('blur', () => {
      this.vrButton.style.outline = 'none';
    });

    // Click handler
    this.vrButton.addEventListener('click', () => {
      if (this.isSessionActive) {
        this.endVRSession();
      } else {
        this.startVRSession();
      }
    });
  }

  /**
   * Show the VR button in the UI
   */
  showVRButton() {
    if (this.vrButton && this.isSupported) {
      document.body.appendChild(this.vrButton);
    }
  }

  /**
   * Hide the VR button
   */
  hideVRButton() {
    if (this.vrButton?.parentElement) {
      this.vrButton.parentElement.removeChild(this.vrButton);
    }
  }

  /**
   * Start a VR session
   * @returns {Promise<boolean>}
   */
  async startVRSession() {
    if (!this.isSupported || this.isSessionActive) {
      return false;
    }

    try {
      // Request immersive VR session
      const sessionInit = {
        optionalFeatures: [
          'local-floor',
          'bounded-floor',
          'hand-tracking',
          'layers',
        ],
      };

      this.xrSession = await navigator.xr.requestSession(
        'immersive-vr',
        sessionInit
      );

      // Set up session
      await this._setupSession();

      return true;
    } catch (e) {
      console.error('Failed to start VR session:', e);
      this._announceToScreenReader('Failed to start VR session');
      return false;
    }
  }

  /**
   * Set up the VR session
   * @private
   */
  async _setupSession() {
    // Enable XR on renderer
    this.renderer.xr.enabled = true;
    await this.renderer.xr.setSession(this.xrSession);

    // Get reference space
    try {
      this.xrReferenceSpace =
        await this.xrSession.requestReferenceSpace('local-floor');
    } catch (e) {
      // Fallback to local space
      this.xrReferenceSpace =
        await this.xrSession.requestReferenceSpace('local');
    }

    // Add camera rig to scene
    this.scene.add(this.cameraRig);

    // Set up controllers
    this._setupControllers();

    // Create teleport marker
    this._createTeleportMarker();

    // Listen for session end
    this.xrSession.addEventListener('end', this._onSessionEnded);

    this._onSessionStarted();
  }

  /**
   * Set up VR controllers
   * @private
   */
  _setupControllers() {
    for (let i = 0; i < 2; i++) {
      // Controller (ray origin)
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this._onSelectStart);
      controller.addEventListener('selectend', this._onSelectEnd);
      controller.addEventListener('squeezestart', this._onSqueezeStart);
      controller.addEventListener('squeezeend', this._onSqueezeEnd);
      controller.addEventListener('connected', (event) => {
        this._onControllerConnected(event, i);
      });
      controller.addEventListener('disconnected', () => {
        this._onControllerDisconnected(i);
      });
      this.cameraRig.add(controller);
      this.controllers.push(controller);

      // Controller grip (model position)
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(this._createControllerModel());
      this.cameraRig.add(grip);
      this.controllerGrips.push(grip);

      // Add ray line for teleport targeting
      const line = this._createRayLine();
      controller.add(line);
      controller.userData.line = line;
    }
  }

  /**
   * Create a controller model
   * @private
   * @returns {THREE.Object3D}
   */
  _createControllerModel() {
    // Simple controller representation
    const group = new THREE.Group();

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.1, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);

    // Trigger
    const triggerGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.04);
    const triggerMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a2be2,
      emissive: 0x8a2be2,
      emissiveIntensity: 0.3,
    });
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(0, -0.02, 0.02);
    group.add(trigger);

    return group;
  }

  /**
   * Create a ray line for teleport targeting
   * @private
   * @returns {THREE.Line}
   */
  _createRayLine() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute([1, 1, 1, 0.5, 0.5, 0.5], 3)
    );

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });

    const line = new THREE.Line(geometry, material);
    line.scale.z = 5;
    line.visible = false;

    return line;
  }

  /**
   * Create teleport marker
   * @private
   */
  _createTeleportMarker() {
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.7,
    });

    this.teleportMarker = new THREE.Mesh(geometry, material);
    this.teleportMarker.visible = false;
    this.scene.add(this.teleportMarker);

    // Add inner circle
    const innerGeometry = new THREE.CircleGeometry(0.1, 32);
    innerGeometry.rotateX(-Math.PI / 2);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.3,
    });
    const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCircle.position.y = 0.001;
    this.teleportMarker.add(innerCircle);
  }

  /**
   * Handle controller connected
   * @private
   * @param {XRInputSourceEvent} event
   * @param {number} index
   */
  _onControllerConnected(event, index) {
    const controller = this.controllers[index];
    controller.userData.inputSource = event.data;
    controller.userData.handedness = event.data.handedness;

    console.log(
      `Controller ${index} connected:`,
      event.data.handedness,
      event.data.targetRayMode
    );

    // Show ray line for tracked pointers
    if (event.data.targetRayMode === 'tracked-pointer') {
      controller.userData.line.visible = true;
    }
  }

  /**
   * Handle controller disconnected
   * @private
   * @param {number} index
   */
  _onControllerDisconnected(index) {
    const controller = this.controllers[index];
    controller.userData.inputSource = null;
    controller.userData.handedness = null;
    controller.userData.line.visible = false;

    console.log(`Controller ${index} disconnected`);
  }

  /**
   * Handle select (trigger) start
   * @private
   * @param {XRInputSourceEvent} event
   */
  _onSelectStart(event) {
    const controller = event.target;

    if (this.locomotionMode === 'teleport') {
      // Start teleport targeting
      this.isTeleporting = true;
      controller.userData.line.visible = true;
    }
  }

  /**
   * Handle select (trigger) end
   * @private
   * @param {XRInputSourceEvent} event
   */
  _onSelectEnd(event) {
    const controller = event.target;

    if (this.locomotionMode === 'teleport' && this.isTeleporting) {
      // Execute teleport
      if (this.teleportMarker.visible) {
        this._executeTeleport();
      }
      this.isTeleporting = false;
      controller.userData.line.visible = false;
      this.teleportMarker.visible = false;
    }

    // Also trigger interact callback
    if (this.onInteract) {
      this.onInteract(controller.userData.handedness);
    }
  }

  /**
   * Handle squeeze (grip) start
   * @private
   * @param {XRInputSourceEvent} event
   */
  _onSqueezeStart(event) {
    const controller = event.target;
    // Could be used for grabbing objects
    console.log('Squeeze start:', controller.userData.handedness);
  }

  /**
   * Handle squeeze (grip) end
   * @private
   * @param {XRInputSourceEvent} event
   */
  _onSqueezeEnd(event) {
    const controller = event.target;
    console.log('Squeeze end:', controller.userData.handedness);
  }

  /**
   * Execute teleport to target position
   * @private
   */
  _executeTeleport() {
    // Move camera rig to teleport position
    this.cameraRig.position.copy(this.teleportTargetPosition);

    // Trigger callback
    if (this.onTeleport) {
      this.onTeleport(this.teleportTargetPosition.clone());
    }

    // Haptic feedback if supported
    this._triggerControllerHaptic(0, 50, 0.5);
    this._triggerControllerHaptic(1, 50, 0.5);
  }

  /**
   * Trigger haptic feedback on a controller
   * @private
   * @param {number} controllerIndex
   * @param {number} duration - Duration in ms
   * @param {number} intensity - 0 to 1
   */
  _triggerControllerHaptic(controllerIndex, duration, intensity) {
    if (this.prefersReducedMotion) {
      return;
    }

    const controller = this.controllers[controllerIndex];
    if (controller?.userData?.inputSource?.gamepad?.hapticActuators?.[0]) {
      controller.userData.inputSource.gamepad.hapticActuators[0].pulse(
        intensity,
        duration
      );
    }
  }

  /**
   * Handle session started
   * @private
   */
  _onSessionStarted() {
    this.isSessionActive = true;

    // Update button
    if (this.vrButton) {
      this.vrButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        <span>Exit VR</span>
      `;
      this.vrButton.style.background = 'rgba(138, 43, 226, 0.3)';
      this.vrButton.style.borderColor = '#8a2be2';
      this.vrButton.setAttribute('aria-label', 'Exit VR mode');
    }

    // Announce to screen readers
    this._announceToScreenReader('VR session started');

    // Call callback
    if (this.onSessionStart) {
      this.onSessionStart();
    }
  }

  /**
   * Handle session ended
   * @private
   */
  _onSessionEnded() {
    this.isSessionActive = false;
    this.xrSession = null;

    // Disable XR on renderer
    this.renderer.xr.enabled = false;

    // Remove camera rig from scene
    this.scene.remove(this.cameraRig);

    // Hide teleport marker
    if (this.teleportMarker) {
      this.teleportMarker.visible = false;
    }

    // Update button
    if (this.vrButton) {
      this.vrButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <circle cx="8" cy="12" r="2"/>
          <circle cx="16" cy="12" r="2"/>
          <path d="M10 12h4"/>
        </svg>
        <span>Enter VR</span>
      `;
      this.vrButton.style.background = 'rgba(0, 0, 0, 0.7)';
      this.vrButton.style.borderColor = 'rgba(138, 43, 226, 0.5)';
      this.vrButton.setAttribute('aria-label', 'Enter VR mode');
    }

    // Announce to screen readers
    this._announceToScreenReader('VR session ended');

    // Call callback
    if (this.onSessionEnd) {
      this.onSessionEnd();
    }
  }

  /**
   * End the VR session
   */
  async endVRSession() {
    if (this.xrSession) {
      await this.xrSession.end();
    }
  }

  /**
   * Update teleport targeting (call in animation loop)
   * @param {THREE.Object3D[]} floorObjects - Objects to raycast against for teleport
   */
  updateTeleport(floorObjects = []) {
    if (!this.isTeleporting || !this.isSessionActive) {
      return;
    }

    // Find the controller that's teleporting
    for (const controller of this.controllers) {
      if (!controller.userData.line?.visible) {
        continue;
      }

      // Set up raycaster from controller
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      this.teleportRaycaster.ray.origin.setFromMatrixPosition(
        controller.matrixWorld
      );
      this.teleportRaycaster.ray.direction
        .set(0, 0, -1)
        .applyMatrix4(tempMatrix);

      // Raycast against floor objects
      const intersects = this.teleportRaycaster.intersectObjects(
        floorObjects,
        true
      );

      if (intersects.length > 0) {
        // Show marker at intersection point
        this.teleportMarker.visible = true;
        this.teleportMarker.position.copy(intersects[0].point);
        this.teleportMarker.position.y += 0.01; // Slight offset to prevent z-fighting
        this.teleportTargetPosition.copy(intersects[0].point);

        // Update ray line length
        const positions = controller.userData.line.geometry.attributes.position;
        positions.setXYZ(1, 0, 0, -intersects[0].distance);
        positions.needsUpdate = true;
      } else {
        // Hide marker if no valid target
        this.teleportMarker.visible = false;
      }
    }
  }

  /**
   * Set locomotion mode
   * @param {string} mode - 'teleport' or 'smooth'
   */
  setLocomotionMode(mode) {
    this.locomotionMode = mode;
  }

  /**
   * Check if VR is supported
   * @returns {boolean}
   */
  isVRSupported() {
    return this.isSupported;
  }

  /**
   * Check if VR session is active
   * @returns {boolean}
   */
  isVRActive() {
    return this.isSessionActive;
  }

  /**
   * Get camera rig position
   * @returns {THREE.Vector3}
   */
  getCameraRigPosition() {
    return this.cameraRig.position.clone();
  }

  /**
   * Set camera rig position
   * @param {THREE.Vector3} position
   */
  setCameraRigPosition(position) {
    this.cameraRig.position.copy(position);
  }

  /**
   * Announce message to screen readers
   * @private
   * @param {string} message
   */
  _announceToScreenReader(message) {
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

    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }

  /**
   * Clean up resources
   */
  dispose() {
    // End session if active
    if (this.isSessionActive) {
      this.endVRSession();
    }

    // Remove VR button
    this.hideVRButton();

    // Remove teleport marker
    if (this.teleportMarker) {
      this.scene.remove(this.teleportMarker);
      this.teleportMarker.geometry.dispose();
      this.teleportMarker.material.dispose();
    }

    // Clean up controllers
    for (const controller of this.controllers) {
      controller.removeEventListener('selectstart', this._onSelectStart);
      controller.removeEventListener('selectend', this._onSelectEnd);
      controller.removeEventListener('squeezestart', this._onSqueezeStart);
      controller.removeEventListener('squeezeend', this._onSqueezeEnd);
    }

    this.controllers = [];
    this.controllerGrips = [];
  }
}

// Export for global scope
window.VRController = VRController;
