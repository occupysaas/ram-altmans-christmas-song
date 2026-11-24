#!/usr/bin/env bash
# Contact sheets: 8 evenly spaced frames per section of out/animatic.mp4 → out/sheets/<section>.png
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/sheets
python3 - <<'PY'
import json, subprocess
for s in json.load(open('src/timing/sections.json')):
    ts = [s['start'] + (s['end'] - s['start']) * (i + 0.5) / 8 for i in range(8)]
    name = s['name'].lower().replace(' ', '-')
    ins = sum((['-ss', f'{t:.3f}', '-i', 'out/animatic.mp4'] for t in ts), [])
    f = ''.join(f'[{i}:v]scale=640:360,drawtext=text=\'{t:.1f}s\':x=8:y=8:fontcolor=white:fontsize=22:box=1:boxcolor=black@0.5[v{i}];' for i, t in enumerate(ts))
    f += ''.join(f'[v{i}]' for i in range(8)) + 'xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', f, '-frames:v', '1', f'out/sheets/{name}.png'], check=True)
    print('out/sheets/' + name + '.png')
PY
