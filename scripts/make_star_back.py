"""public/sprites/star-front.png → star-back.png: the 'cheap placeholder' back of the premium star.
Downscale to 24 px (nearest), recolour to a flat grey/magenta missing-texture checker inside the star's shape,
then upscale back with nearest-neighbour so it reads as chunky pixels."""
from PIL import Image
src = Image.open('public/sprites/star-front.png').convert('RGBA')
W, H = src.size
n = 30
small = src.resize((n, max(1, round(n * H / W))), Image.BOX)
px = small.load()
for y in range(small.height):
    for x in range(small.width):
        r, g, b, a = px[x, y]
        if a < 235: px[x, y] = (0, 0, 0, 0); continue   # solid star body only, not the soft glow
        px[x, y] = (255, 0, 220, 255) if (x // 3 + y // 3) % 2 else (90, 90, 96, 255)
small.resize((W, H), Image.NEAREST).save('public/sprites/star-back.png')
print('star-back', W, H)
