"""MMS forced alignment of docs/lyrics.txt (display text) against the vocal stem.
Display words are tokenised through docs/sung-forms.json (same rule as tests/lyrics.test.mjs).
Windows: docs/alignment-windows.json = [[firstLineIndex, t0, t1], ...] one per section.
Writes src/timing/lyrics-aligned.json and src/timing/sections.json.
"""
import json, re, torch, torchaudio
from torchaudio.pipelines import MMS_FA as bundle
torch.set_num_threads(8)
DUR = 259.6
lines = []; sec = ''
for raw in open('docs/lyrics.txt'):
    s = raw.strip()
    if not s: continue
    if s.startswith('['): sec = s[1:-1]
    else: lines.append((sec, s))
forms = json.load(open('docs/sung-forms.json'))
def key(w): return re.sub(r'\.+$', '', re.sub(r"[^A-Za-z0-9.']", '', w))
def token(w):
    t = forms.get(key(w), key(w).lower())
    return re.sub(r'[^a-z]', '', t.lower())
data = torch.load('src/timing/emission.pt', weights_only=True)
assert abs(data['duration'] - DUR) < .01, 'stale emissions'
em = data['emission']; fs = data['duration'] / em.shape[1]; D = bundle.get_dict()
words = [(i, w, token(w)) for i, (_, s) in enumerate(lines) for w in s.split()]
W = json.load(open('docs/alignment-windows.json'))
out = [{'section': s, 'text': t, 'words': []} for s, t in lines]
for ci, (l0, t0, t1) in enumerate(W):
    l1 = W[ci + 1][0] if ci + 1 < len(W) else len(lines)
    ws = [w for w in words if l0 <= w[0] < l1]
    ids = [D[c] for _, _, tk in ws for c in tk]
    f0 = int(t0 / fs); f1 = min(em.shape[1], int(t1 / fs))
    al, sc = torchaudio.functional.forced_align(em[:, f0:f1], torch.tensor([ids], dtype=torch.int32), blank=0)
    spans = torchaudio.functional.merge_tokens(al[0], sc[0].exp()); k = 0
    for li, w, tk in ws:
        p = spans[k:k + len(tk)]; k += len(tk)
        out[li]['words'].append({'w': w, 's': round((f0 + p[0].start) * fs, 3), 'e': round((f0 + p[-1].end) * fs, 3),
                                 'c': round(float(sum(x.score for x in p) / len(p)), 3)})
for l in out:
    l['start'] = l['words'][0]['s']; l['end'] = l['words'][-1]['e']
    print(f"{l['start']:7.2f} {l['end']:7.2f} {l['section']:12s} {min(w['c'] for w in l['words']):.2f} {l['text']}")
json.dump(out, open('src/timing/lyrics-aligned.json', 'w'), indent=1)
# sections: boundaries midway between one section's last word and the next one's first word
names = list(dict.fromkeys(s for s, _ in lines)); secs = []
for n in names:
    ls = [l for l in out if l['section'] == n]; secs.append({'name': n, 'first': ls[0]['start'], 'last': ls[-1]['end']})
res = []
for i, s in enumerate(secs):
    start = 0 if i == 0 else res[-1]['end']
    end = DUR if i == len(secs) - 1 else round(min(secs[i + 1]['first'] - 0.05, (s['last'] + secs[i + 1]['first']) / 2), 3)
    res.append({'name': s['name'], 'start': start, 'end': end})
json.dump(res, open('src/timing/sections.json', 'w'), indent=1)
for r in res: print(r)
