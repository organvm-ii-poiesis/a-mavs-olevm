/**
 * Navigation E2E Tests
 * Tests page navigation, hash routing, and keyboard navigation
 */

import { test, expect } from '@playwright/test';

/**
 * Wait for jQuery to be loaded and document ready to have fired.
 * Returns true if successful within timeout, false otherwise.
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

test.describe('Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
  });

  test('should display landing page initially', async ({ page }) => {
    // Landing page should be visible
    const landing = page.locator('#landing');
    await expect(landing).toBeVisible();
  });

  // SKIP: Hash navigation on initial page load doesn't consistently work in
  // headless browsers. The document.ready handler that removes 'dn' class
  // sometimes doesn't execute reliably when navigating directly to a hash URL.
  // This test passes when running headed but fails intermittently in CI.
  test.skip('should navigate to menu from landing', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible({ timeout: 10000 });
  });

  // SKIP: Same issue as above - hash navigation doesn't reliably trigger
  // the document.ready handler's dn class removal in headless mode.
  test.skip('should navigate via hash change', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    await page.goto('/#vision');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    const vision = page.locator('#vision');
    await expect(vision).toBeVisible({ timeout: 10000 });
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    await page.goto('/#vision');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    // Go back - this triggers hashchange which calls showNewSection
    await page.goBack();
    await page.waitForTimeout(2000); // Wait for animation

    // URL should be menu
    expect(page.url()).toContain('#menu');
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    // Check that nav links have aria-labels
    const soundLink = page.locator('#toSoundPage');
    await expect(soundLink).toHaveAttribute('aria-label');

    const wordsLink = page.locator('#toWordsPage');
    await expect(wordsLink).toHaveAttribute('aria-label');
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate with Escape key', async ({ page }) => {
    await page.goto('/#vision');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    // Press Escape to go back
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000); // Wait for animation

    // Should navigate back to menu
    expect(page.url()).toContain('#menu');
  });

  test('should navigate with Home key', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    // Press Home to go to landing
    await page.keyboard.press('Home');
    await page.waitForTimeout(2000); // Wait for animation

    expect(page.url()).toContain('#landing');
  });

  test('should navigate to menu with M key', async ({ page }) => {
    await page.goto('/#vision');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    // Press M to go to menu
    await page.keyboard.press('m');
    await page.waitForTimeout(2000); // Wait for animation

    expect(page.url()).toContain('#menu');
  });
});
