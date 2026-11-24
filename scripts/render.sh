#!/usr/bin/env bash
# Render the Remotion programme (960x720, 24 fps, with the song) to out/programme.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
node scripts/bundle.mjs
npx remotion render out/bundle Animatic out/programme.mp4 --codec=h264 --crf=16 --concurrency=4 --gl=angle-egl \
  --disable-shared-memory-capture --browser-executable=/usr/bin/chromium --chrome-mode=chrome-for-testing "$@"
