/**
 * @file OGODImageLoader.js
 * @description Image loading and management for OGOD animations.
 * Handles loading source images, format filtering, and track-to-image lookup.
 */

"use strict";

/**
 * OGODImageLoader - Image loading and analysis for OGOD
 * @class
 */
class OGODImageLoader {
  constructor() {
    /** @type {HTMLImageElement|null} */
    this._currentImage = null;
    /** @type {string|null} */
    this._currentSrc = null;

    // Non-web formats to filter out
    this._excludedExtensions = [".psd", ".ai", ".eps", ".tiff", ".tif", ".bmp"];
  }

  /**
   * Get the source image path for a given track number
   * @param {number} trackNumber - Track number (1-29)
   * @returns {string|null} Image path relative to site root, or null if not found
   */
  getTrackImagePath(trackNumber) {
    const config =
      typeof ETCETER4_CONFIG !== "undefined" ? ETCETER4_CONFIG : {};
    const tracks = config.ogodTracks || {};
    const track = tracks[trackNumber];

    if (track && track.sourceImage) {
      return track.sourceImage;
    }

    return null;
  }

  /**
   * Check if a file extension is a web-safe image format
   * @param {string} src - Image source path
   * @returns {boolean}
   */
  isWebFormat(src) {
    const lower = src.toLowerCase();
    return !this._excludedExtensions.some((ext) => lower.endsWith(ext));
  }

  /**
   * Load an image from a URL or file path
   * @param {string} src - Image source URL/path
   * @returns {Promise<HTMLImageElement>}
   */
  load(src) {
    // Return cached image if same source
    if (this._currentImage && this._currentSrc === src) {
      return Promise.resolve(this._currentImage);
    }

    if (!this.isWebFormat(src)) {
      return Promise.reject(new Error(`Unsupported image format: ${src}`));
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Dispose previous image reference
        this._dispose();
        this._currentImage = img;
        this._currentSrc = src;
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  /**
   * Load the source image for a specific track
   * @param {number} trackNumber - Track number (1-29)
   * @returns {Promise<HTMLImageElement>}
   */
  loadTrack(trackNumber) {
    const path = this.getTrackImagePath(trackNumber);
    if (!path) {
      return Promise.reject(
        new Error(`No source image configured for track ${trackNumber}`),
      );
    }
    return this.load(path);
  }

  /**
   * Load from an existing HTMLImageElement (for backward compat with standalone pages)
   * @param {HTMLImageElement} imgElement - Already-loaded image element
   * @returns {Promise<HTMLImageElement>}
   */
  loadFromElement(imgElement) {
    return new Promise((resolve, reject) => {
      if (imgElement.complete && imgElement.naturalWidth > 0) {
        this._dispose();
        this._currentImage = imgElement;
        this._currentSrc = imgElement.src;
        resolve(imgElement);
        return;
      }

      imgElement.onload = () => {
        this._dispose();
        this._currentImage = imgElement;
        this._currentSrc = imgElement.src;
        resolve(imgElement);
      };

      imgElement.onerror = () => {
        reject(new Error(`Failed to load image element: ${imgElement.src}`));
      };
    });
  }

  /**
   * Get the currently loaded image
   * @returns {HTMLImageElement|null}
   */
  get image() {
    return this._currentImage;
  }

  /**
   * Analyze an image to extract dominant colors and a luminance map.
   * Used by the generative renderer for seed data.
   * @param {HTMLImageElement} [image] - Image to analyze (defaults to current)
   * @returns {{ dominantColors: Array<{r:number,g:number,b:number}>, luminanceMap: Float32Array, avgLuminance: number }}
   */
  analyzeImage(image) {
    const img = image || this._currentImage;
    if (!img) {
      return {
        dominantColors: [],
        luminanceMap: new Float32Array(0),
        avgLuminance: 0.5,
      };
    }

    // Downsample for performance
    const sampleSize = 64;
    const canvas = document.createElement("canvas");
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    const pixelCount = sampleSize * sampleSize;

    // Build color histogram (quantize to 4-bit per channel)
    const colorMap = {};
    const luminanceMap = new Float32Array(pixelCount);
    let totalLuminance = 0;

    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      // Luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      luminanceMap[i] = lum;
      totalLuminance += lum;

      // Quantize color to reduce palette
      const qr = (r >> 4) << 4;
      const qg = (g >> 4) << 4;
      const qb = (b >> 4) << 4;
      const key = `${qr},${qg},${qb}`;
      if (!colorMap[key]) {
        colorMap[key] = { r: qr, g: qg, b: qb, count: 0 };
      }
      colorMap[key].count++;
    }

    // Sort by frequency, take top 8 dominant colors
    const dominantColors = Object.values(colorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(({ r, g, b }) => ({ r: r / 255, g: g / 255, b: b / 255 }));

    return {
      dominantColors,
      luminanceMap,
      avgLuminance: totalLuminance / pixelCount,
    };
  }

  /**
   * Dispose of loaded image resources
   * @private
   */
  _dispose() {
    this._currentImage = null;
    this._currentSrc = null;
  }

  /**
   * Public dispose method
   */
  dispose() {
    this._dispose();
  }
}

window.OGODImageLoader = OGODImageLoader;
