#!/usr/bin/env bash
# out/programme.mp4 → out/animatic.mp4 (CRT, console TV, SFX). See scripts/finish.py.
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python -I scripts/make_sfx.py
.venv/bin/python -I scripts/finish.py "$@"
