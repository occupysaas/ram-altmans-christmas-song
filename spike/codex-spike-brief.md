# Brief: test-shot artwork for "Ram Altman's Christmas Song" (throwaway spike)

Work in `spike/assets/` of this folder. Generate images with your image_gen tool, check each one visually, regenerate anything off-model, then key out backgrounds and save the parts. Do not ask questions. Stop when every file below exists and you have looked at it.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.

## Character: "Ram Altman"
A satirical cartoon caricature of a tech CEO turned holiday miser: a slight young man with short messy brown hair, very large round eyes, a wide thin-lipped smug grin. His skin has a pale, slightly fuzzy villain-green tint and his ears come to small points. He wears a plain grey crewneck sweater, a long tattered red Victorian scarf, a battered black top hat, fingerless wool gloves with long bony fingers, and slim dark trousers with pointy curled-toe slippers. Hunched, scheming posture.

Generate the character in a strict **side profile, facing right**, mid tiptoe-sneak pose, on a flat pure magenta (#FF00FF) background (never use magenta in the character). Then produce these separate parts as transparent PNGs, cut cleanly so they can be rigged with joints (each part overlaps generously at its joint, ~1500px tall total figure):
- `ram-torso.png` (torso + scarf, no head, no arms, no legs)
- `ram-head-closed.png`, `ram-head-open.png`, `ram-head-wide.png` (profile head with hat, three mouth states, identical otherwise)
- `ram-arm-upper-back.png`, `ram-arm-lower-back.png` (forearm + hand, fingers raised sneakily)
- `ram-arm-upper-front.png`, `ram-arm-lower-front.png`
- `ram-leg-upper-back.png`, `ram-leg-lower-back.png` (shin + curled slipper)
- `ram-leg-upper-front.png`, `ram-leg-lower-front.png`
- `ram-full.png` (the whole figure, transparent, for reference)
The easiest reliable way: generate a clean parts sheet with each part separated on magenta, then crop and key with a Python/PIL script (write it to `spike/scripts/`). Make sure no magenta fringe remains.

## Background: server room at night, 2400x1350
`bg-serverroom.png`: interior of a dim, cosy-sinister data-center room drawn in the same 1960s style. Rows of tall curly-topped server racks with tiny blinking lights (drawn as colored dots) on the left and right. In the middle, a big arched window looks out on a snowy hill at night with a small cartoon town of crooked houses glowing far below, snow falling, big stars. Floor runs across the lower third so a character can walk left to right along it.
`fg-rack.png` (transparent): a single tall server rack silhouette edge plus a hanging cable, for the extreme foreground left, about 1350px tall.
`fg-snowsill.png` (transparent): a snowy window-sill/garland strip with holly, 2400px wide, for the foreground bottom.

Write `spike/assets/README.md` listing each file, its pixel size, and the joint (pivot) pixel coordinates for every character part (where it attaches to its parent), so it can be rigged.
