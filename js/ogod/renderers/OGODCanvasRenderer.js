/**
 * @file OGODCanvasRenderer.js
 * @description Canvas 2D faithful renderer for OGOD animations.
 * Pixel-identical recreation of the original CSS offset technique.
 * Draws grid cells from a source image onto a full-screen canvas.
 */

"use strict";

/**
 * OGODCanvasRenderer - Faithful Canvas 2D renderer
 * @class
 */
class OGODCanvasRenderer {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - Target canvas element
   * @param {number} [options.gridSize=21] - Grid dimension
   */
  constructor(options = {}) {
    if (!options.canvas) {
      throw new Error("OGODCanvasRenderer requires a canvas element");
    }

    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.gridSize = options.gridSize || 21;

    /** @type {HTMLImageElement|null} */
    this._image = null;

    // Cached cell dimensions (from source image)
    this._cellW = 0;
    this._cellH = 0;

    // Bind resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);
    this._onResize();
  }

  /**
   * Set the source image for rendering
   * @param {HTMLImageElement} image
   */
  setImage(image) {
    this._image = image;
    this._cellW = image.naturalWidth / this.gridSize;
    this._cellH = image.naturalHeight / this.gridSize;
  }

  /**
   * Render a specific grid cell to fill the canvas
   * @param {number} col - Column index (0-based)
   * @param {number} row - Row index (0-based)
   */
  render(col, row) {
    if (!this._image || !this.ctx) {
      return;
    }

    const { canvas, ctx, _cellW, _cellH } = this;

    // Clear and draw the grid cell scaled to fill the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      this._image,
      col * _cellW, // Source x
      row * _cellH, // Source y
      _cellW, // Source width
      _cellH, // Source height
      0, // Dest x
      0, // Dest y
      canvas.width, // Dest width
      canvas.height, // Dest height
    );
  }

  /**
   * Render a static frame (e.g., for reduced-motion fallback)
   * Shows the center cell of the grid
   */
  renderStatic() {
    const center = Math.floor(this.gridSize / 2);
    this.render(center, center);
  }

  /**
   * Handle window resize - match canvas to viewport
   * @private
   */
  _onResize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;

    // Set canvas pixel dimensions to match display size
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /**
   * Get renderer type identifier
   * @returns {string}
   */
  get type() {
    return "faithful";
  }

  /**
   * Dispose of renderer resources
   */
  dispose() {
    window.removeEventListener("resize", this._onResize);
    this._image = null;
    this.ctx = null;
  }
}

window.OGODCanvasRenderer = OGODCanvasRenderer;
