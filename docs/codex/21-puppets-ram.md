# Brief: rubber-hose puppet parts for Ram Altman, Sam, and props

Use your image_gen tool. Attached: the cast sheets `ram.png` and `sam.png`, and four existing parts (`torso.png`, `head-smirk.png`, `hand-near-open.png`, `foot-near.png`) from `public/puppets/ram-side/`. Everything you make must match those existing parts exactly in line weight, colouring and scale. Look at every result; regenerate anything off-model, with drawn arms/legs, or with any text/letters/logos. Do not ask questions. Stop when every file listed exists and you have checked it, and write a preview sheet per folder (`preview.png`).

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

These parts are for 1930s-style rubber-hose animation: arms and legs are drawn in code as bendy tubes, so draw NO arms and NO legs on any part (a torso has only shoulder/hip openings). Generate parts on flat pure magenta #FF00FF sheets (never use magenta in the art), key them to transparent PNGs with `scripts/key_magenta.py` (fix it if needed so there is no fringe), crop each with ~10 px margin. Keep each folder's parts at one consistent scale (torso about 670 px tall like the existing `torso.png`).

For each folder write `parts.json` in this exact format (local pixel anchors):
`{"torso": {"size": [w, h], "neck": [x, y], "shoulderNear": [x, y], "shoulderFar": [x, y], "hipNear": [x, y], "hipFar": [x, y]}, "head-…": {"size": [w, h], "neck": [x, y]}, "hand-…": {"size": [w, h], "wrist": [x, y]}, "foot-…": {"size": [w, h], "ankle": [x, y]}, "prop-…": {"size": [w, h], "grip": [x, y]}}`
If a folder already has a parts.json, add the new parts to it and keep the existing entries unchanged.

## A. `public/puppets/ram-side/` (add to the existing side-profile set; facing RIGHT)
- heads (same canvas size and neck position as `head-smirk.png`): `head-grin` (wide greedy toothy grin), `head-panic` (wide eyes, mouth open in horror), `head-fake-smile` (sickly-sweet closed-eye smile), `head-wink` (one eye shut, sly smile), `head-camera` (head turned three-quarters to look straight at the viewer with a guilty narrow squint).
- hands (same style/scale as `hand-near-open.png`, wrist cuff at the left): `hand-near-point` (index finger pointing), `hand-near-fist`, `hand-far-grab` (far hand: thumb on the opposite side, one shade darker/cooler), `hand-far-fist` (far, darker).

## B. `public/puppets/ram-34/` (Ram in THREE-QUARTER view facing right, toward the viewer)
- `torso` (grey sweater + long tattered red scarf, no head/arms/legs), heads `head-smirk`, `head-squint`, `head-cackle` (thrown back, mouth wide), `head-grin`, `head-panic`, `head-fake-smile`, all on one shared canvas size and neck point.
- hands: `hand-near-open`, `hand-near-grab`, `hand-near-fist`, `hand-near-point`, `hand-far-open`, `hand-far-grab`, `hand-far-fist` (far hands mirrored, thumb correct, one shade darker).
- feet: `foot-near`, `foot-far` (curled-toe slippers, three-quarter, far one darker).

## C. `public/puppets/sam-34/` (Sam, the "before" version, THREE-QUARTER view facing right)
- `torso` (plain grey crewneck, NO scarf), heads `head-smile`, `head-shock` (healthy skin, round ears, no hat), plus `head-mid` (halfway into Ram: patchy green creeping up his face, ears starting to point, no hat yet), all on the same canvas/neck point as each other AND matching the canvas/neck point of `ram-34/head-smirk` so they can be cross-faded.
- hands `hand-near-open`, `hand-far-open` (normal skin, no gloves), feet `foot-near`, `foot-far` (ordinary dark shoes).

## D. `public/sprites/props/` (each a transparent PNG; add `public/sprites/props/props.json` with `size` and a `grip` point where a hand holds it)
`ram-stick` (glowing green memory stick), `chip`, `byte` (small glowing cube), `gpu` (chunky graphics card), `cache-jar` (glass cookie jar of glowing chips), `ssd` (small drive), `sack` (bulging patched sack), `stamp` (giant rubber stamp with handle), `hat` (Ram's battered top hat alone), `scarf` (the red scarf alone, draped), `coin` (gold token with a circuit pattern).
