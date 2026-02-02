/**
 * @file FilterSystem.js
 * @description Filter state management with URL synchronization.
 * Provides multi-select filtering with persistent shareable URLs.
 *
 * Features:
 * - Multi-select tags, chambers, content types
 * - Date range filtering
 * - URL parameter serialization (?tags=a,b&chambers=x&from=2024)
 * - Observer pattern for UI updates
 * - Browser history integration
 *
 * Usage:
 * ------
 * const filters = FilterSystem.getInstance();
 * filters.initialize();
 *
 * // Set filters
 * filters.setTags(['digital', 'art']);
 * filters.setChambers(['pinakotheke']);
 *
 * // Listen for changes
 * filters.onChange(state => console.log(state));
 *
 * // Get filtered results
 * const results = filters.getFilteredItems();
 */

'use strict';

/**
 * FilterSystem - Filter state management singleton
 * @class
 */
class FilterSystem {
  /**
   * Get or create the singleton instance
   * @static
   * @returns {FilterSystem}
   */
  static getInstance() {
    if (!window.filterSystemInstance) {
      window.filterSystemInstance = new FilterSystem();
    }
    return window.filterSystemInstance;
  }

  /**
   * Create a new FilterSystem instance
   * @private
   */
  constructor() {
    // Configuration
    this.config = typeof ETCETER4_CONFIG !== 'undefined'
      ? ETCETER4_CONFIG.discovery?.filters || {}
      : {};

    // Current filter state
    this.state = {
      tags: [],
      chambers: [],
      types: [],
      wings: [],
      statuses: [],
      fromYear: null,
      toYear: null,
      sortBy: 'relevance', // relevance, date, title
      sortOrder: 'desc',   // asc, desc
    };

    // State change listeners
    this.listeners = new Set();

    // Initialization flag
    this.isInitialized = false;

    // URL sync flag
    this.syncToUrl = this.config.persistToUrl !== false;

    // Bind methods
    this._onPopState = this._onPopState.bind(this);
  }

  /**
   * Initialize the filter system
   * @returns {FilterSystem}
   */
  initialize() {
    if (this.isInitialized) {
      return this;
    }

    // Load initial state from URL
    if (this.syncToUrl) {
      this._loadFromUrl();
      window.addEventListener('popstate', this._onPopState);
    } else {
      // Use default state
      const defaults = this.config.defaults || {};
      this.state = { ...this.state, ...defaults };
    }

    this.isInitialized = true;
    console.info('FilterSystem: Initialized');

    return this;
  }

  /**
   * Set tag filters
   * @param {string[]} tags - Tags to filter by
   * @param {boolean} [replace=true] - Replace existing tags or add to them
   * @returns {FilterSystem}
   */
  setTags(tags, replace = true) {
    const normalizedTags = (tags || []).map(t => t.toLowerCase().trim()).filter(Boolean);

    if (replace) {
      this.state.tags = normalizedTags;
    } else {
      this.state.tags = [...new Set([...this.state.tags, ...normalizedTags])];
    }

    this._emitChange();
    return this;
  }

  /**
   * Toggle a single tag
   * @param {string} tag - Tag to toggle
   * @returns {FilterSystem}
   */
  toggleTag(tag) {
    const normalizedTag = tag.toLowerCase().trim();
    const index = this.state.tags.indexOf(normalizedTag);

    if (index === -1) {
      this.state.tags.push(normalizedTag);
    } else {
      this.state.tags.splice(index, 1);
    }

    this._emitChange();
    return this;
  }

  /**
   * Set chamber filters
   * @param {string[]} chambers - Chamber IDs to filter by
   * @param {boolean} [replace=true] - Replace existing or add
   * @returns {FilterSystem}
   */
  setChambers(chambers, replace = true) {
    const normalized = (chambers || []).map(c => c.toLowerCase().trim()).filter(Boolean);

    if (replace) {
      this.state.chambers = normalized;
    } else {
      this.state.chambers = [...new Set([...this.state.chambers, ...normalized])];
    }

    this._emitChange();
    return this;
  }

  /**
   * Toggle a single chamber
   * @param {string} chamber - Chamber ID to toggle
   * @returns {FilterSystem}
   */
  toggleChamber(chamber) {
    const normalized = chamber.toLowerCase().trim();
    const index = this.state.chambers.indexOf(normalized);

    if (index === -1) {
      this.state.chambers.push(normalized);
    } else {
      this.state.chambers.splice(index, 1);
    }

    this._emitChange();
    return this;
  }

  /**
   * Set content type filters
   * @param {string[]} types - Content types to filter by
   * @param {boolean} [replace=true] - Replace existing or add
   * @returns {FilterSystem}
   */
  setTypes(types, replace = true) {
    const normalized = (types || []).map(t => t.toLowerCase().trim()).filter(Boolean);

    if (replace) {
      this.state.types = normalized;
    } else {
      this.state.types = [...new Set([...this.state.types, ...normalized])];
    }

    this._emitChange();
    return this;
  }

  /**
   * Toggle a single content type
   * @param {string} type - Type to toggle
   * @returns {FilterSystem}
   */
  toggleType(type) {
    const normalized = type.toLowerCase().trim();
    const index = this.state.types.indexOf(normalized);

    if (index === -1) {
      this.state.types.push(normalized);
    } else {
      this.state.types.splice(index, 1);
    }

    this._emitChange();
    return this;
  }

  /**
   * Set wing filters
   * @param {string[]} wings - Wings to filter by
   * @param {boolean} [replace=true] - Replace existing or add
   * @returns {FilterSystem}
   */
  setWings(wings, replace = true) {
    const normalized = (wings || []).map(w => w.toLowerCase().trim()).filter(Boolean);

    if (replace) {
      this.state.wings = normalized;
    } else {
      this.state.wings = [...new Set([...this.state.wings, ...normalized])];
    }

    this._emitChange();
    return this;
  }

  /**
   * Toggle a single wing
   * @param {string} wing - Wing to toggle
   * @returns {FilterSystem}
   */
  toggleWing(wing) {
    const normalized = wing.toLowerCase().trim();
    const index = this.state.wings.indexOf(normalized);

    if (index === -1) {
      this.state.wings.push(normalized);
    } else {
      this.state.wings.splice(index, 1);
    }

    this._emitChange();
    return this;
  }

  /**
   * Set date range filter
   * @param {number|null} fromYear - Start year (inclusive)
   * @param {number|null} toYear - End year (inclusive)
   * @returns {FilterSystem}
   */
  setDateRange(fromYear, toYear) {
    this.state.fromYear = fromYear ? parseInt(fromYear, 10) : null;
    this.state.toYear = toYear ? parseInt(toYear, 10) : null;

    this._emitChange();
    return this;
  }

  /**
   * Set sort options
   * @param {string} sortBy - Field to sort by (relevance, date, title)
   * @param {string} [sortOrder='desc'] - Sort order (asc, desc)
   * @returns {FilterSystem}
   */
  setSort(sortBy, sortOrder = 'desc') {
    this.state.sortBy = sortBy;
    this.state.sortOrder = sortOrder;

    this._emitChange();
    return this;
  }

  /**
   * Clear all filters
   * @returns {FilterSystem}
   */
  clearAll() {
    this.state = {
      tags: [],
      chambers: [],
      types: [],
      wings: [],
      statuses: [],
      fromYear: null,
      toYear: null,
      sortBy: 'relevance',
      sortOrder: 'desc',
    };

    this._emitChange();
    return this;
  }

  /**
   * Check if any filters are active
   * @returns {boolean}
   */
  hasActiveFilters() {
    return (
      this.state.tags.length > 0 ||
      this.state.chambers.length > 0 ||
      this.state.types.length > 0 ||
      this.state.wings.length > 0 ||
      this.state.statuses.length > 0 ||
      this.state.fromYear !== null ||
      this.state.toYear !== null
    );
  }

  /**
   * Get current filter state
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set complete filter state
   * @param {Object} state - New state object
   * @param {boolean} [emit=true] - Emit change event
   * @returns {FilterSystem}
   */
  setState(state, emit = true) {
    this.state = {
      tags: state.tags || [],
      chambers: state.chambers || [],
      types: state.types || [],
      wings: state.wings || [],
      statuses: state.statuses || [],
      fromYear: state.fromYear || null,
      toYear: state.toYear || null,
      sortBy: state.sortBy || 'relevance',
      sortOrder: state.sortOrder || 'desc',
    };

    if (emit) {
      this._emitChange();
    }

    return this;
  }

  /**
   * Get filtered items from ContentRegistry
   * @returns {Array}
   */
  getFilteredItems() {
    const registry = ContentRegistry.getInstance();

    if (!registry.isInitialized) {
      console.warn('FilterSystem: ContentRegistry not initialized');
      return [];
    }

    // Build filter criteria
    const criteria = {};

    if (this.state.tags.length > 0) {
      criteria.tags = this.state.tags;
    }
    if (this.state.chambers.length > 0) {
      criteria.chambers = this.state.chambers;
    }
    if (this.state.types.length > 0) {
      criteria.types = this.state.types;
    }
    if (this.state.wings.length > 0) {
      criteria.wings = this.state.wings;
    }
    if (this.state.statuses.length > 0) {
      criteria.statuses = this.state.statuses;
    }
    if (this.state.fromYear) {
      criteria.fromYear = this.state.fromYear;
    }
    if (this.state.toYear) {
      criteria.toYear = this.state.toYear;
    }

    // Get filtered items
    let items = registry.filter(criteria);

    // Apply sorting
    items = this._sortItems(items);

    return items;
  }

  /**
   * Sort items based on current sort settings
   * @private
   * @param {Array} items
   * @returns {Array}
   */
  _sortItems(items) {
    const { sortBy, sortOrder } = this.state;
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date': {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }

        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;

        case 'relevance':
        default:
          // For relevance, we keep original order (assumes pre-sorted by relevance)
          return 0;
      }

      return comparison * multiplier;
    });
  }

  /**
   * Register change listener
   * @param {Function} callback - Function(state)
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  }

  /**
   * Unregister change listener
   * @param {Function} callback
   */
  offChange(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Emit change event to listeners and sync URL
   * @private
   */
  _emitChange() {
    const state = this.getState();

    // Sync to URL
    if (this.syncToUrl) {
      this._syncToUrl();
    }

    // Notify listeners
    for (const callback of this.listeners) {
      try {
        callback(state);
      } catch (error) {
        console.error('FilterSystem listener error:', error);
      }
    }

    // Emit custom event
    window.dispatchEvent(new CustomEvent('discovery-filter-change', {
      detail: { state },
    }));
  }

  /**
   * Sync current state to URL parameters
   * @private
   */
  _syncToUrl() {
    const params = new URLSearchParams();

    if (this.state.tags.length > 0) {
      params.set('tags', this.state.tags.join(','));
    }
    if (this.state.chambers.length > 0) {
      params.set('chambers', this.state.chambers.join(','));
    }
    if (this.state.types.length > 0) {
      params.set('types', this.state.types.join(','));
    }
    if (this.state.wings.length > 0) {
      params.set('wings', this.state.wings.join(','));
    }
    if (this.state.fromYear) {
      params.set('from', this.state.fromYear.toString());
    }
    if (this.state.toYear) {
      params.set('to', this.state.toYear.toString());
    }
    if (this.state.sortBy !== 'relevance') {
      params.set('sort', this.state.sortBy);
    }
    if (this.state.sortOrder !== 'desc') {
      params.set('order', this.state.sortOrder);
    }

    // Update URL without triggering navigation
    const queryString = params.toString();
    const hash = window.location.hash;
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}${hash}`
      : `${window.location.pathname}${hash}`;

    // Only update if different
    if (newUrl !== window.location.pathname + window.location.search + hash) {
      window.history.replaceState({ filterState: this.state }, '', newUrl);
    }
  }

  /**
   * Load filter state from URL parameters
   * @private
   */
  _loadFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const state = {
      tags: params.get('tags') ? params.get('tags').split(',').filter(Boolean) : [],
      chambers: params.get('chambers') ? params.get('chambers').split(',').filter(Boolean) : [],
      types: params.get('types') ? params.get('types').split(',').filter(Boolean) : [],
      wings: params.get('wings') ? params.get('wings').split(',').filter(Boolean) : [],
      statuses: params.get('statuses') ? params.get('statuses').split(',').filter(Boolean) : [],
      fromYear: params.get('from') ? parseInt(params.get('from'), 10) : null,
      toYear: params.get('to') ? parseInt(params.get('to'), 10) : null,
      sortBy: params.get('sort') || 'relevance',
      sortOrder: params.get('order') || 'desc',
    };

    this.setState(state, false);
  }

  /**
   * Handle browser back/forward navigation
   * @private
   */
  _onPopState(event) {
    if (event.state && event.state.filterState) {
      this.setState(event.state.filterState, true);
    } else {
      this._loadFromUrl();
      // Emit change to update UI
      for (const callback of this.listeners) {
        try {
          callback(this.getState());
        } catch (error) {
          console.error('FilterSystem listener error:', error);
        }
      }
    }
  }

  /**
   * Generate shareable URL for current filter state
   * @returns {string}
   */
  getShareableUrl() {
    const params = new URLSearchParams();

    if (this.state.tags.length > 0) {
      params.set('tags', this.state.tags.join(','));
    }
    if (this.state.chambers.length > 0) {
      params.set('chambers', this.state.chambers.join(','));
    }
    if (this.state.types.length > 0) {
      params.set('types', this.state.types.join(','));
    }
    if (this.state.wings.length > 0) {
      params.set('wings', this.state.wings.join(','));
    }
    if (this.state.fromYear) {
      params.set('from', this.state.fromYear.toString());
    }
    if (this.state.toYear) {
      params.set('to', this.state.toYear.toString());
    }

    const queryString = params.toString();
    const base = window.location.origin + window.location.pathname + '#discovery';

    return queryString ? `${base}?${queryString}` : base;
  }

  /**
   * Get filter summary text
   * @returns {string}
   */
  getSummaryText() {
    const parts = [];

    if (this.state.tags.length > 0) {
      parts.push(`tags: ${this.state.tags.join(', ')}`);
    }
    if (this.state.chambers.length > 0) {
      parts.push(`chambers: ${this.state.chambers.join(', ')}`);
    }
    if (this.state.types.length > 0) {
      parts.push(`types: ${this.state.types.join(', ')}`);
    }
    if (this.state.wings.length > 0) {
      parts.push(`wings: ${this.state.wings.join(', ')}`);
    }
    if (this.state.fromYear || this.state.toYear) {
      const range = `${this.state.fromYear || '...'} - ${this.state.toYear || '...'}`;
      parts.push(`years: ${range}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'No filters active';
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    if (this.syncToUrl) {
      window.removeEventListener('popstate', this._onPopState);
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export for global scope
window.FilterSystem = FilterSystem;
