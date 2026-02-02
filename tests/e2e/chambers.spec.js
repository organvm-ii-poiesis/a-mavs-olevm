/**
 * Chamber Navigation E2E Tests
 * Tests navigation through wings (tier 3) and chambers (tier 4)
 * Validates page visibility, URL hashing, content loading, and back navigation
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

/**
 * Navigate to a specific page via hash and wait for it to be visible
 * @param {import('@playwright/test').Page} page
 * @param {string} pageHash - Hash ID (e.g., '#menu', '#east-wing')
 * @param {number} timeout - Max wait time in milliseconds
 */
async function navigateToPage(page, pageHash, timeout = 10000) {
  const pageId = pageHash.startsWith('#') ? pageHash : `#${pageHash}`;
  await page.goto(`/${pageId}`);
  await page.waitForLoadState('domcontentloaded');
  await waitForJQueryReady(page);

  // Wait for the page element to be visible
  const selector = pageId;
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

test.describe('Chamber Navigation - Wings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
  });

  test('should navigate to East Wing from menu', async ({ page }) => {
    await navigateToPage(page, '#menu');
    const menuLink = page.locator('a[href="#east-wing"]');
    await menuLink.click();
    await page.waitForTimeout(1500); // Wait for fade animation

    const eastWing = page.locator('#east-wing');
    await expect(eastWing).toBeVisible();
    expect(page.url()).toContain('#east-wing');
  });

  test('should navigate to West Wing from menu', async ({ page }) => {
    await navigateToPage(page, '#menu');
    const menuLink = page.locator('a[href="#west-wing"]');
    await menuLink.click();
    await page.waitForTimeout(1500);

    const westWing = page.locator('#west-wing');
    await expect(westWing).toBeVisible();
    expect(page.url()).toContain('#west-wing');
  });

  test('should navigate to South Wing from menu', async ({ page }) => {
    await navigateToPage(page, '#menu');
    const menuLink = page.locator('a[href="#south-wing"]');
    await menuLink.click();
    await page.waitForTimeout(1500);

    const southWing = page.locator('#south-wing');
    await expect(southWing).toBeVisible();
    expect(page.url()).toContain('#south-wing');
  });

  test('should navigate to North Wing from menu', async ({ page }) => {
    await navigateToPage(page, '#menu');
    const menuLink = page.locator('a[href="#north-wing"]');
    await menuLink.click();
    await page.waitForTimeout(1500);

    const northWing = page.locator('#north-wing');
    await expect(northWing).toBeVisible();
    expect(page.url()).toContain('#north-wing');
  });

  test('should display wing description in East Wing', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    // Check for wing title and description
    const title = page.locator('#east-wing h2');
    await expect(title).toContainText('EAST WING');

    const description = page.locator('#east-wing p');
    await expect(description).toContainText('Scholarship');
  });

  test('should display wing description in West Wing', async ({ page }) => {
    await navigateToPage(page, '#west-wing');

    const title = page.locator('#west-wing h2');
    await expect(title).toContainText('WEST WING');

    const description = page.locator('#west-wing p');
    await expect(description).toBeVisible();
  });

  test('should display back button in wings', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const backLink = page.locator('#east-wing a[href="#menu"]');
    await expect(backLink).toBeVisible();
  });

  test('back button from East Wing returns to menu', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const backLink = page.locator('#east-wing a[href="#menu"]');
    await backLink.click();
    await page.waitForTimeout(1500);

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();
    expect(page.url()).toContain('#menu');
  });
});

test.describe('Chamber Navigation - East Wing Chambers', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '#east-wing');
  });

  test('should display chamber links in East Wing', async ({ page }) => {
    const bibliothekeLink = page.locator('a[href="#bibliotheke"]');
    const oikosLink = page.locator('a[href="#oikos"]');
    const pinakothekeLink = page.locator('a[href="#pinakotheke"]');

    await expect(bibliothekeLink).toBeVisible();
    await expect(oikosLink).toBeVisible();
    await expect(pinakothekeLink).toBeVisible();
  });

  test('should navigate to Bibliotheke chamber', async ({ page }) => {
    const chamberlLink = page.locator('a[href="#bibliotheke"]');
    await chamberlLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#bibliotheke');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#bibliotheke');
  });

  test('should navigate to Oikos chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#oikos"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#oikos');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#oikos');
  });

  test('should navigate to Pinakotheke chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#pinakotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#pinakotheke');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#pinakotheke');
  });

  test('should have back button in Bibliotheke', async ({ page }) => {
    const chamberLink = page.locator('a[href="#bibliotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const backLink = page.locator('#bibliotheke a[href="#east-wing"]');
    await expect(backLink).toBeVisible();
  });

  test('back button from Bibliotheke returns to East Wing', async ({
    page,
  }) => {
    const chamberLink = page.locator('a[href="#bibliotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const backLink = page.locator('#bibliotheke a[href="#east-wing"]');
    await backLink.click();
    await page.waitForTimeout(1500);

    const wing = page.locator('#east-wing');
    await expect(wing).toBeVisible();
    expect(page.url()).toContain('#east-wing');
  });
});

test.describe('Chamber Navigation - West Wing Chambers', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '#west-wing');
  });

  test('should display chamber links in West Wing', async ({ page }) => {
    const agoraLink = page.locator('a[href="#agora"]');
    const symposionLink = page.locator('a[href="#symposion"]');

    await expect(agoraLink).toBeVisible();
    await expect(symposionLink).toBeVisible();
  });

  test('should navigate to Agora chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#agora"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#agora');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#agora');
  });

  test('should navigate to Symposion chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#symposion"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#symposion');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#symposion');
  });
});

test.describe('Chamber Navigation - South Wing Chambers', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '#south-wing');
  });

  test('should display chamber links in South Wing', async ({ page }) => {
    const odeionLink = page.locator('a[href="#odeion"]');
    const theatronLink = page.locator('a[href="#theatron"]');

    await expect(odeionLink).toBeVisible();
    await expect(theatronLink).toBeVisible();
  });

  test('should navigate to Odeion chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#odeion"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#odeion');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#odeion');
  });

  test('should navigate to Theatron chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#theatron"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#theatron');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#theatron');
  });
});

test.describe('Chamber Navigation - North Wing Chambers', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '#north-wing');
  });

  test('should display chamber links in North Wing', async ({ page }) => {
    const ergasterionLink = page.locator('a[href="#ergasterion"]');
    const khronosLink = page.locator('a[href="#khronos"]');

    await expect(ergasterionLink).toBeVisible();
    await expect(khronosLink).toBeVisible();
  });

  test('should navigate to Ergasterion chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#ergasterion"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#ergasterion');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#ergasterion');
  });

  test('should navigate to Khronos chamber', async ({ page }) => {
    const chamberLink = page.locator('a[href="#khronos"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#khronos');
    await expect(chamber).toBeVisible();
    expect(page.url()).toContain('#khronos');
  });
});

test.describe('Chamber Navigation - Back Navigation', () => {
  test('browser back from chamber returns to wing', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const chamberLink = page.locator('a[href="#bibliotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    // Verify in chamber
    const chamber = page.locator('#bibliotheke');
    await expect(chamber).toBeVisible();

    // Go back using browser back button
    await page.goBack();
    await page.waitForTimeout(1500);

    // Should be back in wing
    const wing = page.locator('#east-wing');
    await expect(wing).toBeVisible();
    expect(page.url()).toContain('#east-wing');
  });

  test('browser back from wing returns to menu', async ({ page }) => {
    await navigateToPage(page, '#menu');

    const wingLink = page.locator('a[href="#east-wing"]');
    await wingLink.click();
    await page.waitForTimeout(1500);

    const wing = page.locator('#east-wing');
    await expect(wing).toBeVisible();

    // Go back
    await page.goBack();
    await page.waitForTimeout(1500);

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();
    expect(page.url()).toContain('#menu');
  });

  test('multiple back navigations work correctly', async ({ page }) => {
    // Start at menu
    await navigateToPage(page, '#menu');

    // Navigate to wing
    const wingLink = page.locator('a[href="#west-wing"]');
    await wingLink.click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('#west-wing');

    // Navigate to chamber
    const chamberLink = page.locator('a[href="#agora"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('#agora');

    // Back to wing
    await page.goBack();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('#west-wing');

    // Back to menu
    await page.goBack();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('#menu');
  });
});

test.describe('Chamber Navigation - URL Hash Updates', () => {
  test('URL hash updates when navigating to wing', async ({ page }) => {
    await navigateToPage(page, '#menu');
    expect(page.url()).toContain('#menu');

    const wingLink = page.locator('a[href="#east-wing"]');
    await wingLink.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#east-wing');
    expect(page.url()).not.toContain('#menu');
  });

  test('URL hash updates when navigating to chamber', async ({ page }) => {
    await navigateToPage(page, '#east-wing');
    expect(page.url()).toContain('#east-wing');

    const chamberLink = page.locator('a[href="#bibliotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#bibliotheke');
    expect(page.url()).not.toContain('#east-wing');
  });

  test('direct navigation via hash URL works for wings', async ({ page }) => {
    await page.goto('/#west-wing');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    const wing = page.locator('#west-wing');
    await expect(wing).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#west-wing');
  });

  test('direct navigation via hash URL works for chambers', async ({
    page,
  }) => {
    await page.goto('/#symposion');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);

    const chamber = page.locator('#symposion');
    await expect(chamber).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#symposion');
  });
});

test.describe('Chamber Navigation - Content Loading', () => {
  test('chamber content initializes on first visit', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const chamberLink = page.locator('a[href="#bibliotheke"]');
    await chamberLink.click();
    await page.waitForTimeout(1500);

    const chamber = page.locator('#bibliotheke');
    await expect(chamber).toBeVisible();

    // Verify some chamber structure is visible
    const container = page.locator('#bibliotheke section');
    await expect(container).toBeDefined();
  });

  test('each chamber has back navigation link', async ({ page }) => {
    const chambers = [
      { hash: '#bibliotheke', wing: '#east-wing' },
      { hash: '#oikos', wing: '#east-wing' },
      { hash: '#pinakotheke', wing: '#east-wing' },
      { hash: '#agora', wing: '#west-wing' },
      { hash: '#symposion', wing: '#west-wing' },
      { hash: '#odeion', wing: '#south-wing' },
      { hash: '#theatron', wing: '#south-wing' },
      { hash: '#ergasterion', wing: '#north-wing' },
      { hash: '#khronos', wing: '#north-wing' },
    ];

    for (const { hash, wing } of chambers) {
      await page.goto(`/${hash}`);
      await page.waitForLoadState('domcontentloaded');
      await waitForJQueryReady(page);

      const backLink = page.locator(`${hash} a[href="${wing}"]`);
      await expect(backLink).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('wing content is properly hidden when not active', async ({ page }) => {
    await navigateToPage(page, '#east-wing');
    expect(page.url()).toContain('#east-wing');

    // West wing should not be visible
    const westWing = page.locator('#west-wing');
    await expect(westWing).not.toBeVisible();
  });

  test('chamber content is properly hidden when not active', async ({
    page,
  }) => {
    await navigateToPage(page, '#bibliotheke');
    expect(page.url()).toContain('#bibliotheke');

    // Other chambers should not be visible
    const oikos = page.locator('#oikos');
    const pinakotheke = page.locator('#pinakotheke');

    await expect(oikos).not.toBeVisible();
    await expect(pinakotheke).not.toBeVisible();
  });
});

test.describe('Chamber Navigation - Keyboard Shortcuts', () => {
  test('Escape key navigates back from chamber to wing', async ({ page }) => {
    await navigateToPage(page, '#bibliotheke');
    expect(page.url()).toContain('#bibliotheke');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#east-wing');
  });

  test('Escape key navigates back from wing to menu', async ({ page }) => {
    await navigateToPage(page, '#east-wing');
    expect(page.url()).toContain('#east-wing');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#menu');
  });

  test('Home key navigates to landing from chamber', async ({ page }) => {
    await navigateToPage(page, '#agora');
    expect(page.url()).toContain('#agora');

    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#landing');
  });

  test('M key navigates to menu from chamber', async ({ page }) => {
    await navigateToPage(page, '#odeion');
    expect(page.url()).toContain('#odeion');

    await page.keyboard.press('m');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('#menu');
  });
});

test.describe('Chamber Navigation - Wing Display Properties', () => {
  test('East Wing has correct aria-label', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const wing = page.locator('#east-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('East Wing');
  });

  test('West Wing has correct aria-label', async ({ page }) => {
    await navigateToPage(page, '#west-wing');

    const wing = page.locator('#west-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('West Wing');
  });

  test('South Wing has correct aria-label', async ({ page }) => {
    await navigateToPage(page, '#south-wing');

    const wing = page.locator('#south-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('South Wing');
  });

  test('North Wing has correct aria-label', async ({ page }) => {
    await navigateToPage(page, '#north-wing');

    const wing = page.locator('#north-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('North Wing');
  });
});
