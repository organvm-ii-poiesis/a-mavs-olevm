/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
import { Sliders, Paintbrush, FileText, Droplets, Trash2, Eye, RefreshCw, Monitor, ChevronDown, Palette, Film, Play, Square, Circle, Download, Upload, Copy, Bug, Undo2, Redo2, Image as ImageIcon } from 'lucide-react';
import { SimulationParams, PaperParams, BrushType, PaperType, AIOperationState, RecordingState } from '../types';
import { ENABLE_STUDIO_TAB } from '../defaultConfig';

// Helper: HSV to RGB Object
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
  return { 
      r: Math.round((r + m) * 255), 
      g: Math.round((g + m) * 255), 
      b: Math.round((b + m) * 255) 
  };
};

// Helper: HSV to RGB String
const hsvToRgbString = (h: number, s: number, v: number) => {
    const { r, g, b } = hsvToRgb(h, s, v);
    return `rgb(${r}, ${g}, ${b})`;
};

// Extracted Components
interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  gradient?: string;
}

const Range: React.FC<RangeProps> = ({ label, value, min, max, step, onChange, gradient }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="flex justify-between">
      <label className="text-[10px] uppercase font-bold text-gray-500">{label}</label>
      <span className="text-[10px] text-gray-400">{value.toFixed(1)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/50 touch-none slider-thumb-fix ${gradient ? '' : 'bg-gray-200'}`}
      style={gradient ? { background: gradient } : {}}
    />
  </div>
);

interface TabButtonProps {
  id: 'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug';
  activeTab: 'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug';
  setActiveTab: (tab: 'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug') => void;
  icon: any;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ id, activeTab, setActiveTab, icon: Icon, label }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex-1 flex flex-col items-center justify-center py-3 text-[10px] font-bold uppercase tracking-wide transition-all ${
      activeTab === id 
        ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
        : 'text-gray-500 hover:bg-gray-50'
    }`}
  >
    <Icon size={18} className="mb-1" />
    {label}
  </button>
);

interface ControlPanelProps {
  params: SimulationParams;
  paperParams: PaperParams;
  updateParams: (updates: Partial<SimulationParams>) => void;
  updatePaper: (updates: Partial<PaperParams>) => void;
  onClear: () => void;
  onRegenPaper: () => void;
  onToggleView: () => void;
  viewMode: 'ink' | 'fibers';
  activeTab: 'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug';
  setActiveTab: (tab: 'paint' | 'brushes' | 'physics' | 'paper' | 'studio' | 'debug') => void;
  aiOperation: AIOperationState | null;
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onLoadRecording: (data: any) => void;
  onSaveRecording: () => void;
  onCopyConfig: () => void;
  fps: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  onSaveImage: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  paperParams,
  updateParams,
  updatePaper,
  onClear,
  onRegenPaper,
  onToggleView,
  viewMode,
  activeTab,
  setActiveTab,
  aiOperation,
  recordingState,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onLoadRecording,
  onSaveRecording,
  onCopyConfig,
  fps,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isMinimized,
  setIsMinimized,
  onSaveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTerms, setShowTerms] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          onLoadRecording(json);
        } catch (err) {
          console.error("Failed to load recording", err);
          alert("Invalid file format");
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <style>{`
        .slider-thumb-fix::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          margin-top: -1px; /* Centered visually */
        }
        .slider-thumb-fix::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          border: none;
        }
      `}</style>

      {/* Main Panel */}
      <div 
          className={`fixed w-[calc(100%-2rem)] max-w-[400px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col z-40 transition-all duration-300 ease-in-out safe-area-bottom touch-auto
            bottom-4 left-1/2 transform -translate-x-1/2
            lg:static lg:w-[400px] lg:transform-none lg:mx-0 lg:left-auto lg:right-auto lg:top-auto lg:bottom-auto
            ${isMinimized 
                ? 'translate-y-[120%] opacity-0 pointer-events-none lg:hidden' 
                : 'translate-y-0 opacity-100 lg:block'
            }`}
      >
        {/* Tabs */}
        <div className="relative flex border-b border-gray-100 bg-gray-50/50 pr-10">
          <TabButton id="paint" activeTab={activeTab} setActiveTab={setActiveTab} icon={Paintbrush} label="Paint" />
          <TabButton id="brushes" activeTab={activeTab} setActiveTab={setActiveTab} icon={Droplets} label="Brushes" />
          <TabButton id="physics" activeTab={activeTab} setActiveTab={setActiveTab} icon={Sliders} label="Physics" />
          <TabButton id="paper" activeTab={activeTab} setActiveTab={setActiveTab} icon={FileText} label="Paper" />
          {ENABLE_STUDIO_TAB && (
            <TabButton id="studio" activeTab={activeTab} setActiveTab={setActiveTab} icon={Film} label="Studio" />
          )}
          <TabButton id="debug" activeTab={activeTab} setActiveTab={setActiveTab} icon={Bug} label="Debug" />
          
          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-0 right-0 h-full w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors border-l border-gray-100"
            aria-label="Minimize Settings"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 min-h-[180px] flex flex-col justify-between">
          {activeTab === 'paint' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Range label="Size" value={params.brushSize} min={1} max={40} step={0.1} onChange={(v: number) => updateParams({ brushSize: v })} />
                <Range label="Water" value={params.waterAmount} min={0} max={100} step={1} onChange={(v: number) => updateParams({ waterAmount: v })} />
                <Range label="Ink" value={params.inkAmount} min={0} max={100} step={1} onChange={(v: number) => updateParams({ inkAmount: v })} />
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="space-y-3">
                {/* Hue Slider */}
                <Range 
                  label="Hue" value={params.color.h} min={0} max={360} step={1} 
                  onChange={(v: number) => updateParams({ color: { ...params.color, h: v } })}
                  gradient="linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
                />
                <div className="flex gap-3">
                  {/* Saturation Slider */}
                  <Range 
                    label="Saturation" value={params.color.s} min={0} max={100} step={1} 
                    onChange={(v: number) => updateParams({ color: { ...params.color, s: v } })}
                    gradient={`linear-gradient(to right, ${hsvToRgbString(params.color.h, 0, params.color.b)}, ${hsvToRgbString(params.color.h, 100, params.color.b)})`}
                  />
                  {/* Brightness Slider */}
                  <Range 
                    label="Brightness" value={params.color.b} min={0} max={100} step={1} 
                    onChange={(v: number) => updateParams({ color: { ...params.color, b: v } })}
                    gradient={`linear-gradient(to right, #000000, ${hsvToRgbString(params.color.h, params.color.s, 100)})`}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                  <div className="w-8 h-8 rounded-full shadow-inner border-2 border-white ring-1 ring-gray-200" style={{ backgroundColor: hsvToRgbString(params.color.h, params.color.s, params.color.b) }}></div>
              </div>
            </div>
          )}

          {activeTab === 'brushes' && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: BrushType.ROUND, label: 'Round', style: 'w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-black' },
                { id: BrushType.FLAT, label: 'Flat', style: 'w-4 h-1 bg-black rotate-[-45deg] rounded-sm' },
                { id: BrushType.SUMI, label: 'Sumi', style: 'w-2 h-2 rounded-full border border-black/50 bg-black/20' },
                { id: BrushType.SPRAY, label: 'Spray', style: 'w-4 h-4 rounded-full border-2 border-dotted border-gray-600' },
                { id: BrushType.WATER, label: 'Water', style: 'w-3 h-3 rounded-full border-2 border-blue-400 rotate-[-45deg] rounded-br-none' },
              ].map((brush) => (
                <button
                  key={brush.id}
                  onClick={() => updateParams({ brushType: brush.id })}
                  className={`flex-col items-center justify-center p-2 rounded-xl border transition-all flex ${
                    params.brushType === brush.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="h-8 w-8 flex items-center justify-center mb-1">
                    <div className={brush.style}></div>
                  </div>
                  <span className="text-[9px] font-bold uppercase">{brush.label}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <Range label="Drying Speed" value={params.dryingSpeed} min={0} max={100} step={1} onChange={(v: number) => updateParams({ dryingSpeed: v })} />
                <Range label="Viscosity" value={params.viscosity} min={0} max={100} step={1} onChange={(v: number) => updateParams({ viscosity: v })} />
                <Range label="Paper Resist" value={params.paperResist} min={0} max={100} step={1} onChange={(v: number) => updateParams({ paperResist: v })} />
                <Range label="Pigment Weight" value={params.inkWeight} min={0} max={100} step={1} onChange={(v: number) => updateParams({ inkWeight: v })} />
              </div>
            </div>
          )}

          {activeTab === 'paper' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Paper Type</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                      {Object.values(PaperType).map((type) => (
                          <button
                              key={type}
                              onClick={() => { updatePaper({ type }); setTimeout(onRegenPaper, 10); }}
                              className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${
                                  paperParams.type === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                              }`}
                          >
                              {type}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                      <Monitor size={10} /> Resolution (Grid Size)
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[256, 512, 1024].map((res) => (
                          <button
                              key={res}
                              onClick={() => updatePaper({ resolution: res as any })}
                              className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${
                                  paperParams.resolution === res 
                                      ? res === 1024 ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-white text-blue-600 shadow-sm' 
                                      : 'text-gray-500 hover:text-gray-700'
                              }`}
                          >
                              {res === 256 ? 'Low (256)' : res === 512 ? 'Med (512)' : 'High (1024)'}
                          </button>
                      ))}
                  </div>
                  {paperParams.resolution === 1024 && (
                      <div className="text-[9px] text-red-500 font-medium text-center bg-red-50 py-1 rounded">
                          High resolution may be slow on mobile devices.
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Range label="Roughness" value={paperParams.roughness} min={1} max={100} step={1} onChange={(v: number) => updatePaper({ roughness: v })} />
                <Range label="Contrast" value={paperParams.contrast} min={0} max={100} step={1} onChange={(v: number) => updatePaper({ contrast: v })} />
              </div>
              
              <button 
                  onClick={onRegenPaper}
                  className="w-full mt-2 bg-gray-800 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
              >
                  <RefreshCw size={14} /> Regenerate Paper
              </button>
            </div>
          )}

          {activeTab === 'studio' && ENABLE_STUDIO_TAB && (
            <div className="flex flex-col gap-4 h-full justify-center">
              <div className="text-center mb-2">
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                  recordingState === 'recording' ? 'text-red-500 animate-pulse' : 
                  recordingState === 'playing' ? 'text-green-500' : 'text-gray-400'
                }`}>
                  {recordingState === 'recording' ? '• Recording' : 
                   recordingState === 'playing' ? '► Playing' : 'Ready'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {recordingState === 'recording' ? (
                  <button 
                    onClick={onStopRecording}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all gap-2"
                  >
                    <Square size={24} fill="currentColor" />
                    <span className="text-[10px] font-bold uppercase">Stop</span>
                  </button>
                ) : (
                  <button 
                    onClick={onStartRecording}
                    disabled={recordingState !== 'idle'}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${
                       recordingState === 'idle' 
                       ? 'border-red-200 text-red-500 hover:bg-red-50' 
                       : 'border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Circle size={24} fill="currentColor" />
                    <span className="text-[10px] font-bold uppercase">Record</span>
                  </button>
                )}

                <button 
                  onClick={onPlayRecording}
                  disabled={recordingState !== 'idle'}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${
                    recordingState === 'idle'
                    ? 'border-green-200 text-green-500 hover:bg-green-50'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Play size={24} fill={recordingState === 'idle' ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold uppercase">Play</span>
                </button>
              </div>

              <div className="h-px bg-gray-100 w-full my-1" />

              <div className="flex gap-2">
                <button 
                  onClick={onSaveRecording}
                  disabled={recordingState !== 'idle'}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                >
                  <Download size={16} />
                  <span className="text-[10px] font-bold uppercase">Save</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={recordingState !== 'idle'}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
                >
                  <Upload size={16} />
                  <span className="text-[10px] font-bold uppercase">Load</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
             <div className="flex flex-col gap-4 h-full justify-center">
                <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-gray-800 tracking-tighter">{fps}</div>
                    <div className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mt-1">FPS</div>
                </div>
                <div className="h-px bg-gray-100 w-full my-2" />
                <button 
                  onClick={onCopyConfig}
                  className="w-full bg-gray-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <Copy size={16} /> Copy Default Config
                </button>
                <p className="text-[9px] text-gray-400 text-center px-4 leading-relaxed">
                    Copies current state as a valid TypeScript configuration file. Paste into <code>defaultConfig.ts</code>.
                </p>
            </div>
          )}

          {/* Global Footer Actions */}
          {activeTab !== 'studio' && activeTab !== 'debug' && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <div className="flex gap-1 mr-1">
                   <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`w-10 h-full border border-gray-200 rounded-lg flex items-center justify-center transition-all ${
                            canUndo ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-50 text-gray-300'
                        }`}
                        title="Undo (Ctrl+Z)"
                   >
                        <Undo2 size={16} />
                   </button>
                   <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`w-10 h-full border border-gray-200 rounded-lg flex items-center justify-center transition-all ${
                            canRedo ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-50 text-gray-300'
                        }`}
                        title="Redo (Ctrl+Y)"
                   >
                        <Redo2 size={16} />
                   </button>
                   <button 
                        onClick={onSaveImage}
                        className="w-10 h-full border border-gray-200 rounded-lg flex items-center justify-center bg-white text-gray-700 hover:bg-gray-50 transition-all"
                        title="Save Image"
                    >
                        <ImageIcon size={16} />
                    </button>
                </div>

                <div className="flex-1 flex gap-2">
                    <button 
                        onClick={onClear}
                        className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                        <Trash2 size={14} /> Clear
                    </button>
                    <button 
                        onClick={onToggleView}
                        className={`flex-1 border py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                            viewMode === 'fibers' 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Eye size={14} /> {viewMode === 'fibers' ? 'Show Ink' : 'Show Paper'}
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* Attribution Footer */}
        <div className="py-2 border-t border-gray-100 bg-gray-50/50 text-center">
           <div className="text-[10px] text-gray-400 font-medium tracking-wide flex items-center justify-center gap-1">
              <span>made by <a href="http://x.com/pitaru" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">@pitaru</a> with Gemini</span>
              <span className="text-gray-300">|</span>
              <button onClick={() => setShowTerms(true)} className="hover:text-gray-600 transition-colors underline decoration-dotted">terms</button>
           </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold uppercase text-gray-900 mb-3">Terms & Privacy</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Recordings of your interactions with the Live API and content you share with it are processed per the <a href="https://www.google.com/url?sa=j&url=https%3A%2F%2Fai.google.dev%2Fgemini-api%2Fterms&uct=1762338821&usg=bGEVPh4cb4h_7jh8rfAWr8Ufmqk.&opi=73833047&source=chat" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Gemini API Additional Terms</a>. Respect others’ privacy and ask permission before recording or including them in a Live chat.
            </p>
            <button 
              onClick={() => setShowTerms(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};