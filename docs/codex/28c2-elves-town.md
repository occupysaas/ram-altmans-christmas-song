# Brief: elves and town (pass 3)

Use your image_gen tool. Look at every result; regenerate if off-style, misaligned, if anything listed as removed is still there, or if any text/letters/numbers/logos appear. Do not ask questions. Stop when every file exists and you have checked it. Never write preview files into public/; write your contact sheet to out/sheets/ as named below.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Plates are exactly 1600x1200 (Pillow crop/resize, never stretch). "Repaint" = keep composition, palette, camera and every other element exactly, with only the listed things removed and the space behind them painted in naturally. "Layer" = a FULL 1600x1200 frame on flat magenta #FF00FF containing ONLY the named thing at exactly its original position, size and pose (pixel-aligned with its source), everything else magenta, no magenta inside the subject.
Contact sheet: out/sheets/elves-town-p3.png.

Continue an interrupted job: everything else is already done and checked, do NOT redo it. Make ONLY these files, following the full spec below:
- public/sprites/layers/50/rope.png
- public/sprites/layers/51/char3.png
- public/sprites/layers/51/char4.png
- public/sprites/layers/51/char5.png
- public/sprites/layers/52/char1.png
- public/sprites/layers/52/char10.png
- public/sprites/layers/52/char2.png
- public/sprites/layers/52/char3.png
- public/sprites/layers/52/char4.png
- public/sprites/layers/52/char5.png
- public/sprites/layers/52/char6.png
- public/sprites/layers/52/char7.png
- public/sprites/layers/52/char8.png
- public/sprites/layers/52/char9.png
- public/sprites/layers/53/char2.png
- public/sprites/layers/53/char3.png
- public/sprites/layers/53/char4.png
- public/sprites/layers/53/char6.png
- public/sprites/townsfolk/ram-giant.png

Full spec (for reference):
For stills 50, 51, 52, 53 (public/stills/NN.png): public/plates/NN.png = the still with EVERY person/elf removed (52 also with the big tower removed); and one layer per person/elf at public/sprites/layers/NN/charK.png, numbered left to right (char1, char2, ...). Props a person holds stay with that person (a rope end, the band-aid, a glowing box), except: in 50 make layers/50/rope.png the red rope alone (both ends attached between the two tug teams' hands) and leave the gold posts and coins in the plate; in 53 make layers/53/balloon.png the bursting golden balloon alone and remove it and the confetti from the plate. In 52 also write layers/52/tower.png (the tower alone).
54: public/plates/54.png = a NEW composition from still 54: the same town square and houses at night with the tower on the hill to the right, but with NO people and NO bandstand; a clear round snowy space in the centre. layers/54/tower.png = the tower alone. public/sprites/townsfolk/ring-front-1.png .. ring-front-4.png = pairs of townsfolk seen from BEHIND (backs to us) holding hands side by side, arms joined, about 420 px tall, and ring-back-1.png .. ring-back-4.png = pairs seen from the FRONT holding hands, singing, about 300 px tall; each on magenta, keyed with .venv/bin/python -I scripts/key_magenta.py IN OUT --margin 10. Mixed cast: mums, dads, grannies, kids, elves, in the townsfolk style of public/cast/townsfolk.png. public/sprites/townsfolk/ram-giant.png = a giant glowing green RAM stick standing upright like a monument with a golden halo glow, 500 px tall, on magenta, keyed the same way.
