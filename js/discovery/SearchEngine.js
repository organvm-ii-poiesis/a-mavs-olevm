/**
 * @file SearchEngine.js
 * @description Full-text search engine using MiniSearch library.
 * Provides fast fuzzy search with field boosting and result highlighting.
 *
 * Features:
 * - Full-text search with fuzzy matching
 * - Field-specific boosting (title 3x, tags 2.5x, description 2x, content 1x)
 * - Result highlighting with <mark> tags
 * - Debounced search for performance
 * - Integration with ContentRegistry
 *
 * Usage:
 * ------
 * const engine = SearchEngine.getInstance();
 * await engine.initialize();
 *
 * const results = engine.search('digital art');
 * // Returns array of { item, score, highlights }
 */

'use strict';

/**
 * SearchEngine - Full-text search singleton
 * @class
 */
class SearchEngine {
  /**
   * Get or create the singleton instance
   * @static
   * @returns {SearchEngine}
   */
  static getInstance() {
    if (!window.searchEngineInstance) {
      window.searchEngineInstance = new SearchEngine();
    }
    return window.searchEngineInstance;
  }

  /**
   * Create a new SearchEngine instance
   * @private
   */
  constructor() {
    // Configuration
    this.config = typeof ETCETER4_CONFIG !== 'undefined'
      ? ETCETER4_CONFIG.discovery?.search || {}
      : {};

    // MiniSearch instance
    this.miniSearch = null;

    // State
    this.isInitialized = false;

    // Debounce timer
    this._debounceTimer = null;

    // Cache for recent searches
    this._searchCache = new Map();
    this._cacheMaxSize = 50;

    // Search listeners
    this.listeners = new Set();
  }

  /**
   * Initialize the search engine
   * @returns {Promise<SearchEngine>}
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('SearchEngine: Already initialized');
      return this;
    }

    // Check if MiniSearch is available
    if (typeof MiniSearch === 'undefined') {
      console.error('SearchEngine: MiniSearch library not loaded');
      return this;
    }

    // Get registry
    const registry = ContentRegistry.getInstance();
    if (!registry.isInitialized) {
      await registry.initialize();
    }

    // Configure MiniSearch
    const fieldWeights = this.config.fieldWeights || {
      title: 3,
      tags: 2.5,
      description: 2,
      content: 1,
    };

    this.miniSearch = new MiniSearch({
      fields: ['title', 'subtitle', 'description', 'tagsText', 'chamberName', 'sectionTitle'],
      storeFields: ['id'],
      searchOptions: {
        boost: {
          title: fieldWeights.title,
          tagsText: fieldWeights.tags,
          description: fieldWeights.description,
          subtitle: 1.5,
          chamberName: 1,
          sectionTitle: 1,
        },
        fuzzy: this.config.fuzzyThreshold || 0.3,
        prefix: true,
      },
    });

    // Index all items
    const items = registry.getAllItems();
    const documents = items.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      tagsText: item.tags.join(' '),
      chamberName: item.chamberName || '',
      sectionTitle: item.sectionTitle || '',
    }));

    this.miniSearch.addAll(documents);

    this.isInitialized = true;
    console.info(`SearchEngine: Initialized with ${items.length} documents`);

    return this;
  }

  /**
   * Search for items matching query
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {number} [options.limit] - Maximum results to return
   * @param {Object} [options.filter] - Additional filter criteria
   * @returns {Array} Array of { item, score, highlights }
   */
  search(query, options = {}) {
    if (!this.isInitialized || !this.miniSearch) {
      console.warn('SearchEngine: Not initialized');
      return [];
    }

    const trimmedQuery = (query || '').trim();
    const minLength = this.config.minQueryLength || 2;

    if (trimmedQuery.length < minLength) {
      return [];
    }

    // Check cache
    const cacheKey = `${trimmedQuery}|${JSON.stringify(options)}`;
    if (this._searchCache.has(cacheKey)) {
      return this._searchCache.get(cacheKey);
    }

    // Perform search
    const searchResults = this.miniSearch.search(trimmedQuery, {
      fuzzy: this.config.fuzzyThreshold || 0.3,
      prefix: true,
    });

    // Get registry for full item data
    const registry = ContentRegistry.getInstance();

    // Map results to items with highlights
    let results = searchResults.map(result => {
      const item = registry.getItem(result.id);
      if (!item) {
        return null;
      }

      return {
        item,
        score: result.score,
        highlights: this._generateHighlights(item, trimmedQuery),
        matchedFields: result.match,
      };
    }).filter(Boolean);

    // Apply additional filter if provided
    if (options.filter) {
      const filteredIds = new Set(
        registry.filter(options.filter).map(i => i.id)
      );
      results = results.filter(r => filteredIds.has(r.item.id));
    }

    // Apply limit
    const limit = options.limit || this.config.maxResults || 50;
    results = results.slice(0, limit);

    // Cache results
    this._addToCache(cacheKey, results);

    return results;
  }

  /**
   * Debounced search - returns a promise that resolves after debounce delay
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Promise<Array>}
   */
  searchDebounced(query, options = {}) {
    return new Promise(resolve => {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }

      const delay = this.config.debounceMs || 300;

      this._debounceTimer = setTimeout(() => {
        const results = this.search(query, options);
        resolve(results);
        this._emitSearchEvent(query, results);
      }, delay);
    });
  }

  /**
   * Generate highlight snippets for search results
   * @private
   * @param {Object} item - Item to highlight
   * @param {string} query - Search query
   * @returns {Object} Highlights for each field
   */
  _generateHighlights(item, query) {
    const highlights = {};
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    // Title highlight
    if (item.title) {
      highlights.title = this._highlightText(item.title, queryTerms);
    }

    // Description highlight (truncated)
    if (item.description) {
      const truncated = this._truncateToContext(item.description, queryTerms, 150);
      highlights.description = this._highlightText(truncated, queryTerms);
    }

    // Tags highlight
    if (item.tags && item.tags.length > 0) {
      highlights.tags = item.tags.map(tag => {
        const isMatch = queryTerms.some(term =>
          tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())
        );
        return isMatch ? `<mark>${this._escapeHtml(tag)}</mark>` : this._escapeHtml(tag);
      });
    }

    return highlights;
  }

  /**
   * Highlight matching terms in text
   * @private
   * @param {string} text - Text to highlight
   * @param {string[]} terms - Terms to highlight
   * @returns {string} HTML with <mark> tags
   */
  _highlightText(text, terms) {
    if (!text || !terms.length) {
      return this._escapeHtml(text || '');
    }

    let result = this._escapeHtml(text);

    // Sort terms by length (longest first) to avoid partial replacements
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);

    sortedTerms.forEach(term => {
      if (term.length < 2) {
        return;
      }
      // Case-insensitive replacement with preserved case
      const regex = new RegExp(`(${this._escapeRegex(term)})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
  }

  /**
   * Truncate text to show context around matched terms
   * @private
   * @param {string} text - Full text
   * @param {string[]} terms - Search terms
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  _truncateToContext(text, terms, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }

    const lowerText = text.toLowerCase();

    // Find first matching term position
    let firstMatchPos = -1;
    for (const term of terms) {
      const pos = lowerText.indexOf(term.toLowerCase());
      if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
        firstMatchPos = pos;
      }
    }

    if (firstMatchPos === -1) {
      // No match found, return start of text
      return text.substring(0, maxLength) + '...';
    }

    // Calculate window around match
    const contextBefore = 30;
    const start = Math.max(0, firstMatchPos - contextBefore);
    const end = Math.min(text.length, start + maxLength);

    let result = text.substring(start, end);

    // Add ellipsis
    if (start > 0) {
      result = '...' + result;
    }
    if (end < text.length) {
      result = result + '...';
    }

    return result;
  }

  /**
   * Escape HTML special characters
   * @private
   */
  _escapeHtml(text) {
    if (!text) {
      return '';
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Escape regex special characters
   * @private
   */
  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Add to cache with LRU eviction
   * @private
   */
  _addToCache(key, value) {
    if (this._searchCache.size >= this._cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this._searchCache.keys().next().value;
      this._searchCache.delete(firstKey);
    }
    this._searchCache.set(key, value);
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this._searchCache.clear();
  }

  /**
   * Re-index all items (call when content changes)
   */
  async reindex() {
    if (!this.miniSearch) {
      return;
    }

    const registry = ContentRegistry.getInstance();
    const items = registry.getAllItems();

    // Clear and rebuild index
    this.miniSearch.removeAll();

    const documents = items.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      tagsText: item.tags.join(' '),
      chamberName: item.chamberName || '',
      sectionTitle: item.sectionTitle || '',
    }));

    this.miniSearch.addAll(documents);
    this.clearCache();

    console.info(`SearchEngine: Reindexed ${items.length} documents`);
  }

  /**
   * Register search event listener
   * @param {Function} callback - Function(query, results)
   */
  onSearch(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  }

  /**
   * Unregister search event listener
   * @param {Function} callback
   */
  offSearch(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Emit search event to listeners
   * @private
   */
  _emitSearchEvent(query, results) {
    const eventDetail = { query, results, timestamp: Date.now() };

    for (const callback of this.listeners) {
      try {
        callback(eventDetail);
      } catch (error) {
        console.error('SearchEngine listener error:', error);
      }
    }

    window.dispatchEvent(new CustomEvent('discovery-search', {
      detail: eventDetail,
    }));
  }

  /**
   * Get suggestions for autocomplete
   * @param {string} prefix - Input prefix
   * @param {number} [limit=5] - Maximum suggestions
   * @returns {Array} Array of suggestion strings
   */
  getSuggestions(prefix, limit = 5) {
    if (!this.isInitialized || !prefix || prefix.length < 2) {
      return [];
    }

    const registry = ContentRegistry.getInstance();
    const lowerPrefix = prefix.toLowerCase();
    const suggestions = new Set();

    // Search titles
    registry.getAllItems().forEach(item => {
      if (item.title.toLowerCase().startsWith(lowerPrefix)) {
        suggestions.add(item.title);
      }
    });

    // Search tags
    registry.getAllTags().forEach(({ tag }) => {
      if (tag.toLowerCase().startsWith(lowerPrefix)) {
        suggestions.add(tag);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get engine status
   * @returns {Object}
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      documentCount: this.miniSearch ? this.miniSearch.documentCount : 0,
      cacheSize: this._searchCache.size,
    };
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._searchCache.clear();
    this.listeners.clear();
    this.miniSearch = null;
    this.isInitialized = false;
  }
}

// Export for global scope
window.SearchEngine = SearchEngine;
