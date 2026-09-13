# Source catalogue and preservation record

The active catalogue is `js/data/source-catalogue.js`. Both audio configurations, the Odeion chamber and the original Sound room consume that source. The legacy object keys and track identities remain stable. Catalogue metadata was checked against the artist's official Bandcamp pages on 2026-09-13.

| Existing key            | Official release                                                      | Release date | Tracks | Playback source                                   |
| ----------------------- | --------------------------------------------------------------------- | ------------ | ------ | ------------------------------------------------- |
| `ogod`                  | [\| O \| G \| O \| D \|](https://etceter4.bandcamp.com/album/o-g-o-d) | 2015-03-01   | 29     | Historical `ogod/ogodtracks/` MP3 files           |
| `rmxs`                  | [R M X S](https://etceter4.bandcamp.com/album/r-m-x-s)                | 2016-01-01   | 8      | Official Bandcamp embedded player and track links |
| `progressionDigression` | [progres\\digres](https://etceter4.bandcamp.com/album/progres-digres) | 2013-01-01   | 11     | Official Bandcamp embedded player and track links |
| `etc`                   | [etcetera](https://etceter4.bandcamp.com/album/etcetera)              | 2012-05-01   | 9      | Official Bandcamp embedded player and track links |

Track titles, order, displayed durations, cover URLs, release dates and embedded album identifiers come from those public release pages. Durations are the published display values, not measurements of every local file. RMXS titles preserve the credited source artists. These are historical releases, with no new remaster or multitrack claim.

## Audio invariants

All 29 OGOD MP3 paths and Git blob IDs are recorded in the catalogue. They match the original website at [commit 7f4e5f9](https://github.com/unnamedplay-r/etceter4/tree/7f4e5f9610701cd1cb7e398f0b66a6e26c8d35e0/ogod/ogodtracks). Existing audio is reused byte for byte. As a bounded decode check, track I was fully decoded by FFmpeg without error: stereo MP3, 44,100 Hz, 320 kb/s, 283.402456 seconds. This check does not establish a full decode of the remaining tracks.

The other three albums have no verified local audio in this repository. Their `src` and `url` fields are deliberately null. A Bandcamp track webpage or expiring streaming URL must never be passed to Howler as audio. The player clears the previous sound and pending crossfade when switching albums. It renders native listening links and a stable official embedded player for albums without local audio.

`hasLyrics` and `hasStems` describe verified, available playback resources and are false for these entries. Existing OGOD LRC examples are retained in `audio/albums/ogod/lyrics/`, outside the active catalogue. They are unverified examples, not recovered lyrics. No source proves the prior claims of available OGOD stems or a 2024 remaster of progres\\digres. Future work may add verified editions, timed lyrics or stems with their own sources without overwriting these historical files.

The audio library previously referenced by the player was not loaded in either Odeion entry point. Howler 2.2.4 core is now vendored under `dependencies/vendor/howler/`, with its full MIT license and distribution hashes in `SOURCE.json`. The SPA loads it with the chamber; the standalone room loads the same file.

## Diary invariants

The complete historical diary consists of 123 JPEGs. The catalogue records each exact path and Git blob ID. Their bytes match the original commit above. The former numeric loop generated nonexistent `diary1a.jpg`, `diary6.jpg` and `diary6a.jpg` requests and contradicted its own page count. Navigation now walks the actual ordered files, including the `a` suffixes, and wraps at the real count.

The existing `diaryData` captions remain intact in `js/diary.js`. They are separate authored text, not transcriptions of the displayed scans. Scans may contain quotations, revisions and fragments; the site does not claim verified titles, dates or sole authorship of every line. No automatic transcription has been published. The historical `diary_originals.zip` is preserved without an assertion about its uninspected contents.

## Preserved unverified intentions

Earlier configurations contained fabricated track names, dates, durations, cover paths and feature claims. The prior audio infrastructure proposal is also preserved verbatim in [the archive](archive/audio-infrastructure-proposal.md). The complete prior records remain recoverable in [the pre-heal tree](https://github.com/organvm-ii-poiesis/a-mavs-olevm/tree/477d62305943049f638be8fd46d74bd89f4d582f), especially `js/config.js`, `audio/albums/config.js`, `odeion/config.js` and `chambers/odeion/fragment.html`.

The old template identities `single-01`, `demo-01`, `exp-01` and `exp-02` remain in `ODEION_CONFIG.unverifiedItems` with an explicit unverified status. They preserve the intended future categories without presenting “Title [Single],” “Untitled Demo [WIP],” “Ambient Study No. 1” or “Glitch Variations” as evidenced releases. `getAllItems()` returns only the four verified albums. Confirm actual source works before promoting any placeholder into the public catalogue.

## Verification

A Chromium check of the production fragment and player decoded OGOD track I over HTTP and advanced native playback time from 0.218 to 1.424 seconds. Selecting RMXS then paused the old audio, cleared its source and exposed eight official listening links. Browser web security remained enabled. This is a bounded proof for track I, not a decode check of all recordings.

Run `npx vitest run --config .config/vitest.config.js tests/unit/source-catalogue.test.js`. The tests evaluate the production source files, compare all 57 tracks against independently transcribed public metadata, verify the complete audio and diary path/blob inventories, exercise the diary's actual navigation through all 123 scans, reject invented source URLs, and check that unavailable albums cannot replay stale audio or retain a crossfade callback.

New local audio requires a real repository file or stable managed asset URL, source provenance and a successful browser decode. A filename pattern is not evidence that a file exists. Keep private source locations and credentials out of the public catalogue.
