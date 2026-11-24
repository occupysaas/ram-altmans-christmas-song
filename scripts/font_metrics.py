#!/usr/bin/env python3
"""Write src/fontMetrics.json: per-font advance widths in em for printable ASCII (+ curly quotes), from public/fonts."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont

FONTS = {
    'IM Fell English': 'IMFellEnglish.ttf', 'IM Fell English Italic': 'IMFellEnglish-Italic.ttf',
    'Mountains of Christmas': 'MountainsOfChristmas-Regular.ttf', 'Mountains of Christmas Bold': 'MountainsOfChristmas-Bold.ttf',
    'Bowlby One': 'BowlbyOne.ttf', 'Berkshire Swash': 'BerkshireSwash.ttf', 'VT323': 'VT323.ttf',
}
CHARS = [chr(c) for c in range(32, 127)] + list('‘’“”—…')
out = {}
for fam, file in FONTS.items():
    f = TTFont(Path('public/fonts') / file)
    upm, cmap, hmtx = f['head'].unitsPerEm, f.getBestCmap(), f['hmtx']
    adv = {c: round(hmtx[cmap[ord(c)]][0] / upm, 4) for c in CHARS if ord(c) in cmap}
    adv['?'] = adv.get('?', 0.5)
    out[fam] = adv
Path('src/fontMetrics.json').write_text(json.dumps(out, indent=1) + '\n')
print({k: round(sum(v.values()) / len(v), 3) for k, v in out.items()})
