/**
 * Unit tests for SymposionDialogues generative system
 *
 * Tests dialogue generation for interview/conversation modes and speaker formatting.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the actual source file
const sourceCode = readFileSync(
  resolve(__dirname, '../../../js/generative/SymposionDialogues.js'),
  'utf-8'
);

const classCode = sourceCode
  .replace(/^'use strict';\s*/, '')
  .replace(/\/\/ eslint-disable-next-line no-unused-vars\n/, '');
// eslint-disable-next-line no-eval
const SymposionDialogues = eval(
  `(function() { ${classCode}; return SymposionDialogues; })()`
);

describe('SymposionDialogues', () => {
  let dialogues;

  beforeEach(() => {
    vi.useFakeTimers();
    dialogues = new SymposionDialogues();
  });

  afterEach(() => {
    dialogues.destroy();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(dialogues.initialized).toBe(false);
      expect(dialogues.containers).toEqual([]);
      expect(dialogues.regenInterval).toBeNull();
    });

    it('has topic pool', () => {
      expect(dialogues.topics.length).toBeGreaterThan(0);
    });

    it('has perspective pool', () => {
      expect(dialogues.perspectives.length).toBeGreaterThan(0);
    });

    it('has fragment pools for all categories', () => {
      expect(dialogues.fragments.openings.length).toBeGreaterThan(0);
      expect(dialogues.fragments.middles.length).toBeGreaterThan(0);
      expect(dialogues.fragments.closings.length).toBeGreaterThan(0);
      expect(dialogues.fragments.questions.length).toBeGreaterThan(0);
      expect(dialogues.fragments.reactions.length).toBeGreaterThan(0);
    });

    it('has speaker configurations for both modes', () => {
      expect(dialogues.speakers.interview.host).toBeDefined();
      expect(dialogues.speakers.interview.guest).toBeDefined();
      expect(dialogues.speakers.conversation.host).toBeDefined();
      expect(dialogues.speakers.conversation.a).toBeDefined();
      expect(dialogues.speakers.conversation.b).toBeDefined();
    });

    it('uses correct speaker colors', () => {
      expect(dialogues.speakers.interview.host.color).toBe('#cd919e');
      expect(dialogues.speakers.interview.guest.color).toBe('#cd853f');
    });
  });

  describe('_pick', () => {
    it('returns an element from the array', () => {
      const arr = ['x', 'y', 'z'];
      const result = dialogues._pick(arr);
      expect(arr).toContain(result);
    });
  });

  describe('_generateTitle', () => {
    it('generates interview title', () => {
      const title = dialogues._generateTitle('interview', 'art and code');
      expect(title).toBeTruthy();
      expect(typeof title).toBe('string');
      // Should contain the capitalized topic
      expect(title).toContain('Art and code');
    });

    it('generates conversation title', () => {
      const title = dialogues._generateTitle('conversation', 'the loop');
      expect(title).toBeTruthy();
      expect(title).toContain('The loop');
    });
  });

  describe('_generateQuestion', () => {
    it('generates a question containing the topic', () => {
      const q = dialogues._generateQuestion('digital memory');
      expect(q).toContain('digital memory');
    });

    it('ends with a question mark or period', () => {
      const q = dialogues._generateQuestion('the loop');
      expect(q).toMatch(/[?.]$/);
    });
  });

  describe('_generateResponse', () => {
    it('returns a non-empty string', () => {
      const r = dialogues._generateResponse();
      expect(r).toBeTruthy();
      expect(r.length).toBeGreaterThan(10);
    });

    it('ends with punctuation', () => {
      const r = dialogues._generateResponse();
      expect(r).toMatch(/[.,!?]$/);
    });
  });

  describe('_formatLine', () => {
    it('renders speaker badge and text', () => {
      const speaker = { name: 'ET', symbol: '\u25C6', color: '#cd919e' };
      const html = dialogues._formatLine(speaker, 'Hello world');
      expect(html).toContain('ET');
      expect(html).toContain('\u25C6');
      expect(html).toContain('#cd919e');
      expect(html).toContain('Hello world');
    });

    it('uses border-left style for speaker color', () => {
      const speaker = { name: 'A', symbol: '\u25C7', color: '#a0522d' };
      const html = dialogues._formatLine(speaker, 'Test');
      expect(html).toContain('border-left: 2px solid #a0522d');
    });
  });

  describe('_generateInterview', () => {
    it('generates multiple exchange pairs', () => {
      const html = dialogues._generateInterview('art');
      // Should have both ET and Guest lines
      expect(html).toContain('ET');
      expect(html).toContain('Guest');
      // Should have multiple symposion-line divs
      const lineCount = (html.match(/symposion-line/g) || []).length;
      expect(lineCount).toBeGreaterThanOrEqual(6); // At least 3 exchanges * 2
    });
  });

  describe('_generateConversation', () => {
    it('generates multi-speaker turns', () => {
      const html = dialogues._generateConversation('code');
      expect(html).toContain('ET');
      // Should have at least 5 turns
      const lineCount = (html.match(/symposion-line/g) || []).length;
      expect(lineCount).toBeGreaterThanOrEqual(5);
    });

    it('starts with ET speaking', () => {
      const html = dialogues._generateConversation('process');
      // First line should be ET
      const firstLineMatch = html.match(
        /symposion-line[\s\S]*?<span[^>]*>(.*?)<\/span>/
      );
      expect(firstLineMatch[1]).toContain('ET');
    });
  });

  describe('initialize', () => {
    it('initializes with valid dialogue elements', () => {
      document.body.innerHTML = `
        <div id="symposion">
          <div class="symposion-dialogue" data-mode="interview">
            <div class="mb2">badges</div>
          </div>
        </div>
      `;
      dialogues.initialize('#symposion');
      expect(dialogues.initialized).toBe(true);
      expect(dialogues.containers.length).toBe(1);
    });

    it('renders generated content into containers', () => {
      document.body.innerHTML = `
        <div id="symposion">
          <div class="symposion-dialogue" data-mode="interview">
            <div class="mb2">badges</div>
          </div>
        </div>
      `;
      dialogues.initialize('#symposion');
      const container = document.querySelector('.symposion-dialogue');
      expect(container.innerHTML).toContain('symposion-dialogue-content');
      expect(container.innerHTML).toContain('symposion-regenerate');
      // Should NOT contain [Guest Name]
      expect(container.innerHTML).not.toContain('[Guest Name]');
    });

    it('does not initialize without container', () => {
      dialogues.initialize('#nonexistent');
      expect(dialogues.initialized).toBe(false);
    });

    it('does not initialize without dialogue elements', () => {
      document.body.innerHTML = '<div id="symposion"></div>';
      dialogues.initialize('#symposion');
      expect(dialogues.initialized).toBe(false);
    });

    it('sets up 90s regeneration interval', () => {
      document.body.innerHTML = `
        <div id="symposion">
          <div class="symposion-dialogue" data-mode="interview">
            <div class="mb2">badges</div>
          </div>
        </div>
      `;
      dialogues.initialize('#symposion');
      expect(dialogues.regenInterval).not.toBeNull();

      // Advance 90s
      vi.advanceTimersByTime(90000);
      const container = document.querySelector('.symposion-dialogue');
      expect(container.innerHTML).toContain('symposion-dialogue-content');
    });
  });

  describe('destroy', () => {
    it('clears state and interval', () => {
      document.body.innerHTML = `
        <div id="symposion">
          <div class="symposion-dialogue" data-mode="conversation">
            <div class="mb2">badges</div>
          </div>
        </div>
      `;
      dialogues.initialize('#symposion');
      dialogues.destroy();

      expect(dialogues.initialized).toBe(false);
      expect(dialogues.containers).toEqual([]);
      expect(dialogues.regenInterval).toBeNull();
    });
  });
});
