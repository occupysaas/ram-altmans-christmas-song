# Brief: crowd and elf puppet parts + plates for shots 40, 49, 61

Use your image_gen tool. Attached: cast sheets `townsfolk.png` and `elves.png`, stills `40.png`, `49.png`, `61.png`, and `public/puppets/ram-34/torso.png` for style/scale matching. Look at every result; regenerate if off-model, if any arms/legs are drawn on torsos, or if any text/letters/logos appear. Do not ask questions. Stop when every file exists and you have checked it; write `preview.png` in each new folder.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Arms and legs are drawn in code (rubber-hose), so torsos have NO arms/legs. Side view facing RIGHT for every part. Magenta sheets keyed with `scripts/key_magenta.py`, ~10 px margin. Each folder has `parts.json` in the same format as `public/puppets/ram-34/parts.json` (torso: neck, shoulderNear, shoulderFar, hipNear, hipFar; heads: neck; hands: wrist; feet: ankle; props: grip).

Folders (each a full simple puppet: `torso`, `head-happy`, `head-worried`, `hand-near-open`, `hand-far-open`, `hand-near-grab`, `foot-near`, `foot-far`; far parts a shade darker):
- `public/puppets/dad/` (tall dad with a moustache, pyjamas for shot 40 — striped flannel), torso ~600 px tall
- `public/puppets/mum/` (cheerful mum in a red dressing gown), torso ~560 px
- `public/puppets/kid1/` (small kid in red pyjamas), torso ~360 px
- `public/puppets/kid2/` (small kid in lilac pyjamas), torso ~360 px
- `public/puppets/elf/` (data-center elf: green hoodie, hood up, headset, striped leggings, curled shoes), torso ~330 px; also `hand-near-box` (both mittens gripping) and heads `head-happy`, `head-focus`.
Props in `public/sprites/props/` (add to props.json): `lantern` (glowing hand lantern with a top ring as grip), `box` (closed cardboard box with a blank label), `box-open` (open box).

Clean plates (exactly 1600x1200, Pillow crop/resize, never stretch) in `public/plates/`: repaint each still exactly with the listed people REMOVED: `40.png` (remove the family on the stairs, keep the staircase, garland, window, tree), `49.png` (remove all the marching townsfolk and elves, keep the snowy hill, town, tower, lamps), `61.png` (remove the four elves and the boxes, keep the conveyor belt, wall, garland and machinery). Write `out/sheets/plates-crowd.png`.
