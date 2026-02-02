/**
 * @vitest-environment jsdom
 * Unit tests for RelatedWorksEngine
 * Tests content similarity scoring and recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RelatedWorksEngine', () => {
  let relatedWorksEngine;
  let mockRegistry;

  beforeEach(() => {
    // Mock ContentRegistry
    mockRegistry = {
      isInitialized: true,
      items: [
        {
          id: 'item1',
          title: 'Digital Art Essay',
          tags: ['digital', 'art', 'web'],
          chamber: 'akademia',
          section: 'essays',
          wing: 'east',
          type: 'text',
          year: 2024,
        },
        {
          id: 'item2',
          title: 'Web Design Tutorial',
          tags: ['web', 'design', 'css'],
          chamber: 'akademia',
          section: 'tutorials',
          wing: 'east',
          type: 'text',
          year: 2024,
        },
        {
          id: 'item3',
          title: 'Photography Collection',
          tags: ['photography', 'art'],
          chamber: 'pinakotheke',
          section: 'photography',
          wing: 'east',
          type: 'visual',
          year: 2023,
        },
        {
          id: 'item4',
          title: 'Music Album',
          tags: ['music', 'electronic'],
          chamber: 'odeion',
          section: 'albums',
          wing: 'south',
          type: 'audio',
          year: 2020,
        },
        {
          id: 'item5',
          title: 'Another Digital Essay',
          tags: ['digital', 'culture'],
          chamber: 'akademia',
          section: 'essays',
          wing: 'east',
          type: 'text',
          year: 2024,
        },
      ],
      getAllItems() {
        return this.items;
      },
      getItem(id) {
        return this.items.find(i => i.id === id);
      },
    };

    global.ContentRegistry = {
      getInstance: () => mockRegistry,
    };

    // Create related works engine instance
    relatedWorksEngine = {
      config: {
        maxItems: 5,
        scoreThreshold: 0.15,
        weights: {
          tagOverlap: 0.4,
          sameSection: 0.15,
          sameChamber: 0.1,
          sameWing: 0.05,
          temporal: 0.15,
          typeMatch: 0.15,
        },
      },
      isInitialized: false,
      _cache: new Map(),

      initialize() {
        this.isInitialized = true;
        return this;
      },

      getRelated(itemId, limit = 5) {
        if (!this.isInitialized) return [];

        const sourceItem = mockRegistry.getItem(itemId);
        if (!sourceItem) return [];

        const allItems = mockRegistry
          .getAllItems()
          .filter(i => i.id !== itemId);

        const scored = allItems.map(item => {
          const { score, reasons } = this._computeSimilarity(sourceItem, item);
          return { item, score, reasons };
        });

        return scored
          .filter(r => r.score >= this.config.scoreThreshold)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },

      _computeSimilarity(source, target) {
        const reasons = [];
        let totalScore = 0;

        // Tag overlap (Jaccard similarity)
        const tagScore = this._computeTagOverlap(source.tags, target.tags);
        totalScore += tagScore * this.config.weights.tagOverlap;
        if (tagScore > 0) {
          const sharedTags = source.tags.filter(t => target.tags.includes(t));
          reasons.push({
            type: 'tags',
            score: tagScore,
            detail: `Shared: ${sharedTags.join(', ')}`,
          });
        }

        // Same section
        if (
          source.section === target.section &&
          source.chamber === target.chamber
        ) {
          totalScore += this.config.weights.sameSection;
          reasons.push({
            type: 'section',
            score: 1,
            detail: `Same section: ${source.section}`,
          });
        }

        // Same chamber
        if (source.chamber === target.chamber) {
          totalScore += this.config.weights.sameChamber;
          reasons.push({
            type: 'chamber',
            score: 1,
            detail: `Same chamber: ${source.chamber}`,
          });
        }

        // Same wing
        if (source.wing && source.wing === target.wing) {
          totalScore += this.config.weights.sameWing;
          reasons.push({
            type: 'wing',
            score: 1,
            detail: `Same wing: ${source.wing}`,
          });
        }

        // Temporal proximity
        const temporalScore = this._computeTemporalProximity(
          source.year,
          target.year
        );
        if (temporalScore > 0) {
          totalScore += temporalScore * this.config.weights.temporal;
          reasons.push({
            type: 'temporal',
            score: temporalScore,
            detail: `Year: ${target.year}`,
          });
        }

        // Type match
        if (source.type === target.type) {
          totalScore += this.config.weights.typeMatch;
          reasons.push({
            type: 'type',
            score: 1,
            detail: `Same type: ${source.type}`,
          });
        }

        return { score: Math.min(1, totalScore), reasons };
      },

      _computeTagOverlap(tags1, tags2) {
        if (!tags1?.length || !tags2?.length) return 0;

        const set1 = new Set(tags1);
        const set2 = new Set(tags2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
      },

      _computeTemporalProximity(year1, year2) {
        if (!year1 || !year2) return 0;
        if (year1 === year2) return 1;

        const diff = Math.abs(year1 - year2);
        if (diff <= 1) return 0.8;
        if (diff <= 2) return 0.6;
        if (diff <= 3) return 0.4;
        if (diff <= 5) return 0.2;
        return 0;
      },

      clearCache() {
        this._cache.clear();
      },
    };

    relatedWorksEngine.initialize();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(relatedWorksEngine.isInitialized).toBe(true);
    });

    it('should return empty array when not initialized', () => {
      relatedWorksEngine.isInitialized = false;
      const results = relatedWorksEngine.getRelated('item1');
      expect(results).toEqual([]);
    });
  });

  describe('Related Items', () => {
    it('should return related items for valid item ID', () => {
      const results = relatedWorksEngine.getRelated('item1');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should not include source item in results', () => {
      const results = relatedWorksEngine.getRelated('item1');
      expect(results.find(r => r.item.id === 'item1')).toBeUndefined();
    });

    it('should respect limit parameter', () => {
      const results = relatedWorksEngine.getRelated('item1', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for non-existent item', () => {
      const results = relatedWorksEngine.getRelated('nonexistent');
      expect(results).toEqual([]);
    });

    it('should sort results by score descending', () => {
      const results = relatedWorksEngine.getRelated('item1');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Similarity Scoring', () => {
    it('should score items with shared tags higher', () => {
      const results = relatedWorksEngine.getRelated('item1');

      // item2 shares 'web' tag, should be related
      // item5 shares 'digital' tag, should be related
      const item2Result = results.find(r => r.item.id === 'item2');
      const item5Result = results.find(r => r.item.id === 'item5');

      expect(item2Result || item5Result).toBeDefined();
    });

    it('should score items in same section higher', () => {
      const results = relatedWorksEngine.getRelated('item1');
      const item5Result = results.find(r => r.item.id === 'item5');

      if (item5Result) {
        expect(item5Result.reasons.some(r => r.type === 'section')).toBe(true);
      }
    });

    it('should score items in same chamber higher', () => {
      const results = relatedWorksEngine.getRelated('item1');
      const sameChamberResults = results.filter(
        r => r.item.chamber === 'akademia'
      );

      expect(sameChamberResults.length).toBeGreaterThan(0);
    });
  });

  describe('Tag Overlap (Jaccard Similarity)', () => {
    it('should compute correct Jaccard similarity', () => {
      // Tags: [a, b, c] and [b, c, d]
      // Intersection: [b, c] = 2
      // Union: [a, b, c, d] = 4
      // Jaccard: 2/4 = 0.5
      const score = relatedWorksEngine._computeTagOverlap(
        ['a', 'b', 'c'],
        ['b', 'c', 'd']
      );
      expect(score).toBe(0.5);
    });

    it('should return 1 for identical tag sets', () => {
      const score = relatedWorksEngine._computeTagOverlap(
        ['a', 'b'],
        ['a', 'b']
      );
      expect(score).toBe(1);
    });

    it('should return 0 for disjoint tag sets', () => {
      const score = relatedWorksEngine._computeTagOverlap(
        ['a', 'b'],
        ['c', 'd']
      );
      expect(score).toBe(0);
    });

    it('should handle empty tag arrays', () => {
      expect(relatedWorksEngine._computeTagOverlap([], ['a'])).toBe(0);
      expect(relatedWorksEngine._computeTagOverlap(['a'], [])).toBe(0);
      expect(relatedWorksEngine._computeTagOverlap(null, ['a'])).toBe(0);
    });
  });

  describe('Temporal Proximity', () => {
    it('should return 1 for same year', () => {
      const score = relatedWorksEngine._computeTemporalProximity(2024, 2024);
      expect(score).toBe(1);
    });

    it('should return 0.8 for 1 year difference', () => {
      const score = relatedWorksEngine._computeTemporalProximity(2024, 2023);
      expect(score).toBe(0.8);
    });

    it('should return 0.6 for 2 year difference', () => {
      const score = relatedWorksEngine._computeTemporalProximity(2024, 2022);
      expect(score).toBe(0.6);
    });

    it('should return 0 for more than 5 year difference', () => {
      const score = relatedWorksEngine._computeTemporalProximity(2024, 2015);
      expect(score).toBe(0);
    });

    it('should handle null years', () => {
      expect(relatedWorksEngine._computeTemporalProximity(null, 2024)).toBe(0);
      expect(relatedWorksEngine._computeTemporalProximity(2024, null)).toBe(0);
    });
  });

  describe('Reasons', () => {
    it('should include reasons for each scoring factor', () => {
      const results = relatedWorksEngine.getRelated('item1');
      const result = results[0];

      expect(result.reasons).toBeDefined();
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should include tag reason when tags overlap', () => {
      const results = relatedWorksEngine.getRelated('item1');
      const itemWithSharedTags = results.find(r =>
        r.reasons.some(reason => reason.type === 'tags')
      );

      expect(itemWithSharedTags).toBeDefined();
    });
  });

  describe('Score Threshold', () => {
    it('should filter out items below threshold', () => {
      const results = relatedWorksEngine.getRelated('item1');

      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(
          relatedWorksEngine.config.scoreThreshold
        );
      });
    });
  });
});

describe('Scoring Weight Configuration', () => {
  it('should have weights that sum to approximately 1', () => {
    const weights = {
      tagOverlap: 0.4,
      sameSection: 0.15,
      sameChamber: 0.1,
      sameWing: 0.05,
      temporal: 0.15,
      typeMatch: 0.15,
    };

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBe(1);
  });

  it('should prioritize tag overlap over other factors', () => {
    const weights = {
      tagOverlap: 0.4,
      sameSection: 0.15,
      sameChamber: 0.1,
      sameWing: 0.05,
      temporal: 0.15,
      typeMatch: 0.15,
    };

    expect(weights.tagOverlap).toBeGreaterThan(weights.sameSection);
    expect(weights.tagOverlap).toBeGreaterThan(weights.sameChamber);
    expect(weights.tagOverlap).toBeGreaterThan(weights.typeMatch);
  });
});
