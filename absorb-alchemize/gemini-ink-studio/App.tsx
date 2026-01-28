/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { InkSimulation } from './services/inkSimulation';
import { ControlPanel } from './components/ControlPanel';
import VoiceStatus from './components/VoiceStatus';
import { SettingsPill } from './components/SettingsPill';
import { LiveClient } from './services/liveApi';
import { BrushType, PaperType, SimulationParams, PaperParams, LiveState, ToolHandler, AIOperationState, RecordedAction, RecordingState, Snapshot } from './types';
import { DEFAULT_SETTINGS } from './defaultConfig';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<InkSimulation | null>(null);
  const animationRef = useRef<number | null>(null);
  const isMouseDown = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // -- Debug State --
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  
  // -- Timing for Fixed Timestep --
  const simulationTimingRef = useRef({ lastTime: 0, accumulator: 0 });
  
  // -- State --
  const [params, setParams] = useState<SimulationParams>(DEFAULT_SETTINGS.simulation);
  const [isSettingsMinimized, setIsSettingsMinimized] = useState(false);

  const [paperParams, setPaperParams] = useState<PaperParams>(DEFAULT_SETTINGS.paper);

  // Keep track of parameters for stable callbacks and AI sync
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);

  const paperParamsRef = useRef(paperParams);
  useEffect(() => { paperParamsRef.current = paperParams; }, [paperParams]);

  const [viewMode, setViewMode] = useState<'ink' | 'fibers'>('ink');
  const viewModeRef = useRef(viewMode);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  const [activeTab, setActiveTab] = useState<'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug'>('paint');

  // -- Live API State --
  const [liveState, setLiveState] = useState<LiveState>({ isConnected: false, isSpeaking: false, error: null });
  const liveClientRef = useRef<LiveClient | null>(null);
  
  // -- AI Operation Visualization Queue --
  const [aiOpQueue, setAiOpQueue] = useState<AIOperationState[]>([]);
  const [currentAiOp, setCurrentAiOp] = useState<AIOperationState | null>(null);

  // -- Recording State --
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const recordedActionsRef = useRef<RecordedAction[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const playbackRef = useRef<{ startTime: number; index: number; requestId: number } | null>(null);

  // -- Undo/Redo State --
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const saveSnapshot = useCallback(() => {
    if (!simRef.current) return;
    
    // Deep clone parameters
    const snapshot: Snapshot = {
      arrays: simRef.current.getSnapshotArrays(),
      params: JSON.parse(JSON.stringify(paramsRef.current)),
      paperParams: JSON.parse(JSON.stringify(paperParamsRef.current))
    };

    undoStack.current.push(snapshot);
    if (undoStack.current.length > 10) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (!simRef.current || undoStack.current.length === 0) return;

    const currentSnapshot: Snapshot = {
        arrays: simRef.current.getSnapshotArrays(),
        params: JSON.parse(JSON.stringify(paramsRef.current)),
        paperParams: JSON.parse(JSON.stringify(paperParamsRef.current))
    };
    redoStack.current.push(currentSnapshot);

    const prevSnapshot = undoStack.current.pop();
    if (prevSnapshot) {
        simRef.current.restoreSnapshotArrays(prevSnapshot.arrays);
        setParams(prevSnapshot.params);
        setPaperParams(prevSnapshot.paperParams);
    }
    setHistoryVersion(v => v + 1);
    triggerAiOp({ type: 'action', label: 'Undo', icon: 'settings' });
  }, []);

  const handleRedo = useCallback(() => {
    if (!simRef.current || redoStack.current.length === 0) return;

    const currentSnapshot: Snapshot = {
        arrays: simRef.current.getSnapshotArrays(),
        params: JSON.parse(JSON.stringify(paramsRef.current)),
        paperParams: JSON.parse(JSON.stringify(paperParamsRef.current))
    };
    undoStack.current.push(currentSnapshot);

    const nextSnapshot = redoStack.current.pop();
    if (nextSnapshot) {
        simRef.current.restoreSnapshotArrays(nextSnapshot.arrays);
        setParams(nextSnapshot.params);
        setPaperParams(nextSnapshot.paperParams);
    }
    setHistoryVersion(v => v + 1);
    triggerAiOp({ type: 'action', label: 'Redo', icon: 'settings' });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            if (e.shiftKey) {
                handleRedo();
            } else {
                handleUndo();
            }
            e.preventDefault();
        } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
            handleRedo();
            e.preventDefault();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  const recordAction = useCallback((type: RecordedAction['type'], data?: any) => {
    if (recordingState === 'recording') {
        recordedActionsRef.current.push({
            timestamp: Date.now() - recordingStartTimeRef.current,
            type,
            data
        });
    }
  }, [recordingState]);

  const triggerAiOp = useCallback((op: AIOperationState) => {
    setAiOpQueue(prev => [...prev, op]);
  }, []);

  useEffect(() => {
    if (aiOpQueue.length > 0) {
        if (!currentAiOp || currentAiOp.autoClear === false) {
             const nextOp = aiOpQueue[0];
             setCurrentAiOp(nextOp);
             setAiOpQueue(prev => prev.slice(1));
        }
    }
  }, [currentAiOp, aiOpQueue]);

  useEffect(() => {
    if (currentAiOp) {
        if (currentAiOp.autoClear === false) return; 
        const duration = 2000; 
        const tm = setTimeout(() => {
            setCurrentAiOp(null);
        }, duration);
        return () => clearTimeout(tm);
    }
  }, [currentAiOp]);

  const hsvToRgb = (h: number, s: number, v: number) => {
    s /= 100; v /= 100;
    let c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  };

  const handleUpdateParams = useCallback((updates: Partial<SimulationParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
    recordAction('param_change', updates);
  }, [recordAction]);

  const handleUpdatePaper = useCallback((updates: Partial<PaperParams>) => {
    setPaperParams(prev => ({ ...prev, ...updates }));
    recordAction('paper_change', updates);
  }, [recordAction]);

  const handleRegenPaper = useCallback(() => {
    saveSnapshot(); 
    if (simRef.current) {
        const p = paperParamsRef.current;
        simRef.current.generatePaper(p.type, p.roughness, p.contrast, p.align);
    }
    recordAction('regen_paper');
  }, [recordAction, saveSnapshot]);

  const handleClear = useCallback(() => {
      saveSnapshot(); 
      simRef.current?.clear();
      recordAction('clear');
  }, [recordAction, saveSnapshot]);

  const handleToggleView = useCallback(() => {
      setViewMode(m => m === 'ink' ? 'fibers' : 'ink');
      recordAction('toggle_view');
  }, [recordAction]);

  const handleCopyConfig = useCallback(() => {
      const config = {
          simulation: paramsRef.current,
          paper: paperParamsRef.current
      };
      const fileContent = `import { BrushType, PaperType, SimulationParams, PaperParams } from './types';

export const DEFAULT_SETTINGS: { simulation: SimulationParams, paper: PaperParams } = ${JSON.stringify(config, null, 2)};`;

      navigator.clipboard.writeText(fileContent)
          .then(() => alert("Default configuration file copied to clipboard! Paste this into defaultConfig.ts"))
          .catch(err => console.error("Failed to copy settings", err));
  }, []);
  
  const handleSaveImage = useCallback(() => {
      if (!canvasRef.current) return;
      const link = document.createElement('a');
      link.download = `moxi-ink-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
  }, []);

  useEffect(() => {
    const toolHandler: ToolHandler = {
        updateSimulation: (newParams) => {
            handleUpdateParams(newParams);
            if (newParams.brushType !== undefined) {
                setActiveTab('brushes');
            } else if (
                newParams.dryingSpeed !== undefined || 
                newParams.viscosity !== undefined || 
                newParams.paperResist !== undefined || 
                newParams.inkWeight !== undefined
            ) {
                setActiveTab('physics');
            } else if (
                newParams.brushSize !== undefined || 
                newParams.waterAmount !== undefined || 
                newParams.inkAmount !== undefined ||
                newParams.color !== undefined
            ) {
                setActiveTab('paint');
            }
            if (newParams.brushSize !== undefined) triggerAiOp({ type: 'slider', label: 'Brush Size', value: newParams.brushSize, min: 1, max: 40, icon: 'brush' });
            if (newParams.waterAmount !== undefined) triggerAiOp({ type: 'slider', label: 'Water', value: newParams.waterAmount, min: 0, max: 100, icon: 'water' });
            if (newParams.inkAmount !== undefined) triggerAiOp({ type: 'slider', label: 'Ink Flow', value: newParams.inkAmount, min: 0, max: 100, icon: 'brush' });
            if (newParams.dryingSpeed !== undefined) triggerAiOp({ type: 'slider', label: 'Drying Speed', value: newParams.dryingSpeed, min: 0, max: 100, icon: 'physics' });
            if (newParams.viscosity !== undefined) triggerAiOp({ type: 'slider', label: 'Viscosity', value: newParams.viscosity, min: 0, max: 100, icon: 'physics' });
            if (newParams.paperResist !== undefined) triggerAiOp({ type: 'slider', label: 'Paper Resist', value: newParams.paperResist, min: 0, max: 100, icon: 'physics' });
            if (newParams.inkWeight !== undefined) triggerAiOp({ type: 'slider', label: 'Pigment Weight', value: newParams.inkWeight, min: 0, max: 100, icon: 'physics' });
            if (newParams.brushType !== undefined) triggerAiOp({ type: 'action', label: `Brush: ${newParams.brushType}`, icon: 'brush' });
        },
        updatePaper: (newParams) => {
            handleUpdatePaper(newParams);
            setActiveTab('paper');
            if (newParams.roughness !== undefined) triggerAiOp({ type: 'slider', label: 'Roughness', value: newParams.roughness, min: 1, max: 100, icon: 'settings' });
            if (newParams.contrast !== undefined) triggerAiOp({ type: 'slider', label: 'Contrast', value: newParams.contrast, min: 0, max: 100, icon: 'settings' });
            if (newParams.type !== undefined) triggerAiOp({ type: 'action', label: `Paper: ${newParams.type}`, icon: 'settings' });
            if (newParams.resolution !== undefined) triggerAiOp({ type: 'action', label: `Grid: ${newParams.resolution}px`, icon: 'settings' });
        },
        setColor: (h, s, b) => {
            handleUpdateParams({ color: { h, s, b } });
            setActiveTab('paint');
            const rgb = hsvToRgb(h, s, b);
            const colorString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            triggerAiOp({ type: 'color', label: 'Mixing Color', value: colorString, icon: 'palette' });
        },
        switchTab: (tab) => {
            setActiveTab(tab);
        },
        controlApp: (action) => {
            if (action === 'clear') {
                handleClear();
                triggerAiOp({ type: 'action', label: 'Canvas Cleared', icon: 'trash' });
            }
            if (action === 'regenerate') {
                handleRegenPaper();
                triggerAiOp({ type: 'action', label: 'New Paper', icon: 'refresh' });
            }
            if (action === 'toggleView') {
                handleToggleView();
                triggerAiOp({ type: 'action', label: 'Toggle View', icon: 'eye' });
            }
            if (action === 'undo') {
                handleUndo();
            }
            if (action === 'redo') {
                handleRedo();
            }
        },
        importImage: (base64, clearFirst = false) => {
            saveSnapshot(); 
            if (clearFirst) {
                simRef.current?.clear();
            }
            const img = new Image();
            img.onload = () => {
                 const res = paperParamsRef.current.resolution;
                 const canvas = document.createElement('canvas');
                 canvas.width = res;
                 canvas.height = res;
                 const ctx = canvas.getContext('2d');
                 if (ctx) {
                    ctx.drawImage(img, 0, 0, res, res);
                    const data = ctx.getImageData(0, 0, res, res);
                    simRef.current?.drawSketch(data.data, res, res);
                 }
            };
            img.src = `data:image/png;base64,${base64}`;
        },
        notifyAiState: (label, icon = 'settings', autoClear = true) => {
            triggerAiOp({ type: 'action', label, icon, autoClear });
        },
        getParams: () => paramsRef.current,
        getPaperParams: () => paperParamsRef.current
    };

    liveClientRef.current = new LiveClient(
        process.env.API_KEY || '', 
        toolHandler, 
        setLiveState
    );

    return () => {
        liveClientRef.current?.disconnect();
    };
  }, [handleClear, handleRegenPaper, handleToggleView, handleUpdateParams, handleUpdatePaper, triggerAiOp, handleUndo, handleRedo, saveSnapshot]); 

  useEffect(() => {
    setLoading(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const initSim = () => {
      const res = paperParams.resolution;
      simRef.current = new InkSimulation(res, res);
      const p = paperParams;
      simRef.current.generatePaper(p.type, p.roughness, p.contrast, p.align);
      setLoading(false);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion(0);
    };

    const tm = setTimeout(initSim, 100);
    return () => clearTimeout(tm);
  }, [paperParams.resolution]);

  useEffect(() => {
    if(!loading && simRef.current) {
        const p = paperParams;
        simRef.current.generatePaper(p.type, p.roughness, p.contrast, p.align);
    }
  }, [paperParams.type, paperParams.roughness, paperParams.contrast, paperParams.align, loading]);

  useEffect(() => {
    if (!simRef.current || !canvasRef.current || loading) return;

    const currentRes = paperParams.resolution;
    const displayScale = 1024 / currentRes;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = currentRes;
    bufferCanvas.height = currentRes;
    const bufferCtx = bufferCanvas.getContext('2d');
    const imgData = bufferCtx!.createImageData(currentRes, currentRes);
    const u32Buffer = new Uint32Array(imgData.data.buffer);
    
    simulationTimingRef.current.lastTime = 0;
    simulationTimingRef.current.accumulator = 0;

    const render = () => {
      const sim = simRef.current;
      if (!sim) return;
      
      const p = paramsRef.current; 
      
      const now = performance.now();
      if (simulationTimingRef.current.lastTime === 0) simulationTimingRef.current.lastTime = now;
      const frameTime = now - simulationTimingRef.current.lastTime;
      simulationTimingRef.current.lastTime = now;
      
      simulationTimingRef.current.accumulator += Math.min(frameTime, 200);
      
      const tps = currentRes <= 256 ? 60 : currentRes <= 512 ? 30 : 15;
      const FIXED_TIMESTEP = 1000 / tps; 

      sim.setParams(p.dryingSpeed, p.viscosity, p.paperResist, p.inkWeight);
      sim.brushType = p.brushType;

      let steps = 0;
      const MAX_STEPS = 10; 
      while (simulationTimingRef.current.accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS) {
          sim.step();
          simulationTimingRef.current.accumulator -= FIXED_TIMESTEP;
          steps++;
      }

      const { w, h, fibers, rho, cFixed, mFixed, yFixed, cFloating, mFloating, yFloating } = sim;
      const len = w * h;

      const isFiberView = viewModeRef.current === 'fibers';

      for (let i = 0; i < len; i++) {
        const fib = fibers[i];
        
        if (isFiberView) { 
          const v = (fib * 255) | 0;
          u32Buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v;
          continue;
        }

        const C = cFixed[i] + cFloating[i];
        const M = mFixed[i] + mFloating[i];
        const Y = yFixed[i] + yFloating[i];

        if (C < 0.005 && M < 0.005 && Y < 0.005) {
            const paperVal = (255 - fib * 15) | 0;
            u32Buffer[i] = (255 << 24) | ((paperVal - 5) << 16) | (paperVal << 8) | paperVal;
            continue;
        }

        const paperVal = (255 - fib * 15) | 0;
        
        let val = 1.0 - C * 1.2;
        const fC = val < 0 ? 0 : val;
        val = 1.0 - M * 1.2;
        const fM = val < 0 ? 0 : val;
        val = 1.0 - Y * 1.2;
        const fY = val < 0 ? 0 : val;

        let r = (paperVal * fC) | 0;
        let g = (paperVal * fM) | 0;
        let b = ((paperVal - 5) * fY) | 0; 

        if (rho[i] > 1.05) {
          r = (r * 0.98) | 0;
          g = (g * 0.98) | 0;
          b = (b * 0.98) | 0;
        }
        
        u32Buffer[i] = (255 << 24) | (b << 16) | (g << 8) | r;
      }

      bufferCtx!.putImageData(imgData, 0, 0);
      
      if (canvasRef.current) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(bufferCanvas, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      frameCountRef.current++;
      const nowTime = Date.now();
      if (nowTime - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = nowTime;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loading, paperParams.resolution]);

  const getSimPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !simRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const simW = simRef.current.w;
    const simH = simRef.current.h;

    return {
      x: (clientX - rect.left) * (simW / rect.width),
      y: (clientY - rect.top) * (simH / rect.height)
    };
  };

  const applyInput = (x: number, y: number, vx: number, vy: number) => {
    if (!simRef.current) return;
    const p = paramsRef.current; 
    const rgb = hsvToRgb(p.color.h, p.color.s, p.color.b);
    
    const resScale = simRef.current.w / 256;
    
    simRef.current.addInput(
      x, y, 
      p.brushSize * resScale, 
      p.waterAmount / 50, 
      p.inkAmount / 20, 
      rgb.r, rgb.g, rgb.b, 
      vx, vy
    );

    recordAction('input', { x, y, vx, vy });
  };

  const startStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if (recordingState === 'playing') return;
    saveSnapshot();

    isMouseDown.current = true;
    const pos = getSimPos(e);
    lastPos.current = pos;
    applyInput(pos.x, pos.y, 0, 0);
  };

  const moveStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if (recordingState === 'playing') return;
    if (!isMouseDown.current || !lastPos.current) return;
    
    const pos = getSimPos(e);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const dragVX = Math.max(-2, Math.min(2, dx));
    const dragVY = Math.max(-2, Math.min(2, dy));

    const resScale = (simRef.current?.w || 256) / 256;
    const p = paramsRef.current;
    const stepSize = Math.max(0.5, (p.brushSize * resScale) * 0.25);
    const steps = Math.ceil(dist / stepSize);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      applyInput(
        lastPos.current.x + dx * t,
        lastPos.current.y + dy * t,
        dragVX,
        dragVY
      );
    }
    lastPos.current = pos;
  };

  const endStroke = () => {
    isMouseDown.current = false;
    lastPos.current = null;
  };

  const startRecording = () => {
    recordedActionsRef.current = [];
    recordingStartTimeRef.current = Date.now();
    setRecordingState('recording');
    
    recordedActionsRef.current.push({
        timestamp: 0,
        type: 'param_change',
        data: JSON.parse(JSON.stringify(paramsRef.current))
    });
    recordedActionsRef.current.push({
        timestamp: 0,
        type: 'paper_change',
        data: JSON.parse(JSON.stringify(paperParamsRef.current))
    });
  };

  const stopRecording = () => {
    setRecordingState('idle');
  };

  const playRecording = () => {
    if (recordedActionsRef.current.length === 0) return;
    if (playbackRef.current) cancelAnimationFrame(playbackRef.current.requestId);

    setRecordingState('playing');
    simRef.current?.clear();

    const startTime = Date.now();
    playbackRef.current = { startTime, index: 0, requestId: 0 };

    const playbackLoop = () => {
        if (!playbackRef.current) return;
        
        const now = Date.now();
        const elapsed = now - playbackRef.current.startTime;
        const actions = recordedActionsRef.current;
        let index = playbackRef.current.index;

        while (index < actions.length && actions[index].timestamp <= elapsed) {
            const action = actions[index];
            switch(action.type) {
                case 'input':
                    if (simRef.current) {
                        const p = paramsRef.current;
                        const rgb = hsvToRgb(p.color.h, p.color.s, p.color.b);
                        const resScale = simRef.current.w / 256;
                        simRef.current.addInput(
                            action.data.x, action.data.y, 
                            p.brushSize * resScale, 
                            p.waterAmount / 50, 
                            p.inkAmount / 20, 
                            rgb.r, rgb.g, rgb.b, 
                            action.data.vx, action.data.vy
                        );
                    }
                    break;
                case 'param_change':
                    setParams(prev => ({ ...prev, ...action.data }));
                    break;
                case 'paper_change':
                    setPaperParams(prev => ({ ...prev, ...action.data }));
                    break;
                case 'clear':
                    simRef.current?.clear();
                    break;
                case 'regen_paper':
                    if (simRef.current) {
                        const p = paperParamsRef.current; 
                        simRef.current.generatePaper(p.type, p.roughness, p.contrast, p.align);
                    }
                    break;
                case 'toggle_view':
                    setViewMode(m => m === 'ink' ? 'fibers' : 'ink');
                    break;
            }
            index++;
        }

        playbackRef.current.index = index;

        if (index < actions.length) {
            playbackRef.current.requestId = requestAnimationFrame(playbackLoop);
        } else {
            setRecordingState('idle');
            playbackRef.current = null;
        }
    };

    playbackRef.current.requestId = requestAnimationFrame(playbackLoop);
  };

  const saveRecording = () => {
    const blob = new Blob([JSON.stringify(recordedActionsRef.current)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ink-studio-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadRecording = (data: any) => {
    if (Array.isArray(data)) {
        recordedActionsRef.current = data;
        alert(`Loaded ${data.length} actions. Press Play to start.`);
    }
  };

  const toggleLive = () => {
    if (liveState.isConnected) {
        liveClientRef.current?.disconnect();
    } else {
        liveClientRef.current?.connect();
        setIsSettingsMinimized(true);
    }
  };

  const displayScale = 1024 / paperParams.resolution;

  return (
    <div 
        ref={containerRef}
        className="w-full h-screen bg-gray-200 relative overflow-hidden select-none touch-none flex flex-col items-center justify-center"
    >
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="text-sm font-bold tracking-widest text-gray-500 uppercase">
                        Generating {paperParams.resolution}x{paperParams.resolution} Matrix...
                    </div>
                </div>
            </div>
        )}
        
        {/* 
            Canvas + Settings Container 
            Using flexbox to center them as a unit.
        */}
        <div className="flex items-center justify-center gap-6 lg:gap-8 w-full h-full p-4 lg:p-8 transition-all duration-300">
             
            {/* Canvas Column */}
            <div className="flex flex-col items-center">
                {/* Canvas Wrapper - Contains Floating Controls */}
                <div className="relative shadow-2xl bg-white cursor-crosshair touch-none flex items-center justify-center max-w-[95vw] max-h-[80vh] lg:max-h-[85vh] aspect-square rounded-sm">
                    {!loading && (
                        <canvas
                            ref={canvasRef}
                            width={paperParams.resolution * displayScale}
                            height={paperParams.resolution * displayScale}
                            className="block touch-none max-w-full max-h-full w-auto h-auto"
                            style={{ aspectRatio: '1/1' }}
                            onMouseDown={startStroke}
                            onMouseMove={moveStroke}
                            onMouseUp={endStroke}
                            onMouseLeave={endStroke}
                            onTouchStart={startStroke}
                            onTouchMove={moveStroke}
                            onTouchEnd={endStroke}
                        />
                    )}
                    
                    {/* Voice Status - Top Center of Canvas */}
                    <VoiceStatus 
                        liveState={liveState} 
                        toggleLive={toggleLive} 
                    />

                    {/* Settings Toggle Pill - Bottom Center of Canvas */}
                    <SettingsPill 
                        onClick={() => setIsSettingsMinimized(false)}
                        isHidden={!isSettingsMinimized}
                        aiOperation={currentAiOp}
                        className="bottom-6 left-1/2 transform -translate-x-1/2"
                    />
                </div>
            </div>

            {/* ControlPanel Component (Includes Mobile Fixed Logic and Desktop Flex Logic) */}
            <ControlPanel
                params={params}
                paperParams={paperParams}
                updateParams={handleUpdateParams}
                updatePaper={handleUpdatePaper}
                onClear={handleClear}
                onRegenPaper={handleRegenPaper}
                onToggleView={handleToggleView}
                viewMode={viewMode}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                aiOperation={currentAiOp}
                recordingState={recordingState}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPlayRecording={playRecording}
                onLoadRecording={loadRecording}
                onSaveRecording={saveRecording}
                onCopyConfig={handleCopyConfig}
                fps={fps}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.current.length > 0}
                canRedo={redoStack.current.length > 0}
                isMinimized={isSettingsMinimized}
                setIsMinimized={setIsSettingsMinimized}
                onSaveImage={handleSaveImage}
            />
        </div>
    </div>
  );
};

export default App;