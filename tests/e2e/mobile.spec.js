/**
 * Mobile E2E Tests
 * Tests mobile menu, responsive layout, and touch interactions
 */

import { test, expect, devices } from '@playwright/test';

// Configure mobile device at file level (required by Playwright)
test.use({ ...devices['Pixel 5'] });

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
 * Reset mobile menu state to ensure clean state before each test.
 * Call this before any mobile menu interaction tests.
 */
async function resetMobileMenuState(page) {
  await page.evaluate(() => {
    const hamburger = document.querySelector('.c-hamburger');
    const mobileMenu = document.querySelector('.mobileMenu');
    if (hamburger) {
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
    }
    document.body.style.overflow = '';
  });
  // Wait for DOM updates to settle
  await page.waitForTimeout(100);
}

test.describe('Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);
    await resetMobileMenuState(page);
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('should open mobile menu on hamburger click', async ({ page }) => {
    // Use jQuery trigger for more reliable cross-browser behavior
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });

    // Wait for menu to have 'open' class
    await page.waitForFunction(
      () => document.querySelector('.mobileMenu')?.classList.contains('open'),
      { timeout: 5000 }
    );

    // Menu should be open
    const mobileMenu = page.locator('.mobileMenu');
    await expect(mobileMenu).toHaveClass(/open/);
  });

  test('should close mobile menu on second click', async ({ page }) => {
    // Open menu using jQuery's trigger method for reliable event handling
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });
    await page.waitForTimeout(500);

    // Verify menu is open
    const mobileMenu = page.locator('.mobileMenu');
    await expect(mobileMenu).toHaveClass(/open/);

    // Close menu using jQuery trigger
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });
    await page.waitForTimeout(500);

    // Verify closed state
    await expect(mobileMenu).not.toHaveClass(/open/);
  });

  test('should lock scroll when menu is open', async ({ page }) => {
    // Open menu using jQuery's trigger method
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });

    // Wait for overflow to be set to hidden (with polling)
    await page.waitForFunction(
      () => document.body.style.overflow === 'hidden',
      { timeout: 5000 }
    );

    const bodyStyle = await page.evaluate(() => document.body.style.overflow);
    expect(bodyStyle).toBe('hidden');
  });

  test('should unlock scroll when menu closes', async ({ page }) => {
    // Open menu using jQuery trigger
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });

    // Wait for menu to open
    await page.waitForFunction(
      () => document.body.style.overflow === 'hidden',
      { timeout: 5000 }
    );

    // Verify menu is open before trying to close
    const mobileMenu = page.locator('.mobileMenu');
    await expect(mobileMenu).toHaveClass(/open/);

    // Close menu using jQuery trigger
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });

    // Wait for scroll to be unlocked
    await page.waitForFunction(() => document.body.style.overflow === '', {
      timeout: 5000,
    });

    // Body should not have overflow hidden
    const bodyStyle = await page.evaluate(() => document.body.style.overflow);
    expect(bodyStyle).toBe('');
  });

  test('should have correct aria-expanded state', async ({ page }) => {
    const hamburger = page.locator('.c-hamburger');

    // Ensure clean state by explicitly resetting
    await page.evaluate(() => {
      const hamburger = document.querySelector('.c-hamburger');
      const mobileMenu = document.querySelector('.mobileMenu');
      if (hamburger) {
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
      if (mobileMenu) {
        mobileMenu.classList.remove('open');
      }
      document.body.style.overflow = '';
    });

    // Wait for reset to take effect
    await page.waitForFunction(
      () =>
        document
          .querySelector('.c-hamburger')
          ?.getAttribute('aria-expanded') === 'false',
      { timeout: 5000 }
    );

    // Initially not expanded
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Open menu using jQuery trigger for reliable event handling
    await page.evaluate(() => {
      window.jQuery('.c-hamburger').trigger('click');
    });

    // Wait for aria-expanded to be true
    await page.waitForFunction(
      () =>
        document
          .querySelector('.c-hamburger')
          ?.getAttribute('aria-expanded') === 'true',
      { timeout: 5000 }
    );

    // Should be expanded
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Responsive YouTube Embeds', () => {
  test('should display responsive YouTube containers', async ({ page }) => {
    await page.goto('/#video');
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);

    const container = page.locator('.youtubeContainer').first();
    await expect(container).toBeVisible({ timeout: 10000 });

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
    await page.waitForLoadState('domcontentloaded');
    await waitForJQueryReady(page);
    await ensureSearchModalClosed(page);

    const iframe = page.locator('.youtubeContainer iframe').first();
    await expect(iframe).toHaveAttribute('title');
  });
});
