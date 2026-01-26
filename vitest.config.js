/**
 * Vitest Configuration
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test directory
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],

    // Environment for DOM testing
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/unit/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['js/3d/**/*.js'],
      exclude: ['js/3d/shaders/**', 'js/3d/**/vendor/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },

    // Global timeout
    testTimeout: 10000,

    // Reporter
    reporter: ['verbose'],
  },
});
