#!/usr/bin/env node
/**
 * Generate ambient audio MP3 files for the Living Pantheon system.
 * Uses raw PCM synthesis piped through ffmpeg for MP3 encoding.
 *
 * Usage: node scripts/generate-ambient-audio.mjs
 * Requires: ffmpeg on PATH
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 44100;
const CHANNELS = 2;
const DURATION = 45; // seconds
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;
const OUTPUT_DIR = join(import.meta.dirname, '..', 'audio', 'ambient');

// Ensure output dir exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create a Float32Array stereo buffer
 */
function createBuffer() {
  return new Float32Array(TOTAL_SAMPLES * CHANNELS);
}

/**
 * Mix a signal into the buffer at given volume
 */
function mix(buffer, signal, volume = 1.0) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] += signal[i] * volume;
  }
}

/**
 * Generate a sine wave (stereo interleaved)
 */
function sine(freq, phase = 0) {
  const buf = createBuffer();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const val = Math.sin(2 * Math.PI * freq * t + phase);
    buf[i * 2] = val;
    buf[i * 2 + 1] = val;
  }
  return buf;
}

/**
 * Generate filtered noise (stereo)
 */
function noise(lpfFreq = 1000, volume = 0.1) {
  const buf = createBuffer();
  const rc = 1.0 / (2 * Math.PI * lpfFreq);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let prevL = 0, prevR = 0;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const rawL = (Math.random() * 2 - 1) * volume;
    const rawR = (Math.random() * 2 - 1) * volume;
    prevL += alpha * (rawL - prevL);
    prevR += alpha * (rawR - prevR);
    buf[i * 2] = prevL;
    buf[i * 2 + 1] = prevR;
  }
  return buf;
}

/**
 * Generate periodic clicks/ticks (stereo)
 */
function ticks(intervalMs, decayMs = 5, volume = 0.3) {
  const buf = createBuffer();
  const intervalSamples = Math.floor((intervalMs / 1000) * SAMPLE_RATE);
  const decaySamples = Math.floor((decayMs / 1000) * SAMPLE_RATE);
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    if (i % intervalSamples < decaySamples) {
      const env = 1 - (i % intervalSamples) / decaySamples;
      const val = env * env * volume * (Math.random() * 0.5 + 0.5);
      buf[i * 2] = val;
      buf[i * 2 + 1] = val;
    }
  }
  return buf;
}

/**
 * Generate crackle/pop sounds (stereo)
 */
function crackle(density = 0.001, volume = 0.15) {
  const buf = createBuffer();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    if (Math.random() < density) {
      const burst = Math.floor(Math.random() * 200) + 50;
      for (let j = 0; j < burst && (i + j) < TOTAL_SAMPLES; j++) {
        const env = 1 - j / burst;
        const val = env * (Math.random() * 2 - 1) * volume;
        buf[(i + j) * 2] = val;
        buf[(i + j) * 2 + 1] = val;
      }
    }
  }
  return buf;
}

/**
 * Apply a crossfade loop envelope (fade first/last 500ms)
 */
function applyLoopEnvelope(buf) {
  const fadeSamples = Math.floor(0.5 * SAMPLE_RATE);
  for (let i = 0; i < fadeSamples; i++) {
    const env = i / fadeSamples;
    buf[i * 2] *= env;
    buf[i * 2 + 1] *= env;
  }
  for (let i = 0; i < fadeSamples; i++) {
    const idx = TOTAL_SAMPLES - 1 - i;
    const env = i / fadeSamples;
    buf[idx * 2] *= env;
    buf[idx * 2 + 1] *= env;
  }
}

/**
 * Normalize buffer to target peak dB
 */
function normalize(buf, targetDb = -4) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    peak = Math.max(peak, Math.abs(buf[i]));
  }
  if (peak === 0) return;
  const targetPeak = Math.pow(10, targetDb / 20);
  const gain = targetPeak / peak;
  for (let i = 0; i < buf.length; i++) {
    buf[i] *= gain;
  }
}

/**
 * Convert Float32 to 16-bit PCM for ffmpeg
 */
function toInt16(buf) {
  const out = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const clamped = Math.max(-1, Math.min(1, buf[i]));
    const val = Math.round(clamped * 32767);
    out.writeInt16LE(val, i * 2);
  }
  return out;
}

/**
 * Encode buffer to MP3 using ffmpeg
 */
function encodeToMp3(buf, filename) {
  applyLoopEnvelope(buf);
  normalize(buf, -4);
  const pcm = toInt16(buf);
  const outPath = join(OUTPUT_DIR, filename);
  const tmpPath = join(OUTPUT_DIR, `_tmp_${filename}.raw`);

  writeFileSync(tmpPath, pcm);

  try {
    execSync(
      `ffmpeg -y -f s16le -ar ${SAMPLE_RATE} -ac ${CHANNELS} -i "${tmpPath}" ` +
      `-codec:a libmp3lame -b:a 192k -q:a 2 "${outPath}"`,
      { stdio: 'pipe' }
    );
    execSync(`rm "${tmpPath}"`, { stdio: 'pipe' });
    console.log(`  Created: ${filename}`);
  } catch (err) {
    console.error(`  FAILED: ${filename}`, err.message);
    try { execSync(`rm "${tmpPath}"`, { stdio: 'pipe' }); } catch {}
  }
}

// ── Audio generators ───────────────────────────────────────────────

function templeDrone() {
  const buf = createBuffer();
  mix(buf, sine(55), 0.4);          // A1 fundamental
  mix(buf, sine(82.5), 0.2);        // E2 fifth
  mix(buf, sine(110, 0.1), 0.15);   // A2 octave
  mix(buf, noise(120, 0.08), 1.0);  // Low rumble
  return buf;
}

function scholarlyHum() {
  const buf = createBuffer();
  mix(buf, sine(110), 0.25);        // Warm pad fundamental
  mix(buf, sine(165), 0.1);         // Fifth above
  mix(buf, sine(220), 0.08);        // Octave
  mix(buf, noise(300, 0.04), 1.0);  // Air/room tone
  return buf;
}

function paperRustle() {
  const buf = createBuffer();
  mix(buf, noise(2000, 0.06), 1.0); // Paper texture (high-passed noise)
  mix(buf, sine(80), 0.1);          // Subtle pad
  mix(buf, crackle(0.0003, 0.08), 1.0); // Occasional rustles
  return buf;
}

function hearthCrackle() {
  const buf = createBuffer();
  mix(buf, noise(600, 0.08), 1.0);  // Fire base
  mix(buf, crackle(0.002, 0.2), 1.0); // Crackle pops
  mix(buf, sine(65), 0.15);         // Warm low hum
  return buf;
}

function galleryEcho() {
  const buf = createBuffer();
  mix(buf, noise(400, 0.03), 1.0);  // Room tone
  mix(buf, sine(220), 0.05);        // Subtle resonance
  mix(buf, sine(330), 0.03);        // Harmonic
  // Sparse reverb-like echoes
  const echoes = createBuffer();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    if (Math.random() < 0.00005) {
      const decay = Math.floor(Math.random() * SAMPLE_RATE * 0.3);
      for (let j = 0; j < decay && (i + j) < TOTAL_SAMPLES; j++) {
        const env = 1 - j / decay;
        const val = env * env * 0.06 * Math.sin(2 * Math.PI * 440 * j / SAMPLE_RATE);
        echoes[(i + j) * 2] += val;
        echoes[(i + j) * 2 + 1] += val * 0.8;
      }
    }
  }
  mix(buf, echoes, 1.0);
  return buf;
}

function concertHall() {
  const buf = createBuffer();
  // Rich string pad chord (A minor)
  mix(buf, sine(220), 0.2);   // A3
  mix(buf, sine(261.6), 0.12);// C4
  mix(buf, sine(329.6), 0.1); // E4
  mix(buf, sine(440), 0.06);  // A4
  mix(buf, noise(500, 0.02), 1.0); // Hall air
  return buf;
}

function stageAmbience() {
  const buf = createBuffer();
  mix(buf, sine(146.8), 0.15);  // D3 dramatic
  mix(buf, sine(174.6), 0.1);   // F3 minor
  mix(buf, sine(220), 0.08);    // A3
  mix(buf, noise(800, 0.03), 1.0); // Stage air
  // Occasional distant rustling
  mix(buf, crackle(0.0002, 0.04), 1.0);
  return buf;
}

function crowdMurmur() {
  const buf = createBuffer();
  // Multiple layers of filtered noise to simulate voices
  mix(buf, noise(1200, 0.06), 1.0);
  mix(buf, noise(2500, 0.04), 1.0);
  mix(buf, noise(800, 0.05), 1.0);
  // Subtle activity sounds
  mix(buf, crackle(0.0005, 0.03), 1.0);
  return buf;
}

function conversation() {
  const buf = createBuffer();
  // Intimate murmur - tighter frequency bands
  mix(buf, noise(1500, 0.05), 1.0);
  mix(buf, noise(2000, 0.03), 1.0);
  mix(buf, sine(95), 0.06);  // Warm room tone
  // Wine glass clink-like accents
  const clinks = createBuffer();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    if (Math.random() < 0.00003) {
      const decay = Math.floor(Math.random() * 4000) + 2000;
      for (let j = 0; j < decay && (i + j) < TOTAL_SAMPLES; j++) {
        const env = Math.exp(-j / (decay * 0.3));
        const val = env * 0.04 * Math.sin(2 * Math.PI * 3200 * j / SAMPLE_RATE);
        clinks[(i + j) * 2] += val;
        clinks[(i + j) * 2 + 1] += val;
      }
    }
  }
  mix(buf, clinks, 1.0);
  return buf;
}

function machineHum() {
  const buf = createBuffer();
  mix(buf, sine(60), 0.3);           // 60Hz mains hum
  mix(buf, sine(120), 0.15);         // 2nd harmonic
  mix(buf, sine(180), 0.05);         // 3rd harmonic
  mix(buf, noise(200, 0.06), 1.0);   // Machinery rumble
  // Periodic mechanical accent
  mix(buf, ticks(3000, 80, 0.05), 1.0);
  return buf;
}

function clockTick() {
  const buf = createBuffer();
  // Main clock tick - every 1000ms
  mix(buf, ticks(1000, 8, 0.3), 1.0);
  // Secondary softer tick offset
  const secondary = createBuffer();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const offset = Math.floor(SAMPLE_RATE * 0.5); // 500ms offset
    const j = (i + offset) % TOTAL_SAMPLES;
    const interval = Math.floor(SAMPLE_RATE); // 1s
    if (j % interval < Math.floor(0.005 * SAMPLE_RATE)) {
      const env = 1 - (j % interval) / Math.floor(0.005 * SAMPLE_RATE);
      secondary[i * 2] = env * 0.1 * (Math.random() * 0.5 + 0.5);
      secondary[i * 2 + 1] = env * 0.1 * (Math.random() * 0.5 + 0.5);
    }
  }
  mix(buf, secondary, 1.0);
  // Very subtle room pad
  mix(buf, sine(73.4), 0.04);  // D2 - time passing
  mix(buf, noise(150, 0.02), 1.0);
  return buf;
}

// ── Main ───────────────────────────────────────────────────────────

const tracks = [
  ['temple-drone.mp3', templeDrone],
  ['scholarly-hum.mp3', scholarlyHum],
  ['paper-rustle.mp3', paperRustle],
  ['hearth-crackle.mp3', hearthCrackle],
  ['gallery-echo.mp3', galleryEcho],
  ['concert-hall.mp3', concertHall],
  ['stage-ambience.mp3', stageAmbience],
  ['crowd-murmur.mp3', crowdMurmur],
  ['conversation.mp3', conversation],
  ['machine-hum.mp3', machineHum],
  ['clock-tick.mp3', clockTick],
];

console.log(`Generating ${tracks.length} ambient audio files...`);
console.log(`  Sample rate: ${SAMPLE_RATE} Hz`);
console.log(`  Duration: ${DURATION}s`);
console.log(`  Output: ${OUTPUT_DIR}\n`);

for (const [filename, generator] of tracks) {
  const buf = generator();
  encodeToMp3(buf, filename);
}

console.log('\nDone!');
