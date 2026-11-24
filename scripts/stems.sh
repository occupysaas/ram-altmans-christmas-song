#!/usr/bin/env bash
# Split the song into drums/bass/other/vocals with Demucs → stems/htdemucs/song/*.wav
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python -m demucs -n htdemucs -o stems public/song.wav
