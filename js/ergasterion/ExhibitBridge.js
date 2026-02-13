/**
 * @file ExhibitBridge.js
 * @description Communication layer between ETCETER4 and iframe'd absorb-alchemize exhibits.
 * Uses postMessage protocol with type checking for parent-child coordination.
 */

'use strict';

class ExhibitBridge {
  /**
   * @param {HTMLIFrameElement} iframe - The exhibit iframe element
   * @param {Object} [callbacks] - Event callbacks
   * @param {Function} [callbacks.onLoaded] - Called when exhibit reports loaded
   * @param {Function} [callbacks.onError] - Called on exhibit error
   * @param {Function} [callbacks.onClose] - Called when exhibit requests close
   */
  constructor(iframe, callbacks = {}) {
    this.iframe = iframe;
    this.callbacks = callbacks;
    this.isConnected = false;
    this._boundOnMessage = this._onMessage.bind(this);
    window.addEventListener('message', this._boundOnMessage);
  }

  /** Send PARENT_READY to the exhibit iframe */
  sendReady() {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { type: 'PARENT_READY', source: 'etceter4' },
        '*'
      );
    }
  }

  /** Pause atmosphere effects while exhibit is active */
  pauseAtmosphere() {
    const core = window.livingPantheonCoreInstance;
    if (core?.isRunning) {
      core.stop();
      this._atmospherePaused = true;
    }
  }

  /** Resume atmosphere effects when exhibit closes */
  resumeAtmosphere() {
    if (this._atmospherePaused) {
      const core = window.livingPantheonCoreInstance;
      core?.start();
      this._atmospherePaused = false;
    }
  }

  /**
   * Handle messages from exhibit iframes
   * @param {MessageEvent} event
   * @private
   */
  _onMessage(event) {
    const data = event.data;
    if (!data || typeof data.type !== 'string') {
      return;
    }

    switch (data.type) {
      case 'EXHIBIT_LOADED':
        this.isConnected = true;
        this.callbacks.onLoaded?.();
        break;
      case 'EXHIBIT_ERROR':
        this.callbacks.onError?.(data.error);
        break;
      case 'CLOSE_EXHIBIT':
        this.callbacks.onClose?.();
        break;
    }
  }

  /** Dispose and clean up */
  dispose() {
    window.removeEventListener('message', this._boundOnMessage);
    this.resumeAtmosphere();
    this.iframe = null;
    this.isConnected = false;
  }
}

window.ExhibitBridge = ExhibitBridge;
