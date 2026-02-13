/**
 * @file OGODFrameSequencer.js
 * @description Decoupled frame progression logic for OGOD animations.
 * Manages how the animation steps through grid cells over time.
 * Supports multiple playback orders and loop modes.
 */

"use strict";

/**
 * OGODFrameSequencer - Frame progression controller
 * @class
 */
class OGODFrameSequencer {
  /**
   * @param {Object} options
   * @param {number} [options.gridSize=21] - Grid dimension (gridSize x gridSize)
   * @param {number} [options.totalFrames=410] - Total frames before looping
   * @param {string} [options.order='sequential'] - Playback order
   * @param {string} [options.loopMode='loop'] - Loop behavior: 'loop' | 'bounce' | 'once'
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== "undefined"
        ? ETCETER4_CONFIG.ogodAnimation || {}
        : {};

    const faithful = config.faithful || {};
    const playback = config.playback || {};

    this.gridSize = options.gridSize || faithful.gridSize || 21;
    this.totalFrames = options.totalFrames || faithful.totalFrames || 410;
    this.order = options.order || playback.defaultOrder || "sequential";
    this.loopMode = options.loopMode || playback.loopMode || "loop";

    this._frame = 0;
    this._direction = 1; // 1 = forward, -1 = reverse (for bounce mode)
    this._sequence = null; // Pre-computed sequence for non-sequential orders
    this._isComplete = false;

    // Build sequence for non-sequential orders
    if (this.order !== "sequential") {
      this._buildSequence();
    }
  }

  /**
   * Get current grid position
   * @returns {{ col: number, row: number, frame: number }}
   */
  get current() {
    if (this._sequence) {
      const pos = this._sequence[this._frame] || { col: 0, row: 0 };
      return { col: pos.col, row: pos.row, frame: this._frame };
    }

    // Sequential: left-to-right, top-to-bottom
    const col = this._frame % this.gridSize;
    const row = Math.floor(this._frame / this.gridSize);
    return { col, row, frame: this._frame };
  }

  /**
   * Get the frame index as a normalized value (0-1)
   * @returns {number}
   */
  get progress() {
    return this._frame / (this.totalFrames - 1);
  }

  /**
   * Whether the sequence has completed (only relevant for 'once' mode)
   * @returns {boolean}
   */
  get isComplete() {
    return this._isComplete;
  }

  /**
   * Advance to the next frame
   * @returns {{ col: number, row: number, frame: number }}
   */
  advance() {
    if (this._isComplete) {
      return this.current;
    }

    this._frame += this._direction;

    if (this._frame >= this.totalFrames) {
      switch (this.loopMode) {
        case "bounce":
          this._direction = -1;
          this._frame = this.totalFrames - 2;
          break;
        case "once":
          this._frame = this.totalFrames - 1;
          this._isComplete = true;
          break;
        case "loop":
        default:
          this._frame = 0;
          break;
      }
    } else if (this._frame < 0) {
      // Only happens in bounce mode going backward
      this._direction = 1;
      this._frame = 1;
    }

    return this.current;
  }

  /**
   * Reset sequencer to first frame
   */
  reset() {
    this._frame = 0;
    this._direction = 1;
    this._isComplete = false;
  }

  /**
   * Jump to a specific frame
   * @param {number} frame
   */
  seekTo(frame) {
    this._frame = Math.max(0, Math.min(frame, this.totalFrames - 1));
    this._isComplete = false;
  }

  /**
   * Set playback order (rebuilds sequence if needed)
   * @param {string} order - 'sequential' | 'spiral' | 'diagonal' | 'random'
   */
  setOrder(order) {
    this.order = order;
    this._frame = 0;
    this._isComplete = false;
    if (order === "sequential") {
      this._sequence = null;
    } else {
      this._buildSequence();
    }
  }

  /**
   * Build pre-computed frame sequence for non-sequential orders
   * @private
   */
  _buildSequence() {
    const g = this.gridSize;

    switch (this.order) {
      case "spiral":
        this._sequence = this._buildSpiral(g);
        break;
      case "diagonal":
        this._sequence = this._buildDiagonal(g);
        break;
      case "random":
        this._sequence = this._buildRandom(g);
        break;
      default:
        this._sequence = null;
    }

    // Trim or repeat to match totalFrames
    if (this._sequence) {
      while (this._sequence.length < this.totalFrames) {
        this._sequence = this._sequence.concat(this._sequence);
      }
      this._sequence = this._sequence.slice(0, this.totalFrames);
    }
  }

  /**
   * Build spiral traversal of the grid
   * @private
   * @param {number} g - Grid size
   * @returns {Array<{col: number, row: number}>}
   */
  _buildSpiral(g) {
    const result = [];
    let top = 0,
      bottom = g - 1,
      left = 0,
      right = g - 1;

    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) {
        result.push({ col: c, row: top });
      }
      top++;
      for (let r = top; r <= bottom; r++) {
        result.push({ col: right, row: r });
      }
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) {
          result.push({ col: c, row: bottom });
        }
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) {
          result.push({ col: left, row: r });
        }
        left++;
      }
    }

    return result;
  }

  /**
   * Build diagonal traversal of the grid
   * @private
   * @param {number} g - Grid size
   * @returns {Array<{col: number, row: number}>}
   */
  _buildDiagonal(g) {
    const result = [];
    for (let d = 0; d < 2 * g - 1; d++) {
      const startRow = d < g ? 0 : d - g + 1;
      const endRow = d < g ? d : g - 1;
      for (let r = startRow; r <= endRow; r++) {
        result.push({ col: d - r, row: r });
      }
    }
    return result;
  }

  /**
   * Build shuffled random traversal of the grid
   * @private
   * @param {number} g - Grid size
   * @returns {Array<{col: number, row: number}>}
   */
  _buildRandom(g) {
    const result = [];
    for (let r = 0; r < g; r++) {
      for (let c = 0; c < g; c++) {
        result.push({ col: c, row: r });
      }
    }
    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

window.OGODFrameSequencer = OGODFrameSequencer;
