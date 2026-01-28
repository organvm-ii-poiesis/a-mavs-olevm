/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ToolHandler } from '../types';
import { ENABLE_STUDIO_TAB } from '../defaultConfig';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Define Tools
const tools: FunctionDeclaration[] = [
  {
    name: 'updateSimulation',
    description: 'Adjust simulation physics and brush parameters.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        brushSize: { type: Type.NUMBER, description: 'Brush radius (1-40)' },
        waterAmount: { type: Type.NUMBER, description: 'Water amount (0-100)' },
        inkAmount: { type: Type.NUMBER, description: 'Ink amount (0-100)' },
        dryingSpeed: { type: Type.NUMBER, description: 'Drying speed (0-100)' },
        viscosity: { type: Type.NUMBER, description: 'Fluid viscosity (0-100)' },
        brushType: { type: Type.STRING, description: 'Type of brush: round, flat, sumi, spray, water' }
      }
    }
  },
  {
    name: 'updatePaper',
    description: 'Change paper texture, resolution, and properties.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: 'Paper type: rice, canvas, watercolor, smooth' },
        roughness: { type: Type.NUMBER, description: 'Paper roughness (0-100)' },
        contrast: { type: Type.NUMBER, description: 'Texture contrast (0-100)' },
        resolution: { type: Type.INTEGER, description: 'Simulation grid resolution: 256, 512, or 1024' }
      }
    }
  },
  {
    name: 'setColor',
    description: 'Set the current ink color using HSV values.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        h: { type: Type.NUMBER, description: 'Hue (0-360). Red=0, Green=120, Blue=240' },
        s: { type: Type.NUMBER, description: 'Saturation (0-100)' },
        b: { type: Type.NUMBER, description: 'Brightness (0-100)' }
      },
      required: ['h', 's', 'b']
    }
  },
  {
    name: 'switchTab',
    description: 'Switch the visible UI tab.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tab: { type: Type.STRING, description: 'Tab name: paint, brushes, physics, paper' }
      },
      required: ['tab']
    }
  },
  {
    name: 'controlApp',
    description: 'Perform general app actions like clearing the canvas, undoing the last stroke, or redoing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: 'Action to perform: clear, regenerate, toggleView, undo, redo' }
      },
      required: ['action']
    }
  },
  {
    name: 'generateSketch',
    description: 'Generate a light pencil sketch guide for the user to paint over using image generation. You must decide whether to clear the canvas first.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'Description of the object or scene to sketch.' },
        clearCanvas: { type: Type.BOOLEAN, description: 'Whether to clear the existing canvas before adding the sketch. Set to true if the user wants a fresh start or a new drawing. Set to false if they want to add to the existing work.' }
      },
      required: ['prompt', 'clearCanvas']
    }
  },
  {
    name: 'getAppState',
    description: 'Get the current simulation and paper parameters to understand the current state of the app.',
    parameters: { type: Type.OBJECT, properties: {} }
  }
];

export class LiveClient {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private inputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private toolHandler: ToolHandler;
  private onStatusChange: (status: { isConnected: boolean; isSpeaking: boolean; error: string | null }) => void;
  private session: any = null;

  constructor(apiKey: string, toolHandler: ToolHandler, onStatusChange: any) {
    this.ai = new GoogleGenAI({ apiKey });
    this.toolHandler = toolHandler;
    this.onStatusChange = onStatusChange;
  }

  async connect() {
    try {
      this.onStatusChange({ isConnected: true, isSpeaking: false, error: null });

      // Audio Contexts
      // Browsers limit the number of AudioContexts, so we must close them in disconnect()
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      // Microphone Stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      // Construct initial state for system instruction
      const initialState = JSON.stringify({
          simulation: this.toolHandler.getParams(),
          paper: this.toolHandler.getPaperParams()
      });

      // Connect to Gemini
      const sessionPromise = this.ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: `You are MoXi, an expert digital ink assistant. You control a fluid dynamics simulation. You can adjust brushes, paper, physics, and **create pencil guides**. 
          
          Important Knowledge:
          1. Brushes: The 'WATER' brush contains NO ink. It is ONLY for adding dilution or reshaping existing ink. CRITICAL: It only works on WET ink. If the ink is dry, the water brush does nothing. Suggest the user first apply fresh ink with LOW 'Drying Speed' (e.g., < 20) and LOW 'Pigment Weight' so it stays wet longer, then switch to the WATER brush to manipulate it.
          2. Physics: 'Pigment Weight' determines flow. High weight = heavy/static ink. Low weight = flowing ink.
          3. Color Physics: 
             - High Saturation + High Brightness = Very strong, thick ink color.
             - High Saturation + Lower Brightness = Mixes towards black/mud quickly due to accumulation.
             - Watercolor Look: Use VERY Low Saturation (~10) and High Brightness (~100). This is the sweet spot for light, transparent washes.
             - Black: Use Hue 0, Saturation 0, Brightness 78.
          4. Controls: You can UNDO mistakes using controlApp('undo') and REDO using controlApp('redo').
          5. Guides: If the user asks for help drawing something or wants a guide, use the 'generateSketch' tool. This creates a faint graphite outline.
             - Always determine if you should clear the canvas first based on user intent (e.g. "Draw a cat" -> clear=true, "Add a hat" -> clear=false).
          6. UI State: The 'Studio' recording tools are currently ${ENABLE_STUDIO_TAB ? 'ENABLED' : 'DISABLED'}.
          
          Current State: ${initialState}. If unsure of state, call getAppState().` }] },
          tools: [{ functionDeclarations: tools }]
        },
        callbacks: {
            onopen: () => {
                console.log("Gemini Live Connected");
                // Start Input Streaming
                this.processor!.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = this.createPcmBlob(inputData);
                    sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                };
                this.inputSource!.connect(this.processor!);
                this.processor!.connect(this.inputAudioContext!.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                // Audio Output
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    this.onStatusChange({ isConnected: true, isSpeaking: true, error: null });
                    await this.playAudio(audioData);
                } else {
                    if (msg.serverContent?.turnComplete) {
                         this.onStatusChange({ isConnected: true, isSpeaking: false, error: null });
                    }
                }

                // Tool Calls
                if (msg.toolCall) {
                    this.handleToolCalls(msg.toolCall, sessionPromise);
                }
            },
            onclose: () => {
                this.disconnect();
            },
            onerror: (err) => {
                console.error(err);
                this.onStatusChange({ isConnected: false, isSpeaking: false, error: "Connection Error" });
                this.disconnect();
            }
        }
      });
      
      this.session = sessionPromise;

    } catch (e: any) {
      console.error(e);
      this.onStatusChange({ isConnected: false, isSpeaking: false, error: e.message });
      this.disconnect();
    }
  }

  async handleToolCalls(toolCall: any, sessionPromise: Promise<any>) {
    for (const fc of toolCall.functionCalls) {
        console.log(`Calling tool: ${fc.name}`, fc.args);
        let result: any = { result: "ok" };
        
        try {
            switch (fc.name) {
                case 'updateSimulation':
                    this.toolHandler.updateSimulation(fc.args);
                    break;
                case 'updatePaper':
                    this.toolHandler.updatePaper(fc.args);
                    break;
                case 'setColor':
                    this.toolHandler.setColor(fc.args.h, fc.args.s, fc.args.b);
                    break;
                case 'switchTab':
                    this.toolHandler.switchTab(fc.args.tab);
                    break;
                case 'controlApp':
                    this.toolHandler.controlApp(fc.args.action);
                    break;
                case 'generateSketch':
                    // Notify Start with autoClear = false (sticky)
                    this.toolHandler.notifyAiState('Generating Sketch...', 'brush', false);
                    
                    // Perform the image generation separately using imagen-4.0-generate-001
                    try {
                        const prompt = fc.args.prompt;
                        // Always force clearCanvas to true as requested, ignoring tool arguments
                        const clearCanvas = true; 
                        
                        console.log(`Generating sketch for: ${prompt}, clear: ${clearCanvas}`);
                        const response = await this.ai.models.generateImages({
                            model: 'imagen-4.0-generate-001',
                            prompt: `A faint, light graphite pencil sketch of ${prompt} on a pure white background. Minimalist loose artistic lines, no shading, high contrast outlines. Style: architectural sketch or rough draft.`,
                            config: { 
                                numberOfImages: 1, 
                                aspectRatio: '1:1',
                                outputMimeType: 'image/png'
                            }
                        });
                        
                        // Extract image from response
                        let base64Image = null;
                        if (response.generatedImages?.[0]?.image?.imageBytes) {
                             base64Image = response.generatedImages[0].image.imageBytes;
                        }

                        if (base64Image) {
                            this.toolHandler.importImage(base64Image, clearCanvas);
                            result = { result: "sketch_created" };
                            this.toolHandler.notifyAiState('Sketch Created', 'brush');
                        } else {
                            result = { result: "generation_failed", error: "No image returned" };
                            this.toolHandler.notifyAiState('Generation Failed', 'trash');
                        }
                    } catch (genError: any) {
                         console.error("Sketch generation failed", genError);
                         result = { result: "failed", error: genError.message };
                         this.toolHandler.notifyAiState('Generation Failed', 'trash');
                    }
                    break;
                case 'getAppState':
                    result = {
                        simulation: this.toolHandler.getParams(),
                        paper: this.toolHandler.getPaperParams()
                    };
                    break;
            }
        } catch (e) {
            console.error("Tool execution failed", e);
            result = { result: "failed" };
        }

        const session = await sessionPromise;
        session.sendToolResponse({
            functionResponses: {
                id: fc.id,
                name: fc.name,
                response: result
            }
        });
    }
  }

  createPcmBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return {
        mimeType: 'audio/pcm;rate=16000',
        data: b64
    };
  }

  async playAudio(base64Data: string) {
    if (!this.audioContext) return;
    
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode 24000Hz PCM
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = this.audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for(let i=0; i<dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const now = this.audioContext.currentTime;
    this.nextStartTime = Math.max(this.nextStartTime, now);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
             this.onStatusChange({ isConnected: true, isSpeaking: false, error: null });
        }
    };
  }

  disconnect() {
    // 1. Close the Gemini Session
    if (this.session) {
        this.session.then((s: any) => {
            try { s.close(); } catch(e) { console.error("Error closing session", e); }
        });
        this.session = null;
    }

    // 2. Stop all media tracks (Releases microphone)
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
    }

    // 3. Cleanup Audio Nodes
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.processor = null;
    this.inputSource = null;

    // 4. Close Audio Contexts (Critical: Browsers have a limit on active contexts)
    if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
    }
    this.audioContext = null;

    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
        this.inputAudioContext.close();
    }
    this.inputAudioContext = null;

    this.onStatusChange({ isConnected: false, isSpeaking: false, error: null });
  }
}