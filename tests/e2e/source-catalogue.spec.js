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
