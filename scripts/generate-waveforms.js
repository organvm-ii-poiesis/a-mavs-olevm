#!/usr/bin/env node

/**
 * @file generate-waveforms.js
 * @description Generate waveform JSON files from audio files for the ETCETER4 media system.
 *
 * This script requires the audiowaveform CLI tool:
 * - macOS: brew install audiowaveform
 * - Linux: apt install audiowaveform
 * - Windows: Download from https://github.com/bbc/audiowaveform/releases
 *
 * Usage:
 *   node scripts/generate-waveforms.js <input-dir> <output-dir>
 *   node scripts/generate-waveforms.js ./media/audio/albums/ogod ./media/audio/albums/ogod
 *
 * The script will:
 * 1. Find all .mp3, .flac, .wav, .ogg files in the input directory
 * 2. Generate a waveform JSON file for each audio file
 * 3. Output files as <filename>-waveform.json
 *
 * Output JSON format:
 * {
 *   "version": 2,
 *   "channels": 1,
 *   "sample_rate": 44100,
 *   "samples_per_pixel": 256,
 *   "bits": 8,
 *   "length": 1234,
 *   "data": [0.1, 0.2, 0.3, ...]
 * }
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Samples per pixel - affects waveform resolution
  // Lower = more detail, higher = less detail
  samplesPerPixel: 256,

  // Bit depth for waveform (8 = smaller files, 16 = more precision)
  bits: 8,

  // Target width in pixels (0 = auto based on audio duration)
  // Recommend ~800-1200 for responsive playback
  pixels: 1000,

  // Supported audio formats
  audioExtensions: ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'],
};

/**
 * Check if audiowaveform CLI is installed
 */
function checkDependencies() {
  try {
    execSync('audiowaveform --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('Error: audiowaveform CLI is not installed.');
    console.error('Install it with:');
    console.error('  macOS: brew install audiowaveform');
    console.error('  Linux: apt install audiowaveform');
    console.error(
      '  Windows: Download from https://github.com/bbc/audiowaveform/releases'
    );
    return false;
  }
}

/**
 * Find all audio files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of file paths
 */
function findAudioFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.error(`Error: Directory not found: ${dir}`);
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findAudioFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.audioExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Generate waveform JSON for an audio file
 * @param {string} inputPath - Path to audio file
 * @param {string} outputPath - Path for output JSON file
 * @returns {Promise<boolean>} Success status
 */
function generateWaveform(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i',
      inputPath,
      '-o',
      outputPath,
      '--pixels-per-second',
      '50',
      '--bits',
      String(CONFIG.bits),
      '--output-format',
      'json',
    ];

    console.log(`  Processing: ${path.basename(inputPath)}`);

    const proc = spawn('audiowaveform', args);

    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        // Post-process the JSON to normalize peaks
        try {
          const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
          const normalizedData = normalizeWaveform(data);
          fs.writeFileSync(outputPath, JSON.stringify(normalizedData, null, 2));
          console.log(`    -> ${path.basename(outputPath)}`);
          resolve(true);
        } catch (err) {
          console.error(`    Error normalizing waveform: ${err.message}`);
          resolve(true); // Still consider it a success if raw output was generated
        }
      } else {
        console.error(`    Error (exit code ${code}): ${stderr}`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error(`    Error spawning audiowaveform: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Normalize waveform data to 0-1 range
 * @param {Object} data - Raw audiowaveform JSON output
 * @returns {Object} Normalized data
 */
function normalizeWaveform(data) {
  if (!data.data || !Array.isArray(data.data)) {
    return data;
  }

  // audiowaveform outputs interleaved min/max pairs
  // Convert to single normalized peaks for simpler visualization
  const peaks = [];
  const rawData = data.data;

  // Find max absolute value for normalization
  let maxVal = 0;
  for (let i = 0; i < rawData.length; i++) {
    const absVal = Math.abs(rawData[i]);
    if (absVal > maxVal) {
      maxVal = absVal;
    }
  }

  // Convert min/max pairs to single peaks (use max of absolute values)
  for (let i = 0; i < rawData.length; i += 2) {
    const min = rawData[i];
    const max = rawData[i + 1];
    const peak = Math.max(Math.abs(min), Math.abs(max));
    peaks.push(maxVal > 0 ? peak / maxVal : 0);
  }

  return {
    version: data.version || 2,
    channels: data.channels || 1,
    sampleRate: data.sample_rate,
    samplesPerPixel: data.samples_per_pixel,
    bits: data.bits,
    duration: data.length
      ? data.length / (data.sample_rate / data.samples_per_pixel)
      : null,
    peaks: peaks,
    length: peaks.length,
  };
}

/**
 * Generate output path for waveform file
 * @param {string} audioPath - Path to audio file
 * @param {string} outputDir - Output directory
 * @returns {string} Output path for waveform JSON
 */
function getOutputPath(audioPath, outputDir) {
  const basename = path.basename(audioPath, path.extname(audioPath));
  return path.join(outputDir, `${basename}-waveform.json`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node scripts/generate-waveforms.js <input-dir> [output-dir]');
    console.log('');
    console.log('Arguments:');
    console.log('  input-dir   Directory containing audio files');
    console.log('  output-dir  Directory for waveform JSON files (default: same as input)');
    console.log('');
    console.log('Example:');
    console.log(
      '  node scripts/generate-waveforms.js ./media/audio/albums/ogod'
    );
    process.exit(1);
  }

  const inputDir = args[0];
  const outputDir = args[1] || inputDir;

  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find audio files
  console.log(`\nScanning for audio files in: ${inputDir}`);
  const audioFiles = findAudioFiles(inputDir);

  if (audioFiles.length === 0) {
    console.log('No audio files found.');
    process.exit(0);
  }

  console.log(`Found ${audioFiles.length} audio file(s)\n`);

  // Generate waveforms
  let successCount = 0;
  let failCount = 0;

  for (const audioFile of audioFiles) {
    const outputPath = getOutputPath(audioFile, outputDir);

    // Skip if waveform already exists (unless --force flag)
    if (fs.existsSync(outputPath) && !args.includes('--force')) {
      console.log(`  Skipping (exists): ${path.basename(audioFile)}`);
      successCount++;
      continue;
    }

    const success = await generateWaveform(audioFile, outputPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Processed: ${audioFiles.length} file(s)`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  process.exit(failCount > 0 ? 1 : 0);
}

// Run main function
main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
