# Brief: objects and top-down elves

Use your image_gen tool. Attached: stills 12, 24, 30, 61 and public/puppets/elf/torso.png, public/sprites/props/ram-stick.png, public/sprites/props/box.png for style. Look at every result; regenerate if off-style or if any text/letters/numbers/logos appear. Do not ask questions. Stop when every file exists and you have checked it. Write a contact sheet to out/sheets/objects-cleanup.png (not into public/).

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

All sprites on flat magenta #FF00FF then keyed with: .venv/bin/python -I scripts/key_magenta.py IN OUT --margin 10 (keep the raw magenta originals in out/raw/27c/).

- public/sprites/fan/blade.png: a front-on 7-blade server fan rotor, perfectly centred and circular, 600x600, swept curved blades in the cool grey/lavender of still 12 with ink outlines and frost on the tips, a round hub in the centre. Rotationally symmetric so it can spin about its centre.
- public/sprites/vault/door.png: the round steel vault door from still 24 seen face-on, 560x560 circle, bolts and a wheel handle, no frame.
- public/sprites/store/ram-box.png: a small retail box for a RAM stick, 220x150, a window showing a green RAM stick, red and green Christmas colours, NO writing.
- public/sprites/topdown-elf/: straight top-down (bird's-eye) view of the data-center elf (green hood up, headset), each about 170 px tall, facing DOWN (south) toward the viewer's bottom, arms visible working on a gift box in front of them: wrap-a.png, wrap-b.png (wrapping paper, two poses of a loop), tape-a.png, tape-b.png (tape gun), bow-a.png, bow-b.png (tying a red bow), label-a.png, label-b.png (sticking a blank label). Also multi.png: one slightly bigger squashed-together elf (about 220 px) with FOUR arms doing all four tasks at once on four boxes, a frazzled happy face, and multi-b.png a second pose.
- public/sprites/topdown-elf/piston.png: a chunky grey hydraulic piston ram seen from above, horizontal, a long rod with a flat square pusher plate on its RIGHT end, 520x120.
