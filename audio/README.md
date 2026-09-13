# Audio sources and playback

The verified catalogue is [`js/data/source-catalogue.js`](../js/data/source-catalogue.js). Load it before `js/config.js` or `audio/albums/config.js`; both configurations are compatibility views of the same data. Preserve the existing keys when adding verified sources.

The repository contains all 29 original OGOD MP3 files under `ogod/ogodtracks/`. They remain at their historical paths. RMXS, progres\\digres and etcetera have complete official track metadata and Bandcamp players/links; their local audio sources are null. No unavailable file is represented by a guessed path.

The current player supports local playback, seeking, volume and playlist control. Timed lyrics, stems, newly rendered waveforms and remastered editions require verified source material before they can be enabled. Existing LRC examples remain preserved but inactive. See [SOURCE_CATALOGUE.md](../docs/SOURCE_CATALOGUE.md) for exact provenance and verification instructions.

## Add a verified audio source

1. Preserve the original master/export and record its provenance before making derivatives.
2. Derive a web playback file without normalizing, remastering or changing the mix unless that transformation is an explicitly named new edition. For example, `ffmpeg -i source.wav -map 0:a:0 -codec:a libmp3lame -b:a 320k output.mp3` is a playback encoding, not a remaster.
3. Record the source and derivative hashes, conversion command and measured duration. Keep credentials and private source locations out of public git.
4. Add the real file or a stable managed asset URL to the canonical track's `src` and `url`. Do not replace historical editions or commit expiring third-party streaming URLs.
5. Verify browser playback and catalogue tests. Add cover art, lyrics or stems only when their exact sources and credits are established.

## Compatibility player

```html
<script src="dependencies/vendor/howler/howler.core.min.js"></script>
<script src="js/data/source-catalogue.js"></script>
<script src="audio/albums/config.js"></script>
<script src="js/audioPlayer.js"></script>
```

```javascript
const player = new AudioPlayer({
  id: "ogod-player",
  container: "#audio-player-container",
  tracks: albumsConfig.ogod.tracks,
});
```

This snippet assumes a page at the repository root. The standalone Odeion configuration resolves the same source paths relative to its nested page.

The previous hosting, upload and normalization proposals remain in Git history. Storage choice, download delivery, new stems and audio reprocessing remain intentions to complete with real assets and explicit edition provenance; they are not current capabilities.
