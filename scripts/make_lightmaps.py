#!/usr/bin/env python3
"""Mood lighting: for every shot with `mood` in src/shots.json, find its light sources (lamps, candles, lit windows,
fire: bright, warm, saturated pixels) in the image the shot shows, and write
  public/light/NN-glow.png  black RGB with a warm bloom around each light (screen-blended over the shot), and
  public/light/NN-dark.png  black with alpha = how much to darken (lights cut out), used as a CSS mask.
`--stats` prints {NN: {lit}} (fraction of the frame detected as light) without writing files."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

def light_mask(img):
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    # lamp/candle/window light is YELLOW (green close to red), bright, saturated, and brighter than its surroundings;
    # orange wood and peach walls fail the yellowness or the local-contrast test
    yellow = (g >= 0.72 * r) & (b <= 0.62 * g) & (mx >= 0.9) & (sat >= 0.4)
    v = Image.fromarray((mx * 255).astype(np.uint8))
    local = mx - np.asarray(v.filter(ImageFilter.GaussianBlur(18)), dtype=np.float32) / 255
    white = (mn > 0.93) & (sat < 0.12) & (mx > 0.97) & (local > 0.08)
    # coloured bulbs (tree lights): small, saturated, locally bright blobs of ANY hue
    cand = (sat > 0.5) & (mx > 0.7) & (local > 0.08)
    lab, n = ndimage.label(cand)
    if n:
        area = ndimage.sum(cand, lab, range(1, n + 1))
        small = np.isin(lab, np.nonzero((area >= 4) & (area <= 900))[0] + 1)
    else:
        small = np.zeros_like(cand)
    return ((yellow & (local > 0.03)) | white | small).astype(np.float32)

def blur(m, s):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s)), dtype=np.float32) / 255

def maps(img):
    m = light_mask(img)
    near, wide = blur(m, 14), blur(m, 48)
    glow = np.clip(near * 1.6 + wide * 1.2, 0, 1)
    warm = np.array([1.0, 0.78, 0.46], dtype=np.float32)
    glow_rgb = (glow[..., None] * warm * 255).astype(np.uint8)
    open_ = np.clip(near * 2.2 + wide * 2.6, 0, 1)                   # how much each pixel is lit by a nearby light
    dark = np.zeros((*m.shape, 4), np.uint8); dark[..., 3] = ((1 - open_) * 255).astype(np.uint8)
    return m, Image.fromarray(glow_rgb), Image.fromarray(dark, 'RGBA')

def hue_counts(img, m):
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    on = m > 0
    return {'red': int((on & (r > g + 0.25) & (r > b + 0.25)).sum()), 'green': int((on & (g > r + 0.15) & (g > b + 0.1)).sum()),
            'blue': int((on & (b > r + 0.2) & (b > g + 0.05)).sum()), 'yellow': int((on & (r > 0.8) & (g > 0.7) & (b < 0.55)).sum())}

def main():
    if '--hues' in sys.argv:   # debugging/tests: which colours of light are detected in one shot
        s = next(x for x in json.load(open('src/shots.json')) if x['id'] == sys.argv[sys.argv.index('--hues') + 1])
        img = Image.open('public/' + (s['plate'] if s.get('plate') else s['still'])); print(json.dumps(hue_counts(img, light_mask(img)))); return
    shots = [s for s in json.load(open('src/shots.json')) if 'mood' in s]
    stats, out = {}, Path('public/light'); out.mkdir(parents=True, exist_ok=True)
    for s in shots:
        src = 'public/' + (s['plate'] if s.get('plate') else s['still'])
        m, glow, dark = maps(Image.open(src))
        stats[s['id']] = {'lit': round(float(m.mean()), 4)}
        if '--stats' not in sys.argv:
            glow.save(out / f"{s['id']}-glow.png"); dark.save(out / f"{s['id']}-dark.png")
    print(json.dumps(stats))

if __name__ == '__main__':
    main()
