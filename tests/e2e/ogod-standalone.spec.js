// @ts-check
/**
 * @file tests/e2e/ogod-standalone.spec.js
 * @description End-to-end tests for the standalone OGOD animation pages (ogod/*.html)
 * Tests page loading, canvas creation, mode switching, and track navigation.
 *
 * NOTE: These tests require WebGL/GPU support and are skipped in headless browsers
 * and CI environments. Run with `npx playwright test tests/e2e/ogod-standalone.spec.js --headed`
 * to execute locally with GPU support.
 */

import { test, expect } from '@playwright/test';

// Skip all tests in this file when running headless or in CI
// WebGL requires GPU access which is not available in headless browsers.
test.beforeEach(async ({}, testInfo) => {
  const isCI = !!process.env.CI;
  const projectUse = testInfo.project.use || {};
  const isHeadless = projectUse.headless !== false;

  if (isCI || isHeadless) {
    test.skip(
      true,
      'WebGL/canvas tests require headed browser with GPU access. Run with --headed flag locally.'
    );
  }
});

/**
 * Collect console errors from page
 * @param {import('@playwright/test').Page} page
 * @returns {string[]}
 */
function setupErrorCollection(page) {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  return errors;
}

/**
 * Filter out expected/non-critical errors
 * @param {string[]} errors
 * @returns {string[]}
 */
function filterCriticalErrors(errors) {
  return errors.filter(
    e =>
      !e.includes('THREE') &&
      !e.includes('deprecated') &&
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource') &&
      !e.includes('net::ERR') &&
      !e.includes('Tone') &&
      !e.includes('AudioContext')
  );
}

/**
 * Wait for the OGOD animation engine to initialize
 * @param {import('@playwright/test').Page} page
 */
async function waitForEngineReady(page) {
  // Wait for the canvas to be created by the animation engine
  await page.waitForSelector('canvas', { timeout: 10000 });
  // Give the engine time to initialize and render first frame
  await page.waitForTimeout(1500);
}

test.describe('OGOD Standalone Pages', () => {
  test.describe('Page Loading', () => {
    test('loads Track I without critical JavaScript errors', async ({
      page,
    }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      const criticalErrors = filterCriticalErrors(errors);
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    });

    test('creates canvas element for animation', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();

      // Canvas should have dimensions
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    });

    test('source image element exists', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const sourceImg = await page.$('#bgi');
      expect(sourceImg).not.toBeNull();
    });

    test('controls bar is visible', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      const controls = await page.$('.ogod-controls');
      expect(controls).not.toBeNull();

      const isVisible = await controls.isVisible();
      expect(isVisible).toBe(true);
    });
  });

  test.describe('Mode Switcher', () => {
    test('TKOL mode is selected by default', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      const selectedValue = await page.$eval(
        '.ogod-mode-select',
        el => /** @type {HTMLSelectElement} */ (el).value
      );
      expect(selectedValue).toBe('tkol');
    });

    test('mode switcher contains all four modes', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const options = await page.$$eval('.ogod-mode-select option', opts =>
        opts.map(o => /** @type {HTMLOptionElement} */ (o).value)
      );

      expect(options).toContain('faithful');
      expect(options).toContain('enhanced');
      expect(options).toContain('generative');
      expect(options).toContain('tkol');
      expect(options.length).toBe(4);
    });

    test('switching to faithful mode does not produce errors', async ({
      page,
    }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      await page.selectOption('.ogod-mode-select', 'faithful');
      await page.waitForTimeout(1000);

      const criticalErrors = filterCriticalErrors(errors);
      expect(criticalErrors.length).toBe(0);
    });

    test('switching to enhanced mode does not produce errors', async ({
      page,
    }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      await page.selectOption('.ogod-mode-select', 'enhanced');
      await page.waitForTimeout(1000);

      const criticalErrors = filterCriticalErrors(errors);
      expect(criticalErrors.length).toBe(0);
    });

    test('switching to generative mode does not produce errors', async ({
      page,
    }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      await page.selectOption('.ogod-mode-select', 'generative');
      await page.waitForTimeout(1000);

      const criticalErrors = filterCriticalErrors(errors);
      expect(criticalErrors.length).toBe(0);
    });

    test('cycling through all modes preserves canvas', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      const modes = ['faithful', 'enhanced', 'generative', 'tkol'];

      for (const mode of modes) {
        await page.selectOption('.ogod-mode-select', mode);
        await page.waitForTimeout(800);

        // Canvas should still exist after each switch
        const canvas = await page.$('canvas');
        expect(canvas).not.toBeNull();
      }
    });
  });

  test.describe('Track Navigation', () => {
    test('next-track link navigates to Track II', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const nextLink = await page.$('a.ogod-nav');
      expect(nextLink).not.toBeNull();

      const href = await nextLink.getAttribute('href');
      expect(href).toBe('II.html');
    });

    test('clicking next-track link loads new page', async ({ page }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod/I.html');
      await waitForEngineReady(page);

      await page.click('a.ogod-nav');
      await page.waitForURL('**/ogod/II.html', { timeout: 10000 });

      await waitForEngineReady(page);

      // New page should load without critical errors
      const criticalErrors = filterCriticalErrors(errors);
      expect(criticalErrors.length).toBe(0);

      // Canvas should exist on the new page
      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();
    });

    test('SPA link points to main site', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const spaLink = await page.$('.ogod-spa-link');
      expect(spaLink).not.toBeNull();

      const href = await spaLink.getAttribute('href');
      expect(href).toContain('ogod=1');
    });
  });

  test.describe('Audio Controls', () => {
    test('audio element exists with source', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const audio = await page.$('.ogod-controls audio');
      expect(audio).not.toBeNull();

      const source = await page.$('.ogod-controls audio source');
      expect(source).not.toBeNull();

      const src = await source.getAttribute('src');
      expect(src).toContain('.mp3');
    });
  });

  test.describe('Track Label', () => {
    test('displays correct track number', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod/I.html');

      const label = await page.textContent('.ogod-track-label');
      expect(label.trim()).toBe('I');
    });
  });
});
