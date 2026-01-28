# Self-Hosted Audio Infrastructure

## Overview

This directory contains all self-hosted audio files for the ETCETER4 Pantheon project. The audio player uses Howler.js for professional-grade playback with features like:

- Custom UI matching site aesthetic
- Playlist support
- Progress tracking with seek
- Volume controls
- Keyboard shortcuts (planned)
- Waveform visualization (planned)

## Directory Structure

```
audio/
├── albums/               # Album audio files
│   ├── ogod/            # OGOD album tracks
│   ├── rmxs/            # RMXS album tracks
│   ├── progression-digression/  # ProgressionDigression tracks
│   ├── etc/             # Etc album tracks
│   └── config.js        # Album metadata configuration
├── singles/             # Individual singles (future)
├── soundscapes/         # Ambient/generative audio (future)
└── README.md            # This file
```

## File Format Requirements

### Audio Files

- **Primary Format:** MP3 (320kbps for high quality, 192kbps for standard)
- **File Naming:** `##-track-title.mp3` (e.g., `01-intro.mp3`)
- **Metadata:** ID3v2.3 tags with title, artist, album, year, track number
- **Cover Art:** Embedded album art (500x500px minimum)

### Configuration

- **config.js:** Central configuration for all albums
- Contains track listings, metadata, external links
- Update this file when adding new tracks

## Adding New Audio

### Step 1: Prepare Audio Files

```bash
# Convert to high-quality MP3
ffmpeg -i source.wav -codec:a libmp3lame -b:a 320k output.mp3

# Normalize audio levels
ffmpeg -i input.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11" output.mp3

# Add metadata
ffmpeg -i input.mp3 -metadata title="Track Title" \
       -metadata artist="ET CETER4" \
       -metadata album="Album Name" \
       -metadata date="2024" \
       -codec copy output.mp3
```

### Step 2: Organize Files

```bash
# Create album directory if needed
mkdir -p audio/albums/album-name

# Copy files with proper naming
cp track1.mp3 audio/albums/album-name/01-track-title.mp3
cp track2.mp3 audio/albums/album-name/02-track-title.mp3
```

### Step 3: Update Configuration

Edit `audio/albums/config.js` and add your album:

```javascript
albumName: {
    id: 'album-name',
    title: 'Album Title',
    artist: 'ET CETER4',
    year: 2024,
    coverArt: '/img/photos/artwork/album-name/cover.jpg',
    description: 'Album description',
    tracks: [
        {
            id: 1,
            title: 'Track Title',
            src: '/audio/albums/album-name/01-track-title.mp3',
            duration: '3:45'
        }
    ],
    links: {
        bandcamp: 'https://...',
        spotify: 'https://...'
    }
}
```

### Step 4: Initialize Player

In your HTML or JavaScript:

```javascript
// Load Howler.js
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>

// Load audio player
<script src="/js/audioPlayer.js"></script>
<script src="/audio/albums/config.js"></script>

// Initialize player
const player = new AudioPlayer({
    id: 'ogod-player',
    container: '#audio-player-container',
    tracks: albumsConfig.ogod.tracks
});
```

## Storage Options

### Option 1: Direct Hosting (Current)

- Files stored in `/audio/` directory
- Served directly by web server
- Simple but limited scalability
- Good for small catalogs

### Option 2: Cloudflare R2 (Recommended for Production)

- Object storage with CDN delivery
- Cost-effective ($0.015/GB storage, $0.01/GB egress)
- Automatic global distribution
- See MEDIA_INFRASTRUCTURE_GUIDE.md for setup

### Option 3: GitHub LFS

- Large file storage via Git LFS
- Free tier: 1GB storage, 1GB bandwidth/month
- Good for version control
- Slower delivery than R2

## Current Status

**Implemented:**

- ✅ Audio player module (audioPlayer.js)
- ✅ Player styling (audioPlayer.css)
- ✅ Album configuration structure
- ✅ Directory organization
- ✅ Documentation

**Pending:**

- ⏳ Upload actual audio files
- ⏳ Set up Cloudflare R2 (optional)
- ⏳ Add waveform visualization
- ⏳ Add keyboard shortcuts
- ⏳ Add download functionality
- ⏳ Integrate with existing pages

## Integration Guide

To integrate the audio player into existing pages:

1. Include CSS in `<head>`:

```html
<link rel="stylesheet" href="/css/audioPlayer.css" />
```

2. Include scripts before `</body>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
<script src="/audio/albums/config.js"></script>
<script src="/js/audioPlayer.js"></script>
```

3. Add container div:

```html
<div id="audio-player-container"></div>
```

4. Initialize in pageData.js or inline:

```javascript
const player = new AudioPlayer({
  id: 'main-player',
  container: '#audio-player-container',
  tracks: albumsConfig.ogod.tracks,
});
```

## UI Sound Sprites

The site uses SoundJS audio sprites for UI feedback sounds. These are subtle sounds that play during:

- Page transitions (enter/exit)
- Hover events
- Click events

### Creating the UI Sound Sprite

The UI sounds should be combined into a single audio file (`ui-sounds.ogg`) with the following layout:

| Sound | Start Time (ms) | Duration (ms) |
| ---------- | --------------- | ------------- |
| click | 0 | 100 |
| hover | 150 | 80 |
| pageEnter | 300 | 300 |
| pageExit | 700 | 400 |
| transition | 1200 | 500 |

**To create the sprite file:**

```bash
# Using ffmpeg to combine individual sounds with silence padding
ffmpeg -i click.wav -i hover.wav -i pageEnter.wav -i pageExit.wav -i transition.wav \
       -filter_complex "[0]adelay=0|0[a];[1]adelay=150|150[b];[2]adelay=300|300[c];[3]adelay=700|700[d];[4]adelay=1200|1200[e];[a][b][c][d][e]amix=inputs=5:normalize=0" \
       -c:a libvorbis ui-sounds.ogg
```

**Or use Audacity:**

1. Create a new project
2. Import each sound effect
3. Position each sound at the start time specified above
4. Export as OGG Vorbis format

Place the resulting file at `audio/ui-sounds.ogg`.

### Disabling UI Sounds

UI sounds can be disabled in the browser:

```javascript
UISounds.disable();
// or
UISounds.toggle();
```

## Roadmap

### Phase 1: Basic Playback (✅ Complete)

- Custom audio player
- Playlist support
- Basic controls

### Phase 2: Enhanced Features (Current)

- Upload audio files
- Set up R2 storage
- Add visualizations
- UI sound sprites

### Phase 3: Advanced Features

- Streaming optimization (HLS)
- Lyrics/metadata sync
- Social sharing
- Analytics tracking

## Support

For issues or questions:

- See MEDIA_INFRASTRUCTURE_GUIDE.md for detailed setup
- Check Howler.js docs: https://howlerjs.com/
- Review audioPlayer.js source code

---

**Last Updated:** 2025-11-03
**Status:** Development - Infrastructure Complete, Awaiting Audio Files
