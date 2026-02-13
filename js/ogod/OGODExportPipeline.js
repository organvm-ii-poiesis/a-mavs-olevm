/**
 * @file OGODExportPipeline.js
 * @description Browser-based frame capture and export orchestrator for OGOD animations.
 * Renders frames offline at export resolution using any renderer mode,
 * then streams them as PNG downloads or packages via JSZip.
 *
 * Memory management: frames stream to download immediately (not stored
 * in memory) to stay within 16GB RAM. Processes one track at a time.
 */

'use strict';

/**
 * OGODExportPipeline - Frame capture and export for OGOD animations
 * @class
 */
class OGODExportPipeline {
  /**
   * @param {Object} options
   * @param {OGODAnimationEngine} options.engine - Active animation engine instance
   * @param {number} [options.width=1920] - Export width in pixels
   * @param {number} [options.height=1080] - Export height in pixels
   * @param {number} [options.fps=30] - Frames per second
   */
  constructor(options = {}) {
    if (!options.engine) {
      throw new Error('OGODExportPipeline requires an engine instance');
    }

    this.engine = options.engine;
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.fps = options.fps || 30;

    this._isCapturing = false;
    this._aborted = false;
  }

  /**
   * Capture a single high-resolution frame at the given grid position
   * @param {number} col - Grid column
   * @param {number} row - Grid row
   * @returns {Promise<Blob>} PNG blob of the rendered frame
   */
  async captureFrame(col, row) {
    const renderer = this.engine.renderer;
    const canvas = this.engine.canvas;
    if (!renderer || !canvas) {
      throw new Error('Engine not initialized');
    }

    // Save original size
    const origWidth = canvas.width;
    const origHeight = canvas.height;

    // Resize to export dimensions
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;

    // Trigger renderer resize if it has one
    if (renderer._onResize) {
      renderer._onResize();
    }

    // Render the frame
    renderer.render(col, row);

    // Capture as blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });

    // Restore original size
    canvas.width = origWidth;
    canvas.height = origHeight;
    canvas.style.width = '';
    canvas.style.height = '';
    if (renderer._onResize) {
      renderer._onResize();
    }

    return blob;
  }

  /**
   * Capture a sequence of frames, streaming each via callback.
   * Does not hold all frames in memory simultaneously.
   * @param {Object} options
   * @param {number} [options.totalFrames] - Number of frames to capture (default: gridSize^2)
   * @param {Function} [options.onFrame] - Callback called with (blob, frameIndex, total)
   * @param {Function} [options.onProgress] - Progress callback (0-1)
   * @returns {Promise<Array<Blob>>} Array of PNG blobs (only if no onFrame callback)
   */
  async captureSequence(options = {}) {
    const gridSize = this.engine.sequencer
      ? this.engine.sequencer._gridSize || 21
      : 21;
    const totalFrames = options.totalFrames || gridSize * gridSize;
    const onFrame = options.onFrame || null;
    const onProgress = options.onProgress || null;

    this._isCapturing = true;
    this._aborted = false;

    const frames = onFrame ? null : [];

    for (let i = 0; i < totalFrames; i++) {
      if (this._aborted) {
        break;
      }

      const col = i % gridSize;
      const row = Math.floor(i / gridSize);

      const blob = await this.captureFrame(col, row);

      if (onFrame) {
        onFrame(blob, i, totalFrames);
      } else {
        frames.push(blob);
      }

      if (onProgress) {
        onProgress((i + 1) / totalFrames);
      }

      // Yield to browser between frames to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    this._isCapturing = false;
    return frames;
  }

  /**
   * Abort an in-progress capture sequence
   */
  abort() {
    this._aborted = true;
  }

  /**
   * Whether a capture is currently in progress
   * @returns {boolean}
   */
  get isCapturing() {
    return this._isCapturing;
  }

  /**
   * Download a single frame as a PNG file
   * @param {number} col - Grid column
   * @param {number} row - Grid row
   * @param {string} [filename='ogod-frame.png'] - Download filename
   */
  async downloadFrame(col, row, filename) {
    const blob = await this.captureFrame(col, row);
    const name = filename || `ogod-frame-${col}-${row}.png`;
    OGODExportPipeline._downloadBlob(blob, name);
  }

  /**
   * Package captured frames into a ZIP and trigger download.
   * Uses JSZip if available; otherwise downloads frames individually.
   * @param {Array<Blob>} frames - Array of PNG blobs
   * @param {string} [trackName='ogod'] - Base name for the ZIP/files
   */
  async downloadAsZip(frames, trackName) {
    const baseName = trackName || 'ogod';

    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      const folder = zip.folder(baseName);

      for (let i = 0; i < frames.length; i++) {
        const padded = String(i).padStart(6, '0');
        folder.file(`frame_${padded}.png`, frames[i]);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      OGODExportPipeline._downloadBlob(content, `${baseName}-frames.zip`);
    } else {
      // Fallback: download each frame individually
      console.warn(
        'OGODExportPipeline: JSZip not available, downloading frames individually'
      );
      for (let i = 0; i < frames.length; i++) {
        const padded = String(i).padStart(6, '0');
        OGODExportPipeline._downloadBlob(
          frames[i],
          `${baseName}_frame_${padded}.png`
        );
        // Small delay to avoid browser download throttling
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Generate an ffmpeg command string for assembling frames + audio into video
   * @param {number} trackNumber - OGOD track number (1-29)
   * @param {Object} [options]
   * @param {string} [options.inputPattern='frame_%06d.png'] - Frame file pattern
   * @param {string} [options.audioPath] - Path to audio file
   * @param {string} [options.outputPath] - Output video path
   * @param {number} [options.crf=18] - Video quality (lower = better, 0-51)
   * @returns {string} Complete ffmpeg command
   */
  generateFFmpegCommand(trackNumber, options = {}) {
    const padded = String(trackNumber).padStart(2, '0');
    const inputPattern = options.inputPattern || 'frame_%06d.png';
    const audioPath =
      options.audioPath ||
      `ogodtracks/${padded} ${this._romanNumeral(trackNumber)}.mp3`;
    const outputPath =
      options.outputPath ||
      `ogod-${padded}-${this._romanNumeral(trackNumber)}.mp4`;
    const crf = options.crf || 18;

    return [
      'ffmpeg',
      `-framerate ${this.fps}`,
      `-i "${inputPattern}"`,
      `-i "${audioPath}"`,
      `-c:v libx264 -crf ${crf} -pix_fmt yuv420p`,
      '-c:a aac -b:a 192k',
      '-shortest',
      `"${outputPath}"`,
    ].join(' ');
  }

  /**
   * Convert track number to Roman numeral (1-29)
   * @param {number} num
   * @returns {string}
   * @private
   */
  _romanNumeral(num) {
    const romans = [
      '',
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
      'XIII',
      'XIV',
      'XV',
      'XVI',
      'XVII',
      'XVIII',
      'XIX',
      'XX',
      'XXI',
      'XXII',
      'XXIII',
      'XXIV',
      'XXV',
      'XXVI',
      'XXVII',
      'XXVIII',
      'XXIX',
    ];
    return romans[num] || String(num);
  }

  /**
   * Trigger a file download from a Blob
   * @param {Blob} blob
   * @param {string} filename
   * @private
   */
  static _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  }
}

window.OGODExportPipeline = OGODExportPipeline;
