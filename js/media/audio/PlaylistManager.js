/**
 * @file PlaylistManager.js
 * @description Album/playlist UI controller for the Odeion chamber.
 * Manages album selection, track listing, queue, and integrates with
 * EnhancedAudioPlayer for Howler.js playback and WaveformVisualizer.
 */

'use strict';

class PlaylistManager {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Odeion player container element
   * @param {EnhancedAudioPlayer} [options.player] - Existing player instance
   * @param {WaveformVisualizer} [options.waveform] - Existing waveform instance
   */
  constructor(options = {}) {
    this.container = options.container;
    this.player = options.player || null;
    this.waveform = options.waveform || null;

    // Album data from config (convert object to array)
    const albumsObj =
      (typeof ETCETER4_CONFIG !== 'undefined' &&
        ETCETER4_CONFIG.media?.albums) ||
      {};
    this.albums = Object.values(albumsObj);

    // State
    this.currentAlbum = null;
    this.currentTrackIndex = 0;
    this.isShuffled = false;
    this.repeatMode = 'none'; // 'none', 'all', 'one'
    this.queue = [];
    this._shuffledQueue = [];

    // DOM refs (set during render)
    this._albumGrid = null;
    this._trackList = null;
    this._nowPlaying = null;
  }

  /** Initialize the playlist UI */
  initialize() {
    if (!this.container) {
      return;
    }
    this._render();
    this._bindEvents();

    // If we have albums, show the grid
    if (this.albums.length > 0) {
      this._renderAlbumGrid();
    }
  }

  /** Render the base UI structure */
  _render() {
    // Album selector
    this._albumGrid = document.createElement('div');
    this._albumGrid.className =
      'odeion-album-grid flex flex-wrap justify-center mb4';
    this._albumGrid.setAttribute('role', 'list');
    this._albumGrid.setAttribute('aria-label', 'Albums');

    // Track list
    this._trackList = document.createElement('div');
    this._trackList.className = 'odeion-track-list dn';

    // Insert before the existing player controls area
    const playerContainer = document.getElementById('odeion-player-container');
    if (playerContainer) {
      this.container.insertBefore(this._albumGrid, playerContainer);
      // Track list after player
      playerContainer.after(this._trackList);
    } else {
      this.container.appendChild(this._albumGrid);
      this.container.appendChild(this._trackList);
    }

    // Add playlist controls row
    this._renderControls();
  }

  /** Render album selection grid */
  _renderAlbumGrid() {
    this._albumGrid.innerHTML = this.albums
      .map(
        (album, idx) => `
      <div class="odeion-album-card pointer ma2 ba b--white-20 br3 pa3 tc"
           data-album-index="${idx}" role="listitem"
           style="width: 200px; border-left: 3px solid #ffd700; background: rgba(0,0,0,0.5)">
        <div class="bg-dark-gray br2 mb2 tc" style="height: 140px; line-height: 140px">
          ${album.coverUrl ? `<img src="${album.coverUrl}" alt="${album.title}" class="w-100 h-100 br2" style="object-fit:cover">` : `<span class="f2" style="color: #ffd700">${album.shortTitle || album.title.charAt(0)}</span>`}
        </div>
        <h4 class="f6 mt0 mb1" style="color: #ffd700">${album.title}</h4>
        <p class="f7 o-50 mt0 mb0">${album.year || ''} &middot; ${album.tracks?.length || 0} tracks</p>
      </div>
    `
      )
      .join('');
  }

  /** Render playlist controls (shuffle, repeat, prev, next) */
  _renderControls() {
    const controls = document.createElement('div');
    controls.className =
      'odeion-playlist-controls flex justify-center items-center mt2 mb2';
    controls.innerHTML = `
      <button id="odeion-shuffle-btn" class="pa1 ph2 ba b--white-20 bg-black-70 white f7 pointer br2 mr2"
              aria-label="Shuffle" title="Shuffle">&#8645;</button>
      <button id="odeion-prev-btn" class="pa1 ph2 ba b--white-20 bg-black-70 white f7 pointer br2 mr2"
              aria-label="Previous track" title="Previous">&#9664;&#9664;</button>
      <button id="odeion-next-btn" class="pa1 ph2 ba b--white-20 bg-black-70 white f7 pointer br2 mr2"
              aria-label="Next track" title="Next">&#9654;&#9654;</button>
      <button id="odeion-repeat-btn" class="pa1 ph2 ba b--white-20 bg-black-70 white f7 pointer br2"
              aria-label="Repeat" title="Repeat">&#8635;</button>
    `;

    const playerContainer = document.getElementById('odeion-player-container');
    const existingControls = document.getElementById('odeion-controls');
    if (existingControls) {
      existingControls.after(controls);
    } else if (playerContainer) {
      playerContainer.appendChild(controls);
    }
  }

  /** Bind click handlers */
  _bindEvents() {
    // Album selection
    this._albumGrid?.addEventListener('click', e => {
      const card = e.target.closest('.odeion-album-card');
      if (card) {
        const idx = parseInt(card.dataset.albumIndex);
        this.selectAlbum(idx);
      }
    });

    // Track selection
    this._trackList?.addEventListener('click', e => {
      const row = e.target.closest('.odeion-track-row');
      if (row) {
        const idx = parseInt(row.dataset.trackIndex);
        this.playTrack(idx);
      }
    });

    // Playlist controls
    document
      .getElementById('odeion-prev-btn')
      ?.addEventListener('click', () => this.previous());
    document
      .getElementById('odeion-next-btn')
      ?.addEventListener('click', () => this.next());
    document
      .getElementById('odeion-shuffle-btn')
      ?.addEventListener('click', () => this.toggleShuffle());
    document
      .getElementById('odeion-repeat-btn')
      ?.addEventListener('click', () => this.toggleRepeat());

    // Listen for track end to advance queue
    if (this.player) {
      this.player.on('end', () => this._onTrackEnd());
    }
  }

  /**
   * Select an album and show its tracks
   * @param {number} albumIndex
   */
  selectAlbum(albumIndex) {
    if (albumIndex < 0 || albumIndex >= this.albums.length) {
      return;
    }

    this.currentAlbum = this.albums[albumIndex];
    this.queue = [...(this.currentAlbum.tracks || [])];
    this.currentTrackIndex = 0;

    // Highlight selected album
    this._albumGrid
      ?.querySelectorAll('.odeion-album-card')
      .forEach((card, i) => {
        card.style.borderColor =
          i === albumIndex ? '#ffd700' : 'rgba(255,255,255,0.13)';
      });

    // Show track list
    this._renderTrackList();
    this._trackList?.classList.remove('dn');

    // Load tracks into player
    if (this.player && this.queue.length > 0) {
      this.player.tracks = this.queue.map(t => ({
        id: t.id || t.title,
        title: t.title,
        url: t.url,
      }));
    }
  }

  /** Render the track list for the current album */
  _renderTrackList() {
    if (!this._trackList || !this.currentAlbum) {
      return;
    }

    const tracks = this.currentAlbum.tracks || [];
    this._trackList.innerHTML = `
      <div class="pa3 ba b--white-10 br3 bg-black-50">
        <h4 class="f5 mt0 mb3" style="color: #ffd700">${this.currentAlbum.title}</h4>
        ${tracks
          .map(
            (t, i) => `
          <div class="odeion-track-row pointer flex items-center pa2 mb1 br2 hover-bg-white-10"
               data-track-index="${i}" role="button" tabindex="0"
               aria-label="Play ${t.title}">
            <span class="f7 o-50 mr2" style="width: 24px; text-align: right">${i + 1}</span>
            <span class="f6 flex-auto white">${t.title}</span>
            <span class="f7 o-50">${t.duration || ''}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Play a specific track by index
   * @param {number} trackIndex
   */
  playTrack(trackIndex) {
    if (!this.currentAlbum || trackIndex < 0) {
      return;
    }

    this.currentTrackIndex = trackIndex;
    const track = this.queue[trackIndex];
    if (!track) {
      return;
    }

    // Update now-playing display
    const titleEl = document.getElementById('odeion-track-title');
    if (titleEl) {
      titleEl.textContent = track.title;
    }

    // Highlight current track
    this._trackList?.querySelectorAll('.odeion-track-row').forEach((row, i) => {
      row.style.background = i === trackIndex ? 'rgba(255,215,0,0.1)' : '';
    });

    // Play via EnhancedAudioPlayer
    if (this.player) {
      this.player.loadTrack?.(trackIndex);
      this.player.play?.();
    }
  }

  /** Play next track in queue */
  next() {
    if (!this.queue.length) {
      return;
    }
    let nextIndex;
    if (this.isShuffled) {
      nextIndex = Math.floor(Math.random() * this.queue.length);
    } else {
      nextIndex = this.currentTrackIndex + 1;
      if (nextIndex >= this.queue.length) {
        nextIndex = this.repeatMode !== 'none' ? 0 : this.queue.length - 1;
      }
    }
    this.playTrack(nextIndex);
  }

  /** Play previous track */
  previous() {
    if (!this.queue.length) {
      return;
    }
    let prevIndex = this.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.repeatMode !== 'none' ? this.queue.length - 1 : 0;
    }
    this.playTrack(prevIndex);
  }

  /** Toggle shuffle mode */
  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    const btn = document.getElementById('odeion-shuffle-btn');
    if (btn) {
      btn.style.color = this.isShuffled ? '#ffd700' : '';
    }
  }

  /** Cycle repeat mode: none → all → one → none */
  toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const current = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(current + 1) % modes.length];

    const btn = document.getElementById('odeion-repeat-btn');
    if (btn) {
      btn.style.color = this.repeatMode !== 'none' ? '#ffd700' : '';
      btn.textContent = this.repeatMode === 'one' ? '\u21BB1' : '\u21BB';
    }
  }

  /** Handle track end - advance queue or repeat */
  _onTrackEnd() {
    if (this.repeatMode === 'one') {
      this.playTrack(this.currentTrackIndex);
    } else {
      this.next();
    }
  }

  /** Dispose */
  dispose() {
    this._albumGrid?.remove();
    this._trackList?.remove();
  }
}

window.PlaylistManager = PlaylistManager;
