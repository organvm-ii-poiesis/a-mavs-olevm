# Self-Hosted Video Infrastructure

## Overview

This directory contains all self-hosted video files for the ETCETER4 Pantheon project. The video player uses Video.js for professional-grade playback with features like:

- Custom UI matching site aesthetic (magenta/cyan theme)
- Playlist support with thumbnails
- Quality selection (with plugin)
- Subtitles/captions support
- Fullscreen mode
- Playback speed controls
- Keyboard shortcuts
- Mobile responsive

## Directory Structure

```
video/
├── performances/        # Live performance videos
├── visual-albums/       # Music video content
├── experimental/        # Video art and experiments
├── config.js           # Video metadata configuration
└── README.md           # This file
```

## File Format Requirements

### Video Files

- **Primary Format:** MP4 (H.264 codec)
- **Resolution:** 1080p (1920x1080) recommended, 720p minimum
- **Bitrate:** 5-8 Mbps for 1080p, 3-5 Mbps for 720p
- **Audio:** AAC codec, 128kbps stereo minimum
- **File Naming:** Descriptive kebab-case (e.g., `live-performance-2024.mp4`)

### Supporting Files

- **Posters:** JPG/PNG, same resolution as video
- **Thumbnails:** JPG/PNG, 320x180px (16:9 aspect ratio)
- **Subtitles:** WebVTT format (.vtt files)

## Video Encoding Guide

### Using FFmpeg

```bash
# Convert to web-optimized MP4 (1080p)
ffmpeg -i input.mov \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -vf scale=1920:1080 \
  -movflags +faststart \
  output.mp4

# Convert to web-optimized MP4 (720p)
ffmpeg -i input.mov \
  -c:v libx264 -preset slow -crf 23 \
  -c:a aac -b:a 128k \
  -vf scale=1280:720 \
  -movflags +faststart \
  output.mp4

# Extract thumbnail at 5 seconds
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 \
  -vf scale=320:180 thumbnail.jpg

# Extract poster frame
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 \
  -vf scale=1920:1080 poster.jpg

# Generate WebVTT subtitles from SRT
ffmpeg -i subtitles.srt subtitles.vtt
```

### Multiple Quality Options (HLS)

For streaming with adaptive quality:

```bash
# Generate HLS playlist with multiple qualities
ffmpeg -i input.mp4 \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=1920:h=1080[v1out]; \
   [v2]scale=w=1280:h=720[v2out]; \
   [v3]scale=w=854:h=480[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1400k \
  -map a:0 -c:a:0 aac -b:a:0 128k \
  -map a:0 -c:a:1 aac -b:a:1 128k \
  -map a:0 -c:a:2 aac -b:a:2 96k \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  stream_%v/playlist.m3u8
```

## Adding New Videos

### Step 1: Prepare Video File

```bash
# Optimize for web
ffmpeg -i source.mov \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -vf scale=1920:1080 \
  -movflags +faststart \
  video-title.mp4

# Generate supporting files
ffmpeg -i video-title.mp4 -ss 00:00:05 -vframes 1 \
  -vf scale=320:180 video-title-thumb.jpg

ffmpeg -i video-title.mp4 -ss 00:00:05 -vframes 1 \
  -vf scale=1920:1080 video-title-poster.jpg
```

### Step 2: Organize Files

```bash
# Place in appropriate directory
mv video-title.mp4 video/performances/
mv video-title-thumb.jpg img/photos/live/
mv video-title-poster.jpg img/photos/live/
```

### Step 3: Update Configuration

Edit `video/config.js`:

```javascript
performances: {
  videos: [
    {
      id: 1,
      title: 'Video Title',
      description: 'Video description',
      src: '/video/performances/video-title.mp4',
      poster: '/img/photos/live/video-title-poster.jpg',
      thumbnail: '/img/photos/live/video-title-thumb.jpg',
      duration: '5:30',
      date: '2024-01-15',
      subtitles: [
        {
          label: 'English',
          lang: 'en',
          src: '/video/performances/video-title-en.vtt',
        },
      ],
    },
  ];
}
```

### Step 4: Initialize Player

In your HTML:

```html
<!-- Load Video.js CSS -->
<link href="https://vjs.zencdn.net/8.6.1/video-js.css" rel="stylesheet" />

<!-- Load Video.js -->
<script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>

<!-- Load custom player CSS and JS -->
<link rel="stylesheet" href="/css/videoPlayer.css" />
<script src="/video/config.js"></script>
<script src="/js/videoPlayer.js"></script>

<!-- Player container -->
<div id="video-player-container"></div>

<!-- Initialize -->
<script>
  const videoPlayer = new VideoPlayer({
    id: 'main-video-player',
    container: '#video-player-container',
    videos: videosConfig.performances.videos,
  });
</script>
```

## Storage Options

### Option 1: Direct Hosting (Current)

- Files stored in `/video/` directory
- Served directly by web server
- Simple but bandwidth-intensive
- Good for small catalogs

### Option 2: Cloudflare R2 + Stream (Recommended)

- **R2 Storage:** $0.015/GB storage, $0.01/GB egress
- **Cloudflare Stream:** $1/1000 minutes stored, $1/1000 minutes delivered
- Automatic encoding, adaptive streaming
- Global CDN delivery
- See MEDIA_INFRASTRUCTURE_GUIDE.md for setup

### Option 3: Cloudflare R2 + Video.js

- Store MP4 files in R2
- Serve via public bucket or Workers
- Use Video.js for playback
- More control than Stream, cheaper for high traffic

### Option 4: GitHub LFS

- Free tier: 1GB storage, 1GB bandwidth/month
- Good for archival, not streaming
- Not recommended for video

## Advanced Features

### Adaptive Streaming (HLS/DASH)

For better quality/bandwidth optimization:

1. Generate HLS playlist (see FFmpeg commands above)
2. Upload to R2 or host directly
3. Use Video.js with HLS support (built-in for modern browsers)

### YouTube/Vimeo Integration

The player supports embedding external videos:

```javascript
{
    title: 'YouTube Video',
    youtube: 'https://www.youtube.com/watch?v=VIDEO_ID',
    thumbnail: 'https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg'
}
```

Note: Requires videojs-youtube plugin for YouTube videos.

### Subtitles/Captions

Create WebVTT files:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
First subtitle line

00:00:05.000 --> 00:00:10.000
Second subtitle line
```

Add to config:

```javascript
subtitles: [
  {
    label: 'English',
    lang: 'en',
    src: '/video/path/subtitles-en.vtt',
  },
  {
    label: 'Español',
    lang: 'es',
    src: '/video/path/subtitles-es.vtt',
  },
];
```

## Current Status

**Implemented:**

- ✅ Video player module (videoPlayer.js)
- ✅ Custom Video.js theme styling
- ✅ Playlist with thumbnails
- ✅ Configuration system
- ✅ Directory structure
- ✅ Documentation

**Pending:**

- ⏳ Upload video files
- ⏳ Set up Cloudflare R2/Stream (optional)
- ⏳ Add quality selector plugin
- ⏳ Generate HLS streams
- ⏳ Create subtitles
- ⏳ Integrate with existing pages

## Video.js Plugins (Optional Enhancements)

Install these for additional features:

```bash
# Quality selector
npm install --save videojs-contrib-quality-levels videojs-hls-quality-selector

# YouTube support
npm install --save videojs-youtube

# Vimeo support
npm install --save @videojs/vimeo

# Markers/chapters
npm install --save videojs-markers

# Playlist UI
npm install --save videojs-playlist videojs-playlist-ui
```

## Performance Optimization

### Compression

- Use CRF 22-23 for good quality/size balance
- Enable faststart for web delivery
- Keep bitrate under 8 Mbps for 1080p

### Delivery

- Use CDN (Cloudflare R2, etc.)
- Enable caching headers
- Consider HLS for adaptive streaming

### Lazy Loading

- Use poster images
- Set preload="metadata"
- Only load video when user initiates playback

## Troubleshooting

### Video Won't Play

- Check browser console for errors
- Verify file format is MP4 with H.264 codec
- Ensure MIME types are correct on server
- Test with different browsers

### Slow Loading

- Reduce bitrate/resolution
- Use HLS adaptive streaming
- Enable CDN delivery
- Compress files further

### Subtitles Not Showing

- Verify .vtt file format
- Check CORS headers if loading from different domain
- Ensure file paths are correct

## Resources

- **Video.js Documentation:** https://videojs.com/
- **FFmpeg Documentation:** https://ffmpeg.org/documentation.html
- **WebVTT Specification:** https://w3c.github.io/webvtt/
- **HLS Guide:** https://developer.apple.com/streaming/

---

**Last Updated:** 2025-11-03
**Status:** Development - Infrastructure Complete, Awaiting Video Files
