#!/usr/bin/env bash
set -euo pipefail

# ogod-assemble.sh - Assemble OGOD PNG frame sequences + MP3 audio into MP4 video
#
# Usage:
#   ./scripts/ogod-assemble.sh <frames_dir> <audio_file> [output_file] [fps] [crf]
#
# Arguments:
#   frames_dir   Directory containing frame_000000.png, frame_000001.png, etc.
#   audio_file   Path to MP3 audio track
#   output_file  Output MP4 path (default: output.mp4)
#   fps          Frame rate (default: 30)
#   crf          Quality factor, 0-51 lower=better (default: 18)
#
# Examples:
#   ./scripts/ogod-assemble.sh ./export/track01 ./ogod/ogodtracks/01\ I.mp3
#   ./scripts/ogod-assemble.sh ./export/track01 ./audio.mp3 ogod-01.mp4 30 18
#
# Requires: ffmpeg

FRAMES_DIR="${1:?Usage: ogod-assemble.sh <frames_dir> <audio_file> [output_file] [fps] [crf]}"
AUDIO_FILE="${2:?Usage: ogod-assemble.sh <frames_dir> <audio_file> [output_file] [fps] [crf]}"
OUTPUT_FILE="${3:-output.mp4}"
FPS="${4:-30}"
CRF="${5:-18}"

# Verify ffmpeg is available
if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is not installed or not in PATH" >&2
  exit 1
fi

# Verify inputs exist
if [[ ! -d "$FRAMES_DIR" ]]; then
  echo "Error: Frames directory does not exist: $FRAMES_DIR" >&2
  exit 1
fi

if [[ ! -f "$AUDIO_FILE" ]]; then
  echo "Error: Audio file does not exist: $AUDIO_FILE" >&2
  exit 1
fi

# Count frames
FRAME_COUNT=$(find "$FRAMES_DIR" -name 'frame_*.png' | wc -l | tr -d ' ')
if [[ "$FRAME_COUNT" -eq 0 ]]; then
  echo "Error: No frame_*.png files found in $FRAMES_DIR" >&2
  exit 1
fi

echo "Assembling $FRAME_COUNT frames @ ${FPS}fps with CRF ${CRF}"
echo "  Frames: $FRAMES_DIR/frame_%06d.png"
echo "  Audio:  $AUDIO_FILE"
echo "  Output: $OUTPUT_FILE"

ffmpeg -y \
  -framerate "$FPS" \
  -i "$FRAMES_DIR/frame_%06d.png" \
  -i "$AUDIO_FILE" \
  -c:v libx264 -crf "$CRF" -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -shortest \
  "$OUTPUT_FILE"

echo "Done: $OUTPUT_FILE"
