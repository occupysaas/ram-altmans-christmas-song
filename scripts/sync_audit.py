"""Spot-check aligned words against vocal-stem energy: each sampled word's span should be voiced
(RMS well above the stem's quiet floor). Writes docs/sync-review.md."""
import json, librosa, numpy as np
a = json.load(open('src/timing/lyrics-aligned.json'))
y, sr = librosa.load('stems/htdemucs/song/vocals.wav', sr=16000)
hop = 160; r = librosa.feature.rms(y=y, frame_length=640, hop_length=hop)[0]
floor = np.percentile(r, 20); peak = np.percentile(r, 95)
words = [w for l in a for w in l['words']]
pick = [words[int(i)] for i in np.linspace(0, len(words) - 1, 10)] + \
       [w for l in a for w in l['words'] if w['w'].strip('.,!?"') in ('stash', 'Scrooge', 'subscribe', '480p', 'J.P.G')]
rows = []
for w in pick:
    seg = r[int(w['s'] * sr / hop):int(w['e'] * sr / hop) + 1]
    lvl = (seg.max() - floor) / (peak - floor)
    rows.append((w['w'], w['s'], w['e'], round(float(lvl), 2), 'ok' if lvl > 0.15 else 'CHECK'))
with open('docs/sync-review.md', 'w') as f:
    f.write('# Sync spot-check (vocal stem energy within each aligned word)\n\n| word | start | end | level | |\n|---|---|---|---|---|\n')
    for row in rows: f.write('| %s | %.2f | %.2f | %.2f | %s |\n' % row)
for row in rows: print(row)
