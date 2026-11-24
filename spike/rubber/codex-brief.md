# Brief: rubber-hose test parts for Ram Altman (throwaway spike)

Use your image_gen tool. The attached `ram.png` cast sheet is the exact model for Ram Altman; `13.png` is the current key still for shot 13. Look at every result and regenerate anything off-model or containing text/letters/logos. Do not ask questions. Stop when every file below exists and you have checked it.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.


## 1. Clean plate: `public/plates/13.png`
Repaint `13.png` exactly (same framing, window, racks, lanterns, floor, palette) but with Ram Altman REMOVED: empty floor where he was. Save as exactly 1600x1200 PNG (Pillow crop/resize, never stretch).

## 2. Parts for a rubber-hose puppet (no arms, no legs!)
These parts will be animated with arms and legs drawn in code as bendy tubes (1930s rubber-hose style), so draw NO arms and NO legs on any part. Generate a parts sheet on flat pure magenta #FF00FF (never use magenta in the art), each part separated with space around it, Ram facing RIGHT in side profile, same scale for all parts (torso about 420 px tall on the sheet). Then key out the magenta and crop each part to its own transparent PNG in `spike/rubber/parts/` with a Python/Pillow script (save the script as `spike/rubber/prepare_parts.py`; no magenta fringe):
- `torso.png`: sweater body with the long tattered red scarf, NO head, NO arms, NO legs; clean round openings/shoulder area where arms would attach, hip line at the bottom.
- `head-smirk.png`, `head-squint.png`, `head-cackle.png`: side-profile head with the battered top hat, three expressions (smug smirk; scheming narrow-eyed squint; head-thrown-back cackle with mouth open). Identical size and neck position on all three.
- `hand-near-open.png`, `hand-near-grab.png`: the near (right) hand in a fingerless grey glove with long bony green fingers — open with fingers raised and splayed; curled grabbing claw. Wrist cuff at the left edge of the image.
- `hand-far-open.png`: the FAR (left) hand seen from the other side — thumb on the opposite side to the near hand, one shade darker/cooler.
- `foot-near.png`, `foot-far.png`: curled-toe black slipper with a sliver of green ankle, side view pointing right; far foot one shade darker.

Also write `spike/rubber/parts.json`: for each file its pixel size and anchor points in local pixels — torso: `neck`, `shoulderNear`, `shoulderFar`, `hipNear`, `hipFar`; head: `neck`; hands: `wrist`; feet: `ankle`.
