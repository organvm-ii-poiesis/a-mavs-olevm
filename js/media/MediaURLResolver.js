'use strict';

/**
 * MediaURLResolver
 * Resolves media URLs with R2 base URL and local fallback support.
 * Handles environment detection for development vs production.
 *
 * @class MediaURLResolver
 * @example
 * // Get audio URL
 * const audioUrl = MediaURLResolver.resolve('albums/ogod/01-i.mp3', 'audio');
 * // => 'https://media.etceter4.com/audio/albums/ogod/01-i.mp3'
 *
 * // Get video URL with quality
 * const videoUrl = MediaURLResolver.resolveVideo('performances/electronica-2015', '720p');
 * // => 'https://media.etceter4.com/video/performances/electronica-2015/720p.m3u8'
 */
class MediaURLResolver {
  /**
   * Get the base URL for media assets
   * Detects environment and returns appropriate base URL
   * @returns {string} Base media URL
   */
  static getBaseUrl() {
    // Check for config override
    if (typeof window !== 'undefined' && window.ETCETER4_CONFIG?.media) {
      // If baseUrl is a function, call it
      if (typeof window.ETCETER4_CONFIG.media.baseUrl === 'function') {
        return window.ETCETER4_CONFIG.media.baseUrl();
      }
      // If r2BaseUrl is set, use it
      if (window.ETCETER4_CONFIG.media.r2BaseUrl) {
        // Environment detection
        if (typeof window !== 'undefined') {
          const hostname = window.location?.hostname || '';

          // Local development
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return '/media';
          }

          // Vercel preview deployments
          if (hostname.includes('vercel.app')) {
            return window.ETCETER4_CONFIG.media.r2BaseUrl;
          }
        }

        return window.ETCETER4_CONFIG.media.r2BaseUrl;
      }
    }

    // Default fallback
    return '/media';
  }

  /**
   * Resolve a media path to a full URL
   * @param {string} path - Relative path within the media type directory
   * @param {string} [type='audio'] - Media type ('audio', 'video', 'covers')
   * @returns {string} Full resolved URL
   */
  static resolve(path, type = 'audio') {
    const base = MediaURLResolver.getBaseUrl();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}/${type}/${cleanPath}`;
  }

  /**
   * Resolve an album track URL
   * @param {string} albumId - Album identifier (e.g., 'ogod', 'rmxs')
   * @param {number|string} trackNumber - Track number (will be zero-padded)
   * @param {string} [format='mp3'] - Audio format ('mp3', 'flac', 'ogg')
   * @returns {string} Full track URL
   */
  static resolveAlbumTrack(albumId, trackNumber, format = 'mp3') {
    // Determine preferred format from config
    const preferredFormat = MediaURLResolver.getPreferredAudioFormat(format);
    const paddedTrack = String(trackNumber).padStart(2, '0');
    return MediaURLResolver.resolve(`albums/${albumId}/${paddedTrack}.${preferredFormat}`, 'audio');
  }

  /**
   * Get preferred audio format based on config and browser support
   * @param {string} [requested='mp3'] - Requested format
   * @returns {string} Supported format to use
   */
  static getPreferredAudioFormat(requested = 'mp3') {
    const config = window.ETCETER4_CONFIG?.media?.audio;
    const formatPriority = config?.formatPriority || ['mp3', 'flac', 'ogg'];

    // If requested format is in priority list, use it
    if (formatPriority.includes(requested)) {
      return requested;
    }

    // Check browser support for formats
    if (typeof Audio !== 'undefined') {
      const audio = new Audio();
      for (const format of formatPriority) {
        const mimeType = MediaURLResolver.getMimeType(format);
        if (audio.canPlayType(mimeType) !== '') {
          return format;
        }
      }
    }

    // Default to mp3 as most widely supported
    return 'mp3';
  }

  /**
   * Get MIME type for audio format
   * @param {string} format - Audio format extension
   * @returns {string} MIME type
   */
  static getMimeType(format) {
    const mimeTypes = {
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      webm: 'audio/webm',
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  /**
   * Resolve a waveform JSON URL for a track
   * @param {string} albumId - Album identifier
   * @param {number|string} trackNumber - Track number
   * @returns {string} Waveform JSON URL
   */
  static resolveWaveform(albumId, trackNumber) {
    const paddedTrack = String(trackNumber).padStart(2, '0');
    return MediaURLResolver.resolve(`albums/${albumId}/${paddedTrack}-waveform.json`, 'audio');
  }

  /**
   * Resolve an album lyrics LRC file URL
   * @param {string} albumId - Album identifier
   * @param {number|string} trackNumber - Track number
   * @returns {string} LRC file URL
   */
  static resolveLyrics(albumId, trackNumber) {
    const paddedTrack = String(trackNumber).padStart(2, '0');
    return MediaURLResolver.resolve(`albums/${albumId}/${paddedTrack}.lrc`, 'audio');
  }

  /**
   * Resolve a video URL with optional quality
   * @param {string} videoId - Video identifier/path
   * @param {string} [quality='auto'] - Quality level ('auto', '1080p', '720p', '480p', '360p')
   * @returns {string} Video URL (HLS manifest or direct file)
   */
  static resolveVideo(videoId, quality = 'auto') {
    const preferAdaptive = window.ETCETER4_CONFIG?.media?.video?.preferAdaptive !== false;

    if (preferAdaptive && quality === 'auto') {
      // Return master HLS manifest for adaptive streaming
      return MediaURLResolver.resolve(`${videoId}/master.m3u8`, 'video');
    }

    if (quality === 'auto' || !quality) {
      // Return master manifest
      return MediaURLResolver.resolve(`${videoId}/master.m3u8`, 'video');
    }

    // Return specific quality manifest
    return MediaURLResolver.resolve(`${videoId}/${quality}.m3u8`, 'video');
  }

  /**
   * Resolve video thumbnail VTT sprite file
   * @param {string} videoId - Video identifier/path
   * @returns {string} Thumbnail VTT URL
   */
  static resolveVideoThumbnails(videoId) {
    return MediaURLResolver.resolve(`${videoId}/thumbnails.vtt`, 'video');
  }

  /**
   * Resolve video subtitle/caption file
   * @param {string} videoId - Video identifier/path
   * @param {string} [language='en'] - Language code
   * @returns {string} Subtitle VTT URL
   */
  static resolveVideoSubtitles(videoId, language = 'en') {
    return MediaURLResolver.resolve(`${videoId}/subs-${language}.vtt`, 'video');
  }

  /**
   * Resolve album cover art URL
   * @param {string} albumId - Album identifier
   * @param {string} [size='medium'] - Size variant ('large', 'medium', 'small')
   * @returns {string} Cover art URL
   */
  static resolveCoverArt(albumId, size = 'medium') {
    const sizeMap = {
      large: '1200',
      medium: '600',
      small: '300',
    };
    const sizeValue = sizeMap[size] || '600';
    return MediaURLResolver.resolve(`${albumId}-${sizeValue}.jpg`, 'covers');
  }

  /**
   * Resolve ambient audio track URL
   * @param {string} trackName - Ambient track name (without extension)
   * @returns {string} Ambient audio URL
   */
  static resolveAmbient(trackName) {
    return MediaURLResolver.resolve(`ambient/${trackName}.mp3`, 'audio');
  }

  /**
   * Check if a URL is from the R2 CDN
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is from R2
   */
  static isR2Url(url) {
    const r2BaseUrl = window.ETCETER4_CONFIG?.media?.r2BaseUrl;
    if (!r2BaseUrl || !url) {
      return false;
    }
    return url.startsWith(r2BaseUrl);
  }

  /**
   * Get all track URLs for an album
   * @param {string} albumId - Album identifier
   * @param {number} trackCount - Number of tracks
   * @param {Object} [options={}] - Options
   * @param {string} [options.format='mp3'] - Audio format
   * @param {boolean} [options.includeWaveforms=true] - Include waveform URLs
   * @param {boolean} [options.includeLyrics=false] - Include lyrics URLs
   * @returns {Array<Object>} Array of track URL objects
   */
  static resolveAlbumTracks(albumId, trackCount, options = {}) {
    const {
      format = 'mp3',
      includeWaveforms = true,
      includeLyrics = false,
    } = options;

    const tracks = [];

    for (let i = 1; i <= trackCount; i++) {
      const track = {
        trackNumber: i,
        audioUrl: MediaURLResolver.resolveAlbumTrack(albumId, i, format),
      };

      if (includeWaveforms) {
        track.waveformUrl = MediaURLResolver.resolveWaveform(albumId, i);
      }

      if (includeLyrics) {
        track.lyricsUrl = MediaURLResolver.resolveLyrics(albumId, i);
      }

      tracks.push(track);
    }

    return tracks;
  }

  /**
   * Build a complete album metadata object with resolved URLs
   * @param {string} albumId - Album identifier
   * @returns {Object|null} Album metadata with resolved URLs, or null if not found
   */
  static resolveAlbumMetadata(albumId) {
    const albumConfig = window.ETCETER4_CONFIG?.media?.albums?.[albumId];

    if (!albumConfig) {
      return null;
    }

    return {
      ...albumConfig,
      coverArt: {
        large: MediaURLResolver.resolveCoverArt(albumId, 'large'),
        medium: MediaURLResolver.resolveCoverArt(albumId, 'medium'),
        small: MediaURLResolver.resolveCoverArt(albumId, 'small'),
      },
      tracks: MediaURLResolver.resolveAlbumTracks(albumId, albumConfig.trackCount, {
        includeWaveforms: true,
        includeLyrics: albumConfig.hasLyrics || false,
      }),
    };
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.MediaURLResolver = MediaURLResolver;
}
