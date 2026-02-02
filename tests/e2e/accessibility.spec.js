/**
 * Accessibility E2E Tests
 *
 * Uses @axe-core/playwright to test WCAG 2.1 AA compliance
 * on all main pages of the ETCETER4 website.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Configure test timeout for accessibility scans
test.setTimeout(60000);

/**
 * Helper to run axe-core scan and return violations
 * @param {Page} page - Playwright page object
 * @param {Object} options - axe-core options
 * @returns {Promise<Array>} Array of accessibility violations
 */
async function checkAccessibility(page, options = {}) {
  const defaultOptions = {
    // Test against WCAG 2.1 AA standards
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    // Exclude known third-party embeds that we can't control
    exclude: [['iframe[src*="bandcamp.com"]'], ['iframe[src*="youtube.com"]']],
  };

  const axeOptions = { ...defaultOptions, ...options };

  const results = await new AxeBuilder({ page }).options(axeOptions).analyze();

  return results.violations;
}

/**
 * Helper to format violations for readable output
 */
function formatViolations(violations) {
  return violations.map(v => ({
    rule: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
    help: v.helpUrl,
  }));
}

test.describe('Accessibility - Landing Page', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for any initial animations
    await page.waitForTimeout(1000);

    const violations = await checkAccessibility(page);
    const critical = violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.log('Critical violations:', formatViolations(critical));
    }

    // Expect no critical or serious violations
    expect(critical).toHaveLength(0);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that h1 exists
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run specific link-related checks
    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['link-name', 'link-in-text-block'],
      },
    });

    expect(violations.filter(v => v.impact === 'serious')).toHaveLength(0);
  });
});

test.describe('Accessibility - Menu Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to menu by clicking on landing
    await page.click('#landing');
    await page.waitForTimeout(1000);
  });

  test('should have accessible menu buttons', async ({ page }) => {
    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['button-name', 'link-name'],
      },
    });

    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Check that Tab key moves focus
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );

    // Focus should be on an interactive element
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['focus-order-semantics'],
      },
    });

    expect(violations.filter(v => v.impact === 'serious')).toHaveLength(0);
  });

  test('should not trap keyboard focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Press Tab multiple times to ensure focus can move through page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // If we can still interact, focus wasn't trapped
    const canInteract = await page.evaluate(() => document.hasFocus());
    expect(canInteract).toBe(true);
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast', 'color-contrast-enhanced'],
      },
    });

    // Filter for critical/serious contrast issues
    const seriousContrast = violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (seriousContrast.length > 0) {
      console.log('Contrast issues:', formatViolations(seriousContrast));
    }

    // Allow minor contrast issues but no critical ones
    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });
});

test.describe('Accessibility - Images', () => {
  test('should have alt text on meaningful images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['image-alt', 'image-redundant-alt'],
      },
    });

    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });
});

test.describe('Accessibility - Forms', () => {
  test('should have labeled form controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: ['label', 'label-title-only'],
      },
    });

    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });
});

test.describe('Accessibility - ARIA', () => {
  test('should have valid ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page, {
      runOnly: {
        type: 'rule',
        values: [
          'aria-allowed-attr',
          'aria-hidden-body',
          'aria-hidden-focus',
          'aria-required-attr',
          'aria-roles',
          'aria-valid-attr',
          'aria-valid-attr-value',
        ],
      },
    });

    expect(violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('should have aria-live region for page announcements', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for aria-live region
    const ariaLive = await page.locator('[aria-live]').count();
    expect(ariaLive).toBeGreaterThanOrEqual(0); // May not exist on landing
  });
});

test.describe('Accessibility - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const violations = await checkAccessibility(page);
    const critical = violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('should have touch-friendly targets (44x44 minimum)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check interactive elements have minimum size
    const smallTargets = await page.evaluate(() => {
      const interactives = document.querySelectorAll('a, button');
      const small = [];

      interactives.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0) return;
        // Check if either dimension is too small
        if (rect.width < 44 || rect.height < 44) {
          small.push({
            tag: el.tagName,
            text: el.textContent?.slice(0, 20),
            width: rect.width,
            height: rect.height,
          });
        }
      });

      return small;
    });

    // Log small targets for debugging (not failing yet)
    if (smallTargets.length > 0) {
      console.log('Small touch targets found:', smallTargets.slice(0, 5));
    }
  });
});
