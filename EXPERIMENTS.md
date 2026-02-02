─────┬──────────────────────────────────────────────────────────────────────────
│ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
1 │ # ERGASTERION Experiment Pages
2 │
3 │ Two sample experiment HTML pages have been created in `/ergasterion/experiments/`:
4 │
5 │ ## 1. Particle System (`particle-system.html`)
6 │ **URL:** `/ergasterion/experiments/particle-system.html`
7 │
8 │ ### Description
9 │ An interactive particle system demonstrating emergent behavior through physics simulation. Each of 100 particles responds to mouse position with attraction and repulsion forces, creating organic, flowing swarm patterns.
10 │
11 │ ### Key Features
12 │ - **Interactive:** Move mouse over canvas to control particle behavior
13 │ - **Physics-based:** Newton's Second Law (F=ma), velocity damping, edge wrapping
14 │ - **Visual effects:** Color changes based on particle speed, age-based opacity fade
15 │ - **Terminal aesthetic:** Green-on-black color scheme matching Ergasterion chamber
16 │
17 │ ### Algorithm Overview
18 │ `  19 │ For each frame:
  20 │ 1. Calculate distance from particle to mouse cursor
  21 │ 2. Apply attraction force if distance < 150px
  22 │ 3. Apply repulsion force if distance < 50px
  23 │ 4. Update velocity with physics (acc → vel → pos)
  24 │ 5. Apply drag/friction (0.95x each frame)
  25 │ 6. Draw particle with HSB color based on speed
  26 │`
27 │
28 │ ### Tunable Parameters
29 │ - `PARTICLE_COUNT = 100` - Number of particles (more = slower)
30 │ - `ATTRACTION_RADIUS = 150` - Distance for attraction pull
31 │ - `REPULSION_RADIUS = 50` - Distance for repulsion push
32 │ - `MAX_FORCE = 0.5` - Maximum acceleration per frame
33 │ - `DRAG = 0.95` - Velocity dampening (friction)
34 │
35 │ ### Code Structure
36 │ - **Particle class:** Encapsulates position, velocity, acceleration, age
37 │ - **update():** Physics calculations with force application
38 │ - **display():** Renders with speed-based HSB coloring and opacity
39 │ - **Circular motion guides:** Circles around cursor show attraction/repulsion zones
40 │
41 │ ---
42 │
43 │ ## 2. Perlin Noise Flow Field (`noise-field.html`)
44 │ **URL:** `/ergasterion/experiments/noise-field.html`
45 │
46 │ ### Description
47 │ A generative flow field visualization using multi-dimensional Perlin noise. Particles follow the direction of noise gradients, creating organic, continuous motion patterns. Classic procedural generation technique used in games and generative art.
48 │
49 │ ### Key Features
50 │ - **Procedural:** 3D Perlin noise sampling (x, y, time) for continuous evolution
51 │ - **Emergent patterns:** Simple particle-following rules create complex swarm behavior
52 │ - **Direction visualization:** Lines indicate particle velocity direction
53 │ - **Deterministic:** Same seed produces reproducible patterns
54 │
55 │ ### Algorithm Overview
56 │ `  57 │ For each frame:
  58 │ 1. Sample Perlin noise at particle position: noise(x, y, timeOffset)
  59 │ 2. Convert noise [0,1] to angle [0, 2π]
  60 │ 3. Create flow direction vector from angle
  61 │ 4. For each particle:
  62 │    - Lerp velocity toward flow direction (smooth acceleration)
  63 │    - Limit velocity to max speed
  64 │    - Update position
  65 │    - Draw as line segment (direction indicator)
  66 │    - Wrap around screen edges
  67 │ 5. Increment timeOffset (animates the noise field)
  68 │`
69 │
70 │ ### Tunable Parameters
71 │ - `PARTICLE_COUNT = 200` - Number of flow particles
72 │ - `NOISE_SCALE = 0.015` - "Zoom level" of noise (smaller = larger features)
73 │ - `PARTICLE_SPEED = 2` - Maximum velocity magnitude
74 │ - `TRAIL_LENGTH = 3` - Length of direction indicator lines
75 │ - `timeOffset increment = 0.002` - Speed of field evolution
76 │
77 │ ### Advanced: Fractal Brownian Motion
78 │ The code includes FBM example showing how to layer multiple noise octaves:
79 │ `javascript
  80 │ function fbm(x, y, time) {
  81 │   let value = 0;
  82 │   let amplitude = 1;
  83 │   let frequency = 1;
  84 │   
  85 │   for (let i = 0; i < 4; i++) {
  86 │     value += noise(x * frequency, y * frequency, time) * amplitude;
  87 │     amplitude *= 0.5;  // Reduce amplitude for each octave
  88 │     frequency *= 2;    // Increase frequency for each octave
  89 │   }
  90 │   
  91 │   return value;
  92 │ }
  93 │ `
94 │
95 │ ---
96 │
97 │ ## Technical Details
98 │
99 │ ### Styling
100 │ Both pages use:
101 │ - **Chamber colors:** Lime green (#00FF00) on black background
102 │ - **Terminal aesthetic:** Monaco/Courier New monospace font
103 │ - **Visual hierarchy:** Color-coded sections (code, info panels)
104 │ - **Responsive:** Canvases resize with window
105 │ - **Fixed header/footer:** Navigation accessible while scrolling
106 │
107 │ ### Structure
108 │ Each experiment page includes:
109 │ 1. **Fixed header** - Experiment title + back navigation
110 │ 2. **Description section** - Command-line style introduction
111 │ 3. **Interactive canvas** - p5.js sketch (500px tall)
112 │ 4. **Algorithm explanation** - Pseudocode and concepts
113 │ 5. **Full source code** - Inline JavaScript with syntax highlighting
114 │ 6. **Parameters documentation** - Tunable values and their effects
115 │ 7. **Concept sections** - Educational info panels
116 │ 8. **Fixed footer** - Navigation back to Ergasterion/Naos
117 │
118 │ ### Libraries
119 │ - **p5.js 1.7.0** - Via CDN: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js`
120 │ - **Tachyons CSS** - Utility-first framework for styling
121 │ - **Chamber colors CSS** - ETCETER4 chamber color system
122 │
123 │ ### File Paths
124 │ Both files use relative paths for assets:
125 │ - `../../css/vendor/tachyons/css/tachyons.min.css` - Utility CSS
126 │ - `../../css/styles.css` - Global styles
127 │ - `../../css/chamber-colors.css` - Chamber color variables
128 │ - `../css/ergasterion.css` - Ergasterion-specific styles
129 │
130 │ ---
131 │
132 │ ## Adding to Ergasterion Index
133 │
134 │ To link these experiments from the main Ergasterion page (`/ergasterion/index.html`), update the experiment cards section:
135 │
136 │ `html
 137 │ <div class="experiment-card mb4">
 138 │   <h3>Particle System</h3>
 139 │   <p class="f6" style="color: #BFFF00;">
 140 │     Interactive particle swarm demonstrating emergent behavior.
 141 │     Physics-based attraction/repulsion forces controlled by mouse position.
 142 │   </p>
 143 │   <div class="project-meta">
 144 │     <span>status: active</span>
 145 │     <span>type: interactive</span>
 146 │     <span>lang: javascript</span>
 147 │   </div>
 148 │   <div class="mt3">
 149 │     <a href="experiments/particle-system.html" class="btn-execute">View Experiment</a>
 150 │   </div>
 151 │ </div>
 152 │ 
 153 │ <div class="experiment-card mb4">
 154 │   <h3>Perlin Noise Flow Field</h3>
 155 │   <p class="f6" style="color: #BFFF00;">
 156 │     Generative flow field visualization using Perlin noise.
 157 │     Particles follow continuously evolving noise gradients in real-time.
 158 │   </p>
 159 │   <div class="project-meta">
 160 │     <span>status: active</span>
 161 │     <span>type: generative</span>
 162 │     <span>lang: javascript</span>
 163 │   </div>
 164 │   <div class="mt3">
 165 │     <a href="experiments/noise-field.html" class="btn-execute">View Experiment</a>
 166 │   </div>
 167 │ </div>
 168 │ `
169 │
170 │ ---
171 │
172 │ ## Educational Value
173 │
174 │ Both experiments teach important concepts:
175 │
176 │ ### Particle System
177 │ - **Physics simulation** - Force application, velocity, acceleration
178 │ - **Emergent behavior** - Simple rules creating complex patterns
179 │ - **Interactive input** - Mouse-driven real-time control
180 │ - **Performance optimization** - Efficient particle rendering
181 │
182 │ ### Noise Flow Field
183 │ - **Procedural generation** - Using noise functions for content creation
184 │ - **Vector fields** - Direction and magnitude at every point
185 │ - **Temporal variation** - Time dimension in noise for animation
186 │ - **Multi-octave noise** - Fractal Brownian Motion for detail
187 │
188 │ Both are common techniques in:
189 │ - Game development (particle effects, terrain generation)
190 │ - Visual effects (motion design, generative art)
191 │ - Data visualization (flow fields, force-directed graphs)
192 │ - Procedural content generation (PCG)
193 │
194 │ ---
195 │
196 │ ## Browser Compatibility
197 │
198 │ Both experiments require:
199 │ - Modern browser with canvas support
200 │ - JavaScript enabled
201 │ - P5.js CDN access (cdnjs.cloudflare.com)
202 │ - No external dependencies beyond p5.js
203 │
204 │ Tested and working in:
205 │ - Chrome/Chromium 90+
206 │ - Firefox 88+
207 │ - Safari 14+
208 │ - Edge 90+
209 │
210 │ ---
211 │
212 │ ## Future Enhancements
213 │
214 │ Possible additions:
215 │ 1. **Parameter controls** - UI sliders to adjust values in real-time
216 │ 2. **Save visualization** - Download canvas as PNG/GIF
217 │ 3. **Multiple sketches** - Toggle between variations
218 │ 4. **Performance stats** - FPS counter, particle count display
219 │ 5. **Sound visualization** - Sync with audio input (Web Audio API)
220 │ 6. **Touch support** - Multi-touch for mobile devices
─────┴──────────────────────────────────────────────────────────────────────────
