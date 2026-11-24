# Cleanup Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user's review notes on the first animated pass (2026-11-24) and re-render.

**Architecture:** Reuse the Phase 2 machinery:
- Codex plates and sprites.
- Rubber-hose puppets (`src/puppet/`).
- Per-shot choreography (`src/shots/`), effects in `src/fx/`.
- Holds through `holdFrame`.

New art is produced in one Codex batch (Task 1) so the later tasks can be built against it.

**Tech Stack:** Remotion 4, TypeScript, Python (build_shots, key_magenta), Codex image generation, ffmpeg.

**Spec:** `docs/design.md` plus the review notes below (copied verbatim in `docs/review.md` §Pass 1 notes).

## Global Constraints
- **Shots 01–06 (0:00–0:33) are "S tier, DO NOT ALTER":** none of their code or data changes. A test pins their `shots.json` entries.
- **These shots are approved and stay as they are:** 05–06, 13, 13b, 14–17, 26–29, 33, 34, and 48 onward except 63 and 65.
- **Content rules:**
  - Original characters only.
  - No logos or real store branding; the shop in 25 is a generic electronics store.
  - No text in generated images.
  - No golden parachutes.
- **Animation rules:**
  - Animation uses `holdFrame`.
  - Arms hang at the sides.
  - No lip-sync except shots 58 and 59.
- **Fans (shot 12):** made in code. No paid video generation unless the user asks after seeing them.

## Review Focus
- **Text over new plates:** lyric boxes on the new plates must stay inside the frame and readable. Covered by the existing `shots.test` lyric-in-view test, rerun after `build_shots`.
- **Missing parts:** a new puppet whose `parts.json` names a missing part. Covered by `assets.test`, extended to every puppet dir.
- **Reins (shots 46/47):** the rein end points must lie on a deer's harness point every frame, including when the sleigh tips. Covered by a test in Task 3.
- **Ending timing:** the explosion must finish (RAM rain under way) before TV_OFF, and the tower must never shrink before the blast. Covered by a test in Task 9.
- **Duration:** the programme length stays 6231 frames (no shot boundaries move). The existing `timing.test` covers this.

---

### Task 1: Codex art batch

**Files:**
- Create: `docs/codex/27-cleanup.md`.
- Create plates: `public/plates/{07,12,18,19,21,22,24,25,30,36,39,65}.png`.
- Create sprites:
  - `public/sprites/fan/` (blade, hub, housing ring)
  - `public/sprites/store/` (RAM box)
  - `public/sprites/topdown-elf/` (`elf-a`, `elf-b`, the four-armed `elf-multi`, `piston`)
  - `public/sprites/ending/` (`ram-stick`, `burst`)
  - `public/sprites/carolers/`
  - `public/sprites/townsfolk/`
- Create puppet dirs as needed (sad family as puppets: reuse `dad`, `mum`, `kid1`, `kid2`).

**Each plate is the approved still with the movable things painted out:**
- **07:** the monitors' desk with Sam removed. Sam is the `sam-34` puppet, plus a mouse sprite.
- **12:** the server room with the three fans' blades removed, leaving the empty housings.
- **18:** the empty tree room without the family.
- **19:** the shop window without the price tag and without people.
- **21 and 22:** the night sky over Byteville rooftops with shop fronts below (a new composition), with the sleigh flying above.
- **24:** the vault interior. The door is open on the right, with floor space below for spilled RAM.
- **25:** a generic electronics store aisle. Shelves of RAM boxes left of centre, open floor, no people.
- **30:** a top-down workshop floor, north to south: 4 conveyor lanes, a piston housing at each lane's north end, no elves.
- **36:** the carolers' street without the carolers.
- **39:** the town square from above-ish, with nobody in it.
- **65:** the hill and town with no tower, a night sky, and room for the RAM rain.

- [ ] **Step 1:** Write the brief.
  - Base it on `docs/codex/style.md`.
  - Give it each still as an `-i` input.
  - Ask for magenta (#FF00FF) backgrounds on all sprites.
- [ ] **Step 2:** Run it: `codex exec --skip-git-repo-check -s workspace-write -C . -i <stills…> - < docs/codex/27-cleanup.md > docs/codex/27-cleanup.log`, then key the sprites with `scripts/key_magenta.py`.
- [ ] **Step 3:** Check every file in a contact sheet and Read it.
  - Repaint any file with text, logos or a wrong style through a follow-up brief.
  - Delete stray `preview.png` files.
- [ ] **Step 4:** Commit with the message `art: cleanup-pass plates and sprites`.

### Task 2: Quick fixes on existing shots

**Files:**
- Modify: `src/shots/ram-side-shots.ts` (10, 63), `src/fx/fxMath.ts` (star), `src/layout.ts` (spacing), `scripts/build_shots.py` (fit tags), `docs/motion.yaml`.
- Test: `tests/phase2.test.mjs`.

**Fixes:**
- **10 (0:42):** each grab target y is 50 px lower in still space than now, per item (RAM, chip, byte), and the hand reaches the item.
- **63 (4:06):**
  - Through the bow, both hands stay below the shoulders.
  - The near hand ends at the hip holding the hat, swept down and out, not overhead.
  - The far hand hangs at the side.
- **32 (star):** the spin starts at `max(premium.s, shot.start + 1.2)`, so the good face shows for at least 1.2 s.
- **Impact-word spacing:** a space is always kept between a plain word and a following impact word. The bug shows in shot 14 as "your LITTLE".
- **19 (1:17):** every lyric box fits inside its tag or card region. The text may not clip, and the box grows or the font shrinks until it fits.
- **13b:** the word "BELOW," keeps a margin of at least 24 px from the frame edge.

- [ ] **Step 1: Write the tests**
  - `test('shots 01-06 are frozen')`: compare against a committed snapshot `tests/fixtures/frozen-01-06.json`, written from the current `shots.json` before any change.
  - `test('bow hands stay below shoulders')`: sample 63 every 6 frames and check `hand.y > shoulder.y` for both hands.
  - `test('star front shows ≥1.2 s')`: `starState(shot32.start + 1.19).face === 'front'`.
  - `test('impact word keeps its leading space')`: lay out `lyrics` for shot 14 and check that the gap between "your" and "LITTLE" is at least 0.25 em.
  - `test('lyric boxes stay ≥24 px inside the frame')` for every shot.
  - `test('shot 10 hands land on their targets')`: at each grab beat, the distance from the hand to the target is under 20 px.
- [ ] **Step 2:** Run `node --test tests/`. Expected: the new tests FAIL and the frozen test PASSES.
- [ ] **Step 3:** Implement the fixes.
- [ ] **Step 4:** Run the tests. Expected: all PASS. Render one still each of 10, 14, 19, 32 (+0.5 s) and 63 (bow peak), and Read them.
- [ ] **Step 5:** Commit with the message `fix: grab targets, bow hands, star front hold, impact spacing, tag fit`.

### Task 3: Sleigh reins and deer (46, 47)

**Files:**
- Modify: `src/puppet/Quadruped.tsx` (`SleighTeam`), `src/shots/sleigh.ts`.

**Interfaces:**
- Produces `teamGeometry(state, scale, t) => {harness: [x, y][], sleighHooks: [x, y][]}`, used by both the renderer and the test.

**Requirements:**
- Each rein is drawn from a sleigh hook to its deer's harness point, with no gap.
- Shot 47 shows its deer (remove `deer: false`).
- When the team tips, the deer tip with it (rigid team transform).

- [ ] **Step 1: Write the test.** `test('reins meet the harness every frame')`: for shots 46 and 47, at every 3rd frame, each rein end equals a harness point within 1 px.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run it. Expected: PASS. Render 3 frames each of 46 and 47, and Read them.
- [ ] **Step 5:** Commit with the message `fix: sleigh reins attach to the deer; deer back in 47`.

### Task 4: Sam at the computer (07) and the GPU fans (12)

**Files:**
- Create: `src/shots/07.ts`, `src/fx/Fans.tsx`.
- Modify: `src/shots/index.ts`, `docs/motion.yaml` (07 → tier A, puppets `[sam-34]`; 12 keeps tier B with `fx: [fans]`), `src/fx/registry.ts`.

**07 (0:34–0:37):**
- Sam is seated at the desk, seen 3/4 from behind.
- His near hand moves the mouse sprite, which slides with eased darts to a new spot on each beat.
- A clicking finger flicks on snares.
- The on-screen cursor on the monitor mirrors the mouse offset (×3) and pops a small click ring.
- His head turns slightly to follow the cursor.
- Bob and sway apply.

**12 (0:51): `Fans` draws each of the 3 fan housings from `fx-regions.json` `12.fans[i] = {c: [x, y], r}` with:**
- The blade sprite rotating at 8 turns/s, reading as a held strobe under `holdFrame`. The rate spikes to 14 turns/s for 0.2 s on each kick.
- 2 motion-blur ghost blades.
- An anime burst for frosty air: white and cyan speed lines radiating out of each fan, a snow-crystal particle stream, and frost creeping on the housing edge.
- The whole housing jitters ±2 px.
- No still fan blades remain (plate 12 from Task 1).

- [ ] **Step 1: Write the tests**
  - `test('07 mouse moves on beats')`: the mouse position differs between consecutive beats and is held between them.
  - `test('fan blades rotate faster on kicks')`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement it, and add the `fans` regions.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 4 frames each of 07 and 12, and Read them.
- [ ] **Step 5:** Commit with the message `feat: Sam clicks around (07); animated frost-blast GPU fans (12)`.

### Task 5: Sad family (18) and the shop window (19)

**Files:**
- Create: `src/shots/sad-shots.ts` (18, 19).
- Modify: `docs/motion.yaml` (18 and 19 → tier A), `src/fx/` (a `Tears` particle helper in `particles.ts`), `src/shots/index.ts`.

**18 (1:12):**
- The family puppets stand on plate 18 at the bare tree, with slumped poses.
- Shoulders heave in sobs on beats (a 2-beat sob cycle).
- Tear droplets fall from each face, kid ones bigger, and splash on the floor.
- The kid drags a foot.
- The empty space under the tree gets a slow push-in.
- The tag text is at least 2× its current size, with `maxScale` raised for this shot.

**19 (1:17):**
- Townsfolk sprites (2–3) walk up to the window, see the price tag flip, and recoil, staggering back.
- The price tag is a separate sprite that flips on beats; its numbers are text drawn in code, inside the tag region.

- [ ] **Step 1: Write the test.** `test('18 tears fall and sobs are on beats')`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run it. Expected: PASS. Render 4 frames each, and Read them.
- [ ] **Step 5:** Commit with the message `feat: animated sad family with tears (18), shoppers at the price tag (19)`.

### Task 6: Shopping-spree sleigh (21, 22), the vault (24) and the store (25)

**Files:**
- Modify: `src/shots/ram-34-shots.ts` (21 and 22 become sleigh shots), `src/shots/sleigh.ts` (add paths 21 and 22), `src/shots/ram-side-shots.ts` (24, 25), `docs/motion.yaml`.

**21 and 22 (1:25–1:29):**
- Ram rides the sleigh across plate 21/22.
- A stream of gold coins pours over the sleigh's side on each beat into the shops below.
- Shop signs flip to SOLD. These are text drawn in code, inside sign regions in `fx-regions.json`.
- On 22, he cackles with his head thrown back on snares, still in the sleigh.

**24 (1:33):**
- Ram stands at the right side of the open vault door, beside its hinge-free edge.
- He leans his back and shoulder into it, pushing it shut toward the left.
- RAM sticks and chips spill out of the gap and tumble to the floor below, piling up. The pile grows each beat.
- The door bounces back open a little on kicks.

**25 (1:38):**
- In the store aisle, Ram sweeps RAM boxes off the shelves into his arms, one per beat. The boxes pile up past his chin.
- The girl puppet stands behind him with her own small box hand out, then looks at the empty shelf with a droop.
- The shelf slots empty as he grabs.

- [ ] **Step 1: Write the tests**
  - `test('24 spill pile grows')`
  - `test('25 shelf empties one box per beat')`
  - `test('21/22 coins emitted on beats')`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 4 frames each, and Read them.
- [ ] **Step 5:** Commit with the message `feat: coin-spraying sleigh spree, vault spill, store grab`.

### Task 7: Top-down elves (30), buffering spinner (31), and the AI creature (35)

**Files:**
- Create: `src/shots/elves-topdown.ts`.
- Modify: `src/shots/sleigh.ts` (31), `src/fx/Overlays.tsx` (35), `docs/motion.yaml`.

**30 (1:57):**
- Top-down plate with 4 lanes, viewed north to south.
- Each lane has 4 identical elves doing one task each:
  - lane 1 wraps
  - lane 2 tapes
  - lane 3 bows
  - lane 4 labels
- They work in a looping 2-beat motion.
- On a downbeat per lane, staggered by 1 beat, the piston at the north end slams south and shoves the 4 elves together into one `elf-multi` with 4 arms doing all 4 tasks at once.
- Squash on the impact; puff of dust.

**31:** when the team freezes on "buffering", a big circular loading spinner (12 dots, rotating, on holds) sits centred over the stopped team until the shot ends.

**35:**
- The whole creature chomps: the full sprite region is split into an upper jaw and a lower jaw along its mouth line (`fx-regions.json` `35.mouthY`).
- The upper part hinges up 18° and the lower part 8°, on beats.
- Its body squashes on each chomp, so no half-still creature remains.

- [ ] **Step 1: Write the tests**
  - `test('30 every lane merges once')`
  - `test('31 spinner visible after freeze')`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 4 frames of 30 and 2 each of 31 and 35, and Read them.
- [ ] **Step 5:** Commit with the message `feat: top-down piston elves, buffering spinner, full-body AI chomp`.

### Task 8: Carolers (36), stamp chaos (39), and the stairs (40)

**Files:**
- Create: `src/shots/townsfolk.ts` (36, 39).
- Modify: `src/shots/crowd.ts` (40), `docs/motion.yaml`.

**36 (2:23):**
- Caroler sprites or puppets (4–5) sway on bars and bob on beats.
- Mouths open on sung syllables. This is a wide "O" shape on word onsets, not lip-sync.
- Song books tilt, and music-note particles float up.

**39 (2:35):**
- 12–16 townsfolk run everywhere across plate 39 in crossing paths, with arms up, running in a panic.
- Each scatters away from the stamp on its slam.
- 2–3 get flattened into paper-thin squash shapes and pop back.
- They face their direction of travel.

**40 (2:40):**
- Each family member's feet follow the stair line `stairs40(x) => floorY`, a step function from the stair polyline in `fx-regions.json`.
- Nobody floats: feet stay within 4 px of the step top.

- [ ] **Step 1: Write the tests**
  - `test('40 feet on stairs')`: every 2nd frame, for every runner, `|footY − stairs40(footX)| ≤ 4`.
  - `test('39 runners face travel')`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 4 frames each, and Read them.
- [ ] **Step 5:** Commit with the message `feat: singing carolers, stamp-scatter crowd, family on the stairs`.

### Task 9: Victorious ending (65): the tower overgrows, explodes, and rains RAM

**Files:**
- Modify: `src/fx/fxMath.ts` (replace `collapse` with `explode(t)`), `src/fx/Tower.tsx`, `docs/design.md` §7a, `scripts/finish.py` (swap the collapse effect if any for a boom), `scripts/make_sfx.py`, `docs/motion.yaml` (65 puppets: townsfolk).

**Interfaces:** `explode(t) => {phase: 'swell' | 'boom' | 'rain', scale, shake, flash, rainAge}`.

**Timeline:**
- **Swell** (from shot 65's start to `impact.silence`): the tower scale ramps 1.12 → 1.6, with violent kick bumps, sparks everywhere and a red glow.
- **Boom** at `impact.silence`:
  - A white flash of 3 frames, then a burst sprite.
  - The tower is gone, replaced by plate 65 (no tower).
  - The camera shakes for 0.6 s.
- **Rain** to `TV_OFF − 0.2`:
  - RAM sticks tumble down across the whole frame.
  - Townsfolk sprites run in and catch them, arms up, cheering and jumping on holds.
  - A bit of confetti.

**Sound:** a deep explosion SFX at the boom, made in `make_sfx.py` (low noise burst plus a sub thump), mixed at −8 dB like the others.

- [ ] **Step 1: Write the tests**
  - `test('tower never shrinks before the boom')`
  - `test('rain under way before TV off')`: at `TV_OFF − 0.5` the phase is `rain` and `rainAge > 1`.
- [ ] **Step 2:** Run them. Expected: FAIL (`explode` is not defined). Delete the old collapse tests.
- [ ] **Step 3:** Implement it.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 6 frames across 65, and Read them.
- [ ] **Step 5:** Commit with the message `feat: victorious ending: tower overgrows, explodes, rains free RAM`.

### Task 10: Render, review, deliver

- [ ] **Step 1:** Run `bash scripts/render.sh && bash scripts/finish.sh out/ram-altman.mp4`, then encode the preview at 1280×720 with CRF 30 and AAC at 96k.
- [ ] **Step 2:** Check with ffprobe: 1920×1080, 24 fps, 259.6 ± 0.05 s.
- [ ] **Step 3:** Grab one frame per changed shot, tile them into a sheet, Read it, and fix anything off.
- [ ] **Step 4:** Add a §Pass 2 section to `docs/review.md`, then commit with the message `feat: cleanup pass render`.
- [ ] **Step 5:** Send the preview with SendUserFile.
