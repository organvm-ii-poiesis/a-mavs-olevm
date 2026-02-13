/**
 * @file PixelSortUtils.js
 * @description Standalone pixel-sorting algorithms extracted from OGODTKOLRenderer.
 * Shared by both the OGOD visual album renderer and GlitchTunnelSystem.
 *
 * Threshold-gated luminance sort: pixels within a luminance band are sorted;
 * pixels outside the band stay in place. Produces the characteristic long
 * vertical/horizontal streaks of the TKOL glitch aesthetic.
 */

'use strict';

const PixelSortUtils = {
  /**
   * Calculate luminance (ITU-R BT.601) from 0-255 RGB values
   * @param {number} r - Red 0-255
   * @param {number} g - Green 0-255
   * @param {number} b - Blue 0-255
   * @returns {number} Luminance 0-1
   */
  luminance(r, g, b) {
    return 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);
  },

  /**
   * Threshold-gated column sort by luminance.
   * Pixels within the luminance band are sorted; pixels outside stay in place.
   * @param {Uint8ClampedArray} data - RGBA pixel data
   * @param {number} w - Image width
   * @param {number} h - Image height
   * @param {Object} [opts]
   * @param {number} [opts.thresholdLow=0.05] - Lower luminance bound
   * @param {number} [opts.thresholdHigh=0.95] - Upper luminance bound
   * @param {number} [opts.interpolation=1.0] - Blend factor 0-1 (1 = fully sorted)
   */
  sortColumns(data, w, h, opts = {}) {
    const lo = opts.thresholdLow ?? 0.05;
    const hi = opts.thresholdHigh ?? 0.95;
    const interp = opts.interpolation ?? 1.0;

    for (let x = 0; x < w; x++) {
      const column = [];
      for (let y = 0; y < h; y++) {
        const idx = (y * w + x) * 4;
        column.push({
          idx,
          lum: this.luminance(data[idx], data[idx + 1], data[idx + 2]),
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3],
        });
      }

      let spanStart = -1;
      for (let i = 0; i <= column.length; i++) {
        const inBand =
          i < column.length && column[i].lum >= lo && column[i].lum <= hi;
        if (inBand && spanStart === -1) {
          spanStart = i;
        } else if (!inBand && spanStart !== -1) {
          const span = column.slice(spanStart, i);
          span.sort((a, b) => a.lum - b.lum);

          for (let j = 0; j < span.length; j++) {
            const origIdx = column[spanStart + j].idx;
            const sorted = span[j];
            data[origIdx] = Math.round(
              data[origIdx] * (1 - interp) + sorted.r * interp
            );
            data[origIdx + 1] = Math.round(
              data[origIdx + 1] * (1 - interp) + sorted.g * interp
            );
            data[origIdx + 2] = Math.round(
              data[origIdx + 2] * (1 - interp) + sorted.b * interp
            );
          }
          spanStart = -1;
        }
      }
    }
  },

  /**
   * Threshold-gated row sort by luminance.
   * @param {Uint8ClampedArray} data - RGBA pixel data
   * @param {number} w - Image width
   * @param {number} h - Image height
   * @param {Object} [opts]
   * @param {number} [opts.thresholdLow=0.05]
   * @param {number} [opts.thresholdHigh=0.95]
   * @param {number} [opts.interpolation=1.0]
   */
  sortRows(data, w, h, opts = {}) {
    const lo = opts.thresholdLow ?? 0.05;
    const hi = opts.thresholdHigh ?? 0.95;
    const interp = opts.interpolation ?? 1.0;

    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        row.push({
          idx,
          lum: this.luminance(data[idx], data[idx + 1], data[idx + 2]),
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3],
        });
      }

      let spanStart = -1;
      for (let i = 0; i <= row.length; i++) {
        const inBand = i < row.length && row[i].lum >= lo && row[i].lum <= hi;
        if (inBand && spanStart === -1) {
          spanStart = i;
        } else if (!inBand && spanStart !== -1) {
          const span = row.slice(spanStart, i);
          span.sort((a, b) => a.lum - b.lum);

          for (let j = 0; j < span.length; j++) {
            const origIdx = row[spanStart + j].idx;
            const sorted = span[j];
            data[origIdx] = Math.round(
              data[origIdx] * (1 - interp) + sorted.r * interp
            );
            data[origIdx + 1] = Math.round(
              data[origIdx + 1] * (1 - interp) + sorted.g * interp
            );
            data[origIdx + 2] = Math.round(
              data[origIdx + 2] * (1 - interp) + sorted.b * interp
            );
          }
          spanStart = -1;
        }
      }
    }
  },
};

// Make available globally
window.PixelSortUtils = PixelSortUtils;
