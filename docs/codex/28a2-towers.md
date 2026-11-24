# Brief: tower cut-outs (pass 3)

Use your image_gen tool. Look at every result; regenerate if off-style, misaligned, if anything listed as removed is still there, or if any text/letters/numbers/logos appear. Do not ask questions. Stop when every file exists and you have checked it. Never write preview files into public/; write your contact sheet to out/sheets/ as named below.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Plates are exactly 1600x1200 (Pillow crop/resize, never stretch). "Repaint" = keep composition, palette, camera and every other element exactly, with only the listed things removed and the space behind them painted in naturally. "Layer" = a FULL 1600x1200 frame on flat magenta #FF00FF containing ONLY the named thing at exactly its original position, size and pose (pixel-aligned with its source), everything else magenta, no magenta inside the subject.
Contact sheet: out/sheets/towers-p3.png.

Continue an interrupted job. These are ALREADY DONE, do not redo them: plates 20, 23, 28, 46 and tower layers 20, 23, 46.
Still to do, same rules as before ((a) plate with the big data-center TOWER removed, (b) the tower alone as a layer at public/sprites/layers/NN/tower.png, the whole tower building with its lights, pipes and banners, but NOT its smoke and NOT sky/cloud around it; layers must be pixel-aligned with the source):
- 28: layer only — public/sprites/layers/28/tower.png from public/stills/28.png (retry: it must line up exactly with the tower in still 28; plate 28 is done).
- 49: source public/plates/49.png (overwrite) + layers/49/tower.png (tower as positioned in public/stills/49.png)
- 60: source public/stills/60.png → public/plates/60.png + layers/60/tower.png
- 62: source public/stills/62.png → public/plates/62.png + layers/62/tower.png
- 65: layer only, from public/stills/65.png → layers/65/tower.png (do NOT touch public/plates/65.png)
- 56: source public/stills/56.png → public/plates/56.png with the tower removed AND the windmill rotor blades removed (keep masts and nacelle hubs), plus layers/56/tower.png, plus public/sprites/windmill/rotor.png: one 3-blade windmill rotor seen front-on, centred, 400x400 on magenta, keyed with .venv/bin/python -I scripts/key_magenta.py IN OUT --margin 10, matching the windmills in still 56.
Update the contact sheet out/sheets/towers-p3.png.
