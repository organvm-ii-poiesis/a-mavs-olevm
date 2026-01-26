/**
 * @file tests/benchmarks/performance.js
 * @description Performance benchmarking utilities for OGOD 3D experience
 * Monitors FPS, memory usage, draw calls, and audio latency
 */

/**
 * Performance Monitor - Tracks rendering performance metrics
 * @class
 */
class PerformanceMonitor {
  /**
   * @param {Object} options - Configuration options
   * @param {number} [options.sampleSize=60] - Number of frames to average
   * @param {Function} [options.onUpdate] - Callback with metrics each frame
   * @param {boolean} [options.logToConsole=false] - Log metrics to console
   */
  constructor(options = {}) {
    this.sampleSize = options.sampleSize || 60;
    this.onUpdate = options.onUpdate || null;
    this.logToConsole = options.logToConsole || false;

    // Frame timing
    this.frameTimes = [];
    this.lastFrameTime = performance.now();

    // Memory tracking (if available)
    this.memoryReadings = [];

    // Draw call tracking
    this.drawCalls = 0;
    this.triangles = 0;

    // Audio latency
    this.audioLatencies = [];

    // Running state
    this.isRunning = false;
    this.frameCount = 0;

    // Bind methods
    this._onFrame = this._onFrame.bind(this);
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this._onFrame();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Frame callback
   * @private
   */
  _onFrame() {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Track frame time
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }

    // Track memory if available
    if (performance.memory) {
      this.memoryReadings.push({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        timestamp: now,
      });

      // Keep last 5 minutes of readings
      const fiveMinutesAgo = now - 300000;
      this.memoryReadings = this.memoryReadings.filter((r) => r.timestamp > fiveMinutesAgo);
    }

    this.frameCount++;

    // Calculate metrics
    const metrics = this.getMetrics();

    // Callback
    if (this.onUpdate) {
      this.onUpdate(metrics);
    }

    // Log to console periodically
    if (this.logToConsole && this.frameCount % 60 === 0) {
      console.log('Performance Metrics:', metrics);
    }

    requestAnimationFrame(this._onFrame);
  }

  /**
   * Get current performance metrics
   * @returns {Object}
   */
  getMetrics() {
    // Calculate FPS
    const avgFrameTime =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgFrameTime;

    // Calculate frame time stats
    const sortedTimes = [...this.frameTimes].sort((a, b) => a - b);
    const p99FrameTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    const minFrameTime = sortedTimes[0] || 0;
    const maxFrameTime = sortedTimes[sortedTimes.length - 1] || 0;

    // Memory stats
    let memoryMB = 0;
    let memoryGrowthRate = 0;
    if (this.memoryReadings.length > 0) {
      const latest = this.memoryReadings[this.memoryReadings.length - 1];
      memoryMB = latest.usedJSHeapSize / (1024 * 1024);

      // Calculate growth rate over last minute
      if (this.memoryReadings.length > 1) {
        const oneMinuteAgo = performance.now() - 60000;
        const oldReadings = this.memoryReadings.filter(
          (r) => r.timestamp < oneMinuteAgo
        );
        if (oldReadings.length > 0) {
          const oldMemory = oldReadings[oldReadings.length - 1].usedJSHeapSize;
          const timeDiff =
            (latest.timestamp - oldReadings[oldReadings.length - 1].timestamp) / 1000;
          memoryGrowthRate =
            ((latest.usedJSHeapSize - oldMemory) / (1024 * 1024)) / timeDiff;
        }
      }
    }

    return {
      fps: Math.round(fps * 10) / 10,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      p99FrameTime: Math.round(p99FrameTime * 100) / 100,
      minFrameTime: Math.round(minFrameTime * 100) / 100,
      maxFrameTime: Math.round(maxFrameTime * 100) / 100,
      frameCount: this.frameCount,
      memoryMB: Math.round(memoryMB * 10) / 10,
      memoryGrowthRateMBps: Math.round(memoryGrowthRate * 1000) / 1000,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
    };
  }

  /**
   * Set draw call count (call from renderer)
   * @param {number} count
   */
  setDrawCalls(count) {
    this.drawCalls = count;
  }

  /**
   * Set triangle count (call from renderer)
   * @param {number} count
   */
  setTriangles(count) {
    this.triangles = count;
  }

  /**
   * Record audio latency measurement
   * @param {number} latencyMs
   */
  recordAudioLatency(latencyMs) {
    this.audioLatencies.push(latencyMs);
    if (this.audioLatencies.length > 100) {
      this.audioLatencies.shift();
    }
  }

  /**
   * Get audio latency statistics
   * @returns {Object}
   */
  getAudioLatencyStats() {
    if (this.audioLatencies.length === 0) {
      return { avg: 0, min: 0, max: 0, p99: 0 };
    }

    const sorted = [...this.audioLatencies].sort((a, b) => a - b);
    const avg = this.audioLatencies.reduce((a, b) => a + b, 0) / this.audioLatencies.length;

    return {
      avg: Math.round(avg * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Reset all measurements
   */
  reset() {
    this.frameTimes = [];
    this.memoryReadings = [];
    this.audioLatencies = [];
    this.frameCount = 0;
    this.drawCalls = 0;
    this.triangles = 0;
  }

  /**
   * Generate performance report
   * @returns {Object}
   */
  generateReport() {
    const metrics = this.getMetrics();
    const audioStats = this.getAudioLatencyStats();

    // Determine pass/fail based on thresholds
    const fpsTarget = 60;
    const memoryLeakThreshold = 0.5; // MB per second
    const maxFrameTimeThreshold = 33.33; // 30fps minimum

    const issues = [];

    if (metrics.fps < fpsTarget * 0.9) {
      issues.push(`FPS below target: ${metrics.fps} (target: ${fpsTarget})`);
    }

    if (metrics.memoryGrowthRateMBps > memoryLeakThreshold) {
      issues.push(
        `Possible memory leak: ${metrics.memoryGrowthRateMBps} MB/s growth`
      );
    }

    if (metrics.maxFrameTime > maxFrameTimeThreshold) {
      issues.push(`Frame spike detected: ${metrics.maxFrameTime}ms`);
    }

    return {
      metrics,
      audioLatency: audioStats,
      issues,
      passed: issues.length === 0,
      summary: issues.length === 0
        ? 'All performance targets met'
        : `${issues.length} issue(s) detected`,
    };
  }
}

/**
 * Three.js Renderer Stats Wrapper
 * Extracts draw call and triangle counts from renderer
 */
class RendererStatsWrapper {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {PerformanceMonitor} monitor
   */
  constructor(renderer, monitor) {
    this.renderer = renderer;
    this.monitor = monitor;
  }

  /**
   * Update stats from renderer info
   */
  update() {
    if (this.renderer && this.renderer.info) {
      this.monitor.setDrawCalls(this.renderer.info.render.calls);
      this.monitor.setTriangles(this.renderer.info.render.triangles);
    }
  }
}

/**
 * Run a benchmark test
 * @param {Object} options
 * @param {number} options.duration - Test duration in milliseconds
 * @param {Function} options.setup - Setup function (returns cleanup function)
 * @returns {Promise<Object>} - Benchmark results
 */
async function runBenchmark(options = {}) {
  const { duration = 10000, setup } = options;

  const monitor = new PerformanceMonitor();
  let cleanup = null;

  return new Promise((resolve) => {
    // Run setup
    if (setup) {
      cleanup = setup(monitor);
    }

    // Start monitoring
    monitor.start();

    // Run for specified duration
    setTimeout(() => {
      monitor.stop();
      const report = monitor.generateReport();

      // Cleanup
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }

      resolve(report);
    }, duration);
  });
}

// Export for use in tests and browser
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  window.RendererStatsWrapper = RendererStatsWrapper;
  window.runBenchmark = runBenchmark;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PerformanceMonitor,
    RendererStatsWrapper,
    runBenchmark,
  };
}
