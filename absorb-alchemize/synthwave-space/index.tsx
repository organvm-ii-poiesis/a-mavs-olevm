/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#000',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#000',
    zIndex: 20,
  },
  gameWrapper: {
    flex: 1,
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    background: '#000',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#000',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  button: (active: boolean) => ({
    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
    color: active ? '#000000' : '#ffffff',
    border: '1px solid ' + (active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)'),
    padding: '4px 12px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    outline: 'none',
  }),
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto' as const,
    zIndex: 50,
  },
  modal: {
    background: '#111',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '32px',
    width: '480px',
    maxWidth: '90%',
    color: '#fff',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.2s ease-out',
  },
  modalHeader: {
    fontSize: '24px',
    fontWeight: '700' as const,
    marginBottom: '8px',
    background: 'linear-gradient(to right, #fff, #aaa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
  },
  modalSub: {
    color: '#888',
    marginBottom: '24px',
    fontSize: '14px',
    lineHeight: '1.5',
    marginTop: 0,
  },
  remixItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    border: '1px solid transparent',
  },
  remixIcon: {
    fontSize: '24px',
    background: 'rgba(255,255,255,0.1)',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    background: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    fontSize: '15px',
  },
  promptBox: {
    background: '#000',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#fff',
    minHeight: '150px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    zIndex: 5,
  },
  loadingText: {
    color: '#666',
    fontSize: '14px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    animation: 'pulse 1.5s infinite',
  }
};

const PROMPTS = {
  gemini2p5: `
Create a polished, retro-futuristic 3D spaceship web game contained entirely within a single HTML file using Three.js. The game should feature a "Synthwave/Retrowave" aesthetic with the following specifications:

### 1. Visual Style & Atmosphere
*   **Aesthetic:** Dark, immersive 3D environment with a glowing, volumetric neon look. Use a color palette of deep purples, hot pinks, and electric cyans.
*   **Post-Processing:** You must implement Three.js EffectComposer with UnrealBloomPass to make the neon elements glow intensely.
*   **Environment:** 
    *   A dense, moving starfield background with rich features. Go beyond simple plane shapes here and apply shaders to make the game visually appealing. For example, simulating retro astra, stars, and planets in the background.
    *   Distance fog to fade distant objects smoothly into the darkness.
*   **Assets:** Use complex geometric primitives constructed programmatically (no external model imports).

### 2. Gameplay Mechanics
*   **Perspective:** Third-person view from behind the spaceship.
*   **Core Loop:** The player pilots the ship on the X and Y axis (2D plane) while enemies (neon blocks) spawn in the distance and fly toward the camera along the Z-axis.
*   **Combat:** 
    *   The player shoots laser bolts (glowing lines) to destroy enemies.
    *   **Collision:** When a laser hits a block, the block should shatter into a very complex particle explosion effect.
    *   **Game Over:** If a block hits the ship, the game ends.
*   **UI:** A minimal HUD displaying the current Score. A "Game Over" overlay with a "Restart" button.

### 3. Controls (Cross-Platform)
The game must detect the device type or input method:
*   **Desktop/Web:** 
    *   Use **Arrow Keys** or **WASD** for smooth movement (apply lerp or friction for a floaty, drift-like spaceship feel).
    *   Use **Spacebar** to fire.
*   **Mobile/Touch:** 
    *   Render a semi-transparent **Virtual Joystick** on the bottom-left of the screen (using HTML/CSS or Canvas API) to map touch movement to ship coordinates.
    *   Detect a **Tap** anywhere on the right side of the screen to fire lasers.

### 4. Technical Constraints
*   **Single File:** All HTML, CSS, and JavaScript (including the Three.js library and post-processing shaders imported via CDN) must be in one index.html file. Do not output any other text other than the html response.
*   **Performance:** Use object pooling for lasers and particles to ensure 60FPS performance.
*   **Responsiveness:** The canvas must resize dynamically to fit any screen size without stretching the aspect ratio.
`,
  gemini3: `
Create a polished, retro-futuristic 3D spaceship web game contained entirely within a single HTML file using Three.js. The game should feature a "Synthwave/Retrowave" aesthetic with the following specifications:

### 1. Visual Style & Atmosphere
*   **Aesthetic:** Dark, immersive 3D environment with a glowing, volumetric neon look. Use a color palette of deep purples, hot pinks, and electric cyans.
*   **Post-Processing:** You must implement Three.js EffectComposer with UnrealBloomPass to make the neon elements glow intensely.
*   **Environment:** 
    *   A dense, moving starfield background with rich features. Go beyond simple plane shapes here and apply shaders to make the game visually appealing. For example, simulating retro astra, stars, and planets in the background.
    *   Distance fog to fade distant objects smoothly into the darkness.
*   **Assets:** Use complex geometric primitives constructed programmatically (no external model imports).

### 2. Gameplay Mechanics
*   **Perspective:** Third-person view from behind the spaceship.
*   **Core Loop:** The player pilots the ship on the X and Y axis (2D plane) while enemies (neon blocks) spawn in the distance and fly toward the camera along the Z-axis.
*   **Combat:** 
    *   The player shoots laser bolts (glowing lines) to destroy enemies.
    *   **Collision:** When a laser hits a block, the block should shatter into a very complex particle explosion effect.
    *   **Game Over:** If a block hits the ship, the game ends.
*   **UI:** A minimal HUD displaying the current Score. A "Game Over" overlay with a "Restart" button.

### 3. Controls (Cross-Platform)
The game must detect the device type or input method:
*   **Desktop/Web:** 
    *   Use **Arrow Keys** or **WASD** for smooth movement (apply lerp or friction for a floaty, drift-like spaceship feel).
    *   Use **Spacebar** to fire.
*   **Mobile/Touch:** 
    *   Render a semi-transparent **Virtual Joystick** on the bottom-left of the screen (using HTML/CSS or Canvas API) to map touch movement to ship coordinates.
    *   Detect a **Tap** anywhere on the right side of the screen to fire lasers.

### 4. Technical Constraints
*   **Single File:** All HTML, CSS, and JavaScript (including the Three.js library and post-processing shaders imported via CDN) must be in one index.html file. Do not output any other text other than the html response.
*   **Performance:** Use object pooling for lasers and particles to ensure 60FPS performance.
*   **Responsiveness:** The canvas must resize dynamically to fit any screen size without stretching the aspect ratio.
`
};

function App() {
  const [activeModel, setActiveModel] = useState('gemini3'); 
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing System...');
  
  const htmlCache = useRef<{ [key: string]: string }>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const switchModel = (model: string) => {
    if (activeModel === model) return;
    setGameHtml(null);
    setIsLoading(true);
    setLoadingText('Initializing System...');
    setActiveModel(model);
  };

  useEffect(() => {
    // Send pause command to iframe whenever disclaimer visibility changes
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: showDisclaimer }, '*');
    }
  }, [showDisclaimer]);

  useEffect(() => {
    let isMounted = true;
    const url = activeModel === 'gemini3' ? './init/gemini3.html' : './init/gemini2p5.html';

    const loadGame = async () => {
      // If we have a cached version (original) and we haven't remixed yet (simplification: cache only stores original)
      // In a real app we might want to persist state differently, but for now simple cache for originals.
      if (htmlCache.current[url] && !isLoading) {
         // logic to handle cached original
      }

      if (isMounted && gameHtml !== null && !isLoading) {
         // If we already have gameHtml (e.g. from remix), don't reload unless model switched
         // But here we just switched model, so gameHtml is null.
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load game');
        let html = await response.text();
        
        const baseTag = '<base href="./init/">';
        if (html.includes('<head')) {
            html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
        } else {
            html = `${baseTag}${html}`;
        }
        
        htmlCache.current[url] = html;
        
        if (isMounted) {
          setGameHtml(html);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setGameHtml('<div style="color:white;display:flex;height:100%;justify-content:center;align-items:center;font-family:sans-serif;">Failed to load game engine.</div>');
          setIsLoading(false);
        }
      }
    };
    
    loadGame();

    return () => {
      isMounted = false;
    };
  }, [activeModel]);

  const handleRemixAction = async (modification: string) => {
    if (!gameHtml) return;
    
    setIsLoading(true);
    setLoadingText('REMIXING CODEBASE...');
    setShowRemix(false); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Select model based on active mode
        // Use 'gemini-3-pro-preview' for gemini3 (3 Pro) mode.
        // Use 'gemini-2.5-pro' for gemini2p5 (2.5 Pro) mode.
        const modelId = activeModel === 'gemini3' ? 'gemini-3-pro-preview' : 'gemini-2.5-pro';
        
        const currentPrompt = PROMPTS[activeModel as keyof typeof PROMPTS];

        const systemInstruction = `
You are an expert Creative Technologist and 3D Web Game Developer.
Your task is to modify the provided web game code based on the user's remix request.
Output ONLY the raw HTML code. Do not include markdown formatting.
Also do not remove and add any other feature other than the remixing capability.
IMPORTANT: Preserve the following script snippet exactly as it is in the output to ensure the game can be paused by the parent window:
<script>
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'PAUSE_GAME') {
    if (typeof state !== 'undefined' && state.hasOwnProperty('isPaused')) {
       state.isPaused = e.data.payload;
       if(!state.isPaused && typeof clock !== 'undefined') clock.getDelta();
    } else if (typeof isPaused !== 'undefined') {
       isPaused = e.data.payload;
       if(!isPaused && typeof clock !== 'undefined') clock.getDelta();
    }
  }
});
</script>
`;

        const response = await ai.models.generateContent({
            model: modelId,
            config: {
                systemInstruction: systemInstruction
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `ORIGINAL PROMPT CONTEXT:\n${currentPrompt}` },
                        { text: `CURRENT SOURCE CODE:\n${gameHtml}` },
                        { text: `REMIX INSTRUCTION: Apply this modification to the game: "${modification}". Ensure the code remains a single HTML file.` }
                    ]
                }
            ]
        });

        let text = response.text;
        // Clean up markdown if present
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        // Re-inject base tag if needed, though usually CDNs are used. 
        // We preserve the base tag logic for consistency if the model stripped it.
        const baseTag = '<base href="./init/">';
        if (!text.includes('<base') && !text.includes('init/')) {
             if (text.includes('<head')) {
                text = text.replace(/<head[^>]*>/i, `$&${baseTag}`);
            }
        }
        
        setGameHtml(text);

    } catch (error) {
        console.error("Remix failed", error);
        alert("Remix failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleIFrameLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && showDisclaimer) {
      // Ensure game starts frozen if disclaimer is up
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: true }, '*');
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
      `}</style>

      {/* Header Control Bar */}
      <div style={styles.header}>
        <div style={styles.buttonGroup}>
          <button 
            style={styles.button(activeModel === 'gemini2p5')}
            onClick={() => switchModel('gemini2p5')}
          >
            2.5 Pro
          </button>
          <button 
            style={styles.button(activeModel === 'gemini3')}
            onClick={() => switchModel('gemini3')}
          >
            3 Pro
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            style={styles.button(showPrompt)}
            onClick={() => setShowPrompt(true)}
          >
            Prompt
          </button>
          <button 
            style={styles.button(showRemix)}
            onClick={() => setShowRemix(true)}
          >
            Remix
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={styles.gameWrapper}>
        {/* Loading Screen */}
        {(isLoading || !gameHtml) && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>{loadingText}</div>
          </div>
        )}

        {/* Game Frame */}
        {!isLoading && gameHtml && (
          <iframe 
            ref={iframeRef}
            key={activeModel + gameHtml.length} // Force re-render on content change
            srcDoc={gameHtml}
            style={styles.iframe} 
            title="Game Canvas"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-forms"
            onLoad={handleIFrameLoad}
          />
        )}
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalHeader}>Mission Briefing</h2>
            <div style={{...styles.modalSub, fontSize: '15px', color: '#ccc'}}>
              <p style={{marginBottom: '12px'}}>
                <strong>Objective:</strong> Pilot your ship through the neon void. Destroy enemies to achieve the highest score and avoid collisions at all costs.
              </p>

              <p style={{marginBottom: '16px'}}>
                <strong>Controls:</strong> Use <span style={{color: '#fff', fontWeight: 600}}>Arrow Keys / WASD</span> to move and <span style={{color: '#fff', fontWeight: 600}}>Spacebar</span> to fire.
              </p>
              
              <div style={{background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginTop: '20px'}}>
                <p style={{margin: '0 0 12px 0', color: '#fff'}}>
                  <strong>Experiment:</strong> This 3D game engine was <strong>one-shot generated</strong> by Google's Gemini 3 Pro.
                </p>
                <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#aaa'}}>
                  We invite you to click the <span style={{border: '1px solid #555', borderRadius: '4px', padding: '1px 5px', fontSize: '11px', background: '#000'}}>Prompt</span> button in the header to reveal the raw instructions given to the model. Compare the detailed specifications with the actual gameplay to evaluate the model's reasoning and coding capabilities.
                </p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setShowDisclaimer(false)}>
              LAUNCH GAME
            </button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPrompt && (
        <div style={styles.modalOverlay} onClick={() => setShowPrompt(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Underlying Prompt</h2>
            <p style={styles.modalSub}>The instructions used to one-shot generate this game.</p>
            <div style={styles.promptBox}>
              {PROMPTS[activeModel as keyof typeof PROMPTS]}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowPrompt(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Remix Modal */}
      {showRemix && (
        <div style={styles.modalOverlay} onClick={() => setShowRemix(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Remix Station</h2>
            <p style={styles.modalSub}>Apply runtime modifications to the game engine.</p>
            
            {['Hyper Speed', 'Vaporwave Filter', 'God Mode'].map((item, i) => (
               <div 
                key={item}
                style={styles.remixItem} 
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                onClick={() => handleRemixAction(item)}
              >
                <div style={styles.remixIcon}>{['⚡', '🎨', '🛡️'][i]}</div>
                <div>
                  <div style={{fontWeight: 600}}>{item}</div>
                  <div style={{fontSize: '13px', color: '#888'}}>
                    {['Run logic at 200% speed', 'Apply aesthetic color palette', 'Disable collision damage'][i]}
                  </div>
                </div>
              </div>
            ))}

            <button style={styles.closeBtn} onClick={() => setShowRemix(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root') || document.body);
root.render(<App />);