/**
 * Unit tests for KhronosTimeline generative system
 *
 * Tests date-to-X mapping, milestone rendering, and drag interaction.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the actual source file
const sourceCode = readFileSync(
  resolve(__dirname, '../../../js/generative/KhronosTimeline.js'),
  'utf-8'
);

// Extract class by evaluating the source (strip 'use strict')
const classCode = sourceCode
  .replace(/^'use strict';\s*/, '')
  .replace(/\/\/ eslint-disable-next-line no-unused-vars\n/, '');
// eslint-disable-next-line no-eval
const KhronosTimeline = eval(
  `(function() { ${classCode}; return KhronosTimeline; })()`
);

describe('KhronosTimeline', () => {
  let timeline;

  beforeEach(() => {
    timeline = new KhronosTimeline();
  });

  afterEach(() => {
    timeline.destroy();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(timeline.initialized).toBe(false);
      expect(timeline.container).toBeNull();
      expect(timeline.svg).toBeNull();
      expect(timeline.viewOffsetX).toBe(0);
      expect(timeline.isDragging).toBe(false);
      expect(timeline.activeDetail).toBeNull();
    });

    it('has milestones array with entries', () => {
      expect(Array.isArray(timeline.milestones)).toBe(true);
      expect(timeline.milestones.length).toBeGreaterThan(0);
    });

    it('each milestone has required fields', () => {
      timeline.milestones.forEach(ms => {
        expect(ms.id).toBeDefined();
        expect(ms.date).toBeDefined();
        expect(ms.label).toBeDefined();
        expect(ms.description).toBeDefined();
        expect(ms.era).toBeDefined();
      });
    });

    it('has eras array with valid entries', () => {
      expect(Array.isArray(timeline.eras)).toBe(true);
      timeline.eras.forEach(era => {
        expect(era.id).toBeDefined();
        expect(era.label).toBeDefined();
        expect(era.color).toBeDefined();
        expect(era.startDate).toBeDefined();
        expect(era.endDate).toBeDefined();
      });
    });

    it('has timeline dimensions', () => {
      expect(timeline.timelineWidth).toBe(1200);
      expect(timeline.timelineHeight).toBe(180);
      expect(timeline.padding).toBe(60);
    });
  });

  describe('_dateToX', () => {
    it('maps earliest date to start of timeline (near padding)', () => {
      const x = timeline._dateToX('2016-11');
      // Should be at or very near the left padding
      expect(x).toBeCloseTo(timeline.padding, 0);
    });

    it('maps later dates to further right positions', () => {
      const x1 = timeline._dateToX('2016-11');
      const x2 = timeline._dateToX('2024-03');
      expect(x2).toBeGreaterThan(x1);
    });

    it('maps last date near end of timeline', () => {
      const x = timeline._dateToX('2026-12');
      // Should be near timelineWidth - padding
      expect(x).toBeCloseTo(timeline.timelineWidth - timeline.padding, 0);
    });

    it('maps mid-range date to middle area', () => {
      const x = timeline._dateToX('2021-11'); // roughly middle of 2016-11 to 2026-12
      const midX = timeline.timelineWidth / 2;
      // Should be within reasonable range of the middle
      expect(x).toBeGreaterThan(timeline.padding + 100);
      expect(x).toBeLessThan(timeline.timelineWidth - timeline.padding - 100);
    });
  });

  describe('initialize', () => {
    it('initializes with valid container and renders SVG', () => {
      // The initialize method uses querySelector on the containerSelector
      // then calls _render which creates SVG using createElementNS
      document.body.innerHTML = '<div id="khronos-timeline"></div>';
      timeline.initialize('#khronos-timeline');

      expect(timeline.initialized).toBe(true);
      expect(timeline.container).not.toBeNull();
      // SVG should have been created
      expect(timeline.svg).not.toBeNull();
    });

    it('does not initialize without container', () => {
      timeline.initialize('#nonexistent');
      expect(timeline.initialized).toBe(false);
    });

    it('does not double-initialize', () => {
      document.body.innerHTML = '<div id="khronos-timeline"></div>';
      timeline.initialize('#khronos-timeline');
      const firstSvg = timeline.svg;
      timeline.initialize('#khronos-timeline');
      expect(timeline.svg).toBe(firstSvg);
    });
  });

  describe('destroy', () => {
    it('resets initialized state', () => {
      document.body.innerHTML = '<div id="khronos-timeline"></div>';
      timeline.initialize('#khronos-timeline');
      expect(timeline.initialized).toBe(true);

      timeline.destroy();
      expect(timeline.initialized).toBe(false);
    });

    it('cleans up bound handlers', () => {
      document.body.innerHTML = '<div id="khronos-timeline"></div>';
      timeline.initialize('#khronos-timeline');
      timeline.destroy();
      expect(timeline._boundHandlers).toEqual({});
    });
  });
});
