import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('JourneyNarrative', () => {
  let JourneyNarrative;
  const srcPath = path.resolve(
    __dirname,
    '../../../js/modules/JourneyNarrative.js'
  );
  const source = fs.readFileSync(srcPath, 'utf-8');
  const cleanSource = source.replace(/^'use strict';\s*/, '');

  // Evaluate class
  const evalScript = new Function(cleanSource + '\nreturn JourneyNarrative;');
  JourneyNarrative = evalScript();

  it('should return a prompt for empty journey', () => {
    const text = JourneyNarrative.generate({
      totalVisits: 0,
      chambersVisited: [],
      interactions: [],
      pathSequence: [],
    });
    expect(text).toContain('journey has yet to begin');
  });

  it('should return a prompt for null summary', () => {
    const text = JourneyNarrative.generate(null);
    expect(text).toContain('journey has yet to begin');
  });

  it('should mention single chamber by name', () => {
    const text = JourneyNarrative.generate({
      totalVisits: 1,
      chambersVisited: ['bibliotheke'],
      interactions: [],
      pathSequence: ['bibliotheke'],
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    });
    expect(text).toContain('Bibliotheke');
  });

  it('should mention chamber count for multiple chambers', () => {
    const text = JourneyNarrative.generate({
      totalVisits: 5,
      chambersVisited: ['akademia', 'bibliotheke', 'pinakotheke'],
      interactions: [],
      pathSequence: [
        'akademia',
        'bibliotheke',
        'pinakotheke',
        'akademia',
        'bibliotheke',
      ],
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    });
    expect(text).toContain('3 chambers');
  });

  it('should mention lingering in most-visited chamber', () => {
    const text = JourneyNarrative.generate({
      totalVisits: 5,
      chambersVisited: ['akademia', 'bibliotheke'],
      interactions: [],
      pathSequence: [
        'akademia',
        'bibliotheke',
        'akademia',
        'bibliotheke',
        'akademia',
      ],
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    });
    expect(text).toContain('lingered in Akademia');
  });

  it('should mention interactions', () => {
    const text = JourneyNarrative.generate({
      totalVisits: 2,
      chambersVisited: ['bibliotheke'],
      interactions: [
        { id: 'bibliotheke', type: 'poem_generated', meta: {}, ts: Date.now() },
        { id: 'bibliotheke', type: 'poem_generated', meta: {}, ts: Date.now() },
      ],
      pathSequence: ['bibliotheke'],
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    });
    expect(text).toContain('generating poems');
    expect(text).toContain('Bibliotheke');
  });

  it('should mention unvisited wings', () => {
    // Visit only East Wing chambers
    const text = JourneyNarrative.generate({
      totalVisits: 1,
      chambersVisited: ['akademia'],
      interactions: [],
      pathSequence: ['akademia'],
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    });
    expect(text).toContain('West Wing');
    expect(text).toContain('await');
  });

  it('should mention time span in days', () => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const text = JourneyNarrative.generate({
      totalVisits: 2,
      chambersVisited: ['akademia', 'bibliotheke'],
      interactions: [],
      pathSequence: ['akademia', 'bibliotheke'],
      firstVisit: threeDaysAgo,
      lastVisit: now,
    });
    expect(text).toContain('3 days');
  });

  it('should not mention days if same-day journey', () => {
    const now = Date.now();
    const text = JourneyNarrative.generate({
      totalVisits: 2,
      chambersVisited: ['akademia', 'bibliotheke'],
      interactions: [],
      pathSequence: ['akademia', 'bibliotheke'],
      firstVisit: now - 1000,
      lastVisit: now,
    });
    expect(text).not.toContain('day');
  });
});
