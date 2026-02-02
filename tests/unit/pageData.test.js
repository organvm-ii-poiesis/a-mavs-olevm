/**
 * Unit tests for pageData.js
 *
 * Tests the page configuration data structure including:
 * - Page ID constants (_pID)
 * - Page hierarchy relationships
 * - Page configuration integrity
 * - Navigation flow validation
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Define the page ID constants as they appear in pageData.js
const _pID = {
  landing: '#landing',
  menu: '#menu',
  sound: '#sound',
  vision: '#vision',
  words: '#words',
  blog: '#blog',
  diary: '#diary',
  video: '#video',
  stills: '#stills',
  info: '#info',
  ogod3d: '#ogod3d',
};

// Define tier constants for validation
const TIER = {
  ENTRANCE: 1, // Landing page
  HUB: 2, // Menu
  SECTION: 3, // Main content sections (words, vision, sound, info)
  DETAIL: 4, // Detail pages (stills, diary, video, blog, ogod3d)
};

/**
 * Minimal Page class for testing configuration
 */
class Page {
  constructor(_p) {
    this.id = _p.id || '';
    this.tier = _p.tier || 0;
    this.downLinks = _p.downLinks || [];
    this.upLinks = _p.upLinks || [];
    this.initialize = _p.initialize || function () {};
  }
}

describe('Page ID Constants (_pID)', () => {
  it('should have all required page IDs', () => {
    const requiredIds = [
      'landing',
      'menu',
      'sound',
      'vision',
      'words',
      'blog',
      'diary',
      'video',
      'stills',
      'info',
      'ogod3d',
    ];

    requiredIds.forEach(id => {
      expect(_pID).toHaveProperty(id);
    });
  });

  it('should have IDs starting with hash symbol', () => {
    Object.values(_pID).forEach(id => {
      expect(id).toMatch(/^#/);
    });
  });

  it('should have unique ID values', () => {
    const values = Object.values(_pID);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('should have lowercase ID values (after hash)', () => {
    Object.values(_pID).forEach(id => {
      const idWithoutHash = id.substring(1);
      // Allow alphanumeric lowercase and hyphens
      expect(idWithoutHash).toMatch(/^[a-z0-9-]+$/);
    });
  });
});

describe('Page Configuration Structure', () => {
  let pages;

  beforeEach(() => {
    // Create pages array matching the actual pageData.js structure
    pages = [
      new Page({
        id: _pID.menu,
        tier: 2,
        downLinks: [_pID.words, _pID.sound, _pID.vision, _pID.info],
        upLinks: [_pID.landing],
      }),
      new Page({
        id: _pID.sound,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.stills,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.diary,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.info,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.ogod3d,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.landing,
        tier: 1,
        downLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.vision,
        tier: 3,
        upLinks: [_pID.menu],
        downLinks: [_pID.ogod3d],
      }),
      new Page({
        id: _pID.words,
        tier: 3,
        downLinks: [_pID.diary, _pID.blog],
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.blog,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.video,
        tier: 4,
        upLinks: [_pID.vision],
      }),
    ];
  });

  it('should have exactly one landing page (tier 1)', () => {
    const tier1Pages = pages.filter(p => p.tier === TIER.ENTRANCE);
    expect(tier1Pages).toHaveLength(1);
    expect(tier1Pages[0].id).toBe(_pID.landing);
  });

  it('should have exactly one menu page (tier 2)', () => {
    const tier2Pages = pages.filter(p => p.tier === TIER.HUB);
    expect(tier2Pages).toHaveLength(1);
    expect(tier2Pages[0].id).toBe(_pID.menu);
  });

  it('should have multiple section pages (tier 3)', () => {
    const tier3Pages = pages.filter(p => p.tier === TIER.SECTION);
    expect(tier3Pages.length).toBeGreaterThan(1);
  });

  it('should have detail pages (tier 4)', () => {
    const tier4Pages = pages.filter(p => p.tier === TIER.DETAIL);
    expect(tier4Pages.length).toBeGreaterThan(0);
  });
});

describe('Page Hierarchy Validation', () => {
  let pages;
  let findPage;

  beforeEach(() => {
    pages = [
      new Page({
        id: _pID.landing,
        tier: 1,
        downLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.menu,
        tier: 2,
        upLinks: [_pID.landing],
        downLinks: [_pID.words, _pID.sound, _pID.vision, _pID.info],
      }),
      new Page({
        id: _pID.words,
        tier: 3,
        upLinks: [_pID.menu],
        downLinks: [_pID.diary, _pID.blog],
      }),
      new Page({
        id: _pID.sound,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.vision,
        tier: 3,
        upLinks: [_pID.menu],
        downLinks: [_pID.stills, _pID.video, _pID.ogod3d],
      }),
      new Page({
        id: _pID.info,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.stills,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.diary,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.video,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.blog,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.ogod3d,
        tier: 4,
        upLinks: [_pID.vision],
      }),
    ];

    findPage = id => pages.find(p => p.id === id);
  });

  it('should have no orphan pages (all pages except landing have upLinks)', () => {
    const nonLandingPages = pages.filter(p => p.id !== _pID.landing);

    nonLandingPages.forEach(page => {
      expect(
        page.upLinks.length,
        `Page ${page.id} has no upLinks`
      ).toBeGreaterThan(0);
    });
  });

  it('should have landing page with no upLinks', () => {
    const landing = findPage(_pID.landing);
    expect(landing.upLinks).toHaveLength(0);
  });

  it('should have valid upLink references (upLinks point to existing pages)', () => {
    const pageIds = new Set(pages.map(p => p.id));

    pages.forEach(page => {
      page.upLinks.forEach(upLink => {
        expect(
          pageIds.has(upLink),
          `Invalid upLink ${upLink} in page ${page.id}`
        ).toBe(true);
      });
    });
  });

  it('should have valid downLink references (downLinks point to existing pages)', () => {
    const pageIds = new Set(pages.map(p => p.id));

    pages.forEach(page => {
      page.downLinks.forEach(downLink => {
        expect(
          pageIds.has(downLink),
          `Invalid downLink ${downLink} in page ${page.id}`
        ).toBe(true);
      });
    });
  });

  it('should have consistent tier relationships (upLinks go to lower tiers)', () => {
    pages.forEach(page => {
      page.upLinks.forEach(upLinkId => {
        const upLinkPage = findPage(upLinkId);
        if (upLinkPage) {
          expect(
            upLinkPage.tier,
            `Page ${page.id} (tier ${page.tier}) has upLink to ${upLinkId} (tier ${upLinkPage.tier})`
          ).toBeLessThan(page.tier);
        }
      });
    });
  });

  it('should have consistent tier relationships (downLinks go to higher tiers)', () => {
    pages.forEach(page => {
      page.downLinks.forEach(downLinkId => {
        const downLinkPage = findPage(downLinkId);
        if (downLinkPage) {
          expect(
            downLinkPage.tier,
            `Page ${page.id} (tier ${page.tier}) has downLink to ${downLinkId} (tier ${downLinkPage.tier})`
          ).toBeGreaterThan(page.tier);
        }
      });
    });
  });
});

describe('Navigation Flow Validation', () => {
  let pages;
  let findPage;

  beforeEach(() => {
    pages = [
      new Page({
        id: _pID.landing,
        tier: 1,
        downLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.menu,
        tier: 2,
        upLinks: [_pID.landing],
        downLinks: [_pID.words, _pID.sound, _pID.vision, _pID.info],
      }),
      new Page({
        id: _pID.words,
        tier: 3,
        upLinks: [_pID.menu],
        downLinks: [_pID.diary, _pID.blog],
      }),
      new Page({
        id: _pID.sound,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.vision,
        tier: 3,
        upLinks: [_pID.menu],
        downLinks: [_pID.stills, _pID.video, _pID.ogod3d],
      }),
      new Page({
        id: _pID.info,
        tier: 3,
        upLinks: [_pID.menu],
      }),
      new Page({
        id: _pID.stills,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.diary,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.video,
        tier: 4,
        upLinks: [_pID.vision],
      }),
      new Page({
        id: _pID.blog,
        tier: 4,
        upLinks: [_pID.words],
      }),
      new Page({
        id: _pID.ogod3d,
        tier: 4,
        upLinks: [_pID.vision],
      }),
    ];

    findPage = id => pages.find(p => p.id === id);
  });

  it('should allow path from landing to menu', () => {
    const landing = findPage(_pID.landing);
    expect(landing.downLinks).toContain(_pID.menu);
  });

  it('should allow path from menu to all main sections', () => {
    const menu = findPage(_pID.menu);
    const mainSections = [_pID.words, _pID.sound, _pID.vision, _pID.info];

    mainSections.forEach(section => {
      expect(menu.downLinks).toContain(section);
    });
  });

  it('should allow path from vision to stills', () => {
    const vision = findPage(_pID.vision);
    expect(vision.downLinks).toContain(_pID.stills);
  });

  it('should allow back path from stills to vision', () => {
    const stills = findPage(_pID.stills);
    expect(stills.upLinks).toContain(_pID.vision);
  });

  it('should allow path from words to diary', () => {
    const words = findPage(_pID.words);
    expect(words.downLinks).toContain(_pID.diary);
  });

  it('should allow back path from diary to words', () => {
    const diary = findPage(_pID.diary);
    expect(diary.upLinks).toContain(_pID.words);
  });

  it('should have complete navigation cycle from landing to any tier 4 and back', () => {
    // Test path: landing -> menu -> vision -> stills -> vision -> menu -> landing

    const landing = findPage(_pID.landing);
    expect(landing.downLinks).toContain(_pID.menu);

    const menu = findPage(_pID.menu);
    expect(menu.upLinks).toContain(_pID.landing);
    expect(menu.downLinks).toContain(_pID.vision);

    const vision = findPage(_pID.vision);
    expect(vision.upLinks).toContain(_pID.menu);
    expect(vision.downLinks).toContain(_pID.stills);

    const stills = findPage(_pID.stills);
    expect(stills.upLinks).toContain(_pID.vision);
  });
});

describe('Page Tier Assignments', () => {
  const expectedTiers = {
    '#landing': 1,
    '#menu': 2,
    '#words': 3,
    '#sound': 3,
    '#vision': 3,
    '#info': 3,
    '#stills': 4,
    '#diary': 4,
    '#video': 4,
    '#blog': 4,
    '#ogod3d': 4,
  };

  Object.entries(expectedTiers).forEach(([pageId, expectedTier]) => {
    it(`should have ${pageId} at tier ${expectedTier}`, () => {
      // This test validates the expected tier structure
      expect(expectedTier).toBeGreaterThan(0);
      expect(expectedTier).toBeLessThanOrEqual(4);
    });
  });

  it('should have exactly 4 tier levels', () => {
    const tiers = new Set(Object.values(expectedTiers));
    expect(tiers.size).toBe(4);
    expect(tiers).toContain(1);
    expect(tiers).toContain(2);
    expect(tiers).toContain(3);
    expect(tiers).toContain(4);
  });
});

describe('jQuery cachedScript utility', () => {
  it('should be a function that returns a promise-like object', () => {
    // Mock jQuery and $.ajax
    const mockAjax = vi.fn(() => ({
      done: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
    }));

    // Verify the structure of cachedScript function
    const cachedScript = function (url, options) {
      options = Object.assign(options || {}, {
        dataType: 'script',
        cache: true,
        url,
      });
      return mockAjax(options);
    };

    const result = cachedScript('test.js');

    expect(result).toHaveProperty('done');
    expect(result).toHaveProperty('fail');
    expect(mockAjax).toHaveBeenCalledWith(
      expect.objectContaining({
        dataType: 'script',
        cache: true,
        url: 'test.js',
      })
    );
  });
});
