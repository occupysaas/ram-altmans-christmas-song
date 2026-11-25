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
# 54: the town with its sky keyed out (plates/54-front.png), redrawn over the cut-out tower so the mansion sits behind it
pl = np.asarray(Image.open('public/plates/54.png').convert('RGB')).astype(np.float32) / 255
r, g, b = pl[..., 0], pl[..., 1], pl[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
sky = (b > r + 0.04) & (lum < 0.42) & (np.arange(pl.shape[0])[:, None] < pl.shape[0] * 0.8)
sky = ndimage.binary_opening(sky, iterations=1)
# the plate still has the old tower painted in: key out everything inside the cut-out tower's own silhouette
# except the houses/trees in front of it (the bottom band below the tower's foot)
T = idx['54/tower']; tw = np.asarray(Image.open('public/sprites/layers/54/tower.png').getchannel('A')) > 40
tower = np.zeros(sky.shape, bool); tower[T['y']:T['y'] + T['h'], T['x']:T['x'] + T['w']] = tw
tower = ndimage.binary_dilation(tower, iterations=6); tower[int(0.56 * pl.shape[0]):] = False
sky |= tower
alpha = np.asarray(Image.fromarray(((~sky) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))
Image.fromarray(np.dstack([(pl * 255).astype('uint8'), alpha]), 'RGBA').save('public/plates/54-front.png')
# 23: the town with its sky keyed out (plates/23-front.png), redrawn over the cut-out factory so the houses stay in front
pl = np.asarray(Image.open('public/plates/23.png').convert('RGB')).astype(np.float32) / 255
r, g, b = pl[..., 0], pl[..., 1], pl[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
sky = ndimage.binary_opening((b > r + 0.04) & (lum < 0.45) & (np.arange(pl.shape[0])[:, None] < pl.shape[0] * 0.8), iterations=1)
alpha = np.asarray(Image.fromarray(((~sky) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))
Image.fromarray(np.dstack([(pl * 255).astype('uint8'), alpha]), 'RGBA').save('public/plates/23-front.png')
# 06: a building-only mask for the bumping tower layer (its polygon ∩ not-sky), so the horns behind it show
from PIL import ImageDraw
st = np.asarray(Image.open('public/stills/06.png').convert('RGB')).astype(np.float32) / 255
r, g, b = st[..., 0], st[..., 1], st[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
sky = ndimage.binary_opening((b > r + 0.03) & (lum < 0.45), iterations=2)
poly = json.loads(Path('docs/towers.json').read_text())['06']['poly']
pm = Image.new('L', (st.shape[1], st.shape[0])); ImageDraw.Draw(pm).polygon([(x * st.shape[1], y * st.shape[0]) for x, y in poly], fill=255)
keep = (np.asarray(pm) > 0) & ~sky
a06 = Image.fromarray((keep * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))   # CSS masks read ALPHA
m06 = Image.new('RGBA', a06.size, (0, 0, 0, 0)); m06.putalpha(a06); m06.save('public/plates/06-towermask.png')
idx_path.write_text(json.dumps(idx, indent=1) + '\n')
print(idx['07/chair-back'], idx['18/tag'])
