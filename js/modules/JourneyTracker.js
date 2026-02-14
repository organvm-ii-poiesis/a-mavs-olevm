'use strict';

/**
 * @file JourneyTracker.js
 * @description Persistent visitor journey tracking.
 * Records chamber visits and interactions in localStorage with LRU eviction.
 *
 * @example
 *   JourneyTracker.getInstance().recordVisit('bibliotheke');
 *   JourneyTracker.getInstance().recordInteraction('bibliotheke', 'poem_read', { title: 'Dawn' });
 *   const summary = JourneyTracker.getInstance().getSummary();
 */

// eslint-disable-next-line no-unused-vars
class JourneyTracker {
  static _instance = null;

  /** @type {string} localStorage key */
  static STORAGE_KEY = 'etceter4-journey';

  /** @type {number} Max stored entries before LRU eviction (~5KB) */
  static MAX_VISITS = 200;

  /** @type {number} Max stored interactions */
  static MAX_INTERACTIONS = 100;

  /** @type {string[]} All known chamber IDs for recommendations */
  static ALL_CHAMBERS = [
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
    'ogod3d',
    'ogod-viewer',
    'discovery',
    'stills',
    'diary',
    'video',
  ];

  constructor() {
    this._data = this._load();
  }

  /**
   * @returns {JourneyTracker}
   */
  static getInstance() {
    if (!JourneyTracker._instance) {
      JourneyTracker._instance = new JourneyTracker();
    }
    return JourneyTracker._instance;
  }

  /**
   * Record a chamber visit
   * @param {string} chamberId
   */
  recordVisit(chamberId) {
    if (!chamberId) return;

    const id = chamberId.replace('#', '');
    const now = Date.now();

    this._data.visits.push({ id, ts: now });
    this._data.lastVisit = now;

    if (!this._data.firstVisit) {
      this._data.firstVisit = now;
    }

    // LRU eviction
    if (this._data.visits.length > JourneyTracker.MAX_VISITS) {
      this._data.visits = this._data.visits.slice(-JourneyTracker.MAX_VISITS);
    }

    this._save();
  }

  /**
   * Record an interaction within a chamber
   * @param {string} chamberId
   * @param {string} type - e.g. 'poem_read', 'sketch_viewed', 'journal_written'
   * @param {Object} [metadata={}]
   */
  recordInteraction(chamberId, type, metadata = {}) {
    if (!chamberId || !type) return;

    const id = chamberId.replace('#', '');
    const now = Date.now();

    this._data.interactions.push({ id, type, meta: metadata, ts: now });

    // LRU eviction
    if (this._data.interactions.length > JourneyTracker.MAX_INTERACTIONS) {
      this._data.interactions = this._data.interactions.slice(
        -JourneyTracker.MAX_INTERACTIONS
      );
    }

    this._save();
  }

  /**
   * Get a summary of the visitor's journey
   * @returns {{ totalVisits: number, chambersVisited: string[], interactions: Array, pathSequence: string[], firstVisit: number|null, lastVisit: number|null }}
   */
  getSummary() {
    const visited = new Set();
    const pathSequence = [];

    for (const v of this._data.visits) {
      visited.add(v.id);
      // Deduplicate consecutive visits for path
      if (pathSequence.length === 0 || pathSequence[pathSequence.length - 1] !== v.id) {
        pathSequence.push(v.id);
      }
    }

    return {
      totalVisits: this._data.visits.length,
      chambersVisited: Array.from(visited),
      interactions: this._data.interactions.slice(),
      pathSequence,
      firstVisit: this._data.firstVisit,
      lastVisit: this._data.lastVisit,
    };
  }

  /**
   * Get recommendations for unvisited or less-visited chambers
   * @returns {string[]} Chamber IDs ordered by recommendation priority
   */
  getRecommendations() {
    const visitCounts = {};
    for (const v of this._data.visits) {
      visitCounts[v.id] = (visitCounts[v.id] || 0) + 1;
    }

    // Sort chambers: unvisited first, then least-visited
    return JourneyTracker.ALL_CHAMBERS.slice()
      .sort((a, b) => (visitCounts[a] || 0) - (visitCounts[b] || 0));
  }

  /**
   * Get interaction count by chamber
   * @param {string} chamberId
   * @returns {number}
   */
  getInteractionCount(chamberId) {
    const id = chamberId.replace('#', '');
    return this._data.interactions.filter(i => i.id === id).length;
  }

  /**
   * Clear all journey data
   */
  reset() {
    this._data = this._emptyData();
    this._save();
  }

  /**
   * @returns {{ visits: Array, interactions: Array, firstVisit: number|null, lastVisit: number|null }}
   * @private
   */
  _load() {
    try {
      const raw = localStorage.getItem(JourneyTracker.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate structure
        if (Array.isArray(parsed.visits) && Array.isArray(parsed.interactions)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('JourneyTracker: failed to load journey data', e.message);
    }
    return this._emptyData();
  }

  /** @private */
  _save() {
    try {
      localStorage.setItem(
        JourneyTracker.STORAGE_KEY,
        JSON.stringify(this._data)
      );
    } catch (e) {
      console.warn('JourneyTracker: failed to save journey data', e.message);
    }
  }

  /**
   * @returns {{ visits: Array, interactions: Array, firstVisit: null, lastVisit: null }}
   * @private
   */
  _emptyData() {
    return {
      visits: [],
      interactions: [],
      firstVisit: null,
      lastVisit: null,
    };
  }
}
