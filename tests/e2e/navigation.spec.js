/**
 * Navigation E2E Tests
 * Tests page navigation, hash routing, and keyboard navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display landing page initially', async ({ page }) => {
    // Landing page should be visible
    const landing = page.locator('#landing');
    await expect(landing).toBeVisible();
  });

  test('should navigate to menu from landing', async ({ page }) => {
    // Click on ETCETER4 text to navigate (or use hash navigation)
    await page.goto('/#menu');
    await page.waitForTimeout(1000); // Wait for transition

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();
  });

  test('should navigate via hash change', async ({ page }) => {
    // Navigate to menu via hash
    await page.goto('/#menu');
    await page.waitForTimeout(1000);

    // Navigate to vision via hash
    await page.goto('/#vision');
    await page.waitForTimeout(1000);

    const vision = page.locator('#vision');
    await expect(vision).toBeVisible();
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForTimeout(1000);

    await page.goto('/#vision');
    await page.waitForTimeout(1000);

    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);

    // URL should be menu
    expect(page.url()).toContain('#menu');
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForTimeout(1000);

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
    await page.waitForTimeout(1000);

    // Press Escape to go back
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Should navigate back to menu
    expect(page.url()).toContain('#menu');
  });

  test('should navigate with Home key', async ({ page }) => {
    await page.goto('/#menu');
    await page.waitForTimeout(1000);

    // Press Home to go to landing
    await page.keyboard.press('Home');
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('#landing');
  });

  test('should navigate to menu with M key', async ({ page }) => {
    await page.goto('/#vision');
    await page.waitForTimeout(1000);

    // Press M to go to menu
    await page.keyboard.press('m');
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('#menu');
  });
});
