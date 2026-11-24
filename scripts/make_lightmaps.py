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
    return ((yellow & (local > 0.03)) | white).astype(np.float32)

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

def main():
    shots = [s for s in json.load(open('src/shots.json')) if s.get('mood')]
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
