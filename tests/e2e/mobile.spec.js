/**
 * Mobile E2E Tests
 * Tests mobile menu, responsive layout, and touch interactions
 */

import { test, expect, devices } from '@playwright/test';

// Configure mobile device at file level (required by Playwright)
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('should open mobile menu on hamburger click', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');
    await hamburger.click();
    await page.waitForTimeout(500);

    // Menu should be open
    const mobileMenu = page.locator('.mobileMenu');
    await expect(mobileMenu).toHaveClass(/open/);
  });

  test('should close mobile menu on second click', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');

    // Open
    await hamburger.click();
    await page.waitForTimeout(500);

    // Close
    await hamburger.click();
    await page.waitForTimeout(500);

    const mobileMenu = page.locator('.mobileMenu');
    await expect(mobileMenu).not.toHaveClass(/open/);
  });

  test('should lock scroll when menu is open', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');
    await hamburger.click();
    await page.waitForTimeout(500);

    // Body should have overflow hidden
    const bodyStyle = await page.evaluate(() => document.body.style.overflow);
    expect(bodyStyle).toBe('hidden');
  });

  test('should unlock scroll when menu closes', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');

    // Open
    await hamburger.click();
    await page.waitForTimeout(500);

    // Close
    await hamburger.click();
    await page.waitForTimeout(500);

    // Body should not have overflow hidden
    const bodyStyle = await page.evaluate(() => document.body.style.overflow);
    expect(bodyStyle).toBe('');
  });

  test('should have correct aria-expanded state', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');

    // Initially not expanded
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    await hamburger.click();
    await page.waitForTimeout(500);

    // Should be expanded
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Responsive YouTube Embeds', () => {
  test('should display responsive YouTube containers', async ({ page }) => {
    await page.goto('/#video');
    await page.waitForTimeout(1000);

    const container = page.locator('.youtubeContainer').first();
    await expect(container).toBeVisible();

    // Check that container has proper CSS
    const style = await container.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        paddingBottom: computed.paddingBottom,
      };
    });

    expect(style.position).toBe('relative');
  });

  test('should have accessible iframe titles', async ({ page }) => {
    await page.goto('/#video');
    await page.waitForTimeout(1000);

    const iframe = page.locator('.youtubeContainer iframe').first();
    await expect(iframe).toHaveAttribute('title');
  });
});
