/* global module */
/**
 * Compatibility view of the verified catalogue. Load
 * js/data/source-catalogue.js before this file.
 * Numeric legacy track IDs are retained; canonicalId identifies the same
 * track in ETCETER4_CONFIG.media.albums.
 */

const albumsConfig = Object.fromEntries(
  Object.entries(globalThis.ETCETER4_SOURCE_CATALOGUE?.albums || {}).map(
    ([key, album]) => [
      key,
      {
        ...album,
        tracks: album.tracks.map(track => ({
          ...track,
          canonicalId: track.id,
          id: track.number,
        })),
      },
    ]
  )
);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = albumsConfig;
}
