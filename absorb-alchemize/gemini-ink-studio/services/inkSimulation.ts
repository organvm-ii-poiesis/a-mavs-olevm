/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BrushType, PaperType, SimulationArrays } from '../types';

const LATTICE_W = new Float32Array([4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36]);
const cx = new Int8Array([0, 1, 0, -1, 0, 1, -1, -1, 1]);
const cy = new Int8Array([0, 0, 1, 0, -1, 1, 1, -1, -1]);
const opp = new Int8Array([0, 3, 4, 1, 2, 7, 8, 5, 6]);

export class InkSimulation {
    w: number;
    h: number;
    size: number;
    damping: number = 0.99;
    resistanceScale: number = 0.3;
    omega: number = 1.6;
    adsorptionRate: number = 0.05;
    brushType: BrushType = BrushType.ROUND;

    f: Float32Array;
    fNew: Float32Array;
    rho: Float32Array;
    ux: Float32Array;
    uy: Float32Array;
    fibers: Float32Array;
    
    // Color transport (Floating = moving ink, Fixed = absorbed ink)
    cFloating: Float32Array; mFloating: Float32Array; yFloating: Float32Array;
    cFixed: Float32Array; mFixed: Float32Array; yFixed: Float32Array;
    
    // Temp arrays for advection
    tempC: Float32Array; tempM: Float32Array; tempY: Float32Array;

    constructor(width: number, height: number) {
        this.w = width;
        this.h = height;
        this.size = width * height;
        
        this.f = new Float32Array(this.size * 9);
        this.fNew = new Float32Array(this.size * 9);
        this.rho = new Float32Array(this.size);
        this.ux = new Float32Array(this.size);
        this.uy = new Float32Array(this.size);
        this.fibers = new Float32Array(this.size);
        
        this.cFloating = new Float32Array(this.size);
        this.mFloating = new Float32Array(this.size);
        this.yFloating = new Float32Array(this.size);
        this.cFixed = new Float32Array(this.size);
        this.mFixed = new Float32Array(this.size);
        this.yFixed = new Float32Array(this.size);

        this.tempC = new Float32Array(this.size);
        this.tempM = new Float32Array(this.size);
        this.tempY = new Float32Array(this.size);

        this.init();
    }

    init() {
        for (let i = 0; i < this.size; i++) {
            this.rho[i] = 1.0;
            for (let k = 0; k < 9; k++) {
                this.f[i * 9 + k] = LATTICE_W[k];
            }
        }
        // Initial paper generation
        this.generatePaper(PaperType.SMOOTH, 50, 50, 10);
    }

    generatePaper(type: PaperType, roughness: number, contrast: number, align: number) {
        const seed = Math.random() * 100;
        const power = 1.0 + (contrast / 100) * 2.5;
        const alignment = align / 100;

        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const i = y * this.w + x;
                let val = 0;
                
                if (type === PaperType.RICE) {
                    const s = 0.1 + (roughness / 100) * 0.5;
                    const sx = x * s * (1.0 - alignment * 0.5);
                    const sy = y * s * (1.0 + alignment * 0.5);
                    let n = Math.sin(sx + seed) * Math.cos(sy + seed);
                    n += Math.sin(sx * 2.1) * Math.cos(sy * 1.9) * 0.5;
                    n += Math.random() * 0.2;
                    val = (n + 1.5) / 3.0;
                } else if (type === PaperType.CANVAS) {
                    const s = 0.3 + (roughness / 100) * 0.5;
                    const weave = Math.sin(x * s + seed) + Math.sin(y * s + seed);
                    const grain = Math.random() * 0.2;
                    val = (weave + 2 + grain) / 4.5;
                } else if (type === PaperType.WATERCOLOR) {
                    const s = 0.03 + (roughness / 100) * 0.1;
                    let n = Math.sin(x * s + seed) + Math.cos(y * s + seed);
                    n += Math.sin(x * s * 2.5) * 0.3;
                    n += Math.random() * 0.1;
                    val = (n + 2) / 4.0;
                } else {
                    // Smooth
                    val = 0.4 + Math.random() * (roughness / 200);
                }
                
                val = Math.max(0, Math.min(1, val));
                val = Math.pow(val, power);
                this.fibers[i] = val;
            }
        }
    }

    setParams(dryingVal: number, viscVal: number, resistVal: number, weightVal: number) {
        this.damping = 1.0 - (dryingVal * 0.0001);
        const tau = 0.51 + (viscVal / 80.0);
        this.omega = 1.0 / tau;
        this.resistanceScale = resistVal * 0.006;
        this.adsorptionRate = 0.001 + (weightVal * 0.001);
    }

    step() {
        const { w, h, size } = this;
        const w_1 = w - 1;
        const h_1 = h - 1;

        // --- OPTIMIZED STREAMING STEP ---
        // Instead of checking boundaries inside the loop 9 times per pixel, 
        // we process the safe inner region separately from the edges.

        // 1. Safe Inner Region (x=1..w-2, y=1..h-2) - No boundary checks needed
        for (let y = 1; y < h_1; y++) {
            let destIdx = (y * w + 1) * 9; 
            for (let x = 1; x < w_1; x++) {
                // Unroll loop manually for performance or keep loop if V8 optimizes it well. 
                // Using loop for readability, V8 handles this small constant loop well.
                // Center (0,0) - index 0
                this.fNew[destIdx + 0] = this.f[destIdx + 0]; // (0,0) -> same pos
                
                // Neighbors
                const centerBase = (y * w + x) * 9;
                
                // k=1 (1,0) - comes from x-1
                this.fNew[destIdx + 1] = this.f[centerBase - 9 + 1];
                // k=2 (0,1) - comes from y-1
                this.fNew[destIdx + 2] = this.f[centerBase - w*9 + 2];
                // k=3 (-1,0) - comes from x+1
                this.fNew[destIdx + 3] = this.f[centerBase + 9 + 3];
                // k=4 (0,-1) - comes from y+1
                this.fNew[destIdx + 4] = this.f[centerBase + w*9 + 4];
                // k=5 (1,1) - comes from x-1, y-1
                this.fNew[destIdx + 5] = this.f[centerBase - w*9 - 9 + 5];
                // k=6 (-1,1) - comes from x+1, y-1
                this.fNew[destIdx + 6] = this.f[centerBase - w*9 + 9 + 6];
                // k=7 (-1,-1) - comes from x+1, y+1
                this.fNew[destIdx + 7] = this.f[centerBase + w*9 + 9 + 7];
                // k=8 (1,-1) - comes from x-1, y+1
                this.fNew[destIdx + 8] = this.f[centerBase + w*9 - 9 + 8];

                destIdx += 9;
            }
        }

        // 2. Edges (Top and Bottom Rows)
        const processPixel = (x: number, y: number) => {
            const destIdx = (y * w + x) * 9;
            for (let k = 0; k < 9; k++) {
                const px = x - cx[k];
                const py = y - cy[k];
                if (px < 0 || px >= w || py < 0 || py >= h) {
                     this.fNew[destIdx + k] = this.f[destIdx + opp[k]]; // Bounce back
                } else {
                     this.fNew[destIdx + k] = this.f[(py * w + px) * 9 + k];
                }
            }
        };

        for (let x = 0; x < w; x++) {
            processPixel(x, 0);       // Top row
            processPixel(x, h - 1);   // Bottom row
        }

        // 3. Edges (Left and Right Columns, skipping corners already done)
        for (let y = 1; y < h_1; y++) {
            processPixel(0, y);       // Left col
            processPixel(w - 1, y);   // Right col
        }


        // Collision & Macroscopic update
        for (let i = 0; i < size; i++) {
            const baseIdx = i * 9;
            let rho = 0, ux = 0, uy = 0;
            
            // Unrolling standard accumulation loop
            const f0 = this.fNew[baseIdx + 0];
            const f1 = this.fNew[baseIdx + 1];
            const f2 = this.fNew[baseIdx + 2];
            const f3 = this.fNew[baseIdx + 3];
            const f4 = this.fNew[baseIdx + 4];
            const f5 = this.fNew[baseIdx + 5];
            const f6 = this.fNew[baseIdx + 6];
            const f7 = this.fNew[baseIdx + 7];
            const f8 = this.fNew[baseIdx + 8];

            rho = f0 + f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8;
            ux = (f1 + f5 + f8) - (f3 + f6 + f7);
            uy = (f2 + f5 + f6) - (f4 + f7 + f8);
            
            if (rho > 0) { 
                const invRho = 1.0 / rho;
                ux *= invRho; 
                uy *= invRho; 
            }
            
            // Apply fiber resistance
            const r = this.fibers[i] * this.resistanceScale;
            const drag = 1 - r;
            ux *= drag;
            uy *= drag;
            
            this.rho[i] = rho;
            this.ux[i] = ux;
            this.uy[i] = uy;
            
            const u2 = ux * ux + uy * uy;
            const uFactor = -1.5 * u2;
            let evap = (rho > 1.0) ? this.damping : 1.0;
            
            // Helper constants for collision
            const w1_rho = (1/9) * rho;
            const w2_rho = (1/36) * rho;
            const c0 = (4/9) * rho * (1 + uFactor);
            
            // Calculate Equilibrium and Relax
            // k=0
            this.f[baseIdx + 0] = f0 + this.omega * (c0 - f0);
            if(rho>1) this.f[baseIdx] *= evap;

            // Axis directions (weight 1/9)
            const relaxAxis = (k: number, fVal: number, eu: number) => {
                const feq = w1_rho * (1 + 3*eu + 4.5*eu*eu + uFactor);
                let val = fVal + this.omega * (feq - fVal);
                if (rho > 1.0) val *= evap;
                this.f[baseIdx + k] = val;
            };

            relaxAxis(1, f1, ux);
            relaxAxis(2, f2, uy);
            relaxAxis(3, f3, -ux);
            relaxAxis(4, f4, -uy);

            // Diagonal directions (weight 1/36)
            const relaxDiag = (k: number, fVal: number, eu: number) => {
                const feq = w2_rho * (1 + 3*eu + 4.5*eu*eu + uFactor);
                let val = fVal + this.omega * (feq - fVal);
                if (rho > 1.0) val *= evap;
                this.f[baseIdx + k] = val;
            };

            relaxDiag(5, f5, ux + uy);
            relaxDiag(6, f6, -ux + uy);
            relaxDiag(7, f7, -ux - uy);
            relaxDiag(8, f8, ux - uy);
        }

        // Advection of pigments (Inlined for performance)
        const { cFloating, mFloating, yFloating, cFixed, mFixed, yFixed, tempC, tempM, tempY, ux, uy, adsorptionRate, fibers } = this;
        
        // Reset temps
        tempC.fill(0);
        tempM.fill(0);
        tempY.fill(0);

        for (let i = 0; i < size; i++) {
            // Early exit check (optimization)
            const c = cFloating[i];
            const m = mFloating[i];
            const y = yFloating[i];

            if (c < 0.0001 && m < 0.0001 && y < 0.0001) continue;

            const absorb = adsorptionRate * (0.2 + fibers[i]);
            const cAbs = c * absorb;
            const mAbs = m * absorb;
            const yAbs = y * absorb;

            cFixed[i] += cAbs;
            mFixed[i] += mAbs;
            yFixed[i] += yAbs;

            const cRem = c - cAbs;
            const mRem = m - mAbs;
            const yRem = y - yAbs;
            
            if (cRem < 0.0001 && mRem < 0.0001 && yRem < 0.0001) continue;

            // Calculate destination
            const velX = ux[i];
            const velY = uy[i];

            // Fast integer coordinate math
            const x = i % w;
            const yPos = (i / w) | 0;

            const destX = x + velX * 3.5;
            const destY = yPos + velY * 3.5;

            // Fast Path: Fully inside bounds (avoids expensive boundary checks)
            // Using bitwise truncation for speed
            if (destX >= 0 && destX < w_1 && destY >= 0 && destY < h_1) {
                const x0 = destX | 0;
                const y0 = destY | 0;
                const dx = destX - x0;
                const dy = destY - y0;

                const idx = y0 * w + x0;
                const idxRight = idx + 1;
                const idxDown = idx + w;
                const idxDownRight = idx + w + 1;

                const w00 = (1 - dx) * (1 - dy);
                const w10 = dx * (1 - dy);
                const w01 = (1 - dx) * dy;
                const w11 = dx * dy;

                tempC[idx] += cRem * w00; tempM[idx] += mRem * w00; tempY[idx] += yRem * w00;
                tempC[idxRight] += cRem * w10; tempM[idxRight] += mRem * w10; tempY[idxRight] += yRem * w10;
                tempC[idxDown] += cRem * w01; tempM[idxDown] += mRem * w01; tempY[idxDown] += yRem * w01;
                tempC[idxDownRight] += cRem * w11; tempM[idxDownRight] += mRem * w11; tempY[idxDownRight] += yRem * w11;
            } else {
                // Boundary Path (Slow, but safe)
                const x0 = Math.floor(destX);
                const y0 = Math.floor(destY);
                const dx = destX - x0;
                const dy = destY - y0;

                const w00 = (1 - dx) * (1 - dy);
                const w10 = dx * (1 - dy);
                const w01 = (1 - dx) * dy;
                const w11 = dx * dy;

                this.addSafe(x0, y0, cRem * w00, mRem * w00, yRem * w00);
                this.addSafe(x0 + 1, y0, cRem * w10, mRem * w10, yRem * w10);
                this.addSafe(x0, y0 + 1, cRem * w01, mRem * w01, yRem * w01);
                this.addSafe(x0 + 1, y0 + 1, cRem * w11, mRem * w11, yRem * w11);
            }
        }

        // Swap buffers
        this.cFloating = tempC; this.tempC = cFloating;
        this.mFloating = tempM; this.tempM = mFloating;
        this.yFloating = tempY; this.tempY = yFloating;
    }

    addSafe(x: number, y: number, c: number, m: number, yVal: number) {
        if (x >= 0 && x < this.w && y >= 0 && y < this.h) {
            const idx = y * this.w + x;
            this.tempC[idx] += c;
            this.tempM[idx] += m;
            this.tempY[idx] += yVal;
        }
    }

    addInput(x: number, y: number, r: number, water: number, ink: number, red: number, green: number, blue: number, dragVX: number, dragVY: number) {
        const cVal = (1 - red / 255) * ink;
        const mVal = (1 - green / 255) * ink;
        const yVal = (1 - blue / 255) * ink;
        
        const rSq = r * r;
        const sx = Math.max(0, Math.floor(x - r));
        const ex = Math.min(this.w, Math.ceil(x + r));
        const sy = Math.max(0, Math.floor(y - r));
        const ey = Math.min(this.h, Math.ceil(y + r));

        for (let py = sy; py < ey; py++) {
            for (let px = sx; px < ex; px++) {
                const dy = py - y;
                const dx = px - x;
                let inside = false;
                let falloff = 0;

                // Brush Shapes
                if (this.brushType === BrushType.ROUND || this.brushType === BrushType.WATER) {
                    const dSq = dx * dx + dy * dy;
                    if (dSq <= rSq) {
                        inside = true;
                        falloff = Math.max(0, 1.0 - dSq / rSq);
                    }
                } else if (this.brushType === BrushType.FLAT) {
                    const u = (dx + dy) * 0.707;
                    const v = (dy - dx) * 0.707;
                    const val = (u * u) / rSq + (v * v) / (rSq * 0.1);
                    if (val <= 1.0) {
                        inside = true;
                        falloff = 1.0 - val;
                    }
                } else if (this.brushType === BrushType.SUMI) {
                    const dSq = dx * dx + dy * dy;
                    if (dSq <= rSq) {
                        const idx = py * this.w + px;
                        const bristleNoise = (Math.sin(px * 0.8) * Math.cos(py * 0.8)) + 1;
                        const fiber = this.fibers[idx] || 0;
                        if (fiber < 0.6 && bristleNoise > 0.5) {
                            inside = true;
                            falloff = Math.max(0, 1.0 - dSq / rSq);
                        }
                    }
                } else if (this.brushType === BrushType.SPRAY) {
                    const dSq = dx * dx + dy * dy;
                    if (dSq <= rSq) {
                        if (Math.random() > 0.95) {
                            inside = true;
                            falloff = Math.random();
                        }
                    }
                }

                if (inside) {
                    const idx = py * this.w + px;

                    if (this.brushType === BrushType.WATER) {
                        this.rho[idx] += water * falloff * 0.15;
                    } else {
                        this.cFloating[idx] += cVal * falloff * 0.5;
                        this.mFloating[idx] += mVal * falloff * 0.5;
                        this.yFloating[idx] += yVal * falloff * 0.5;
                        this.rho[idx] += water * falloff * 0.08;
                    }

                    if (dragVX !== 0 || dragVY !== 0) {
                        this.ux[idx] += dragVX * 0.1 * falloff;
                        this.uy[idx] += dragVY * 0.1 * falloff;
                    }

                    const maxV = 0.25;
                    this.ux[idx] = Math.max(-maxV, Math.min(maxV, this.ux[idx]));
                    this.uy[idx] = Math.max(-maxV, Math.min(maxV, this.uy[idx]));
                    
                    // Re-eq locally for stability
                    const u = this.ux[idx];
                    const v = this.uy[idx];
                    const rho = this.rho[idx];
                    const u2 = u * u + v * v;
                    const uFactor = -1.5 * u2;
                    
                    for (let k = 0; k < 9; k++) {
                        const eu = (k === 0) ? 0 : (cx[k] * u + cy[k] * v);
                        this.f[idx * 9 + k] = LATTICE_W[k] * rho * (1 + 3 * eu + 4.5 * eu * eu + uFactor);
                    }
                }
            }
        }
    }

    drawSketch(imgData: Uint8ClampedArray, imgW: number, imgH: number) {
        // NOTE: We assume imgData comes from a canvas of the same size as simulation
        // due to external resizing in App.tsx. 
        // imgData is RGBA, so length is w * h * 4.
        
        const { w, h, cFixed, mFixed, yFixed } = this;
        const len = w * h;

        for(let i = 0; i < len; i++) {
            const r = imgData[i * 4];
            const g = imgData[i * 4 + 1];
            const b = imgData[i * 4 + 2];
            // alpha = imgData[i*4 + 3];

            // 1. Calculate Luminance (0..255)
            const lum = (r + g + b) / 3.0;

            // 2. Invert for Ink. 
            // White paper (255) -> 0 ink. 
            // Black pencil (0) -> 1.0 ink.
            const inkAmount = (255 - lum) / 255.0;

            // 3. Threshold to ignore paper background artifacts
            if (inkAmount > 0.05) {
                // 4. Scale strength. Pencil should be faint.
                const strength = inkAmount * 0.4;
                
                // 5. Add to Fixed pigments (Dry ink).
                // Graphite is neutral gray -> Equal C, M, Y.
                cFixed[i] += strength;
                mFixed[i] += strength;
                yFixed[i] += strength;
            }
        }
    }

    clear() {
        this.cFixed.fill(0); this.cFloating.fill(0);
        this.mFixed.fill(0); this.mFloating.fill(0);
        this.yFixed.fill(0); this.yFloating.fill(0);
        this.rho.fill(1.0); this.ux.fill(0); this.uy.fill(0);
        for (let i = 0; i < this.size * 9; i++) {
            this.f[i] = LATTICE_W[i % 9];
        }
    }

    getSnapshotArrays(): SimulationArrays {
      return {
        f: new Float32Array(this.f),
        rho: new Float32Array(this.rho),
        ux: new Float32Array(this.ux),
        uy: new Float32Array(this.uy),
        fibers: new Float32Array(this.fibers),
        cFloating: new Float32Array(this.cFloating),
        mFloating: new Float32Array(this.mFloating),
        yFloating: new Float32Array(this.yFloating),
        cFixed: new Float32Array(this.cFixed),
        mFixed: new Float32Array(this.mFixed),
        yFixed: new Float32Array(this.yFixed),
      };
    }

    restoreSnapshotArrays(arrays: SimulationArrays) {
      this.f.set(arrays.f);
      this.rho.set(arrays.rho);
      this.ux.set(arrays.ux);
      this.uy.set(arrays.uy);
      this.fibers.set(arrays.fibers);
      this.cFloating.set(arrays.cFloating);
      this.mFloating.set(arrays.mFloating);
      this.yFloating.set(arrays.yFloating);
      this.cFixed.set(arrays.cFixed);
      this.mFixed.set(arrays.mFixed);
      this.yFixed.set(arrays.yFixed);
      
      // Clear temp arrays to prevent ghosting
      this.tempC.fill(0);
      this.tempM.fill(0);
      this.tempY.fill(0);
    }
}