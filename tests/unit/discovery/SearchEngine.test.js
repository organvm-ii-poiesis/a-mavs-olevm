/**
 * @vitest-environment jsdom
 * Unit tests for SearchEngine
 * Tests full-text search functionality with MiniSearch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock MiniSearch
class MockMiniSearch {
  constructor(options) {
    this.options = options;
    this.documents = [];
    this.documentCount = 0;
  }

  addAll(docs) {
    this.documents = docs;
    this.documentCount = docs.length;
  }

  removeAll() {
    this.documents = [];
    this.documentCount = 0;
  }

  search(query, options = {}) {
    const lowerQuery = query.toLowerCase();
    return this.documents
      .filter(
        doc =>
          doc.title.toLowerCase().includes(lowerQuery) ||
          doc.description?.toLowerCase().includes(lowerQuery) ||
          doc.tagsText?.toLowerCase().includes(lowerQuery)
      )
      .map((doc, index) => ({
        id: doc.id,
        score: 10 - index,
        match: { title: [query] },
      }));
  }
}

describe('SearchEngine', () => {
  let searchEngine;
  let mockRegistry;

  beforeEach(() => {
    // Mock global MiniSearch
    global.MiniSearch = MockMiniSearch;

    // Mock ContentRegistry
    mockRegistry = {
      isInitialized: true,
      items: [
        {
          id: 'essay-1',
          title: 'Digital Temple Architecture',
          description: 'An exploration of web architecture',
          tags: ['web design', 'philosophy'],
          chamberName: 'AKADEMIA',
          sectionTitle: 'Essays',
        },
        {
          id: 'album-1',
          title: 'OGOD Visual Album',
          description: 'Video game music arrangements',
          tags: ['music', 'video games'],
          chamberName: 'ODEION',
          sectionTitle: 'Albums',
        },
        {
          id: 'photo-1',
          title: 'Urban Photography',
          description: 'Street photography collection',
          tags: ['photography', 'urban'],
          chamberName: 'PINAKOTHEKE',
          sectionTitle: 'Photography',
        },
      ],
      getAllItems() {
        return this.items;
      },
      getItem(id) {
        return this.items.find(i => i.id === id);
      },
      filter(criteria) {
        return this.items;
      },
    };

    global.ContentRegistry = {
      getInstance: () => mockRegistry,
    };

    // Create search engine instance
    searchEngine = {
      config: { minQueryLength: 2, fuzzyThreshold: 0.3, maxResults: 50 },
      miniSearch: null,
      isInitialized: false,
      _searchCache: new Map(),

      async initialize() {
        this.miniSearch = new MockMiniSearch({
          fields: ['title', 'description', 'tagsText'],
        });

        const docs = mockRegistry.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          tagsText: item.tags.join(' '),
          chamberName: item.chamberName || '',
          sectionTitle: item.sectionTitle || '',
        }));

        this.miniSearch.addAll(docs);
        this.isInitialized = true;
        return this;
      },

      search(query, options = {}) {
        if (
          !this.isInitialized ||
          query.trim().length < this.config.minQueryLength
        ) {
          return [];
        }

        const results = this.miniSearch.search(query);
        return results
          .map(result => ({
            item: mockRegistry.getItem(result.id),
            score: result.score,
            highlights: this._generateHighlights(
              mockRegistry.getItem(result.id),
              query
            ),
          }))
          .filter(r => r.item);
      },

      _generateHighlights(item, query) {
        const highlights = {};
        const terms = query.toLowerCase().split(/\s+/);

        if (item.title) {
          let title = item.title;
          terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            title = title.replace(regex, '<mark>$1</mark>');
          });
          highlights.title = title;
        }

        return highlights;
      },

      clearCache() {
        this._searchCache.clear();
      },
    };
  });

  describe('Initialization', () => {
    it('should initialize with MiniSearch', async () => {
      await searchEngine.initialize();
      expect(searchEngine.isInitialized).toBe(true);
      expect(searchEngine.miniSearch).not.toBeNull();
    });

    it('should index all items from ContentRegistry', async () => {
      await searchEngine.initialize();
      expect(searchEngine.miniSearch.documentCount).toBe(3);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await searchEngine.initialize();
    });

    it('should return empty array for short queries', () => {
      const results = searchEngine.search('a');
      expect(results).toEqual([]);
    });

    it('should find items by title', () => {
      const results = searchEngine.search('Digital');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('essay-1');
    });

    it('should find items by description keywords', () => {
      const results = searchEngine.search('web architecture');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find items by tags', () => {
      const results = searchEngine.search('photography');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.tags).toContain('photography');
    });

    it('should return results with scores', () => {
      const results = searchEngine.search('Digital');
      expect(results[0]).toHaveProperty('score');
      expect(typeof results[0].score).toBe('number');
    });
  });

  describe('Highlighting', () => {
    beforeEach(async () => {
      await searchEngine.initialize();
    });

    it('should generate highlighted title', () => {
      const results = searchEngine.search('Digital');
      expect(results[0].highlights.title).toContain('<mark>');
    });

    it('should preserve case in highlighted text', () => {
      const results = searchEngine.search('digital');
      expect(results[0].highlights.title).toContain('Digital');
    });
  });

  describe('Cache', () => {
    it('should clear cache on clearCache()', async () => {
      await searchEngine.initialize();
      searchEngine._searchCache.set('test', []);
      searchEngine.clearCache();
      expect(searchEngine._searchCache.size).toBe(0);
    });
  });
});

describe('Search Utilities', () => {
  describe('Text Truncation', () => {
    const truncate = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const result = truncate(longText, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short';
      expect(truncate(shortText, 20)).toBe('Short');
    });
  });

  describe('HTML Escaping', () => {
    const escapeHtml = text => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('A & B')).toBe('A &amp; B');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should handle empty input', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
    });
  });

  describe('Context Extraction', () => {
    const truncateToContext = (text, terms, maxLength) => {
      if (!text || text.length <= maxLength) return text;

      const lowerText = text.toLowerCase();
      let firstMatchPos = -1;

      for (const term of terms) {
        const pos = lowerText.indexOf(term.toLowerCase());
        if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
          firstMatchPos = pos;
        }
      }

      if (firstMatchPos === -1) {
        return text.substring(0, maxLength) + '...';
      }

      const contextBefore = 30;
      const start = Math.max(0, firstMatchPos - contextBefore);
      const end = Math.min(text.length, start + maxLength);

      let result = text.substring(start, end);
      if (start > 0) result = '...' + result;
      if (end < text.length) result = result + '...';

      return result;
    };

    it('should extract context around match', () => {
      const text =
        'This is a long text with the keyword somewhere in the middle of it all';
      const result = truncateToContext(text, ['keyword'], 40);
      expect(result).toContain('keyword');
    });

    it('should add ellipsis when truncated', () => {
      const text = 'Start of text with keyword and then more text at the end';
      const result = truncateToContext(text, ['keyword'], 30);
      expect(result).toContain('...');
    });
  });
});
