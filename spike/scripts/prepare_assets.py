"""Rebuild throwaway puppet assets from the retained image_gen sheets.

Run from any directory with Python, Pillow and numpy installed.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
SRC = OUT / 'sources'
R = Image.Resampling.LANCZOS
manifest = {}

def key(im):
    a = np.array(im.convert('RGB')).astype(np.int16)
    r, g, b = a.transpose(2, 0, 1)
    pink = (r > g + 45) & (b > g + 45) & (r > 110) & (b > 110)
    mask = Image.fromarray(np.where(pink, 0, 255).astype('uint8'))
    # One-pixel choke removes the contaminated antialiased magenta boundary.
    mask = mask.filter(ImageFilter.MinFilter(3))
    spill = (r > g + 12) & (b > g + 12)
    a[spill, 0] = g[spill]
    a[spill, 2] = g[spill]
    rgba = Image.fromarray(a.astype('uint8')).convert('RGBA')
    rgba.putalpha(mask)
    return rgba

def save(name, im, parent=None, pivot=None, sockets=None):
    if im.mode == 'RGBA':
        # Resampling can reintroduce tiny color ringing at transparent edges.
        pixels = np.array(im)
        rgb = pixels[:,:,:3].astype(int)
        spill = (rgb[:,:,0] > rgb[:,:,1]+20) & (rgb[:,:,2] > rgb[:,:,1]+20)
        pixels[spill,0] = pixels[spill,1]
        pixels[spill,2] = pixels[spill,1]
        pixels[pixels[:,:,3] == 0,:3] = 0
        im = Image.fromarray(pixels)
    im.save(OUT / name)
    manifest[name] = dict(size=list(im.size), parent=parent, pivot=pivot,
                          sockets=sockets or {})

sheet = Image.open(SRC / 'character-sheet.png')

def part(name, box, scale, pivot, parent, sockets=None):
    im = key(sheet.crop(box))
    bbox = im.getbbox()
    im = im.crop(bbox)
    im = im.resize((round(im.width*scale), round(im.height*scale)), R)
    pad = 12
    canvas = Image.new('RGBA', (im.width+24, im.height+24))
    canvas.alpha_composite(im, (pad, pad))
    def point(p):
        return [round((p[0]-box[0]-bbox[0])*scale)+pad,
                round((p[1]-box[1]-bbox[1])*scale)+pad]
    save(name, canvas, parent, point(pivot),
         {k:point(v) for k,v in (sockets or {}).items()})

part('ram-full.png', (0,0,490,1024), 1.5, (165,600), None)
part('ram-torso.png', (495,500,850,1024), 1.4, (712,750), 'root',
     {'neck':(731,557), 'shoulder-back':(670,610), 'shoulder-front':(687,615),
      'hip-back':(690,880), 'hip-front':(738,880)})
for side, x in [('back',0), ('front',270)]:
    part(f'ram-arm-upper-{side}.png', (980+x,15,1245+x,270), 1.5,
         (1137+x,70), 'ram-torso.png', {'elbow':(1046+x,228)})
    part(f'ram-arm-lower-{side}.png', (980+x,275,1245+x,470), 1.5,
         (1018+x,427), f'ram-arm-upper-{side}.png')
    part(f'ram-leg-upper-{side}.png', (1000+x,490,1180+x,720), 1.5,
         (1065+x,527), 'ram-torso.png', {'knee':(1120+x,682)})
    part(f'ram-leg-lower-{side}.png', (995+x,735,1195+x,1020), 1.5,
         (1074+x,768), f'ram-leg-upper-{side}.png')

# Use one master for all head states, replacing only mouth and chin.
heads = Image.open(SRC / 'heads-final-sheet.png')
base = key(heads.crop((25,110,530,850)))
patch = Image.new('L',base.size)
ImageDraw.Draw(patch).polygon([(307,483),(505,483),(505,740),
                              (275,740),(275,595),(307,550)],fill=255)
patch = patch.filter(ImageFilter.GaussianBlur(7))
for state, offset in [('closed',0),('open',497),('wide',995)]:
    head = base.copy()
    if offset:
        variant = key(heads.crop((25+offset,110,530+offset,850)))
        head.paste(variant,(0,0),patch)
    head = head.resize((379,555),R)
    save(f'ram-head-{state}.png',head,'ram-torso.png',[174,530])

bg = Image.open(SRC / 'serverroom.png').convert('RGB').resize((2400,1350),R)
save('bg-serverroom.png',bg)
fg = Image.open(SRC / 'foreground-sheet.png')
rack = key(fg.crop((0,0,275,1024)))
rack = rack.crop(rack.getbbox())
rack = rack.resize((round(rack.width*1350/rack.height),1350),R)
save('fg-rack.png',rack)
sill = key(fg.crop((275,770,1536,1024)))
sill = sill.crop(sill.getbbox())
sill = sill.resize((2400,round(sill.height*2400/sill.width)),R)
save('fg-snowsill.png',sill)

(OUT/'rig.json').write_text(json.dumps(manifest,indent=2)+'\n')
readme = '''# Throwaway test-shot artwork

Original artwork generated with the built-in image_gen tool. No text is part of the artwork.
Retained generation sheets and prompts are in `sources/`. Rebuild with
`python spike/scripts/prepare_assets.py` (Pillow and numpy).

Coordinates below are local PNG pixels from the top-left; +x right, +y down.
Pivots attach to the named parent. Torso pivot and full-reference pivot are root anchors.
Heads share one canvas and pivot; pixels outside the mouth/chin patch are identical.
The whole reference silhouette is approximately 1500px high. Parts have opaque rounded
joint overlap; hide the caps beneath the neighboring segment when assembling.
The reference is a pose/model guide, not a pixel-exact assembly of the separate puppet.
Back limbs go behind torso; front limbs go above it. Scarf is baked into torso.

| File | Pixel size | Parent | Attachment pivot (x, y) |
|---|---|---|---|
'''
for name,m in manifest.items():
    p = ', '.join(map(str,m['pivot'])) if m['pivot'] else '—'
    readme += f"| `{name}` | {m['size'][0]} × {m['size'][1]} | {m['parent'] or '—'} | {p} |\n"
readme += '\nParent attachment sockets (local pixels):\n\n'
for name,m in manifest.items():
    if m['sockets']:
        readme += f"- `{name}`: "+'; '.join(f'{k}: ({v[0]}, {v[1]})' for k,v in m['sockets'].items())+'.\n'
readme += '\n`rig.json` provides the same dimensions, pivots and sockets as machine-readable data.\n'
(OUT/'README.md').write_text(readme)

# Review contact sheet: neutral checkerboard exposes holes and keying fringes.
names = list(manifest)
contact = Image.new('RGB',(1600,1200),'#d5d8db')
d = ImageDraw.Draw(contact)
for index,name in enumerate(names):
    x,y=(index%5)*320,(index//5)*300
    for yy in range(y+25,y+295,18):
        for xx in range(x,x+315,18):
            if ((xx-x)//18+(yy-y-25)//18)%2:
                d.rectangle((xx,yy,xx+17,yy+17),fill='#aeb6bf')
    im=Image.open(OUT/name).convert('RGBA')
    im.thumbnail((300,260),R)
    contact.paste(im,(x+(320-im.width)//2,y+30),im)
    d.text((x+6,y+6),name,fill='black')
contact.save(OUT/'sources'/'review-contact.png')
print(json.dumps(manifest,indent=2))
