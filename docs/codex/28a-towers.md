# Brief: tower cut-outs (pass 3)

Use your image_gen tool. Look at every result; regenerate if off-style, misaligned, if anything listed as removed is still there, or if any text/letters/numbers/logos appear. Do not ask questions. Stop when every file exists and you have checked it. Never write preview files into public/; write your contact sheet to out/sheets/ as named below.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Plates are exactly 1600x1200 (Pillow crop/resize, never stretch). "Repaint" = keep composition, palette, camera and every other element exactly, with only the listed things removed and the space behind them painted in naturally. "Layer" = a FULL 1600x1200 frame on flat magenta #FF00FF containing ONLY the named thing at exactly its original position, size and pose (pixel-aligned with its source), everything else magenta, no magenta inside the subject.
Contact sheet: out/sheets/towers-p3.png.

For each source below, write (a) the plate with the big data-center TOWER removed (the hill/sky/town behind it repainted; keep everything else) and (b) the tower as a layer at public/sprites/layers/NN/tower.png (the whole tower building with its own lights, pipes and banners, but NOT its smoke plume and NOT any sky/cloud around it).
- 20: source public/stills/20.png → public/plates/20.png + layers/20/tower.png
- 23: source public/stills/23.png → public/plates/23.png + layers/23/tower.png
- 28: source public/stills/28.png → public/plates/28.png + layers/28/tower.png
- 46: source public/plates/46.png (overwrite) + tower from public/stills/46.png position → layers/46/tower.png
- 49: source public/plates/49.png (overwrite) + layers/49/tower.png
- 60: source public/stills/60.png → public/plates/60.png + layers/60/tower.png
- 62: source public/stills/62.png → public/plates/62.png + layers/62/tower.png
- 65: layer only, from public/stills/65.png → layers/65/tower.png (do NOT touch public/plates/65.png)
- 56: source public/stills/56.png → public/plates/56.png with the tower removed AND the windmill rotor blades removed (keep the bare towers/masts and nacelle hubs), plus layers/56/tower.png, plus public/sprites/windmill/rotor.png: one 3-blade windmill rotor seen front-on, centred, 400x400 on magenta (then key it with .venv/bin/python -I scripts/key_magenta.py IN OUT --margin 10), matching the style of the windmills in still 56.
