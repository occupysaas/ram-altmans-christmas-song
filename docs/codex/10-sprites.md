# Brief: star sprite, rubble sprite and two clean plates

Use your image_gen tool. Attached: `32.png` and `65.png` (current key stills). Look at each result; regenerate if off-style, misaligned with the still, or containing text/letters/logos. Do not ask questions. Stop when all four files exist and you have checked them.

## Style (most important)
A 1960s made-for-TV Christmas cartoon special look: thin, slightly wobbly black ink outlines, flat cel colors with no gradients on characters, watercolor-wash backgrounds with dry-brush texture, curly swooping shapes, exaggerated spindly limbs, slightly limited palette (deep teal-blue night, snow white with lavender shadow, holly red, warm window yellow, sickly villain green). It must be an ORIGINAL design: do not copy the Grinch, Whoville, Scrooge McDuck or any existing character.
No text, letters, numbers or logos anywhere in any image.


1. `public/plates/32.png`: repaint `32.png` exactly (same framing, tree, ornaments, lanterns, bow, tower in the background, palette) but with the gold STAR at the top of the tree REMOVED: the red bow stays, the tip of the tree above the bow is plain branch. Exactly 1600x1200 PNG (Pillow crop/resize, never stretch).
2. `public/sprites/star-front.png`: the same shining gold five-point star from the top of `32.png`, front view, with its warm glow rays, on flat magenta #FF00FF; key the magenta to transparency (no fringe) and crop tight with ~20 px margin. About 300 px across.
3. `public/plates/65.png`: repaint `65.png` exactly (same framing, hill, snowy town, trees, sky, palette) but with the giant tower REMOVED from the right side: the snowy hilltop continues where the tower stood, empty sky above (keep the drifting smoke wisps out). Exactly 1600x1200 PNG.
4. `public/sprites/rubble.png`: a small snow-dusted heap of broken server racks, bent pipes, cracked glass panes and a few dim green RAM sticks, side view, wider than tall (~600x260), on flat magenta; key to transparency, crop with ~20 px margin.

Write the keying script you use to `scripts/key_magenta.py` (input path, output path) so it can be re-run.
