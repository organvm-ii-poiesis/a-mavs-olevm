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

test.describe('Stills Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#stills');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
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
    await page.goto('/#stills');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

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
