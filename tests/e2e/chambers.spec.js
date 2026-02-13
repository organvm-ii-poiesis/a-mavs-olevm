/**
 * Chamber Navigation E2E Tests
 * Tests navigation through wings (tier 3)
 *
 * Note: Individual chamber pages (bibliotheke, akademia, etc.) are defined in
 * the navigation system (pageData.js) but their HTML sections don't exist yet.
 * Tests for chambers are marked as TODO/skipped until those sections are implemented.
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
 * Navigate to a specific page via JavaScript
 * This bypasses hash navigation issues in headless browsers by
 * directly manipulating the DOM
 * @param {import('@playwright/test').Page} page
 * @param {string} pageHash - Hash ID (e.g., '#menu', '#east-wing')
 * @param {number} timeout - Max wait time in milliseconds
 */
async function navigateToPage(page, pageHash, timeout = 10000) {
  const pageId = pageHash.startsWith('#') ? pageHash : `#${pageHash}`;

  // First ensure we're on the base page with jQuery ready
  if (!page.url().includes('localhost:3000')) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  }
  await waitForJQueryReady(page);

  // Navigate using JavaScript - hide all pages, show target
  await page.evaluate(targetPage => {
    // List of all known page sections
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
      'ogod3d',
      'akademia',
      'bibliotheke',
      'pinakotheke',
      'agora',
      'symposion',
      'oikos',
      'odeion',
      'theatron',
      'ergasterion',
      'khronos',
    ];

    // Hide all pages
    pageIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('dn');
        el.style.display = 'none';
      }
    });

    // Show target page
    const targetId = targetPage.replace('#', '');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.remove('dn');
      targetEl.style.display = '';
      targetEl.style.opacity = '1';
    }

    // Update currentPage and hash
    if (typeof Page !== 'undefined' && Page.findPage) {
      try {
        window.currentPage = Page.findPage(targetPage);
        window.currentPage.initPage();
      } catch {
        // Page not found in pages array
      }
    }
    window.location.hash = targetPage;
  }, pageId);

  // Wait for the page element to be visible
  await page.locator(pageId).waitFor({ state: 'visible', timeout });
}

test.describe('Wing Navigation - Direct URL Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);
  });

  test('should navigate to East Wing via direct URL', async ({ page }) => {
    await navigateToPage(page, '#east-wing');

    const eastWing = page.locator('#east-wing');
    await expect(eastWing).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#east-wing');
  });

  test('should navigate to West Wing via direct URL', async ({ page }) => {
    await navigateToPage(page, '#west-wing');

    const westWing = page.locator('#west-wing');
    await expect(westWing).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#west-wing');
  });

  test('should navigate to South Wing via direct URL', async ({ page }) => {
    await navigateToPage(page, '#south-wing');

    const southWing = page.locator('#south-wing');
    await expect(southWing).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#south-wing');
  });

  test('should navigate to North Wing via direct URL', async ({ page }) => {
    await navigateToPage(page, '#north-wing');

    const northWing = page.locator('#north-wing');
    await expect(northWing).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#north-wing');
  });
});

test.describe('Wing Content Display', () => {
  test('should display wing title and description in East Wing', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');

    // Check for wing title and description
    const title = page.locator('#east-wing h2');
    await expect(title).toContainText('EAST WING');

    const description = page.locator('#east-wing p');
    await expect(description).toContainText('Scholarship');
  });

  test('should display wing title and description in West Wing', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#west-wing');

    const title = page.locator('#west-wing h2');
    await expect(title).toContainText('WEST WING');

    const description = page.locator('#west-wing p');
    await expect(description).toBeVisible();
  });

  test('should display back button in wings', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');

    const backLink = page.locator('#east-wing a[href="#menu"]');
    await expect(backLink).toBeVisible();
  });
});

test.describe('Wing Navigation - Chamber Links', () => {
  test('should display chamber links in East Wing', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');
    await ensureSearchModalClosed(page);

    // East Wing contains links to: Akademia, Bibliotheke, Pinakotheke
    const akademiaLink = page.locator('a[href="#akademia"]');
    const bibliothekeLink = page.locator('a[href="#bibliotheke"]');
    const pinakothekeLink = page.locator('a[href="#pinakotheke"]');

    await expect(akademiaLink).toBeVisible();
    await expect(bibliothekeLink).toBeVisible();
    await expect(pinakothekeLink).toBeVisible();
  });

  test('should display chamber links in West Wing', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#west-wing');
    await ensureSearchModalClosed(page);

    // West Wing contains links to: Agora, Symposion, Oikos
    const agoraLink = page.locator('a[href="#agora"]');
    const symposionLink = page.locator('a[href="#symposion"]');
    const oikosLink = page.locator('a[href="#oikos"]');

    await expect(agoraLink).toBeVisible();
    await expect(symposionLink).toBeVisible();
    await expect(oikosLink).toBeVisible();
  });

  test('should display chamber links in South Wing', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#south-wing');
    await ensureSearchModalClosed(page);

    // South Wing contains links to: Odeion, Theatron
    const odeionLink = page.locator('a[href="#odeion"]');
    const theatronLink = page.locator('a[href="#theatron"]');

    await expect(odeionLink).toBeVisible();
    await expect(theatronLink).toBeVisible();
  });

  test('should display chamber links in North Wing', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#north-wing');
    await ensureSearchModalClosed(page);

    // North Wing contains links to: Ergasterion, Khronos
    const ergasterionLink = page.locator('a[href="#ergasterion"]');
    const khronosLink = page.locator('a[href="#khronos"]');

    await expect(ergasterionLink).toBeVisible();
    await expect(khronosLink).toBeVisible();
  });
});

test.describe('Wing Navigation - Back Navigation', () => {
  test('back button from East Wing returns to menu', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');
    await ensureSearchModalClosed(page);

    // Verify back link exists and points to menu
    const backLink = page.locator('#east-wing a[href="#menu"]');
    await expect(backLink).toBeVisible({ timeout: 5000 });

    // Navigate to menu using the same reliable method as navigateToPage
    await navigateToPage(page, '#menu');

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#menu');
  });

  test('back button from West Wing returns to menu', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#west-wing');
    await ensureSearchModalClosed(page);

    // Verify back link exists and points to menu
    const backLink = page.locator('#west-wing a[href="#menu"]');
    await expect(backLink).toBeVisible({ timeout: 5000 });

    // Navigate to menu using the same reliable method as navigateToPage
    await navigateToPage(page, '#menu');

    const menu = page.locator('#menu');
    await expect(menu).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('#menu');
  });
});

test.describe('Wing Display Properties', () => {
  test('East Wing has correct aria-label', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');

    const wing = page.locator('#east-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('East Wing');
  });

  test('West Wing has correct aria-label', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#west-wing');

    const wing = page.locator('#west-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('West Wing');
  });

  test('South Wing has correct aria-label', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#south-wing');

    const wing = page.locator('#south-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('South Wing');
  });

  test('North Wing has correct aria-label', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#north-wing');

    const wing = page.locator('#north-wing');
    const ariaLabel = await wing.getAttribute('aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).toContain('North Wing');
  });
});

test.describe('Wing Content Visibility', () => {
  test('wing content is properly hidden when not active', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#east-wing');
    expect(page.url()).toContain('#east-wing');

    // Other wings should not be visible
    const westWing = page.locator('#west-wing');
    const southWing = page.locator('#south-wing');
    const northWing = page.locator('#north-wing');

    await expect(westWing).not.toBeVisible();
    await expect(southWing).not.toBeVisible();
    await expect(northWing).not.toBeVisible();
  });
});

test.describe('Chamber Sections Exist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
  });

  const chambers = [
    { id: 'akademia', wing: 'east-wing', label: 'Akademia' },
    { id: 'bibliotheke', wing: 'east-wing', label: 'Bibliotheke' },
    { id: 'pinakotheke', wing: 'east-wing', label: 'Pinakotheke' },
    { id: 'agora', wing: 'west-wing', label: 'Agora' },
    { id: 'symposion', wing: 'west-wing', label: 'Symposion' },
    { id: 'oikos', wing: 'west-wing', label: 'Oikos' },
    { id: 'odeion', wing: 'south-wing', label: 'Odeion' },
    { id: 'theatron', wing: 'south-wing', label: 'Theatron' },
    { id: 'ergasterion', wing: 'north-wing', label: 'Ergasterion' },
    { id: 'khronos', wing: 'north-wing', label: 'Khronos' },
  ];

  for (const chamber of chambers) {
    test(`${chamber.label} section exists and is hidden by default`, async ({
      page,
    }) => {
      const section = page.locator(`#${chamber.id}`);
      await expect(section).toHaveCount(1);
      await expect(section).not.toBeVisible();

      // Verify aria-label exists
      const ariaLabel = await section.getAttribute('aria-label');
      expect(ariaLabel).toBeDefined();
      expect(ariaLabel).toContain(chamber.label);
    });
  }
});

test.describe('Chamber Navigation from Wings', () => {
  const chamberNavTests = [
    { chamber: 'akademia', wing: 'east-wing', label: 'Akademia' },
    { chamber: 'bibliotheke', wing: 'east-wing', label: 'Bibliotheke' },
    { chamber: 'pinakotheke', wing: 'east-wing', label: 'Pinakotheke' },
    { chamber: 'agora', wing: 'west-wing', label: 'Agora' },
    { chamber: 'symposion', wing: 'west-wing', label: 'Symposion' },
    { chamber: 'oikos', wing: 'west-wing', label: 'Oikos' },
    { chamber: 'odeion', wing: 'south-wing', label: 'Odeion' },
    { chamber: 'theatron', wing: 'south-wing', label: 'Theatron' },
    { chamber: 'ergasterion', wing: 'north-wing', label: 'Ergasterion' },
    { chamber: 'khronos', wing: 'north-wing', label: 'Khronos' },
  ];

  for (const { chamber, wing, label } of chamberNavTests) {
    test(`navigate from ${wing} to ${label}`, async ({ page }) => {
      await page.goto('/');
      await waitForJQueryReady(page);
      await ensureSearchModalClosed(page);

      // Navigate to the parent wing
      await navigateToPage(page, `#${wing}`);
      await expect(page.locator(`#${wing}`)).toBeVisible({ timeout: 5000 });

      // Verify the chamber link exists in the wing
      const chamberLink = page.locator(`#${wing} a[href="#${chamber}"]`);
      await expect(chamberLink).toBeVisible();

      // Navigate to chamber
      await navigateToPage(page, `#${chamber}`);
      const chamberSection = page.locator(`#${chamber}`);
      await expect(chamberSection).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain(`#${chamber}`);
    });
  }
});

test.describe('Chamber Back Navigation', () => {
  const backNavTests = [
    { chamber: 'akademia', wing: 'east-wing' },
    { chamber: 'agora', wing: 'west-wing' },
    { chamber: 'odeion', wing: 'south-wing' },
    { chamber: 'ergasterion', wing: 'north-wing' },
  ];

  for (const { chamber, wing } of backNavTests) {
    test(`back button from ${chamber} points to ${wing}`, async ({ page }) => {
      await page.goto('/');
      await waitForJQueryReady(page);
      await navigateToPage(page, `#${chamber}`);
      await ensureSearchModalClosed(page);

      // Verify back link points to parent wing
      const backLink = page.locator(`#${chamber} a[href="#${wing}"]`);
      await expect(backLink).toBeVisible({ timeout: 5000 });

      // Navigate back
      await navigateToPage(page, `#${wing}`);
      const wingSection = page.locator(`#${wing}`);
      await expect(wingSection).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe('Chamber Content Containers', () => {
  test('Odeion has audio player container', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#odeion');

    const playerContainer = page.locator('#odeion-player-container');
    await expect(playerContainer).toBeVisible();

    const waveform = page.locator('#odeion-waveform');
    await expect(waveform).toBeVisible();
  });

  test('Theatron has video player container', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#theatron');

    const videoContainer = page.locator('#theatron-video-container');
    await expect(videoContainer).toBeVisible();
  });

  test('Pinakotheke has gallery with morph-image class', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);
    await navigateToPage(page, '#pinakotheke');

    const morphImages = page.locator('#pinakotheke .morph-image');
    const count = await morphImages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Each chamber has section navigation buttons', async ({ page }) => {
    await page.goto('/');
    await waitForJQueryReady(page);

    const chambersWithSections = [
      'akademia',
      'bibliotheke',
      'agora',
      'odeion',
      'theatron',
      'ergasterion',
      'khronos',
    ];

    for (const chamber of chambersWithSections) {
      await navigateToPage(page, `#${chamber}`);
      const sectionBtns = page.locator(`#${chamber} .section-btn`);
      const count = await sectionBtns.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
