# SELF-HOSTED MEDIA INFRASTRUCTURE

**Complete Guide for Audio & Video Hosting**

_Part of the ETCETER4 Pantheon Project_

---

## Executive Summary

This document provides **step-by-step instructions** for building a completely self-hosted media infrastructure, eliminating dependence on external platforms (Spotify, Bandcamp, YouTube) while maintaining links to them for distribution.

**Goal:** Full ownership and control of your audio/video content with professional playback experience.

---

## I. Why Self-Host?

### Benefits

**Ownership & Control:**

- Complete control over presentation
- No platform censorship or removal
- Custom branding and experience
- No algorithm manipulation
- Permanent availability

**Independence:**

- Not dependent on platform policies
- No subscription fees (Bandcamp, etc.)
- No bandwidth throttling
- No forced updates

**Customization:**

- Branded players
- Custom features
- Integration with your aesthetic
- Unique user experience

**Analytics:**

- See exactly who listens/watches
- Understand engagement
- No platform blackbox

### External Links as Distribution

**Keep External Presence:**

- Spotify: Discovery and playlists
- Bandcamp: Sales and community
- YouTube: SEO and reach
- SoundCloud: Sharing and embedding

**Strategy:** Pantheon = canonical source, external platforms = distribution channels

---

## II. Architecture Overview

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: STORAGE                         │
│  (Where files live - Cloudflare R2, S3, or direct hosting) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 2: DELIVERY                         │
│      (CDN, streaming, optimization - automatic via R2)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 3: PLAYBACK                         │
│     (Custom players on your site - Howler.js, Video.js)    │
└─────────────────────────────────────────────────────────────┘
```

---

## III. Audio Infrastructure

### A. Technology Choice

**Recommended: Howler.js**

**Why Howler.js:**

- Simple, powerful API
- HTML5 Audio + Web Audio API
- Cross-browser compatible
- Sprite support (for sound effects)
- 3D spatial audio capabilities
- Active development
- Free and open source

**Alternatives:**

- Tone.js (for synthesis and effects)
- Web Audio API (raw, more complex)
- Audio.js (simpler, less features)

---

### B. File Formats & Preparation

**Recommended Formats:**

**Primary: MP3**

- Universal compatibility
- Good compression
- 320kbps for high quality
- 192kbps for standard quality

**Secondary: FLAC** (optional, for audiophiles)

- Lossless compression
- Larger file sizes
- Higher quality
- Offer as download option

**Avoid:**

- WAV (too large for streaming)
- WMA (poor compatibility)
- OGG (declining support)

---

**Preparation Workflow:**

```bash
# Using ffmpeg to convert and optimize

# High quality MP3 (320kbps)
ffmpeg -i source.wav -codec:a libmp3lame -b:a 320k output-320.mp3

# Standard quality MP3 (192kbps)
ffmpeg -i source.wav -codec:a libmp3lame -b:a 192k output-192.mp3

# Normalize audio levels
ffmpeg -i input.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11" output.mp3

# Extract metadata
ffmpeg -i input.mp3 -f ffmetadata metadata.txt

# Add album art
ffmpeg -i input.mp3 -i cover.jpg -map 0:0 -map 1:0 -c copy -id3v2_version 3 \
  -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)" \
  output.mp3
```

---

### C. File Organization

**Directory Structure:**

```
/media/audio/
├── albums/
│   ├── ogod/
│   │   ├── 01-intro.mp3
│   │   ├── 02-track-two.mp3
│   │   ├── ...
│   │   ├── cover.jpg
│   │   ├── metadata.json
│   │   └── README.md
│   ├── rmxs/
│   ├── progression-digression/
│   └── etcetera/
├── singles/
│   ├── 2024-01-single-name/
│   │   ├── single.mp3
│   │   ├── cover.jpg
│   │   └── metadata.json
│   └── ...
├── demos/
├── remixes/
└── experiments/
```

**Metadata Schema (metadata.json):**

```json
{
  "album": "OGOD",
  "artist": "ET CETER4",
  "year": 2015,
  "tracks": [
    {
      "number": 1,
      "title": "Intro",
      "file": "01-intro.mp3",
      "duration": "2:34",
      "bpm": 120,
      "key": "C minor",
      "lyrics": "path/to/lyrics.txt",
      "credits": {
        "production": "Anthony Padavano",
        "mixing": "Name",
        "mastering": "Name"
      }
    }
  ],
  "cover": "cover.jpg",
  "genre": ["Electronic", "Experimental"],
  "tags": ["#album", "#2015", "#ogod"],
  "external": {
    "spotify": "https://open.spotify.com/album/...",
    "bandcamp": "https://etceter4.bandcamp.com/album/ogod",
    "youtube": "https://youtube.com/playlist?list=..."
  }
}
```

---

### D. Custom Audio Player Implementation

**Step 1: Include Howler.js**

```html
<!-- In index.html, before closing body -->
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"
  integrity="sha512-xi/RZRIF/S0hJ+yJJYuZ5yk6/8pCiRlEXZzoguSMl+vk2divM+5618mZLrYJNGNH4D8zjlYu4jpKU7TG4l4MdA=="
  crossorigin="anonymous"
></script>
```

**Step 2: Create Player HTML**

```html
<!-- Audio Player UI -->
<div id="audio-player" class="audio-player">
  <div class="player-controls">
    <button id="play-pause" class="btn-play">
      <span class="icon-play">▶</span>
      <span class="icon-pause dn">⏸</span>
    </button>
    <button id="prev" class="btn-prev">⏮</button>
    <button id="next" class="btn-next">⏭</button>
  </div>

  <div class="player-info">
    <div id="track-title">Track Title</div>
    <div id="track-artist">Artist Name</div>
  </div>

  <div class="player-progress">
    <span id="current-time">0:00</span>
    <div class="progress-bar">
      <div id="progress" class="progress-fill"></div>
      <input type="range" id="seek-bar" min="0" max="100" value="0" />
    </div>
    <span id="duration">0:00</span>
  </div>

  <div class="player-volume">
    <button id="mute">🔊</button>
    <input type="range" id="volume" min="0" max="100" value="80" />
  </div>

  <div class="player-playlist">
    <button id="toggle-playlist">☰ Playlist</button>
  </div>
</div>

<!-- Playlist -->
<div id="playlist" class="playlist dn">
  <div class="playlist-items">
    <!-- Will be populated by JavaScript -->
  </div>
</div>
```

**Step 3: Implement Player Logic**

```javascript
// media-player.js

class AudioPlayer {
  constructor(playlist) {
    this.playlist = playlist;
    this.currentTrackIndex = 0;
    this.sound = null;
    this.isPlaying = false;

    this.init();
  }

  init() {
    this.loadTrack(0);
    this.attachEventListeners();
  }

  loadTrack(index) {
    if (this.sound) {
      this.sound.unload();
    }

    const track = this.playlist[index];

    this.sound = new Howl({
      src: [track.file],
      html5: true, // Enable streaming
      preload: true,
      onload: () => {
        this.updateDuration();
      },
      onplay: () => {
        this.isPlaying = true;
        this.updatePlayButton();
        requestAnimationFrame(this.updateProgress.bind(this));
      },
      onpause: () => {
        this.isPlaying = false;
        this.updatePlayButton();
      },
      onend: () => {
        this.nextTrack();
      },
      onseek: () => {
        requestAnimationFrame(this.updateProgress.bind(this));
      },
    });

    this.currentTrackIndex = index;
    this.updateTrackInfo(track);
  }

  play() {
    if (this.sound) {
      this.sound.play();
    }
  }

  pause() {
    if (this.sound) {
      this.sound.pause();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack() {
    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(nextIndex);
    this.play();
  }

  prevTrack() {
    const prevIndex =
      (this.currentTrackIndex - 1 + this.playlist.length) %
      this.playlist.length;
    this.loadTrack(prevIndex);
    this.play();
  }

  seek(percentage) {
    if (this.sound) {
      const seekTime = (percentage / 100) * this.sound.duration();
      this.sound.seek(seekTime);
    }
  }

  setVolume(volume) {
    if (this.sound) {
      this.sound.volume(volume / 100);
    }
  }

  toggleMute() {
    if (this.sound) {
      this.sound.mute(!this.sound.mute());
    }
  }

  updateProgress() {
    if (this.sound && this.isPlaying) {
      const seek = this.sound.seek() || 0;
      const duration = this.sound.duration();
      const percentage = (seek / duration) * 100;

      document.getElementById('progress').style.width = percentage + '%';
      document.getElementById('seek-bar').value = percentage;
      document.getElementById('current-time').textContent =
        this.formatTime(seek);

      if (this.isPlaying) {
        requestAnimationFrame(this.updateProgress.bind(this));
      }
    }
  }

  updateDuration() {
    if (this.sound) {
      const duration = this.sound.duration();
      document.getElementById('duration').textContent =
        this.formatTime(duration);
    }
  }

  updateTrackInfo(track) {
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = track.artist;
  }

  updatePlayButton() {
    const playIcon = document.querySelector('.icon-play');
    const pauseIcon = document.querySelector('.icon-pause');

    if (this.isPlaying) {
      playIcon.classList.add('dn');
      pauseIcon.classList.remove('dn');
    } else {
      playIcon.classList.remove('dn');
      pauseIcon.classList.add('dn');
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  attachEventListeners() {
    // Play/Pause
    document.getElementById('play-pause').addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Next track
    document.getElementById('next').addEventListener('click', () => {
      this.nextTrack();
    });

    // Previous track
    document.getElementById('prev').addEventListener('click', () => {
      this.prevTrack();
    });

    // Seek
    document.getElementById('seek-bar').addEventListener('input', e => {
      this.seek(e.target.value);
    });

    // Volume
    document.getElementById('volume').addEventListener('input', e => {
      this.setVolume(e.target.value);
    });

    // Mute
    document.getElementById('mute').addEventListener('click', () => {
      this.toggleMute();
    });

    // Toggle playlist
    document.getElementById('toggle-playlist').addEventListener('click', () => {
      document.getElementById('playlist').classList.toggle('dn');
    });
  }
}

// Initialize player with OGOD album
const ogodPlaylist = [
  {
    title: 'Intro',
    artist: 'ET CETER4',
    file: 'https://r2.etceter4.com/media/audio/albums/ogod/01-intro.mp3',
  },
  {
    title: 'Track Two',
    artist: 'ET CETER4',
    file: 'https://r2.etceter4.com/media/audio/albums/ogod/02-track-two.mp3',
  },
  // ... more tracks
];

// Create player instance
const player = new AudioPlayer(ogodPlaylist);
```

**Step 4: Style the Player**

```css
/* audio-player.css */

.audio-player {
  background: #000;
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Futura', sans-serif;
}

.player-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.player-controls button {
  background: #00ffff;
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.player-controls button:hover {
  transform: scale(1.1);
  background: #ff00ff;
}

.player-info {
  text-align: center;
  margin-bottom: 1rem;
}

#track-title {
  font-size: 1.5rem;
  font-weight: bold;
}

#track-artist {
  font-size: 1rem;
  opacity: 0.8;
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  width: 0%;
  transition: width 0.1s;
}

#seek-bar {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

#volume {
  width: 100px;
}

.playlist {
  margin-top: 1rem;
  background: #111;
  padding: 1rem;
  border-radius: 4px;
}

.playlist-items {
  max-height: 300px;
  overflow-y: auto;
}

.playlist-item {
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.playlist-item:hover {
  background: #222;
}

.playlist-item.active {
  background: #00ffff;
  color: #000;
}
```

---

## IV. Video Infrastructure

### A. Technology Choice

**Recommended: Video.js**

**Why Video.js:**

- Industry standard
- Highly customizable
- Plugin ecosystem
- Multiple quality support
- Subtitle support
- Skinnable
- Free and open source

**Alternatives:**

- Plyr (simpler, modern UI)
- MediaElement.js (lighter weight)
- Native HTML5 video (minimal features)

---

### B. File Formats & Preparation

**Recommended Format: MP4 (H.264)**

**Multiple Quality Levels:**

- 1080p (HD) - 5-10 Mbps bitrate
- 720p (HD Ready) - 2.5-5 Mbps bitrate
- 480p (SD) - 1-2 Mbps bitrate
- 360p (Mobile) - 0.5-1 Mbps bitrate

**Preparation Workflow:**

```bash
# Using ffmpeg to create multiple quality levels

# 1080p version
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 192k \
  -vf scale=1920:1080 -movflags +faststart output-1080p.mp4

# 720p version
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k \
  -vf scale=1280:720 -movflags +faststart output-720p.mp4

# 480p version
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 24 -c:a aac -b:a 128k \
  -vf scale=854:480 -movflags +faststart output-480p.mp4

# 360p version (mobile)
ffmpeg -i source.mov -c:v libx264 -preset slow -crf 25 -c:a aac -b:a 96k \
  -vf scale=640:360 -movflags +faststart output-360p.mp4

# Generate thumbnail sprite for scrubbing
ffmpeg -i output-1080p.mp4 -vf "fps=1/10,scale=160:90,tile=10x10" sprites.jpg

# Extract frame for poster image
ffmpeg -i output-1080p.mp4 -ss 00:00:10 -vframes 1 poster.jpg

# Create WebVTT thumbnails file
# (Manual or script to create thumbnails.vtt)

# Generate WebVTT subtitles/captions
# (Manual or use subtitle tools)
```

---

### C. File Organization

**Directory Structure:**

```
/media/video/
├── performances/
│   ├── 2015-electronica/
│   │   ├── video-1080p.mp4
│   │   ├── video-720p.mp4
│   │   ├── video-480p.mp4
│   │   ├── video-360p.mp4
│   │   ├── poster.jpg
│   │   ├── sprites.jpg
│   │   ├── thumbnails.vtt
│   │   ├── subtitles-en.vtt
│   │   └── metadata.json
│   └── ...
├── visual-album/
│   ├── ogod/
│   │   ├── full-album-1080p.mp4
│   │   └── ...
│   └── ...
├── behind-the-scenes/
└── experiments/
```

**Metadata Schema (metadata.json):**

```json
{
  "title": "Live @ Electronica 1.3",
  "artist": "ET CETER4",
  "date": "2015-06-20",
  "venue": "Venue Name",
  "duration": "45:32",
  "description": "Full performance from Electronica 1.3 festival",
  "tags": ["#live", "#performance", "#2015", "#electronica"],
  "qualities": [
    { "label": "1080p", "file": "video-1080p.mp4", "size": "1.2GB" },
    { "label": "720p", "file": "video-720p.mp4", "size": "600MB" },
    { "label": "480p", "file": "video-480p.mp4", "size": "300MB" },
    { "label": "360p", "file": "video-360p.mp4", "size": "150MB" }
  ],
  "poster": "poster.jpg",
  "thumbnails": "thumbnails.vtt",
  "subtitles": [
    { "language": "en", "label": "English", "file": "subtitles-en.vtt" }
  ],
  "external": {
    "youtube": "https://youtube.com/watch?v=..."
  }
}
```

---

### D. Custom Video Player Implementation

**Step 1: Include Video.js**

```html
<!-- In head -->
<link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />

<!-- Before closing body -->
<script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
```

**Step 2: Create Player HTML**

```html
<div class="video-container">
  <video
    id="video-player"
    class="video-js vjs-default-skin vjs-big-play-centered"
    controls
    preload="auto"
    width="1280"
    height="720"
    poster="media/video/performances/2015-electronica/poster.jpg"
    data-setup="{}"
  >
    <!-- Multiple quality sources -->
    <source
      src="media/video/performances/2015-electronica/video-1080p.mp4"
      type="video/mp4"
      label="1080p"
      res="1080"
    />
    <source
      src="media/video/performances/2015-electronica/video-720p.mp4"
      type="video/mp4"
      label="720p"
      res="720"
    />
    <source
      src="media/video/performances/2015-electronica/video-480p.mp4"
      type="video/mp4"
      label="480p"
      res="480"
    />

    <!-- Subtitles/captions -->
    <track
      kind="captions"
      src="media/video/performances/2015-electronica/subtitles-en.vtt"
      srclang="en"
      label="English"
    />

    <!-- Thumbnails for scrubbing -->
    <track
      kind="metadata"
      src="media/video/performances/2015-electronica/thumbnails.vtt"
    />

    <p class="vjs-no-js">
      To view this video please enable JavaScript, and consider upgrading to a
      web browser that supports HTML5 video
    </p>
  </video>

  <!-- Video info -->
  <div class="video-info">
    <h2>Live @ Electronica 1.3</h2>
    <p class="video-date">June 20, 2015</p>
    <p class="video-description">
      Full performance from Electronica 1.3 festival at [Venue Name].
    </p>
    <div class="video-links">
      <a href="#" class="download-link">Download (1080p)</a>
      <a href="https://youtube.com/watch?v=..." class="external-link"
        >Watch on YouTube</a
      >
    </div>
  </div>
</div>
```

**Step 3: Initialize and Customize Player**

```javascript
// video-player.js

const player = videojs('video-player', {
  controls: true,
  autoplay: false,
  preload: 'auto',
  fluid: true, // Responsive
  responsive: true,
  aspectRatio: '16:9',
  playbackRates: [0.5, 1, 1.5, 2], // Speed controls

  // Custom control bar
  controlBar: {
    children: [
      'playToggle',
      'volumePanel',
      'currentTimeDisplay',
      'timeDivider',
      'durationDisplay',
      'progressControl',
      'liveDisplay',
      'seekToLive',
      'remainingTimeDisplay',
      'customControlSpacer',
      'playbackRateMenuButton',
      'chaptersButton',
      'descriptionsButton',
      'subsCapsButton',
      'audioTrackButton',
      'qualitySelector', // Need plugin for this
      'fullscreenToggle',
    ],
  },
});

// Quality selector plugin
// (You'll need videojs-quality-selector plugin or similar)

// Custom events
player.on('play', function () {
  console.log('Video started playing');
  // Track analytics
});

player.on('pause', function () {
  console.log('Video paused');
});

player.on('ended', function () {
  console.log('Video ended');
  // Show related videos, next in playlist, etc.
});

player.on('error', function () {
  console.error('Video error:', player.error());
  // Show fallback or error message
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }

  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    player.currentTime(player.currentTime() - 10); // -10 seconds
  }

  if (e.code === 'ArrowRight') {
    e.preventDefault();
    player.currentTime(player.currentTime() + 10); // +10 seconds
  }

  if (e.code === 'KeyF') {
    e.preventDefault();
    if (player.isFullscreen()) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }
});
```

**Step 4: Style the Player**

```css
/* video-player.css */

.video-container {
  max-width: 1280px;
  margin: 0 auto;
  background: #000;
}

/* Custom Video.js skin */
.video-js {
  font-family: 'Futura', sans-serif;
}

.vjs-big-play-button {
  background-color: rgba(0, 255, 255, 0.8) !important;
  border: none !important;
  border-radius: 50% !important;
  width: 2em !important;
  height: 2em !important;
  line-height: 2em !important;
  margin-top: -1em !important;
  margin-left: -1em !important;
}

.vjs-big-play-button:hover {
  background-color: rgba(255, 0, 255, 0.9) !important;
}

.vjs-control-bar {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8),
    transparent
  ) !important;
}

.vjs-play-progress {
  background-color: #00ffff !important;
}

.vjs-volume-level {
  background-color: #ff00ff !important;
}

.video-info {
  padding: 2rem;
  background: #111;
  color: #fff;
}

.video-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.video-date {
  color: #00ffff;
  margin: 0 0 1rem 0;
}

.video-description {
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.video-links {
  display: flex;
  gap: 1rem;
}

.video-links a {
  padding: 0.5rem 1rem;
  background: #00ffff;
  color: #000;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
}

.video-links a:hover {
  background: #ff00ff;
}

.external-link {
  background: #333 !important;
  color: #fff !important;
}
```

---

## V. Storage Solution Setup

### Recommended: Cloudflare R2

**Why Cloudflare R2:**

- **Zero egress fees** (no bandwidth charges!)
- S3-compatible API
- $0.015/GB storage (very cheap)
- Automatic CDN distribution
- Fast global delivery
- Simple setup

**Setup Process:**

**Step 1: Create Cloudflare Account**

1. Go to cloudflare.com
2. Sign up (free tier available)
3. Add payment method (required for R2)

**Step 2: Create R2 Bucket**

1. Go to R2 in dashboard
2. Click "Create bucket"
3. Name it (e.g., "etceter4-media")
4. Choose location (auto for best performance)

**Step 3: Generate Access Credentials**

1. Go to R2 settings
2. Create API token
3. Save Access Key ID and Secret Access Key

**Step 4: Configure Public Access (Optional)**

1. Enable public access for media bucket
2. Or use signed URLs for private content

**Step 5: Upload Files**

Using AWS CLI (R2 is S3-compatible):

```bash
# Configure AWS CLI for R2
aws configure
# Enter R2 credentials when prompted

# Upload single file
aws s3 cp local-file.mp3 s3://etceter4-media/audio/albums/ogod/01-intro.mp3 \
  --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com

# Upload entire folder
aws s3 sync ./media/audio/ s3://etceter4-media/audio/ \
  --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com

# Set public read permissions
aws s3api put-object-acl --bucket etceter4-media \
  --key audio/albums/ogod/01-intro.mp3 --acl public-read \
  --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
```

**Step 6: Configure Custom Domain (Optional)**

1. Create subdomain: media.etceter4.com
2. Point to R2 bucket via CNAME
3. Files accessible at: https://media.etceter4.com/audio/albums/ogod/01-intro.mp3

---

## VI. Cost Estimates

### Cloudflare R2 Pricing

**Storage:**

- $0.015 per GB/month
- First 10 GB free

**Operations:**

- Class A (writes): $4.50 per million requests
- Class B (reads): $0.36 per million requests

**Egress:**

- **FREE** (This is the big advantage!)

**Example Costs:**

```
Scenario: 50GB media, 10,000 plays/month

Storage: 50 GB × $0.015 = $0.75/month
Reads: 10,000 × $0.36/million = $0.00036/month
Egress: FREE

Total: ~$0.75/month
```

**Scaling:**

```
100 GB media, 100,000 plays/month = ~$1.50/month
500 GB media, 500,000 plays/month = ~$7.50/month
1 TB media, 1 million plays/month = ~$15/month
```

**Conclusion:** Extremely affordable, scales well

---

## VII. Alternative Solutions

### Option 2: GitHub Pages + Git LFS

**Pros:**

- Free (100GB storage)
- Built into existing GitHub repo
- Version control for media

**Cons:**

- 100GB limit
- 100GB bandwidth/month limit
- Not ideal for streaming
- Large files slow git operations

**Use Case:** Good for small collections, demos

---

### Option 3: Self-Hosted Server

**Pros:**

- Complete control
- No external dependencies
- Can be very cheap (used hardware)

**Cons:**

- Requires technical setup
- Bandwidth costs can be high
- Maintenance burden
- Uptime concerns

**Cost:**

- VPS: $5-20/month (DigitalOcean, Linode, etc.)
- Home server: One-time hardware cost + electricity

---

### Option 4: Hybrid (Recommended for Most)

**Setup:**

- Site on GitHub Pages (free)
- Media on Cloudflare R2 (~$1-10/month)
- Keep external links (Spotify, etc.) for distribution

**Benefits:**

- Best of both worlds
- Affordable
- Performant
- Redundancy

---

## VIII. Migration Plan

### Moving from External Platforms

**Step 1: Inventory** (Week 1)

- List all audio/video content
- Note current locations (Bandcamp, YouTube, etc.)
- Document file formats and quality

**Step 2: Download** (Week 1-2)

- Download highest quality versions
- Use youtube-dl for YouTube
- Download from Bandcamp/Spotify (if you own files)

**Step 3: Process** (Week 2-3)

- Convert to standard formats (MP3, MP4)
- Create multiple quality levels
- Generate metadata files
- Create artwork/thumbnails

**Step 4: Upload** (Week 3)

- Set up R2 bucket
- Upload organized files
- Test accessibility
- Configure permissions

**Step 5: Implement Players** (Week 4-5)

- Add Howler.js audio player
- Add Video.js video player
- Style to match site aesthetic
- Test on multiple devices

**Step 6: Update Site** (Week 5-6)

- Replace external embeds with custom players
- Add download options
- Keep external links for distribution
- Update navigation

**Step 7: Test & Launch** (Week 6)

- Cross-browser testing
- Mobile testing
- Performance testing
- Analytics setup
- Launch!

**Step 8: Monitor** (Ongoing)

- Check bandwidth usage
- Monitor costs
- Gather feedback
- Iterate and improve

---

## IX. Maintenance & Updates

### Regular Tasks

**Monthly:**

- Review bandwidth usage
- Check R2 costs
- Update any broken links
- Add new content

**Quarterly:**

- Review analytics
- Optimize slow-loading files
- Update player libraries
- Backup media files

**Annually:**

- Review storage costs
- Consider format updates
- Archive old content
- Plan expansions

---

## X. Backup Strategy

**Critical: Always maintain backups!**

**3-2-1 Backup Rule:**

- 3 copies of data
- 2 different media types
- 1 off-site backup

**Implementation:**

1. **Primary:** R2 bucket (cloud)
2. **Secondary:** Local hard drive
3. **Tertiary:** External hard drive (off-site)

**Automation:**

```bash
# Automated backup script
#!/bin/bash

# Sync R2 to local
aws s3 sync s3://etceter4-media/ ./backups/media/ \
  --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com

# Copy to external drive (when connected)
if [ -d "/Volumes/BackupDrive" ]; then
  rsync -av --delete ./backups/media/ /Volumes/BackupDrive/etceter4-media/
  echo "Backup to external drive complete"
fi
```

---

## XI. Next Steps

### Immediate Actions

**This Week:**

1. Create Cloudflare account
2. Set up R2 bucket
3. Upload one test album
4. Implement basic audio player
5. Test and refine

**Next Week:**

1. Upload remaining albums
2. Add video player
3. Upload first video
4. Style players
5. Mobile testing

**This Month:**

1. Complete media migration
2. Update all pages
3. Add metadata
4. Comprehensive testing
5. Launch self-hosted media!

---

## XII. Resources

### Tools & Libraries

**Audio:**

- Howler.js: howlerjs.com
- Wavesurfer.js: wavesurfer-js.org (waveform viz)
- Tone.js: tonejs.github.io (synthesis)

**Video:**

- Video.js: videojs.com
- Plyr: plyr.io
- MediaElement.js: mediaelementjs.com

**Processing:**

- FFmpeg: ffmpeg.org (audio/video conversion)
- HandBrake: handbrake.fr (video conversion GUI)
- Audacity: audacityteam.org (audio editing)

**Storage:**

- Cloudflare R2: developers.cloudflare.com/r2
- AWS S3: aws.amazon.com/s3
- Backblaze B2: backblaze.com/b2

**Deployment:**

- AWS CLI: aws.amazon.com/cli
- Rclone: rclone.org (cloud sync)
- Cyberduck: cyberduck.io (GUI client)

---

## Conclusion

You now have a complete blueprint for building self-hosted audio and video infrastructure. This gives you:

✅ Complete ownership of content
✅ Custom branded experience
✅ No platform dependencies
✅ Professional playback
✅ Affordable hosting (~$1-10/month)
✅ Scalable solution

**The Pantheon will be completely independent, with external platforms serving as distribution channels rather than primary hosts.**

---

_Guide by: Anthony James Padavano & Claude (Anthropic)_
_Date: October 27, 2025_
_Status: Ready for Implementation_

🎵 _Your music, your platform, your rules_ 🎬
