/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum BrushType {
  ROUND = 'round',
  FLAT = 'flat',
  SUMI = 'sumi',
  SPRAY = 'spray',
  WATER = 'water'
}

export enum PaperType {
  RICE = 'rice',
  CANVAS = 'canvas',
  WATERCOLOR = 'watercolor',
  SMOOTH = 'smooth'
}

export interface SimulationParams {
  brushSize: number;
  waterAmount: number;
  inkAmount: number;
  color: { h: number; s: number; b: number };
  dryingSpeed: number;
  viscosity: number;
  paperResist: number;
  inkWeight: number;
  brushType: BrushType;
}

export interface PaperParams {
  type: PaperType;
  roughness: number;
  contrast: number;
  align: number;
  resolution: 256 | 512 | 1024;
}

export interface LiveState {
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export interface AIOperationState {
  type: 'slider' | 'action' | 'color';
  label: string;
  value?: number | string | boolean;
  min?: number;
  max?: number;
  icon?: 'brush' | 'water' | 'settings' | 'trash' | 'eye' | 'refresh' | 'physics' | 'palette';
  autoClear?: boolean;
}

export interface ToolHandler {
  updateSimulation: (params: Partial<SimulationParams>) => void;
  updatePaper: (params: Partial<PaperParams>) => void;
  setColor: (h: number, s: number, b: number) => void;
  switchTab: (tab: 'paint' | 'brushes' | 'physics' | 'paper') => void;
  controlApp: (action: 'clear' | 'regenerate' | 'toggleView' | 'undo' | 'redo') => void;
  importImage: (base64: string, clearFirst?: boolean) => void;
  notifyAiState: (label: string, icon?: AIOperationState['icon'], autoClear?: boolean) => void;
  getParams: () => SimulationParams;
  getPaperParams: () => PaperParams;
}

export type ActionType = 'input' | 'param_change' | 'paper_change' | 'clear' | 'regen_paper' | 'toggle_view';

export interface RecordedAction {
  timestamp: number;
  type: ActionType;
  data?: any;
}

export type RecordingState = 'idle' | 'recording' | 'playing';

export interface SimulationArrays {
  f: Float32Array;
  rho: Float32Array;
  ux: Float32Array;
  uy: Float32Array;
  fibers: Float32Array;
  cFloating: Float32Array;
  mFloating: Float32Array;
  yFloating: Float32Array;
  cFixed: Float32Array;
  mFixed: Float32Array;
  yFixed: Float32Array;
}

export interface Snapshot {
  arrays: SimulationArrays;
  params: SimulationParams;
  paperParams: PaperParams;
}