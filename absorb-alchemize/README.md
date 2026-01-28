# Absorb-Alchemize Project Analysis

A collection of four Google Gemini AI demo projects showcasing real-time voice interaction, creative tools, and AI-powered code generation.

## Project Overview

| Project | Type | Primary Purpose | Tech Stack |
|---------|------|-----------------|------------|
| **audio-orb** | Interactive Demo | Real-time voice AI with 3D audio visualization | Lit + Three.js + Gemini Live Audio |
| **gemini-ink-studio** | Creative Tool | AI voice-controlled digital painting with fluid dynamics | React + Custom LBM Physics + Gemini |
| **p5js-playground** | IDE/Playground | AI-powered p5.js sketch generation via chat | Lit + Gemini 2.5 Pro + p5.js |
| **synthwave-space** | Game Showcase | AI-generated 3D arcade game demonstration | React + Three.js + Gemini |

---

## Feature Comparison Matrix

### Audio Capabilities

| Feature | audio-orb | gemini-ink-studio | p5js-playground | synthwave-space |
|---------|:---------:|:-----------------:|:---------------:|:---------------:|
| Real-time microphone | ✅ | ✅ | ❌ | ❌ |
| Audio playback | ✅ | ✅ | ❌ | ❌ |
| FFT analysis | ✅ (32-bin) | ❌ | ❌ | ❌ |
| Audio-reactive visuals | ✅ | ❌ | ❌ | ❌ |
| Voice AI interaction | ✅ | ✅ | ❌ | ❌ |
| Web Audio API | ✅ | ✅ | ❌ | ❌ |

### Visual/Graphics Capabilities

| Feature | audio-orb | gemini-ink-studio | p5js-playground | synthwave-space |
|---------|:---------:|:-----------------:|:---------------:|:---------------:|
| 3D rendering | ✅ Three.js | ❌ | ✅ p5.js WEBGL | ✅ Three.js |
| 2D Canvas | ❌ | ✅ LBM physics | ✅ p5.js | ❌ |
| Custom shaders | ✅ GLSL | ❌ | ⚠️ (generated) | ✅ (generated) |
| Post-processing | ✅ Bloom/FXAA | ❌ | ❌ | ✅ Bloom |
| Particle systems | ✅ | ❌ | ⚠️ (generated) | ✅ (generated) |
| Physics simulation | ❌ | ✅ Fluid dynamics | ⚠️ (generated) | ⚠️ (generated) |

### AI/Gemini Integration

| Feature | audio-orb | gemini-ink-studio | p5js-playground | synthwave-space |
|---------|:---------:|:-----------------:|:---------------:|:---------------:|
| Gemini Live Audio | ✅ 2.5 Flash | ✅ 2.5 Flash | ❌ | ❌ |
| Gemini Text API | ❌ | ❌ | ✅ 2.5 Pro | ✅ 2.5/3 Pro |
| Voice commands | ✅ | ✅ Tool calling | ❌ | ❌ |
| Code generation | ❌ | ✅ Sketch gen | ✅ Full sketches | ✅ Full games |
| Streaming responses | ✅ | ✅ | ✅ | ❌ (one-shot) |
| Error recovery | ❌ | ❌ | ✅ AI debugging | ❌ |

### Platform & Architecture

| Feature | audio-orb | gemini-ink-studio | p5js-playground | synthwave-space |
|---------|:---------:|:-----------------:|:---------------:|:---------------:|
| Framework | Lit | React | Lit | React |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Build tool | Vite | Vite | Vite | Vite |
| Iframe sandbox | ❌ | ❌ | ✅ | ✅ |
| Mobile support | ⚠️ | ✅ Touch | ✅ | ✅ Virtual joystick |
| API key required | ✅ Gemini | ✅ Gemini | ✅ Gemini | ✅ Gemini |

### Unique Features

| Project | Standout Capabilities |
|---------|----------------------|
| **audio-orb** | Real-time voice conversation with AI, audio-reactive 3D sphere, dual input/output FFT |
| **gemini-ink-studio** | Lattice Boltzmann fluid sim, CMY color model, voice-controlled painting, brush physics |
| **p5js-playground** | Chat-based code generation, error→AI fix loop, extended thinking display |
| **synthwave-space** | Model comparison (2.5 vs 3), remix system, complete game generation |

---

## Detailed Project Breakdown

### audio-orb
**Real-time Voice AI with 3D Audio Visualization**

**Architecture:**
```
Microphone → MediaStreamSource → ScriptProcessor → Analyser (FFT)
                                       ↓
                               Gemini Live Audio API
                                       ↓
                               AI Voice Response → AudioBuffer → Speaker
                                       ↓
                               FFT Data → Three.js Shader Uniforms → 3D Sphere
```

**Key Components:**
- `index.tsx` - Main Lit component, Gemini connection, audio contexts
- `visual-3d.ts` - Three.js scene with icosahedron sphere + backdrop
- `sphere-shader.ts` - GLSL vertex shader with audio displacement
- `analyser.ts` - 32-bin FFT frequency extraction
- `utils.ts` - PCM ↔ Base64 audio encoding/decoding

**Technical Highlights:**
- Dual FFT analysis (input mic + output speaker)
- Post-processing: EffectComposer → BloomPass → FXAAPass
- EXR environment map for PBR reflections
- Camera orbits based on audio input intensity
- Model: `gemini-2.5-flash-native-audio-preview-09-2025`

---

### gemini-ink-studio
**AI Voice-Controlled Digital Painting with Fluid Dynamics**

**Architecture:**
```
Voice Input → Gemini Live Audio → Tool Calling → UI State
                                                    ↓
Mouse/Touch → InkSimulation (LBM) → Canvas 2D → Display
```

**Key Components:**
- `App.tsx` - Main React component (800+ lines), state management
- `inkSimulation.ts` - Lattice Boltzmann Method physics engine
- `liveApi.ts` - Gemini voice connection with tool declarations
- `ControlPanel.tsx` - Tabbed settings UI

**Fluid Simulation Details:**
- D2Q9 lattice (9-direction velocity)
- CMY pigment transport (separate cyan/magenta/yellow channels)
- Paper fiber density affects ink absorption
- Fixed vs floating pigments (absorbed vs. moving)
- Configurable: viscosity, drying speed, paper resistance

**AI Tool Calling:**
- Brush parameters (size, water, ink, type)
- Paper settings (type, roughness, resolution)
- Color mixing (HSV adjustments)
- Sketch generation (AI draws pencil guides via Imagen 4.0)
- Canvas operations (clear, undo, view toggle)
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`

---

### p5js-playground
**AI-Powered p5.js IDE with Chat Interface**

**Architecture:**
```
User Prompt → Gemini 2.5 Pro (streaming) → Markdown + Code
                                              ↓
                                    Code Extraction → Sandboxed iframe
                                              ↓
                                    Runtime Errors → System Message → AI Fix
```

**Key Components:**
- `playground.tsx` - Main Lit element with chat + code tabs
- `index.tsx` - Gemini chat setup with thinking config
- `index.html` - iframe template with p5.js CDN

**Notable Patterns:**
- Extended thinking mode for better reasoning (`includeThoughts: true`)
- Error recovery loop: error → "Improve" button → AI debugging
- Syntax highlighting with highlight.js + marked
- postMessage communication for play/stop/reload
- Model: `gemini-2.5-pro`

---

### synthwave-space
**AI-Generated 3D Arcade Game Showcase**

**Architecture:**
```
Prompt → Gemini (2.5 or 3 Pro) → Complete HTML Game
                                       ↓
                                 Sandboxed iframe
                                       ↓
                              Remix Request + Current HTML → Modified Game
```

**Key Components:**
- `index.tsx` - React app with model switcher + remix UI
- `init/gemini2p5.html` - Pre-generated game (2.5 Pro version)
- `init/gemini3.html` - Pre-generated game (3 Pro version)

**Generated Game Features:**
- Three.js scene with synthwave aesthetic
- Third-person spaceship controls (WASD/arrows)
- Laser firing (spacebar) + collision detection
- Particle effects on enemy destruction
- UnrealBloomPass for neon glow
- Mobile virtual joystick

**Remix System:**
- "Hyper Speed" - Faster gameplay
- "Vaporwave Filter" - Visual style change
- "God Mode" - Invincibility
- Custom remix prompts
- Models: `gemini-2.5-pro`, `gemini-3-pro-preview`

---

## Use Case Recommendations

| Use Case | Recommended Project(s) |
|----------|------------------------|
| Voice-controlled art installation | audio-orb + gemini-ink-studio |
| Audio-reactive 3D visuals | audio-orb |
| Digital painting with physics | gemini-ink-studio |
| AI code generation IDE | p5js-playground |
| Game generation/prototyping | synthwave-space |
| Creative coding education | p5js-playground |
| Voice AI experimentation | audio-orb, gemini-ink-studio |
| Three.js + AI integration | audio-orb, synthwave-space |

---

## ETCETER4 Compatibility Reference

### Current Project Stack
| Component | Technology | Location |
|-----------|-----------|----------|
| 3D Rendering | Three.js 0.160.0 | ogod-3d.html, js/3d/ |
| Audio Synthesis | Tone.js 14.8.49 | OGODAudioEngine.js |
| Audio Playback | Howler.js | audioPlayer.js |
| Audio Analysis | AudioAnalyzerBridge | js/audioAnalyzerBridge.js |
| Generative Art | p5.js | js/sketches/ |
| UI Framework | jQuery + Global Scope | js/page.js, js/main.js |
| UI Sounds | SoundJS | js/uiSounds.js |

### Compatibility Summary

| Project | Web Compatible | Reusable Components | Integration Effort |
|---------|---------------|---------------------|-------------------|
| **audio-orb** | ✅ Direct | Three.js scene, FFT analyser, GLSL shaders | Low |
| **gemini-ink-studio** | ✅ Direct | InkSimulation class, Gemini Live client | Medium |
| **p5js-playground** | ✅ Direct | Code generation patterns, iframe sandbox | Low |
| **synthwave-space** | ✅ Direct | Game generation prompts, remix system | Low |

---

## Integration Notes by Project

### audio-orb
**Reusable for:** Voice-controlled experiences, audio-reactive 3D visuals

**Extractable Components:**
| Component | File | What It Does |
|-----------|------|--------------|
| 3D Visualizer | `visual-3d.ts` | Three.js scene with audio-reactive sphere |
| FFT Analyser | `analyser.ts` | 32-bin frequency extraction |
| Sphere Shader | `sphere-shader.ts` | GLSL vertex displacement |
| Audio Utils | `utils.ts` | PCM ↔ Base64 conversion |
| Gemini Client | `index.tsx` | Live audio streaming setup |

**Standalone Usage Pattern:**
```javascript
// Remove Lit dependency
const scene = new THREE.Scene();
const sphere = createAudioReactiveSphere(scene);
const analyser = createAnalyser(audioContext);

function animate() {
  const freqData = analyser.getFrequencyData();
  sphere.material.uniforms.audioData.value = freqData;
  requestAnimationFrame(animate);
}
```

**Considerations:**
- EXR environment map is 1.8MB (cache or replace)
- Gemini API: ~$0.08-0.30/min voice
- Lit web components use Shadow DOM (encapsulated)

---

### gemini-ink-studio
**Reusable for:** Fluid simulations, digital painting, physics-based art

**Extractable Components:**
| Component | File | What It Does |
|-----------|------|--------------|
| Fluid Engine | `inkSimulation.ts` | Lattice Boltzmann D2Q9 physics |
| Voice Client | `liveApi.ts` | Gemini tool calling integration |
| Brush System | (in App.tsx) | Pressure-sensitive input handling |

**Standalone Usage Pattern:**
```javascript
// Framework-agnostic fluid simulation
const sim = new InkSimulation(512, 512);
sim.generatePaper('rice', 50, 50, 10);

canvas.addEventListener('pointermove', (e) => {
  if (e.buttons) {
    sim.addInput(e.offsetX, e.offsetY, velocity, e.pressure, currentColor);
  }
});

function animate() {
  sim.step();
  // Render sim.cFixed, sim.mFixed, sim.yFixed to canvas
  requestAnimationFrame(animate);
}
```

**Considerations:**
- CMY color model (different from RGB)
- Performance scales with resolution (256/512/1024)
- React state management tightly coupled - needs extraction

---

### p5js-playground
**Reusable for:** AI code generation, creative coding tools, sandboxed execution

**Extractable Components:**
| Component | File | What It Does |
|-----------|------|--------------|
| Chat UI | `playground.tsx` | Streaming message display |
| Code Parser | `playground.tsx` | Extract JS from markdown |
| Sandbox | (iframe template) | Isolated p5.js execution |
| Error Loop | (message handler) | Runtime error → AI fix |

**Standalone Usage Pattern:**
```javascript
// Code generation without UI
async function generateSketch(prompt) {
  const response = await gemini.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: "Write p5.js code. Return only code block."
  });

  let code = '';
  for await (const chunk of response.stream) {
    code += chunk.text();
  }

  return extractCodeFromMarkdown(code);
}

// Execute in sandbox
const iframe = document.createElement('iframe');
iframe.srcdoc = `<script src="p5.min.js"></script><script>${code}</script>`;
```

**Considerations:**
- Gemini 2.5 Pro with extended thinking
- iframe sandbox for safe code execution
- postMessage for play/stop/error communication

---

### synthwave-space
**Reusable for:** AI game generation, Three.js scene generation, remix systems

**Extractable Components:**
| Component | File | What It Does |
|-----------|------|--------------|
| Game Prompts | `index.tsx` | Complete game generation prompt |
| Remix System | `index.tsx` | Modify existing HTML via AI |
| Model Switcher | `index.tsx` | Compare 2.5 vs 3 Pro outputs |
| Pre-built Games | `init/*.html` | Working Three.js games |

**Standalone Usage Pattern:**
```javascript
// Generate Three.js scene
const scenePrompt = `
Create a Three.js scene with:
- ${visualStyle} aesthetic
- Audio-reactive elements
- Post-processing bloom
Return complete HTML with inline JS.
`;

const response = await gemini.generateContent(scenePrompt);
const html = cleanMarkdown(response.text());

// Load in iframe
iframe.srcdoc = html;

// Remix existing
async function remix(currentHtml, modification) {
  const response = await gemini.generateContent({
    contents: [{ text: `Modify: ${modification}\n\nCurrent:\n${currentHtml}` }]
  });
  return cleanMarkdown(response.text());
}
```

**Considerations:**
- One-shot generation (not streaming)
- Pre-generated games work offline
- Parent ↔ iframe pause/resume protocol

---

## Quick Reference

### Immediate Use (No Modification)
| Project | How to Use | Location |
|---------|-----------|----------|
| p5js-playground | Embed via iframe or run standalone | `absorb-alchemize/p5js-playground/` |
| synthwave-space | Host HTML files or embed games | `absorb-alchemize/synthwave-space/init/` |

### Requires Extraction
| Project | Component | Effort |
|---------|-----------|--------|
| audio-orb | Three.js visualizer + shaders | Low - remove Lit wrapper |
| audio-orb | Gemini Live Audio client | Low - standalone class |
| gemini-ink-studio | InkSimulation engine | Medium - extract from React |
| gemini-ink-studio | Voice tool calling | Low - adapt liveApi.ts |

---

## API Requirements

| Service | Used By | Cost Estimate |
|---------|---------|---------------|
| Gemini Live Audio (2.5 Flash) | audio-orb, gemini-ink-studio | ~$0.08-0.30/min voice |
| Gemini Text (2.5 Pro) | p5js-playground | ~$0.00125/1K tokens |
| Gemini Text (3 Pro Preview) | synthwave-space | ~$0.00125/1K tokens |

**API Key Setup:**
```bash
# All projects use environment variables
echo "GEMINI_API_KEY=your_key_here" > .env.local
# or
echo "API_KEY=your_key_here" > .env.local
```

---

## File Inventory

### absorb-alchemize/audio-orb/
```
├── index.html          # Entry point
├── index.tsx           # Main Lit component + Gemini connection
├── visual-3d.ts        # Three.js scene (sphere + backdrop)
├── visual.ts           # 2D canvas fallback (unused)
├── sphere-shader.ts    # GLSL vertex displacement
├── backdrop-shader.ts  # Procedural noise environment
├── analyser.ts         # FFT frequency extraction
├── utils.ts            # Audio encoding utilities
├── package.json        # Dependencies: lit, @google/genai, three
├── vite.config.ts      # Build config
└── public/piz_compressed.exr  # PBR environment map
```

### absorb-alchemize/gemini-ink-studio/
```
├── index.html          # Entry point
├── index.tsx           # React bootstrap
├── App.tsx             # Main component (800+ lines)
├── types.ts            # TypeScript interfaces
├── defaultConfig.ts    # Simulation defaults
├── services/
│   ├── inkSimulation.ts    # Lattice Boltzmann physics
│   └── liveApi.ts          # Gemini voice + tool calling
├── components/
│   ├── ControlPanel.tsx    # Settings UI
│   ├── VoiceStatus.tsx     # Mic button
│   └── SettingsPill.tsx    # Collapsed settings
└── package.json        # Dependencies: react, @google/genai, lucide-react
```

### absorb-alchemize/p5js-playground/
```
├── index.html          # Entry point + iframe template
├── index.tsx           # Lit setup + Gemini chat
├── playground.tsx      # Chat UI + code execution
├── index.css           # Styling
├── package.json        # Dependencies: lit, @google/genai, marked, highlight.js
└── vite.config.ts      # Build config
```

### absorb-alchemize/synthwave-space/
```
├── index.html          # Entry point
├── index.tsx           # React app + remix UI
├── package.json        # Dependencies: react, @google/genai
├── vite.config.ts      # Build config
└── init/
    ├── gemini2p5.html  # Pre-generated game (2.5 Pro)
    └── gemini3.html    # Pre-generated game (3 Pro)
```

---

## Running Projects Locally

```bash
# Navigate to any project
cd absorb-alchemize/audio-orb

# Install dependencies
npm install

# Add API key (check each project's env var name)
echo "GEMINI_API_KEY=your_key" > .env.local

# Run dev server
npm run dev
# Opens at http://localhost:5173
```

All projects use Vite and follow the same pattern.

---

## Future Integration Ideas

| Idea | Projects Involved | Notes |
|------|-------------------|-------|
| Voice-controlled visual experiences | audio-orb + Tone.js | Real-time conversation with AI narrator |
| Audio-reactive fluid painting | gemini-ink-studio + AudioAnalyzer | Sound drives ink parameters |
| AI-generated ETCETER4 content | p5js-playground | Generate new sketches on demand |
| Custom Three.js environments | synthwave-space prompts | Generate track-specific visuals |
| Offline game collection | synthwave-space init/ | Host pre-generated games |

---

## License

All projects are licensed under Apache-2.0 (SPDX-License-Identifier: Apache-2.0).
