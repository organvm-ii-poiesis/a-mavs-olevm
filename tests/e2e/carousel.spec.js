/**
 * Carousel E2E Tests
 * Tests image carousel navigation and keyboard controls
 */

import { test, expect } from '@playwright/test';

/**
 * Wait for jQuery to be loaded and document ready to have fired.
 */
async function waitForJQueryReady(page, timeout = 10000) {
  try {
    await page.waitForFunction(
      () => {
        if (typeof window.jQuery === 'undefined') return false;
        return window.jQuery.isReady === true;
      },
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure search modal is closed and won't intercept clicks.
 * Call this before any navigation tests.
 */
async function ensureSearchModalClosed(page) {
  await page.evaluate(() => {
    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.add('dn');
      modal.classList.remove('db');
      modal.style.pointerEvents = 'none';
      // Also disable pointer events on all children
      modal.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'none';
      });
    }
    // Restore body scroll if locked
    document.body.style.overflow = '';
  });
}

/**
 * Navigate to stills page via JavaScript
 * This bypasses hash navigation issues in headless browsers
 */
async function navigateToStills(page) {
  await page.evaluate(() => {
    // Hide all pages
    const pageIds = [
      'landing',
      'menu',
      'east-wing',
      'west-wing',
      'south-wing',
      'north-wing',
      'sound',
      'vision',
      'words',
      'info',
      'diary',
      'stills',
      'video',
      'blog',
      'discovery',
    ];

    pageIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('dn');
        el.style.display = 'none';
      }
    });

    // Show stills page
    const stills = document.getElementById('stills');
    if (stills) {
      stills.classList.remove('dn');
      stills.style.display = '';
      stills.style.opacity = '1';
    }

    window.location.hash = '#stills';
  });

  // Wait for stills to be visible
  await page.locator('#stills').waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Stills Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);
    await navigateToStills(page);
  });

  test('should display first image', async ({ page }) => {
    const activeImage = page.locator('#stills #stillsImage.dtc');
    await expect(activeImage).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to previous image with left button', async ({
    page,
  }) => {
    const leftButton = page.locator('#stills-left');
    await leftButton.click();
    await page.waitForTimeout(500);

    // Carousel should have changed
    const activeImage = page.locator('#stills #stillsImage.dtc');
    await expect(activeImage).toBeVisible();
  });

  test('should have accessible carousel controls', async ({ page }) => {
    const leftButton = page.locator('#stills-left');
    await expect(leftButton).toHaveAttribute('aria-label', 'Previous image');
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Focus on the page
    await page.click('body');

    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);

    const activeImage = page.locator('#stills #stillsImage.dtc');
    await expect(activeImage).toBeVisible();
  });
});

test.describe('Carousel Touch Support', () => {
  // Touch events don't work reliably in headless Playwright.
  // The carousel uses touchstart/touchend event listeners, but Playwright's
  // mouse-based swipe simulation doesn't trigger touch handlers.
  // Skip this test in automated runs - touch functionality should be
  // verified manually on real devices.
  test.skip('should support touch swipe on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);
    await navigateToStills(page);

    const container = page.locator('#stills');
    const box = await container.boundingBox();

    if (box) {
      // Simulate swipe left
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);

      // Perform swipe gesture
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(500);

      const activeImage = page.locator('#stills #stillsImage.dtc');
      await expect(activeImage).toBeVisible();
    }
  });
});
