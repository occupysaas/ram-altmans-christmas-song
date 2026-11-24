# Brief: the spoken ending — girl puppet with mouth shapes, Ram three-quarter mouth heads, plates 58/59

Use your image_gen tool. Attached: cast sheets `girl.png` and `ram.png`, stills `58.png` and `59.png`, and existing parts `public/puppets/ram-34/head-fake-smile.png` and `public/puppets/ram-34/torso.png` for exact style/scale matching. Look at every result; regenerate if off-model, if any arms/legs are drawn on torsos, or if any text/letters/logos appear. Do not ask questions. Stop when every file exists and you have checked it; write `preview.png` in each folder you add to.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

Arms and legs are drawn in code (rubber-hose), so torsos have NO arms/legs. Key magenta sheets with `scripts/key_magenta.py`, crop with ~10 px margin.

Mouth shapes (Rhubarb Lip Sync set), drawn on otherwise IDENTICAL heads (same canvas size, same neck point, only the mouth changes):
- A: closed, lips pressed (M/B/P) · B: slightly open, teeth together (most consonants) · C: open (EH/AE) · D: wide open (AA) · E: rounded (AO/ER) · F: puckered small O (UW/OO) · G: upper teeth on lower lip (F/V) · H: tongue up behind teeth (L) · X: relaxed rest.

## A. `public/puppets/girl/` (the little Byteville girl, THREE-QUARTER view facing LEFT toward Ram, looking up)
- `torso` (puffy blue coat, no arms/legs), heads `head-A` … `head-H`, `head-X` (hopeful, eyebrows up, too-big red-and-cream knit hat), plus `head-delight` (eyes closed in a big gap-tooth grin).
- hands `hand-near-open`, `hand-far-open` (striped mittens; far one a shade darker), `hand-near-hi5` (open palm facing up-right for a high five).
- feet `foot-near`, `foot-far` (snow boots).
- prop `public/sprites/props/trifold.png`: her blank cardboard science-fair trifold board (add to `public/sprites/props/props.json` with `size` and `grip`).
- `parts.json` in the same format as `public/puppets/ram-34/parts.json` (torso: neck, shoulderNear, shoulderFar, hipNear, hipFar; heads: neck; hands: wrist; feet: ankle). Scale: torso about 480 px tall (she is a small child).

## B. `public/puppets/ram-34/` (add to the existing three-quarter Ram)
- heads `head-A` … `head-H`, `head-X`: Ram's sickly-sweet fake-friendly face (based on `head-fake-smile.png`), same canvas and neck as `head-fake-smile.png`, only the mouth changes.
- `hand-near-hi5`: open gloved palm raised for a high five.
- update `public/puppets/ram-34/parts.json` (keep all existing entries).

## C. Clean plates (exactly 1600x1200, Pillow crop/resize, never stretch)
`public/plates/58.png` and `public/plates/59.png`: repaint each still exactly but with Ram Altman AND the girl REMOVED (keep the doorstep, door, lamp, steps, snow, trees). Write `out/sheets/plates-ending.png`.
