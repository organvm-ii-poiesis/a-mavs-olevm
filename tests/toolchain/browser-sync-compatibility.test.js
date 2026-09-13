import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import browserSync from 'browser-sync';

// The scoped Immutable 4 override crosses BrowserSync's declared major range.
// Exercise its actual server/UI/reload path rather than claiming semver compatibility.
test(
  'BrowserSync with patched Immutable serves HTML, UI, and live reload',
  { timeout: 15000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'etceter4-browser-sync-'));
    const bs = browserSync.create();
    try {
      await writeFile(
        join(root, 'index.html'),
        '<html><body>ETCETER4 fixture</body></html>'
      );
      await new Promise((resolve, reject) =>
        bs.init(
          {
            server: root,
            host: '127.0.0.1',
            port: 32751,
            ui: { port: 32752 },
            open: false,
            notify: false,
            logLevel: 'silent',
          },
          error => (error ? reject(error) : resolve())
        )
      );
      const page = await fetch('http://127.0.0.1:32751/', {
        headers: { accept: 'text/html' },
      });
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.match(html, /ETCETER4 fixture/);
      assert.match(html, /browser-sync-client/);
      const ui = await fetch('http://127.0.0.1:32752/').then(response =>
        response.text()
      );
      assert.match(ui, /Browsersync/);
      const reload = once(bs.emitter, 'browser:reload');
      bs.reload();
      await reload;
    } finally {
      bs.exit();
      await rm(root, { recursive: true, force: true });
    }
  }
);
