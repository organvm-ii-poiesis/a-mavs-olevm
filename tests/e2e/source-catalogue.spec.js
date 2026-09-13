import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Exercise shipped markup and scripts in isolation from unrelated SPA navigation.
// Audio requests are served normally: no mocked Howl, media data, or browser time.
const fragment = readFileSync(
  new URL('../../chambers/odeion/fragment.html', import.meta.url),
  'utf8'
);
const fixture = `<!doctype html><html><head><meta charset="utf-8"><title>Catalogue playback</title></head><body>
<section id="odeion">${fragment}</section>
<script src="js/data/source-catalogue.js"></script>
<script src="js/config.js"></script>
<script src="js/media/MediaURLResolver.js"></script>
<script src="dependencies/vendor/howler/howler.core.min.js"></script>
<script src="js/media/audio/EnhancedAudioPlayer.js"></script>
<script src="js/media/audio/PlaylistManager.js"></script>
<script>
window.odeionPlayer = new EnhancedAudioPlayer();
window.odeionPlaylist = new PlaylistManager({
  container: document.querySelector('#odeion .mw9'), player: odeionPlayer
});
odeionPlaylist.initialize();
</script></body></html>`;

test('plays historical audio and stops it when an externally hosted album is selected', async ({
  page,
}) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/__catalogue-proof__', route =>
    route.fulfill({ contentType: 'text/html', body: fixture })
  );
  await page.goto('/__catalogue-proof__');
  expect(
    await page.evaluate(() => ({
      propertyAlias: Object.hasOwn(window, 'ETCETER4_CONFIG'),
      source: MediaURLResolver.resolveAlbumTrack('ogod', 1),
      externalSource: MediaURLResolver.resolveAlbumTrack('rmxs', 1),
      count: MediaURLResolver.getAlbum('ogod').tracks.length,
    }))
  ).toEqual({
    propertyAlias: false,
    source: 'ogod/ogodtracks/01 I.mp3',
    externalSource: null,
    count: 29,
  });
  await expect(page.locator('.odeion-album-card')).toHaveCount(4);
  await page.locator('.odeion-album-card').nth(0).click();
  await expect(page.locator('button.odeion-track-row')).toHaveCount(29);
  await page.locator('button.odeion-track-row').first().click();
  await page.waitForFunction(
    () =>
      window.odeionPlayer.isPlaying && window.odeionPlayer.getPosition() > 0.2
  );
  const firstPosition = await page.evaluate(() =>
    window.odeionPlayer.getPosition()
  );
  await expect
    .poll(() => page.evaluate(() => window.odeionPlayer.getPosition()))
    .toBeGreaterThan(firstPosition + 0.5);
  await page.evaluate(() => {
    window.previousAudioNode = window.odeionPlayer.sound._sounds[0]._node;
  });
  await page.locator('.odeion-album-card').nth(1).click();
  await expect(page.locator('a.odeion-track-row')).toHaveCount(8);
  await expect(page.locator('#odeion-play-btn')).toBeDisabled();
  await expect(page.locator('.odeion-track-list iframe')).toHaveAttribute(
    'src',
    /bandcamp\.com\/EmbeddedPlayer\/album=604244064\//
  );
  expect(
    await page.evaluate(() => ({
      sourceCleared: window.odeionPlayer.sound === null,
      previousPaused: window.previousAudioNode.paused,
      playing: window.odeionPlayer.isPlaying,
    }))
  ).toEqual({ sourceCleared: true, previousPaused: true, playing: false });
  expect(pageErrors).toEqual([]);
});

// Joint release proof also requires the cold-chamber navigation repair (PR #138).
// Keyboard activation preserves the site's continuously moving artwork; no test
// disables its motion or forces visibility to satisfy pointer-stability checks.
test('the real Odeion route plays audio and stops it when changing albums', async ({
  page,
}) => {
  await page.goto('/#odeion');
  await expect(page.locator('#odeion')).toBeVisible();
  await expect(page.locator('.odeion-album-card')).toHaveCount(4);
  await page.locator('.odeion-album-card').first().press('Enter');
  await expect(page.locator('button.odeion-track-row')).toHaveCount(29);
  await page.locator('button.odeion-track-row').first().press('Enter');
  await page.waitForFunction(
    () =>
      window.odeionPlayer?.isPlaying && window.odeionPlayer.getPosition() > 0.2
  );
  await page.locator('.odeion-album-card').nth(1).press('Enter');
  await expect(page.locator('#odeion-play-btn')).toBeDisabled();
  expect(await page.evaluate(() => window.odeionPlayer.isPlaying)).toBe(false);
});

// This starts on a page with no catalogue scripts. The service worker must
// precache them during installation, before any controlled page requests them.
test.describe('offline catalogue', () => {
  test.use({ serviceWorkers: 'allow' });
  test('the first service-worker installation preserves the catalogue on offline reload', async ({
    page,
    context,
  }) => {
    await page.goto('/offline.html');
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller)
    );
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cacheName = keys.find(key => key.startsWith('etceter4-v'));
      const cache = await caches.open(cacheName);
      return {
        cacheName,
        catalogue: Boolean(await cache.match('./js/data/source-catalogue.js')),
        config: Boolean(await cache.match('./js/config.js')),
      };
    });
    expect(cached).toEqual({
      cacheName: 'etceter4-v5',
      catalogue: true,
      config: true,
    });
    await context.setOffline(true);
    await page.reload();
    await page.addScriptTag({ url: './js/data/source-catalogue.js' });
    await page.addScriptTag({ url: './js/config.js' });
    const offlineCatalogue = await page.evaluate(() => ({
      counts: Object.values(ETCETER4_CONFIG.media.albums).map(
        album => album.tracks.length
      ),
      scans: ETCETER4_SOURCE_CATALOGUE.diary.files.length,
      propertyAlias: Object.hasOwn(window, 'ETCETER4_CONFIG'),
    }));
    expect(offlineCatalogue).toEqual({
      counts: [29, 8, 11, 9],
      scans: 123,
      propertyAlias: false,
    });
  });
});
