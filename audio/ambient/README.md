# Ambient Audio System

This directory contains ambient soundscapes that provide atmospheric context for different sections of the ETCETER4 experience. Each ambient track creates a subtle auditory environment that reinforces the thematic identity of its associated page.

## Overview

Ambient audio files are low-volume background loops that play continuously while users browse each section. These are **not** UI sound effects (which are located in `../ui-sounds/`) but rather environmental soundscapes that define the acoustic character of each space.

## File Format Requirements

### Technical Specifications

- **Format:** MP3 (MPEG-3)
- **Codec:** MPEG Layer III (lossy audio compression)
- **Bitrate:** 128-192 kbps (sufficient for ambient content)
- **Sample Rate:** 44.1 kHz or 48 kHz
- **Channels:** Stereo (2-channel recommended for spatial immersion)

### Duration & Looping

- **Target Duration:** 30-60 seconds
- **Loop Quality:** Must be seamless with no clicks, pops, or discontinuities at loop point
- **Fade Envelope:** Consider subtle fade-in at start and fade-out at end to minimize loop artifacts
- **Audio Decay:** Tail out naturally without abrupt cuts

### Volume Levels

- **Playback Level:** Ambient tracks are mixed at **5% system volume** to maintain subtlety
- **Peak Levels:** Optimize for this low playback level; ensure no clipping in source
- **Dynamic Range:** Gentle compression recommended (3:1 ratio, gentle knee) to maintain consistent presence without sudden volume spikes
- **Headroom:** Mix with -6dB to -3dB headroom to allow proper gain staging through the Web Audio API

## Required Ambient Audio Files

The following ambient tracks are configured in `js/config.js` and must be provided:

### 1. **temple-drone.mp3** (Default/Fallback)

- **Location:** `audio/ambient/temple-drone.mp3`
- **Context:** Default ambient background played when no specific section is active
- **Character:** Deep, resonant drone reminiscent of a temple interior; sustained low-frequency pad with minimal variation
- **Suggestions:**
  - Synthesizer pad (sine/triangle waves, 50-100 Hz fundamental)
  - Tibetan singing bowl recording (processed/sustained)
  - Organ sustain tone

### 2. **scholarly-hum.mp3** (Akademia Section)

- **Location:** `audio/ambient/scholarly-hum.mp3`
- **Context:** Akademia (academic/study section)
- **Character:** Subtle intellectual ambience; perhaps faint library sounds with gentle intellectual resonance
- **Suggestions:**
  - Library ambience: faint page turns, whispered voices, quill scratches
  - Warm humming pad with slight harmonic richness
  - Combination: organ pad + very distant library murmur at -20dB

### 3. **paper-rustle.mp3** (Bibliotheke Section)

- **Location:** `audio/ambient/paper-rustle.mp3`
- **Context:** Bibliotheke (library section)
- **Character:** Intimate paper-based atmosphere; subtle tactile sounds of books and pages
- **Suggestions:**
  - Field recording of book pages turning (very subtle, -18dB level)
  - Paper texture sounds: folding, sliding across surfaces
  - Light ambient pad underneath (60% pad, 40% paper texture)

### 4. **hearth-crackle.mp3** (Oikos Section)

- **Location:** `audio/ambient/hearth-crackle.mp3`
- **Context:** Oikos (domestic/home section)
- **Character:** Warm domestic ambience; fireplace or hearth atmosphere
- **Suggestions:**
  - Processed fireplace crackle (constant low-level sizzle and pops)
  - Warm pad underneath (possibly with subtle harmonics)
  - Wood ambience: light creaks and settling sounds

### 5. **gallery-echo.mp3** (Pinakotheke Section)

- **Location:** `audio/ambient/gallery-echo.mp3`
- **Context:** Pinakotheke (art gallery section)
- **Character:** Spacious, reflective ambience with subtle reverb suggesting a gallery interior
- **Suggestions:**
  - Room tone with significant reverb/echo (100-200ms decay)
  - Sparse ambience emphasizing space and air
  - High-frequency content very subtle (to avoid harshness at low volume)
  - Occasional distant footsteps or subtle artifact sounds

### 6. **concert-hall.mp3** (Odeion Section)

- **Location:** `audio/ambient/concert-hall.mp3`
- **Context:** Odeion (music/concert hall section)
- **Character:** Grand performance space ambience; warm concert hall reverb
- **Suggestions:**
  - Concert hall reverb tail (suggest musical instrument sustain with hall ambience)
  - Warm, resonant pad reflecting musical instruments
  - Subtle suggestion of distant applause or musical activity
  - Rich harmonic content (string pad or choir sustain)

### 7. **stage-ambience.mp3** (Theatron Section)

- **Location:** `audio/ambient/stage-ambience.mp3`
- **Context:** Theatron (theater/performance section)
- **Character:** Theatrical acoustic with dramatic potential; stage ambience
- **Suggestions:**
  - Theater ambience: subtle echo, distant rustling of curtains or audience
  - Dramatic pad (minor key, rich timbre)
  - Suggestion of anticipation or performance energy
  - Slightly more dynamic than concert hall (occasional subtle variations)

### 8. **crowd-murmur.mp3** (Agora Section)

- **Location:** `audio/ambient/agora.mp3`
- **Context:** Agora (marketplace/public square section)
- **Character:** Active public space; subtle crowd presence
- **Suggestions:**
  - Field recording of marketplace ambience (very distant, -16dB level)
  - Multiple voices in gentle conversation (indistinct, no clear words)
  - Occasional sound of activity: footsteps, subtle transactions
  - Underlying pad for continuity and seamless looping

### 9. **conversation.mp3** (Symposion Section)

- **Location:** `audio/ambient/conversation.mp3`
- **Context:** Symposion (discussion/symposium section)
- **Character:** Intimate dialogue atmosphere; conversational setting
- **Suggestions:**
  - Field recording of conversation in restaurant/bar setting (very subtle)
  - Two voices in natural conversation (no clear words, just cadence and tone)
  - Wine glasses clinking, ambient dinner sounds
  - Warm pad underneath (taverna or Greek symposium setting)

### 10. **machine-hum.mp3** (Ergasterion Section)

- **Location:** `audio/ambient/machine-hum.mp3`
- **Context:** Ergasterion (workshop/maker space section)
- **Character:** Productive mechanical ambience; workshop atmosphere
- **Suggestions:**
  - Subtle machinery hum (40-120 Hz fundamental)
  - Occasional mechanical sounds: tool movements, light metallic interactions
  - Industrial but not harsh; creative/productive energy
  - Low-frequency motor/machinery sustain with periodic accents

### 11. **clock-tick.mp3** (Khronos Section)

- **Location:** `audio/ambient/clock-tick.mp3`
- **Context:** Khronos (time section)
- **Character:** Temporal awareness; clock/time ambience
- **Suggestions:**
  - Field recording of old clock ticking (regular, metronomic)
  - Gentle but persistent; creates temporal structure
  - Multiple clock tones at different pitches for interest
  - Subtle pad underneath (time passing, continuity)
  - Consider: grandfather clock, pocket watch, or mechanical clock blend

## Sourcing Guidelines

### Option 1: Field Recording

- Record your own ambiences using a quality microphone
- Position microphone at ear level in the target space
- Record for 2-3 minutes minimum (allows for editing to seamless loop)
- Capture different times of day for variety (afternoon library vs. early morning)

### Option 2: Royalty-Free Libraries

Recommended sources for ambience loops:

- **Freesound.org** - Large community-contributed library with CC licenses
- **Epidemic Sound** - Premium subscription service (musical ambiences)
- **Artlist.io** - Curated royalty-free audio library
- **BBC Sound Effects Library** - Public domain field recordings
- **Zapsplat** - Free effects and ambiences
- **Ambient Mixer** - Ambient soundscape generation tool

### Option 3: Synthesis & Processing

- Create ambience using synthesizers (pads, drones)
- Layer multiple sources (pad + field recording overlay)
- Use reverb/delay to create spacious character
- Process with gentle EQ and compression for cohesion

## Creating Seamless Loops

### Audacity Workflow

1. Open audio file in Audacity
2. Listen for natural repetition points (30-60 second segments)
3. Use **Analyze → Silence Finder** to locate quiet points
4. Select loop segment, apply **Effect → Crossfade Tracks** (50-200ms)
5. Export as MP3 (128-192 kbps, stereo)

### Key Points

- Look for **spectral balance** - choose segment where energy is consistent
- Test looping in isolation to verify no artifacts
- Use FFT Analyzer to confirm loop point alignment
- Apply light normalization to ensure consistent level (-3dB peak)

## Integration with Audio System

These ambient tracks integrate with:

- **Audio Loading:** `js/audioLoader.js` loads ambient files based on current page
- **Volume Control:** All ambient tracks play at **5% volume** (controlled in `js/config.js`)
- **Fade Transitions:** 2-second fade-in/fade-out between ambient contexts (smooth cross-fade)
- **Loop Points:** Web Audio API `loop` property handles seamless looping
- **Compression:** Optional compressor applied via Web Audio nodes

## Testing Checklist

Before deployment:

- [ ] All 11 MP3 files present in directory
- [ ] File sizes: typically 200-400 KB each (check for upload limits)
- [ ] Files are actual MP3s (not WAV or other formats)
- [ ] Loop points tested in browser at 5% volume
- [ ] No clicks or discontinuities at loop point
- [ ] Volume levels consistent across all tracks
- [ ] Peak levels within -3dB to -6dB range
- [ ] Headphone testing: verify low-volume clarity
- [ ] Cross-fade transitions feel natural between sections
- [ ] No copyright/licensing conflicts if using sourced audio

## Notes for Contributors

- **Volume Calibration:** Test at intended 5% playback volume - some artifacts may only appear at low levels
- **Monitoring:** Use calibrated headphones or speakers for accurate assessment
- **Documentation:** Include source/license information if using existing recordings
- **Accessibility:** Consider hearing-impaired users; visual equivalents should be provided elsewhere
- **Browser Compatibility:** Test in Chrome, Firefox, Safari, and Edge (Web Audio API support varies)

## Example: Creating a Temple Drone

If synthesizing the default temple drone:

```
Approach:
1. Start with sine wave pad (50 Hz fundamental)
2. Layer triangle wave pad at +5 semitones (minor third)
3. Add very subtle noise floor (-30dB, LPF at 200 Hz) for organic texture
4. Apply reverb (500ms decay, small room)
5. Add light compression (3:1, 100ms attack, 500ms release)
6. Normalize to -3dB peak
7. Create 45-second loop with 200ms crossfade at loop point
8. Export as MP3 (192 kbps, stereo)
```

This creates a deep, meditative drone suitable for continuous background presence.
