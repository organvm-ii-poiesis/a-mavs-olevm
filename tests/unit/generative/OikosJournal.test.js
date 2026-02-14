/**
 * Unit tests for OikosJournal generative system
 *
 * Tests CRUD operations, escapeHtml, and entry cap.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Inline the class for testing
class OikosJournal {
  constructor() {
    this.initialized = false;
    this.storageKey = 'etceter4-oikos-entries';
    this.charLimit = 2000;
    this.maxEntriesPerType = 100;
  }

  initialize(containerSelector) {
    if (this.initialized) {
      return;
    }
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    const mounts = container.querySelectorAll('.oikos-journal-mount');
    if (mounts.length === 0) {
      return;
    }
    mounts.forEach(mount => {
      const type = mount.dataset.type;
      if (type) {
        this._renderJournalUI(mount, type);
      }
    });
    this.initialized = true;
  }

  _renderJournalUI(mount, type) {
    const colors = {
      reflections: '#ff8c00',
      dreams: '#ffb6c1',
      confessions: '#ffd9b3',
    };
    const color = colors[type] || '#ff8c00';
    const wrapper = document.createElement('div');
    wrapper.className = 'oikos-journal-wrapper mt3';
    const textareaWrap = document.createElement('div');
    textareaWrap.className = 'mb2';
    textareaWrap.innerHTML = `
      <textarea class="oikos-textarea f6" placeholder="Begin writing..." maxlength="${this.charLimit}" rows="3"></textarea>
      <div class="flex justify-between items-center mt1">
        <span class="oikos-char-count f7 o-40">0 / ${this.charLimit}</span>
        <button class="oikos-save-btn f7 ba br2 ph2 pv1 pointer bg-transparent white" style="border-color: ${color}" disabled>Save</button>
      </div>
    `;
    wrapper.appendChild(textareaWrap);
    const entryList = document.createElement('div');
    entryList.className = 'oikos-entry-list mt3';
    wrapper.appendChild(entryList);
    mount.appendChild(wrapper);
    const textarea = textareaWrap.querySelector('.oikos-textarea');
    const charCount = textareaWrap.querySelector('.oikos-char-count');
    const saveBtn = textareaWrap.querySelector('.oikos-save-btn');
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / ${this.charLimit}`;
      saveBtn.disabled = len === 0;
    });
    saveBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) {
        return;
      }
      this._saveEntry(type, text);
      textarea.value = '';
      charCount.textContent = `0 / ${this.charLimit}`;
      saveBtn.disabled = true;
      this._renderEntries(entryList, type, color);
    });
    this._renderEntries(entryList, type, color);
  }

  _saveEntry(type, text) {
    const entries = this._getEntries();
    const entry = {
      id: this._generateId(),
      type,
      text,
      timestamp: Date.now(),
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
    entries.unshift(entry);
    const typeCounts = {};
    const capped = entries.filter(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      return typeCounts[e.type] <= this.maxEntriesPerType;
    });
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(capped));
    } catch (err) {
      console.warn('OikosJournal: storage error:', err.message);
    }
  }

  _getEntries() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_e) {
      return [];
    }
  }

  _deleteEntry(entryId) {
    const entries = this._getEntries().filter(e => e.id !== entryId);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (err) {
      console.warn('OikosJournal: storage error:', err.message);
    }
  }

  _renderEntries(listEl, type, color) {
    const entries = this._getEntries().filter(e => e.type === type);
    if (entries.length === 0) {
      listEl.innerHTML = '<p class="f7 o-30 tc">No entries yet</p>';
      return;
    }
    listEl.innerHTML = entries
      .map(entry => {
        const preview =
          entry.text.length > 120
            ? `${entry.text.slice(0, 120)}...`
            : entry.text;
        return `<div class="oikos-entry" data-entry-id="${entry.id}">
        <p>${this._escapeHtml(preview)}</p>
        <span class="oikos-entry-delete" data-delete-id="${entry.id}">&times;</span>
      </div>`;
      })
      .join('');
    listEl.querySelectorAll('.oikos-entry-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        this._deleteEntry(btn.dataset.deleteId);
        this._renderEntries(listEl, type, color);
      });
    });
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.initialized = false;
  }
}

describe('OikosJournal', () => {
  let journal;

  beforeEach(() => {
    journal = new OikosJournal();
    localStorage.clear();
  });

  afterEach(() => {
    journal.destroy();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(journal.initialized).toBe(false);
      expect(journal.storageKey).toBe('etceter4-oikos-entries');
      expect(journal.charLimit).toBe(2000);
      expect(journal.maxEntriesPerType).toBe(100);
    });
  });

  describe('_escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(journal._escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(journal._escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('preserves plain text', () => {
      expect(journal._escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('_generateId', () => {
    it('returns a non-empty string', () => {
      const id = journal._generateId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('generates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(journal._generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('CRUD operations', () => {
    it('saves and retrieves entries', () => {
      journal._saveEntry('reflections', 'My first reflection');
      const entries = journal._getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('reflections');
      expect(entries[0].text).toBe('My first reflection');
      expect(entries[0].wordCount).toBe(3);
    });

    it('saves entries in newest-first order', () => {
      journal._saveEntry('reflections', 'First');
      journal._saveEntry('reflections', 'Second');
      const entries = journal._getEntries();
      expect(entries[0].text).toBe('Second');
      expect(entries[1].text).toBe('First');
    });

    it('deletes entries by ID', () => {
      journal._saveEntry('reflections', 'To keep');
      journal._saveEntry('reflections', 'To delete');
      const entries = journal._getEntries();
      const deleteId = entries[0].id; // newest = 'To delete'
      journal._deleteEntry(deleteId);
      const remaining = journal._getEntries();
      expect(remaining.length).toBe(1);
      expect(remaining[0].text).toBe('To keep');
    });

    it('handles empty localStorage', () => {
      const entries = journal._getEntries();
      expect(entries).toEqual([]);
    });

    it('handles corrupted localStorage', () => {
      localStorage.setItem(journal.storageKey, 'not json');
      const entries = journal._getEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('entry cap', () => {
    it('caps entries per type at maxEntriesPerType', () => {
      journal.maxEntriesPerType = 5; // Lower for test

      for (let i = 0; i < 8; i++) {
        journal._saveEntry('reflections', `Entry ${i}`);
      }

      const entries = journal
        ._getEntries()
        .filter(e => e.type === 'reflections');
      expect(entries.length).toBe(5);
      // Should keep the 5 newest
      expect(entries[0].text).toBe('Entry 7');
      expect(entries[4].text).toBe('Entry 3');
    });

    it('caps independently per type', () => {
      journal.maxEntriesPerType = 3;

      for (let i = 0; i < 5; i++) {
        journal._saveEntry('reflections', `Reflection ${i}`);
        journal._saveEntry('dreams', `Dream ${i}`);
      }

      const entries = journal._getEntries();
      const reflections = entries.filter(e => e.type === 'reflections');
      const dreams = entries.filter(e => e.type === 'dreams');

      expect(reflections.length).toBe(3);
      expect(dreams.length).toBe(3);
    });
  });

  describe('initialize', () => {
    it('initializes with valid mount points', () => {
      document.body.innerHTML = `
        <div id="oikos">
          <div class="oikos-journal-mount" data-type="reflections"></div>
        </div>
      `;
      journal.initialize('#oikos');
      expect(journal.initialized).toBe(true);
    });

    it('does not initialize without container', () => {
      journal.initialize('#nonexistent');
      expect(journal.initialized).toBe(false);
    });

    it('does not initialize without mount points', () => {
      document.body.innerHTML = '<div id="oikos"></div>';
      journal.initialize('#oikos');
      expect(journal.initialized).toBe(false);
    });

    it('renders journal UI into mount points', () => {
      document.body.innerHTML = `
        <div id="oikos">
          <div class="oikos-journal-mount" data-type="reflections"></div>
        </div>
      `;
      journal.initialize('#oikos');
      expect(document.querySelector('.oikos-textarea')).not.toBeNull();
      expect(document.querySelector('.oikos-save-btn')).not.toBeNull();
    });
  });

  describe('destroy', () => {
    it('resets initialized state', () => {
      document.body.innerHTML = `
        <div id="oikos">
          <div class="oikos-journal-mount" data-type="reflections"></div>
        </div>
      `;
      journal.initialize('#oikos');
      journal.destroy();
      expect(journal.initialized).toBe(false);
    });
  });
});
