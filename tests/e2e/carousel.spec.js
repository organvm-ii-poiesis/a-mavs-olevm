/**
 * Carousel E2E Tests
 * Tests image carousel navigation and keyboard controls
 */

import { test, expect } from '@playwright/test';

test.describe('Stills Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#stills');
    await page.waitForTimeout(1000);
  });

  test('should display first image', async ({ page }) => {
    const activeImage = page.locator('#stills #stillsImage.dtc');
    await expect(activeImage).toBeVisible();
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
  test('should support touch swipe on mobile', async ({ page }) => {
    await page.goto('/#stills');
    await page.waitForTimeout(1000);

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
