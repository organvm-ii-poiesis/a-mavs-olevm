/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BrushType, PaperType, SimulationParams, PaperParams } from './types';

export const ENABLE_STUDIO_TAB = false;

export const DEFAULT_SETTINGS: { simulation: SimulationParams, paper: PaperParams } = {
  simulation: {
    brushSize: 6,
    waterAmount: 85,
    inkAmount: 50,
    color: { h: 240, s: 14, b: 94 },
    dryingSpeed: 25,
    viscosity: 15,
    paperResist: 50,
    inkWeight: 30,
    brushType: BrushType.ROUND
  },
  paper: {
    type: PaperType.SMOOTH,
    roughness: 50,
    contrast: 50,
    align: 10,
    resolution: 512
  }
};