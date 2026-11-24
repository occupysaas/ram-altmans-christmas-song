#!/usr/bin/env bash
# Render programme frames at the given times (seconds) and tile them: scripts/frames.sh OUT.jpg t1 t2 ...
set -euo pipefail
cd "$(dirname "$0")/.."
out=$1; shift
node scripts/bundle.mjs > /dev/null
tmp=$(mktemp -d); i=0
for t in "$@"; do
  f=$(python3 -c "print(round($t*24))")
  npx remotion still out/bundle Animatic "$tmp/$i.png" --frame=$f --gl=angle-egl --browser-executable=/usr/bin/chromium \
    --chrome-mode=chrome-for-testing --scale=0.5 --log=error > /dev/null
  i=$((i+1))
done
n=$i; cols=$(( n < 4 ? n : 4 ))
ffmpeg -v error -y -pattern_type glob -i "$tmp/*.png" -vf "tile=${cols}x$(( (n + cols - 1) / cols ))" -frames:v 1 "$out" 2>/dev/null || \
  ffmpeg -v error -y $(for j in $(seq 0 $((n-1))); do echo -i $tmp/$j.png; done) -filter_complex "hstack=inputs=$n" "$out"
rm -rf "$tmp"
