#!/usr/bin/env python3
"""Key the full-frame magenta character layers in public/sprites/layers/NN/ in place (raw copies kept in out/raw/layers/)
and write public/sprites/layers/layers.json: {"NN/name": {"x", "y", "w", "h"}} in still px (1600x1200)."""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from key_magenta import key_magenta

root, raw = Path('public/sprites/layers'), Path('out/raw/layers')
index = json.loads((root / 'layers.json').read_text()) if (root / 'layers.json').exists() else {}
for png in sorted(root.glob('*/*.png')):
    key = f'{png.parent.name}/{png.stem}'
    keep = raw / png.parent.name / png.name
    if not keep.exists():
        keep.parent.mkdir(parents=True, exist_ok=True); shutil.copy(png, keep)
    l, t, r, b = key_magenta(keep, png, frame=True)
    index[key] = {'x': l, 'y': t, 'w': r - l, 'h': b - t}
(root / 'layers.json').write_text(json.dumps(index, indent=1) + '\n')
print(len(index), 'layers')
