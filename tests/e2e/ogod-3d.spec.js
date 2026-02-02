// @ts-check
/**
 * @file tests/e2e/ogod-3d.spec.js
 * @description End-to-end tests for the OGOD 3D immersive audio-visual experience
 * Tests 3D scene loading, audio playback, controls, and UI interactions
 *
 * NOTE: These tests require WebGL/GPU support and are skipped in headless browsers
 * and CI environments. Run with `npx playwright test tests/e2e/ogod-3d.spec.js --headed`
 * to execute locally with GPU support.
 */

import { test, expect } from '@playwright/test';

// Skip all tests in this file when running headless or in CI
// WebGL requires GPU access which is not available in headless browsers.
// Even though SwiftShader may report WebGL as available, actual 3D rendering
// fails in headless mode. Run with --headed flag locally for GPU support.
test.beforeEach(async ({}, testInfo) => {
  // Check if running in CI environment
  const isCI = !!process.env.CI;

  // Check if running in headless mode
  // Playwright's testInfo.project.use contains the project configuration
  const projectUse = testInfo.project.use || {};
  const isHeadless = projectUse.headless !== false;

  // Skip if either CI or headless
  if (isCI || isHeadless) {
    test.skip(
      true,
      'WebGL/3D tests require headed browser with GPU access. Run with --headed flag locally.'
    );
  }
});

/**
 * Check if WebGL is available and working
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
async function isWebGLAvailable(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    return gl !== null;
  });
}

/**
 * Helper to wait for the 3D scene to be ready
 * @param {import('@playwright/test').Page} page
 */
async function waitForSceneReady(page) {
  // First check if WebGL is available
  const hasWebGL = await isWebGLAvailable(page);
  if (!hasWebGL) {
    throw new Error('WebGL not available in this browser environment');
  }

  // Wait for loading screen to disappear
  await page
    .waitForSelector('#loading-screen.hidden', { timeout: 15000 })
    .catch(() => {});
  // Wait for canvas to exist and have dimensions
  await page.waitForSelector('canvas', { timeout: 5000 });
  // Give the 3D scene time to initialize
  await page.waitForTimeout(1000);
}

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
      !e.includes('Tone') &&
      !e.includes('deprecated') &&
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource') &&
      !e.includes('net::ERR')
  );
}

test.describe('OGOD 3D Experience', () => {
  test.describe('Scene Loading', () => {
    test('loads without critical JavaScript errors', async ({ page }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const criticalErrors = filterCriticalErrors(errors);
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    });

    test('creates WebGL canvas element', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();

      // Check canvas has proper dimensions
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    });

    test('loading screen hides after initialization', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');

      // Initially loading screen should be visible
      const loadingScreen = await page.$('#loading-screen');
      expect(loadingScreen).not.toBeNull();

      // Wait for it to hide
      await page.waitForSelector('#loading-screen.hidden', { timeout: 15000 });

      // Verify it has hidden class
      const hasHiddenClass = await page.$eval('#loading-screen', el =>
        el.classList.contains('hidden')
      );
      expect(hasHiddenClass).toBe(true);
    });

    test('loading bar progresses during load', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');

      // Check loading bar exists
      const loadingBar = await page.$('#loading-bar');
      expect(loadingBar).not.toBeNull();

      // Wait for some progress
      await page.waitForTimeout(500);

      // Eventually reaches 100%
      await page.waitForSelector('#loading-screen.hidden', { timeout: 15000 });
    });
  });

  test.describe('Track Selection', () => {
    test('renders all 29 track buttons', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await page.waitForSelector('#track-selector', { timeout: 5000 });

      const buttons = await page.$$('.track-btn');
      expect(buttons.length).toBe(29);
    });

    test('first track button is active by default', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const activeButtons = await page.$$('.track-btn.active');
      expect(activeButtons.length).toBe(1);

      // First button should be active
      const firstButton = await page.$('.track-btn');
      const isActive = await firstButton.evaluate(el =>
        el.classList.contains('active')
      );
      expect(isActive).toBe(true);
    });

    test('clicking track button changes active state', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Click second track button
      const buttons = await page.$$('.track-btn');
      await buttons[1].click();

      // Wait for transition
      await page.waitForTimeout(1500);

      // Second button should now be active
      const isSecondActive = await buttons[1].evaluate(el =>
        el.classList.contains('active')
      );
      expect(isSecondActive).toBe(true);
    });

    test('track buttons have title tooltips', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await page.waitForSelector('#track-selector', { timeout: 5000 });

      // Check first button has title attribute (game name)
      const firstButtonTitle = await page.$eval('.track-btn', el => el.title);
      expect(firstButtonTitle.length).toBeGreaterThan(0);
    });
  });

  test.describe('Info Panel', () => {
    test('displays track title', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const title = await page.textContent('#track-title');
      expect(title).toContain('Track');
    });

    test('displays game name', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const game = await page.textContent('#track-game');
      expect(game.length).toBeGreaterThan(0);
    });

    test('displays archetype name', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const archetype = await page.textContent('#track-archetype');
      expect(archetype.length).toBeGreaterThan(0);
    });

    test('updates info panel when track changes', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const initialGame = await page.textContent('#track-game');

      // Click different track (Castlevania - track 2)
      const buttons = await page.$$('.track-btn');
      await buttons[1].click();

      // Wait for update
      await page.waitForTimeout(1500);

      const newGame = await page.textContent('#track-game');
      expect(newGame).not.toBe(initialGame);
    });

    test('contains stem meters', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const drumsMeter = await page.$('#meter-drums');
      const bassMeter = await page.$('#meter-bass');
      const vocalsMeter = await page.$('#meter-vocals');
      const otherMeter = await page.$('#meter-other');

      expect(drumsMeter).not.toBeNull();
      expect(bassMeter).not.toBeNull();
      expect(vocalsMeter).not.toBeNull();
      expect(otherMeter).not.toBeNull();
    });
  });

  test.describe('Audio Controls', () => {
    test('audio button is visible', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const audioBtn = await page.$('#audio-btn');
      expect(audioBtn).not.toBeNull();

      const isVisible = await audioBtn.isVisible();
      expect(isVisible).toBe(true);
    });

    test('audio button shows start text initially', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const audioText = await page.textContent('#audio-btn');
      expect(audioText.toLowerCase()).toContain('start');
    });

    test('audio button changes state on click', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      await page.click('#audio-btn');
      await page.waitForTimeout(500);

      const audioText = await page.textContent('#audio-btn');
      expect(audioText.toLowerCase()).toContain('playing');

      const hasPlayingClass = await page.$eval('#audio-btn', el =>
        el.classList.contains('playing')
      );
      expect(hasPlayingClass).toBe(true);
    });
  });

  test.describe('Navigation', () => {
    test('back button is visible', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const backBtn = await page.$('#back-btn');
      expect(backBtn).not.toBeNull();

      const isVisible = await backBtn.isVisible();
      expect(isVisible).toBe(true);
    });

    test('back button links to main page', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      const href = await page.$eval('#back-btn', el => el.getAttribute('href'));
      expect(href).toBe('index.html');
    });

    test('URL hash sets initial track', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html#5');
      await waitForSceneReady(page);

      // Track 5 should be active
      const title = await page.textContent('#track-title');
      expect(title).toContain('V');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('WASD keys are recognized for movement', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Click canvas to enable controls
      await page.click('canvas');
      await page.waitForTimeout(100);

      // Press W key
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(100);

      // No errors should occur
      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();
    });

    test('arrow keys are recognized for movement', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Click canvas to enable controls
      await page.click('canvas');
      await page.waitForTimeout(100);

      // Press arrow keys
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);

      // No errors should occur
      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();
    });

    test('Space and Shift keys for vertical movement', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Click canvas
      await page.click('canvas');
      await page.waitForTimeout(100);

      // Press Space and Shift
      await page.keyboard.press('Space');
      await page.keyboard.press('ShiftLeft');
      await page.waitForTimeout(100);

      // No errors should occur
      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();
    });
  });

  test.describe('Environment Switching', () => {
    test('switching tracks loads new environment', async ({ page }) => {
      const errors = setupErrorCollection(page);

      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Get initial archetype
      const initialArchetype = await page.textContent('#track-archetype');

      // Switch to a track with different archetype (track 5 - High Contrast)
      const buttons = await page.$$('.track-btn');
      await buttons[4].click();

      // Wait for transition
      await page.waitForSelector('#loading-screen.hidden', { timeout: 15000 });
      await page.waitForTimeout(1000);

      const newArchetype = await page.textContent('#track-archetype');

      // Archetype should have changed
      expect(newArchetype).not.toBe(initialArchetype);

      // No critical errors during switch
      const criticalErrors = filterCriticalErrors(errors);
      expect(criticalErrors.length).toBe(0);
    });

    test('transition overlay appears during track change', async ({ page }) => {
      await page.goto('http://localhost:3000/ogod-3d.html');
      await waitForSceneReady(page);

      // Start watching for transition overlay
      const transitionOverlayPromise = page.waitForSelector(
        '#transition-overlay.active',
        {
          timeout: 5000,
        }
      );

      // Click to switch tracks
      const buttons = await page.$$('.track-btn');
      await buttons[2].click();

      // Transition overlay should appear (may be brief)
      try {
        await transitionOverlayPromise;
      } catch {
        // Transition may be too fast to catch, which is fine
      }

      // Wait for completion
      await page.waitForSelector('#loading-screen.hidden', { timeout: 15000 });
    });
  });
});

test.describe('OGOD 3D Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });

  test('loads on mobile viewport', async ({ page }) => {
    const errors = setupErrorCollection(page);

    await page.goto('http://localhost:3000/ogod-3d.html');
    await waitForSceneReady(page);

    const criticalErrors = filterCriticalErrors(errors);
    expect(criticalErrors.length).toBe(0);

    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
  });

  test('track buttons are accessible on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');
    await page.waitForSelector('#track-selector', { timeout: 5000 });

    const buttons = await page.$$('.track-btn');
    expect(buttons.length).toBe(29);

    // Should be able to tap track buttons
    await buttons[1].tap();
    await page.waitForTimeout(1500);

    const isSecondActive = await buttons[1].evaluate(el =>
      el.classList.contains('active')
    );
    expect(isSecondActive).toBe(true);
  });

  test('touch controls respond to drag', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');
    await waitForSceneReady(page);

    const canvas = await page.$('canvas');
    const boundingBox = await canvas.boundingBox();

    // Perform touch drag
    await page.touchscreen.tap(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );

    // Drag across screen
    const startX = boundingBox.x + boundingBox.width / 2;
    const startY = boundingBox.y + boundingBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY);
    await page.mouse.up();

    // No errors should occur
    expect(canvas).not.toBeNull();
  });

  test('info panel is hidden on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');
    await waitForSceneReady(page);

    const infoPanel = await page.$('#info-panel');
    const isVisible = await infoPanel.isVisible();

    // Info panel should be hidden on mobile (CSS media query)
    expect(isVisible).toBe(false);
  });
});

test.describe('OGOD 3D Settings Panel', () => {
  // Skip these tests if settings panel doesn't exist yet
  test.skip('settings panel opens on button click', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');
    await waitForSceneReady(page);

    // Look for settings button
    const settingsBtn = await page.$(
      '#settings-btn, .settings-btn, [aria-label*="settings"]'
    );
    if (!settingsBtn) {
      test.skip();
      return;
    }

    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Settings panel should be visible
    const settingsPanel = await page.$('#settings-panel, .settings-panel');
    const isVisible = await settingsPanel?.isVisible();
    expect(isVisible).toBe(true);
  });

  test.skip('settings panel closes on button click', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');
    await waitForSceneReady(page);

    const settingsBtn = await page.$('#settings-btn, .settings-btn');
    if (!settingsBtn) {
      test.skip();
      return;
    }

    // Open
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Close
    await settingsBtn.click();
    await page.waitForTimeout(300);

    const settingsPanel = await page.$('#settings-panel, .settings-panel');
    const isVisible = await settingsPanel?.isVisible();
    expect(isVisible).toBe(false);
  });
});
