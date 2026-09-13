/** Regression tests execute the shipped Page source, not a copied class. */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, '../../js/page.js'), 'utf8');

function runtime(loader = { isRegistered: () => false }) {
  const doc = document.implementation.createHTMLDocument('Navigation test');
  doc.body.innerHTML =
    '<section id="landing"></section><section id="menu"></section>';
  const elements = new Map();
  const jquery = selector => {
    if (!elements.has(selector)) {
      const styles = { display: selector === '#menu' ? 'none' : 'block' };
      const element = {
        length: 1,
        on: () => element,
        css(name, value) {
          if (typeof name === 'object') {
            Object.assign(styles, name);
            return element;
          }
          if (value === undefined) {
            return styles[name];
          }
          styles[name] = value;
          return element;
        },
        removeClass: () => element,
        addClass: () => element,
        find: () => ({ first: () => ({ length: 0 }) }),
        velocity(properties, options) {
          // Only the actual Velocity 2 core API is admitted by this boundary.
          if (typeof properties !== 'object') {
            throw new Error('Unsupported redirect');
          }
          options.begin();
          Object.assign(styles, properties);
          options.complete();
        },
      };
      elements.set(selector, element);
    }
    return elements.get(selector);
  };
  const win = {
    history: { replaceState: vi.fn(), pushState: vi.fn() },
    location: { hash: '#landing' },
    matchMedia: () => ({ matches: false }),
  };
  const evaluate = new Function(
    'document',
    'window',
    'navigator',
    '$',
    'ChamberLoader',
    'ETCETER4_CONFIG',
    'console',
    'setTimeout',
    `let pages = [];\n${source}\nreturn { Page, showNewSection, state: () => transitionState, current: () => currentPage, setPages: value => {pages = value; currentPage = pages[0];} };`
  );
  const result = evaluate(
    doc,
    win,
    {},
    jquery,
    { getInstance: () => loader },
    { animations: {} },
    { error: vi.fn(), warn: vi.fn() },
    callback => callback()
  );
  return { ...result, doc, win, jquery };
}

async function settle() {
  for (let i = 0; i < 12; i += 1) {
    await Promise.resolve();
  }
}

describe('production navigation runtime', () => {
  it('shares concurrent initialization and awaits the asynchronous initializer', async () => {
    let release;
    const initialize = vi.fn(
      () =>
        new Promise(resolve => {
          release = resolve;
        })
    );
    const { Page } = runtime();
    const page = new Page({ id: '#menu', initialize });
    const first = page.initPage();
    const second = page.initPage();
    expect(first).toBe(second);
    await settle();
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(page.isInitialized).toBe(false);
    release();
    await first;
    expect(page.isInitialized).toBe(true);
    expect(page.isInitializing).toBe(false);
  });

  it('keeps a failed initializer retryable', async () => {
    const initialize = vi
      .fn()
      .mockRejectedValueOnce(new Error('Not ready'))
      .mockResolvedValueOnce();
    const { Page } = runtime();
    const page = new Page({ id: '#menu', initialize });
    await expect(page.initPage()).rejects.toThrow('Not ready');
    expect(page.isInitializing).toBe(false);
    expect(page.isInitialized).toBe(false);
    await page.initPage();
    expect(initialize).toHaveBeenCalledTimes(2);
    expect(page.isInitialized).toBe(true);
  });

  it('does not initialize or mark a chamber loaded when its assets failed', async () => {
    const initialize = vi.fn();
    const ensureLoaded = vi
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 503'))
      .mockResolvedValueOnce();
    const { Page } = runtime({
      isRegistered: () => true,
      isLoaded: () => false,
      ensureLoaded,
    });
    const page = new Page({ id: '#menu', initialize });
    await expect(page.initPage()).rejects.toThrow('HTTP 503');
    expect(initialize).not.toHaveBeenCalled();
    expect(page.isInitialized).toBe(false);
    await page.initPage();
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('rolls back failed navigation and accepts the next real transition', async () => {
    const app = runtime();
    const landing = new app.Page({ id: '#landing' });
    const initialize = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce();
    const menu = new app.Page({ id: '#menu', initialize });
    app.setPages([landing, menu]);
    expect(app.showNewSection('#menu')).toBe(true);
    await settle();
    expect(app.state()).toBe('IDLE');
    expect(app.current()).toBe(landing);
    expect(app.win.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '#landing'
    );
    expect(app.doc.querySelector('#navigation-error button').textContent).toBe(
      'Retry section'
    );
    expect(app.showNewSection('#menu')).toBe(true);
    await settle();
    expect(app.current()).toBe(menu);
    expect(app.jquery('#landing').css('display')).toBe('none');
    expect(app.jquery('#menu').css('display')).toBe('block');
    expect(app.doc.getElementById('navigation-error')).toBeNull();
  });
});
