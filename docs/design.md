# Ram Altman's Christmas Song — music video design

Song: `Ram Altman's Christmas Song.mp3`, 259.6 s. Deliverable: `out/ram-altman.mp4`, 1920×1080, 24 fps, H.264 plus the original recording in AAC, with a sound-effects layer mixed in.

## 1. Intent

This is a parody music video for YouTube. A tech CEO caricature becomes "Ram Altman", a Scrooge-type miser who hoards the world's RAM. No one can afford electronics for under the tree. It should feel like a 1960s made-for-TV Christmas special that has turned up on an old CRT set: warm, snowy and festive, with the satire landing as sight gags.

Success looks like this:
- The video is funny on the first watch, and every joke in the lyrics gets a picture.
- It looks like a real vintage special, not a lyric video.
- It moves constantly, with varied camera angles and blocking. Characters cross the frame, turn away and exit, and are not just facing the camera.
- The lyrics are part of the world, not subtitles.

## 2. Goals, non-goals, anti-goals

**Goals**
- About 70 distinct shots, with no camera setup repeated back to back. Choruses cut faster than verses.
- Every lyric line is legible on screen at the right time, built into the scene.
- Ram Altman stays on-model throughout: one design, drawn from a turnaround.
- Christmas and snow in nearly every shot.

**Non-goals**
- No lip-sync during the song. The singer is a storybook narrator, and characters act through expression and body language. The only lip-sync is the spoken ending (§6, Ending).
- No full-motion hand-drawn in-betweening. Limited animation (held poses, cut-out joints, sliding layers) is in keeping with the period.
- No 3D.

**Anti-goals (failure even if it renders)**
- It reads as a static lyric video: characters facing the camera with text underneath.
- It uses any Dr. Seuss / Grinch / Whoville character, Scrooge McDuck, or any other existing character, logo or likeness. The style is homage, the characters are original. The town is "Byteville" (in visuals only; the lyrics never name it).
- It depicts any real person other than the satirical Ram Altman caricature. "Jim Carrey" in the outro appears only as lyric text, never as a likeness. No company logos.
- The text is baked into generated images, or the lyrics are wrong or out of sync.

## 3. Constraints

- **Hardware:** RTX 3060 laptop with 6 GB of VRAM. Rendering is headless AniCraft (CPU, about 2 s per 200 frames) plus Remotion/Chromium.
- **Tools:**
  - Codex image generation for all artwork.
  - AniCraft CLI and MCP for character animation and camera work. It's new: if a shot hits a blocker, that shot falls back to Remotion transforms.
  - Remotion for the edit and the lyrics.
  - ffmpeg for the CRT finish.
- **Pipeline reuse:** follows the sibling projects, especially Living Legend:
  - Demucs stems, Whisper rough timing, MMS forced alignment against `docs/lyrics.txt`
  - `audio.json` beat/onset analysis
  - deterministic renders and review contact sheets
- **Project layout:** all work stays in this folder.

## 4. Approaches considered

1. **Remotion cut-out puppets only** (how the earlier videos were made). Reliable sync and on-model characters, but the motion is limited and it reads as "basic".
2. **AI video generation from Codex keyframes.** Fluid motion, but characters drift off-model, real-person parody is likely to be refused, lyrics can't be built in, it costs per clip, and it can't run locally.
3. **Hybrid of 1 + AI hero shots.** Style mismatch risk.
4. **Chosen: Codex artwork → AniCraft animation → Remotion edit + lyrics → ffmpeg CRT.**
   - AniCraft adds IK bones, motion paths, a keyed camera with layer depth, and nested symbols, so characters can walk, turn and act.
   - Shots are generated as command scripts from the timing data, so they stay synced and repeatable.
   - Proven by the spike in `spike/`: `spike/out/spike-ram-sneak.mp4`.

## 5. Look

- **Drawing:** a 1960s TV-special look:
  - thin, slightly wobbly black ink lines
  - flat cel colour on characters
  - watercolour and dry-brush backgrounds
  - swooping, curly architecture
  - spindly, exaggerated limbs
- **Palette:**
  - deep teal-blue night
  - snow white with lavender shadow
  - holly red
  - warm window yellow
  - sickly villain green for Ram Altman
  - cold electric cyan for the data center's server glow
- **Frame:** the show is 4:3. Each shot renders at 960×720 and is downsampled to 480×360 for the CRT pass.
- **The final 1920×1080 frame is a vintage wooden console TV** filling the frame, with its 4:3 screen in the middle:
  - Codex paints the TV set as one plate, with knobs and a speaker grille.
  - The room around it is softly lit and festive (tinsel, a small tree glow at the edge of frame).
  - The screen opening is masked so the CRT picture sits behind a curved glass bezel.
- **CRT finish (ffmpeg, as in the spike, refined):**
  - 480×360 base upscaled, with a soft phosphor glow
  - scanlines
  - slight barrel curve
  - about 1.5 px red/blue fringing
  - film-weave jitter (±1 px per frame)
  - light noise and vignette
  - an occasional vertical-hold roll as a transition (used 2–3 times, not as a gimmick)
- **Titles:** the video opens on a vintage 1960s station-ident card reading **"Occupy SaaS presents"** (the client, Occupy Saas Inc), hand-lettered style rendered in code, then the title "RAM ALTMAN'S CHRISTMAS" in hand-lettered, code-rendered type over the snowy hill (shot 1). No real network logos.

## 6. Cast

All are original designs, each made from a Codex turnaround sheet (front, ¾, side, back) on magenta, keyed and cut into rig parts with pivots, as in the spike.

- **Ram Altman** (the design from the spike: top hat, red scarf, grey sweater, green fuzzy skin, pointy ears and slippers).
  - Needs a turnaround and these rigs:
    - side walk/sneak
    - ¾ standing
    - front close-up
    - back view
    - a seated sleigh-driving pose
  - Expression heads: smug smirk, scheming squint, cackle, greedy grin, panic, fake-friendly smile.
  - Mouth set (closed / open / wide / "ee" / "oo") for the ending line only.
- **Sam (before)**: the same face as a normal human. Healthy skin, round eyes, plain grey crewneck, no hat or scarf. Appears in the intro and the start of Verse 1, then transforms (§7, Verse 1).
- **Rig parts must be true left/right pairs (lesson from the spike, where both arms came out as the same near-side right arm).** For every side or three-quarter rig:
  - The **far arm and far leg are drawn as the opposite limb seen from the other side**: a mirrored hand with the thumb on the correct side, back of the hand vs palm as anatomy dictates, and the far sleeve/trouser seam showing.
  - Far limbs are a step darker or cooler, so they read as behind the body.
  - The near arm overlaps the torso and the far arm tucks behind it, with correct layer order: far limbs, then torso, then near limbs.
  - Codex generates near and far limbs as **separately specified parts on one sheet**, and each pair is checked before rigging by assembling the full puppet in the default pose and comparing it against the turnaround.
  - A rig test renders the assembled puppet beside the matching turnaround view. A rig is rejected if the two hands or feet are the same drawing.
- **The little girl**: a small Byteville kid in a too-big knit hat, with a gap-tooth smile, mittens and a cardboard science-fair trifold. Original design; must not resemble Cindy Lou Who: no blonde antenna pigtails, no nightgown. Needs ¾ and front views plus a mouth set for her two lines.
- **Byteville townsfolk**: 6–8 whole-cutout residents (a dad, a grandma, kids, a gamer teen) with stepped motion, and a group "elf choir" for the final chorus.
- **Elves**: 4 small data-center elves in green hoodies with headsets. They also need a "squashed into one JPG" version: a single blocky, smeared image of all four.
- **Reindeer**: two reindeer pulling the sleigh, with a "buffering" state (frozen, with a pixelated 480p overlay and a loading spinner drawn in code).
- **Props**:
  - RAM sticks (glowing green DIMMs), GPUs, SSDs, a cache "jar"
  - the sleigh (an ornate sled stacked with server racks)
  - Christmas tree, star, cookies, price tags, an invoice/receipt
  - a laptop with a spinning cursor
  - the "throne of GPUs"
  - a gift box, an empty stocking

## 7. Locations

Each gets background plates per camera angle (a wide plus 2–3 angles). Foreground layers are separate PNGs for parallax.

1. **The data center on the hill (exterior):**
   - Wide: a curly glass-and-chrome tower on a snowy peak, fans steaming, cyan glow.
   - Low angle looking up at the tower.
   - Down-angle from the tower to the town below.
2. **Server hall (interior):** the spike's room, plus:
   - Ram's desk with monitors and a token counter
   - the throne of GPUs
   - the vault of stolen RAM, shelves glowing green
3. **Byteville:**
   - Wide of the snowy town square with the big tree.
   - A living room interior with a tree and an empty spot under it.
   - Rooftops at night (for sleigh flyovers).
   - The electronics shop window with absurd price tags.
4. **Sky:** night sky with clouds, for sleigh flight and the crash.
5. **The data center door:** front step and big curly door, for the knocks and the ending.

## 7a. Running motif: the growing data center

The tower on the hill is a visual clock for Ram Altman's greed. Every time it appears, it is **bigger than last time**, with more smoke and more sparks:

| Stage | Where | Look |
|---|---|---|
| 1 | Intro, Verse 1 opening | A modest glass-and-chrome tower, one thin smoke plume, a few blinking lights |
| 2 | Verse 1 end, Chorus 1 | Extra floors and side wings bolted on, two or three stacks smoking, the occasional spark |
| 3 | Verse 2 | A sprawling, top-heavy mega-tower: cooling fans everywhere, thick smoke, steady spark showers, cyan glow lighting the clouds |
| 4 | Chorus 2, Bridge | Grotesquely huge, filling the sky, belching black-grey smoke, arcs of electricity, sparks raining onto the snow, cracks showing |
| 5 | Final chorus, Ending, Outro | At its peak, smoking and sparking non-stop, groaning and leaning |
| — | The silence | Collapses in on itself (shot 65) |

- **It pulses with the drums.** In every exterior shot, the tower does a quick squash-and-stretch "bump" on each kick drum, scaling up slightly from its base and settling back, and the windows flash on each snare. This is driven by the kick/snare onsets in `audio.json`. The bump gets stronger as the stages progress.
- **Smoke and sparks are particle layers** drawn in code (deterministic, frame-derived, as in the sibling projects' snow and rain), so they can build up continuously rather than in five fixed steps. Smoke volume, spark rate and glow all ramp with song position.
- **Art:** Codex paints the tower as 5 stage plates in the same angle and base position, plus a separate "add-on" layer for each stage (wings, stacks, fans), so growth can also be animated *within* a shot: new sections telescope up or bolt on, rather than only cutting between stages.
- **More appearances:** the tower appears from the window of every Byteville interior, and as a background element in the town wides, so the growth is visible all the way through, not just in the dedicated exterior shots. Shots 1, 6, 20, 23, 46, 49, 56, 60 and 65 feature it directly.

## 8. Section map and shot list

Times are rough Whisper segment times; the build re-derives them from forced alignment. "Lyric placement" says how each line appears in the world (§9).

### Intro (0–29 s): "'Twas the night before Christmas…"
1. Title card over the snowy hill, falling snow. The station ident wipes on. A slow push in.
2. A high crane-down from the stars to Byteville rooftops; chimneys smoke. *"'Twas the night before Christmas"* is painted in the sky as starlight joins up letter by letter.
3. Inside a living room: the family sleeps, the tree is empty underneath. A cat walks across left to right. *"and all through the stack"* appears on an embroidered wall sampler.
4. A tracking shot along a row of dark server racks inside the tower, with one tiny blinking light. *"Not a gigabyte stirred"* scrolls on a rack's LED panel.
5. A wide shot of an empty rack. Dust drifts. *"not one empty rack"* is shown on a dangling price tag.

### Verse 1 (29–62 s)
6. Exterior low angle up at the tower as the camera tilts up. *"He lived in a tower of glass and of chrome"* is shown etched on the glass.
7. The server hall: Sam (before) is seen from behind at his desk, facing a wall of monitors. GPUs hum, bobbing to the beat. *"a million GPUs hummed him a home"* appears on monitors.
8. **Transformation:** Sam turns ¾ toward camera. Green creeps across his skin and his ears sharpen. Hat and scarf drop on from above. A shape tween runs on the silhouette, then a shift to the Ram Altman rig. *"What I need," said Ram Altman* appears as a cartoon speech-scroll unrolling (written, not lip-synced).
9. A close-up of his greedy grin, with a fast camera push. *"is memory! More!"* stamps on in big bouncing letters.
10. An insert of hands snatching sticks of RAM, a chip and a byte (a tiny glowing cube) off a shop shelf, left to right. *"Every stick, every chip, every byte in the store"* appears on the shop's price tags.
11. A montage of 3 quick setups:
    - typing over the shoulder at night (moon in the window)
    - day (sun in the window), racks multiplying
    - the camera rotating around the hall as the racks scale up

    *"coded all night… scaled up all day"*: the text is typed on screen like a terminal.
12. Fans howl: a close-up of server fans spinning with wind-lines. *"howled in dismay"* blows across the frame like snow.
13. The spike shot, re-done on the final rig: the sneak past the window. *"But he never once asked all the folks down below"* on the window glass.
14. A cut to Byteville: a kid at a kitchen table with a laptop, a spinning cursor and a frozen face. *"Hey, is your little laptop now running slow?"* appears as a slow-loading progress bar.

### Chorus 1 (62–98 s): fast cuts, about 2–3 s each
15. The sleigh launches off the tower roof, swooping on a motion path across the sky from right to left. **RAM ALTMAN, RAM ALTMAN** is lettered on the sleigh's side banner.
16. A rooftop flyover. RAM sticks are sucked out of chimneys like a vacuum stream into the sleigh. *"he swiped all our RAM!"*
17. A close-up of Ram on the sleigh: he winks (head swap) and the sleigh zips out of frame. *"wink and then scrammed"* streaks off as a vapour trail.
18. A Byteville family looks at an empty spot under the tree. *"We asked for a PC to put under the tree"* is written on a gift tag.
19. The shop window: a RAM stick price tag flips over and over to bigger numbers. *"costs a kidney or three"* is shown on the tag, with a cartoon kidney icon drawn in code.
20. The tower in the clouds, with a big cyan glow. *"he's up in the cloud"*
21. Ram on top of a mountain of tokens (gold coins with circuit patterns), throwing them in the air. *"Selling tokens by the thousand"* rains down as coin text.
22. Ram cackles in a low-angle wide shot. *"laughs right out loud"*
23. Crane up and out from the hall through the roof to the glowing tower. *"Christmas in the data center, humming and bright"* appears in marquee lights.
24. Ram slams the vault door on a wall of glowing RAM. *"took every last gig-a-byte"* is stamped on the door.

### Verse 2 (98–135 s)
25. VRAM and cache grabbed: a side-view of two arms reaching with IK, pulling a GPU and a cache jar. *"He grabbed all the VRAM, he snatched all the cache"*
26. SSDs shoved into a bulging sack. **Music full-stop and whisper on "umm, stash":** the frame freezes, the camera shakes slightly, Ram looks at the camera with a squint, and the sack is crammed behind his back. The text "umm…" is small and whispered, then *"stash"*.
27. Ram at a whiteboard with a chart going up and to the right. *"This is more efficient!"* is written on the board in his own chalk scrawl.
28. Ram on a podium. *"bigger is best!"* appears on a giant banner unrolling down the tower.
29. A receipt printer spits an endless invoice down the stairs and out of the door into the snow. *"enterprise rates for the rest"* is printed on the receipt.
30. The elves are squashed into one JPG: four elves stand in a row, a giant "compress" press stamps down, and they become one blocky smeared image. *"The elves got compressed into one J.P.G."*
31. The reindeer, mid-air, freeze. The image pixelates to 480p blocks and a loading spinner turns over them. *"buffering at 480p"*
32. **The star shot (user idea):** the camera pushes up the Byteville tree to the shining star. *"The star on the tree is a premium tier"* is shown on a little velvet "PREMIUM" ribbon. The star spins (or the camera swings round) to show its back: blocky, pixelated placeholder art. It tips, falls in slow motion past the ornaments and **shatters** on the floor, with a glass-break sound effect. Shards scatter left to right.
33. A cash-register drawer opens with each word. *"charging per token for Christmas this year"* appears on register display tiles.

### Chorus 2 (135–168 s)
34. A sleigh pass in the opposite direction (left to right) at a low angle under the moon. *"he swiped all our RAM"*
35. Ram feeds RAM into a giant "model" machine with a dopey clam face (an original machine design). *"dumb as a clam"*
36. Carolers open their mouths and a scroll pops out. *"We asked for a carol, it gave us a list"*
37. The scroll reads *Ten XMas Facts*, with a little "posted on gist" sticky note slapped on. The text is code-rendered.
38. Ram on the throne of GPUs, seen from a low angle as the camera rises. *"on a throne of GPUs"*
39. Ram squashes tiny cutout "little guys" (shop owners, kids with garage startups) under a rubber stamp. *"Squashing all the little guys"*. He waves: *"Bye now, don't sue!"* is shown on a legal-letter envelope.
40. Christmas morning: the family runs downstairs in a ¾ shot left to right. *"we woke up on Christmas"*
41. An overhead of the empty floor under the tree. *"looked 'round to find"*
42. A close-up of a plate with cookies and crumbs, and a note, *"Ram Altman left nothing but cookies behind!"*, written on a "browser cookies" consent-banner style card.

### Bridge (168–188 s): slow and dramatic, with darker light
43. A slow push on Ram alone in his vault. His heart, shown x-ray style, is two tiny DIMM chips. *"your heart is two DIMMs too small"*
44. The monitors behind him flash a "kernel panic" screen (original design, code-rendered). *"Your kernel's in panic"*
45. Racks stall; the lights go out row by row toward the camera. *"your servers all stall"*
46. A wide of the sleigh overloaded with all the town's memory, sagging, struggling into the air. *"hoarded the memory of every last town"*
47. A dutch-angle tracking shot: the sleigh tips and sputters. *"Now the sleigh's overloaded"*
48. The crash: the sleigh nose-dives through clouds and hits the snowy hill. RAM sticks explode out in a fountain of green sparkles across Byteville. *"and it's going down!"* A small, deadpan *(Oh no.)* appears at the edge of frame.

### Final chorus (188–219 s): triumphant, with the elf choir
49. Townsfolk and elves march up the hill left to right, holding lanterns. *"we're taking it back!"*
50. Elves rip a paywall (a velvet rope with a price sign) apart. *"We un-paywalled the tokens"*
51. An elf with a big band-aid patches a cracked server. *"patched up the hack"*
52. Townsfolk building a tower together out of open, transparent boxes, as a timelapse. *"We built it all open, we built the full stack!"*
53. A giant balloon labelled with a ridiculous valuation number pops; confetti. *"It popped pretty fast!"*
54. A chorus of the whole town, shot as a wide crane-up. *"now hand back the RAM!"*
55. Gifts land under trees across town: consoles, laptops and a ham-radio set, in quick cuts. *"every console, laptop and HAM!"*
56. Wind turbines, a water tower and green fields return to the hill around the tower. *"Give us back our energy, water and LAND!"*

### Ending (219–233 s): the spoken scene
57. **Full stop. Three knocks.** A cut to the big curly door of the data center. The knocks are synced to the audio and the door shakes on each one.
58. The door creaks open. Ram, in fake-friendly smile mode, looks down. Reverse angle over his shoulder down to the little girl on the step with her science-fair trifold. **She speaks (lip-sync):** *"Merry Christmas! Mr Sam!"*, then *"Please sir, I want to win my school's computer science prize."*
59. A two-shot in profile. Ram crouches to her level, holds up his hand and **speaks (lip-sync):** *"Cool, hi-five! I will help, if you hit subscribe!"* High five, sparkle. A big cartoon red **SUBSCRIBE** button-shaped sign (code-drawn, generic, no YouTube logo) pops up between them.

### Outro (233–259.6 s): deadpan narrator
60. Slow pull-back from Ram waving the girl off, back inside, to an exterior wide of the tower. *"He never grew a heart… but he just became more shrewd"*
61. An elf assembly line ships boxes stamped with blank labels out of the tower. *"the elves ship the next scam or two"*
62. An old-timey theatre marquee on Byteville's main street. *"Jim Carry may have been the best grinch for you!"* is written on the marquee as text only: no likeness, no imagery.
63. A spotlight pops on Ram on a stage, bowing. *"But Sam your the best!"*
64. **Full stop, loud:** a smash cut to an extreme close-up of Ram with a card reading *"Ebenezer Scrooge!"*. A CRT vertical-roll glitch.
65. **Silence: the data center collapses.** A cut to the exterior wide of the tower at its biggest (see §7a). In total silence, it implodes in on itself: floors telescope down, racks fold, the smoke sucks back inward and the sparks wink out, until it's a small heap of snow-covered scrap on the hill. Byteville's windows glow warm below. Then the TV switches off: the picture collapses to a white dot that fades, and the console TV and room hold for a beat before fading to black. (Any collapse sound effect stays very quiet or is left out, to keep the silence.)

(About 65 numbered beats. Montage beats such as 11, 25–26 and 55 split into several setups, which brings the total to about 70–75 cuts.)

## 9. Lyric treatment

- Every line from `docs/lyrics.txt` appears on screen. `docs/lyrics.txt` is the user's lyric text **with spelling corrected for display**: some misspellings were only there to steer the AI singer's pronunciation. Corrections: "Jim Carry" → "Jim Carrey", "Ebonezer" → "Ebenezer", "your the best" → "you're the best", "He he shoved" → "He shoved", "my my schools" → "my school's", "XMas" → "Xmas", "Please sir" → "Please, sir". Stage notes in brackets are never shown. Alignment still runs against the sung words. It is rendered in code over the AniCraft plates in Remotion, placed *in the world*: signs, tags, screens, receipts, snow, banners, as listed per shot.
- Words appear one by one as they're sung, driven by forced alignment, and hold until the line ends or a cut.
- Typography:
  - A hand-lettered storybook serif for narration lines.
  - A chunky, bouncy display face for chorus hooks ("RAM ALTMAN, RAM ALTMAN").
  - Monospace or LED styles for tech surfaces (terminals, rack panels).
  - All fonts are OFL and bundled in `public/fonts/` with their licences, as in the sibling projects.
- Text that's attached to the world tracks the plate it sits on: Remotion receives each shot's camera transform from AniCraft (exported per shot as JSON), so the text moves with the parallax.
- Spoken/bracketed lines (the whisper, "(Oh no.)", the ending dialogue) are smaller and sit in the frame, not on props.

## 10. Sound

- The original recording is untouched.
- A sound-effects layer is mixed under it at moderate levels:
  - glass shatter (the star)
  - sleigh whoosh and bells on flyovers
  - crash thud and debris (bridge)
  - door creak (ending), plus the knocks if the recording's knocks are weak
  - a CRT power-off zap (end)
  - an occasional servo/fan whirr
- Use CC0 or self-made effects only, with sources recorded in `docs/sfx.md`.

## 11. Production pipeline

1. **Timing.**
   - `docs/lyrics.txt` from the user's lyrics.
   - Demucs stems, Whisper rough timing, then MMS forced alignment in windows.
   - `src/timing/words.json`
   - `audio.json` (beats, onsets, and the stops at "stash", "[Full Stop] (3 knocks)" and the final "Ebonezer Scrooge!")
2. **Art (Codex).**
   - Turnaround and rig sheets per character, expression heads, and background plates per camera angle.
   - The TV-set plate.
   - All on magenta and keyed with `scripts/prepare_assets.py`.
   - Every asset is visually checked. Prompts go in `docs/asset-prompts.md`.
3. **Rigs (AniCraft).**
   - One `rigs/<character>-<view>.anicraft` per rig, built by scripts (as in the spike: symbols, bones and pivots from `rig.json`).
   - Heads are movie-clip symbols with frames for each expression and mouth shape.
4. **Shots (AniCraft).**
   - `shots/<NN>-<name>.py` generators emit a command script from shot parameters plus timing.
   - Run with `anicraft-cli run`, render with `render-seq` at 960×720.
   - Each shot also exports its camera keys as JSON for lyric tracking.
   - Learned in the spike:
     - Camera moves need real keyframes on the camera layer, then classic tweens.
     - Graphic symbols inside armatures restart at each pose key, so use movie clips for heads.
     - `dx` in bone poses is relative.
     - Render with explicit `--from/--to`.
5. **Edit (Remotion).**
   - `src/Video.tsx` sequences the shot image sequences against the audio.
   - It adds the lyric layers, titles and code-drawn props (spinners, progress bars, subscribe sign).
   - It renders the 4:3 programme at 960×720.
6. **Finish (ffmpeg).**
   - CRT pass at 480×360, upscaled.
   - Composited into the TV-set plate at 1920×1080.
   - Sound effects mixed in, then encoded.
7. **Review.**
   - Contact sheets of 8 frames per section.
   - A sync check of 10 sampled words against the isolated vocals.
   - Full-length watch-through.
   - Notes go in `docs/review.md`.

**Order of work:**
- Stills first. A **stills animatic**: one key frame per shot, cut to the music with lyrics and the CRT pass, delivered for review before animating.
- Then animation, section by section, starting with Verse 1 and Chorus 1 to lock the look.

## 12. Decided by the user

- A 1960s Christmas-special look; low resolution, upscaled with a CRT finish; 4:3 inside a wooden TV set.
- Ram Altman is a Sam caricature blended with Scrooge and a green grumpy look, in an original design (the spike design is approved).
- A data center on a snowy hill, and a sleigh.
- Lots of motion, varied camera angles, characters crossing the frame. Not a basic lyric video.
- Lyrics are part of the scenes.
- Option 1 build (cut-out puppets) with AniCraft for animation; fall back to Remotion if AniCraft fails.
- No lip-sync in the song. The singer narrates; only the ending dialogue is lip-synced.
- The star shot: shows its pixelated back, falls and shatters with a glass-break sound effect.
- Codex generates stills, with a stills sample before animation.
- Lyric typos are fixed in the on-screen text (some were only there for the AI singer's pronunciation).
- The data center on the hill grows bigger, smokier and sparkier as the story goes on and bumps with the drums. It collapses in on itself during the final silence.

- The video is made for **Occupy Saas Inc** (3 or fewer people, so Remotion's free licence applies); branding is a "Occupy SaaS presents" station ident at the start.

## 13. Left to the builder

- Exact shot durations within each section, following the beats and the lyric timing.
- Font choices within the typography rules in §9.
- Which effects are AniCraft tweens and which are Remotion overlays.
- Per-shot framing and blocking within the beats above.
- Choosing and sourcing the sound effects within the rules in §10.
