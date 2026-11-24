# Ram Altman — Phase 2 Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved stills animatic into the finished video `out/ram-altman.mp4`. It adds:
- the "Occupy SaaS presents" ident and the title card
- the growing tower that bumps on the drums, with building smoke and sparks
- the star that spins to its pixelated back, falls and shatters
- the tower's collapse at the end
- character animation in AniCraft: walks, sneaks, grabs, the sleigh flights and the lip-synced ending
- per-shot effects

**Architecture:** The Phase 1 Remotion programme stays the master: it owns timing, the camera, lyrics, snow and the TV/CRT finish. Motion comes in three tiers, assigned per shot in `docs/motion.yaml`:

- **A, AniCraft frames.** AniCraft renders a full still-space plate sequence (1600×1200 stage: a clean background plate plus rigged puppets) to `public/frames/NN/`. `Still` plays that sequence instead of the still image, so the camera and lyrics work unchanged.
- **B, Remotion effects.** Code-drawn layers over the still: the tower bump, growth, smoke and sparks; the star; the collapse; buffering; JPG compression; kernel panic; lights out; confetti.
- **C, still plus camera.** As in Phase 1.

**Tech Stack:**
- AniCraft CLI (`anicraft-cli run` / `render-seq`)
- Codex image generation (rig parts, clean plates, sprites)
- Remotion 4
- Rhubarb Lip Sync 1.14 (`~/.local/opt/Rhubarb-Lip-Sync-1.14.0-Linux/rhubarb`)
- Pillow/numpy in `.venv`
- `node --test`

**Spec:** `docs/design.md` (§5 Look and Titles, §6 Cast and the near/far limb rule, §7a the growing tower, §8 shot list, §10 Sound). Direction notes are in `docs/shot-ideas.md`. The Phase 1 plan `docs/superpowers/plans/2026-11-23-stills-animatic.md` and its rulings hold: no bottom captions, impact-word lyrics, the tone rule, knocks as sound effects, and the collapse playing over the instrumental tail from `impact.silence`.

## Global Constraints

- Everything from Phase 1's Global Constraints still applies: 259.6 s at 24 fps (6231 frames), 960×720 programme, 1920×1080 final, deterministic renders, no text in generated images, original characters only, no lip-sync during the song.
- AniCraft stage for every tier-A shot is **1600×1200 at 24 fps**, rendered with `render-seq --scale 0.5`. Frames are saved as JPEG at quality 90: `public/frames/NN/f_00001.jpg` and so on, one per programme frame of the shot.
- **Rigs use true near/far limb pairs** (design §6): mirrored hands, correct thumbs, far limbs one step darker, layer order far limbs → torso → near limbs. A rig is rejected if its near and far hand parts are the same drawing.
- AniCraft lessons from the spike:
  - Heads that change frames are **movie-clip** symbols.
  - Bone `dx`/`dy` is relative: key poses in ascending frame order.
  - The camera stays in Remotion, never in AniCraft.
  - Always render with explicit `--from/--to`.
- Occupy SaaS branding appears **only** as the opening "Occupy SaaS presents" station ident, rendered in code.
- The tower never shrinks before shot 65; its stage and scale only increase (design §7a).
- The finished video must be committed-reproducible with `bash scripts/render.sh && bash scripts/finish.sh out/ram-altman.mp4`.

## Review Focus

1. **The number of AniCraft frames versus the shot's programme frames.** An off-by-one (AniCraft's 1-based CLI, the 0-based MCP) shows as a frozen or skipped frame at a cut. Owner: Task 4. Test: `test('every tier-A shot has exactly one frame per programme frame')`.
2. **Drum bumps landing between frames or doubling.** A kick within 2 frames of another must not stack into a giant bump. Owner: Task 2. Test: `test('tower bump is bounded and peaks on kick frames')`.
3. **Shot 32's star sequence versus the glass-break time.** The shatter's first visual frame must be the effect's frame ±1. Owner: Task 3. Test: `test('star shatters on the glass-break frame')`.
4. **Lip-sync mouths outside the spoken lines.** A mouth must never open during the song or the gaps. Owner: Task 7. Test: `test('ending mouths are closed outside lines 46-48')`.
5. **A clean plate that doesn't match its still** (the camera reveals a jump at the cut from the tier-C still). Owner: Task 4/5. Check: a visual diff contact sheet `out/sheets/plates.png`, read before each batch is accepted.

---

## File Structure

```
docs/motion.yaml                     per-shot tier (A|B|C), rig list, fx list, action notes
docs/towers.json                     per tower shot: polygon (still fractions), base point, smoke/spark emitters
docs/codex/10-*.md                   Codex briefs (rigs, plates, sprites)
public/rigs/<rig>/*.png, rig.json    keyed rig parts with pivots/sockets (spike format)
public/plates/NN.png                 clean background plates for tier-A shots (still without the animated characters)
public/sprites/*.png                 star front/back, rubble heap, sleigh+load, title card art
public/frames/NN/f_#####.jpg         AniCraft renders (gitignored, rebuilt by scripts/shots.sh)
scripts/rig_check.py                 assembles a rig in default pose next to its turnaround; near/far difference metric
scripts/ac/lib.py                    AniCraft script helpers: new_stage, place_plate, place_rig, pose, walk, path, head_frames, export
shots/NN.py                          one generator per tier-A shot → shots/NN.json (anicraft-cli script)
scripts/shots.sh                     build rigs, run generators, run anicraft-cli, render frames
src/fx/Ident.tsx, Title.tsx          Occupy SaaS ident + title card
src/fx/Tower.tsx, particles.ts       tower mask layer, bump/growth, smoke/sparks, collapse
src/fx/Star.tsx                      shot 32 star spin, fall, shards
src/fx/Overlays.tsx                  buffering, jpg-compress, kernel-panic flash, lights-out, confetti, stash freeze
src/lipsync.ts, timing/rhubarb/      ending mouth cues
tests/phase2.test.mjs
```

---

### Task 1: Motion map, ident and title card

**Files:**
- Create: `docs/motion.yaml`, `src/fx/Ident.tsx`, `src/fx/Title.tsx`, `tests/phase2.test.mjs`
- Modify: `scripts/build_shots.py`, `src/Animatic.tsx`

**Interfaces:**
- Produces:
  - `docs/motion.yaml`, keyed by shot number: `{tier: A|B|C, rigs: [..], fx: [..], action: "…"}`.
  - `build_shots.py` copies `tier`, `fx` and (for tier A) `frames: "frames/NN"` into `src/shots.json`.
  - `Ident`/`Title` are drawn by `Animatic` over shot 1: the ident from 0 to 3.2 s, the title from 3.6 to 7.8 s.

**Tier assignment** (from design §8 actions):
- **A (AniCraft):**
  - 08 transformation (Sam → Ram)
  - 10 shelf snatch
  - 13 window sneak
  - 15, 16, 31, 34, 46 sleigh flights
  - 17 wink and whip
  - 21 token fling
  - 22 cackle
  - 24 vault push
  - 25 two-arm grab
  - 26 stash shove and freeze
  - 27 point at chart
  - 39 stamp
  - 40 family runs downstairs
  - 43 chest clutch
  - 47 sleigh tips
  - 48 crash
  - 49 march
  - 58, 59 ending (lip-sync, hi-five)
  - 61 elves packing
  - 63 bow
- **B (effects on the still):**
  - 01, 02, 06, 20, 23, 28, 52, 54, 56, 60, 62, 65 tower
  - 05 dust
  - 07 GPU hum
  - 11 terminal
  - 12 fans spin
  - 14 spinner
  - 19 price-tag flip
  - 29 receipt scroll
  - 30 JPG compress
  - 32 star
  - 33 register
  - 35 clam chomp
  - 44 panic flash
  - 45 lights out
  - 50 coins
  - 53 confetti
  - 55 gifts drop
- **C:** everything else.

Every shot has motion: tier C keeps its camera move, snow and lyrics.

- [ ] **Step 1: Write the tests**
  - `test('every shot has a motion tier and tier-A shots name their rigs')`
  - `test('ident then title play over shot 1 before the first sung word')`: the ident ends before the title starts, and the title ends before `lyrics[0].start`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Write `motion.yaml` and extend `build_shots.py`.
  - **`Ident`:** a 1960s station-ident card. A cream-on-teal sunburst oval with a TV-test-pattern feel, "Occupy SaaS" in Bowlby One, "presents" in IM Fell italic, and a slow zoom. It fades through a CRT flicker to the title.
  - **`Title`:** "RAM ALTMAN'S" over "CHRISTMAS" in Mountains of Christmas Bold, holly red with a cream outline. Letters drop in one by one with an ease-out bounce, plus a snow-dust sparkle.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render frames 30, 90 and 150 with `remotion still` and Read them.
- [ ] **Step 5:** Commit `feat: motion map, Occupy SaaS ident, title card`.

### Task 2: The growing tower (bump, growth, smoke, sparks)

**Files:**
- Create: `docs/towers.json`, `src/fx/Tower.tsx`, `src/fx/particles.ts`; append to `tests/phase2.test.mjs`
- Modify: `src/Still.tsx`, which renders `shot.fx` layers inside the camera transform, in still space

**Interfaces:**
- Consumes: `src/timing/audio.json` kicks and snares, `shots.json` `towerStage`.
- Produces:
  - `towerBump(t: number, stage: number) => number`: the scale add-on, 0 at rest.
  - `towerGrowth(t: number) => number`: a monotonic 1.0 → 1.12 over the song.
  - `<Tower shot t />`: the masked tower layer, scaled about `base` by `(1 + growth + bump)`, with smoke and sparks.
  - `docs/towers.json`: `{ "NN": {poly: [[x, y], ...], base: [x, y], top: [x, y]} }` in still fractions.

- [ ] **Step 1: Write the tests**
  - `test('tower bump is bounded and peaks on kick frames')`:
    - Max bump ≤ 0.02 + 0.01 × stage.
    - At each sampled kick frame the bump is ≥ 70% of its max.
    - Two kicks 1 frame apart produce no more than one stage-max (no stacking).
  - `test('tower growth never decreases before the collapse')`
  - `test('every tower shot has a polygon whose base is inside it')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Author the polygons in `towers.json`, using the grid sheets method from Phase 1 (`spike/work/blanks-*.png`).
  - The tower layer is the still clipped to the polygon (CSS `clip-path: polygon(...)`), scaled up about `base`. It only ever grows, so the original under it is always covered.
  - `towerBump`: for the latest kick k ≤ t, `amp(stage) × e^(−(t−k)/0.09)`, using the max over kicks rather than the sum. Snares add a 0.25 window-flash on the layer's brightness.
  - Smoke and sparks are deterministic particles emitted at `top`. Their rate and size ramp with `towerStage` and song time (design §7a). Sparks are hidden at stage 1.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 3 frames each of shots 06, 28 and 54 on and off a kick, and Read them.
- [ ] **Step 5:** Commit `feat: growing tower with drum bump, smoke and sparks`.

### Task 3: The star (shot 32) and the collapse (shot 65)

**Files:**
- Create: `docs/codex/10-sprites.md`, `public/sprites/{star-front,star-back,rubble}.png`, `public/plates/32.png`, `public/plates/65.png`, `src/fx/Star.tsx`; extend `src/fx/Tower.tsx` (collapse); append tests

**Interfaces:**
- Produces:
  - `starState(t) => {phase: 'shine' | 'spin' | 'fall' | 'shatter' | 'gone', angleY, y, rot, shards}`. The phase becomes `shatter` on the glass-break effect's frame.
  - `collapse(t) => {sy, sx, wobble, smokeIn, rubble}` over `[impact.silence, TV_OFF - 0.3]`.

- [ ] **Step 1: Write the tests**
  - `test('star shatters on the glass-break frame')`: the shatter starts within 1 frame of `shots[31].sfx[glass-break].t`.
  - `test('star shows its pixelated back during the spin')`
  - `test('collapse is complete before the TV switches off')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Codex sprites and plates**
  - The star front as a transparent sprite matching still 32.
  - **`star-back.png` is made in code:** the front downscaled to 24 px with nearest-neighbour, recoloured to a flat grey-and-magenta placeholder checker, then upscaled again.
  - Plate 32 is still 32 with the star removed. Plate 65 is the hill and town with the tower removed.
  - A rubble-heap sprite.
- [ ] **Step 4: Implement**
  - **Star timing:**
    - It shines until the line "premium tier" ends.
    - It spins on the Y axis (scaleX through 0, swapping to the back) over 0.35 s and holds the back for 0.4 s.
    - It tips and falls under gravity with rotation, past the ornaments and out of the bottom.
    - At the effect's time, 14 glass shards burst from the bottom edge, left to right, with a white flash.
  - **Collapse:** the tower layer telescopes down (scaleY to 0.12 with a stepped, floor-by-floor ease and a ±1.5° wobble). Smoke particles reverse inward, sparks wink out, and the rubble fades in at the base.
- [ ] **Step 5:** Run the tests. Expected: PASS. Render 8 frames across shot 32 and 6 across shot 65, and Read them.
- [ ] **Step 6:** Commit `feat: star spin-fall-shatter and tower collapse`.

### Task 4: Rig and plate pipeline, proven on shot 13

**Files:**
- Create:
  - `docs/codex/11-rig-ram-side.md`, `public/rigs/ram-side/*`
  - `scripts/rig_check.py`, `scripts/ac/lib.py`, `shots/13.py`, `scripts/shots.sh`, `public/plates/13.png`
- Modify: `src/Still.tsx` (frame sequences), `.gitignore` (`public/frames/`); append tests

**Interfaces:**
- Produces:
  - `scripts/ac/lib.py` (Python; each function returns a list of anicraft-cli steps):
    - `new_stage(frames)`
    - `place_plate(path)`
    - `place_rig(rig_dir, at: (x, y), scale, flip=False, layer_name)` returning `RigHandle{bones: {name: id}, armature_layer, head_symbol}`
    - `pose(h, frame, **angles)`
    - `move(h, frame, dx, dy)`
    - `sneak_cycle(h, f0, f1, stride, x0, x1)`
    - `walk_cycle(...)`
    - `head_frames(h, schedule: [(frame, head_index)])` (the movie-clip schedule from the spike)
    - `export_frames(shot_id, n)`
  - `scripts/shots.sh [NN ...]`: runs each `shots/NN.py`, then `anicraft-cli run`, then `render-seq --from 1 --to n --scale 0.5`, then JPEG at quality 90 into `public/frames/NN/`.
  - In `Still`: if `shot.frames` is set, it draws `frames/NN/f_{k}.jpg` for programme frame k of the shot, stretched to 1600×1200 still space.

- [ ] **Step 1: Write the tests**
  - `test('every tier-A shot has exactly one frame per programme frame')`: the count equals `round(end*24) - round(start*24)`. It skips shots not yet rendered and lists them.
  - `test('rig near and far hands differ')`: `scripts/rig_check.py --metric` reports a hand difference > 0.15 (normalised pixel difference after aligning the mirrored far hand), for every rig in `public/rigs/`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Codex brief `11-rig-ram-side.md`**
  - It references the cast sheet. Ram faces right in side profile.
  - A parts sheet on magenta: torso with scarf, three expression heads (smirk, squint, cackle), and **near and far** upper/lower arms, hands, thighs and shins+slippers, specified separately. The far hand is mirrored with the thumb on the correct side, and far limbs are a step darker.
  - Keyed with `scripts/prepare_assets.py`, with `rig.json` pivots and sockets.
  - **Plate brief:** still 13 with Ram removed, identical framing.
- [ ] **Step 4:** Implement `rig_check.py` (it assembles the default pose and writes `out/sheets/rig-<name>.png` beside the turnaround crop). Implement `lib.py` from the spike's `gen_shot.py`/`build_script.py` patterns, and `shots/13.py` from the spike's choreography: sneak in, gaze, "Hey!" cackle head, rub hands, sneak off. Mouth flaps are removed (narrator rule) and replaced by expression heads.
- [ ] **Step 5:** Run the tests. Expected: PASS. Read the rig sheet and 6 frames of shot 13 in the full render (`remotion still`).
- [ ] **Step 6:** Commit `feat: rig pipeline, Ram side rig, animated shot 13`.

### Task 5: Ram's acting shots

**Files:**
- Create:
  - `docs/codex/12-rigs-ram-more.md`, `public/rigs/{ram-34,sam-34,ram-sleigh}/*`
  - `public/plates/{08,10,17,21,22,24,25,26,27,39,43,63}.png`
  - `shots/{08,10,17,21,22,24,25,26,27,39,43,63}.py`

**Interfaces:**
- Consumes: `lib.py` and `RigHandle` from Task 4.
- Produces: the frame sequences for these shots.

**Per-shot action** (from design §8 and `motion.yaml`):
- **08:** the Sam rig turns ¾. A crossfade-and-shape tween of the head from Sam to Ram over 1.2 s, the hat and scarf dropping on along motion paths, a sparkle burst.
- **10:** the near arm reaches by IK to three shelf targets in turn, one per stressed word.
- **17:** whip crack (arm arc), with the head swapping to the wink on "wink".
- **21:** both arms fling up on each beat.
- **22:** a cackle head bob on the snares.
- **24:** a shoulder push; the door rotates closed via a door sprite cut from the still.
- **25:** two-arm IK pull, with an elastic overshoot.
- **26:** shove, shove, then at `impact.stash` a **freeze**: hold the pose, snap the head to the squint toward the camera, and Remotion adds a 2-frame white flash and a 0.15 s camera micro-shake.
- **27:** pointing jabs on the beats.
- **39:** the stamp drops on "Squashing", with the little guys scattering.
- **43:** chest clutch, as the x-ray heart glow pulses.
- **63:** a bow with the hat tipped.

- [ ] **Step 1:** Append to the tier-A frame-count test (it now expects these shots), and run it. Expected: FAIL (frames missing).
- [ ] **Step 2:** Codex rigs and plates. Run `rig_check.py` on each rig and read its sheet. A failing rig gets a re-brief that lists the defect.
- [ ] **Step 3:** Write the 12 generators and run `scripts/shots.sh 08 10 17 21 22 24 25 26 27 39 43 63`.
- [ ] **Step 4:** Run the tests. Expected: PASS. Build the plate-vs-still diff sheet `out/sheets/plates.png` and 3 frames per shot, and Read them.
- [ ] **Step 5:** Commit `feat: Ram acting shots`.

### Task 6: Sleigh flights and the crash

**Files:**
- Create: `public/rigs/reindeer-side/*`, `public/sprites/sleigh-*.png`, `public/plates/{15,16,31,34,46,47,48}.png`, `shots/{15,16,31,34,46,47,48}.py`

**Interfaces:**
- Produces: frames. Each sleigh team is one group moved along `motion.set_path`, with deer leg cycles (4 legs, 2 bones each) phase-offset per deer. **Every deer and Ram face the direction of travel:** the generator flips the rig with `flip=True` when the path runs right to left, and a test checks this.

- [ ] **Step 1: Write the test** `test('sleigh rigs face their path direction')`: each sleigh shot's generator metadata `shots/NN.meta.json` records `{dir: -1|1, flip}`, and `flip === (dir < 0)`. Run it. Expected: FAIL.
- [ ] **Step 2:** Codex reindeer rig (right-facing side run, separate near/far legs) and sleigh sprites with plates. Run `rig_check`.
- [ ] **Step 3: Generators**
  - 15: launch arc.
  - 16: a rooftop pass, with a RAM-stream particle path into the sack.
  - 31: the team freezes at the "buffering" word, then Remotion pixelates it and shows a spinner (`fx: buffering`).
  - 34: a left-to-right pass under the moon.
  - 46: sagging lift-off, with the deer straining (a short, fast leg cycle).
  - 47: tipping (group rotation ±25°, wobbling).
  - 48: a nose-dive along a path into the hill, impact squash, and a RAM-stick fountain (particle burst, Remotion `fx: ramFountain`).
- [ ] **Step 4:** Run `scripts/shots.sh` for these shots, then the tests. Expected: PASS. Read 3 frames per shot.
- [ ] **Step 5:** Commit `feat: sleigh flights and crash`.

### Task 7: The spoken ending (shots 57–59)

**Files:**
- Create:
  - `public/rigs/girl-34/*` (with mouth set A–H, X)
  - Ram ¾ mouth set added to `public/rigs/ram-34/`
  - `scripts/rhubarb.sh` (from Living Legend)
  - `src/timing/rhubarb/ending.json`
  - `public/plates/{58,59}.png`, `shots/{58,59}.py`
- Modify: `src/Animatic.tsx` (door shake on knocks, shot 57)

**Interfaces:**
- Produces:
  - Rhubarb cues for lines 46–48, run on the vocal stem over 219.0–233.4 s.
  - `mouthAt(who: 'girl' | 'ram', t) => 'A'..'H' | 'X'`.
  - The generators bake the cues into each head movie clip with `head_frames`.

- [ ] **Step 1: Write the tests**
  - `test('ending mouths are closed outside lines 46-48')`
  - `test('girl speaks lines 46-47, Ram speaks line 48')`: the cues are non-X only inside the owning character's lines.
  - `test('door shakes on each knock')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Codex: the girl ¾ rig with 9 mouths and Ram's 9 mouths, matching the cast sheets, plus plates 58/59. Run `rhubarb.sh ending 219.0 233.4 Ending`.
- [ ] **Step 4: Generators**
  - 58: the girl's hopeful sway, with the trifold lift on "prize".
  - 59: Ram crouches, both arms rise by IK, and the palms meet on "hi-five!", with a sparkle. On "subscribe" his head snaps to the fake-friendly smile.
  - 57: the Remotion door gets a ±6 px shake decaying over 0.25 s at each knock.
- [ ] **Step 5:** Run the tests. Expected: PASS. Read 6 frames per shot, checking that the mouths open on the syllables.
- [ ] **Step 6:** Commit `feat: lip-synced ending`.

### Task 8: Crowd and elf shots (stepped cut-outs)

**Files:**
- Create: `public/sprites/crowd-*.png` (cut from the stills with Codex mattes), `public/plates/{40,49,61}.png`, `shots/{40,49,61}.py`

**Interfaces:**
- Produces: frames. Characters are whole cut-outs moved with stepped motion on twos: a bob of ±6 px and a lean of ±3° per step.
  - 40: the family runs downstairs left to right.
  - 49: a march with lanterns swinging.
  - 61: elves pack, with arms swapping between 2 poses per beat and boxes sliding along the belt.

- [ ] **Step 1:** Add these shots to the frame-count test, and run it. Expected: FAIL.
- [ ] **Step 2:** Make the Codex sprites and plates, then write the generators and run `shots.sh`.
- [ ] **Step 3:** Run the tests. Expected: PASS. Read 3 frames per shot.
- [ ] **Step 4:** Commit `feat: crowd and elf shots`.

### Task 9: Per-shot effects overlays

**Files:**
- Create: `src/fx/Overlays.tsx`; append tests

**Interfaces:**
- Produces: one `fx` name per behaviour, each `({shot, t, frame}) => JSX` drawn inside the camera transform:
  - `dust` (05), `gpuHum` (07: monitor glow pulse on beats), `terminal` (11: scrolling code glyph blocks, not readable text)
  - `fans` (12: rotating fan overlays at authored centres), `spinner` (14), `tagFlip` (19: the price tag flips 3 times on beats)
  - `receipt` (29: the paper scrolls), `jpg` (30: the right half block-pixelates in steps), `buffering` (31)
  - `register` (33: the drawer jolts on each word), `clamChomp` (35: the jaw region bobs on beats), `panic` (44: red-screen flash on snares)
  - `lightsOut` (45: darkness sweeps toward the camera on beats), `coins` (50), `confetti` (53), `giftDrop` (55)
  - `vroll`: the CRT vertical-hold roll transition (design §5), used exactly 3 times: ident → title, the cut into shot 48 (crash), and the cut into shot 64 (the "Ebenezer Scrooge!" smash)
- Region coordinates for each effect go in `docs/fx-regions.json` (still fractions), authored from the grid sheets.

- [ ] **Step 1: Write the test** `test('every fx named in shots.json has an implementation and a region')`, and run it. Expected: FAIL.
- [ ] **Step 2:** Implement the effects (deterministic, frame-derived), each driven by `audio.json` beats, kicks or snares where noted.
- [ ] **Step 3:** Run the tests. Expected: PASS. Read 2 frames per effect shot.
- [ ] **Step 4:** Commit `feat: per-shot effect overlays`.

### Task 10: Final render and review

**Files:**
- Modify: `scripts/finish.py` (output name argument), `docs/review.md`

- [ ] **Step 1:** Run `node --test tests/`. Expected: all PASS.
- [ ] **Step 2:** Run `bash scripts/shots.sh` (all tier A), `bash scripts/render.sh` and `bash scripts/finish.sh out/ram-altman.mp4`.
- [ ] **Step 3: Verify**
  - `ffprobe` shows 1920×1080, 24 fps, AAC, 259.6 ± 0.05 s.
  - Contact sheets via `scripts/contact.sh` (pointed at `out/ram-altman.mp4`): Read all 9.
  - Watch-list frames: shot 15 deer direction, 26 freeze, 32 shatter, 48 crash, 58/59 mouths, 65 collapse.
- [ ] **Step 4:** Record the results in `docs/review.md`, commit `feat: phase 2 final render`, and deliver a ≤30 MB preview with SendUserFile.
