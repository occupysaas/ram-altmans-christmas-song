#!/usr/bin/env python3
"""Remove a flat magenta backdrop, despill edges, and crop with transparent padding.

Usage: python scripts/key_magenta.py INPUT OUTPUT [--width 300] [--margin 20]
Requires Pillow and numpy. Width includes the transparent margin; aspect is kept.
"""

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def key_magenta(source, destination, width=None, margin=20, warm_glow=False):
    image = Image.open(source).convert("RGBA")
    pixels = np.asarray(image, dtype=np.float32) / 255.0
    rgb = pixels[:, :, :3]
    red, green, blue = np.moveaxis(rgb, -1, 0)
    # Estimate nearby foreground colors on a small grid, then solve C=aF+(1-a)K.
    # This also recovers yellow rays mixed with magenta, without pink fringes.
    spill = np.maximum(0.0, np.minimum(red, blue) - green)
    backdrop = (red > 0.90) & (blue > 0.90) & (green < 0.12)
    small = np.asarray(image.convert("RGB").resize((160, 160)), dtype=np.float32) / 255
    known = (np.minimum(small[:, :, 0], small[:, :, 2]) - small[:, :, 1]) < 0.04
    if not known.any():
        raise ValueError("No non-magenta foreground colors found")
    queue = deque(zip(*np.nonzero(known)))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= ny < 160 and 0 <= nx < 160 and not known[ny, nx]:
                small[ny, nx] = small[y, x]
                known[ny, nx] = True
                queue.append((ny, nx))
    foreground = np.asarray(Image.fromarray(np.rint(small * 255).astype(np.uint8)).resize(image.size, Image.Resampling.NEAREST), dtype=np.float32) / 255
    key = np.array([1.0, 0.0, 1.0], dtype=np.float32)
    direction = foreground - key
    estimated = np.clip(np.sum((rgb-key)*direction, axis=2) / np.maximum(np.sum(direction*direction, axis=2), 0.001), 0, 1)
    # Lavender snow/metal is real artwork. Only highly saturated magenta is
    # background contamination; do not unmix muted purple interior paint.
    coverage = np.where(spill > 0.25, estimated, 1.0)
    coverage[backdrop] = 0.0
    rgb -= (1.0 - coverage[:, :, None]) * key
    rgb /= np.maximum(coverage[:, :, None], 1.0 / 255.0)
    residual = np.maximum(0, np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1])
    residual *= coverage < 0.98
    rgb[:, :, 0] -= residual
    rgb[:, :, 2] -= residual
    pixels[:, :, :3] = np.clip(rgb, 0.0, 1.0)
    pixels[:, :, 3] *= coverage
    pixels[pixels[:, :, 3] < 0.025] = 0
    keyed = Image.fromarray(np.rint(pixels * 255).astype(np.uint8))
    bounds = keyed.getbbox()
    if bounds is None:
        raise ValueError("No foreground remains after magenta keying")
    keyed = keyed.crop(bounds)
    if width is not None:
        if width <= 2 * margin:
            raise ValueError("Width must exceed twice the margin")
        content_width = width - 2 * margin
        height = max(1, round(keyed.height * content_width / keyed.width))
        keyed = keyed.resize((content_width, height), Image.Resampling.LANCZOS)
    if warm_glow:
        # A gold glow has no violet pigment; remove remaining reflected pink
        # from its fine rays after resampling, without changing their alpha.
        gold = np.array(keyed)
        gold[:, :, 2] = np.minimum(gold[:, :, 2], gold[:, :, 1])
        keyed = Image.fromarray(gold)
    canvas = Image.new("RGBA", (keyed.width + 2 * margin, keyed.height + 2 * margin))
    canvas.paste(keyed, (margin, margin))
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "PNG")
    print(f"{destination}: {canvas.width}x{canvas.height}, RGBA")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int)
    parser.add_argument("--margin", type=int, default=20)
    parser.add_argument("--warm-glow", action="store_true", help="Remove residual violet from gold/yellow glow rays")
    args = parser.parse_args()
    if args.margin < 0:
        parser.error("--margin must be nonnegative")
    key_magenta(args.input, args.output, args.width, args.margin, args.warm_glow)
