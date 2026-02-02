/**
 * @file odeion/odeion.js
 * @description ODEION chamber main logic
 * Handles music grid display, filtering, audio player integration, and waveform visualization
 */

'use strict';

// eslint-disable-next-line no-unused-vars
const OdeionChamber = (function() {
  let currentCategory = 'all';
  let currentTrack = null;
  let audioPlayer = null;
  let waveformCanvas = null;
  let waveformCtx = null;

  /**
   * Initialize the Odeion chamber
   */
  function initialize() {
    setupEventListeners();
    setupWaveformCanvas();
    renderMusicGrid(currentCategory);
    setupAudioPlayer();
  }

  /**
   * Setup event listeners for section navigation
   */
  function setupEventListeners() {
    const sectionButtons = document.querySelectorAll('.section-nav-btn');

    sectionButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        filterByCategory(section);
      });
    });

    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', function() {
        const volume = this.value;
        document.getElementById('volume-percent').textContent = volume + '%';
        if (audioPlayer) {
          audioPlayer.setVolume(volume / 100);
        }
      });
    }

    // Playback controls
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (audioPlayer && currentTrack) {
          audioPlayer.play();
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (audioPlayer) {
          audioPlayer.pause();
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (audioPlayer) {
          audioPlayer.stop();
        }
      });
    }
  }

  /**
   * Setup waveform canvas
   */
  function setupWaveformCanvas() {
    waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
      waveformCtx = waveformCanvas.getContext('2d');
      // Set canvas size to match container
      const container = waveformCanvas.parentElement;
      if (container) {
        waveformCanvas.width = container.clientWidth;
        waveformCanvas.height = container.clientHeight;
        drawEmptyWaveform();
      }
    }
  }

  /**
   * Draw empty waveform (initialization state)
   */
  function drawEmptyWaveform() {
    if (!waveformCtx || !waveformCanvas) return;

    const primaryColor = ODEION_CONFIG.player.waveform.primaryColor;
    const { height } = waveformCanvas;
    const centerY = height / 2;

    waveformCtx.fillStyle = ODEION_CONFIG.player.waveform.backgroundColor;
    waveformCtx.fillRect(0, 0, waveformCanvas.width, height);

    // Draw center line
    waveformCtx.strokeStyle = primaryColor;
    waveformCtx.globalAlpha = 0.3;
    waveformCtx.lineWidth = 1;
    waveformCtx.beginPath();
    waveformCtx.moveTo(0, centerY);
    waveformCtx.lineTo(waveformCanvas.width, centerY);
    waveformCtx.stroke();
    waveformCtx.globalAlpha = 1;
  }

  /**
   * Setup audio player
   */
  function setupAudioPlayer() {
    if (typeof EnhancedAudioPlayer !== 'undefined') {
      audioPlayer = new EnhancedAudioPlayer({
        container: 'odeion-player-container',
        waveformCanvas: 'waveform-canvas',
        onTrackLoad: handleTrackLoad,
        onTimeUpdate: handleTimeUpdate,
        onEnded: handleTrackEnded,
      });
    }
  }

  /**
   * Handle track load event
   */
  function handleTrackLoad(trackData) {
    if (!trackData) return;

    // Update now playing info
    const titleEl = document.getElementById('now-playing-track');
    const albumEl = document.getElementById('now-playing-album');

    if (titleEl) {
      titleEl.textContent = trackData.title || 'Untitled';
    }

    if (albumEl) {
      albumEl.textContent = `Album: ${trackData.album || 'Unknown'}`;
    }

    // Update cover art
    const coverEl = document.getElementById('current-album-cover');
    const coverUrl = trackData.coverArt;
    if (coverEl && coverUrl) {
      coverEl.src = coverUrl;
      coverEl.style.display = 'block';
      const placeholderText = coverEl.parentElement.querySelector('.placeholder-text');
      if (placeholderText) {
        placeholderText.style.display = 'none';
      }
    }

    // Update duration display
    const durationEl = document.getElementById('duration');
    if (durationEl && trackData.duration) {
      durationEl.textContent = formatTime(trackData.duration);
    }
  }

  /**
   * Handle time update event
   */
  function handleTimeUpdate(currentTime, duration) {
    const currentTimeEl = document.getElementById('current-time');
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(currentTime);
    }
  }

  /**
   * Handle track ended event
   */
  function handleTrackEnded() {
    // Could implement auto-play next track here
    console.log('Track ended');
  }

  /**
   * Format time in MM:SS format
   */
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Filter music grid by category
   */
  function filterByCategory(category) {
    currentCategory = category;

    // Update button states
    document.querySelectorAll('.section-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${category}"]`).classList.add('active');

    // Render filtered grid
    renderMusicGrid(category);
  }

  /**
   * Render music grid based on category
   */
  function renderMusicGrid(category) {
    const container = document.getElementById('chamber-items');
    if (!container) return;

    const items = ODEION_CONFIG.getItemsByCategory(category);

    if (items.length === 0) {
      container.innerHTML = '<p class="tc white-70 w-100">No items in this category yet.</p>';
      return;
    }

    container.innerHTML = items.map(item => createMusicItemCard(item)).join('');

    // Add event listeners to play buttons
    document.querySelectorAll('.play-track-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const trackId = btn.getAttribute('data-track-id');
        const track = ODEION_CONFIG.getItemById(trackId);
        playTrack(track);
      });
    });
  }

  /**
   * Create HTML for a music item card
   */
  function createMusicItemCard(item) {
    const coverUrl = ODEION_CONFIG.getCoverArt(item, 'medium');
    const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);

    let coverHtml = '';
    if (coverUrl) {
      coverHtml = `<img src="${coverUrl}" alt="${item.title} cover art" loading="lazy" />`;
    } else {
      coverHtml = '<div class="placeholder"><span>No Cover Art</span></div>';
    }

    const featuresHtml = item.features && item.features.length > 0
      ? `<div class="music-item-features">
           ${item.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
         </div>`
      : '';

    return `
      <div class="music-item" data-item-id="${item.id}" data-category="${item.category}">
        <div class="music-item-cover">
          ${coverHtml}
        </div>
        <div class="music-item-info">
          <h3 class="music-item-title">${escapeHtml(item.title)}</h3>
          <div class="music-item-meta">
            <div class="music-item-meta-line">
              <span>${escapeHtml(item.artist || 'ET CETER4')}</span>
              <span>${item.year}</span>
            </div>
            <div class="music-item-meta-line">
              <span>${categoryLabel}</span>
              <span>${item.trackCount > 0 ? item.trackCount + ' tracks' : ''} ${item.duration || ''}</span>
            </div>
          </div>
          <p class="f7 white-60 lh-copy">${escapeHtml(item.description || '')}</p>
          ${featuresHtml}
          <div class="music-item-action">
            <button class="play-track-btn" data-track-id="${item.id}" aria-label="Play ${item.title}">
              ▶ Play / More Info
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Play a track
   */
  function playTrack(track) {
    if (!track) return;

    currentTrack = track;

    // Update UI
    const titleEl = document.getElementById('now-playing-track');
    if (titleEl) {
      titleEl.textContent = track.title;
    }

    // If EnhancedAudioPlayer is available, use it
    if (audioPlayer) {
      const trackData = {
        title: track.title,
        artist: track.artist,
        album: track.title, // Use track title as album for individual items
        duration: parseFloat(track.duration) || 0,
        coverArt: ODEION_CONFIG.getCoverArt(track, 'large'),
        url: `audio/${track.category}/${track.id}/track.mp3`, // Example path
      };
      audioPlayer.load(trackData);
      audioPlayer.play();
    }
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Public API
   */
  return {
    initialize: initialize,
    filterByCategory: filterByCategory,
    playTrack: playTrack,
    getCurrentCategory: () => currentCategory,
    getCurrentTrack: () => currentTrack,
  };
})();
