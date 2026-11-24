# Ram Altman Stills Animatic — Implementation Plan (Phase 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver `out/animatic.mp4`: the whole song (259.6 s) as a stills animatic. It has one Codex-painted key frame per shot, slow camera moves on each still, in-world lyrics timed word by word, snow, the CRT finish inside the wooden console TV, and the star-shatter sound effect. The user reviews it before any character animation.

**Architecture:** This reuses the Living Legend timing pipeline:
- Demucs stems, MMS forced alignment and librosa analysis feed `src/timing/*.json`.
- A single shot table, `src/shots.json`, maps all 65 design beats to times, stills, camera moves and lyric surfaces.
- Remotion composes a 960×720 programme from it.
- `scripts/finish.sh` (ffmpeg) applies the CRT pass, composites the TV plate, mixes the sound effects and encodes.

**Phase 2** (AniCraft rigs, animated shots, the tower's growth and drum bumps, the lip-synced ending) gets its own plan after the animatic review.

**Tech Stack:**
- Python 3.14 with the venv symlinked from `../WeAreLegionMusicVideo/.venv` (demucs, torchaudio MMS_FA, librosa, faster-whisper)
- Node with Remotion 4, with `node_modules` symlinked from `../DreamsMourningNowMusicVideo/node_modules`
- `node --test`
- ffmpeg
- Codex CLI 0.171 (`codex exec --skip-git-repo-check -s workspace-write`) for image generation

**Spec:** `docs/design.md` (read §5, §7a, §8, §9 and §10 before any task). Direction notes are in `docs/shot-ideas.md`. The look reference is `spike/out/spike-ram-sneak.mp4`, and the approved Ram Altman design is `spike/assets/ram-full.png`.

## Global Constraints

- Song: `Ram Altman's Christmas Song.mp3`, duration **259.6 s**. Video **24 fps** → **6231 frames** (`ceil(259.6*24)`). Never truncate the final silence.
- Programme **4:3, 960×720**. CRT base **480×360**. Final **1920×1080**, H.264 CRF 18, AAC 192k.
- All characters and places are original: no Grinch, Whoville, Cindy Lou Who, Scrooge McDuck, company logos, or real likenesses besides the Ram Altman caricature. "Jim Carrey" appears only as text.
- **No text inside generated images.** All lettering is rendered in code.
- On-screen lyrics use the corrected spellings listed in design §9. Alignment uses the sung forms.
- No lip-sync in the song.
- Every render is deterministic: no `Math.random`, no wall-clock time.
- Fonts must be OFL or Apache-2.0 (user OK'd Apache, 2026-11-23) and bundled with their licences in `public/fonts/`:
  - **IM Fell English** (narration)
  - **Mountains of Christmas** (chorus hooks)
  - **VT323** (tech surfaces)
- Sound effects must be CC0 or self-synthesised, with sources recorded in `docs/sfx.md`.
- Codex is run only with `-s workspace-write`. Don't commit `stems/`, `out/`, `node_modules`, `.venv` or `spike/work/`.

## Review Focus

1. **Lyric tokens that aren't plain words** (`480p`, `J.P.G.`, `GPUs`, `SSDs`, `VRAM`, `DIMMs`, `Xmas`). Alignment must not crash or zero them. Each must get a nonzero, in-section time. Owner: Task 2. Test: `test('non-word tokens align inside their section')`.
2. **Whispered or full-stop moments** ("umm, stash", "(Oh no.)", the knocks, the spoken ending, "Ebenezer Scrooge!"). Alignment drifts in these. A word must never land in the silence after the song or before its section. Owner: Task 2. Test: `test('spoken and whispered lines sit inside their sections')`.
3. **Fast chorus cuts versus readable lyrics.** A lyric word revealed less than 8 frames before its shot cuts away is unreadable. It must carry over to the next shot's surface. Owner: Task 4. Test: `test('every lyric line is fully visible for at least 0.75 s')`.
4. **The final silence** must stay in the output (no `-shortest` trimming). Output duration is 259.6 ± 0.05 s. Owner: Task 7. Verify step.
5. **Long lyric lines overflowing their in-world surface** (e.g. "Christmas is ours, every console, laptop and ham!"). The text must shrink or wrap to fit, never clip. Owner: Task 6. Test: `test('fitText keeps every line inside its surface box')`.

---

## File Structure

```
.gitignore
package.json, tsconfig.json         Remotion project (as in ../Living Legend)
docs/lyrics.txt                     display lyrics, [Section] headers, corrected spelling
docs/sung-forms.json                {displayWord: sungToken} for alignment only
docs/alignment-windows.json         [[firstLineIndex, t0, t1], ...]
docs/asset-prompts.md, docs/codex/  Codex briefs and logs
docs/sfx.md, docs/review.md
scripts/stems.sh, emissions.py, force_align.py, analyze.py   timing (adapted from ../Living Legend)
scripts/build_shots.py              docs/shotlist.yaml + timing → src/shots.json
scripts/prepare_assets.py           magenta key + crop (from spike/scripts/prepare_assets.py)
scripts/check_assets.py             asset manifest validation
scripts/finish.sh                   CRT + TV plate + SFX mix + encode
scripts/contact.sh                  contact sheets per section
docs/shotlist.yaml                  the 65 beats from design §8 as data (hand-authored)
src/timing/lyrics-aligned.json, sections.json, audio.json, impact.json
src/shots.json                      generated shot table
src/index.ts, Root.tsx, Animatic.tsx    composition
src/Still.tsx                       still + camera move
src/Lyric.tsx, src/fitText.ts       in-world lyric rendering
src/Snow.tsx                        deterministic snowfall
public/song.wav, public/fonts/, public/stills/NN.png, public/tv/console.png, public/sfx/*.wav
tests/timing.test.mjs, shots.test.mjs, assets.test.mjs, lyric.test.mjs
```

---

### Task 1: Project scaffold and display lyrics

**Files:**
- Create: `.gitignore`, `package.json`, `tsconfig.json`, `docs/lyrics.txt`, `docs/sung-forms.json`, `tests/lyrics.test.mjs`
- Symlinks: `node_modules → ../DreamsMourningNowMusicVideo/node_modules`, `.venv → ../WeAreLegionMusicVideo/.venv`

**Interfaces:**
- Produces:
  - `docs/lyrics.txt`: section headers `[Intro]`, `[Verse 1]`, `[Chorus 1]`, `[Verse 2]`, `[Chorus 2]`, `[Bridge]`, `[Final Chorus]`, `[Ending]`, `[Outro]`, followed by one lyric line per row.
  - `docs/sung-forms.json`: a map from each display word that isn't plain a–z to its sung token(s).

- [ ] **Step 1:** `git init`. Add a `.gitignore` covering `node_modules .venv stems out spike/work public/song.wav *.pt`. Create the symlinks, and copy `package.json`/`tsconfig.json` from `../Living Legend`, renaming the package to `ram-altman`.
- [ ] **Step 2: Write `tests/lyrics.test.mjs`**
  - `test('display lyrics use corrected spelling')`: `docs/lyrics.txt` contains "Jim Carrey", "Ebenezer Scrooge!", "you're the best", "He shoved the SSDs", "my school's", "Ten Xmas Facts". It contains none of: "Carry", "Ebonezer", "your the best", "He he", "my my", "[full stop".
  - `test('every display word maps to a-z tokens')`: for every word, `token = sungForms[w] ?? w.toLowerCase().replace(/[^a-z']/g,'')`. Every token matches `/^[a-z' ]+$/` and is non-empty.
  - `test('sections are the nine design sections in order')`.
- [ ] **Step 3:** Run `node --test tests/lyrics.test.mjs`. Expected: FAIL (the files are missing).
- [ ] **Step 4: Write `docs/lyrics.txt` from `docs/lyrics-original.txt` (the user's lyric sheet, verbatim)**
  - Keep every line, with the §9 corrections.
  - Strip bracketed stage notes.
  - The whisper aside becomes `He shoved the SSDs up into his... umm, stash.`
  - The ending lines are `Merry Christmas, Mr Sam!` / `Please, sir, I want to win my school's computer science prize.` / `Cool, hi-five! I will help, if you hit subscribe!`
  - The outro's last line is `But Sam, you're the best! Ebenezer Scrooge!`

  **Write `docs/sung-forms.json`** with at least: `"480p":"four eighty p"`, `"J.P.G.":"jay pee gee"`, `"GPUs":"gee pee yous"`, `"SSDs":"ess ess dees"`, `"VRAM":"vee ram"`, `"DIMMs":"dims"`, `"Carrey":"carry"`, `"Ebenezer":"ebonezer"`, `"Xmas":"x mas"`, `"HAM":"ham"`.
- [ ] **Step 5:** Run `node --test tests/lyrics.test.mjs`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: scaffold project and display lyrics`.

### Task 2: Timing (stems, forced alignment, sections)

**Files:**
- Create: `scripts/stems.sh`, `scripts/emissions.py`, `scripts/force_align.py`, `docs/alignment-windows.json`, `tests/timing.test.mjs`
- Adapt from: `../Living Legend/scripts/{stems.sh,emissions.py,force_align.py,transcribe.py}`

**Interfaces:**
- Consumes: `docs/lyrics.txt`, `docs/sung-forms.json`.
- Produces:
  - `src/timing/lyrics-aligned.json`: `[{section, text, start, end, words:[{w, s, e, c}]}]`. `w` is the display word; times are in seconds.
  - `src/timing/sections.json`: `[{name, start, end}]`, contiguous from 0 to 259.6.

- [ ] **Step 1: Write `tests/timing.test.mjs`**
  - `test('sections cover 0..259.6 contiguously in lyric order')`
  - `test('every lyric line is aligned, monotonic and in bounds')`: `text` values deep-equal the `docs/lyrics.txt` lines. For each word, `s >= previous s`, `e >= s` and `e <= 259.6`.
  - `test('non-word tokens align inside their section')`: the words `480p`, `J.P.G.`, `GPUs`, `SSDs`, `VRAM`, `DIMMs`, `Xmas` have `e - s > 0.05` and fall inside their line's section bounds.
  - `test('spoken and whispered lines sit inside their sections')`: the lines containing "umm", "Oh no", "Merry Christmas, Mr Sam", "subscribe" and "Ebenezer" all have `start >= section.start` and `end <= section.end`. "Ebenezer" also ends before 256.
- [ ] **Step 2:** Run the tests. Expected: FAIL (no timing files).
- [ ] **Step 3:** Produce `public/song.wav` (44.1 kHz), then run `stems.sh`.
  - `emissions.py` asserts that the duration is 259.6 ± 0.01.
  - `force_align.py` tokenises each display word through `sung-forms.json` (a multi-word sung form expands into several tokens that map back to one display word). It writes the display `w`.
- [ ] **Step 4:** Write `docs/alignment-windows.json`. Start from the rough segment times in `spike/work/full-rough.txt`, with one window per section, and refine it until the tests pass. Then build `sections.json` from the section windows.
- [ ] **Step 5:** Run `node --test tests/timing.test.mjs`. Expected: PASS. Spot-check 10 words against the vocal stem with `../Living Legend/scripts/sync_audit.py` (adapted) and write the results to `docs/sync-review.md`.
- [ ] **Step 6:** Commit `feat: aligned lyric timing and sections`.

### Task 3: Audio analysis and stop points

**Files:**
- Create: `scripts/analyze.py` (adapted, `FPS = 24`), `tests/timing.test.mjs` (append)

**Interfaces:**
- Produces:
  - `src/timing/audio.json`: `{duration: 259.6, fps: 24, beats: [t], kicks: [[t, strength]], snares: [[t, strength]], env: {drums, bass, other, vocals: number[6231]}}`
  - `src/timing/impact.json`: `{stash: t, knocks: [t, t, t], silence: t}`
    - `stash`: the music full-stop before "stash".
    - `knocks`: the three knock onsets before "Merry Christmas".
    - `silence`: the start of the final silence after "Scrooge!".

- [ ] **Step 1: Append tests**
  - `test('audio features are 24 fps over 6231 frames')`
  - `test('stops are ordered and inside their sections')`:
    - `stash` is inside Verse 2.
    - The three knocks are increasing, less than 2.5 s apart in total, and before the "Merry Christmas" line's start.
    - `silence` is after the last aligned word's `e` and before 259.6.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement the analysis**
  - Detect the stops from full-mix RMS dropping below −40 dBFS for at least 0.25 s.
  - Detect the knocks as the three strongest broadband onsets in the 3 s before "Merry Christmas".
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: audio analysis and stop points`.

### Task 4: Shot table

**Files:**
- Create: `docs/shotlist.yaml`, `scripts/build_shots.py`, `tests/shots.test.mjs`

**Interfaces:**
- Consumes: `lyrics-aligned.json`, `sections.json`, `impact.json`.
- Produces: `src/shots.json` with entries:

  ```
  {id: "01".."65", name, section, start, end, still: "stills/NN.png",
   camera: {from: {x, y, zoom, rot}, to: {x, y, zoom, rot}},   // still-space, 0..1 centre, zoom ≥ 1
   towerStage: 0..5 | null,
   lyrics: [{line: index into lyrics-aligned, surface: {x, y, w, h, rot}, style: "narration"|"hook"|"tech"|"aside"}],
   sfx: [{name, t}]}
  ```

- [ ] **Step 1: Write `tests/shots.test.mjs`**
  - `test('65 shots tile 0..259.6 with no gaps')`
  - `test('every lyric line is assigned to a shot that contains its start')`
  - `test('every lyric line is fully visible for at least 0.75 s')`: from the last word's `e` to the end of the shot showing it (a carry-over into the next shot's surface counts).
  - `test('no two consecutive shots share a still or an identical camera')`
  - `test('star shot 32 has a glass-break sfx after its line ends')`
  - `test('shot 57 starts at the first knock and shot 65 at impact.silence')`
  - `test('towerStage never decreases across shots that have one')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Write `docs/shotlist.yaml`. It holds each design §8 beat with:
  - an **anchor** (`line: N` or `word: "text"` or `impact: knocks`)
  - camera from/to
  - tower stage per §7a
  - the lyric surface per §8's "lyric placement"
  - the style
  - any sfx

  `build_shots.py` resolves each shot's start from its anchor, minus 0.25 s lead-in. The end is the next shot's start.
- [ ] **Step 4:** Run `python3 scripts/build_shots.py && node --test tests/shots.test.mjs`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: shot table`.

### Task 5: Codex artwork (character references, 65 key stills, TV plate)

**Files:**
- Create:
  - `docs/codex/01-cast.md`, `docs/codex/02-stills-<section>.md` (one per section), `docs/codex/03-tv.md`
  - `scripts/check_assets.py`, `tests/assets.test.mjs`
- Output:
  - `public/cast/*.png` (turnaround sheets: Ram, Sam-before, the girl, elves, reindeer, townsfolk)
  - `public/stills/01.png`..`65.png` at **1600×1200**, so the camera moves have room
  - `public/tv/console.png` at 1920×1080, with its screen opening transparent. Record the screen rectangle in `public/tv/console.json` as `{x, y, w, h}` (4:3).

**Interfaces:**
- Consumes: `src/shots.json` (each still's brief comes from its beat), `spike/assets/ram-full.png` as the Ram reference, design §5–§7a.
- Produces: the files above.

- [ ] **Step 1: Write `tests/assets.test.mjs`**
  - `test('every shot still exists at 1600x1200')`
  - `test('tv plate has a transparent 4:3 screen hole matching console.json')`: the alpha at the rectangle's centre is 0, and alpha is 255 at 20 px outside each edge.
  - `test('cast sheets exist for ram, sam, girl, elves, reindeer, townsfolk')`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Write `docs/codex/01-cast.md`, built from design §5–§6:
  - Style block copied verbatim from `spike/codex-spike-brief.md`.
  - "Use the attached ram-full.png as the exact Ram Altman model."
  - The girl must not resemble Cindy Lou Who.
  - No text.

  Run `codex exec --skip-git-repo-check -s workspace-write -C . -i spike/assets/ram-full.png - < docs/codex/01-cast.md` and log to `docs/codex/01-cast.log`. Inspect every sheet and re-request any that are off-model.
- [ ] **Step 4:** For each section, write `02-stills-<section>.md`. Each shot is a paragraph covering:
  - the composition from its §8 beat
  - the tower stage from §7a (the tower is visible in every Byteville interior window and every town wide)
  - "leave clear, uncluttered space for a lyric at <surface>"
  - no text

  Attach the cast sheets with `-i`. Run the sections one at a time. After each, Read 4 stills at random and re-request any where Ram is off-model or text appears.
- [ ] **Step 5:** Write `03-tv.md`: a 1960s wooden console TV, front-on, filling the 16:9 frame, in a cosy festive room with tinsel and a tree glow at the edge, in the same painted style. The screen area is filled with flat magenta. Key it to transparency with `scripts/prepare_assets.py`, and write `console.json` from the keyed hole's bounding box.
- [ ] **Step 6:** Run `node --test tests/assets.test.mjs`. Expected: PASS.
- [ ] **Step 7:** Commit `feat: cast references, key stills, tv plate`, recording all prompts in `docs/asset-prompts.md`.

### Task 6: Remotion animatic composition

**Files:**
- Create: `src/index.ts`, `src/Root.tsx`, `src/Animatic.tsx`, `src/Still.tsx`, `src/Lyric.tsx`, `src/fitText.ts`, `src/Snow.tsx`, `public/fonts/*` (+ OFL.txt each), `tests/lyric.test.mjs`

**Interfaces:**
- Consumes: `src/shots.json`, `src/timing/lyrics-aligned.json`, `public/stills/*`.
- Produces:
  - Composition `Animatic`: 960×720, 24 fps, `durationInFrames = 6231`, audio `public/song.wav`.
  - `fitText(text: string, box: {w, h}, style: Style) => {fontSize: number, lines: string[]}`
  - `visibleWords(lineIndex: number, t: number) => number`: the number of words revealed at time `t`.

- [ ] **Step 1: Write `tests/lyric.test.mjs`** (import the compiled helpers through `node --experimental-strip-types`, as Living Legend's `edit.test.mjs` does)
  - `test('visibleWords reveals each word at its aligned start')`: for 5 sampled words, `visibleWords(line, w.s - 0.01) === idx` and `visibleWords(line, w.s + 0.01) === idx + 1`.
  - `test('fitText keeps every line inside its surface box')`: every assigned line in `shots.json` gets `lines.length * fontSize * 1.15 <= h` and a width estimate `<= w` at `fontSize >= 14`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement**
  - `Still` eases the camera from `from` to `to` over the shot with `interpolate` and an in-out ease, plus a ±1 px weave from the frame number.
  - `Lyric` places text in still-space at `surface`, transformed by the same camera so it sticks to the painting. Styles:
    - `narration`: IM Fell English, cream `#fdf6e3` with a dark ink shadow
    - `hook`: Mountains of Christmas, holly red `#c8102e` with a white outline, plus a bounce on each word reveal
    - `tech`: VT323, cyan `#5ff6ff`
    - `aside`: small italic narration
  - `Snow`: deterministic flakes from a seeded hash of the index, falling at 3 depth speeds.
  - Fonts come from the google/fonts repo, saved to `public/fonts/` with their OFL.txt.
- [ ] **Step 4:** Run the tests. Expected: PASS. Render 8 test stills with `npx remotion still` at the start, middle and end of three shots, and Read them.
- [ ] **Step 5:** Commit `feat: animatic composition`.

### Task 7: Finish (CRT, TV plate, SFX) and review

**Files:**
- Create: `scripts/render.sh`, `scripts/finish.sh`, `scripts/contact.sh`, `public/sfx/glass-break.wav`, `docs/sfx.md`, `docs/review.md`

**Interfaces:**
- Consumes: `out/programme.mp4` (the Remotion render), `public/tv/console.{png,json}`, `src/shots.json` (sfx times), `src/timing/impact.json`.
- Produces: `out/animatic.mp4`.

- [ ] **Step 1:** `render.sh` renders `Animatic` to `out/programme.mp4`, following `../Living Legend/scripts/render-v3.sh` (`/usr/bin/chromium`, `--gl=angle-egl`, concurrency 3).
- [ ] **Step 2:** Source or synthesise the glass break as CC0 (synthesised is acceptable: filtered noise bursts plus high sine pings). Record it in `docs/sfx.md`.
- [ ] **Step 3: `finish.sh`**
  - Apply the spike's CRT chain (`spike` encode command: area-downscale to 480×360, noise, bilinear upscale, glow blend, scanline/fringe `geq`, `lenscorrection` k1=0.06 k2=0.02, vignette), scaled to the console screen rectangle from `console.json`.
  - Overlay the result *under* `console.png`.
  - Mix each `shots.json` sfx with `adelay` and `amix` at −8 dB under the song.
  - Do **not** use `-shortest`. Pad the video to the full audio length.
- [ ] **Step 4: Verify**
  - `ffprobe` shows 1920×1080, 24 fps, an AAC stream, and duration 259.6 ± 0.05 s.
  - Extract a frame 0.2 s after shot 32's sfx time and Read it.
  - Check that the RMS of the last 3 s is below −50 dBFS (the silence is preserved).
- [ ] **Step 5:** Run `contact.sh` (8 frames per section, tiled). Read every sheet and note issues in `docs/review.md`. Fix anything that breaks the anti-goals (text in stills, off-model Ram, clipped lyrics) by re-running the owning task's step.
- [ ] **Step 6:** Run `node --test tests/`. Expected: all PASS. Commit `feat: stills animatic`. Deliver `out/animatic.mp4` to the user with SendUserFile.

---

## Phase 2 (separate plan after the animatic review)

These are listed so the animatic doesn't block them, and are not part of this plan:
- AniCraft rigs for each character and view.
- Shot generators (`shots/NN-*.py`) emitting CLI scripts.
- Tower stage plates and add-ons, with the drum bump driven by `audio.json` kicks and snares.
- Smoke and spark particles ramping with song position.
- The collapse in shot 65.
- Lip-synced ending (shots 58–59).
- Remaining sound effects.
- Final render `out/ram-altman.mp4`.
