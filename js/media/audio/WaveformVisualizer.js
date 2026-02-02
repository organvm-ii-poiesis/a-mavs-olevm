'use strict';

/**
 * WaveformVisualizer - Canvas-based waveform visualization with click-to-seek
 *
 * Renders audio waveform data on a canvas with progress tracking and user interaction.
 * Integrates with EnhancedAudioPlayer for seamless audio control.
 *
 * @class WaveformVisualizer
 * @example
 * const visualizer = new WaveformVisualizer({
 *   canvasElement: document.getElementById('waveform'),
 *   playerInstance: audioPlayer
 * });
 * visualizer.loadWaveformFromUrl('./waveforms/song.json');
 */
class WaveformVisualizer {
  /**
   * Create a WaveformVisualizer instance
   * @param {Object} options - Configuration options
   * @param {HTMLCanvasElement} [options.canvasElement] - Canvas element to render to
   * @param {Object} [options.playerInstance] - Connected EnhancedAudioPlayer instance
   * @param {Object} [options.config] - Custom configuration (defaults to ETCETER4_CONFIG.media.audio.waveform)
   */
  constructor(options = {}) {
    this.options = options;
    this.config = options.config || ETCETER4_CONFIG.media.audio.waveform;

    // Canvas and rendering
    this.canvas = options.canvasElement || null;
    this.ctx = null;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Waveform data
    this.waveformData = null;
    this.peakData = null;

    // State
    this.progress = 0; // 0-1
    this.duration = 0; // seconds
    this.isInteracting = false;
    this.isDirty = true; // Force redraw on next frame

    // Player integration
    this.player = options.playerInstance || null;

    // Event listeners
    this.eventListeners = new Map();

    // Animation frame
    this.animationFrameId = null;

    // Binding for event handlers
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleResize = this.handleResize.bind(this);

    if (this.canvas) {
      this.attach(this.canvas);
    }
  }

  /**
   * Attach visualizer to a canvas element
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render to
   */
  attach(canvasElement) {
    if (!canvasElement) {
      console.warn('WaveformVisualizer: No canvas element provided');
      return;
    }

    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      console.error('WaveformVisualizer: Unable to get 2D context');
      return;
    }

    // Set up canvas dimensions
    this.updateCanvasDimensions();

    // Attach event listeners
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, false);
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, false);
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd, false);
    window.addEventListener('resize', this.boundHandleResize);

    // Start render loop
    this.render();
  }

  /**
   * Update canvas dimensions based on container and device pixel ratio
   * @private
   */
  updateCanvasDimensions() {
    if (!this.canvas) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.offsetWidth || 500;
    const height = this.config.height;

    // Set logical dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Scale for device pixel ratio (for Retina displays)
    if (this.devicePixelRatio > 1) {
      this.canvas.width *= this.devicePixelRatio;
      this.canvas.height *= this.devicePixelRatio;
      this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }

    // Clear canvas with background color
    this.clear();
    this.isDirty = true;
  }

  /**
   * Load waveform data from array of peak values (0-1)
   * @param {Array<number>} waveformData - Array of normalized peak values (0-1)
   */
  loadWaveform(waveformData) {
    if (!Array.isArray(waveformData) || waveformData.length === 0) {
      console.warn('WaveformVisualizer: Invalid waveform data');
      return;
    }

    this.waveformData = waveformData;
    this.isDirty = true;
  }

  /**
   * Load waveform data from JSON URL
   * @async
   * @param {string} url - URL to fetch waveform JSON from
   * @returns {Promise<void>}
   */
  async loadWaveformFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Expect either direct array or { data: array } format
      const waveformArray = Array.isArray(data) ? data : data.data;

      if (!Array.isArray(waveformArray)) {
        throw new Error('Waveform data is not an array');
      }

      this.loadWaveform(waveformArray);
      this.emit('waveformLoaded', { duration: this.duration });
    } catch (error) {
      console.error('WaveformVisualizer: Failed to load waveform', error);
      this.emit('error', { error });
    }
  }

  /**
   * Set playback progress (0-1)
   * @param {number} percent - Progress as decimal (0-1)
   */
  setProgress(percent) {
    const normalized = Math.max(0, Math.min(1, percent));
    if (this.progress !== normalized) {
      this.progress = normalized;
      this.isDirty = true;
    }
  }

  /**
   * Connect to EnhancedAudioPlayer instance
   * @param {Object} playerInstance - EnhancedAudioPlayer instance
   */
  setPlayer(playerInstance) {
    this.player = playerInstance;

    if (this.player) {
      // Listen for player events
      if (typeof this.player.on === 'function') {
        this.player.on('play', () => this.updateFromPlayer());
        this.player.on('pause', () => this.updateFromPlayer());
        this.player.on('seek', (time) => {
          this.setProgress(time / (this.player.getDuration() || 1));
        });
        this.player.on('timeupdate', (time) => {
          this.setProgress(time / (this.player.getDuration() || 1));
        });
        this.player.on('loadstart', () => {
          this.waveformData = null;
          this.isDirty = true;
        });
      }
    }
  }

  /**
   * Update state from connected player
   * @private
   */
  updateFromPlayer() {
    if (!this.player) {
      return;
    }

    const duration = this.player.getDuration?.() || 0;
    const currentTime = this.player.getCurrentTime?.() || 0;

    this.duration = duration;
    this.setProgress(duration > 0 ? currentTime / duration : 0);
  }

  /**
   * Handle canvas click for seek functionality
   * @private
   * @param {MouseEvent} event - Click event
   */
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));

    this.handleSeek(percent);
  }

  /**
   * Handle touch start
   * @private
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    this.isInteracting = true;
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));

    this.handleSeek(percent);
  }

  /**
   * Handle touch move
   * @private
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    if (!this.isInteracting) {
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));

    this.setProgress(percent);
    this.isDirty = true;
  }

  /**
   * Handle touch end
   * @private
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    if (!this.isInteracting) {
      return;
    }
    this.isInteracting = false;

    // Calculate final position from last touch
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));

      this.handleSeek(percent);
    }
  }

  /**
   * Handle seek to position
   * @private
   * @param {number} percent - Seek position as decimal (0-1)
   */
  handleSeek(percent) {
    this.setProgress(percent);

    if (this.player && typeof this.player.seek === 'function') {
      const seekTime = percent * (this.player.getDuration?.() || 0);
      this.player.seek(seekTime);
    }

    this.emit('seek', { percent, time: percent * this.duration });
  }

  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    this.updateCanvasDimensions();
  }

  /**
   * Resize visualizer (manual trigger)
   */
  resize() {
    this.updateCanvasDimensions();
  }

  /**
   * Clear canvas
   * @private
   */
  clear() {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const { width, height } = this.canvas;

    // Set background color
    if (this.config.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.config.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    } else {
      this.ctx.clearRect(0, 0, width, height);
    }
  }

  /**
   * Render waveform visualization
   * @private
   */
  render() {
    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.render());

    if (!this.isDirty || !this.canvas || !this.ctx || !this.waveformData) {
      return;
    }

    this.clear();
    this.drawWaveform();
    this.isDirty = false;
  }

  /**
   * Draw waveform bars
   * @private
   */
  drawWaveform() {
    if (!this.ctx || !this.canvas || !this.waveformData) {
      return;
    }

    const { width, height } = this.canvas;
    const { barWidth, barGap, primaryColor, progressColor } = this.config;
    const barSpacing = barWidth + barGap;
    const centerY = height / 2;

    // Calculate how many bars we can fit
    const numBars = Math.floor(width / barSpacing);
    const step = Math.max(1, Math.floor(this.waveformData.length / numBars));

    // Draw bars
    for (let i = 0; i < numBars; i++) {
      const dataIndex = i * step;
      if (dataIndex >= this.waveformData.length) {
        break;
      }

      const peak = this.waveformData[dataIndex];
      const barHeight = peak * (height * 0.9); // 90% of container height
      const x = i * barSpacing;

      // Determine color (played vs unplayed)
      const barProgress = i / numBars;
      const isPlayed = barProgress <= this.progress;
      const color = isPlayed ? progressColor : primaryColor;

      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.8;

      // Draw bar (centered vertically)
      const top = centerY - barHeight / 2;
      this.ctx.fillRect(x, top, barWidth, barHeight);
    }

    this.ctx.globalAlpha = 1.0;

    // Draw progress indicator line
    const progressX = width * this.progress;
    this.ctx.strokeStyle = progressColor;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.6;
    this.ctx.beginPath();
    this.ctx.moveTo(progressX, 0);
    this.ctx.lineTo(progressX, height);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Emit custom event
   * @private
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`WaveformVisualizer event listener error (${eventName}):`, error);
      }
    });
  }

  /**
   * Register event listener
   * @param {string} eventName - Event name ('seek', 'waveformLoaded', 'error')
   * @param {Function} callback - Listener callback
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Listener callback
   */
  off(eventName, callback) {
    const listeners = this.eventListeners.get(eventName) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Clean up resources and remove event listeners
   */
  dispose() {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
      this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
      this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    }
    window.removeEventListener('resize', this.boundHandleResize);

    // Clear state
    this.canvas = null;
    this.ctx = null;
    this.waveformData = null;
    this.player = null;
    this.eventListeners.clear();
  }
}

// Export to global scope for SPA architecture
window.WaveformVisualizer = WaveformVisualizer;
