"""Print JSON facts about an image: {size: [w, h], mode, alpha: [alpha at each (x, y) point]}."""
import json, sys
from PIL import Image
im = Image.open(sys.argv[1]); pts = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
a = im.convert('RGBA')
print(json.dumps({'size': list(im.size), 'mode': im.mode, 'alpha': [a.getpixel((int(x), int(y)))[3] for x, y in pts]}))
