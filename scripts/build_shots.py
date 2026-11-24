"""docs/shotlist.yaml + src/timing/*.json → src/shots.json (see the plan's Task 4 interface)."""
import json, yaml
from PIL import Image, ImageStat

DUR = 259.6
LEAD = 0.25          # shots cut in this long before their anchor word
LIGHT_LUM = 120      # mean luminance above which a lyric box gets dark ink (tone 'light')
BOOM_DELAY = 1.6     # the ending's explosion: this long into the closing silence (must match fxMath.ts BOOM)
GLASS_DELAY = 0.6    # glass-break this long after the star line ends (spin, tip, fall)

# [[x, y, zoom, rot], [x, y, zoom, rot]] in still-space; zoom 1 = the whole 4:3 still
CAMERAS = {
    'push':      [[.50, .50, 1.05, 0], [.50, .47, 1.25, 0]],
    'pushIn':    [[.50, .50, 1.10, 0], [.50, .50, 1.30, 0]],
    'pushIn2':   [[.50, .50, 1.08, 0], [.50, .52, 1.28, 0]],
    'pushRight': [[.45, .50, 1.15, 0], [.55, .50, 1.30, 0]],
    'slowPush':  [[.50, .50, 1.05, 0], [.50, .50, 1.15, 0]],
    'pullOut':   [[.50, .50, 1.30, 0], [.50, .50, 1.05, 0]],
    'pullOut2':  [[.50, .48, 1.25, 0], [.50, .50, 1.00, 0]],
    'panRight':  [[.42, .50, 1.20, 0], [.58, .50, 1.20, 0]],
    'panLeft':   [[.58, .50, 1.20, 0], [.42, .50, 1.20, 0]],
    'tiltUp':    [[.50, .58, 1.20, 0], [.50, .42, 1.20, 0]],
    'tiltDown':  [[.50, .42, 1.20, 0], [.50, .58, 1.20, 0]],
    'starHold':  [[.45, .435, 1.15, 0], [.48, .47, 1.12, 0]],   # 32: stay on the star through the spin; it falls out the bottom
    'sadPush':   [[.50, .52, 1.05, 0], [.52, .56, 1.30, 0]],   # 18: everyone in view, then push toward the tag and the bare tree skirt
    'boomWide':  [[.60, .50, 1.12, 0], [.52, .50, 1.0, 0]],   # 65: the whole tower in frame as it swells, then wide for the RAM rain
    'stampWide': [[.50, .52, 1.06, 1.5], [.50, .52, 1.09, -1.5]],   # 39: Ram centre stage, the whole ring of runners in view
    'fanShake':  [[.50, .50, 1.05, 2], [.505, .50, 1.06, -2]],   # 12: wide enough to see all three fans whole
    'craneDown': [[.50, .42, 1.20, 0], [.50, .58, 1.30, 0]],
    'craneUp':   [[.50, .58, 1.30, 0], [.50, .42, 1.20, 0]],
    'dutchPush': [[.50, .50, 1.15, -4], [.50, .50, 1.35, 4]],
    'punch':     [[.50, .50, 1.10, 0], [.47, .45, 1.50, 0]],
    'punch2':    [[.50, .50, 1.12, 0], [.53, .47, 1.45, 0]],
    'drift':     [[.48, .50, 1.12, 0], [.52, .50, 1.18, 0]],
    'drift2':    [[.52, .50, 1.15, 0], [.48, .48, 1.20, 0]],
    'orbit':     [[.47, .50, 1.20, -3], [.53, .50, 1.25, 3]],
    'shake':     [[.50, .50, 1.20, 2], [.50, .50, 1.30, -2]],
    'shake2':    [[.50, .50, 1.25, -3], [.50, .50, 1.35, 3]],
    'lowAngle':  [[.50, .55, 1.20, 0], [.50, .50, 1.30, 0]],
    'rotate':    [[.50, .50, 1.30, -8], [.50, .50, 1.30, 8]],
}

def fit(p, box, pad=False):
    """Pull a camera endpoint back / over just enough that the lyric box stays fully in view (with a 24 px margin when pad)."""
    x, y, z, r = p; bx, by, bw, bh = box[:4]
    if pad:
        mx, my = 24 / 1600, 24 / 1200
        bx, by, bw, bh = max(0, bx - mx), max(0, by - my), bw + 2 * mx, bh + 2 * my
    z = max(1.0, min(z, 1 / max(bw, bh)))
    h = 0.5 / z
    x = min(max(x, bx + bw - h, h), bx + h, 1 - h)
    y = min(max(y, by + bh - h, h), by + h, 1 - h)
    return [x, y, z, r]

FROZEN = {1, 2, 3, 4, 5, 6}   # 0:00-0:33 is approved as-is ("S tier, do not alter")

def cam(c, box, n=0):
    pts = CAMERAS[c] if isinstance(c, str) else c
    return {k: dict(zip(('x', 'y', 'zoom', 'rot'), fit(p, box, pad=n not in FROZEN))) for k, p in zip(('from', 'to'), pts)}

def tone(still, box):
    im = Image.open('public/' + still).convert('L')
    W, H = im.size; x, y, w, h = box[:4]
    lum = ImageStat.Stat(im.crop((int(x * W), int(y * H), int((x + w) * W), int((y + h) * H)))).mean[0]
    return 'light' if lum > LIGHT_LUM else 'dark'

def build():
    spec = yaml.safe_load(open('docs/shotlist.yaml'))['shots']
    motion = yaml.safe_load(open('docs/motion.yaml'))
    lyr = json.load(open('src/timing/lyrics-aligned.json'))
    secs = json.load(open('src/timing/sections.json'))
    imp = json.load(open('src/timing/impact.json'))

    def start_of(a):
        if 't' in a: return a['t']
        if 'impact' in a: v = imp[a['impact']]; return v[0] if isinstance(v, list) else v
        return round(lyr[a['line']]['words'][a.get('word', 0)]['s'] - LEAD, 3)

    starts = [start_of(s['anchor']) for s in spec]
    assert starts == sorted(starts), f'anchors out of order: {starts}'
    shots = []
    for i, s in enumerate(spec):
        st, en = starts[i], (starts[i + 1] if i + 1 < len(spec) else DUR)
        x, y, w, h, rot = s['surf']
        sid = str(s['id']) if 'id' in s else f"{s['n']:02d}"
        shots.append({'id': sid, 'name': s['name'],
                      'section': next(z['name'] for z in secs if z['start'] <= st < z['end']),
                      'start': st, 'end': en, 'still': s.get('still', f"stills/{sid}.png"), 'camera': cam(s['cam'], s['surf'], s['n']),
                      'towerStage': s['tower'], 'brief': s['brief'], 'lyrics': [], 'sfx': [],
                      '_surf': {'x': x, 'y': y, 'w': w, 'h': h, 'rot': rot, **({'lineGap': s['lineGap']} if 'lineGap' in s else {})}, '_style': s['style'],
                      '_tone': tone(s.get('still', f"stills/{sid}.png"), s['surf'])})
        m = motion[sid if 'id' in s else s['n']]
        shots[-1].update({'tier': m['tier'], 'fx': m.get('fx', []), 'action': m.get('action', '')})
        if m['tier'] == 'A': shots[-1].update({'plate': f"plates/{sid}.png", 'puppets': m['puppets']})
        elif m.get('plate'): shots[-1]['plate'] = f"plates/{sid}.png"
        if s.get('sfx') == 'knocks': shots[-1]['sfx'] += [{'name': 'knock', 't': t} for t in imp['knocks']]

    def entry(sh, li, frm, to):
        sh['lyrics'].append({'line': li, 'from': frm, 'to': to, 'surface': sh['_surf'], 'style': sh['_style'], 'tone': sh['_tone']})

    for li, l in enumerate(lyr):
        n = len(l['words'])
        for sh in shots:
            ks = [k for k, w in enumerate(l['words']) if sh['start'] <= w['s'] < sh['end']]
            if ks: entry(sh, li, ks[0], ks[-1] + 1)

    star = next(l for l in lyr if l['text'].startswith('The star on the tree'))
    next(x for x in shots if x['id'] == '32')['sfx'].append({'name': 'glass-break', 't': round(star['end'] + GLASS_DELAY, 3)})
    next(x for x in shots if x['id'] == '65')['sfx'].append({'name': 'boom', 't': round(imp['silence'] + BOOM_DELAY, 3)})
    for sh in shots: del sh['_surf'], sh['_style'], sh['_tone']
    return shots

if __name__ == '__main__':
    out = build()
    json.dump(out, open('src/shots.json', 'w'), indent=1)
    for s in out: print(s['id'], f"{s['start']:7.2f} {s['end'] - s['start']:5.2f}s", s['section'], s['name'], [(e['line'], e['from'], e['to']) for e in s['lyrics']])
