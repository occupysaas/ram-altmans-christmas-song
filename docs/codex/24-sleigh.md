# Brief: reindeer puppet parts, sleigh sprites and clean plates for the sleigh shots

Use your image_gen tool. Attached: cast sheets `reindeer.png`, `ram.png`, the current stills `15.png 16.png 31.png 34.png 46.png 47.png 48.png`, and `public/puppets/ram-34/head-grin.png` + `public/puppets/ram-34/torso.png` for style matching. Look at every result; regenerate if off-model, if any drawn legs appear on the reindeer body, or if any text/letters/logos appear. Do not ask questions. Stop when every file exists and you have checked it; write `preview.png` in each new folder.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

The reindeer legs are drawn in code as bendy rubber-hose tubes, so draw NO legs on the body. All reindeer parts face RIGHT, side view. Generate on flat magenta #FF00FF sheets, key with `scripts/key_magenta.py`, crop with ~10 px margin, one consistent scale (body about 700 px long).

## A. `public/puppets/reindeer/`
- `body`: lanky reindeer torso with harness, red collar with bells, short tail, side view facing right, NO legs, NO head (neck stump at the front-top).
- `head`: sleepy-eyed head with big antlers strung with tiny coloured lights, side view facing right, with the neck.
- `head-strain`: same head, eyes squeezed, teeth gritted (straining).
- `head-panic`: same head, eyes huge, mouth open (crash).
- `hoof-near`, `hoof-far` (far one a shade darker): a small dark hoof with a fringe of fur, side view.
- `parts.json` exactly: `{"body": {"size": [w,h], "neck": [x,y], "hipFront": [x,y], "hipBack": [x,y], "tail": [x,y]}, "head": {"size": [w,h], "neck": [x,y]}, "head-strain": {...same}, "head-panic": {...same}, "hoof-near": {"size": [w,h], "ankle": [x,y]}, "hoof-far": {...}}` (hipFront = where the front legs join, hipBack = where the hind legs join).

## B. `public/sprites/sleigh/` (side view facing RIGHT, keyed transparent)
- `sleigh`: the ornate curly gold-and-purple sleigh with a long blank cream banner on its side and an empty seat, stacked high at the back with server racks tied with rope.
- `sleigh-loaded`: the same sleigh grossly overloaded with a heaped mountain of glowing green RAM sticks, sagging.
- `ram-seated`: Ram Altman seated (for the sleigh), side view facing right, holding reins, with the battered top hat and red scarf — one complete figure, no separate parts.
- `ram-seated-panic`: the same, eyes wide, mouth open, hat flying up.
- `sleigh.json`: `{"sleigh": {"size": [w,h], "hitch": [x,y], "seat": [x,y]}, "sleigh-loaded": {...same}, "ram-seated": {"size": [w,h], "hands": [x,y], "seat": [x,y]}, "ram-seated-panic": {...same}}` — hitch = front tip where the reins attach, seat = seat point; hands = where the reins are held.

## C. Clean plates (exactly 1600x1200, Pillow crop/resize, never stretch) in `public/plates/`
Repaint each attached still EXACTLY but with the sleigh, the reindeer, Ram Altman, the reins and any flying loot REMOVED (keep the sky, tower, town, roofs, moon, snow, clouds and RAM streams from chimneys removed too): `15.png 16.png 31.png 34.png 46.png 47.png 48.png`. For 48 also remove the burst of green RAM sticks; keep the snowy hill and town.
Write `out/sheets/plates-sleigh.png` showing each still beside its plate.
