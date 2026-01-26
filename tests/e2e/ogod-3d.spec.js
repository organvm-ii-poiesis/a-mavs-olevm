// @ts-check
import { test, expect } from '@playwright/test';

test.describe('OGOD 3D Experience', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors = [];
    const consoleMessages = [];

    // Collect all console messages
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Collect page errors
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('http://localhost:3000/ogod-3d.html');

    // Wait for loading screen to disappear (or timeout)
    await page.waitForSelector('#loading-screen.hidden', { timeout: 10000 }).catch(() => {});

    // Wait a bit for 3D scene to initialize
    await page.waitForTimeout(3000);

    // Log all errors for debugging
    if (errors.length > 0) {
      console.log('All errors:', errors);
    }

    // Check that canvas was created - if not, show why
    const canvas = await page.$('canvas');
    if (!canvas) {
      console.log('Canvas not found. Console messages:', consoleMessages);
    }

    // Filter out expected warnings and 404s for audio stems (not yet processed)
    const criticalErrors = errors.filter(e =>
      !e.includes('THREE') &&
      !e.includes('Tone') &&
      !e.includes('deprecated') &&
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    );

    // Should have no critical JavaScript errors
    expect(criticalErrors.length).toBe(0);

    // Canvas should exist
    expect(canvas).not.toBeNull();
  });

  test('track selector buttons are rendered', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');

    // Wait for page to load
    await page.waitForSelector('#track-selector', { timeout: 5000 });

    // Check that track buttons exist (should have 29 tracks)
    const buttons = await page.$$('.track-btn');
    expect(buttons.length).toBe(29);
  });

  test('info panel shows track information', async ({ page }) => {
    await page.goto('http://localhost:3000/ogod-3d.html');

    await page.waitForSelector('#track-title', { timeout: 5000 });

    // Check info panel has content
    const title = await page.textContent('#track-title');
    const game = await page.textContent('#track-game');

    expect(title).toContain('Track');
    expect(game.length).toBeGreaterThan(0);
  });
});
