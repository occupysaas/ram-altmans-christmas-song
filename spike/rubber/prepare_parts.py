"""Rebuild the throwaway puppet assets. Requires Pillow and NumPy.

Run from any directory: python spike/rubber/prepare_parts.py
Coordinates in parts.json are local pixels, x right and y down.
"""
from collections import deque
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
SCALE = 420 / 271  # Sweater body, excluding the trailing scarf.

# Source-sheet points, measured on the accepted generated art.
SPECS = {
    'torso': ((300, 200), {'neck': (334, 63), 'shoulderNear': (283, 128),
                         'shoulderFar': (306, 116), 'hipNear': (332, 339),
                         'hipFar': (262, 339)}),
    'head-smirk': ((770, 240), {'neck': (742, 362)}),
    'head-squint': ((1240, 240), {'neck': (1220, 362)}),
    'head-cackle': ((330, 560), {'neck': (319, 709)}),
    'hand-near-open': ((720, 580), {'wrist': (674, 590)}),
    'hand-near-grab': ((1200, 580), {'wrist': (1148, 585)}),
    'hand-far-open': ((240, 890), {'wrist': (186, 898)}),
    'foot-near': ((720, 900), {'ankle': (695, 834)}),
    'foot-far': ((1200, 900), {'ankle': (1172, 835)}),
}


def components(core):
    """Label ink/cel islands without requiring an image-processing package."""
    remaining = core.copy()
    labels = np.zeros(core.shape, dtype=np.int32)
    h, w = core.shape
    label = 0
    for y, x in zip(*np.nonzero(core)):
        if not remaining[y, x]:
            continue
        label += 1
        queue = deque([(int(x), int(y))])
        remaining[y, x] = False
        while queue:
            px, py = queue.popleft()
            labels[py, px] = label
            for nx, ny in ((px-1, py), (px+1, py), (px, py-1), (px, py+1)):
                if 0 <= nx < w and 0 <= ny < h and remaining[ny, nx]:
                    remaining[ny, nx] = False
                    queue.append((nx, ny))
    return labels


def main():
    out = ROOT / 'parts'
    out.mkdir(parents=True, exist_ok=True)
    rgb = np.array(Image.open(ROOT / 'source/parts-sheet.png').convert('RGB'), dtype=float)
    # Recover coverage from the magenta excess; uncomposite the key color
    # before saving straight-alpha PNGs, so edge pixels contain no pink fringe.
    excess = np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]
    alpha = 1 - np.clip(excess / 255, 0, 1)
    alpha[alpha < 0.04] = 0
    foreground = (rgb - (1-alpha[:, :, None]) * np.array([255, 0, 255])) / np.maximum(alpha[:, :, None], 1e-8)
    foreground = np.clip(foreground, 0, 255)
    labels = components(excess < 80)
    assets = {}
    for name, (seed, points) in SPECS.items():
        label = labels[seed[1], seed[0]]
        assert label != 0, name
        island = Image.fromarray(np.uint8(labels == label) * 255).filter(ImageFilter.MaxFilter(7))
        part_alpha = alpha * (np.array(island) / 255)
        rgba = np.dstack((foreground, part_alpha * 255)).astype(np.uint8)
        rgba[rgba[:, :, 3] == 0] = 0
        part = Image.fromarray(rgba)
        box = part.getbbox()
        part = part.crop(box)
        size = tuple(round(v * SCALE) for v in part.size)
        part = part.resize(size, Image.Resampling.LANCZOS)
        sx, sy = size[0] / (box[2]-box[0]), size[1] / (box[3]-box[1])
        anchors = {key: [round((x-box[0])*sx), round((y-box[1])*sy)]
                   for key, (x, y) in points.items()}
        assets[name] = [part, anchors]

    # Shared head dimensions AND pivot: no registration jump on expression swaps.
    heads = [v for k, v in assets.items() if k.startswith('head-')]
    left = max(v[1]['neck'][0] for v in heads) + 8
    top = max(v[1]['neck'][1] for v in heads) + 8
    right = max(v[0].width-v[1]['neck'][0] for v in heads) + 8
    bottom = max(v[0].height-v[1]['neck'][1] for v in heads) + 8
    for entry in heads:
        part, anchors = entry
        canvas = Image.new('RGBA', (left+right, top+bottom))
        canvas.alpha_composite(part, (left-anchors['neck'][0], top-anchors['neck'][1]))
        entry[:] = [canvas, {'neck': [left, top]}]

    metadata = {}
    for name, (part, anchors) in assets.items():
        # Lanczos can amplify low-coverage color noise. Despill the final
        # straight-alpha edge too, after resizing and head registration.
        pixels = np.array(part).astype(np.int16)
        spill = np.maximum(np.minimum(pixels[:, :, 0], pixels[:, :, 2]) - pixels[:, :, 1], 0)
        spill[pixels[:, :, 3] == 255] = 0
        pixels[:, :, 0] -= spill
        pixels[:, :, 2] -= spill
        pixels[pixels[:, :, 3] == 0] = 0
        part = Image.fromarray(pixels.astype(np.uint8))
        part.save(out / f'{name}.png')
        metadata[f'{name}.png'] = {'width': part.width, 'height': part.height,
                                  'anchors': anchors}
    (ROOT / 'parts.json').write_text(json.dumps(metadata, indent=2) + '\n')
    plate = Image.open(ROOT / 'source/13-clean-generated.png').convert('RGB')
    plate = ImageOps.fit(plate, (1600, 1200), method=Image.Resampling.LANCZOS)
    plate.save(PROJECT / 'public/plates/13.png')
    print(f'Saved {len(assets)} transparent parts, parts.json, and 1600x1200 clean plate.')


if __name__ == '__main__':
    main()
