"""Turn console-source.png into a 1080p plate with a rectangular 4:3 aperture.

Run from the project root with .venv/bin/python scripts/make_tv.py.
The source is preserved byte-for-byte; all coordinates use output pixels.
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "tv"


def make_tv():
    source = Image.open(DEST / "console-source.png").convert("RGB")
    # Cover and centre-crop: one uniform scale, never stretch.
    canvas = ImageOps.fit(source, (1920, 1080), method=Image.Resampling.LANCZOS)
    rgb = np.asarray(canvas).copy()
    r, g, b = rgb.astype(np.int16).transpose(2, 0, 1)
    key = (r > 140) & (b > 130) & (g < 100) & (r - g > 80) & (b - g > 80)
    yy, xx = np.nonzero(key)
    if len(xx) < 10000:
        raise ValueError("No substantial magenta screen found")
    left, right, top, bottom = int(xx.min()), int(xx.max()), int(yy.min()), int(yy.max())
    cx, cy = (left + right + 1) / 2, (top + bottom + 1) / 2

    # Integral image permits exhaustive descending search of every integer
    # exact-4:3 size at the hole centre. One-pixel inset avoids key fringes.
    invalid = (~key).astype(np.int32)
    sums = np.pad(invalid.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    rect = None
    for unit in range(min((right - left - 1) // 4, (bottom - top - 1) // 3), 0, -1):
        w, h = 4 * unit, 3 * unit
        x, y = round(cx - w / 2), round(cy - h / 2)
        x0, y0, x1, y1 = x - 1, y - 1, x + w + 1, y + h + 1
        if x0 < 0 or y0 < 0 or x1 > 1920 or y1 > 1080:
            continue
        count = sums[y1, x1] - sums[y0, x1] - sums[y1, x0] + sums[y0, x0]
        if count == 0:
            rect = dict(x=x, y=y, w=w, h=h)
            break
    if rect is None:
        raise ValueError("No centred 4:3 screen rectangle found")

    # Include low-saturation antialias pixels around the key for spill cleanup.
    # Magenta is forbidden elsewhere in the illustration, so this also detects
    # accidental stray key pixels rather than leaving them in the final plate.
    spill = (r - g > 20) & (b - g > 20)
    vicinity = np.zeros(key.shape, dtype=bool)
    vicinity[max(0, top - 8):bottom + 9, max(0, left - 8):right + 9] = True
    spill &= vicinity
    # Sample the darkest neutral glass immediately around the screen, excluding
    # magenta and wood, for an opaque inset that matches the drawn bezel.
    ring = vicinity & ~key & ~spill
    samples = rgb[ring]
    dark = samples[np.max(samples, axis=1) < 100]
    glass = np.median(dark, axis=0).astype(np.uint8) if len(dark) else np.array([27, 30, 31], dtype=np.uint8)
    rgb[key | spill] = glass
    rgba = np.dstack((rgb, np.full(key.shape, 255, dtype=np.uint8)))
    x, y, w, h = (rect[k] for k in ("x", "y", "w", "h"))
    rgba[y:y + h, x:x + w, :3] = glass
    rgba[y:y + h, x:x + w, 3] = 0

    # Validate aperture and the full opaque 20px surround, including corners.
    alpha = rgba[:, :, 3]
    assert np.all(alpha[y:y + h, x:x + w] == 0)
    surround = alpha[y - 20:y + h + 20, x - 20:x + w + 20].copy()
    surround[20:20 + h, 20:20 + w] = 255
    assert np.all(surround == 255)
    assert np.count_nonzero(alpha == 0) == w * h
    assert abs(w / h / (4 / 3) - 1) < 0.01
    assert not np.any(((rgba[:, :, 0].astype(int) - rgba[:, :, 1] > 40)
                       & (rgba[:, :, 2].astype(int) - rgba[:, :, 1] > 40))
                      & (alpha > 0)), "Magenta remains outside the aperture"
    Image.fromarray(rgba).save(DEST / "console.png")
    (DEST / "console.json").write_text(json.dumps(rect) + "\n")
    print(json.dumps({"size": [1920, 1080], "mode": "RGBA", "rectangle": rect,
                      "glass_edge_rgb": glass.tolist(), "opaque_surround": 20}))


if __name__ == "__main__":
    make_tv()
