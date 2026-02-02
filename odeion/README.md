# ODEION Chamber - Music Hall

The ODEION is the South Wing performance chamber, a dedicated music hall for albums, singles, demos, and experimental audio works.

## Directory Structure

```
odeion/
├── index.html          # Main chamber page
├── odeion.js           # Chamber initialization and music grid logic
├── config.js           # Album/single/demo/experimental metadata
├── README.md           # This file
├── css/
│   └── odeion.css      # Chamber-specific styles (gold/black theme)
├── albums/             # Album audio files and covers
├── singles/            # Single track releases
├── demos/              # Work-in-progress demos
└── experimental/       # Generative and experimental works
```

## Features

### Visual Design

- **Primary Color**: Gold (#FFD700)
- **Secondary Color**: Black (#000000)
- **Accent Light**: #FFFF99
- **Dark Background**: #1a1a1a
- Theme-integrated glow effects and animations

### Music Grid System

- Dynamic filtering by category: Albums, Singles, Demos, Experimental
- Responsive grid layout (auto-fill columns)
- Album cover art display with fallback placeholders
- Metadata display: Artist, Year, Duration, Description
- Feature tags for special attributes (stems, lyrics, remixes, etc.)

### Audio Player Integration

- **EnhancedAudioPlayer** integration for playback control
- **Waveform Canvas** visualization (ready for audio data)
- **Volume Control** slider with percentage display
- **Playback Controls**: Play, Pause, Stop buttons
- **Time Display**: Current time / Duration
- **Now Playing Info**: Track title and album display
- **Cover Art Display**: Large album artwork preview

### Metadata System

- Album definitions with year, artist, track count, duration
- Single track releases with remix information
- Work-in-progress demos with WIP flag
- Experimental works with generative/algorithmic tags
- Cover art URLs at multiple sizes (small, medium, large)
- Status tracking (released, demo, published)

## Configuration

### Album Metadata (config.js)

```javascript
{
  id: 'album-id',
  type: 'album',
  title: 'Album Title',
  artist: 'ET CETER4',
  year: 2024,
  description: 'Album description',
  trackCount: 12,
  duration: '48:15',
  coverArt: {
    large: '../audio/albums/id/cover-1200.jpg',
    medium: '../audio/albums/id/cover-600.jpg',
    small: '../audio/albums/id/cover-300.jpg',
  },
  features: ['stems', 'lyrics'],
  status: 'released',
  category: 'album',
}
```

### Adding New Music Items

1. Add item definition to appropriate array in `config.js`:
   - `ODEION_CONFIG.albums`
   - `ODEION_CONFIG.singles`
   - `ODEION_CONFIG.demos`
   - `ODEION_CONFIG.experimental`

2. Provide cover art files in subdirectories:
   - `albums/{id}/cover-*.jpg`
   - `singles/{id}/cover-*.jpg`
   - etc.

3. Audio files should be placed in corresponding directories

## Integration Points

### EnhancedAudioPlayer

The chamber integrates with `js/media/audio/EnhancedAudioPlayer.js` for:

- Audio playback control
- Waveform visualization
- Volume management
- Time tracking

### Living Pantheon

Automatic integration with `js/living-pantheon/LivingPantheonCore.js`:

- Ambient sound for chamber (concert-hall.mp3)
- Visual glitch effects
- Morphing images
- Breathing animations

### Navigation

- Back to Naos button (main menu)
- Footer links to landing, menu, and sitemap
- Accessibility skip link

## Styling

### CSS Architecture

- Utility-first approach using Tachyons
- Chamber color variables for easy theming
- Responsive design (desktop, tablet, mobile)
- Dark mode optimizations
- Accessibility focus (keyboard navigation, focus states)

### Key CSS Classes

- `.section-nav-btn` - Category filter buttons
- `.odeion-player-container` - Player wrapper
- `.music-item` - Card container
- `.music-item-cover` - Album artwork
- `.odeion-btn` - Control buttons
- `.odeion-slider` - Volume slider

## Accessibility Features

- Skip to main content link
- Semantic HTML (header, main, nav, role attributes)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on interactive elements
- High contrast text
- Reduced motion support via CSS

## Browser Compatibility

- Modern browsers with ES6 support
- Canvas API for waveform visualization
- CSS Grid and Flexbox
- HTML5 Audio API

## Future Enhancements

- [ ] Streaming audio from R2 storage
- [ ] Album view pages (tracks list, full metadata)
- [ ] User playlists and favorites
- [ ] Comment/rating system
- [ ] Social sharing integration
- [ ] Download options (FLAC, MP3)
- [ ] Visualization switching
- [ ] Equalizer controls
- [ ] Keyboard shortcuts for playback

## Performance Considerations

- Lazy loading for cover images
- Canvas rendering optimized for waveforms
- Minimal DOM manipulation
- Event delegation for grid items
- CSS animations use GPU acceleration

## Maintenance

Update `ODEION_CONFIG` in `config.js` to:

- Add/remove/edit music items
- Change player settings (volume, crossfade)
- Adjust waveform visualization colors
- Update chamber description/subtitle
