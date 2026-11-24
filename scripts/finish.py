"""out/programme.mp4 → out/animatic.mp4: CRT pass, composite into the console TV with a push-in/pull-back,
mix the SFX under the song, fade out. Run via scripts/finish.sh.

The whole 1920x1080 frame is built on a 2x canvas (3840x2160) and zoompan'd so the push-in stays crisp:
zoom Z(t) = 1 (whole room) → PUSH (screen fills most of the frame) over the opening, back to 1 before the TV-off.
"""
import json, subprocess, sys
from PIL import Image

DUR = 259.6
PUSH = 2.06               # screen height ≈ 504 * 2.06 = 1038 px: the picture tube fills the frame height (user: zoom in more)
IN_T0, IN_T1 = 1.5, 4.5    # push in (title card)
OUT_T0, OUT_T1 = 256.0, 257.9   # pull back to the room before the TV switches off (Animatic TV_OFF = 258.0)
FADE_T, FADE_D = 258.9, 0.7
SFX_DB = -8

tv = json.load(open('public/tv/console.json'))
shots = json.load(open('src/shots.json'))
W2, H2 = 3840, 2160
sx, sy, sw, sh = (2 * tv[k] for k in ('x', 'y', 'w', 'h'))
cx, cy = sx + sw / 2, sy + sh / 2

# static scanline mask at screen size: 360 CRT lines across the screen height
mask = Image.new('L', (sw, sh))
px = mask.load()
for y in range(sh):
    v = int(255 * (0.74 + 0.26 * abs(__import__('math').sin(y * __import__('math').pi / (sh / 360)))))
    for x in range(sw): px[x, y] = v
mask.convert('RGB').save('out/scanlines.png')

S = lambda a, b: f"(clip((it-{a})/{b - a},0,1)*clip((it-{a})/{b - a},0,1)*(3-2*clip((it-{a})/{b - a},0,1)))"
Z = f"(1+{PUSH - 1}*{S(IN_T0, IN_T1)}-{PUSH - 1}*{S(OUT_T0, OUT_T1)})"

sfx = [(e['name'], e['t']) for s in shots for e in s['sfx']]
inputs = ['-i', 'out/programme.mp4', '-loop', '1', '-i', 'public/tv/console.png', '-loop', '1', '-i', 'out/scanlines.png']
for name, _ in sfx: inputs += ['-i', f'public/sfx/{name}.wav']

v = (
    f"[0:v]scale=480:360:flags=area,eq=saturation=1.12:contrast=1.06,noise=alls=5:allf=t,format=rgb24,"
    f"geq=r='r(X+1,Y)':g='g(X,Y)':b='b(X-1,Y)',"            # red/blue fringing at CRT resolution
    f"scale={sw}:{sh}:flags=bilinear,format=gbrp,split[a][b];"
    f"[b]gblur=sigma=9[glow];[a][glow]blend=all_mode=screen:all_opacity=0.32,format=gbrp[g];"
    f"[2:v]format=gbrp,scale={sw}:{sh}[scan];[g][scan]blend=all_mode=multiply,"
    f"lenscorrection=k1=0.05:k2=0.02,vignette=PI/5,format=rgba[crt];"
    f"color=c=black:s={W2}x{H2}:r=24:d={DUR}[bg];"
    f"[1:v]scale={W2}:{H2},format=rgba[tv];"
    f"[bg][crt]overlay={sx}:{sy}:shortest=1[c1];[c1][tv]overlay=0:0:shortest=1,"
    f"zoompan=z='{Z}':d=1:fps=24:s=1920x1080:"
    f"x='max(0,min(iw-iw/zoom,{cx}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,{cy}-ih/zoom/2))',"
    f"fade=t=out:st={FADE_T}:d={FADE_D},format=yuv420p[v]"
)
a = "[0:a]aresample=44100[song];"
for i, (name, t) in enumerate(sfx):
    ms = int(t * 1000)
    a += f"[{3 + i}:a]adelay={ms}|{ms},volume={SFX_DB}dB[s{i}];"
a += "[song]" + "".join(f"[s{i}]" for i in range(len(sfx))) + f"amix=inputs={1 + len(sfx)}:normalize=0:duration=first,afade=t=out:st={FADE_T}:d={FADE_D}[a]"

cmd = ['ffmpeg', '-v', 'error', '-stats', '-y', *inputs, '-filter_complex', v + ";" + a, '-map', '[v]', '-map', '[a]',
       '-t', __import__('os').environ.get('FINISH_T', str(DUR)), '-r', '24', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k',
       sys.argv[1] if len(sys.argv) > 1 else 'out/animatic.mp4']
print(' '.join(cmd[:6]), '...', len(sfx), 'sfx')
sys.exit(subprocess.call(cmd))
