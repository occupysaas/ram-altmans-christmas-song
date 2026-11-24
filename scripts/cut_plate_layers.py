#!/usr/bin/env python3
"""Cut pieces out of clean plates as layers (added to public/sprites/layers/layers.json):
07/chair-back (redrawn in front of Sam) and 18/tag (the blank gift tag, drawn enlarged)."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

idx_path = Path('public/sprites/layers/layers.json'); idx = json.loads(idx_path.read_text())

def save(key, rgb, mask, x0, y0):
    im = Image.fromarray(np.dstack([rgb.astype('uint8'), mask.astype('uint8')]), 'RGBA'); bb = im.getbbox()
    im.crop(bb).save(f'public/sprites/layers/{key}.png')
    idx[key] = {'x': x0 + bb[0], 'y': y0 + bb[1], 'w': bb[2] - bb[0], 'h': bb[3] - bb[1]}

# 07: the red-brown chair back
pl = np.asarray(Image.open('public/plates/07.png').convert('RGB')).astype(int)
x0, y0, x1, y1 = 600, 720, 950, 1000
c = pl[y0:y1, x0:x1]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
red = (r > g * 1.35) & (r > b * 1.3) & (r > 90)
m = np.asarray(Image.fromarray((red * 255).astype('uint8')).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(3))) > 0
m &= red | (c.mean(-1) < 90)
save('07/chair-back', c, np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))), x0, y0)

# 18: the tag (flood its paper colour from the centre, fill holes, grow over the ink outline)
pl = np.asarray(Image.open('public/plates/18.png').convert('RGB')).astype(int)
lab, _ = ndimage.label(np.abs(pl - pl[665, 800]).sum(-1) < 40)
paper = ndimage.binary_fill_holes(lab == lab[665, 800])
tag = ndimage.binary_dilation(paper, iterations=9)
mask = np.asarray(Image.fromarray((tag * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.0)))
save('18/tag', pl, mask, 0, 0)
idx_path.write_text(json.dumps(idx, indent=1) + '\n')
print(idx['07/chair-back'], idx['18/tag'])
