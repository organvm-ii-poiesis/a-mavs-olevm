#!/bin/bash

# OGOD Stem Processing Script
# Uses Demucs to separate audio tracks into stems (drums, bass, vocals, other)
#
# Prerequisites:
#   pip install demucs
#
# Usage:
#   ./scripts/process-stems.sh [track_number]
#   ./scripts/process-stems.sh          # Process all tracks
#   ./scripts/process-stems.sh 1        # Process only track 1

set -e

# Configuration
INPUT_DIR="ogod/ogodtracks"
OUTPUT_DIR="assets/audio/stems/ogod"
MODEL="htdemucs"  # High-quality model

# Roman numeral mapping
declare -a ROMAN=("" "I" "II" "III" "IV" "V" "VI" "VII" "VIII" "IX" "X"
                  "XI" "XII" "XIII" "XIV" "XV" "XVI" "XVII" "XVIII" "XIX" "XX"
                  "XXI" "XXII" "XXIII" "XXIV" "XXV" "XXVI" "XXVII" "XXVIII" "XXIX")

# Create output directory
mkdir -p "$OUTPUT_DIR"

process_track() {
    local track_num=$1
    local padded=$(printf "%02d" $track_num)
    local roman=${ROMAN[$track_num]}
    local input_file="$INPUT_DIR/${padded} ${roman}.mp3"
    local output_subdir="$OUTPUT_DIR/$padded"

    if [ ! -f "$input_file" ]; then
        echo "Warning: Track $track_num not found at $input_file"
        return 1
    fi

    echo "Processing Track $track_num ($roman)..."
    echo "  Input: $input_file"
    echo "  Output: $output_subdir"

    # Create output subdirectory
    mkdir -p "$output_subdir"

    # Run Demucs
    demucs -n "$MODEL" "$input_file" -o "$output_subdir"

    # Rename output files (Demucs creates a subdirectory with model name)
    local demucs_output="$output_subdir/$MODEL/${padded} ${roman}"
    if [ -d "$demucs_output" ]; then
        mv "$demucs_output"/*.mp3 "$output_subdir/" 2>/dev/null || \
        mv "$demucs_output"/*.wav "$output_subdir/" 2>/dev/null || true
        rm -rf "$output_subdir/$MODEL"
    fi

    echo "  Done!"
    return 0
}

# Check if Demucs is installed
if ! command -v demucs &> /dev/null; then
    echo "Error: Demucs is not installed."
    echo "Install with: pip install demucs"
    exit 1
fi

# Process tracks
if [ -n "$1" ]; then
    # Process specific track
    process_track "$1"
else
    # Process all tracks (1-29)
    echo "Processing all OGOD tracks (1-29)..."
    echo "This may take a while..."
    echo ""

    for i in $(seq 1 29); do
        process_track $i || true
    done

    echo ""
    echo "All tracks processed!"
fi

echo ""
echo "Stem files are in: $OUTPUT_DIR"
echo ""
echo "Expected structure per track:"
echo "  drums.mp3 (or .wav)"
echo "  bass.mp3"
echo "  vocals.mp3"
echo "  other.mp3"
