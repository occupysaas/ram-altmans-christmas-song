"""Find large flat 'blank card' regions in each still → docs/blanks.json {id: [x, y, w, h]} (still fractions).
A blank is a connected region of low local texture and near-uniform colour whose bounding box it mostly fills."""
import json, glob, numpy as np
from PIL import Image
from scipy import ndimage as nd
W, H = 240, 180
out = {}
for f in sorted(glob.glob('public/stills/*.png')):
    a = np.asarray(Image.open(f).convert('RGB').resize((W, H), Image.BILINEAR), dtype=float)
    g = a.mean(2)
    mu = nd.uniform_filter(g, 5); sd = np.sqrt(np.maximum(nd.uniform_filter(g * g, 5) - mu * mu, 0))
    flat = sd < 6
    lab, n = nd.label(flat)
    best = None
    for i, sl in enumerate(nd.find_objects(lab), 1):
        m = lab[sl] == i; area = m.sum()
        if area < 0.03 * W * H: continue
        fill = area / m.size
        ys, xs = sl
        bw, bh = xs.stop - xs.start, ys.stop - ys.start
        col = a[sl][m]; spread = col.std(0).mean()
        touches = xs.start == 0 or ys.start == 0 or xs.stop == W or ys.stop == H
        if fill < 0.62 or spread > 18 or touches or bw < 0.15 * W: continue
        score = area * fill
        if not best or score > best[0]:
            best = (score, [round(xs.start / W, 3), round(ys.start / H, 3), round(bw / W, 3), round(bh / H, 3)], round(float(col.mean()), 1))
    if best: out[f[-6:-4]] = {'box': best[1], 'lum': best[2]}
json.dump(out, open('docs/blanks.json', 'w'), indent=1)
print(len(out), 'stills with a blank:', ' '.join(f"{k}{v['box']}" for k, v in out.items()))
