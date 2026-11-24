# Ram Altman — Phase 2 Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved stills animatic into the finished video `out/ram-altman.mp4`. It adds:
- the "Occupy SaaS presents" ident and the title card
- the growing tower that bumps on the drums, with building smoke and sparks
- the star that spins to its pixelated back, falls and shatters
- the tower's collapse at the end
- rubber-hose character animation drawn in code: walks, sneaks, grabs, the sleigh flights and the lip-synced ending
- per-shot effects

**Architecture (revised 2026-11-23 after the rubber-hose test, approved by the user):** The Phase 1 Remotion programme stays the master: it owns timing, the camera, lyrics, snow and the TV/CRT finish. **Character animation is rubber-hose style, drawn in code in Remotion** (proven by the `src/spike/` shot-13 test), not AniCraft bones:
- Painted limbless parts from Codex (heads with expressions, torso, hands, feet), placed by anchors.
- Arms and legs are bendy SVG tubes between those parts.
- Poses change on twos, the body squashes on kicks, and the outlines boil.

Motion comes in three tiers, assigned per shot in `docs/motion.yaml`:
- **A, puppet shots:** a clean background plate (`public/plates/NN.png`) plus one or more puppets, choreographed per shot in `src/shots/NN.ts`.
- **B, Remotion effects:** code-drawn layers over the still: the tower bump, growth, smoke and sparks; the star; the collapse; buffering; JPG compression; kernel panic; lights out; confetti.
- **C, still plus camera:** as in Phase 1.

AniCraft is no longer required. It's kept only as an option if a path-heavy shot is easier there. The first pass favours getting every shot moving; the user will review and we clean up afterwards.

**Tech Stack:**
- Remotion 4 (SVG puppets)
- Codex image generation (limbless puppet parts, clean plates, sprites)
- Rhubarb Lip Sync 1.14 (`~/.local/opt/Rhubarb-Lip-Sync-1.14.0-Linux/rhubarb`)
- Pillow/numpy in `.venv`
- `node --test`

**Spec:** `docs/design.md` (§5 Look and Titles, §6 Cast and the near/far limb rule, §7a the growing tower, §8 shot list, §10 Sound). Direction notes are in `docs/shot-ideas.md`. The Phase 1 plan `docs/superpowers/plans/2026-11-23-stills-animatic.md` and its rulings hold: no bottom captions, impact-word lyrics, the tone rule, knocks as sound effects, and the collapse playing over the instrumental tail from `impact.silence`.

## Global Constraints

- Everything from Phase 1's Global Constraints still applies: 259.6 s at 24 fps (6231 frames), 960×720 programme, 1920×1080 final, deterministic renders, no text in generated images, original characters only, no lip-sync during the song.
- Puppets live in still space (1600×1200), inside `Still`'s camera transform, so the camera and lyrics work unchanged.
- **Near/far limbs** (design §6): far limbs and far hand/foot are drawn behind the torso, one shade darker, with the far hand mirrored (thumb on the correct side). The layer order is far limbs → torso and head → near limbs.
- **Movement rules from the user's review of the test:**
  - **Walks:** arms hang at the sides and swing opposite to the same-side leg. Feet are planted (stance) or arcing (swing) and never slide.
  - **Stops:** the feet plant first. Then the body follows through: it overshoots, springs back, and the head and arms lag and settle.
  - Poses change on twos.
  - The whole body squashes on kicks (nearest kick only, no stacking).
  - Outlines boil in a 3-frame cycle.
- Occupy SaaS branding appears **only** as the opening "Occupy SaaS presents" station ident, rendered in code.
- The tower never shrinks before shot 65; its stage and scale only increase (design §7a).
- The finished video must be committed-reproducible with `bash scripts/render.sh && bash scripts/finish.sh out/ram-altman.mp4`.

## Review Focus

1. **A puppet whose parts or anchors are missing at render time** (a typo in a part name renders an empty hole). Owner: Task 4/5. Test: `test('every part a choreography references exists in its parts.json')`.
2. **Drum bumps landing between frames or doubling.** A kick within 2 frames of another must not stack into a giant bump. Owner: Task 2. Test: `test('tower bump is bounded and peaks on kick frames')`.
3. **Shot 32's star sequence versus the glass-break time.** The shatter's first visual frame must be the effect's frame ±1. Owner: Task 3. Test: `test('star shatters on the glass-break frame')`.
4. **Lip-sync mouths outside the spoken lines.** A mouth must never open during the song or the gaps. Owner: Task 7. Test: `test('ending mouths are closed outside lines 46-48')`.
5. **A clean plate that doesn't match its still** (the camera reveals a jump at the cut from the tier-C still). Owner: Task 4/5. Check: a visual diff contact sheet `out/sheets/plates.png`, read before each batch is accepted.

---

## File Structure

```
docs/motion.yaml                     per-shot tier (A|B|C), puppets, fx, action notes
docs/towers.json                     per tower shot: polygon, base, top (still fractions)
docs/fx-regions.json                 effect regions per shot (still fractions)
docs/codex/2x-*.md                   Codex briefs (puppet parts, plates, sprites)
public/puppets/<who>/*.png, parts.json   limbless parts + anchors (spike format), e.g. ram-side, sam-side, girl, reindeer, elf, townsfolk
public/plates/NN.png                 clean background plates for tier-A shots
public/sprites/*.png                 star front/back, rubble, sleigh, props
src/puppet/geom.ts                   vector helpers, hose maths, springs, easing, on-twos time
src/puppet/Hose.tsx                  rubber-hose limb + end-orientation
src/puppet/Puppet.tsx                generic biped puppet: Pose → SVG (parts, limbs, layer order, boil, squash)
src/puppet/walk.ts                   planted-foot walk/sneak/run cycles + stop follow-through (the spike's rules)
src/puppet/Quadruped.tsx             reindeer: 4 hose legs, gallop cycle
src/shots/NN.ts                      per-shot choreography: (t, frame) → puppets[] with poses
src/fx/Ident.tsx, Title.tsx, Tower.tsx, particles.ts, Star.tsx, Overlays.tsx
src/lipsync.ts, timing/rhubarb/      ending mouth cues
tests/phase2.test.mjs, tests/puppet.test.mjs
```

---

### Task 1: Motion map, ident and title card

**Files:**
- Create: `docs/motion.yaml`, `src/fx/Ident.tsx`, `src/fx/Title.tsx`, `tests/phase2.test.mjs`
- Modify: `scripts/build_shots.py`, `src/Animatic.tsx`

**Interfaces:**
- Produces:
  - `docs/motion.yaml`, keyed by shot number: `{tier: A|B|C, rigs: [..], fx: [..], action: "…"}`.
  - `build_shots.py` copies `tier`, `fx` and (for tier A) `plate: "plates/NN.png"` and `puppets: [..]` into `src/shots.json`.
  - `Ident`/`Title` are drawn by `Animatic` over shot 1: the ident from 0 to 3.2 s, the title from 3.6 to 7.8 s.

**Tier assignment** (from design §8 actions):
- **A (rubber-hose puppets):**
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

### Task 4: Puppet library, proven by porting shot 13

**Files:**
- Create: `src/puppet/{geom.ts,Hose.tsx,Puppet.tsx,walk.ts}`, `src/shots/13.ts`, `src/shots/index.ts`, `tests/puppet.test.mjs`
- Move: `public/rubber/*` → `public/puppets/ram-side/`, plus `parts.json` from `src/spike/parts.json`
- Modify: `src/Still.tsx`. For a tier-A shot it draws `public/plates/NN.png` and the shot's puppets inside the camera transform.
- Delete: `src/spike/` and the `Spike13` composition once shot 13 runs in the main programme.

**Interfaces:**
- Produces:
  - `type Pose = {hip: P; lean: number; head: string; headRot: number; hands: {near: P; far: P; nearPart: string; farPart: string}; feet: {near: P; far: P}; squash: number; flip: boolean}`
  - `<Puppet who="ram-side" pose={Pose} scale frame />`
  - `walkCycle({t, x0, x1, steps, stepDur, floor, lift}) => {x, feet, armSwing: {near, far}, hipDip, stopped, since}`: planted-foot steps, ending with both feet planted.
  - `followThrough(since, amp, w, k, lag) => number`: the damped spring used after stops.
  - `onTwos(frame) => number`
  - `squashAt(t) => number`
  - `shotPuppets(id, t, frame) => {who, pose, scale}[]`
- Consumes: the `public/puppets/<who>/parts.json` anchors (torso: neck, shoulderNear/Far, hipNear/Far; head: neck; hands: wrist; feet: ankle).

- [ ] **Step 1: Write the tests**
  - `test('planted foot does not slide during stance')`: within a stance window, the foot x is constant (±0.5 px).
  - `test('walk ends with both feet planted on the floor')`: after the stop, both feet y equal the floor.
  - `test('arms swing opposite to the same-side leg')`: the sign of the near arm swing is opposite to the near foot's forward velocity at mid-swing.
  - `test('body overshoots after the feet stop, then settles')`: `followThrough` is non-zero just after the stop and below 1 px after 1.5 s.
  - `test('poses change on twos')`: `onTwos(2k) === onTwos(2k+1)`.
  - `test('hose keeps its length without elbows')`: the arc length of the quadratic stays within 8% of L for distances from 0.4L to L.
- [ ] **Step 2:** Run `node --test tests/puppet.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implement the library by refactoring `src/spike/Rubber.tsx` into the files above (same maths and colours), then write `src/shots/13.ts` from the spike's choreography.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 4 frames of shot 13 from the main `Animatic` and compare them with the spike frames.
- [ ] **Step 5:** Commit `feat: rubber-hose puppet library; shot 13 in the main programme`.

### Task 5: Ram's and Sam's acting shots

**Files:**
- Create:
  - `docs/codex/21-puppets-ram.md`
  - `public/puppets/{ram-34,sam-34,ram-sleigh}/*`, plus expression heads added to `ram-side` (grin, panic, fake-smile)
  - `public/plates/{08,10,17,21,22,24,25,26,27,39,43,63}.png`
  - `src/shots/{08,10,17,21,22,24,25,26,27,39,43,63}.ts`

**Interfaces:**
- Consumes: the Task 4 library.
- Produces: the per-shot choreography.
- The Codex brief asks for **limbless parts** only, as in the spike brief (`spike/rubber/codex-brief.md`): near and far hands in open, grab, point and fist poses, near and far feet, and the expression heads. Plates are each still with the animated characters removed and identical framing.

**Per-shot action** (from design §8 and `motion.yaml`):
- **08:** Sam ¾ turns. The head crossfades from Sam to Ram over 1.2 s with a squash-and-stretch pop, the hat and scarf drop on along arcs, and sparkles burst.
- **10:** the near arm reaches to three shelf targets, one per stressed word, using the grab hand.
- **17:** the whip arm makes a big arc, and the head swaps to a wink on "wink".
- **21:** both arms fling up on each beat.
- **22:** cackle, with the head thrown back on the snares.
- **24:** a shoulder push, with the door rotating closed (a door sprite cut from the still).
- **25:** two-arm pull with an elastic overshoot.
- **26:** shove, shove, then at `impact.stash` a freeze: hold the pose, the head snaps to the squint toward the camera, a 2-frame white flash and a 0.15 s camera micro-shake.
- **27:** pointing jabs on the beats.
- **39:** the stamp comes down on "Squashing", and the little guys scatter as sprites.
- **43:** chest clutch, as the x-ray heart glow pulses.
- **63:** a bow, with the hat tipped.

- [ ] **Step 1:** Add `test('every tier-A shot has a plate, its puppets and a choreography module')` to `phase2.test.mjs`, and run it. Expected: FAIL.
- [ ] **Step 2:** Get the Codex parts and plates. Check each parts preview sheet: near/far hands differ, no limbs drawn, no text.
- [ ] **Step 3:** Write the 12 choreography modules.
- [ ] **Step 4:** Run the tests. Expected: PASS. Read a plate-vs-still diff sheet and 3 frames per shot.
- [ ] **Step 5:** Commit `feat: Ram and Sam acting shots`.

### Task 6: Sleigh flights and the crash

**Files:**
- Create: `public/puppets/reindeer/*` (limbless body, head, hooves), `public/sprites/sleigh-*.png`, `public/plates/{15,16,31,34,46,47,48}.png`, `src/puppet/Quadruped.tsx`, `src/shots/{15,16,31,34,46,47,48}.ts`

**Interfaces:**
- Produces:
  - `<Quadruped pose />`: 4 hose legs with a gallop cycle, phase-offset per deer.
  - A team group (2 deer, the reins drawn as curves, the sleigh sprite and the `ram-sleigh` puppet) moving along a path `(t) => {pos, angle, dir}`.
  - **Every deer and Ram face the direction of travel:** `flip = dir < 0`.

- [ ] **Step 1: Write the test** `test('sleigh teams face their direction of travel')`: sample each sleigh shot's path, and check that `flip === (dx < 0)` for every puppet in the team. Run it. Expected: FAIL.
- [ ] **Step 2:** Get the Codex parts, sprites and plates.
- [ ] **Step 3: Choreography**
  - 15: launch arc.
  - 16: a rooftop pass with the RAM stream into the sack.
  - 31: the team freezes on "buffering" (`fx: buffering` pixelates it and shows a spinner).
  - 34: a left-to-right pass under the moon.
  - 46: sagging lift-off, with a short, fast leg cycle.
  - 47: tipping (team rotation ±25°, wobbling).
  - 48: a nose-dive into the hill, impact squash, and a RAM fountain (`fx: ramFountain`).
- [ ] **Step 4:** Run the tests. Expected: PASS. Read 3 frames per shot.
- [ ] **Step 5:** Commit `feat: sleigh flights and crash`.

### Task 7: The spoken ending (shots 57–59)

**Files:**
- Create:
  - `public/puppets/girl/*` (with mouth heads A–H, X)
  - Ram ¾ mouth heads in `public/puppets/ram-34/`
  - `scripts/rhubarb.sh` (from Living Legend)
  - `src/timing/rhubarb/ending.json`, `src/lipsync.ts`
  - `public/plates/{58,59}.png`, `src/shots/{57,58,59}.ts`

**Interfaces:**
- Produces:
  - `mouthAt(who: 'girl' | 'ram', t) => 'A'..'H' | 'X'`, from Rhubarb cues on the vocal stem over 219.0–233.4 s. Lines 46–47 belong to the girl and line 48 to Ram.
  - The puppet head part is `head-<mouth>`.

- [ ] **Step 1: Write the tests**
  - `test('ending mouths are closed outside lines 46-48')`
  - `test('girl speaks lines 46-47, Ram speaks line 48')`
  - `test('door shakes on each knock')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Get the Codex parts and plates, then run `bash scripts/rhubarb.sh ending 219.0 233.4 Ending`.
- [ ] **Step 4: Choreography**
  - 57: the door shakes ±6 px, decaying over 0.25 s, on each knock.
  - 58: the girl sways hopefully, and the trifold lifts on "prize".
  - 59: Ram crouches, both arms rise, the palms meet on "hi-five!" with a sparkle, and the head snaps to the fake smile on "subscribe".
- [ ] **Step 5:** Run the tests. Expected: PASS. Read 6 frames per shot, checking that the mouths open on the syllables.
- [ ] **Step 6:** Commit `feat: lip-synced ending`.

### Task 8: Crowd and elf shots

**Files:**
- Create: `public/puppets/{elf,townsfolk-*}/*`, `public/plates/{40,49,61}.png`, `src/shots/{40,49,61}.ts`

**Interfaces:**
- Produces: simplified puppets (parts plus hose limbs) using the shared walk cycle.
  - 40: the family runs downstairs left to right (`runCycle` on a slope).
  - 49: a march with lanterns swinging from the hands.
  - 61: elves pack: arms alternate placing items into boxes on the beat, and the boxes slide along the belt.

- [ ] **Step 1:** Extend the tier-A test to cover these shots, and run it. Expected: FAIL.
- [ ] **Step 2:** Get the Codex parts and plates, and write the choreography.
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
- [ ] **Step 2:** Run `bash scripts/render.sh` and `bash scripts/finish.sh out/ram-altman.mp4`.
- [ ] **Step 3: Verify**
  - `ffprobe` shows 1920×1080, 24 fps, AAC, 259.6 ± 0.05 s.
  - Contact sheets via `scripts/contact.sh` (pointed at `out/ram-altman.mp4`): Read all 9.
  - Watch-list frames: shot 15 deer direction, 26 freeze, 32 shatter, 48 crash, 58/59 mouths, 65 collapse.
- [ ] **Step 4:** Record the results in `docs/review.md`, commit `feat: phase 2 final render`, and deliver a ≤30 MB preview with SendUserFile.
