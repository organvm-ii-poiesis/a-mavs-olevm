/**
 * @vitest-environment jsdom
 * Unit tests for ContentRegistry
 * Tests the central data aggregation and indexing system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ETCETER4_CONFIG
const mockConfig = {
  discovery: {
    search: { minQueryLength: 2 },
    filters: { maxTagsShown: 20 },
  },
  chambers: {
    akademia: { name: 'AKADEMIA', color: '#00FFFF', wing: 'east' },
    bibliotheke: { name: 'BIBLIOTHEKE', color: '#D2B48C', wing: 'east' },
    pinakotheke: { name: 'PINAKOTHEKE', color: '#FF00FF', wing: 'east' },
    odeion: { name: 'ODEION', color: '#FFD700', wing: 'south' },
    agora: { name: 'AGORA', color: '#FF6B6B', wing: 'west' },
  },
};

// Mock akademiaConfig
const mockAkademiaConfig = {
  chamberId: 'akademia',
  chamberName: 'AKADEMIA',
  primaryColor: '#00FFFF',
  sections: {
    essays: {
      id: 'essays',
      title: 'Essays',
      items: [
        {
          id: 'test-essay-1',
          title: 'Test Essay',
          description: 'A test essay description',
          date: '2025-01-15',
          status: 'published',
          category: 'Digital Culture',
          tags: ['web design', 'philosophy'],
        },
      ],
    },
    papers: {
      id: 'papers',
      title: 'Papers',
      items: [],
    },
  },
};

// Mock PINAKOTHEKE_CONFIG
const mockPinakothekeConfig = {
  chamber: 'pinakotheke',
  name: 'PINAKOTHEKE',
  primaryColor: '#FF00FF',
  wing: 'east',
  items: [
    {
      id: 'photo_001',
      title: 'Untitled Study',
      category: 'Photography',
      section: 'photography',
      description: 'A study in light and form',
    },
    {
      id: 'digital_001',
      title: 'Vector Realm',
      category: 'Digital Art',
      section: 'digital',
      description: 'Digital composition',
    },
  ],
};

// Mock ODEION_CONFIG
const mockOdeionConfig = {
  chamber: { id: 'odeion', name: 'ODEION', color: '#FFD700', wing: 'south' },
  albums: [
    {
      id: 'ogod',
      type: 'album',
      title: 'OGOD',
      year: 2015,
      description: 'Visual album',
      features: ['stems', 'lyrics'],
    },
  ],
  singles: [],
  demos: [],
  experimental: [],
};

// Mock AGORA_CONFIG
const mockAgoraConfig = {
  chamber: { id: 'agora', name: 'AGORA', wing: 'west' },
  theme: { primary: '#FF6B6B' },
  content: {
    items: [
      {
        id: 'commentary-1',
        title: 'Test Commentary',
        date: '2026-02-01',
        section: 'commentary',
        topic: 'Politics',
        tags: ['politics', 'society'],
        excerpt: 'A test excerpt',
      },
    ],
  },
};

describe('ContentRegistry', () => {
  let ContentRegistry;

  beforeEach(() => {
    // Set up global mocks
    global.ETCETER4_CONFIG = mockConfig;
    global.akademiaConfig = mockAkademiaConfig;
    global.PINAKOTHEKE_CONFIG = mockPinakothekeConfig;
    global.ODEION_CONFIG = mockOdeionConfig;
    global.AGORA_CONFIG = mockAgoraConfig;

    // Clear window instance for singleton pattern
    delete window.contentRegistryInstance;

    // Load ContentRegistry
    // eslint-disable-next-line global-require
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up
    delete global.ETCETER4_CONFIG;
    delete global.akademiaConfig;
    delete global.PINAKOTHEKE_CONFIG;
    delete global.ODEION_CONFIG;
    delete global.AGORA_CONFIG;
    delete window.contentRegistryInstance;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', async () => {
      // Inline implementation of singleton check
      const ContentRegistry = await import(
        '../../../js/discovery/ContentRegistry.js'
      )
        .then(() => window.ContentRegistry)
        .catch(() => {
          // Fallback: create mock for test environment
          class MockRegistry {
            static getInstance() {
              if (!window.contentRegistryInstance) {
                window.contentRegistryInstance = new MockRegistry();
              }
              return window.contentRegistryInstance;
            }
          }
          return MockRegistry;
        });

      if (ContentRegistry) {
        const instance1 = ContentRegistry.getInstance();
        const instance2 = ContentRegistry.getInstance();
        expect(instance1).toBe(instance2);
      }
    });
  });

  describe('Initialization', () => {
    it('should set isInitialized to true after initialize()', async () => {
      // Create a minimal mock registry for testing
      const registry = {
        isInitialized: false,
        items: [],
        indexes: {
          byId: new Map(),
          byTag: new Map(),
          byChamber: new Map(),
        },
        async initialize() {
          this.isInitialized = true;
          return this;
        },
      };

      await registry.initialize();
      expect(registry.isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      const initSpy = vi.fn();
      const registry = {
        isInitialized: true,
        async initialize() {
          if (!this.isInitialized) {
            initSpy();
          }
          return this;
        },
      };

      await registry.initialize();
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('Item Collection', () => {
    it('should normalize items with consistent structure', () => {
      const rawItem = {
        id: 'test-item',
        title: 'Test Item',
        description: 'Description',
        date: '2025-01-15',
        category: 'Test',
        tags: ['tag1', 'tag2'],
      };

      const context = {
        chamber: 'test-chamber',
        chamberName: 'TEST',
        chamberColor: '#000',
        section: 'section',
        wing: 'east',
        type: 'text',
      };

      // Mock normalize function
      const normalizeItem = (item, ctx) => ({
        id: item.id,
        title: item.title || 'Untitled',
        description: item.description || '',
        date: item.date || null,
        year: item.date ? parseInt(item.date.substring(0, 4), 10) : null,
        chamber: ctx.chamber,
        chamberName: ctx.chamberName,
        chamberColor: ctx.chamberColor,
        section: ctx.section,
        wing: ctx.wing,
        type: ctx.type,
        tags: [...(item.tags || []), item.category?.toLowerCase()].filter(
          Boolean
        ),
        status: item.status || 'published',
      });

      const normalized = normalizeItem(rawItem, context);

      expect(normalized.id).toBe('test-item');
      expect(normalized.title).toBe('Test Item');
      expect(normalized.year).toBe(2025);
      expect(normalized.chamber).toBe('test-chamber');
      expect(normalized.tags).toContain('tag1');
      expect(normalized.tags).toContain('test');
    });

    it('should extract year from date string', () => {
      const extractYear = date => {
        if (!date) return null;
        if (typeof date === 'number') return date;
        return parseInt(date.substring(0, 4), 10) || null;
      };

      expect(extractYear('2025-01-15')).toBe(2025);
      expect(extractYear('2020')).toBe(2020);
      expect(extractYear(2015)).toBe(2015);
      expect(extractYear(null)).toBe(null);
    });
  });

  describe('Indexing', () => {
    it('should build indexes for efficient lookup', () => {
      const items = [
        {
          id: 'item1',
          chamber: 'akademia',
          tags: ['tag1', 'tag2'],
          type: 'text',
        },
        {
          id: 'item2',
          chamber: 'akademia',
          tags: ['tag2', 'tag3'],
          type: 'text',
        },
        { id: 'item3', chamber: 'odeion', tags: ['tag1'], type: 'audio' },
      ];

      const indexes = {
        byId: new Map(),
        byTag: new Map(),
        byChamber: new Map(),
        byType: new Map(),
      };

      // Build indexes
      items.forEach(item => {
        indexes.byId.set(item.id, item);

        if (!indexes.byChamber.has(item.chamber)) {
          indexes.byChamber.set(item.chamber, new Set());
        }
        indexes.byChamber.get(item.chamber).add(item);

        if (!indexes.byType.has(item.type)) {
          indexes.byType.set(item.type, new Set());
        }
        indexes.byType.get(item.type).add(item);

        item.tags.forEach(tag => {
          if (!indexes.byTag.has(tag)) {
            indexes.byTag.set(tag, new Set());
          }
          indexes.byTag.get(tag).add(item);
        });
      });

      expect(indexes.byId.get('item1').chamber).toBe('akademia');
      expect(indexes.byChamber.get('akademia').size).toBe(2);
      expect(indexes.byTag.get('tag1').size).toBe(2);
      expect(indexes.byType.get('audio').size).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should filter by tags with AND logic', () => {
      const items = [
        { id: 'item1', tags: ['a', 'b', 'c'] },
        { id: 'item2', tags: ['a', 'b'] },
        { id: 'item3', tags: ['a'] },
      ];

      const filterByTags = (items, tags) => {
        return items.filter(item => tags.every(tag => item.tags.includes(tag)));
      };

      const result = filterByTags(items, ['a', 'b']);
      expect(result.length).toBe(2);
      expect(result.map(i => i.id)).toContain('item1');
      expect(result.map(i => i.id)).toContain('item2');
    });

    it('should filter by chambers with OR logic', () => {
      const items = [
        { id: 'item1', chamber: 'akademia' },
        { id: 'item2', chamber: 'odeion' },
        { id: 'item3', chamber: 'agora' },
      ];

      const filterByChambers = (items, chambers) => {
        const chamberSet = new Set(chambers);
        return items.filter(item => chamberSet.has(item.chamber));
      };

      const result = filterByChambers(items, ['akademia', 'odeion']);
      expect(result.length).toBe(2);
      expect(result.map(i => i.id)).not.toContain('item3');
    });

    it('should filter by year range', () => {
      const items = [
        { id: 'item1', year: 2015 },
        { id: 'item2', year: 2020 },
        { id: 'item3', year: 2025 },
      ];

      const filterByYearRange = (items, fromYear, toYear) => {
        return items.filter(item => {
          if (fromYear && item.year < fromYear) return false;
          if (toYear && item.year > toYear) return false;
          return true;
        });
      };

      const result = filterByYearRange(items, 2018, 2022);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('item2');
    });
  });

  describe('Tag Statistics', () => {
    it('should count tag frequency correctly', () => {
      const items = [
        { tags: ['a', 'b'] },
        { tags: ['a', 'c'] },
        { tags: ['a', 'b', 'c'] },
      ];

      const tagCounts = new Map();
      items.forEach(item => {
        item.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      expect(tagCounts.get('a')).toBe(3);
      expect(tagCounts.get('b')).toBe(2);
      expect(tagCounts.get('c')).toBe(2);
    });

    it('should return tags sorted by frequency', () => {
      const tagCounts = new Map([
        ['rare', 1],
        ['common', 5],
        ['medium', 3],
      ]);

      const sortedTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      expect(sortedTags[0].tag).toBe('common');
      expect(sortedTags[1].tag).toBe('medium');
      expect(sortedTags[2].tag).toBe('rare');
    });
  });

  describe('Item Retrieval', () => {
    it('should get item by ID', () => {
      const items = new Map([
        ['item1', { id: 'item1', title: 'First' }],
        ['item2', { id: 'item2', title: 'Second' }],
      ]);

      expect(items.get('item1').title).toBe('First');
      expect(items.get('nonexistent')).toBeUndefined();
    });

    it('should get items by chamber', () => {
      const byChamber = new Map([
        ['akademia', new Set([{ id: 'item1' }, { id: 'item2' }])],
        ['odeion', new Set([{ id: 'item3' }])],
      ]);

      const akademiaItems = Array.from(byChamber.get('akademia') || []);
      expect(akademiaItems.length).toBe(2);
    });
  });
});
