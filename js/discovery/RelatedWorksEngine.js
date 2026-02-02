/**
 * @file RelatedWorksEngine.js
 * @description Compute content similarity scores for related works recommendations.
 * Uses weighted scoring based on tag overlap, chamber proximity, temporal closeness, etc.
 *
 * Features:
 * - Tag overlap scoring (Jaccard similarity)
 * - Chamber and wing proximity
 * - Temporal proximity (same year/period)
 * - Content type matching
 * - Configurable weights
 *
 * Scoring Weights (default):
 * - tagOverlap: 40% - Jaccard similarity of tags
 * - sameSection: 15% - Same section within chamber
 * - sameChamber: 10% - Same chamber
 * - sameWing: 5% - Same wing
 * - temporal: 15% - Temporal proximity
 * - typeMatch: 15% - Same content type
 *
 * Usage:
 * ------
 * const engine = RelatedWorksEngine.getInstance();
 * engine.initialize();
 *
 * const related = engine.getRelated('item-id', 5);
 * // Returns array of { item, score, reasons }
 */

'use strict';

/**
 * RelatedWorksEngine - Content similarity engine singleton
 * @class
 */
class RelatedWorksEngine {
  /**
   * Get or create the singleton instance
   * @static
   * @returns {RelatedWorksEngine}
   */
  static getInstance() {
    if (!window.relatedWorksEngineInstance) {
      window.relatedWorksEngineInstance = new RelatedWorksEngine();
    }
    return window.relatedWorksEngineInstance;
  }

  /**
   * Create a new RelatedWorksEngine instance
   * @private
   */
  constructor() {
    // Configuration
    this.config = typeof ETCETER4_CONFIG !== 'undefined'
      ? ETCETER4_CONFIG.discovery?.relatedWorks || {}
      : {};

    // Default weights
    this.weights = {
      tagOverlap: 0.40,
      sameSection: 0.15,
      sameChamber: 0.10,
      sameWing: 0.05,
      temporal: 0.15,
      typeMatch: 0.15,
      ...this.config.weights,
    };

    // Configuration values
    this.maxItems = this.config.maxItems || 5;
    this.scoreThreshold = this.config.scoreThreshold || 0.15;

    // State
    this.isInitialized = false;

    // Cache for computed similarities
    this._cache = new Map();
    this._cacheMaxSize = 100;
  }

  /**
   * Initialize the engine
   * @returns {RelatedWorksEngine}
   */
  initialize() {
    if (this.isInitialized) {
      return this;
    }

    // Ensure ContentRegistry is available
    const registry = ContentRegistry.getInstance();
    if (!registry.isInitialized) {
      console.warn('RelatedWorksEngine: ContentRegistry not initialized');
      return this;
    }

    this.isInitialized = true;
    console.info('RelatedWorksEngine: Initialized');

    return this;
  }

  /**
   * Get related items for a given item
   * @param {string} itemId - ID of the source item
   * @param {number} [limit] - Maximum items to return
   * @returns {Array} Array of { item, score, reasons }
   */
  getRelated(itemId, limit) {
    if (!this.isInitialized) {
      console.warn('RelatedWorksEngine: Not initialized');
      return [];
    }

    const maxResults = limit || this.maxItems;

    // Check cache
    const cacheKey = `${itemId}|${maxResults}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const registry = ContentRegistry.getInstance();
    const sourceItem = registry.getItem(itemId);

    if (!sourceItem) {
      console.warn(`RelatedWorksEngine: Item not found: ${itemId}`);
      return [];
    }

    // Get all items except source
    const allItems = registry.getAllItems().filter(item => item.id !== itemId);

    // Score each item
    const scored = allItems.map(item => {
      const { score, reasons } = this._computeSimilarity(sourceItem, item);
      return { item, score, reasons };
    });

    // Filter by threshold and sort by score
    const results = scored
      .filter(r => r.score >= this.scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    // Cache results
    this._addToCache(cacheKey, results);

    return results;
  }

  /**
   * Compute similarity score between two items
   * @private
   * @param {Object} source - Source item
   * @param {Object} target - Target item to compare
   * @returns {Object} { score, reasons }
   */
  _computeSimilarity(source, target) {
    const reasons = [];
    let totalScore = 0;

    // Tag overlap (Jaccard similarity)
    const tagScore = this._computeTagOverlap(source.tags, target.tags);
    totalScore += tagScore * this.weights.tagOverlap;
    if (tagScore > 0) {
      const sharedTags = source.tags.filter(t => target.tags.includes(t));
      reasons.push({
        type: 'tags',
        score: tagScore,
        detail: `Shared tags: ${sharedTags.join(', ')}`,
      });
    }

    // Same section
    if (source.section === target.section && source.chamber === target.chamber) {
      totalScore += this.weights.sameSection;
      reasons.push({
        type: 'section',
        score: 1,
        detail: `Same section: ${source.sectionTitle || source.section}`,
      });
    }

    // Same chamber
    if (source.chamber === target.chamber) {
      totalScore += this.weights.sameChamber;
      reasons.push({
        type: 'chamber',
        score: 1,
        detail: `Same chamber: ${source.chamberName || source.chamber}`,
      });
    }

    // Same wing
    if (source.wing && source.wing === target.wing) {
      totalScore += this.weights.sameWing;
      reasons.push({
        type: 'wing',
        score: 1,
        detail: `Same wing: ${source.wing}`,
      });
    }

    // Temporal proximity
    const temporalScore = this._computeTemporalProximity(source.year, target.year);
    if (temporalScore > 0) {
      totalScore += temporalScore * this.weights.temporal;
      reasons.push({
        type: 'temporal',
        score: temporalScore,
        detail: temporalScore === 1
          ? `Same year: ${source.year}`
          : `Close in time: ${target.year}`,
      });
    }

    // Type match
    if (source.type === target.type) {
      totalScore += this.weights.typeMatch;
      reasons.push({
        type: 'type',
        score: 1,
        detail: `Same type: ${source.type}`,
      });
    }

    return {
      score: Math.min(1, totalScore), // Cap at 1.0
      reasons,
    };
  }

  /**
   * Compute Jaccard similarity for tag sets
   * @private
   * @param {string[]} tags1 - First tag array
   * @param {string[]} tags2 - Second tag array
   * @returns {number} Similarity score 0-1
   */
  _computeTagOverlap(tags1, tags2) {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
      return 0;
    }

    const set1 = new Set(tags1);
    const set2 = new Set(tags2);

    // Intersection
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    // Union
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Compute temporal proximity score
   * @private
   * @param {number|null} year1 - First year
   * @param {number|null} year2 - Second year
   * @returns {number} Proximity score 0-1
   */
  _computeTemporalProximity(year1, year2) {
    if (!year1 || !year2) {
      return 0;
    }

    // Same year = full score
    if (year1 === year2) {
      return 1;
    }

    // Score decreases with distance
    const diff = Math.abs(year1 - year2);

    // Within 1 year: 0.8
    // Within 2 years: 0.6
    // Within 3 years: 0.4
    // Within 5 years: 0.2
    // Beyond 5 years: 0

    if (diff <= 1) {
      return 0.8;
    }
    if (diff <= 2) {
      return 0.6;
    }
    if (diff <= 3) {
      return 0.4;
    }
    if (diff <= 5) {
      return 0.2;
    }

    return 0;
  }

  /**
   * Get related items for multiple source items (intersection)
   * Useful for "more like these" functionality
   * @param {string[]} itemIds - Array of source item IDs
   * @param {number} [limit] - Maximum items to return
   * @returns {Array} Array of { item, score, reasons }
   */
  getRelatedToMultiple(itemIds, limit) {
    if (!this.isInitialized || !itemIds || itemIds.length === 0) {
      return [];
    }

    const maxResults = limit || this.maxItems;
    const registry = ContentRegistry.getInstance();

    // Get source items
    const sourceItems = itemIds
      .map(id => registry.getItem(id))
      .filter(Boolean);

    if (sourceItems.length === 0) {
      return [];
    }

    // Exclude source items from results
    const excludeIds = new Set(itemIds);
    const allItems = registry.getAllItems().filter(item => !excludeIds.has(item.id));

    // Score each item against all source items
    const scored = allItems.map(item => {
      let totalScore = 0;
      const allReasons = [];

      sourceItems.forEach(source => {
        const { score, reasons } = this._computeSimilarity(source, item);
        totalScore += score;
        allReasons.push(...reasons);
      });

      // Average score across sources
      const avgScore = totalScore / sourceItems.length;

      // Deduplicate reasons
      const uniqueReasons = this._deduplicateReasons(allReasons);

      return { item, score: avgScore, reasons: uniqueReasons };
    });

    // Filter and sort
    return scored
      .filter(r => r.score >= this.scoreThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Deduplicate reason objects
   * @private
   */
  _deduplicateReasons(reasons) {
    const seen = new Map();

    reasons.forEach(reason => {
      const key = `${reason.type}:${reason.detail}`;
      if (!seen.has(key) || seen.get(key).score < reason.score) {
        seen.set(key, reason);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Find items similar to a search query
   * Combines search results with related works
   * @param {string} query - Search query
   * @param {number} [limit] - Maximum items
   * @returns {Array}
   */
  getRelatedToQuery(query, limit) {
    const searchEngine = SearchEngine.getInstance();
    const searchResults = searchEngine.search(query, { limit: 3 });

    if (searchResults.length === 0) {
      return [];
    }

    // Get related to top search results
    const topIds = searchResults.map(r => r.item.id);
    return this.getRelatedToMultiple(topIds, limit);
  }

  /**
   * Precompute and cache related items for all items
   * Call during idle time for better performance
   */
  precomputeAll() {
    if (!this.isInitialized) {
      return;
    }

    const registry = ContentRegistry.getInstance();
    const allItems = registry.getAllItems();

    console.info(`RelatedWorksEngine: Precomputing for ${allItems.length} items...`);

    allItems.forEach(item => {
      this.getRelated(item.id, this.maxItems);
    });

    console.info('RelatedWorksEngine: Precomputation complete');
  }

  /**
   * Add to cache with LRU eviction
   * @private
   */
  _addToCache(key, value) {
    if (this._cache.size >= this._cacheMaxSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this._cache.clear();
  }

  /**
   * Get engine status
   * @returns {Object}
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this._cache.size,
      weights: { ...this.weights },
      maxItems: this.maxItems,
      scoreThreshold: this.scoreThreshold,
    };
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    this._cache.clear();
    this.isInitialized = false;
  }
}

// Export for global scope
window.RelatedWorksEngine = RelatedWorksEngine;
