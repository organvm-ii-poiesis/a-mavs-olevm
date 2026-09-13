/**
 * Real-file regressions for archival metadata and unavailable-audio handling.
 * Track expectations were transcribed from the artist's Bandcamp album pages
 * retrieved 2026-09-13. Tree digests were computed from the complete paths and
 * blob IDs in historical commit 7f4e5f9610701cd1cb7e398f0b66a6e26c8d35e0.
 * git ls-tree HEAD needs no historical checkout, network, or media-blob fetch,
 * so preservation checks also work in a shallow CI checkout.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const historicalCommit = '7f4e5f9610701cd1cb7e398f0b66a6e26c8d35e0';

const expectedAlbums = {
  ogod: {
    id: 'ogod',
    title: '| O | G | O | D |',
    year: 2015,
    bandcamp: 'https://etceter4.bandcamp.com/album/o-g-o-d',
    embedAlbumId: 3780915385,
    tracks: [
      ['I', '04:43', 'https://etceter4.bandcamp.com/track/i'],
      ['II', '02:11', 'https://etceter4.bandcamp.com/track/ii'],
      ['III', '02:37', 'https://etceter4.bandcamp.com/track/iii'],
      ['IV', '03:12', 'https://etceter4.bandcamp.com/track/iv'],
      ['V', '01:52', 'https://etceter4.bandcamp.com/track/v'],
      ['VI', '05:16', 'https://etceter4.bandcamp.com/track/vi'],
      ['VII', '03:59', 'https://etceter4.bandcamp.com/track/vii'],
      ['VIII', '02:33', 'https://etceter4.bandcamp.com/track/viii'],
      ['IX', '02:38', 'https://etceter4.bandcamp.com/track/ix'],
      ['X', '02:17', 'https://etceter4.bandcamp.com/track/x'],
      ['XI', '04:46', 'https://etceter4.bandcamp.com/track/xi'],
      ['XII', '03:08', 'https://etceter4.bandcamp.com/track/xii'],
      ['XIII', '02:51', 'https://etceter4.bandcamp.com/track/xiii'],
      ['XIV', '02:06', 'https://etceter4.bandcamp.com/track/xiv'],
      ['XV', '02:44', 'https://etceter4.bandcamp.com/track/xv'],
      ['XVI', '00:47', 'https://etceter4.bandcamp.com/track/xvi'],
      ['XVII', '02:16', 'https://etceter4.bandcamp.com/track/xvii'],
      ['XVIII', '05:05', 'https://etceter4.bandcamp.com/track/xviii'],
      ['XIX', '02:07', 'https://etceter4.bandcamp.com/track/xix'],
      ['XX', '03:33', 'https://etceter4.bandcamp.com/track/xx'],
      ['XXI', '04:45', 'https://etceter4.bandcamp.com/track/xxi'],
      ['XXII', '04:18', 'https://etceter4.bandcamp.com/track/xxii'],
      ['XXIII', '02:55', 'https://etceter4.bandcamp.com/track/xxiii'],
      ['XXIV', '02:22', 'https://etceter4.bandcamp.com/track/xxiv'],
      ['XXV', '01:51', 'https://etceter4.bandcamp.com/track/xxv'],
      ['XXVI', '02:24', 'https://etceter4.bandcamp.com/track/xxvi'],
      ['XXVII', '02:30', 'https://etceter4.bandcamp.com/track/xxvii'],
      ['XXVIII', '03:55', 'https://etceter4.bandcamp.com/track/xxviii'],
      ['XXIX', '02:48', 'https://etceter4.bandcamp.com/track/xxix'],
    ],
  },
  rmxs: {
    id: 'rmxs',
    title: 'R M X S',
    year: 2016,
    bandcamp: 'https://etceter4.bandcamp.com/album/r-m-x-s',
    embedAlbumId: 604244064,
    tracks: [
      [
        "David Bowie - Thursday's Child (ET CETER4 RMX)",
        '04:46',
        'https://etceter4.bandcamp.com/track/david-bowie-thursdays-child-et-ceter4-rmx',
      ],
      [
        'Kanye West - TLOP (ET CETER4 RMX)',
        '02:57',
        'https://etceter4.bandcamp.com/track/kanye-west-tlop-et-ceter4-rmx',
      ],
      [
        'Kid Audra - Lilac Helix (ET CETER4 RMX)',
        '03:47',
        'https://etceter4.bandcamp.com/track/kid-audra-lilac-helix-et-ceter4-rmx',
      ],
      [
        'Marilyn Manson - Third Day of a Seven Day Binge (ET CETER4 RMX)',
        '05:11',
        'https://etceter4.bandcamp.com/track/marilyn-manson-third-day-of-a-seven-day-binge-et-ceter4-rmx',
      ],
      [
        'Marilyn Manson - Deep Six (ET CETER4 RMX)',
        '03:32',
        'https://etceter4.bandcamp.com/track/marilyn-manson-deep-six-et-ceter4-rmx',
      ],
      [
        "Miley Cyrus - We Can't Stop (ET CETER4 RMX)",
        '02:48',
        'https://etceter4.bandcamp.com/track/miley-cyrus-we-cant-stop-et-ceter4-rmx',
      ],
      [
        'Move Orchestra - Apex (ET CETER4 RMX)',
        '06:38',
        'https://etceter4.bandcamp.com/track/move-orchestra-apex-et-ceter4-rmx',
      ],
      [
        'Ulysses - Haunts Me (ET CETER4 RMX)',
        '03:25',
        'https://etceter4.bandcamp.com/track/ulysses-haunts-me-et-ceter4-rmx',
      ],
    ],
  },
  progressionDigression: {
    id: 'progression-digression',
    title: 'progres\\\\digres',
    year: 2013,
    bandcamp: 'https://etceter4.bandcamp.com/album/progres-digres',
    embedAlbumId: 489900059,
    tracks: [
      ['Input', '03:06', 'https://etceter4.bandcamp.com/track/input'],
      ['Ego', '03:56', 'https://etceter4.bandcamp.com/track/ego'],
      ['Tear', '03:49', 'https://etceter4.bandcamp.com/track/tear'],
      ['Faster', '04:29', 'https://etceter4.bandcamp.com/track/faster'],
      ['Slave', '04:39', 'https://etceter4.bandcamp.com/track/slave'],
      ['Midnight', '05:02', 'https://etceter4.bandcamp.com/track/midnight'],
      ['Slip', '03:52', 'https://etceter4.bandcamp.com/track/slip'],
      ['Gojira', '04:18', 'https://etceter4.bandcamp.com/track/gojira'],
      ['Sleep', '05:05', 'https://etceter4.bandcamp.com/track/sleep'],
      ['Pawn', '03:50', 'https://etceter4.bandcamp.com/track/pawn'],
      ['Entropy', '12:05', 'https://etceter4.bandcamp.com/track/entropy'],
    ],
  },
  etc: {
    id: 'etc',
    title: 'etcetera',
    year: 2012,
    bandcamp: 'https://etceter4.bandcamp.com/album/etcetera',
    embedAlbumId: 448587485,
    tracks: [
      [
        'en medias res',
        '03:22',
        'https://etceter4.bandcamp.com/track/en-medias-res',
      ],
      ['fau pa', '04:06', 'https://etceter4.bandcamp.com/track/fau-pa'],
      ['yungl', '05:14', 'https://etceter4.bandcamp.com/track/yungl'],
      ['etcetera', '05:18', 'https://etceter4.bandcamp.com/track/etcetera'],
      ['flite', '01:28', 'https://etceter4.bandcamp.com/track/flite'],
      [
        'reflekshuns',
        '05:04',
        'https://etceter4.bandcamp.com/track/reflekshuns',
      ],
      ['falen', '05:46', 'https://etceter4.bandcamp.com/track/falen'],
      ['dkonstrukt', '03:54', 'https://etceter4.bandcamp.com/track/dkonstrukt'],
      ['output', '06:04', 'https://etceter4.bandcamp.com/track/output'],
    ],
  },
};

const ogodHistoricalDigest =
  'e853f1df8dc430a1908f1c804660c687faee6312d9e96c4238e018a8fe15342e';
const diaryHistoricalDigest =
  '3c56c16064816f46884e642fafa1f6a65f8aa692eff5ed99eb4b03fcfefba656';

function readTree(directory, extension) {
  return execFileSync('git', ['ls-tree', '-r', '-z', 'HEAD', '--', directory], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
  })
    .split('\0')
    .filter(Boolean)
    .map(entry => {
      const [metadata, path] = entry.split('\t');
      return [path, metadata.split(' ')[2]];
    })
    .filter(([path]) => path.endsWith(extension));
}

function digestTree(entries) {
  return createHash('sha256')
    .update(
      [...entries]
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([path, sha]) => `${path}\t${sha}`)
        .join('\n')
    )
    .digest('hex');
}

function evaluateFile(context, path) {
  return runInContext(readFileSync(resolve(root, path), 'utf8'), context, {
    filename: path,
  });
}

function loadApplication() {
  const sounds = [];
  const Howl = vi.fn(function (options) {
    const sound = {
      play: vi.fn(() => options.onplay?.()),
      pause: vi.fn(() => options.onpause?.()),
      stop: vi.fn(() => options.onstop?.()),
      unload: vi.fn(),
      fade: vi.fn(),
      volume: vi.fn(),
      seek: vi.fn(() => 0),
      duration: vi.fn(() => 283.402456),
    };
    sounds.push(sound);
    return sound;
  });
  const context = createContext({
    document,
    console,
    Howl,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    location: { hostname: 'etceter4.com' },
  });
  context.window = context;
  evaluateFile(context, 'js/data/source-catalogue.js');
  evaluateFile(context, 'js/config.js');
  context.ETCETER4_CONFIG = runInContext('ETCETER4_CONFIG', context);
  evaluateFile(context, 'audio/albums/config.js');
  evaluateFile(context, 'js/media/audio/EnhancedAudioPlayer.js');
  evaluateFile(context, 'js/media/audio/PlaylistManager.js');
  evaluateFile(context, 'js/media/MediaURLResolver.js');
  evaluateFile(context, 'odeion/config.js');
  return {
    context,
    catalogue: context.ETCETER4_SOURCE_CATALOGUE,
    config: context.ETCETER4_CONFIG,
    legacy: runInContext('albumsConfig', context),
    Player: context.EnhancedAudioPlayer,
    Playlist: context.PlaylistManager,
    resolver: context.MediaURLResolver,
    odeion: runInContext('ODEION_CONFIG', context),
    Howl,
    sounds,
  };
}

let app;
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<main id="catalogue"></main>';
  app = loadApplication();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('verified source catalogue', () => {
  it('preserves the canonical four album identities and every official track', () => {
    const albums = app.catalogue.albums;
    expect(Object.keys(albums)).toEqual(Object.keys(expectedAlbums));
    expect(Object.values(albums).map(album => album.tracks.length)).toEqual([
      29, 8, 11, 9,
    ]);
    expect(app.catalogue.historicalSource.commit).toBe(historicalCommit);
    for (const [key, expected] of Object.entries(expectedAlbums)) {
      const album = albums[key];
      expect(album.id, key).toBe(expected.id);
      expect(album.title, key).toBe(expected.title);
      expect(album.year, key).toBe(expected.year);
      expect(album.links.bandcamp, key).toBe(expected.bandcamp);
      expect(album.embedUrl, key).toContain(`album=${expected.embedAlbumId}/`);
      expect(
        album.tracks.map(track => [
          track.title,
          track.duration,
          track.externalUrl,
        ]),
        key
      ).toEqual(expected.tracks);
      expect(new Set(album.tracks.map(track => track.id)).size, key).toBe(
        expected.tracks.length
      );
    }
  });

  it('points all 29 OGOD recordings to their byte-preserved historical blobs', () => {
    const tracked = readTree('ogod/ogodtracks', '.mp3');
    expect(tracked).toHaveLength(29);
    expect(digestTree(tracked)).toBe(ogodHistoricalDigest);
    const tracks = app.catalogue.albums.ogod.tracks;
    expect(
      digestTree(tracks.map(track => [track.src, track.sourceBlobSha]))
    ).toBe(ogodHistoricalDigest);
    for (const track of tracks) {
      expect(track.url).toBe(track.src);
      expect(track.src).toBe(
        `ogod/ogodtracks/${String(track.number).padStart(2, '0')} ${track.title}.mp3`
      );
    }
  });

  it('uses the exact 123 diary files, preserving suffixes and historical bytes', () => {
    const tracked = readTree('img/photos/diary', '.jpg');
    const files = app.catalogue.diary.files;
    expect(tracked).toHaveLength(123);
    expect(files).toHaveLength(123);
    expect(digestTree(tracked)).toBe(diaryHistoricalDigest);
    expect(digestTree(files.map(file => [file.path, file.blobSha]))).toBe(
      diaryHistoricalDigest
    );
    const paths = files.map(file => file.path);
    expect(paths).toContain('img/photos/diary/diary2a.jpg');
    expect(paths).not.toContain('img/photos/diary/diary125.jpg');
    expect(new Set(paths).size).toBe(123);
  });

  it('keeps unrecovered audio and unverified lyrics/stems explicitly unavailable', () => {
    for (const [key, album] of Object.entries(app.catalogue.albums)) {
      expect(album.hasLyrics, key).toBe(false);
      expect(album.hasStems, key).toBe(false);
      if (key === 'ogod') continue;
      for (const track of album.tracks) {
        expect(track.src, track.title).toBeNull();
        expect(track.url, track.title).toBeNull();
        expect(track.sourceBlobSha, track.title).toBeNull();
        expect(track.externalUrl, track.title).toMatch(
          /^https:\/\/etceter4\.bandcamp\.com\/track\//
        );
      }
    }
  });

  it('serves canonical metadata through both existing config entry points', () => {
    expect(app.config.media.albums).toBe(app.catalogue.albums);
    for (const [key, canonical] of Object.entries(app.catalogue.albums)) {
      const legacy = app.legacy[key];
      expect(legacy.id).toBe(canonical.id);
      expect(legacy.title).toBe(canonical.title);
      expect(legacy.links.bandcamp).toBe(canonical.links.bandcamp);
      expect(legacy.tracks).toHaveLength(canonical.tracks.length);
      legacy.tracks.forEach((track, index) => {
        const source = canonical.tracks[index];
        expect(track.id).toBe(index + 1);
        expect(track.canonicalId).toBe(source.id);
        expect([
          track.title,
          track.duration,
          track.src,
          track.externalUrl,
        ]).toEqual([
          source.title,
          source.duration,
          source.src,
          source.externalUrl,
        ]);
      });
    }
  });

  it('limits the standalone Odeion catalog to verified releases and capabilities', () => {
    const items = app.odeion.getAllItems();
    expect(items).toHaveLength(4);
    expect(items.map(item => item.id).sort()).toEqual(
      Object.values(expectedAlbums)
        .map(album => album.id)
        .sort()
    );
    expect(items.reduce((count, album) => count + album.trackCount, 0)).toBe(
      57
    );
    for (const album of Object.values(app.catalogue.albums)) {
      const item = app.odeion.getItemById(album.id);
      expect(item.title).toBe(album.title);
      expect(item.year).toBe(album.year);
      expect(item.trackCount).toBe(album.tracks.length);
      expect(item.features).not.toContain('lyrics');
      expect(item.features).not.toContain('stems');
      expect(item.hasLyrics).not.toBe(true);
      expect(item.hasStems).not.toBe(true);
      expect(app.odeion.getCoverArt(item)).toBe(album.coverUrl);
      for (const track of album.tracks) {
        if (album.id !== 'ogod') {
          expect(app.odeion.getAudioUrl(album.id, track.number)).toBeNull();
        }
        expect(app.odeion.getLyricsUrl(album.id, track.number)).toBeNull();
        expect(app.odeion.getWaveformUrl(album.id, track.number)).toBeNull();
      }
    }
  });

  it('keeps standalone Odeion fallback paths truthful without MediaURLResolver', () => {
    const standaloneUrl = 'https://example.test/odeion/';
    const standalone = createContext({
      URL,
      location: new URL(standaloneUrl),
      document: {
        URL: standaloneUrl,
        baseURI: standaloneUrl,
        currentScript: { src: `${standaloneUrl}config.js` },
      },
    });
    standalone.window = standalone;
    evaluateFile(standalone, 'js/data/source-catalogue.js');
    evaluateFile(standalone, 'odeion/config.js');
    const odeion = runInContext('ODEION_CONFIG', standalone);
    for (const track of app.catalogue.albums.ogod.tracks) {
      expect(
        decodeURI(
          new URL(
            odeion.getAudioUrl('ogod', track.number, 'flac'),
            'https://example.test/odeion/'
          ).href
        )
      ).toBe(`https://example.test/${track.src}`);
    }
    expect(odeion.getAudioUrl('etc', 1)).toBeNull();
    expect(odeion.getAudioUrl('missing-album', 1)).toBeNull();
    expect(odeion.getWaveformUrl('ogod', 1)).toBeNull();
    expect(odeion.getLyricsUrl('ogod', 1)).toBeNull();
  });
});

describe('real media resolver', () => {
  it('returns only served historical recordings, including when FLAC is requested', () => {
    for (const track of app.catalogue.albums.ogod.tracks) {
      expect(app.resolver.resolveAlbumTrack('ogod', track.number)).toBe(
        track.src
      );
      expect(app.resolver.resolveAlbumTrack('ogod', track.number, 'flac')).toBe(
        track.src
      );
    }
  });

  it('never synthesizes recordings or companion files for unavailable sources', () => {
    for (const album of Object.values(app.catalogue.albums)) {
      for (const track of album.tracks) {
        if (album.id !== 'ogod') {
          expect(
            app.resolver.resolveAlbumTrack(album.id, track.number)
          ).toBeNull();
        }
        expect(app.resolver.resolveLyrics(album.id, track.number)).toBeNull();
        expect(app.resolver.resolveWaveform(album.id, track.number)).toBeNull();
      }
    }
    expect(app.resolver.resolveAlbumTrack('missing-album', 1)).toBeNull();
    expect(app.resolver.resolveAlbumTrack('ogod', 30)).toBeNull();
    expect(app.resolver.resolveAlbumTracks('missing-album')).toEqual([]);
  });
});

describe('real diary navigation', () => {
  it('visits every verified scan and wraps without manufacturing numeric paths', () => {
    document.body.innerHTML = `
      <section id="diary">
        <button id="stills-left-diary">Previous</button>
        <div id="diary-leftImage"><img alt=""></div>
        <button id="stills-right-diary">Next</button>
        <span id="diary-indicator"></span>
      </section>`;
    // Bridge only the two jQuery DOM operations. Both the Carousel index logic
    // and diary rendering/event handlers below execute from their actual files.
    app.context.$ = selector => {
      const elements = [...document.querySelectorAll(selector)];
      return {
        on: (event, handler) =>
          elements.forEach(element => element.addEventListener(event, handler)),
        text: value =>
          elements.forEach(element => {
            element.textContent = value;
          }),
      };
    };
    evaluateFile(app.context, 'js/modules/Carousel.js');
    evaluateFile(app.context, 'js/diary.js');
    const image = document.querySelector('#diary-leftImage img');
    const next = document.getElementById('stills-right-diary');
    const previous = document.getElementById('stills-left-diary');
    const indicator = document.getElementById('diary-indicator');
    const visited = [];
    for (let index = 0; index < 123; index += 1) {
      visited.push(image.getAttribute('src'));
      expect(indicator.textContent).toBe(`${index + 1}/123`);
      next.click();
    }
    expect(visited).toEqual(app.catalogue.diary.files.map(file => file.path));
    expect(visited[2]).toBe('img/photos/diary/diary2a.jpg');
    expect(image.getAttribute('src')).toBe(visited[0]);
    previous.click();
    expect(image.getAttribute('src')).toBe(visited[122]);
    expect(indicator.textContent).toBe('123/123');
  });
});

describe('real audio players with unavailable sources', () => {
  it.each([null, undefined, ''])('does not create Howl for source %s', url => {
    const player = new app.Player({ tracks: [{ id: 'unavailable', url }] });
    expect(() => player.play()).not.toThrow();
    expect(app.Howl).not.toHaveBeenCalled();
    expect(player.sound).toBeNull();
    expect(player.isPlaying).toBe(false);
    player.dispose();
  });

  it('cannot resume the previous recording after selecting unavailable audio', () => {
    const local = app.catalogue.albums.ogod.tracks[0];
    const unavailable = app.catalogue.albums.etc.tracks[0];
    const player = new app.Player({ tracks: [local, unavailable] });
    player.play();
    const oldSound = app.sounds[0];
    expect(oldSound.play).toHaveBeenCalledTimes(1);
    player.loadTrack(1);
    expect(() => player.play()).not.toThrow();
    expect(app.Howl).toHaveBeenCalledTimes(1);
    expect(oldSound.stop).toHaveBeenCalled();
    expect(oldSound.unload).toHaveBeenCalled();
    expect(oldSound.play).toHaveBeenCalledTimes(1);
    expect(player.sound).toBeNull();
    expect(player.getCurrentTrack().id).toBe(unavailable.id);
    expect(player.isPlaying).toBe(false);
    player.dispose();
  });

  it('changes an album without leaving an old sound behind the new title', () => {
    const player = new app.Player({ tracks: app.catalogue.albums.ogod.tracks });
    player.play();
    const oldSound = app.sounds[0];
    const manager = new app.Playlist({
      container: document.getElementById('catalogue'),
      player,
    });
    manager.initialize();
    manager.selectAlbum(manager.albums.findIndex(album => album.id === 'etc'));
    manager.playTrack(0);
    expect(() => player.play()).not.toThrow();
    expect(app.Howl).toHaveBeenCalledTimes(1);
    expect(oldSound.stop).toHaveBeenCalled();
    expect(oldSound.unload).toHaveBeenCalled();
    expect(oldSound.play).toHaveBeenCalledTimes(1);
    expect(player.isPlaying).toBe(false);
    expect(player.getCurrentTrack().id).toBe(
      app.catalogue.albums.etc.tracks[0].id
    );
    const links = [...document.querySelectorAll('#catalogue a')].map(
      a => a.href
    );
    for (const track of app.catalogue.albums.etc.tracks) {
      expect(links).toContain(track.externalUrl);
    }
    manager.dispose();
    player.dispose();
  });

  it('cancels a pending crossfade when the album changes to unavailable audio', () => {
    const player = new app.Player({ tracks: app.catalogue.albums.ogod.tracks });
    player.play();
    player.next();
    expect(player.isCrossfading).toBe(true);
    const manager = new app.Playlist({
      container: document.getElementById('catalogue'),
      player,
    });
    manager.initialize();
    manager.selectAlbum(manager.albums.findIndex(album => album.id === 'rmxs'));
    vi.advanceTimersByTime(2000);
    expect(app.Howl).toHaveBeenCalledTimes(1);
    expect(player.sound).toBeNull();
    expect(player.isPlaying).toBe(false);
    expect(player.isCrossfading).toBe(false);
    expect(player.currentTrackIndex).toBe(0);
    manager.dispose();
    player.dispose();
  });
});

describe('real playlist controls and end events', () => {
  function createPlaylist() {
    document.getElementById('catalogue').innerHTML = `
      <div id="odeion-player-container">
        <div id="odeion-controls">
          <button id="odeion-play-btn">Play</button>
          <input id="odeion-volume" type="range" min="0" max="100" value="80">
        </div>
      </div>`;
    const player = new app.Player();
    const manager = new app.Playlist({
      container: document.getElementById('catalogue'),
      player,
    });
    manager.initialize();
    manager.selectAlbum(manager.albums.findIndex(album => album.id === 'ogod'));
    return { player, manager };
  }

  it('advances exactly once on ended and stops at the final track without repeat', () => {
    const { player, manager } = createPlaylist();
    manager.playTrack(0);
    let calls = app.Howl.mock.calls.length;
    app.Howl.mock.calls.at(-1)[0].onend();
    expect(app.Howl).toHaveBeenCalledTimes(calls + 1);
    expect(player.currentTrackIndex).toBe(1);
    expect(manager.currentTrackIndex).toBe(1);
    expect(player.isPlaying).toBe(true);
    manager.playTrack(28);
    calls = app.Howl.mock.calls.length;
    app.Howl.mock.calls.at(-1)[0].onend();
    expect(app.Howl).toHaveBeenCalledTimes(calls);
    expect(player.currentTrackIndex).toBe(28);
    expect(manager.currentTrackIndex).toBe(28);
    expect(player.isPlaying).toBe(false);
    manager.dispose();
    player.dispose();
  });

  it('repeats the selected track once per ended event when repeat-one is selected', () => {
    const { player, manager } = createPlaylist();
    const repeat = document.getElementById('odeion-repeat-btn');
    repeat.click();
    repeat.click();
    expect(manager.repeatMode).toBe('one');
    manager.playTrack(3);
    const calls = app.Howl.mock.calls.length;
    app.Howl.mock.calls.at(-1)[0].onend();
    expect(app.Howl).toHaveBeenCalledTimes(calls + 1);
    expect(player.currentTrackIndex).toBe(3);
    expect(manager.currentTrackIndex).toBe(3);
    expect(app.sounds.at(-1).play).toHaveBeenCalledTimes(1);
    expect(player.isPlaying).toBe(true);
    manager.dispose();
    player.dispose();
  });

  it('wires main play/pause and volume controls and removes them on disposal', () => {
    const { player, manager } = createPlaylist();
    const play = document.getElementById('odeion-play-btn');
    const volume = document.getElementById('odeion-volume');
    expect(play.disabled).toBe(false);
    play.click();
    expect(player.isPlaying).toBe(true);
    expect(play.getAttribute('aria-label')).toBe('Pause');
    play.click();
    expect(player.isPlaying).toBe(false);
    expect(player.isPaused).toBe(true);
    expect(play.getAttribute('aria-label')).toBe('Play');
    volume.value = '25';
    volume.dispatchEvent(new Event('input', { bubbles: true }));
    expect(player.volume).toBe(0.25);
    expect(app.sounds.at(-1).volume).toHaveBeenLastCalledWith(0.25);
    manager.dispose();
    play.click();
    expect(player.isPlaying).toBe(false);
    volume.value = '70';
    volume.dispatchEvent(new Event('input', { bubbles: true }));
    expect(player.volume).toBe(0.25);
    player.dispose();
  });
});
