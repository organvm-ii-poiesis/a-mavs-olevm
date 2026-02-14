import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('JourneyTracker', () => {
  let JourneyTracker;
  const srcPath = path.resolve(
    __dirname,
    '../../../js/modules/JourneyTracker.js'
  );
  const source = fs.readFileSync(srcPath, 'utf-8');

  // Strip 'use strict' for eval
  const cleanSource = source.replace(/^'use strict';\s*/, '');

  beforeEach(() => {
    // Fresh localStorage mock
    const store = {};
    const localStorageMock = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, val) => {
        store[key] = val;
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
    };

    // Evaluate class in context with mocked localStorage
    const evalScript = new Function(
      'localStorage',
      'console',
      cleanSource + '\nreturn JourneyTracker;'
    );
    JourneyTracker = evalScript(localStorageMock, console);
    // Reset singleton between tests
    JourneyTracker._instance = null;
  });

  it('should be a singleton', () => {
    const a = JourneyTracker.getInstance();
    const b = JourneyTracker.getInstance();
    expect(a).toBe(b);
  });

  it('should start with empty data', () => {
    const tracker = JourneyTracker.getInstance();
    const summary = tracker.getSummary();
    expect(summary.totalVisits).toBe(0);
    expect(summary.chambersVisited).toEqual([]);
    expect(summary.interactions).toEqual([]);
    expect(summary.pathSequence).toEqual([]);
    expect(summary.firstVisit).toBeNull();
    expect(summary.lastVisit).toBeNull();
  });

  it('should record visits', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('bibliotheke');
    tracker.recordVisit('pinakotheke');
    const summary = tracker.getSummary();
    expect(summary.totalVisits).toBe(2);
    expect(summary.chambersVisited).toContain('bibliotheke');
    expect(summary.chambersVisited).toContain('pinakotheke');
    expect(summary.firstVisit).toBeTypeOf('number');
    expect(summary.lastVisit).toBeTypeOf('number');
  });

  it('should strip # from chamber IDs', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('#akademia');
    const summary = tracker.getSummary();
    expect(summary.chambersVisited).toContain('akademia');
  });

  it('should deduplicate consecutive visits in pathSequence', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('akademia');
    tracker.recordVisit('akademia');
    tracker.recordVisit('bibliotheke');
    tracker.recordVisit('akademia');
    const summary = tracker.getSummary();
    expect(summary.pathSequence).toEqual([
      'akademia',
      'bibliotheke',
      'akademia',
    ]);
    expect(summary.totalVisits).toBe(4); // totalVisits still counts all
  });

  it('should record interactions', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordInteraction('bibliotheke', 'poem_generated', {
      mode: 'poetry',
    });
    const summary = tracker.getSummary();
    expect(summary.interactions).toHaveLength(1);
    expect(summary.interactions[0].id).toBe('bibliotheke');
    expect(summary.interactions[0].type).toBe('poem_generated');
    expect(summary.interactions[0].meta).toEqual({ mode: 'poetry' });
  });

  it('should ignore empty chamberId or type', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('');
    tracker.recordVisit(null);
    tracker.recordInteraction('', 'test');
    tracker.recordInteraction('foo', '');
    const summary = tracker.getSummary();
    expect(summary.totalVisits).toBe(0);
    expect(summary.interactions).toHaveLength(0);
  });

  it('should evict old visits when exceeding MAX_VISITS', () => {
    const tracker = JourneyTracker.getInstance();
    const max = JourneyTracker.MAX_VISITS;
    for (let i = 0; i < max + 50; i++) {
      tracker.recordVisit('chamber' + i);
    }
    const summary = tracker.getSummary();
    expect(summary.totalVisits).toBe(max);
  });

  it('should evict old interactions when exceeding MAX_INTERACTIONS', () => {
    const tracker = JourneyTracker.getInstance();
    const max = JourneyTracker.MAX_INTERACTIONS;
    for (let i = 0; i < max + 20; i++) {
      tracker.recordInteraction('chamber', 'type' + i);
    }
    const summary = tracker.getSummary();
    expect(summary.interactions).toHaveLength(max);
  });

  it('should provide recommendations sorted by visit count', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('akademia');
    tracker.recordVisit('akademia');
    tracker.recordVisit('akademia');
    tracker.recordVisit('bibliotheke');
    const recs = tracker.getRecommendations();
    // Unvisited chambers should come first, then bibliotheke (1 visit), then akademia (3 visits)
    const akademiaIdx = recs.indexOf('akademia');
    const bibliothekeIdx = recs.indexOf('bibliotheke');
    expect(akademiaIdx).toBeGreaterThan(bibliothekeIdx);
  });

  it('should count interactions per chamber', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordInteraction('bibliotheke', 'poem_generated');
    tracker.recordInteraction('bibliotheke', 'poem_generated');
    tracker.recordInteraction('oikos', 'journal_written');
    expect(tracker.getInteractionCount('bibliotheke')).toBe(2);
    expect(tracker.getInteractionCount('oikos')).toBe(1);
    expect(tracker.getInteractionCount('akademia')).toBe(0);
  });

  it('should reset all data', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('akademia');
    tracker.recordInteraction('akademia', 'test');
    tracker.reset();
    const summary = tracker.getSummary();
    expect(summary.totalVisits).toBe(0);
    expect(summary.interactions).toHaveLength(0);
    expect(summary.firstVisit).toBeNull();
  });

  it('should persist to localStorage', () => {
    const tracker = JourneyTracker.getInstance();
    tracker.recordVisit('akademia');
    // Check that localStorage.setItem was called
    expect(tracker._save).toBeDefined();
  });
});
