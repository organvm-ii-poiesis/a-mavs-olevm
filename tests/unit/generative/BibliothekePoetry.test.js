/**
 * Unit tests for BibliothekePoetry generative system
 *
 * Tests word pool selection, template filling, and poem/prose/lyrics generation.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Inline the class for testing (avoids global scope issues)
class BibliothekePoetry {
  constructor() {
    this.initialized = false;
    this.containers = [];
    this.regenInterval = null;

    this.words = {
      solace: [
        'forgiveness',
        'growth',
        'life',
        'love',
        'trust',
        'hope',
        'return',
        'rain',
        'clouds',
        'forever',
        'light',
        'warmth',
        'breath',
        'bloom',
        'gentle',
        'dawn',
        'river',
        'peace',
        'tenderness',
        'grace',
        'horizon',
        'shelter',
        'ember',
      ],
      discord: [
        'death',
        'empty',
        'fear',
        'remorse',
        'pain',
        'depression',
        'hate',
        'repetition',
        'gone',
        'end',
        'fist',
        'silence',
        'fracture',
        'erosion',
        'hollow',
        'void',
        'ash',
        'static',
        'severance',
        'collapse',
        'drift',
        'absence',
        'wound',
      ],
      sensory: [
        'velvet',
        'crystalline',
        'amber',
        'obsidian',
        'mercury',
        'copper',
        'smoke',
        'salt',
        'silk',
        'rust',
        'glass',
        'bone',
        'stone',
        'flame',
        'frost',
        'moss',
        'dust',
      ],
      verbs: [
        'dissolves',
        'emerges',
        'shatters',
        'whispers',
        'burns',
        'unfolds',
        'collapses',
        'breathes',
        'fractures',
        'spirals',
        'echoes',
        'bleeds',
        'trembles',
        'radiates',
        'erodes',
        'surrenders',
        'awakens',
        'descends',
        'transforms',
        'lingers',
      ],
      abstract: [
        'memory',
        'distance',
        'threshold',
        'archive',
        'frequency',
        'resonance',
        'entropy',
        'syntax',
        'geometry',
        'algorithm',
        'paradox',
        'meridian',
        'spectrum',
        'labyrinth',
        'cipher',
        'testimony',
        'inheritance',
        'architecture',
        'cartography',
      ],
      connectors: [
        'beneath',
        'through',
        'against',
        'within',
        'beyond',
        'among',
        'across',
        'between',
        'inside',
        'toward',
      ],
      articles: ['the', 'a', 'this', 'that', 'every', 'no', 'each'],
    };

    this.poetryTemplates = [
      '{articles} {sensory} {abstract} {verbs}',
      '{connectors} {articles} {solace}, {discord} {verbs}',
      '{verbs} like {sensory} {abstract}',
    ];

    this.proseTemplates = [
      'The {sensory} {abstract} {verbs} {connectors} the {solace}.',
      'There was {articles} {discord} that no {abstract} could name.',
    ];

    this.lyricTemplates = {
      verse: [
        '{articles} {sensory} {abstract} {verbs}',
        '{connectors} {articles} {solace} and the {discord}',
      ],
      chorus: [
        'we are {sensory}, we are {abstract}',
        '{solace} — {solace} — {verbs}',
      ],
    };
  }

  initialize(containerSelector) {
    if (this.initialized) {
      return;
    }
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    const poems = container.querySelectorAll('.bibliotheke-poem');
    if (poems.length === 0) {
      return;
    }
    poems.forEach(el => {
      this.containers.push(el);
      this._generateAndRender(el);
    });
    this.regenInterval = setInterval(() => {
      this.containers.forEach(el => this._generateAndRender(el));
    }, 120000);
    this.initialized = true;
  }

  _generateAndRender(el) {
    const mode = el.dataset.mode || 'poetry';
    let content;
    switch (mode) {
      case 'poetry':
        content = this._generatePoetry();
        break;
      case 'prose':
        content = this._generateProse();
        break;
      case 'lyrics':
        content = this._generateLyrics();
        break;
      default:
        content = this._generatePoetry();
    }
    const title = this._generateTitle();
    el.innerHTML = `
      <h4 class="f5 mt0 mb2 i" style="color: #d2b48c">${title}</h4>
      <div class="f6 o-80 lh-copy white-90">${content}</div>
      <div class="mt2 tr">
        <span class="bibliotheke-regenerate f7 o-30" title="Generate new text">&#8635;</span>
      </div>
    `;
    const regenBtn = el.querySelector('.bibliotheke-regenerate');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => this._generateAndRender(el));
    }
  }

  _generateTitle() {
    const patterns = ['{abstract} #{num}', 'On {sensory} {abstract}'];
    const pattern = this._pick(patterns);
    return this._fillTemplate(pattern).replace(
      '{num}',
      String(Math.floor(Math.random() * 99) + 1)
    );
  }

  _generatePoetry() {
    const lineCount = 4 + Math.floor(Math.random() * 5);
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
      const template = this._pick(this.poetryTemplates);
      lines.push(this._fillTemplate(template));
    }
    return lines.map(l => `<p class="mv1">${l}</p>`).join('');
  }

  _generateProse() {
    const sentenceCount = 3 + Math.floor(Math.random() * 3);
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      const template = this._pick(this.proseTemplates);
      sentences.push(this._fillTemplate(template));
    }
    return `<p class="mv1 lh-copy">${sentences.join(' ')}</p>`;
  }

  _generateLyrics() {
    const sections = ['verse', 'chorus', 'verse'];
    const parts = [];
    sections.forEach(section => {
      const templates = this.lyricTemplates[section];
      const lineCount = section === 'chorus' ? 2 : 4;
      const lines = [];
      for (let i = 0; i < lineCount; i++) {
        const template = this._pick(templates);
        lines.push(this._fillTemplate(template));
      }
      parts.push(
        `<div class="mv2">${lines.map(l => `<p class="mv1">${l}</p>`).join('')}</div>`
      );
    });
    return parts.join('');
  }

  _fillTemplate(template) {
    return template.replace(/\{(\w+)\}/g, (match, pool) => {
      if (this.words[pool]) {
        return this._pick(this.words[pool]);
      }
      return match;
    });
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  destroy() {
    if (this.regenInterval) {
      clearInterval(this.regenInterval);
      this.regenInterval = null;
    }
    this.containers = [];
    this.initialized = false;
  }
}

describe('BibliothekePoetry', () => {
  let poetry;

  beforeEach(() => {
    vi.useFakeTimers();
    poetry = new BibliothekePoetry();
  });

  afterEach(() => {
    poetry.destroy();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(poetry.initialized).toBe(false);
      expect(poetry.containers).toEqual([]);
      expect(poetry.regenInterval).toBeNull();
    });

    it('has word pools for all categories', () => {
      const pools = [
        'solace',
        'discord',
        'sensory',
        'verbs',
        'abstract',
        'connectors',
        'articles',
      ];
      pools.forEach(pool => {
        expect(poetry.words[pool]).toBeDefined();
        expect(poetry.words[pool].length).toBeGreaterThan(0);
      });
    });
  });

  describe('_pick', () => {
    it('returns an element from the array', () => {
      const arr = ['a', 'b', 'c'];
      const result = poetry._pick(arr);
      expect(arr).toContain(result);
    });
  });

  describe('_fillTemplate', () => {
    it('replaces pool placeholders with words', () => {
      const result = poetry._fillTemplate('{articles} {sensory}');
      expect(result).not.toContain('{articles}');
      expect(result).not.toContain('{sensory}');
      // Result should contain words from the respective pools
      const parts = result.split(' ');
      expect(parts.length).toBe(2);
      expect(poetry.words.articles).toContain(parts[0]);
      expect(poetry.words.sensory).toContain(parts[1]);
    });

    it('preserves unknown placeholders', () => {
      const result = poetry._fillTemplate('{unknown} word');
      expect(result).toBe('{unknown} word');
    });
  });

  describe('_generatePoetry', () => {
    it('returns HTML with paragraph tags', () => {
      const result = poetry._generatePoetry();
      expect(result).toContain('<p class="mv1">');
      expect(result).toContain('</p>');
    });

    it('generates between 4 and 8 lines', () => {
      // Run multiple times to check range
      for (let i = 0; i < 20; i++) {
        const result = poetry._generatePoetry();
        const matches = result.match(/<p class="mv1">/g) || [];
        expect(matches.length).toBeGreaterThanOrEqual(4);
        expect(matches.length).toBeLessThanOrEqual(8);
      }
    });
  });

  describe('_generateProse', () => {
    it('returns HTML with a single paragraph', () => {
      const result = poetry._generateProse();
      expect(result).toContain('<p class="mv1 lh-copy">');
      // Should end with a period
      expect(result).toMatch(/\.\s*<\/p>/);
    });
  });

  describe('_generateLyrics', () => {
    it('generates verse/chorus/verse structure', () => {
      const result = poetry._generateLyrics();
      const divCount = (result.match(/<div class="mv2">/g) || []).length;
      expect(divCount).toBe(3); // verse + chorus + verse
    });
  });

  describe('_generateTitle', () => {
    it('returns a non-empty string', () => {
      const title = poetry._generateTitle();
      expect(title).toBeTruthy();
      expect(typeof title).toBe('string');
    });

    it('does not contain unresolved template placeholders', () => {
      for (let i = 0; i < 20; i++) {
        const title = poetry._generateTitle();
        expect(title).not.toMatch(
          /\{(solace|discord|sensory|verbs|abstract|connectors|articles)\}/
        );
      }
    });
  });

  describe('initialize', () => {
    it('initializes with valid container and poem elements', () => {
      document.body.innerHTML = `
        <div id="bibliotheke">
          <div class="bibliotheke-poem" data-mode="poetry"></div>
          <div class="bibliotheke-poem" data-mode="prose"></div>
        </div>
      `;

      poetry.initialize('#bibliotheke');
      expect(poetry.initialized).toBe(true);
      expect(poetry.containers.length).toBe(2);
      expect(poetry.regenInterval).not.toBeNull();
    });

    it('does not initialize without container', () => {
      poetry.initialize('#nonexistent');
      expect(poetry.initialized).toBe(false);
    });

    it('does not initialize without poem elements', () => {
      document.body.innerHTML = '<div id="bibliotheke"></div>';
      poetry.initialize('#bibliotheke');
      expect(poetry.initialized).toBe(false);
    });

    it('does not double-initialize', () => {
      document.body.innerHTML = `
        <div id="bibliotheke">
          <div class="bibliotheke-poem" data-mode="poetry"></div>
        </div>
      `;
      poetry.initialize('#bibliotheke');
      const firstContainers = poetry.containers.length;
      poetry.initialize('#bibliotheke');
      expect(poetry.containers.length).toBe(firstContainers);
    });

    it('renders content into poem containers', () => {
      document.body.innerHTML = `
        <div id="bibliotheke">
          <div class="bibliotheke-poem" data-mode="poetry"></div>
        </div>
      `;
      poetry.initialize('#bibliotheke');
      const container = document.querySelector('.bibliotheke-poem');
      expect(container.innerHTML).toContain('bibliotheke-regenerate');
    });

    it('sets up auto-regeneration interval', () => {
      document.body.innerHTML = `
        <div id="bibliotheke">
          <div class="bibliotheke-poem" data-mode="poetry"></div>
        </div>
      `;
      poetry.initialize('#bibliotheke');
      const oldContent = document.querySelector('.bibliotheke-poem').innerHTML;

      // Advance time by 120s
      vi.advanceTimersByTime(120000);
      // Content may have changed (random, so just check it still has content)
      const newContent = document.querySelector('.bibliotheke-poem').innerHTML;
      expect(newContent).toContain('bibliotheke-regenerate');
    });
  });

  describe('destroy', () => {
    it('clears state and interval', () => {
      document.body.innerHTML = `
        <div id="bibliotheke">
          <div class="bibliotheke-poem" data-mode="poetry"></div>
        </div>
      `;
      poetry.initialize('#bibliotheke');
      poetry.destroy();

      expect(poetry.initialized).toBe(false);
      expect(poetry.containers).toEqual([]);
      expect(poetry.regenInterval).toBeNull();
    });
  });
});
