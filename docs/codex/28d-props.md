# Brief: props and the shelf (pass 3)

Use your image_gen tool. Look at every result; regenerate if off-style, misaligned, if anything listed as removed is still there, or if any text/letters/numbers/logos appear. Do not ask questions. Stop when every file exists and you have checked it. Never write preview files into public/; write your contact sheet to out/sheets/ as named below.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Plates are exactly 1600x1200 (Pillow crop/resize, never stretch). "Repaint" = keep composition, palette, camera and every other element exactly, with only the listed things removed and the space behind them painted in naturally. "Layer" = a FULL 1600x1200 frame on flat magenta #FF00FF containing ONLY the named thing at exactly its original position, size and pose (pixel-aligned with its source), everything else magenta, no magenta inside the subject.
Contact sheet: out/sheets/props-p3.png.

- public/plates/10.png (overwrite; source public/plates/10.png): repaint with ALL the glowing RAM sticks, the chip and the little glowing byte REMOVED from the shelf (keep the shelf, the little stands and the blank tags, the window, gifts).
- public/sprites/vacuum/canister.png: a 1960s cartoon canister vacuum worn like a backpack (rounded brass-and-red tank with straps and a hose socket on its top), 300x380; public/sprites/vacuum/nozzle.png: a wide vacuum nozzle head with a short wand, pointing RIGHT, 360x140, hose socket at its left end. Magenta, keyed with .venv/bin/python -I scripts/key_magenta.py IN OUT --margin 10.
- public/sprites/props/ram-pile.png: a big heap/mountain of green RAM sticks and chips, 520x420, magenta, keyed the same way.
